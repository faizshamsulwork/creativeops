// ========================================================
// 🌟 1. SETUP SUPABASE & CONFIGURATION
// ========================================================
//
// Local vs production separation
// -------------------------------
// This is a zero-build static site — no bundler, no dev server, nothing that reads a .env file.
// Vercel serves index.html/app.js exactly as committed, so there is no mechanism for an env file
// to ever reach this code. Environment is decided at RUNTIME instead, from the hostname the page
// was actually loaded from:
//   - localhost / 127.0.0.1 / ::1  -> LOCAL Supabase project only (see local.config.js, gitignored)
//   - anything else (Vercel)       -> PRODUCTION Supabase project (hardcoded below, as before)
//
// A local override file (local.config.js, loaded by index.html before this script, gitignored —
// see local.config.example.js for the template) supplies the local project's URL/anon key. If it's
// missing, or if it ever somehow resolves to the production project, app init is BLOCKED with a
// visible error instead of silently falling back to real Adtechinno data.
const PRODUCTION_SUPABASE_URL = 'https://jceiajlgymtvpviebfnk.supabase.co';
const PRODUCTION_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjZWlhamxneW10dnB2aWViZm5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NTQ2NzcsImV4cCI6MjA5MTUzMDY3N30.gGmc7kL01FD8rRmZC1wiLFHgn5Wlbn0Lmp3IY9C2ODs';
const PRODUCTION_SUPABASE_HOST = 'jceiajlgymtvpviebfnk.supabase.co';

const IS_LOCAL_HOST = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

// Populated by local.config.js when present (see local.config.example.js). Never committed — each
// developer points this at their own `supabase start` instance.
const LOCAL_SUPABASE_CONFIG = window.__ADTECH_LOCAL_SUPABASE__ || null;

// Renders a full-screen, unmissable error and halts the rest of this script. Used only for the
// local/production misconfiguration cases below — this is a hard stop, not a warning.
function blockAppInitialization(title, message) {
    const render = () => {
        document.documentElement.innerHTML = `<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#1a0505;color:#fecaca;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px;box-sizing:border-box;">
            <div style="max-width:640px;background:#2a0808;border:1px solid #7f1d1d;border-radius:12px;padding:32px;box-shadow:0 10px 40px rgba(0,0,0,0.5);">
                <div style="font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#fca5a5;margin-bottom:10px;">⛔ Configuration Error — App Blocked</div>
                <h1 style="margin:0 0 14px;font-size:20px;color:#fff;">${title}</h1>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#fecaca;white-space:pre-line;">${message}</p>
            </div>
        </body>`;
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
    else render();
    throw new Error(`[Creative OS blocked] ${title}: ${message}`);
}

let SUPABASE_URL;
let SUPABASE_ANON_KEY;

if (IS_LOCAL_HOST) {
    if (!LOCAL_SUPABASE_CONFIG || !LOCAL_SUPABASE_CONFIG.url || !LOCAL_SUPABASE_CONFIG.anonKey) {
        blockAppInitialization(
            'Local Supabase not configured',
            "You're on localhost, so Creative OS refuses to fall back to the production database.\n\nCopy local.config.example.js to local.config.js and fill in the URL/anon key from your local `supabase start` (or `supabase status`), then reload."
        );
    }
    SUPABASE_URL = LOCAL_SUPABASE_CONFIG.url;
    SUPABASE_ANON_KEY = LOCAL_SUPABASE_CONFIG.anonKey;
} else {
    SUPABASE_URL = PRODUCTION_SUPABASE_URL;
    SUPABASE_ANON_KEY = PRODUCTION_SUPABASE_ANON_KEY;
}

// Hard safety guard: localhost must never end up pointed at the production project, however that
// happened (a stale/miscopied local.config.js, a typo, etc.) — block instead of silently running
// local development against real company data.
if (IS_LOCAL_HOST) {
    let resolvedHost = '';
    try { resolvedHost = new URL(SUPABASE_URL).hostname; } catch(e) {}
    if (resolvedHost === PRODUCTION_SUPABASE_HOST) {
        blockAppInitialization(
            'localhost is pointing at PRODUCTION Supabase',
            `local.config.js resolves to the production project (${resolvedHost}).\n\nRefusing to start — this would run local development against real Adtechinno data. Point local.config.js at your local Supabase instance instead.`
        );
    }
}

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Subtle on-screen indicator so nobody mistakes a local session for production — localhost only.
if (IS_LOCAL_HOST) {
    const showLocalDbBadge = () => {
        const badge = document.createElement('div');
        badge.textContent = 'DEV · LOCAL DATABASE';
        badge.style.cssText = 'position:fixed;bottom:12px;left:12px;z-index:999999;background:#111827;color:#facc15;font:700 11px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:0.06em;padding:6px 10px;border-radius:6px;box-shadow:0 2px 10px rgba(0,0,0,0.35);pointer-events:none;opacity:0.92;';
        document.body.appendChild(badge);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showLocalDbBadge);
    else showLocalDbBadge();
}

// AdTechinno AutoPlaybook — new standalone deployment (2026-08-19), replacing an earlier deployment
// that was returning broken/non-CORS responses to every caller (reproduced identically from
// localhost and the live production origin — a third-party outage unrelated to, and not caused by,
// the local/production Supabase separation). Verified with a live POST of the real
// generate_playbook payload before this URL was put here: real JSON back, status "success", a
// genuine docs.google.com/presentation Slides URL.
const PRODUCTION_GAS_API = 'https://script.google.com/macros/s/AKfycbyplyMgXSxmbF2Zu2AmNKejV2bBKWApJPa6OpgSjy-dpTMK_lryjxNbpnYbsd5ESYVn/exec';
// Auto Generate Playbook (generatePlaybook() -> gasPost()) is the ONLY thing that calls GAS_API. On
// localhost only, this points at a small local mock instead (see local-gas-mock-server.py) purely
// so the Playbook button can be exercised during local development without depending on external
// state or creating real Slides decks; production always uses the real URL above. Override the
// mock's address via window.__ADTECH_LOCAL_GAS_API__ in local.config.js if you run it on a
// different port.
const LOCAL_GAS_API_DEFAULT = 'http://127.0.0.1:8787/exec';
const GAS_API = IS_LOCAL_HOST ? (window.__ADTECH_LOCAL_GAS_API__ || LOCAL_GAS_API_DEFAULT) : PRODUCTION_GAS_API;
// Session-local cache of already-generated playbook links, keyed by job_id — a defense-in-depth
// guard in front of generate_playbook's own idempotency-by-job_id on the Apps Script side (see
// GOOGLE-APPS-SCRIPT-PLAYBOOK-SETUP.md): GAS will never create a genuine duplicate deck, but this
// avoids even making the round-trip if the pending modal gets closed and reopened before Approve
// (the input has no other memory of a link generated earlier in the same session).
const generatedPlaybookLinkCache = {};
// TELEGRAM_API is a separate, differently-deployed script that Auto Generate Playbook never calls
// (grep confirms: only submit/approve/status-change flows call it) — left untouched, real, and
// unmocked. Those flows are unrelated to this fix and still hit the real Telegram bot from
// localhost if exercised, exactly as before — a pre-existing, separately-flagged residual risk, not
// something this change touches either way.
const TELEGRAM_API = 'https://script.google.com/macros/s/AKfycbyC-UgaT5QWgaWqfAQN2K-tRE2BhFYumAWzDxM6GBApTddvI9SmQHcAyMoh1sN2UML1/exec';

let PIC_LIST = [];
let дизайнериMY = [];
let дизайнериID = [];
let allStaffMY = [];
let allStaffID = [];
let globalTeamMembers = [];
let lastTeamMembersFetchAt = 0; // ms epoch — see fetchSupabaseDataImpl's dedupe against the pre-boot fetch

let globalData = [];
let globalTeamStatus = [];
let globalHandovers = [];
let globalActivityLogs = [];
let globalNoteLogs = [];
// job_id -> note count, seeded by a lightweight bulk fetch (see fetchNoteCountsForCurrentAccess)
// so board cards can show an accurate badge without pulling every note's full content into memory.
let noteCountByJobId = new Map();
// Cached result of the non-admin "which columns exist for role-based access filtering" probe (see
// fetchCreativeRequestsForCurrentAccess) so we only ever run that detection query once per session
// instead of on every single full sync.
let cachedCreativeRequestRoleFields = null;
let globalNotifications = [];
let taskNoteMentions = {}; // job_id -> Set of names picked via the '@' autocomplete on that note's textarea
let editingNoteId = null; // id of the task_note_logs row currently open for inline edit, if any
let globalReviewCycles = [];
let globalReviewAssignments = [];
let globalReviewResponses = [];
let reviewPairDraft = [];
let activeReviewAssignment = null;
let activeReviewDraft = null;
let activeReviewCodeHashes = [];
let activeReviewStep = 0;
let lastAnimatedReviewStep = -1; // tracks which step last played its entrance animation, so clicking a rating (same step, full re-render) doesn't replay it
let lastGeneratedReviewCodes = [];
let calMonth = new Date().getMonth();
let calYear = new Date().getFullYear();
let currentRegionFilter = 'all';
let userRegion = '';
let isSuperAdmin = false;
let currentRequestType = 'adhoc';
// Shooting workflow session state — checklist rows fetched per job (lazy, same pattern as task
// notes/activity logs), and which of the 3 phase tabs is currently open per job.
let shootChecklistByJob = {};
let activeShootTab = {};
// Board-wide readiness cache — job_id → computeShootReadiness() result. Separate from
// shootChecklistByJob (which holds full per-item detail: owner/note/completed_by/at, and is only
// ever populated for a task once its detail modal has actually been opened this session). This one
// only needs `completed` booleans across every visible Shooting task, refreshed in the same pass as
// note counts, so the Board can show a readiness chip without anyone opening a task first.
let shootReadinessByJob = {};
let requestBoardDeadlineFilter = 'all';
let requestBoardSortMode = 'smart_priority';
let pendingDeadlineChangeUpdate = null;
let pendingBulkInternalDueRows = [];
let internalDueBackfillInFlight = false;
let lastInternalDueBackfillSignature = '';
let clientReviewAgingCheckInFlight = false;
let clientReviewSetupState = {
    checked: false,
    checking: false,
    ok: null,
    message: 'Not checked yet',
    error: null,
    checkedAt: ''
};
let lastAssignedRegionVisibility = { hidden: [], visible: [] };
let completionModalLastFocus = null;
const completionModalOpenedKeys = new Set();
const completionStatusInFlight = new Set();
let clientReviewJustMovedRefreshTimer = null;
let kanbanJustMovedRefreshTimer = null;
let kanbanCardStatusMemory = {}; // job_id -> last rendered column slug, this browser tab only (drives the one-time entrance animation)
let calendarViewMode = localStorage.getItem('adtech_calendar_view') || '';
let calendarShowCompleted = localStorage.getItem('adtech_calendar_show_completed') === 'true';
let selectedCalendarDateKey = '';
let activeEditTaskState = null;
let editModalLastFocus = null;
const CORE_CREATIVE_NAMES = ["Aaron", "Abel", "Alya", "Simon", "Steven", "Faiz Shamsul", "Miftahul Fikri", "Youke Yap", "Annisya Y.", "Liew Hui Yin"];
const SUPER_ADMIN_NAMES = ["Faiz Shamsul"];
const SUPER_ADMIN_LOGIN_PASSCODE = 'Act3030300!';
const SUPER_ADMIN_VERIFIED_KEY = 'adtech_superadmin_verified';
const SUPER_ADMIN_VERIFIED_DATE_KEY = 'adtech_superadmin_verified_date';
const ADMIN_ACCESS_STORAGE_KEY = 'adtech_admin_members_override';
const TEAM_REVIEW_LOCAL_KEY = 'adtech_team_review_store';
const TEAM_REVIEW_CODE_VAULT_KEY = 'adtech_team_review_code_vault';
const WORK_STATUS_AWAITING_CLIENT = 'awaiting_client';
const CLIENT_REVIEW_WINDOW_DAYS = 5;
const CLIENT_REVIEW_WARNING_DAY = 4;
const CLIENT_REVIEW_WATCH_DAY = 3;
const CLIENT_REVIEW_JUST_MOVED_PIN_MINUTES = 30;
const KANBAN_JUST_MOVED_PIN_SECONDS = 300; // 5 min — general "just moved" highlight for every non-Client-Review column
const CLIENT_REVIEW_DEFAULT_WAITING_REASON = 'Awaiting feedback / approval';
const REQUEST_BOARD_FILTERS = [
    { id: 'all', label: 'All Tasks' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'today', label: 'Due Today' },
    { id: 'week', label: 'Due Soon' },
    { id: 'missing_internal', label: 'Missing Internal Due' },
    { id: 'client_blocked', label: 'Client Blocked' },
    { id: 'client_review_aging', label: 'Review Aging' },
    { id: 'followup_due', label: 'Follow-up Due' },
    { id: 'followup_overdue', label: 'Follow-up Overdue' }
];
const REQUEST_BOARD_SORT_STORAGE_KEY = 'creativeOS.requestBoard.sortMode';
const REQUEST_BOARD_SORT_OPTIONS = [
    { id: 'smart_priority', label: 'Smart Priority', description: 'Best order for each workflow stage', icon: 'sparkles' },
    { id: 'deadline_earliest', label: 'Deadline: Earliest', description: 'Nearest due work first', icon: 'calendar-clock' },
    { id: 'recently_added', label: 'Recently Added', description: 'Newest requests first', icon: 'plus-circle' },
    { id: 'oldest_added', label: 'Oldest Added', description: 'Oldest requests first', icon: 'history' },
    { id: 'recently_updated', label: 'Recently Updated', description: 'Latest meaningful updates', icon: 'activity' },
    { id: 'client_az', label: 'Client A–Z', description: 'Alphabetical by client', icon: 'arrow-down-a-z' }
];
requestBoardSortMode = getStoredRequestBoardSortMode();
const CLIENT_WAITING_REASONS = [
    CLIENT_REVIEW_DEFAULT_WAITING_REASON,
    'Awaiting client feedback',
    'Awaiting requester confirmation',
    'Awaiting missing assets',
    'Awaiting approval',
    'Awaiting revised brief',
    'Other'
];
const DEADLINE_CHANGE_REASONS = [
    'Client changed timeline',
    'Scope changed',
    'Missing assets / info',
    'Internal reprioritisation',
    'Creative capacity',
    'Other'
];
const DEADLINE_ADJUSTMENT_REASONS = [
    'Changed production priority',
    'Client requested extension',
    'Scope changed',
    'Missing client assets',
    'Client feedback delay',
    'Resource availability',
    'Internal rescheduling',
    'Incorrect original date',
    'Urgent request',
    'Other'
];
const TASK_EDIT_REQUEST_TYPES = [
    { value: 'adhoc', label: 'Ad-hoc / One-off', icon: 'zap' },
    { value: 'monthly', label: 'Monthly Content Plan', icon: 'calendar-days' },
    { value: 'pitch', label: 'Pitch Deck Proposal', icon: 'presentation' }
];
const TASK_EDIT_ADHOC_JOB_TYPES = ['Poster/Graphic', 'Video Production', 'Copywriting/Article', 'Presentation Deck'];
const AWAITING_CLIENT_EXIT_STATUSES = ['Drafting', 'Partial Ready', 'Revision', 'Internal Review', 'Client Review', 'Done'];

// ========================================================
// 🌟 SHOOTING WORKFLOW — checklist definition
// ========================================================
// Item labels, "critical" flags and owner hints live here (static, code-defined) rather than in the
// database — shoot_checklist_items only ever stores per-item STATE (completed/owner/note/who/when).
// Same split the app already uses for job-type checkboxes vs their DB column. `critical` is only
// meaningful on the 'before' phase — that's the only phase Shoot Readiness looks at. `when` gates a
// conditional item so it only counts (and only renders) if the shoot actually needs it.
const SHOOT_CHECKLIST_DEFS = {
    before: [
        { key: 'brief', label: 'Brief & deliverables confirmed', critical: true, ownerHint: 'AM/SM' },
        { key: 'datetime_location', label: 'Date / time / location confirmed', critical: true, ownerHint: 'AM/SM' },
        { key: 'talent', label: 'Talent confirmed', critical: true, ownerHint: 'AM/SM', when: d => Boolean(d?.talent?.required) },
        { key: 'product_props', label: 'Product / props ready', critical: true, ownerHint: 'AM/SM', when: d => Boolean(d?.props?.required) },
        { key: 'shot_list', label: 'Shot list / creative direction ready', critical: false, ownerHint: 'Creative' },
        { key: 'client_requirements', label: 'Key client requirements confirmed', critical: true, ownerHint: 'AM/SM' },
        { key: 'team_pic', label: 'Team / PIC confirmed', critical: true, ownerHint: 'AM/SM' }
    ],
    shoot_day: [
        { key: 'ready_on_set', label: 'Talent / product / props ready on set', ownerHint: 'AM/SM' },
        { key: 'direction_equipment', label: 'Creative direction & equipment checked', ownerHint: 'Creative' },
        { key: 'required_shots', label: 'Required shots captured', ownerHint: 'Creative' },
        { key: 'broll', label: 'Additional / B-roll captured', ownerHint: 'Creative' },
        { key: 'content_confirmed', label: 'Team confirms required content captured', ownerHint: 'AM/SM' },
        { key: 'backup', label: 'Footage backed up', ownerHint: 'Creative' }
    ],
    post: [
        { key: 'uploaded', label: 'Footage uploaded', ownerHint: 'Creative' },
        { key: 'editor_pic', label: 'Editor / Creative PIC confirmed', ownerHint: 'Creative' },
        { key: 'editing_deadline', label: 'Editing deadline confirmed', ownerHint: 'Creative' },
        { key: 'takes_handover', label: 'Notes / selected takes handed over', ownerHint: 'AM/SM' },
        { key: 'deliverables_reconfirmed', label: 'Final deliverables reconfirmed', ownerHint: 'Creative' }
    ]
};
const SHOOT_PHASE_LABELS = { before: 'Before Shoot', shoot_day: 'Shoot Day', post: 'Post Shoot' };

// Items in a phase that actually apply to this shoot (conditional 'when' items excluded if not needed).
function getApplicableShootChecklistDefs(phase, shootDetails) {
    return (SHOOT_CHECKLIST_DEFS[phase] || []).filter(def => !def.when || def.when(shootDetails || {}));
}
const INTERNAL_PRODUCTION_STATUS_KEYS = ['pending', 'inbox', 'not started', 'drafting', 'partial ready', 'revision', 'internal review'];
const INTERNAL_DUE_BACKFILL_BATCH_LIMIT = 75;
const WORKSPACE_COUNTRIES = [
    { name: 'Malaysia', code: 'MY', flag: '🇲🇾', timezone: 'Asia/Kuala_Lumpur', primary: true },
    { name: 'Indonesia', code: 'ID', flag: '🇮🇩', timezone: 'Asia/Jakarta', primary: true },
    { name: 'Singapore', code: 'SG', flag: '🇸🇬', timezone: 'Asia/Singapore' },
    { name: 'Hong Kong', code: 'HK', flag: '🇭🇰', timezone: 'Asia/Hong_Kong' },
    { name: 'China', code: 'CN', flag: '🇨🇳', timezone: 'Asia/Shanghai' },
    { name: 'Vietnam', code: 'VN', flag: '🇻🇳', timezone: 'Asia/Ho_Chi_Minh' },
    { name: 'Japan', code: 'JP', flag: '🇯🇵', timezone: 'Asia/Tokyo' },
    { name: 'Thailand', code: 'TH', flag: '🇹🇭', timezone: 'Asia/Bangkok' },
    { name: 'Philippines', code: 'PH', flag: '🇵🇭', timezone: 'Asia/Manila' },
    { name: 'Taiwan', code: 'TW', flag: '🇹🇼', timezone: 'Asia/Taipei' },
    { name: 'South Korea', code: 'KR', flag: '🇰🇷', timezone: 'Asia/Seoul' },
    { name: 'Australia', code: 'AU', flag: '🇦🇺', timezone: 'Australia/Sydney' },
    { name: 'New Zealand', code: 'NZ', flag: '🇳🇿', timezone: 'Pacific/Auckland' }
];

const TEAM_REVIEW_QUESTION_GROUPS = [
    {
        key: 'creative_quality',
        title: 'Creative & Craft Quality',
        tone: 'teal',
        questions: [
            { id: 'creative_thinking', text: 'Brings strong creative ideas and original thinking to the work' },
            { id: 'brief_brand_fit', text: 'Deliverables stay true to the brief and brand guidelines' },
            { id: 'execution_polish', text: 'Shows strong attention to detail and polish in execution' }
        ]
    },
    {
        key: 'work_quality',
        title: 'Work Quality & Reliability',
        tone: 'blue',
        questions: [
            { id: 'accurate_consistent', text: 'Deliverables are accurate and consistent' },
            { id: 'meets_deadlines', text: 'Meets deadlines consistently' },
            { id: 'trusted_tasks', text: 'Can be trusted with important tasks' }
        ]
    },
    {
        key: 'ownership',
        title: 'Ownership & Communication',
        tone: 'green',
        questions: [
            { id: 'clear_updates', text: 'Gives clear progress updates' },
            { id: 'owns_blockers', text: 'Flags blockers early and takes ownership' },
            { id: 'responsive', text: 'Responds well when collaboration is needed' }
        ]
    },
    {
        key: 'teamwork',
        title: 'Teamwork & Collaboration',
        tone: 'purple',
        questions: [
            { id: 'supports_team', text: 'Supports other team members when needed' },
            { id: 'feedback_attitude', text: 'Handles feedback professionally' },
            { id: 'positive_working_style', text: 'Contributes to a productive team environment' }
        ]
    },
    {
        key: 'growth',
        title: 'Growth & Initiative',
        tone: 'orange',
        questions: [
            { id: 'proactive_ideas', text: 'Brings proactive ideas or improvements' },
            { id: 'adapts_scope', text: 'Adapts well to changing scope or priorities' },
            { id: 'keeps_improving', text: 'Shows consistent improvement over time' }
        ]
    }
];

// ========================================================
// 🌟 2. UTILITIES & HELPERS
// ========================================================
function refreshIcons() {
    try { if (typeof lucide !== 'undefined') lucide.createIcons(); }
    catch(e) { console.log("Ikon gagal dimuatkan."); }
}

function normalizeNameKey(value) {
    return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function getCurrentUserName() {
    return localStorage.getItem('adtech_user_name') || '';
}

function getCountryConfig(region) {
    const key = String(region || '').trim().toLowerCase();
    if (!key || key === 'all') return WORKSPACE_COUNTRIES[0];
    return WORKSPACE_COUNTRIES.find(country => country.name.toLowerCase() === key || country.code.toLowerCase() === key) || {
        name: region || 'Global',
        code: 'GL',
        flag: '🌐',
        timezone: 'Asia/Singapore'
    };
}

function getWorkspaceCountryOptions(selected = '', includePlaceholder = false, excludePrimary = false) {
    const current = String(selected || '').trim();
    const placeholder = includePlaceholder ? '<option value="">Select your Country...</option>' : '';
    const countries = excludePrimary ? WORKSPACE_COUNTRIES.filter(country => !country.primary) : WORKSPACE_COUNTRIES;
    return placeholder + countries.map(country => {
        const isSelected = country.name === current ? 'selected' : '';
        return `<option value="${country.name}" ${isSelected}>${country.flag} ${country.name}</option>`;
    }).join('');
}

function populateWorkspaceCountrySelects() {
    const globalRegionSelect = document.getElementById('globalRegionSelect');
    if (globalRegionSelect) globalRegionSelect.innerHTML = getWorkspaceCountryOptions('', true, true);

    const settingsRegion = document.getElementById('settingsMemberRegion');
    if (settingsRegion) {
        const current = settingsRegion.value || 'Malaysia';
        settingsRegion.innerHTML = getWorkspaceCountryOptions(current);
    }

    const requestRegion = document.getElementById('pRegion');
    if (requestRegion && !requestRegion.disabled) {
        const current = requestRegion.value || userRegion || 'Malaysia';
        requestRegion.innerHTML = getWorkspaceCountryOptions(current);
    }

    renderSettingsCountryList();
}

function getAdminOverrideNames() {
    try {
        return JSON.parse(localStorage.getItem(ADMIN_ACCESS_STORAGE_KEY) || '[]');
    } catch(e) {
        return [];
    }
}

function saveAdminOverrideName(name) {
    const cleanName = String(name || '').trim();
    if (!cleanName) return;
    const names = getAdminOverrideNames();
    if (!names.some(n => normalizeNameKey(n) === normalizeNameKey(cleanName))) {
        names.push(cleanName);
        localStorage.setItem(ADMIN_ACCESS_STORAGE_KEY, JSON.stringify(names));
    }
}

function removeAdminOverrideName(name) {
    const key = normalizeNameKey(name);
    const names = getAdminOverrideNames().filter(n => normalizeNameKey(n) !== key);
    localStorage.setItem(ADMIN_ACCESS_STORAGE_KEY, JSON.stringify(names));
}

function isSuperAdminName(name = getCurrentUserName()) {
    const key = normalizeNameKey(name);
    return SUPER_ADMIN_NAMES.some(adminName => normalizeNameKey(adminName) === key);
}

function setSuperAdminVerified() {
    localStorage.setItem(SUPER_ADMIN_VERIFIED_KEY, 'true');
    localStorage.setItem(SUPER_ADMIN_VERIFIED_DATE_KEY, getTodaySessionStamp());
}

function clearSuperAdminVerified() {
    localStorage.removeItem(SUPER_ADMIN_VERIFIED_KEY);
    localStorage.removeItem(SUPER_ADMIN_VERIFIED_DATE_KEY);
}

function isSuperAdminVerified() {
    return localStorage.getItem(SUPER_ADMIN_VERIFIED_KEY) === 'true' && localStorage.getItem(SUPER_ADMIN_VERIFIED_DATE_KEY) === getTodaySessionStamp();
}

function hasSuperAdminAccess(name = getCurrentUserName()) {
    return isSuperAdminName(name) && isSuperAdminVerified();
}

async function verifySuperAdminLogin(name) {
    if (!isSuperAdminName(name)) {
        clearSuperAdminVerified();
        return true;
    }

    const pass = await showApplePrompt('Private Profile', 'Enter Faiz passcode to continue:', true, async (val) => val === SUPER_ADMIN_LOGIN_PASSCODE);
    if (!pass) {
        clearSuperAdminVerified();
        return false;
    }
    setSuperAdminVerified();
    return true;
}

function isAdminTeamMember(member) {
    const name = String(member?.name || '').trim();
    if (isSuperAdminName(name)) return true;

    const localAdmins = getAdminOverrideNames().map(n => normalizeNameKey(n));
    if (localAdmins.includes(normalizeNameKey(name))) return true;

    const accessText = [
        member?.access_role,
        member?.access_level,
        member?.admin_role,
        member?.permission,
        member?.permissions,
        member?.is_admin,
        member?.is_superadmin
    ].map(v => String(v || '').toLowerCase()).join(' ');

    return accessText.includes('admin') || accessText.includes('superadmin') || accessText.includes('true');
}

function hasAssignedAdminAccess(name = getCurrentUserName()) {
    const key = normalizeNameKey(name);
    if (!key) return false;
    if (isSuperAdminName(name)) return hasSuperAdminAccess(name);

    const localAdmins = getAdminOverrideNames().map(n => normalizeNameKey(n));
    if (localAdmins.includes(key)) return true;

    return (globalTeamMembers || []).some(member => normalizeNameKey(member.name) === key && isAdminTeamMember(member));
}

function hasAdminAccess() {
    return Boolean(localStorage.getItem('adtech_lead_pin')) || hasAssignedAdminAccess();
}

function syncAdminSessionFromProfile() {
    const userName = getCurrentUserName();
    const currentToken = localStorage.getItem('adtech_lead_pin');
    const profileTokens = ['profile-admin', 'profile-superadmin'];

    if (isSuperAdminName(userName) && !hasSuperAdminAccess(userName)) {
        if (profileTokens.includes(currentToken)) localStorage.removeItem('adtech_lead_pin');
        return;
    }

    const profileHasAccess = hasAssignedAdminAccess(userName);
    if (profileHasAccess) {
        localStorage.setItem('adtech_lead_pin', isSuperAdminName(userName) ? 'profile-superadmin' : 'profile-admin');
    } else if (profileTokens.includes(currentToken)) {
        localStorage.removeItem('adtech_lead_pin');
    }
}

function getClientJobPrefix(clientName) {
    const cleaned = String(clientName || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    return (cleaned + 'XXX').slice(0, 3);
}

function getCurrentJobPeriod(date = new Date()) {
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${yy}${mm}`;
}

function generateNextJobID(clientName, existingJobs = [], date = new Date()) {
    const prefix = getClientJobPrefix(clientName);
    const period = getCurrentJobPeriod(date);
    const pattern = new RegExp(`^[A-Z0-9]{3}-${period}-(\\d+)$`);
    const maxSerial = (existingJobs || []).reduce((max, row) => {
        const jobID = String(row?.job_id || '');
        const match = jobID.match(pattern);
        if (!match) return max;
        return Math.max(max, Number(match[1]) || 0);
    }, 0);
    const serial = String(maxSerial + 1).padStart(3, '0');
    return `${prefix}-${period}-${serial}`;
}

function getCreativeOverrideNames() {
    try {
        return JSON.parse(localStorage.getItem('adtech_creative_members_override') || '[]');
    } catch(e) {
        return [];
    }
}

function saveCreativeOverrideName(name) {
    const cleanName = String(name || '').trim();
    if (!cleanName) return;
    const names = getCreativeOverrideNames();
    if (!names.some(n => n.toLowerCase() === cleanName.toLowerCase())) {
        names.push(cleanName);
        localStorage.setItem('adtech_creative_members_override', JSON.stringify(names));
    }
}

function removeCreativeOverrideName(name) {
    const key = normalizeNameKey(name);
    const names = getCreativeOverrideNames().filter(n => normalizeNameKey(n) !== key);
    localStorage.setItem('adtech_creative_members_override', JSON.stringify(names));
}

function isCreativeTeamMember(member) {
    const name = String(member?.name || '').trim();
    const lowerName = name.toLowerCase();
    const roleText = [
        member?.role,
        member?.team,
        member?.department,
        member?.type,
        member?.access_type,
        member?.member_type
    ].map(v => String(v || '').toLowerCase()).join(' ');
    const explicitCreative = member?.is_creative === true || String(member?.is_creative || '').toLowerCase() === 'true';
    const localCreativeNames = getCreativeOverrideNames().map(n => String(n).toLowerCase());

    return CORE_CREATIVE_NAMES.some(n => n.toLowerCase() === lowerName) ||
        localCreativeNames.includes(lowerName) ||
        explicitCreative ||
        roleText.includes('creative') ||
        roleText.includes('designer') ||
        roleText.includes('pic');
}

function isActiveTeamMember(member) {
    if (!member) return false;

    const activeValue = member.is_active;
    if (activeValue === false) return false;
    if (['false', '0', 'no'].includes(String(activeValue || '').toLowerCase())) return false;

    const statusText = [member.status, member.member_status, member.employment_status]
        .map(value => String(value || '').toLowerCase())
        .join(' ');
    if (/inactive|removed|deleted|archived|resigned|left|offboard/.test(statusText)) return false;

    return !(member.removed_at || member.deleted_at || member.archived_at);
}

function getActiveTeamMembers() {
    return (globalTeamMembers || []).filter(isActiveTeamMember);
}

function getCountrySortIndex(region) {
    const key = String(region || '').trim().toLowerCase();
    const index = WORKSPACE_COUNTRIES.findIndex(country => country.name.toLowerCase() === key || country.code.toLowerCase() === key);
    return index >= 0 ? index : WORKSPACE_COUNTRIES.length;
}

function sortTeamMembersByCountryThenName(a, b) {
    const countryDiff = getCountrySortIndex(a.region) - getCountrySortIndex(b.region);
    if (countryDiff !== 0) return countryDiff;
    return String(a.name || '').localeCompare(String(b.name || ''));
}

function groupTeamMembersByCountry(team) {
    const groups = new Map();
    [...(team || [])].sort(sortTeamMembersByCountryThenName).forEach(member => {
        const country = getCountryConfig(member.region || 'Global');
        const key = country.name;
        if (!groups.has(key)) groups.set(key, { country, members: [] });
        groups.get(key).members.push(member);
    });
    return [...groups.values()].sort((a, b) => getCountrySortIndex(a.country.name) - getCountrySortIndex(b.country.name));
}

function renderTeamMemberOptionGroups(team, currentSelection = '') {
    return groupTeamMembersByCountry(team).map(group => {
        const options = group.members.map(member => {
            const name = escapeHtml(member.name);
            const selected = member.name === currentSelection ? 'selected' : '';
            return `<option value="${name}" ${selected}>${name}</option>`;
        }).join('');
        return `<optgroup label="${group.country.flag} ${escapeHtml(group.country.name)}">${options}</optgroup>`;
    }).join('');
}

function hydrateTeamCollections(teamData) {
    globalTeamMembers = (Array.isArray(teamData) ? teamData : []).filter(isActiveTeamMember);

    allStaffMY = globalTeamMembers.filter(t => String(t.region).toLowerCase() === 'malaysia').map(t => t.name);
    allStaffID = globalTeamMembers.filter(t => String(t.region).toLowerCase() === 'indonesia').map(t => t.name);

    const creativeRows = globalTeamMembers.filter(isCreativeTeamMember);
    дизайнериID = creativeRows.filter(t => isIndonesiaCreativeName(t.name) || String(t.region).toLowerCase() === 'indonesia').map(t => t.name);
    дизайнериMY = creativeRows.filter(t => !дизайнериID.includes(t.name)).map(t => t.name);
    PIC_LIST = [...дизайнериMY, ...дизайнериID];

    const reqSelect = document.getElementById('requesterName');
    if (reqSelect) {
        reqSelect.innerHTML = `<option value="">-- Select Name --</option>
            <optgroup label="Malaysia">${allStaffMY.map(n => `<option value="${n}">${n}</option>`).join('')}</optgroup>
            <optgroup label="Indonesia">${allStaffID.map(n => `<option value="${n}">${n}</option>`).join('')}</optgroup>`;
    }

    const editAssignee = document.getElementById('editAssignee');
    if (editAssignee) {
        editAssignee.innerHTML = `<option value="Unassigned">-- Unassigned --</option>
            <optgroup label="Malaysia">${дизайнериMY.map(n => `<option value="${n}">${n}</option>`).join('')}</optgroup>
            <optgroup label="Indonesia">${дизайнериID.map(n => `<option value="${n}">${n}</option>`).join('')}</optgroup>`;
    }

    const leaveSelect = document.getElementById('leaveName');
    if (leaveSelect) {
        leaveSelect.innerHTML = `<option value="">-- Select Name --</option>
            <optgroup label="Malaysia">${дизайнериMY.map(n => `<option value="${n}">${n}</option>`).join('')}</optgroup>
            <optgroup label="Indonesia">${дизайнериID.map(n => `<option value="${n}">${n}</option>`).join('')}</optgroup>`;
    }

    const savedName = localStorage.getItem('adtech_user_name');
    if (savedName) {
        if (reqSelect) {
            let found = false;
            for(let i=0; i<reqSelect.options.length; i++) {
                if(reqSelect.options[i].value === savedName) { reqSelect.selectedIndex = i; found = true; break; }
            }
            if(!found) {
                const manualInput = document.getElementById('manualName');
                if (manualInput) { manualInput.value = savedName; manualInput.style.display = 'block'; }
            }
        }
        if (leaveSelect) {
            for(let i=0; i<leaveSelect.options.length; i++) {
                if(leaveSelect.options[i].value === savedName) { leaveSelect.selectedIndex = i; break; }
            }
        }
    }

    populateWorkspaceCountrySelects();
    syncAdminSessionFromProfile();
    checkAdminUI();
    renderSettingsTeamList();
}

// Status codes worth retrying automatically — transport/infra-layer failures where the request
// most likely never reached (or never got a real answer from) the script, as opposed to a genuine
// application error the script itself reported.
const GAS_RETRYABLE_STATUS_CODES = new Set([404, 429, 500, 502, 503, 504]);

/**
 * POSTs to a Google Apps Script Web App and returns its parsed JSON response.
 *
 * A GAS Web App executes doPost() server-side, then 302-redirects the client to a one-time
 * script.googleusercontent.com/macros/echo?... URL that serves that execution's cached output —
 * that redirect/echo hop is a separate, extra step from the actual script logic. Diagnosed
 * 2026-08-20: intermittent "Server responded 404" in production traced to exactly this hop — Apps
 * Script's own Executions log shows doPost completing normally, but the client still sees a
 * transient failure fetching the result. Confirmed unrelated to payload content (this endpoint
 * doesn't even receive a region field).
 *
 * Because the SERVER-SIDE execution can have already completed — and, for generate_playbook,
 * already created a file — by the time the client sees a "failure", blindly retrying would risk
 * duplicate side effects. Retrying here is only safe because generate_playbook on the Apps Script
 * side is idempotent by job_id (see GOOGLE-APPS-SCRIPT-PLAYBOOK-SETUP.md) — a retry that lands on
 * an execution which already created the file gets that existing file's URL back, not a new copy.
 *
 * options:
 *   timeoutMs           — abort a single attempt after this long (default 120000)
 *   maxRetries           — additional attempts after the first, only for the transient failures
 *                          listed above (default 0 — no retries, safe default for any future
 *                          caller that hasn't confirmed its own action is idempotent)
 *   retryableStatusCodes — override the default transient-status set
 *   label                — identifies this call in the console lifecycle log
 */
async function gasPost(payload, options = {}) {
    const timeoutMs = options.timeoutMs || 120000;
    const maxRetries = options.maxRetries || 0;
    const label = options.label || payload?.action || 'gas_request';
    const retryableStatusCodes = options.retryableStatusCodes || GAS_RETRYABLE_STATUS_CODES;

    let attempt = 0;
    while (true) {
        attempt++;
        const attemptStartedAt = performance.now();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        const logCtx = { label, attempt, maxAttempts: maxRetries + 1 };

        console.log(`[GAS] ${label} — attempt ${attempt}/${maxRetries + 1} started`, logCtx);

        try {
            const res = await fetch(GAS_API, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timeout);
            const elapsedMs = Math.round(performance.now() - attemptStartedAt);

            // res.url is the FINAL url after any redirect was followed — for a healthy response
            // this is the script.googleusercontent.com/macros/echo?... address, confirming the
            // redirect hop itself completed.
            console.log(`[GAS] ${label} — attempt ${attempt} response`, {
                ...logCtx, status: res.status, ok: res.ok, redirected: res.redirected, finalUrl: res.url, elapsedMs
            });

            if (!res.ok) {
                let bodyPreview = '';
                try { bodyPreview = (await res.text()).slice(0, 300); } catch(e) {}
                console.warn(`[GAS] ${label} — attempt ${attempt} non-200 response body`, { ...logCtx, status: res.status, bodyPreview });

                if (retryableStatusCodes.has(res.status) && attempt <= maxRetries) {
                    const backoffMs = 500 * Math.pow(2, attempt - 1);
                    console.log(`[GAS] ${label} — retrying after transient ${res.status} in ${backoffMs}ms`, logCtx);
                    await new Promise(r => setTimeout(r, backoffMs));
                    continue;
                }
                throw new Error(`Server responded ${res.status}`);
            }

            return await res.json();
        } catch (e) {
            clearTimeout(timeout);
            const elapsedMs = Math.round(performance.now() - attemptStartedAt);
            const isTimeout = e.name === 'AbortError';
            // fetch() rejects with a TypeError for a genuine network-level failure (DNS, offline,
            // connection reset, or — on the old broken deployment — a missing CORS header). Distinct
            // from AbortError (our own timeout), which is deliberately NOT retried automatically:
            // the server-side execution may still be running, and stacking a second attempt on top
            // of one that hasn't actually failed yet is exactly the duplicate-risk case this whole
            // fix exists to avoid — a timeout surfaces to the user instead (see generatePlaybook()).
            const isNetworkFailure = !isTimeout && e instanceof TypeError;
            const reason = isTimeout ? 'timeout' : (isNetworkFailure ? 'network_failure' : (e.message || 'unknown_error'));

            console.warn(`[GAS] ${label} — attempt ${attempt} error`, { ...logCtx, reason, elapsedMs, errorName: e.name, errorMessage: e.message });

            if (isNetworkFailure && attempt <= maxRetries) {
                const backoffMs = 500 * Math.pow(2, attempt - 1);
                console.log(`[GAS] ${label} — retrying after network failure in ${backoffMs}ms`, logCtx);
                await new Promise(r => setTimeout(r, backoffMs));
                continue;
            }
            throw e;
        }
    }
}

function parseDateOnly(value) {
    if (!value) return null;
    if (value instanceof Date) {
        const copy = new Date(value.getTime());
        copy.setHours(0, 0, 0, 0);
        return isNaN(copy) ? null : copy;
    }
    const raw = String(value).trim();
    const dateMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
        const d = new Date(Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3]));
        d.setHours(0, 0, 0, 0);
        return isNaN(d) ? null : d;
    }
    const parsed = new Date(raw);
    if (isNaN(parsed)) return null;
    parsed.setHours(0, 0, 0, 0);
    return parsed;
}

function toDateInputValue(value) {
    const d = parseDateOnly(value);
    if (!d) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isWeekendDate(value) {
    const d = parseDateOnly(value);
    return !d ? false : d.getDay() === 0 || d.getDay() === 6;
}

function subtractWorkingDays(value, numberOfDays = 2) {
    const d = parseDateOnly(value);
    if (!d) return '';
    let remaining = Math.max(0, Number(numberOfDays || 0));
    while (remaining > 0) {
        d.setDate(d.getDate() - 1);
        if (!isWeekendDate(d)) remaining -= 1;
    }
    while (isWeekendDate(d)) d.setDate(d.getDate() - 1);
    return toDateInputValue(d);
}

function addWorkingDays(value, numberOfDays = 1) {
    const d = parseDateOnly(value || new Date());
    if (!d) return '';
    let remaining = Math.max(0, Number(numberOfDays || 0));
    while (remaining > 0) {
        d.setDate(d.getDate() + 1);
        if (!isWeekendDate(d)) remaining -= 1;
    }
    while (isWeekendDate(d)) d.setDate(d.getDate() + 1);
    return toDateInputValue(d);
}

function calculateWorkingDaysBetween(startValue, endValue) {
    const start = parseDateOnly(startValue);
    const end = parseDateOnly(endValue);
    if (!start || !end) return null;
    const direction = start <= end ? 1 : -1;
    let count = 0;
    const cursor = new Date(start);
    while ((direction === 1 && cursor < end) || (direction === -1 && cursor > end)) {
        cursor.setDate(cursor.getDate() + direction);
        if (!isWeekendDate(cursor)) count += direction;
    }
    return count;
}

function getWorkingDayDiffFromToday(value) {
    return calculateWorkingDaysBetween(new Date(), value);
}

function isDateDueWithinWorkingDays(value, windowDays = 3) {
    const diff = getWorkingDayDiffFromToday(value);
    return diff !== null && diff >= 0 && diff <= windowDays;
}

function generateSuggestedInternalDue(clientDeadline, bufferDays = 2) {
    const clientDate = parseDateOnly(clientDeadline);
    if (!clientDate) return { date: '', flag: 'missing-client-deadline' };
    const safeBuffer = Math.max(1, Number(bufferDays || 2));
    const today = parseDateOnly(new Date());
    const clientDiff = getDateOnlyDiffDays(clientDate, today);
    if (clientDiff < 0) return { date: '', flag: 'client-deadline-passed' };

    const suggested = parseDateOnly(subtractWorkingDays(clientDate, safeBuffer));
    if (!suggested) return { date: '', flag: 'invalid' };
    if (suggested < today) {
        return { date: toDateInputValue(today), flag: clientDiff === 0 ? 'same-day' : 'short-lead-time', bufferDays: safeBuffer };
    }
    const workingBuffer = calculateWorkingDaysBetween(suggested, clientDate);
    return { date: toDateInputValue(suggested), flag: workingBuffer < safeBuffer ? 'short-lead-time' : 'normal', bufferDays: safeBuffer };
}

function getSuggestedInternalDueDate(clientDeadline, bufferDays = 2) {
    return generateSuggestedInternalDue(clientDeadline, bufferDays).date;
}

function formatDate(dateStr) {
    if (!dateStr) return '-'; const d = parseDateOnly(dateStr); if (!d) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateOnly(dateStr) {
    if (!dateStr) return '';
    const d = parseDateOnly(dateStr);
    if (!d) return String(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d.getDate()} ${months[d.getMonth()]}`;
}

function getDateOnlyDiffDays(value, base = new Date()) {
    const d = parseDateOnly(value);
    if (!d) return null;
    const today = parseDateOnly(base);
    if (!today) return null;
    return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function getTaskClientDeadline(task = {}) {
    return task.client_deadline || task.deadline || '';
}

function getTaskOriginalClientDeadline(task = {}) {
    return task.original_client_deadline || task.client_deadline || task.deadline || '';
}

function getTaskInternalDueDate(task = {}) {
    return task.internal_due_date || task.internal_deadline || '';
}

function getTaskOriginalInternalDueDate(task = {}) {
    return task.original_internal_due_date || task.internal_due_date || task.internal_deadline || '';
}

function normalizeWorkStatus(status) {
    return String(status || 'Not started').replace(/_/g, ' ').trim().toLowerCase();
}

function getWorkStatusLabel(status, fallback = 'Not started') {
    const key = normalizeWorkStatus(status || fallback);
    const labels = {
        'not started': 'Not Started',
        'drafting': 'Drafting',
        'partial ready': 'Partial Ready',
        'revision': 'Revision',
        'internal review': 'Internal Review',
        'client review': 'Client Review',
        'awaiting client': 'Awaiting Client',
        'done': 'Done'
    };
    return labels[key] || String(status || fallback).replace(/_/g, ' ');
}

function getWorkStatusSlug(status, fallback = 'not started') {
    return normalizeWorkStatus(status || fallback).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'not-started';
}

function getTaskStatusKey(task = {}) {
    const requestStatus = String(task.status || '').trim().toLowerCase();
    if (requestStatus === 'pending') return 'pending';
    return normalizeWorkStatus(task.work_status || 'Not started');
}

function isInternalProductionTask(task = {}) {
    return INTERNAL_PRODUCTION_STATUS_KEYS.includes(getTaskStatusKey(task));
}

function isTaskDone(task = {}) {
    return normalizeWorkStatus(task.work_status) === 'done';
}

function isTaskAwaitingClient(task = {}) {
    return normalizeWorkStatus(task.work_status) === 'awaiting client';
}

function isTaskClientReview(task = {}) {
    return normalizeWorkStatus(task.work_status) === 'client review';
}

function serializeSupabaseError(error = {}) {
    if (!error) return 'Unknown Supabase error';
    if (typeof error === 'string') return error;
    const parts = [];
    if (error.code) parts.push(`code=${error.code}`);
    if (error.message) parts.push(`message=${error.message}`);
    if (error.details) parts.push(`details=${error.details}`);
    if (error.hint) parts.push(`hint=${error.hint}`);
    if (error._creativeOpsQuery) parts.push(`operation=${error._creativeOpsQuery}`);
    return parts.join(' | ') || String(error);
}

function annotateSupabaseError(error, operation, context = {}) {
    if (error && typeof error === 'object') {
        error._creativeOpsQuery = operation;
        error._creativeOpsContext = context;
    }
    return error;
}

function isSupabaseSetupError(error) {
    const raw = serializeSupabaseError(error);
    return /PGRST202|PGRST204|PGRST205|schema cache|could not find|column|function|rpc|relation|client_waiting|client_follow_up|client_review|task_client_waiting_periods|move_client_review_to_awaiting/i.test(raw);
}

function isSupabasePermissionError(error) {
    const raw = serializeSupabaseError(error);
    return /42501|permission|RLS|row-level|row level|not authorized|unauthori[sz]ed|policy/i.test(raw);
}

function logSupabaseDiagnostic(operation, error, context = {}) {
    const payloadKeys = context?.payload ? Object.keys(context.payload) : [];
    const diagnostic = {
        operation,
        error_code: error?.code || '',
        error_message: error?.message || String(error || ''),
        error_details: error?.details || '',
        error_hint: error?.hint || '',
        job_id: context.jobID || context.job_id || '',
        actor: getCurrentActor(),
        current_user: getCurrentUserName(),
        payload_keys: payloadKeys,
        context
    };
    console.groupCollapsed(`[Creative OS Supabase] ${operation} failed`);
    console.table(diagnostic);
    if (context?.payload) console.log('payload', context.payload);
    console.error(error);
    console.groupEnd();
}

function getClientReviewFailureMessage(error) {
    if (isSupabaseSetupError(error)) {
        return 'Supabase Client Review setup is incomplete. Run the latest supabase-client-review-aging.sql in Supabase SQL Editor, then refresh this page.';
    }
    if (isSupabasePermissionError(error)) {
        return 'Supabase permission/RLS blocked this move. Check the Client Review RPC and policies in Supabase.';
    }
    if (/owner|follow-up|follow up|foreign key|not-null|null value/i.test(serializeSupabaseError(error))) {
        return 'Follow-up owner is invalid or missing. Choose an active team member and try again.';
    }
    if (/failed to fetch|network|timeout|abort/i.test(serializeSupabaseError(error))) {
        return 'Network connection failed while saving to Supabase. Please try again.';
    }
    return error?.message || String(error || 'Unable to save this move.');
}

function showClientReviewMoveError(error, context = {}) {
    logSupabaseDiagnostic(context.operation || 'client_review_move', error, context);
    if (isSupabaseSetupError(error)) refreshClientReviewSetupStatus({ force: true, silent: true });
    showAppleAlert('Client Review Move Failed', getClientReviewFailureMessage(error), {
        tone: isSupabasePermissionError(error) || /owner|foreign key|not-null|null value/i.test(serializeSupabaseError(error)) ? 'warning' : 'danger',
        icon: isSupabaseSetupError(error) ? 'database-zap' : 'alert-triangle'
    });
}

function getTaskInternalDueSource(task = {}) {
    return String(task.internal_due_source || task.internal_due_date_source || '').trim().toLowerCase();
}

function isInternalDueManuallyAdjusted(task = {}) {
    const manualValue = task.internal_due_manually_adjusted;
    return manualValue === true ||
        String(manualValue || '').toLowerCase() === 'true' ||
        ['manual', 'manually_adjusted'].includes(getTaskInternalDueSource(task));
}

function getCurrentUserMember() {
    const currentUser = getCurrentUserName();
    if (!currentUser) return null;
    return getActiveTeamMembers().find(member => normalizeNameKey(member.name) === normalizeNameKey(currentUser)) || null;
}

function isCurrentUserCreativeTeamMember() {
    const member = getCurrentUserMember();
    return member ? isCreativeTeamMember(member) : CORE_CREATIVE_NAMES.some(name => normalizeNameKey(name) === normalizeNameKey(getCurrentUserName()));
}

function isCurrentUserAssignedPIC(task = {}) {
    return isTaskAssignedToUser(task);
}

function shouldUseInternalDeadlineForTask(task = {}) {
    return hasAdminAccess() || isCurrentUserCreativeTeamMember() || isCurrentUserAssignedPIC(task);
}

function getDeliverableLineCount(task = {}) {
    const monthly = typeof getMonthlyDeliverableSummary === 'function' ? getMonthlyDeliverableSummary(task) : null;
    if (monthly?.total) return Number(monthly.total) || 0;
    const brief = String(task.brief || '');
    const lines = brief.split(/\n+/).map(line => line.trim()).filter(Boolean);
    return lines.filter(line => /^[•*-]\s+/.test(line)).length;
}

function getInternalDueRule(task = {}) {
    const jobType = String(task.job_type || task.type || '').toLowerCase();
    const requestType = String(task.request_type || task.requestType || '').toLowerCase();
    const text = [
        jobType,
        requestType,
        task.project_title,
        task.objective,
        task.brief
    ].map(value => String(value || '').toLowerCase()).join(' ');

    const selectedTypes = jobType.split(',').map(type => type.trim()).filter(Boolean);
    const deliverableCount = getDeliverableLineCount(task);
    const hasComplexSignal = /(monthly|content plan|pitch|proposal|presentation|deck|video|reel|motion|carousel|campaign|multi|webinar|event|launch|key visual|\bkv\b|concept|mockup|template|production)/i.test(text);
    if (requestType.includes('monthly') || requestType.includes('pitch') || hasComplexSignal || deliverableCount > 1) {
        return { bufferDays: 2, complexity: 'complex' };
    }

    const simpleType = /(poster\/graphic|poster|graphic|static|banner|resize|adaptation|adapt|minor amendment|minor amend|copy replacement|small copy|caption only|one-off artwork|simple one-off|social post)/i;
    const onlySimpleTypes = selectedTypes.length > 0 && selectedTypes.every(type => simpleType.test(type));
    if (onlySimpleTypes || simpleType.test(text)) return { bufferDays: 1, complexity: 'simple' };

    return { bufferDays: 2, complexity: 'complex' };
}

function generateSuggestedInternalDueForTask(task = {}) {
    const rule = getInternalDueRule(task);
    const suggestion = generateSuggestedInternalDue(getTaskClientDeadline(task), rule.bufferDays);
    return { ...suggestion, ...rule };
}

function getTaskGeneratedInternalDueDate(task = {}) {
    return generateSuggestedInternalDueForTask(task).date || '';
}

function getTaskEffectiveInternalDueDate(task = {}) {
    return getTaskInternalDueDate(task) || getTaskGeneratedInternalDueDate(task);
}

function getTaskDeadlineForView(task = {}, mode = '') {
    const viewMode = mode || (shouldUseInternalDeadlineForTask(task) ? 'internal' : 'client');
    return viewMode === 'client' ? getTaskClientDeadline(task) : getTaskEffectiveInternalDueDate(task);
}

function getTaskCompletedAt(task = {}) {
    return task.completed_at || task.done_at || '';
}

function getClientWaitingSince(task = {}) {
    return task.client_waiting_since || task.awaiting_client_since || (isTaskAwaitingClient(task) ? task.last_moved_at : '') || '';
}

function getClientWaitingReason(task = {}) {
    return task.client_waiting_reason || task.awaiting_client_reason || 'Awaiting client feedback';
}

function getClientFollowUpDate(task = {}) {
    return task.client_follow_up_date || task.follow_up_date || '';
}

function getClientFollowUpOwner(task = {}) {
    return task.client_follow_up_owner || task.follow_up_owner || '';
}

function getClientWaitingDays(task = {}) {
    const since = getClientWaitingSince(task);
    if (!since || !isTaskAwaitingClient(task)) return 0;
    const start = new Date(since);
    if (isNaN(start)) return 0;
    return Math.max(0, Math.round(((new Date()) - start) / 86400000));
}

function isTruthyFlag(value) {
    return value === true || ['true', '1', 'yes', 'y'].includes(String(value || '').toLowerCase());
}

function isFalseFlag(value) {
    return value === false || ['false', '0', 'no', 'n'].includes(String(value || '').toLowerCase());
}

function getTaskClientReviewWindowDays(task = {}) {
    const value = Number(task.client_review_window_days);
    return Number.isFinite(value) && value > 0 ? value : CLIENT_REVIEW_WINDOW_DAYS;
}

function getClientReviewStartedAt(task = {}) {
    if (!task) return '';
    if (task.client_review_started_at || task.review_started_at) return task.client_review_started_at || task.review_started_at;
    if (isTaskClientReview(task)) return getStatusStartedAt(task) || task.last_moved_at || task.created_at || '';
    return '';
}

function getActivityMetaValue(log = {}, keys = []) {
    const meta = log?.meta && typeof log.meta === 'object' ? log.meta : {};
    for (const key of keys) {
        if (meta[key] !== undefined && meta[key] !== null && meta[key] !== '') return meta[key];
    }
    return '';
}

function getClientReviewEntryMoveTimestamp(task = {}) {
    if (!isTaskClientReview(task)) return 0;
    const logs = getTaskLogs(task.job_id || '').filter(log => {
        const nextStatus = normalizeWorkStatus(log.new_value || getActivityMetaValue(log, ['new_status', 'destination', 'status_to']));
        const previousStatus = normalizeWorkStatus(log.old_value || getActivityMetaValue(log, ['old_status', 'previous_status', 'status_from']));
        const action = String(log.action_type || '').toLowerCase();
        const isStatusMove = ['status_changed', 'left_awaiting_client', 'client_review_auto_move_undone'].includes(action) || /status|awaiting|client_review/i.test(action);
        return isStatusMove && nextStatus === 'client review' && previousStatus !== 'client review';
    });
    const moveLogTime = logs.reduce((latest, log) => Math.max(latest, getTimestampValue(log.created_at, 0)), 0);
    if (moveLogTime) return moveLogTime;

    const startedAt = getTimestampValue(task.client_review_started_at || task.review_started_at, 0);
    const movedAt = getTimestampValue(task.last_moved_at, 0);
    if (!startedAt || !movedAt) return 0;
    return Math.abs(startedAt - movedAt) <= 2 * 60 * 1000 ? Math.max(startedAt, movedAt) : 0;
}

function getClientReviewJustMovedMeta(task = {}) {
    const timestamp = getClientReviewEntryMoveTimestamp(task);
    if (!timestamp) return { active: false, timestamp: 0, remainingMinutes: 0 };
    const ageMs = Date.now() - timestamp;
    const windowMs = CLIENT_REVIEW_JUST_MOVED_PIN_MINUTES * 60 * 1000;
    const active = ageMs >= 0 && ageMs <= windowMs;
    const remainingMinutes = active ? Math.max(1, Math.ceil((windowMs - ageMs) / 60000)) : 0;
    return { active, timestamp, remainingMinutes };
}

function scheduleClientReviewJustMovedExpiryRefresh(tasks = []) {
    if (clientReviewJustMovedRefreshTimer) {
        clearTimeout(clientReviewJustMovedRefreshTimer);
        clientReviewJustMovedRefreshTimer = null;
    }
    const windowMs = CLIENT_REVIEW_JUST_MOVED_PIN_MINUTES * 60 * 1000;
    const nextExpiry = (tasks || [])
        .map(task => getClientReviewJustMovedMeta(task))
        .filter(meta => meta.active)
        .map(meta => meta.timestamp + windowMs)
        .reduce((soonest, value) => Math.min(soonest, value), Number.POSITIVE_INFINITY);
    if (!Number.isFinite(nextExpiry)) return;
    const delay = Math.max(1000, nextExpiry - Date.now() + 250);
    clientReviewJustMovedRefreshTimer = setTimeout(() => {
        clientReviewJustMovedRefreshTimer = null;
        if (typeof isKanbanMode !== 'undefined' && isKanbanMode) renderKanbanBoard();
    }, delay);
}

/**
 * Generalized version of the Client Review "just moved" pin, driven by last_moved_at — which
 * updateWorkStatusOptimistic() already stamps on EVERY status change, drag or manual, into any
 * column. Powers the highlight glow + badge for every column except Client Review, which keeps
 * its own longer, more specific pin (see getClientReviewJustMovedMeta above).
 */
function getWorkStatusJustMovedMeta(task = {}) {
    const timestamp = getTimestampValue(task.last_moved_at, 0);
    if (!timestamp) return { active: false, timestamp: 0, remainingSeconds: 0 };
    const ageMs = Date.now() - timestamp;
    const windowMs = KANBAN_JUST_MOVED_PIN_SECONDS * 1000;
    const active = ageMs >= 0 && ageMs <= windowMs;
    const remainingSeconds = active ? Math.max(1, Math.ceil((windowMs - ageMs) / 1000)) : 0;
    return { active, timestamp, remainingSeconds };
}

function scheduleWorkStatusJustMovedExpiryRefresh(tasks = []) {
    if (kanbanJustMovedRefreshTimer) {
        clearTimeout(kanbanJustMovedRefreshTimer);
        kanbanJustMovedRefreshTimer = null;
    }
    const windowMs = KANBAN_JUST_MOVED_PIN_SECONDS * 1000;
    const nextExpiry = (tasks || [])
        .map(task => getWorkStatusJustMovedMeta(task))
        .filter(meta => meta.active)
        .map(meta => meta.timestamp + windowMs)
        .reduce((soonest, value) => Math.min(soonest, value), Number.POSITIVE_INFINITY);
    if (!Number.isFinite(nextExpiry)) return;
    const delay = Math.max(1000, nextExpiry - Date.now() + 250);
    kanbanJustMovedRefreshTimer = setTimeout(() => {
        kanbanJustMovedRefreshTimer = null;
        if (typeof isKanbanMode !== 'undefined' && isKanbanMode) renderKanbanBoard();
    }, delay);
}

function getClientReviewEndedAt(task = {}) {
    return task.client_review_ended_at || (!isTaskClientReview(task) ? (task.last_moved_at || task.completed_at || task.done_at || '') : '');
}

function getClientReviewSnoozedUntil(task = {}) {
    return task.auto_move_snoozed_until || '';
}

function isClientReviewSnoozed(task = {}) {
    const snoozedUntil = getClientReviewSnoozedUntil(task);
    if (!snoozedUntil) return false;
    const value = new Date(snoozedUntil);
    return !isNaN(value) && value > new Date();
}

function isClientReviewAutomationExempt(task = {}) {
    const statusText = [task.status, task.work_status, task.lifecycle_status, task.task_status]
        .map(value => String(value || '').toLowerCase())
        .join(' ');
    return isTruthyFlag(task.client_review_auto_move_exempt) ||
        isFalseFlag(task.client_review_auto_move_enabled) ||
        /cancel|archiv|pause|paused|postpone|postponed|deleted/.test(statusText);
}

function getClientReviewMeaningfulResponseAt(task = {}) {
    const startedAt = getClientReviewStartedAt(task);
    const started = startedAt ? new Date(startedAt) : null;
    const direct = task.client_review_meaningful_response_at || task.client_response_received_at || '';
    if (direct) {
        const directDate = new Date(direct);
        if (!isNaN(directDate) && (!started || directDate >= started)) return direct;
    }

    const meaningfulTypes = new Set([
        'client_response_recorded',
        'client_approval_recorded',
        'client_revision_requested',
        'client_assets_received',
        'client_review_period_restarted'
    ]);
    const log = getTaskLogs(task.job_id).find(row => {
        if (!meaningfulTypes.has(row.action_type)) return false;
        if (!started) return true;
        const created = new Date(row.created_at);
        return !isNaN(created) && created >= started;
    });
    return log?.created_at || '';
}

function hasMeaningfulClientResponseInCurrentReview(task = {}) {
    return Boolean(getClientReviewMeaningfulResponseAt(task));
}

function getClientReviewAge(task = {}) {
    const startAt = getClientReviewStartedAt(task);
    const endAt = getClientReviewEndedAt(task) || new Date().toISOString();
    const windowDays = getTaskClientReviewWindowDays(task);
    const workingDays = startAt ? calculateWorkingDaysBetween(startAt, endAt) : null;
    const calendarHours = startAt ? getHoursBetween(startAt, endAt) : '';
    const calendarDays = calendarHours === '' ? '' : Math.round((Number(calendarHours) / 24) * 10) / 10;
    const exempt = isClientReviewAutomationExempt(task);
    const snoozed = isClientReviewSnoozed(task);
    const responded = hasMeaningfulClientResponseInCurrentReview(task);
    const auditRequired = isTruthyFlag(task.client_review_audit_required);
    let urgency = 'normal';

    if (!isTaskClientReview(task)) urgency = 'inactive';
    else if (!startAt || workingDays === null) urgency = 'missing';
    else if (exempt) urgency = 'exempt';
    else if (snoozed) urgency = 'snoozed';
    else if (responded) urgency = 'responded';
    else if (workingDays > windowDays) urgency = 'overdue';
    else if (workingDays === windowDays) urgency = 'moving-soon';
    else if (workingDays >= CLIENT_REVIEW_WARNING_DAY) urgency = 'warning';
    else if (workingDays >= CLIENT_REVIEW_WATCH_DAY) urgency = 'watch';

    const label = getClientReviewAgeLabel({ workingDays, urgency, windowDays, snoozedUntil: getClientReviewSnoozedUntil(task) });
    return {
        startAt,
        endAt,
        workingDays,
        calendarDays,
        calendarHours,
        windowDays,
        urgency,
        label,
        exempt,
        snoozed,
        responded,
        auditRequired,
        eligibleForAutoMove: urgency === 'overdue' && !auditRequired && !task.client_review_auto_moved_at
    };
}

function getClientReviewAgeLabel({ workingDays, urgency, windowDays, snoozedUntil } = {}) {
    if (urgency === 'inactive') return '';
    if (urgency === 'missing') return 'Review start missing';
    if (urgency === 'exempt') return 'Review timer paused';
    if (urgency === 'snoozed') return `Review held until ${formatDateOnly(snoozedUntil)}`;
    if (urgency === 'responded') return 'Client response recorded';
    if (workingDays === 0) return 'Sent to client today';
    if (urgency === 'overdue') return 'Client review overdue';
    if (urgency === 'moving-soon') return 'Moving to Awaiting Client after today';
    return `Client review · ${workingDays} working day${workingDays === 1 ? '' : 's'}`;
}

function isClientReviewAgingTask(task = {}) {
    if (!isTaskClientReview(task)) return false;
    const age = getClientReviewAge(task);
    return ['warning', 'moving-soon', 'overdue', 'missing'].includes(age.urgency);
}

function getClientWaitingShortReason(task = {}) {
    const reason = String(getClientWaitingReason(task) || '').toLowerCase();
    if (reason.includes('asset')) return 'Awaiting assets';
    if (reason.includes('approval')) return 'Awaiting approval';
    if (reason.includes('confirm')) return 'Awaiting confirmation';
    if (reason.includes('decision')) return 'Awaiting decision';
    return 'Awaiting feedback';
}

function renderClientReviewAgingRow(task = {}) {
    const age = getClientReviewAge(task);
    if (!age.label) return '';
    const title = age.startAt
        ? `Client Review started ${formatDate(age.startAt)}. Window: ${age.windowDays} working days.`
        : 'Client Review start time is missing.';
    return `<div class="task-deadline-row client-review-aging-row client-review-${age.urgency}" title="${escapeHtml(title)}" aria-label="${escapeHtml(age.label)}"><span class="deadline-light" aria-hidden="true"></span><span class="deadline-copy">${escapeHtml(age.label)}</span></div>`;
}

function renderAwaitingClientCompactRows(task = {}) {
    const since = getClientWaitingSince(task);
    const sinceLabel = since ? `Since ${formatDateOnly(since)}` : 'Since not set';
    const clientPassed = getDateOnlyDiffDays(getTaskClientDeadline(task)) < 0;
    const reasonLabel = clientPassed ? 'Client deadline passed · Client blocked' : `${getClientWaitingShortReason(task)} · ${sinceLabel}`;
    const followUpLabel = formatFollowUpLabel(task);
    const followUrgency = getFollowUpUrgency(task);

    return `
        <div class="task-deadline-row awaiting-client-row is-waiting-since ${clientPassed ? 'deadline-overdue' : 'deadline-upcoming'}" aria-label="${escapeHtml(reasonLabel)}">
            <span class="deadline-light" aria-hidden="true"></span><span class="deadline-copy">${escapeHtml(reasonLabel)}</span>
        </div>
        <div class="task-deadline-row awaiting-client-row is-followup ${followUrgency.state}" aria-label="${escapeHtml(followUpLabel)}">
            <span class="deadline-light" aria-hidden="true"></span><span class="deadline-copy">${escapeHtml(followUpLabel)}</span>
        </div>
    `;
}

function getTaskInternalOverdueDays(task = {}) {
    const due = getTaskEffectiveInternalDueDate(task);
    if (!due || isTaskDone(task) || isTaskAwaitingClient(task) || isTaskClientReview(task)) return '';
    const diff = getDateOnlyDiffDays(due);
    return diff !== null && diff < 0 ? Math.abs(diff) : 0;
}

function getTaskClientOverdueDays(task = {}) {
    const due = getTaskClientDeadline(task);
    if (!due || isTaskDone(task)) return '';
    const diff = getDateOnlyDiffDays(due);
    return diff !== null && diff < 0 ? Math.abs(diff) : 0;
}

function hasDeadlineEditAccess() {
    return typeof hasAdminAccess === 'function' ? hasAdminAccess() : !!localStorage.getItem('adtech_lead_pin');
}

function pluralDay(count) {
    return `${count} day${count === 1 ? '' : 's'}`;
}

function getDeadlineUrgency(task = {}, mode = '') {
    if (isTaskDone(task)) return { state: 'deadline-complete', diff: null };
    const due = getTaskDeadlineForView(task, mode);
    if (!due) return { state: 'deadline-missing', diff: null };
    const diff = getDateOnlyDiffDays(due);
    if (diff === null) return { state: 'deadline-missing', diff: null };
    if (diff < 0) return { state: 'deadline-overdue', diff };
    if (diff === 0) return { state: 'deadline-today', diff };
    if (diff === 1) return { state: 'deadline-tomorrow', diff };
    if (diff <= 3) return { state: 'deadline-soon', diff };
    if (diff <= 7) return { state: 'deadline-upcoming', diff };
    return { state: 'deadline-safe', diff };
}

function formatDeadlineLabel(task = {}, mode = '') {
    if (isTaskDone(task)) return 'Completed';
    const viewMode = mode || (shouldUseInternalDeadlineForTask(task) ? 'internal' : 'client');
    const due = getTaskDeadlineForView(task, viewMode);
    const urgency = getDeadlineUrgency(task, viewMode);
    const prefix = viewMode === 'client' ? 'Deadline' : 'Due';
    if (!due || urgency.diff === null) return viewMode === 'internal' && hasDeadlineEditAccess() ? '+ Set due date' : `${prefix} pending`;
    if (urgency.diff < 0) return viewMode === 'client' ? `Deadline passed · ${pluralDay(Math.abs(urgency.diff))}` : `Overdue · ${pluralDay(Math.abs(urgency.diff))}`;
    if (urgency.diff === 0) return viewMode === 'client' ? 'Deadline today' : 'Due today';
    if (urgency.diff === 1) return viewMode === 'client' ? 'Deadline tomorrow' : 'Due tomorrow';
    if (urgency.diff <= 7) return `${prefix} ${formatDateOnly(due)} · ${pluralDay(urgency.diff)} left`;
    return `${prefix} ${formatDateOnly(due)}`;
}

function getFollowUpUrgency(task = {}) {
    const followUp = getClientFollowUpDate(task);
    if (!followUp) return { state: 'deadline-missing', diff: null };
    const diff = getDateOnlyDiffDays(followUp);
    if (diff === null) return { state: 'deadline-missing', diff: null };
    if (diff < 0) return { state: 'deadline-overdue', diff };
    if (diff === 0) return { state: 'deadline-today', diff };
    if (diff === 1) return { state: 'deadline-tomorrow', diff };
    if (diff <= 3) return { state: 'deadline-soon', diff };
    return { state: 'deadline-upcoming', diff };
}

function formatFollowUpLabel(task = {}) {
    const owner = getClientFollowUpOwner(task);
    const followUp = getClientFollowUpDate(task);
    const ownerText = owner ? ` · ${owner}` : '';
    const urgency = getFollowUpUrgency(task);
    if (!followUp || urgency.diff === null) return 'No follow-up scheduled';
    if (urgency.diff < 0) return `Follow-up overdue · ${pluralDay(Math.abs(urgency.diff))}`;
    if (urgency.diff === 0) return `Follow up today${ownerText}`;
    if (urgency.diff === 1) return `Follow up tomorrow${ownerText}`;
    return `Follow up ${formatDateOnly(followUp)}${ownerText}`;
}

function renderTaskDeadlineRow(task = {}) {
    if (isTaskClientReview(task)) return renderClientReviewAgingRow(task);
    if (isTaskAwaitingClient(task)) return renderAwaitingClientCompactRows(task);

    const viewMode = shouldUseInternalDeadlineForTask(task) ? 'internal' : 'client';
    const urgency = getDeadlineUrgency(task, viewMode);
    const label = formatDeadlineLabel(task, viewMode);
    const editable = viewMode === 'internal' && !isTaskDone(task) && hasDeadlineEditAccess();
    const title = viewMode === 'client'
            ? `Client deadline${getTaskClientDeadline(task) ? `: ${formatDate(getTaskClientDeadline(task))}` : ''}`
            : `Internal due${getTaskEffectiveInternalDueDate(task) ? `: ${formatDate(getTaskEffectiveInternalDueDate(task))}` : ''}. Client deadline: ${formatDate(getTaskClientDeadline(task))}`;
    const attrs = editable ? `role="button" tabindex="0" onclick="openInternalDueModal(event, '${escapeJsString(task.job_id)}')" onkeydown="handleInternalDueRowKeydown(event, '${escapeJsString(task.job_id)}')"` : '';
    return `<div class="task-deadline-row ${viewMode === 'client' ? 'is-client-deadline' : 'is-internal-deadline'} ${urgency.state} ${editable ? 'is-editable' : ''}" ${attrs} title="${escapeHtml(title)}" aria-label="${escapeHtml(label)}"><span class="deadline-light" aria-hidden="true"></span><span class="deadline-copy">${escapeHtml(label)}</span></div>`;
}

function renderClientWaitingRow() {
    return '';
}

function canManageClientReviewAutomation(task = {}) {
    return hasAdminAccess();
}

function canRecordClientReviewResponse(task = {}) {
    return hasAdminAccess() || isCurrentUserAssignedPIC(task) || isCurrentUserCreativeTeamMember();
}

function renderClientReviewDetailPanel(task = {}) {
    if (!isTaskClientReview(task)) return '';
    const age = getClientReviewAge(task);
    const canRecord = canRecordClientReviewResponse(task);
    const canManage = canManageClientReviewAutomation(task);
    const stateLabel = age.auditRequired ? 'Audit first' : age.exempt ? 'Exempt' : age.snoozed ? 'Held' : age.responded ? 'Response recorded' : age.eligibleForAutoMove ? 'Auto-move ready' : 'Active';
    const stateClass = age.urgency;
    const actionRow = canRecord || canManage ? `
        <div class="client-review-action-row">
            ${canRecord ? `<button type="button" class="settings-action-btn compact" onclick="recordClientReviewResponse('${escapeJsString(task.job_id)}')"><i data-lucide="message-circle-check"></i><span>Client Replied</span></button>` : ''}
            ${canManage ? `<button type="button" class="settings-action-btn compact" onclick="openClientReviewOverrideDialog('${escapeJsString(task.job_id)}')"><i data-lucide="sliders-horizontal"></i><span>Review Control</span></button>` : ''}
            ${canManage ? `<button type="button" class="settings-primary-btn compact" onclick="autoMoveClientReviewToAwaiting('${escapeJsString(task.job_id)}', { source: 'manual_admin' })"><i data-lucide="message-square-clock"></i><span>Move Awaiting</span></button>` : ''}
        </div>
    ` : '';

    return `
        <div class="client-review-detail-panel client-review-${stateClass}">
            <div>
                <span>Client Review</span>
                <strong>${escapeHtml(age.label)}</strong>
            </div>
            <div>
                <span>Started</span>
                <strong>${age.startAt ? formatDate(age.startAt) : 'Missing'}</strong>
            </div>
            <div>
                <span>Window</span>
                <strong>${age.windowDays} working days</strong>
            </div>
            <div>
                <span>Automation</span>
                <strong>${escapeHtml(stateLabel)}</strong>
            </div>
            ${age.auditRequired ? '<p>Historical review detected. Admin should review before auto-moving.</p>' : ''}
            ${task.client_review_exemption_reason ? `<p>${escapeHtml(task.client_review_exemption_reason)}</p>` : ''}
            ${actionRow}
        </div>
    `;
}

function renderAwaitingClientDetailPanel(task = {}) {
    if (!isTaskAwaitingClient(task)) return '';
    const followUp = getClientFollowUpDate(task);
    const internalPassed = getDateOnlyDiffDays(getTaskEffectiveInternalDueDate(task)) < 0;
    const clientPassed = getDateOnlyDiffDays(getTaskClientDeadline(task)) < 0;
    const blockedContext = (internalPassed || clientPassed) ? '<p class="awaiting-client-context">Deadline passed · Client blocked</p>' : '';
    const undoAutoMove = hasAdminAccess() && wasClientReviewAutoMoved(task) ? `
        <div class="client-review-action-row awaiting-client-actions">
            <button type="button" class="settings-action-btn compact" onclick="openDetailModal('${escapeJsString(task.job_id)}', true)"><i data-lucide="eye"></i><span>Review</span></button>
            <button type="button" class="settings-primary-btn compact" onclick="undoClientReviewAutoMove('${escapeJsString(task.job_id)}')"><i data-lucide="rotate-ccw"></i><span>Undo Auto Move</span></button>
        </div>
    ` : '';
    return `
        <div class="awaiting-client-detail-panel">
            <div>
                <span>Client Blocked</span>
                <strong>${escapeHtml(getClientWaitingReason(task))}</strong>
            </div>
            <div>
                <span>Waiting Since</span>
                <strong>${formatDate(getClientWaitingSince(task))}</strong>
            </div>
            <div>
                <span>Follow-up</span>
                <strong>${followUp ? formatDate(followUp) : 'Not set'}</strong>
            </div>
            <div>
                <span>Owner</span>
                <strong>${escapeHtml(getClientFollowUpOwner(task) || 'Unassigned')}</strong>
            </div>
            ${blockedContext}
            ${task.client_waiting_note ? `<p>${escapeHtml(task.client_waiting_note)}</p>` : ''}
            ${undoAutoMove}
        </div>
    `;
}

function isValidRequestBoardSortMode(value) {
    return REQUEST_BOARD_SORT_OPTIONS.some(option => option.id === value);
}

function normalizeRequestBoardSortMode(value) {
    const raw = String(value || '').trim();
    const legacyMap = {
        'smart-priority': 'smart_priority',
        'deadline-earliest': 'deadline_earliest',
        'recently-added': 'recently_added',
        'oldest-added': 'oldest_added',
        'recently-updated': 'recently_updated',
        'client-az': 'client_az'
    };
    const normalized = legacyMap[raw] || raw;
    return isValidRequestBoardSortMode(normalized) ? normalized : 'smart_priority';
}

function getStoredRequestBoardSortMode() {
    try {
        const saved = localStorage.getItem(REQUEST_BOARD_SORT_STORAGE_KEY);
        const mode = normalizeRequestBoardSortMode(saved);
        if (saved && saved !== mode) localStorage.setItem(REQUEST_BOARD_SORT_STORAGE_KEY, mode);
        return mode;
    } catch(e) {
        return 'smart_priority';
    }
}

function getBoardSortMode() {
    requestBoardSortMode = normalizeRequestBoardSortMode(requestBoardSortMode);
    return requestBoardSortMode;
}

function getBoardSortOption(mode = getBoardSortMode()) {
    const normalized = normalizeRequestBoardSortMode(mode);
    return REQUEST_BOARD_SORT_OPTIONS.find(option => option.id === normalized) || REQUEST_BOARD_SORT_OPTIONS[0];
}

function isRequestBoardSortMenuOpen() {
    const popover = document.getElementById('requestBoardSortPopover');
    return Boolean(popover && !popover.hidden);
}

function renderRequestBoardSortOptions(mode = getBoardSortMode()) {
    const currentMode = normalizeRequestBoardSortMode(mode);
    return REQUEST_BOARD_SORT_OPTIONS.map(option => {
        const selected = option.id === currentMode;
        const selectedClass = selected ? ' is-selected' : '';
        const checkIcon = selected ? '<i data-lucide="check"></i>' : '';
        return `
            <button type="button" role="option" class="board-sort-option${selectedClass}" data-sort-mode="${option.id}" aria-selected="${selected ? 'true' : 'false'}" tabindex="${selected ? '0' : '-1'}" onclick="selectRequestBoardSortMode('${option.id}')" onkeydown="handleRequestSortOptionKeydown(event)">
                <span class="board-sort-option__icon-wrap"><i data-lucide="${option.icon}"></i></span>
                <span class="board-sort-option__copy">
                    <strong>${escapeHtml(option.label)}</strong>
                    <small>${escapeHtml(option.description)}</small>
                </span>
                <span class="board-sort-option__check" aria-hidden="true">${checkIcon}</span>
            </button>
        `;
    }).join('');
}

function getRequestBoardSortOptions() {
    const popover = document.getElementById('requestBoardSortPopover');
    return popover ? [...popover.querySelectorAll('.board-sort-option')] : [];
}

function syncRequestBoardSortControl() {
    const mode = getBoardSortMode();
    const option = getBoardSortOption(mode);
    const trigger = document.getElementById('requestBoardSortTrigger');
    const label = document.getElementById('requestBoardSortLabel');
    const summary = document.getElementById('requestBoardSortSummary');
    const popover = document.getElementById('requestBoardSortPopover');

    if (label) label.textContent = option.label;
    if (summary) summary.textContent = '';
    if (trigger) {
        trigger.setAttribute('aria-label', `Sort Request Status Board: ${option.label}`);
        trigger.setAttribute('aria-expanded', isRequestBoardSortMenuOpen() ? 'true' : 'false');
    }
    getRequestBoardSortOptions().forEach(button => {
        const selected = button.dataset.sortMode === mode;
        button.classList.toggle('is-selected', selected);
        button.setAttribute('aria-selected', selected ? 'true' : 'false');
        button.tabIndex = selected ? 0 : -1;
        const check = button.querySelector('.board-sort-option__check');
        if (check) check.innerHTML = selected ? '<i data-lucide="check"></i>' : '';
    });
}

function closeRequestBoardSortMenu(options = {}) {
    const popover = document.getElementById('requestBoardSortPopover');
    const trigger = document.getElementById('requestBoardSortTrigger');
    if (popover) {
        popover.hidden = true;
        popover.classList.remove('is-open');
        popover.innerHTML = '';
    }
    if (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
        if (options.focusTrigger) trigger.focus();
    }
    syncRequestBoardSortControl();
}

function openRequestBoardSortMenu(focusSelected = true) {
    const popover = document.getElementById('requestBoardSortPopover');
    const trigger = document.getElementById('requestBoardSortTrigger');
    if (!popover || !trigger) return;
    popover.innerHTML = renderRequestBoardSortOptions();
    popover.hidden = false;
    popover.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    syncRequestBoardSortControl();
    if (focusSelected) {
        const selected = popover.querySelector('.board-sort-option.is-selected') || popover.querySelector('.board-sort-option');
        if (selected) selected.focus();
    }
    refreshIcons();
}

function toggleRequestBoardSortMenu() {
    const popover = document.getElementById('requestBoardSortPopover');
    if (!popover) return;
    if (popover.hidden) openRequestBoardSortMenu(false);
    else closeRequestBoardSortMenu({ focusTrigger: true });
}

function setRequestBoardSortMode(mode, options = {}) {
    requestBoardSortMode = normalizeRequestBoardSortMode(mode);
    try { localStorage.setItem(REQUEST_BOARD_SORT_STORAGE_KEY, requestBoardSortMode); } catch(e) {}
    syncRequestBoardSortControl();
    renderBoards();
    if (options.closeMenu !== false) closeRequestBoardSortMenu({ focusTrigger: !!options.focusTrigger });
}

function selectRequestBoardSortMode(mode) {
    setRequestBoardSortMode(mode, { focusTrigger: true });
}

function moveRequestSortFocus(direction = 1) {
    const options = getRequestBoardSortOptions();
    if (!options.length) return;
    const currentIndex = Math.max(0, options.indexOf(document.activeElement));
    const nextIndex = (currentIndex + direction + options.length) % options.length;
    options[nextIndex].focus();
}

function handleRequestSortTriggerKeydown(event) {
    if (!['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    openRequestBoardSortMenu(true);
    if (event.key === 'ArrowUp') moveRequestSortFocus(-1);
}

function handleRequestSortOptionKeydown(event) {
    if (event.key === 'ArrowDown') {
        event.preventDefault();
        moveRequestSortFocus(1);
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        moveRequestSortFocus(-1);
    } else if (event.key === 'Home') {
        event.preventDefault();
        const first = getRequestBoardSortOptions()[0];
        if (first) first.focus();
    } else if (event.key === 'End') {
        event.preventDefault();
        const options = getRequestBoardSortOptions();
        const last = options[options.length - 1];
        if (last) last.focus();
    } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectRequestBoardSortMode(event.currentTarget.dataset.sortMode);
    } else if (event.key === 'Escape') {
        event.preventDefault();
        closeRequestBoardSortMenu({ focusTrigger: true });
    }
}

let requestBoardSortMenuEventsBound = false;
function bindRequestBoardSortMenuEvents() {
    if (requestBoardSortMenuEventsBound) return;
    requestBoardSortMenuEventsBound = true;
    document.addEventListener('click', (event) => {
        const menu = document.getElementById('requestSortMenu');
        const popover = document.getElementById('requestBoardSortPopover');
        if (!menu || !popover || popover.hidden) return;
        if (!menu.contains(event.target)) closeRequestBoardSortMenu();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        const popover = document.getElementById('requestBoardSortPopover');
        if (popover && !popover.hidden) {
            event.preventDefault();
            closeRequestBoardSortMenu({ focusTrigger: true });
        }
    });
}

function getCreatedAtTime(task = {}) {
    return new Date(task.created_at || task.updated_at || task.last_moved_at || 0).getTime() || 0;
}

function getTaskStableId(task = {}) {
    return String(task.job_id || task.id || task.task_id || '').trim();
}

function getTaskFreshnessTime(task = {}) {
    return getTimestampValue(task.updated_at || task.last_moved_at || task.completed_at || task.done_at || task.created_at);
}

function deduplicateTasks(tasks = []) {
    const map = new Map();
    (Array.isArray(tasks) ? tasks : []).forEach((task, index) => {
        if (!task) return;
        const stableId = getTaskStableId(task) || `row-${index}`;
        const existing = map.get(stableId);
        if (!existing || getTaskFreshnessTime(task) >= getTaskFreshnessTime(existing)) {
            map.set(stableId, task);
        }
    });
    return [...map.values()];
}

function getTimestampValue(value, fallback = 0) {
    if (!value) return fallback;
    if (value instanceof Date) {
        const time = value.getTime();
        return isNaN(time) ? fallback : time;
    }
    const raw = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        const dateOnly = parseDateOnly(raw);
        return dateOnly ? dateOnly.getTime() : fallback;
    }
    const parsed = new Date(raw);
    if (!isNaN(parsed)) return parsed.getTime();
    const dateOnly = parseDateOnly(raw);
    return dateOnly ? dateOnly.getTime() : fallback;
}

function getDateOnlySortTime(value, fallback = Number.POSITIVE_INFINITY) {
    const date = parseDateOnly(value);
    return date ? date.getTime() : fallback;
}

function comparePrimitiveValues(a, b) {
    const av = a === undefined || a === null || Number.isNaN(a) ? 0 : a;
    const bv = b === undefined || b === null || Number.isNaN(b) ? 0 : b;
    if (typeof av === 'string' || typeof bv === 'string') return String(av).localeCompare(String(bv));
    return av === bv ? 0 : av - bv;
}

function compareBoardSortKeys(a = [], b = []) {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const result = comparePrimitiveValues(a[i], b[i]);
        if (result !== 0) return result;
    }
    return 0;
}

function getStableTaskFallbackKey(task = {}) {
    return [
        getTimestampValue(task.created_at, Number.POSITIVE_INFINITY),
        String(task.job_id || task.id || task.task_id || '')
    ];
}

function compareStableTaskIdAsc(a = {}, b = {}) {
    return String(a.job_id || a.id || a.task_id || '').localeCompare(String(b.job_id || b.id || b.task_id || ''));
}

function compareStableTaskIdDesc(a = {}, b = {}) {
    return String(b.job_id || b.id || b.task_id || '').localeCompare(String(a.job_id || a.id || a.task_id || ''));
}

function getBoardColumnStatusKey(columnStatus = '', task = {}) {
    const raw = String(columnStatus || '').trim();
    if (!raw) return getTaskStatusKey(task);
    if (/inbox/i.test(raw) || normalizeWorkStatus(raw) === 'pending') return 'pending';
    return normalizeWorkStatus(raw);
}

function getDeadlineSortMeta(dateValue) {
    const diff = getDateOnlyDiffDays(dateValue);
    const dateTime = getDateOnlySortTime(dateValue);
    if (diff === null) {
        return { rank: 4, diff: Number.POSITIVE_INFINITY, dateTime: Number.POSITIVE_INFINITY };
    }
    if (diff < 0) return { rank: 0, diff, dateTime };
    if (diff === 0) return { rank: 1, diff, dateTime };
    if (diff === 1) return { rank: 2, diff, dateTime };
    return { rank: 3, diff, dateTime };
}

function getSmartPriorityDeadlineForTask(task = {}, columnStatus = '') {
    const statusKey = getBoardColumnStatusKey(columnStatus, task);
    if (INTERNAL_PRODUCTION_STATUS_KEYS.includes(statusKey)) {
        return shouldUseInternalDeadlineForTask(task) ? getTaskEffectiveInternalDueDate(task) : getTaskClientDeadline(task);
    }
    return getTaskDeadlineForView(task);
}

function getRelevantDeadlineForViewer(task = {}, columnStatus = '') {
    return getSmartPriorityDeadlineForTask(task, columnStatus);
}

function getActiveProductionSortKey(task = {}, columnStatus = '') {
    const deadline = getRelevantDeadlineForViewer(task, columnStatus);
    const due = getDeadlineSortMeta(deadline);
    return [
        due.rank,
        due.dateTime,
        getTimestampValue(task.created_at, Number.POSITIVE_INFINITY),
        String(task.job_id || task.id || '')
    ];
}

function getInboxSortKey(task = {}) {
    const deadline = getRelevantDeadlineForViewer(task, 'pending');
    const due = getDeadlineSortMeta(deadline);
    return [
        due.rank,
        due.dateTime,
        getTimestampValue(task.created_at, Number.POSITIVE_INFINITY),
        String(task.job_id || task.id || '')
    ];
}

function getClientReviewSortKey(task = {}) {
    const justMoved = getClientReviewJustMovedMeta(task);
    if (justMoved.active) {
        return [
            -1,
            -justMoved.timestamp,
            getDateOnlySortTime(getTaskClientDeadline(task)),
            getTimestampValue(task.created_at, Number.POSITIVE_INFINITY),
            String(task.job_id || task.id || '')
        ];
    }

    const age = getClientReviewAge(task);
    const workingDays = Number(age.workingDays ?? -1);
    const ageRankMap = { 4: 2, 3: 3, 2: 4, 1: 5, 0: 6 };
    let rank = 7;

    if (age.urgency === 'overdue') rank = 0;
    else if (age.urgency === 'moving-soon') rank = 1;
    else if (workingDays >= 0) rank = ageRankMap[Math.min(workingDays, 4)] ?? 7;
    if (age.urgency === 'missing' || !age.startAt) rank = 8;

    return [
        rank,
        rank === 0 ? -workingDays : 0,
        getTimestampValue(age.startAt, Number.POSITIVE_INFINITY),
        getDateOnlySortTime(getTaskClientDeadline(task)),
        getTimestampValue(task.created_at, Number.POSITIVE_INFINITY),
        String(task.job_id || task.id || '')
    ];
}

function getAwaitingClientSortKey(task = {}) {
    const followUp = getClientFollowUpDate(task);
    const followMeta = getDeadlineSortMeta(followUp);
    const hasFollowUp = Boolean(parseDateOnly(followUp));
    const waitingSince = getTimestampValue(getClientWaitingSince(task), Number.POSITIVE_INFINITY);
    const waitingDays = getClientWaitingDays(task);

    return [
        hasFollowUp ? followMeta.rank : 4,
        hasFollowUp ? followMeta.dateTime : 0,
        hasFollowUp ? waitingSince : -waitingDays,
        waitingSince,
        getTimestampValue(task.created_at, Number.POSITIVE_INFINITY),
        String(task.job_id || task.id || '')
    ];
}

function getDoneSortKey(task = {}) {
    return [
        -getTimestampValue(getTaskCompletedAt(task), 0),
        -getTimestampValue(task.last_moved_at, 0),
        -getTimestampValue(task.updated_at, 0),
        -getTimestampValue(task.created_at, 0),
        String(task.job_id || task.id || '')
    ];
}

function getEarliestDeadlineForSort(task = {}, columnStatus = '') {
    const statusKey = getBoardColumnStatusKey(columnStatus, task);
    const clientDeadline = getTaskClientDeadline(task);
    const internalDeadline = getTaskEffectiveInternalDueDate(task);
    const usesInternalView = shouldUseInternalDeadlineForTask(task);

    if (statusKey === 'client review') return clientDeadline;
    if (statusKey === 'awaiting client') return getClientFollowUpDate(task) || clientDeadline;
    if (statusKey === 'done') return usesInternalView ? (internalDeadline || clientDeadline) : clientDeadline;
    return usesInternalView ? (internalDeadline || clientDeadline) : clientDeadline;
}

function getEarliestDeadlineSortKey(task = {}, columnStatus = '') {
    const deadline = getEarliestDeadlineForSort(task, columnStatus);
    return [
        getDateOnlySortTime(deadline, Number.POSITIVE_INFINITY),
        getTimestampValue(task.created_at, Number.POSITIVE_INFINITY),
        String(task.job_id || task.id || '')
    ];
}

function compareRecentlyAddedTasks(a = {}, b = {}) {
    const timeResult = getTimestampValue(b.created_at, 0) - getTimestampValue(a.created_at, 0);
    if (timeResult !== 0) return timeResult;
    return compareStableTaskIdDesc(a, b);
}

function compareOldestAddedTasks(a = {}, b = {}) {
    const timeResult = getTimestampValue(a.created_at, Number.POSITIVE_INFINITY) - getTimestampValue(b.created_at, Number.POSITIVE_INFINITY);
    if (timeResult !== 0) return timeResult;
    return compareStableTaskIdAsc(a, b);
}

function isMeaningfulActivityLog(log = {}) {
    const action = String(log.action_type || '').toLowerCase();
    return /submitted|approved|status|pic|assign|deadline|due_date|request_updated|edited|revision|note|client|follow|awaiting|done|deleted|progress|deliverable/i.test(action);
}

function getLatestMeaningfulActivityTimestamp(task = {}) {
    const logs = [
        ...getTaskLogs(task.job_id).filter(isMeaningfulActivityLog),
        ...getTaskNoteLogs(task.job_id).map(note => ({ ...note, action_type: 'note_added' }))
    ];
    return logs.reduce((latest, log) => Math.max(latest, getTimestampValue(log.created_at, 0)), 0);
}

function getMeaningfulUpdateTimestamp(task = {}) {
    const explicitMeaningful = getTimestampValue(task.meaningful_updated_at, 0);
    if (explicitMeaningful) return explicitMeaningful;
    const candidates = [
        task.updated_at,
        task.last_moved_at
    ].map(value => getTimestampValue(value, 0)).filter(Boolean);
    candidates.push(getLatestMeaningfulActivityTimestamp(task));
    candidates.push(getTimestampValue(task.created_at, 0));
    return Math.max(...candidates, 0);
}

function compareRecentlyUpdatedTasks(a = {}, b = {}) {
    const updateResult = getMeaningfulUpdateTimestamp(b) - getMeaningfulUpdateTimestamp(a);
    if (updateResult !== 0) return updateResult;
    const createdResult = getTimestampValue(b.created_at, 0) - getTimestampValue(a.created_at, 0);
    if (createdResult !== 0) return createdResult;
    return compareStableTaskIdDesc(a, b);
}

function normalizeSortText(value = '') {
    return String(value || '')
        .trim()
        .replace(/^[^a-z0-9]+/i, '')
        .replace(/\s+/g, ' ')
        .toLowerCase();
}

function getTaskClientSortName(task = {}) {
    const client = [task.client_name, task.client, task.company_name, task.project_client]
        .map(value => String(value || '').trim())
        .find(Boolean);
    return normalizeSortText(client);
}

function getTaskTitleSortName(task = {}) {
    return normalizeSortText(task.project_title || task.title || task.objective || '');
}

function getClientNameSortKey(task = {}, columnStatus = '') {
    const clientName = getTaskClientSortName(task);
    return [
        clientName ? 0 : 1,
        clientName || '',
        getDateOnlySortTime(getEarliestDeadlineForSort(task, columnStatus), Number.POSITIVE_INFINITY),
        getTaskTitleSortName(task),
        getTimestampValue(task.created_at, Number.POSITIVE_INFINITY),
        String(task.job_id || task.id || '')
    ];
}

const BOARD_SORTERS = {
    smart_priority: (a, b, columnStatus) => {
        const keyResult = compareBoardSortKeys(getTaskStatusSortKey(a, columnStatus), getTaskStatusSortKey(b, columnStatus));
        if (keyResult !== 0) return keyResult;
        return compareBoardSortKeys(getStableTaskFallbackKey(a), getStableTaskFallbackKey(b));
    },
    deadline_earliest: (a, b, columnStatus) => {
        const keyResult = compareBoardSortKeys(getEarliestDeadlineSortKey(a, columnStatus), getEarliestDeadlineSortKey(b, columnStatus));
        if (keyResult !== 0) return keyResult;
        return compareBoardSortKeys(getStableTaskFallbackKey(a), getStableTaskFallbackKey(b));
    },
    recently_added: (a, b) => compareRecentlyAddedTasks(a, b),
    oldest_added: (a, b) => compareOldestAddedTasks(a, b),
    recently_updated: (a, b) => compareRecentlyUpdatedTasks(a, b),
    client_az: (a, b, columnStatus) => {
        const keyResult = compareBoardSortKeys(getClientNameSortKey(a, columnStatus), getClientNameSortKey(b, columnStatus));
        if (keyResult !== 0) return keyResult;
        return compareBoardSortKeys(getStableTaskFallbackKey(a), getStableTaskFallbackKey(b));
    }
};

function getTaskStatusSortKey(task = {}, statusName = '') {
    const statusKey = normalizeWorkStatus(statusName || task.work_status || 'not started');
    if (statusKey === 'pending' || /inbox/i.test(String(statusName || ''))) return getInboxSortKey(task);
    if (statusKey === 'client review') return getClientReviewSortKey(task);
    if (statusKey === 'awaiting client') return getAwaitingClientSortKey(task);
    if (statusKey === 'done') return getDoneSortKey(task);
    return getActiveProductionSortKey(task, statusName);
}

function getBoardSortKey(task = {}, columnStatus = '', sortMode = getBoardSortMode()) {
    switch (sortMode) {
        case 'deadline_earliest':
            return getEarliestDeadlineSortKey(task, columnStatus);
        case 'client_az':
            return getClientNameSortKey(task, columnStatus);
        case 'smart_priority':
        default:
            return getTaskStatusSortKey(task, columnStatus);
    }
}

function compareTasksForBoardColumn(a = {}, b = {}, columnStatus = '', sortMode = getBoardSortMode()) {
    const mode = normalizeRequestBoardSortMode(sortMode);
    return (BOARD_SORTERS[mode] || BOARD_SORTERS.smart_priority)(a, b, columnStatus);
}

function sortTasksForBoardColumn(tasks = [], columnStatus = '', sortMode = getBoardSortMode(), viewerContext = {}) {
    const mode = normalizeRequestBoardSortMode(sortMode);
    return [...deduplicateTasks(tasks)].sort((a, b) => compareTasksForBoardColumn(a, b, columnStatus, mode, viewerContext));
}

function sortActiveProductionTasks(tasks = [], columnStatus = '', sortMode = 'smart_priority') {
    return sortTasksForBoardColumn(tasks, columnStatus || 'drafting', sortMode);
}

function sortClientReviewTasks(tasks = [], sortMode = 'smart_priority') {
    return sortTasksForBoardColumn(tasks, 'client review', sortMode);
}

function sortAwaitingClientTasks(tasks = [], sortMode = 'smart_priority') {
    return sortTasksForBoardColumn(tasks, WORK_STATUS_AWAITING_CLIENT, sortMode);
}

function sortDoneTasks(tasks = [], sortMode = 'smart_priority') {
    return sortTasksForBoardColumn(tasks, 'done', sortMode);
}

function sortInboxTasks(tasks = [], sortMode = 'smart_priority') {
    return sortTasksForBoardColumn(tasks, 'pending', sortMode);
}

function sortTasksForStatus(tasks = [], statusName = '', sortMode = 'smart_priority') {
    return sortTasksForBoardColumn(tasks, statusName, sortMode);
}

function compareTasksForStatus(a = {}, b = {}, statusName = '', sortMode = 'smart_priority') {
    return compareTasksForBoardColumn(a, b, statusName, sortMode);
}

function getRequestBoardFilterCounts(tasks = []) {
    const counts = {};
    getVisibleRequestBoardFilters().forEach(filter => counts[filter.id] = 0);
    tasks.forEach(task => {
        const viewMode = shouldUseInternalDeadlineForTask(task) ? 'internal' : 'client';
        const due = getTaskDeadlineForView(task, viewMode);
        const diff = getDateOnlyDiffDays(due);
        const followDiff = getDateOnlyDiffDays(getClientFollowUpDate(task));
        if (counts.all !== undefined) counts.all += 1;
        if (counts.missing_internal !== undefined && !getTaskEffectiveInternalDueDate(task) && String(task.status || '').toLowerCase() === 'approved' && !isTaskDone(task)) counts.missing_internal += 1;
        if (counts.overdue !== undefined && diff !== null && diff < 0 && (viewMode === 'client' || isInternalProductionTask(task))) counts.overdue += 1;
        if (counts.today !== undefined && diff === 0 && (viewMode === 'client' || isInternalProductionTask(task))) counts.today += 1;
        if (counts.week !== undefined && isDateDueWithinWorkingDays(due, 3) && (viewMode === 'client' || isInternalProductionTask(task))) counts.week += 1;
        if (counts.client_blocked !== undefined && isTaskAwaitingClient(task)) counts.client_blocked += 1;
        if (counts.client_review_aging !== undefined && isClientReviewAgingTask(task)) counts.client_review_aging += 1;
        if (counts.followup_due !== undefined && isTaskAwaitingClient(task) && followDiff !== null && followDiff <= 0) counts.followup_due += 1;
        if (counts.followup_overdue !== undefined && isTaskAwaitingClient(task) && followDiff !== null && followDiff < 0) counts.followup_overdue += 1;
    });
    return counts;
}

function taskMatchesRequestBoardFilter(task = {}) {
    const viewMode = shouldUseInternalDeadlineForTask(task) ? 'internal' : 'client';
    const due = getTaskDeadlineForView(task, viewMode);
    const diff = getDateOnlyDiffDays(due);
    const followDiff = getDateOnlyDiffDays(getClientFollowUpDate(task));
    switch (requestBoardDeadlineFilter) {
        case 'overdue': return diff !== null && diff < 0 && (viewMode === 'client' || isInternalProductionTask(task));
        case 'today': return diff === 0 && (viewMode === 'client' || isInternalProductionTask(task));
        case 'week': return isDateDueWithinWorkingDays(due, 3) && (viewMode === 'client' || isInternalProductionTask(task));
        case 'missing_internal': return getVisibleRequestBoardFilters().some(filter => filter.id === 'missing_internal') && !getTaskEffectiveInternalDueDate(task) && String(task.status || '').toLowerCase() === 'approved' && !isTaskDone(task);
        case 'client_blocked': return isTaskAwaitingClient(task);
        case 'client_review_aging': return isClientReviewAgingTask(task);
        case 'followup_due': return isTaskAwaitingClient(task) && followDiff !== null && followDiff <= 0;
        case 'followup_overdue': return isTaskAwaitingClient(task) && followDiff !== null && followDiff < 0;
        default: return true;
    }
}

function getVisibleRequestBoardFilters() {
    if (hasAdminAccess() || isCurrentUserCreativeTeamMember()) return REQUEST_BOARD_FILTERS;
    return REQUEST_BOARD_FILTERS.filter(filter => !['missing_internal', 'followup_due', 'followup_overdue'].includes(filter.id));
}

function renderRequestBoardFilters(tasks = []) {
    const shell = document.getElementById('requestDeadlineFilters');
    if (!shell) return;
    const filters = getVisibleRequestBoardFilters();
    if (!filters.some(filter => filter.id === requestBoardDeadlineFilter)) requestBoardDeadlineFilter = 'all';
    const counts = getRequestBoardFilterCounts(tasks);
    const hiddenAssignedCount = lastAssignedRegionVisibility.hidden.length;
    const hiddenAssignedAction = hiddenAssignedCount
        ? `<button type="button" class="request-filter-chip request-filter-action" onclick="filterByRegion('all')" title="Show assigned tasks across all regions"><span>Assigned Hidden</span><strong>${hiddenAssignedCount}</strong></button>`
        : '';
    const bulkAction = hasDeadlineEditAccess() && counts.missing_internal
        ? `<button type="button" class="request-filter-chip request-filter-action" onclick="openBulkInternalDueModal(event)"><span>Generate Due Dates</span><strong>${counts.missing_internal}</strong></button>`
        : '';
    shell.innerHTML = filters.map(filter => `
        <button type="button" class="request-filter-chip ${requestBoardDeadlineFilter === filter.id ? 'active' : ''}" onclick="setRequestBoardFilter('${filter.id}')">
            <span>${escapeHtml(filter.label)}</span>
            <strong>${counts[filter.id] || 0}</strong>
        </button>
    `).join('') + hiddenAssignedAction + bulkAction;
}

function setRequestBoardFilter(filterId) {
    requestBoardDeadlineFilter = getVisibleRequestBoardFilters().some(filter => filter.id === filterId) ? filterId : 'all';
    renderBoards();
    if (typeof isKanbanMode !== 'undefined' && isKanbanMode) renderKanbanBoard();
}

function getFlag(region) {
    return getCountryConfig(region).flag;
}

function filterDataByRegion(data, regionFilter) {
    if (regionFilter === 'all') return data;
    if (regionFilter === 'Global') {
        const primaryNames = WORKSPACE_COUNTRIES.filter(country => country.primary).map(country => country.name.toLowerCase());
        return data.filter(d => !primaryNames.includes(String(d.region || '').toLowerCase()));
    }
    return data.filter(d => String(d.region).toLowerCase() === String(regionFilter).toLowerCase());
}

function parseIdentityValue(value) {
    if (value === null || value === undefined) return [];
    if (Array.isArray(value)) return value.flatMap(parseIdentityValue);
    if (typeof value === 'object') {
        const identityFields = [
            'name', 'member_name', 'full_name', 'display_name',
            'email', 'member_email', 'member_key', 'id', 'member_id', 'team_member_id',
            'auth_user_id', 'user_id', 'uuid'
        ];
        return identityFields.flatMap(field => parseIdentityValue(value[field]));
    }

    const raw = String(value || '').trim();
    if (!raw || raw === 'null' || raw === 'undefined' || raw === 'Unassigned') return [];

    if (/^[\[{]/.test(raw)) {
        try {
            const parsed = JSON.parse(raw);
            return parseIdentityValue(parsed);
        } catch(e) {}
    }

    return raw
        .split(',')
        .map(part => part.trim())
        .filter(Boolean);
}

function uniqueIdentityValues(values = []) {
    const seen = new Set();
    return values.filter(value => {
        const key = normalizeNameKey(value);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function getMemberIdentityValues(member = {}) {
    return uniqueIdentityValues(parseIdentityValue({
        name: member.name,
        member_name: member.member_name,
        full_name: member.full_name,
        display_name: member.display_name,
        email: member.email,
        member_email: member.member_email,
        member_key: member.member_key,
        id: member.id,
        member_id: member.member_id,
        team_member_id: member.team_member_id,
        auth_user_id: member.auth_user_id,
        user_id: member.user_id,
        uuid: member.uuid
    }));
}

function getCurrentUserAccessContext() {
    const currentUser = getCurrentUserName();
    const member = getCurrentUserMember();
    return {
        name: currentUser,
        member,
        identityValues: uniqueIdentityValues([
            currentUser,
            ...getMemberIdentityValues(member || {})
        ])
    };
}

function getTaskAssigneeIdentityValues(task = {}) {
    return uniqueIdentityValues([
        ...parseIdentityValue(task.assignee),
        ...parseIdentityValue(task.creative_pic),
        ...parseIdentityValue(task.creative_pics),
        ...parseIdentityValue(task.pic),
        ...parseIdentityValue(task.assigned_pic),
        ...parseIdentityValue(task.assigned_pics),
        ...parseIdentityValue(task.assigned_pic_names),
        ...parseIdentityValue(task.assignee_names),
        ...parseIdentityValue(task.assignee_ids),
        ...parseIdentityValue(task.assignee_member_ids),
        ...parseIdentityValue(task.assigned_pic_member_ids),
        ...parseIdentityValue(task.assigned_pic_member_keys),
        ...parseIdentityValue(task.assigned_pic_auth_user_ids)
    ]);
}

function identityValuesMatch(left, right) {
    const a = String(left || '').trim();
    const b = String(right || '').trim();
    if (!a || !b) return false;
    const aKey = normalizeNameKey(a);
    const bKey = normalizeNameKey(b);
    if (aKey === bKey) return true;
    if (a.includes('@') || b.includes('@')) return a.toLowerCase() === b.toLowerCase();

    const aFirst = aKey.split(' ')[0];
    const bFirst = bKey.split(' ')[0];
    if (aFirst && bFirst && aFirst === bFirst) {
        const memberMatch = getActiveTeamMembers().find(member =>
            getMemberIdentityValues(member).some(value => normalizeNameKey(value) === aKey || normalizeNameKey(value) === bKey)
        );
        return Boolean(memberMatch);
    }

    return false;
}

function isTaskAssignedToUser(task = {}, context = getCurrentUserAccessContext()) {
    if (!context.identityValues.length) return false;
    const assigneeValues = getTaskAssigneeIdentityValues(task);
    return assigneeValues.some(assigneeValue =>
        context.identityValues.some(userValue => identityValuesMatch(assigneeValue, userValue))
    );
}

function isTaskRequesterForUser(task = {}, context = getCurrentUserAccessContext()) {
    if (!context.identityValues.length) return false;
    const requesterValues = uniqueIdentityValues([
        ...parseIdentityValue(task.requester_name),
        ...parseIdentityValue(task.requester),
        ...parseIdentityValue(task.requester_email),
        ...parseIdentityValue(task.requester_id),
        ...parseIdentityValue(task.created_by)
    ]);
    return requesterValues.some(requesterValue =>
        context.identityValues.some(userValue => identityValuesMatch(requesterValue, userValue))
    );
}

function isTaskOtherRoleForUser(task = {}, context = getCurrentUserAccessContext()) {
    if (!context.identityValues.length) return false;
    const roleValues = uniqueIdentityValues([
        ...parseIdentityValue(task.approver),
        ...parseIdentityValue(task.client_follow_up_owner),
        ...parseIdentityValue(task.follow_up_owner),
        ...parseIdentityValue(task.owner),
        ...parseIdentityValue(task.lead)
    ]);
    return roleValues.some(roleValue =>
        context.identityValues.some(userValue => identityValuesMatch(roleValue, userValue))
    );
}

function taskMatchesRegionFilter(task = {}, regionFilter = 'all') {
    return filterDataByRegion([task], regionFilter).length > 0;
}

function canCurrentUserViewTask(task = {}, options = {}) {
    const context = options.context || getCurrentUserAccessContext();
    if (hasAdminAccess() || isSuperAdmin) return true;
    if (isTaskRequesterForUser(task, context)) return true;
    if (isTaskAssignedToUser(task, context)) return true;
    if (isTaskOtherRoleForUser(task, context)) return true;
    return false;
}

function filterTasksForCurrentAccess(data = [], options = {}) {
    const rows = Array.isArray(data) ? data : [];
    const context = getCurrentUserAccessContext();
    const viewerHasGlobalAccess = hasAdminAccess() || isSuperAdmin;
    const regionFilter = options.regionFilter || currentRegionFilter || 'all';

    lastAssignedRegionVisibility = { hidden: [], visible: [] };

    return rows.filter(task => {
        const assignedToCurrentUser = isTaskAssignedToUser(task, context);
        const authorised = viewerHasGlobalAccess || canCurrentUserViewTask(task, { context });
        const regionMatch = taskMatchesRegionFilter(task, regionFilter);

        if (assignedToCurrentUser) {
            if (!regionMatch && regionFilter !== 'all') lastAssignedRegionVisibility.hidden.push(task);
            else lastAssignedRegionVisibility.visible.push(task);
        }

        return authorised && regionMatch;
    });
}

function cleanPostgrestFilterValue(value) {
    return String(value || '')
        .replace(/[,%*()']/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function getCurrentAccessQueryIdentities(context = getCurrentUserAccessContext()) {
    return uniqueIdentityValues([
        context.name,
        ...context.identityValues
    ])
        .map(cleanPostgrestFilterValue)
        .filter(value => value.length >= 2)
        .slice(0, 16);
}

function buildLegacyCreativeRequestAccessFilter(fieldNames = []) {
    const identities = getCurrentAccessQueryIdentities();
    const safeFields = (fieldNames || []).filter(Boolean);
    if (!identities.length || !safeFields.length) return '';
    return safeFields
        .flatMap(field => identities.map(identity => `${field}.ilike.*${identity}*`))
        .join(',');
}

async function fetchCreativeRequestsForCurrentAccess() {
    const baseQuery = () => supabaseClient
        .from('creative_requests')
        .select('*')
        .order('created_at', { ascending: false });

    if (hasAdminAccess() || isSuperAdmin) return await baseQuery();

    const fullRoleFields = ['assignee', 'requester_name', 'approver', 'client_follow_up_owner', 'follow_up_owner', 'owner', 'lead'];
    const knownLegacyFields = ['assignee', 'requester_name'];
    let availableRoleFields = knownLegacyFields;

    // Which of these columns actually exist never changes during a session (it's a schema fact,
    // not data), so this probe used to fire a `select('*').limit(1)` on every single full sync —
    // once cached, it never needs to run again this session.
    if (cachedCreativeRequestRoleFields) {
        availableRoleFields = cachedCreativeRequestRoleFields;
    } else {
        try {
            const { data: sampleRows } = await supabaseClient
                .from('creative_requests')
                .select('*')
                .limit(1);
            const sample = Array.isArray(sampleRows) ? (sampleRows[0] || {}) : {};
            const detectedFields = fullRoleFields.filter(field => Object.prototype.hasOwnProperty.call(sample, field));
            if (detectedFields.length) {
                availableRoleFields = detectedFields;
                cachedCreativeRequestRoleFields = detectedFields;
            }
        } catch(e) {}
    }

    const fullFilter = buildLegacyCreativeRequestAccessFilter(availableRoleFields);
    const legacyFilter = buildLegacyCreativeRequestAccessFilter(knownLegacyFields);

    if (!legacyFilter) return { data: [], error: null };

    let result = fullFilter ? await baseQuery().or(fullFilter) : { data: [], error: null };
    if (result.error && /column|schema|parse|syntax|filter/i.test(String(result.error.message || ''))) {
        result = await baseQuery().or(legacyFilter);
    }
    return result;
}

function filterTaskScopedRowsForCurrentAccess(rows = []) {
    const list = Array.isArray(rows) ? rows : [];
    if (hasAdminAccess() || isSuperAdmin) return list;
    const allowedJobIds = new Set((globalData || []).map(task => String(task.job_id || '')).filter(Boolean));
    return list.filter(row => allowedJobIds.has(String(row.job_id || '')));
}

/**
 * This used to eagerly pull up to 5000 rows x full columns from BOTH task_activity_logs and
 * task_note_logs on every single sync (initial load, every realtime tick, every tab-visibility
 * refresh) just so board cards could show a note-count badge and the detail modal had history
 * pre-warmed. That was the single largest source of Supabase egress in the app.
 *
 * Now: note counts for cards come from a lightweight job_id-only bulk query below (no note text,
 * actor, or timestamps transferred). Full per-task activity/note history is loaded on demand only
 * when that task's detail modal is opened (see fetchTaskLogsForJob) or when an admin explicitly
 * exports the report pack (see fetchAndMergeTaskLogs). The Settings "recent changes" widget pulls
 * its own small slice (see fetchRecentActivityForSettings).
 */
async function fetchTaskRelatedLogsForCurrentAccess() {
    await Promise.all([
        fetchNoteCountsForCurrentAccess(),
        fetchShootReadinessSummaryForCurrentAccess()
    ]);
}

// Lightweight bulk pull (job_id/phase/item_key/completed only — no owner/note/timestamps) so every
// visible Shooting card can show a readiness chip on the Board without an N-query-per-card cost.
// Scoped to job_ids already in globalData, which is itself already access-filtered, so this never
// reads beyond what the current user could already see.
async function fetchShootReadinessSummaryForCurrentAccess() {
    const shootingJobs = (globalData || []).filter(task => getRequestTypeMeta(task).key === 'shooting' && String(task.status || '').toLowerCase() !== 'deleted');
    const jobIds = [...new Set(shootingJobs.map(task => String(task.job_id || '')).filter(Boolean))];
    if (!jobIds.length) { shootReadinessByJob = {}; return; }

    try {
        const { data, error } = await supabaseClient.from('shoot_checklist_items').select('job_id, phase, item_key, completed').in('job_id', jobIds);
        if (error) throw error;

        const rowsByJob = {};
        (data || []).forEach(row => {
            (rowsByJob[row.job_id] || (rowsByJob[row.job_id] = [])).push(row);
        });

        const next = {};
        shootingJobs.forEach(task => { next[task.job_id] = computeShootReadiness(task, rowsByJob[task.job_id] || []); });
        shootReadinessByJob = next;
    } catch (e) {
        console.log('Shoot readiness summary fetch failed:', e.message);
    }
}

async function fetchNoteCountsForCurrentAccess() {
    const authorisedJobIds = [...new Set((globalData || []).map(task => String(task.job_id || '')).filter(Boolean))];
    if (!authorisedJobIds.length) { noteCountByJobId = new Map(); return; }
    const shouldNarrow = !(hasAdminAccess() || isSuperAdmin);

    try {
        let noteQuery = supabaseClient.from('task_note_logs').select('job_id');
        if (shouldNarrow) noteQuery = noteQuery.in('job_id', authorisedJobIds);
        const { data, error } = await noteQuery;
        if (error) throw error;
        const map = new Map();
        (data || []).forEach(row => {
            const key = String(row.job_id || '');
            if (key) map.set(key, (map.get(key) || 0) + 1);
        });
        noteCountByJobId = map;
    } catch(e) {
        console.log('Note count fetch failed:', e.message);
    }
}

/**
 * Loads full activity + note history for a specific set of tasks and merges it into the
 * globalActivityLogs/globalNoteLogs caches that getTaskLogs()/getTaskNoteLogs() read from — used
 * both for opening a single task's detail modal and for the admin report export (many tasks at
 * once). Chunked because a large `.in()` list can hit URL length limits.
 */
async function fetchAndMergeTaskLogs(jobIds = []) {
    const ids = [...new Set((jobIds || []).map(id => String(id || '')).filter(Boolean))];
    if (!ids.length) return;
    const idSet = new Set(ids);
    const CHUNK = 150;
    const chunks = [];
    for (let i = 0; i < ids.length; i += CHUNK) chunks.push(ids.slice(i, i + CHUNK));

    try {
        const [activityChunks, noteChunks] = await Promise.all([
            Promise.all(chunks.map(chunk => supabaseClient.from('task_activity_logs').select('*').in('job_id', chunk).order('created_at', { ascending: false }))),
            Promise.all(chunks.map(chunk => supabaseClient.from('task_note_logs').select('*').in('job_id', chunk).order('created_at', { ascending: false })))
        ]);

        const freshActivity = activityChunks.flatMap(r => (r.error ? [] : (r.data || []))).map(normalizeLogRow);
        const freshNotes = noteChunks.flatMap(r => (r.error ? [] : (r.data || []))).map(normalizeNoteRow);

        const localActivity = filterTaskScopedRowsForCurrentAccess(getLocalActivityLogs().map(normalizeLogRow)).filter(l => idSet.has(l.job_id));
        const localNotes = filterTaskScopedRowsForCurrentAccess(getLocalNoteLogs().map(normalizeNoteRow)).filter(l => idSet.has(l.job_id));

        globalActivityLogs = dedupeActivityLogRows([
            ...freshActivity, ...localActivity,
            ...(globalActivityLogs || []).filter(l => !idSet.has(l.job_id))
        ]);
        globalNoteLogs = dedupeNoteLogRows([
            ...freshNotes, ...localNotes,
            ...(globalNoteLogs || []).filter(l => !idSet.has(l.job_id))
        ]);

        const countMap = noteCountByJobId || new Map();
        const freshNoteCountByJob = new Map();
        freshNotes.forEach(n => freshNoteCountByJob.set(n.job_id, (freshNoteCountByJob.get(n.job_id) || 0) + 1));
        ids.forEach(id => countMap.set(id, freshNoteCountByJob.get(id) || 0));
        noteCountByJobId = countMap;
    } catch(e) {
        console.warn('Task log fetch failed:', e.message);
    }
}

// Loads full activity + note history for exactly one task — called when its detail modal opens.
async function fetchTaskLogsForJob(jobID) {
    if (!jobID) return;
    await fetchAndMergeTaskLogs([jobID]);
}

// Small bounded slice for the Settings "recent changes" widget — that only ever shows the latest
// 4 entries, so there's no reason to hold the whole activity table in memory for it.
async function fetchRecentActivityForSettings() {
    try {
        const { data, error } = await supabaseClient
            .from('task_activity_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        if (error) throw error;
        globalActivityLogs = dedupeActivityLogRows([...(data || []).map(normalizeLogRow), ...(globalActivityLogs || [])]);
    } catch(e) {
        console.log('Recent activity fetch failed:', e.message);
    }
}

function closeDetailModalIfCurrentTaskRestricted() {
    const modal = document.getElementById('globalDetailModal');
    if (!modal || !modal.classList.contains('show')) return;
    const currentJobId = modal.dataset.currentJobId || '';
    if (!currentJobId) return;
    const stillAuthorised = (globalData || []).some(task => String(task.job_id || '') === String(currentJobId));
    if (stillAuthorised) return;
    closeDetailModal();
    showAppleAlert('Access Updated', 'This task is no longer available in your authorised workspace view.', { tone: 'warning', icon: 'shield-alert' });
}

function updateLiveClock() {
    const timeDisplay = document.getElementById('currentTimeDisplay'); if (!timeDisplay) return;
    const activeRegion = isSuperAdmin ? currentRegionFilter : userRegion;
    const tz = getCountryConfig(activeRegion).timezone || 'Asia/Kuala_Lumpur';
    const now = new Date(); let timeString = '';
    try { timeString = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).format(now); } catch(e) { timeString = now.toLocaleTimeString('en-US'); }
    timeDisplay.innerText = timeString;
}

function playSuccessSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext; if (!AudioContext) return;
        const ctx = new AudioContext(); const playTone = (freq, startTime, duration, vol) => {
            const osc = ctx.createOscillator(); const gain = ctx.createGain();
            osc.type = 'sine'; osc.frequency.setValueAtTime(freq, startTime);
            gain.gain.setValueAtTime(0, startTime); gain.gain.linearRampToValueAtTime(vol, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            osc.connect(gain); gain.connect(ctx.destination); osc.start(startTime); osc.stop(startTime + duration);
        };
        const now = ctx.currentTime; playTone(523.25, now, 0.4, 0.2); playTone(659.25, now + 0.15, 0.6, 0.25);
    } catch (e) {}
}

let gasWarmupAt = 0;
function warmPlaybookGenerator() {
    const now = Date.now();
    if (now - gasWarmupAt < 5 * 60 * 1000) return;
    gasWarmupAt = now;

    fetch(GAS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'ping' }),
        keepalive: true
    }).catch(() => {});
}

let notifTimeout;
let appleConfirmResolver = null;

function showNotification(title, subtitle, callback) {
    playSuccessSound();
    const overlay = document.getElementById('successOverlay');
    const main = document.getElementById('successMainText');
    const sub = document.getElementById('successSubText');
    if (!overlay || !main || !sub) return;

    main.innerText = title;
    sub.innerText = subtitle || '';
    sub.style.display = subtitle ? 'block' : 'none';
    overlay.classList.add('show');
    clearTimeout(notifTimeout);
    notifTimeout = setTimeout(() => {
        overlay.classList.remove('show');
        if (callback) setTimeout(callback, 260);
    }, 2200);
}

function configureAppleDialog({ title, msg, icon = 'sparkles', tone = 'default', confirmText = 'OK', cancelText = '', singleAction = true }) {
    const overlay = document.getElementById('appleAlert');
    const iconWrap = document.getElementById('alertIcon');
    const okBtn = document.getElementById('alertOkBtn');
    const cancelBtn = document.getElementById('alertCancelBtn');
    const actions = overlay?.querySelector('.apple-alert-actions');
    if (!overlay || !okBtn || !cancelBtn || !actions) return null;

    document.getElementById('alertTitle').innerText = title;
    document.getElementById('alertMsg').innerText = msg;
    iconWrap.className = `apple-alert-icon ${tone === 'danger' ? 'danger' : tone === 'success' ? 'success' : ''}`.trim();
    iconWrap.innerHTML = `<i data-lucide="${icon}"></i>`;
    okBtn.innerText = confirmText;
    okBtn.className = `apple-alert-btn primary ${tone === 'danger' ? 'danger' : ''}`.trim();
    cancelBtn.innerText = cancelText || 'Cancel';
    cancelBtn.style.display = singleAction ? 'none' : 'inline-flex';
    actions.classList.toggle('single', singleAction);
    overlay.dataset.mode = singleAction ? 'alert' : 'confirm';
    document.body.classList.add('no-scroll');
    overlay.classList.add('show');
    refreshIcons();
    return overlay;
}

function showAppleAlert(title, msg, options = {}) {
    appleConfirmResolver = null;
    configureAppleDialog({
        title,
        msg,
        icon: options.icon || 'sparkles',
        tone: options.tone || 'default',
        confirmText: options.confirmText || 'OK',
        singleAction: true
    });
}

function showAppleConfirm(title, msg, options = {}) {
    return new Promise(resolve => {
        appleConfirmResolver = resolve;
        configureAppleDialog({
            title,
            msg,
            icon: options.icon || 'alert-triangle',
            tone: options.tone || 'danger',
            confirmText: options.confirmText || 'Confirm',
            cancelText: options.cancelText || 'Cancel',
            singleAction: false
        });
    });
}

function resolveAppleConfirm(value) {
    const resolver = appleConfirmResolver;
    appleConfirmResolver = null;
    closeAppleAlert();
    if (resolver) resolver(Boolean(value));
}

function closeAppleAlert() {
    const overlay = document.getElementById('appleAlert');
    if (!overlay) return;
    const resolver = appleConfirmResolver;
    appleConfirmResolver = null;
    overlay.classList.remove('show');
    document.body.classList.remove('no-scroll');
    if (resolver) resolver(false);
}

// Fungsi untuk paparkan panduan Creative Brief
function showBriefGuide() {
    const guideText = `
        A good brief helps the creative team nail the design on the first try! Here's an example:

        [MAIN MESSAGE / HOOK]:
        "Get 50% Off All Winter Gear! Limited Time Only." (Make the 50% pop!)

        [TARGET AUDIENCE]:
        Young adults (18-35) who love outdoor activities.

        [TONE & VIBE]:
        Energetic, adventurous, and slightly edgy. Use dark backgrounds with neon highlights.

        [MANDATORY LOGO / TEXT]:
        Must include the standard company logo at the bottom right. Do not use cursive fonts.
    `;
    // Kita guna fungsi alert sedia ada kau untuk tunjukkan panduan ni
    showAppleAlert("How to write a good Brief?", guideText);
}

function showApplePrompt(title, desc, isPassword = false, validateFn = null) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('iosPrompt'); const promptBox = document.querySelector('.ios-prompt-box');
        let oldInput = document.getElementById('iosPromptInput'); let input = oldInput.cloneNode(true); oldInput.parentNode.replaceChild(input, oldInput);
        let oldBtnConfirm = document.getElementById('iosPromptConfirm'); let btnConfirm = oldBtnConfirm.cloneNode(true); oldBtnConfirm.parentNode.replaceChild(btnConfirm, oldBtnConfirm);
        let oldBtnCancel = document.getElementById('iosPromptCancel'); let btnCancel = oldBtnCancel.cloneNode(true); oldBtnCancel.parentNode.replaceChild(btnCancel, oldBtnCancel);

        document.getElementById('iosPromptTitle').innerText = title; document.getElementById('iosPromptDesc').innerText = desc;

        // LOGIK BARU: Tukar placeholder berdasarkan jenis input
        input.type = isPassword ? 'password' : 'text';
        input.placeholder = isPassword ? 'PIN / Passcode' : 'Type number here...';

        input.value = ''; btnConfirm.innerHTML = 'OK'; btnConfirm.disabled = false; input.disabled = false;
        document.body.classList.add('no-scroll');
        overlay.classList.add('show'); setTimeout(() => input.focus(), 100); let isProcessing = false;

        const cleanUp = () => { overlay.classList.remove('show'); btnConfirm.removeEventListener('click', onConfirm); btnCancel.removeEventListener('click', onCancel); input.removeEventListener('keypress', onEnter); document.body.classList.remove('no-scroll'); };
        const onConfirm = async () => {
            if(isProcessing) return;
            if (validateFn) {
                isProcessing = true; const originalHtml = 'OK'; btnConfirm.innerHTML = '<i data-lucide="loader-2" class="spin" style="width:16px;height:16px;vertical-align:middle;margin-right:5px;"></i> Verifying...'; btnConfirm.disabled = true; input.disabled = true; refreshIcons();
                const isValid = await validateFn(input.value);
                if (isValid) { cleanUp(); resolve(input.value); } else {
                    btnConfirm.innerHTML = '❌ Wrong PIN'; btnConfirm.style.color = 'var(--red)'; promptBox.style.animation = 'shake 0.4s ease';
                    setTimeout(() => { promptBox.style.animation = ''; btnConfirm.innerHTML = originalHtml; btnConfirm.style.color = ''; btnConfirm.disabled = false; input.disabled = false; input.value = ''; input.focus(); isProcessing = false; }, 1000);
                }
            } else { cleanUp(); resolve(input.value); }
        };
        const onCancel = () => { if(!isProcessing) { cleanUp(); resolve(null); } }; const onEnter = (e) => { if (e.key === 'Enter') onConfirm(); };
        btnConfirm.addEventListener('click', onConfirm); btnCancel.addEventListener('click', onCancel); input.addEventListener('keypress', onEnter);
    });
}
function extractFirstName(fullName) {
    if (!fullName) return ""; let cleanName = fullName;
    if (cleanName.includes('-')) cleanName = cleanName.split('-')[1].trim();
    return cleanName.split(' ')[0];
}

function syncLeaveSession() {
    const startInput = document.getElementById('leaveStart');
    const endInput = document.getElementById('leaveEnd');
    const typeInput = document.getElementById('leaveType');
    const sessionGroup = document.getElementById('leaveSessionGroup');
    const sessionInput = document.getElementById('leaveSession');

    // Logik asal: halang pilih tarikh belakang
    if (startInput && endInput && startInput.value) {
        endInput.min = startInput.value;
        if (!endInput.value || endInput.value < startInput.value) {
            endInput.value = startInput.value;
        }
    }

    // 🌟 Logik Pintar: Tunjuk AM/PM kalau Annual Leave DAN cuti 1 hari sahaja
    if (startInput && endInput && typeInput && sessionGroup) {
        if (startInput.value === endInput.value && typeInput.value === 'Annual Leave') {
            sessionGroup.style.display = 'block';
        } else {
            sessionGroup.style.display = 'none';
            if(sessionInput) sessionInput.value = 'Full Day'; // Auto reset
        }
    }
}

function setPresetDate() {
    const today = new Date(); const offset = today.getTimezoneOffset() * 60000; const localISOTime = (new Date(today - offset)).toISOString().slice(0, -1);
    const todayStr = localISOTime.split('T')[0];
    const pDeadline = document.getElementById('pDeadline'); const leaveStart = document.getElementById('leaveStart'); const leaveEnd = document.getElementById('leaveEnd');
    if(pDeadline) { pDeadline.value = todayStr; pDeadline.min = todayStr; }
    if(leaveStart) leaveStart.value = todayStr; if(leaveEnd) leaveEnd.value = todayStr;

    // Reset Session & Sync
    if(document.getElementById('leaveSession')) document.getElementById('leaveSession').value = 'Full Day';
    syncLeaveSession();
}

// ========================================================
// 🌟 3. FORM HELPERS & GATEWAY
// ========================================================

window.lockEndOfMonth = function(val) {
    if(!val) return;
    const [year, month] = val.split('-');
    const lastDay = new Date(year, month, 0);
    const offset = lastDay.getTimezoneOffset() * 60000;
    const formatted = new Date(lastDay - offset).toISOString().split('T')[0];
    const dateInput = document.getElementById('pDeadline');
    if(dateInput) dateInput.value = formatted;
}

function updateDateLogic(jobType) {
    const dateInput = document.getElementById('pDeadline');
    const dateLabel = document.getElementById('deadlineLabel');
    const helperText = document.getElementById('deadlineHelper');
    if (!dateInput || !dateLabel || !helperText) return;

    const showDeadlineGuidance = () => {
        const rule = getInternalDueRule({
            job_type: jobType,
            request_type: currentRequestType,
            client_deadline: dateInput.value
        });
        const suggestion = generateSuggestedInternalDue(dateInput.value, rule.bufferDays);
        let message = 'The final date you need the completed work.';
        let tone = 'var(--text-muted)';
        if (suggestion.flag === 'short-lead-time') {
            message = 'Short lead time. This request provides less than the recommended production and review time.';
            tone = 'var(--orange)';
        } else if (suggestion.flag === 'same-day') {
            message = 'Same-day request. The team may need admin review before production starts.';
            tone = 'var(--red)';
        } else if (suggestion.flag === 'client-deadline-passed') {
            message = 'This deadline has passed. Please choose today or a future date.';
            tone = 'var(--red)';
        }
        helperText.style.display = 'block';
        helperText.style.color = tone;
        helperText.innerText = message;
    };

    if (jobType === 'Monthly Content Plan') {
        dateLabel.innerText = 'Client deadline';
        dateInput.readOnly = true;
        dateInput.style.pointerEvents = 'none';
        dateInput.style.opacity = '0.5';
        dateInput.value = '';

    } else if (jobType === 'Pitch Deck Proposal') {
        dateLabel.innerText = 'Client deadline';

        dateInput.readOnly = false;
        dateInput.style.pointerEvents = 'auto';
        dateInput.style.opacity = '1';
        dateInput.min = toDateInputValue(new Date());
        dateInput.onchange = showDeadlineGuidance;

    } else {
        dateLabel.innerText = 'Client deadline';
        dateInput.readOnly = false;
        dateInput.style.pointerEvents = 'auto';
        dateInput.style.opacity = '1';
        dateInput.min = toDateInputValue(new Date());
        dateInput.onchange = showDeadlineGuidance;
    }
    showDeadlineGuidance();
}

function selectRequestType(type) {
    currentRequestType = type;
    document.getElementById('request-gateway').style.display = 'none';
    document.getElementById('requestSubtitle').style.display = 'none';

    // Shooting gets its own dedicated single-scroll form (see #shooting-form-area) instead of the
    // shared Ad-hoc/Monthly/Pitch step wizard — its field set is different enough that threading it
    // into the shared step containers would risk the other three request types, for no real benefit.
    if (type === 'shooting') {
        document.getElementById('request-form-area').style.display = 'none';
        openShootingRequestForm();
        return;
    }

    document.getElementById('request-form-area').style.display = 'block';

    const badge = document.getElementById('formBadge');

    const jobTypesCont = document.getElementById('jobTypesContainer');
    const monthlyCont = document.getElementById('monthlyFieldsContainer');
    const pitchFieldsCont = document.getElementById('pitchFieldsContainer');
    const standardBriefCont = document.getElementById('standardBriefContainer');
    const pitchBriefCont = document.getElementById('pitchBriefContainer');
    const deliverablesCont = document.getElementById('deliverablesContainer');

    if(type === 'monthly') {
        if(jobTypesCont) jobTypesCont.style.display = 'none';
        if(monthlyCont) monthlyCont.style.display = 'block';
        if(pitchFieldsCont) pitchFieldsCont.style.display = 'none';

        if(standardBriefCont) standardBriefCont.style.display = 'block';
        if(pitchBriefCont) pitchBriefCont.style.display = 'none';
        if(deliverablesCont) deliverablesCont.style.display = 'none';

        badge.innerText = "MONTHLY PLAN"; badge.style.color = "#8b5cf6"; badge.style.borderColor = "#c4b5fd"; badge.style.background = "#f5f3ff";
        updateDateLogic('Monthly Content Plan');

    } else if (type === 'pitch') {
        if(jobTypesCont) jobTypesCont.style.display = 'none';
        if(monthlyCont) monthlyCont.style.display = 'none';
        if(pitchFieldsCont) pitchFieldsCont.style.display = 'block';

        if(standardBriefCont) standardBriefCont.style.display = 'none';
        if(pitchBriefCont) pitchBriefCont.style.display = 'block';
        if(deliverablesCont) deliverablesCont.style.display = 'none';

        badge.innerText = "PITCH DECK PROPOSAL"; badge.style.color = "var(--orange)"; badge.style.borderColor = "rgba(245, 158, 11, 0.4)"; badge.style.background = "rgba(245, 158, 11, 0.1)";
        updateDateLogic('Pitch Deck Proposal');

    } else {
        if(jobTypesCont) jobTypesCont.style.display = 'block';
        if(monthlyCont) monthlyCont.style.display = 'none';
        if(pitchFieldsCont) pitchFieldsCont.style.display = 'none';

        if(standardBriefCont) standardBriefCont.style.display = 'block';
        if(pitchBriefCont) pitchBriefCont.style.display = 'none';
        if(deliverablesCont) deliverablesCont.style.display = 'block';

        badge.innerText = "AD-HOC REQUEST"; badge.style.color = "var(--accent)"; badge.style.borderColor = "var(--border-main)"; badge.style.background = "var(--bg-box)";
        updateDateLogic('Ad-Hoc');
    }
    goToStep(1); window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetRequestGateway() {
    const gateway = document.getElementById('request-gateway');
    if(gateway) {
        gateway.style.display = 'grid';
        document.getElementById('requestSubtitle').style.display = 'block';
        document.getElementById('request-form-area').style.display = 'none';
        document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));
    }
    const shootingArea = document.getElementById('shooting-form-area');
    if (shootingArea) shootingArea.style.display = 'none';
}

function addSizeRow() {
    const container = document.getElementById('dynamicSizeContainer');
    const row = document.createElement('div'); row.className = 'size-row';
    row.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; animation: fadeIn 0.3s ease;';
    row.innerHTML = `<input type="text" class="dyn-size-detail" placeholder="Detail (e.g. Top 5 Performance)" style="flex: 2; min-width: 150px; padding: 10px; border: 1px solid var(--border-main); border-radius: 8px; background: var(--bg-input); color: var(--text-main);"><input type="text" class="dyn-size-input" list="sizeOptions" placeholder="Size (e.g. 1080x1080px)" style="flex: 1.5; min-width: 120px; padding: 10px; border: 1px solid var(--border-main); border-radius: 8px; background: var(--bg-input); color: var(--text-main);"><input type="text" class="dyn-size-notes" placeholder="Notes (e.g. 2 sets)" style="flex: 1; min-width: 100px; padding: 10px; border: 1px solid var(--border-main); border-radius: 8px; background: var(--bg-input); color: var(--text-main);"><button type="button" onclick="this.parentElement.remove()" style="background: transparent; border: none; color: var(--red); cursor: pointer; padding: 0 5px; display: flex; align-items: center;"><i data-lucide="x" style="width: 18px;"></i></button>`;
    container.appendChild(row); refreshIcons();
}

function resetFormUI() {
    document.getElementById('mStatic').value = ''; document.getElementById('mVideo').value = ''; document.getElementById('mCarousel').value = ''; if(document.getElementById('mCaption')) document.getElementById('mCaption').value = ''; document.getElementById('pMonthlyPlan').value = '';
    const sizeContainer = document.getElementById('dynamicSizeContainer');
    sizeContainer.innerHTML = `<div class="size-row" style="display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;"><input type="text" class="dyn-size-detail" placeholder="Detail (e.g. Top 5 Performance)" style="flex: 2; min-width: 150px; padding: 10px; border: 1px solid var(--border-main); border-radius: 8px; background: var(--bg-input); color: var(--text-main);"><input type="text" class="dyn-size-input" list="sizeOptions" placeholder="Size (e.g. 1080x1080px)" style="flex: 1.5; min-width: 120px; padding: 10px; border: 1px solid var(--border-main); border-radius: 8px; background: var(--bg-input); color: var(--text-main);"><input type="text" class="dyn-size-notes" placeholder="Notes (e.g. 2 sets)" style="flex: 1; min-width: 100px; padding: 10px; border: 1px solid var(--border-main); border-radius: 8px; background: var(--bg-input); color: var(--text-main);"></div>`;

    // 🌟 LOGIK BARU: Kosongkan 4 Kotak Brief Berstruktur + Copywriting Style
    if (document.getElementById('briefHook')) {
        document.getElementById('briefHook').value = '';
        document.getElementById('briefAudience').value = '';
        document.getElementById('briefVibe').value = '';
        document.getElementById('briefMandatory').value = '';
        if (document.getElementById('copyStyleInput')) document.getElementById('copyStyleInput').value = '';
    } else if (document.getElementById('pBrief')) {
        document.getElementById('pBrief').value = '';
    }

    resetRequestGateway();
}

function goToStep(step) {
    if (step === 2) {
        const n1 = document.getElementById('requesterName').value; const n2 = document.getElementById('introManualName').value;
        if (!n1 && !n2) return showAppleAlert("Incomplete Info", "Please tell us your name before proceeding.");
    }
    if (step === 3) {
        const c = document.getElementById('pClient').value; const t = document.getElementById('pTitle').value;
        if (!c || !t) return showAppleAlert("Incomplete Info", "Please fill in Client Name and Project Title.");
    }
    document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active')); document.getElementById('step' + step).classList.add('active');
    document.getElementById('ind-1').className = 'step-indicator ' + (step >= 1 ? (step > 1 ? 'completed' : 'active') : '');
    document.getElementById('ind-2').className = 'step-indicator ' + (step >= 2 ? (step > 2 ? 'completed' : 'active') : '');
    document.getElementById('ind-3').className = 'step-indicator ' + (step >= 3 ? 'active' : '');
    refreshIcons();
}
// ========================================================
// 🌟 4. UI NAVIGATION & THEMING (UPDATED WITH AUTO-KANBAN)
// ========================================================

/**
 * Mengendalikan pertukaran halaman utama dalam aplikasi.
 * Memastikan data di-render semula setiap kali tab ditukar.
 */
function showPage(id) {
    document.body.classList.remove('no-scroll');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(id).classList.add('active');

    let navItem;
    if(id === 'request') {
        navItem = document.getElementById('btn-request');
        if (typeof resetRequestGateway === 'function') resetRequestGateway();
    }
    else if(id === 'dashboard') navItem = document.getElementById('btn-dashboard');
    else if(id === 'workload') navItem = document.getElementById('btn-workload');
    else if(id === 'done') navItem = document.getElementById('btn-done');
    else if(id === 'leave') navItem = document.getElementById('btn-leave');
    else if(id === 'team-review') navItem = document.getElementById('btn-team-review');
    else if(id === 'rate-card') navItem = document.getElementById('btn-rate-card');
    else if(id === 'quote-builder') navItem = document.getElementById('btn-quote-builder');
    else if(id === 'settings') navItem = document.getElementById('btn-settings');

    if(navItem) navItem.classList.add('active');

    // Minta kebenaran notifikasi jika Admin baru masuk
    if (id === 'dashboard' && hasAdminAccess() && 'Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
    }

    // Render semula data mengikut tab yang aktif
    if (id === 'settings') {
        renderSettingsPage();
        // "Recent changes" only needs the latest handful of entries — fetch that small slice
        // on demand instead of keeping the whole activity log table resident in memory.
        if (typeof fetchRecentActivityForSettings === 'function') {
            fetchRecentActivityForSettings().then(() => { if (document.getElementById('settings')?.classList.contains('active')) renderSettingsPage(); });
        }
    }
    if (id === 'team-review') {
        renderTeamReviewPage();
        // Realtime pushes cover most updates, but a fresh fetch on every tab visit means admin
        // never has to guess whether a submission just isn't synced yet vs. simply not pushed live.
        if (hasSuperAdminAccess() && typeof fetchTeamReviewData === 'function') {
            fetchTeamReviewData().then(renderTeamReviewPage);
        }
    }
    if (id === 'rate-card') renderRateCardPage();
    if (id === 'quote-builder' && typeof renderQuoteBuilderPage === 'function') renderQuoteBuilderPage();

    if(globalData && globalData.length > 0) {
        if(id === 'dashboard') renderDashboard();
        if(id === 'workload' || id === 'done') renderBoards();
        // 🌟 KOD BARU: Paksa sistem susun Handover List bila tab Leave ditekan
        if(id === 'leave') {
            if(typeof renderLeaveHistory === 'function') renderLeaveHistory();
            if(typeof renderHandoverList === 'function') renderHandoverList();
        }
    }
}

function switchDashTab(tab) {
    document.querySelectorAll('.dash-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active-section'));
    const tabButton = document.getElementById(`btn-tab-${tab}`);
    const section = document.getElementById(`section-${tab}`);
    if (tabButton) tabButton.classList.add('active');
    if (section) section.classList.add('active-section');
}

/**
 * Inisialisasi tema berdasarkan simpanan pengguna atau waktu semasa.
 */
function initTheme() {
    const savedTheme = localStorage.getItem('adtech_theme');
    const hour = new Date().getHours();
    const isWorkingLate = (hour < 9 || hour >= 17);

    let targetTheme = 'light';
    if (savedTheme) {
        targetTheme = savedTheme;
    } else {
        if (isWorkingLate) targetTheme = 'dark';
    }
    applyThemeState(targetTheme);
}

/**
 * Mengaplikasikan atribut tema pada HTML dan mengemaskini ikon butang.
 */
function applyThemeState(theme) {
    const root = document.documentElement;
    const themeBtn = document.getElementById('themeBtn');

    if (theme === 'dark') {
        root.setAttribute('data-theme', 'dark');
        if (themeBtn) themeBtn.innerHTML = '<i data-lucide="sun"></i> <span>Light Mode</span>';
    }
    else {
        root.removeAttribute('data-theme');
        if (themeBtn) themeBtn.innerHTML = '<i data-lucide="moon"></i> <span>Dark Mode</span>';
    }
    if (typeof refreshIcons === 'function') refreshIcons();
}

/**
 * Mengendalikan animasi pertukaran tema (mendukung View Transitions API).
 */
function toggleTheme(event) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const nextTheme = isDark ? 'light' : 'dark';

    localStorage.setItem('adtech_theme', nextTheme);
    if (typeof setGreetingAndDate === 'function') setGreetingAndDate(localStorage.getItem('adtech_user_name'));

    if (!document.startViewTransition) {
        applyThemeState(nextTheme);
        return;
    }

    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;
    const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    const transition = document.startViewTransition(() => { applyThemeState(nextTheme); });
    transition.ready.then(() => {
        const clipPath = [ `circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)` ];
        document.documentElement.animate(
            { clipPath: clipPath },
            { duration: 600, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }
        );
    });
}

function syncTeamReviewPrivacyUI() {
    const teamReviewNav = document.getElementById('btn-team-review');
    if (teamReviewNav) teamReviewNav.style.display = 'flex';

    const page = document.getElementById('team-review');
    if (page?.classList.contains('active') && typeof renderTeamReviewPage === 'function') renderTeamReviewPage();
}

/**
 * Mengemaskini UI berdasarkan status Admin.
 * 🌟 AUTO-TRIGGER KANBAN: Memaksa paparan Kanban jika Admin login.
 */
function checkAdminUI() {
    const btn = document.getElementById('adminBtn');
    const radar = document.getElementById('radarContainer');
    syncAdminSessionFromProfile();
    const securePin = hasAdminAccess();
    const adminProfileLabel = isSuperAdminName() ? 'Superadmin' : 'Admin Unlocked';

    const btnLoadArchive = document.getElementById('btnLoadArchive');
    const btnExportCSV = document.getElementById('btnExportCSV');
    const btnExportReportPack = document.getElementById('btnExportReportPack');
    const btnKanban = document.getElementById('adminKanbanToggle');
    const adminHealthCard = document.getElementById('adminHealthCard');
    const settingsAdminState = document.getElementById('settingsAdminState');
    const btnAddTeamMember = document.getElementById('btnAddTeamMember');
    const adminOnlySettings = document.querySelectorAll('.settings-admin-only');

    if(btnKanban) btnKanban.style.display = 'block';

    if(securePin) {
        if (btn) {
            btn.innerHTML = `<i data-lucide="unlock"></i> <span>${adminProfileLabel}</span>`;
            btn.classList.add('unlocked');
        }
        if(radar) radar.style.display = 'grid';
        if(document.getElementById('superAdminControls')) document.getElementById('superAdminControls').style.display = 'inline-flex';
        if(document.getElementById('btnArchive')) document.getElementById('btnArchive').style.display = 'inline-flex';

        if(btnLoadArchive) btnLoadArchive.style.display = 'inline-flex';
        if(btnExportCSV) btnExportCSV.style.display = 'inline-flex';
        if(btnExportReportPack) btnExportReportPack.style.display = 'inline-flex';
        if(adminHealthCard) adminHealthCard.style.display = 'block';
        if(settingsAdminState) {
            settingsAdminState.innerHTML = `<i data-lucide="unlock"></i> ${adminProfileLabel}`;
            settingsAdminState.classList.add('unlocked');
        }
        if(btnAddTeamMember) btnAddTeamMember.disabled = false;
        adminOnlySettings.forEach(el => { el.disabled = false; el.classList.remove('disabled'); });

        isSuperAdmin = true;
    } else {
        if (btn) {
            btn.innerHTML = '<i data-lucide="lock"></i> <span>Admin Access</span>';
            btn.classList.remove('unlocked');
        }
        if(radar) radar.style.display = 'none';
        if(document.getElementById('superAdminControls')) document.getElementById('superAdminControls').style.display = 'none';
        if(document.getElementById('btnArchive')) document.getElementById('btnArchive').style.display = 'none';

        if(btnLoadArchive) btnLoadArchive.style.display = 'none';
        if(btnExportCSV) btnExportCSV.style.display = 'none';
        if(btnExportReportPack) btnExportReportPack.style.display = 'none';
        if(adminHealthCard) adminHealthCard.style.display = 'none';
        if(settingsAdminState) {
            settingsAdminState.innerHTML = '<i data-lucide="lock"></i> View Mode';
            settingsAdminState.classList.remove('unlocked');
        }
        if(btnAddTeamMember) btnAddTeamMember.disabled = true;
        adminOnlySettings.forEach(el => { el.disabled = true; el.classList.add('disabled'); });

        isSuperAdmin = false;
    }
    syncTeamReviewPrivacyUI();
    renderSettingsMemberControls();
    renderSettingsAdminControls();
    if (typeof updateLiveClock === 'function') updateLiveClock();
    if (typeof refreshIcons === 'function') refreshIcons();
}

/**
 * Mengendalikan proses log masuk/keluar Admin menggunakan profil atau PIN fallback.
 */
async function toggleAdmin() {
    const profileHasAccess = hasAssignedAdminAccess();

    if (profileHasAccess) {
        syncAdminSessionFromProfile();
        if (typeof showNotification === 'function') {
            showNotification(isSuperAdminName() ? 'Superadmin Active' : 'Admin Active', 'Access is assigned to your profile');
        }
        checkAdminUI();
        if (typeof renderDashboard === 'function') renderDashboard();
        if (typeof renderBoards === 'function') renderBoards();
        if ('Notification' in window && Notification.permission !== 'granted') Notification.requestPermission();
        return;
    }

    let securePin = localStorage.getItem('adtech_lead_pin');
    if(securePin) {
        localStorage.removeItem('adtech_lead_pin');
        isSuperAdmin = false;
        if (typeof showNotification === 'function') showNotification('Admin Locked', 'View-only mode active');
        checkAdminUI();
        if (typeof renderDashboard === 'function') renderDashboard();
        if (typeof renderBoards === 'function') renderBoards();
    } else {
        const pin = await showApplePrompt("Admin Access", "Enter PIN:", true, async (val) => {
            if(val === "3030300" || val === "1234") {
                isSuperAdmin = true;
                return true;
            }
            return false;
        });
        if(pin) {
            localStorage.setItem('adtech_lead_pin', pin);
            warmPlaybookGenerator();
            if (typeof showNotification === 'function') showNotification('Admin Unlocked', 'You can now manage assignments');
            checkAdminUI();
            if (typeof renderDashboard === 'function') renderDashboard();
            if (typeof renderBoards === 'function') renderBoards();
            if ('Notification' in window && Notification.permission !== 'granted') Notification.requestPermission();
        }
    }
}

/**
 * Menapis paparan data mengikut region (Malaysia/Indonesia/Global).
 */
/**
 * Menapis paparan data mengikut region (Malaysia/Indonesia/Global).
 */
function filterByRegion(reg) {
    currentRegionFilter = reg;
    document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));

    if(reg === 'all') document.getElementById('t-all').classList.add('active');
    else if(reg === 'Malaysia') document.getElementById('t-my').classList.add('active');
    else if(reg === 'Indonesia') document.getElementById('t-id').classList.add('active');
    else document.getElementById('t-gb').classList.add('active');

    if (typeof updateLiveClock === 'function') updateLiveClock();
    if (typeof renderDashboard === 'function') renderDashboard();
    if (typeof renderBoards === 'function') renderBoards();
}

/**
 * Mengeluarkan pengguna dari aplikasi dan membersihkan sesi.
 */
function signOutApp() {
    const overlay = document.getElementById('soft-refresh-overlay');
    if(overlay) overlay.classList.add('show');

    setTimeout(() => {
        localStorage.removeItem('adtech_user_name');
        localStorage.removeItem('adtech_lead_pin');
        localStorage.removeItem('adtech_region');
        localStorage.removeItem('adtech_login_date');
        clearSuperAdminVerified();
        window.location.reload(true);
    }, 600);
}

// ========================================================
// 🌟 5. AUTHENTICATION & APP START
// ========================================================
function chooseCountry(country) {
    userRegion = country;
    const nameStep = document.getElementById('nameSelectStep'); const countryStep = document.getElementById('countrySelectStep');
    const nameSelect = document.getElementById('userNameSelect'); const globalRegionSelect = document.getElementById('globalRegionSelect'); const manualName = document.getElementById('introManualName');

    if (country === 'Global') {
        document.getElementById('welcomeTitle').innerText = `Global Team`; nameSelect.style.display = 'none'; globalRegionSelect.style.display = 'block'; manualName.style.display = 'block'; manualName.placeholder = "Type your full name...";
    } else {
        document.getElementById('welcomeTitle').innerText = `Adtechinno ${country}`; globalRegionSelect.style.display = 'none'; nameSelect.style.display = 'block'; manualName.style.display = 'none';

        let names = [];
            // 🌟 FIX BARU: Guna senarai SEMUA STAF (Bukan Creative je)
            if (country === 'Malaysia') names = allStaffMY;
            else if (country === 'Indonesia') names = allStaffID;

            nameSelect.innerHTML = `<option value="">Select your name...</option>` + names.map(n => `<option value="${n}">${n}</option>`).join('') + `<option value="manual">I'm not in the list</option>`;
    }
    countryStep.style.display = 'none'; nameStep.style.display = 'block';
}

function backToRegion() {
    document.getElementById('nameSelectStep').style.display = 'none'; document.getElementById('countrySelectStep').style.display = 'block';
    document.getElementById('userNameSelect').value = ''; document.getElementById('globalRegionSelect').value = ''; document.getElementById('introManualName').value = '';
}

function toggleIntroManualInput() {
    const val = document.getElementById('userNameSelect').value; const manualInput = document.getElementById('introManualName');
    if(val === 'manual') { manualInput.style.display = 'block'; manualInput.focus(); } else { manualInput.style.display = 'none'; }
}

function setGreetingAndDate(userName = "") {
    const hour = new Date().getHours(); let greeting = "Good evening";
    if (hour < 12) greeting = "Good morning"; else if (hour < 18) greeting = "Good afternoon";
    let finalGreeting = greeting + "."; if (userName) { const firstName = extractFirstName(userName); finalGreeting = greeting + ", " + firstName + "."; }
    document.getElementById('greetingMsg').innerText = finalGreeting;

    const isWorkingLate = (hour < 9 || hour >= 17); const hasSavedTheme = localStorage.getItem('adtech_theme'); const subGreeting = document.getElementById('subGreetingMsg');
    if (isWorkingLate && !hasSavedTheme) { subGreeting.innerHTML = "Here is what's happening. <br><span class='adaptive-note'><i data-lucide='sparkles' style='width:14px; height:14px;'></i> Adaptive UI: Switched to Dark Mode because we know you're working late.</span>"; }
    else { subGreeting.innerHTML = "Here is what's happening with your creative requests."; }

    const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    document.getElementById('currentDateDisplay').innerText = new Date().toLocaleDateString('en-US', dateOptions); updateLiveClock(); refreshIcons();
}

async function startApp() {
    try {
        let userName = ""; let finalRegion = userRegion;
        if (userRegion === 'Global') {
            const globReg = document.getElementById('globalRegionSelect').value; const manName = document.getElementById('introManualName').value.trim();
            if (!globReg || !manName) return showAppleAlert("Missing Info", "Please select your country and enter your name.");
            finalRegion = globReg; userName = manName;
        } else {
            const sel = document.getElementById('userNameSelect').value; const man = document.getElementById('introManualName').value.trim();
            userName = sel === 'manual' ? man : sel;
            if (!userName) return showAppleAlert("Missing Info", "Please tell us who you are to continue.");
        }

        const superAdminVerified = await verifySuperAdminLogin(userName);
        if (!superAdminVerified) return showAppleAlert('Access Cancelled', 'Faiz profile requires passcode verification.');

        userRegion = finalRegion; localStorage.setItem('adtech_user_name', userName); localStorage.setItem('adtech_region', finalRegion); localStorage.setItem('adtech_login_date', new Date().toDateString());
        if (typeof scheduleDailySignOut === 'function') scheduleDailySignOut();
        setGreetingAndDate(userName);

        // 🌟 LOGIK BARU: SPECIAL WELCOME MESSAGE UNTUK SEMUA STAF (First Time Login)
        const cleanUserKey = userName.replace(/\s+/g, '').toLowerCase();
        if (!localStorage.getItem(`adtech_welcomed_${cleanUserKey}`)) {
            setTimeout(() => {
                showAppleAlert(
                    "🎉 Welcome to AdTechinno!",
                    `Hi ${extractFirstName(userName)}! We are thrilled to have you onboard. Let's make some magic together! ✨`
                );
                localStorage.setItem(`adtech_welcomed_${cleanUserKey}`, 'true');
            }, 1500);
        }

        // Pastikan fungsi ini wujud di bahagian 4 nanti
        if(typeof checkLeaveAccess === 'function') checkLeaveAccess(userName);

        const pRegionField = document.getElementById('pRegion');
        if (pRegionField) { pRegionField.innerHTML = `<option value="${finalRegion}">${finalRegion}</option>`; pRegionField.value = finalRegion; pRegionField.disabled = true; pRegionField.style.opacity = '0.7'; pRegionField.style.cursor = 'not-allowed'; }

        const reqSelect = document.getElementById('requesterName'); let foundInList = false;
        for (let i = 0; i < reqSelect.options.length; i++) { if (reqSelect.options[i].value === userName || reqSelect.options[i].text === userName) { reqSelect.selectedIndex = i; foundInList = true; break; } }
        if (!foundInList) { document.getElementById('manualName').value = userName; document.getElementById('manualName').style.display = 'block'; }

        document.getElementById('nameSelectStep').style.display = 'none'; document.getElementById('syncStep').style.display = 'block';
        const firstName = extractFirstName(userName); document.getElementById('syncMsg').innerText = `Welcome back, ${firstName}.`;

        await fetchSupabaseData(true);
        fetchTaskNotifications();
        ensureNotificationPermission(); // runs inside the "Start Now" click gesture, so the browser permission prompt is allowed to show

        const intro = document.getElementById('introPage'); const app = document.getElementById('app-wrapper');
        intro.style.opacity = '0'; setTimeout(() => { intro.style.display = 'none'; app.classList.add('app-active'); document.body.classList.remove('no-scroll'); }, 600);
    } catch(e) { console.error(e); } finally { const overlay = document.getElementById('soft-refresh-overlay'); if (overlay) overlay.classList.remove('show'); }
}

function checkSavedName() {
    const savedName = localStorage.getItem('adtech_user_name'); const savedReg = localStorage.getItem('adtech_region');
    if(savedName && savedReg) {
        if (isSuperAdminName(savedName) && !hasSuperAdminAccess(savedName)) {
            localStorage.removeItem('adtech_user_name');
            localStorage.removeItem('adtech_lead_pin');
            localStorage.removeItem('adtech_region');
            localStorage.removeItem('adtech_login_date');
            clearSuperAdminVerified();
            showPage('dashboard');
            document.getElementById('introPage').style.display = 'flex';
            document.body.classList.add('no-scroll');
            setTimeout(() => showAppleAlert('Verification Required', 'Please sign in again as Faiz.'), 400);
            return;
        }
        userRegion = savedReg; setGreetingAndDate(savedName);

        if(typeof checkLeaveAccess === 'function') checkLeaveAccess(savedName);

        const pRegionField = document.getElementById('pRegion');
        if (pRegionField) { pRegionField.innerHTML = `<option value="${userRegion}">${userRegion}</option>`; pRegionField.value = userRegion; pRegionField.disabled = true; pRegionField.style.opacity = '0.7'; pRegionField.style.cursor = 'not-allowed'; }

        const reqSelect = document.getElementById('requesterName'); let found = false;
        for(let i=0; i<reqSelect.options.length; i++){ if(reqSelect.options[i].value === savedName || reqSelect.options[i].text === savedName){ reqSelect.selectedIndex = i; found = true; break; } }
        if(!found) { document.getElementById('manualName').value = savedName; document.getElementById('manualName').style.display = 'block'; }

        document.getElementById('introPage').style.display = 'none'; document.getElementById('app-wrapper').classList.add('app-active'); document.body.classList.remove('no-scroll');
        showPage('dashboard');

        // 🌟 FIX: Sistem akan tarik data dengan betul masa mula-mula masuk
        fetchSupabaseData(true);
        fetchTaskNotifications();
    } else {
        showPage('dashboard'); document.getElementById('introPage').style.display = 'flex'; document.body.classList.add('no-scroll');
        setTimeout(() => { const overlay = document.getElementById('soft-refresh-overlay'); if (overlay) overlay.classList.remove('show'); }, 500);
    }
}

// ========================================================
// 🌟 6. SUPABASE DATA FETCHING & REAL-TIME
// ========================================================

// 🌟 FUNGSI: Tarik senarai nama client dari Supabase
async function fetchClientsList() {
    try {
        const { data, error } = await supabaseClient.from('clients').select('name').order('name', { ascending: true });
        if (error) throw error;

        const clientList = document.getElementById('customClientList');
        if (clientList && data) {
            window.allClients = data.map(c => c.name); // Simpan dalam memori untuk fungsi search
            renderClientOptions(window.allClients);
        }
    } catch (e) {
        console.error("Gagal load senarai client:", e.message);
    }
}

// Render senarai ke dalam kotak dropdown custom
function renderClientOptions(names) {
    const list = document.getElementById('customClientList');
    if(!list) return;

    if(names.length === 0) {
        list.innerHTML = `<div style="padding:12px 20px; color:var(--text-muted); font-size:0.85rem; font-style:italic;">Type to add this new client...</div>`;
        return;
    }

    list.innerHTML = names.map(name => `<div class="dropdown-item" onmousedown="selectClientName('${name.replace(/'/g, "\\'")}')"><i data-lucide="building-2" style="width:16px; height:16px; color:var(--text-muted);"></i> ${name}</div>`).join('');
    refreshIcons();
}

function showClientDropdown() {
    const list = document.getElementById('customClientList');
    if(list) list.classList.add('show');
    if(window.allClients) renderClientOptions(window.allClients);
}

function hideClientDropdown() {
    setTimeout(() => {
        const list = document.getElementById('customClientList');
        if(list) list.classList.remove('show');
    }, 150);
}

function filterClientDropdown() {
    const input = document.getElementById('pClient').value.toLowerCase();
    if(!window.allClients) return;
    const filtered = window.allClients.filter(c => c.toLowerCase().includes(input));
    renderClientOptions(filtered);
}

function selectClientName(name) {
    document.getElementById('pClient').value = name;
    hideClientDropdown();
}

// 🌟 FUNGSI UTAMA: Tarik semua data
let fetchSupabaseDataInFlight = false;
let fetchSupabaseDataQueuedArgs = null;

/**
 * Guards against overlapping fetch cycles. Multiple realtime listeners (see
 * setupRealtimeSubscription) can each independently call this within milliseconds of one another
 * for a single logical action (e.g. saving a note touches both creative_requests and
 * task_activity_logs). Without this guard, two full fetches run concurrently, race each other,
 * and whichever finishes LAST wins — even if it started from staler data. That race is what was
 * causing note counts (and other board state) to flicker between values, and the repeated
 * re-renders it triggered showed up as cards visibly "vibrating" under the cursor.
 */
async function fetchSupabaseData(force = false, silent = false) {
    if (fetchSupabaseDataInFlight) {
        fetchSupabaseDataQueuedArgs = {
            force: force || Boolean(fetchSupabaseDataQueuedArgs?.force),
            silent: silent && fetchSupabaseDataQueuedArgs?.silent !== false
        };
        return;
    }

    fetchSupabaseDataInFlight = true;
    try {
        await fetchSupabaseDataImpl(force, silent);
    } finally {
        fetchSupabaseDataInFlight = false;
        if (fetchSupabaseDataQueuedArgs) {
            const next = fetchSupabaseDataQueuedArgs;
            fetchSupabaseDataQueuedArgs = null;
            fetchSupabaseData(next.force, next.silent);
        }
    }
}

async function fetchSupabaseDataImpl(force = false, silent = false) {
    const editModal = document.getElementById('editModal');
    if (!force && editModal && editModal.style.display === 'flex') return;

    const detailModal = document.getElementById('globalDetailModal');
    if (!force && detailModal && detailModal.classList.contains('show')) return;

    const calDayModal = document.getElementById('calDayModal');
    if (!force && calDayModal && calDayModal.classList.contains('show')) return;

    const activeTag = document.activeElement ? document.activeElement.tagName : '';
    if (!force && (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT')) return;

    try {
        await fetchClientsList();

        // 🌟 LOGIK BARU: Tarik senarai nama staf dari Supabase
        // Skipped when the pre-boot fetch (DOMContentLoaded, before login) already loaded this
        // moments ago — the login flow calls this (with force=true) right after that pre-boot
        // fetch, and team roster changes rarely enough that re-pulling it a second time within a
        // few seconds is pure waste. Recency check applies even when force=true for that reason;
        // an explicit refresh click more than 10s after the last pull still gets fresh data.
        if (Date.now() - lastTeamMembersFetchAt > 10000) {
            try {
                const { data: teamData, error: teamError } = await supabaseClient.from('team_members').select('*').order('name', { ascending: true });
                if (!teamError && teamData) {
                    hydrateTeamCollections(teamData);
                    lastTeamMembersFetchAt = Date.now();
                }
            } catch(e) { console.error("Gagal load senarai team:", e.message); }
        }

        try {
            const { data: leaveData } = await supabaseClient.from('team_leaves').select('*');
            if (leaveData) {
                globalTeamStatus = leaveData.map(row => ({
                    Name: row.name, Status: row.status || "", Start_Date: row.start_date || "", End_Date: row.end_date || "", Passcode: row.passcode || ""
                }));
            }

            // 🌟 LOGIK BARU: Tarik data Handover
            const { data: hoData } = await supabaseClient.from('handover_logs').select('*');
            if (hoData) globalHandovers = hoData;

            if (typeof fetchTeamReviewData === 'function') {
                await fetchTeamReviewData();
            }

        } catch (e) { console.log("Gagal tarik data sampingan Supabase:", e.message); }

        const { data, error } = await fetchCreativeRequestsForCurrentAccess();
        if (error) throw error;

        const oldDataString = JSON.stringify(globalData);
        globalData = deduplicateTasks(filterTasksForCurrentAccess(data || [], { regionFilter: 'all' }));
        await maybeAutoBackfillInternalDueDates({ silent });
        await fetchTaskRelatedLogsForCurrentAccess();
        if ((hasAdminAccess() || isSuperAdmin) && !clientReviewSetupState.checking) {
            refreshClientReviewSetupStatus({ silent: true });
        }
        closeDetailModalIfCurrentTaskRestricted();
        const newDataString = JSON.stringify(globalData);

        if (oldDataString !== newDataString || force) {
            renderActiveViewsAfterTaskDataChange();
        }

    } catch (e) {
        console.error("Supabase load error:", e.message);
    } finally {
        if (!silent) {
            const overlay = document.getElementById('soft-refresh-overlay');
            if (overlay) overlay.classList.remove('show');
            // 🌟 TRIGGER GATEKEEPER BILA HABIS LOADING
            if (typeof checkAndShowReturnOverlay === 'function') checkAndShowReturnOverlay();
        }
    }
} // <--- Pastikan ada kurungan tutup untuk fetchSupabaseData

// 🌟 SUPABASE REAL-TIME LISTENER (MAGIC SYNC)
//
// This used to treat every single realtime event — on any of 8 tables — as a signal to re-run the
// ENTIRE fetchSupabaseData cascade: clients, team members, leaves, handovers, team review, the
// whole creative_requests table, and (before the log-loading fix above) up to 5000 rows each of
// activity/note logs. One person adding a note anywhere triggered that whole cascade for every
// open browser tab. Now each table patches only the state it actually owns, and only the views
// that could show something different re-render.
let isRealtimeSubscribed = false;

// Re-renders exactly what the old fetchSupabaseDataImpl re-rendered after a task-data change —
// shared by the full sync path and the lightweight realtime patch path below.
function renderActiveViewsAfterTaskDataChange() {
    if(document.getElementById('dashboard').classList.contains('active')) renderDashboard();
    if(document.getElementById('workload').classList.contains('active') || document.getElementById('done').classList.contains('active')) renderBoards();
    if(document.getElementById('team-review')?.classList.contains('active') && hasSuperAdminAccess()) renderTeamReviewPage();
    if(document.getElementById('leave').classList.contains('active')) {
        if(typeof renderLeaveHistory === 'function') renderLeaveHistory();
        if(typeof renderHandoverList === 'function') renderHandoverList();
    }
}

let taskRealtimePatchDebounceTimer = null;
// creative_requests postgres_changes payloads already carry the full new row (Supabase logical
// replication always sends the complete row for INSERT/UPDATE, regardless of replica identity) —
// so a change can be applied straight from the payload with zero extra network round-trip. Several
// patches can land within milliseconds of each other (e.g. a bulk PIC reassignment); the render
// pass is debounced so a burst still repaints the DOM only once, but data patches apply immediately.
function scheduleTaskRealtimeRerender() {
    if (taskRealtimePatchDebounceTimer) clearTimeout(taskRealtimePatchDebounceTimer);
    taskRealtimePatchDebounceTimer = setTimeout(() => {
        taskRealtimePatchDebounceTimer = null;
        closeDetailModalIfCurrentTaskRestricted();
        renderActiveViewsAfterTaskDataChange();
        const modal = document.getElementById('globalDetailModal');
        if (modal && modal.classList.contains('show') && modal.dataset.currentJobId) {
            openDetailModal(modal.dataset.currentJobId, true);
        }
    }, 150);
}

function removeTaskFromGlobalData(jobId) {
    const idx = (globalData || []).findIndex(t => String(t.job_id || '') === jobId);
    if (idx !== -1) globalData.splice(idx, 1);
}

// Same authorisation predicate filterTasksForCurrentAccess() applies per-row, without its
// lastAssignedRegionVisibility side effect (which is meant to summarise a whole-dataset pass, not
// a single realtime row) and without region filtering — globalData itself is always authorisation-
// filtered only, with region filtering applied later at render time (the full sync populates it via
// filterTasksForCurrentAccess(data, { regionFilter: 'all' }); mirror that here).
function isTaskAuthorisedForCurrentAccess(task) {
    return hasAdminAccess() || isSuperAdmin || canCurrentUserViewTask(task);
}

function upsertTaskIntoGlobalData(row) {
    if (!row || !row.job_id) return;
    const jobId = String(row.job_id);
    // Re-apply the exact same role authorisation this row would have gone through had it arrived
    // via the normal filtered fetch — a realtime push bypasses that server-side filter, so this is
    // what keeps a regular creative user's browser from holding tasks that aren't theirs.
    if (!isTaskAuthorisedForCurrentAccess(row)) {
        removeTaskFromGlobalData(jobId);
        return;
    }
    const idx = (globalData || []).findIndex(t => String(t.job_id || '') === jobId);
    if (idx !== -1) globalData[idx] = row;
    else globalData.push(row);
}

function applyCreativeRequestRealtimeChange(payload) {
    const eventType = payload.eventType || payload.event;
    const jobId = String((payload.new && payload.new.job_id) || (payload.old && payload.old.job_id) || '');
    if (!jobId) return; // nothing we can safely patch — the next manual/tab-visible sync will catch it up
    if (eventType === 'DELETE') {
        removeTaskFromGlobalData(jobId);
    } else {
        upsertTaskIntoGlobalData(payload.new);
    }
    globalData = deduplicateTasks(globalData);
    scheduleTaskRealtimeRerender();
}

// Small ancillary tables (leaves, handovers) — patch just that table instead of the whole cascade.
let leaveRealtimeDebounceTimer = null;
function scheduleTeamLeaveRealtimeRefresh() {
    if (leaveRealtimeDebounceTimer) clearTimeout(leaveRealtimeDebounceTimer);
    leaveRealtimeDebounceTimer = setTimeout(async () => {
        leaveRealtimeDebounceTimer = null;
        try {
            const { data } = await supabaseClient.from('team_leaves').select('*');
            if (data) globalTeamStatus = data.map(row => ({
                Name: row.name, Status: row.status || "", Start_Date: row.start_date || "", End_Date: row.end_date || "", Passcode: row.passcode || ""
            }));
        } catch(e) { console.log('Team leave refresh failed:', e.message); }
        if (document.getElementById('dashboard')?.classList.contains('active')) renderDashboard();
        if (document.getElementById('leave')?.classList.contains('active') && typeof renderLeaveHistory === 'function') renderLeaveHistory();
    }, 400);
}

let shootReadinessRealtimeDebounceTimer = null;
// A checklist toggle anywhere (this tab or someone else's) should update Board readiness chips
// without needing a full task-data reload — same debounce-then-targeted-rerender shape as the other
// realtime refresh helpers here.
function scheduleShootReadinessRealtimeRefresh() {
    if (shootReadinessRealtimeDebounceTimer) clearTimeout(shootReadinessRealtimeDebounceTimer);
    shootReadinessRealtimeDebounceTimer = setTimeout(async () => {
        shootReadinessRealtimeDebounceTimer = null;
        await fetchShootReadinessSummaryForCurrentAccess();
        renderActiveViewsAfterTaskDataChange();
    }, 400);
}

let handoverRealtimeDebounceTimer = null;
function scheduleHandoverRealtimeRefresh() {
    if (handoverRealtimeDebounceTimer) clearTimeout(handoverRealtimeDebounceTimer);
    handoverRealtimeDebounceTimer = setTimeout(async () => {
        handoverRealtimeDebounceTimer = null;
        try {
            const { data } = await supabaseClient.from('handover_logs').select('*');
            if (data) globalHandovers = data;
        } catch(e) { console.log('Handover refresh failed:', e.message); }
        if (document.getElementById('leave')?.classList.contains('active') && typeof renderHandoverList === 'function') renderHandoverList();
    }, 400);
}

let teamReviewRealtimeDebounceTimer = null;
function scheduleTeamReviewRealtimeRefresh() {
    if (teamReviewRealtimeDebounceTimer) clearTimeout(teamReviewRealtimeDebounceTimer);
    teamReviewRealtimeDebounceTimer = setTimeout(async () => {
        teamReviewRealtimeDebounceTimer = null;
        // fetchTeamReviewData() already no-ops for non-admin viewers beyond trimming their own
        // active assignment, so this is cheap for the common case.
        if (typeof fetchTeamReviewData === 'function') await fetchTeamReviewData();
        if (document.getElementById('team-review')?.classList.contains('active') && hasSuperAdminAccess()) renderTeamReviewPage();
    }, 400);
}

// task_activity_logs / task_note_logs: history for a task loads on demand (see fetchTaskLogsForJob)
// — a realtime event on these tables no longer triggers any fetch. If the affected task's detail
// modal happens to be open right now, refresh just that task's history in place; otherwise just
// keep the lightweight note-count badge roughly in sync (no query either way).
function handleTaskLogRealtimeChange(table, payload) {
    const row = payload.new || payload.old;
    const jobId = String(row?.job_id || '');
    if (!jobId) return;
    const eventType = payload.eventType || payload.event;

    if (table === 'task_note_logs') {
        const current = noteCountByJobId.get(jobId) || 0;
        if (eventType === 'INSERT') noteCountByJobId.set(jobId, current + 1);
        else if (eventType === 'DELETE') noteCountByJobId.set(jobId, Math.max(0, current - 1));
    }

    const modal = document.getElementById('globalDetailModal');
    const isOpenForThisJob = modal && modal.classList.contains('show') && modal.dataset.currentJobId === jobId;
    if (isOpenForThisJob) {
        fetchTaskLogsForJob(jobId).then(() => openDetailModal(jobId, true));
    }
}

function setupRealtimeSubscription() {
    if (isRealtimeSubscribed) return;

    supabaseClient
        .channel('adtech-live-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'creative_requests' }, (payload) => {
            applyCreativeRequestRealtimeChange(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'team_leaves' }, () => scheduleTeamLeaveRealtimeRefresh())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'handover_logs' }, () => scheduleHandoverRealtimeRefresh())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'team_review_cycles' }, () => scheduleTeamReviewRealtimeRefresh())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'team_review_assignments' }, () => scheduleTeamReviewRealtimeRefresh())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'team_review_responses' }, () => scheduleTeamReviewRealtimeRefresh())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'task_activity_logs' }, (payload) => handleTaskLogRealtimeChange('task_activity_logs', payload))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'task_note_logs' }, (payload) => handleTaskLogRealtimeChange('task_note_logs', payload))
        // task_client_waiting_periods rows are always written alongside a creative_requests update
        // in the same user action (see saveClientReviewMoveUndo / awaiting-client flows), so the
        // creative_requests event above already patches and re-renders everything this table could
        // affect — no separate fetch needed here.
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'task_notifications' }, (payload) => handleIncomingTaskNotification(payload))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'shoot_checklist_items' }, () => scheduleShootReadinessRealtimeRefresh())
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('🚀 Berjaya sambung ke Supabase Real-Time!');
                isRealtimeSubscribed = true;
            }
        });
}

// Aktifkan Real-Time ini secara automatik 2 saat selepas website dibuka
setTimeout(setupRealtimeSubscription, 2000);

// Safety net alongside the realtime push above: if the tab was backgrounded/asleep long enough
// that a websocket event got dropped, catch up on notifications the moment it's looked at again.
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && getCurrentUserName()) fetchTaskNotifications();
});

function isTaskEligibleForInternalDueBackfill(task = {}) {
    const status = String(task.status || '').toLowerCase();
    if (status === 'deleted' || isTaskDone(task) || getTaskInternalDueDate(task)) return false;
    return status === 'pending' || status === 'approved';
}

function getInternalDueBackfillRows(tasks = []) {
    return (tasks || []).filter(isTaskEligibleForInternalDueBackfill).map(task => {
        const clientDeadline = getTaskClientDeadline(task);
        const suggestion = generateSuggestedInternalDueForTask(task);
        let status = 'Ready';
        let canGenerate = !!clientDeadline && !!suggestion.date;
        if (!clientDeadline) {
            status = 'No client deadline';
            canGenerate = false;
        } else if (!suggestion.date) {
            status = suggestion.flag === 'client-deadline-passed' ? 'Client deadline passed' : 'Needs review';
            canGenerate = false;
        } else if (suggestion.flag !== 'normal') {
            status = suggestion.flag.replace(/-/g, ' ');
        }
        return {
            task,
            job_id: task.job_id,
            title: `${task.client_name || ''}: ${task.project_title || ''}`,
            client_deadline: clientDeadline,
            suggested_internal_due: suggestion.date,
            buffer_days: suggestion.bufferDays || getInternalDueRule(task).bufferDays,
            complexity: suggestion.complexity || getInternalDueRule(task).complexity,
            status,
            can_generate: canGenerate
        };
    });
}

// Set for the rest of the session the moment we confirm creative_requests.internal_due_date
// doesn't exist in this environment's schema — see the probe in maybeAutoBackfillInternalDueDates.
// When true, every candidate task would silently no-op-write (see saveCreativeRequestStatusPayload's
// fallback cascade) and get logged as "backfilled" anyway, forever, on every sync. That was the
// actual root cause of the duplicate-log noise: not a race, but a schema gap the write path was
// masking. Once known, there is nothing more to gain by retrying this session.
let internalDueBackfillSchemaUnavailable = false;

async function maybeAutoBackfillInternalDueDates({ silent = true, force = false } = {}) {
    if (!hasDeadlineEditAccess() || internalDueBackfillInFlight || internalDueBackfillSchemaUnavailable) return { saved: 0, skipped: 0, errors: [] };
    const rows = getInternalDueBackfillRows(globalData || []);
    const canGenerate = rows.filter(row => row.can_generate).slice(0, INTERNAL_DUE_BACKFILL_BATCH_LIMIT);
    let skipped = rows.length - canGenerate.length;
    if (!canGenerate.length) return { saved: 0, skipped, errors: [] };

    const signature = canGenerate.map(row => `${row.job_id}:${row.suggested_internal_due}:${row.buffer_days}`).join('|');
    if (!force && signature === lastInternalDueBackfillSignature) return { saved: 0, skipped, errors: [] };

    internalDueBackfillInFlight = true;
    lastInternalDueBackfillSignature = signature;
    const errors = [];
    let saved = 0;

    // Close a staleness race that could otherwise write (and log) the same "backfill" repeatedly:
    // globalData can be a few seconds to a few minutes old — a task this pass thinks is missing
    // an internal due date may already have had one written by a concurrent sync, another open
    // tab, or a manual edit. Re-check the actual current value for just these candidates
    // immediately before writing. This function only ever exists to fill in genuinely missing
    // dates — it must never re-stamp a date (or create an activity log entry) that's already there.
    const currentValueByJobId = new Map();
    try {
        const { data: freshRows, error: freshError } = await supabaseClient
            .from('creative_requests')
            .select('job_id, internal_due_date')
            .in('job_id', canGenerate.map(row => row.job_id));
        if (freshError) throw freshError;
        (freshRows || []).forEach(r => currentValueByJobId.set(String(r.job_id || ''), r.internal_due_date || ''));
    } catch(e) {
        if (/column|schema|cache/i.test(e.message || '') && /internal_due_date/i.test(e.message || '')) {
            // The column itself doesn't exist here — this feature cannot persist anything in this
            // environment. Disable it for the rest of the session instead of silently no-op-writing
            // (and activity-logging) the same "backfill" on every sync forever.
            internalDueBackfillSchemaUnavailable = true;
            internalDueBackfillInFlight = false;
            console.warn('Internal due date auto-backfill disabled: creative_requests.internal_due_date column is missing in this Supabase project (run the deadline/internal-due migration to enable it).');
            return { saved: 0, skipped: rows.length, errors: [] };
        }
        // Some other, unrelated read failure — fall back to the in-memory value already known for
        // each row. Still correct in the common case, just without the extra staleness guard.
        canGenerate.forEach(row => currentValueByJobId.set(row.job_id, getTaskInternalDueDate(row.task)));
    }

    for (const row of canGenerate) {
        const task = row.task;
        const currentValue = currentValueByJobId.get(row.job_id) || '';
        if (currentValue) {
            // Already has a due date — leave it alone. No UPDATE, no activity log, no updated_at
            // change, no realtime event.
            skipped += 1;
            task.internal_due_date = currentValue;
            continue;
        }
        const payload = {
            client_deadline: row.client_deadline || null,
            original_client_deadline: getTaskOriginalClientDeadline(task) || row.client_deadline || null,
            internal_due_date: row.suggested_internal_due,
            original_internal_due_date: getTaskOriginalInternalDueDate(task) || row.suggested_internal_due,
            internal_due_source: 'migrated',
            internal_due_manually_adjusted: false,
            latest_deadline_change_reason: `Backfilled from client deadline (${row.buffer_days} working day buffer)`
        };
        const fallbackPayload = {
            client_deadline: payload.client_deadline,
            original_client_deadline: payload.original_client_deadline,
            internal_due_date: payload.internal_due_date,
            original_internal_due_date: payload.original_internal_due_date,
            latest_deadline_change_reason: payload.latest_deadline_change_reason
        };

        try {
            const result = await saveCreativeRequestStatusPayload(row.job_id, payload, fallbackPayload);
            if (!result.savedFullPayload) {
                // The write degraded to a fallback/minimal payload, which for this specific call
                // means internal_due_date almost certainly did NOT actually persist (every field in
                // this payload is deadline-related, so the degraded retry can end up updating
                // nothing at all — see stripDeadlinePayloadFields). Claiming success here is exactly
                // what caused the same task to get "backfilled" again on every subsequent sync
                // forever: the in-memory task looked done, the database never agreed, and the next
                // fresh fetch saw it as missing again. Treat this as skipped, not saved — no
                // optimistic update, no activity log entry.
                skipped += 1;
                continue;
            }
            Object.assign(task, payload);
            saved += 1;
            logTaskActivity(row.job_id, 'internal_due_date_backfilled', 'Not set', row.suggested_internal_due, 'Generated from Client Deadline during admin sync', {
                client_deadline: row.client_deadline,
                buffer_working_days: row.buffer_days,
                complexity: row.complexity,
                lead_time_flag: row.status
            });
        } catch(e) {
            errors.push(`${row.job_id}: ${e.message}`);
        }
    }

    internalDueBackfillInFlight = false;
    if (!silent && saved) showNotification('Internal Due Dates Generated', `${saved} task${saved === 1 ? '' : 's'} updated`);
    if (!silent && errors.length) showAppleAlert('Some Dates Need Review', errors.slice(0, 6).join('\n'));
    return { saved, skipped: skipped + errors.length, errors };
}

// ========================================================
// 🌟 7. RENDER FUNCTIONS (DASHBOARD & BOARDS)
// ========================================================
function updateGlobalBadge() {
    let data = deduplicateTasks(filterTasksForCurrentAccess(globalData || []));

    const pendingData = data.filter(d => String(d.status || '').toLowerCase() === 'pending');
    const pendingCount = pendingData.length;

    const badge = document.getElementById('pending-badge');
    if (badge) {
        badge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
        badge.innerText = pendingCount;
    }

    if (window.tabBlinker) clearInterval(window.tabBlinker);
    if (pendingCount > 0) {
        let isRed = false;
        window.tabBlinker = setInterval(() => {
            document.title = isRed ? `🔴 (${pendingCount}) Pending Request!` : `(${pendingCount}) Creative Engine 2.0`;
            isRed = !isRed;
        }, 1500);
    } else {
        document.title = 'Adtechinno | Creative Engine 2.0';
    }

    const securePin = localStorage.getItem('adtech_lead_pin');
    if (navigator.setAppBadge && securePin) {
        pendingCount > 0 ? navigator.setAppBadge(pendingCount).catch(e=>{}) : navigator.clearAppBadge().catch(e=>{});
    }
}


function renderDashboard() {
    updateGlobalBadge();

    const finalRegion = currentRegionFilter || 'all';
    let data = deduplicateTasks(filterTasksForCurrentAccess(globalData || []));

    // 🌟 FIX BARU: BUANG TERUS DATA 'DELETED' DARI DASHBOARD
    data = data.filter(d => String(d.status || '').toLowerCase() !== 'deleted');

    const pendingData = data.filter(d => String(d.status || '').toLowerCase() === 'pending');
    const activeData = data.filter(d => String(d.status || '').toLowerCase() === 'approved' && String(d.work_status || '').toLowerCase() !== 'done');
    const approvedData = data.filter(d => String(d.status || '').toLowerCase() === 'approved');
    renderAdminHealthDashboard(data);

    const overdueJobs = sortTasksForStatus(activeData.filter(d => {
        const mode = shouldUseInternalDeadlineForTask(d) ? 'internal' : 'client';
        const diff = getDateOnlyDiffDays(getTaskDeadlineForView(d, mode));
        return diff !== null && diff < 0 && (mode === 'client' || isInternalProductionTask(d));
    }), 'Drafting');
    const urgentJobs = sortTasksForStatus(activeData.filter(d => {
        const mode = shouldUseInternalDeadlineForTask(d) ? 'internal' : 'client';
        const due = getTaskDeadlineForView(d, mode);
        return isDateDueWithinWorkingDays(due, 3) && (mode === 'client' || isInternalProductionTask(d));
    }), 'Drafting');

    const overdueVal = document.getElementById('overdue-val') || document.getElementById('total-val');
    if (overdueVal) overdueVal.innerText = overdueJobs.length;
    document.getElementById('pending-val').innerText = pendingData.length; document.getElementById('active-val').innerText = activeData.length;
    const dueSoonVal = document.getElementById('due-soon-val');
    if (dueSoonVal) dueSoonVal.innerText = urgentJobs.length;

   const maxRecent = window.innerWidth <= 992 ? 3 : 5;

    // 🌟 FIX: Terbalikkan (reverse) data dulu supaya ia dibaca dari bawah,
    // kemudian baru sort. Ini selesaikan masalah data import yang ada tarikh/masa serentak!
    const sortedData = [...data].reverse().sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
    });

    const recent5 = sortedData.slice(0, maxRecent);

    document.getElementById('recent-list').innerHTML = recent5.length ? recent5.map((d, index) => {
        const statusKey = String(d.status || '').toLowerCase();
        const statusLabel = statusKey === 'pending' ? 'Pending' : 'Approved';
        return `<tr onclick="if(typeof openDetailModal === 'function') openDetailModal('${d.job_id}')" class="clickable-row stagger-card" style="animation-delay: ${index * 0.05}s;" title="Click to view details"><td><span class="job-id-pill">${d.job_id} ${getFlag(d.region)}</span></td><td><div class="td-client">${d.client_name}</div><div style="font-size:0.75rem; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:150px;">${d.project_title}</div></td><td>${formatDate(getTaskClientDeadline(d))}</td><td style="text-align:center;"><span class="status-mini ${statusKey === 'pending' ? 'pending' : 'approved'}">${statusLabel}</span></td></tr>`;
    }).join('') : '<tr><td colspan="4"><div class="empty-state" style="padding:20px;"><i data-lucide="inbox"></i><p>No requests yet.</p></div></td></tr>';

    const isOperationalViewer = hasAdminAccess() || isCurrentUserCreativeTeamMember();
    const deadlineAttentionRows = [
        ...overdueJobs,
        ...urgentJobs.filter(task => !overdueJobs.some(overdue => overdue.job_id === task.job_id))
    ].map(task => {
        const mode = shouldUseInternalDeadlineForTask(task) ? 'internal' : 'client';
        return { task, label: formatDeadlineLabel(task, mode), meta: task.assignee && task.assignee !== 'null' ? task.assignee : 'Unassigned' };
    });
    const extraAttentionRows = isOperationalViewer ? [
        ...activeData.filter(task => !getTaskEffectiveInternalDueDate(task) && String(task.status || '').toLowerCase() === 'approved' && !isTaskDone(task))
            .map(task => ({ task, label: 'Set due date', meta: 'Manual deadline review' })),
        ...activeData.filter(task => {
            const diff = getDateOnlyDiffDays(getClientFollowUpDate(task));
            return isTaskAwaitingClient(task) && diff !== null && diff <= 0;
        })
            .map(task => ({ task, label: formatFollowUpLabel(task), meta: getClientFollowUpOwner(task) || 'No owner' })),
        ...activeData.filter(isClientReviewAgingTask)
            .map(task => {
                const age = getClientReviewAge(task);
                return { task, label: age.urgency === 'overdue' ? 'Review overdue' : 'Review aging', meta: age.label };
            })
    ] : [];
    const attentionRows = [...deadlineAttentionRows, ...extraAttentionRows]
        .filter((row, index, rows) => rows.findIndex(item => item.task.job_id === row.task.job_id && item.label === row.label) === index);
    const visibleUrgent = attentionRows.slice(0, window.innerWidth <= 992 ? 3 : 5);
    const moreUrgent = attentionRows.length - visibleUrgent.length;
    const emptyAttentionText = hasAdminAccess() || isCurrentUserCreativeTeamMember() ? 'No urgent internal deadlines.' : 'No urgent client deadlines.';
    document.getElementById('urgent-list').innerHTML = visibleUrgent.length ? `${visibleUrgent.map((row, index) => {
        const u = row.task;
        return `<div class="urgent-item clickable-row stagger-card" style="animation-delay: ${index * 0.05}s;" onclick="if(typeof openDetailModal === 'function') openDetailModal('${u.job_id}')" title="Click to view details"><div style="flex:1; overflow:hidden; padding-right:10px;"><div class="urgent-client">${u.client_name}</div><div class="urgent-meta"><span class="job-id-pill" style="padding: 2px 6px; font-size: 0.65rem;">${u.job_id} ${getFlag(u.region)}</span> • ${escapeHtml(row.meta)}</div></div><div class="urgent-date">${escapeHtml(row.label)}</div></div>`;
    }).join('')}${moreUrgent > 0 ? `<button class="dashboard-more-note" onclick="switchDashTab('cal')">${moreUrgent} more need attention · View calendar</button>` : ''}` : `<div class="empty-state" style="padding:20px;"><i data-lucide="coffee"></i><p>${emptyAttentionText}</p></div>`;

    let currentPicList = []; if (finalRegion === 'Malaysia') currentPicList = дизайнериMY; else if (finalRegion === 'Indonesia') currentPicList = дизайнериID; else currentPicList = PIC_LIST;
    document.getElementById('team-workload').innerHTML = currentPicList.map((pic, index) => {
        const memberInfo = globalTeamStatus.find(t => t.Name === pic); let isOnLeave = false; let matchedStatusIndex = -1;
        if (memberInfo && memberInfo.Status && String(memberInfo.Status).toLowerCase().includes('on leave')) {
            const checkToday = new Date(); checkToday.setHours(0,0,0,0); const dayOfWeek = checkToday.getDay();
            if(dayOfWeek !== 0 && dayOfWeek !== 6) {
                const startStrs = memberInfo.Start_Date.toString().split('|').map(s => s.trim()); const endStrs = memberInfo.End_Date.toString().split('|').map(s => s.trim());
                for(let i=0; i<startStrs.length; i++) {
                    const start = new Date(startStrs[i]); start.setHours(0,0,0,0); const end = new Date(endStrs[i]); end.setHours(23,59,59,999);
                    if (checkToday >= start && checkToday <= end) { isOnLeave = true; matchedStatusIndex = i; break; }
                }
            }
        }
        if (isOnLeave) {
            let leaveLabel = '✈️ ON LEAVE'; const statusStrs = memberInfo.Status.toString().split('|').map(s => s.trim()); let match = statusStrs[matchedStatusIndex].match(/\(([^)]+)\)/); if(match) { leaveLabel = '✈️ ' + match[1].toUpperCase(); }
            return `<div class="wl-bar-container stagger-card" style="opacity: 0.5; animation-delay: ${index * 0.05}s;"><div class="wl-info"><span>${pic}</span><span style="color:var(--red); font-weight:700; font-size:0.65rem; border:1px solid var(--red); padding:2px 6px; border-radius:4px;">${leaveLabel}</span></div><div class="wl-track"><div class="wl-fill" style="width:0%; background:var(--text-muted);"></div></div></div>`;
        }
        const count = activeData.filter(d => d.assignee && String(d.assignee).includes(pic)).length; const maxCap = 10; const pct = Math.min((count / maxCap) * 100, 100); let color = 'var(--accent)'; if(count >= 6) color = 'var(--orange)'; if(count >= 9) color = 'var(--red)';
        return `<div class="wl-bar-container stagger-card" style="animation-delay: ${index * 0.05}s;"><div class="wl-info"><span>${pic}</span><span>${count} Jobs</span></div><div class="wl-track"><div class="wl-fill" style="width:${pct}%; background:${color};"></div></div></div>`;
    }).join('');

    renderCalendar(approvedData); refreshIcons();
}

function renderAdminHealthDashboard(data) {
    const card = document.getElementById('adminHealthCard');
    const wrap = document.getElementById('adminHealthDashboard');
    const badge = document.getElementById('healthScoreBadge');
    if (!card || !wrap) return;
    if (!localStorage.getItem('adtech_lead_pin')) { card.style.display = 'none'; return; }

    card.style.display = 'block';
    const now = new Date();
    const hoursSince = (dateStr) => {
        const d = new Date(dateStr);
        return dateStr && !isNaN(d) ? (now - d) / 36e5 : 0;
    };
    const active = (data || []).filter(d =>
        (String(d.status || '').toLowerCase() === 'pending' || String(d.status || '').toLowerCase() === 'approved') &&
        String(d.status || '').toLowerCase() !== 'deleted' &&
        String(d.work_status || '').toLowerCase() !== 'done'
    );
    const approvedActive = active.filter(d => String(d.status || '').toLowerCase() === 'approved');
    const internalActive = active.filter(isInternalProductionTask);
    const clientBlocked = active.filter(isTaskAwaitingClient);
    const pending = (data || []).filter(d => String(d.status || '').toLowerCase() === 'pending');
    const completed = (data || []).filter(d => String(d.work_status || '').toLowerCase() === 'done');
    const overdue = internalActive.filter(d => {
        const diff = getDateOnlyDiffDays(getTaskEffectiveInternalDueDate(d));
        return diff !== null && diff < 0;
    });
    const dueSoon = internalActive.filter(d => {
        return isDateDueWithinWorkingDays(getTaskEffectiveInternalDueDate(d), 3);
    });
    const missingInternalDue = internalActive.filter(d => !getTaskEffectiveInternalDueDate(d));
    const followUpOverdue = clientBlocked.filter(d => {
        const diff = getDateOnlyDiffDays(getClientFollowUpDate(d));
        return diff !== null && diff < 0;
    });
    const followUpToday = clientBlocked.filter(d => getDateOnlyDiffDays(getClientFollowUpDate(d)) === 0);
    const clientWaitingDays = clientBlocked.map(getClientWaitingDays).filter(v => v >= 0);
    const avgClientWaiting = clientWaitingDays.length ? Math.round((clientWaitingDays.reduce((a, b) => a + b, 0) / clientWaitingDays.length) * 10) / 10 : 0;
    const longestClientWaitingTask = clientBlocked.slice().sort((a, b) => getClientWaitingDays(b) - getClientWaitingDays(a))[0];
    const clientReviewAging = approvedActive.filter(isClientReviewAgingTask);
    const clientReviewMovingSoon = approvedActive.filter(d => {
        if (!isTaskClientReview(d)) return false;
        const urgency = getClientReviewAge(d).urgency;
        return urgency === 'moving-soon' || urgency === 'overdue';
    });
    const clientReviewMissingOwner = clientBlocked.filter(d => !getClientFollowUpOwner(d));
    const setupIssueActive = clientReviewSetupState.checked && clientReviewSetupState.ok === false;
    const stuckDrafting = approvedActive.filter(d => String(d.work_status || '').toLowerCase() === 'drafting' && hoursSince(getStatusStartedAt(d)) >= 72);
    const oldPending = pending.filter(d => hoursSince(d.created_at) >= 24);
    const highRevision = active.filter(d => Number(d.revision || 0) >= 2);
    const staleUpdate = active.filter(d => hoursSince(getLastUpdateAt(d)) >= 72);

    const counts = {};
    approvedActive.forEach(d => (getAssignedPICNames(d.assignee).length ? getAssignedPICNames(d.assignee) : ['Unassigned']).forEach(n => counts[n] = (counts[n] || 0) + 1));
    const overloaded = Object.entries(counts).filter(([name, count]) => name !== 'Unassigned' && count >= 6).sort((a, b) => b[1] - a[1]);
    const score = Math.max(0, 100 - (overdue.length * 9 + followUpOverdue.length * 7 + missingInternalDue.length * 5 + clientReviewAging.length * 5 + stuckDrafting.length * 5 + overloaded.length * 8 + highRevision.length * 4 + oldPending.length * 3 + staleUpdate.length * 2 + clientReviewMissingOwner.length * 4 + (setupIssueActive ? 25 : 0)));
    const tone = score >= 80 ? 'good' : score >= 60 ? 'warn' : 'danger';
    if (badge) { badge.className = `health-score-badge ${tone}`; badge.innerText = `${score}% Health`; }

    const completedHours = completed.map(getTaskCompletionHours).filter(v => v !== '').map(Number);
    const avg = completedHours.length ? Math.round((completedHours.reduce((a, b) => a + b, 0) / completedHours.length) * 10) / 10 : '';
    const criticalCount = overdue.length + overloaded.length + followUpOverdue.length + (setupIssueActive ? 1 : 0);
    const watchCount = clientReviewAging.length + stuckDrafting.length + oldPending.length + highRevision.length + staleUpdate.length + missingInternalDue.length + clientBlocked.length + followUpToday.length + clientReviewMissingOwner.length;
    const headline = score >= 80 ? 'Team flow looks steady today.' : score >= 60 ? 'A few items need admin attention.' : 'Critical blockers need action today.';
    const issues = [
        ...(setupIssueActive ? [{ tone: 'danger', title: 'Client Review SQL setup issue', meta: clientReviewSetupState.message, jobID: '' }] : []),
        ...overdue.map(d => ({ tone: 'danger', title: 'Overdue task', meta: `${d.job_id} · ${d.client_name}`, jobID: d.job_id })),
        ...followUpOverdue.map(d => ({ tone: 'danger', title: 'Client follow-up overdue', meta: `${d.job_id} · ${getClientFollowUpOwner(d) || 'No owner'}`, jobID: d.job_id })),
        ...overloaded.map(([name, count]) => ({ tone: 'danger', title: 'PIC overloaded', meta: `${name} has ${count} active jobs`, jobID: '' })),
        ...followUpToday.map(d => ({ tone: 'warn', title: 'Client follow-up today', meta: `${d.job_id} · ${getClientFollowUpOwner(d) || 'No owner'}`, jobID: d.job_id })),
        ...clientReviewMovingSoon.map(d => {
            const age = getClientReviewAge(d);
            return { tone: age.urgency === 'overdue' ? 'danger' : 'warn', title: age.urgency === 'overdue' ? 'Client review overdue' : 'Move to Awaiting soon', meta: `${d.job_id} · ${age.workingDays} working days`, jobID: d.job_id };
        }),
        ...missingInternalDue.map(d => ({ tone: 'warn', title: 'Missing internal due', meta: `${d.job_id} · ${d.client_name}`, jobID: d.job_id })),
        ...clientReviewAging.filter(d => !clientReviewMovingSoon.includes(d)).map(d => {
            const age = getClientReviewAge(d);
            return { tone: 'warn', title: 'Client review aging', meta: `${d.job_id} · ${age.label}`, jobID: d.job_id };
        }),
        ...clientReviewMissingOwner.map(d => ({ tone: 'warn', title: 'Missing follow-up owner', meta: `${d.job_id} · Awaiting Client`, jobID: d.job_id })),
        ...stuckDrafting.map(d => ({ tone: 'warn', title: 'Drafting longer than 3 days', meta: `${d.job_id} · ${d.client_name}`, jobID: d.job_id })),
        ...(longestClientWaitingTask ? [{ tone: 'neutral', title: 'Longest client wait', meta: `${longestClientWaitingTask.job_id} · ${getClientWaitingDays(longestClientWaitingTask)}d`, jobID: longestClientWaitingTask.job_id }] : []),
        ...oldPending.map(d => ({ tone: 'warn', title: 'Pending approval over 24h', meta: `${d.job_id} · ${d.client_name}`, jobID: d.job_id })),
        ...highRevision.map(d => ({ tone: 'warn', title: 'High revision count', meta: `${d.job_id} · ${d.revision || 0} revisions`, jobID: d.job_id })),
        ...staleUpdate.map(d => ({ tone: 'neutral', title: 'No update over 3 days', meta: `${d.job_id} · ${d.client_name}`, jobID: d.job_id }))
    ];
    const primaryIssues = issues.slice(0, 3);
    const hiddenIssues = issues.slice(3, 10);
    const renderIssue = ({ tone: issueTone, title, meta, jobID }) => `<div class="health-issue ${issueTone}" ${jobID ? `onclick="openDetailModal('${jobID}')"` : ''}><div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(meta)}</span></div>${jobID ? '<i data-lucide="chevron-right"></i>' : ''}</div>`;

    wrap.innerHTML = `
        <div class="health-overview ${tone}">
            <div>
                <span>Workspace Health</span>
                <strong>${score}%</strong>
            </div>
            <p>${headline}</p>
        </div>
        <div class="health-signal-row">
            <div class="health-signal ${criticalCount ? 'danger' : 'good'}"><span>Critical</span><strong>${criticalCount}</strong></div>
            <div class="health-signal ${watchCount ? 'warn' : 'good'}"><span>Watch</span><strong>${watchCount}</strong></div>
            <div class="health-signal"><span>Pace</span><strong>${avg ? `${avg}h` : `${completed.length} done`}</strong></div>
        </div>
        <div class="health-subline"><span>${internalActive.length} internal active</span><span>${clientReviewAging.length} review aging</span><span>${clientBlocked.length} client blocked</span><span>${avgClientWaiting || 0}d avg wait</span><span>${clientReviewSetupState.ok === false ? 'setup needs SQL' : clientReviewSetupState.ok === true ? 'SQL ready' : 'SQL unchecked'}</span></div>
        <div class="health-section-title">Focus Now</div>
        <div class="health-issue-list">${primaryIssues.length ? primaryIssues.map(renderIssue).join('') : `<div class="health-clear-state"><i data-lucide="check-circle"></i><div><strong>Healthy right now</strong><span>No urgent admin risks detected.</span></div></div>`}</div>
        ${hiddenIssues.length ? `<details class="health-more"><summary>Show ${hiddenIssues.length} more signals</summary><div class="health-issue-list">${hiddenIssues.map(renderIssue).join('')}</div></details>` : ''}
    `;
    refreshIcons();
}

function renderBoards() {
    const isWorkloadTab = document.getElementById('workload') && document.getElementById('workload').classList.contains('active');
    const isDoneTab = document.getElementById('done') && document.getElementById('done').classList.contains('active');

    if (!isWorkloadTab && !isDoneTab) return;

    syncRequestBoardSortControl();
    const sortMode = getBoardSortMode();
    let data = deduplicateTasks(filterTasksForCurrentAccess(globalData || []));

    // ==========================================
    // RENDER WORKLOAD (REQUEST STATUS BOARD)
    // ==========================================
    if (isWorkloadTab) {
        let activeData = data.filter(d =>
            String(d.status || '').toLowerCase() === 'pending' ||
            (String(d.status || '').toLowerCase() === 'approved' && String(d.work_status || '').toLowerCase() !== 'done')
        );

        const qW = document.getElementById('searchWorkload') ? document.getElementById('searchWorkload').value.toLowerCase() : '';
        if(qW) {
            activeData = activeData.filter(d => String(d.job_id || '').toLowerCase().includes(qW) || String(d.client_name || '').toLowerCase().includes(qW) || String(d.requester_name || '').toLowerCase().includes(qW) || String(d.assignee || '').toLowerCase().includes(qW) || getTaskNoteValue(d).toLowerCase().includes(qW));
        }
        renderRequestBoardFilters(activeData);
        activeData = deduplicateTasks(activeData.filter(taskMatchesRequestBoardFilter));

        if (typeof isKanbanMode !== 'undefined' && isKanbanMode) {
            if (typeof renderKanbanBoard === 'function') renderKanbanBoard();
        } else {
            if (activeData.length === 0) {
                document.getElementById('projectList').innerHTML = '<div class="empty-state"><i data-lucide="search-x"></i><p>No matching requests found.</p></div>';
            } else {
                let listHtml = '';
                const statusGroups = [
                    { id: 'pending', label: 'Inbox (Pending)', color: 'var(--red)', bg: 'rgba(239, 68, 68, 0.1)' },
                    { id: 'not started', label: 'Not Started', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' },
                    { id: 'drafting', label: 'Drafting', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
                    { id: 'partial ready', label: 'Partial Ready', color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.1)' },
                    { id: 'revision', label: 'Revision', color: '#ea580c', bg: 'rgba(234, 88, 12, 0.1)' },
                    { id: 'internal review', label: 'Internal Review', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.1)' },
                    { id: 'client review', label: 'Client Review', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
                    { id: 'awaiting client', label: 'Awaiting Client', color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)' }
                ];

                statusGroups.forEach(cfg => {
                    let groupTasks = [];
                    if (cfg.id === 'pending') groupTasks = activeData.filter(d => String(d.status || '').toLowerCase() === 'pending');
                    else groupTasks = activeData.filter(d => String(d.status || '').toLowerCase() === 'approved' && normalizeWorkStatus(d.work_status || 'not started') === cfg.id);
                    groupTasks = sortTasksForStatus(groupTasks, cfg.id, sortMode);

                    if (groupTasks.length > 0) {
                        listHtml += `<h3 class="month-group-header" style="border-bottom-color: ${cfg.color}; color: ${cfg.color}; margin-top: 30px;"><span style="display:flex; align-items:center; gap:10px;"><span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:${cfg.color};"></span>${cfg.label.toUpperCase()}</span><span class="month-group-badge" style="background: ${cfg.bg}; color: ${cfg.color};">${groupTasks.length} Tasks</span></h3>`;
                        listHtml += `<div class="project-grid">` + groupTasks.map((item, index) => generateJobCard(item, false, index)).join('') + `</div>`;
                    }
                });
                document.getElementById('projectList').innerHTML = listHtml;
            }
        }
    }

    // ==========================================
    // RENDER DONE TASKS
    // ==========================================
    if (isDoneTab) {
        let doneData = sortDoneTasks(data.filter(d => String(d.status || '').toLowerCase() === 'approved' && String(d.work_status || '').toLowerCase() === 'done'), sortMode);

        const qD = document.getElementById('searchDone') ? document.getElementById('searchDone').value.toLowerCase() : '';
        if(qD) doneData = sortDoneTasks(doneData.filter(d => String(d.job_id || '').toLowerCase().includes(qD) || String(d.client_name || '').toLowerCase().includes(qD) || String(d.requester_name || '').toLowerCase().includes(qD) || String(d.assignee || '').toLowerCase().includes(qD) || getTaskNoteValue(d).toLowerCase().includes(qD)), sortMode);

        if (doneData.length === 0) {
            document.getElementById('doneList').innerHTML = '<div class="empty-state"><i data-lucide="search-x"></i><p>No matching tasks found.</p></div>';
        } else {
            const groupedDone = {};
            doneData.forEach(item => {
                let sortKey = "0000-00"; let displayLabel = "No Date";
                let targetDate = getTaskCompletedAt(item) ? getTaskCompletedAt(item) : getTaskClientDeadline(item);
                if(targetDate) {
                    const d = parseDateOnly(targetDate);
                    if(d) {
                        sortKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`;
                        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                        displayLabel = `Completed: ${months[d.getMonth()]} ${d.getFullYear()}`;
                    }
                }
                if(!groupedDone[sortKey]) groupedDone[sortKey] = { label: displayLabel, tasks: [] };
                groupedDone[sortKey].tasks.push(item);
            });

            const sortedKeys = Object.keys(groupedDone).sort((a, b) => b.localeCompare(a));
            let doneHtml = '';

            if (typeof isDoneKanbanMode !== 'undefined' && isDoneKanbanMode) {
                doneHtml += '<div class="kanban-board-wrapper">';
                sortedKeys.forEach(key => {
                    const group = groupedDone[key];
                    group.tasks = sortDoneTasks(group.tasks, sortMode);

                    doneHtml += `
                    <div class="kanban-column" style="border-top-color: var(--green);">
                        <div class="kanban-column-header">
                            <span style="color: var(--text-strong);">${group.label}</span>
                            <span class="kanban-column-count" style="background: rgba(16, 185, 129, 0.1); color: var(--green);">${group.tasks.length}</span>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            ${group.tasks.map((item, idx) => {
                                let isJustDone = false;
                                if (item.done_at) {
                                    const diffHours = (new Date() - new Date(item.done_at)) / (1000 * 60 * 60);
                                    if (diffHours <= 24) isJustDone = true;
                                }
                                // 🌟 FIX: Guna class CSS baru untuk Kanban Card
                                const glow = isJustDone ? 'border-left-color: var(--green); background: linear-gradient(90deg, rgba(16,185,129,0.05) 0%, transparent 80%); box-shadow: 0 4px 15px rgba(16,185,129,0.1);' : 'border-left-color: var(--green);';
                                const badge = isJustDone ? '<span class="badge-recent">✨ RECENTLY DONE</span>' : '';

                                return `
                                <div class="kanban-drag-card" onclick="openDetailModal('${item.job_id}')" title="Click to view full details" style="${glow} cursor: pointer;">
                                    <div style="display:flex; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:8px;">
                                        <span class="kd-id" style="margin:0; white-space:nowrap;">[${item.job_id}] ${getFlag(item.region)}</span>
                                        ${badge}
                                    </div>
                                    <div class="kd-title">${item.client_name}: ${item.project_title}</div>
                                    ${renderTaskNotePreview(item)}
                                    <div class="kd-footer">
                                        <span><i data-lucide="user" style="width:12px; margin-right:4px;"></i>${item.assignee !== 'null' ? item.assignee : 'Unassigned'}</span>
                                        <span style="color: var(--green); font-weight: 700;"><i data-lucide="check-circle" style="width:12px; margin-right:4px; vertical-align:text-bottom;"></i>Done</span>
                                    </div>
                                </div>
                                `;
                            }).join('')}
                        </div>
                    </div>`;
                });
                doneHtml += '</div>';
            } else {
                sortedKeys.forEach(key => {
                    const group = groupedDone[key];
                    group.tasks = sortDoneTasks(group.tasks, sortMode);
                    doneHtml += `<h3 class="month-group-header">${group.label} <span class="month-group-badge">${group.tasks.length} Tasks</span></h3>`;
                    doneHtml += `<div class="project-grid">` + group.tasks.map((item, idx) => generateJobCard(item, true, idx)).join('') + `</div>`;
                });
            }
            document.getElementById('doneList').innerHTML = doneHtml;
        }
    }
    refreshIcons();
}

function viewMyRequests() {
    showPage('workload');
    currentRegionFilter = 'all';
    document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    const allToggle = document.getElementById('t-all');
    if (allToggle) allToggle.classList.add('active');
    requestBoardDeadlineFilter = 'all';

    const savedName = localStorage.getItem('adtech_user_name');
    const searchBox = document.getElementById('searchWorkload');
    if (searchBox) searchBox.value = hasAdminAccess() && savedName ? extractFirstName(savedName) : '';
    renderBoards();
}

function generateJobCard(item, isDoneTab = false, index = 0) {
    const isPending = String(item.status || '').toLowerCase() === 'pending';
    const ws = isPending ? 'Inbox (Pending)' : getWorkStatusLabel(item.work_status || 'Not started');

    const wsClass = isPending ? 'ws-pending' : `ws-${getWorkStatusSlug(item.work_status || 'Not started')}`;
    const borderColors = { 'Inbox (Pending)': '#ef4444', 'Not started': '#94a3b8', 'Drafting': '#f59e0b', 'Partial Ready': '#14b8a6', 'Internal Review': '#0ea5e9', 'Revision': '#ea580c', 'Client Review': '#8b5cf6', 'Awaiting Client': '#d97706', 'Done': '#10b981' };
    const borderColor = borderColors[ws] || '#cbd5e1';

    const typeMeta = getRequestTypeMeta(item);

    let isJustDone = false;
    if (isDoneTab && item.done_at) {
        const diffHours = (new Date() - new Date(item.done_at)) / (1000 * 60 * 60);
        if (diffHours <= 24) isJustDone = true;
    }

    // 🌟 FIX: Guna class CSS baru yang lebih kemas & menyokong Light/Dark Mode
    const glowStyle = isJustDone ? `border-left-color: var(--green); background: linear-gradient(90deg, rgba(16,185,129,0.05) 0%, transparent 80%); box-shadow: 0 4px 15px rgba(16,185,129,0.1);` : `border-left-color: ${borderColor};`;

    const newBadge = isJustDone ? `<span class="badge-recent">✨ RECENTLY DONE</span>` : '';

    return `
        <div class="kanban-card request-type-card type-${typeMeta.key} stagger-card" style="${glowStyle} animation-delay: ${index * 0.05}s;" onclick="if(typeof openDetailModal === 'function') openDetailModal('${item.job_id}')">
            <div class="kb-header" style="display:flex; align-items:flex-start; justify-content:space-between; gap: 8px;">
                <div style="display:flex; align-items:center; flex-wrap:wrap; gap:6px;">
                    <span class="kb-id" style="margin:0; white-space:nowrap;">[${item.job_id}] ${getFlag(item.region)}</span>
                    ${renderRequestTypePill(item, true)}
                    ${newBadge}
                </div>
                <strong class="ws-badge ${wsClass}" ${isPending ? 'style="background: #ef4444;"' : ''}>${ws}</strong>
            </div>
            <div class="kb-title">${item.client_name}: ${item.project_title}</div>
            ${renderMonthlyProgressChip(item)}
            ${renderShootReadinessChip(item)}
            ${renderTaskNotePreview(item)}
            ${renderTaskDeadlineRow(item)}
            <div class="kb-footer">
                <div class="kb-pic"><i data-lucide="user"></i> ${item.assignee && item.assignee !== 'null' ? item.assignee : 'Unassigned'}</div>
            </div>
        </div>
    `;
}

// ========================================================
// 🌟 8. CALENDAR SYSTEM
// ========================================================
function getCalendarSourceTasks() {
    return filterTasksForCurrentAccess((globalData || []).filter(task =>
        String(task.status || '').toLowerCase() === 'approved' &&
        String(task.status || '').toLowerCase() !== 'deleted'
    ));
}

function getCalendarMode() {
    if (calendarViewMode === 'month' || calendarViewMode === 'agenda') return calendarViewMode;
    return window.innerWidth <= 720 ? 'agenda' : 'month';
}

function setCalendarView(mode) {
    calendarViewMode = mode === 'agenda' ? 'agenda' : 'month';
    localStorage.setItem('adtech_calendar_view', calendarViewMode);
    renderCalendar(getCalendarSourceTasks());
    refreshIcons();
}

function toggleCalendarCompleted(event) {
    calendarShowCompleted = Boolean(event?.target?.checked);
    localStorage.setItem('adtech_calendar_show_completed', calendarShowCompleted ? 'true' : 'false');
    renderCalendar(getCalendarSourceTasks());
    refreshIcons();
}

function goCalendarToday() {
    const today = new Date();
    calMonth = today.getMonth();
    calYear = today.getFullYear();
    selectedCalendarDateKey = toDateInputValue(today);
    renderCalendar(getCalendarSourceTasks());
    refreshIcons();
}

function getTaskCalendarDateForViewer(task = {}) {
    if (isTaskDone(task)) return calendarShowCompleted ? getTaskCompletedAt(task) : '';
    if (isTaskAwaitingClient(task)) return getClientFollowUpDate(task);
    const mode = shouldUseInternalDeadlineForTask(task) ? 'internal' : 'client';
    return getTaskDeadlineForView(task, mode);
}

function getTaskCalendarDateType(task = {}) {
    if (isTaskDone(task)) return 'Completed';
    if (isTaskAwaitingClient(task)) return 'Follow-up';
    return shouldUseInternalDeadlineForTask(task) ? 'Internal Due' : 'Client Deadline';
}

function getCalendarUrgency(dateValue, task = {}) {
    if (isTaskDone(task)) return { state: 'done', label: 'Completed', diff: null };
    const diff = getDateOnlyDiffDays(dateValue);
    if (diff === null) return { state: 'missing', label: 'No date', diff: null };
    if (diff < 0) return { state: 'overdue', label: `Overdue ${Math.abs(diff)}d`, diff };
    if (diff === 0) return { state: 'today', label: 'Today', diff };
    if (diff === 1) return { state: 'tomorrow', label: 'Tomorrow', diff };
    if (diff <= 3) return { state: 'soon', label: `${diff}d`, diff };
    if (diff <= 7) return { state: 'week', label: `${diff}d`, diff };
    return { state: 'neutral', label: `${diff}d`, diff };
}

function getCalendarStatusSlug(task = {}) {
    return getTaskStatusKey(task).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'not-started';
}

function getCalendarEvents(sourceTasks = []) {
    const seen = new Set();
    return sourceTasks
        .map(task => {
            const dateValue = getTaskCalendarDateForViewer(task);
            const dateKey = toDateInputValue(dateValue);
            if (!dateKey) return null;
            const key = `${task.job_id}-${dateKey}`;
            if (seen.has(key)) return null;
            seen.add(key);
            const urgency = getCalendarUrgency(dateKey, task);
            return {
                task,
                dateKey,
                urgency,
                statusSlug: getCalendarStatusSlug(task),
                dateType: getTaskCalendarDateType(task)
            };
        })
        .filter(Boolean)
        .sort((a, b) => a.dateKey.localeCompare(b.dateKey) || String(a.task.job_id || '').localeCompare(String(b.task.job_id || '')));
}

function groupCalendarEventsByDate(events = []) {
    return events.reduce((groups, event) => {
        if (!groups[event.dateKey]) groups[event.dateKey] = [];
        groups[event.dateKey].push(event);
        return groups;
    }, {});
}

function formatCalendarMonthLabel() {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${monthNames[calMonth]} ${calYear}`;
}

function formatCalendarDateTitle(dateKey) {
    const date = parseDateOnly(dateKey);
    if (!date) return 'Selected Day';
    return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function getCalendarEventTitle(task = {}) {
    return `${task.client_name || 'Untitled'} - ${task.project_title || 'No title'}`;
}

function renderCalendarEvent(event, compact = false) {
    const task = event.task;
    const title = getCalendarEventTitle(task);
    const status = getWorkStatusLabel(task.work_status || 'Not started');
    const assignee = getAssigneeDisplay(task.assignee);
    const aria = `${title}, ${status}, ${event.dateType} ${formatDate(event.dateKey)}, assigned to ${assignee}`;
    return `
        <button type="button"
            class="calendar-event status-${event.statusSlug} urgency-${event.urgency.state} ${isTaskDone(task) ? 'is-done' : ''}"
            onclick="event.stopPropagation(); openDetailModal('${escapeJsString(task.job_id)}')"
            title="${escapeHtml(`${title} · ${status} · ${event.dateType}: ${formatDate(event.dateKey)} · ${assignee}`)}"
            aria-label="${escapeHtml(aria)}">
            <span class="calendar-urgency-light" aria-hidden="true"></span>
            <span class="calendar-event-title">${escapeHtml(compact ? (task.client_name || task.job_id) : title)}</span>
        </button>
    `;
}

function renderCalendarMonth(events = []) {
    const eventsByDate = groupCalendarEventsByDate(events);
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const weeks = totalCells / 7;
    const startDate = new Date(calYear, calMonth, 1 - firstDay);
    const todayKey = toDateInputValue(new Date());
    const maxVisible = window.innerWidth <= 920 ? 2 : 3;
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    let html = `<div class="calendar-grid weeks-${weeks}">`;
    dayNames.forEach(day => { html += `<div class="calendar-day-header">${day}</div>`; });

    for (let index = 0; index < totalCells; index++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + index);
        const dateKey = toDateInputValue(date);
        const inMonth = date.getMonth() === calMonth;
        const isToday = dateKey === todayKey;
        const isSelected = dateKey === selectedCalendarDateKey;
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const dayEvents = eventsByDate[dateKey] || [];
        const visibleEvents = dayEvents.slice(0, maxVisible);
        const moreCount = dayEvents.length - visibleEvents.length;
        const className = [
            'calendar-day',
            inMonth ? '' : 'outside-month',
            isToday ? 'today' : '',
            isSelected ? 'selected' : '',
            isWeekend ? 'weekend' : '',
            dayEvents.length ? 'has-events' : ''
        ].filter(Boolean).join(' ');

        html += `
            <div class="${className}" role="button" tabindex="0" aria-label="${escapeHtml(formatCalendarDateTitle(dateKey))}, ${dayEvents.length} task${dayEvents.length === 1 ? '' : 's'}"
                onclick="openCalendarDayDrawer('${dateKey}')"
                onkeydown="handleCalendarDayKeydown(event, '${dateKey}')">
                <div class="calendar-date"><span>${date.getDate()}</span></div>
                <div class="calendar-event-stack">
                    ${visibleEvents.map(event => renderCalendarEvent(event, true)).join('')}
                    ${moreCount > 0 ? `<button type="button" class="calendar-more-btn" onclick="event.stopPropagation(); openCalendarDayDrawer('${dateKey}')">+${moreCount} more</button>` : ''}
                </div>
            </div>
        `;
    }

    return html + '</div>';
}

function renderCalendarAgenda(events = []) {
    const monthEvents = events.filter(event => {
        const date = parseDateOnly(event.dateKey);
        return date && date.getMonth() === calMonth && date.getFullYear() === calYear;
    });
    const eventsByDate = groupCalendarEventsByDate(monthEvents);
    const dateKeys = Object.keys(eventsByDate).sort();

    if (!dateKeys.length) {
        return '<div class="calendar-empty-state"><i data-lucide="calendar-x"></i><strong>No scheduled tasks</strong><span>Nothing due in this month for your authorised task list.</span></div>';
    }

    return `<div class="calendar-agenda-list">${dateKeys.map(dateKey => `
        <section class="calendar-agenda-day">
            <button type="button" class="calendar-agenda-date" onclick="openCalendarDayDrawer('${dateKey}')">
                <strong>${escapeHtml(formatCalendarDateTitle(dateKey))}</strong>
                <span>${eventsByDate[dateKey].length} task${eventsByDate[dateKey].length === 1 ? '' : 's'}</span>
            </button>
            <div class="calendar-agenda-events">
                ${eventsByDate[dateKey].map(event => {
                    const task = event.task;
                    return `
                        <button type="button" class="calendar-agenda-event status-${event.statusSlug} urgency-${event.urgency.state}" onclick="openDetailModal('${escapeJsString(task.job_id)}')">
                            <span class="calendar-urgency-light" aria-hidden="true"></span>
                            <span>
                                <strong>${escapeHtml(getCalendarEventTitle(task))}</strong>
                                <small>${escapeHtml(getWorkStatusLabel(task.work_status || 'Not started'))} · ${escapeHtml(event.dateType)} · ${escapeHtml(getAssigneeDisplay(task.assignee))}</small>
                            </span>
                        </button>
                    `;
                }).join('')}
            </div>
        </section>
    `).join('')}</div>`;
}

function renderCalendar(approvedData = null) {
    const calDiv = document.getElementById('deadline-calendar');
    if (!calDiv) return;
    const sourceTasks = Array.isArray(approvedData) ? approvedData : getCalendarSourceTasks();
    const events = getCalendarEvents(sourceTasks);
    const mode = getCalendarMode();
    const monthEventCount = events.filter(event => {
        const date = parseDateOnly(event.dateKey);
        return date && date.getMonth() === calMonth && date.getFullYear() === calYear;
    }).length;

    calDiv.innerHTML = `
        <div class="calendar-toolbar">
            <div class="calendar-toolbar-main">
                <button type="button" class="calendar-nav-btn" onclick="goCalendarToday()" aria-label="Go to today"><span>Today</span></button>
                <button type="button" class="calendar-icon-btn" onclick="changeMonth(-1)" aria-label="Previous month"><i data-lucide="chevron-left"></i></button>
                <div class="calendar-month-label">${formatCalendarMonthLabel()}<span>${monthEventCount} task${monthEventCount === 1 ? '' : 's'}</span></div>
                <button type="button" class="calendar-icon-btn" onclick="changeMonth(1)" aria-label="Next month"><i data-lucide="chevron-right"></i></button>
            </div>
            <div class="calendar-toolbar-actions">
                <div class="calendar-view-toggle" role="group" aria-label="Calendar view">
                    <button type="button" class="${mode === 'month' ? 'active' : ''}" onclick="setCalendarView('month')">Month</button>
                    <button type="button" class="${mode === 'agenda' ? 'active' : ''}" onclick="setCalendarView('agenda')">Agenda</button>
                </div>
                <label class="calendar-completed-toggle"><input type="checkbox" ${calendarShowCompleted ? 'checked' : ''} onchange="toggleCalendarCompleted(event)"><span>Completed</span></label>
            </div>
        </div>
        ${mode === 'agenda' ? renderCalendarAgenda(events) : renderCalendarMonth(events)}
    `;
}

function changeMonth(offset) {
    calMonth += offset;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    else if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar(getCalendarSourceTasks());
    refreshIcons();
}

function handleCalendarDayKeydown(event, dateKey) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openCalendarDayDrawer(dateKey);
}

function openCalendarDayDrawer(dateKey) {
    selectedCalendarDateKey = dateKey;
    const events = getCalendarEvents(getCalendarSourceTasks()).filter(event => event.dateKey === dateKey);
    const title = formatCalendarDateTitle(dateKey);
    const body = events.length ? `
        <div class="calendar-day-drawer-summary">${events.length} authorised task${events.length === 1 ? '' : 's'}</div>
        <div class="calendar-day-drawer-list">
            ${events.map(event => {
                const task = event.task;
                return `
                    <button type="button" class="calendar-day-drawer-task status-${event.statusSlug} urgency-${event.urgency.state}" onclick="openDetailModal('${escapeJsString(task.job_id)}')">
                        <span class="calendar-urgency-light" aria-hidden="true"></span>
                        <span>
                            <strong>${escapeHtml(getCalendarEventTitle(task))}</strong>
                            <small>${escapeHtml(getWorkStatusLabel(task.work_status || 'Not started'))} · ${escapeHtml(event.dateType)} ${escapeHtml(formatDate(event.dateKey))}</small>
                            <em>${escapeHtml(getAssigneeDisplay(task.assignee))} · ${getFlag(task.region)} ${escapeHtml(task.region || 'No region')}</em>
                        </span>
                        <i data-lucide="chevron-right"></i>
                    </button>
                `;
            }).join('')}
        </div>
    ` : '<div class="calendar-empty-state compact"><i data-lucide="calendar"></i><strong>No tasks</strong><span>No authorised tasks scheduled for this date.</span></div>';

    document.getElementById('calDayTitle').innerText = title;
    document.getElementById('calDayBody').innerHTML = body;
    renderCalendar(getCalendarSourceTasks());
    refreshIcons();
    const modal = document.getElementById('calDayModal');
    modal.style.display = 'flex';
    modal.offsetHeight;
    modal.classList.add('show');
    document.body.classList.add('no-scroll');
}

function openCalDay(year, month, day) {
    openCalendarDayDrawer(toDateInputValue(new Date(year, month, day)));
}
// ========================================================
// 🌟 9. MODALS & POP-UPS
// ========================================================
function closeDetailModal() {
    const modal = document.getElementById('globalDetailModal');
    if(!modal) return;
    delete modal.dataset.currentJobId;
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.classList.remove('no-scroll');
    }, 400);
}

function closeCalModal() {
    const modal = document.getElementById('calDayModal');
    if(!modal) return;
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.classList.remove('no-scroll');
    }, 400);
}

function closeEditModal(options = {}) {
    const modal = document.getElementById('editModal');
    if(!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
        modal.style.display = 'none';
        const detailOpen = document.getElementById('globalDetailModal')?.classList.contains('show');
        if (!options.keepBodyLock && !detailOpen) document.body.classList.remove('no-scroll');
        if (editModalLastFocus && typeof editModalLastFocus.focus === 'function') {
            try { editModalLastFocus.focus({ preventScroll: true }); } catch(e) {}
        }
        editModalLastFocus = null;
        if (!options.keepState) activeEditTaskState = null;
    }, 220);
}

function getMonthlyCompletionWarning(task = {}) {
    const summary = getMonthlyDeliverableSummary(task);
    if (!summary?.total) return null;
    const progress = getMonthlyProgressState(task, summary);
    const ready = clampMonthlyReady(progress.readyTotal, summary.total);
    return ready < summary.total ? { ready, total: summary.total } : null;
}

async function confirmMonthlyCompletionIfNeeded(task = {}) {
    const warning = getMonthlyCompletionWarning(task);
    if (!warning) return true;
    return showAppleConfirm(
        'Not all deliverables are marked ready',
        `${warning.ready} of ${warning.total} deliverables are currently ready.\n\nMove this monthly task to Done anyway?`,
        { icon: 'alert-triangle', tone: 'danger', confirmText: 'Move to Done', cancelText: 'Keep Active' }
    );
}

function getTaskTitleForCompletion(task = {}) {
    return String(task.project_title || task.title || task.objective || 'Untitled task').trim();
}

function getTaskClientForCompletion(task = {}) {
    return String(task.client_name || task.client || task.company_name || '').trim();
}

function getTaskPICLine(task = {}) {
    const names = getAssignedPICNames(task.assignee);
    return names.length ? names.join(', ') : 'Not assigned';
}

function buildCompletionMessage(task = {}) {
    const jobID = String(task.job_id || task.id || '').trim();
    const title = getTaskTitleForCompletion(task);
    const client = getTaskClientForCompletion(task);
    const lines = [
        'Done ✅',
        '',
        `${jobID ? `${jobID} — ` : ''}${title}`,
        ''
    ];
    if (client) lines.push(`Client: ${client}`);
    lines.push(`Creative PIC: ${getTaskPICLine(task)}`);
    const playbookLink = getTaskSafeHttpUrl(task.playbook_link);
    if (playbookLink) lines.push(`Playbook: ${playbookLink}`);
    lines.push('', 'The task has been completed and moved to Done.', '', 'Thank you, team.');
    return lines.filter(line => !/\b(undefined|null)\b/i.test(line)).join('\n');
}

function getCompletionSummaryRows(task = {}, completedAt = '') {
    const rows = [];
    const completionTime = completedAt || getTaskCompletedAt(task);
    if (completionTime) rows.push(['Completed', formatDateTime(completionTime)]);
    rows.push(['PIC', getTaskPICLine(task)]);
    const revisions = Number(task.revision || 0);
    if (Number.isFinite(revisions)) rows.push(['Revisions', String(revisions)]);
    const startAt = getStatusStartedAt(task);
    if (startAt && completionTime) {
        const durationDays = calculateWorkingDaysBetween(startAt, completionTime);
        if (durationDays !== null) rows.push(['Duration', `${durationDays} working day${durationDays === 1 ? '' : 's'}`]);
    }
    return rows;
}

function autosizeCompletionMessage() {
    const textarea = document.getElementById('completionMessageText');
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 180), 330)}px`;
}

function getCompletionModalFocusable() {
    const modal = document.getElementById('taskCompletionModal');
    if (!modal) return [];
    return Array.from(modal.querySelectorAll('button, textarea, [href], input, select, [tabindex]:not([tabindex="-1"])'))
        .filter(el => !el.disabled && el.offsetParent !== null);
}

function openTaskCompletionModal(jobID, options = {}) {
    const task = globalData.find(d => d.job_id === jobID);
    if (!task) return;
    const modal = document.getElementById('taskCompletionModal');
    if (!modal) return;

    completionModalLastFocus = document.activeElement;
    modal.dataset.jobId = jobID;
    document.getElementById('completionJobId').textContent = task.job_id || '-';
    document.getElementById('completionTitleText').textContent = getTaskTitleForCompletion(task);
    document.getElementById('completionClientText').textContent = getTaskClientForCompletion(task) || 'No client saved';
    document.getElementById('completionPicText').textContent = getTaskPICLine(task);
    document.getElementById('completionDateText').textContent = formatDateTime(options.completedAt || getTaskCompletedAt(task) || new Date().toISOString());
    document.getElementById('completionSummaryGrid').innerHTML = getCompletionSummaryRows(task, options.completedAt)
        .map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`)
        .join('');
    const textarea = document.getElementById('completionMessageText');
    textarea.value = buildCompletionMessage(task);
    document.getElementById('completionCopyStatus').textContent = '';

    document.body.classList.add('no-scroll');
    modal.style.display = 'flex';
    modal.offsetHeight;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    autosizeCompletionMessage();
    refreshIcons();
    setTimeout(() => (textarea || getCompletionModalFocusable()[0])?.focus(), 80);
}

function closeTaskCompletionModal() {
    const modal = document.getElementById('taskCompletionModal');
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
        modal.style.display = 'none';
        delete modal.dataset.jobId;
        document.body.classList.remove('no-scroll');
        if (completionModalLastFocus && typeof completionModalLastFocus.focus === 'function') completionModalLastFocus.focus();
        completionModalLastFocus = null;
    }, 220);
}

function handleCompletionModalBackdrop(event) {
    if (event.target === event.currentTarget) closeTaskCompletionModal();
}

function handleCompletionModalKeydown(event) {
    if (event.key === 'Escape') {
        event.preventDefault();
        closeTaskCompletionModal();
        return;
    }
    if (event.key !== 'Tab') return;
    const focusable = getCompletionModalFocusable();
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

async function copyCompletionMessage(closeAfter = false) {
    const textarea = document.getElementById('completionMessageText');
    const status = document.getElementById('completionCopyStatus');
    if (!textarea) return;
    try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
        await navigator.clipboard.writeText(textarea.value);
        if (status) status.textContent = 'Message copied';
        if (closeAfter) setTimeout(closeTaskCompletionModal, 450);
    } catch(e) {
        textarea.focus();
        textarea.select();
        if (status) status.textContent = 'Press Ctrl+C or Command+C to copy.';
    }
}

function openCompletedTaskFromModal() {
    const modal = document.getElementById('taskCompletionModal');
    const jobID = modal?.dataset.jobId || '';
    closeTaskCompletionModal();
    if (jobID) setTimeout(() => openDetailModal(jobID, false), 260);
}

function handleSuccessfulDoneTransition(jobID, context = {}) {
    const task = globalData.find(d => d.job_id === jobID);
    if (!task) return;
    const completedAt = context.completedAt || getTaskCompletedAt(task) || new Date().toISOString();
    const transitionAt = context.moveAt || task.last_moved_at || completedAt;
    const key = `${jobID}:${transitionAt}:${completedAt}`;
    if (completionModalOpenedKeys.has(key)) return;
    completionModalOpenedKeys.add(key);
    firePremiumConfetti();
    const detailModal = document.getElementById('globalDetailModal');
    if (detailModal?.classList.contains('show')) {
        closeDetailModal();
        setTimeout(() => openTaskCompletionModal(jobID, { completedAt }), 440);
        return;
    }
    openTaskCompletionModal(jobID, { completedAt });
}

function canCurrentUserEditTask(task = {}) {
    if (hasAdminAccess()) return { canEdit: true, scope: 'full' };
    if (isCurrentUserAssignedPIC(task)) return { canEdit: false, scope: 'pic_notes' };
    if (isTaskRequesterForUser(task)) return { canEdit: false, scope: 'requester_notes' };
    return { canEdit: false, scope: 'readonly' };
}

function getTaskSafeHttpUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    try {
        const url = new URL(raw);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch(e) {
        return '';
    }
}

function normalizeTaskUrlForSave(value, label) {
    const raw = String(value || '').trim();
    if (!raw) return { ok: true, value: '' };
    const safeUrl = getTaskSafeHttpUrl(raw);
    if (safeUrl) return { ok: true, value: safeUrl };
    return { ok: false, value: raw, message: `${label} must be a valid http(s) URL.` };
}

function renderTaskPlaybookAction(item = {}, canEdit = false) {
    const href = getTaskSafeHttpUrl(item.playbook_link);
    if (href) {
        return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="premium-playbook-btn"><i data-lucide="layout-template"></i> Open Playbook</a>`;
    }
    if (canEdit) {
        const label = item.playbook_link ? 'Fix playbook link' : '+ Add playbook';
        return `<button type="button" class="premium-playbook-btn is-empty" onclick="openEditModal('${escapeJsString(item.job_id)}')"><i data-lucide="plus"></i> ${label}</button>`;
    }
    return '';
}

function getTaskEditRequestType(task = {}) {
    const requestType = String(task.request_type || '').toLowerCase();
    const jobType = String(task.job_type || '').toLowerCase();
    if (requestType.includes('monthly') || jobType.includes('monthly')) return 'monthly';
    if (requestType.includes('pitch') || jobType.includes('pitch')) return 'pitch';
    return 'adhoc';
}

function getTaskEditRequestLabel(requestType) {
    return TASK_EDIT_REQUEST_TYPES.find(type => type.value === requestType)?.label || TASK_EDIT_REQUEST_TYPES[0].label;
}

function getTaskEditDefaultJobType(requestType) {
    if (requestType === 'monthly') return 'Monthly Content Plan';
    if (requestType === 'pitch') return 'Pitch Deck Proposal';
    return '';
}

function normalizeTaskEditText(value) {
    return String(value || '').trim();
}

function buildTaskEditSnapshot(task = {}) {
    const requestType = getTaskEditRequestType(task);
    return {
        job_id: task.job_id || '',
        client_name: normalizeTaskEditText(task.client_name),
        project_title: normalizeTaskEditText(task.project_title),
        region: normalizeTaskEditText(task.region || userRegion || 'Malaysia'),
        requester_name: normalizeTaskEditText(task.requester_name),
        request_type: requestType,
        job_type: normalizeTaskEditText(task.job_type || getTaskEditDefaultJobType(requestType)),
        objective: normalizeTaskEditText(task.objective),
        brief: String(task.brief || '').trim(),
        playbook_link: getTaskSafeHttpUrl(task.playbook_link) || normalizeTaskEditText(task.playbook_link),
        ref_link: getTaskSafeHttpUrl(task.ref_link) || normalizeTaskEditText(task.ref_link),
        client_deadline: toDateInputValue(getTaskClientDeadline(task)),
        internal_due_date: toDateInputValue(getTaskEffectiveInternalDueDate(task)),
        assignee: getAssigneeDisplay(task.assignee),
        updated_at: task.updated_at || task.modified_at || task.last_updated_at || '',
        internal_due_manual: isInternalDueManuallyAdjusted(task),
        status: task.status || '',
        work_status: task.work_status || ''
    };
}

function renderTaskEditRequesterOptions(currentName = '') {
    const activeMembers = getActiveTeamMembers();
    const hasCurrent = activeMembers.some(member => normalizeNameKey(member.name) === normalizeNameKey(currentName));
    const currentOption = currentName && !hasCurrent
        ? `<optgroup label="Current"><option value="${escapeHtml(currentName)}" selected>${escapeHtml(currentName)}</option></optgroup>`
        : '';
    return `<option value="">Select requester...</option>${currentOption}${renderTeamMemberOptionGroups(activeMembers, currentName)}`;
}

function renderTaskEditRegionOptions(currentRegion = '') {
    const current = normalizeTaskEditText(currentRegion);
    const isKnown = WORKSPACE_COUNTRIES.some(country => normalizeNameKey(country.name) === normalizeNameKey(current));
    const currentOption = current && !isKnown ? `<option value="${escapeHtml(current)}" selected>${escapeHtml(current)}</option>` : '';
    return currentOption + getWorkspaceCountryOptions(current || 'Malaysia');
}

function renderTaskEditPICOptions(currentAssignee = '') {
    const selectedNames = getAssignedPICNames(currentAssignee);
    const selectedKeys = selectedNames.map(normalizeNameKey);
    const rows = getActiveTeamMembers().filter(isCreativeTeamMember);
    const fallbackRows = rows.length
        ? rows
        : [...new Set([...(PIC_LIST || []), ...(дизайнериMY || []), ...(дизайнериID || [])])]
            .filter(Boolean)
            .map(name => ({ name, region: isIndonesiaCreativeName(name) ? 'Indonesia' : 'Malaysia' }));
    const missingSelected = selectedNames
        .filter(name => !fallbackRows.some(member => normalizeNameKey(member.name) === normalizeNameKey(name)))
        .map(name => ({ name, region: 'Current PIC' }));
    const groups = groupTeamMembersByCountry([...fallbackRows, ...missingSelected]);

    return groups.map(group => {
        const members = group.members.map(member => {
            const name = String(member.name || '').trim();
            const checked = selectedKeys.includes(normalizeNameKey(name)) ? 'checked' : '';
            return `
                <label class="task-edit-pic-option">
                    <input type="checkbox" class="edit-task-pic-checkbox" value="${escapeHtml(name)}" ${checked} onchange="handleTaskEditInput(event)">
                    <span>${escapeHtml(name)}</span>
                </label>
            `;
        }).join('');
        return `
            <div class="task-edit-pic-group">
                <div class="task-edit-pic-title">${group.country.flag || ''} ${escapeHtml(group.country.name)}</div>
                <div class="task-edit-pic-grid">${members}</div>
            </div>
        `;
    }).join('');
}

function renderTaskEditJobTypeControl(snapshot = {}) {
    const requestType = snapshot.request_type || 'adhoc';
    if (requestType !== 'adhoc') {
        const meta = TASK_EDIT_REQUEST_TYPES.find(type => type.value === requestType) || TASK_EDIT_REQUEST_TYPES[0];
        return `
            <div class="task-edit-fixed-type type-${escapeHtml(requestType)}">
                <i data-lucide="${meta.icon}"></i>
                <div>
                    <strong>${escapeHtml(getTaskEditDefaultJobType(requestType))}</strong>
                    <small>Controlled by request type</small>
                </div>
            </div>
        `;
    }

    const parts = String(snapshot.job_type || '')
        .split(',')
        .map(part => part.trim())
        .filter(Boolean);
    const knownKeys = TASK_EDIT_ADHOC_JOB_TYPES.map(normalizeNameKey);
    const customParts = parts.filter(part => !knownKeys.includes(normalizeNameKey(part)) && !/monthly|pitch/i.test(part));
    const options = TASK_EDIT_ADHOC_JOB_TYPES.map(type => {
        const checked = parts.some(part => normalizeNameKey(part) === normalizeNameKey(type)) ? 'checked' : '';
        return `
            <label class="task-edit-choice">
                <input type="checkbox" class="edit-task-job-type-checkbox" value="${escapeHtml(type)}" ${checked} onchange="handleTaskEditInput(event)">
                <span>${escapeHtml(type)}</span>
            </label>
        `;
    }).join('');

    return `
        <div class="task-edit-choice-grid">${options}</div>
        <label class="task-edit-field task-edit-field-full task-edit-subfield">
            <span>Other deliverable type</span>
            <input type="text" id="editJobTypeCustom" value="${escapeHtml(customParts.join(', '))}" placeholder="e.g. Key visual, animation, landing page" oninput="handleTaskEditInput(event)">
        </label>
    `;
}

function renderTaskEditForm(snapshot) {
    const requestOptions = TASK_EDIT_REQUEST_TYPES.map(type => `
        <option value="${type.value}" ${snapshot.request_type === type.value ? 'selected' : ''}>${type.label}</option>
    `).join('');

    return `
        <section class="task-edit-section">
            <div class="task-edit-section-head">
                <span>01</span>
                <div>
                    <h4>Core Details</h4>
                    <p>Client, title, requester and country.</p>
                </div>
            </div>
            <div class="task-edit-grid">
                <label class="task-edit-field">
                    <span>Client / Brand</span>
                    <input type="text" id="editClient" value="${escapeHtml(snapshot.client_name)}" autocomplete="off" oninput="handleTaskEditInput(event)">
                </label>
                <label class="task-edit-field">
                    <span>Project / Task Title</span>
                    <input type="text" id="editTitle" value="${escapeHtml(snapshot.project_title)}" oninput="handleTaskEditInput(event)">
                </label>
                <label class="task-edit-field">
                    <span>Region / Country</span>
                    <select id="editRegion" onchange="handleTaskEditInput(event)">${renderTaskEditRegionOptions(snapshot.region)}</select>
                </label>
                <label class="task-edit-field">
                    <span>Requester</span>
                    <select id="editRequester" onchange="handleTaskEditInput(event)">${renderTaskEditRequesterOptions(snapshot.requester_name)}</select>
                </label>
            </div>
        </section>

        <section class="task-edit-section">
            <div class="task-edit-section-head">
                <span>02</span>
                <div>
                    <h4>Type & Links</h4>
                    <p>Keep reporting categories and working links clean.</p>
                </div>
            </div>
            <div class="task-edit-grid">
                <label class="task-edit-field">
                    <span>Request Type</span>
                    <select id="editRequestType" onchange="handleTaskEditRequestTypeChange(event)">${requestOptions}</select>
                </label>
                <div class="task-edit-field task-edit-field-full">
                    <span>Job Type / Deliverable Type</span>
                    <div id="editJobTypeControl">${renderTaskEditJobTypeControl(snapshot)}</div>
                </div>
                <label class="task-edit-field">
                    <span>Playbook URL</span>
                    <input type="url" id="editPlaybookUrl" value="${escapeHtml(snapshot.playbook_link)}" placeholder="https://..." oninput="handleTaskEditInput(event)">
                    <small>Add, replace, or clear the current playbook link.</small>
                </label>
                <label class="task-edit-field">
                    <span>Reference URL</span>
                    <input type="url" id="editReferenceUrl" value="${escapeHtml(snapshot.ref_link)}" placeholder="https://..." oninput="handleTaskEditInput(event)">
                    <small>Drive, Figma, Canva, docs, or other reference link.</small>
                </label>
            </div>
        </section>

        <section class="task-edit-section">
            <div class="task-edit-section-head">
                <span>03</span>
                <div>
                    <h4>Brief</h4>
                    <p>Use this for small corrections, not version history.</p>
                </div>
            </div>
            <div class="task-edit-grid">
                <label class="task-edit-field task-edit-field-full">
                    <span>Objective</span>
                    <input type="text" id="editObjective" value="${escapeHtml(snapshot.objective)}" placeholder="Traffic, Awareness, Sales..." oninput="handleTaskEditInput(event)">
                </label>
                <label class="task-edit-field task-edit-field-full">
                    <span>Description / Brief</span>
                    <textarea id="editBrief" rows="7" oninput="handleTaskEditInput(event)">${escapeHtml(snapshot.brief)}</textarea>
                </label>
            </div>
        </section>

        <section class="task-edit-section">
            <div class="task-edit-section-head">
                <span>04</span>
                <div>
                    <h4>Deadline</h4>
                    <p>Deadline changes are logged for monthly reporting.</p>
                </div>
            </div>
            <div class="task-edit-grid">
                <label class="task-edit-field">
                    <span>Client Deadline</span>
                    <input type="date" id="editDeadline" value="${escapeHtml(snapshot.client_deadline)}" onchange="handleTaskEditClientDeadlineChange(event)">
                </label>
                <label class="task-edit-field">
                    <span>Internal Due</span>
                    <input type="date" id="editInternalDue" value="${escapeHtml(snapshot.internal_due_date)}" onchange="handleTaskEditInternalDueInput(event)">
                </label>
            </div>
            <div id="editDeadlineSuggestion" class="task-edit-suggestion" hidden></div>
        </section>

        <section class="task-edit-section">
            <div class="task-edit-section-head">
                <span>05</span>
                <div>
                    <h4>Creative PICs</h4>
                    <p>Multiple PICs are supported across countries.</p>
                </div>
            </div>
            <div class="task-edit-pic-wrap">${renderTaskEditPICOptions(snapshot.assignee)}</div>
        </section>
    `;
}

function openEditModal(jobID) {
    const task = (globalData || []).find(d => d.job_id === jobID);
    if (!task) return showAppleAlert('Missing Task', 'This task could not be found.', { tone: 'warning', icon: 'search-x' });

    // Shooting requests don't fit the Ad-hoc/Monthly/Pitch edit form (it doesn't know about
    // shoot_details and would default job_type back to Ad-hoc on save) — send them to the
    // dedicated Shoot Details editor instead.
    if (getRequestTypeMeta(task).key === 'shooting') return openShootEditModal(jobID);

    const permission = canCurrentUserEditTask(task);
    if (!permission.canEdit) {
        return showAppleAlert('Admin Only', 'Only admins can edit request details. Team notes remain available inside the task.', { tone: 'warning', icon: 'lock' });
    }

    const snapshot = buildTaskEditSnapshot(task);
    activeEditTaskState = {
        jobID,
        original: snapshot,
        internalDueTouched: false,
        keepCurrentInternalDue: false,
        lastSuggestedForClientDeadline: '',
        isSaving: false,
        conflictOverride: false
    };

    editModalLastFocus = document.activeElement;
    const modal = document.getElementById('editModal');
    const body = document.getElementById('editTaskFormBody');
    const jobIdInput = document.getElementById('editJobId');
    if (!modal || !body || !jobIdInput) return showAppleAlert('Edit Unavailable', 'The edit modal is missing from the page.', { tone: 'danger', icon: 'alert-triangle' });

    jobIdInput.value = snapshot.job_id;
    body.innerHTML = renderTaskEditForm(snapshot);
    setTaskEditStatus('', '');
    modal.style.display = 'flex';
    document.body.classList.add('no-scroll');
    modal.offsetHeight;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    syncTaskEditDirtyState();
    syncTaskEditDeadlineSuggestion();
    refreshIcons();
    setTimeout(() => document.getElementById('editClient')?.focus({ preventScroll: true }), 80);
}

function getAssigneeDisplay(assignee) {
    if (!assignee || assignee === 'null') return 'Unassigned';
    return String(assignee).trim() || 'Unassigned';
}

function getAssignedPICNames(assignee) {
    const values = parseIdentityValue(assignee).filter(value => {
        const text = String(value || '').trim();
        return text && !text.includes('@') && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text);
    });
    return uniqueIdentityValues(values);
}

function getPICChangeMeta(previousAssignee, nextAssignee) {
    const previous = getAssignedPICNames(previousAssignee);
    const next = getAssignedPICNames(nextAssignee);
    const previousKeys = previous.map(normalizeNameKey);
    const nextKeys = next.map(normalizeNameKey);
    const added = next.filter(name => !previousKeys.includes(normalizeNameKey(name)));
    const removed = previous.filter(name => !nextKeys.includes(normalizeNameKey(name)));
    const retained = next.filter(name => previousKeys.includes(normalizeNameKey(name)));
    return {
        previous,
        next,
        added,
        removed,
        retained,
        changed: added.length > 0 || removed.length > 0
    };
}

function getMemberKey(member = {}) {
    return String(member.member_key || normalizeNameKey(member.name)).trim();
}

function isUuidValue(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || '').trim());
}

function buildPICAssignmentPayload(assignee) {
    const names = getAssignedPICNames(assignee);
    const members = names.map(findActiveTeamMemberByIdentity).filter(Boolean);
    return {
        assignee,
        assigned_pic_member_keys: uniqueIdentityValues(members.map(getMemberKey)).filter(Boolean),
        assigned_pic_auth_user_ids: uniqueIdentityValues(members.map(member => member.auth_user_id || member.user_id).filter(isUuidValue)),
        assignment_updated_at: new Date().toISOString()
    };
}

function stripPICAssignmentPayloadFields(payload = {}) {
    const clean = { ...payload };
    ['assigned_pic_member_keys', 'assigned_pic_auth_user_ids', 'assignment_updated_at'].forEach(key => delete clean[key]);
    return clean;
}

function findActiveTeamMemberByIdentity(identityValue) {
    return getActiveTeamMembers().find(member =>
        getMemberIdentityValues(member).some(memberValue => identityValuesMatch(memberValue, identityValue))
    ) || null;
}

function canMemberViewTask(task = {}, member = {}) {
    if (!member?.name) return false;
    if (isAdminTeamMember(member) || isSuperAdminName(member.name)) return true;
    const context = {
        name: member.name,
        member,
        identityValues: getMemberIdentityValues(member)
    };
    return isTaskRequesterForUser(task, context) ||
        isTaskAssignedToUser(task, context) ||
        isTaskOtherRoleForUser(task, context);
}

function getTaskAssignedMemberDiagnostics(task = {}) {
    const assigneeNames = getAssignedPICNames(task.assignee);
    const identityValues = uniqueIdentityValues([
        ...assigneeNames,
        ...getTaskAssigneeIdentityValues(task)
    ]);
    const seen = new Set();

    return identityValues.map(identity => {
        const member = findActiveTeamMemberByIdentity(identity);
        const key = member ? `member:${normalizeNameKey(member.name)}` : `missing:${normalizeNameKey(identity)}`;
        if (seen.has(key)) return null;
        seen.add(key);
        return {
            identity,
            member,
            canView: member ? canMemberViewTask(task, member) : false,
            authLink: member ? (member.auth_user_id || member.user_id || member.email || member.member_email || '') : '',
            region: member?.region || ''
        };
    }).filter(Boolean);
}

function renderTaskAccessCheckPanel(task = {}) {
    if (!hasAdminAccess()) return '';
    return `
        <div class="task-access-check-panel">
            <div>
                <span>Access Diagnostic</span>
                <strong>Assigned PIC visibility</strong>
            </div>
            <button type="button" class="settings-action-btn compact" onclick="openTaskAccessDiagnostic('${escapeJsString(task.job_id)}')">
                <i data-lucide="shield-check"></i><span>Check Access</span>
            </button>
        </div>
    `;
}

function openTaskAccessDiagnostic(jobID) {
    if (!hasAdminAccess()) return showAppleAlert('Admin Only', 'Please unlock Admin Access first.');
    const task = (globalData || []).find(row => row.job_id === jobID);
    if (!task) return showAppleAlert('Missing Task', 'This task could not be found.');

    const diagnostics = getTaskAssignedMemberDiagnostics(task);
    const requesterMember = findActiveTeamMemberByIdentity(task.requester_name);
    const requesterCanView = requesterMember ? canMemberViewTask(task, requesterMember) : Boolean(task.requester_name);
    const currentFilter = (hasAdminAccess() || isSuperAdmin) ? currentRegionFilter : userRegion;
    const mismatches = [];

    if (!diagnostics.length) mismatches.push('No assigned PIC found on this task.');
    diagnostics.forEach(row => {
        if (!row.member) mismatches.push(`${row.identity} is assigned but not matched to an active team member.`);
        else if (!row.canView) mismatches.push(`${row.member.name} is assigned but failed visibility logic.`);
        if (row.member && !row.authLink) mismatches.push(`${row.member.name} has no auth/user/email link stored in team_members.`);
    });

    const renderDiagnosticRow = row => `
        <div class="access-diagnostic-row ${row.canView ? 'ok' : 'warn'}">
            <div>
                <strong>${escapeHtml(row.member?.name || row.identity)}</strong>
                <span>${row.member ? `${getFlag(row.region)} ${escapeHtml(row.region || 'No region')}` : 'No active roster match'}</span>
            </div>
            <div>
                <small>Auth link</small>
                <code>${escapeHtml(row.authLink || 'Missing')}</code>
            </div>
            <span class="access-diagnostic-pill ${row.canView ? 'ok' : 'warn'}">${row.canView ? 'Visible' : 'Blocked'}</span>
        </div>
    `;

    openSettingsDialog({
        mode: 'drawer',
        icon: 'shield-check',
        title: 'Check Access',
        description: `${task.job_id} · ${task.client_name || 'No client'} · ${getFlag(task.region)} ${task.region || 'No region'}`,
        body: `
            <div class="access-diagnostic-summary">
                <div><span>Task Region</span><strong>${getFlag(task.region)} ${escapeHtml(task.region || 'No region')}</strong></div>
                <div><span>Current Filter</span><strong>${escapeHtml(currentFilter || 'all')}</strong></div>
                <div><span>Requester</span><strong>${escapeHtml(task.requester_name || 'Missing')}</strong><small>${requesterCanView ? 'Visible' : 'Check roster/auth link'}</small></div>
                <div><span>Assignment Field</span><strong>${escapeHtml(getAssigneeDisplay(task.assignee))}</strong></div>
            </div>
            <div class="access-diagnostic-section">
                <h4>Assigned PICs</h4>
                ${diagnostics.length ? diagnostics.map(renderDiagnosticRow).join('') : '<div class="settings-empty-card">No assigned PIC values found.</div>'}
            </div>
            <div class="access-diagnostic-section">
                <h4>Data Check</h4>
                ${mismatches.length ? mismatches.map(item => `<div class="access-diagnostic-note warn"><i data-lucide="alert-circle"></i><span>${escapeHtml(item)}</span></div>`).join('') : '<div class="access-diagnostic-note ok"><i data-lucide="check-circle"></i><span>No front-end data mismatch detected.</span></div>'}
            </div>
            <div class="access-diagnostic-note">
                <i data-lucide="database"></i>
                <span>If this shows Visible but the user still cannot open it on their own device, check Supabase RLS/auth mapping using the cross-region PIC migration.</span>
            </div>
        `,
        footer: `<button type="button" class="settings-primary-btn" onclick="closeSettingsDialog()">Done</button>`
    });
}

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
}

function escapeJsString(value) {
    return String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// Turns URLs inside already-escaped HTML text into clickable links. Must only ever run AFTER
// escapeHtml() — operating on raw/unescaped input here would be an XSS hole. Used anywhere a task
// note is displayed (notification preview, task note list, tracking log) so a pasted Drive/Slides
// link is tappable straight from the notification instead of dead text someone has to copy out.
function linkifyHtml(escapedText) {
    return String(escapedText || '').replace(/(https?:\/\/[^\s<]+)/g, (url) => {
        // Trim trailing punctuation that's almost always sentence punctuation, not part of the URL.
        const trailingMatch = url.match(/[.,;:!?)\]]+$/);
        const trailing = trailingMatch ? trailingMatch[0] : '';
        const cleanUrl = trailing ? url.slice(0, -trailing.length) : url;
        if (!cleanUrl) return url;
        return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="task-note-link" onclick="event.stopPropagation()">${cleanUrl}</a>${trailing}`;
    });
}

let activeRateCardSearch = '';
let activeRateCardCategoryId = '';
let activeRateCardSort = 'recommended';
let activeRateCardModal = '';
let activeRateCardGuideId = '';
let activeRateCardGuideGroup = 'most-common';
let activeRateCardGuideSearch = '';
let activeRateCardPopoverKey = '';
let rateCardUrlHydrated = false;
let lastRateCardFocus = null;
let rateCardPopoverCloseTimer = null;
let pendingRateCardNavigation = null;
let rateCardHighlightTimer = null;
const RATE_CARD_RECENT_KEY = 'adtech_rate_card_recent';

function getRateCardCategories() {
    return Array.isArray(window.RATE_CARD_CATEGORIES) ? window.RATE_CARD_CATEGORIES : [];
}

function getRateCardItems() {
    return getRateCardCategories().flatMap(category => (category.items || []).map(item => ({ ...item, categoryTitle: category.title, categoryId: category.id })));
}

function formatRateCardCurrency(value) {
    const amount = Number(value || 0);
    const hasDecimal = !Number.isInteger(amount);
    return `From ${new Intl.NumberFormat('en-MY', {
        style: 'currency',
        currency: 'MYR',
        minimumFractionDigits: hasDecimal ? 2 : 0,
        maximumFractionDigits: hasDecimal ? 2 : 0
    }).format(amount).replace('MYR', 'RM')}`;
}

function getRateCardCategoryIcon(category) {
    const icons = window.RATE_CARD_CATEGORY_ICONS || {};
    return icons[category.filter] || icons[category.title] || 'badge-dollar-sign';
}

function getRateCardCategory(categoryId) {
    return getRateCardCategories().find(category => category.id === categoryId) || null;
}

function getRateCardCategoryMinPrice(category) {
    const prices = (category?.items || []).map(item => Number(item.priceFrom)).filter(price => price > 0);
    return prices.length ? Math.min(...prices) : 0;
}

function renderRateCardPage() {
    hydrateRateCardFromUrl();
    renderRateCardRecentlyViewed();
    renderRateCardPopularServices();
    renderRateCardCategoryGrid();
    renderRateCardResults();
    renderRateCardFooterNote();
    refreshIcons();
}

function handleRateCardSearch(value) {
    activeRateCardSearch = value || '';
    if (activeRateCardSearch.trim()) activeRateCardCategoryId = '';
    activeRateCardSort = 'recommended';
    updateRateCardUrl();
    renderRateCardPage();
}

function hydrateRateCardFromUrl() {
    if (rateCardUrlHydrated) return;
    rateCardUrlHydrated = true;
    try {
        const params = new URLSearchParams(window.location.search);
        const category = params.get('category') || '';
        const query = params.get('q') || '';
        if (getRateCardCategory(category)) activeRateCardCategoryId = category;
        if (query) {
            activeRateCardSearch = query;
            activeRateCardCategoryId = '';
            const input = document.getElementById('rateCardSearch');
            if (input) input.value = query;
        }
    } catch(e) {}
}

function updateRateCardUrl() {
    if (!window.history?.replaceState) return;
    try {
        const url = new URL(window.location.href);
        if (activeRateCardCategoryId) url.searchParams.set('category', activeRateCardCategoryId);
        else url.searchParams.delete('category');
        if (activeRateCardSearch.trim()) url.searchParams.set('q', activeRateCardSearch.trim());
        else url.searchParams.delete('q');
        window.history.replaceState({}, '', url);
    } catch(e) {}
}

function focusRateCardSearch(event) {
    if ((event.metaKey || event.ctrlKey) && String(event.key || '').toLowerCase() === 'k') {
        const page = document.getElementById('rate-card');
        if (!page?.classList.contains('active')) return;
        event.preventDefault();
        document.getElementById('rateCardSearch')?.focus();
    }
}

function selectRateCardCategory(categoryId) {
    if (!getRateCardCategory(categoryId)) return;
    activeRateCardCategoryId = categoryId;
    activeRateCardSearch = '';
    activeRateCardSort = 'recommended';
    if (categoryId === 'ai-videos') resetRateCardAiGroups();
    const input = document.getElementById('rateCardSearch');
    if (input) input.value = '';
    closeRateCardPopover();
    updateRateCardUrl();
    renderRateCardPage();
    document.getElementById('rateCardResults')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function clearRateCardIntent() {
    activeRateCardSearch = '';
    activeRateCardCategoryId = '';
    activeRateCardSort = 'recommended';
    const input = document.getElementById('rateCardSearch');
    if (input) input.value = '';
    closeRateCardPopover();
    updateRateCardUrl();
    renderRateCardPage();
}

function setRateCardSort(value) {
    activeRateCardSort = value || 'recommended';
    renderRateCardResults();
    refreshIcons();
}

function getRateCardSearchText(item) {
    const phrases = {
        'video-editing': 'edit existing footage already have footage client supplies footage cut down subtitles captions recap motion graphics',
        'video-production': 'shoot film filming come and shoot camera crew production testimonial interview live streaming voice over',
        'ai-videos': 'ai video generate everything ai scenes ai assisted advanced property product cinematic hybrid shoot and add ai avatar presenter lip sync localisation mandarin animate render background replacement object removal',
        'ai-images': 'ai image generated visual background replacement character product property visual enhancement extension',
        'digital-social': 'instagram facebook linkedin carousel story social media post edm gdn marketplace resize adaptation',
        'print-offline': 'poster flyer brochure billboard banner bunting standee packaging print offline',
        branding: 'logo brand guide campaign key visual template icon illustration mascot',
        presentations: 'pitch deck slides proposal report company profile chart pdf template',
        'web-ui': 'landing page website ui app screen wireframe email template microsite',
        photography: 'photo photography product headshot event property interior retouching',
        copywriting: 'copy caption script translation proofreading localisation transcreation mandarin english bahasa blog article seo sem gdn google ads search ad display ad keyword headline metadata'
    };
    return [
        item.service,
        item.category,
        item.categoryTitle,
        item.description,
        item.example,
        item.billingBasis,
        item.scopeNote,
        phrases[item.categoryId],
        ...(item.tags || [])
    ].join(' ').toLowerCase();
}

function getRateCardSearchResults() {
    const query = activeRateCardSearch.trim().toLowerCase();
    if (!query) return [];
    return sortRateCardItems(getRateCardItems().filter(item => getRateCardSearchText(item).includes(query)));
}

function sortRateCardItems(items = []) {
    const withIndex = items.map((item, index) => ({ item, index }));
    if (activeRateCardSort === 'price-low') withIndex.sort((a, b) => Number(a.item.priceFrom) - Number(b.item.priceFrom) || a.index - b.index);
    else if (activeRateCardSort === 'price-high') withIndex.sort((a, b) => Number(b.item.priceFrom) - Number(a.item.priceFrom) || a.index - b.index);
    else if (activeRateCardSort === 'name') withIndex.sort((a, b) => a.item.service.localeCompare(b.item.service));
    return withIndex.map(row => row.item);
}

function getRateCardPopularItems() {
    const ids = Array.isArray(window.RATE_CARD_POPULAR_SERVICE_IDS) ? window.RATE_CARD_POPULAR_SERVICE_IDS : [];
    return ids.map(findRateCardItem).filter(Boolean).slice(0, 6);
}

function getRateQuoteQuantity(serviceId) {
    return typeof getQuoteServiceQuantity === 'function' ? getQuoteServiceQuantity(serviceId) : 0;
}

function renderRateCardQuoteButton(serviceId, options = {}) {
    const quantity = getRateQuoteQuantity(serviceId);
    const label = quantity ? `Added ${quantity}` : (options.label || 'Add');
    const title = quantity ? 'Manage this service in Quote Builder' : 'Add this service to Quote Builder';
    const icon = quantity ? 'check' : 'plus';
    return `
        <button type="button" class="rate-quote-btn ${quantity ? 'added' : ''} ${options.compact ? 'compact' : ''}" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}" onclick="handleRateCardQuoteAction('${serviceId}', event)">
            <i data-lucide="${icon}"></i>
            <span>${escapeHtml(label)}</span>
        </button>
    `;
}

function handleRateCardQuoteAction(serviceId, event) {
    if (event) event.stopPropagation();
    if (getRateQuoteQuantity(serviceId) && typeof openQuoteServiceMenu === 'function') {
        openQuoteServiceMenu(serviceId);
        return;
    }
    if (typeof addServiceToQuote === 'function') addServiceToQuote(serviceId);
}

function renderRateCardRecentlyViewed() {
    const wrap = document.getElementById('rateCardRecentlyViewed');
    if (!wrap) return;
    const items = getRateCardRecentItems();
    if (!items.length) {
        wrap.innerHTML = '';
        return;
    }

    wrap.innerHTML = `
        <div class="rate-recent-strip">
            <span>Recently Viewed</span>
            <div>
                ${items.map(item => `<button type="button" onclick="openRateCardInfo('${item.id}', this, event)">${escapeHtml(item.service)}</button>`).join('')}
            </div>
        </div>
    `;
}

function renderRateCardPopularServices() {
    const wrap = document.getElementById('rateCardPopular');
    if (!wrap) return;
    wrap.innerHTML = `
        <div class="rate-section-head">
            <div>
                <h2>Popular Services</h2>
                <p>Frequently requested services and starting rates.</p>
            </div>
        </div>
        <div class="rate-popular-grid">
            ${getRateCardPopularItems().map(item => renderRateCardServiceCard(item, { popular: true })).join('')}
        </div>
    `;
}

function renderRateCardCategoryGrid() {
    const wrap = document.getElementById('rateCardCategoryGrid');
    if (!wrap) return;
    const categories = getRateCardCategories();
    wrap.innerHTML = `
        <div class="rate-section-head">
            <div>
                <h2>Browse by Category</h2>
                <p>Select a category to reveal its service list.</p>
            </div>
        </div>
        <div class="rate-category-grid">
            ${categories.map(renderRateCardCategoryTile).join('')}
        </div>
    `;
}

function renderRateCardCategoryTile(category) {
    const minPrice = getRateCardCategoryMinPrice(category);
    const active = category.id === activeRateCardCategoryId;
    return `
        <button type="button" class="rate-category-tile ${active ? 'active' : ''}" onclick="selectRateCardCategory('${category.id}')" aria-pressed="${active}">
            <span class="rate-category-icon"><i data-lucide="${getRateCardCategoryIcon(category)}"></i></span>
            <span>
                <strong>${escapeHtml(category.filter)}</strong>
                <small>${category.items.length} services</small>
            </span>
            <em>${minPrice ? formatRateCardCurrency(minPrice) : 'View services'}</em>
            <i data-lucide="chevron-right"></i>
        </button>
    `;
}

function renderRateCardResults() {
    const wrap = document.getElementById('rateCardResults');
    if (!wrap) return;

    const query = activeRateCardSearch.trim();
    if (!query && !activeRateCardCategoryId) {
        wrap.innerHTML = '';
        return;
    }

    if (query) {
        const results = getRateCardSearchResults();
        if (!results.length) {
            wrap.innerHTML = `
                <div class="rate-empty-state">
                    <i data-lucide="search-x"></i>
                    <h3>No matching services found.</h3>
                    <p>Try another service name, category or production type.</p>
                    <button type="button" onclick="clearRateCardIntent()">Clear Search</button>
                </div>
            `;
            refreshIcons();
            return;
        }

        wrap.innerHTML = `
            <section class="rate-results-panel">
                ${renderRateCardResultsHead('Search Results', `Matches for "${query}"`, results.length, 'Clear Search')}
                ${renderRateCardServiceTable(results)}
            </section>
        `;
        return;
    }

    const category = getRateCardCategory(activeRateCardCategoryId);
    if (!category) {
        wrap.innerHTML = '';
        return;
    }

    const items = sortRateCardItems(category.items.map(item => ({ ...item, categoryTitle: category.title, categoryId: category.id })));
    wrap.innerHTML = `
        <section class="rate-results-panel">
            ${renderRateCardResultsHead(category.title, category.description, items.length, 'All Categories')}
            ${category.note ? `<div class="rate-category-note quiet"><i data-lucide="badge-alert"></i><span>${escapeHtml(category.note)}</span></div>` : ''}
            ${category.id === 'ai-videos' ? renderRateCardAiGroups(items) : renderRateCardServiceTable(items)}
        </section>
    `;
}

function renderRateCardResultsHead(title, subtitle, count, clearLabel) {
    return `
        <div class="rate-results-head">
            <div>
                <h2 id="rateCardResultsHeading" tabindex="-1">${escapeHtml(title)}</h2>
                <p>${escapeHtml(subtitle)}</p>
            </div>
            <div class="rate-results-actions">
                <span>${count} result${count === 1 ? '' : 's'}</span>
                <label>
                    <span>Sort</span>
                    <select onchange="setRateCardSort(this.value)" aria-label="Sort rate card results">
                        <option value="recommended" ${activeRateCardSort === 'recommended' ? 'selected' : ''}>Recommended</option>
                        <option value="price-low" ${activeRateCardSort === 'price-low' ? 'selected' : ''}>Price: Low to High</option>
                        <option value="price-high" ${activeRateCardSort === 'price-high' ? 'selected' : ''}>Price: High to Low</option>
                        <option value="name" ${activeRateCardSort === 'name' ? 'selected' : ''}>Service Name</option>
                    </select>
                </label>
                <button type="button" onclick="clearRateCardIntent()">${escapeHtml(clearLabel)}</button>
            </div>
        </div>
    `;
}

function renderRateCardServiceTable(items) {
    return `
        <div class="rate-table-wrap">
            <table class="rate-card-table">
                <thead>
                    <tr>
                        <th>Service</th>
                        <th>Starting Price</th>
                        <th>Billing Basis</th>
                        <th>Information</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(renderRateCardTableRow).join('')}
                </tbody>
            </table>
        </div>
        <div class="rate-mobile-list">
            ${items.map(renderRateCardMobileCard).join('')}
        </div>
    `;
}

let rateCardAiGroups = {};

function resetRateCardAiGroups() {
    rateCardAiGroups = { assisted: true, 'ai-only': false, hybrid: false, 'add-on': false };
}

function toggleRateCardAiGroup(groupId) {
    if (!Object.keys(rateCardAiGroups).length) resetRateCardAiGroups();
    rateCardAiGroups[groupId] = !rateCardAiGroups[groupId];
    renderRateCardResults();
    refreshIcons();
}

function renderRateCardAiGroups(items) {
    if (!Object.keys(rateCardAiGroups).length) resetRateCardAiGroups();
    const groups = [
        { id: 'assisted', title: 'AI-Assisted Services', items: items.filter(item => (item.tags || []).includes('assisted')) },
        { id: 'ai-only', title: 'Full AI-Generated Services', items: items.filter(item => (item.tags || []).includes('ai-only')) },
        { id: 'hybrid', title: 'Hybrid Live-Action + AI', items: items.filter(item => (item.tags || []).includes('hybrid')) },
        { id: 'add-on', title: 'AI Add-Ons', items: items.filter(item => (item.tags || []).includes('add-on')) }
    ].filter(group => group.items.length);

    return `<div class="rate-ai-groups">${groups.map(group => {
        const open = rateCardAiGroups[group.id] !== false;
        return `
            <div class="rate-ai-group ${open ? 'open' : ''}">
                <button type="button" onclick="toggleRateCardAiGroup('${group.id}')" aria-expanded="${open}">
                    <span>${escapeHtml(group.title)}</span>
                    <strong>${group.items.length}</strong>
                    <i data-lucide="chevron-down"></i>
                </button>
                ${open ? renderRateCardServiceTable(sortRateCardItems(group.items)) : ''}
            </div>
        `;
    }).join('')}</div>`;
}

function renderRateCardServiceCard(item, options = {}) {
    return `
        <article class="rate-service-card ${options.popular ? 'popular' : ''}">
            <div class="rate-service-card-top">
                <div>
                    <span>${escapeHtml(item.category)}</span>
                    ${options.popular ? '<em>Popular</em>' : ''}
                </div>
                <button type="button" class="rate-info-btn" data-rate-info-key="${escapeHtml(item.id)}" aria-label="View information for ${escapeHtml(item.service)}" aria-expanded="false" onmouseenter="openRateCardInfo('${item.id}', this, event)" onmouseleave="scheduleRateCardPopoverClose()" onclick="openRateCardInfo('${item.id}', this, event)" onfocus="openRateCardInfo('${item.id}', this, event)" onblur="scheduleRateCardPopoverClose()">
                    <i data-lucide="info"></i>
                </button>
            </div>
            <h3>${escapeHtml(item.service)}</h3>
            <div class="rate-service-card-meta">
                <strong>${formatRateCardCurrency(item.priceFrom)}</strong>
                <span>${escapeHtml(item.billingBasis)}</span>
            </div>
            <div class="rate-service-card-quote">
                ${renderRateCardQuoteButton(item.id, { label: 'Add to Quote' })}
            </div>
        </article>
    `;
}

function handleRateCardCardKey(event, itemId) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openRateCardInfo(itemId, event.currentTarget, event);
}

function renderRateCardTableRow(item) {
    return `
        <tr data-rate-service-id="${escapeHtml(item.id)}" tabindex="-1">
            <td>
                <div class="rate-service-cell">
                    <strong>${escapeHtml(item.service)}</strong>
                </div>
            </td>
            <td><strong class="rate-price">${formatRateCardCurrency(item.priceFrom)}</strong></td>
            <td>${escapeHtml(item.billingBasis)}</td>
            <td>
                <div class="rate-table-actions">
                    <button type="button" class="rate-info-btn" data-rate-info-key="${escapeHtml(item.id)}" aria-label="View information for ${escapeHtml(item.service)}" aria-expanded="false" onfocus="openRateCardInfo('${item.id}', this, event)" onblur="scheduleRateCardPopoverClose()" onmouseenter="openRateCardInfo('${item.id}', this, event)" onmouseleave="scheduleRateCardPopoverClose()" onclick="openRateCardInfo('${item.id}', this, event)">
                        <i data-lucide="info"></i>
                    </button>
                    ${renderRateCardQuoteButton(item.id, { compact: true })}
                </div>
            </td>
        </tr>
    `;
}

function renderRateCardMobileCard(item) {
    return `
        <article class="rate-mobile-card" data-rate-service-id="${escapeHtml(item.id)}" tabindex="-1">
            <div class="rate-mobile-top">
                <span>${escapeHtml(item.category)}</span>
                <button type="button" class="rate-info-btn" data-rate-info-key="${escapeHtml(item.id)}" aria-label="View information for ${escapeHtml(item.service)}" aria-expanded="false" onclick="openRateCardInfo('${item.id}', this, event)" onfocus="openRateCardInfo('${item.id}', this, event)">
                    <i data-lucide="info"></i>
                </button>
            </div>
            <h3>${escapeHtml(item.service)}</h3>
            <div class="rate-mobile-meta">
                <strong>${formatRateCardCurrency(item.priceFrom)}</strong>
                <span>${escapeHtml(item.billingBasis)}</span>
            </div>
        </article>
    `;
}

function renderRateCardFooterNote() {
    const wrap = document.getElementById('rateCardFooterNote');
    if (!wrap) return;
    wrap.innerHTML = 'Starting rates are for quotation guidance only. Final pricing depends on scope, timeline, usage rights and third-party requirements.';
}

function findRateCardItem(itemId) {
    return getRateCardItems().find(item => item.id === itemId) || null;
}

function getRateCardPopover() {
    const popover = document.getElementById('rateCardPopover');
    if (popover && popover.parentElement !== document.body) document.body.appendChild(popover);
    return popover;
}

function openRateCardInfo(itemId, anchor, event) {
    if (event) event.stopPropagation();
    const item = findRateCardItem(itemId);
    if (!item) return;
    cancelRateCardPopoverClose();
    rememberRateCardViewedItem(item.id);
    activeRateCardPopoverKey = item.id;
    showRateCardPopover(anchor, item.id, {
        title: item.service,
        eyebrow: item.category,
        price: formatRateCardCurrency(item.priceFrom),
        what: item.description,
        example: item.example,
        billing: item.billingBasis,
        scopeNote: item.scopeNote,
        category: item.categoryTitle || item.category,
        serviceId: item.id
    });
    renderRateCardRecentlyViewed();
}

function openRateCardPricingNotes(anchor, event) {
    if (event) event.stopPropagation();
    cancelRateCardPopoverClose();
    showRateCardPopover(anchor, 'pricing-notes', {
        title: 'Pricing Notes',
        eyebrow: 'Internal use only',
        price: '',
        what: 'All prices are starting rates and may change depending on scope, complexity, timeline, usage rights and third-party requirements.',
        example: 'Use these rates as quotation guidance before confirming final scope.',
        billing: 'Client-facing starting rates.',
        scopeNote: ''
    });
}

function getRateCardRecentItems() {
    try {
        const ids = JSON.parse(localStorage.getItem(RATE_CARD_RECENT_KEY) || '[]');
        return ids.map(findRateCardItem).filter(Boolean).slice(0, 4);
    } catch(e) {
        return [];
    }
}

function rememberRateCardViewedItem(itemId) {
    try {
        const ids = JSON.parse(localStorage.getItem(RATE_CARD_RECENT_KEY) || '[]').filter(Boolean);
        const next = [itemId, ...ids.filter(id => id !== itemId)].slice(0, 4);
        localStorage.setItem(RATE_CARD_RECENT_KEY, JSON.stringify(next));
    } catch(e) {}
}

function showRateCardPopover(anchor, key, content) {
    const popover = getRateCardPopover();
    if (!popover) return;
    const isMobile = window.innerWidth <= 720;
    popover.classList.toggle('mobile', isMobile);
    popover.innerHTML = `
        ${isMobile ? '<button type="button" class="rate-popover-close" onclick="closeRateCardPopover()" aria-label="Close rate card information"><i data-lucide="x"></i></button>' : ''}
        <span>${escapeHtml(content.eyebrow || 'Information')}</span>
        <h3>${escapeHtml(content.title)}</h3>
        ${content.price ? `<div class="rate-popover-price"><strong>${escapeHtml(content.price)}</strong><span>${escapeHtml(content.billing)}</span></div>` : ''}
        <div class="rate-popover-section">
            <strong>What this means</strong>
            <p>${escapeHtml(content.what)}</p>
        </div>
        <div class="rate-popover-section">
            <strong>Straightforward example</strong>
            <p>${escapeHtml(content.example)}</p>
        </div>
        <div class="rate-popover-section">
            <strong>Billing basis</strong>
            <p>${escapeHtml(content.billing)}</p>
        </div>
        ${content.category ? `<div class="rate-popover-section"><strong>Recommended category</strong><p>${escapeHtml(content.category)}</p></div>` : ''}
        ${content.scopeNote ? `<div class="rate-popover-section scope"><strong>Scope note</strong><p>${escapeHtml(content.scopeNote)}</p></div>` : ''}
        ${content.serviceId ? `<div class="rate-popover-add-wrap">${renderRateCardQuoteButton(content.serviceId, { label: 'Add to Quote' })}</div>` : ''}
    `;

    popover.onmouseenter = cancelRateCardPopoverClose;
    popover.onmouseleave = scheduleRateCardPopoverClose;

    popover.setAttribute('aria-hidden', 'false');
    popover.classList.add('show');

    if (!isMobile && anchor) {
        const rect = anchor.getBoundingClientRect();
        const margin = 16;
        const gap = 10;
        const width = Math.min(360, window.innerWidth - (margin * 2));
        popover.style.width = `${width}px`;
        popover.style.left = '0px';
        popover.style.top = '0px';
        const popoverWidth = popover.offsetWidth || width;
        const popoverHeight = popover.offsetHeight || 320;
        let left = rect.right + gap;
        if (left + popoverWidth > window.innerWidth - margin) left = rect.left - popoverWidth - gap;
        if (left < margin) left = rect.left + (rect.width / 2) - (popoverWidth / 2);
        left = Math.min(Math.max(margin, left), window.innerWidth - popoverWidth - margin);
        let top = rect.top;
        if (top + popoverHeight > window.innerHeight - margin) top = window.innerHeight - popoverHeight - margin;
        top = Math.max(margin, top);
        popover.style.left = `${left}px`;
        popover.style.top = `${top}px`;
    } else {
        popover.style.width = '';
        popover.style.left = '';
        popover.style.top = '';
    }

    updateRateCardInfoButtonStates(key);
    refreshIcons();
}

function cancelRateCardPopoverClose() {
    if (rateCardPopoverCloseTimer) clearTimeout(rateCardPopoverCloseTimer);
    rateCardPopoverCloseTimer = null;
}

function scheduleRateCardPopoverClose(delay = 150) {
    if (window.innerWidth <= 720) return;
    cancelRateCardPopoverClose();
    rateCardPopoverCloseTimer = setTimeout(() => {
        const popover = getRateCardPopover();
        const activeElement = document.activeElement;
        if (popover?.matches(':hover')) return;
        if (activeElement?.closest?.('.rate-card-popover, .rate-info-btn, .rate-pricing-note-btn')) return;
        closeRateCardPopover();
    }, delay);
}

function updateRateCardInfoButtonStates(activeKey = '') {
    document.querySelectorAll('.rate-info-btn').forEach(btn => {
        btn.setAttribute('aria-expanded', btn.dataset.rateInfoKey === activeKey ? 'true' : 'false');
    });
}

function closeRateCardPopover() {
    const popover = getRateCardPopover();
    if (!popover) return;
    cancelRateCardPopoverClose();
    activeRateCardPopoverKey = '';
    popover.classList.remove('show', 'mobile');
    popover.setAttribute('aria-hidden', 'true');
    updateRateCardInfoButtonStates('');
}

function openRateCardModal(type) {
    activeRateCardModal = type;
    lastRateCardFocus = document.activeElement;
    renderRateCardModal();
}

function closeRateCardModal() {
    activeRateCardModal = '';
    const overlay = document.getElementById('rateCardPanelOverlay');
    if (overlay) {
        overlay.classList.remove('show');
        overlay.setAttribute('aria-hidden', 'true');
        overlay.innerHTML = '';
    }
    if (pendingRateCardNavigation) {
        requestAnimationFrame(() => requestAnimationFrame(applyPendingRateCardNavigation));
        return;
    }
    if (lastRateCardFocus?.focus) lastRateCardFocus.focus();
}

function renderRateCardModal() {
    const overlay = document.getElementById('rateCardPanelOverlay');
    if (!overlay || !activeRateCardModal) return;
    const wasOpen = overlay.classList.contains('show');
    const content = activeRateCardModal === 'choose'
        ? renderRateCardChoosePanel()
        : activeRateCardModal === 'discounts'
            ? renderRateCardDiscountPanel()
            : renderRateCardTermsPanel();

    overlay.innerHTML = `
        <div class="rate-panel-sheet" role="dialog" aria-modal="true" aria-labelledby="ratePanelTitle" onclick="event.stopPropagation()" onkeydown="trapRateCardModalFocus(event)">
            <button type="button" class="rate-panel-close" onclick="closeRateCardModal()" aria-label="Close panel"><i data-lucide="x"></i></button>
            ${content}
        </div>
    `;
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden', 'false');
    overlay.onclick = event => {
        if (event.target === overlay) closeRateCardModal();
    };
    if (!wasOpen) setTimeout(() => overlay.querySelector('button, [tabindex], select')?.focus(), 0);
    refreshIcons();
}

function renderRateCardChoosePanel() {
    const rows = getFilteredRateCardGuideRows();
    const groups = getRateCardScenarioGroups();
    const selected = rows.find(row => row.id === activeRateCardGuideId) || null;
    const allRows = getRateCardGuideRows();
    const selectedFallback = selected || allRows.find(row => row.id === activeRateCardGuideId) || null;
    return `
        <div class="rate-panel-header">
            <span>Assistant</span>
            <h2 id="ratePanelTitle">Help Me Choose</h2>
            <p>Find the right base service, likely add-ons and quote checks before pricing the request.</p>
        </div>
        <div class="rate-guide-toolbar">
            <div class="rate-guide-search">
                <i data-lucide="search"></i>
                <input type="search" id="rateGuideSearchInput" value="${escapeHtml(activeRateCardGuideSearch)}" placeholder="Describe what the client is asking for" oninput="handleRateCardGuideSearch(this.value)" aria-label="Search quote scenarios">
            </div>
            <button type="button" onclick="clearRateCardGuideSelection()">Clear</button>
        </div>
        <div class="rate-guide-tabs" aria-label="Scenario categories">
            ${groups.map(group => `<button type="button" class="${group.id === activeRateCardGuideGroup ? 'active' : ''}" onclick="setRateCardGuideGroup('${group.id}')">${escapeHtml(group.label)}</button>`).join('')}
        </div>
        <div class="rate-guide-count">${rows.length} scenario${rows.length === 1 ? '' : 's'} found</div>
        <div class="rate-choose-layout">
            <div class="rate-choose-options">
                ${rows.length ? rows.map(row => `
                    <button type="button" class="${row.id === activeRateCardGuideId ? 'active' : ''}" onclick="selectRateCardGuide('${row.id}')">
                        <span>${escapeHtml(getRateCardScenarioGroupLabel(row.group))}</span>
                        <strong>${escapeHtml(shortenRateCardRequest(row.request))}</strong>
                    </button>
                `).join('') : '<div class="rate-choose-no-results">No matching scenarios. Try another phrase.</div>'}
            </div>
            <div class="rate-choose-result">
                ${selectedFallback ? renderRateCardGuideResult(selectedFallback) : '<div class="rate-choose-empty"><i data-lucide="mouse-pointer-click"></i><strong>Choose a request.</strong><span>The recommendation will appear here.</span></div>'}
            </div>
        </div>
    `;
}

function getRateCardScenarioGroups() {
    const groups = Array.isArray(window.RATE_CARD_SCENARIO_GROUPS) ? window.RATE_CARD_SCENARIO_GROUPS : [];
    return groups.length ? groups : [{ id: 'most-common', label: 'Most Common' }];
}

function getRateCardScenarioGroupLabel(groupId) {
    return getRateCardScenarioGroups().find(group => group.id === groupId)?.label || 'Scenario';
}

function getRateCardGuideRows() {
    return Array.isArray(window.RATE_CARD_CLASSIFICATION_GUIDE) ? window.RATE_CARD_CLASSIFICATION_GUIDE : [];
}

function getFilteredRateCardGuideRows() {
    const query = activeRateCardGuideSearch.trim().toLowerCase();
    const commonIds = new Set([
        'guide-resize',
        'guide-social-static-caption',
        'guide-social-carousel-copy',
        'guide-film-production',
        'guide-standard-edit',
        'guide-blog-article',
        'guide-seo-article',
        'guide-ai-assisted-light',
        'guide-ai-property-product',
        'guide-hybrid-short',
        'guide-gdn-copy',
        'guide-translation'
    ]);
    return getRateCardGuideRows().filter(row => {
        const matchesGroup = query || (activeRateCardGuideGroup === 'most-common' ? commonIds.has(row.id) : row.group === activeRateCardGuideGroup);
        const matchesQuery = !query || getRateCardScenarioSearchText(row).includes(query);
        return matchesGroup && matchesQuery;
    });
}

function getRateCardScenarioSearchText(row) {
    return [
        row.request,
        row.category,
        row.explanation,
        row.scopeReminder,
        row.separateQuote,
        ...(row.questions || []),
        ...(row.chargeTriggers || []),
        ...(row.addonLabels || []),
        ...(row.serviceIds || []).map(id => findRateCardItem(id)?.service || ''),
        ...(row.addonServiceIds || []).map(id => findRateCardItem(id)?.service || '')
    ].join(' ').toLowerCase();
}

function handleRateCardGuideSearch(value) {
    activeRateCardGuideSearch = value || '';
    renderRateCardModal();
    setTimeout(() => {
        const input = document.getElementById('rateGuideSearchInput');
        if (!input) return;
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
    }, 0);
}

function setRateCardGuideGroup(groupId) {
    activeRateCardGuideGroup = groupId || 'most-common';
    activeRateCardGuideSearch = '';
    activeRateCardGuideId = '';
    renderRateCardModal();
}

function shortenRateCardRequest(request = '') {
    return request
        .replace('We already have footage. Please edit it.', 'We already have footage.')
        .replace('We have existing footage and only need a few AI enhancements.', 'Existing footage + light AI.')
        .replace('We have property renders or product visuals and want a polished cinematic AI video.', 'Property/product cinematic AI.')
        .replace('We have existing assets, but several scenes need advanced AI generation or major visual replacement.', 'Advanced AI scene work.')
        .replace('Your team needs to come and shoot.', 'Your team needs to film.')
        .replace('No filming is needed. Generate everything using AI.', 'Generate everything using AI.')
        .replace('Your team needs to film real footage and add AI-generated scenes.', 'Film real footage + AI.')
        .replace('Your team needs to film us and combine the footage with AI scenes.', 'Film real footage + AI.')
        .replace('We need a 30-60 second shoot combined with multiple AI sequences.', 'Shoot + multiple AI scenes.')
        .replace('Create a virtual presenter reading our script.', 'Create a virtual presenter.')
        .replace('Animate our existing property render.', 'Animate an existing property render.')
        .replace('Change the approved English video into Mandarin with matching mouth movements.', 'Localise an existing video.')
        .replace(/^"|"$/g, '');
}

function selectRateCardGuide(guideId) {
    activeRateCardGuideId = guideId;
    renderRateCardModal();
}

function clearRateCardGuideSelection() {
    activeRateCardGuideId = '';
    activeRateCardGuideSearch = '';
    renderRateCardModal();
}

function renderRateCardGuideResult(row) {
    const items = getRateCardGuideRelevantItems(row);
    const primary = items[0] || null;
    const addons = getRateCardGuideAddonItems(row);
    const addonLabels = [
        ...addons.map(item => item.service),
        ...(row.addonLabels || [])
    ].filter(Boolean);
    const questions = row.questions || [];
    const triggers = row.chargeTriggers || [];
    return `
        <span>Recommended base service</span>
        <h3>${escapeHtml(primary?.service || row.category)}</h3>
        <p>${escapeHtml(row.explanation)}</p>
        ${primary ? `<div class="rate-guide-price"><span>${escapeHtml(primary.billingBasis)}</span><strong>${formatRateCardCurrency(primary.priceFrom)}</strong></div>` : row.separateQuote ? `<div class="rate-guide-price"><span>Pricing</span><strong>${escapeHtml(row.separateQuote)}</strong></div>` : ''}
        ${addonLabels.length ? renderRateCardGuideList('Likely Additional Charges', addonLabels.slice(0, 8)) : ''}
        ${questions.length ? renderRateCardGuideList('Before You Quote', questions.slice(0, 8)) : ''}
        ${triggers.length ? renderRateCardGuideList('Charge Triggers', triggers.slice(0, 5)) : ''}
        ${row.scopeReminder ? `<div class="rate-guide-reminder"><strong>Scope note</strong><p>${escapeHtml(row.scopeReminder)}</p></div>` : ''}
        ${items.length ? `<div class="rate-guide-services">${items.slice(0, 4).map(item => `<div class="rate-guide-service-item"><strong>${escapeHtml(item.service)}</strong><span>${formatRateCardCurrency(item.priceFrom)}</span></div>`).join('')}</div>` : ''}
        <div class="rate-guide-actions">
            <button type="button" class="rate-guide-view-btn" onclick="viewRateCardGuideServices('${row.id}')" ${items.length ? '' : 'disabled'}>View Services</button>
            <button type="button" onclick="openQuoteRecommendationPicker('${row.id}')" ${items.length || addons.length ? '' : 'disabled'}><i data-lucide="plus"></i> Add to Quote</button>
            <button type="button" onclick="copyRateCardRecommendation('${row.id}')"><i data-lucide="copy"></i> Copy Recommendation</button>
            <button type="button" onclick="clearRateCardGuideSelection()">Clear Selection</button>
        </div>
    `;
}

function renderRateCardGuideList(title, rows = []) {
    return `
        <div class="rate-guide-list">
            <strong>${escapeHtml(title)}</strong>
            <ul>${rows.map(row => `<li>${escapeHtml(row)}</li>`).join('')}</ul>
        </div>
    `;
}

function getRateCardGuideRelevantItems(row) {
    return (row.serviceIds || []).map(findRateCardItem).filter(Boolean);
}

function getRateCardGuideAddonItems(row) {
    return (row.addonServiceIds || []).map(findRateCardItem).filter(Boolean);
}

function viewRateCardGuideServices(guideId) {
    const row = getRateCardGuideRows().find(item => item.id === guideId);
    const items = row ? getRateCardGuideRelevantItems(row) : [];
    const first = items[0];
    if (first) {
        pendingRateCardNavigation = {
            categoryId: first.categoryId,
            serviceIds: items.map(item => item.id)
        };
        closeRateCardModal();
    }
}

function applyPendingRateCardNavigation() {
    const nav = pendingRateCardNavigation;
    pendingRateCardNavigation = null;
    if (!nav?.categoryId) return;
    activeRateCardCategoryId = nav.categoryId;
    activeRateCardSearch = '';
    activeRateCardSort = 'recommended';
    if (nav.categoryId === 'ai-videos') openRateCardAiGroupsForServices(nav.serviceIds);
    const input = document.getElementById('rateCardSearch');
    if (input) input.value = '';
    updateRateCardUrl();
    renderRateCardPage();
    requestAnimationFrame(() => focusRateCardRecommendedService(nav.serviceIds));
}

function openRateCardAiGroupsForServices(serviceIds = []) {
    const services = serviceIds.map(findRateCardItem).filter(Boolean);
    const hasTag = tag => services.some(item => (item.tags || []).includes(tag));
    rateCardAiGroups = {
        assisted: hasTag('assisted'),
        'ai-only': hasTag('ai-only'),
        hybrid: hasTag('hybrid'),
        'add-on': hasTag('add-on')
    };
    if (!Object.values(rateCardAiGroups).some(Boolean)) resetRateCardAiGroups();
}

function focusRateCardRecommendedService(serviceIds = []) {
    const firstId = serviceIds.find(Boolean);
    const heading = document.getElementById('rateCardResultsHeading');
    const target = firstId ? getVisibleRateCardServiceElement(firstId) : heading;
    const focusTarget = target || heading;
    if (!focusTarget) return;
    const top = Math.max(0, window.scrollY + focusTarget.getBoundingClientRect().top - 120);
    window.scrollTo({ top, behavior: 'smooth' });
    focusTarget.focus?.({ preventScroll: true });
    if (target) {
        if (rateCardHighlightTimer) clearTimeout(rateCardHighlightTimer);
        target.classList.add('rate-service-highlight');
        rateCardHighlightTimer = setTimeout(() => target.classList.remove('rate-service-highlight'), 2000);
    }
    announceRateCardNavigation(firstId ? `${findRateCardItem(firstId)?.service || 'Recommended service'} selected.` : 'Rate card services selected.');
}

function getVisibleRateCardServiceElement(serviceId) {
    const nodes = [...document.querySelectorAll(`[data-rate-service-id="${escapeRateCardSelectorValue(serviceId)}"]`)];
    return nodes.find(node => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    }) || nodes[0] || null;
}

function escapeRateCardSelectorValue(value) {
    if (window.CSS?.escape) return CSS.escape(String(value));
    return String(value).replace(/["\\]/g, '\\$&');
}

function announceRateCardNavigation(message) {
    const live = document.getElementById('rateCardLiveRegion');
    if (live) live.textContent = message;
}

function copyRateCardRecommendation(guideId) {
    const row = getRateCardGuideRows().find(item => item.id === guideId);
    if (!row) return;
    const items = getRateCardGuideRelevantItems(row);
    const primary = items[0] || null;
    const addons = [
        ...getRateCardGuideAddonItems(row).map(item => item.service),
        ...(row.addonLabels || [])
    ].filter(Boolean);
    const summary = [
        'Client request:',
        row.request,
        '',
        'Recommended service:',
        primary?.service || row.category,
        '',
        'Starting rate:',
        primary ? formatRateCardCurrency(primary.priceFrom) : (row.separateQuote || 'Separate quotation required'),
        '',
        'Billing basis:',
        primary?.billingBasis || 'Confirm scope before quoting',
        '',
        'Likely add-ons:',
        addons.length ? addons.join(', ') : 'None identified from this scenario.',
        '',
        'Confirm before quoting:',
        (row.questions || []).length ? row.questions.join(', ') : 'Confirm scope, timeline and approval stage.',
        '',
        'Scope note:',
        row.scopeReminder || row.chargeTriggers?.join(', ') || 'Final pricing depends on confirmed scope.'
    ].join('\n');
    navigator.clipboard?.writeText(summary)
        ?.then(() => announceRateCardNavigation('Recommendation copied.'))
        .catch(() => announceRateCardNavigation('Copy failed. Please try again.'));
}

function renderRateCardDiscountPanel() {
    const rules = Array.isArray(window.RATE_CARD_VOLUME_DISCOUNTS) ? window.RATE_CARD_VOLUME_DISCOUNTS : [];
    return `
        <div class="rate-panel-header">
            <span>Pricing Guidance</span>
            <h2 id="ratePanelTitle">Volume Discounts</h2>
            <p>Apply only to eligible creative and production fee subtotals.</p>
        </div>
        <table class="rate-compact-table">
            <tbody>${rules.map(rule => `<tr><th>${escapeHtml(rule.range)}</th><td>${escapeHtml(rule.value)}</td></tr>`).join('')}</tbody>
        </table>
        <div class="rate-panel-small-copy">
            <p>Volume discounts apply only when deliverables are confirmed under the same campaign, quotation or purchase order.</p>
            <p>Discounts exclude talent, printing, media spending, travel, accommodation, venue rental, equipment rental, permits, stock assets, music licences and other third-party costs.</p>
            <p>Calculate discounts from the eligible creative fee subtotal after scope and quantities are confirmed.</p>
        </div>
    `;
}

function renderRateCardTermsPanel() {
    const terms = Array.isArray(window.RATE_CARD_COMMERCIAL_TERMS) ? window.RATE_CARD_COMMERCIAL_TERMS : [];
    return `
        <div class="rate-panel-header">
            <span>Commercial</span>
            <h2 id="ratePanelTitle">Standard Terms</h2>
            <p>Use these notes before finalising a quotation.</p>
        </div>
        <div class="rate-panel-term-list">
            ${terms.map(term => `<div><i data-lucide="check"></i><span>${escapeHtml(term)}</span></div>`).join('')}
        </div>
    `;
}

function trapRateCardModalFocus(event) {
    if (event.key !== 'Tab') return;
    const overlay = document.getElementById('rateCardPanelOverlay');
    const focusables = [...(overlay?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || [])].filter(el => !el.disabled);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

document.addEventListener('keydown', event => {
    focusRateCardSearch(event);
    if (event.key === 'Escape') {
        if (activeRateCardModal) closeRateCardModal();
        else closeRateCardPopover();
    }
});

document.addEventListener('click', event => {
    const popover = getRateCardPopover();
    if (!popover?.classList.contains('show')) return;
    if (popover.contains(event.target) || event.target.closest('.rate-info-btn')) return;
    closeRateCardPopover();
});

const SETTINGS_TABS = [
    { id: 'overview', label: 'Overview', icon: 'layout-dashboard' },
    { id: 'members', label: 'Members', icon: 'users' },
    { id: 'access', label: 'Roles & Access', icon: 'shield-check' },
    { id: 'coverage', label: 'Coverage', icon: 'globe-2' },
    { id: 'workspace', label: 'Workspace', icon: 'sliders-horizontal' }
];

let activeSettingsTab = 'overview';
let settingsMemberFilters = { search: '', region: 'all', role: 'all', access: 'all', sort: 'name' };
let settingsCoverageFilter = 'active';
let settingsDialogCanBackdropClose = true;
let settingsDialogReturnFocus = null;

function renderSettingsPage() {
    populateWorkspaceCountrySelects();
    const shell = document.getElementById('settingsShell');
    if (!shell) return;

    activeSettingsTab = getSettingsTabFromUrl();
    shell.innerHTML = `
        ${renderSettingsHeader()}
        ${renderSettingsTabs()}
        <div class="settings-tab-panel">
            ${renderSettingsTabContent()}
        </div>
    `;

    renderSettingsMemberControls();
    renderSettingsAdminControls();
    checkAdminUI();
    refreshIcons();
}

function getSettingsTabFromUrl() {
    const validTabs = SETTINGS_TABS.map(tab => tab.id);
    const params = new URLSearchParams(window.location.search || '');
    const requestedTab = params.get('tab');
    if (validTabs.includes(requestedTab)) return requestedTab;
    return validTabs.includes(activeSettingsTab) ? activeSettingsTab : 'overview';
}

function setSettingsTab(tab, shouldUpdateUrl = true) {
    if (!SETTINGS_TABS.some(item => item.id === tab)) return;
    activeSettingsTab = tab;
    if (shouldUpdateUrl) {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    }
    renderSettingsPage();
}

function renderSettingsHeader() {
    const label = hasSuperAdminAccess() ? 'Superadmin' : hasAdminAccess() ? 'Admin' : 'View Mode';
    const stateClass = hasAdminAccess() ? 'settings-state-pill unlocked' : 'settings-state-pill';
    const icon = hasAdminAccess() ? 'unlock' : 'lock';
    return `
        <div class="settings-hero settings-hero-compact">
            <div>
                <h1>Settings</h1>
                <p>Manage your team, permissions and workspace.</p>
            </div>
            <span id="settingsAdminState" class="${stateClass}"><i data-lucide="${icon}"></i> ${label}</span>
        </div>
    `;
}

function renderSettingsTabs() {
    return `
        <div class="settings-tabs" role="tablist" aria-label="Settings sections">
            ${SETTINGS_TABS.map(tab => `
                <button type="button" role="tab" aria-selected="${activeSettingsTab === tab.id}" class="settings-tab ${activeSettingsTab === tab.id ? 'active' : ''}" onclick="setSettingsTab('${tab.id}')">
                    <i data-lucide="${tab.icon}"></i>
                    <span>${tab.label}</span>
                </button>
            `).join('')}
        </div>
    `;
}

function renderSettingsTabContent() {
    if (activeSettingsTab === 'members') return renderSettingsMembersTab();
    if (activeSettingsTab === 'access') return renderSettingsAccessTab();
    if (activeSettingsTab === 'coverage') return renderSettingsCoverageTab();
    if (activeSettingsTab === 'workspace') return renderSettingsWorkspaceTab();
    return renderSettingsOverviewTab();
}

function getSettingsMetrics() {
    const team = getActiveTeamMembers();
    const countryGroups = groupTeamMembersByCountry(team);
    const coveredCountryKeys = new Set(team.map(member => getCountryConfig(member.region || 'Global').name));
    return {
        total: team.length,
        creative: team.filter(isCreativeTeamMember).length,
        admin: team.filter(isAdminTeamMember).length,
        coveredCountries: coveredCountryKeys.size,
        overseas: team.filter(member => !['malaysia', 'indonesia'].includes(String(member.region || '').toLowerCase())).length,
        groupedCountries: countryGroups.length
    };
}

function renderSettingsOverviewTab() {
    const metrics = getSettingsMetrics();
    return `
        <section class="settings-overview-grid">
            <div class="settings-panel settings-overview-main">
                <div class="settings-panel-head simple">
                    <div>
                        <h3>Workspace Snapshot</h3>
                        <p>Key team signals at a glance.</p>
                    </div>
                </div>
                <div class="settings-metric-grid">
                    ${renderSettingsMetric('Total Members', metrics.total, 'users')}
                    ${renderSettingsMetric('Creative PICs', metrics.creative, 'palette')}
                    ${renderSettingsMetric('Admins', metrics.admin, 'shield-check')}
                    ${renderSettingsMetric('Covered Countries', metrics.coveredCountries, 'globe-2')}
                </div>
            </div>

            <div class="settings-panel settings-quick-panel">
                <div class="settings-panel-head simple">
                    <div>
                        <h3>Quick Actions</h3>
                        <p>Common admin moves without crowding the page.</p>
                    </div>
                </div>
                <div class="settings-quick-actions">
                    <button type="button" class="settings-primary-btn settings-admin-only" onclick="openSettingsMemberModal('add')"><i data-lucide="user-plus"></i><span>Add Member</span></button>
                    <button type="button" class="settings-action-btn" onclick="setSettingsTab('access')"><i data-lucide="shield"></i><span>Manage Access</span></button>
                    <button type="button" class="settings-action-btn settings-admin-only" onclick="openClientReviewAuditDialog()"><i data-lucide="search-check"></i><span>Review Aging</span></button>
                    <button type="button" class="settings-action-btn" onclick="exportSettingsRoster()"><i data-lucide="download"></i><span>Export Roster</span></button>
                </div>
            </div>

            <div class="settings-panel">
                <div class="settings-panel-head simple">
                    <div>
                        <h3>Recent Changes</h3>
                        <p>Latest saved activity, when available.</p>
                    </div>
                </div>
                ${renderSettingsRecentChanges()}
            </div>

            <div class="settings-panel">
                <div class="settings-panel-head simple">
                    <div>
                        <h3>Workspace Status</h3>
                        <p>Security and access state.</p>
                    </div>
                </div>
                ${renderSettingsStatusList()}
            </div>
        </section>
    `;
}

function renderSettingsMetric(label, value, icon) {
    return `
        <div class="settings-metric">
            <i data-lucide="${icon}"></i>
            <span>${label}</span>
            <strong>${value}</strong>
        </div>
    `;
}

function renderSettingsRecentChanges() {
    const logs = (globalActivityLogs || []).slice(0, 4);
    if (!logs.length) {
        return `
            <div class="settings-empty-state">
                <i data-lucide="history"></i>
                <strong>No recent changes</strong>
                <span>Workspace updates will appear here once available.</span>
            </div>
        `;
    }

    return `<div class="settings-change-list">${logs.map(log => `
        <div class="settings-change-row">
            <i data-lucide="activity"></i>
            <div>
                <strong>${escapeHtml(String(log.action_type || 'Workspace update').replace(/_/g, ' '))}</strong>
                <span>${escapeHtml(log.actor_name || 'System')} · ${formatDateTime(log.created_at)}</span>
            </div>
        </div>
    `).join('')}</div>`;
}

function renderSettingsStatusList() {
    const metrics = getSettingsMetrics();
    const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'Dark' : 'Light';
    const accessLabel = hasSuperAdminAccess() ? 'Superadmin' : hasAdminAccess() ? 'Admin' : 'View only';
    const activeRegions = `${metrics.coveredCountries} active`;
    const clientReviewSQL = clientReviewSetupState.ok === true ? 'Ready' : clientReviewSetupState.ok === false ? 'Needs SQL' : 'Unchecked';
    return `
        <div class="settings-status-list">
            ${renderSettingsStatusRow('Daily auto sign-out', 'Active', 'shield-check')}
            ${renderSettingsStatusRow('Client review setup', clientReviewSQL, clientReviewSetupState.ok === false ? 'database-zap' : 'database')}
            ${renderSettingsStatusRow('Current theme', currentTheme, 'sun')}
            ${renderSettingsStatusRow('Active regions', activeRegions, 'map-pin')}
            ${renderSettingsStatusRow('Workspace access', accessLabel, 'lock')}
            ${hasAdminAccess() ? `<button type="button" class="settings-action-btn compact" onclick="refreshClientReviewSetupStatus({ force: true, silent: false })"><i data-lucide="refresh-cw"></i><span>Check SQL Setup</span></button>` : ''}
        </div>
    `;
}

function renderSettingsStatusRow(label, value, icon) {
    return `
        <div class="settings-status-row">
            <i data-lucide="${icon}"></i>
            <span>${label}</span>
            <strong>${value}</strong>
        </div>
    `;
}

function renderSettingsMembersTab() {
    const members = getFilteredSettingsMembers();
    const totalMembers = getActiveTeamMembers().length;
    return `
        <section class="settings-panel settings-members-panel">
            <div class="settings-section-head">
                <div>
                    <h3>Members</h3>
                    <p>Search, edit and maintain the active roster.</p>
                </div>
                <button type="button" id="btnAddTeamMemberOpen" class="settings-primary-btn settings-admin-only" onclick="openSettingsMemberModal('add')">
                    <i data-lucide="user-plus"></i><span>Add Member</span>
                </button>
            </div>
            ${renderSettingsMemberFilters(totalMembers, members.length)}
            <div id="settingsMembersList" class="settings-member-list">
                ${renderSettingsMemberRows(members)}
            </div>
        </section>
    `;
}

function renderSettingsMemberFilters(totalMembers, resultCount) {
    const regionOptions = ['all', ...WORKSPACE_COUNTRIES.map(country => country.name)];
    return `
        <div class="settings-filter-bar">
            <label class="settings-search">
                <i data-lucide="search"></i>
                <input type="search" id="settingsMemberSearchInput" value="${escapeHtml(settingsMemberFilters.search)}" placeholder="Search members" oninput="setSettingsMemberFilter('search', this.value)">
            </label>
            <select aria-label="Filter by region" onchange="setSettingsMemberFilter('region', this.value)">
                ${regionOptions.map(region => `<option value="${escapeHtml(region)}" ${settingsMemberFilters.region === region ? 'selected' : ''}>${region === 'all' ? 'All regions' : `${getFlag(region)} ${region}`}</option>`).join('')}
            </select>
            <select aria-label="Filter by role" onchange="setSettingsMemberFilter('role', this.value)">
                <option value="all" ${settingsMemberFilters.role === 'all' ? 'selected' : ''}>All roles</option>
                <option value="creative" ${settingsMemberFilters.role === 'creative' ? 'selected' : ''}>Creative PIC</option>
                <option value="requester" ${settingsMemberFilters.role === 'requester' ? 'selected' : ''}>Requester</option>
            </select>
            <select aria-label="Filter by access" onchange="setSettingsMemberFilter('access', this.value)">
                <option value="all" ${settingsMemberFilters.access === 'all' ? 'selected' : ''}>All access</option>
                <option value="superadmin" ${settingsMemberFilters.access === 'superadmin' ? 'selected' : ''}>Superadmin</option>
                <option value="admin" ${settingsMemberFilters.access === 'admin' ? 'selected' : ''}>Admin</option>
                <option value="member" ${settingsMemberFilters.access === 'member' ? 'selected' : ''}>Member</option>
            </select>
            <select aria-label="Sort members" onchange="setSettingsMemberFilter('sort', this.value)">
                <option value="name" ${settingsMemberFilters.sort === 'name' ? 'selected' : ''}>Name</option>
                <option value="region" ${settingsMemberFilters.sort === 'region' ? 'selected' : ''}>Region</option>
                <option value="role" ${settingsMemberFilters.sort === 'role' ? 'selected' : ''}>Role</option>
                <option value="access" ${settingsMemberFilters.sort === 'access' ? 'selected' : ''}>Access</option>
            </select>
            <button type="button" class="settings-link-btn" onclick="clearSettingsMemberFilters()">Clear Filters</button>
            <span class="settings-result-count">${resultCount}/${totalMembers} members</span>
        </div>
    `;
}

function getFilteredSettingsMembers() {
    const search = normalizeNameKey(settingsMemberFilters.search);
    const region = settingsMemberFilters.region;
    const role = settingsMemberFilters.role;
    const access = settingsMemberFilters.access;

    const filtered = getActiveTeamMembers().filter(member => {
        const memberRole = getSettingsMemberRoleValue(member);
        const memberAccess = getSettingsAccessValue(member);
        const memberRegion = getCountryConfig(member.region || 'Global').name;
        const haystack = normalizeNameKey(`${member.name} ${memberRegion} ${memberRole} ${memberAccess}`);
        if (search && !haystack.includes(search)) return false;
        if (region !== 'all' && memberRegion !== region) return false;
        if (role !== 'all' && memberRole !== role) return false;
        if (access !== 'all' && memberAccess !== access) return false;
        return true;
    });

    return filtered.sort((a, b) => {
        if (settingsMemberFilters.sort === 'region') return sortTeamMembersByCountryThenName(a, b);
        if (settingsMemberFilters.sort === 'role') {
            const roleDiff = getSettingsMemberRoleLabel(a).localeCompare(getSettingsMemberRoleLabel(b));
            return roleDiff || String(a.name || '').localeCompare(String(b.name || ''));
        }
        if (settingsMemberFilters.sort === 'access') {
            const order = { superadmin: 0, admin: 1, member: 2 };
            const accessDiff = order[getSettingsAccessValue(a)] - order[getSettingsAccessValue(b)];
            return accessDiff || String(a.name || '').localeCompare(String(b.name || ''));
        }
        return String(a.name || '').localeCompare(String(b.name || ''));
    });
}

function renderSettingsMemberRows(members) {
    if (!members.length) {
        return `
            <div class="settings-empty-state">
                <i data-lucide="search-x"></i>
                <strong>No members found</strong>
                <span>Try another search or filter.</span>
                <button type="button" class="settings-action-btn compact" onclick="clearSettingsMemberFilters()">Clear Filters</button>
            </div>
        `;
    }

    return `
        <div class="settings-member-row settings-member-header" aria-hidden="true">
            <span>Member</span>
            <span>Region</span>
            <span>Role</span>
            <span>Access</span>
            <span></span>
        </div>
        ${members.map(renderSettingsMemberRow).join('')}
    `;
}

function renderSettingsMemberRow(member) {
    const encodedName = encodeURIComponent(member.name || '');
    const region = member.region || getCountryConfig(member.region).name || 'Global';
    const accessValue = getSettingsAccessValue(member);
    const accessLabel = getSettingsAccessLabel(member);
    const roleLabel = getSettingsMemberRoleLabel(member);
    return `
        <div class="settings-member-row">
            <div class="settings-member-person">
                <span class="settings-member-avatar">${getInitials(member.name)}</span>
                <div>
                    <strong title="${escapeHtml(member.name)}">${escapeHtml(member.name)}</strong>
                    <small>${getFlag(region)} ${escapeHtml(region)}</small>
                </div>
            </div>
            <span class="settings-member-region">${getFlag(region)} ${escapeHtml(region)}</span>
            <span class="settings-chip quiet">${roleLabel}</span>
            <span class="settings-chip ${accessValue !== 'member' ? 'elevated' : 'muted'}">${accessLabel}</span>
            <details class="settings-member-actions">
                <summary aria-label="Member actions for ${escapeHtml(member.name)}"><i data-lucide="more-horizontal"></i></summary>
                <div class="settings-member-menu">
                    ${renderSettingsMemberActionButtons(member, encodedName)}
                </div>
            </details>
        </div>
    `;
}

function renderSettingsMemberActionButtons(member, encodedName) {
    const canManageMembers = hasAdminAccess();
    const canManageAdmins = hasSuperAdminAccess();
    const isSelf = normalizeNameKey(member.name) === normalizeNameKey(getCurrentUserName());
    const isSuper = isSuperAdminName(member.name);
    const isAdmin = isAdminTeamMember(member);
    const buttons = [
        `<button type="button" onclick="openSettingsMemberDetails('${encodedName}')"><i data-lucide="info"></i>View Details</button>`
    ];

    if (canManageMembers) {
        buttons.push(`<button type="button" onclick="openSettingsMemberModal('edit', '${encodedName}')"><i data-lucide="pencil"></i>Edit Member</button>`);
    }
    if (canManageAdmins && !isSuper && !isAdmin) {
        buttons.push(`<button type="button" onclick="openSettingsAdminAccessDialog('${encodedName}')"><i data-lucide="user-check"></i>Grant Admin Access</button>`);
    }
    if (canManageAdmins && isAdmin && !isSuper && !isSelf) {
        buttons.push(`<button type="button" onclick="openSettingsAdminAccessDialog('${encodedName}')"><i data-lucide="user-x"></i>Remove Admin Access</button>`);
    }
    if (canManageMembers && !isSuper && !isSelf) {
        buttons.push(`<button type="button" class="danger" onclick="openSettingsRemoveMemberDialog('${encodedName}')"><i data-lucide="user-minus"></i>Remove Member</button>`);
    }

    return buttons.join('');
}

function setSettingsMemberFilter(key, value) {
    settingsMemberFilters = { ...settingsMemberFilters, [key]: value };
    renderSettingsPage();
}

function clearSettingsMemberFilters() {
    settingsMemberFilters = { search: '', region: 'all', role: 'all', access: 'all', sort: 'name' };
    renderSettingsPage();
}

function getSettingsMemberRoleValue(member) {
    return isCreativeTeamMember(member) ? 'creative' : 'requester';
}

function getSettingsMemberRoleLabel(member) {
    return isCreativeTeamMember(member) ? 'Creative PIC' : 'Requester';
}

function getSettingsAccessValue(member) {
    if (isSuperAdminName(member?.name)) return 'superadmin';
    return isAdminTeamMember(member) ? 'admin' : 'member';
}

function getSettingsAccessLabel(member) {
    if (isSuperAdminName(member?.name)) return 'Superadmin';
    return isAdminTeamMember(member) ? 'Admin' : 'Member';
}

function getInitials(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '??';
    return parts.slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

function renderSettingsAccessTab() {
    const team = getActiveTeamMembers();
    const roleCards = [
        { title: 'Superadmin', count: team.filter(member => isSuperAdminName(member.name)).length, desc: 'Owner controls and confidential access.' },
        { title: 'Admin', count: team.filter(member => isAdminTeamMember(member) && !isSuperAdminName(member.name)).length, desc: 'Manages roster, requests and exports.' },
        { title: 'Creative PIC', count: team.filter(isCreativeTeamMember).length, desc: 'Can be assigned production ownership.' },
        { title: 'Requester', count: team.filter(member => !isCreativeTeamMember(member)).length, desc: 'Creates and tracks creative requests.' }
    ];

    return `
        <section class="settings-access-layout">
            <div class="settings-panel">
                <div class="settings-section-head">
                    <div>
                        <h3>Roles</h3>
                        <p>Simple role map for the workspace.</p>
                    </div>
                </div>
                <div class="settings-role-grid">
                    ${roleCards.map(card => `
                        <article class="settings-role-card">
                            <span>${card.title}</span>
                            <strong>${card.count}</strong>
                            <p>${card.desc}</p>
                            <button type="button" class="settings-link-btn" onclick="openSettingsRoleMembers('${card.title}')">View Members</button>
                        </article>
                    `).join('')}
                </div>
            </div>

            <div class="settings-panel">
                <div class="settings-section-head">
                    <div>
                        <h3>Admin Access</h3>
                        <p>Superadmin access is required to manage administrators.</p>
                    </div>
                    <button type="button" class="settings-action-btn ${hasSuperAdminAccess() ? '' : 'disabled'}" ${hasSuperAdminAccess() ? 'onclick="openSettingsAdminAccessDialog()"' : 'disabled'}>
                        <i data-lucide="shield"></i><span>Manage Access</span>
                    </button>
                </div>
                <div id="settingsAdminList" class="settings-admin-list expanded"></div>
                <div id="settingsAdminHelp" class="settings-note"></div>
            </div>
        </section>
    `;
}

function renderSettingsCoverageTab() {
    const metrics = getSettingsMetrics();
    const countries = getFilteredSettingsCountries();
    return `
        <section class="settings-panel settings-coverage-panel">
            <div class="settings-section-head">
                <div>
                    <h3>Coverage</h3>
                    <p>Regional coverage using the existing workspace country list.</p>
                </div>
            </div>
            <div class="settings-metric-grid compact">
                ${renderSettingsMetric('Active Countries', metrics.coveredCountries, 'map-pin')}
                ${renderSettingsMetric('Total Members', metrics.total, 'users')}
                ${renderSettingsMetric('Overseas Members', metrics.overseas, 'plane')}
                ${renderSettingsMetric('No Members', WORKSPACE_COUNTRIES.length - metrics.coveredCountries, 'circle-alert')}
            </div>
            <div class="settings-segmented">
                ${['active', 'no-members', 'asia-pacific', 'all'].map(filter => `
                    <button type="button" class="${settingsCoverageFilter === filter ? 'active' : ''}" onclick="setSettingsCoverageFilter('${filter}')">${getSettingsCoverageFilterLabel(filter)}</button>
                `).join('')}
            </div>
            <div id="settingsCountryList" class="settings-country-grid">
                ${renderSettingsCountryCards(countries)}
            </div>
        </section>
    `;
}

function getSettingsCoverageFilterLabel(filter) {
    if (filter === 'no-members') return 'No Members';
    if (filter === 'asia-pacific') return 'Asia-Pacific';
    if (filter === 'all') return 'All';
    return 'Active';
}

function setSettingsCoverageFilter(filter) {
    settingsCoverageFilter = filter;
    renderSettingsPage();
}

function getSettingsCountriesWithMembers() {
    const team = getActiveTeamMembers();
    return WORKSPACE_COUNTRIES.map(country => {
        const members = team.filter(member => getCountryConfig(member.region || 'Global').name === country.name);
        return { ...country, members };
    });
}

function getFilteredSettingsCountries() {
    const countries = getSettingsCountriesWithMembers();
    if (settingsCoverageFilter === 'active') return countries.filter(country => country.members.length);
    if (settingsCoverageFilter === 'no-members') return countries.filter(country => !country.members.length);
    return countries;
}

function renderSettingsCountryCards(countries) {
    if (!countries.length) {
        return `
            <div class="settings-empty-state full">
                <i data-lucide="globe-2"></i>
                <strong>No regional coverage found</strong>
                <span>Assign members to a supported region to display coverage.</span>
            </div>
        `;
    }

    return countries.map(country => {
        const status = country.members.length ? 'Active' : 'No members';
        return `
            <button type="button" class="settings-country-card ${country.members.length ? 'active' : ''}" onclick="openSettingsCountryDrawer('${encodeURIComponent(country.name)}')">
                <span class="settings-country-flag">${country.flag}</span>
                <span>
                    <strong>${escapeHtml(country.name)}</strong>
                    <small>${country.code}</small>
                </span>
                <em>${country.members.length}</em>
                <small class="settings-country-status">${status}</small>
            </button>
        `;
    }).join('');
}

function renderSettingsWorkspaceTab() {
    const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'Dark mode' : 'Light mode';
    return `
        <section class="settings-workspace-layout">
            <div class="settings-panel">
                <div class="settings-section-head">
                    <div>
                        <h3>Appearance</h3>
                        <p>${currentTheme} is active.</p>
                    </div>
                    <button type="button" class="settings-action-btn" onclick="toggleTheme(event)"><i data-lucide="sun"></i><span>Toggle Theme</span></button>
                </div>
            </div>

            <div class="settings-panel">
                <div class="settings-section-head">
                    <div>
                        <h3>Security</h3>
                        <p>Daily auto sign-out is active for every user.</p>
                    </div>
                    <span class="settings-chip elevated"><i data-lucide="shield-check"></i> Active</span>
                </div>
            </div>

            <div class="settings-panel">
                <div class="settings-section-head">
                    <div>
                        <h3>Data & Maintenance</h3>
                        <p>Refresh and export workspace data for reporting.</p>
                    </div>
                </div>
                <div class="settings-actions settings-actions-row">
                    <button type="button" onclick="fetchSupabaseData(true)" class="settings-action-btn"><i data-lucide="refresh-cw"></i><span>Refresh Workspace Data</span></button>
                    <button type="button" onclick="exportReportPack()" class="settings-action-btn settings-admin-only"><i data-lucide="file-down"></i><span>Export Workspace Data</span></button>
                    <button type="button" id="btnRunClientReviewAging" onclick="runClientReviewAgingCheck()" class="settings-action-btn settings-admin-only"><i data-lucide="play"></i><span>Run Aging Check</span></button>
                    <button type="button" onclick="openClientReviewAuditDialog()" class="settings-action-btn settings-admin-only"><i data-lucide="search-check"></i><span>Client Review Audit</span></button>
                    <button type="button" onclick="exportSettingsRoster()" class="settings-action-btn"><i data-lucide="download"></i><span>Export Member Roster</span></button>
                </div>
            </div>

            <div class="settings-panel settings-danger-zone">
                <div class="settings-section-head">
                    <div>
                        <h3>Danger Zone</h3>
                        <p>Archive workspace data only when the reporting cycle is ready.</p>
                    </div>
                    <button type="button" onclick="openArchiveModal()" class="settings-danger-btn settings-admin-only"><i data-lucide="archive"></i><span>Archive Workspace</span></button>
                </div>
            </div>
        </section>
    `;
}

function renderSettingsTeamList() {
    const wrap = document.getElementById('settingsTeamList');
    if (!wrap) return;
    wrap.innerHTML = renderSettingsMemberRows(getFilteredSettingsMembers());
    refreshIcons();
}

function renderSettingsMemberControls() {
    const select = document.getElementById('settingsRemoveMember');
    const btn = document.getElementById('btnRemoveTeamMember');
    const note = document.getElementById('settingsRemoveHelp');
    const addBtn = document.getElementById('btnAddTeamMember');
    const canManage = hasAdminAccess();

    if (addBtn) addBtn.disabled = !canManage;
    if (!select && !btn && !note) return;

    const team = getActiveTeamMembers()
        .filter(member => !isSuperAdminName(member.name))
        .sort(sortTeamMembersByCountryThenName);
    const currentSelection = select ? select.value : '';

    if (select) {
        select.innerHTML = '<option value="">Select member...</option>' + renderTeamMemberOptionGroups(team, currentSelection);
        select.disabled = !canManage || !team.length;
    }

    if (btn) btn.disabled = !canManage || !team.length;
    if (note) {
        note.innerHTML = canManage
            ? '<i data-lucide="user-minus"></i><span>Keeps task history.</span>'
            : '<i data-lucide="lock"></i><span>Admin only.</span>';
    }

    refreshIcons();
}

function renderSettingsCountryList() {
    const wrap = document.getElementById('settingsCountryList');
    if (!wrap) return;
    wrap.innerHTML = renderSettingsCountryCards(getFilteredSettingsCountries());
}

function renderSettingsAdminControls() {
    const overlay = document.getElementById('settingsDialogOverlay');
    const scope = overlay?.classList.contains('show') && overlay.querySelector('#settingsAdminMember') ? overlay : document;
    const select = scope.querySelector('#settingsAdminMember');
    const list = scope.querySelector('#settingsAdminList');
    const grantBtn = scope.querySelector('#btnGrantAdmin');
    const revokeBtn = scope.querySelector('#btnRevokeAdmin');
    const note = scope.querySelector('#settingsAdminHelp');
    if (!select && !list && !note) return;

    const team = getActiveTeamMembers().sort(sortTeamMembersByCountryThenName);
    const currentSelection = select ? (select.dataset.preferredSelection || select.value) : '';
    const canManageAdmins = hasSuperAdminAccess();

    if (select) {
        select.innerHTML = '<option value="">Select member...</option>' + renderTeamMemberOptionGroups(team, currentSelection);
        if (currentSelection) select.value = currentSelection;
        select.disabled = !canManageAdmins;
        select.onchange = updateSettingsAdminCurrentAccess;
        updateSettingsAdminCurrentAccess();
    }

    if (grantBtn) grantBtn.disabled = !canManageAdmins;
    if (revokeBtn) revokeBtn.disabled = !canManageAdmins;
    if (note) {
        note.innerHTML = canManageAdmins
            ? '<i data-lucide="shield-check"></i><span>Superadmin access is required to manage administrators.</span>'
            : '<i data-lucide="lock"></i><span>Superadmin access is required to manage administrators.</span>';
    }

    if (list) {
        const admins = team.filter(isAdminTeamMember);
        list.innerHTML = admins.length ? admins.map(member => `
            <div class="settings-admin-row">
                <div>
                    <strong>${escapeHtml(member.name)}</strong>
                    <span>${getFlag(member.region)} ${escapeHtml(member.region || 'Global')}</span>
                </div>
                <small>${isSuperAdminName(member.name) ? 'Superadmin' : 'Admin'}</small>
            </div>
        `).join('') : '<div class="settings-empty-note">No administrators found</div>';
    }

    refreshIcons();
}

function updateSettingsAdminCurrentAccess() {
    const overlay = document.getElementById('settingsDialogOverlay');
    const scope = overlay?.classList.contains('show') ? overlay : document;
    const select = scope.querySelector('#settingsAdminMember');
    const label = scope.querySelector('#settingsAdminCurrentAccess');
    if (!select || !label) return;
    const member = getActiveTeamMembers().find(row => normalizeNameKey(row.name) === normalizeNameKey(select.value));
    label.textContent = member ? getSettingsAccessLabel(member) : 'Select member';
}

function openSettingsMemberModal(mode = 'add', encodedName = '') {
    if (!hasAdminAccess()) return showAppleAlert('Admin Only', 'Please unlock Admin Access before managing members.');

    const isEdit = mode === 'edit';
    const originalName = decodeSettingsName(encodedName);
    const member = isEdit ? getActiveTeamMembers().find(row => normalizeNameKey(row.name) === normalizeNameKey(originalName)) : null;
    if (isEdit && !member) return showAppleAlert('Missing Member', 'This member could not be found.');

    const role = member ? (isCreativeTeamMember(member) ? 'Creative' : 'Requester') : 'Creative';
    const region = member?.region || 'Malaysia';
    const formId = 'settingsMemberForm';
    const body = `
        <form id="${formId}" class="settings-dialog-form" onsubmit="${isEdit ? `submitSettingsMemberEdit(event, '${encodeURIComponent(originalName)}')` : 'addTeamMember(event)'}">
            <label>Name<input type="text" id="settingsMemberName" value="${escapeHtml(member?.name || '')}" placeholder="e.g. New Creative Name" autocomplete="off"></label>
            <label>Region<select id="settingsMemberRegion">${getWorkspaceCountryOptions(region)}</select></label>
            <label>Role<select id="settingsMemberRole">
                <option value="Creative" ${role === 'Creative' ? 'selected' : ''}>Creative PIC</option>
                <option value="Requester" ${role === 'Requester' ? 'selected' : ''}>Requester</option>
            </select></label>
        </form>
    `;

    openSettingsDialog({
        kind: isEdit ? 'edit-member' : 'add-member',
        mode: isEdit ? 'drawer' : 'modal',
        icon: isEdit ? 'pencil' : 'user-plus',
        title: isEdit ? 'Edit member' : 'Add member',
        description: isEdit ? 'Update the member profile without changing task history.' : 'Add a new person to the active roster.',
        body,
        footer: `
            <button type="button" class="settings-action-btn" onclick="closeSettingsDialog()">Cancel</button>
            <button type="submit" form="${formId}" id="${isEdit ? 'btnSaveSettingsMember' : 'btnAddTeamMember'}" class="settings-primary-btn">
                <i data-lucide="${isEdit ? 'save' : 'plus'}"></i><span>${isEdit ? 'Save Changes' : 'Add Member'}</span>
            </button>
        `
    });
}

function openSettingsMemberDetails(encodedName) {
    const name = decodeSettingsName(encodedName);
    const member = getActiveTeamMembers().find(row => normalizeNameKey(row.name) === normalizeNameKey(name));
    if (!member) return showAppleAlert('Missing Member', 'This member could not be found.');

    openSettingsDialog({
        kind: 'member-details',
        mode: 'drawer',
        icon: 'info',
        title: member.name,
        description: 'Member profile and current workspace access.',
        body: `
            <div class="settings-detail-list">
                ${renderSettingsDetailRow('Region', `${getFlag(member.region)} ${escapeHtml(member.region || 'Global')}`)}
                ${renderSettingsDetailRow('Role', getSettingsMemberRoleLabel(member))}
                ${renderSettingsDetailRow('Access', getSettingsAccessLabel(member))}
                ${renderSettingsDetailRow('Status', 'Active')}
            </div>
        `,
        footer: hasAdminAccess() ? `
            <button type="button" class="settings-action-btn" onclick="closeSettingsDialog()">Close</button>
            <button type="button" class="settings-primary-btn" onclick="openSettingsMemberModal('edit', '${encodeURIComponent(member.name)}')"><i data-lucide="pencil"></i><span>Edit Member</span></button>
        ` : `<button type="button" class="settings-primary-btn" onclick="closeSettingsDialog()">Done</button>`
    });
}

function renderSettingsDetailRow(label, value) {
    return `<div class="settings-detail-row"><span>${label}</span><strong>${value}</strong></div>`;
}

function openSettingsRemoveMemberDialog(encodedName) {
    if (!hasAdminAccess()) return showAppleAlert('Admin Only', 'Please unlock Admin Access before removing members.');

    const name = decodeSettingsName(encodedName);
    const member = getActiveTeamMembers().find(row => normalizeNameKey(row.name) === normalizeNameKey(name));
    if (!member) return showAppleAlert('Missing Member', 'This member could not be found.');
    if (isSuperAdminName(member.name)) return showAppleAlert('Protected Member', 'Superadmin cannot be removed from the team roster.');
    if (normalizeNameKey(member.name) === normalizeNameKey(getCurrentUserName())) {
        return showAppleAlert('Current User', 'You cannot remove your own active profile while you are signed in.');
    }

    openSettingsDialog({
        kind: 'remove-member',
        mode: 'modal',
        tone: 'danger',
        destructive: true,
        backdropClose: false,
        icon: 'user-minus',
        title: 'Remove member?',
        description: 'This will remove the member from the active roster. Existing task history will be preserved.',
        body: `
            <div class="settings-remove-summary">
                <strong>${escapeHtml(member.name)}</strong>
                <span>${getFlag(member.region)} ${escapeHtml(member.region || 'Global')} · ${getSettingsMemberRoleLabel(member)}</span>
            </div>
        `,
        footer: `
            <button type="button" class="settings-action-btn" onclick="closeSettingsDialog()">Cancel</button>
            <button type="button" id="btnConfirmRemoveMember" class="settings-danger-btn" onclick="removeTeamMemberByName('${encodeURIComponent(member.name)}', true, false, 'btnConfirmRemoveMember')">
                <i data-lucide="user-minus"></i><span>Remove Member</span>
            </button>
        `
    });
}

function openSettingsAdminAccessDialog(encodedName = '') {
    if (!hasSuperAdminAccess()) return showAppleAlert('Superadmin Only', 'Superadmin access is required to manage administrators.');
    const name = decodeSettingsName(encodedName);
    const body = `
        <div class="settings-dialog-form">
            <label>Team Member<select id="settingsAdminMember" data-preferred-selection="${escapeHtml(name)}"></select></label>
            <div class="settings-admin-current">
                <span>Current access</span>
                <strong id="settingsAdminCurrentAccess">${name ? getSettingsAccessLabel(getActiveTeamMembers().find(row => normalizeNameKey(row.name) === normalizeNameKey(name)) || {}) : 'Select member'}</strong>
            </div>
            <div id="settingsAdminHelp" class="settings-note"></div>
            <div id="settingsAdminList" class="settings-admin-list"></div>
        </div>
    `;
    openSettingsDialog({
        kind: 'admin-access',
        mode: 'drawer',
        icon: 'shield',
        title: 'Manage admin access',
        description: 'Grant or remove admin access for active team members.',
        body,
        footer: `
            <button type="button" class="settings-action-btn" onclick="closeSettingsDialog()">Cancel</button>
            <button type="button" id="btnRevokeAdmin" class="settings-danger-btn" onclick="setMemberAdminAccess(false)"><i data-lucide="user-x"></i><span>Remove Admin</span></button>
            <button type="button" id="btnGrantAdmin" class="settings-primary-btn" onclick="setMemberAdminAccess(true)"><i data-lucide="user-check"></i><span>Grant Admin</span></button>
        `
    });
    renderSettingsAdminControls();
}

function openSettingsRoleMembers(roleTitle) {
    const team = getActiveTeamMembers().filter(member => {
        if (roleTitle === 'Superadmin') return isSuperAdminName(member.name);
        if (roleTitle === 'Admin') return isAdminTeamMember(member) && !isSuperAdminName(member.name);
        if (roleTitle === 'Creative PIC') return isCreativeTeamMember(member);
        return !isCreativeTeamMember(member);
    }).sort(sortTeamMembersByCountryThenName);

    openSettingsDialog({
        kind: 'role-members',
        mode: 'drawer',
        icon: 'users',
        title: roleTitle,
        description: `${team.length} member${team.length === 1 ? '' : 's'} in this group.`,
        body: `<div class="settings-compact-member-list">${team.map(member => `
            <div>
                <strong>${escapeHtml(member.name)}</strong>
                <span>${getFlag(member.region)} ${escapeHtml(member.region || 'Global')}</span>
            </div>
        `).join('') || '<div class="settings-empty-note">No members found</div>'}</div>`,
        footer: `<button type="button" class="settings-primary-btn" onclick="closeSettingsDialog()">Done</button>`
    });
}

function openSettingsCountryDrawer(encodedCountryName) {
    const countryName = decodeSettingsName(encodedCountryName);
    const country = getSettingsCountriesWithMembers().find(item => item.name === countryName);
    if (!country) return;

    const creativeCount = country.members.filter(isCreativeTeamMember).length;
    const adminCount = country.members.filter(isAdminTeamMember).length;
    const requesterCount = country.members.length - creativeCount;
    openSettingsDialog({
        kind: 'country-members',
        mode: 'drawer',
        icon: 'globe-2',
        title: `${country.flag} ${country.name}`,
        description: `${country.members.length} active member${country.members.length === 1 ? '' : 's'} in this region.`,
        body: `
            <div class="settings-country-breakdown">
                ${renderSettingsMetric('Members', country.members.length, 'users')}
                ${renderSettingsMetric('Creative PICs', creativeCount, 'palette')}
                ${renderSettingsMetric('Admins', adminCount, 'shield-check')}
                ${renderSettingsMetric('Requesters', requesterCount, 'clipboard-list')}
            </div>
            <div class="settings-compact-member-list">
                ${country.members.map(member => `
                    <div>
                        <strong>${escapeHtml(member.name)}</strong>
                        <span>${getSettingsMemberRoleLabel(member)} · ${getSettingsAccessLabel(member)}</span>
                    </div>
                `).join('') || '<div class="settings-empty-note">No members assigned yet.</div>'}
            </div>
        `,
        footer: `<button type="button" class="settings-primary-btn" onclick="closeSettingsDialog()">Done</button>`
    });
}

function openSettingsDialog({ kind = '', mode = 'modal', tone = '', icon = 'sparkles', title = '', description = '', body = '', footer = '', destructive = false, backdropClose = true }) {
    let overlay = document.getElementById('settingsDialogOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'settingsDialogOverlay';
        document.body.appendChild(overlay);
    }

    settingsDialogCanBackdropClose = backdropClose && !destructive;
    settingsDialogReturnFocus = document.activeElement && document.activeElement !== document.body ? document.activeElement : settingsDialogReturnFocus;
    overlay.className = `settings-dialog-overlay show ${mode} ${tone}`.trim();
    overlay.dataset.settingsDialog = kind;
    overlay.setAttribute('role', 'presentation');
    overlay.setAttribute('onclick', 'handleSettingsDialogBackdrop(event)');
    overlay.innerHTML = `
        <div class="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settingsDialogTitle">
            <button type="button" class="settings-dialog-close" onclick="closeSettingsDialog()" aria-label="Close"><i data-lucide="x"></i></button>
            <div class="settings-dialog-head">
                <span class="settings-dialog-icon"><i data-lucide="${icon}"></i></span>
                <div>
                    <h3 id="settingsDialogTitle">${escapeHtml(title)}</h3>
                    ${description ? `<p>${escapeHtml(description)}</p>` : ''}
                </div>
            </div>
            <div class="settings-dialog-body">${body}</div>
            ${footer ? `<div class="settings-dialog-footer">${footer}</div>` : ''}
        </div>
    `;
    document.body.classList.add('no-scroll');
    refreshIcons();
    setTimeout(() => {
        const focusTarget = overlay.querySelector('input, select, textarea, button:not(.settings-dialog-close)');
        (focusTarget || overlay.querySelector('.settings-dialog-close'))?.focus();
    }, 40);
}

function handleSettingsDialogBackdrop(event) {
    if (event.target?.id === 'settingsDialogOverlay' && settingsDialogCanBackdropClose) closeSettingsDialog();
}

function closeSettingsDialog() {
    const overlay = document.getElementById('settingsDialogOverlay');
    if (!overlay) return;
    overlay.classList.remove('show');
    document.body.classList.remove('no-scroll');
    const returnFocus = settingsDialogReturnFocus;
    settingsDialogReturnFocus = null;
    settingsDialogCanBackdropClose = true;
    setTimeout(() => {
        if (!overlay.classList.contains('show')) overlay.remove();
        if (returnFocus && typeof returnFocus.focus === 'function') returnFocus.focus();
    }, 180);
}

function handleSettingsDialogKeydown(event) {
    const overlay = document.getElementById('settingsDialogOverlay');
    if (!overlay?.classList.contains('show')) return;
    if (event.key === 'Escape') {
        event.preventDefault();
        closeSettingsDialog();
        return;
    }
    if (event.key !== 'Tab') return;
    const focusables = [...overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(el => !el.disabled);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

document.addEventListener('keydown', handleSettingsDialogKeydown);

function decodeSettingsName(value) {
    try { return decodeURIComponent(value || ''); }
    catch(e) { return value || ''; }
}

async function setMemberAdminAccess(shouldBeAdmin) {
    if (!hasSuperAdminAccess()) {
        return showAppleAlert('Superadmin Only', 'Superadmin access is required to manage administrators.');
    }

    const select = document.getElementById('settingsAdminMember');
    const name = select ? select.value : '';
    if (!name) return showAppleAlert('Missing Member', 'Please select a team member first.');
    if (!shouldBeAdmin && isSuperAdminName(name)) {
        return showAppleAlert('Protected Access', 'Superadmin access cannot be removed from Faiz Shamsul.');
    }
    if (!shouldBeAdmin && normalizeNameKey(name) === normalizeNameKey(getCurrentUserName())) {
        return showAppleAlert('Current User', 'You cannot remove your own critical access while signed in.');
    }

    const payloadOptions = [
        { is_admin: shouldBeAdmin, access_role: shouldBeAdmin ? 'admin' : 'member' },
        { is_admin: shouldBeAdmin },
        { access_role: shouldBeAdmin ? 'admin' : 'member' },
        { access_level: shouldBeAdmin ? 'admin' : 'member' }
    ];

    let savedToSupabase = false;
    let lastError = null;

    for (const payload of payloadOptions) {
        const { error } = await supabaseClient
            .from('team_members')
            .update(payload)
            .eq('name', name);
        if (!error) {
            savedToSupabase = true;
            break;
        }
        lastError = error;
        if (!/column|schema|cache|is_admin|access_role|access_level/i.test(error.message || '')) break;
    }

    if (!savedToSupabase) {
        if (shouldBeAdmin) saveAdminOverrideName(name);
        else removeAdminOverrideName(name);
        closeSettingsDialog();
        renderSettingsPage();
        return showAppleAlert(
            'Admin Saved Locally',
            `I could not find admin access columns in Supabase yet. Run supabase-admin-access.sql once to make this shared for everyone. Details: ${lastError?.message || 'Missing column'}`
        );
    }

    if (shouldBeAdmin) saveAdminOverrideName(name);
    else removeAdminOverrideName(name);
    await fetchSupabaseData(true, true);
    closeSettingsDialog();
    renderSettingsPage();
    showNotification(shouldBeAdmin ? 'Admin Granted' : 'Admin Removed', `${name} access updated`);
}

async function addTeamMember(event) {
    if (event) event.preventDefault();
    if (!hasAdminAccess()) {
        showAppleAlert('Admin Only', 'Please unlock Admin Access before adding members.');
        return false;
    }

    const nameInput = document.getElementById('settingsMemberName');
    const regionInput = document.getElementById('settingsMemberRegion');
    const roleInput = document.getElementById('settingsMemberRole');
    const btn = document.getElementById('btnAddTeamMember');
    const name = nameInput ? nameInput.value.trim() : '';
    const region = regionInput ? regionInput.value : 'Malaysia';
    const role = roleInput ? roleInput.value : 'Requester';

    if (!name) {
        showAppleAlert('Missing Name', 'Please enter the new team member name.');
        return false;
    }

    const originalHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Adding...';
        refreshIcons();
    }

    try {
        const richPayload = {
            name,
            region,
            role,
            team: role,
            department: role === 'Creative' ? 'Creative' : 'Requester',
            is_creative: role === 'Creative',
            is_admin: false,
            access_role: 'member',
            is_active: true,
            status: 'active'
        };
        const minimalPayload = { name, region };
        let memberAlreadyExists = false;

        const saveTeamMemberPayload = async (payload) => {
            const { data: existingRows, error: lookupError } = await supabaseClient
                .from('team_members')
                .select('name')
                .eq('name', name)
                .limit(1);

            if (lookupError) return { error: lookupError };
            if (existingRows && existingRows.length) {
                memberAlreadyExists = true;
                return supabaseClient
                    .from('team_members')
                    .update(payload)
                    .eq('name', existingRows[0].name || name);
            }

            const insertResult = await supabaseClient
                .from('team_members')
                .insert([payload]);

            if (insertResult.error && /duplicate|unique/i.test(insertResult.error.message || '')) {
                memberAlreadyExists = true;
                return supabaseClient
                    .from('team_members')
                    .update(payload)
                    .eq('name', name);
            }

            return insertResult;
        };

        let { error } = await saveTeamMemberPayload(richPayload);

        if (error && /column|schema|cache|is_creative|department|role|team|is_admin|access_role|is_active|status/i.test(error.message || '')) {
            const retry = await saveTeamMemberPayload(minimalPayload);
            error = retry.error;
        }

        if (error) throw new Error(error.message);

        if (role === 'Creative') saveCreativeOverrideName(name);
        else removeCreativeOverrideName(name);
        if (nameInput) nameInput.value = '';

        await fetchSupabaseData(true, true);
        closeSettingsDialog();
        renderSettingsPage();
        showNotification(memberAlreadyExists ? 'Member Updated' : 'Member Added', memberAlreadyExists ? `${name} is now in the workspace` : 'Member added successfully.');
        return true;
    } catch(e) {
        showAppleAlert('Add Member Failed', e.message);
        return false;
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
            refreshIcons();
        }
    }
}

async function submitSettingsMemberEdit(event, encodedOriginalName) {
    if (event) event.preventDefault();
    if (!hasAdminAccess()) return showAppleAlert('Admin Only', 'Please unlock Admin Access before editing members.');

    const originalName = decodeSettingsName(encodedOriginalName);
    const member = getActiveTeamMembers().find(row => normalizeNameKey(row.name) === normalizeNameKey(originalName));
    if (!member) return showAppleAlert('Missing Member', 'This member could not be found.');

    const name = document.getElementById('settingsMemberName')?.value.trim() || '';
    const region = document.getElementById('settingsMemberRegion')?.value || member.region || 'Malaysia';
    const role = document.getElementById('settingsMemberRole')?.value || 'Requester';
    const btn = document.getElementById('btnSaveSettingsMember');
    if (!name) return showAppleAlert('Missing Name', 'Please enter the team member name.');
    if (isSuperAdminName(originalName) && normalizeNameKey(name) !== normalizeNameKey(originalName)) {
        return showAppleAlert('Protected Member', 'Superadmin profile name cannot be changed.');
    }
    const duplicate = getActiveTeamMembers().some(row => normalizeNameKey(row.name) === normalizeNameKey(name) && normalizeNameKey(row.name) !== normalizeNameKey(originalName));
    if (duplicate) return showAppleAlert('Duplicate Member', 'A member with this name already exists.');

    const originalHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Saving...';
        refreshIcons();
    }

    try {
        const richPayload = {
            name,
            region,
            role,
            team: role,
            department: role === 'Creative' ? 'Creative' : 'Requester',
            is_creative: role === 'Creative',
            is_active: true,
            status: 'active'
        };
        const minimalPayload = { name, region };

        let { error } = await supabaseClient
            .from('team_members')
            .update(richPayload)
            .eq('name', originalName);

        if (error && /column|schema|cache|is_creative|department|role|team|is_active|status/i.test(error.message || '')) {
            const retry = await supabaseClient
                .from('team_members')
                .update(minimalPayload)
                .eq('name', originalName);
            error = retry.error;
        }
        if (error) throw new Error(error.message);

        if (role === 'Creative') saveCreativeOverrideName(name);
        else removeCreativeOverrideName(name);
        if (normalizeNameKey(name) !== normalizeNameKey(originalName)) {
            removeCreativeOverrideName(originalName);
            if (getAdminOverrideNames().some(admin => normalizeNameKey(admin) === normalizeNameKey(originalName))) {
                removeAdminOverrideName(originalName);
                saveAdminOverrideName(name);
            }
        }

        globalTeamMembers = getActiveTeamMembers().map(row => (
            normalizeNameKey(row.name) === normalizeNameKey(originalName)
                ? { ...row, ...richPayload }
                : row
        ));
        hydrateTeamCollections(globalTeamMembers);

        await fetchSupabaseData(true, true);
        closeSettingsDialog();
        renderSettingsPage();
        showNotification('Member Updated', 'Member profile saved.');
    } catch(e) {
        showAppleAlert('Update Member Failed', e.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
            refreshIcons();
        }
    }
}

async function removeTeamMember(event) {
    if (event) event.preventDefault();
    const select = document.getElementById('settingsRemoveMember');
    return removeTeamMemberByName(select ? select.value : '', false, true, 'btnRemoveTeamMember');
}

async function removeTeamMemberByName(nameInput, encoded = false, shouldConfirm = true, buttonId = '') {
    if (!hasAdminAccess()) {
        return showAppleAlert('Admin Only', 'Please unlock Admin Access before removing members.');
    }

    const name = encoded ? decodeSettingsName(nameInput) : String(nameInput || '');
    const btn = buttonId ? document.getElementById(buttonId) : null;
    if (!name) return showAppleAlert('Missing Member', 'Please select a team member to remove.');
    if (isSuperAdminName(name)) return showAppleAlert('Protected Member', 'Superadmin cannot be removed from the team roster.');
    if (normalizeNameKey(name) === normalizeNameKey(getCurrentUserName())) {
        return showAppleAlert('Current User', 'You cannot remove your own active profile while you are signed in.');
    }

    const member = getActiveTeamMembers().find(row => normalizeNameKey(row.name) === normalizeNameKey(name));
    const activeTaskCount = (globalData || []).filter(task => {
        const status = String(task.status || '').toLowerCase();
        const workStatus = String(task.work_status || '').toLowerCase();
        if (status === 'deleted' || workStatus === 'done') return false;
        return getAssignedPICNames(task.assignee).some(pic => normalizeNameKey(pic) === normalizeNameKey(name));
    }).length;

    if (shouldConfirm) {
        const taskWarning = activeTaskCount ? `\n\n${activeTaskCount} active task${activeTaskCount === 1 ? '' : 's'} will keep this assignee for history.` : '';
        const confirmed = await showAppleConfirm('Remove Member?', `${name} will be removed from active dropdowns.${taskWarning}`, { confirmText: 'Remove Member', cancelText: 'Cancel', tone: 'danger', icon: 'user-minus' });
        if (!confirmed) return;
    }

    const originalHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Removing...';
        refreshIcons();
    }

    try {
        let savedToSupabase = false;
        let lastError = null;
        const removedAt = new Date().toISOString();
        const actor = getCurrentActor();
        const deactivatePayloads = [
            { is_active: false, status: 'inactive', removed_at: removedAt, removed_by: actor },
            { is_active: false, status: 'inactive' },
            { is_active: false },
            { status: 'inactive' }
        ];

        for (const payload of deactivatePayloads) {
            const { error } = await supabaseClient
                .from('team_members')
                .update(payload)
                .eq('name', name);
            if (!error) {
                savedToSupabase = true;
                break;
            }
            lastError = error;
            if (!/column|schema|cache|is_active|status|removed_at|removed_by/i.test(error.message || '')) break;
        }

        if (!savedToSupabase) {
            const { error: deleteError } = await supabaseClient
                .from('team_members')
                .delete()
                .eq('name', name);
            if (deleteError) throw new Error(deleteError.message || lastError?.message || 'Unable to remove member.');
            savedToSupabase = true;
        }

        removeAdminOverrideName(name);
        removeCreativeOverrideName(name);
        globalTeamMembers = getActiveTeamMembers().filter(row => normalizeNameKey(row.name) !== normalizeNameKey(name));
        hydrateTeamCollections(globalTeamMembers);
        const select = document.getElementById('settingsRemoveMember');
        if (select) select.value = '';

        await fetchSupabaseData(true, true);
        closeSettingsDialog();
        renderSettingsPage();
        showNotification('Member Removed', `${member?.name || name} has been removed from the active roster`);
    } catch(e) {
        showAppleAlert('Remove Member Failed', e.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
            refreshIcons();
        }
    }
}

function exportSettingsRoster() {
    const team = getActiveTeamMembers().sort(sortTeamMembersByCountryThenName);
    if (!team.length) return showAppleAlert('Export Failed', 'No active members available to export.');
    const rows = team.map(member => ({
        name: member.name || '',
        region: member.region || '',
        role: getSettingsMemberRoleLabel(member),
        access: getSettingsAccessLabel(member),
        status: 'active'
    }));
    downloadTextFile(`Adtechinno_Member_Roster_${new Date().toISOString().split('T')[0]}.csv`, rowsToCSV(['name', 'region', 'role', 'access', 'status'], rows), 'text/csv;charset=utf-8;');
    showNotification('Roster Exported', 'Member data is ready for reporting.');
}


// ========================================================
// 🌟 TEAM REVIEW - PRIVATE FEEDBACK WORKFLOW
// ========================================================
function getTeamReviewQuestionList() {
    return TEAM_REVIEW_QUESTION_GROUPS.flatMap(group => group.questions.map(question => ({
        ...question,
        category: group.key,
        categoryLabel: group.title
    })));
}

function getLocalTeamReviewStore() {
    try {
        const parsed = JSON.parse(localStorage.getItem(TEAM_REVIEW_LOCAL_KEY) || '{}');
        return {
            cycles: Array.isArray(parsed.cycles) ? parsed.cycles.map(normalizeReviewCycle) : [],
            assignments: Array.isArray(parsed.assignments) ? parsed.assignments.map(normalizeReviewAssignment) : [],
            responses: Array.isArray(parsed.responses) ? parsed.responses.map(normalizeReviewResponse) : []
        };
    } catch(e) {
        return { cycles: [], assignments: [], responses: [] };
    }
}

function saveLocalTeamReviewStore(store) {
    localStorage.setItem(TEAM_REVIEW_LOCAL_KEY, JSON.stringify({
        cycles: store.cycles || [],
        assignments: store.assignments || [],
        responses: store.responses || []
    }));
}

function getReviewCodeVault() {
    try { return JSON.parse(localStorage.getItem(TEAM_REVIEW_CODE_VAULT_KEY) || '{}'); }
    catch(e) { return {}; }
}

function setReviewCodeInVault(assignmentId, code) {
    const vault = getReviewCodeVault();
    vault[assignmentId] = String(code || '').trim().toUpperCase();
    localStorage.setItem(TEAM_REVIEW_CODE_VAULT_KEY, JSON.stringify(vault));
}

function getReviewCodeFromVault(assignmentId) {
    return getReviewCodeVault()[assignmentId] || '';
}

function mergeRowsById(primaryRows = [], fallbackRows = []) {
    const map = new Map();
    [...fallbackRows, ...primaryRows].forEach(row => {
        if (row?.id) map.set(row.id, row);
    });
    return [...map.values()];
}

function normalizeReviewCycle(row = {}) {
    return {
        id: row.id || generateTeamReviewId('cycle'),
        title: row.title || row.cycle_title || 'Team Review Cycle',
        status: row.status || 'active',
        deadline: row.deadline || '',
        created_by: row.created_by || '',
        created_at: row.created_at || new Date().toISOString(),
        updated_at: row.updated_at || row.created_at || new Date().toISOString()
    };
}

function normalizeReviewAssignment(row = {}) {
    return {
        id: row.id || generateTeamReviewId('assignment'),
        cycle_id: row.cycle_id || '',
        reviewer_name: row.reviewer_name || '',
        reviewer_region: row.reviewer_region || '',
        reviewee_name: row.reviewee_name || '',
        reviewee_region: row.reviewee_region || '',
        review_code_hash: row.review_code_hash || '',
        review_code_hint: row.review_code_hint || '',
        status: row.status || 'pending',
        submitted_at: row.submitted_at || '',
        created_at: row.created_at || new Date().toISOString()
    };
}

function normalizeReviewResponse(row = {}) {
    return {
        id: row.id || generateTeamReviewId('response'),
        assignment_id: row.assignment_id || '',
        cycle_id: row.cycle_id || '',
        reviewer_name: row.reviewer_name || '',
        reviewee_name: row.reviewee_name || '',
        ratings: parseReviewJson(row.ratings),
        comments: parseReviewJson(row.comments),
        strengths: row.strengths || '',
        improvements: row.improvements || '',
        final_comment: row.final_comment || '',
        average_score: Number(row.average_score || 0),
        submitted_at: row.submitted_at || row.created_at || new Date().toISOString()
    };
}

function nullIfBlank(value) {
    return value === '' || value === undefined ? null : value;
}

function cleanTeamReviewCycleForSupabase(row = {}) {
    const clean = normalizeReviewCycle(row);
    return {
        ...clean,
        deadline: nullIfBlank(clean.deadline),
        created_at: nullIfBlank(clean.created_at),
        updated_at: nullIfBlank(clean.updated_at)
    };
}

function cleanTeamReviewAssignmentForSupabase(row = {}) {
    const clean = normalizeReviewAssignment(row);
    return {
        ...clean,
        submitted_at: nullIfBlank(clean.submitted_at),
        created_at: nullIfBlank(clean.created_at)
    };
}

function cleanTeamReviewResponseForSupabase(row = {}) {
    const clean = normalizeReviewResponse(row);
    return {
        ...clean,
        submitted_at: nullIfBlank(clean.submitted_at)
    };
}

function cleanTeamReviewRowsForSupabase(table, rows = []) {
    const cleaners = {
        team_review_cycles: cleanTeamReviewCycleForSupabase,
        team_review_assignments: cleanTeamReviewAssignmentForSupabase,
        team_review_responses: cleanTeamReviewResponseForSupabase
    };
    const cleaner = cleaners[table] || (row => row);
    return rows.map(cleaner);
}

function parseReviewJson(value) {
    if (!value) return {};
    if (typeof value === 'object') return value;
    try { return JSON.parse(value); }
    catch(e) { return {}; }
}

function generateTeamReviewId(prefix = 'review') {
    const randomPart = Math.random().toString(36).slice(2, 9);
    return `${prefix}_${Date.now()}_${randomPart}`;
}

function normalizeReviewCode(rawCode) {
    return String(rawCode || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function normalizeReviewCodeLegacy(rawCode) {
    return String(rawCode || '').trim().toUpperCase().replace(/\s+/g, '');
}

function getReviewCodeLookupValues(rawCode) {
    return [...new Set([normalizeReviewCode(rawCode), normalizeReviewCodeLegacy(rawCode)].filter(Boolean))];
}

function generateReviewCode(reviewerName = '') {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const pick = (length) => Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
    const initials = String(reviewerName || 'RV').replace(/[^a-z0-9]/gi, '').slice(0, 2).toUpperCase().padEnd(2, 'R');
    return `TR-${initials}-${pick(4)}-${pick(4)}`;
}

function getReviewCodeHint(code) {
    const clean = normalizeReviewCode(code);
    if (clean.length <= 6) return clean;
    return `${clean.slice(0, 5)}...${clean.slice(-3)}`;
}

async function hashNormalizedReviewCode(normalized) {
    if (!normalized) return '';
    if (window.crypto?.subtle && window.TextEncoder) {
        const buffer = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
        return [...new Uint8Array(buffer)].map(byte => byte.toString(16).padStart(2, '0')).join('');
    }

    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
        hash = ((hash << 5) - hash) + normalized.charCodeAt(i);
        hash |= 0;
    }
    return `fallback-${Math.abs(hash)}-${normalized.length}`;
}

async function hashReviewCode(rawCode) {
    return hashNormalizedReviewCode(normalizeReviewCode(rawCode));
}

async function getReviewCodeLookupHashes(rawCode) {
    const hashes = await Promise.all(getReviewCodeLookupValues(rawCode).map(hashNormalizedReviewCode));
    return [...new Set(hashes.filter(Boolean))];
}

async function fetchTeamReviewData() {
    const adminAccess = hasSuperAdminAccess();
    if (!adminAccess) {
        // Reviewers never need the full dataset in memory — unlockTeamReviewCode() and
        // fetchTeamReviewResponseForAssignment() re-prove access with their pass on every call
        // instead. BUT this runs on every background realtime tick too, so blindly wiping
        // everything here was also erasing the cycle info (title/deadline) for whichever review
        // the reviewer currently has open mid-session — the deadline would show, then a few
        // seconds later disappear once any unrelated realtime event triggered a refresh. Keep
        // only what belongs to their active session; still clear everything else.
        const keepCycleId = activeReviewAssignment?.cycle_id;
        const keepAssignmentId = activeReviewAssignment?.id;
        globalReviewCycles = keepCycleId ? (globalReviewCycles || []).filter(c => c.id === keepCycleId) : [];
        globalReviewAssignments = keepAssignmentId ? (globalReviewAssignments || []).filter(a => a.id === keepAssignmentId) : [];
        globalReviewResponses = keepAssignmentId ? (globalReviewResponses || []).filter(r => r.assignment_id === keepAssignmentId) : [];
        return;
    }

    const local = getLocalTeamReviewStore();
    let cycles = local.cycles;
    let assignments = local.assignments;
    let responses = local.responses;

    try {
        const { data, error } = await supabaseClient
            .from('team_review_cycles')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        cycles = mergeRowsById((data || []).map(normalizeReviewCycle), local.cycles);
    } catch(e) {
        if (!/does not exist|schema|relation|table/i.test(e.message || '')) console.log('Team review cycles fallback:', e.message);
    }

    try {
        const { data, error } = await supabaseClient
            .from('team_review_assignments')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        assignments = mergeRowsById((data || []).map(normalizeReviewAssignment), local.assignments);
    } catch(e) {
        if (!/does not exist|schema|relation|table/i.test(e.message || '')) console.log('Team review assignments fallback:', e.message);
    }

    try {
        // team_review_responses has no direct SELECT grant (see supabase-team-review-hardening.sql) —
        // this RPC is the only way to read response content, admin included.
        const { data, error } = await supabaseClient.rpc('team_review_admin_list_responses');
        if (error) throw error;
        responses = mergeRowsById((data || []).map(normalizeReviewResponse), local.responses);
    } catch(e) {
        if (!/does not exist|schema|relation|table|function|rpc/i.test(e.message || '')) console.log('Team review responses fallback:', e.message);
    }

    // Bug fix: this used to merge with local (this admin's own cached copy from whenever the round
    // was created) as the PRIMARY source, so a stale local "pending" permanently overwrote a fresh
    // "submitted" status from Supabase on every fetch. Fresh server data must win here — local only
    // fills in items that genuinely haven't synced to Supabase yet (e.g. created while offline).
    if (await syncLocalTeamReviewStoreToSupabase(local)) {
        cycles = mergeRowsById(cycles, local.cycles.map(normalizeReviewCycle));
        assignments = mergeRowsById(assignments, local.assignments.map(normalizeReviewAssignment));
        responses = mergeRowsById(responses, local.responses.map(normalizeReviewResponse));
    }

    globalReviewCycles = cycles.map(normalizeReviewCycle);
    globalReviewAssignments = assignments.map(normalizeReviewAssignment);
    globalReviewResponses = responses.map(normalizeReviewResponse);
}

async function fetchTeamReviewResponseForAssignment(assignmentId, codeHashes = []) {
    if (!assignmentId) return null;
    const existing = getReviewResponseForAssignment(assignmentId);
    if (existing) return existing;
    // Admin already has every response via fetchTeamReviewData(); a reviewer with no cached copy must
    // re-prove their pass here since team_review_responses has no direct SELECT grant anymore.
    if (!codeHashes.length) return null;

    try {
        const { data, error } = await supabaseClient.rpc('team_review_get_response', {
            p_assignment_id: assignmentId,
            p_code_hashes: codeHashes
        });
        if (error) throw error;
        const row = Array.isArray(data) ? data[0] : data;
        if (!row) return null;
        const response = normalizeReviewResponse(row);
        globalReviewResponses = mergeRowsById([response], globalReviewResponses || []);
        return response;
    } catch(e) {
        if (!/does not exist|schema|relation|table|function|rpc|no rows/i.test(e.message || '')) console.log('Team review response lookup fallback:', e.message);
        return null;
    }
}


async function findTeamReviewAssignmentByCode(rawCode) {
    const hashes = await getReviewCodeLookupHashes(rawCode);
    if (!hashes.length) return { assignment: null, error: null };

    const localMatch = (globalReviewAssignments || []).find(row => hashes.includes(row.review_code_hash));
    if (localMatch) return { assignment: localMatch, error: null };

    try {
        const { data, error } = await supabaseClient
            .from('team_review_assignments')
            .select('*')
            .in('review_code_hash', hashes)
            .limit(1);
        if (error) throw error;
        const row = Array.isArray(data) ? data[0] : data;
        if (!row) return { assignment: null, error: null };

        const assignment = normalizeReviewAssignment(row);
        globalReviewAssignments = mergeRowsById([assignment], globalReviewAssignments || []);

        if (assignment.cycle_id && !getReviewCycle(assignment.cycle_id)) {
            try {
                const { data: cycleData, error: cycleError } = await supabaseClient
                    .from('team_review_cycles')
                    .select('*')
                    .eq('id', assignment.cycle_id)
                    .limit(1);
                if (cycleError) throw cycleError;
                const cycleRow = Array.isArray(cycleData) ? cycleData[0] : cycleData;
                if (cycleRow) globalReviewCycles = mergeRowsById([normalizeReviewCycle(cycleRow)], globalReviewCycles || []);
            } catch(e) {
                console.log('Team review cycle lookup fallback:', e.message);
            }
        }

        return { assignment, error: null };
    } catch(e) {
        return { assignment: null, error: e };
    }
}

function persistReviewDataLocally({ cycles = [], assignments = [], responses = [] }) {
    const local = getLocalTeamReviewStore();
    const next = {
        cycles: mergeRowsById(cycles.map(normalizeReviewCycle), local.cycles),
        assignments: mergeRowsById(assignments.map(normalizeReviewAssignment), local.assignments),
        responses: mergeRowsById(responses.map(normalizeReviewResponse), local.responses)
    };
    saveLocalTeamReviewStore(next);
    globalReviewCycles = mergeRowsById(cycles.map(normalizeReviewCycle), globalReviewCycles);
    globalReviewAssignments = mergeRowsById(assignments.map(normalizeReviewAssignment), globalReviewAssignments);
    globalReviewResponses = mergeRowsById(responses.map(normalizeReviewResponse), globalReviewResponses);
}


async function upsertTeamReviewRowsViaRest(table, rows = []) {
    const cleanRows = cleanTeamReviewRowsForSupabase(table, rows);
    if (!cleanRows.length) return true;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=id`, {
        method: 'POST',
        headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify(cleanRows)
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`${table} ${response.status}: ${body || response.statusText}`);
    }
    return true;
}

async function persistTeamReviewCycle(cycle, assignments) {
    const dbCycle = cleanTeamReviewCycleForSupabase(cycle);
    const dbAssignments = assignments.map(cleanTeamReviewAssignmentForSupabase);
    let savedToSupabase = false;
    let lastError = null;
    try {
        const { error: cycleError } = await supabaseClient
            .from('team_review_cycles')
            .upsert([dbCycle], { onConflict: 'id' });
        if (cycleError) throw cycleError;

        const { error: assignmentError } = await supabaseClient
            .from('team_review_assignments')
            .upsert(dbAssignments, { onConflict: 'id' });
        if (assignmentError) throw assignmentError;
        savedToSupabase = true;
    } catch(e) {
        lastError = e;
        try {
            await upsertTeamReviewRowsViaRest('team_review_cycles', [dbCycle]);
            await upsertTeamReviewRowsViaRest('team_review_assignments', dbAssignments);
            savedToSupabase = true;
            lastError = null;
        } catch(restError) {
            lastError = restError;
        }
    }

    // Only cache locally when the Supabase write genuinely failed. Caching unconditionally meant
    // an in-flight fetchTeamReviewData() that had already captured the local store (with this
    // cycle still in it, from before a later delete) would upsert it right back into Supabase via
    // syncLocalTeamReviewStoreToSupabase() — a deleted round could "resurrect" itself seconds
    // after being deleted, purely from timing.
    if (!savedToSupabase) persistReviewDataLocally({ cycles: [cycle], assignments });
    return { savedToSupabase, lastError };
}

async function persistTeamReviewSubmission(assignment, response, codeHashes = []) {
    const submittedAt = response.submitted_at || new Date().toISOString();
    const updatedAssignment = { ...assignment, status: 'submitted', submitted_at: submittedAt };
    const dbResponse = cleanTeamReviewResponseForSupabase({ ...response, submitted_at: submittedAt });
    let savedToSupabase = false;
    let lastError = null;

    try {
        // team_review_responses has no direct INSERT grant — this RPC re-validates the pass hash
        // server-side before writing, so a submission can't be forged without a real assignment code.
        const { error } = await supabaseClient.rpc('team_review_submit', {
            p_response_id: dbResponse.id,
            p_assignment_id: assignment.id,
            p_code_hashes: codeHashes,
            p_ratings: dbResponse.ratings,
            p_comments: dbResponse.comments,
            p_strengths: dbResponse.strengths,
            p_improvements: dbResponse.improvements,
            p_final_comment: dbResponse.final_comment,
            p_average_score: dbResponse.average_score
        });
        if (error) throw error;
        savedToSupabase = true;
    } catch(e) {
        lastError = e;
    }

    globalReviewAssignments = globalReviewAssignments.map(row => row.id === assignment.id ? normalizeReviewAssignment(updatedAssignment) : row);
    const withoutOldResponse = globalReviewResponses.filter(row => row.assignment_id !== assignment.id);
    globalReviewResponses = [normalizeReviewResponse(response), ...withoutOldResponse];
    // Same reasoning as persistTeamReviewCycle above: only cache locally on genuine failure, or a
    // stale in-flight fetch can resurrect this submission/assignment state after it's been
    // changed again (e.g. the round it belongs to gets deleted).
    if (!savedToSupabase) persistReviewDataLocally({ assignments: [updatedAssignment], responses: [response] });
    return { savedToSupabase, lastError };
}


async function syncLocalTeamReviewStoreToSupabase(localStore = getLocalTeamReviewStore()) {
    if (!hasSuperAdminAccess()) return false;
    const cycles = (localStore.cycles || []).map(cleanTeamReviewCycleForSupabase).filter(row => row.id);
    const assignments = (localStore.assignments || []).map(cleanTeamReviewAssignmentForSupabase).filter(row => row.id);
    // Responses are intentionally NOT pushed here anymore — team_review_responses has no direct
    // write grant now, only the team_review_submit RPC (which needs the reviewer's pass hash, not
    // available from this locally-cached admin store). Locally-cached responses stay local-only.
    if (!cycles.length && !assignments.length) return true;

    try {
        if (cycles.length) {
            const { error } = await supabaseClient.from('team_review_cycles').upsert(cycles, { onConflict: 'id' });
            if (error) throw error;
        }
        if (assignments.length) {
            const { error } = await supabaseClient.from('team_review_assignments').upsert(assignments, { onConflict: 'id' });
            if (error) throw error;
        }
        return true;
    } catch(e) {
        try {
            await upsertTeamReviewRowsViaRest('team_review_cycles', cycles);
            await upsertTeamReviewRowsViaRest('team_review_assignments', assignments);
            return true;
        } catch(restError) {
            console.log('Team review local sync fallback:', restError.message || e.message);
            return false;
        }
    }
}

function getTeamReviewMembers() {
    const team = (globalTeamMembers || []).map(member => ({
        name: member.name,
        region: member.region || 'Global'
    })).filter(member => member.name);

    if (team.length) {
        const seen = new Set();
        return team.filter(member => {
            const key = normalizeNameKey(member.name);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        }).sort((a, b) => String(a.name).localeCompare(String(b.name)));
    }

    return [...new Set([...allStaffMY, ...allStaffID, ...PIC_LIST])].filter(Boolean).map(name => ({
        name,
        region: allStaffID.includes(name) || дизайнериID.includes(name) ? 'Indonesia' : 'Malaysia'
    })).sort((a, b) => a.name.localeCompare(b.name));
}

function getTeamReviewMemberRegion(name) {
    const key = normalizeNameKey(name);
    const member = getTeamReviewMembers().find(row => normalizeNameKey(row.name) === key);
    return member?.region || 'Global';
}

function getTeamReviewMemberOptions(selected = '') {
    const members = getTeamReviewMembers();
    const grouped = members.reduce((groups, member) => {
        const region = member.region || 'Global';
        if (!groups[region]) groups[region] = [];
        groups[region].push(member);
        return groups;
    }, {});

    const orderedRegions = [
        ...WORKSPACE_COUNTRIES.map(country => country.name).filter(region => grouped[region]),
        ...Object.keys(grouped).filter(region => !WORKSPACE_COUNTRIES.some(country => country.name === region)).sort()
    ];

    const optgroups = orderedRegions.map(region => {
        const rows = grouped[region].sort((a, b) => String(a.name).localeCompare(String(b.name))).map(member => {
            const selectedAttr = member.name === selected ? 'selected' : '';
            return `<option value="${escapeHtml(member.name)}" ${selectedAttr}>${escapeHtml(member.name)}</option>`;
        }).join('');
        return `<optgroup label="${getFlag(region)} ${escapeHtml(region)}">${rows}</optgroup>`;
    }).join('');

    return '<option value="">Select member...</option>' + optgroups;
}

function getReviewCycle(cycleId) {
    return (globalReviewCycles || []).find(cycle => cycle.id === cycleId) || null;
}

/**
 * Test rounds reuse the existing "status" column (status: 'test') instead of a new DB column —
 * no SQL migration needed, works retroactively. Kept out of dashboard totals and CSV exports.
 */
function isTestReviewCycle(cycle) {
    return cycle?.status === 'test';
}

function isTestReviewCycleId(cycleId) {
    return isTestReviewCycle(getReviewCycle(cycleId));
}

function getReviewResponseForAssignment(assignmentId) {
    return (globalReviewResponses || []).find(response => response.assignment_id === assignmentId) || null;
}

function getReviewCycleAssignments(cycleId) {
    return (globalReviewAssignments || []).filter(assignment => assignment.cycle_id === cycleId);
}

function calculateReviewAverage(ratings = {}) {
    const questionIds = getTeamReviewQuestionList().map(question => question.id);
    const values = questionIds.map(id => Number(ratings[id])).filter(score => score >= 1 && score <= 5);
    if (!values.length) return 0;
    return Math.round((values.reduce((sum, score) => sum + score, 0) / values.length) * 10) / 10;
}

function getReviewCategoryAverage(ratings = {}, categoryKey) {
    const group = TEAM_REVIEW_QUESTION_GROUPS.find(item => item.key === categoryKey);
    if (!group) return '';
    const values = group.questions.map(question => Number(ratings[question.id])).filter(score => score >= 1 && score <= 5);
    if (!values.length) return '';
    return Math.round((values.reduce((sum, score) => sum + score, 0) / values.length) * 10) / 10;
}

function getDefaultReviewRoundTitle(date = new Date()) {
    const month = date.toLocaleString('en-MY', { month: 'long' });
    return `${month} ${date.getFullYear()} Team Review`;
}

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getDefaultReviewDeadline(date = new Date()) {
    const deadline = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return formatDateForInput(deadline);
}

function setDefaultTeamReviewFields() {
    const titleInput = document.getElementById('reviewCycleTitle');
    const deadlineInput = document.getElementById('reviewCycleDeadline');
    if (titleInput && !titleInput.value.trim()) titleInput.value = getDefaultReviewRoundTitle();
    if (deadlineInput && !deadlineInput.value) deadlineInput.value = getDefaultReviewDeadline();
}

function renderTeamReviewPage() {
    const page = document.getElementById('team-review');
    if (!page) return;

    const adminAccess = hasSuperAdminAccess();
    const shell = page.querySelector('.team-review-shell');
    if (shell) shell.classList.toggle('reviewer-only', !adminAccess);
    page.classList.toggle('reviewer-mode', !adminAccess);
    page.querySelectorAll('.settings-admin-only').forEach(el => {
        if (el.id === 'teamReviewAdminPanel') el.style.display = adminAccess ? 'block' : 'none';
        else el.style.display = adminAccess ? 'inline-flex' : 'none';
    });

    if (!adminAccess) {
        renderActiveReviewForm();
        refreshIcons();
        return;
    }

    setDefaultTeamReviewFields();
    renderTeamReviewSelectors();
    renderTeamReviewMetrics();
    renderReviewPairDraftList();
    renderTeamReviewCycleList();
    renderActiveReviewForm();
    refreshIcons();
}

function renderTeamReviewSelectors() {
    const reviewerSelect = document.getElementById('reviewReviewerSelect');
    const revieweeSelect = document.getElementById('reviewRevieweeSelect');
    if (reviewerSelect) {
        const current = reviewerSelect.value;
        reviewerSelect.innerHTML = getTeamReviewMemberOptions(current);
        if (current) reviewerSelect.value = current;
    }
    if (revieweeSelect) {
        const current = revieweeSelect.value;
        revieweeSelect.innerHTML = getTeamReviewMemberOptions(current);
        if (current) revieweeSelect.value = current;
    }
}

function renderTeamReviewMetrics() {
    const wrap = document.getElementById('teamReviewMetrics');
    if (!wrap) return;

    const cycles = (globalReviewCycles || []).filter(cycle => !isTestReviewCycle(cycle));
    const assignments = (globalReviewAssignments || []).filter(row => !isTestReviewCycleId(row.cycle_id));
    const responses = (globalReviewResponses || []).filter(row => !isTestReviewCycleId(row.cycle_id));
    const pending = assignments.filter(row => row.status !== 'submitted').length;
    const submitted = assignments.filter(row => row.status === 'submitted').length;
    const avgScores = responses.map(row => Number(row.average_score)).filter(Boolean);
    const avg = avgScores.length ? (avgScores.reduce((sum, score) => sum + score, 0) / avgScores.length).toFixed(1) : '--';

    wrap.innerHTML = `
        <div class="review-metric"><span>Rounds</span><strong>${cycles.length}</strong></div>
        <div class="review-metric"><span>Pending</span><strong>${pending}</strong></div>
        <div class="review-metric"><span>Submitted</span><strong>${submitted}</strong></div>
        <div class="review-metric"><span>Avg Score</span><strong>${avg}</strong></div>
    `;
}

function renderReviewPairDraftList() {
    const wrap = document.getElementById('reviewPairDraftList');
    if (!wrap) return;

    if (!reviewPairDraft.length) {
        wrap.innerHTML = '<div class="review-empty-note">No review pairs added yet.</div>';
        return;
    }

    wrap.innerHTML = reviewPairDraft.map((pair, index) => `
        <div class="review-pair-draft">
            <span>${escapeHtml(pair.reviewer_name)}</span>
            <i data-lucide="arrow-right"></i>
            <strong>${escapeHtml(pair.reviewee_name)}</strong>
            <button type="button" onclick="removeReviewPairDraft(${index})" aria-label="Remove pair"><i data-lucide="x"></i></button>
        </div>
    `).join('');
    refreshIcons();
}

function addReviewPairDraft() {
    if (!hasSuperAdminAccess()) return showAppleAlert('Superadmin Only', 'Team Review is private.');
    const reviewer = document.getElementById('reviewReviewerSelect')?.value || '';
    const reviewee = document.getElementById('reviewRevieweeSelect')?.value || '';
    if (!reviewer || !reviewee) return showAppleAlert('Missing Pair', 'Please select both reviewer and reviewee.');
    if (normalizeNameKey(reviewer) === normalizeNameKey(reviewee)) return showAppleAlert('Invalid Pair', 'Reviewer and reviewee must be different people.');

    const reviewerKey = normalizeNameKey(reviewer);
    const revieweeKey = normalizeNameKey(reviewee);

    const duplicateInDraft = reviewPairDraft.some(pair => normalizeNameKey(pair.reviewer_name) === reviewerKey && normalizeNameKey(pair.reviewee_name) === revieweeKey);
    if (duplicateInDraft) return showAppleAlert('Pair Exists', 'This reviewer pair is already added.');

    const duplicateInOpenCycle = (globalReviewAssignments || []).some(row => {
        if (row.status === 'submitted') return false;
        const cycle = getReviewCycle(row.cycle_id);
        if (cycle && cycle.status !== 'active') return false;
        return normalizeNameKey(row.reviewer_name) === reviewerKey && normalizeNameKey(row.reviewee_name) === revieweeKey;
    });
    if (duplicateInOpenCycle) return showAppleAlert('Pair Already Pending', 'This reviewer already has an open, unsubmitted review for this person in another round. Wait for it to be submitted or delete that round first.');

    reviewPairDraft.push({
        reviewer_name: reviewer,
        reviewer_region: getTeamReviewMemberRegion(reviewer),
        reviewee_name: reviewee,
        reviewee_region: getTeamReviewMemberRegion(reviewee)
    });
    renderReviewPairDraftList();
}

function removeReviewPairDraft(index) {
    reviewPairDraft.splice(index, 1);
    renderReviewPairDraftList();
}

async function createTeamReviewCycle(event) {
    if (event) event.preventDefault();
    if (!hasSuperAdminAccess()) return showAppleAlert('Superadmin Only', 'Team Review is private.');

    const titleInput = document.getElementById('reviewCycleTitle');
    const deadlineInput = document.getElementById('reviewCycleDeadline');
    const isTestInput = document.getElementById('reviewCycleIsTest');
    const btn = document.getElementById('btnCreateReviewCycle');
    const title = titleInput?.value.trim() || '';
    const deadline = deadlineInput?.value || '';
    const isTest = Boolean(isTestInput?.checked);

    if (!title) return showAppleAlert('Missing Round Name', 'Please add a review round name first.');
    if (!deadline) return showAppleAlert('Missing Deadline', 'Please choose a deadline.');
    if (!reviewPairDraft.length) return showAppleAlert('Missing Review Pairs', 'Please add at least one reviewer pair.');

    const originalHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i><span>Creating passes...</span>';
        refreshIcons();
    }

    try {
        const now = new Date().toISOString();
        const cycle = normalizeReviewCycle({
            id: generateTeamReviewId('cycle'),
            title,
            status: isTest ? 'test' : 'active',
            deadline,
            created_by: getCurrentUserName() || 'Admin',
            created_at: now,
            updated_at: now
        });

        const generatedCodes = [];
        const assignments = [];
        for (const pair of reviewPairDraft) {
            const code = generateReviewCode(pair.reviewer_name);
            const assignment = normalizeReviewAssignment({
                id: generateTeamReviewId('assignment'),
                cycle_id: cycle.id,
                reviewer_name: pair.reviewer_name,
                reviewer_region: pair.reviewer_region,
                reviewee_name: pair.reviewee_name,
                reviewee_region: pair.reviewee_region,
                review_code_hash: await hashReviewCode(code),
                review_code_hint: getReviewCodeHint(code),
                status: 'pending',
                created_at: now
            });
            assignments.push(assignment);
            generatedCodes.push({ ...assignment, code });
        }

        const result = await persistTeamReviewCycle(cycle, assignments);
        generatedCodes.forEach(item => setReviewCodeInVault(item.id, item.code));
        lastGeneratedReviewCodes = generatedCodes.map(item => ({ ...item, cycle_id: cycle.id }));
        reviewPairDraft = [];
        if (titleInput) titleInput.value = '';
        if (deadlineInput) deadlineInput.value = '';
        if (isTestInput) isTestInput.checked = false;
        renderTeamReviewPage();
        renderPassesReadyPanel(cycle, lastGeneratedReviewCodes);

        if (!result.savedToSupabase) {
            const errorText = result.lastError?.message ? ` Supabase error: ${result.lastError.message}` : '';
            showAppleAlert('Not Shared Yet', `The round is saved on this admin device, but the team cannot use these passes until it syncs to Supabase. Run supabase-team-review.sql if needed, then reopen Team Review as superadmin to auto-sync.${errorText}`);
        } else {
            showNotification(isTest ? 'Test Round Created' : 'Review Round Created', `${assignments.length} pass${assignments.length === 1 ? '' : 'es'} ready below — send each one only to that reviewer`);
        }
    } catch(e) {
        showAppleAlert('Create Review Failed', e.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
            refreshIcons();
        }
    }
}

/**
 * Shows freshly generated review passes as a clean inline panel instead of a plain alert() dump,
 * so admin can copy/send each one without losing the create-round context.
 */
function renderPassesReadyPanel(cycle, generatedCodes) {
    const wrap = document.getElementById('teamReviewPassesReady');
    if (!wrap) return;

    if (!cycle || !generatedCodes?.length) {
        wrap.style.display = 'none';
        wrap.innerHTML = '';
        return;
    }

    const rows = generatedCodes.map(item => `
        <div class="review-pass-row">
            <div>
                <strong>${escapeHtml(item.reviewer_name)}</strong>
                <span>reviews ${escapeHtml(item.reviewee_name)}</span>
            </div>
            <div class="review-pass-code-group">
                <code>${escapeHtml(item.code)}</code>
                <button type="button" onclick="copyReviewPassCodeOnly('${escapeHtml(item.code)}', this)" aria-label="Copy code"><i data-lucide="copy"></i></button>
            </div>
        </div>
    `).join('');

    wrap.style.display = 'block';
    wrap.innerHTML = `
        <div class="review-passes-ready-head">
            <div>
                <span>Passes Ready${isTestReviewCycle(cycle) ? ' · TEST ROUND' : ''}</span>
                <h4>${escapeHtml(cycle.title)}</h4>
                <p>Send each pass privately to that reviewer only — whoever has it can submit that review.</p>
            </div>
            <button type="button" class="review-nav-btn secondary" onclick="dismissPassesReadyPanel()"><span>Done</span></button>
        </div>
        <div class="review-pass-list">${rows}</div>
        <button type="button" class="review-copy-all-btn" onclick="copyAllReviewPasses('${cycle.id}')"><i data-lucide="copy-check"></i><span>Copy All Passes</span></button>
    `;
    refreshIcons();
}

function copyReviewPassCodeOnly(code, btn) {
    navigator.clipboard.writeText(code);
    if (btn) {
        const original = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="check"></i>';
        refreshIcons();
        setTimeout(() => { btn.innerHTML = original; refreshIcons(); }, 1200);
    }
    showNotification('Code Copied', code);
}

function copyAllReviewPasses(cycleId) {
    if (!hasSuperAdminAccess()) return;
    const cycle = getReviewCycle(cycleId);
    const codes = lastGeneratedReviewCodes.filter(item => item.cycle_id === cycleId);
    if (!codes.length) return showAppleAlert('Nothing To Copy', 'These passes are no longer available on this device. Use the reset icon on a specific assignment to reissue one.');

    const message = `${cycle?.title || 'Team Review'} — Review Passes\nDeadline: ${formatDate(cycle?.deadline)}\n\n${codes.map(item => `${item.reviewer_name} → reviews ${item.reviewee_name}: ${item.code}`).join('\n')}\n\nSplit these up and send each line privately to that reviewer only.`;
    navigator.clipboard.writeText(message);
    showNotification('All Passes Copied', 'Remember to split them up before sending');
}

function dismissPassesReadyPanel() {
    lastGeneratedReviewCodes = [];
    renderPassesReadyPanel(null, []);
}

function renderTeamReviewCycleList() {
    const wrap = document.getElementById('teamReviewCycleList');
    if (!wrap) return;

    const cycles = [...(globalReviewCycles || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (!cycles.length) {
        wrap.innerHTML = '<div class="review-empty-state"><i data-lucide="clipboard-check"></i><p>No review rounds yet.</p></div>';
        refreshIcons();
        return;
    }

    wrap.innerHTML = cycles.map(cycle => {
        const assignments = getReviewCycleAssignments(cycle.id);
        const submitted = assignments.filter(item => item.status === 'submitted').length;
        const completion = assignments.length ? Math.round((submitted / assignments.length) * 100) : 0;
        const rows = assignments.map(assignment => {
            const code = getReviewCodeFromVault(assignment.id);
            const statusClass = assignment.status === 'submitted' ? 'submitted' : 'pending';
            return `
                <div class="review-assignment-row">
                    <div>
                        <strong>${escapeHtml(assignment.reviewer_name)} <span>to</span> ${escapeHtml(assignment.reviewee_name)}</strong>
                        <small>${assignment.status === 'submitted' ? `Submitted ${formatDate(assignment.submitted_at)}` : `Code ${escapeHtml(assignment.review_code_hint || 'ready')}`}</small>
                    </div>
                    <div class="review-assignment-actions">
                        <span class="review-status-pill ${statusClass}">${assignment.status === 'submitted' ? 'Submitted' : 'Pending'}</span>
                        ${assignment.status === 'submitted' ? `<button type="button" onclick="openTeamReviewResponseModal('${assignment.id}')" aria-label="View response"><i data-lucide="eye"></i></button>` : ''}
                        <button type="button" onclick="copyReviewInvite('${assignment.id}')"><i data-lucide="copy"></i></button>
                        <button type="button" onclick="resetReviewCode('${assignment.id}')"><i data-lucide="rotate-cw"></i></button>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="review-cycle-card ${isTestReviewCycle(cycle) ? 'is-test' : ''}">
                <div class="review-cycle-top">
                    <div>
                        <span>${isTestReviewCycle(cycle) ? 'TEST — excluded from exports' : cycle.status === 'active' ? 'Open' : escapeHtml(cycle.status)}</span>
                        <h4>${escapeHtml(cycle.title)}</h4>
                        <small>Deadline ${formatDate(cycle.deadline)}</small>
                    </div>
                    <div class="review-cycle-actions-top">
                        <strong>${completion}%</strong>
                        <button type="button" onclick="deleteTeamReviewCycle('${cycle.id}')" aria-label="Delete review cycle"><i data-lucide="trash-2"></i></button>
                    </div>
                </div>
                <div class="review-cycle-progress"><span style="width:${completion}%"></span></div>
                <div class="review-assignment-list">${rows}</div>
            </div>
        `;
    }).join('');
    refreshIcons();
}

/**
 * Read-only detail view of one submitted review — ratings per question, category averages,
 * and the reviewer's written comments. Reuses the app's standard detail-modal chrome.
 */
function openTeamReviewResponseModal(assignmentId) {
    if (!hasSuperAdminAccess()) return showAppleAlert('Superadmin Only', 'Team Review is private.');
    const assignment = (globalReviewAssignments || []).find(row => row.id === assignmentId);
    const response = getReviewResponseForAssignment(assignmentId);
    if (!assignment || !response) return showAppleAlert('Response Not Loaded', "This response isn't in memory yet — reopen Team Review as superadmin to refresh, then try again.");

    const cycle = getReviewCycle(assignment.cycle_id);
    const titleEl = document.getElementById('teamReviewResponseTitle');
    const bodyEl = document.getElementById('teamReviewResponseBody');
    if (titleEl) titleEl.innerText = `${assignment.reviewer_name} → ${assignment.reviewee_name}`;
    if (bodyEl) bodyEl.innerHTML = renderTeamReviewResponseDetail(assignment, response, cycle);
    refreshIcons();

    const modal = document.getElementById('teamReviewResponseModal');
    if (!modal) return;
    modal.style.display = 'flex';
    modal.offsetHeight;
    modal.classList.add('show');
    document.body.classList.add('no-scroll');
}

function closeTeamReviewResponseModal() {
    const modal = document.getElementById('teamReviewResponseModal');
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.classList.remove('no-scroll');
    }, 400);
}

function renderTeamReviewResponseDetail(assignment, response, cycle) {
    const categories = TEAM_REVIEW_QUESTION_GROUPS.map(group => `
        <div class="review-detail-category">
            <div class="review-detail-category-head">
                <h4>${escapeHtml(group.title)}</h4>
                <strong>${getReviewCategoryAverage(response.ratings, group.key) || '--'}</strong>
            </div>
            <div class="review-detail-question-list">
                ${group.questions.map(question => `
                    <div class="review-detail-question">
                        <span>${escapeHtml(question.text)}</span>
                        <strong>${Number(response.ratings?.[question.id]) || '--'}</strong>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    const summaryBlocks = [
        { label: 'Strengths', value: response.strengths },
        { label: 'Improvement Area', value: response.improvements },
        { label: 'Additional Comments', value: response.final_comment }
    ].filter(block => block.value).map(block => `
        <div class="review-detail-note">
            <span>${block.label}</span>
            <p>${escapeHtml(block.value)}</p>
        </div>
    `).join('') || '<div class="review-empty-note">No written comments left.</div>';

    return `
        <div class="review-detail-summary">
            <div>
                <span>${escapeHtml(cycle?.title || 'Team Review')} · Submitted ${formatDate(response.submitted_at)}</span>
                <h3>${escapeHtml(assignment.reviewee_name)}</h3>
                <p>Reviewed by ${escapeHtml(assignment.reviewer_name)}</p>
            </div>
            <div class="review-detail-score"><span>Average</span><strong>${response.average_score || calculateReviewAverage(response.ratings) || '--'}</strong></div>
        </div>
        <div class="review-detail-categories">${categories}</div>
        <div class="review-detail-notes">${summaryBlocks}</div>
    `;
}

async function deleteTeamReviewCycle(cycleId) {
    if (!hasSuperAdminAccess()) return showAppleAlert('Superadmin Only', 'Team Review is private.');
    const cycle = getReviewCycle(cycleId);
    if (!cycle) return;
    const confirmed = await showAppleConfirm('Delete Review Round?', `Delete "${cycle.title}"? This removes its assignments and responses from this workspace.`, { confirmText: 'Delete Round', cancelText: 'Cancel', tone: 'danger', icon: 'trash-2' });
    if (!confirmed) return;

    const assignmentsToRemove = new Set(getReviewCycleAssignments(cycleId).map(assignment => assignment.id));
    let deletedFromSupabase = false;
    try {
        const { error } = await supabaseClient
            .from('team_review_cycles')
            .delete()
            .eq('id', cycleId);
        if (error) throw error;
        deletedFromSupabase = true;
    } catch(e) {
        deletedFromSupabase = false;
    }

    const local = getLocalTeamReviewStore();
    const nextLocal = {
        cycles: local.cycles.filter(row => row.id !== cycleId),
        assignments: local.assignments.filter(row => row.cycle_id !== cycleId),
        responses: local.responses.filter(row => !assignmentsToRemove.has(row.assignment_id))
    };
    saveLocalTeamReviewStore(nextLocal);

    const vault = getReviewCodeVault();
    assignmentsToRemove.forEach(id => delete vault[id]);
    localStorage.setItem(TEAM_REVIEW_CODE_VAULT_KEY, JSON.stringify(vault));

    globalReviewCycles = (globalReviewCycles || []).filter(row => row.id !== cycleId);
    globalReviewAssignments = (globalReviewAssignments || []).filter(row => row.cycle_id !== cycleId);
    globalReviewResponses = (globalReviewResponses || []).filter(row => !assignmentsToRemove.has(row.assignment_id));

    if (activeReviewAssignment && assignmentsToRemove.has(activeReviewAssignment.id)) closeActiveReviewForm();
    renderTeamReviewPage();
    showNotification(deletedFromSupabase ? 'Review Cycle Deleted' : 'Review Cycle Removed Locally', cycle.title);
}

async function resetReviewCode(assignmentId) {
    if (!hasSuperAdminAccess()) return showAppleAlert('Superadmin Only', 'Team Review is private.');
    const assignment = globalReviewAssignments.find(row => row.id === assignmentId);
    if (!assignment) return;

    const confirmed = await showAppleConfirm('Reset Review Pass?', `Any pass already sent to ${assignment.reviewer_name} for this review will stop working immediately. Only reset this if they lost it or it needs to be reissued.`, { confirmText: 'Reset Pass', cancelText: 'Cancel', tone: 'danger', icon: 'rotate-cw' });
    if (!confirmed) return;

    const code = generateReviewCode(assignment.reviewer_name);
    const updatePayload = {
        review_code_hash: await hashReviewCode(code),
        review_code_hint: getReviewCodeHint(code),
        status: assignment.status || 'pending'
    };

    let saved = false;
    try {
        const { error } = await supabaseClient
            .from('team_review_assignments')
            .update(updatePayload)
            .eq('id', assignment.id);
        if (error) throw error;
        saved = true;
    } catch(e) {
        saved = false;
    }

    const updated = normalizeReviewAssignment({ ...assignment, ...updatePayload });
    setReviewCodeInVault(assignment.id, code);
    if (!saved) persistReviewDataLocally({ assignments: [updated] });
    renderTeamReviewPage();
    showAppleAlert(saved ? 'Review Code Reset' : 'Code Reset Locally', `${assignment.reviewer_name} for ${assignment.reviewee_name}: ${code}`);
}

function copyReviewInvite(assignmentId) {
    if (!hasSuperAdminAccess()) return showAppleAlert('Superadmin Only', 'Team Review is private.');
    const assignment = globalReviewAssignments.find(row => row.id === assignmentId);
    const cycle = assignment ? getReviewCycle(assignment.cycle_id) : null;
    if (!assignment) return;

    const code = getReviewCodeFromVault(assignment.id);
    if (!code) {
        return showAppleAlert('Code Not On This Device', 'For privacy, the full code is only kept on the admin device that created it. Use the reset icon to generate a new code.');
    }

    const message = `Hi ${assignment.reviewer_name}, please complete your private team review for ${assignment.reviewee_name}.\n\nCycle: ${cycle?.title || 'Team Review'}\nDeadline: ${formatDate(cycle?.deadline)}\nReview Pass: ${code}\n\nOpen Team Review in Creative OS and paste this pass.`;
    navigator.clipboard.writeText(message);
    showNotification('Invite Copied', 'Share it with the reviewer only');
}

async function unlockTeamReviewCode() {
    const input = document.getElementById('teamReviewCodeInput');
    const code = normalizeReviewCode(input?.value || '');
    if (!code) return showAppleAlert('Missing Review Pass', 'Please paste your review pass.');

    const btn = input?.parentElement?.querySelector('button');
    const originalHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i><span>Opening...</span>';
        refreshIcons();
    }

    try {
        const rawCode = input?.value || code;
        const { assignment, error } = await findTeamReviewAssignmentByCode(rawCode);
        if (!assignment) {
            if (error) {
                return showAppleAlert('Review Sync Issue', `Could not check Supabase for this pass. ${error.message || 'Please ask admin to refresh and sync the review round.'}`);
            }
            return showAppleAlert('Review Pass Not Synced', 'This pass was not found in Supabase. Ask admin to open Team Review once as superadmin, or recreate the review round after Supabase sync.');
        }

        activeReviewAssignment = assignment;
        lastAnimatedReviewStep = -1;
        activeReviewCodeHashes = await getReviewCodeLookupHashes(rawCode);
        const response = await fetchTeamReviewResponseForAssignment(assignment.id, activeReviewCodeHashes);
        activeReviewDraft = response ? {
            ratings: { ...response.ratings },
            comments: { ...response.comments },
            strengths: response.strengths || '',
            improvements: response.improvements || '',
            final_comment: response.final_comment || ''
        } : { ratings: {}, comments: {}, strengths: '', improvements: '', final_comment: '' };
        activeReviewStep = getInitialReviewStep(activeReviewDraft);

        if (input) input.value = '';
        renderActiveReviewForm();
    } catch(e) {
        showAppleAlert('Open Review Failed', e.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
            refreshIcons();
        }
    }
}

function renderActiveReviewForm() {
    const wrap = document.getElementById('activeReviewForm');
    if (!wrap) return;

    if (!activeReviewAssignment) {
        wrap.innerHTML = `
            <div class="review-placeholder">
                <i data-lucide="messages-square"></i>
                <strong>Paste your review pass to begin.</strong>
                <p>Your assigned review will open here.</p>
            </div>
        `;
        refreshIcons();
        return;
    }

    const assignment = activeReviewAssignment;
    const cycle = getReviewCycle(assignment.cycle_id);
    const existingResponse = getReviewResponseForAssignment(assignment.id);
    if (assignment.status === 'submitted' || existingResponse) {
        const response = existingResponse || {};
        wrap.innerHTML = `
            <div class="review-submitted-state">
                <i data-lucide="check-circle-2"></i>
                <h3>Review Submitted</h3>
                <p>Your feedback for ${escapeHtml(assignment.reviewee_name)} has been saved privately.</p>
                <div><span>Average Score</span><strong>${response.average_score || calculateReviewAverage(activeReviewDraft?.ratings || {}) || '--'}</strong></div>
                <button type="button" onclick="closeActiveReviewForm()">Close</button>
            </div>
        `;
        refreshIcons();
        return;
    }

    activeReviewDraft = activeReviewDraft || { ratings: {}, comments: {}, strengths: '', improvements: '', final_comment: '' };
    const groups = TEAM_REVIEW_QUESTION_GROUPS;
    const totalSteps = groups.length + 1; // +1 for the final summary step
    activeReviewStep = Math.min(Math.max(activeReviewStep, 0), totalSteps - 1);

    const dots = Array.from({ length: totalSteps }, (_, i) => {
        const reachable = i <= activeReviewStep;
        const state = i < activeReviewStep ? 'done' : i === activeReviewStep ? 'active' : '';
        return `<button type="button" class="review-step-dot ${state}" ${reachable ? `onclick="goToReviewStep(${i})"` : 'disabled tabindex="-1"'} aria-label="Step ${i + 1} of ${totalSteps}"></button>`;
    }).join('');

    wrap.innerHTML = `
        <div class="review-form-head">
            <div>
                <span>${escapeHtml(cycle?.title || 'Team Review')}</span>
                <h3>${escapeHtml(assignment.reviewee_name)}</h3>
                <p>Reviewer: ${escapeHtml(assignment.reviewer_name)} · Deadline ${formatDate(cycle?.deadline)}</p>
            </div>
            <button type="button" onclick="closeActiveReviewForm()"><i data-lucide="x"></i></button>
        </div>
        <div class="review-step-dots">${dots}</div>
        ${activeReviewStep < groups.length ? renderReviewCategoryStep(groups[activeReviewStep], lastAnimatedReviewStep !== activeReviewStep) : renderReviewSummaryStep(lastAnimatedReviewStep !== activeReviewStep)}
    `;
    lastAnimatedReviewStep = activeReviewStep;
    refreshIcons();
}

/**
 * One category (3 questions) per screen — keeps every step short and focused instead of one long form.
 * `animate` only plays the entrance animation when this step is newly entered — setReviewScore()
 * re-renders this same card on every rating click, and without this guard the card would replay
 * its fade/slide-in on every single click, which is what was showing up as constant "blinking".
 */
function renderReviewCategoryStep(group, animate = false) {
    const answeredCount = group.questions.filter(question => Number(activeReviewDraft.ratings[question.id]) > 0).length;
    const stepComplete = answeredCount === group.questions.length;

    return `
        <div class="review-step-card ${animate ? 'step-enter' : ''}">
            <span class="review-step-kicker">${group.questions.length} quick questions</span>
            <h2>${escapeHtml(group.title)}</h2>
            <div class="review-step-questions">
                ${group.questions.map(question => `
                    <div class="review-step-question">
                        <p>${escapeHtml(question.text)}</p>
                        ${renderReviewSegmentedScore(question.id)}
                    </div>
                `).join('')}
            </div>
            <div class="review-rating-note"><span>Strongly disagree</span><span>Strongly agree</span></div>
        </div>
        <div class="review-step-nav">
            ${activeReviewStep > 0 ? `<button type="button" class="review-nav-btn secondary" onclick="goToReviewStep(${activeReviewStep - 1})"><i data-lucide="arrow-left"></i><span>Back</span></button>` : '<span></span>'}
            <button type="button" class="review-nav-btn primary" ${stepComplete ? '' : 'disabled'} onclick="goToReviewStep(${activeReviewStep + 1})"><span>Next</span><i data-lucide="arrow-right"></i></button>
        </div>
    `;
}

function renderReviewSegmentedScore(questionId) {
    const current = Number(activeReviewDraft.ratings[questionId]) || 0;
    return `
        <div class="review-segmented" role="radiogroup">
            ${[1, 2, 3, 4, 5].map(score => `<button type="button" role="radio" aria-checked="${current === score}" class="${current === score ? 'active' : ''}" onclick="setReviewScore('${questionId}', ${score})">${score}</button>`).join('')}
        </div>
    `;
}

function renderReviewSummaryStep(animate = false) {
    const canSubmit = Boolean(String(activeReviewDraft.strengths || '').trim() && String(activeReviewDraft.improvements || '').trim());
    return `
        <div class="review-step-card ${animate ? 'step-enter' : ''}">
            <span class="review-step-kicker">Last step</span>
            <h2>Wrap it up</h2>
            <div class="review-summary-grid">
                <label>Strengths <span class="review-required-mark">*</span><textarea class="review-textarea" placeholder="What should this person continue doing?" oninput="setReviewSummaryField('strengths', this.value)">${escapeHtml(activeReviewDraft.strengths || '')}</textarea></label>
                <label>Improvement Area <span class="review-required-mark">*</span><textarea class="review-textarea" placeholder="What should this person improve next?" oninput="setReviewSummaryField('improvements', this.value)">${escapeHtml(activeReviewDraft.improvements || '')}</textarea></label>
                <label class="full">Additional Comments<textarea class="review-textarea" placeholder="Anything else admin should know? (optional)" oninput="setReviewSummaryField('final_comment', this.value)">${escapeHtml(activeReviewDraft.final_comment || '')}</textarea></label>
            </div>
        </div>
        <div class="review-step-nav">
            <button type="button" class="review-nav-btn secondary" onclick="goToReviewStep(${TEAM_REVIEW_QUESTION_GROUPS.length - 1})"><i data-lucide="arrow-left"></i><span>Back</span></button>
            <button type="button" id="review-submit-btn" onclick="submitTeamReview()" class="review-submit-btn" ${canSubmit ? '' : 'disabled'}><i data-lucide="send"></i><span>Submit Review</span></button>
        </div>
    `;
}

/**
 * Picks up where a reviewer left off: the first category with an unrated question, or the
 * summary step if every category is already complete.
 */
function getInitialReviewStep(draft) {
    const ratings = draft?.ratings || {};
    const firstIncomplete = TEAM_REVIEW_QUESTION_GROUPS.findIndex(group => group.questions.some(question => !Number(ratings[question.id])));
    return firstIncomplete === -1 ? TEAM_REVIEW_QUESTION_GROUPS.length : firstIncomplete;
}

function goToReviewStep(index) {
    const totalSteps = TEAM_REVIEW_QUESTION_GROUPS.length + 1;
    const clamped = Math.min(Math.max(index, 0), totalSteps - 1);
    // Defensive: the Next button is already disabled until the current category is complete,
    // this just blocks a stray call (e.g. a dot click) from skipping ahead past it too.
    if (clamped > activeReviewStep) {
        const currentGroup = TEAM_REVIEW_QUESTION_GROUPS[activeReviewStep];
        if (currentGroup && currentGroup.questions.some(question => !Number(activeReviewDraft?.ratings?.[question.id]))) return;
    }
    activeReviewStep = clamped;
    renderActiveReviewForm();
}

function closeActiveReviewForm() {
    activeReviewAssignment = null;
    activeReviewDraft = null;
    activeReviewCodeHashes = [];
    activeReviewStep = 0;
    lastAnimatedReviewStep = -1;
    renderActiveReviewForm();
}

function setReviewScore(questionId, score) {
    activeReviewDraft = activeReviewDraft || { ratings: {}, comments: {}, strengths: '', improvements: '', final_comment: '' };
    activeReviewDraft.ratings[questionId] = score;
    renderActiveReviewForm();
}

function setReviewSummaryField(field, value) {
    activeReviewDraft = activeReviewDraft || { ratings: {}, comments: {}, strengths: '', improvements: '', final_comment: '' };
    activeReviewDraft[field] = value;
    // Toggle the submit button directly instead of a full renderActiveReviewForm() — re-rendering
    // on every keystroke would rebuild the textarea and lose focus/cursor position mid-typing.
    if (field === 'strengths' || field === 'improvements') {
        const btn = document.getElementById('review-submit-btn');
        if (btn) btn.disabled = !String(activeReviewDraft.strengths || '').trim() || !String(activeReviewDraft.improvements || '').trim();
    }
}

async function submitTeamReview() {
    if (!activeReviewAssignment) return;
    activeReviewDraft = activeReviewDraft || { ratings: {}, comments: {}, strengths: '', improvements: '', final_comment: '' };
    const missing = getTeamReviewQuestionList().filter(question => !Number(activeReviewDraft.ratings[question.id]));
    if (missing.length) return showAppleAlert('Incomplete Review', 'Please rate every question before submitting.');
    if (!String(activeReviewDraft.strengths || '').trim()) return showAppleAlert('Missing Strengths', 'Please share at least one strength before submitting — this is what makes the review useful.');
    if (!String(activeReviewDraft.improvements || '').trim()) return showAppleAlert('Missing Improvement Area', 'Please share at least one improvement area before submitting.');

    const assignment = activeReviewAssignment;
    const submittedAt = new Date().toISOString();
    const response = normalizeReviewResponse({
        id: generateTeamReviewId('response'),
        assignment_id: assignment.id,
        cycle_id: assignment.cycle_id,
        reviewer_name: assignment.reviewer_name,
        reviewee_name: assignment.reviewee_name,
        ratings: activeReviewDraft.ratings,
        comments: activeReviewDraft.comments,
        strengths: activeReviewDraft.strengths,
        improvements: activeReviewDraft.improvements,
        final_comment: activeReviewDraft.final_comment,
        average_score: calculateReviewAverage(activeReviewDraft.ratings),
        submitted_at: submittedAt
    });

    const result = await persistTeamReviewSubmission(assignment, response, activeReviewCodeHashes);
    activeReviewAssignment = { ...assignment, status: 'submitted', submitted_at: submittedAt };
    renderTeamReviewPage();

    if (!result.savedToSupabase && /does not exist|schema|relation|table|function|rpc/i.test(result.lastError?.message || '')) {
        showAppleAlert('Review Saved On This Device Only', 'Your answers are safe on this device, but the server function to sync them is missing. Ask admin to run supabase-team-review-hardening.sql in Supabase SQL Editor, then reopen this pass to sync.');
    } else {
        showNotification(result.savedToSupabase ? 'Review Submitted' : 'Review Saved Locally', 'Thank you for the honest feedback');
    }
}

function buildTeamReviewQuestionRows() {
    return (globalReviewResponses || []).filter(response => !isTestReviewCycleId(response.cycle_id)).flatMap(response => {
        const assignment = globalReviewAssignments.find(row => row.id === response.assignment_id) || {};
        const cycle = getReviewCycle(response.cycle_id) || {};
        return getTeamReviewQuestionList().map(question => ({
            cycle_title: cycle.title || '',
            deadline: cycle.deadline || '',
            reviewer_name: response.reviewer_name,
            reviewee_name: response.reviewee_name,
            reviewer_region: assignment.reviewer_region || '',
            reviewee_region: assignment.reviewee_region || '',
            category: question.categoryLabel,
            question: question.text,
            rating: response.ratings?.[question.id] || '',
            category_comment: response.comments?.[question.category] || '',
            strengths: response.strengths || '',
            improvements: response.improvements || '',
            final_comment: response.final_comment || '',
            average_score: response.average_score || '',
            submitted_at: response.submitted_at || ''
        }));
    });
}

function buildTeamReviewSummaryRows() {
    const summary = {};
    (globalReviewResponses || []).filter(response => !isTestReviewCycleId(response.cycle_id)).forEach(response => {
        if (!summary[response.reviewee_name]) {
            summary[response.reviewee_name] = {
                reviewee_name: response.reviewee_name,
                responses: 0,
                average_score: 0,
                work_quality_avg: 0,
                ownership_avg: 0,
                teamwork_avg: 0,
                growth_avg: 0,
                strengths: [],
                improvements: []
            };
        }
        const row = summary[response.reviewee_name];
        row.responses += 1;
        row.average_score += Number(response.average_score || 0);
        row.work_quality_avg += Number(getReviewCategoryAverage(response.ratings, 'work_quality') || 0);
        row.ownership_avg += Number(getReviewCategoryAverage(response.ratings, 'ownership') || 0);
        row.teamwork_avg += Number(getReviewCategoryAverage(response.ratings, 'teamwork') || 0);
        row.growth_avg += Number(getReviewCategoryAverage(response.ratings, 'growth') || 0);
        if (response.strengths) row.strengths.push(response.strengths);
        if (response.improvements) row.improvements.push(response.improvements);
    });

    return Object.values(summary).map(row => ({
        reviewee_name: row.reviewee_name,
        responses: row.responses,
        average_score: row.responses ? (row.average_score / row.responses).toFixed(1) : '',
        work_quality_avg: row.responses ? (row.work_quality_avg / row.responses).toFixed(1) : '',
        ownership_avg: row.responses ? (row.ownership_avg / row.responses).toFixed(1) : '',
        teamwork_avg: row.responses ? (row.teamwork_avg / row.responses).toFixed(1) : '',
        growth_avg: row.responses ? (row.growth_avg / row.responses).toFixed(1) : '',
        strengths: row.strengths.join(' | '),
        improvements: row.improvements.join(' | ')
    }));
}

function buildTeamReviewCompletionRows() {
    return (globalReviewAssignments || []).filter(assignment => !isTestReviewCycleId(assignment.cycle_id)).map(assignment => {
        const cycle = getReviewCycle(assignment.cycle_id) || {};
        return {
            cycle_title: cycle.title || '',
            deadline: cycle.deadline || '',
            reviewer_name: assignment.reviewer_name,
            reviewee_name: assignment.reviewee_name,
            reviewer_region: assignment.reviewer_region,
            reviewee_region: assignment.reviewee_region,
            status: assignment.status,
            submitted_at: assignment.submitted_at || '',
            code_hint: assignment.review_code_hint || ''
        };
    });
}

function buildTeamReviewReportContext() {
    const testCycleCount = (globalReviewCycles || []).filter(isTestReviewCycle).length;
    return `# Adtechinno Team Review Report Pack

Generated: ${new Date().toLocaleString('en-MY')}
Cycles exported: ${(globalReviewCycles || []).filter(cycle => !isTestReviewCycle(cycle)).length}
Assignments exported: ${buildTeamReviewCompletionRows().length}
Responses exported: ${(globalReviewResponses || []).filter(row => !isTestReviewCycleId(row.cycle_id)).length}${testCycleCount ? `\nTest rounds excluded: ${testCycleCount}` : ''}

## Suggested Prompt (paste this + the 3 CSVs below into Claude/ChatGPT)
You are a people operations and creative team performance analyst. Using the attached CSVs, write ONE final performance review per team member (each distinct reviewee), in exactly this structure:

1. Overall Summary — 2-3 sentences, grounded in their average score and the reviewer comments.
2. Strengths — 3 to 5 bullet points, synthesized across ALL of that person's reviewers (not just one reviewer's wording).
3. Areas to Improve — 2 to 4 bullet points, framed constructively and actionably, not as criticism.
4. Suggested Focus for Next Cycle — 1 to 3 concrete, specific action items.

Rules:
- Base every point on the actual ratings/comments provided — do not invent feedback the data doesn't support.
- Synthesize across reviewers rather than quoting one person verbatim, unless a quote is unusually clear and worth keeping as-is.
- Keep tone constructive and specific — this will be shared with the person and/or their manager, so avoid personal blame.
- If a reviewee has only one reviewer, say so explicitly and note the write-up is preliminary until more reviewers weigh in.
- Group output by reviewee name, in the same order as team_review_summary.csv.

## Files
- team_review_question_scores.csv: One row per question rating with category comments — the most detailed source.
- team_review_summary.csv: Aggregated scores per category and concatenated strengths/improvements text by reviewee — start here for a per-person view.
- team_review_completion.csv: Reviewer assignment completion and pending status — use to flag reviewees with too few responses to synthesize confidently.
`;
}

function exportTeamReviewPack() {
    if (!hasSuperAdminAccess()) return showAppleAlert('Superadmin Only', 'Team Review is private.');

    const completionRows = buildTeamReviewCompletionRows();
    if (!completionRows.length) {
        const onlyTestData = (globalReviewAssignments || []).length > 0;
        return showAppleAlert('Export Failed', onlyTestData ? 'Only test round data exists right now — it\'s excluded from exports on purpose. Untick "Test round" on a real round, or create one, before exporting.' : 'No team review data available yet.');
    }

    const date = new Date().toISOString().split('T')[0];
    const base = `Adtechinno_Team_Review_${date}`;
    const questionRows = buildTeamReviewQuestionRows();
    const summaryRows = buildTeamReviewSummaryRows();

    downloadTextFile(`${base}_question_scores.csv`, rowsToCSV(['cycle_title', 'deadline', 'reviewer_name', 'reviewee_name', 'reviewer_region', 'reviewee_region', 'category', 'question', 'rating', 'category_comment', 'strengths', 'improvements', 'final_comment', 'average_score', 'submitted_at'], questionRows), 'text/csv;charset=utf-8;');
    downloadTextFile(`${base}_summary.csv`, rowsToCSV(['reviewee_name', 'responses', 'average_score', 'work_quality_avg', 'ownership_avg', 'teamwork_avg', 'growth_avg', 'strengths', 'improvements'], summaryRows), 'text/csv;charset=utf-8;');
    downloadTextFile(`${base}_completion.csv`, rowsToCSV(['cycle_title', 'deadline', 'reviewer_name', 'reviewee_name', 'reviewer_region', 'reviewee_region', 'status', 'submitted_at', 'code_hint'], completionRows), 'text/csv;charset=utf-8;');
    downloadTextFile(`${base}_report_context.md`, buildTeamReviewReportContext(), 'text/markdown;charset=utf-8;');
    showNotification('Team Review Exported', 'Ready for ChatGPT reporting');
}

// Groups every real (non-test) submitted response by reviewee and writes out each reviewer's
// per-category ratings, category comments, and summary fields as plain text — self-contained
// enough to paste straight into a chat AI with no CSV attachments needed.
function buildTeamReviewInlineReport() {
    const responses = (globalReviewResponses || []).filter(response => !isTestReviewCycleId(response.cycle_id));
    const byReviewee = {};
    responses.forEach(response => {
        (byReviewee[response.reviewee_name] = byReviewee[response.reviewee_name] || []).push(response);
    });

    return Object.keys(byReviewee).sort((a, b) => a.localeCompare(b)).map(revieweeName => {
        const entries = byReviewee[revieweeName];
        const avg = (entries.reduce((sum, r) => sum + Number(r.average_score || 0), 0) / entries.length).toFixed(1);
        const body = entries.map(response => {
            const groupLines = TEAM_REVIEW_QUESTION_GROUPS.map(group => {
                const qLines = group.questions.map(q => `  - ${q.text}: ${response.ratings?.[q.id] || '—'}/5`).join('\n');
                const comment = response.comments?.[group.key] ? `\n  Comment: "${response.comments[group.key]}"` : '';
                return `${group.title}:\n${qLines}${comment}`;
            }).join('\n');
            return `Reviewer: ${response.reviewer_name} (submitted ${formatDate(response.submitted_at) || response.submitted_at || 'unknown date'})\n${groupLines}\nStrengths: ${response.strengths || '—'}\nImprovement Area: ${response.improvements || '—'}\nAdditional Comments: ${response.final_comment || '—'}`;
        }).join('\n\n');
        return `## ${revieweeName} — ${entries.length} reviewer${entries.length === 1 ? '' : 's'}, average score ${avg}/5\n\n${body}`;
    }).join('\n\n---\n\n');
}

function buildTeamReviewCoachingPrompt() {
    return `You are a people manager coach helping me prepare for 1-on-1 performance conversations with my team, based on the peer/manager review data below.

For EACH person, using ONLY the ratings/comments given for them, write:

1. Snapshot — 2-3 sentences: overall standing, average score, how many reviewers.
2. Strengths to reinforce — 3 to 5 bullets, synthesized across ALL of that person's reviewers (don't just repeat one reviewer's exact wording unless it's unusually clear and worth keeping as-is).
3. Growth areas — 2 to 4 bullets, framed constructively and specific — not vague ("communication") but concrete ("share WIP updates in the team channel before EOD instead of only when asked").
4. Talking points for the 1-on-1 — 2 to 3 open questions to ask them, phrased so the conversation feels collaborative, not a lecture.
5. 90-day development plan — 2 to 3 concrete, measurable actions with a rough timeline or check-in point, tied directly to the growth areas above.

Rules:
- Base every point on the actual data below — do not invent feedback it doesn't support.
- If someone has only one reviewer, flag that explicitly and mark the write-up "preliminary" until more reviewers weigh in.
- Tone: constructive, specific, and caring but honest — written for a manager preparing for a real conversation, not corporate HR-speak.
- Output one clearly separated section per person, in the same order they appear below.

Here is the review data:

${buildTeamReviewInlineReport()}
`;
}

function copyTeamReviewPrompt() {
    if (!hasSuperAdminAccess()) return showAppleAlert('Superadmin Only', 'Team Review is private.');

    const responseCount = (globalReviewResponses || []).filter(response => !isTestReviewCycleId(response.cycle_id)).length;
    if (!responseCount) {
        const onlyTestData = (globalReviewResponses || []).length > 0;
        return showAppleAlert('Nothing To Copy', onlyTestData ? 'Only test round submissions exist right now — they\'re excluded on purpose. Untick "Test round" on a real round before copying.' : 'No submitted reviews yet — this fills in once your team submits their reviews.');
    }

    navigator.clipboard.writeText(buildTeamReviewCoachingPrompt());
    showNotification('Prompt Copied', `Paste into ChatGPT/Claude — covers ${responseCount} submitted review${responseCount === 1 ? '' : 's'}`);
}

function getLocalTaskNotes() {
    try { return JSON.parse(localStorage.getItem('adtech_task_status_notes') || '{}'); }
    catch(e) { return {}; }
}

function setLocalTaskNote(jobID, note) {
    const notes = getLocalTaskNotes();
    if (note) notes[jobID] = note;
    else delete notes[jobID];
    localStorage.setItem('adtech_task_status_notes', JSON.stringify(notes));
}

function getTaskNoteValue(item) {
    if (!item) return '';
    const latestLog = getTaskNoteLogs(item.job_id)[0];
    return latestLog?.note_text || item.status_notes || item.task_notes || getLocalTaskNotes()[item.job_id] || '';
}

function getLatestTaskNote(item) {
    if (!item) return null;
    const latestLog = getTaskNoteLogs(item.job_id)[0];
    if (latestLog?.note_text) return latestLog;
    const fallback = item.status_notes || item.task_notes || getLocalTaskNotes()[item.job_id] || '';
    if (!fallback) return null;
    return normalizeNoteRow({
        job_id: item.job_id,
        actor_name: item.updated_by || item.approver || item.requester_name || 'Unknown',
        note_text: fallback,
        status_at_time: item.work_status || item.status || 'No status',
        created_at: item.updated_at || item.last_moved_at || item.created_at || new Date().toISOString()
    });
}

function getTaskNoteCount(item) {
    if (!item) return 0;
    const logs = getTaskNoteLogs(item.job_id);
    if (logs.length) return logs.length;
    // Full history for this task hasn't been loaded yet (it loads on demand when the task is
    // opened) — fall back to the lightweight bulk count fetched alongside the task list.
    const bulk = (noteCountByJobId || new Map()).get(String(item.job_id || ''));
    if (bulk != null) return bulk;
    return getTaskNoteValue(item) ? 1 : 0;
}

// saveMonthlyProgress() writes its "Monthly progress: X/Y deliverables ready..." line through the
// same logTaskNote() as a real comment, so on a monthly-plan task these auto-generated rows can
// quickly outnumber the actual human comments and bury them. This tags that specific format so the
// Task Notes UI can show real comments by default and tuck the progress trail away collapsed —
// note getTaskNoteValue/getLatestTaskNote are left untouched since saveMonthlyProgress also reads
// the latest note back to restore its deliverable-count inputs, and that must keep seeing these.
function isAutoProgressNote(text) {
    return /^Monthly progress:/i.test(String(text || '').trim());
}

function getManualTaskNoteLogs(jobID) {
    return getTaskNoteLogs(jobID).filter(log => !isAutoProgressNote(log.note_text));
}

function getAutoProgressNoteLogs(jobID) {
    return getTaskNoteLogs(jobID).filter(log => isAutoProgressNote(log.note_text));
}

function getLatestManualTaskNote(item) {
    if (!item) return null;
    return getManualTaskNoteLogs(item.job_id)[0] || null;
}

function getLocalActivityLogs() {
    try { return JSON.parse(localStorage.getItem('adtech_task_activity_logs') || '[]'); }
    catch(e) { return []; }
}

function setLocalActivityLogs(rows) {
    localStorage.setItem('adtech_task_activity_logs', JSON.stringify(rows.slice(0, 2000)));
}

function getLocalNoteLogs() {
    try { return JSON.parse(localStorage.getItem('adtech_task_note_logs') || '[]'); }
    catch(e) { return []; }
}

function setLocalNoteLogs(rows) {
    localStorage.setItem('adtech_task_note_logs', JSON.stringify(rows.slice(0, 2000)));
}

function getCurrentActor() {
    return localStorage.getItem('adtech_user_name') || (localStorage.getItem('adtech_lead_pin') ? 'Admin' : 'Unknown');
}

function normalizeLogRow(row = {}) {
    return {
        id: row.id || row.local_id || `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        job_id: row.job_id || '',
        action_type: row.action_type || 'updated',
        actor_name: row.actor_name || row.actor || 'Unknown',
        old_value: row.old_value || '',
        new_value: row.new_value || '',
        note_text: row.note_text || row.notes || '',
        meta: row.meta || {},
        created_at: row.created_at || new Date().toISOString()
    };
}

function normalizeNoteRow(row = {}) {
    return {
        // task_note_logs.id is a bigint identity, so Supabase returns it as a JS number — always
        // stringify it so id comparisons (Edit/Delete match against a string pulled off an
        // onclick's HTML attribute) don't silently fail on 78 !== '78'.
        id: row.id != null ? String(row.id) : (row.local_id || `note-${Date.now()}-${Math.random().toString(16).slice(2)}`),
        job_id: row.job_id || '',
        actor_name: row.actor_name || row.actor || 'Unknown',
        note_text: row.note_text || row.notes || '',
        status_at_time: row.status_at_time || row.work_status || '',
        created_at: row.created_at || new Date().toISOString()
    };
}

function isLocallyGeneratedLogId(id) {
    return String(id || '').startsWith('local-') || String(id || '').startsWith('note-');
}

/**
 * Notes/activity fallback to localStorage when the Supabase insert fails (see logTaskNote /
 * logTaskActivity), but that local copy is never removed once the real row eventually syncs —
 * and it carries its own client-generated id, so a plain id-based merge doesn't catch it. This
 * collapses same job + same content + same actor within the same minute into one row, always
 * preferring the real Supabase row over the local-only placeholder. Fixes note/activity counts
 * inflating or drifting depending on what's left over in a given browser's localStorage.
 */
function dedupeTaskLogRows(rows = [], keyFields = []) {
    const seen = new Map();
    rows.forEach(row => {
        const key = [row.job_id, ...keyFields.map(field => row[field]), String(row.created_at || '').slice(0, 16)].join('|');
        const existing = seen.get(key);
        if (!existing || (isLocallyGeneratedLogId(existing.id) && !isLocallyGeneratedLogId(row.id))) {
            seen.set(key, row);
        }
    });
    return [...seen.values()];
}

function dedupeNoteLogRows(rows = []) {
    return dedupeTaskLogRows(rows, ['note_text', 'actor_name']);
}

function dedupeActivityLogRows(rows = []) {
    return dedupeTaskLogRows(rows, ['action_type', 'old_value', 'new_value', 'note_text']);
}

async function logTaskActivity(jobID, actionType, oldValue = '', newValue = '', noteText = '', meta = {}) {
    const row = normalizeLogRow({
        job_id: jobID,
        action_type: actionType,
        actor_name: getCurrentActor(),
        old_value: String(oldValue || ''),
        new_value: String(newValue || ''),
        note_text: String(noteText || ''),
        meta,
        created_at: new Date().toISOString()
    });

    globalActivityLogs.unshift(row);

    try {
        const { error } = await supabaseClient.from('task_activity_logs').insert([{
            job_id: row.job_id,
            action_type: row.action_type,
            actor_name: row.actor_name,
            old_value: row.old_value,
            new_value: row.new_value,
            note_text: row.note_text,
            meta: row.meta,
            created_at: row.created_at
        }]);
        if (error) throw error;
    } catch(e) {
        setLocalActivityLogs([row, ...getLocalActivityLogs()]);
        console.warn('Activity log saved locally only:', e.message);
    }
}

// ========================================================
// 🌟 TASK NOTE NOTIFICATIONS (bell + @mentions)
// ========================================================
// Recipients = the task's assignee(s) + the superadmin, always, plus anyone explicitly
// @mentioned (who may not be the assignee — e.g. tagging a second creative or a proofer in).
// The note author never notifies themselves.
function generateNotificationId() {
    return `notif-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getNoteMentionCandidates(query, jobID) {
    const key = normalizeNameKey(query);
    const me = normalizeNameKey(getCurrentUserName());
    const already = taskNoteMentions[jobID] || new Set();
    return getActiveTeamMembers()
        .map(member => member.name)
        .filter(name => normalizeNameKey(name) !== me)
        .filter(name => !already.has(name))
        .filter(name => normalizeNameKey(name).includes(key))
        .slice(0, 6);
}

function handleTaskNoteInput(event, jobID) {
    const textarea = event.target;
    const container = document.getElementById(`task-note-mentions-${jobID}`);
    if (!container) return;

    const caret = textarea.selectionStart;
    const match = textarea.value.slice(0, caret).match(/(?:^|\s)@([a-zA-Z0-9' -]{0,30})$/);
    if (!match) {
        container.classList.remove('show');
        container.innerHTML = '';
        return;
    }

    const candidates = getNoteMentionCandidates(match[1], jobID);
    if (!candidates.length) {
        container.classList.remove('show');
        container.innerHTML = '';
        return;
    }

    container.innerHTML = candidates.map(name => `<div class="dropdown-item" onmousedown="selectTaskNoteMention(event, '${jobID}', '${name.replace(/'/g, "\\'")}')"><i data-lucide="at-sign" style="width:14px;height:14px;color:var(--text-muted);"></i>${escapeHtml(name)}</div>`).join('');
    container.classList.add('show');
    refreshIcons();
}

function selectTaskNoteMention(event, jobID, name) {
    if (event) event.preventDefault(); // fires before the textarea's blur, so the caret/selection below is still valid
    const textarea = document.getElementById(`task-note-${jobID}`);
    const container = document.getElementById(`task-note-mentions-${jobID}`);
    if (textarea) {
        const caret = textarea.selectionStart;
        const value = textarea.value;
        const match = value.slice(0, caret).match(/(?:^|\s)@([a-zA-Z0-9' -]{0,30})$/);
        if (match) {
            const atIndex = caret - match[1].length - 1;
            const inserted = `@${name} `;
            textarea.value = value.slice(0, atIndex) + inserted + value.slice(caret);
            const newCaret = atIndex + inserted.length;
            textarea.setSelectionRange(newCaret, newCaret);
        }
        textarea.focus();
    }

    taskNoteMentions[jobID] = taskNoteMentions[jobID] || new Set();
    taskNoteMentions[jobID].add(name);

    if (container) { container.classList.remove('show'); container.innerHTML = ''; }
}

function hideMentionDropdown(jobID) {
    // Delayed so a click on a dropdown item (mousedown) still registers before blur wipes it.
    setTimeout(() => {
        const container = document.getElementById(`task-note-mentions-${jobID}`);
        if (container) container.classList.remove('show');
    }, 150);
}

async function createTaskNotifications(job, noteText, actorName, mentionedNames = []) {
    const recipients = new Map(); // normalized name -> { name, kind }
    getAssignedPICNames(job.assignee).forEach(name => recipients.set(normalizeNameKey(name), { name, kind: 'note_added' }));
    SUPER_ADMIN_NAMES.forEach(name => { if (!recipients.has(normalizeNameKey(name))) recipients.set(normalizeNameKey(name), { name, kind: 'note_added' }); });
    mentionedNames.forEach(name => recipients.set(normalizeNameKey(name), { name, kind: 'mention' })); // mention is more specific, wins on overlap
    recipients.delete(normalizeNameKey(actorName));

    if (!recipients.size) return;

    const rows = [...recipients.values()].map(r => ({
        id: generateNotificationId(),
        job_id: job.job_id,
        client_name: job.client_name || '',
        project_title: job.project_title || '',
        recipient_name: r.name,
        actor_name: actorName,
        kind: r.kind,
        note_preview: noteText.length > 160 ? `${noteText.slice(0, 157)}...` : noteText,
        created_at: new Date().toISOString()
    }));

    try {
        const { error } = await supabaseClient.from('task_notifications').insert(rows);
        if (error) throw error;
    } catch(e) {
        // Best-effort only — the note itself is already saved via logTaskNote's own fallback.
        // Worst case here is a missed ping, not lost data, so no local-queue retry is needed.
        console.warn('Notification insert failed:', e.message);
    }
}

async function fetchTaskNotifications() {
    const me = getCurrentUserName();
    if (!me) return;
    try {
        const { data, error } = await supabaseClient
            .from('task_notifications')
            .select('*')
            .ilike('recipient_name', me)
            .order('created_at', { ascending: false })
            .limit(100);
        if (error) throw error;
        globalNotifications = data || [];
    } catch(e) {
        console.warn('Failed to load notifications:', e.message);
    }
    updateNotifBadge();
}

function updateNotifBadge() {
    const unread = (globalNotifications || []).filter(n => !n.read_at).length;
    const badge = document.getElementById('notif-badge');
    if (!badge) return;
    badge.style.display = unread > 0 ? 'inline-block' : 'none';
    badge.innerText = unread > 9 ? '9+' : unread;
}

function ensureNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
}

function maybeFireDesktopNotification(row) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (!document.hidden) return; // they're already looking at the tab — the in-app toast covers it
    const title = row.kind === 'mention' ? `${row.actor_name || 'Someone'} mentioned you` : `${row.actor_name || 'Someone'} added a note`;
    try {
        const desktopNotif = new Notification(title, {
            body: `${row.client_name || ''}: ${row.project_title || ''}\n${row.note_preview || ''}`,
            tag: row.id
        });
        desktopNotif.onclick = () => window.focus();
    } catch(e) { console.warn('Desktop notification failed:', e.message); }
}

function handleIncomingTaskNotification(payload) {
    const row = payload?.new;
    if (!row) return;
    const me = getCurrentUserName();
    if (!me || normalizeNameKey(row.recipient_name) !== normalizeNameKey(me)) return;
    if ((globalNotifications || []).some(n => n.id === row.id)) return;

    globalNotifications = [row, ...(globalNotifications || [])];
    updateNotifBadge();
    showNotification(row.kind === 'mention' ? `${row.actor_name || 'Someone'} mentioned you` : `${row.actor_name || 'Someone'} added a note`, row.note_preview || '');
    maybeFireDesktopNotification(row);
}

async function markNotificationRead(id) {
    const notif = (globalNotifications || []).find(n => n.id === id);
    if (!notif || notif.read_at) return;
    notif.read_at = new Date().toISOString();
    updateNotifBadge();
    try {
        await supabaseClient.from('task_notifications').update({ read_at: notif.read_at }).eq('id', id);
    } catch(e) { console.warn('Failed to mark notification read:', e.message); }
}

async function markAllNotificationsRead() {
    const unread = (globalNotifications || []).filter(n => !n.read_at);
    if (!unread.length) return;
    const now = new Date().toISOString();
    unread.forEach(n => n.read_at = now);
    updateNotifBadge();
    openNotificationsPanel();
    try {
        await supabaseClient.from('task_notifications').update({ read_at: now }).in('id', unread.map(n => n.id));
    } catch(e) { console.warn('Failed to mark all notifications read:', e.message); }
}

function openNotificationFromPanel(id) {
    const notif = (globalNotifications || []).find(n => n.id === id);
    if (!notif) return;
    markNotificationRead(id);
    closeSettingsDialog();
    setTimeout(() => openDetailModal(notif.job_id), 200); // isUpdate defaults to false — this must actually show the modal, not just refresh an already-open one
}

function openNotificationsPanel() {
    ensureNotificationPermission();
    const rows = globalNotifications || [];
    const unreadCount = rows.filter(n => !n.read_at).length;

    const body = rows.length ? rows.map(n => `
        <div class="notif-row ${n.read_at ? '' : 'unread'}" onclick="openNotificationFromPanel('${n.id}')">
            <span class="notif-row-icon"><i data-lucide="${n.kind === 'mention' ? 'at-sign' : 'message-square-text'}"></i></span>
            <div class="notif-row-body">
                <strong>${escapeHtml(n.actor_name || 'Someone')}</strong> ${n.kind === 'mention' ? 'mentioned you on' : 'added a note on'} <strong>${escapeHtml(n.client_name || '')}: ${escapeHtml(n.project_title || '')}</strong>
                <p>${linkifyHtml(escapeHtml(n.note_preview || ''))}</p>
                <span class="notif-row-time">${formatDateTime(n.created_at)} · ${escapeHtml(n.job_id || '')}</span>
            </div>
        </div>
    `).join('') : '<div class="task-note-empty">No notifications yet — this fills in once someone notes a task you\'re on, or @mentions you.</div>';

    openSettingsDialog({
        kind: 'notifications',
        icon: 'bell',
        title: 'Notifications',
        description: unreadCount ? `${unreadCount} unread` : "You're all caught up.",
        body: `<div class="notif-list">${body}</div>`,
        footer: unreadCount ? `<button type="button" class="settings-action-btn" onclick="markAllNotificationsRead()">Mark all read</button>` : ''
    });
}

async function logTaskNote(job, noteText) {
    if (!job) return null;

    const row = normalizeNoteRow({
        job_id: job.job_id,
        actor_name: getCurrentActor(),
        note_text: noteText,
        status_at_time: job.work_status || 'Not started',
        created_at: new Date().toISOString()
    });

    globalNoteLogs.unshift(row);

    try {
        // .select() to read back the server-assigned id (task_note_logs.id is a DB-generated
        // identity, not something we can set from the client) and patch it onto the optimistic
        // local row above — otherwise this row keeps its local-only placeholder id until the next
        // full refetch, and Edit/Delete on a note you just added would silently target nothing.
        const { data, error } = await supabaseClient.from('task_note_logs').insert([{
            job_id: row.job_id,
            actor_name: row.actor_name,
            note_text: row.note_text,
            status_at_time: row.status_at_time,
            created_at: row.created_at
        }]).select();
        if (error) throw error;
        if (data?.[0]?.id != null) row.id = String(data[0].id);
    } catch(e) {
        setLocalNoteLogs([row, ...getLocalNoteLogs()]);
        console.warn('Note log saved locally only:', e.message);
    }

    await logTaskActivity(job.job_id, 'note_added', '', row.status_at_time, noteText, { status_at_time: row.status_at_time });
    return row;
}

function getTaskLogs(jobID) {
    return (globalActivityLogs || [])
        .map(normalizeLogRow)
        .filter(log => log.job_id === jobID)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function getTaskNoteLogs(jobID) {
    return (globalNoteLogs || [])
        .map(normalizeNoteRow)
        .filter(log => log.job_id === jobID)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleString('en-MY', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function formatDurationFrom(startStr, endStr = new Date().toISOString()) {
    if (!startStr) return '-';
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start) || isNaN(end)) return '-';

    const totalHours = Math.max(0, Math.floor((end - start) / (1000 * 60 * 60)));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    if (days <= 0) return `${hours}h`;
    if (hours === 0) return `${days}d`;
    return `${days}d ${hours}h`;
}

function getStatusStartedAt(item) {
    const status = normalizeWorkStatus(item.work_status || 'Not started');
    const statusLog = getTaskLogs(item.job_id).find(log =>
        log.action_type === 'status_changed' && normalizeWorkStatus(log.new_value || '') === status
    );

    return statusLog?.created_at || item.last_moved_at || item.review_started_at || item.created_at || '';
}

function getLastUpdateAt(item) {
    const latestLog = getTaskLogs(item.job_id)[0];
    return latestLog?.created_at || item.last_moved_at || item.updated_at || item.created_at || '';
}

function renderAdminTrackingPanel(item) {
    if (!localStorage.getItem('adtech_lead_pin')) return '';

    const logs = getTaskLogs(item.job_id);
    const noteLogs = getTaskNoteLogs(item.job_id);
    const statusStartedAt = getStatusStartedAt(item);
    const lastUpdateAt = getLastUpdateAt(item);
    const currentStatus = String(item.status || '').toLowerCase() === 'pending' ? 'Pending Approval' : getWorkStatusLabel(item.work_status || 'Not started');

    const timelineRows = logs.length ? logs.slice(0, 12).map(log => `
        <div class="tracking-row">
            <div class="tracking-dot"></div>
            <div class="tracking-main">
                <div class="tracking-top"><strong>${escapeHtml(log.action_type.replace(/_/g, ' '))}</strong><span>${formatDateTime(log.created_at)}</span></div>
                <div class="tracking-meta">${escapeHtml(log.actor_name)}${log.old_value || log.new_value ? ` · ${escapeHtml(log.old_value || '-')} → ${escapeHtml(log.new_value || '-')}` : ''}</div>
                ${log.note_text ? `<div class="tracking-note">${linkifyHtml(escapeHtml(log.note_text))}</div>` : ''}
            </div>
        </div>
    `).join('') : `<div class="tracking-empty">No activity logs yet. New updates will start appearing here.</div>`;

    const noteRows = noteLogs.length ? noteLogs.slice(0, 5).map(log => `
        <div class="tracking-note-row">
            <div><strong>${escapeHtml(log.actor_name)}</strong><span>${formatDateTime(log.created_at)} · ${escapeHtml(log.status_at_time || 'No status')}</span></div>
            <p>${linkifyHtml(escapeHtml(log.note_text))}</p>
        </div>
    `).join('') : `<div class="tracking-empty">No note history yet.</div>`;

    return `
        <details class="admin-tracking-panel">
            <summary><span><i data-lucide="activity"></i> Admin Tracking</span><small>Timeline & reporting data</small></summary>
            <div class="tracking-summary-grid">
                <div><span>Current Status</span><strong>${escapeHtml(currentStatus)}</strong></div>
                <div><span>In Status</span><strong>${formatDurationFrom(statusStartedAt)}</strong></div>
                <div><span>Last Update</span><strong>${formatDateTime(lastUpdateAt)}</strong></div>
                <div><span>Revisions</span><strong>${item.revision || 0}</strong></div>
            </div>
            <div class="tracking-section-title">Timeline</div>
            <div class="tracking-list">${timelineRows}</div>
            <div class="tracking-section-title">Notes History</div>
            <div class="tracking-notes-list">${noteRows}</div>
        </details>
    `;
}

function renderTaskNotePreview(item) {
    const latest = getLatestTaskNote(item);
    if (!latest?.note_text) return '';

    const noteCount = getTaskNoteCount(item);
    const preview = latest.note_text.length > 96 ? latest.note_text.slice(0, 93) + '...' : latest.note_text;
    return `<div class="task-note-preview"><i data-lucide="message-square-text"></i><span><strong>${noteCount} note${noteCount === 1 ? '' : 's'}</strong> · ${escapeHtml(preview)}</span></div>`;
}

function getRequestTypeMeta(item) {
    const jobType = String(item?.job_type || '').toLowerCase();
    if (jobType.includes('monthly')) return { key: 'monthly', label: 'Monthly Plan', shortLabel: 'Monthly', icon: 'calendar-days' };
    if (jobType.includes('pitch')) return { key: 'pitch', label: 'Pitch Deck', shortLabel: 'Pitch', icon: 'presentation' };
    if (jobType.includes('shoot')) return { key: 'shooting', label: 'Shooting', shortLabel: 'Shoot', icon: 'camera' };
    return { key: 'adhoc', label: 'Ad-hoc / One-off', shortLabel: 'Ad-hoc', icon: 'zap' };
}

function renderRequestTypePill(item, compact = false) {
    const meta = getRequestTypeMeta(item);
    return `<span class="request-type-pill type-${meta.key} ${compact ? 'compact' : ''}"><i data-lucide="${meta.icon}"></i>${compact ? meta.shortLabel : meta.label}</span>`;
}

function renderJobTypeDetail(item) {
    const meta = getRequestTypeMeta(item);
    const rawType = String(item.job_type || meta.label).trim();
    const isCompoundAdhoc = meta.key === 'adhoc' && rawType && rawType !== meta.label;
    const typeParts = isCompoundAdhoc
        ? rawType.split(',').map(part => part.trim()).filter(Boolean)
        : [];
    const typeDetail = typeParts.length
        ? `<div class="job-type-detail-chips">${typeParts.map(part => `<span>${escapeHtml(part)}</span>`).join('')}</div>`
        : `<small>${escapeHtml(rawType && rawType !== meta.label ? rawType : meta.label)}</small>`;

    return `
        <div class="job-type-detail-card type-${meta.key}">
            <div class="job-type-detail-icon"><i data-lucide="${meta.icon}"></i></div>
            <div class="job-type-detail-main">
                <strong>${escapeHtml(meta.label)}</strong>
                ${typeDetail}
            </div>
        </div>
    `;
}

function getMonthlyDeliverableSummary(item) {
    if (getRequestTypeMeta(item).key !== 'monthly') return null;
    const brief = String(item.brief || '');
    const parts = [];
    const regex = /•\s*([^—\n]+?)\s*—\s*(\d+)/g;
    let match;
    while ((match = regex.exec(brief)) !== null) {
        const count = Number(match[2] || 0);
        if (count > 0) parts.push({ label: match[1].trim(), count });
    }
    const total = parts.reduce((sum, part) => sum + part.count, 0);
    return { total, parts };
}

function getMonthlyReadyCount(item, total = 0) {
    const note = getTaskNoteValue(item);
    const match = note.match(/(?:monthly\s*)?(?:progress|ready|done)?\s*:?\s*(\d+)\s*\/\s*(\d+)/i) || note.match(/\b(\d+)\s*\/\s*(\d+)\b/);
    if (!match) return '';
    return Math.min(Number(match[1] || 0), total || Number(match[2] || 0));
}

function clampMonthlyReady(value, total) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.min(Math.max(Math.round(numeric), 0), Number(total || 0));
}

function normalizeMonthlyFormatLabel(label) {
    return String(label || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function getMonthlyFormatProgressFromNote(note, summary) {
    const values = {};
    if (!note || !summary?.parts?.length) return values;

    const validLabels = {};
    summary.parts.forEach(part => {
        validLabels[normalizeMonthlyFormatLabel(part.label)] = part;
    });

    const source = String(note).includes('Breakdown:') ? String(note).split(/Breakdown:/i).pop() : String(note);
    source.split(/[;\n]/).forEach(chunk => {
        const cleaned = chunk.replace(/\.+$/g, '').trim();
        const match = cleaned.match(/^(.+?)\s*:?\s*(\d+)\s*\/\s*(\d+)/);
        if (!match) return;

        const key = normalizeMonthlyFormatLabel(match[1].replace(/^breakdown\s*/i, ''));
        const part = validLabels[key];
        if (!part) return;
        values[key] = clampMonthlyReady(match[2], part.count);
    });

    return values;
}

function getMonthlyProgressState(item, summary) {
    const parsed = getMonthlyFormatProgressFromNote(getTaskNoteValue(item), summary);
    let hasFormatProgress = false;
    let parts = summary.parts.map(part => {
        const key = normalizeMonthlyFormatLabel(part.label);
        const hasValue = Object.prototype.hasOwnProperty.call(parsed, key);
        if (hasValue) hasFormatProgress = true;
        return { ...part, ready: clampMonthlyReady(hasValue ? parsed[key] : 0, part.count) };
    });

    let readyTotal = parts.reduce((sum, part) => sum + part.ready, 0);
    const savedTotal = getMonthlyReadyCount(item, summary.total);

    if (!hasFormatProgress && savedTotal !== '') {
        let remaining = clampMonthlyReady(savedTotal, summary.total);
        parts = parts.map(part => {
            const ready = Math.min(part.count, remaining);
            remaining -= ready;
            return { ...part, ready };
        });
        readyTotal = clampMonthlyReady(savedTotal, summary.total);
    }

    return { parts, readyTotal, hasFormatProgress, savedTotal };
}

function getMonthlyFormatInputs(jobID) {
    return Array.from(document.querySelectorAll('.monthly-format-input'))
        .filter(input => input.dataset.monthlyJob === jobID)
        .sort((a, b) => Number(a.dataset.index || 0) - Number(b.dataset.index || 0));
}

function updateMonthlyProgressHeader(jobID, ready, total) {
    const pct = total ? Math.min(Math.round((ready / total) * 100), 100) : 0;
    const pctEl = document.getElementById(`monthly-pct-${jobID}`);
    const bar = document.getElementById(`monthly-bar-${jobID}`);
    const label = document.getElementById(`monthly-label-${jobID}`);
    if (pctEl) pctEl.textContent = `${pct}%`;
    if (bar) bar.style.width = `${pct}%`;
    if (label) label.textContent = `${ready}/${total} deliverables ready`;
}

function updateMonthlyFormatProgressPreview(jobID, total) {
    const inputs = getMonthlyFormatInputs(jobID);
    if (!inputs.length) return updateMonthlyProgressPreview(jobID, total);

    let readyTotal = 0;
    inputs.forEach(input => {
        const max = Number(input.dataset.total || input.max || 0);
        const ready = clampMonthlyReady(input.value, max);
        const index = input.dataset.index;
        input.value = ready;
        readyTotal += ready;

        const countEl = document.getElementById(`monthly-format-ready-${jobID}-${index}`);
        const bar = document.getElementById(`monthly-format-bar-${jobID}-${index}`);
        if (countEl) countEl.textContent = ready;
        if (bar) bar.style.width = `${max ? Math.min(Math.round((ready / max) * 100), 100) : 0}%`;
    });

    updateMonthlyProgressHeader(jobID, readyTotal, total);
}

function adjustMonthlyFormatProgress(jobID, index, delta, total) {
    const input = document.getElementById(`monthly-format-${jobID}-${index}`);
    if (!input) return;
    input.value = clampMonthlyReady(Number(input.value || 0) + Number(delta || 0), input.dataset.total || input.max || 0);
    updateMonthlyFormatProgressPreview(jobID, total);
}

function updateMonthlyProgressPreview(jobID, total) {
    const input = document.getElementById(`monthly-ready-${jobID}`);
    if (!input) return;
    const ready = clampMonthlyReady(input.value, total);
    input.value = ready;
    updateMonthlyProgressHeader(jobID, ready, total);
}

function adjustMonthlyProgress(jobID, delta, total) {
    const input = document.getElementById(`monthly-ready-${jobID}`);
    if (!input) return;
    input.value = clampMonthlyReady(Number(input.value || 0) + Number(delta || 0), total);
    updateMonthlyProgressPreview(jobID, total);
}

function renderMonthlyProgressChip(item) {
    const summary = getMonthlyDeliverableSummary(item);
    if (!summary || !summary.total) return '';
    const progress = getMonthlyProgressState(item, summary);
    const pct = Math.min(Math.round((progress.readyTotal / summary.total) * 100), 100);
    const label = `${progress.readyTotal}/${summary.total} ready`;
    return `<div class="monthly-progress-mini"><div><span>${escapeHtml(label)}</span><strong>Use Partial Ready for partial handoff</strong></div><div class="monthly-progress-track"><i style="width:${pct}%;"></i></div></div>`;
}

// Board-card equivalent of the Shooting panel's readiness row — lets a Creative Lead scan the whole
// board for "which shoots need attention" without opening each task. Reuses the exact same computed
// result (shootReadinessByJob, populated by fetchShootReadinessSummaryForCurrentAccess) and the same
// state colours already built for the Task Detail panel.
const SHOOT_READINESS_CHIP_META = {
    not_ready: { label: 'Not Ready', cls: 'not-ready' },
    attention: { label: 'Needs Attention', cls: 'attention' },
    ready: { label: 'Ready to Shoot', cls: 'ready' },
    completed: { label: 'Shoot Completed', cls: 'completed' }
};
function renderShootReadinessChip(item) {
    if (getRequestTypeMeta(item).key !== 'shooting') return '';
    const readiness = shootReadinessByJob[item.job_id];
    if (!readiness) return ''; // summary hasn't loaded yet this session — chip just doesn't show meanwhile
    const meta = SHOOT_READINESS_CHIP_META[readiness.state];
    return `<div class="shoot-readiness-chip"><span class="shoot-readiness-pill ${meta.cls}">${meta.label}</span><small>${readiness.doneCritical}/${readiness.totalCritical} ready</small></div>`;
}

// ========================================================
// 🌟 SHOOTING WORKFLOW — task detail panel (readiness, checklist, brief)
// ========================================================

function findShootChecklistRow(rows, phase, key) {
    return (rows || []).find(r => r.phase === phase && r.item_key === key) || null;
}

function isShootItemDone(rows, phase, key) {
    const row = findShootChecklistRow(rows, phase, key);
    return Boolean(row && row.completed);
}

// Readiness is entirely derived — nothing is stored except the optional admin override — so it can
// never drift out of sync with the checklist. Only critical Before Shoot items (that actually apply
// to this shoot) count; Shoot Day / Post Shoot never gate it, per the "can we confidently proceed"
// framing.
function computeShootReadiness(item, rows) {
    const details = item.shoot_details || {};
    const beforeDefs = getApplicableShootChecklistDefs('before', details);
    const critical = beforeDefs.filter(d => d.critical);
    const doneCritical = critical.filter(d => isShootItemDone(rows, 'before', d.key));
    const missing = critical.filter(d => !isShootItemDone(rows, 'before', d.key));
    const postDefs = SHOOT_CHECKLIST_DEFS.post;
    const postDone = postDefs.length > 0 && postDefs.every(d => isShootItemDone(rows, 'post', d.key));
    const override = details.readiness_override || null;
    const overridden = Boolean(override && override.active);

    let state;
    if (postDone) state = 'completed';
    else if (overridden || (critical.length > 0 && doneCritical.length === critical.length)) state = 'ready';
    else if (doneCritical.length > 0) state = 'attention';
    else state = 'not_ready';

    return { state, doneCritical: doneCritical.length, totalCritical: critical.length, missing, overridden, override };
}

function getDefaultShootPhase(readiness) {
    if (readiness.state === 'completed') return 'post';
    if (readiness.state === 'ready') return 'shoot_day';
    return 'before';
}

async function fetchShootChecklist(jobID) {
    try {
        const { data, error } = await supabaseClient.from('shoot_checklist_items').select('*').eq('job_id', jobID);
        if (error) throw error;
        shootChecklistByJob[jobID] = data || [];
    } catch (e) {
        console.error('Failed to load shoot checklist:', e.message);
        shootChecklistByJob[jobID] = shootChecklistByJob[jobID] || [];
    }
}

async function loadShootChecklistThenRefresh(jobID) {
    await fetchShootChecklist(jobID);
    refreshShootingPanel(jobID);
}

function refreshShootingPanel(jobID) {
    const panel = document.getElementById(`shooting-panel-${jobID}`);
    const item = globalData.find(d => d.job_id === jobID);
    if (!panel || !item) return;
    panel.outerHTML = renderShootingPanel(item);
    refreshIcons();
}

function renderShootOwnerSuggestions(item) {
    const details = item.shoot_details || {};
    const names = new Set();
    if (item.requester_name) names.add(item.requester_name);
    if (details.onsite_pic) names.add(details.onsite_pic);
    getAssignedPICNames(item.assignee).forEach(n => names.add(n));
    return `<datalist id="shoot-owner-suggestions-${escapeHtml(item.job_id)}">${[...names].map(n => `<option value="${escapeHtml(n)}"></option>`).join('')}</datalist>`;
}

function renderShootChecklistPhase(item, phase, rows, canEdit) {
    const details = item.shoot_details || {};
    const defs = getApplicableShootChecklistDefs(phase, details);
    if (!defs.length) return `<div class="shoot-checklist-empty">Nothing to check here for this shoot.</div>`;

    const itemsHtml = defs.map(def => {
        const row = findShootChecklistRow(rows, phase, def.key) || {};
        const done = Boolean(row.completed);
        const ownerVal = row.owner || '';
        const noteVal = row.note || '';
        const metaLine = done && row.completed_by ? `<small>${escapeHtml(row.completed_by)} · ${formatDateTime(row.completed_at)}</small>` : '';
        return `
            <div class="shoot-check-item ${done ? 'done' : ''}">
                <label class="shoot-check-main">
                    <input type="checkbox" ${done ? 'checked' : ''} ${canEdit ? '' : 'disabled'} onchange="toggleShootChecklistItem('${escapeJsString(item.job_id)}', '${phase}', '${def.key}')">
                    <span>${escapeHtml(def.label)}${def.critical ? '<i class="shoot-critical-dot" title="Critical for readiness"></i>' : ''}</span>
                </label>
                <div class="shoot-check-meta">
                    <input type="text" class="shoot-owner-input" placeholder="Owner${def.ownerHint ? ` (${escapeHtml(def.ownerHint)})` : ''}" value="${escapeHtml(ownerVal)}" ${canEdit ? '' : 'disabled'}
                        list="shoot-owner-suggestions-${escapeHtml(item.job_id)}"
                        onchange="updateShootChecklistMeta('${escapeJsString(item.job_id)}', '${phase}', '${def.key}', 'owner', this.value)">
                    ${metaLine}
                </div>
                <input type="text" class="shoot-note-input" placeholder="Short note (optional)" value="${escapeHtml(noteVal)}" ${canEdit ? '' : 'disabled'}
                    onchange="updateShootChecklistMeta('${escapeJsString(item.job_id)}', '${phase}', '${def.key}', 'note', this.value)">
            </div>
        `;
    }).join('');

    return itemsHtml + renderShootOwnerSuggestions(item);
}

function renderShootingPanel(item) {
    if (getRequestTypeMeta(item).key !== 'shooting') return '';

    const jobID = item.job_id;
    const details = item.shoot_details || {};
    const rows = shootChecklistByJob[jobID] || null; // null = not fetched yet this session
    const readiness = computeShootReadiness(item, rows || []);
    const phase = activeShootTab[jobID] || getDefaultShootPhase(readiness);
    // Checklist toggling follows the same lax "anyone who can see this task and has a name set"
    // rule as task notes (canAddTaskNote) — owners are informational, not access control (per spec:
    // "do not require ownership everywhere"). Editing the shoot's core details is admin-only, same
    // tier as editing any other request type.
    const canEdit = Boolean(getCurrentUserName());
    const canEditDetails = canCurrentUserEditTask(item).canEdit;

    const extraDays = details.additional_shoot_days || [];
    const mapLink = getTaskSafeHttpUrl(details.map_link);
    const factRows = [
        item.shoot_date ? `<div class="shoot-fact"><span>Date${extraDays.length ? ` (+${extraDays.length} more)` : ''}</span><strong>${formatDate(item.shoot_date)}</strong></div>` : '',
        details.call_time ? `<div class="shoot-fact"><span>Call Time</span><strong>${escapeHtml(details.call_time)}</strong></div>` : '',
        details.location ? `<div class="shoot-fact"><span>Location</span><strong>${escapeHtml(details.location)}${mapLink ? ` <a href="${escapeHtml(mapLink)}" target="_blank" rel="noopener noreferrer" class="shoot-map-link" onclick="event.stopPropagation()" title="Open in Maps"><i data-lucide="map-pin"></i></a>` : ''}</strong></div>` : '',
        details.what_shooting ? `<div class="shoot-fact"><span>What</span><strong>${escapeHtml(details.what_shooting)}</strong></div>` : '',
        details.onsite_pic ? `<div class="shoot-fact"><span>On-site PIC</span><strong>${escapeHtml(details.onsite_pic)}</strong></div>` : '',
        details.talent?.required ? `<div class="shoot-fact"><span>Talent</span><strong>${escapeHtml(details.talent.name || 'TBC')} · ${escapeHtml(details.talent.status || 'Proposed')}</strong></div>` : '',
        details.props?.required ? `<div class="shoot-fact"><span>Product/Props</span><strong>${escapeHtml(details.props.what || 'TBC')}</strong></div>` : ''
    ].filter(Boolean).join('');

    const extraDaysHtml = extraDays.length
        ? `<div class="shoot-extra-days-note"><i data-lucide="calendar-plus"></i> Also: ${extraDays.map(d => `${formatDate(d.date)}${d.label ? ` — ${escapeHtml(d.label)}` : ''}`).join(', ')}</div>`
        : '';

    const stateMeta = {
        not_ready: { label: 'Not Ready', cls: 'not-ready' },
        attention: { label: 'Needs Attention', cls: 'attention' },
        ready: { label: 'Ready to Shoot', cls: 'ready' },
        completed: { label: 'Shoot Completed', cls: 'completed' }
    }[readiness.state];

    const missingHtml = (readiness.state === 'not_ready' || readiness.state === 'attention') && readiness.missing.length
        ? `<div class="shoot-readiness-missing">${readiness.missing.map(d => `<span>⚠ ${escapeHtml(d.label)} pending</span>`).join('')}</div>`
        : '';

    const tabsHtml = ['before', 'shoot_day', 'post'].map(p => {
        const defs = getApplicableShootChecklistDefs(p, details);
        const doneCount = defs.filter(d => isShootItemDone(rows, p, d.key)).length;
        return `<button type="button" class="${phase === p ? 'active' : ''}" onclick="switchShootTab('${escapeJsString(jobID)}', '${p}')">${SHOOT_PHASE_LABELS[p]} <em>${doneCount}/${defs.length}</em></button>`;
    }).join('');

    const checklistHtml = rows === null
        ? `<div class="shoot-checklist-loading"><i data-lucide="loader-2" class="spin"></i> Loading checklist…</div>`
        : renderShootChecklistPhase(item, phase, rows, canEdit);

    const readyActionHtml = (readiness.state === 'ready' || readiness.state === 'completed')
        ? `<span class="shoot-ready-badge ${stateMeta.cls}"><i data-lucide="${readiness.state === 'completed' ? 'check-check' : 'check-circle-2'}"></i> ${stateMeta.label}${readiness.overridden ? ' · overridden' : ''}</span>`
        : `<button type="button" class="shoot-ready-btn" onclick="openMarkReadyToShootDialog('${escapeJsString(jobID)}')"><i data-lucide="flag"></i> Mark Ready to Shoot</button>`;

    return `
        <div class="shooting-panel" id="shooting-panel-${escapeHtml(jobID)}">
            <div class="shooting-panel-head">
                <span class="shooting-panel-title"><i data-lucide="camera"></i> SHOOTING</span>
                ${readyActionHtml}
            </div>
            ${factRows ? `<div class="shoot-facts">${factRows}</div>` : ''}
            ${extraDaysHtml}
            <div class="shoot-readiness-row">
                <span>Shoot Readiness</span>
                <strong>${readiness.doneCritical} / ${readiness.totalCritical} ready</strong>
                <span class="shoot-readiness-pill ${stateMeta.cls}">${stateMeta.label}</span>
            </div>
            ${missingHtml}
            <div class="shoot-tabs settings-segmented">${tabsHtml}</div>
            <div class="shoot-checklist-body">${checklistHtml}</div>
            <div class="shoot-panel-actions">
                <button type="button" class="btn-action btn-copy" onclick="copyShootBrief('${escapeJsString(jobID)}')"><i data-lucide="copy"></i> Copy Shoot Brief</button>
                ${canEditDetails ? `<button type="button" class="btn-action btn-copy" onclick="openShootEditModal('${escapeJsString(jobID)}')"><i data-lucide="pencil"></i> Edit Shoot Details</button>` : ''}
            </div>
        </div>
    `;
}

async function toggleShootChecklistItem(jobID, phase, key) {
    const item = globalData.find(d => d.job_id === jobID);
    if (!item) return;
    const rows = shootChecklistByJob[jobID] || (shootChecklistByJob[jobID] = []);
    const existing = findShootChecklistRow(rows, phase, key);
    const nowDone = !(existing && existing.completed);
    const who = getCurrentUserName() || 'Unknown';
    const nowIso = new Date().toISOString();

    const patch = {
        job_id: jobID, phase, item_key: key,
        completed: nowDone,
        owner: existing?.owner || null,
        note: existing?.note || null,
        completed_by: nowDone ? who : null,
        completed_at: nowDone ? nowIso : null,
        updated_at: nowIso
    };

    // Optimistic local update, same pattern as the rest of the app's task actions.
    if (existing) Object.assign(existing, patch);
    else rows.push(patch);
    refreshShootingPanel(jobID);

    try {
        const { error } = await supabaseClient.from('shoot_checklist_items').upsert(patch, { onConflict: 'job_id,phase,item_key' });
        if (error) throw error;
        const def = (SHOOT_CHECKLIST_DEFS[phase] || []).find(d => d.key === key);
        if (def) logTaskActivity(jobID, 'shoot_checklist', '', nowDone ? 'done' : 'pending', `${nowDone ? 'Checked' : 'Unchecked'}: ${def.label} (${SHOOT_PHASE_LABELS[phase]})`, { phase, item_key: key });
    } catch (e) {
        console.error('Failed to save shoot checklist item:', e.message);
        showAppleAlert('Could Not Save', 'This checklist update did not save — please try again.', { tone: 'danger' });
    }
}

async function updateShootChecklistMeta(jobID, phase, key, field, value) {
    const rows = shootChecklistByJob[jobID] || (shootChecklistByJob[jobID] = []);
    let existing = findShootChecklistRow(rows, phase, key);
    if (!existing) {
        existing = { job_id: jobID, phase, item_key: key, completed: false, owner: null, note: null, completed_by: null, completed_at: null };
        rows.push(existing);
    }
    existing[field] = value ? value.trim() : null;
    existing.updated_at = new Date().toISOString();

    try {
        const { error } = await supabaseClient.from('shoot_checklist_items').upsert({
            job_id: jobID, phase, item_key: key,
            completed: existing.completed, owner: existing.owner, note: existing.note,
            completed_by: existing.completed_by, completed_at: existing.completed_at, updated_at: existing.updated_at
        }, { onConflict: 'job_id,phase,item_key' });
        if (error) throw error;
    } catch (e) {
        console.error('Failed to save shoot checklist field:', e.message);
    }
}

function switchShootTab(jobID, phase) {
    activeShootTab[jobID] = phase;
    refreshShootingPanel(jobID);
}

async function copyShootBrief(jobID) {
    const item = globalData.find(d => d.job_id === jobID);
    if (!item) return;
    const d = item.shoot_details || {};
    const extraDays = d.additional_shoot_days || [];
    const lines = [
        `SHOOT BRIEF — ${item.job_id}`,
        `Client: ${item.client_name || '-'}`,
        `Project: ${item.project_title || '-'}`,
        `What: ${d.what_shooting || '-'}`,
        `Shoot Date: ${item.shoot_date ? formatDate(item.shoot_date) : 'TBC'}`,
        extraDays.length ? `Additional Shoot Days: ${extraDays.map(x => `${formatDate(x.date)}${x.label ? ` — ${x.label}` : ''}`).join('; ')}` : '',
        `Call Time: ${d.call_time || 'TBC'}`,
        `Location: ${d.location || 'TBC'}`,
        getTaskSafeHttpUrl(d.map_link) ? `Map: ${getTaskSafeHttpUrl(d.map_link)}` : '',
        `AM/SM PIC: ${d.onsite_pic || item.requester_name || '-'}`,
        `Creative PIC: ${getAssigneeDisplay(item.assignee)}`,
        getTaskSafeHttpUrl(item.playbook_link) ? `Playbook: ${getTaskSafeHttpUrl(item.playbook_link)}` : '',
        `Talent: ${d.talent?.required ? `${d.talent.name || 'TBC'} (${d.talent.status || 'Proposed'})` : 'Not required'}`,
        `Deliverables: ${d.deliverables || '-'}`,
        `Product / Props: ${d.props?.required ? `${d.props.what || 'TBC'} — brought by ${d.props.who || 'TBC'}` : 'Not required'}`,
        `Reference: ${d.reference_link || item.ref_link || '-'}`,
        `Important Notes: ${d.important_notes || '-'}`
    ].filter(Boolean);
    const text = lines.join('\n');

    try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
        await navigator.clipboard.writeText(text);
        showNotification('Shoot Brief Copied', 'Paste it into Teams / WhatsApp.');
    } catch (e) {
        showAppleAlert('Copy Failed', `Could not copy automatically — copy manually:\n\n${text}`);
    }
}

async function openMarkReadyToShootDialog(jobID) {
    const item = globalData.find(d => d.job_id === jobID);
    if (!item) return;
    const rows = shootChecklistByJob[jobID] || [];
    const readiness = computeShootReadiness(item, rows);

    if (readiness.state === 'ready' || readiness.state === 'completed') {
        return showAppleAlert('Already Ready', 'Every critical item is already confirmed for this shoot.', { icon: 'check-circle', tone: 'success' });
    }

    const missingText = readiness.missing.map(d => `• ${d.label}`).join('\n') || 'Nothing outstanding.';

    if (!hasAdminAccess()) {
        return showAppleAlert('Not Ready Yet', `Still outstanding before this shoot is ready:\n\n${missingText}`, { icon: 'alert-triangle', tone: 'danger' });
    }

    const confirmed = await showAppleConfirm('Not Ready Yet', `Still outstanding:\n\n${missingText}\n\nOverride and mark Ready to Shoot anyway?`, { icon: 'alert-triangle', confirmText: 'Override', cancelText: 'Cancel' });
    if (!confirmed) return;
    const reason = await showApplePrompt('Override Reason', 'Short reason for overriding readiness (required):');
    if (!reason || !reason.trim()) return;
    await submitShootReadinessOverride(jobID, reason.trim());
}

async function submitShootReadinessOverride(jobID, reason) {
    const item = globalData.find(d => d.job_id === jobID);
    if (!item) return;
    const details = { ...(item.shoot_details || {}) };
    details.readiness_override = { active: true, reason, by: getCurrentUserName() || 'Admin', at: new Date().toISOString() };
    const previousDetails = item.shoot_details;
    item.shoot_details = details;
    refreshShootingPanel(jobID);

    try {
        const { error } = await supabaseClient.from('creative_requests').update({ shoot_details: details }).eq('job_id', jobID);
        if (error) throw error;
        logTaskActivity(jobID, 'shoot_readiness_override', '', 'ready', `Readiness overridden: ${reason}`, { reason });
        showNotification('Marked Ready to Shoot', `Overridden by ${getCurrentUserName() || 'Admin'}.`);
    } catch (e) {
        item.shoot_details = previousDetails;
        refreshShootingPanel(jobID);
        showAppleAlert('Could Not Save Override', e.message, { tone: 'danger' });
    }
}

// field: 'Talent' | 'Props' | 'MultiDay' — matches setShootEditToggle's sedit{field}Req/Fields ids.
function toggleShootEditConditional(field) {
    const show = document.getElementById(`sedit${field}Req`)?.value === 'yes';
    const fieldsEl = document.getElementById(`sedit${field}Fields`);
    if (fieldsEl) fieldsEl.style.display = show ? 'flex' : 'none';
}

function setShootEditToggle(field, value) {
    document.getElementById(`sedit${field}Req`).value = value;
    document.getElementById(`sedit${field}Toggle`).querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.value === value));
    toggleShootEditConditional(field);
}

function openShootEditModal(jobID) {
    const item = globalData.find(d => d.job_id === jobID);
    if (!item) return;
    if (!canCurrentUserEditTask(item).canEdit) {
        return showAppleAlert('Admin Only', 'Only admins can edit shoot details. Checklist updates remain available inside the task.', { tone: 'warning', icon: 'lock' });
    }
    const d = item.shoot_details || {};

    document.getElementById('shootEditJobId').value = jobID;
    setShootCheckboxValue('seditWhatBox', 'seditWhatOtherRow', 'seditWhatOther', d.what_shooting || '');
    setShootPresetValue('seditDeliverables', d.deliverables || '');
    document.getElementById('seditDate').value = item.shoot_date || '';
    document.getElementById('seditCallTime').value = d.call_time || '';
    setShootPresetValue('seditLocation', d.location || '');
    document.getElementById('seditMapLink').value = d.map_link || '';
    document.getElementById('seditDeadline').value = getTaskClientDeadline(item) || '';
    document.getElementById('seditOnsitePic').value = d.onsite_pic || '';
    document.getElementById('seditTalentName').value = d.talent?.name || '';
    document.getElementById('seditTalentStatus').value = d.talent?.status || 'Proposed';
    setShootPresetValue('seditPropsWhat', d.props?.what || '');
    setShootPresetValue('seditPropsWho', d.props?.who || '');
    document.getElementById('seditRef').value = d.reference_link || item.ref_link || '';
    document.getElementById('seditNotes').value = d.important_notes || '';
    setShootEditToggle('Talent', d.talent?.required ? 'yes' : 'no');
    setShootEditToggle('Props', d.props?.required ? 'yes' : 'no');
    renderShootExtraDaysInto('seditExtraDaysContainer', d.additional_shoot_days || []);
    setShootEditToggle('MultiDay', (d.additional_shoot_days || []).length ? 'yes' : 'no');

    const overlay = document.getElementById('shootEditModal');
    document.body.classList.add('no-scroll');
    overlay.style.display = 'flex';
    overlay.offsetHeight;
    overlay.classList.add('show');
    refreshIcons();
}

function closeShootEditModal() {
    const overlay = document.getElementById('shootEditModal');
    if (!overlay) return;
    overlay.classList.remove('show');
    setTimeout(() => {
        overlay.style.display = 'none';
        document.body.classList.remove('no-scroll');
    }, 200);
}

async function saveShootEditModal() {
    const jobID = document.getElementById('shootEditJobId').value;
    const item = globalData.find(d => d.job_id === jobID);
    if (!item) return;

    const shootDate = document.getElementById('seditDate').value;
    const deadline = document.getElementById('seditDeadline').value;
    const whatShooting = getShootCheckboxValue('seditWhatBox', 'seditWhatOther');
    const location = getShootPresetValue('seditLocation');
    if (!shootDate || !whatShooting || !location || !deadline) {
        return showAppleAlert('Missing Info', 'What are we shooting, Shoot Date, Location and Client Deadline are required.');
    }
    const multiDay = document.getElementById('seditMultiDayReq').value === 'yes';
    const extraShootDays = multiDay ? getShootExtraDays('seditExtraDaysContainer') : [];
    if (multiDay && !extraShootDays.length) {
        return showAppleAlert('Missing Shoot Days', 'Please add at least one additional shoot day, or set Multi-day shoot to No.');
    }

    const talentRequired = document.getElementById('seditTalentReq').value === 'yes';
    const propsRequired = document.getElementById('seditPropsReq').value === 'yes';
    const details = { ...(item.shoot_details || {}) };
    details.what_shooting = whatShooting;
    details.call_time = document.getElementById('seditCallTime').value || '';
    details.location = location;
    details.map_link = document.getElementById('seditMapLink').value.trim();
    details.onsite_pic = document.getElementById('seditOnsitePic').value.trim();
    details.talent = talentRequired
        ? { required: true, name: document.getElementById('seditTalentName').value.trim(), status: document.getElementById('seditTalentStatus').value }
        : { required: false };
    details.props = propsRequired
        ? { required: true, what: getShootPresetValue('seditPropsWhat'), who: getShootPresetValue('seditPropsWho') }
        : { required: false };
    details.additional_shoot_days = extraShootDays;
    details.deliverables = getShootPresetValue('seditDeliverables');
    details.reference_link = document.getElementById('seditRef').value.trim();
    details.important_notes = document.getElementById('seditNotes').value.trim();

    const btn = document.getElementById('btnSaveShootEdit');
    const originalHtml = btn ? btn.innerHTML : '';
    if (btn) { btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Saving...'; btn.disabled = true; refreshIcons(); }

    try {
        const { error } = await supabaseClient.from('creative_requests').update({
            shoot_date: shootDate, shoot_details: details, client_deadline: deadline, deadline: deadline, ref_link: details.reference_link
        }).eq('job_id', jobID);
        if (error) throw error;

        item.shoot_date = shootDate;
        item.shoot_details = details;
        item.client_deadline = deadline;
        item.deadline = deadline;
        item.ref_link = details.reference_link;

        logTaskActivity(jobID, 'shoot_details_updated', '', '', 'Shoot details updated.', {});
        closeShootEditModal();
        showNotification('Shoot Details Updated');
        if (document.getElementById('globalDetailModal')?.classList.contains('show')) openDetailModal(jobID, true);
    } catch (e) {
        showAppleAlert('Save Failed', e.message, { tone: 'danger' });
    } finally {
        if (btn) { btn.innerHTML = originalHtml; btn.disabled = false; refreshIcons(); }
    }
}

function renderMonthlyFlowPanel(item) {
    const summary = getMonthlyDeliverableSummary(item);
    if (!summary || !summary.total) return '';
    const progress = getMonthlyProgressState(item, summary);
    const pct = Math.min(Math.round((progress.readyTotal / summary.total) * 100), 100);
    const canUpdate = canAddTaskNote(item);
    const readonlyBreakdown = progress.parts.map(part => `<span>${escapeHtml(part.label)} <strong>${part.ready}/${part.count}</strong></span>`).join('');
    const formatRows = progress.parts.map((part, index) => {
        const partPct = part.count ? Math.min(Math.round((part.ready / part.count) * 100), 100) : 0;
        return `
            <div class="monthly-format-row">
                <div class="monthly-format-info">
                    <span>${escapeHtml(part.label)}</span>
                    <strong><em id="monthly-format-ready-${item.job_id}-${index}">${part.ready}</em>/<b>${part.count}</b> ready</strong>
                    <div class="monthly-format-track"><i id="monthly-format-bar-${item.job_id}-${index}" style="width:${partPct}%;"></i></div>
                </div>
                <div class="monthly-format-stepper">
                    <button type="button" onclick="adjustMonthlyFormatProgress('${item.job_id}', ${index}, -1, ${summary.total})" aria-label="Decrease ${escapeHtml(part.label)} ready"><i data-lucide="minus"></i></button>
                    <input class="monthly-format-input" id="monthly-format-${item.job_id}-${index}" data-monthly-job="${escapeHtml(item.job_id)}" data-index="${index}" data-label="${escapeHtml(part.label)}" data-total="${part.count}" type="number" min="0" max="${part.count}" value="${part.ready}" oninput="updateMonthlyFormatProgressPreview('${item.job_id}', ${summary.total})">
                    <button type="button" onclick="adjustMonthlyFormatProgress('${item.job_id}', ${index}, 1, ${summary.total})" aria-label="Increase ${escapeHtml(part.label)} ready"><i data-lucide="plus"></i></button>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="monthly-flow-panel">
            <div class="monthly-flow-head">
                <div>${renderRequestTypePill(item)}<strong id="monthly-label-${item.job_id}">${progress.readyTotal}/${summary.total} deliverables ready</strong></div>
                <span id="monthly-pct-${item.job_id}">${pct}%</span>
            </div>
            <div class="monthly-progress-track"><i id="monthly-bar-${item.job_id}" style="width:${pct}%;"></i></div>
            ${canUpdate ? `
                <div class="monthly-ready-control">
                    <div class="monthly-ready-head">
                        <div>
                            <span>Deliverables Ready</span>
                            <strong>Update by content format for cleaner reporting</strong>
                        </div>
                        <button type="button" id="btn-monthly-progress-${item.job_id}" onclick="saveMonthlyProgress(event, '${item.job_id}', ${summary.total})" class="monthly-save-btn"><i data-lucide="save"></i> Save Progress</button>
                    </div>
                    <div class="monthly-format-list">${formatRows}</div>
                </div>
            ` : `<div class="monthly-breakdown">${readonlyBreakdown}</div>`}
            <p>For partial completion, keep this request in <strong>Partial Ready</strong>. Move to <strong>Client Review</strong> only when the whole monthly set is ready for client review.</p>
        </div>
    `;
}

async function saveMonthlyProgress(event, jobID, total) {
    if (event) event.stopPropagation();
    const job = globalData.find(d => d.job_id === jobID);
    if (!job) return showAppleAlert('Missing Task', 'This monthly task could not be found.');

    const summary = getMonthlyDeliverableSummary(job);
    const expectedTotal = summary?.total || Number(total || 0);
    const formatInputs = getMonthlyFormatInputs(jobID);
    let ready = 0;
    let breakdown = [];

    if (formatInputs.length) {
        formatInputs.forEach(input => {
            const max = Number(input.dataset.total || input.max || 0);
            const value = clampMonthlyReady(input.value, max);
            input.value = value;
            ready += value;
            breakdown.push(`${input.dataset.label || 'Format'} ${value}/${max}`);
        });
        updateMonthlyFormatProgressPreview(jobID, expectedTotal);
    } else {
        const input = document.getElementById(`monthly-ready-${jobID}`);
        if (!input) return showAppleAlert('Missing Progress', 'The monthly progress controls could not be found.');
        ready = clampMonthlyReady(input.value, expectedTotal);
        input.value = ready;
        updateMonthlyProgressHeader(jobID, ready, expectedTotal);
    }

    const note = breakdown.length
        ? `Monthly progress: ${ready}/${expectedTotal} deliverables ready. Breakdown: ${breakdown.join('; ')}.`
        : `Monthly progress: ${ready}/${expectedTotal} deliverables ready.`;
    const btn = document.getElementById(`btn-monthly-progress-${jobID}`);
    const originalHtml = btn ? btn.innerHTML : '';

    if (btn) {
        btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Saving...';
        btn.disabled = true;
        refreshIcons();
    }

    const previousNote = job.status_notes || '';
    job.status_notes = note;
    setLocalTaskNote(jobID, note);

    try {
        await logTaskNote(job, note);
        const { error } = await supabaseClient
            .from('creative_requests')
            .update({ status_notes: note })
            .eq('job_id', jobID);

        if (error) {
            console.warn('Monthly progress latest note update failed:', error.message);
            job.status_notes = note || previousNote;
            setLocalTaskNote(jobID, note || previousNote);
            showNotification('Progress Saved', 'History saved; latest progress is local until status_notes column exists');
        } else {
            showNotification('Progress Saved', `${ready}/${expectedTotal} deliverables ready`);
        }

        renderDashboard();
        renderBoards();
        openDetailModal(jobID, true);
    } catch(e) {
        job.status_notes = previousNote;
        setLocalTaskNote(jobID, previousNote);
        showAppleAlert('Progress Save Failed', e.message);
    } finally {
        if (btn) {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
            refreshIcons();
        }
    }
}

function canAddTaskNote(item) {
    return Boolean(item && localStorage.getItem('adtech_user_name'));
}

// A note is only editable/deletable once it's a real synced task_note_logs row (has a real id,
// not the local-fallback placeholder used before a save round-trips) and belongs to the person
// asking — or the superadmin, for cleanup.
function canManageTaskNote(log) {
    if (!log || isLocallyGeneratedLogId(log.id)) return false;
    return hasSuperAdminAccess() || normalizeNameKey(log.actor_name) === normalizeNameKey(getCurrentUserName());
}

function renderTaskNoteRow(jobID, log) {
    if (editingNoteId === log.id) {
        return `
            <div class="task-note-thread-row editing">
                <div>
                    <strong>${escapeHtml(log.actor_name || 'Unknown')}</strong>
                    <span>${formatDateTime(log.created_at)} · ${escapeHtml(log.status_at_time || 'No status')}</span>
                </div>
                <textarea id="edit-note-${log.id}" class="task-note-textarea">${escapeHtml(log.note_text)}</textarea>
                <div class="task-note-row-edit-actions">
                    <button type="button" class="task-note-row-btn" onclick="cancelEditTaskNote('${jobID}')">Cancel</button>
                    <button type="button" class="task-note-row-btn primary" onclick="saveEditedTaskNote('${jobID}', '${log.id}')"><i data-lucide="check"></i> Save</button>
                </div>
            </div>
        `;
    }

    const canManage = canManageTaskNote(log);
    return `
        <div class="task-note-thread-row">
            <div>
                <strong>${escapeHtml(log.actor_name || 'Unknown')}</strong>
                <span>${formatDateTime(log.created_at)} · ${escapeHtml(log.status_at_time || 'No status')}${log.edited_at ? ' · <em>edited</em>' : ''}</span>
            </div>
            <p>${linkifyHtml(escapeHtml(log.note_text))}</p>
            ${canManage ? `
                <div class="task-note-row-actions">
                    <button type="button" title="Edit note" onclick="startEditTaskNote('${jobID}', '${log.id}')"><i data-lucide="pencil"></i></button>
                    <button type="button" title="Delete note" onclick="deleteTaskNote('${jobID}', '${log.id}')"><i data-lucide="trash-2"></i></button>
                </div>
            ` : ''}
        </div>
    `;
}

function renderTaskNotesBox(item) {
    const noteLogs = getManualTaskNoteLogs(item.job_id);
    const progressLogs = getAutoProgressNoteLogs(item.job_id);
    const latest = getLatestManualTaskNote(item);
    const noteCount = noteLogs.length;
    const canAdd = canAddTaskNote(item);

    const rows = noteLogs.length ? noteLogs.slice(0, 12).map(log => renderTaskNoteRow(item.job_id, log)).join('')
        : '<div class="task-note-empty">No notes yet. Add the first update for this task.</div>';

    const latestPreview = latest?.note_text
        ? `<small>${linkifyHtml(escapeHtml(latest.note_text.length > 120 ? latest.note_text.slice(0, 117) + '...' : latest.note_text))}</small>`
        : '<small>No notes yet</small>';

    // Stays open across re-renders (adding/editing/deleting a note all re-render this whole box)
    // instead of snapping shut on every action — a plain <details> has no memory of its own state.
    const wasOpen = document.querySelector('.task-notes-box')?.open;
    const keepOpen = wasOpen || (editingNoteId && noteLogs.some(log => log.id === editingNoteId));
    const progressWasOpen = document.querySelector('.task-note-progress-box')?.open;
    const keepProgressOpen = progressWasOpen || (editingNoteId && progressLogs.some(log => log.id === editingNoteId));

    return `
        <details class="task-notes-box" ${keepOpen ? 'open' : ''}>
            <summary>
                <span><i data-lucide="message-square-text"></i><strong>Task Notes</strong></span>
                <em>${noteCount} update${noteCount === 1 ? '' : 's'}</em>
            </summary>
            <div class="task-note-latest">${latestPreview}</div>
            ${canAdd ? `
                <div class="task-note-input-wrap">
                    <textarea id="task-note-${item.job_id}" class="task-note-textarea" placeholder="Add a quick update. Type @ to tag someone — e.g. Need revision on slide 4-8, or @Ain Sabrina please check colour direction..." oninput="handleTaskNoteInput(event, '${item.job_id}')" onblur="hideMentionDropdown('${item.job_id}')"></textarea>
                    <div id="task-note-mentions-${item.job_id}" class="premium-dropdown"></div>
                </div>
                <div class="task-note-actions">
                    <button type="button" id="btn-note-${item.job_id}" onclick="saveTaskNote(event, '${item.job_id}')" class="btn-action btn-copy"><i data-lucide="send"></i> Add Note</button>
                </div>
            ` : `
                <div class="task-note-readonly">Sign in to add notes.</div>
            `}
            <div class="task-note-thread-head">History</div>
            <div class="task-note-thread">${rows}</div>
            ${progressLogs.length ? `
                <details class="task-note-progress-box" ${keepProgressOpen ? 'open' : ''}>
                    <summary><i data-lucide="bar-chart-3"></i> Monthly progress updates <em>${progressLogs.length}</em></summary>
                    <div class="task-note-thread">${progressLogs.slice(0, 20).map(log => renderTaskNoteRow(item.job_id, log)).join('')}</div>
                </details>
            ` : ''}
        </details>
    `;
}

function startEditTaskNote(jobID, noteId) {
    editingNoteId = noteId;
    openDetailModal(jobID, true);
}

function cancelEditTaskNote(jobID) {
    editingNoteId = null;
    openDetailModal(jobID, true);
}

async function saveEditedTaskNote(jobID, noteId) {
    const textarea = document.getElementById(`edit-note-${noteId}`);
    if (!textarea) return;

    const newText = textarea.value.trim();
    if (!newText) return showAppleAlert('Empty Note', 'Please write something before saving — or delete the note instead.');

    const log = (globalNoteLogs || []).find(row => row.id === noteId);
    if (!log) return;

    const previousText = log.note_text;
    const previousEditedAt = log.edited_at;
    log.note_text = newText;
    log.edited_at = new Date().toISOString();
    editingNoteId = null;

    try {
        const { error } = await supabaseClient.from('task_note_logs').update({ note_text: newText, edited_at: log.edited_at }).eq('id', noteId);
        if (error) throw error;
        showNotification('Note Updated', 'Your edit has been saved');
    } catch(e) {
        log.note_text = previousText;
        log.edited_at = previousEditedAt;
        showAppleAlert('Update Failed', e.message);
    }

    openDetailModal(jobID, true);
    renderDashboard();
    renderBoards();
}

async function deleteTaskNote(jobID, noteId) {
    const log = (globalNoteLogs || []).find(row => row.id === noteId);
    if (!log) return;

    const confirmed = await showAppleConfirm('Delete Note?', "This removes it from this task's history for everyone. This can't be undone.", { confirmText: 'Delete Note', cancelText: 'Cancel', tone: 'danger', icon: 'trash-2' });
    if (!confirmed) return;

    try {
        const { error } = await supabaseClient.from('task_note_logs').delete().eq('id', noteId);
        if (error) throw error;
    } catch(e) {
        return showAppleAlert('Delete Failed', e.message);
    }

    globalNoteLogs = (globalNoteLogs || []).filter(row => row.id !== noteId);
    setLocalNoteLogs(getLocalNoteLogs().filter(row => row.id !== noteId));
    showNotification('Note Deleted', "Removed from this task's history");

    openDetailModal(jobID, true);
    renderDashboard();
    renderBoards();
}

async function saveTaskNote(event, jobID) {
    if (event) event.stopPropagation();

    const input = document.getElementById(`task-note-${jobID}`);
    if (!input) return;

    const note = input.value.trim();
    const job = globalData.find(d => d.job_id === jobID);
    if (!job) return showAppleAlert("Missing Task", "This task could not be found.");
    if (!note) return showAppleAlert("Empty Note", "Please write a short update before adding it.");

    const btn = document.getElementById(`btn-note-${jobID}`);
    const originalHtml = btn ? btn.innerHTML : '';

    if (btn) {
        btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Adding...';
        btn.disabled = true;
        refreshIcons();
    }

    const previousNote = job.status_notes || '';
    job.status_notes = note;
    setLocalTaskNote(jobID, note);

    try {
        await logTaskNote(job, note);

        const mentioned = [...(taskNoteMentions[jobID] || [])];
        createTaskNotifications(job, note, getCurrentActor(), mentioned); // fire-and-forget, non-critical
        delete taskNoteMentions[jobID];

        const { error } = await supabaseClient
            .from('creative_requests')
            .update({ status_notes: note })
            .eq('job_id', jobID);

        if (error) {
            console.warn('Latest status note update failed:', error.message);
            job.status_notes = note || previousNote;
            setLocalTaskNote(jobID, note || previousNote);
            showNotification('Note Added', 'History saved; latest preview is local only until status_notes column exists');
        } else {
            showNotification('Note Added', 'Task update saved');
        }

        input.value = '';
        renderDashboard();
        renderBoards();
        openDetailModal(jobID, true);
    } catch(e) {
        showAppleAlert('Note Save Failed', e.message);
    } finally {
        if (btn) {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
            refreshIcons();
        }
    }
}

function isIndonesiaCreativeName(name) {
    const cleanName = String(name || '').toLowerCase();
    return ['annisya', 'miftahul', 'youke'].some(keyword => cleanName.includes(keyword));
}

function getCreativeTeamGroups() {
    let myTeam = [...new Set(дизайнериMY || [])];
    let idTeam = [...new Set(дизайнериID || [])];

    if (!myTeam.length && !idTeam.length && PIC_LIST.length) {
        idTeam = PIC_LIST.filter(name => isIndonesiaCreativeName(name));
        myTeam = PIC_LIST.filter(name => !idTeam.includes(name));
    }

    return { myTeam, idTeam };
}

function renderCreativePicGroups(jobID, selectedNames = [], mode = 'assign') {
    const { myTeam, idTeam } = getCreativeTeamGroups();
    const renderGroup = (label, names) => {
        if (!names.length) return '';

        return `
            <div class="pic-team-group">
                <div class="pic-team-title">${label}</div>
                <div class="designer-grid ${mode === 'edit' ? 'pic-editor-grid' : 'pic-team-grid'}">
                    ${names.map(name => {
                        const safeName = escapeHtml(name);
                        const isChecked = selectedNames.includes(name) ? 'checked' : '';
                        const inputClass = mode === 'edit' ? 'pic-edit-checkbox' : `cb-${jobID}`;
                        const jobAttr = mode === 'edit' ? ` data-job-id="${escapeHtml(jobID)}"` : '';
                        return `<label class="check-item pic-check"><input type="checkbox" value="${safeName}" class="${inputClass}"${jobAttr} ${isChecked}> ${safeName}</label>`;
                    }).join('')}
                </div>
            </div>
        `;
    };

    return renderGroup('Malaysia Team', myTeam) + renderGroup('Indonesia Team', idTeam);
}

function renderPicEditor(jobID, currentAssignee) {
    const currentDisplay = getAssigneeDisplay(currentAssignee);
    const selectedNames = getAssignedPICNames(currentAssignee);
    const picOptions = [...new Set([...(дизайнериMY || []), ...(дизайнериID || []), ...(PIC_LIST || [])])];

    if (!picOptions.length) {
        return `<strong>${currentDisplay}</strong><small class="pic-helper-text">Creative list is still loading.</small>`;
    }

    return `
        <div class="pic-editor">
            <div class="pic-current"><i data-lucide="user-round-check"></i><span>${currentDisplay}</span></div>
            ${renderCreativePicGroups(jobID, selectedNames, 'edit')}
            <button type="button" id="btn-pic-${jobID}" onclick="updateTaskPIC(event, '${jobID}')" class="btn-action btn-approve pic-save-btn"><i data-lucide="user-cog"></i> Update PIC</button>
        </div>
    `;
}

async function updateTaskPIC(event, jobID) {
    if (event) event.stopPropagation();

    const selectedPIC = Array.from(document.querySelectorAll('.pic-edit-checkbox'))
        .filter(cb => cb.dataset.jobId === jobID && cb.checked)
        .map(cb => cb.value)
        .join(', ');

    if (!selectedPIC) {
        return showAppleAlert("Missing PIC", "Please select at least one Creative PIC.");
    }

    const job = globalData.find(d => d.job_id === jobID);
    const oldAssignee = job ? getAssigneeDisplay(job.assignee) : 'Unassigned';

    if (selectedPIC === oldAssignee) {
        return showAppleAlert("No Changes", "This task is already assigned to the selected PIC.");
    }

    const btn = document.getElementById(`btn-pic-${jobID}`);
    const originalHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Updating...';
        btn.disabled = true;
        refreshIcons();
    }

    try {
        const assignmentPayload = buildPICAssignmentPayload(selectedPIC);
        const { error } = await supabaseClient
            .from('creative_requests')
            .update(assignmentPayload)
            .eq('job_id', jobID);

        if (error) {
            if (/column|schema|cache|assigned_pic|assignment_updated/i.test(error.message || '')) {
                const retry = await supabaseClient
                    .from('creative_requests')
                    .update(stripPICAssignmentPayloadFields(assignmentPayload))
                    .eq('job_id', jobID);
                if (retry.error) throw retry.error;
            } else {
                throw error;
            }
        }

        if (job) Object.assign(job, assignmentPayload);
        logTaskActivity(jobID, 'pic_changed', oldAssignee, selectedPIC, 'PIC changed from task detail', {
            ...getPICChangeMeta(oldAssignee, selectedPIC),
            source: 'task_detail'
        });
        renderDashboard();
        renderBoards();
        openDetailModal(jobID, true);
        showNotification('PIC Updated', selectedPIC);
    } catch(e) {
        if (job) job.assignee = oldAssignee;
        showAppleAlert("PIC Update Error", e.message);
    } finally {
        if (btn) {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
            refreshIcons();
        }
    }
}

function setTaskEditStatus(message = '', tone = '') {
    const el = document.getElementById('editTaskStatus');
    if (!el) return;
    el.textContent = message || '';
    el.className = `task-edit-status ${tone ? `is-${tone}` : ''}`;
    el.hidden = !message;
}

function getTaskEditFocusableElements() {
    const modal = document.querySelector('#editModal .task-edit-modal');
    if (!modal) return [];
    return Array.from(modal.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'))
        .filter(el => el.offsetParent !== null);
}

async function requestCloseEditTaskModal() {
    if (activeEditTaskState?.isSaving) return;
    if (isTaskEditDirty()) {
        const confirmed = await showAppleConfirm('Discard changes?', 'Your unsaved edits will be lost.', {
            confirmText: 'Discard',
            cancelText: 'Keep Editing',
            tone: 'danger',
            icon: 'rotate-ccw'
        });
        if (!confirmed) return;
    }
    closeEditModal();
}

function handleEditTaskBackdrop(event) {
    if (event.target?.id === 'editModal') requestCloseEditTaskModal();
}

function handleEditTaskKeydown(event) {
    if (event.key === 'Escape') {
        event.preventDefault();
        requestCloseEditTaskModal();
        return;
    }
    if (event.key !== 'Tab') return;
    const focusable = getTaskEditFocusableElements();
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

function handleTaskEditInput() {
    syncTaskEditDirtyState();
}

function handleTaskEditRequestTypeChange() {
    if (!activeEditTaskState) return;
    const requestType = document.getElementById('editRequestType')?.value || activeEditTaskState.original.request_type || 'adhoc';
    const jobTypeControl = document.getElementById('editJobTypeControl');
    if (jobTypeControl) {
        const baseJobType = requestType === activeEditTaskState.original.request_type
            ? activeEditTaskState.original.job_type
            : getTaskEditDefaultJobType(requestType);
        jobTypeControl.innerHTML = renderTaskEditJobTypeControl({
            ...activeEditTaskState.original,
            request_type: requestType,
            job_type: baseJobType
        });
    }
    activeEditTaskState.keepCurrentInternalDue = false;
    syncTaskEditDeadlineSuggestion();
    syncTaskEditDirtyState();
    refreshIcons();
}

function handleTaskEditClientDeadlineChange() {
    if (!activeEditTaskState) return;
    if (!activeEditTaskState.original.internal_due_manual && !activeEditTaskState.internalDueTouched) {
        activeEditTaskState.keepCurrentInternalDue = false;
    }
    syncTaskEditDeadlineSuggestion();
    syncTaskEditDirtyState();
}

function handleTaskEditInternalDueInput() {
    if (!activeEditTaskState) return;
    activeEditTaskState.internalDueTouched = true;
    activeEditTaskState.keepCurrentInternalDue = false;
    syncTaskEditDeadlineSuggestion();
    syncTaskEditDirtyState();
}

function applyTaskEditSuggestedInternalDue() {
    if (!activeEditTaskState?.suggestedInternalDue) return;
    const input = document.getElementById('editInternalDue');
    if (input) input.value = activeEditTaskState.suggestedInternalDue;
    activeEditTaskState.internalDueTouched = false;
    activeEditTaskState.keepCurrentInternalDue = false;
    syncTaskEditDeadlineSuggestion();
    syncTaskEditDirtyState();
}

function keepTaskEditCurrentInternalDue() {
    if (!activeEditTaskState) return;
    const input = document.getElementById('editInternalDue');
    if (input) input.value = activeEditTaskState.original.internal_due_date || '';
    activeEditTaskState.internalDueTouched = true;
    activeEditTaskState.keepCurrentInternalDue = true;
    syncTaskEditDeadlineSuggestion();
    syncTaskEditDirtyState();
}

function getTaskEditJobTypeValue(requestType) {
    if (requestType === 'monthly') return 'Monthly Content Plan';
    if (requestType === 'pitch') return 'Pitch Deck Proposal';

    const selected = Array.from(document.querySelectorAll('.edit-task-job-type-checkbox:checked'))
        .map(cb => cb.value.trim())
        .filter(Boolean);
    const custom = String(document.getElementById('editJobTypeCustom')?.value || '')
        .split(',')
        .map(part => part.trim())
        .filter(Boolean);
    return uniqueIdentityValues([...selected, ...custom]).join(', ');
}

function getTaskEditAssigneeValue() {
    const selected = Array.from(document.querySelectorAll('.edit-task-pic-checkbox:checked'))
        .map(cb => cb.value.trim())
        .filter(Boolean);
    return selected.length ? uniqueIdentityValues(selected).join(', ') : 'Unassigned';
}

function getTaskEditFormValues() {
    const requestType = document.getElementById('editRequestType')?.value || activeEditTaskState?.original?.request_type || 'adhoc';
    return {
        client_name: normalizeTaskEditText(document.getElementById('editClient')?.value),
        project_title: normalizeTaskEditText(document.getElementById('editTitle')?.value),
        region: normalizeTaskEditText(document.getElementById('editRegion')?.value),
        requester_name: normalizeTaskEditText(document.getElementById('editRequester')?.value),
        request_type: requestType,
        job_type: normalizeTaskEditText(getTaskEditJobTypeValue(requestType)),
        objective: normalizeTaskEditText(document.getElementById('editObjective')?.value),
        brief: String(document.getElementById('editBrief')?.value || '').trim(),
        playbook_link: normalizeTaskEditText(document.getElementById('editPlaybookUrl')?.value),
        ref_link: normalizeTaskEditText(document.getElementById('editReferenceUrl')?.value),
        client_deadline: toDateInputValue(document.getElementById('editDeadline')?.value),
        internal_due_date: toDateInputValue(document.getElementById('editInternalDue')?.value),
        assignee: getTaskEditAssigneeValue()
    };
}

function validateTaskEditValues(values) {
    const errors = [];
    const playbook = normalizeTaskUrlForSave(values.playbook_link, 'Playbook URL');
    const reference = normalizeTaskUrlForSave(values.ref_link, 'Reference URL');

    if (!values.client_name) errors.push('Client / Brand is required.');
    if (!values.project_title) errors.push('Project / Task Title is required.');
    if (!values.region) errors.push('Region / Country is required.');
    if (!values.requester_name) errors.push('Requester is required.');
    if (!values.job_type) errors.push('Job Type / Deliverable Type is required.');
    if (!values.client_deadline) errors.push('Client Deadline is required.');
    if (!values.internal_due_date) errors.push('Internal Due is required for reporting.');
    if (!playbook.ok) errors.push(playbook.message);
    if (!reference.ok) errors.push(reference.message);

    let deadlineWarning = '';
    if (values.internal_due_date) {
        const validation = validateInternalDueDate(values.internal_due_date, values.client_deadline);
        if (!validation.valid) errors.push(validation.warning);
        else deadlineWarning = validation.warning;
    }

    return {
        valid: errors.length === 0,
        errors,
        warning: deadlineWarning,
        normalized: {
            playbook_link: playbook.value,
            ref_link: reference.value
        }
    };
}

function getTaskEditComparable(field, value) {
    if (['client_deadline', 'internal_due_date'].includes(field)) return toDateInputValue(value);
    if (field === 'assignee') return getAssigneeDisplay(value);
    if (['playbook_link', 'ref_link'].includes(field)) return getTaskSafeHttpUrl(value) || normalizeTaskEditText(value);
    return normalizeTaskEditText(value);
}

function getTaskEditChanges(original, values, normalizedUrls = {}) {
    const comparableValues = {
        ...values,
        playbook_link: normalizedUrls.playbook_link ?? values.playbook_link,
        ref_link: normalizedUrls.ref_link ?? values.ref_link
    };
    const fields = [
        'client_name',
        'project_title',
        'region',
        'requester_name',
        'request_type',
        'job_type',
        'objective',
        'brief',
        'playbook_link',
        'ref_link',
        'client_deadline',
        'internal_due_date',
        'assignee'
    ];

    return fields.reduce((changes, field) => {
        const oldValue = getTaskEditComparable(field, original[field]);
        const newValue = getTaskEditComparable(field, comparableValues[field]);
        if (oldValue !== newValue) changes[field] = { from: oldValue, to: newValue };
        return changes;
    }, {});
}

function isTaskEditDirty() {
    if (!activeEditTaskState) return false;
    const values = getTaskEditFormValues();
    const validation = validateTaskEditValues(values);
    const changes = getTaskEditChanges(activeEditTaskState.original, values, validation.normalized);
    return Object.keys(changes).length > 0;
}

function syncTaskEditDirtyState() {
    if (!activeEditTaskState) return;
    const btn = document.getElementById('saveEditBtn');
    const values = getTaskEditFormValues();
    const validation = validateTaskEditValues(values);
    const changes = getTaskEditChanges(activeEditTaskState.original, values, validation.normalized);
    const changeCount = Object.keys(changes).length;
    activeEditTaskState.pendingValues = values;
    activeEditTaskState.pendingValidation = validation;
    activeEditTaskState.pendingChanges = changes;

    if (btn) {
        btn.disabled = activeEditTaskState.isSaving || changeCount === 0;
        const label = btn.querySelector('span');
        if (label) label.textContent = changeCount ? `Save ${changeCount} Change${changeCount === 1 ? '' : 's'}` : 'Save Changes';
    }

    if (!changeCount) {
        setTaskEditStatus('No unsaved changes.', 'muted');
    } else if (!validation.valid) {
        setTaskEditStatus(`${changeCount} change${changeCount === 1 ? '' : 's'} pending. Some fields need review before saving.`, 'warning');
    } else if (validation.warning) {
        setTaskEditStatus(validation.warning, 'warning');
    } else {
        setTaskEditStatus(`${changeCount} unsaved change${changeCount === 1 ? '' : 's'}.`, 'info');
    }
}

function syncTaskEditDeadlineSuggestion() {
    if (!activeEditTaskState) return;
    const box = document.getElementById('editDeadlineSuggestion');
    const internalInput = document.getElementById('editInternalDue');
    if (!box || !internalInput) return;

    const values = getTaskEditFormValues();
    const original = activeEditTaskState.original;
    const clientChanged = (values.client_deadline || '') !== (original.client_deadline || '');
    if (!clientChanged || original.internal_due_manual || activeEditTaskState.keepCurrentInternalDue) {
        box.hidden = true;
        box.innerHTML = '';
        return;
    }

    const suggestion = generateSuggestedInternalDueForTask({
        ...original,
        ...values,
        deadline: values.client_deadline,
        client_deadline: values.client_deadline
    });
    if (!suggestion.date) {
        box.hidden = true;
        box.innerHTML = '';
        return;
    }

    activeEditTaskState.suggestedInternalDue = suggestion.date;
    if (!activeEditTaskState.internalDueTouched && activeEditTaskState.lastSuggestedForClientDeadline !== values.client_deadline) {
        internalInput.value = suggestion.date;
        activeEditTaskState.lastSuggestedForClientDeadline = values.client_deadline;
    }

    box.hidden = false;
    box.innerHTML = `
        <div>
            <strong>Suggested internal due: ${escapeHtml(formatDate(suggestion.date))}</strong>
            <small>${suggestion.bufferDays || 2} working day buffer based on this request.</small>
        </div>
        <div>
            <button type="button" onclick="applyTaskEditSuggestedInternalDue()">Use Suggested</button>
            <button type="button" onclick="keepTaskEditCurrentInternalDue()">Keep Current</button>
        </div>
    `;
}

function buildTaskEditPayload(jobID, values, changes, normalizedUrls = {}) {
    const payload = {};
    const job = (globalData || []).find(d => d.job_id === jobID);
    const simpleFields = ['client_name', 'project_title', 'region', 'requester_name', 'request_type', 'job_type', 'objective', 'brief'];
    simpleFields.forEach(field => {
        if (changes[field]) payload[field] = values[field] || '';
    });
    if (changes.playbook_link) payload.playbook_link = normalizedUrls.playbook_link || '';
    if (changes.ref_link) payload.ref_link = normalizedUrls.ref_link || '';

    if (changes.client_deadline) {
        payload.deadline = values.client_deadline || null;
        payload.client_deadline = values.client_deadline || null;
        if (job && !job.original_client_deadline) payload.original_client_deadline = getTaskOriginalClientDeadline(job) || activeEditTaskState?.original?.client_deadline || values.client_deadline || null;
    }

    if (changes.internal_due_date || changes.client_deadline) {
        payload.internal_due_date = values.internal_due_date || null;
        if (values.internal_due_date && job && !job.original_internal_due_date) {
            payload.original_internal_due_date = getTaskOriginalInternalDueDate(job) || activeEditTaskState?.original?.internal_due_date || values.internal_due_date || null;
        }
        const shouldTreatInternalDueAsManual = Boolean(values.internal_due_date && (activeEditTaskState?.internalDueTouched || activeEditTaskState?.original?.internal_due_manual));
        payload.internal_due_source = shouldTreatInternalDueAsManual ? 'manual' : (values.internal_due_date ? 'system_generated' : null);
        payload.internal_due_manually_adjusted = shouldTreatInternalDueAsManual;
    }

    if (changes.assignee) Object.assign(payload, buildPICAssignmentPayload(values.assignee));
    if (job && Object.prototype.hasOwnProperty.call(job, 'updated_at')) payload.updated_at = new Date().toISOString();
    return payload;
}

function getTaskEditSummary(snapshot = {}) {
    return [
        snapshot.client_name || '',
        snapshot.project_title || '',
        snapshot.requester_name || '',
        snapshot.region || '',
        snapshot.job_type || '',
        snapshot.client_deadline || '',
        snapshot.internal_due_date || '',
        snapshot.assignee || 'Unassigned',
        snapshot.playbook_link || ''
    ].join(' | ');
}

function getTaskEditDeadlineChanges(changes = {}) {
    const rows = [];
    if (changes.client_deadline) rows.push({ field: 'client_deadline', label: 'Client deadline', from: changes.client_deadline.from || 'Not set', to: changes.client_deadline.to || 'Removed' });
    if (changes.internal_due_date) rows.push({ field: 'internal_due_date', label: 'Internal due date', from: changes.internal_due_date.from || 'Not set', to: changes.internal_due_date.to || 'Removed' });
    return rows;
}

async function fetchLatestTaskForEdit(jobID) {
    try {
        const { data, error } = await supabaseClient
            .from('creative_requests')
            .select('*')
            .eq('job_id', jobID)
            .maybeSingle();
        if (error) throw error;
        return data || null;
    } catch(e) {
        console.warn('Could not check latest task before edit save:', e.message);
        return null;
    }
}

function isTaskEditSchemaFallbackError(error) {
    return /column|schema|cache|updated_at|client_deadline|internal_due|original_|assigned_pic|assignment_updated|request_type/i.test(error?.message || '');
}

function buildTaskEditFallbackPayload(payload = {}, legacyOnly = false) {
    const clean = stripPICAssignmentPayloadFields({ ...payload });
    delete clean.updated_at;
    if (!legacyOnly) return clean;
    const legacyKeys = ['client_name', 'project_title', 'region', 'requester_name', 'job_type', 'objective', 'brief', 'deadline', 'assignee', 'playbook_link', 'ref_link'];
    return legacyKeys.reduce((acc, key) => {
        if (Object.prototype.hasOwnProperty.call(clean, key)) acc[key] = clean[key];
        return acc;
    }, {});
}

async function saveTaskEditPayloadToSupabase(jobID, payload) {
    const runUpdate = async (nextPayload) => {
        const result = await supabaseClient
            .from('creative_requests')
            .update(nextPayload)
            .eq('job_id', jobID)
            .select('*')
            .maybeSingle();
        return result;
    };

    let result = await runUpdate(payload);
    if (!result.error) return { row: result.data, usedFallback: false, payload };
    if (!isTaskEditSchemaFallbackError(result.error)) throw result.error;

    const fallbackPayload = buildTaskEditFallbackPayload(payload);
    result = await runUpdate(fallbackPayload);
    if (!result.error) return { row: result.data, usedFallback: true, payload: fallbackPayload };
    if (!isTaskEditSchemaFallbackError(result.error)) throw result.error;

    const legacyPayload = buildTaskEditFallbackPayload(payload, true);
    if (!Object.keys(legacyPayload).length) throw result.error;
    result = await runUpdate(legacyPayload);
    if (result.error) throw result.error;
    return { row: result.data, usedFallback: true, payload: legacyPayload };
}

function renderTaskEditPostSave(jobID) {
    renderDashboard();
    renderBoards();
    if (document.getElementById('calendar-section')?.classList.contains('active-section') || document.getElementById('dashboard')?.classList.contains('active')) {
        if (typeof renderCalendar === 'function') renderCalendar(getCalendarSourceTasks());
    }
    if (typeof isKanbanMode !== 'undefined' && isKanbanMode && typeof renderKanbanBoard === 'function') renderKanbanBoard();

    const detailModal = document.getElementById('globalDetailModal');
    if (detailModal?.classList.contains('show')) {
        openDetailModal(jobID, true);
    } else {
        openDetailModal(jobID);
    }
}

function buildTaskEditChangeMeta(changes = {}) {
    return {
        changed_fields: Object.keys(changes),
        changes
    };
}

function setupSwipeToClose(modalEl, bodyId, closeFn) {
    if(!modalEl) return;
    let sy = 0, cy = 0, pulling = false;
    modalEl.addEventListener('touchstart', e => {
        if(window.innerWidth > 992) return;
        const body = document.getElementById(bodyId);
        if(body && body.scrollTop > 0) return;
        sy = e.touches[0].clientY;
        pulling = true;
    }, {passive: true});

    modalEl.addEventListener('touchmove', e => {
        if(!pulling) return;
        cy = e.touches[0].clientY;
        let diff = cy - sy;
        if(diff > 0) {
            modalEl.style.transform = `translateY(${diff}px)`;
            modalEl.style.transition = 'none';
        }
    }, {passive: true});

    modalEl.addEventListener('touchend', e => {
        if(!pulling) return;
        pulling = false;
        let diff = cy - sy;
        modalEl.style.transition = 'transform 0.4s ease';
        if(diff > 120) {
            closeFn();
            setTimeout(() => { modalEl.style.transform = ''; }, 400);
        } else {
            modalEl.style.transform = '';
        }
    }, {passive: true});
}

function openDetailModal(jobID, isUpdate = false) {
    try {
        const item = globalData.find(d => d.job_id === jobID);
        if(!item) { console.error("Data tiada."); return; }

        const safeClient = String(item.client_name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const safeTitle = String(item.project_title || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const actualAssignee = getAssigneeDisplay(item.assignee);
        const actualRequester = (item.requester_name && item.requester_name !== 'null') ? item.requester_name : 'Unknown';

        const safeAssignee = String(actualAssignee).replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const safeRequester = String(actualRequester).replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const safeDeadline = String(getTaskClientDeadline(item) || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const wsRaw = String(item.work_status || 'Not started');
        const wsKey = normalizeWorkStatus(wsRaw);
        const ws = getWorkStatusLabel(wsRaw);
        const wsClass = `ws-${getWorkStatusSlug(wsRaw)}`;
        const isDoneTab = String(item.status).toLowerCase() === 'approved' && wsKey === 'done';
        const securePin = hasAdminAccess();
        const canEditTaskDetails = canCurrentUserEditTask(item).canEdit && !isDoneTab;
        const canEditPIC = canEditTaskDetails && String(item.status || '').toLowerCase() === 'approved';
        const canViewInternalDeadline = shouldUseInternalDeadlineForTask(item);
        const safePlaybook = escapeJsString(getTaskSafeHttpUrl(item.playbook_link) || '');
        const safeReferenceUrl = getTaskSafeHttpUrl(item.ref_link);

        document.getElementById('dm-jobid').innerText = `[${item.job_id}]`;
        document.getElementById('dm-title').innerText = `${item.client_name}: ${item.project_title}`;
        const modal = document.getElementById('globalDetailModal');
        if (modal) modal.dataset.currentJobId = item.job_id;

        let playbookBtnHtml = renderTaskPlaybookAction(item, canEditTaskDetails);

        // --- MULA LOGIK FORMAT BRIEF BERBEZA ---
        const briefText = String(item.brief || '');
        const isPitchDeck = String(item.job_type || '').toLowerCase().includes('pitch deck');
        const isShooting = getRequestTypeMeta(item).key === 'shooting';

        let formattedBriefHTML = '';

        if (isShooting) {
            // The Shooting panel below covers this ground (facts, talent/props, reference, notes) in
            // a purpose-built layout — the generic brief/remarks box would just duplicate it.
        } else if (isPitchDeck) {
            const formatPitchLinks = briefText.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color:var(--orange); font-weight: 600; text-decoration:underline; word-break:break-all;"><i data-lucide="external-link" style="width:14px; height:14px; vertical-align:middle;"></i> Open Link</a>').replace(/\n/g, '<br>');
            formattedBriefHTML = `<div style="background: rgba(245, 158, 11, 0.05); padding: 15px; border-radius: 8px; border: 1px solid rgba(245, 158, 11, 0.2);"><h4 style="color: var(--orange); margin: 0 0 10px 0; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;"><i data-lucide="presentation" style="width:16px; height:16px; vertical-align:middle; margin-right:5px;"></i> Pitch Deck Details</h4><p style="margin:0;">${formatPitchLinks}</p></div>`;
        } else {
            // 🌟 FIX 1: Auto-convert tiket lama (Detail: ... Size: ...) jadi bullet point kemas
            let cleanedBrief = briefText.replace(/- Detail: (.*?), Size: (.*?), Notes: (.*?)(?=\n|$)/g, (match, detail, size, notes) => {
                let noteStr = (notes && notes.trim() !== '-' && notes.trim() !== '') ? ` *(Note: ${notes.trim()})*` : '';
                let sizeStr = (size && size.trim() !== 'N/A' && size.trim() !== '') ? ` — ${size.trim()}` : '';
                return `• ${detail.trim()}${sizeStr}${noteStr}`;
            });

            const formattedBrief = cleanedBrief ? cleanedBrief.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color:var(--link-color); text-decoration:underline; word-break:break-all;">$1</a>').replace(/\n/g, '<br>') : 'No brief provided.';
            formattedBriefHTML = `<p><strong>Creative Brief & Plan:</strong><br>${formattedBrief}</p>`;
        }
        // --- TAMAT LOGIK FORMAT BRIEF ---

        // 🌟 FIX 2: Format Remarks yang bersepah supaya ada susunan, line break & bullet point
        let formattedRemarks = '';
        if (item.remarks) {
            formattedRemarks = String(item.remarks)
                .replace(/\n/g, '<br>') // Pastikan 'enter' asal berfungsi
                .replace(/ \*(?=\s)/g, '<br>•') // Tukar tanda ' * ' kepada bullet point di baris baru
                .replace(/(^| )(\d+)\. /g, '<br><br><strong>$2.</strong> ') // Tukar nombor ' 1. ' kepada baris baru & bold
                .replace(/^(?:<br>)+/, ''); // Buang line break lebihan kat atas sekali kalau ada
        }

        let bodyHtml = `
            ${playbookBtnHtml}
            <div class="job-details">
                <div class="detail-item"><span>Region</span><strong>${getFlag(item.region)} ${item.region || 'Malaysia'}</strong></div>
                <div class="detail-item"><span>Requester</span><strong>${actualRequester}</strong></div>
                <div class="detail-item detail-item-job-type"><span>Job Type</span>${renderJobTypeDetail(item)}</div>
                <div class="detail-item"><span>Client Deadline</span><strong style="color:var(--red);">${formatDate(getTaskClientDeadline(item))}</strong></div>
                ${canViewInternalDeadline ? `<div class="detail-item"><span>Internal Due</span><strong>${getTaskEffectiveInternalDueDate(item) ? formatDate(getTaskEffectiveInternalDueDate(item)) : 'No internal due'}</strong></div>` : ''}
                <div class="detail-item pic-detail"><span>Creative PIC</span>${canEditPIC ? renderPicEditor(item.job_id, actualAssignee) : `<strong>${actualAssignee}</strong>`}</div>
                <div class="detail-item"><span>Work Status</span>${String(item.status).toLowerCase() === 'pending' ? '<strong>-</strong>' : `${securePin && !isDoneTab ? `<select onchange="updateWorkStatusOptimistic('${item.job_id}', this.value)" class="ws-select ${wsClass}"><option value="Not started" ${wsKey === 'not started' ? 'selected' : ''}>Not started</option><option value="Drafting" ${wsKey === 'drafting' ? 'selected' : ''}>Drafting</option><option value="Partial Ready" ${wsKey === 'partial ready' ? 'selected' : ''}>Partial Ready</option><option value="Revision" ${wsKey === 'revision' ? 'selected' : ''}>Revision</option><option value="Internal Review" ${wsKey === 'internal review' ? 'selected' : ''}>Internal Review</option><option value="Client Review" ${wsKey === 'client review' ? 'selected' : ''}>Client Review</option><option value="${WORK_STATUS_AWAITING_CLIENT}" ${wsKey === 'awaiting client' ? 'selected' : ''}>Awaiting Client</option><option value="Done" ${wsKey === 'done' ? 'selected' : ''}>Done</option></select>` : `<strong class="ws-badge ${wsClass}">${ws}</strong>`}`}</div>
                <div class="detail-item"><span>Revision Count</span>${securePin && !isDoneTab ? `<div style="display:flex; align-items:center; gap:8px; margin-top:2px;"><button class="rev-btn" onclick="updateRevisionOptimistic(event, '${item.job_id}', ${item.revision || 0}, -1)">-</button><strong style="min-width:15px; text-align:center;">${item.revision || 0}</strong><button class="rev-btn" onclick="updateRevisionOptimistic(event, '${item.job_id}', ${item.revision || 0}, 1)">+</button></div>` : `<strong>${item.revision || 0}</strong>`}</div>
                ${(item.approver) ? `<div class="detail-item"><span>Approved By</span><strong>${item.approver}</strong></div>` : ''}
            </div>
            ${renderClientReviewDetailPanel(item)}
            ${renderAwaitingClientDetailPanel(item)}
            ${renderMonthlyFlowPanel(item)}
            ${renderShootingPanel(item)}
            ${renderTaskNotesBox(item)}
            ${renderAdminTrackingPanel(item)}
            ${renderTaskAccessCheckPanel(item)}
            ${isShooting ? '' : `
            <div class="brief-box">
                ${formattedBriefHTML}
                ${safeReferenceUrl ? `<p style="margin-top: 15px;"><strong>Reference:</strong> <a href="${escapeHtml(safeReferenceUrl)}" target="_blank" rel="noopener noreferrer">Click to view reference</a></p>` : ''}
                ${formattedRemarks ? `<p style="margin-top: 15px; line-height: 1.6;"><strong>Remarks:</strong><br>${formattedRemarks}</p>` : ''}
            </div>
            `}
        `;

        let footerHtml = '';
        const handleHtml = `<div class="dm-footer-handle-wrap" onclick="document.getElementById('dm-footer-content').classList.toggle('expanded')"><div class="dm-footer-handle"></div><span style="font-size:0.65rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px;">Action Menu</span></div>`;

        if (String(item.status).toLowerCase() === 'pending') {
            if (securePin) {
                warmPlaybookGenerator();
                bodyHtml += `<div class="assign-area"><label style="font-size: 0.85rem; font-weight: 600; margin-bottom: 10px; display: block; color: var(--text-main);">1. Select Creative PIC (Multiple Allowed):</label>${renderCreativePicGroups(item.job_id)}<label style="font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; margin-top: 20px; display: block; color: var(--text-main);">2. Generate Creative Playbook:</label><div style="display:flex; gap:10px; margin-bottom: 15px; flex-wrap:wrap;">${renderPlaybookGenerateField(item, safeClient, safeTitle, safeRequester)}</div></div>`;
                footerHtml = handleHtml + `<div class="action-buttons"><button id="btn-approve-${item.job_id}" onclick="approveJob('${item.job_id}', '${safeClient}', '${safeTitle}')" class="btn-action btn-approve"><i data-lucide="check"></i> Approve & Assign</button><button onclick="openEditModal('${item.job_id}')" class="btn-action btn-copy"><i data-lucide="edit-2"></i> Edit Request</button><button onclick="deleteJob('${item.job_id}')" class="btn-action btn-delete"><i data-lucide="trash-2"></i> Delete</button></div>`;
            } else {
                bodyHtml += `<div class="locked-msg"><i data-lucide="lock"></i> Status: Reviewing requirements. Awaiting Admin Assignment.</div>`;
            }
        } else {
            if (securePin && !isDoneTab) {
                footerHtml = handleHtml + `<div class="action-buttons"><button onclick="copyText('requester', '${item.job_id}', '${safeClient}', '${safeTitle}', '${safeAssignee}', '${safeDeadline}', '${safePlaybook}', '${safeRequester}')" class="btn-action btn-copy"><i data-lucide="copy"></i> Msg: Requester</button><button onclick="copyText('team', '${item.job_id}', '${safeClient}', '${safeTitle}', '${safeAssignee}', '${safeDeadline}', '${safePlaybook}', '')" class="btn-action btn-copy"><i data-lucide="copy"></i> Msg: Team</button>${wsKey === 'client review' ? `<button onclick="copyText('review', '${item.job_id}', '${safeClient}', '${safeTitle}', '${safeAssignee}', '${safeDeadline}', '${safePlaybook}', '${safeRequester}')" class="btn-action" style="background: #8b5cf6; color: white; border: none;"><i data-lucide="mail"></i> Msg: Review</button>` : ''}${wsKey === 'client review' ? `<button onclick="copyText('chase_client', '${item.job_id}', '${safeClient}', '${safeTitle}', '${safeAssignee}', '${safeDeadline}', '${safePlaybook}', '${safeRequester}')" class="btn-action" style="background: #0ea5e9; color: white; border: none;"><i data-lucide="message-circle"></i> Chase Requester</button>` : ''}${wsKey === 'revision' ? `<button onclick="copyText('revision_alert', '${item.job_id}', '${safeClient}', '${safeTitle}', '${safeAssignee}', '${safeDeadline}', '${safePlaybook}', '')" class="btn-action" style="background: #ea580c; color: white; border: none;"><i data-lucide="alert-circle"></i> Msg: Revision</button>` : ''}<button onclick="copyText('chase', '${item.job_id}', '${safeClient}', '${safeTitle}', '${safeAssignee}', '${safeDeadline}', '${safePlaybook}', '')" class="btn-action" style="background: var(--orange); color: white; border: none;"><i data-lucide="bell-ring"></i> Chase Status</button><button onclick="openEditModal('${item.job_id}')" class="btn-action btn-copy"><i data-lucide="edit-2"></i> Edit</button><button onclick="deleteJob('${item.job_id}')" class="btn-action btn-delete"><i data-lucide="trash-2"></i> Delete</button></div>`;
            } else if (securePin && isDoneTab) {
                footerHtml = handleHtml + `<div class="action-buttons"><button onclick="copyText('done_team', '${item.job_id}', '${safeClient}', '${safeTitle}', '${safeAssignee}', '${safeDeadline}', '${safePlaybook}', '${safeRequester}')" class="btn-action btn-copy" style="flex:1; background: var(--green); color: white; border: none;"><i data-lucide="check-circle"></i> Msg: Team (Done)</button><select onchange="updateWorkStatusOptimistic('${item.job_id}', this.value)" class="ws-select" style="background: var(--text-muted); flex: 1;"><option value="">Undo Status...</option><option value="Client Review">Move back to Review</option></select><button onclick="deleteJob('${item.job_id}')" class="btn-action btn-delete" style="flex: 1;"><i data-lucide="trash-2"></i> Delete Record</button></div>`;
            }
        }

        document.getElementById('dm-body-content').innerHTML = bodyHtml;
        document.getElementById('dm-footer-content').innerHTML = footerHtml;
        document.getElementById('dm-footer-content').style.display = footerHtml ? 'block' : 'none';
        document.getElementById('dm-footer-content').classList.remove('expanded');

        refreshIcons();

        if(!isUpdate) {
            document.body.classList.add('no-scroll');
            modal.style.display = 'flex';
            modal.offsetHeight;
            modal.classList.add('show');
            // Notes/activity history for this task loads on demand instead of being kept resident
            // for every task in memory — the panel above renders instantly from whatever's cached
            // (often just this session's optimistic entries), then gets patched in place once the
            // full per-task history lands.
            loadTaskLogsThenRefreshModal(jobID);
            if (isShooting) loadShootChecklistThenRefresh(jobID);
        }

    } catch (err) {
        console.error("Ralat masa buka Modal:", err);
        showAppleAlert("Technical Error", "Ada ralat teknikal: " + err.message, { tone: "danger", icon: "alert-triangle" });
    }
}

async function loadTaskLogsThenRefreshModal(jobID) {
    await fetchTaskLogsForJob(jobID);
    const modal = document.getElementById('globalDetailModal');
    if (modal && modal.classList.contains('show') && modal.dataset.currentJobId === jobID) {
        openDetailModal(jobID, true);
    }
}
// ========================================================
// 🌟 10. PENGURUSAN DATA SUPABASE (SUBMIT / EDIT / DELETE)
// ========================================================
// ========================================================
// 🌟 SHOOTING WORKFLOW — request creation (dedicated single-scroll form)
// ========================================================

function setShootToggle(field, value) {
    const valueInput = document.getElementById(`shoot${field}Value`);
    if (valueInput) valueInput.value = value;
    const toggleWrap = document.getElementById(`shoot${field}Toggle`);
    if (toggleWrap) toggleWrap.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.value === value));
    const fieldsWrap = document.getElementById(`shoot${field}Fields`);
    if (fieldsWrap) fieldsWrap.style.display = value === 'yes' ? 'flex' : 'none';
}

// select.value is the literal string "manual" when "Not in the list" is chosen — resolve down to
// the actual typed name in that case, same as the sign-in screen's startApp() does.
function getShootRequesterName() {
    const sel = document.getElementById('shootRequesterName')?.value || '';
    if (sel === 'manual') return (document.getElementById('shootManualName')?.value || '').trim();
    return sel;
}

// Preset-answer fields (What are we shooting, Deliverables, Location, Props what/who): each is a
// <select id="X"> of industry-standard options ending in "Not in the list" (value="other"), paired
// with a free-text fallback <input/textarea id="XOther"> inside a #XOtherRow wrapper that's only
// shown once "Not in the list" is picked. Keeps the request fast for the common cases while never
// blocking the uncommon one — same shape as the Requester Name picker.
function toggleShootPresetOther(id) {
    const select = document.getElementById(id);
    const row = document.getElementById(id + 'OtherRow');
    if (!select || !row) return;
    const isOther = select.value === 'other';
    row.style.display = isOther ? 'flex' : 'none';
    if (isOther) document.getElementById(id + 'Other')?.focus();
}

function getShootPresetValue(id) {
    const select = document.getElementById(id);
    if (!select) return '';
    if (select.value === 'other') return (document.getElementById(id + 'Other')?.value || '').trim();
    return select.value;
}

// Multi-select variant of the preset-answer pattern, used for "What are we shooting?" — a shoot can
// legitimately be more than one type (e.g. product photos + an interview on the same day).
function toggleShootCheckboxOther(boxId, otherRowId, otherFieldId) {
    const box = document.getElementById(boxId);
    const row = document.getElementById(otherRowId);
    if (!box || !row) return;
    const isOther = Boolean(box.querySelector('input[value="other"]')?.checked);
    row.style.display = isOther ? 'flex' : 'none';
    if (isOther) document.getElementById(otherFieldId)?.focus();
}

function getShootCheckboxValue(boxId, otherFieldId) {
    const box = document.getElementById(boxId);
    if (!box) return '';
    const parts = [];
    box.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
        if (cb.value === 'other') {
            const otherVal = (document.getElementById(otherFieldId)?.value || '').trim();
            if (otherVal) parts.push(otherVal);
        } else {
            parts.push(cb.value);
        }
    });
    return parts.join(', ');
}

// Reverse of getShootPresetValue() — prefills a preset <select> from a stored string. Exact preset
// match selects it; anything else (including free text saved via an earlier "Not in the list") falls
// into "other" with the value carried into the paired free-text field. Used by the Edit Shoot
// Details modal, which unlike the create form starts from an already-saved value.
function setShootPresetValue(id, storedValue) {
    const select = document.getElementById(id);
    if (!select) return;
    const val = String(storedValue || '');
    const hasOption = val && Array.from(select.options).some(o => o.value === val);
    if (hasOption) {
        select.value = val;
    } else if (val) {
        select.value = 'other';
        const otherField = document.getElementById(id + 'Other');
        if (otherField) otherField.value = val;
    } else {
        select.value = '';
    }
    toggleShootPresetOther(id);
}

// Reverse of getShootCheckboxValue() — prefills a preset checkbox group from a stored comma-joined
// string. Parts that match a known preset get checked directly; anything left over gets bundled into
// "Not in the list" so it's never silently dropped.
function setShootCheckboxValue(boxId, otherRowId, otherFieldId, storedValue) {
    const box = document.getElementById(boxId);
    if (!box) return;
    const checkboxes = Array.from(box.querySelectorAll('input[type="checkbox"]'));
    const presetValues = new Set(checkboxes.map(cb => cb.value).filter(v => v !== 'other'));
    const parts = String(storedValue || '').split(',').map(s => s.trim()).filter(Boolean);
    const matched = parts.filter(p => presetValues.has(p));
    const unmatched = parts.filter(p => !presetValues.has(p));

    checkboxes.forEach(cb => { cb.checked = cb.value !== 'other' && matched.includes(cb.value); });
    const otherCb = box.querySelector('input[value="other"]');
    if (otherCb) otherCb.checked = unmatched.length > 0;
    const otherField = document.getElementById(otherFieldId);
    if (otherField) otherField.value = unmatched.join(', ');

    toggleShootCheckboxOther(boxId, otherRowId, otherFieldId);
}

// Multi-day shoots: the primary Shoot Date/checklist stays single — these are purely informational
// extra dates shown on the Shooting panel and Copy Shoot Brief, editable from both the create form
// and the Edit Shoot Details modal via the same container-scoped row functions.
function addShootExtraDayRow(containerId, prefill = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const row = document.createElement('div');
    row.className = 'shoot-extra-day-row';
    row.innerHTML = `
        <input type="date" class="shoot-extra-day-date" value="${escapeHtml(prefill.date || '')}">
        <input type="text" class="shoot-extra-day-label" placeholder="e.g. Day 2 - Talent shoot" value="${escapeHtml(prefill.label || '')}">
        <button type="button" onclick="this.parentElement.remove()" aria-label="Remove day"><i data-lucide="x"></i></button>
    `;
    container.appendChild(row);
    refreshIcons();
}

function ensureShootExtraDayRow(containerId) {
    const container = document.getElementById(containerId);
    if (container && !container.children.length) addShootExtraDayRow(containerId);
}

function getShootExtraDays(containerId) {
    return Array.from(document.querySelectorAll(`#${containerId} .shoot-extra-day-row`))
        .map(row => ({
            date: row.querySelector('.shoot-extra-day-date')?.value || '',
            label: (row.querySelector('.shoot-extra-day-label')?.value || '').trim()
        }))
        .filter(d => d.date || d.label);
}

function renderShootExtraDaysInto(containerId, days) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    (days || []).forEach(d => addShootExtraDayRow(containerId, d));
}

// Scoped to #shooting-form-area (not the plain global .form-step selector used by goToStep()) —
// both wizards' step containers share the .form-step class and live in the DOM at the same time, so
// an unscoped query would also toggle the Ad-hoc/Monthly/Pitch wizard's steps.
function goToShootStep(step) {
    if (step === 2) {
        if (!getShootRequesterName()) return showAppleAlert("Incomplete Info", "Please tell us your name before proceeding.");
        syncShootIdentity(); // safety net — the field's own onchange only fires on blur
    }
    if (step === 3) {
        const client = document.getElementById('shootClient').value.trim();
        const project = document.getElementById('shootProject').value.trim();
        const what = getShootCheckboxValue('shootWhatBox', 'shootWhatOther');
        const date = document.getElementById('shootDate').value;
        const location = getShootPresetValue('shootLocation');
        if (!client || !project || !what || !date || !location) {
            return showAppleAlert("Incomplete Info", "Please fill in Client, Project, What are we shooting, Shoot Date and Location before proceeding.");
        }
        if (document.getElementById('shootMultiDayValue').value === 'yes' && !getShootExtraDays('shootExtraDaysContainer').length) {
            return showAppleAlert("Incomplete Info", "Please add at least one additional shoot day, or set Multi-day shoot to No.");
        }
    }
    document.querySelectorAll('#shooting-form-area .form-step').forEach(el => el.classList.remove('active'));
    document.getElementById('shoot-step' + step).classList.add('active');
    document.getElementById('shoot-ind-1').className = 'step-indicator ' + (step >= 1 ? (step > 1 ? 'completed' : 'active') : '');
    document.getElementById('shoot-ind-2').className = 'step-indicator ' + (step >= 2 ? (step > 2 ? 'completed' : 'active') : '');
    document.getElementById('shoot-ind-3').className = 'step-indicator ' + (step >= 3 ? 'active' : '');
    refreshIcons();
}

function toggleShootMoreDetails() {
    const box = document.getElementById('shootMoreDetails');
    const btn = document.getElementById('shootMoreDetailsBtn');
    if (!box) return;
    const isOpen = box.style.display === 'block';
    box.style.display = isOpen ? 'none' : 'block';
    if (btn) btn.innerHTML = isOpen ? '<i data-lucide="plus"></i> Add more shoot details' : '<i data-lucide="minus"></i> Hide extra details';
    refreshIcons();
}

function populateShootClientDatalist() {
    const dl = document.getElementById('shootClientList');
    if (!dl) return;
    dl.innerHTML = (window.allClients || []).map(n => `<option value="${escapeHtml(n)}"></option>`).join('');
}

// Same picker as the sign-in screen (chooseCountry()): live team list for the selected region, plus
// a trailing "Not in the list" option that reveals the free-text field. Only Malaysia/Indonesia have
// a seeded team list today — other regions just show "Not in the list", same as everywhere else.
function populateShootRequesterOptions() {
    const region = document.getElementById('shootRegion')?.value;
    const select = document.getElementById('shootRequesterName');
    if (!select) return;

    let names = [];
    if (region === 'Malaysia') names = allStaffMY;
    else if (region === 'Indonesia') names = allStaffID;

    const previousVal = select.value;
    const savedName = localStorage.getItem('adtech_user_name');

    select.innerHTML = `<option value="">-- Select Name --</option>`
        + names.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('')
        + `<option value="manual">Not in the list</option>`;

    if (savedName && names.includes(savedName)) select.value = savedName;
    else if (previousVal && Array.from(select.options).some(o => o.value === previousVal)) select.value = previousVal;

    toggleShootManualName();
}

function toggleShootManualName() {
    const select = document.getElementById('shootRequesterName');
    const row = document.getElementById('shootManualNameRow');
    const manual = document.getElementById('shootManualName');
    if (!select || !row || !manual) return;
    if (select.value === 'manual') {
        row.style.display = 'flex';
        manual.focus();
    } else {
        row.style.display = 'none';
    }
}

// Mirrors startApp()'s sign-in write: whoever this step resolves to becomes this browser's
// platform-wide identity too (same as signing in), so it's remembered everywhere else in the app —
// notifications, "completed by" on checklists, etc. — without asking again next time.
function syncShootIdentity() {
    const select = document.getElementById('shootRequesterName');
    const manual = document.getElementById('shootManualName');
    const region = document.getElementById('shootRegion')?.value;
    if (!select) return;

    const finalName = select.value === 'manual' ? (manual?.value || '').trim() : select.value;
    if (finalName) {
        localStorage.setItem('adtech_user_name', finalName);
        if (region) userRegion = region;
    }
    if (region) localStorage.setItem('adtech_region', region);
}

function openShootingRequestForm() {
    const area = document.getElementById('shooting-form-area');
    if (!area) return;
    area.style.display = 'block';
    populateShootClientDatalist();

    const savedRegion = localStorage.getItem('adtech_region');
    const regionSelect = document.getElementById('shootRegion');
    if (regionSelect) {
        const validSavedRegion = savedRegion && Array.from(regionSelect.options).some(o => o.value === savedRegion);
        const validUserRegion = userRegion && Array.from(regionSelect.options).some(o => o.value === userRegion);
        regionSelect.value = validSavedRegion ? savedRegion : (validUserRegion ? userRegion : regionSelect.options[0].value);
    }
    populateShootRequesterOptions();

    const savedName = localStorage.getItem('adtech_user_name');
    const nameSelect = document.getElementById('shootRequesterName');
    if (savedName && nameSelect && !Array.from(nameSelect.options).some(o => o.value === savedName)) {
        // Signed-in identity isn't in this region's live list (region has no seeded team, or it was a
        // manually-entered name at sign-in) — go straight to "Not in the list", pre-filled with it.
        nameSelect.value = 'manual';
        document.getElementById('shootManualName').value = savedName;
    }
    toggleShootManualName();

    setShootToggle('Talent', 'no');
    setShootToggle('Props', 'no');
    setShootToggle('MultiDay', 'no');
    // Guard against stray state left over from an abandoned session (opened, filled some of the
    // form, hit "Back to Options" without submitting, then reopened) — Back to Options only hides
    // the form, it doesn't clear it.
    document.querySelectorAll('#shootWhatBox input[type="checkbox"]').forEach(cb => cb.checked = false);
    const extraDays = document.getElementById('shootExtraDaysContainer');
    if (extraDays) extraDays.innerHTML = '';
    area.querySelectorAll('[id$="OtherRow"]').forEach(el => el.style.display = 'none');
    const moreBox = document.getElementById('shootMoreDetails');
    if (moreBox) moreBox.style.display = 'none';
    goToShootStep(1);

    window.scrollTo({ top: 0, behavior: 'smooth' });
    refreshIcons();
}

function resetShootingFormUI() {
    const area = document.getElementById('shooting-form-area');
    if (!area) return;
    area.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]), textarea').forEach(el => el.value = '');
    area.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    area.querySelectorAll('select').forEach(el => el.selectedIndex = 0);
    setShootToggle('Talent', 'no');
    setShootToggle('Props', 'no');
    setShootToggle('MultiDay', 'no');
    const extraDays = document.getElementById('shootExtraDaysContainer');
    if (extraDays) extraDays.innerHTML = '';
    const moreBox = document.getElementById('shootMoreDetails');
    if (moreBox) moreBox.style.display = 'none';
    area.querySelectorAll('[id$="OtherRow"]').forEach(el => el.style.display = 'none');
    const manualRow = document.getElementById('shootManualNameRow');
    if (manualRow) manualRow.style.display = 'none';
    goToShootStep(1);
    resetRequestGateway();
}

async function submitShootingRequest() {
    const name = getShootRequesterName();
    const region = document.getElementById('shootRegion').value || userRegion;
    const client = document.getElementById('shootClient').value.trim();
    const project = document.getElementById('shootProject').value.trim();
    const whatShooting = getShootCheckboxValue('shootWhatBox', 'shootWhatOther');
    const shootDate = document.getElementById('shootDate').value;
    const location = getShootPresetValue('shootLocation');
    const deadline = document.getElementById('shootDeadline').value;

    if (!name || !client || !project || !whatShooting || !shootDate || !location || !deadline) {
        return showAppleAlert('Incomplete Fields', 'Please fill in Name, Client, Project, What are we shooting, Shoot Date, Location and Client Deadline.');
    }

    const talentRequired = document.getElementById('shootTalentValue').value === 'yes';
    const talentName = document.getElementById('shootTalentName').value.trim();
    const talentStatus = document.getElementById('shootTalentStatus').value;
    const propsRequired = document.getElementById('shootPropsValue').value === 'yes';
    const propsWhat = getShootPresetValue('shootPropsWhat');
    const propsWho = getShootPresetValue('shootPropsWho');

    if (talentRequired && !talentName) {
        return showAppleAlert('Missing Talent Info', 'Please add the talent name, or set Talent Required to No.');
    }
    if (propsRequired && !propsWhat) {
        return showAppleAlert('Missing Product/Props Info', 'Please describe what is required, or set Product/Props Required to No.');
    }
    if (document.getElementById('shootMultiDayValue').value === 'yes' && !getShootExtraDays('shootExtraDaysContainer').length) {
        return showAppleAlert('Missing Shoot Days', 'Please add at least one additional shoot day, or set Multi-day shoot to No.');
    }

    const callTime = document.getElementById('shootCallTime').value;
    const multiDay = document.getElementById('shootMultiDayValue').value === 'yes';
    const extraShootDays = multiDay ? getShootExtraDays('shootExtraDaysContainer') : [];
    const deliverables = getShootPresetValue('shootDeliverables');
    const mapLink = document.getElementById('shootMapLink').value.trim();
    const onsitePic = document.getElementById('shootOnsitePic').value.trim();
    const referenceLink = document.getElementById('shootRef').value.trim();
    const importantNotes = document.getElementById('shootNotes').value.trim();

    // Optional / collapsed "+ Add more shoot details" fields — none of these block submission.
    const endTime = document.getElementById('shootEndTime').value;
    const wardrobe = document.getElementById('shootWardrobe').value.trim();
    const shotList = document.getElementById('shootShotList').value.trim();
    const equipmentNotes = document.getElementById('shootEquipment').value.trim();
    const locationAccess = document.getElementById('shootLocationAccess').value.trim();
    const additionalContacts = document.getElementById('shootAdditionalContacts').value.trim();
    const productionNotes = document.getElementById('shootProductionNotes').value.trim();

    const submitBtn = document.getElementById('shootSubmitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Submitting...';
    refreshIcons();
    submitBtn.disabled = true;

    try {
        await supabaseClient.from('clients').upsert([{ name: client, region }], { onConflict: 'name', ignoreDuplicates: true });
        fetchClientsList();
    } catch (e) {
        console.log('Silent error saving new client:', e.message);
    }

    try {
        const { data: existingJobs } = await supabaseClient.from('creative_requests').select('job_id');
        const finalJobID = generateNextJobID(client, existingJobs || []);

        const shootDetails = {
            call_time: callTime || '',
            location,
            map_link: mapLink,
            what_shooting: whatShooting,
            deliverables,
            onsite_pic: onsitePic,
            talent: talentRequired ? { required: true, name: talentName, status: talentStatus } : { required: false },
            props: propsRequired ? { required: true, what: propsWhat, who: propsWho } : { required: false },
            additional_shoot_days: extraShootDays,
            reference_link: referenceLink,
            important_notes: importantNotes,
            optional: {
                end_time: endTime || '', wardrobe, shot_list: shotList, equipment_notes: equipmentNotes,
                location_access: locationAccess, additional_contacts: additionalContacts, production_notes: productionNotes
            }
        };

        // Plain-text fallback so search/CSV export/older reporting that reads `brief` still sees
        // something sensible — the real UI reads shoot_details (structured) via the Shooting panel.
        const briefLines = [
            '[SHOOTING REQUEST]',
            `What: ${whatShooting}`,
            deliverables ? `Deliverables: ${deliverables}` : '',
            `Shoot Date: ${formatDate(shootDate)}${callTime ? ' ' + callTime : ''}`,
            extraShootDays.length ? `Additional Shoot Days: ${extraShootDays.map(d => `${formatDate(d.date)}${d.label ? ' - ' + d.label : ''}`).join('; ')}` : '',
            `Location: ${location}`,
            talentRequired ? `Talent: ${talentName} (${talentStatus})` : 'Talent: Not required',
            propsRequired ? `Product/Props: ${propsWhat} (brought by ${propsWho || 'TBC'})` : 'Product/Props: Not required',
            importantNotes ? `Notes: ${importantNotes}` : ''
        ].filter(Boolean);

        const payload = {
            job_id: finalJobID, requester_name: name, region, client_name: client, project_title: project,
            job_type: 'Shooting', objective: 'Shooting', brief: briefLines.join('\n'),
            deadline, client_deadline: deadline, original_client_deadline: deadline,
            ref_link: referenceLink, remarks: '', status: 'pending', assignee: 'Unassigned',
            playbook_link: '', work_status: 'Not started', revision: 0, approver: '',
            shoot_date: shootDate, shoot_details: shootDetails
        };

        const { error } = await supabaseClient.from('creative_requests').insert([payload]);
        if (error) throw new Error(error.message);

        globalData.unshift(payload);
        logTaskActivity(finalJobID, 'submitted', '', 'pending', `Shooting request submitted by ${name}`, { region, job_type: 'Shooting', client_deadline: deadline, shoot_date: shootDate });

        // Without this, the new job has no entry in shootReadinessByJob (it only gets populated on
        // the next full Supabase fetch/realtime tick), so its Board/Kanban readiness chip would be
        // silently missing until something else happens to refresh the page.
        await fetchShootReadinessSummaryForCurrentAccess();
        renderActiveViewsAfterTaskDataChange();

        // Deliberately NO Telegram notification here in this MVP: the existing submitRequest() fires
        // an ungated fetch() straight to the PRODUCTION Telegram bot regardless of IS_LOCAL_HOST (a
        // pre-existing, already-flagged behaviour — see PRODUCTION_GAS_API's comment block). Wiring
        // Shooting into that during local development would mean every local test sends a real
        // message to production Telegram, which this task explicitly must not do. Add it the same
        // way the other request types do before a production rollout, if wanted.

        document.getElementById('successSubText').innerText = `Job ID: ${finalJobID}`;
        document.getElementById('successOverlay').classList.add('show');
        playSuccessSound();

        resetShootingFormUI();
    } catch (err) {
        showAppleAlert('Submission Failed', err.message || 'Something went wrong. Please try again.', { tone: 'danger' });
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        refreshIcons();
    }
}

async function submitRequest() {
    const name = document.getElementById('requesterName').value || document.getElementById('manualName').value;
    const client = document.getElementById('pClient').value.trim();
    const projectTitle = document.getElementById('pTitle').value;
    const deadline = document.getElementById('pDeadline').value;
    const region = document.getElementById('pRegion').value || userRegion;

    if(!name || !client || !deadline) return showAppleAlert("Incomplete Fields", "Please fill in Name, Client, and Deadline.");

    // Auto-Simpan nama client ke database jika belum wujud
    try {
        await supabaseClient.from('clients').upsert([{ name: client, region: region }], { onConflict: 'name', ignoreDuplicates: true });
        fetchClientsList();
    } catch(e) {
        console.log("Silent error saving new client:", e.message);
    }

    // 🌟 LOGIK BARU: Smart Validation untuk Ad-Hoc & Monthly (Masuk Copywriting Style)
    if (currentRequestType !== 'pitch') {
        const hook = document.getElementById('briefHook') ? document.getElementById('briefHook').value.trim() : '';
        const audience = document.getElementById('briefAudience') ? document.getElementById('briefAudience').value.trim() : '';
        const vibe = document.getElementById('briefVibe') ? document.getElementById('briefVibe').value.trim() : '';
        const copyStyle = document.getElementById('copyStyleInput') ? document.getElementById('copyStyleInput').value : '';

        if (!copyStyle || !hook || !audience || !vibe) {
            return showAppleAlert("Incomplete Brief", "Please select a Copywriting Tone, and fill in The Big Idea, Target Audience, and Tone & Vibe. Designers cannot read minds!");
        }

        if (!vibe.includes('http') && !vibe.includes('www.')) {
            return showAppleAlert("Missing Reference", "Please include a valid URL (http/www) in the 'Tone, Vibe & Reference' box. We need a visual reference!");
        }
    }

    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Submitting...';
    refreshIcons();
    submitBtn.disabled = true;

    try {
        // 1. LOGIK PENJANAAN ID
        const { data: existingJobs } = await supabaseClient.from('creative_requests').select('job_id');
        const finalJobID = generateNextJobID(client, existingJobs || []);

        // 2. KUMPUL DATA BORANG
        let objective = Array.from(document.querySelectorAll('#jobObjectives input[type="checkbox"]:checked')).map(cb => cb.value).join(', ');
        const otherInput = document.getElementById('objectiveOtherInput');
        if (otherInput && otherInput.value.trim()) {
            objective = (objective ? objective + ', ' : '') + 'Other: ' + otherInput.value.trim();
        }
        if (!objective) objective = 'N/A';

        let types = ""; let compiledSizes = "";
        let fullBrief = "";

        // 🌟 LOGIK BARU: Format Brief beserta Copywriting Tone
        if (currentRequestType !== 'pitch') {
            const hook = document.getElementById('briefHook') ? document.getElementById('briefHook').value.trim() : '';
            const audience = document.getElementById('briefAudience') ? document.getElementById('briefAudience').value.trim() : '';
            const vibe = document.getElementById('briefVibe') ? document.getElementById('briefVibe').value.trim() : '';
            const mandatory = document.getElementById('briefMandatory') ? document.getElementById('briefMandatory').value.trim() : 'None';
            const copyStyle = document.getElementById('copyStyleInput') ? document.getElementById('copyStyleInput').value : 'Not specified';

            // 🌟 FIX FORMAT: Buang titik bertindih (:)
            fullBrief = `[COPYWRITING TONE / STYLE]\n${copyStyle}\n\n[MAIN MESSAGE / HOOK]\n${hook}\n\n[TARGET AUDIENCE]\n${audience}\n\n[TONE, VIBE & REFERENCE]\n${vibe}\n\n[MANDATORY / NO-GO]\n${mandatory}`;
        } else {
            fullBrief = document.getElementById('pBrief') ? document.getElementById('pBrief').value : '';
        }

        // TANGKAP JENIS REQUEST DENGAN BETUL
        if (currentRequestType === 'monthly') {
            types = "Monthly Content Plan";
            const sCount = document.getElementById('mStatic').value || 0;
            const vCount = document.getElementById('mVideo').value || 0;
            const cCount = document.getElementById('mCarousel').value || 0;
            const capCount = document.getElementById('mCaption') ? document.getElementById('mCaption').value : 0;

            // 🌟 FIX FORMAT: Bentuk bullet point untuk plan bulanan
            compiledSizes = `• Static Posters — ${sCount}\n• Videos / Reels — ${vCount}\n• Carousels — ${cCount}\n• Caption Only — ${capCount}\n`;

        } else if (currentRequestType === 'pitch') {
            types = "Pitch Deck Proposal";
            objective = "Pitch / Proposal"; // Override objective supaya kemas

            const pitchSupport = Array.from(document.querySelectorAll('#pitchSupportTypes input[type="checkbox"]:checked')).map(cb => cb.value).join(', ');
            const pitchIdea = document.getElementById('pPitchIdea') ? document.getElementById('pPitchIdea').value.trim() : '';
            const pitchDraft = document.getElementById('pPitchDraft') ? document.getElementById('pPitchDraft').value.trim() : '';
            const pitchAsset = document.getElementById('pPitchAsset') ? document.getElementById('pPitchAsset').value.trim() : '';
            const pitchDate = document.getElementById('pPitchDate') ? document.getElementById('pPitchDate').value : '';

            if(!pitchDraft || !pitchAsset) throw new Error("Draft Deck Link and Brand Assets are mandatory for Pitch Deck.");

            // 🌟 FIX FORMAT: Buang titik bertindih (:)
            fullBrief = `[PITCH STRATEGY / BIG IDEA]\n${pitchIdea || 'N/A'}\n\n[PITCH SUPPORT NEEDED]\n${pitchSupport || 'N/A'}\n\n[DRAFT DECK LINK]\n${pitchDraft}\n\n[BRAND ASSETS]\n${pitchAsset}\n\n[ACTUAL PITCH DATE]\n${pitchDate ? formatDate(pitchDate) : 'Not specified'}`;

        } else {
            types = Array.from(document.querySelectorAll('#jobTypes input:checked')).map(cb => cb.value).join(', ');
            const sizeRows = document.querySelectorAll('.size-row');
            sizeRows.forEach(row => {
                const sDetail = row.querySelector('.dyn-size-detail').value.trim();
                const sInput = row.querySelector('.dyn-size-input').value.trim();
                const sNotes = row.querySelector('.dyn-size-notes').value.trim();

                if (sDetail || sInput) {
                    // 🌟 FIX FORMAT: Gaya bullet point kemas & sembunyikan Note kalau kosong
                    let noteStr = (sNotes && sNotes !== '-') ? ` *(Note: ${sNotes})*` : '';
                    let formatDetail = sDetail || 'N/A';
                    let formatSize = sInput ? ` — ${sInput}` : '';

                    compiledSizes += `• ${formatDetail}${formatSize}${noteStr}\n`;
                }
            });
        }

        // Cantumkan brief mengikut jenis
        if (compiledSizes) fullBrief = "[DELIVERABLES REQUIRED]\n" + compiledSizes + "\n" + fullBrief;

        if (currentRequestType !== 'pitch') {
            const monthlyPlan = document.getElementById('pMonthlyPlan') ? document.getElementById('pMonthlyPlan').value : '';
            if(monthlyPlan) fullBrief += "\n\n[MONTHLY PLAN DETAILS]\n" + monthlyPlan;
        }

        const deadlinePlan = generateSuggestedInternalDueForTask({
            job_type: types,
            request_type: currentRequestType,
            project_title: projectTitle,
            objective,
            brief: fullBrief,
            client_deadline: deadline
        });
        if (deadlinePlan.flag === 'client-deadline-passed') {
            throw new Error('Client deadline has already passed. Please choose today or a future date, or ask an admin to review it.');
        }
        const payload = {
            job_id: finalJobID, requester_name: name, region: region, client_name: client, project_title: projectTitle,
            job_type: types, objective: objective, brief: fullBrief, deadline: deadline, client_deadline: deadline, original_client_deadline: deadline, internal_due_date: deadlinePlan.date || null, original_internal_due_date: deadlinePlan.date || null, internal_due_source: deadlinePlan.date ? 'system_generated' : null, internal_due_manually_adjusted: false, ref_link: document.getElementById('pRefLink').value,
            remarks: document.getElementById('pRemarks').value, status: 'pending', assignee: 'Unassigned', playbook_link: '', work_status: 'Not started', revision: 0, approver: ''
        };

        // 3. HANTAR KE SUPABASE
        let { error } = await supabaseClient.from('creative_requests').insert([payload]);
        if (error && /column|schema|cache|client_deadline|original_client_deadline|internal_due/i.test(error.message || '')) {
            const fallbackPayload = { ...payload };
            delete fallbackPayload.client_deadline;
            delete fallbackPayload.original_client_deadline;
            delete fallbackPayload.internal_due_date;
            delete fallbackPayload.original_internal_due_date;
            delete fallbackPayload.internal_due_source;
            delete fallbackPayload.internal_due_manually_adjusted;
            const retry = await supabaseClient.from('creative_requests').insert([fallbackPayload]);
            error = retry.error;
        }
        if (error) throw new Error(error.message);

        // Optimistic Update
        globalData.unshift(payload);
        logTaskActivity(finalJobID, 'submitted', '', 'pending', `Request submitted by ${name}`, { region, job_type: types, client_deadline: deadline, internal_due_date: deadlinePlan.date, internal_due_source: 'system_generated', buffer_working_days: deadlinePlan.bufferDays, complexity: deadlinePlan.complexity, lead_time_flag: deadlinePlan.flag });

        const flag = getFlag(region);
        const tgMsg = `[NEW REQUEST] ${flag}\n\n*ID:* ${finalJobID}\n*Client:* ${client}\n*By:* ${name}\n\n🔗 [Open Adtechinno App](https://adtechinno-creativeengine.vercel.app/)`;
        fetch(TELEGRAM_API, { method: 'POST', body: JSON.stringify({ action: 'send_telegram', text: tgMsg }) });

        document.getElementById('successSubText').innerText = `Job ID: ${finalJobID}`;
        const overlay = document.getElementById('successOverlay');
        overlay.classList.add('show');
        playSuccessSound();

        // 4. RESET BORANG & KEMBALIKAN LOCALSTORAGE
        document.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]), textarea, select').forEach(el => el.value = '');
        document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(el => el.checked = false);
        if(document.getElementById('objectiveOtherInput')) document.getElementById('objectiveOtherInput').value = '';
        setPresetDate();
        resetFormUI();

        const savedName = localStorage.getItem('adtech_user_name');
        const savedRegion = localStorage.getItem('adtech_region');

        if (savedRegion) {
            const pRegionField = document.getElementById('pRegion');
            if (pRegionField) {
                pRegionField.innerHTML = `<option value="${savedRegion}">${savedRegion}</option>`;
                pRegionField.value = savedRegion;
            }
        }

        if (savedName) {
            const reqSelect = document.getElementById('requesterName');
            let found = false;
            if (reqSelect) {
                for(let i=0; i<reqSelect.options.length; i++){
                    if(reqSelect.options[i].value === savedName || reqSelect.options[i].text === savedName){
                        reqSelect.selectedIndex = i;
                        found = true;
                        break;
                    }
                }
            }
            if(!found) {
                const manualInput = document.getElementById('manualName');
                if (manualInput) {
                    manualInput.value = savedName;
                    manualInput.style.display = 'block';
                }
            }
        }

        setTimeout(() => {
            overlay.classList.remove('show');
            setTimeout(() => {
                showPage('dashboard');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                renderDashboard();
                renderBoards();
            }, 400);
        }, 2500);

    } catch(e) {
        showAppleAlert("Submission Failed", e.message);
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function approveJob(jobID, client, title) {
    const selectedPIC = Array.from(document.querySelectorAll(`.cb-${jobID}:checked`)).map(cb => cb.value).join(', ');
    if(!selectedPIC) return showAppleAlert("Missing Assignee", "Please select at least one creative PIC.");
    const playbookInput = document.getElementById(`playbook-${jobID}`);
    const playbookCheck = normalizeTaskUrlForSave(playbookInput?.value || '', 'Playbook URL');
    if(!playbookCheck.value) return showAppleAlert("Missing Link", "Please auto-generate or paste the Creative Playbook link first.");
    if(!playbookCheck.ok) return showAppleAlert("Invalid Link", playbookCheck.message, { tone: 'warning', icon: 'link' });
    const playbookLink = playbookCheck.value;
    if (playbookInput) playbookInput.value = playbookLink;

    const currentUser = localStorage.getItem('adtech_user_name') || 'Admin';
    const btn = document.getElementById(`btn-approve-${jobID}`);
    const originalHtml = btn.innerHTML;

    // 1. Tukar button jadi loading & panggil skrin gelap loading (overlay)
    btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Approving...';
    btn.disabled = true;
    lucide.createIcons();

    const overlay = document.getElementById('soft-refresh-overlay');
    if (overlay) overlay.classList.add('show');

    try {
        const item = globalData.find(d => d.job_id === jobID);
        const clientDeadline = getTaskClientDeadline(item);
        const generatedDue = generateSuggestedInternalDueForTask(item || { client_deadline: clientDeadline });
        const internalDue = getTaskInternalDueDate(item) || generatedDue.date;
        const approvalPayload = {
            ...buildPICAssignmentPayload(selectedPIC),
            status: 'approved',
            playbook_link: playbookLink,
            work_status: 'Not started',
            revision: 0,
            approver: currentUser,
            client_deadline: clientDeadline || null,
            original_client_deadline: getTaskOriginalClientDeadline(item) || clientDeadline || null,
            internal_due_date: internalDue || null,
            original_internal_due_date: getTaskOriginalInternalDueDate(item) || internalDue || null,
            internal_due_source: getTaskInternalDueDate(item) ? (getTaskInternalDueSource(item) || 'manual') : (internalDue ? 'system_generated' : null),
            internal_due_manually_adjusted: isInternalDueManuallyAdjusted(item)
        };
        const fallbackApprovalPayload = {
            assignee: selectedPIC,
            status: 'approved',
            playbook_link: playbookLink,
            work_status: 'Not started',
            revision: 0,
            approver: currentUser,
            client_deadline: clientDeadline || null,
            original_client_deadline: getTaskOriginalClientDeadline(item) || clientDeadline || null,
            internal_due_date: internalDue || null,
            original_internal_due_date: getTaskOriginalInternalDueDate(item) || internalDue || null
        };
        // 2. Update pangkalan data Supabase
        await saveCreativeRequestStatusPayload(jobID, approvalPayload, fallbackApprovalPayload);

        // 3. Optimistic Update: Tukar data di memori serta-merta tanpa tunggu reload
        const flag = getFlag(item ? item.region : '');
        const oldAssignee = item ? getAssigneeDisplay(item.assignee) : 'Unassigned';

        if (item) {
            Object.assign(item, approvalPayload);
        }
        const picChange = getPICChangeMeta(oldAssignee, selectedPIC);
        logTaskActivity(jobID, 'approved', 'pending', 'approved', `Approved by ${currentUser}`, { playbook_link: playbookLink, internal_due_date: internalDue, client_deadline: clientDeadline, buffer_working_days: generatedDue.bufferDays, complexity: generatedDue.complexity, lead_time_flag: generatedDue.flag, pic_change: picChange });
        logTaskActivity(jobID, 'pic_changed', oldAssignee, selectedPIC, 'PIC assigned during approval', {
            ...picChange,
            source: 'approval'
        });

        // 4. Render semula papan Kanban dan Dashboard terus
        renderDashboard();
        renderBoards();

        // 5. Tutup modal dan tunjuk notifikasi siap
        closeDetailModal();
        showNotification('Job Approved', 'Ready for production');

        // 6. Hantar Telegram di "background" (tak payah guna await, supaya UI tak stuck)
        const tgMsg = `[APPROVED] ${flag}\n\n*ID:* ${jobID}\n*Client:* ${client}\n*PIC:* ${selectedPIC}\n*Approved by:* ${currentUser}\n\n📝 *Playbook:* ${playbookLink}\n🔗 [Open Adtechinno App](https://adtechinno-creativeengine.vercel.app/)`;
       fetch(TELEGRAM_API, { method: 'POST', body: JSON.stringify({ action: 'send_telegram', text: tgMsg }) });

    } catch(e) {
        showAppleAlert("Approval Error", e.message);
        btn.innerHTML = originalHtml;
        btn.disabled = false;
        lucide.createIcons();
    } finally {
        // 7. Tutup skrin gelap loading bila dah siap
        if (overlay) overlay.classList.remove('show');
    }
}

async function saveEdit() {
    const state = activeEditTaskState;
    if (!state) return showAppleAlert('Edit Unavailable', 'Please reopen the task edit panel.', { tone: 'warning', icon: 'file-pen-line' });
    if (state.isSaving) return;

    const jobID = state.jobID;
    const job = (globalData || []).find(d => d.job_id === jobID);
    if (!job) return showAppleAlert('Missing Task', 'This task could not be found.', { tone: 'warning', icon: 'search-x' });
    if (!canCurrentUserEditTask(job).canEdit) return showAppleAlert('Admin Only', 'You no longer have permission to edit this task.', { tone: 'warning', icon: 'lock' });

    const values = getTaskEditFormValues();
    const validation = validateTaskEditValues(values);
    const changes = getTaskEditChanges(state.original, values, validation.normalized);
    const changeCount = Object.keys(changes).length;

    if (!changeCount) {
        setTaskEditStatus('No changes to save.', 'muted');
        return;
    }
    if (!validation.valid) {
        const message = validation.errors.slice(0, 5).join('\n');
        setTaskEditStatus(validation.errors[0], 'danger');
        return showAppleAlert('Check Edit Fields', message, { tone: 'warning', icon: 'circle-alert' });
    }

    if (!state.conflictOverride && state.original.updated_at) {
        const latestTask = await fetchLatestTaskForEdit(jobID);
        const latestUpdatedAt = latestTask?.updated_at || latestTask?.modified_at || latestTask?.last_updated_at || '';
        if (latestTask && latestUpdatedAt && latestUpdatedAt !== state.original.updated_at) {
            const overwrite = await showAppleConfirm(
                'This task was updated while you were editing.',
                'Review the latest saved version or overwrite it with your current changes.',
                { confirmText: 'Overwrite Changes', cancelText: 'Review Latest', tone: 'danger', icon: 'git-compare-arrows' }
            );
            if (!overwrite) {
                const index = globalData.findIndex(row => row.job_id === jobID);
                if (index >= 0) globalData[index] = { ...globalData[index], ...latestTask };
                state.original = buildTaskEditSnapshot(latestTask);
                document.getElementById('editTaskFormBody').innerHTML = renderTaskEditForm(state.original);
                state.internalDueTouched = false;
                state.keepCurrentInternalDue = false;
                state.lastSuggestedForClientDeadline = '';
                syncTaskEditDirtyState();
                syncTaskEditDeadlineSuggestion();
                refreshIcons();
                setTaskEditStatus('Latest task data loaded. Review and edit again.', 'info');
                return;
            }
            state.conflictOverride = true;
        }
    }

    const payload = buildTaskEditPayload(jobID, values, changes, validation.normalized);
    const nextSnapshot = { ...state.original, ...values, playbook_link: validation.normalized.playbook_link, ref_link: validation.normalized.ref_link };
    const oldSummary = getTaskEditSummary(state.original);
    const newSummary = getTaskEditSummary(nextSnapshot);
    const deadlineChanges = getTaskEditDeadlineChanges(changes);

    if (deadlineChanges.length) {
        return openDeadlineChangeDialog(jobID, payload, oldSummary, newSummary, deadlineChanges);
    }

    await commitEditPayload(jobID, payload, oldSummary, newSummary, 'Request details edited', buildTaskEditChangeMeta(changes));
}

async function commitEditPayload(jobID, payload, oldSummary, newSummary, noteText, meta = {}) {
    const btn = document.getElementById('saveEditBtn');
    const label = btn?.querySelector('span');
    const icon = btn?.querySelector('i');
    if (activeEditTaskState) activeEditTaskState.isSaving = true;
    if (btn) btn.disabled = true;
    if (label) label.textContent = 'Saving...';
    if (icon) icon.setAttribute('data-lucide', 'loader-2');
    if (icon) icon.classList.add('spin');
    setTaskEditStatus('Saving changes to Supabase...', 'info');
    refreshIcons();

    const job = globalData.find(d => d.job_id === jobID);
    const oldAssigneeForEdit = activeEditTaskState?.original?.assignee || (job ? getAssigneeDisplay(job.assignee) : 'Unassigned');
    const nextAssigneeForEdit = payload.assignee !== undefined ? getAssigneeDisplay(payload.assignee) : oldAssigneeForEdit;
    const picChangeMeta = payload.assignee !== undefined ? getPICChangeMeta(oldAssigneeForEdit, nextAssigneeForEdit) : { changed: false };

    try {
        const result = await saveTaskEditPayloadToSupabase(jobID, payload);
        if (job) Object.assign(job, payload, result.row || {});
        await logTaskActivity(jobID, meta.deadline_changed ? 'deadline_changed' : 'request_updated', oldSummary, newSummary, noteText, {
            ...meta,
            pic_change: picChangeMeta.changed ? picChangeMeta : undefined,
            fallback_payload_used: result.usedFallback || undefined
        });
        if (picChangeMeta.changed) {
            await logTaskActivity(jobID, 'pic_changed', oldAssigneeForEdit, nextAssigneeForEdit, 'PIC changed from edit form', {
                ...picChangeMeta,
                source: 'edit_form'
            });
        }
        closeSettingsDialog();
        closeEditModal({ keepBodyLock: true });
        renderTaskEditPostSave(jobID);
        showNotification('Task Updated', result.usedFallback ? 'Saved with legacy field fallback' : 'Changes saved');
    } catch(e) {
        setTaskEditStatus(`Save failed: ${e.message}`, 'danger');
        showAppleAlert("Update Error", e.message, { tone: 'danger', icon: 'alert-triangle' });
    } finally {
        if (activeEditTaskState) activeEditTaskState.isSaving = false;
        if (btn) btn.disabled = false;
        if (label) label.textContent = 'Save Changes';
        if (icon) {
            icon.setAttribute('data-lucide', 'save');
            icon.classList.remove('spin');
        }
        syncTaskEditDirtyState();
        refreshIcons();
    }
}

function openDeadlineChangeDialog(jobID, payload, oldSummary, newSummary, changedDeadlines) {
    pendingDeadlineChangeUpdate = { jobID, payload, oldSummary, newSummary, changedDeadlines };
    const changeList = changedDeadlines.map(item => `<div class="settings-change-row"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(formatDate(item.from) || item.from)} -> ${escapeHtml(formatDate(item.to) || item.to)}</strong></div>`).join('');
    openSettingsDialog({
        kind: 'deadline-change',
        mode: 'modal',
        icon: 'calendar-clock',
        title: 'Reason required',
        description: 'Deadline changes are saved into task history for monthly reporting.',
        body: `
            <div class="settings-dialog-form">
                <div class="settings-change-list">${changeList}</div>
                <label>Reason
                    <select id="deadlineChangeReason">
                        ${DEADLINE_CHANGE_REASONS.map(reason => `<option value="${escapeHtml(reason)}">${escapeHtml(reason)}</option>`).join('')}
                    </select>
                </label>
                <label>Note
                    <textarea id="deadlineChangeNote" rows="3" placeholder="Short context for this change..."></textarea>
                </label>
            </div>
        `,
        footer: `
            <button type="button" class="settings-action-btn" onclick="closeSettingsDialog()">Cancel</button>
            <button type="button" class="settings-primary-btn" onclick="submitDeadlineChangeDialog()"><i data-lucide="save"></i><span>Save Change</span></button>
        `
    });
}

async function submitDeadlineChangeDialog() {
    if (!pendingDeadlineChangeUpdate) return closeSettingsDialog();
    const reason = document.getElementById('deadlineChangeReason')?.value || '';
    const note = document.getElementById('deadlineChangeNote')?.value.trim() || '';
    if (!reason) return showAppleAlert('Missing Reason', 'Please select a reason.');
    const pending = pendingDeadlineChangeUpdate;
    pendingDeadlineChangeUpdate = null;
    const payload = {
        ...pending.payload,
        latest_deadline_change_reason: reason,
        deadline_extension_count: ((globalData.find(d => d.job_id === pending.jobID)?.deadline_extension_count || 0) * 1) + 1
    };
    const changeText = pending.changedDeadlines.map(item => `${item.label}: ${item.from} -> ${item.to}`).join(' | ');
    await commitEditPayload(pending.jobID, payload, pending.oldSummary, pending.newSummary, `${reason}${note ? ` - ${note}` : ''}`, {
        deadline_changed: true,
        changes: pending.changedDeadlines,
        reason,
        note,
        change_text: changeText
    });
}

function handleInternalDueRowKeydown(event, jobID) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openInternalDueModal(event, jobID);
}

function validateInternalDueDate(internalDue, clientDeadline) {
    const due = parseDateOnly(internalDue);
    const client = parseDateOnly(clientDeadline);
    if (!due) return { valid: false, warning: 'Please choose an internal due date.' };
    if (isWeekendDate(due)) return { valid: false, warning: 'Internal due date cannot fall on a weekend.' };
    if (!client) return { valid: true, warning: 'Client deadline is missing, so this date needs admin review.' };
    if (due > client) return { valid: true, warning: 'Internal due date is later than the client deadline.' };
    if (due.getTime() === client.getTime()) return { valid: true, warning: 'Same-day internal due date. This is a short-lead request.' };
    return { valid: true, warning: '' };
}

function getLeadTimeWarning(clientDeadline, internalDue) {
    const client = parseDateOnly(clientDeadline);
    const due = parseDateOnly(internalDue);
    if (!client) return 'Client deadline missing.';
    if (getDateOnlyDiffDays(client) < 0) return 'Client deadline has passed. Review dates before saving.';
    if (!due) return 'Choose an internal due date.';
    const buffer = calculateWorkingDaysBetween(due, client);
    if (getDateOnlyDiffDays(client) === 0) return 'Same-day request.';
    if (buffer !== null && buffer < 2) return 'Short lead time.';
    return '';
}

function openInternalDueModal(event, jobID) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    if (!hasDeadlineEditAccess()) return;
    const task = (globalData || []).find(d => d.job_id === jobID);
    if (!task) return showAppleAlert('Missing Task', 'This task could not be found.');
    const clientDeadline = getTaskClientDeadline(task);
    const currentInternalDue = toDateInputValue(getTaskInternalDueDate(task));
    const suggested = generateSuggestedInternalDueForTask(task);
    const initialDue = currentInternalDue || suggested.date;
    const warning = getLeadTimeWarning(clientDeadline, initialDue);
    openSettingsDialog({
        kind: 'internal-due',
        mode: 'modal',
        icon: 'calendar-clock',
        title: 'Deadline',
        description: 'Set the creative team due date while keeping the client deadline unchanged.',
        body: `
            <div class="settings-dialog-form internal-due-form" data-job-id="${escapeHtml(jobID)}">
                <div class="settings-change-list">
                    <div class="settings-change-row"><span>Client deadline</span><strong>${formatDate(clientDeadline)}</strong></div>
                    <div class="settings-change-row"><span>Current internal due</span><strong>${currentInternalDue ? formatDate(currentInternalDue) : 'Not set'}</strong></div>
                </div>
                <label>Buffer
                    <select id="internalDueBuffer" onchange="applyInternalDueBufferPreview('${escapeJsString(jobID)}')">
                        <option value="2" ${suggested.bufferDays === 2 ? 'selected' : ''}>2 working days</option>
                        <option value="1" ${suggested.bufferDays === 1 ? 'selected' : ''}>1 working day</option>
                        <option value="custom">Custom date</option>
                    </select>
                </label>
                <label>Internal due
                    <input type="date" id="internalDueDateInput" value="${escapeHtml(initialDue)}" onchange="document.getElementById('internalDueBuffer').value='custom'; updateInternalDueWarning('${escapeJsString(jobID)}')">
                </label>
                <div id="internalDueWarning" class="deadline-modal-warning ${warning ? 'show' : ''}">${escapeHtml(warning)}</div>
                <label>Reason for adjustment
                    <select id="internalDueReason">
                        <option value="">Select reason...</option>
                        ${DEADLINE_ADJUSTMENT_REASONS.map(reason => `<option value="${escapeHtml(reason)}">${escapeHtml(reason)}</option>`).join('')}
                    </select>
                </label>
                <label>Note
                    <textarea id="internalDueNote" rows="3" placeholder="Optional context..."></textarea>
                </label>
            </div>
        `,
        footer: `
            <button type="button" class="settings-action-btn" onclick="closeSettingsDialog()">Cancel</button>
            <button type="button" id="btnSaveInternalDue" class="settings-primary-btn" onclick="submitInternalDueModal('${escapeJsString(jobID)}')"><i data-lucide="save"></i><span>Save</span></button>
        `
    });
}

function applyInternalDueBufferPreview(jobID) {
    const buffer = document.getElementById('internalDueBuffer')?.value || '2';
    const input = document.getElementById('internalDueDateInput');
    const task = (globalData || []).find(d => d.job_id === jobID);
    if (!input || !task || buffer === 'custom') return updateInternalDueWarning(jobID);
    input.value = generateSuggestedInternalDue(getTaskClientDeadline(task), Number(buffer)).date;
    updateInternalDueWarning(jobID);
}

function updateInternalDueWarning(jobID) {
    const task = (globalData || []).find(d => d.job_id === jobID);
    const box = document.getElementById('internalDueWarning');
    const input = document.getElementById('internalDueDateInput');
    if (!task || !box || !input) return;
    const validation = validateInternalDueDate(input.value, getTaskClientDeadline(task));
    const lead = getLeadTimeWarning(getTaskClientDeadline(task), input.value);
    const message = validation.warning || lead;
    box.textContent = message;
    box.classList.toggle('show', !!message);
}

async function submitInternalDueModal(jobID) {
    const task = (globalData || []).find(d => d.job_id === jobID);
    if (!task) return showAppleAlert('Missing Task', 'This task could not be found.');
    const internalDue = document.getElementById('internalDueDateInput')?.value || '';
    const reason = document.getElementById('internalDueReason')?.value || '';
    const note = document.getElementById('internalDueNote')?.value.trim() || '';
    const oldDue = toDateInputValue(getTaskInternalDueDate(task));
    if (oldDue === internalDue) return closeSettingsDialog();
    const validation = validateInternalDueDate(internalDue, getTaskClientDeadline(task));
    if (!validation.valid) return showAppleAlert('Invalid Due Date', validation.warning);
    if (!reason) return showAppleAlert('Missing Reason', 'Please select a reason for the due date change.');

    const btn = document.getElementById('btnSaveInternalDue');
    const originalHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i><span>Saving...</span>';
        refreshIcons();
    }

    const oldSnapshot = { ...task };
    const payload = {
        internal_due_date: internalDue || null,
        original_internal_due_date: getTaskOriginalInternalDueDate(task) || internalDue || null,
        internal_due_source: 'manual',
        internal_due_manually_adjusted: true,
        latest_deadline_change_reason: reason,
        deadline_extension_count: Number(task.deadline_extension_count || 0) + (oldDue ? 1 : 0),
        last_moved_at: task.last_moved_at || new Date().toISOString()
    };
    const fallbackPayload = { ...payload };
    delete fallbackPayload.internal_due_source;
    delete fallbackPayload.internal_due_manually_adjusted;

    try {
        await saveCreativeRequestStatusPayload(jobID, payload, fallbackPayload);
        Object.assign(task, payload);
        logTaskActivity(jobID, oldDue ? 'internal_due_date_changed' : 'internal_due_date_set', oldDue || 'Not set', internalDue, `${reason}${note ? ` - ${note}` : ''}`, {
            reason,
            note,
            client_deadline: getTaskClientDeadline(task),
            warning: validateInternalDueDate(internalDue, getTaskClientDeadline(task)).warning || getLeadTimeWarning(getTaskClientDeadline(task), internalDue)
        });
        closeSettingsDialog();
        renderDashboard();
        renderBoards();
        showNotification('Due Date Updated', formatDate(internalDue));
    } catch(e) {
        Object.assign(task, oldSnapshot);
        showAppleAlert('Due Date Save Failed', /column|schema|cache|internal_due_date/i.test(e.message || '') ? 'Please run the deadline Supabase SQL migration first.' : e.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
            refreshIcons();
        }
    }
}

function getActiveBoardTasksForCurrentUser() {
    let data = (globalData || []).filter(d =>
        String(d.status || '').toLowerCase() === 'approved' &&
        normalizeWorkStatus(d.work_status) !== 'done'
    );
    return filterTasksForCurrentAccess(data);
}

function getBulkInternalDuePreviewRows() {
    return getInternalDueBackfillRows(getActiveBoardTasksForCurrentUser());
}

function openBulkInternalDueModal(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    if (!hasDeadlineEditAccess()) return showAppleAlert('Admin Only', 'Please unlock Admin Access first.');
    pendingBulkInternalDueRows = getBulkInternalDuePreviewRows();
    const canGenerate = pendingBulkInternalDueRows.filter(row => row.can_generate);
    const cannotGenerate = pendingBulkInternalDueRows.filter(row => !row.can_generate);
    const visibleRows = pendingBulkInternalDueRows.slice(0, 12);
    openSettingsDialog({
        kind: 'bulk-internal-due',
        mode: 'drawer',
        icon: 'calendar-plus',
        title: 'Generate Internal Due Dates',
        description: 'Preview suggested due dates before saving them to active tasks.',
        body: `
            <div class="bulk-due-summary">
                <div><span>Active missing</span><strong>${pendingBulkInternalDueRows.length}</strong></div>
                <div><span>Can generate</span><strong>${canGenerate.length}</strong></div>
                <div><span>Needs review</span><strong>${cannotGenerate.length}</strong></div>
            </div>
            <div class="deadline-modal-warning show">Simple ad-hoc tasks use 1 working day. Monthly, video, deck, campaign or multi-deliverable tasks use 2. Weekends are skipped.</div>
            <div class="bulk-due-table">
                <div class="bulk-due-head"><span>Job</span><span>Client</span><span>Suggested</span><span>Status</span></div>
                ${visibleRows.map(row => `
                    <div class="bulk-due-row ${row.can_generate ? '' : 'needs-review'}">
                        <span><strong>${escapeHtml(row.job_id)}</strong><small>${escapeHtml(row.title)}</small></span>
                        <span>${row.client_deadline ? formatDate(row.client_deadline) : '-'}</span>
                        <span>${row.suggested_internal_due ? formatDate(row.suggested_internal_due) : '-'}</span>
                        <span>${escapeHtml(row.status)} · ${row.buffer_days}d</span>
                    </div>
                `).join('') || '<div class="settings-empty-note">No active tasks are missing internal due dates.</div>'}
            </div>
            ${pendingBulkInternalDueRows.length > visibleRows.length ? `<div class="settings-empty-note">${pendingBulkInternalDueRows.length - visibleRows.length} more task(s) included in this preview.</div>` : ''}
        `,
        footer: `
            <button type="button" class="settings-action-btn" onclick="closeSettingsDialog()">Cancel</button>
            <button type="button" id="btnBulkInternalDue" class="settings-primary-btn" ${canGenerate.length ? '' : 'disabled'} onclick="submitBulkGenerateInternalDueDates()"><i data-lucide="calendar-plus"></i><span>Generate Dates</span></button>
        `
    });
}

async function submitBulkGenerateInternalDueDates() {
    if (!hasDeadlineEditAccess()) return showAppleAlert('Admin Only', 'Please unlock Admin Access first.');
    const rows = (pendingBulkInternalDueRows || []).filter(row => row.can_generate);
    if (!rows.length) return showAppleAlert('Nothing To Generate', 'No tasks have both a client deadline and a valid suggested internal due date.');
    const btn = document.getElementById('btnBulkInternalDue');
    const originalHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i><span>Generating...</span>';
        refreshIcons();
    }

    const errors = [];
    let saved = 0;
    for (const row of rows) {
        const task = row.task;
        const payload = {
            internal_due_date: row.suggested_internal_due,
            original_internal_due_date: getTaskOriginalInternalDueDate(task) || row.suggested_internal_due,
            internal_due_source: 'migrated',
            internal_due_manually_adjusted: false,
            latest_deadline_change_reason: `Bulk generated from client deadline (${row.buffer_days} working day buffer)`
        };
        const fallbackPayload = { ...payload };
        delete fallbackPayload.internal_due_source;
        delete fallbackPayload.internal_due_manually_adjusted;
        try {
            await saveCreativeRequestStatusPayload(row.job_id, payload, fallbackPayload);
            Object.assign(task, payload);
            saved += 1;
            logTaskActivity(row.job_id, 'internal_due_date_bulk_generated', 'Not set', row.suggested_internal_due, `Generated from Client Deadline using ${row.buffer_days} working-day buffer`, {
                client_deadline: row.client_deadline,
                buffer_working_days: row.buffer_days,
                complexity: row.complexity,
                generation_status: row.status
            });
        } catch(e) {
            errors.push(`${row.job_id}: ${/column|schema|cache|internal_due_date/i.test(e.message || '') ? 'Run deadline SQL migration first' : e.message}`);
        }
    }

    pendingBulkInternalDueRows = [];
    closeSettingsDialog();
    renderDashboard();
    renderBoards();
    showNotification('Internal Due Dates Generated', `${saved} task${saved === 1 ? '' : 's'} updated`);
    if (errors.length) {
        showAppleAlert('Some Dates Not Saved', errors.slice(0, 6).join('\n'));
    }
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
        refreshIcons();
    }
}

function formatLocalDateTimeInput(date = new Date()) {
    const d = new Date(date);
    if (isNaN(d)) return '';
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
}

function localDateTimeInputToISO(value) {
    if (!value) return new Date().toISOString();
    const d = new Date(value);
    return isNaN(d) ? new Date().toISOString() : d.toISOString();
}

function renderTeamMemberOptions(preferredName = '') {
    const rows = typeof getActiveTeamMembers === 'function' ? getActiveTeamMembers() : [];
    const members = rows.length ? rows : [...new Set([...(allStaffMY || []), ...(allStaffID || []), ...(PIC_LIST || [])])].map(name => ({ name, region: isIndonesiaCreativeName(name) ? 'Indonesia' : 'Malaysia' }));
    const grouped = {};
    members.filter(member => member?.name).forEach(member => {
        const region = member.region || 'Other';
        if (!grouped[region]) grouped[region] = [];
        grouped[region].push(member.name);
    });
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([region, names]) => `
        <optgroup label="${escapeHtml(region)}">
            ${[...new Set(names)].sort((a, b) => a.localeCompare(b)).map(name => `<option value="${escapeHtml(name)}" ${normalizeNameKey(name) === normalizeNameKey(preferredName) ? 'selected' : ''}>${escapeHtml(name)}</option>`).join('')}
        </optgroup>
    `).join('');
}

function findActiveTeamMemberByName(name) {
    const key = normalizeNameKey(name);
    if (!key) return null;
    return getActiveTeamMembers().find(member => normalizeNameKey(member.name) === key) || null;
}

function getTeamMemberStableIdentifier(member = {}) {
    const direct = [
        member.auth_user_id,
        member.user_id,
        member.supabase_user_id,
        member.uuid,
        member.member_id,
        member.team_member_id,
        member.id,
        member.member_key
    ].map(value => String(value || '').trim()).find(Boolean);
    if (direct) return direct;
    return normalizeNameKey(member.name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function resolveFollowUpOwnerSelection(ownerName) {
    const member = findActiveTeamMemberByName(ownerName);
    if (!member) {
        return {
            ok: false,
            message: 'Please choose an active team member as follow-up owner.'
        };
    }
    const ownerId = getTeamMemberStableIdentifier(member);
    if (!ownerId) {
        return {
            ok: false,
            message: 'This team member has no stable owner ID/key. Update the roster in Settings first.'
        };
    }
    return {
        ok: true,
        name: member.name,
        id: ownerId,
        member
    };
}

function cancelWorkflowDialog(jobID, skipModal = false) {
    closeSettingsDialog();
    renderBoards();
    if (typeof isKanbanMode !== 'undefined' && isKanbanMode) renderKanbanBoard();
    if (!skipModal && jobID) openDetailModal(jobID, true);
}

function resolveClientReviewFollowUpOwner(task = {}) {
    const candidates = [
        task.client_servicing_pic,
        getClientFollowUpOwner(task),
        task.requester_name,
        task.project_owner,
        task.approver,
        getCurrentUserName()
    ].map(value => String(value || '').trim()).filter(Boolean);

    const activeMembers = getActiveTeamMembers();
    for (const candidate of candidates) {
        const activeMatch = activeMembers.find(member => normalizeNameKey(member.name) === normalizeNameKey(candidate));
        if (activeMatch) return activeMatch.name;
    }
    const superAdmin = activeMembers.find(member => SUPER_ADMIN_NAMES.some(name => normalizeNameKey(name) === normalizeNameKey(member.name)));
    if (superAdmin) return superAdmin.name;
    return candidates[0] || 'Admin';
}

function getClientReviewAutomationKey(task = {}, startedAt = '') {
    const source = startedAt || getClientReviewStartedAt(task) || task.last_moved_at || task.created_at || '';
    return `client-review-auto:${task.job_id || 'unknown'}:${String(source).replace(/[^0-9a-z]/gi, '').slice(0, 24)}`;
}

async function moveClientReviewToAwaitingInSupabase(jobID, payload = {}, meta = {}) {
    const args = {
        p_job_id: jobID,
        p_waiting_reason: payload.client_waiting_reason || CLIENT_REVIEW_DEFAULT_WAITING_REASON,
        p_waiting_since: payload.client_waiting_since || new Date().toISOString(),
        p_follow_up_date: payload.client_follow_up_date || null,
        p_follow_up_owner: payload.client_follow_up_owner || '',
        p_follow_up_owner_id: payload.client_follow_up_owner_id || null,
        p_waiting_note: payload.client_waiting_note || null,
        p_actor_name: getCurrentActor(),
        p_source: meta.source || 'manual_app',
        p_idempotency_key: meta.automation_key || `manual-client-review:${jobID}:${payload.client_waiting_since || Date.now()}`
    };

    const operation = 'rpc.move_client_review_to_awaiting(p_job_id,p_waiting_reason,p_waiting_since,p_follow_up_date,p_follow_up_owner,p_follow_up_owner_id,p_waiting_note,p_actor_name,p_source,p_idempotency_key)';
    const { data, error } = await supabaseClient.rpc('move_client_review_to_awaiting', args);
    if (error) throw annotateSupabaseError(error, operation, { jobID, payload, rpc_args: args, meta });

    const row = Array.isArray(data) ? data[0] : data;
    return {
        savedFullPayload: true,
        row: row || null,
        source: 'rpc'
    };
}

async function autoMoveClientReviewToAwaiting(jobID, options = {}) {
    if (!hasAdminAccess()) return showAppleAlert('Admin Only', 'Please unlock Admin Access first.');
    const job = globalData.find(d => d.job_id === jobID);
    if (!job) return showAppleAlert('Missing Task', 'This task could not be found.');
    if (!isTaskClientReview(job)) return showAppleAlert('Not In Client Review', 'This task is no longer in Client Review.');

    const age = getClientReviewAge(job);
    const automated = options.source === 'system_automation' || options.source === 'browser_automation';
    if (!options.skipConfirm) {
        const confirmed = await showAppleConfirm(
            'Move To Awaiting Client?',
            `${job.client_name || job.job_id} has been in Client Review for ${age.workingDays ?? 0} working day(s). Move it to Awaiting Client and set the next follow-up?`,
            { icon: 'message-square-clock', tone: 'default', confirmText: 'Move', cancelText: 'Cancel' }
        );
        if (!confirmed) return;
    }

    const nowISO = new Date().toISOString();
    const followUp = addWorkingDays(nowISO, 1);
    const owner = resolveClientReviewFollowUpOwner(job);
    const ownerInfo = resolveFollowUpOwnerSelection(owner);
    if (!ownerInfo.ok) {
        return showAppleAlert('Follow-up Owner Needed', ownerInfo.message, { tone: 'warning', icon: 'user-round-x' });
    }
    const note = options.note || `No client response after ${age.workingDays ?? 0} working day(s).`;
    const automationKey = getClientReviewAutomationKey(job, age.startAt);
    const oldSnapshot = { ...job };
    const oldStatus = job.work_status || 'Client Review';
    const payload = {
        work_status: WORK_STATUS_AWAITING_CLIENT,
        last_moved_at: nowISO,
        client_waiting_since: nowISO,
        client_waiting_reason: CLIENT_REVIEW_DEFAULT_WAITING_REASON,
        client_follow_up_date: followUp,
        client_follow_up_owner: ownerInfo.name,
        client_follow_up_owner_id: ownerInfo.id,
        client_waiting_note: note,
        client_review_ended_at: nowISO,
        client_review_auto_move_enabled: true
    };
    if (automated) payload.client_review_auto_moved_at = nowISO;

    try {
        const result = await moveClientReviewToAwaitingInSupabase(jobID, payload, {
            automation_key: automationKey,
            automation_rule: `${CLIENT_REVIEW_WINDOW_DAYS}_working_day_client_review`,
            review_started_at: age.startAt,
            review_working_days: age.workingDays,
            source: options.source || 'manual_admin'
        });

        Object.assign(job, result.row || payload);
        renderBoards();
        if (typeof isKanbanMode !== 'undefined' && isKanbanMode) renderKanbanBoard();
        renderDashboard();
        closeSettingsDialog();
        await fetchSupabaseData(true, true);
        showNotification('Moved To Awaiting Client', ownerInfo.name);
        if (document.getElementById('globalDetailModal')?.classList.contains('show')) openDetailModal(jobID, true);
    } catch(e) {
        Object.assign(job, oldSnapshot);
        renderBoards();
        if (typeof isKanbanMode !== 'undefined' && isKanbanMode) renderKanbanBoard();
        renderDashboard();
        showClientReviewMoveError(e, { operation: 'manual/auto Client Review -> Awaiting Client', jobID, payload, old_status: oldStatus });
    }
}

async function undoClientReviewAutoMove(jobID) {
    if (!hasAdminAccess()) return showAppleAlert('Admin Only', 'Please unlock Admin Access first.');
    const job = globalData.find(d => d.job_id === jobID);
    if (!job) return showAppleAlert('Missing Task', 'This task could not be found.');
    if (!isTaskAwaitingClient(job) || !wasClientReviewAutoMoved(job)) {
        return showAppleAlert('Undo Not Available', 'This task was not auto-moved from Client Review.');
    }

    const reason = await showApplePrompt('Undo Auto Move', 'Add a short reason for moving this task back to Client Review:', false);
    if (!reason) return;

    const nowISO = new Date().toISOString();
    const snoozeDate = addWorkingDays(nowISO, 1);
    const reviewStart = getClientReviewStartedAt(job) || job.review_started_at || nowISO;
    const oldSnapshot = { ...job };
    const payload = {
        work_status: 'Client Review',
        last_moved_at: nowISO,
        review_started_at: reviewStart,
        client_review_started_at: reviewStart,
        client_review_ended_at: null,
        client_review_auto_moved_at: null,
        client_review_auto_move_enabled: true,
        client_review_auto_move_exempt: false,
        client_review_exemption_reason: `Undo auto move: ${reason}`,
        client_review_audit_required: false,
        auto_move_snoozed_until: localDateTimeInputToISO(`${snoozeDate}T23:59`),
        client_waiting_since: null,
        client_waiting_reason: null,
        client_follow_up_date: null,
        client_follow_up_owner: null,
        client_follow_up_owner_id: null,
        client_waiting_note: null
    };
    const fallbackPayload = { work_status: 'Client Review', last_moved_at: nowISO, review_started_at: reviewStart };

    try {
        Object.assign(job, payload);
        renderBoards();
        if (typeof isKanbanMode !== 'undefined' && isKanbanMode) renderKanbanBoard();
        renderDashboard();

        const result = await saveCreativeRequestStatusPayload(jobID, payload, fallbackPayload);
        try {
            await supabaseClient
                .from('task_client_waiting_periods')
                .update({
                    waiting_ended_at: nowISO,
                    resolved_by: getCurrentActor(),
                    resolution_status: 'Client Review',
                    resolution_note: `Auto move undone: ${reason}`
                })
                .eq('job_id', jobID)
                .is('waiting_ended_at', null);
        } catch(e) {
            console.warn('Auto move undo waiting period close saved via activity log only:', e.message);
        }

        await logTaskActivity(jobID, 'client_review_auto_move_undone', WORK_STATUS_AWAITING_CLIENT, 'Client Review', reason, {
            restored_client_review_started_at: reviewStart,
            auto_move_snoozed_until: payload.auto_move_snoozed_until,
            saved_full_payload: result.savedFullPayload
        });
        if (document.getElementById('globalDetailModal')?.classList.contains('show')) openDetailModal(jobID, true);
        showNotification('Auto Move Undone', 'Client Review restored');
    } catch(e) {
        Object.assign(job, oldSnapshot);
        renderBoards();
        if (typeof isKanbanMode !== 'undefined' && isKanbanMode) renderKanbanBoard();
        renderDashboard();
        showAppleAlert('Undo Failed', /column|schema|cache|client_review|auto_move/i.test(e.message || '') ? 'Please run supabase-client-review-aging.sql in Supabase SQL Editor first.' : e.message);
    }
}

function recordClientReviewResponse(jobID) {
    const job = globalData.find(d => d.job_id === jobID);
    if (!job) return showAppleAlert('Missing Task', 'This task could not be found.');
    if (!isTaskClientReview(job)) return showAppleAlert('Not In Client Review', 'This task is no longer in Client Review.');
    if (!canRecordClientReviewResponse(job)) return showAppleAlert('No Access', 'Only admins or assigned creative team members can record a client response.');

    openSettingsDialog({
        kind: 'client-review-response',
        mode: 'modal',
        icon: 'message-circle-check',
        title: 'Client Response',
        description: 'This is a structured response. It resets the Client Review timer.',
        body: `
            <div class="settings-dialog-form">
                <label>Response Type
                    <select id="clientReviewResponseType">
                        <option value="client_response_recorded">Client replied</option>
                        <option value="client_approval_recorded">Client approved / confirmed</option>
                        <option value="client_revision_requested">Client requested revision</option>
                        <option value="client_assets_received">Client supplied assets</option>
                    </select>
                </label>
                <label>Short Note
                    <textarea id="clientReviewResponseNote" rows="3" placeholder="Example: Client replied in WhatsApp, waiting for final confirmation."></textarea>
                </label>
            </div>
        `,
        footer: `
            <button type="button" class="settings-action-btn" onclick="closeSettingsDialog()">Cancel</button>
            <button type="button" id="btnClientReviewResponse" class="settings-primary-btn" onclick="submitClientReviewResponse('${escapeJsString(jobID)}')"><i data-lucide="save"></i><span>Save</span></button>
        `
    });
}

async function submitClientReviewResponse(jobID) {
    const job = globalData.find(d => d.job_id === jobID);
    if (!job) return showAppleAlert('Missing Task', 'This task could not be found.');
    const responseType = document.getElementById('clientReviewResponseType')?.value || 'client_response_recorded';
    const note = document.getElementById('clientReviewResponseNote')?.value.trim() || 'Client response recorded.';
    const nowISO = new Date().toISOString();
    const oldSnapshot = { ...job };
    const oldStart = getClientReviewStartedAt(job);
    const payload = {
        review_started_at: nowISO,
        client_review_started_at: nowISO,
        client_review_ended_at: null,
        client_review_meaningful_response_at: nowISO,
        client_review_auto_moved_at: null,
        client_review_auto_move_enabled: true,
        client_review_auto_move_exempt: false,
        client_review_exemption_reason: null,
        client_review_audit_required: false,
        client_review_start_source: 'client_response',
        auto_move_snoozed_until: null
    };
    const fallbackPayload = { review_started_at: nowISO };

    const btn = document.getElementById('btnClientReviewResponse');
    const originalHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i><span>Saving...</span>';
        refreshIcons();
    }

    try {
        await saveCreativeRequestStatusPayload(jobID, payload, fallbackPayload);
        Object.assign(job, payload);
        await logTaskActivity(jobID, responseType, oldStart || 'No start', nowISO, note, {
            previous_client_review_started_at: oldStart,
            new_client_review_started_at: nowISO,
            resets_client_review_timer: true
        });
        closeSettingsDialog();
        renderBoards();
        if (typeof isKanbanMode !== 'undefined' && isKanbanMode) renderKanbanBoard();
        renderDashboard();
        if (document.getElementById('globalDetailModal')?.classList.contains('show')) openDetailModal(jobID, true);
        showNotification('Client Response Saved', 'Review timer restarted');
    } catch(e) {
        Object.assign(job, oldSnapshot);
        showAppleAlert('Response Save Failed', /column|schema|cache|client_review/i.test(e.message || '') ? 'Please run supabase-client-review-aging.sql in Supabase SQL Editor first.' : e.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
            refreshIcons();
        }
    }
}

function openClientReviewOverrideDialog(jobID) {
    if (!hasAdminAccess()) return showAppleAlert('Admin Only', 'Please unlock Admin Access first.');
    const job = globalData.find(d => d.job_id === jobID);
    if (!job) return showAppleAlert('Missing Task', 'This task could not be found.');
    if (!isTaskClientReview(job)) return showAppleAlert('Not In Client Review', 'This task is no longer in Client Review.');
    const age = getClientReviewAge(job);
    const nextWindow = Math.max(getTaskClientReviewWindowDays(job) + 2, (age.workingDays || 0) + 2);
    const holdUntil = addWorkingDays(new Date(), 1);

    openSettingsDialog({
        kind: 'client-review-override',
        mode: 'modal',
        icon: 'sliders-horizontal',
        title: 'Review Control',
        description: 'Manual override for Client Review aging. A reason is required for reporting.',
        body: `
            <div class="settings-dialog-form">
                <div class="settings-change-list">
                    <div class="settings-change-row"><span>Current age</span><strong>${age.workingDays ?? '-'} working day(s)</strong></div>
                    <div class="settings-change-row"><span>Default window</span><strong>${age.windowDays} working day(s)</strong></div>
                </div>
                <label>Action
                    <select id="clientReviewOverrideAction" onchange="updateClientReviewOverrideFields()">
                        <option value="extend">Extend review window</option>
                        <option value="hold">Keep in Client Review temporarily</option>
                        <option value="restart">Restart review timer</option>
                        <option value="exempt">Exempt from auto-move</option>
                        <option value="postpone">Mark postponed / paused</option>
                        <option value="move">Move to Awaiting Client</option>
                    </select>
                </label>
                <label id="clientReviewWindowField">Review Window
                    <input type="number" id="clientReviewWindowDays" min="1" max="30" value="${nextWindow}">
                </label>
                <label id="clientReviewHoldField">Hold Until
                    <input type="date" id="clientReviewHoldUntil" value="${holdUntil}">
                </label>
                <label>Reason
                    <textarea id="clientReviewOverrideReason" rows="3" placeholder="Why are we overriding the automation?"></textarea>
                </label>
            </div>
        `,
        footer: `
            <button type="button" class="settings-action-btn" onclick="closeSettingsDialog()">Cancel</button>
            <button type="button" id="btnClientReviewOverride" class="settings-primary-btn" onclick="submitClientReviewOverride('${escapeJsString(jobID)}')"><i data-lucide="save"></i><span>Save</span></button>
        `
    });
    updateClientReviewOverrideFields();
}

function updateClientReviewOverrideFields() {
    const action = document.getElementById('clientReviewOverrideAction')?.value || 'extend';
    const windowField = document.getElementById('clientReviewWindowField');
    const holdField = document.getElementById('clientReviewHoldField');
    if (windowField) windowField.style.display = action === 'extend' ? 'grid' : 'none';
    if (holdField) holdField.style.display = action === 'hold' ? 'grid' : 'none';
}

async function submitClientReviewOverride(jobID) {
    if (!hasAdminAccess()) return showAppleAlert('Admin Only', 'Please unlock Admin Access first.');
    const job = globalData.find(d => d.job_id === jobID);
    if (!job) return showAppleAlert('Missing Task', 'This task could not be found.');
    if (!isTaskClientReview(job)) return showAppleAlert('Not In Client Review', 'This task is no longer in Client Review.');

    const action = document.getElementById('clientReviewOverrideAction')?.value || 'extend';
    const reason = document.getElementById('clientReviewOverrideReason')?.value.trim() || '';
    if (!reason) return showAppleAlert('Reason Required', 'Please add a short reason for reporting.');
    if (action === 'move') {
        closeSettingsDialog();
        return autoMoveClientReviewToAwaiting(jobID, { source: 'manual_override', note: reason });
    }

    const nowISO = new Date().toISOString();
    const oldSnapshot = { ...job };
    const payload = {
        client_review_auto_move_enabled: true,
        client_review_auto_move_exempt: false,
        client_review_exemption_reason: reason,
        client_review_audit_required: false
    };

    if (action === 'extend') {
        payload.client_review_window_days = Math.max(1, Number(document.getElementById('clientReviewWindowDays')?.value || CLIENT_REVIEW_WINDOW_DAYS));
        payload.auto_move_snoozed_until = null;
    } else if (action === 'hold') {
        const holdDate = document.getElementById('clientReviewHoldUntil')?.value || addWorkingDays(nowISO, 1);
        payload.auto_move_snoozed_until = localDateTimeInputToISO(`${holdDate}T23:59`);
    } else if (action === 'restart') {
        payload.review_started_at = nowISO;
        payload.client_review_started_at = nowISO;
        payload.client_review_start_source = 'manual_restart';
        payload.client_review_meaningful_response_at = null;
        payload.auto_move_snoozed_until = null;
    } else if (action === 'exempt' || action === 'postpone') {
        payload.client_review_auto_move_enabled = false;
        payload.client_review_auto_move_exempt = true;
        payload.client_review_exemption_reason = `${action === 'postpone' ? 'Postponed: ' : ''}${reason}`;
        payload.auto_move_snoozed_until = null;
    }

    const btn = document.getElementById('btnClientReviewOverride');
    const originalHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i><span>Saving...</span>';
        refreshIcons();
    }

    try {
        await saveCreativeRequestStatusPayload(jobID, payload);
        Object.assign(job, payload);
        await logTaskActivity(jobID, 'client_review_override', action, job.work_status || 'Client Review', reason, {
            action,
            window_days: payload.client_review_window_days || getTaskClientReviewWindowDays(job),
            auto_move_snoozed_until: payload.auto_move_snoozed_until || '',
            auto_move_exempt: String(payload.client_review_auto_move_exempt)
        });
        closeSettingsDialog();
        renderBoards();
        if (typeof isKanbanMode !== 'undefined' && isKanbanMode) renderKanbanBoard();
        renderDashboard();
        if (document.getElementById('globalDetailModal')?.classList.contains('show')) openDetailModal(jobID, true);
        showNotification('Review Control Saved', action);
    } catch(e) {
        Object.assign(job, oldSnapshot);
        showAppleAlert('Override Failed', /column|schema|cache|client_review|auto_move/i.test(e.message || '') ? 'Please run supabase-client-review-aging.sql in Supabase SQL Editor first.' : e.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
            refreshIcons();
        }
    }
}

function getClientReviewAuditTasks() {
    return (globalData || [])
        .filter(task => String(task.status || '').toLowerCase() === 'approved' && isTaskClientReview(task))
        .map(task => ({ task, age: getClientReviewAge(task), latestNote: getLatestTaskNote(task) }))
        .filter(row => row.age.auditRequired || row.age.workingDays === null || row.age.workingDays >= CLIENT_REVIEW_WARNING_DAY)
        .sort((a, b) => (b.age.workingDays || 0) - (a.age.workingDays || 0));
}

function openClientReviewAuditDialog() {
    if (!hasAdminAccess()) return showAppleAlert('Admin Only', 'Please unlock Admin Access first.');
    const rows = getClientReviewAuditTasks();
    const visible = rows.slice(0, 16);
    openSettingsDialog({
        kind: 'client-review-audit',
        mode: 'drawer',
        icon: 'search-check',
        title: 'Client Review Audit',
        description: rows.length ? `${rows.length} Client Review task(s) need attention before automation cleanup.` : 'No stale Client Review tasks found.',
        body: `
            <div class="client-review-audit-list">
                ${visible.map(({ task, age, latestNote }) => `
                    <div class="client-review-audit-row client-review-${age.urgency}">
                        <div>
                            <strong>${escapeHtml(task.job_id)} · ${escapeHtml(task.client_name || '')}</strong>
                            <span>${escapeHtml(task.project_title || '')}</span>
                            <small>${age.workingDays ?? '-'} working day(s) · ${escapeHtml(task.requester_name || 'No requester')} · ${escapeHtml(getAssigneeDisplay(task.assignee))}</small>
                            ${latestNote?.note_text ? `<em>${linkifyHtml(escapeHtml(latestNote.note_text.slice(0, 110)))}${latestNote.note_text.length > 110 ? '...' : ''}</em>` : ''}
                        </div>
                        <div class="client-review-audit-actions">
                            <button type="button" class="settings-link-btn" onclick="closeSettingsDialog(); openDetailModal('${escapeJsString(task.job_id)}')">Review</button>
                            <button type="button" class="settings-link-btn" onclick="openClientReviewOverrideDialog('${escapeJsString(task.job_id)}')">Keep</button>
                            <button type="button" class="settings-link-btn" onclick="markClientReviewAuditDone('${escapeJsString(task.job_id)}')">Done</button>
                            <button type="button" class="settings-link-btn danger" onclick="autoMoveClientReviewToAwaiting('${escapeJsString(task.job_id)}', { source: 'manual_audit' })">Move</button>
                        </div>
                    </div>
                `).join('') || '<div class="settings-empty-state"><i data-lucide="check-circle"></i><strong>Clean right now</strong><span>No Client Review tasks are at the warning threshold.</span></div>'}
            </div>
            ${rows.length > visible.length ? `<div class="settings-empty-note">${rows.length - visible.length} more task(s) hidden. Use Request Status > Review Aging to filter the full list.</div>` : ''}
        `,
        footer: `
            <button type="button" class="settings-action-btn" onclick="closeSettingsDialog()">Close</button>
            <button type="button" class="settings-primary-btn settings-admin-only" onclick="runClientReviewAgingCheck()"><i data-lucide="play"></i><span>Run Check</span></button>
        `
    });
}

async function markClientReviewAuditDone(jobID) {
    if (!hasAdminAccess()) return showAppleAlert('Admin Only', 'Please unlock Admin Access first.');
    const job = globalData.find(d => d.job_id === jobID);
    if (!job) return showAppleAlert('Missing Task', 'This task could not be found.');
    const confirmed = await showAppleConfirm(
        'Mark Done?',
        `${job.client_name || job.job_id} will be closed as Done. Use this only when the work is already completed.`,
        { icon: 'check-circle', tone: 'default', confirmText: 'Mark Done', cancelText: 'Cancel' }
    );
    if (!confirmed) return;
    closeSettingsDialog();
    await updateWorkStatusOptimistic(jobID, 'Done', true);
}

async function runClientReviewAgingCheck() {
    if (!hasAdminAccess()) return showAppleAlert('Admin Only', 'Please unlock Admin Access first.');
    if (clientReviewAgingCheckInFlight) return;
    clientReviewAgingCheckInFlight = true;
    const btn = document.getElementById('btnRunClientReviewAging') || document.querySelector('.settings-dialog-footer .settings-primary-btn');
    const originalHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i><span>Checking...</span>';
        refreshIcons();
    }

    try {
        const { data, error } = await supabaseClient.rpc('run_client_review_aging_check');
        if (error) throw error;
        await fetchSupabaseData(true, true);
        const rows = Array.isArray(data) ? data : [];
        const moved = rows.filter(row => String(row.action_taken || '').toLowerCase() === 'moved').length;
        const audited = rows.filter(row => String(row.action_taken || '').toLowerCase().includes('audit')).length;
        showNotification('Aging Check Complete', `${moved} moved · ${audited} audit`);
        if (document.getElementById('settingsDialogOverlay')?.classList.contains('show')) openClientReviewAuditDialog();
    } catch(e) {
        logSupabaseDiagnostic('rpc.run_client_review_aging_check()', e, { source: 'admin_manual_aging_check' });
        refreshClientReviewSetupStatus({ force: true, silent: true });
        showAppleAlert('Aging Check Needs SQL', /function|rpc|schema|run_client_review_aging_check/i.test(e.message || '') ? 'Run supabase-client-review-aging.sql in Supabase SQL Editor to enable the backend function and schedule.' : e.message);
    } finally {
        clientReviewAgingCheckInFlight = false;
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
            refreshIcons();
        }
    }
}

async function refreshClientReviewSetupStatus(options = {}) {
    if (!(hasAdminAccess() || isSuperAdmin)) return clientReviewSetupState;
    if (clientReviewSetupState.checking && !options.force) return clientReviewSetupState;
    const lastCheckedAt = clientReviewSetupState.checkedAt ? new Date(clientReviewSetupState.checkedAt).getTime() : 0;
    const recentlyChecked = lastCheckedAt && (Date.now() - lastCheckedAt) < 10 * 60 * 1000;
    if (clientReviewSetupState.checked && !options.force && (clientReviewSetupState.ok === true || recentlyChecked)) return clientReviewSetupState;

    clientReviewSetupState = {
        ...clientReviewSetupState,
        checking: true,
        message: clientReviewSetupState.checked ? clientReviewSetupState.message : 'Checking setup...',
        error: null
    };

    const markFailed = (label, error, operation) => {
        annotateSupabaseError(error, operation);
        clientReviewSetupState = {
            checked: true,
            checking: false,
            ok: false,
            message: `${label}: ${error?.message || error || 'Failed'}`,
            error,
            checkedAt: new Date().toISOString()
        };
        logSupabaseDiagnostic(operation, error, { setup_check: label });
        return clientReviewSetupState;
    };

    try {
        const columnsProbe = await supabaseClient
            .from('creative_requests')
            .select('job_id,work_status,client_waiting_since,client_waiting_reason,client_follow_up_date,client_follow_up_owner,client_follow_up_owner_id,client_waiting_note,client_review_started_at,client_review_ended_at,client_review_auto_moved_at')
            .limit(1);
        if (columnsProbe.error) return markFailed('Missing creative_requests fields', columnsProbe.error, 'creative_requests.select(client_review/client_waiting columns)');

        const periodsProbe = await supabaseClient
            .from('task_client_waiting_periods')
            .select('id,job_id,waiting_started_at,waiting_ended_at,follow_up_date,follow_up_owner,follow_up_owner_id')
            .limit(1);
        if (periodsProbe.error) return markFailed('Missing waiting-period table', periodsProbe.error, 'task_client_waiting_periods.select(required columns)');

        const rpcProbe = await supabaseClient.rpc('run_client_review_aging_check', { p_dry_run: true });
        if (rpcProbe.error) return markFailed('Missing aging RPC', rpcProbe.error, 'rpc.run_client_review_aging_check(p_dry_run=true)');

        clientReviewSetupState = {
            checked: true,
            checking: false,
            ok: true,
            message: 'Client Review SQL ready',
            error: null,
            checkedAt: new Date().toISOString()
        };
    } catch(e) {
        return markFailed('Setup check failed', e, 'client_review_setup_health_check');
    } finally {
        if (!options.silent) {
            showAppleAlert(
                clientReviewSetupState.ok ? 'Client Review Ready' : 'Client Review Setup Issue',
                clientReviewSetupState.message,
                { tone: clientReviewSetupState.ok ? 'success' : 'warning', icon: clientReviewSetupState.ok ? 'check-circle' : 'database-zap' }
            );
        }
        if (document.getElementById('dashboard')?.classList.contains('active')) renderDashboard();
        if (document.getElementById('settings')?.classList.contains('active')) renderSettingsPage();
    }

    return clientReviewSetupState;
}

function stripDeadlinePayloadFields(payload = {}) {
    const clean = { ...payload };
    [
        'client_deadline',
        'original_client_deadline',
        'internal_due_date',
        'original_internal_due_date',
        'internal_due_source',
        'internal_due_manually_adjusted',
        'latest_deadline_change_reason',
        'deadline_extension_count',
        'client_review_started_at',
        'client_review_ended_at',
        'client_review_window_days',
        'client_review_auto_move_enabled',
        'client_review_auto_move_exempt',
        'client_review_exemption_reason',
        'client_review_auto_moved_at',
        'client_review_meaningful_response_at',
        'client_review_audit_required',
        'client_review_start_source',
        'auto_move_snoozed_until'
    ].forEach(key => delete clean[key]);
    return clean;
}

async function saveCreativeRequestStatusPayload(jobID, payload, fallbackPayload = null) {
    const operation = `creative_requests.update(${Object.keys(payload).join(',')}).eq(job_id, ${jobID})`;
    const { error } = await supabaseClient.from('creative_requests').update(payload).eq('job_id', jobID);
    if (!error) return { savedFullPayload: true };
    annotateSupabaseError(error, operation, { jobID, payload });
    if (fallbackPayload && /column|schema|cache|client_waiting|client_follow_up|completed_at|client_deadline|internal_due|original_|deadline_change|assigned_pic|assignment_updated/i.test(error.message || '')) {
        const cleanFallbackPayload = stripPICAssignmentPayloadFields(fallbackPayload);
        const retryOperation = `creative_requests.update_fallback(${Object.keys(cleanFallbackPayload).join(',')}).eq(job_id, ${jobID})`;
        const retry = await supabaseClient.from('creative_requests').update(cleanFallbackPayload).eq('job_id', jobID);
        if (retry.error) annotateSupabaseError(retry.error, retryOperation, { jobID, payload: cleanFallbackPayload, originalError: error });
        if (retry.error && /column|schema|cache|client_deadline|internal_due|original_|deadline_change|assigned_pic|assignment_updated/i.test(retry.error.message || '')) {
            const minimal = stripDeadlinePayloadFields(cleanFallbackPayload);
            const secondRetryOperation = `creative_requests.update_minimal(${Object.keys(minimal).join(',')}).eq(job_id, ${jobID})`;
            const secondRetry = await supabaseClient.from('creative_requests').update(minimal).eq('job_id', jobID);
            if (secondRetry.error) throw annotateSupabaseError(secondRetry.error, secondRetryOperation, { jobID, payload: minimal, originalError: error });
            return { savedFullPayload: false, originalError: error };
        }
        if (retry.error) throw retry.error;
        return { savedFullPayload: false, originalError: error };
    }
    throw error;
}

function openAwaitingClientDialog(jobID, skipModal = false) {
    const job = globalData.find(d => d.job_id === jobID);
    if (!job) return showAppleAlert('Missing Task', 'This task could not be found.');
    const preferredOwner = getCurrentUserName() || job.requester_name || '';
    const defaultFollowUp = addWorkingDays(new Date(), 1);
    openSettingsDialog({
        kind: 'awaiting-client',
        mode: 'modal',
        icon: 'message-square-clock',
        title: 'Move to Awaiting Client',
        description: 'Capture what is blocking the team and who owns the next follow-up.',
        backdropClose: false,
        body: `
            <div class="settings-dialog-form">
                <label>Reason
                    <select id="awaitingClientReason">
                        ${CLIENT_WAITING_REASONS.map(reason => `<option value="${escapeHtml(reason)}">${escapeHtml(reason)}</option>`).join('')}
                    </select>
                </label>
                <label>Waiting Since
                    <input type="datetime-local" id="awaitingClientSince" value="${formatLocalDateTimeInput(new Date())}">
                </label>
                <label>Next Follow-up
                    <input type="date" id="awaitingClientFollowUp" value="${toDateInputValue(defaultFollowUp)}">
                </label>
                <label>Follow-up Owner
                    <select id="awaitingClientOwner"><option value="">Select owner...</option>${renderTeamMemberOptions(preferredOwner)}</select>
                </label>
                <label>Note
                    <textarea id="awaitingClientNote" rows="3" placeholder="What are we waiting for?"></textarea>
                </label>
            </div>
        `,
        footer: `
            <button type="button" class="settings-action-btn" onclick="cancelWorkflowDialog('${jobID}', ${skipModal})">Cancel</button>
            <button type="button" id="btnAwaitingClientSave" class="settings-primary-btn" onclick="submitAwaitingClientMove('${jobID}', ${skipModal})"><i data-lucide="save"></i><span>Save</span></button>
        `
    });
}

async function submitAwaitingClientMove(jobID, skipModal = false) {
    const job = globalData.find(d => d.job_id === jobID);
    if (!job) return showAppleAlert('Missing Task', 'This task could not be found.');
    const reason = document.getElementById('awaitingClientReason')?.value || 'Awaiting client feedback';
    const since = localDateTimeInputToISO(document.getElementById('awaitingClientSince')?.value);
    const followUp = document.getElementById('awaitingClientFollowUp')?.value || '';
    const owner = document.getElementById('awaitingClientOwner')?.value || '';
    const note = document.getElementById('awaitingClientNote')?.value.trim() || '';
    if (!owner) return showAppleAlert('Missing Owner', 'Please select a follow-up owner.');
    const ownerInfo = resolveFollowUpOwnerSelection(owner);
    if (!ownerInfo.ok) return showAppleAlert('Follow-up Owner Needed', ownerInfo.message, { tone: 'warning', icon: 'user-round-x' });

    const btn = document.getElementById('btnAwaitingClientSave');
    const originalHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i><span>Saving...</span>';
        refreshIcons();
    }

    const oldSnapshot = { ...job };
    const oldStatus = job.work_status || 'Not started';
    const nowISO = new Date().toISOString();
    const payload = {
        work_status: WORK_STATUS_AWAITING_CLIENT,
        last_moved_at: nowISO,
        client_waiting_since: since,
        client_waiting_reason: reason,
        client_follow_up_date: followUp || null,
        client_follow_up_owner: ownerInfo.name,
        client_follow_up_owner_id: ownerInfo.id,
        client_waiting_note: note || null
    };
    if (normalizeWorkStatus(oldStatus) === 'client review') {
        payload.client_review_ended_at = nowISO;
        payload.client_review_auto_move_enabled = true;
    }

    try {
        let result = { savedFullPayload: true, row: null, source: 'direct' };
        if (normalizeWorkStatus(oldStatus) === 'client review') {
            result = await moveClientReviewToAwaitingInSupabase(jobID, payload, {
                source: 'manual_dialog',
                review_started_at: getClientReviewStartedAt(job)
            });
        } else {
            await saveCreativeRequestStatusPayload(jobID, payload);
            const periodInsert = await supabaseClient.from('task_client_waiting_periods').insert([{
                job_id: jobID,
                waiting_reason: reason,
                waiting_note: note,
                waiting_started_at: since,
                follow_up_date: followUp || null,
                follow_up_owner: ownerInfo.name,
                follow_up_owner_id: ownerInfo.id,
                created_by: getCurrentActor()
            }]);
            if (periodInsert.error) {
                throw annotateSupabaseError(periodInsert.error, 'task_client_waiting_periods.insert(active waiting period)', { jobID, payload });
            }
            await logTaskActivity(jobID, 'entered_awaiting_client', oldStatus, WORK_STATUS_AWAITING_CLIENT, note || reason, {
                reason,
                waiting_since: since,
                follow_up_date: followUp,
                follow_up_owner: ownerInfo.name,
                follow_up_owner_id: ownerInfo.id,
                saved_full_payload: true
            });
        }
        Object.assign(job, result.row || payload);
        closeSettingsDialog();
        renderBoards();
        if (typeof isKanbanMode !== 'undefined' && isKanbanMode) renderKanbanBoard();
        renderDashboard();
        await fetchSupabaseData(true, true);
        if (!skipModal) openDetailModal(jobID, true);
        showNotification('Client Blocked', ownerInfo.name);
    } catch(e) {
        Object.assign(job, oldSnapshot);
        renderBoards();
        if (typeof isKanbanMode !== 'undefined' && isKanbanMode) renderKanbanBoard();
        renderDashboard();
        showClientReviewMoveError(e, { operation: 'manual Awaiting Client save', jobID, payload, old_status: oldStatus });
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
            refreshIcons();
        }
    }
}

function openResolveAwaitingClientDialog(jobID, selectedStatus = 'Client Review', skipModal = false) {
    const job = globalData.find(d => d.job_id === jobID);
    if (!job) return showAppleAlert('Missing Task', 'This task could not be found.');
    const safeSelected = AWAITING_CLIENT_EXIT_STATUSES.includes(selectedStatus) ? selectedStatus : 'Client Review';
    openSettingsDialog({
        kind: 'resolve-awaiting-client',
        mode: 'modal',
        icon: 'circle-check-big',
        title: 'Client blocker resolved?',
        description: 'Close the waiting period and choose where this task should continue.',
        backdropClose: false,
        body: `
            <div class="settings-dialog-form">
                <div class="settings-change-list">
                    <div class="settings-change-row"><span>Waiting</span><strong>${getClientWaitingDays(job)} day(s)</strong></div>
                    <div class="settings-change-row"><span>Reason</span><strong>${escapeHtml(getClientWaitingReason(job))}</strong></div>
                </div>
                <label>Move To
                    <select id="resolveAwaitingStatus">
                        ${AWAITING_CLIENT_EXIT_STATUSES.map(status => `<option value="${status}" ${status === safeSelected ? 'selected' : ''}>${status}</option>`).join('')}
                    </select>
                </label>
                <label>Resolution Note
                    <textarea id="resolveAwaitingNote" rows="3" placeholder="What did the client/requester provide?"></textarea>
                </label>
            </div>
        `,
        footer: `
            <button type="button" class="settings-action-btn" onclick="cancelWorkflowDialog('${jobID}', ${skipModal})">Cancel</button>
            <button type="button" id="btnResolveAwaitingSave" class="settings-primary-btn" onclick="submitResolveAwaitingClient('${jobID}', ${skipModal})"><i data-lucide="save"></i><span>Resolve</span></button>
        `
    });
}

async function submitResolveAwaitingClient(jobID, skipModal = false) {
    const job = globalData.find(d => d.job_id === jobID);
    if (!job) return showAppleAlert('Missing Task', 'This task could not be found.');
    const destination = document.getElementById('resolveAwaitingStatus')?.value || 'Client Review';
    const note = document.getElementById('resolveAwaitingNote')?.value.trim() || '';
    const btn = document.getElementById('btnResolveAwaitingSave');
    const originalHtml = btn ? btn.innerHTML : '';
    const isDestinationDone = normalizeWorkStatus(destination) === 'done';
    if (isDestinationDone && !(await confirmMonthlyCompletionIfNeeded(job))) return;
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i><span>Saving...</span>';
        refreshIcons();
    }

    const oldSnapshot = { ...job };
    const oldStatus = job.work_status || WORK_STATUS_AWAITING_CLIENT;
    const nowISO = new Date().toISOString();
    const waitingDays = getClientWaitingDays(job);
    const payload = {
        work_status: destination,
        last_moved_at: nowISO,
        client_waiting_since: null,
        client_waiting_reason: null,
        client_follow_up_date: null,
        client_follow_up_owner: null,
        client_follow_up_owner_id: null,
        client_waiting_note: null
    };
    if (destination === 'Client Review') {
        payload.review_started_at = nowISO;
        payload.client_review_started_at = nowISO;
        payload.client_review_ended_at = null;
        payload.client_review_auto_moved_at = null;
        payload.client_review_meaningful_response_at = null;
        payload.client_review_auto_move_enabled = true;
        payload.client_review_auto_move_exempt = false;
        payload.client_review_exemption_reason = null;
        payload.client_review_audit_required = false;
        payload.client_review_start_source = 'manual_status_change';
        payload.auto_move_snoozed_until = null;
    }
    if (isDestinationDone) {
        payload.done_at = nowISO;
        payload.completed_at = getTaskCompletedAt(job) || nowISO;
    }
    const fallbackPayload = { work_status: destination, last_moved_at: nowISO };
    if (destination === 'Client Review') fallbackPayload.review_started_at = nowISO;
    if (isDestinationDone) fallbackPayload.done_at = payload.done_at;

    try {
        const result = await saveCreativeRequestStatusPayload(jobID, payload, fallbackPayload);
        try {
            await supabaseClient
                .from('task_client_waiting_periods')
                .update({ waiting_ended_at: nowISO, resolved_by: getCurrentActor(), resolution_status: destination, resolution_note: note })
                .eq('job_id', jobID)
                .is('waiting_ended_at', null);
        } catch(e) {
            console.warn('Client waiting period close saved via activity log only:', e.message);
        }
        await logTaskActivity(jobID, 'left_awaiting_client', oldStatus, destination, note || `Client waiting closed after ${waitingDays} day(s)`, {
            waiting_days: waitingDays,
            destination,
            saved_full_payload: result.savedFullPayload,
            completed_at: isDestinationDone ? payload.completed_at : '',
            client_review_started_at: destination === 'Client Review' ? nowISO : ''
        });
        Object.assign(job, payload);
        renderBoards();
        if (typeof isKanbanMode !== 'undefined' && isKanbanMode) renderKanbanBoard();
        renderDashboard();
        closeSettingsDialog();
        if (!skipModal && !isDestinationDone) openDetailModal(jobID, true);
        showNotification('Client Blocker Closed', destination);
        if (isDestinationDone) handleSuccessfulDoneTransition(jobID, { completedAt: payload.completed_at, moveAt: nowISO, oldStatus, source: 'awaiting_client_resolution' });
    } catch(e) {
        Object.assign(job, oldSnapshot);
        renderBoards();
        if (typeof isKanbanMode !== 'undefined' && isKanbanMode) renderKanbanBoard();
        renderDashboard();
        showAppleAlert('Status Update Error', e.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
            refreshIcons();
        }
    }
}

async function updateWorkStatusOptimistic(jobID, newStatus, skipModal = false) {
    const job = globalData.find(d => d.job_id === jobID);
    if (!job) return showAppleAlert('Missing Task', 'This task could not be found.');
    const oldSnapshot = { ...job };
    const oldStatus = job.work_status || 'Not started';
    const oldStatusKey = normalizeWorkStatus(oldStatus);
    const newStatusKey = normalizeWorkStatus(newStatus);

    // Kalau user pilih status yang sama, abaikan je
    if (oldStatusKey === newStatusKey) return;
    if (newStatusKey === 'done' && completionStatusInFlight.has(jobID)) return;
    if (newStatusKey === 'awaiting client' && !isTaskAwaitingClient(job)) {
        return openAwaitingClientDialog(jobID, skipModal);
    }
    if (isTaskAwaitingClient(job) && newStatusKey !== 'awaiting client') {
        return openResolveAwaitingClientDialog(jobID, newStatus, skipModal);
    }
    if (newStatusKey === 'done' && !(await confirmMonthlyCompletionIfNeeded(job))) {
        renderBoards();
        if (typeof isKanbanMode !== 'undefined' && isKanbanMode) renderKanbanBoard();
        if (!skipModal) openDetailModal(jobID, true);
        return;
    }
    if (newStatusKey === 'done') completionStatusInFlight.add(jobID);

    let updatePayload = { work_status: newStatus };
    const nowISO = new Date().toISOString();
    let revisionReasonText = "";

    // 🌟 LOGIK BARU: Tanya sebab kalau status ditarik/ditukar ke Revision
    if (newStatusKey === 'revision') {
        const reasonCode = await showApplePrompt(
            "Revision Category",
            "Type 1, 2, or 3:\n1 = Client Change of Mind\n2 = Internal Error (Team)\n3 = Minor Tweak",
            false // bukan password
        );

        // Kalau user tekan Cancel, batalkan pergerakan tiket dan kembalikan UI
        if (!reasonCode) {
            renderBoards();
            if (typeof isKanbanMode !== 'undefined' && isKanbanMode) renderKanbanBoard();
            if (!skipModal) openDetailModal(jobID, true);
            return;
        }

        if (reasonCode === '1') revisionReasonText = "Client Change of Mind";
        else if (reasonCode === '2') revisionReasonText = "Internal Error";
        else if (reasonCode === '3') revisionReasonText = "Minor Tweak";
        else revisionReasonText = "Others (" + reasonCode + ")";

        // Tambah count revision automatik
        let newRev = parseInt(job.revision || 0) + 1;
        const oldReasons = job.revision_reasons || "";
        const todayStr = nowISO.split('T')[0];
        const newEntry = `[${todayStr}] ${revisionReasonText}`;
        let updatedReasons = oldReasons ? oldReasons + " | " + newEntry : newEntry;

        updatePayload.revision = newRev;
        updatePayload.revision_reasons = updatedReasons;
    }

    // Rekod masa tepat bila status ditukar / di-drag
    updatePayload.last_moved_at = nowISO;

    if (newStatusKey === 'client review') {
        updatePayload.review_started_at = nowISO;
        updatePayload.client_review_started_at = nowISO;
        updatePayload.client_review_ended_at = null;
        updatePayload.client_review_auto_moved_at = null;
        updatePayload.client_review_meaningful_response_at = null;
        updatePayload.client_review_auto_move_enabled = true;
        updatePayload.client_review_auto_move_exempt = false;
        updatePayload.client_review_exemption_reason = null;
        updatePayload.client_review_audit_required = false;
        updatePayload.client_review_start_source = 'manual_status_change';
        updatePayload.auto_move_snoozed_until = null;
    } else if (newStatusKey === 'done') {
        updatePayload.done_at = job.done_at || nowISO;
        updatePayload.completed_at = getTaskCompletedAt(job) || nowISO;
        if (oldStatusKey === 'client review') updatePayload.client_review_ended_at = nowISO;
        if (oldStatusKey === 'awaiting client') {
            updatePayload.client_waiting_since = null;
            updatePayload.client_waiting_reason = null;
            updatePayload.client_follow_up_date = null;
            updatePayload.client_follow_up_owner = null;
            updatePayload.client_follow_up_owner_id = null;
            updatePayload.client_waiting_note = null;
        }
    } else if (oldStatusKey === 'client review') {
        updatePayload.client_review_ended_at = nowISO;
    }

    try {
        const fallbackPayload = { ...updatePayload };
        delete fallbackPayload.completed_at;
        const result = await saveCreativeRequestStatusPayload(jobID, updatePayload, fallbackPayload);
        await logTaskActivity(jobID, 'status_changed', oldStatus, newStatus, revisionReasonText, {
            update_payload: updatePayload,
            saved_full_payload: result.savedFullPayload,
            completed_at: newStatusKey === 'done' ? updatePayload.completed_at : '',
            client_review_started_at: newStatusKey === 'client review' ? nowISO : '',
            previous_status: oldStatus,
            new_status: newStatus
        });
        Object.assign(job, updatePayload);
        renderBoards();
        if (typeof isKanbanMode !== 'undefined' && isKanbanMode) renderKanbanBoard();
        renderDashboard();
        // Hanya buka modal jika bukan dipanggil dari Drag & Drop
        if (!skipModal && newStatusKey !== 'done') openDetailModal(jobID, true);
        showNotification('Status Updated', getWorkStatusLabel(newStatus));
        if (newStatusKey === 'done') handleSuccessfulDoneTransition(jobID, { completedAt: updatePayload.completed_at, moveAt: nowISO, oldStatus, source: skipModal ? 'drag_drop' : 'status_control' });
    } catch(e) {
        Object.assign(job, oldSnapshot);
        renderBoards();
        if (typeof isKanbanMode !== 'undefined' && isKanbanMode) renderKanbanBoard();
        renderDashboard();
        if (newStatusKey === 'client review') {
            showClientReviewMoveError(e, { operation: 'manual_client_review_status_update', jobID, payload: updatePayload });
        } else {
            showAppleAlert("Status Update Error", e.message);
        }
        if(!skipModal) openDetailModal(jobID, true);
    } finally {
        if (newStatusKey === 'done') completionStatusInFlight.delete(jobID);
    }
}

async function updateRevisionOptimistic(event, jobID, currentRev, change) {
    event.stopPropagation();
    const job = globalData.find(d => d.job_id === jobID);
    if(!job) return;

    let reasonText = "";

    // Minta sebab HANYA jika Admin tekan butang "+" (tambah revision)
    if (change > 0) {
        const reasonCode = await showApplePrompt(
            "Revision Category",
            "Type 1, 2, or 3:\n1 = Client Change of Mind\n2 = Internal Error (Team)\n3 = Minor Tweak",
            false // bukan password
        );

        if (!reasonCode) return; // Kalau admin tekan Cancel, batalkan proses

        if (reasonCode === '1') reasonText = "Client Change of Mind";
        else if (reasonCode === '2') reasonText = "Internal Error";
        else if (reasonCode === '3') reasonText = "Minor Tweak";
        else reasonText = "Others (" + reasonCode + ")";
    }

    let newRev = parseInt(job.revision || 0) + change;
    if (newRev < 0) newRev = 0;

    const oldRev = job.revision;
    const oldReasons = job.revision_reasons || "";
    const oldStatus = job.work_status; // Simpan status lama sekiranya berlaku error

    // Cantumkan log alasan lama dengan yang baru
    let updatedReasons = oldReasons;
    if (reasonText) {
        const todayStr = new Date().toISOString().split('T')[0];
        const newEntry = `[${todayStr}] ${reasonText}`;
        updatedReasons = oldReasons ? oldReasons + " | " + newEntry : newEntry;
    }

    // Kemaskini data di memori
    job.revision = newRev;
    job.revision_reasons = updatedReasons;

    // LOGIK BARU: Tukar status kepada Revision secara automatik
    if (change > 0) {
        job.work_status = 'Revision';
    }

    // 🌟 FIX: REFRESH KEDUA-DUA PAPARAN (BIASA & KANBAN)
    renderBoards();
    if (typeof isKanbanMode !== 'undefined' && isKanbanMode) renderKanbanBoard();

    openDetailModal(jobID, true);

    try {
        // Sediakan data untuk dihantar ke Supabase
        let updatePayload = {
            revision: newRev,
            revision_reasons: updatedReasons
        };

        if (change > 0) {
            updatePayload.work_status = 'Revision';
        }

        const { error } = await supabaseClient.from('creative_requests').update(updatePayload).eq('job_id', jobID);
        if(error) throw error;
        logTaskActivity(jobID, 'revision_updated', oldRev, newRev, reasonText, { previous_status: oldStatus, new_status: job.work_status });

    } catch(e) {
        showAppleAlert("Revision Error", e.message);
        // Rollback jika error
        job.revision = oldRev;
        job.revision_reasons = oldReasons;
        job.work_status = oldStatus;

        // 🌟 FIX: REFRESH KEDUA-DUA PAPARAN JIKA ERROR
        renderBoards();
        if (typeof isKanbanMode !== 'undefined' && isKanbanMode) renderKanbanBoard();

        openDetailModal(jobID, true);
    }
}

async function deleteJob(jobID) {
    await showApplePrompt("Delete Record", "Enter passcode to remove this record:", true, async (val) => {
        if(val !== SUPER_ADMIN_LOGIN_PASSCODE) return false;
        try {
            // LOGIK BARU: Kita guna Update, bukan Delete. (Sesuai dengan polisi RLS kita)
            const { error } = await supabaseClient.from('creative_requests').update({ status: 'deleted' }).eq('job_id', jobID);
            if(error) throw error;
            logTaskActivity(jobID, 'deleted', 'active', 'deleted', 'Moved to hidden archive');

            // Buang dari memori (skrin) supaya ia hilang terus dari pandangan
            globalData = globalData.filter(d => d.job_id !== jobID);
            renderDashboard();
            renderBoards();

            showNotification('Job Deleted', 'Moved to hidden archive');
            closeDetailModal();
            return true;
        } catch(e) {
            showAppleAlert("Error", "Failed to delete: " + e.message);
            return false;
        }
    });
}

function openArchiveModal() {
    const modal = document.getElementById('archiveModal');
    modal.style.display = 'flex';
    modal.offsetHeight;
    modal.classList.add('show');
}

function closeArchiveModal() {
    const modal = document.getElementById('archiveModal');
    modal.classList.remove('show');
    setTimeout(() => { modal.style.display = 'none'; document.body.classList.remove('no-scroll'); }, 400);
}

async function runArchive() {
    const start = document.getElementById('arch-start').value;
    const end = document.getElementById('arch-end').value;
    const securePin = localStorage.getItem('adtech_lead_pin');

    if(!start || !end) return showAppleAlert("Missing Information", "Please select both dates.");

    const btn = document.getElementById('btnConfirmArchive');
    const oriHtml = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Archiving...';
    btn.disabled = true;
    refreshIcons();

    try {
        const res = await fetch(GAS_API, { method: 'POST', body: JSON.stringify({ action: "archive_data", startDate: start, endDate: end, pin: securePin }) }).then(r => r.json());
        if(res.status === "success") {
            showNotification("Archive Success", `${res.moved} tasks securely archived.`);
            closeArchiveModal();
            await fetchSupabaseData(true);
        } else {
            showAppleAlert("Error", res.message || "Failed to archive data.");
        }
    } catch(e) {
        showAppleAlert("Archive Error", e.message);
    } finally {
        btn.innerHTML = oriHtml;
        btn.disabled = false;
        refreshIcons();
    }
}

async function loadArchivedJobs() {
    const btn = document.getElementById('btnLoadArchive');
    const oriHtml = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Loading...';
    btn.disabled = true;
    refreshIcons();

    try {
        const res = await fetch(GAS_API, { method: 'POST', body: JSON.stringify({ action: "get_archived_data" }) }).then(r => r.json());
        if(res.status === "success" && res.data) {
            const archived = res.data.map(d => {
                let mapped = {};
                for (let k in d) mapped[k.toLowerCase().replace(/[^a-z0-9]/g, '')] = d[k];
                return {
                    job_id: mapped.jobid || d.job_id || '', requester_name: mapped.requestername || mapped.name || mapped.requester || d.requester_name || '', region: mapped.region || d.region || '', client_name: mapped.clientname || mapped.client || d.client_name || '', project_title: mapped.projecttitle || mapped.title || d.project_title || '', job_type: mapped.jobtype || mapped.type || d.job_type || '', objective: mapped.objective || d.objective || '', brief: mapped.brief || d.brief || '', deadline: mapped.deadline || d.deadline || '', client_deadline: mapped.clientdeadline || d.client_deadline || mapped.deadline || d.deadline || '', original_client_deadline: mapped.originalclientdeadline || d.original_client_deadline || '', internal_due_date: mapped.internalduedate || d.internal_due_date || '', original_internal_due_date: mapped.originalinternalduedate || d.original_internal_due_date || '', completed_at: mapped.completedat || d.completed_at || '', ref_link: mapped.reflink || mapped.reference || d.ref_link || '', remarks: mapped.remarks || mapped.notes || d.remarks || '', status_notes: mapped.statusnotes || d.status_notes || '', status: (mapped.status || d.status || 'pending').toString().toLowerCase().trim(), assignee: mapped.assignee || mapped.pic || d.assignee || 'Unassigned', playbook_link: mapped.playbooklink || mapped.playbook || d.playbook_link || '', work_status: mapped.workstatus || mapped.progress || d.work_status || 'Not started', revision: mapped.revision || mapped.rev || d.revision || 0, approver: mapped.approver || d.approver || ''
                };
            });
            const combinedData = deduplicateTasks([...globalData, ...archived]);
            let doneData = combinedData.filter(d => String(d.status || '').toLowerCase() === 'approved' && String(d.work_status || '').toLowerCase() === 'done');
            doneData = sortDoneTasks(filterDataByRegion(doneData, isSuperAdmin ? currentRegionFilter : userRegion));
            const qD = document.getElementById('searchDone') ? document.getElementById('searchDone').value.toLowerCase() : '';
            if(qD) {
                doneData = sortDoneTasks(doneData.filter(d => String(d.job_id || '').toLowerCase().includes(qD) || String(d.client_name || '').toLowerCase().includes(qD) || String(d.requester_name || '').toLowerCase().includes(qD) || String(d.assignee || '').toLowerCase().includes(qD) || getTaskNoteValue(d).toLowerCase().includes(qD)));
            }
            if (doneData.length === 0) {
                document.getElementById('doneList').innerHTML = '<div class="empty-state"><i data-lucide="search-x"></i><p>No matching tasks found.</p></div>';
            } else {
                const groupedDone = {};
                doneData.forEach(item => {
                    let sortKey = "0000-00"; let displayLabel = "No Date";
                    const groupDate = getTaskCompletedAt(item) || getTaskClientDeadline(item);
                    if(groupDate) {
                        const d = parseDateOnly(groupDate);
                        if(d) {
                            sortKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`;
                            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                            displayLabel = `${months[d.getMonth()]} ${d.getFullYear()}`;
                        }
                    }
                    if(!groupedDone[sortKey]) groupedDone[sortKey] = { label: displayLabel, tasks: [] };
                    groupedDone[sortKey].tasks.push(item);
                });
                const sortedKeys = Object.keys(groupedDone).sort((a, b) => b.localeCompare(a));
                let doneHtml = '<h3 style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding:10px; background:var(--bg-box); border-radius:8px; margin-bottom:20px;">✅ Showing Active + Archived Tasks</h3>';
                sortedKeys.forEach(key => {
                    const group = groupedDone[key];
                    group.tasks = sortDoneTasks(group.tasks);
                    doneHtml += `<h3 class="month-group-header">${group.label} <span class="month-group-badge">${group.tasks.length} Tasks</span></h3>`;
                    doneHtml += `<div class="project-grid">` + group.tasks.map((item, idx) => generateJobCard(item, true, idx)).join('') + `</div>`;
                });
                document.getElementById('doneList').innerHTML = doneHtml;
            }
            showNotification("Archive Loaded", "Old tasks are visible below.");
            btn.style.display = 'none';
        }
    } catch(e) {
        showAppleAlert("Error", "Failed to load archive: " + e.message);
    } finally {
        btn.innerHTML = oriHtml;
        btn.disabled = false;
        refreshIcons();
    }
}

function exportToCSV() {
    if (!globalData || globalData.length === 0) return showAppleAlert("Export Failed", "No data available to export.");
    const finalRegion = isSuperAdmin ? currentRegionFilter : userRegion;
    let doneData = globalData.filter(d => String(d.status).toLowerCase() === 'approved' && String(d.work_status).toLowerCase() === 'done');
    doneData = filterDataByRegion(doneData, finalRegion);

    if (doneData.length === 0) return showAppleAlert("Export Failed", "No completed tasks available to export for this region.");

    const headers = ["Job ID", "Client Name", "Project Title", "Requester", "Region", "Job Type", "Objective", "Client Deadline", "Internal Due Date", "Revision", "Revision Reasons", "Assigned Team", "Playbook Link", "Created At", "Review Started At", "Done At", "Completed At"];

    const rows = doneData.map(d => [
        d.job_id, d.client_name, d.project_title, d.requester_name, d.region, d.job_type, d.objective, formatDate(getTaskClientDeadline(d)), formatDate(getTaskEffectiveInternalDueDate(d)), (d.revision || 0), d.revision_reasons, d.assignee, d.playbook_link,
        d.created_at ? new Date(d.created_at).toLocaleString('en-GB') : '',
        d.review_started_at ? new Date(d.review_started_at).toLocaleString('en-GB') : '',
        d.done_at ? new Date(d.done_at).toLocaleString('en-GB') : '',
        getTaskCompletedAt(d) ? new Date(getTaskCompletedAt(d)).toLocaleString('en-GB') : ''
    ].map(val => `"${(val || '').toString().replace(/"/g, '""')}"`).join(","));

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Adtechinno_${finalRegion}_Done_Tasks_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

function csvCell(value) {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function rowsToCSV(headers, rows) {
    return [headers.map(csvCell).join(','), ...rows.map(row => headers.map(h => csvCell(row[h])).join(','))].join('\n');
}

function downloadTextFile(filename, content, type = 'text/plain;charset=utf-8;') {
    const blob = new Blob([content], { type });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 500);
}

function getReportingTasks() {
    const finalRegion = isSuperAdmin ? currentRegionFilter : userRegion;
    let tasks = (globalData || []).filter(d => String(d.status || '').toLowerCase() !== 'deleted');
    return filterDataByRegion(tasks, finalRegion);
}

function getTaskCompletionHours(task) {
    const completedAt = getTaskCompletedAt(task);
    if (!task.created_at || !completedAt) return '';
    const start = new Date(task.created_at);
    const done = new Date(completedAt);
    if (isNaN(start) || isNaN(done)) return '';
    return Math.round(((done - start) / (1000 * 60 * 60)) * 10) / 10;
}

function getTaskOverdueDays(task) {
    const due = getTaskEffectiveInternalDueDate(task);
    if (!due || isTaskAwaitingClient(task) || isTaskClientReview(task)) return '';
    const deadline = parseDateOnly(due);
    const endDate = parseDateOnly(getTaskCompletedAt(task) || new Date());
    if (!deadline || !endDate) return '';
    const diff = Math.ceil((endDate - deadline) / 86400000);
    return Math.max(0, diff);
}

function getHoursBetween(startStr, endStr = new Date().toISOString()) {
    if (!startStr) return '';
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start) || isNaN(end)) return '';
    return Math.round(((end - start) / (1000 * 60 * 60)) * 10) / 10;
}

function getMonthlyDeliverableTotalForReport(task) {
    const summary = getMonthlyDeliverableSummary(task);
    return summary?.total || '';
}

function getMonthlyReadyForReport(task) {
    const summary = getMonthlyDeliverableSummary(task);
    if (!summary?.total) return '';
    const ready = getMonthlyReadyCount(task, summary.total);
    return ready === '' ? '' : ready;
}

function getLatestDeadlineChangeReason(task) {
    if (task.latest_deadline_change_reason) return task.latest_deadline_change_reason;
    const log = getTaskLogs(task.job_id).find(row => row.action_type === 'deadline_changed');
    return log?.note_text || '';
}

function getStatusPeriodCount(task, statusName) {
    const key = normalizeWorkStatus(statusName);
    const statusLogTypes = new Set(['status_changed', 'entered_awaiting_client', 'left_awaiting_client', 'client_review_auto_moved', 'client_review_manual_moved_to_awaiting', 'client_review_auto_move_undone']);
    const logs = getTaskLogs(task.job_id).filter(log =>
        statusLogTypes.has(log.action_type) &&
        normalizeWorkStatus(log.new_value) === key
    );
    if (logs.length) return logs.length;
    return normalizeWorkStatus(task.work_status) === key ? 1 : 0;
}

function getClientReviewWorkingDaysForReport(task) {
    if (isTaskClientReview(task)) {
        const age = getClientReviewAge(task);
        return age.workingDays ?? '';
    }
    const start = getClientReviewStartedAt(task);
    const end = getClientReviewEndedAt(task);
    const value = start && end ? calculateWorkingDaysBetween(start, end) : null;
    return value === null ? '' : value;
}

function getClientReviewCalendarDaysForReport(task) {
    const start = getClientReviewStartedAt(task);
    const end = isTaskClientReview(task) ? new Date().toISOString() : getClientReviewEndedAt(task);
    const hours = start && end ? getHoursBetween(start, end) : '';
    return hours === '' ? '' : Math.round((Number(hours) / 24) * 10) / 10;
}

function getClientReviewAutoMoveEligibility(task) {
    if (!isTaskClientReview(task)) return '';
    const age = getClientReviewAge(task);
    if (age.auditRequired) return 'audit_required';
    if (age.urgency === 'missing') return 'missing_review_start';
    if (age.exempt) return 'exempt';
    if (age.snoozed) return 'snoozed';
    if (age.responded) return 'client_response_recorded';
    if (age.eligibleForAutoMove) return 'eligible';
    if (age.urgency === 'moving-soon') return 'eligible_after_today';
    return 'not_yet';
}

function wasClientReviewAutoMoved(task) {
    return Boolean(task.client_review_auto_moved_at) || getTaskLogs(task.job_id).some(log => log.action_type === 'client_review_auto_moved');
}

function getFollowUpOverdueDaysForReport(task) {
    const diff = getDateOnlyDiffDays(getClientFollowUpDate(task));
    return diff !== null && diff < 0 ? Math.abs(diff) : '';
}

function getLatestStatusChangeSource(task) {
    const log = getTaskLogs(task.job_id).find(row => row.action_type === 'client_review_auto_moved' || row.action_type === 'status_changed' || row.action_type === 'entered_awaiting_client');
    if (!log) return '';
    if (log.action_type === 'client_review_auto_moved') return 'automated';
    if (String(log.actor_name || '').toLowerCase().includes('system')) return 'automated';
    return 'manual';
}

function getClientWaitingDaysForReport(task) {
    let totalHours = 0;
    const logs = getTaskLogs(task.job_id).filter(log => ['entered_awaiting_client', 'left_awaiting_client'].includes(log.action_type)).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    let openStart = null;
    logs.forEach(log => {
        if (log.action_type === 'entered_awaiting_client') openStart = new Date(log.created_at);
        if (log.action_type === 'left_awaiting_client' && openStart) {
            const end = new Date(log.created_at);
            if (!isNaN(openStart) && !isNaN(end)) totalHours += (end - openStart) / 36e5;
            openStart = null;
        }
    });
    if (isTaskAwaitingClient(task) && getClientWaitingSince(task)) {
        const start = new Date(getClientWaitingSince(task));
        if (!isNaN(start)) totalHours += (new Date() - start) / 36e5;
    }
    return Math.round((totalHours / 24) * 10) / 10;
}

function getInternalActiveDaysForReport(task) {
    const start = new Date(task.approved_at || task.created_at || '');
    const end = new Date(getTaskCompletedAt(task) || new Date());
    if (isNaN(start) || isNaN(end)) return '';
    const totalDays = (end - start) / 86400000;
    const clientSideDays = Number(getClientWaitingDaysForReport(task) || 0) + Number(getClientReviewCalendarDaysForReport(task) || 0);
    return Math.max(0, Math.round((totalDays - clientSideDays) * 10) / 10);
}

function getReportingDataGapRows(tasks) {
    return tasks.map(task => {
        const gaps = [];
        const recommendations = [];
        const status = String(task.status || '').toLowerCase();
        const workStatus = String(task.work_status || '').toLowerCase();
        const noteCount = getTaskNoteCount(task);

        if (!task.requester_name) { gaps.push('requester_name'); recommendations.push('Select/requester name is required.'); }
        if (!task.region) { gaps.push('region'); recommendations.push('Set office/region for regional reporting.'); }
        if (!task.job_type) { gaps.push('job_type'); recommendations.push('Use request type consistently: Monthly, Ad-hoc, Pitch.'); }
        if (!getTaskClientDeadline(task)) { gaps.push('client_deadline'); recommendations.push('Client deadline is needed for final delivery and SLA reporting.'); }
        if (status === 'approved' && !getTaskEffectiveInternalDueDate(task) && !isTaskAwaitingClient(task) && workStatus !== 'done') { gaps.push('internal_due_date'); recommendations.push('Set internal due date for urgency sorting and PIC workload reporting.'); }
        if (!task.brief) { gaps.push('brief'); recommendations.push('Brief quality affects revision and cycle-time analysis.'); }
        if (status === 'approved' && (!task.assignee || task.assignee === 'Unassigned')) { gaps.push('assignee'); recommendations.push('Assign a PIC before work starts.'); }
        if (status === 'approved' && !task.playbook_link) { gaps.push('playbook_link'); recommendations.push('Add playbook/working link for audit and handover.'); }
        if (workStatus === 'done' && !task.done_at) { gaps.push('done_at'); recommendations.push('Capture done_at when closing task.'); }
        if (workStatus === 'done' && !getTaskCompletedAt(task)) { gaps.push('completed_at'); recommendations.push('Capture completed_at for lifecycle reporting.'); }
        if (isTaskClientReview(task) && !getClientReviewStartedAt(task)) { gaps.push('client_review_started_at'); recommendations.push('Record when Client Review started before automation can act.'); }
        if (isTaskAwaitingClient(task) && !getClientFollowUpDate(task)) { gaps.push('client_follow_up_date'); recommendations.push('Set a follow-up date for every client-blocked task.'); }
        if (isTaskAwaitingClient(task) && !getClientFollowUpOwner(task)) { gaps.push('client_follow_up_owner'); recommendations.push('Assign an owner for client follow-up.'); }
        if (noteCount === 0 && status === 'approved') { gaps.push('notes_history'); recommendations.push('Add at least one task note for monthly reporting context.'); }
        if (Number(task.revision || 0) > 0 && !task.revision_reasons) { gaps.push('revision_reasons'); recommendations.push('Record revision reasons to identify brief/client/workflow issues.'); }

        return {
            job_id: task.job_id,
            client_name: task.client_name,
            project_title: task.project_title,
            status: task.status,
            work_status: getWorkStatusLabel(task.work_status || 'Not started'),
            missing_fields: gaps.join(' | '),
            recommendation: recommendations.join(' | ')
        };
    }).filter(row => row.missing_fields);
}

function buildTeamSummaryRows(tasks) {
    const summary = {};
    tasks.forEach(task => {
        const assignees = getAssignedPICNames(task.assignee);
        const names = assignees.length ? assignees : ['Unassigned'];
        names.forEach(name => {
            if (!summary[name]) {
                summary[name] = {
                    pic: name,
                    active_tasks: 0,
                    completed_tasks: 0,
                    overdue_tasks: 0,
                    client_blocked_tasks: 0,
                    client_review_aging_tasks: 0,
                    missing_internal_due_tasks: 0,
                    total_revisions: 0,
                    avg_completion_hours: '',
                    job_types: {},
                    regions: {}
                };
            }

            const row = summary[name];
            const isDone = String(task.work_status || '').toLowerCase() === 'done';
            if (isDone) row.completed_tasks += 1;
            else if (String(task.status || '').toLowerCase() === 'approved') row.active_tasks += 1;

            if (Number(getTaskOverdueDays(task)) > 0) row.overdue_tasks += 1;
            if (isTaskAwaitingClient(task)) row.client_blocked_tasks += 1;
            if (isClientReviewAgingTask(task)) row.client_review_aging_tasks = (row.client_review_aging_tasks || 0) + 1;
            if (String(task.status || '').toLowerCase() === 'approved' && !isDone && !isTaskAwaitingClient(task) && !getTaskEffectiveInternalDueDate(task)) row.missing_internal_due_tasks += 1;
            row.total_revisions += Number(task.revision || 0);
            row.job_types[task.job_type || 'Unknown'] = (row.job_types[task.job_type || 'Unknown'] || 0) + 1;
            row.regions[task.region || 'Unknown'] = (row.regions[task.region || 'Unknown'] || 0) + 1;
        });
    });

    Object.values(summary).forEach(row => {
        const completed = tasks.filter(task => {
            const assignees = getAssignedPICNames(task.assignee);
            return String(task.work_status || '').toLowerCase() === 'done' && (assignees.includes(row.pic) || (!assignees.length && row.pic === 'Unassigned'));
        });
        const hours = completed.map(getTaskCompletionHours).filter(v => v !== '').map(Number);
        row.avg_completion_hours = hours.length ? Math.round((hours.reduce((a, b) => a + b, 0) / hours.length) * 10) / 10 : '';
        row.job_types = Object.entries(row.job_types).map(([k, v]) => `${k}: ${v}`).join(' | ');
        row.regions = Object.entries(row.regions).map(([k, v]) => `${k}: ${v}`).join(' | ');
    });

    return Object.values(summary).sort((a, b) => (b.active_tasks + b.completed_tasks) - (a.active_tasks + a.completed_tasks));
}

function buildStatusAgingRows(tasks) {
    const rows = [];
    tasks.forEach(task => {
        const statusLogTypes = new Set(['status_changed', 'entered_awaiting_client', 'left_awaiting_client', 'client_review_auto_moved', 'client_review_manual_moved_to_awaiting', 'client_review_auto_move_undone']);
        const logs = getTaskLogs(task.job_id)
            .filter(log => statusLogTypes.has(log.action_type) && log.new_value)
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        if (!logs.length) {
            rows.push({
                job_id: task.job_id,
                client_name: task.client_name,
                project_title: task.project_title,
                status: getWorkStatusLabel(task.work_status || task.status || 'Unknown'),
                started_at: getStatusStartedAt(task),
                ended_at: getTaskCompletedAt(task) || '',
                duration_hours: getStatusStartedAt(task) ? Math.round(((new Date(getTaskCompletedAt(task) || new Date()) - new Date(getStatusStartedAt(task))) / (1000 * 60 * 60)) * 10) / 10 : '',
                duration_working_days: getStatusStartedAt(task) ? calculateWorkingDaysBetween(getStatusStartedAt(task), getTaskCompletedAt(task) || new Date()) : '',
                source: 'current_or_legacy'
            });
            return;
        }

        logs.forEach((log, index) => {
            const next = logs[index + 1];
            const end = next ? next.created_at : (getTaskCompletedAt(task) || new Date().toISOString());
            rows.push({
                job_id: task.job_id,
                client_name: task.client_name,
                project_title: task.project_title,
                status: getWorkStatusLabel(log.new_value || ''),
                started_at: log.created_at,
                ended_at: next ? next.created_at : '',
                duration_hours: Math.round(((new Date(end) - new Date(log.created_at)) / (1000 * 60 * 60)) * 10) / 10,
                duration_working_days: calculateWorkingDaysBetween(log.created_at, end),
                source: log.action_type || 'status_log'
            });
        });
    });
    return rows;
}

function buildReportContext(tasks) {
    const region = isSuperAdmin ? currentRegionFilter : userRegion;
    const generatedAt = new Date().toLocaleString('en-MY');
    return `# Adtechinno Creative Ops Report Pack

Generated: ${generatedAt}
Region filter: ${region}
Total tasks exported: ${tasks.length}

## How To Use With ChatGPT
Upload all CSV files together and ask ChatGPT to analyze capacity, bottlenecks, productivity, and hiring justification.

Suggested prompt:
"You are a creative operations analyst. Analyze these exported files from our creative request system. Identify workload trends, bottlenecks by status, internal due date risks, client waiting delays, overdue patterns, revision causes, team capacity issues, and recommendations to improve speed, productivity, and efficiency. Separate creative execution delays from client/requester-blocked delays. Then propose whether team expansion is justified, which roles/regions need support, and what workflow changes would give the highest impact."

## Files
- tasks.csv: One row per task with lifecycle, status, client deadline, internal due date, Client Review aging, Awaiting Client follow-up, assignee, revision, latest note, monthly progress, and completion metrics.
- activity_logs.csv: Admin/system tracking timeline of actions.
- notes_history.csv: Full public task notes thread with author/status/time.
- team_summary.csv: Workload, completion, internal overdue, client-blocked, and missing-internal-due summary by PIC.
- status_aging.csv: Calendar and working-day time spent in current or historical statuses.
- data_gaps.csv: Missing fields that weaken reporting quality.

## Reporting Principles
Use this data for capacity planning and process improvement, not individual blame. Separate creative workload delays from client review delays, unclear briefs, revision causes, notes context, and leave/handover impact.
`;
}

async function exportReportPack() {
    if (!hasAdminAccess()) return showAppleAlert("Admin Only", "Please unlock Admin Access first.");

    const tasks = getReportingTasks();
    if (!tasks.length) return showAppleAlert("Export Failed", "No tasks available for the current region filter.");

    const taskIds = new Set(tasks.map(t => t.job_id));
    // Full activity/note history is no longer kept resident for every task — load it just for the
    // tasks in this report, on demand, right before building the CSVs.
    showNotification('Preparing Export', 'Loading full task history…');
    await fetchAndMergeTaskLogs([...taskIds]);
    const activityLogs = (globalActivityLogs || []).map(normalizeLogRow).filter(log => taskIds.has(log.job_id));
    const noteLogs = (globalNoteLogs || []).map(normalizeNoteRow).filter(log => taskIds.has(log.job_id));
    const date = new Date().toISOString().split('T')[0];
    const region = (isSuperAdmin ? currentRegionFilter : userRegion).replace(/\s+/g, '_');
    const base = `Adtechinno_${region}_Report_${date}`;

    const taskRows = tasks.map(task => {
        const latestNote = getLatestTaskNote(task);
        const statusStartedAt = getStatusStartedAt(task);
        const duePlan = generateSuggestedInternalDueForTask(task);
        const clientDeadlineDiff = getDateOnlyDiffDays(getTaskClientDeadline(task));
        const reviewAge = getClientReviewAge(task);
        return {
            job_id: task.job_id,
            client_name: task.client_name,
            project_title: task.project_title,
            requester_name: task.requester_name,
            region: task.region,
            job_type: task.job_type,
            status: task.status,
            work_status: getWorkStatusLabel(task.work_status || 'Not started'),
            work_status_key: normalizeWorkStatus(task.work_status || 'Not started').replace(/\s+/g, '_'),
            assignee: getAssigneeDisplay(task.assignee),
            deadline: task.deadline,
            original_client_deadline: getTaskOriginalClientDeadline(task),
            client_deadline: getTaskClientDeadline(task),
            original_internal_due_date: getTaskOriginalInternalDueDate(task),
            internal_due_date: getTaskInternalDueDate(task),
            effective_internal_due_date: getTaskEffectiveInternalDueDate(task),
            internal_due_source: getTaskInternalDueSource(task) || (getTaskInternalDueDate(task) ? 'legacy' : (getTaskEffectiveInternalDueDate(task) ? 'derived_pending_backfill' : '')),
            internal_due_manually_adjusted: String(isInternalDueManuallyAdjusted(task)),
            suggested_internal_due_date: duePlan.date,
            internal_due_buffer_days: duePlan.bufferDays || '',
            internal_due_complexity: duePlan.complexity || '',
            internal_due_generation_status: duePlan.flag || '',
            missing_internal_due_date: String(!getTaskEffectiveInternalDueDate(task) && String(task.status || '').toLowerCase() === 'approved' && !isTaskDone(task)),
            created_at: task.created_at,
            approved_by: task.approver,
            review_started_at: task.review_started_at,
            client_review_started_at: getClientReviewStartedAt(task),
            client_review_ended_at: getClientReviewEndedAt(task),
            client_review_calendar_days: getClientReviewCalendarDaysForReport(task),
            client_review_working_days: getClientReviewWorkingDaysForReport(task),
            client_review_window_days: getTaskClientReviewWindowDays(task),
            client_review_urgency: isTaskClientReview(task) ? reviewAge.urgency : '',
            client_review_auto_move_eligibility: getClientReviewAutoMoveEligibility(task),
            client_review_auto_move_exempt: String(isTruthyFlag(task.client_review_auto_move_exempt)),
            client_review_exemption_reason: task.client_review_exemption_reason || '',
            client_review_auto_moved: String(wasClientReviewAutoMoved(task)),
            client_review_auto_moved_at: task.client_review_auto_moved_at || '',
            client_review_meaningful_response_at: getClientReviewMeaningfulResponseAt(task),
            client_review_periods: getStatusPeriodCount(task, 'Client Review'),
            done_at: task.done_at,
            completed_at: getTaskCompletedAt(task),
            completion_hours: getTaskCompletionHours(task),
            internal_overdue_days: getTaskOverdueDays(task),
            client_overdue_days: getTaskClientOverdueDays(task),
            client_deadline_passed: String(clientDeadlineDiff !== null && clientDeadlineDiff < 0 && !isTaskDone(task)),
            client_blocked: String(isTaskAwaitingClient(task)),
            client_waiting_since: getClientWaitingSince(task),
            client_waiting_reason: isTaskAwaitingClient(task) ? getClientWaitingReason(task) : '',
            client_follow_up_date: getClientFollowUpDate(task),
            client_follow_up_owner: getClientFollowUpOwner(task),
            client_follow_up_overdue_days: getFollowUpOverdueDaysForReport(task),
            client_waiting_days: getClientWaitingDaysForReport(task),
            awaiting_client_periods: getStatusPeriodCount(task, WORK_STATUS_AWAITING_CLIENT),
            latest_status_change_source: getLatestStatusChangeSource(task),
            internal_active_days_ex_client_wait: getInternalActiveDaysForReport(task),
            internal_active_days_ex_client_review_and_wait: getInternalActiveDaysForReport(task),
            deadline_extension_count: task.deadline_extension_count || 0,
            latest_deadline_change_reason: getLatestDeadlineChangeReason(task),
            revision: task.revision || 0,
            revision_reasons: task.revision_reasons || '',
            notes_count: getTaskNoteCount(task),
            latest_note: latestNote?.note_text || '',
            latest_note_by: latestNote?.actor_name || '',
            latest_note_at: latestNote?.created_at || '',
            monthly_deliverables_total: getMonthlyDeliverableTotalForReport(task),
            monthly_deliverables_ready: getMonthlyReadyForReport(task),
            playbook_link: task.playbook_link || '',
            last_update_at: getLastUpdateAt(task),
            current_status_started_at: statusStartedAt,
            current_status_age: formatDurationFrom(statusStartedAt),
            current_status_age_hours: getHoursBetween(statusStartedAt),
            client_review_age_hours: isTaskClientReview(task) ? getHoursBetween(getClientReviewStartedAt(task)) : '',
            status_when_client_deadline_passed: clientDeadlineDiff !== null && clientDeadlineDiff < 0 ? (task.work_status || task.status || '') : ''
        };
    });

    const activityRows = activityLogs.map(log => ({
        job_id: log.job_id,
        action_type: log.action_type,
        actor_name: log.actor_name,
        old_value: log.old_value,
        new_value: log.new_value,
        note_text: log.note_text,
        meta: typeof log.meta === 'string' ? log.meta : JSON.stringify(log.meta || {}),
        created_at: log.created_at
    }));

    const taskById = Object.fromEntries(tasks.map(task => [task.job_id, task]));
    const noteRows = noteLogs.map(log => {
        const task = taskById[log.job_id] || {};
        return {
            job_id: log.job_id,
            client_name: task.client_name || '',
            project_title: task.project_title || '',
            assignee: getAssigneeDisplay(task.assignee),
            actor_name: log.actor_name,
            status_at_time: log.status_at_time,
            note_text: log.note_text,
            created_at: log.created_at
        };
    });

    const teamRows = buildTeamSummaryRows(tasks);
    const agingRows = buildStatusAgingRows(tasks);
    const dataGapRows = getReportingDataGapRows(tasks);

    downloadTextFile(`${base}_tasks.csv`, rowsToCSV(Object.keys(taskRows[0]), taskRows), 'text/csv;charset=utf-8;');
    downloadTextFile(`${base}_activity_logs.csv`, rowsToCSV(['job_id', 'action_type', 'actor_name', 'old_value', 'new_value', 'note_text', 'meta', 'created_at'], activityRows), 'text/csv;charset=utf-8;');
    downloadTextFile(`${base}_notes_history.csv`, rowsToCSV(['job_id', 'client_name', 'project_title', 'assignee', 'actor_name', 'status_at_time', 'note_text', 'created_at'], noteRows), 'text/csv;charset=utf-8;');
    downloadTextFile(`${base}_team_summary.csv`, rowsToCSV(['pic', 'active_tasks', 'completed_tasks', 'overdue_tasks', 'client_blocked_tasks', 'client_review_aging_tasks', 'missing_internal_due_tasks', 'total_revisions', 'avg_completion_hours', 'job_types', 'regions'], teamRows), 'text/csv;charset=utf-8;');
    downloadTextFile(`${base}_status_aging.csv`, rowsToCSV(['job_id', 'client_name', 'project_title', 'status', 'started_at', 'ended_at', 'duration_hours', 'duration_working_days', 'source'], agingRows), 'text/csv;charset=utf-8;');
    downloadTextFile(`${base}_data_gaps.csv`, rowsToCSV(['job_id', 'client_name', 'project_title', 'status', 'work_status', 'missing_fields', 'recommendation'], dataGapRows), 'text/csv;charset=utf-8;');
    downloadTextFile(`${base}_report_context.md`, buildReportContext(tasks), 'text/markdown;charset=utf-8;');

    showNotification('Report Pack Exported', 'Upload the files to ChatGPT');
}

// ========================================================
// 🌟 11. PENGURUSAN CUTI (LEAVE MANAGEMENT) -> SUPABASE
// ========================================================
function checkLeaveAccess(userName) {
    const btn = document.getElementById('btn-leave');
    if(!btn) return;
    const cleanUser = userName.replace(/\s+/g, '').toLowerCase();
    let matchedPic = null;
    for(let i=0; i<PIC_LIST.length; i++) {
        if(cleanUser.includes(PIC_LIST[i].replace(/\s+/g, '').toLowerCase())) {
            matchedPic = PIC_LIST[i];
            break;
        }
    }
    if(matchedPic) {
        btn.style.display = 'flex';
        const leaveSelect = document.getElementById('leaveName');
        if(leaveSelect) {
            leaveSelect.value = matchedPic;
            renderLeaveHistory();
        }
    } else {
        btn.style.display = 'none';
    }
}

function renderLeaveHistory() {
    const name = document.getElementById('leaveName').value;
    const container = document.getElementById('leaveHistoryContainer');
    const list = document.getElementById('leaveHistoryList');

    if(!name) { container.style.display = 'none'; return; }

    const memberInfo = globalTeamStatus.find(t => t.Name === name);
    if(memberInfo && memberInfo.Status && memberInfo.Start_Date && memberInfo.End_Date) {
        const statuses = memberInfo.Status.toString().split('|').map(s => s.trim());
        const starts = memberInfo.Start_Date.toString().split('|').map(s => s.trim());
        const ends = memberInfo.End_Date.toString().split('|').map(s => s.trim());
        let html = '';
        let hasLeaves = false;

        for(let i=0; i<starts.length; i++) {
            if(starts[i] && ends[i]) {
                hasLeaves = true;
                let leaveLabel = 'On Leave';
                let match = statuses[i].toString().match(/\(([^)]+)\)/);
                if(match) leaveLabel = match[1];
                html += `<div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-box); padding: 10px 15px; border-radius: 8px; border: 1px solid var(--border-main);"><div><strong style="font-size: 0.85rem; color: var(--text-strong);">${formatDate(starts[i])} - ${formatDate(ends[i])}</strong><div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">${leaveLabel}</div></div><button onclick="cancelLeave(${i})" style="background: transparent; color: var(--red); border: 1px solid var(--red); border-radius: 6px; padding: 4px 8px; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: 0.2s;" onmouseover="this.style.background='rgba(239,68,68,0.1)'" onmouseout="this.style.background='transparent'"><i data-lucide="x" style="width: 14px; height: 14px;"></i> Cancel</button></div>`;
            }
        }

        if(hasLeaves) {
            list.innerHTML = html;
            container.style.display = 'block';
            refreshIcons();
        } else {
            container.style.display = 'none';
        }
    } else {
        container.style.display = 'none';
    }
}

async function cancelLeave(index) {
    await showApplePrompt("Cancel Leave", "Enter your Passcode to cancel this leave:", true, async (val) => {
        const name = document.getElementById('leaveName').value;
        const memberInfo = globalTeamStatus.find(t => t.Name === name);
        if (memberInfo && memberInfo.Passcode && memberInfo.Passcode !== val) return false;

        let existingStatuses = memberInfo.Status.toString().split('|').map(s => s.trim()).filter(s => s);
        let existingStarts = memberInfo.Start_Date.toString().split('|').map(s => s.trim()).filter(s => s);
        let existingEnds = memberInfo.End_Date.toString().split('|').map(s => s.trim()).filter(s => s);

        existingStatuses.splice(index, 1);
        existingStarts.splice(index, 1);
        existingEnds.splice(index, 1);

        let finalStatus = existingStatuses.join(' | ');
        let finalStart = existingStarts.join(' | ');
        let finalEnd = existingEnds.join(' | ');

        try {
            const { error } = await supabaseClient.from('team_leaves').update({ status: finalStatus, start_date: finalStart, end_date: finalEnd, updated_at: new Date().toISOString() }).eq('name', name);
            if(error) throw error;

            memberInfo.Status = finalStatus;
            memberInfo.Start_Date = finalStart;
            memberInfo.End_Date = finalEnd;

            renderLeaveHistory();
            renderDashboard();
            showNotification('Leave Cancelled', '');
            return true;
        } catch(e) {
            console.error(e);
            return false;
        }
    });
}

async function submitLeave(statusParam) {
    const name = document.getElementById('leaveName').value;
    const passcode = document.getElementById('leavePasscode').value;
    let startDate = document.getElementById('leaveStart').value;
    let endDate = document.getElementById('leaveEnd').value;

    // Tarik nilai kotak Session
    let sessionValue = document.getElementById('leaveSession') ? document.getElementById('leaveSession').value : 'Full Day';

    if(!name || !passcode) return showAppleAlert("Missing Info", "Please enter Name and Passcode.");
    const memberInfo = globalTeamStatus.find(t => t.Name === name);
    if (memberInfo && memberInfo.Passcode && memberInfo.Passcode !== passcode) { return showAppleAlert("Error", "Incorrect passcode."); }

    let finalStatus = ""; let finalStart = ""; let finalEnd = ""; let displayLeave = "";
    let existingStatuses = []; let existingStarts = []; let existingEnds = [];

    if(memberInfo && memberInfo.Status && memberInfo.Start_Date && memberInfo.End_Date) {
        existingStatuses = memberInfo.Status.toString().split('|').map(s => s.trim()).filter(s => s);
        existingStarts = memberInfo.Start_Date.toString().split('|').map(s => s.trim()).filter(s => s);
        existingEnds = memberInfo.End_Date.toString().split('|').map(s => s.trim()).filter(s => s);
    }

    if(statusParam === 'Active') {
        finalStatus = ""; finalStart = ""; finalEnd = "";
        const btnReset = document.getElementById('btnResetLeave');
        btnReset.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Restoring Tasks...';
        btnReset.disabled = true;
        await processReturnFromLeave(name);
        btnReset.innerHTML = '<i data-lucide="check-circle"></i> I\'m Back (Reset)';
        btnReset.disabled = false;

    } else {
        if(!startDate || !endDate) return showAppleAlert("Missing Dates", "Please select leave start and end dates.");
        if(endDate < startDate) return showAppleAlert("Invalid Dates", "End Date cannot be before Start Date.");

        const lType = document.getElementById('leaveType').value;
        const lOther = document.getElementById('leaveOtherInput').value.trim().replace(/\|/g, '');
        let baseLeave = lType;
        if (lType === 'Others' && lOther) { baseLeave = lOther; }

        // 🌟 LOGIK BARU: Hanya letak label AM/PM jika cuti 1 hari dan jenis Annual Leave
        if (startDate === endDate && sessionValue !== 'Full Day' && lType === 'Annual Leave') {
            displayLeave = baseLeave + ` - ${sessionValue}`;
        } else {
            displayLeave = baseLeave;
        }

        let newStatus = "On Leave (" + displayLeave + ")";

        existingStatuses.push(newStatus); existingStarts.push(startDate); existingEnds.push(endDate);

        finalStatus = existingStatuses.join(' | ');
        finalStart = existingStarts.join(' | ');
        finalEnd = existingEnds.join(' | ');

        const activeJobs = globalData.filter(d => String(d.status).toLowerCase() === 'approved' && String(d.work_status).toLowerCase() !== 'done' && String(d.assignee).includes(name));

        if(activeJobs.length > 0) {
            const payload = { name, passcode, finalStatus, finalStart, finalEnd, startDate, endDate, displayLeave, statusParam };
            openHandoverModal(activeJobs, payload);
            return;
        }
    }

    await processSaveLeave(name, passcode, finalStatus, finalStart, finalEnd, statusParam, startDate, endDate, displayLeave);
}

// Fungsi asal simpan cuti diasingkan supaya boleh dipanggil lepas handover siap
async function processSaveLeave(name, passcode, finalStatus, finalStart, finalEnd, statusParam, startDate, endDate, displayLeave) {
    const btnSet = document.getElementById('btnSetLeave'); const btnReset = document.getElementById('btnResetLeave');
    const targetBtn = statusParam === 'Active' ? btnReset : btnSet; const originalText = targetBtn.innerHTML;

    targetBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Updating...';
    refreshIcons(); btnSet.disabled = true; btnReset.disabled = true;

    try {
        const { error } = await supabaseClient.from('team_leaves').upsert({ name: name, passcode: passcode, status: finalStatus, start_date: finalStart, end_date: finalEnd, updated_at: new Date().toISOString() }, { onConflict: 'name' });
        if(error) throw error;

        let updated = false;
        for (let i = 0; i < globalTeamStatus.length; i++) {
            if (globalTeamStatus[i].Name === name) {
                globalTeamStatus[i].Status = finalStatus; globalTeamStatus[i].Start_Date = finalStart; globalTeamStatus[i].End_Date = finalEnd; globalTeamStatus[i].Passcode = passcode; updated = true; break;
            }
        }
        if (!updated) globalTeamStatus.push({ Name: name, Status: finalStatus, Start_Date: finalStart, End_Date: finalEnd, Passcode: passcode });

        if (statusParam !== 'Active') {
            const flag = getFlag(userRegion);
            const tgMsg = `[TEAM LEAVE] ${flag}\n\n*Name:* ${name}\n*Type:* ${displayLeave}\n*From:* ${formatDate(startDate)}\n*To:* ${formatDate(endDate)}\n\n🔗 [Open Adtechinno App](https://adtechinno-creativeengine.vercel.app/)`;
            fetch(TELEGRAM_API, { method: 'POST', body: JSON.stringify({ action: 'send_telegram', text: tgMsg }) });
        }

        showNotification('Status Updated', statusParam === 'Active' ? 'Welcome back!' : 'Enjoy your leave!');
        document.getElementById('leavePasscode').value = ''; document.getElementById('leaveOtherInput').value = '';
        setPresetDate(); renderLeaveHistory(); renderDashboard(); setTimeout(() => showPage('dashboard'), 1500);
    } catch(e) { showAppleAlert("Submission Failed", e.message);
    } finally { targetBtn.innerHTML = originalText; btnSet.disabled = false; btnReset.disabled = false; refreshIcons(); }
}

// ========================================================
// 🌟 12. PLAYBOOK & COPY TEXT UTILITIES
// ========================================================
// Renders the "Generate Creative Playbook" input+button pair for the pending-approval modal.
// Searches for an already-known link (this session's cache, or the task's own playbook_link) BEFORE
// ever offering to generate — reopening the modal never re-triggers a GAS call for a job that
// already has one; it just shows "Open Playbook" straight away.
function renderPlaybookGenerateField(item, safeClient, safeTitle, safeRequester) {
    const known = generatedPlaybookLinkCache[item.job_id] || getTaskSafeHttpUrl(item.playbook_link);
    if (known) {
        return `<input type="text" id="playbook-${item.job_id}" value="${escapeHtml(known)}" readonly style="flex:1; min-width:200px; padding: 10px 15px; border-radius: 8px; border: 1px solid var(--border-main); background: var(--bg-input); color: var(--text-main);"><button onclick="window.open('${escapeJsString(known)}', '_blank')" id="btn-gen-${item.job_id}" class="btn-action" style="background:var(--green); color:white; border:none; min-width:140px; margin:0;"><i data-lucide="external-link"></i> Open Playbook</button>`;
    }
    return `<input type="text" id="playbook-${item.job_id}" placeholder="Click Auto-Generate or paste link..." style="flex:1; min-width:200px; border-style: dashed; padding: 10px 15px; border-radius: 8px; border: 1px solid var(--border-main); background: var(--bg-input); color: var(--text-main);"><button onclick="generatePlaybook('${item.job_id}', '${safeClient}', '${safeTitle}', '${safeRequester}')" id="btn-gen-${item.job_id}" class="btn-action" style="background:var(--link-color); color:white; border:none; min-width:140px; margin:0;"><i data-lucide="sparkles"></i> Auto-Generate</button>`;
}

async function generatePlaybook(jobID, client, title, requester) {
    const btn = document.getElementById(`btn-gen-${jobID}`);
    const input = document.getElementById(`playbook-${jobID}`);
    if (!btn || !input || btn.dataset.generating === 'true') return;

    // Search-before-generate: a link may already exist for this job (cached from earlier this
    // session, or the task somehow already carries one) — reuse it instead of calling GAS again.
    const item = globalData.find(d => d.job_id === jobID);
    const known = generatedPlaybookLinkCache[jobID] || getTaskSafeHttpUrl(item?.playbook_link);
    if (known) {
        input.value = known;
        btn.innerHTML = '<i data-lucide="external-link"></i> Open Playbook';
        btn.style.background = 'var(--green)';
        btn.setAttribute('onclick', `window.open('${escapeJsString(known)}', '_blank')`);
        btn.disabled = false;
        refreshIcons();
        return;
    }

    const originalHtml = btn.innerHTML;
    const originalPlaceholder = input.placeholder;
    const startTime = performance.now();
    const timers = [];

    const setGeneratingState = (label, placeholder) => {
        btn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> ${label}`;
        if (placeholder) input.placeholder = placeholder;
        refreshIcons();
    };

    btn.dataset.generating = 'true';
    btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Generating...';
    btn.disabled = true;
    refreshIcons();

    timers.push(setTimeout(() => setGeneratingState('Waking generator...', 'Google generator is warming up...'), 4000));
    timers.push(setTimeout(() => setGeneratingState('Copying template...', 'Copying Creative Playbook template...'), 12000));
    timers.push(setTimeout(() => setGeneratingState('Still working...', 'Retrying automatically if Google is briefly unavailable...'), 22000));

    try {
        // 30s per attempt, up to 2 retries on transient failures only (see gasPost) — total worst
        // case ~1.5 minutes if Google is having a bad moment, but a real outage or a genuine
        // application error still surfaces well before that. Safe to retry here specifically
        // because generate_playbook is idempotent by job_id on the Apps Script side — see
        // GOOGLE-APPS-SCRIPT-PLAYBOOK-SETUP.md.
        const res = await gasPost(
            { action: 'generate_playbook', data: { job_id: jobID, client_name: client, project_title: title, requester_name: requester } },
            { timeoutMs: 30000, maxRetries: 2, label: `generate_playbook:${jobID}` }
        );

        if(res.status === "success") {
            const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
            generatedPlaybookLinkCache[jobID] = res.url;
            input.value = res.url;
            input.placeholder = originalPlaceholder;
            btn.innerHTML = '<i data-lucide="external-link"></i> Open Playbook';
            btn.style.background = 'var(--green)';
            btn.setAttribute('onclick', `window.open('${res.url}', '_blank')`);
            btn.disabled = false;
            showNotification('Playbook Generated', res.existing ? `Found an existing playbook for this job (${elapsed}s)` : `Ready in ${elapsed}s`);
        } else {
            throw new Error(res.message || 'Unknown generator error');
        }
    } catch(e) {
        const isTimeout = e.name === 'AbortError';
        showAppleAlert(
            "Playbook Error",
            isTimeout
                ? "Generator took more than 30 seconds (after retrying) and Google didn't respond in time. Please try again — if a playbook was already created, Auto-Generate will find and reuse it instead of making a duplicate."
                : "Failed generating playbook after retrying: " + e.message
        );
        btn.innerHTML = originalHtml;
        btn.disabled = false;
        input.placeholder = originalPlaceholder;
    } finally {
        timers.forEach(clearTimeout);
        delete btn.dataset.generating;
        refreshIcons();
    }
}

function copyText(type, jobID, client, title, assignee, deadlineStr, playbookLink, requesterName = '') {
    let msg = "";
    const link = playbookLink || 'Link not provided';
    const deadline = formatDate(deadlineStr);

    if (type === 'requester') {
        msg = `Hi! Your creative request has been APPROVED.\n\nJob ID: ${jobID}\nProject: ${client} - ${title}\nDeadline: ${deadline}\n\nOur creative team (${assignee}) is working on it. Track details here: ${link}`;
    }
    else if (type === 'team') {
        msg = `📌 NEW ASSIGNED JOB\n\nTeam: ${assignee}\nJob ID: ${jobID}\nClient: ${client} - ${title}\nDeadline: ${deadline}\n\nPlease check the brief and execute in the Playbook here: ${link}\n\nLet me know if you have questions.`;
    }
    else if (type === 'review') {
        msg = `🔍 CREATIVE READY FOR REVIEW\n\nClient: ${client}\nProject: ${title}\n\nHi ${requesterName}, the creatives are now ready for your review. You can check the drafts via the link below:\n${link}\n\nPlease let us know if there are any further amendments or if we can proceed to final. Thank you!`;
    }
    else if (type === 'chase') {
        msg = `⏱️ FOLLOW UP STATUS\n\nHi ${assignee}, just checking on the progress for this job:\n\nJob ID: ${jobID}\nClient: ${client} - ${title}\nDeadline: ${deadline}\nPlaybook: ${link}\n\nPlease update me on the progress, or let me know if there are any blockers. Thanks!`;
    }
    else if (type === 'revision_alert') {
        msg = `⚠️ REVISION ALERT\n\nHi ${assignee}, there is a new revision for this job:\n\nJob ID: ${jobID}\nClient: ${client} - ${title}\nPlaybook: ${link}\n\nPlease check the comments inside the Playbook for detailed corrections. Thanks!`;
    }
    else if (type === 'chase_client') {
        msg = `⏳ FOLLOW UP APPROVAL\n\nHi ${requesterName}, just checking if there's any update or feedback from the client for this job:\n\nJob ID: ${jobID}\nProject: ${client} - ${title}\nPlaybook: ${link}\n\nPlease let us know so we can proceed. Thanks!`;
    }
    else if (type === 'done_team') {
        // 🌟 MESEJ DONE YANG DAH DIBERSIHKAN (Tiada bintang) & DITAMBAH LINK/DEADLINE
        msg = `🎉 JOB COMPLETED\n\nGreat job team! This task is officially DONE and closed.\n\nJob ID: ${jobID}\nClient: ${client} - ${title}\nPIC: ${assignee}\nDeadline: ${deadline}\n\n📂 Playbook Link:\n${link}\n\nThank you for the hard work!`;
    }

    navigator.clipboard.writeText(msg);
    showNotification('Message Copied', 'Ready to paste');
}

// ========================================================
// 🌟 13. INITIALIZATION (MAIN BOOT)
// ========================================================
window.addEventListener('DOMContentLoaded', async () => {
    try {
        initTheme();
        bindRequestBoardSortMenuEvents();
        syncRequestBoardSortControl();
        populateWorkspaceCountrySelects();
        checkAdminUI();
        setPresetDate();

        // 🌟 FIX BARU: Tarik data staf SEBELUM sistem boot sepenuhnya
        try {
            const { data: teamData } = await supabaseClient.from('team_members').select('*').order('name', { ascending: true });
            if (teamData) {
                hydrateTeamCollections(teamData);
                lastTeamMembersFetchAt = Date.now();
            }
        } catch(e) { console.log("Gagal load pre-boot team data:", e.message); }

        const savedName = localStorage.getItem('adtech_user_name');
        if (savedName) {
            // 🌟 CHECK HARI DULU SEBELUM BAGI MASUK
            if (!checkDailySession()) checkSavedName();
        } else {
            showPage('dashboard');
            document.getElementById('introPage').style.display = 'flex';
        }

        setInterval(updateLiveClock, 1000);
        scheduleDailySignOut();

        // 🌟 Aktifkan mode senyap animasi selepas 2.5 saat
        setTimeout(() => { document.body.classList.add('live-mode'); }, 2500);

        // 🌟 TRIGGER SILENT SYNC & CHECK SESI BILA TUKAR TAB
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                if (checkDailySession()) return; // Auto terpelanting keluar kalau hari bertukar
                scheduleDailySignOut();
                fetchSupabaseData(true, true); // (force = true, silent = true)
            }
        });

        const gModal = document.getElementById('globalDetailModal');
        if(gModal && typeof setupSwipeToClose === 'function') {
            setupSwipeToClose(gModal.querySelector('.detail-modal'), 'dm-body-content', closeDetailModal);
        }

        const cModal = document.getElementById('calDayModal');
        if(cModal && typeof setupSwipeToClose === 'function') {
            setupSwipeToClose(cModal.querySelector('.detail-modal'), 'calDayBody', closeCalModal);
        }

    } catch (err) {
        console.error("Initialization Error:", err);
        showAppleAlert("System Error", "Sistem mengalami ralat: " + err.message, { tone: "danger", icon: "alert-triangle" });
    } finally {
        setTimeout(() => {
            const overlay = document.getElementById('soft-refresh-overlay');
            if (overlay) overlay.classList.remove('show');
        }, 1000);
    }
});

// ==========================================
// BRANDING ASSETS GATEKEEPER LOGIC
// ==========================================

function openAssetGate() {
    document.getElementById('assetGateOverlay').classList.add('show');
    document.getElementById('assetPasscodeInput').value = ''; // Kosongkan input lama

    // Auto focus pada input box lepas setengah saat (tunggu modal habis animasi)
    setTimeout(() => {
        document.getElementById('assetPasscodeInput').focus();
    }, 100);
}

function closeAssetGate() {
    document.getElementById('assetGateOverlay').classList.remove('show');
}

function verifyAssetPasscode() {
    const input = document.getElementById('assetPasscodeInput').value;
    const correctPasscode = 'creative888';
    const dropboxLink = 'https://www.dropbox.com/scl/fo/a7lhncssirscv7idlej7a/AFwcdxVzqCx0pEynpZwkHTM?rlkey=w4w6fz502jd2xg40su6lxnrvp&st=ei2w6p9y&dl=0';

    if (input === correctPasscode) {
        closeAssetGate(); // Tutup popup
        window.open(dropboxLink, '_blank'); // Buka Dropbox kat tab baru
    } else {
        showAppleAlert('Access Denied', 'Passcode salah. Akses ditolak.', { tone: 'danger', icon: 'lock' });
        document.getElementById('assetPasscodeInput').value = ''; // Kosongkan balik box
        document.getElementById('assetPasscodeInput').focus();
    }
}

// ========================================================
// 🌟 FUNGSI BARU: GATEKEEPER BALIK CUTI
// ========================================================
function checkAndShowReturnOverlay() {
    const userName = localStorage.getItem('adtech_user_name');
    if (!userName) return;

    const memberInfo = globalTeamStatus.find(t => t.Name === userName);
    if (memberInfo && memberInfo.Status && String(memberInfo.Status).toLowerCase().includes('on leave')) {
        const overlay = document.getElementById('returnLeaveOverlay');
        if (overlay) {
            overlay.style.display = 'flex'; // <--- Tambah baris ni
            setTimeout(() => { overlay.classList.add('show'); }, 10); // <--- Tambah delay sikit supaya animasi smooth

            document.getElementById('returnPasscodeInput').value = '';
            setTimeout(() => document.getElementById('returnPasscodeInput').focus(), 100);
        }
    }
}

async function confirmReturnFromLeave() {
    const userName = localStorage.getItem('adtech_user_name');
    const passcode = document.getElementById('returnPasscodeInput').value;

    if (!passcode) return showAppleAlert("Missing Info", "Please enter your passcode.");

    const memberInfo = globalTeamStatus.find(t => t.Name === userName);
    if (!memberInfo || memberInfo.Passcode !== passcode) {
        return showAppleAlert("Error", "Incorrect passcode.");
    }

    const btn = document.getElementById('btnConfirmReturn');
    const oriHtml = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Unlocking...';
    btn.disabled = true;
    refreshIcons();

    try {
        // 1. Tarik balik task yang dah di-handover
        await processReturnFromLeave(userName);

        // 2. Clear status cuti kat Supabase
        const { error } = await supabaseClient.from('team_leaves').upsert({
            name: userName,
            passcode: passcode,
            status: "",
            start_date: "",
            end_date: "",
            updated_at: new Date().toISOString()
        }, { onConflict: 'name' });

        if (error) throw error;

        // 3. Clear data dalam memori skrin
        if (memberInfo) {
            memberInfo.Status = "";
            memberInfo.Start_Date = "";
            memberInfo.End_Date = "";
        }

        // 4. Tutup pintu Gatekeeper & Refresh
        const overlay = document.getElementById('returnLeaveOverlay');
        if (overlay) {
            overlay.classList.remove('show');
            // 🌟 FIX BARU: Paksa tutup display lepas animasi habis supaya tak block skrin
            setTimeout(() => { overlay.style.display = 'none'; }, 300);
        }

        if (typeof showNotification === 'function') {
            showNotification('Welcome Back!', 'Your workspace is now unlocked.');
        }

        if (typeof renderLeaveHistory === 'function') renderLeaveHistory();
        if (typeof renderDashboard === 'function') renderDashboard();
        if (typeof renderBoards === 'function') renderBoards();

    } catch (e) {
        showAppleAlert("Error", e.message);
    } finally {
        btn.innerHTML = oriHtml;
        btn.disabled = false;
        refreshIcons();
    }
}


// Benarkan tekan "Enter" untuk Gatekeeper
document.getElementById('returnPasscodeInput')?.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') confirmReturnFromLeave();
});

// ========================================================
// 📱 LOGIK MOBILE: SOROK TOP BAR BILA SCROLL
// ========================================================
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
    // Abaikan fungsi ni kalau buka kat Laptop/Desktop (Lebih dari 992px)
    if (window.innerWidth > 992) return;

    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    const currentScrollY = window.scrollY;

    // Kalau scroll ke bawah (dan dah lepas 80px dari atas)
    if (currentScrollY > lastScrollY && currentScrollY > 80) {
        sidebar.classList.add('nav-hidden'); // Sorok Top Bar
    } else {
        // Kalau scroll ke atas
        sidebar.classList.remove('nav-hidden'); // Tunjuk Top Bar semula
    }

    // Update posisi scroll terkini
    lastScrollY = currentScrollY;
}, { passive: true });

// Benarkan tekan butang "Enter" kat keyboard untuk submit
document.getElementById('assetPasscodeInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        verifyAssetPasscode();

    }
});

// ========================================================
// 🌟 14. ADMIN KANBAN DRAG & DROP (FEATURE FLAG)
// ========================================================
let isKanbanMode = false;

function toggleKanbanMode() {
    isKanbanMode = !isKanbanMode;
    const btnText = document.getElementById('kanbanBtnText');
    const normalView = document.getElementById('projectList');
    const kanbanView = document.getElementById('kanbanBoardContainer');

    if (isKanbanMode) {
        btnText.innerText = "Normal View";
        normalView.style.display = 'none';
        kanbanView.style.display = 'flex';
        renderKanbanBoard();
    } else {
        btnText.innerText = "Board View";
        normalView.style.display = 'block';
        kanbanView.style.display = 'none';
        renderBoards();
    }
}

function renderKanbanBoard() {
    const kanbanContainer = document.getElementById('kanbanBoardContainer');
    if (!kanbanContainer) return;
    const previousScrollLeft = kanbanContainer.scrollLeft || 0;
    const previousColumnScroll = {};
    kanbanContainer.querySelectorAll('.kanban-column[data-status-key]').forEach(column => {
        previousColumnScroll[column.dataset.statusKey] = column.scrollTop || 0;
    });

    let data = deduplicateTasks(filterTasksForCurrentAccess(globalData || []));
    const sortMode = getBoardSortMode();

    // 🌟 LOGIK BARU: Masukkan data 'pending' ke dalam Kanban
    let activeData = data.filter(d =>
        String(d.status || '').toLowerCase() === 'pending' ||
        (String(d.status || '').toLowerCase() === 'approved' && String(d.work_status || '').toLowerCase() !== 'done')
    );

    const qW = document.getElementById('searchWorkload') ? document.getElementById('searchWorkload').value.toLowerCase() : '';
    if(qW) {
        activeData = activeData.filter(d => String(d.job_id || '').toLowerCase().includes(qW) || String(d.client_name || '').toLowerCase().includes(qW) || String(d.requester_name || '').toLowerCase().includes(qW) || String(d.assignee || '').toLowerCase().includes(qW) || getTaskNoteValue(d).toLowerCase().includes(qW));
    }
    renderRequestBoardFilters(activeData);
    activeData = deduplicateTasks(activeData.filter(taskMatchesRequestBoardFilter));

    // 🌟 PETA WARNA KANBAN (Dah ditukar susunan)
    const statusConfig = [
        { name: 'Inbox (Pending)', label: 'Inbox', isPending: true, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
        { name: 'Not started', label: 'Not Started', isPending: false, color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' },
        { name: 'Drafting', isPending: false, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
        { name: 'Partial Ready', label: 'Partial', isPending: false, color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.1)' },
        { name: 'Revision', isPending: false, color: '#ea580c', bg: 'rgba(234, 88, 12, 0.1)' },
        { name: 'Internal Review', label: 'Internal', isPending: false, color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.1)' },
        { name: 'Client Review', isPending: false, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
        { name: WORK_STATUS_AWAITING_CLIENT, label: 'Awaiting Client', isPending: false, color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)' },
        { name: 'Done', isPending: false, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' }
    ];

    let html = '';
    const nextCardStatusMemory = {};
    statusConfig.forEach(cfg => {
        const statusName = cfg.name;

        let colTasks = [];
        if (cfg.isPending) {
            colTasks = activeData.filter(d => String(d.status || '').toLowerCase() === 'pending');
        } else {
            colTasks = activeData.filter(d => String(d.status || '').toLowerCase() === 'approved' && normalizeWorkStatus(d.work_status || 'Not started') === normalizeWorkStatus(statusName));
        }
        colTasks = sortTasksForStatus(colTasks, statusName, sortMode);

        const isDoneZone = statusName === 'Done';
        const isAwaitingClientZone = statusName === WORK_STATUS_AWAITING_CLIENT;
        const emptyDoneUI = isDoneZone ? `<div style="text-align:center; padding: 40px 10px; color: var(--green); font-weight: 600; font-size: 0.85rem; border: 2px dashed rgba(16, 185, 129, 0.4); border-radius: 12px; margin-top: 10px;"><i data-lucide="check-circle" style="width:28px; height:28px; margin-bottom:10px; opacity:0.8;"></i><br>Drop here to complete!</div>` : '';
        const emptyAwaitingUI = isAwaitingClientZone && !colTasks.length ? `<div class="awaiting-client-empty"><i data-lucide="message-square-check"></i><span>No client-blocked tasks</span></div>` : '';
        const statusSlug = getWorkStatusSlug(statusName);
        const columnStateClass = colTasks.length ? 'has-tasks' : 'is-empty';
        const followUpWarnings = isAwaitingClientZone ? colTasks.filter(t => {
            const diff = getDateOnlyDiffDays(getClientFollowUpDate(t));
            return diff !== null && diff <= 0;
        }).length : 0;

        // A card is "entering" this column if this tab last saw it in a DIFFERENT column — drives
        // the one-time drop-in animation without replaying it on every re-render while it sits here.
        const enteringJobIds = new Set(colTasks.filter(t => {
            const remembered = kanbanCardStatusMemory[t.job_id];
            return remembered !== undefined && remembered !== statusSlug;
        }).map(t => t.job_id));
        colTasks.forEach(t => { nextCardStatusMemory[t.job_id] = statusSlug; });

        const dragDropEvents = cfg.isPending ? '' : `ondragover="allowDrop(event)" ondragleave="dragLeave(event)" ondrop="drop(event, '${statusName}')"`;

        html += `
        <div class="kanban-column ${columnStateClass} status-${statusSlug} ${isDoneZone ? 'is-done-zone' : ''} ${enteringJobIds.size ? 'kanban-column-received' : ''}" data-status-key="${statusSlug}" style="border-top-color: ${cfg.color}; ${isDoneZone ? 'background: rgba(16, 185, 129, 0.03); border: 1px dashed rgba(16, 185, 129, 0.3);' : ''}" ${dragDropEvents}>
            <div class="kanban-column-header">
                <span style="color: ${cfg.color};">${cfg.label || statusName}</span>
                <span style="display:inline-flex; align-items:center; gap:6px;">
                    ${followUpWarnings ? `<span class="kanban-column-alert" title="Follow-up due">${followUpWarnings}</span>` : ''}
                    <span class="kanban-column-count" style="background: ${cfg.bg}; color: ${cfg.color};">${colTasks.length}</span>
                </span>
            </div>
            ${colTasks.map(t => {
                const cardDragAttr = cfg.isPending ? 'draggable="false"' : 'draggable="true" ondragstart="drag(event)"';
                const cursorStyle = cfg.isPending ? 'cursor: pointer;' : 'cursor: grab;';
                const typeMeta = getRequestTypeMeta(t);

                // Client Review keeps its own longer, more specific pin; every other column uses the
                // general last_moved_at-based highlight so any drag anywhere gets the same treatment.
                const justMovedMeta = statusName === 'Client Review' ? getClientReviewJustMovedMeta(t) : getWorkStatusJustMovedMeta(t);
                const isJustMoved = justMovedMeta.active;
                const isEntering = enteringJobIds.has(t.job_id);
                const glow = isJustMoved ? `border-left-color: ${cfg.color}; background: linear-gradient(90deg, ${cfg.bg} 0%, transparent 80%); box-shadow: 0 4px 15px ${cfg.bg.replace('0.1', '0.2')};` : `border-left-color: ${cfg.color};`;
                const remainingLabel = justMovedMeta.remainingMinutes ? `${justMovedMeta.remainingMinutes} min` : `${Math.ceil((justMovedMeta.remainingSeconds || 0) / 60) || 1} min`;
                const badge = isJustMoved ? `<span class="just-moved-badge" style="--badge-accent:${cfg.color}; --badge-glow:${cfg.bg.replace('0.1', '0.3')};" title="Pinned for ${remainingLabel}">Just Moved</span>` : '';

                return `
                <div class="kanban-drag-card request-type-card type-${typeMeta.key} ${isJustMoved ? 'is-just-moved' : ''} ${isEntering ? 'kanban-card-entering' : ''}" id="${t.job_id}" ${cardDragAttr} onclick="openDetailModal('${t.job_id}')" title="Click to view full details" style="${glow} ${cursorStyle}">
                    <div style="display:flex; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:8px;">
                        <span class="kd-id" style="margin:0; white-space:nowrap;">[${t.job_id}] ${getFlag(t.region)}</span>
                        ${renderRequestTypePill(t, true)}
                        ${badge}
                    </div>
                    <div class="kd-title">${t.client_name}: ${t.project_title}</div>
                    ${renderMonthlyProgressChip(t)}
                    ${renderShootReadinessChip(t)}
                    ${renderTaskDeadlineRow(t)}
                    ${renderTaskNotePreview(t)}
                    <div class="kd-footer">
                        <span><i data-lucide="user" style="width:12px; margin-right:4px;"></i>${t.assignee !== 'null' ? t.assignee : 'Unassigned'}</span>
                    </div>
                </div>
                `;
            }).join('')}
            ${emptyDoneUI}
            ${emptyAwaitingUI}
        </div>`;
    });

    kanbanContainer.innerHTML = html;
    kanbanContainer.scrollLeft = previousScrollLeft;
    Object.entries(previousColumnScroll).forEach(([statusKey, scrollTop]) => {
        const column = kanbanContainer.querySelector(`.kanban-column[data-status-key="${statusKey}"]`);
        if (column) column.scrollTop = scrollTop;
    });
    kanbanCardStatusMemory = nextCardStatusMemory;
    scheduleClientReviewJustMovedExpiryRefresh(activeData);
    scheduleWorkStatusJustMovedExpiryRefresh(activeData);
    refreshIcons();
}

// Intercept Carian supaya Kanban pun ter-update
const searchWorkloadInput = document.getElementById('searchWorkload');
if(searchWorkloadInput) {
    searchWorkloadInput.addEventListener('keyup', () => {
        if(isKanbanMode) renderKanbanBoard();
    });
}

// -- NATIVE DRAG & DROP EVENTS --
function drag(event) {
    event.dataTransfer.setData("text/plain", event.currentTarget.id);
    event.dataTransfer.effectAllowed = "move";
}

function allowDrop(event) {
    event.preventDefault();
    const column = event.target.closest('.kanban-column');
    if(column) column.classList.add('drag-over');
}

function dragLeave(event) {
    const column = event.target.closest('.kanban-column');
    if(column) column.classList.remove('drag-over');
}

function drop(event, newStatus) {
    event.preventDefault();
    const column = event.target.closest('.kanban-column');
    if(column) column.classList.remove('drag-over');

    const jobID = event.dataTransfer.getData("text/plain");
    if(jobID) {
        // Panggil fungsi update, dan tambah "true" untuk skip buka Modal
        updateWorkStatusOptimistic(jobID, newStatus, true);
    }
}

// ========================================================
// 🎊 FUNGSI BANTUAN: PREMIUM CONFETTI ANIMATION
// ========================================================
function firePremiumConfetti() {
    // Inject CDN script secara automatik (Tak perlu edit index.html)
    if (!window.confetti) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js';
        script.onload = () => playConfetti();
        document.head.appendChild(script);
    } else {
        playConfetti();
    }

    function playConfetti() {
        var duration = 2.5 * 1000;
        var animationEnd = Date.now() + duration;
        var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 99999 };

        function randomInRange(min, max) { return Math.random() * (max - min) + min; }

        var interval = setInterval(function() {
            var timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            var particleCount = 50 * (timeLeft / duration);
            // Tembak dari kiri dan kanan
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);

        // Mainkan bunyi 'Ting!' kejayaan jika ada
        if (typeof playSuccessSound === 'function') playSuccessSound();
    }
}

// ========================================================
// 🌟 15. TOGGLE DONE TASKS VIEW
// ========================================================
let isDoneKanbanMode = false;

function toggleDoneView() {
    isDoneKanbanMode = !isDoneKanbanMode;
    const btnText = document.getElementById('doneViewBtnText');
    const icon = document.getElementById('doneViewIcon');

    if (isDoneKanbanMode) {
        btnText.innerText = "List View";
        icon.setAttribute('data-lucide', 'list');
    } else {
        btnText.innerText = "Board View";
        icon.setAttribute('data-lucide', 'layout-grid');
    }

    // Refresh paparan dengan gaya baru
    renderBoards();
}

// ========================================================
// 🌟 16. SMART HANDOVER SYSTEM
// ========================================================
let pendingLeavePayload = null;

function closeHandoverModal() {
    const modal = document.getElementById('handoverModal');
    if(modal) modal.classList.remove('show');
    setTimeout(() => {
        if(modal) modal.style.display = 'none';
        document.body.classList.remove('no-scroll');
        pendingLeavePayload = null;
    }, 300);
}

function openHandoverModal(activeJobs, leavePayload) {
    pendingLeavePayload = leavePayload;

    const modal = document.getElementById('handoverModal');
    const container = document.getElementById('handoverJobsContainer');

    let html = '';
    activeJobs.forEach(job => {
        const staffName = leavePayload.name;
        // Gabungkan semua designer dan buang nama orang yang nak cuti tu dari senarai
        const allDesigners = [...new Set([...дизайнериMY, ...дизайнериID])];
        const availableDesigners = allDesigners.filter(d => d !== staffName);

        html += `
        <div class="handover-job-item" data-jobid="${job.job_id}" style="background: var(--bg-card); padding: 15px; border-radius: 12px; border: 1px solid var(--border-main); margin-bottom: 10px;">
            <div style="font-weight: 700; color: var(--text-strong); margin-bottom: 5px; font-size: 0.95rem;">[${job.job_id}] ${job.client_name}: ${job.project_title}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 15px;"><span style="background: var(--bg-box); padding: 3px 8px; border-radius: 6px;">${job.work_status}</span></div>

            <div class="input-group" style="margin-bottom: 12px;">
                <label>Takeover PIC <span style="color: var(--red);">*</span></label>
                <select class="ho-pic">
                    <option value="">-- Select Designer to Cover --</option>
                    ${availableDesigners.map(d => `<option value="${d}">${d}</option>`).join('')}
                </select>
            </div>

            <div class="input-group" style="margin-bottom: 12px;">
                <label>Working File Link <span style="color: var(--red);">*</span></label>
                <input type="text" class="ho-file" placeholder="Paste Drive / Figma / Canva link here">
            </div>

            <div class="input-group">
                <label>Brief Notes / Instructions (Optional)</label>
                <input type="text" class="ho-notes" placeholder="e.g. Waiting for client to approve colors...">
            </div>
        </div>
        `;
    });

    container.innerHTML = html;

    modal.style.display = 'flex';
    modal.offsetHeight;
    modal.classList.add('show');
    document.body.classList.add('no-scroll');
    refreshIcons();
}

async function executeHandover() {
    const btn = document.getElementById('btnConfirmHandover');
    const originalHtml = btn.innerHTML;

    // 1. Kumpul Data dari Form
    const jobItems = document.querySelectorAll('.handover-job-item');
    let handoverDataList = [];
    let isValid = true;

    jobItems.forEach(item => {
        const jobId = item.getAttribute('data-jobid');
        const pic = item.querySelector('.ho-pic').value;
        const file = item.querySelector('.ho-file').value.trim();
        const notes = item.querySelector('.ho-notes').value.trim();

        if(!pic || !file) isValid = false;

        handoverDataList.push({
            job_id: jobId,
            requester_name: pendingLeavePayload.name,
            takeover_pic: pic,
            working_file: file,
            handover_notes: notes
        });
    });

    if(!isValid) return showAppleAlert("Incomplete Handover", "Please assign a Takeover PIC and provide the Working File link for ALL active jobs before taking leave.");

    btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Processing...';
    btn.disabled = true;
    refreshIcons();

    try {
        // 2. Simpan rekod dalam handover_logs
        const { error: hoError } = await supabaseClient.from('handover_logs').insert(handoverDataList);
        if (hoError) throw hoError;

        // 3. Update Assignee dalam tiket Kanban supaya nampak "Cover"
        for (const ho of handoverDataList) {
            const newAssignee = `[Cover] ${ho.takeover_pic} (for ${ho.requester_name})`;
            const job = globalData.find(d => d.job_id === ho.job_id);
            if(job) job.assignee = newAssignee; // Optimistic update
            await supabaseClient.from('creative_requests').update({ assignee: newAssignee }).eq('job_id', ho.job_id);
        }

        // 4. Teruskan simpan cuti ke pangkalan data
        const l = pendingLeavePayload;
        await processSaveLeave(l.name, l.passcode, l.finalStatus, l.finalStart, l.finalEnd, l.statusParam, l.startDate, l.endDate, l.displayLeave);

        // 5. Hantar Notifikasi Telegram Khas (Handover)
        const flag = getFlag(userRegion);
        let tgMsg = `✈️ *LEAVE & HANDOVER ALERT* ${flag}\n\n*Staff:* ${l.name}\n*Type:* ${l.displayLeave}\n*From:* ${formatDate(l.startDate)}\n*To:* ${formatDate(l.endDate)}\n\n📌 *Handover Tasks:*\n`;

        handoverDataList.forEach((ho, index) => {
            tgMsg += `${index + 1}. [${ho.job_id}] Handed to ${ho.takeover_pic}\n    └ 🔗 File: ${ho.working_file}\n`;
        });
        tgMsg += `\n🔗 [Open Adtechinno App](https://adtechinno-creativeengine.vercel.app/)`;

        fetch(TELEGRAM_API, { method: 'POST', body: JSON.stringify({ action: 'send_telegram', text: tgMsg }) });

        closeHandoverModal();

    } catch (e) {
        showAppleAlert("Handover Error", e.message);
        btn.innerHTML = originalHtml;
        btn.disabled = false;
        refreshIcons();
    }
}

// 🌟 FUNGSI RESET: PULANGKAN NAMA BILA BALIK CUTI
async function processReturnFromLeave(staffName) {
    try {
        const { data, error } = await supabaseClient.from('handover_logs').select('*').eq('requester_name', staffName);
        if (error || !data) return;

        for (const log of data) {
            const job = globalData.find(d => d.job_id === log.job_id);
            // Pulangkan tiket KALAU ia belum siap di tangan orang yang cover
            if (job && String(job.work_status).toLowerCase() !== 'done') {
                if (String(job.assignee).includes(`[Cover] ${log.takeover_pic} (for ${staffName})`)) {
                    job.assignee = staffName;
                    await supabaseClient.from('creative_requests').update({ assignee: staffName }).eq('job_id', log.job_id);
                }
            }
        }

        // Buang rekod handover
        await supabaseClient.from('handover_logs').delete().eq('requester_name', staffName);

    } catch (e) { console.log("Error returning from leave:", e.message); }
}

// ========================================================
// 🌟 FUNGSI BARU: AUTO SIGN-OUT BILA TUKAR HARI
// ========================================================
let dailySignOutTimer = null;
let dailySignOutInterval = null;

function getTodaySessionStamp() {
    return new Date().toDateString();
}

function getNextMidnightDelay() {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 2, 0);
    return Math.max(nextMidnight.getTime() - now.getTime(), 1000);
}

function scheduleDailySignOut() {
    if (dailySignOutTimer) clearTimeout(dailySignOutTimer);

    if (!localStorage.getItem('adtech_user_name')) return;

    dailySignOutTimer = setTimeout(() => {
        if (!checkDailySession()) scheduleDailySignOut();
    }, getNextMidnightDelay());

    if (!dailySignOutInterval) {
        dailySignOutInterval = setInterval(checkDailySession, 60000);
    }
}

function checkDailySession() {
    const savedName = localStorage.getItem('adtech_user_name');
    if (!savedName) return false; // Tak payah check kalau belum login

    const lastLogin = localStorage.getItem('adtech_login_date');
    const today = getTodaySessionStamp();

    if (!lastLogin) {
        localStorage.setItem('adtech_login_date', today);
        return false;
    }

    if (lastLogin && lastLogin !== today) {
        // Hari dah bertukar! Force sign out dengan smooth.
        console.log("Sesi tamat. Auto sign-out...");
        if (typeof signOutApp === 'function') signOutApp();
        return true;
    }
    return false;
}

// ========================================================
// 🌟 17. ACTIVE HANDOVER LIST UI (GROUPED BY NAME)
// ========================================================
function renderHandoverList() {
    const container = document.getElementById('activeHandoverContainer');
    const list = document.getElementById('activeHandoverList');

    if (!container || !list) return;

    if (!globalHandovers || globalHandovers.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    // Tukar parent grid kepada block supaya kita boleh buat tajuk Grouping
    list.style.display = 'block';

    let html = '';

    // 🌟 LOGIK BARU: Kumpulkan data ikut nama (Group by Requester Name)
    const groupedHandovers = {};
    globalHandovers.forEach(ho => {
        if (!groupedHandovers[ho.requester_name]) {
            groupedHandovers[ho.requester_name] = [];
        }
        groupedHandovers[ho.requester_name].push(ho);
    });

    // 🌟 LOGIK BARU: Render setiap group dengan tajuk
    for (const [personName, handovers] of Object.entries(groupedHandovers)) {

        // Tajuk Group (Contoh: ✈️ Alya's Handover Tasks)
        html += `
            <div style="margin-top: 25px; margin-bottom: 15px; border-bottom: 1px solid var(--border-light); padding-bottom: 8px;">
                <h4 style="margin: 0; color: var(--text-strong); font-size: 0.95rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="user-check" style="width: 16px; color: var(--text-muted);"></i>
                    Handed over by <span style="color: var(--link-color);">${personName}</span>
                </h4>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">
        `;

        handovers.forEach(ho => {
            const job = globalData.find(d => d.job_id === ho.job_id);
            const title = job ? `${job.client_name}: ${job.project_title}` : 'Unknown Project';
            const rawStatus = job ? job.work_status : 'Unknown';

            let statusColor = 'var(--text-muted)';
            let statusBg = 'var(--bg-box)';
            if (rawStatus.toLowerCase() === 'done') { statusColor = 'var(--green)'; statusBg = 'rgba(16, 185, 129, 0.1)'; }
            else if (rawStatus.toLowerCase() === 'client review') { statusColor = '#8b5cf6'; statusBg = 'rgba(139, 92, 246, 0.1)'; }
            else if (rawStatus.toLowerCase() === 'drafting') { statusColor = '#f59e0b'; statusBg = 'rgba(245, 158, 11, 0.1)'; }
            else if (rawStatus.toLowerCase() === 'revision') { statusColor = '#ea580c'; statusBg = 'rgba(234, 88, 12, 0.1)'; }
            else if (rawStatus.toLowerCase() === 'internal review') { statusColor = '#0ea5e9'; statusBg = 'rgba(14, 165, 233, 0.1)'; }

            html += `
            <div class="handover-card" style="background: var(--bg-card); border: 1px solid var(--border-light); border-left: 4px solid var(--orange); padding: 18px; border-radius: 12px; box-shadow: var(--shadow); transition: transform 0.2s; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; gap: 8px;">
                    <span style="font-size: 0.75rem; font-family: monospace; background: var(--bg-box); padding: 4px 8px; border-radius: 6px; color: var(--text-muted); font-weight: 700; letter-spacing: 0.5px;">[${ho.job_id}]</span>
                    <span style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; background: ${statusBg}; color: ${statusColor}; padding: 4px 10px; border-radius: 8px; letter-spacing: 0.5px;">${rawStatus}</span>
                </div>

                <div style="font-weight: 800; color: var(--text-strong); font-size: 1rem; margin-bottom: 15px; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${title}</div>

                <div style="font-size: 0.8rem; margin-bottom: 15px; background: var(--bg-box); padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--text-muted); font-weight: 600; text-transform: uppercase; font-size: 0.7rem;">Covered By</span>
                    <strong style="color: var(--link-color); font-size: 0.9rem;">${ho.takeover_pic}</strong>
                </div>

                <div style="flex-grow: 1; font-size: 0.85rem; margin-bottom: 15px; background: rgba(245, 158, 11, 0.05); padding: 10px; border-radius: 8px; border: 1px dashed rgba(245, 158, 11, 0.2); max-height: 80px; overflow-y: auto;">
                    <span style="color: var(--orange); font-weight: 700; font-size: 0.75rem; text-transform: uppercase; display: block; margin-bottom: 4px;">Notes:</span>
                    <span style="color: var(--text-main); font-weight: 500;">${ho.handover_notes || 'No extra notes provided.'}</span>
                </div>

                <a href="${ho.working_file}" target="_blank" style="margin-top: auto; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.85rem; font-weight: 600; color: white; text-decoration: none; background: var(--link-color); padding: 12px; border-radius: 8px; transition: 0.2s; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);">
                    <i data-lucide="external-link" style="width: 16px; height: 16px;"></i> Open Working File
                </a>
            </div>
            `;
        });

        html += `</div>`; // Tutup grid untuk orang ni
    }

    list.innerHTML = html;
    refreshIcons();
}
