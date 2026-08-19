// Local-only Supabase override — copy this file to local.config.js (same folder) and fill in the
// values printed by `supabase start` (or `supabase status`) for YOUR local Supabase project.
//
// local.config.js is gitignored and never committed. It is only ever loaded when the app is
// running on localhost/127.0.0.1 — production (Vercel) always uses the production Supabase
// project hardcoded in app.js and never reads this file. If localhost has no local.config.js,
// app.js deliberately refuses to start rather than silently falling back to production data.
//
// Steps:
//   1. Install the Supabase CLI and run `supabase init` once in this project (if not done already).
//   2. Run `supabase start` (requires Docker running).
//   3. Copy the "API URL" and "anon key" it prints into the values below.
//   4. `cp local.config.example.js local.config.js` and edit local.config.js with those values.
//   5. Reload the app on http://localhost:<port>/index.html.
window.__ADTECH_LOCAL_SUPABASE__ = {
    url: 'http://127.0.0.1:54321',
    anonKey: 'REPLACE_WITH_YOUR_LOCAL_SUPABASE_ANON_KEY'
};

// Optional — only needed if you run local-gas-mock-server.py on a port other than the default
// 8787 (see that file for what it's for and why it exists: Auto Generate Playbook / GAS_API).
// window.__ADTECH_LOCAL_GAS_API__ = 'http://127.0.0.1:8787/exec';
