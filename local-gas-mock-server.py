#!/usr/bin/env python3
"""
Local-only mock for the Google Apps Script "Playbook generator" backend (GAS_API in app.js).

Why this exists: Auto Generate Playbook calls generatePlaybook() -> gasPost() -> a plain
fetch(GAS_API, ...) straight from the browser to a Google Apps Script Web App
(script.google.com/macros/s/.../exec). That call is a hardcoded external URL, completely
independent of the local/production Supabase split — it was never routed through Supabase, Vercel,
or any server this repo controls.

This mock exists purely so LOCAL DEVELOPMENT of the Auto Generate Playbook button — including its
retry/idempotency behavior — can be exercised end-to-end without depending on external state or
risking real duplicate files in production Google Drive. It is never used in production — app.js
only points at it when running on localhost (see LOCAL_GAS_API in app.js). It implements exactly
the one action generatePlaybook() actually sends (generate_playbook) and nothing else — Telegram
notifications (TELEGRAM_API) are a completely separate, differently-deployed script that
generatePlaybook() never calls, so this mock has no interaction with them at all.

Test hooks (all via job_id, so app.js's own test runs can trigger them with no mock-specific code):
  - Any job_id: idempotent. A second generate_playbook call for the same job_id returns the SAME
    url with "existing": true instead of minting a new one — this simulates the check-before-create
    logic documented for the real Apps Script in GOOGLE-APPS-SCRIPT-PLAYBOOK-SETUP.md, so the
    frontend's retry-safety can be verified locally before that's deployed for real.
  - job_id starting with "FLAKY-<code>-": responds with HTTP <code> (must be one of
    404/429/500/502/503/504) for the first N calls for that exact job_id, then succeeds — N is
    controlled by a trailing "-<n>" segment (default 1). E.g. "FLAKY-404-2-xyz" fails twice with
    404, then succeeds on the 3rd attempt.
  - job_id starting with "NETFAIL-": drops the connection with no response at all, simulating a
    genuine network-level failure (fetch() rejects with TypeError, not a readable status).

Usage:
    python3 local-gas-mock-server.py            # listens on 127.0.0.1:8787

No third-party dependencies — stdlib only, matching how this project already runs its local static
file server (python3 -m http.server).
"""
import json
import re
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

PORT = 8787

# job_id -> generated fake URL, for idempotency simulation (in-memory only, resets on restart).
generated_jobs = {}
# job_id -> remaining failures to simulate, for FLAKY-<code>-<n>-... job_ids.
flaky_remaining = {}

FLAKY_RE = re.compile(r'^FLAKY-(\d{3})-(\d+)-')


class MockGasHandler(BaseHTTPRequestHandler):
    def _cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors_headers()
        self.end_headers()

    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        raw = self.rfile.read(length) if length else b''
        try:
            payload = json.loads(raw or b'{}')
        except json.JSONDecodeError:
            payload = {}

        action = payload.get('action')
        data = payload.get('data') or {}
        job_id = str(data.get('job_id', 'UNKNOWN'))

        if action != 'generate_playbook':
            body = json.dumps({"status": "error", "message": f"local-gas-mock-server: unhandled action '{action}'"}).encode('utf-8')
            self._send_json(200, body)
            return

        # NETFAIL-* : simulate a genuine network-level failure (no response at all).
        if job_id.startswith('NETFAIL-'):
            print(f"[local-gas-mock] simulating network failure for {job_id}")
            try:
                self.connection.close()
            except Exception:
                pass
            return

        # FLAKY-<code>-<n>-* : fail with <code> for the first n calls, then succeed.
        m = FLAKY_RE.match(job_id)
        if m:
            code = int(m.group(1))
            total_failures = int(m.group(2))
            remaining = flaky_remaining.setdefault(job_id, total_failures)
            if remaining > 0:
                flaky_remaining[job_id] = remaining - 1
                print(f"[local-gas-mock] simulating transient {code} for {job_id} ({remaining} left)")
                body = json.dumps({"status": "error", "message": f"simulated transient {code}"}).encode('utf-8')
                self._send_json(code, body)
                return

        time.sleep(0.6)  # mimics real generation taking a moment, so the UI's loading states are visible

        if job_id in generated_jobs:
            url = generated_jobs[job_id]
            print(f"[local-gas-mock] {job_id} already generated — returning existing file, no duplicate")
            body = json.dumps({"status": "success", "job_id": job_id, "url": url, "existing": True}).encode('utf-8')
            self._send_json(200, body)
            return

        # A real, openable-shaped Google Slides URL so "Open Playbook" behaves like the real flow —
        # this specific presentation doesn't exist, it's just a placeholder link for local testing;
        # nothing is actually created anywhere.
        fake_url = f"https://docs.google.com/presentation/d/local-mock-playbook-{job_id}/edit"
        generated_jobs[job_id] = fake_url
        print(f"[local-gas-mock] generated new mock playbook for {job_id}")
        body = json.dumps({"status": "success", "job_id": job_id, "url": fake_url, "existing": False}).encode('utf-8')
        self._send_json(200, body)

    def _send_json(self, status, body):
        self.send_response(status)
        self._cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        print(f"[local-gas-mock] {self.address_string()} - {fmt % args}")


if __name__ == '__main__':
    server = HTTPServer(('127.0.0.1', PORT), MockGasHandler)
    print(f"Local GAS mock (Playbook generator only) listening on http://127.0.0.1:{PORT}")
    print("Used only when app.js is loaded from localhost — see LOCAL_GAS_API in app.js.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()
