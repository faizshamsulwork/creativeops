#!/usr/bin/env python3
"""
Local-only mock for the Google Apps Script "Playbook generator" backend (GAS_API in app.js).

Why this exists: Auto Generate Playbook calls generatePlaybook() -> gasPost() -> a plain
fetch(GAS_API, ...) straight from the browser to a Google Apps Script Web App
(script.google.com/macros/s/.../exec). That call is a hardcoded external URL, completely
independent of the local/production Supabase split — it was never routed through Supabase, Vercel,
or any server this repo controls. Diagnosis (2026-08-19) found the real GAS_API deployment itself is
currently returning broken/non-CORS responses to EVERY caller — reproduced identically from
localhost AND from the live production origin (https://adtechinno-creativeengine.vercel.app) via the
same browser-fetch test. That's a third-party outage/misconfiguration on the Google Apps Script
project this repo does not own or have access to — not something fixable by any code change here,
and not caused by the local/production separation work.

This mock exists purely so LOCAL DEVELOPMENT of the Auto Generate Playbook button can be exercised
end-to-end without depending on that broken external service. It is never used in production —
app.js only points at it when running on localhost (see LOCAL_GAS_API in app.js). It implements
exactly the one action generatePlaybook() actually sends (generate_playbook) and nothing else —
Telegram notifications (TELEGRAM_API) are a completely separate, differently-deployed script that
generatePlaybook() never calls, so this mock has no interaction with them at all.

Usage:
    python3 local-gas-mock-server.py            # listens on 127.0.0.1:8787

No third-party dependencies — stdlib only, matching how this project already runs its local static
file server (python3 -m http.server).
"""
import json
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

PORT = 8787


class MockGasHandler(BaseHTTPRequestHandler):
    def _cors_headers(self):
        # This is exactly what the REAL GAS deployment is currently missing (confirmed via
        # response-header inspection during diagnosis) — its absence is why every browser fetch()
        # to it fails with "Failed to fetch" regardless of origin. Setting it properly here is what
        # makes the mock actually usable from a browser, unlike the broken real endpoint right now.
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

        if action == 'generate_playbook':
            job_id = data.get('job_id', 'UNKNOWN')
            # A real, openable (blank) Google Doc URL shape so "Open Playbook" behaves like the
            # real flow — this specific doc doesn't exist, it's just a placeholder link for local
            # testing; nothing is actually created anywhere.
            fake_url = f"https://docs.google.com/document/d/local-mock-playbook-{job_id}/edit"
            time.sleep(0.6)  # mimics real generation taking a moment, so the UI's loading states are visible
            body = json.dumps({"status": "success", "url": fake_url}).encode('utf-8')
        else:
            body = json.dumps({"status": "error", "message": f"local-gas-mock-server: unhandled action '{action}'"}).encode('utf-8')

        self.send_response(200)
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
