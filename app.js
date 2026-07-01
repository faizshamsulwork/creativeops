// ========================================================
// 🌟 1. SETUP SUPABASE & CONFIGURATION
// ========================================================
const SUPABASE_URL = 'https://jceiajlgymtvpviebfnk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjZWlhamxneW10dnB2aWViZm5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NTQ2NzcsImV4cCI6MjA5MTUzMDY3N30.gGmc7kL01FD8rRmZC1wiLFHgn5Wlbn0Lmp3IY9C2ODs';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const GAS_API = 'https://script.google.com/macros/s/AKfycbwKNzX9BsgsTz2Cu-L_egPvrwKe-hrcsVMSEAxVy7sDgdCYd8TYyzWAnxJwjf1wOlXx/exec';
const TELEGRAM_API = 'https://script.google.com/macros/s/AKfycbyC-UgaT5QWgaWqfAQN2K-tRE2BhFYumAWzDxM6GBApTddvI9SmQHcAyMoh1sN2UML1/exec';

let PIC_LIST = [];
let дизайнериMY = [];
let дизайнериID = [];
let allStaffMY = [];
let allStaffID = [];
let globalTeamMembers = [];

let globalData = [];
let globalTeamStatus = [];
let globalHandovers = [];
let globalActivityLogs = [];
let globalNoteLogs = [];
let globalReviewCycles = [];
let globalReviewAssignments = [];
let globalReviewResponses = [];
let reviewPairDraft = [];
let activeReviewAssignment = null;
let activeReviewDraft = null;
let calMonth = new Date().getMonth();
let calYear = new Date().getFullYear();
let currentRegionFilter = 'all';
let userRegion = '';
let isSuperAdmin = false;
let currentRequestType = 'adhoc';
const CORE_CREATIVE_NAMES = ["Aaron", "Abel", "Alya", "Simon", "Steven", "Faiz Shamsul", "Miftahul Fikri", "Youke Yap", "Annisya Y.", "Liew Hui Yin"];
const SUPER_ADMIN_NAMES = ["Faiz Shamsul"];
const ADMIN_ACCESS_STORAGE_KEY = 'adtech_admin_members_override';
const TEAM_REVIEW_LOCAL_KEY = 'adtech_team_review_store';
const TEAM_REVIEW_CODE_VAULT_KEY = 'adtech_team_review_code_vault';
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
    if (isSuperAdminName(name)) return true;

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
    const profileHasAccess = hasAssignedAdminAccess(userName);
    const profileTokens = ['profile-admin', 'profile-superadmin'];

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

function hydrateTeamCollections(teamData) {
    globalTeamMembers = Array.isArray(teamData) ? teamData : [];

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

async function gasPost(payload, options = {}) {
    const timeoutMs = options.timeoutMs || 120000;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(GAS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        return res.json();
    } finally {
        clearTimeout(timeout);
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '-'; const d = new Date(dateStr); if (isNaN(d)) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
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
function showNotification(title, subtitle, callback) {
    playSuccessSound(); const overlay = document.getElementById('successOverlay');
    document.getElementById('successMainText').innerText = title; document.getElementById('successSubText').innerText = subtitle || '';
    document.getElementById('successSubText').style.display = subtitle ? 'block' : 'none'; overlay.classList.add('show');
    clearTimeout(notifTimeout);
    notifTimeout = setTimeout(() => { overlay.classList.remove('show'); if (callback) setTimeout(callback, 400); }, 1800);
}

function showAppleAlert(title, msg) {
    document.getElementById('alertTitle').innerText = title;
    document.getElementById('alertMsg').innerText = msg;
    document.getElementById('appleAlert').classList.add('show');
}

function closeAppleAlert() {
    document.getElementById('appleAlert').classList.remove('show');
    document.body.classList.remove('no-scroll');
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
    let minDate = new Date(); let addedDays = 0; const publicHolidays2026 = ["2026-01-01", "2026-02-17", "2026-02-18", "2026-03-17", "2026-03-20", "2026-05-01", "2026-05-31", "2026-06-06", "2026-08-31", "2026-09-16", "2026-10-31", "2026-12-25"];
    while (addedDays < 3) {
        minDate.setDate(minDate.getDate() + 1); const dayOfWeek = minDate.getDay(); const dateString = (new Date(minDate - offset)).toISOString().split('T')[0];
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !publicHolidays2026.includes(dateString)) addedDays++;
    }
    const lockedMinDateStr = (new Date(minDate - offset)).toISOString().split('T')[0];
    const pDeadline = document.getElementById('pDeadline'); const leaveStart = document.getElementById('leaveStart'); const leaveEnd = document.getElementById('leaveEnd');
    if(pDeadline) { pDeadline.value = lockedMinDateStr; pDeadline.min = lockedMinDateStr; }
    if(leaveStart) leaveStart.value = localISOTime.split('T')[0]; if(leaveEnd) leaveEnd.value = localISOTime.split('T')[0];

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

    function calculateWorkingDays(daysRequired) {
        let tempDate = new Date();
        let addedDays = 0;
        const holidays = ["2026-01-01", "2026-02-17", "2026-02-18", "2026-03-17", "2026-03-20", "2026-05-01", "2026-05-31", "2026-06-06", "2026-08-31", "2026-09-16", "2026-10-31", "2026-12-25"];

        while (addedDays < daysRequired) {
            tempDate.setDate(tempDate.getDate() + 1);
            const dayOfWeek = tempDate.getDay();
            const offset = tempDate.getTimezoneOffset() * 60000;
            const dateString = (new Date(tempDate - offset)).toISOString().split('T')[0];
            if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.includes(dateString)) { addedDays++; }
        }
        const finalOffset = tempDate.getTimezoneOffset() * 60000;
        return new Date(tempDate - finalOffset).toISOString().split('T')[0];
    }

    if (jobType === 'Monthly Content Plan') {
        dateLabel.innerText = 'Deadline (Locked to End of Month)';
        helperText.style.display = 'none';
        dateInput.readOnly = true;
        dateInput.style.pointerEvents = 'none';
        dateInput.style.opacity = '0.5';
        dateInput.value = '';

    } else if (jobType === 'Pitch Deck Proposal') {
        dateLabel.innerText = 'Deadline (Min. 4 working days)';
        helperText.style.display = 'block';
        helperText.style.color = 'var(--orange)';
        helperText.innerText = '*SLA: Minimum 4 working days required for Pitch Deck. Subject to Creative Lead bandwidth.';

        dateInput.readOnly = false;
        dateInput.style.pointerEvents = 'auto';
        dateInput.style.opacity = '1';

        const minWorkingDate = calculateWorkingDays(4);
        dateInput.min = minWorkingDate;
        if(!dateInput.value || dateInput.value < minWorkingDate) dateInput.value = minWorkingDate;

        dateInput.onchange = function(e) {
            const selectedDate = new Date(e.target.value);
            const day = selectedDate.getDay();
            if (day === 0 || day === 6) {
                showAppleAlert("Invalid Date", "Weekends are off-limits! Please select a working day.");
                e.target.value = dateInput.min;
            }
        };

    } else {
        dateLabel.innerText = 'Deadline (Min. 3 working days)';
        helperText.style.display = 'none';
        dateInput.readOnly = false;
        dateInput.style.pointerEvents = 'auto';
        dateInput.style.opacity = '1';

        const minWorkingDate = calculateWorkingDays(3);
        dateInput.min = minWorkingDate;
        if(!dateInput.value || dateInput.value < minWorkingDate) dateInput.value = minWorkingDate;

        dateInput.onchange = function(e) {
            const selectedDate = new Date(e.target.value);
            const day = selectedDate.getDay();
            if (day === 0 || day === 6) {
                showAppleAlert("Invalid Date", "Weekends are off-limits! Please select a working day.");
                e.target.value = dateInput.min;
            }
        };
    }
}

function selectRequestType(type) {
    currentRequestType = type;
    document.getElementById('request-gateway').style.display = 'none';
    document.getElementById('requestSubtitle').style.display = 'none';
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
    else if(id === 'settings') navItem = document.getElementById('btn-settings');

    if(navItem) navItem.classList.add('active');

    // Minta kebenaran notifikasi jika Admin baru masuk
    if (id === 'dashboard' && hasAdminAccess() && 'Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
    }

    // Render semula data mengikut tab yang aktif
    if (id === 'settings') renderSettingsPage();
    if (id === 'team-review') renderTeamReviewPage();

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

        const intro = document.getElementById('introPage'); const app = document.getElementById('app-wrapper');
        intro.style.opacity = '0'; setTimeout(() => { intro.style.display = 'none'; app.classList.add('app-active'); document.body.classList.remove('no-scroll'); }, 600);
    } catch(e) { console.error(e); } finally { const overlay = document.getElementById('soft-refresh-overlay'); if (overlay) overlay.classList.remove('show'); }
}

function checkSavedName() {
    const savedName = localStorage.getItem('adtech_user_name'); const savedReg = localStorage.getItem('adtech_region');
    if(savedName && savedReg) {
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
async function fetchSupabaseData(force = false, silent = false) {
    const editModal = document.getElementById('editModal');
    if (!force && editModal && editModal.style.display === 'flex') return;

    const detailModal = document.getElementById('globalDetailModal');
    if (!force && detailModal && detailModal.classList.contains('show')) return;

    const calDayModal = document.getElementById('calDayModal');
    if (!force && calDayModal && calDayModal.classList.contains('show')) return;

    const activeTag = document.activeElement ? document.activeElement.tagName : '';
    if (!force && (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT')) return;

    // SILENT SYNC INDICATOR
    let syncIndicator = document.getElementById('silent-sync-indicator');
    if (silent) {
        if (!syncIndicator) {
            syncIndicator = document.createElement('div');
            syncIndicator.id = 'silent-sync-indicator';
            syncIndicator.innerHTML = '<i data-lucide="refresh-cw" class="spin" style="width:14px;height:14px;"></i> Syncing...';
            syncIndicator.style.cssText = 'position:fixed; bottom:20px; right:20px; background:var(--bg-box); border:1px solid var(--border-main); padding:6px 12px; border-radius:20px; font-size:0.75rem; color:var(--text-muted); display:flex; align-items:center; gap:6px; z-index:9999; opacity:0; transition:opacity 0.3s ease; box-shadow:0 4px 6px rgba(0,0,0,0.1);';
            document.body.appendChild(syncIndicator);
            refreshIcons();
        }
        setTimeout(() => { syncIndicator.style.opacity = '1'; }, 10);
    }

    try {
        await fetchClientsList();

        // 🌟 LOGIK BARU: Tarik senarai nama staf dari Supabase
        try {
            const { data: teamData, error: teamError } = await supabaseClient.from('team_members').select('*').order('name', { ascending: true });
            if (!teamError && teamData) {
                hydrateTeamCollections(teamData);
            }
        } catch(e) { console.error("Gagal load senarai team:", e.message); }

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

            const localActivity = getLocalActivityLogs().map(normalizeLogRow);
            const localNotes = getLocalNoteLogs().map(normalizeNoteRow);

            try {
                const { data: activityData, error: activityError } = await supabaseClient
                    .from('task_activity_logs')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(5000);
                globalActivityLogs = activityError ? localActivity : [...(activityData || []).map(normalizeLogRow), ...localActivity];
            } catch(e) {
                globalActivityLogs = localActivity;
            }

            try {
                const { data: noteData, error: noteError } = await supabaseClient
                    .from('task_note_logs')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(5000);
                globalNoteLogs = noteError ? localNotes : [...(noteData || []).map(normalizeNoteRow), ...localNotes];
            } catch(e) {
                globalNoteLogs = localNotes;
            }

            if (typeof fetchTeamReviewData === 'function') {
                await fetchTeamReviewData();
            }

        } catch (e) { console.log("Gagal tarik data sampingan Supabase:", e.message); }

       const { data, error } = await supabaseClient.from('creative_requests').select('*').order('created_at', { ascending: false });
        if (error) throw error;

        const oldDataString = JSON.stringify(globalData);
        const newDataString = JSON.stringify(data || []);

        globalData = data || [];

        if (oldDataString !== newDataString || force) {
            if(document.getElementById('dashboard').classList.contains('active')) renderDashboard();
            if(document.getElementById('workload').classList.contains('active') || document.getElementById('done').classList.contains('active')) renderBoards();
            if(document.getElementById('team-review')?.classList.contains('active')) renderTeamReviewPage();
            if(document.getElementById('leave').classList.contains('active')) {
                if(typeof renderLeaveHistory === 'function') renderLeaveHistory();
                // PAKSA RENDER HANDOVER BILA TAB INI AKTIF
                if(typeof renderHandoverList === 'function') renderHandoverList();
            }
        }

    } catch (e) {
        console.error("Supabase load error:", e.message);
    } finally {
        if (!silent) {
            const overlay = document.getElementById('soft-refresh-overlay');
            if (overlay) overlay.classList.remove('show');
            // 🌟 TRIGGER GATEKEEPER BILA HABIS LOADING
            if (typeof checkAndShowReturnOverlay === 'function') checkAndShowReturnOverlay();
        } else if (syncIndicator) {
            syncIndicator.style.opacity = '0';
            setTimeout(() => { if(syncIndicator) syncIndicator.remove(); }, 300);
        }
    }
} // <--- Pastikan ada kurungan tutup untuk fetchSupabaseData

// 🌟 FUNGSI BARU: SUPABASE REAL-TIME LISTENER (MAGIC SYNC)
let isRealtimeSubscribed = false;

function setupRealtimeSubscription() {
    if (isRealtimeSubscribed) return;

    supabaseClient
        .channel('adtech-live-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'creative_requests' }, (payload) => {
            console.log('Magik Real-Time: Perubahan dikesan pada tiket!', payload);
            fetchSupabaseData(true, true);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'team_leaves' }, (payload) => {
            console.log('Magik Real-Time: Perubahan cuti dikesan!', payload);
            fetchSupabaseData(true, true);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'handover_logs' }, (payload) => {
            console.log('Magik Real-Time: Perubahan handover dikesan!', payload);
            fetchSupabaseData(true, true);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'team_review_cycles' }, () => fetchSupabaseData(true, true))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'team_review_assignments' }, () => fetchSupabaseData(true, true))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'team_review_responses' }, () => fetchSupabaseData(true, true))
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('🚀 Berjaya sambung ke Supabase Real-Time!');
                isRealtimeSubscribed = true;
            }
        });
}

// Aktifkan Real-Time ini secara automatik 2 saat selepas website dibuka
setTimeout(setupRealtimeSubscription, 2000);

// ========================================================
// 🌟 7. RENDER FUNCTIONS (DASHBOARD & BOARDS)
// ========================================================
function updateGlobalBadge() {
    let data = globalData || [];
    const finalRegion = isSuperAdmin ? currentRegionFilter : userRegion;
    data = filterDataByRegion(data, finalRegion);

    // 🌟 LOGIK BARU: Tapis ikut privasi (Admin nampak semua, Staf nampak tiket mereka sahaja)
    const currentUser = localStorage.getItem('adtech_user_name');
    if (!isSuperAdmin && currentUser) {
        data = data.filter(d =>
            String(d.requester_name).toLowerCase() === currentUser.toLowerCase() ||
            String(d.assignee).toLowerCase().includes(currentUser.toLowerCase())
        );
    }

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

    let data = globalData || []; const finalRegion = isSuperAdmin ? currentRegionFilter : userRegion;
    data = filterDataByRegion(data, finalRegion);



    // 🌟 FIX: FILTER IKUT NAMA USER (JIKA BUKAN ADMIN) 🌟
    const currentUser = localStorage.getItem('adtech_user_name');
    if (!isSuperAdmin && currentUser) {
        data = data.filter(d =>
            String(d.requester_name).toLowerCase() === currentUser.toLowerCase() ||
            String(d.assignee).toLowerCase().includes(currentUser.toLowerCase())
        );
    }

    // 🌟 FIX BARU: BUANG TERUS DATA 'DELETED' DARI DASHBOARD
    data = data.filter(d => String(d.status || '').toLowerCase() !== 'deleted');

    const pendingData = data.filter(d => String(d.status || '').toLowerCase() === 'pending');
    const activeData = data.filter(d => String(d.status || '').toLowerCase() === 'approved' && String(d.work_status || '').toLowerCase() !== 'done');
    const approvedData = data.filter(d => String(d.status || '').toLowerCase() === 'approved');
    renderAdminHealthDashboard(data);

    const today = new Date(); today.setHours(0,0,0,0); const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);
    const urgentJobs = activeData.filter(d => { if(!d.deadline) return false; const dDate = new Date(d.deadline); return dDate >= today && dDate <= nextWeek; }).sort((a,b) => new Date(a.deadline) - new Date(b.deadline));

    document.getElementById('total-val').innerText = data.length; document.getElementById('pending-val').innerText = pendingData.length; document.getElementById('active-val').innerText = activeData.length;
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
        return `<tr onclick="if(typeof openDetailModal === 'function') openDetailModal('${d.job_id}')" class="clickable-row stagger-card" style="animation-delay: ${index * 0.05}s;" title="Click to view details"><td><span class="job-id-pill">${d.job_id} ${getFlag(d.region)}</span></td><td><div class="td-client">${d.client_name}</div><div style="font-size:0.75rem; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:150px;">${d.project_title}</div></td><td>${formatDate(d.deadline)}</td><td style="text-align:center;"><span class="status-mini ${statusKey === 'pending' ? 'pending' : 'approved'}">${statusLabel}</span></td></tr>`;
    }).join('') : '<tr><td colspan="4"><div class="empty-state" style="padding:20px;"><i data-lucide="inbox"></i><p>No requests yet.</p></div></td></tr>';

    const visibleUrgent = urgentJobs.slice(0, window.innerWidth <= 992 ? 3 : 5);
    const moreUrgent = urgentJobs.length - visibleUrgent.length;
    document.getElementById('urgent-list').innerHTML = visibleUrgent.length ? `${visibleUrgent.map((u, index) => `<div class="urgent-item clickable-row stagger-card" style="animation-delay: ${index * 0.05}s;" onclick="if(typeof openDetailModal === 'function') openDetailModal('${u.job_id}')" title="Click to view details"><div style="flex:1; overflow:hidden; padding-right:10px;"><div class="urgent-client">${u.client_name}</div><div class="urgent-meta"><span class="job-id-pill" style="padding: 2px 6px; font-size: 0.65rem;">${u.job_id} ${getFlag(u.region)}</span> • ${u.assignee && u.assignee !== 'null' ? u.assignee : 'Unassigned'}</div></div><div class="urgent-date">${formatDate(u.deadline)}</div></div>`).join('')}${moreUrgent > 0 ? `<button class="dashboard-more-note" onclick="switchDashTab('cal')">${moreUrgent} more due soon · View calendar</button>` : ''}` : '<div class="empty-state" style="padding:20px;"><i data-lucide="coffee"></i><p>Relax, no urgent deadlines.</p></div>';

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
    const active = (data || []).filter(d => String(d.status || '').toLowerCase() === 'approved' && String(d.work_status || '').toLowerCase() !== 'done');
    const pending = (data || []).filter(d => String(d.status || '').toLowerCase() === 'pending');
    const completed = (data || []).filter(d => String(d.work_status || '').toLowerCase() === 'done');
    const overdue = active.filter(d => d.deadline && new Date(d.deadline).setHours(23, 59, 59, 999) < now);
    const dueSoon = active.filter(d => d.deadline && !overdue.includes(d) && (new Date(d.deadline).setHours(23, 59, 59, 999) - now) <= 172800000);
    const stuckReview = active.filter(d => String(d.work_status || '').toLowerCase() === 'client review' && hoursSince(getStatusStartedAt(d)) >= 72);
    const stuckDrafting = active.filter(d => String(d.work_status || '').toLowerCase() === 'drafting' && hoursSince(getStatusStartedAt(d)) >= 72);
    const oldPending = pending.filter(d => hoursSince(d.created_at) >= 24);
    const highRevision = active.filter(d => Number(d.revision || 0) >= 2);
    const staleUpdate = active.filter(d => hoursSince(getLastUpdateAt(d)) >= 72);

    const counts = {};
    active.forEach(d => (getAssignedPICNames(d.assignee).length ? getAssignedPICNames(d.assignee) : ['Unassigned']).forEach(n => counts[n] = (counts[n] || 0) + 1));
    const overloaded = Object.entries(counts).filter(([name, count]) => name !== 'Unassigned' && count >= 6).sort((a, b) => b[1] - a[1]);
    const score = Math.max(0, 100 - (overdue.length * 9 + stuckReview.length * 6 + stuckDrafting.length * 5 + overloaded.length * 8 + highRevision.length * 4 + oldPending.length * 3 + staleUpdate.length * 2));
    const tone = score >= 80 ? 'good' : score >= 60 ? 'warn' : 'danger';
    if (badge) { badge.className = `health-score-badge ${tone}`; badge.innerText = `${score}% Health`; }

    const completedHours = completed.map(getTaskCompletionHours).filter(v => v !== '').map(Number);
    const avg = completedHours.length ? Math.round((completedHours.reduce((a, b) => a + b, 0) / completedHours.length) * 10) / 10 : '';
    const criticalCount = overdue.length + overloaded.length;
    const watchCount = stuckReview.length + stuckDrafting.length + oldPending.length + highRevision.length + staleUpdate.length;
    const headline = score >= 80 ? 'Team flow looks steady today.' : score >= 60 ? 'A few items need admin attention.' : 'Critical blockers need action today.';
    const issues = [
        ...overdue.map(d => ({ tone: 'danger', title: 'Overdue task', meta: `${d.job_id} · ${d.client_name}`, jobID: d.job_id })),
        ...overloaded.map(([name, count]) => ({ tone: 'danger', title: 'PIC overloaded', meta: `${name} has ${count} active jobs`, jobID: '' })),
        ...stuckReview.map(d => ({ tone: 'warn', title: 'Stuck in Client Review', meta: `${d.job_id} · ${d.client_name}`, jobID: d.job_id })),
        ...stuckDrafting.map(d => ({ tone: 'warn', title: 'Drafting longer than 3 days', meta: `${d.job_id} · ${d.client_name}`, jobID: d.job_id })),
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
        <div class="health-subline"><span>${active.length} active</span><span>${pending.length} pending</span><span>${dueSoon.length} due soon</span></div>
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

    let data = globalData || [];
    const finalRegion = isSuperAdmin ? currentRegionFilter : userRegion;
    data = filterDataByRegion(data, finalRegion);

    const currentUser = localStorage.getItem('adtech_user_name');
    if (!isSuperAdmin && currentUser) {
        data = data.filter(d =>
            String(d.requester_name).toLowerCase() === currentUser.toLowerCase() ||
            String(d.assignee).toLowerCase().includes(currentUser.toLowerCase())
        );
    }

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

        const statusOrder = {
            'pending': 0, 'not started': 1, 'drafting': 2, 'partial ready': 3, 'revision': 4, 'internal review': 5, 'client review': 6
        };

        activeData.sort((a, b) => {
            let statusA = String(a.status || '').toLowerCase() === 'pending' ? 'pending' : String(a.work_status || 'not started').toLowerCase();
            let statusB = String(b.status || '').toLowerCase() === 'pending' ? 'pending' : String(b.work_status || 'not started').toLowerCase();

            let orderA = statusOrder[statusA] !== undefined ? statusOrder[statusA] : 99;
            let orderB = statusOrder[statusB] !== undefined ? statusOrder[statusB] : 99;

            if (orderA !== orderB) return orderA - orderB;

            let dateA = a.deadline ? new Date(a.deadline) : new Date('9999-12-31');
            let dateB = b.deadline ? new Date(b.deadline) : new Date('9999-12-31');
            return dateA - dateB;
        });

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
                    { id: 'client review', label: 'Client Review', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' }
                ];

                statusGroups.forEach(cfg => {
                    let groupTasks = [];
                    if (cfg.id === 'pending') groupTasks = activeData.filter(d => String(d.status || '').toLowerCase() === 'pending');
                    else groupTasks = activeData.filter(d => String(d.status || '').toLowerCase() === 'approved' && String(d.work_status || 'not started').toLowerCase() === cfg.id);

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
        let doneData = data.filter(d => String(d.status || '').toLowerCase() === 'approved' && String(d.work_status || '').toLowerCase() === 'done');

        const qD = document.getElementById('searchDone') ? document.getElementById('searchDone').value.toLowerCase() : '';
        if(qD) doneData = doneData.filter(d => String(d.job_id || '').toLowerCase().includes(qD) || String(d.client_name || '').toLowerCase().includes(qD) || String(d.requester_name || '').toLowerCase().includes(qD) || String(d.assignee || '').toLowerCase().includes(qD) || getTaskNoteValue(d).toLowerCase().includes(qD));

        if (doneData.length === 0) {
            document.getElementById('doneList').innerHTML = '<div class="empty-state"><i data-lucide="search-x"></i><p>No matching tasks found.</p></div>';
        } else {
            const groupedDone = {};
            doneData.forEach(item => {
                let sortKey = "0000-00"; let displayLabel = "No Date";
                let targetDate = item.done_at ? item.done_at : item.deadline;
                if(targetDate) {
                    const d = new Date(targetDate);
                    if(!isNaN(d)) {
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
                    group.tasks.sort((a, b) => { let dateA = a.done_at ? new Date(a.done_at) : new Date('1970-01-01'); let dateB = b.done_at ? new Date(b.done_at) : new Date('1970-01-01'); return dateB - dateA; });

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
                    group.tasks.sort((a, b) => { let dateA = a.done_at ? new Date(a.done_at) : new Date('1970-01-01'); let dateB = b.done_at ? new Date(b.done_at) : new Date('1970-01-01'); return dateB - dateA; });
                    doneHtml += `<h3 class="month-group-header">${group.label} <span class="month-group-badge">${group.tasks.length} Tasks</span></h3>`;
                    doneHtml += `<div class="project-grid">` + group.tasks.map((item, idx) => generateJobCard(item, true, idx)).join('') + `</div>`;
                });
            }
            document.getElementById('doneList').innerHTML = doneHtml;
        }
    }
    refreshIcons();
}

function viewMyRequests() { showPage('workload'); const savedName = localStorage.getItem('adtech_user_name'); if (savedName) { const firstName = extractFirstName(savedName); const searchBox = document.getElementById('searchWorkload'); searchBox.value = firstName; renderBoards(); } }

function generateJobCard(item, isDoneTab = false, index = 0) {
    const isPending = String(item.status || '').toLowerCase() === 'pending';
    const ws = isPending ? 'Inbox (Pending)' : (item.work_status || 'Not started');

    const wsClass = isPending ? 'ws-pending' : `ws-${ws.replace(/\s+/g, '-').toLowerCase()}`;
    const borderColors = { 'Inbox (Pending)': '#ef4444', 'Not started': '#94a3b8', 'Drafting': '#f59e0b', 'Partial Ready': '#14b8a6', 'Internal Review': '#0ea5e9', 'Revision': '#ea580c', 'Client Review': '#8b5cf6', 'Done': '#10b981' };
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
            ${renderTaskNotePreview(item)}
            <div class="kb-footer">
                <div class="kb-pic"><i data-lucide="user"></i> ${item.assignee && item.assignee !== 'null' ? item.assignee : 'Unassigned'}</div>
                <div class="kb-date"><i data-lucide="calendar"></i> ${formatDate(item.deadline)}</div>
            </div>
        </div>
    `;
}

// ========================================================
// 🌟 8. CALENDAR SYSTEM (DIKEMAS KINI DENGAN WARNA STATUS)
// ========================================================
function renderCalendar(approvedData) {
    const calDiv = document.getElementById('deadline-calendar'); if(!calDiv) return;
    const today = new Date(); const firstDay = new Date(calYear, calMonth, 1).getDay(); const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate(); const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let html = `<div class="calendar-header"><h4 style="margin:0; font-size:1.1rem; color:var(--text-strong);">${monthNames[calMonth]} ${calYear}</h4><div style="display:flex; gap:8px;"><button onclick="changeMonth(-1)" style="background:var(--bg-card); border:1px solid var(--border-main); color:var(--text-muted); border-radius:6px; padding:4px 8px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:0.2s;" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border-main)'"><i data-lucide="chevron-left" style="width:18px;height:18px;"></i></button><button onclick="changeMonth(1)" style="background:var(--bg-card); border:1px solid var(--border-main); color:var(--text-muted); border-radius:6px; padding:4px 8px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:0.2s;" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border-main)'"><i data-lucide="chevron-right" style="width:18px;height:18px;"></i></button></div></div><div class="calendar-grid">`;
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; dayNames.forEach(day => { html += `<div class="calendar-day-header">${day}</div>`; });
    for (let i = 0; i < firstDay; i++) { html += `<div class="calendar-day empty"></div>`; }
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = (day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear()); const currentDate = new Date(calYear, calMonth, day); currentDate.setHours(0,0,0,0);
        const dayTasks = approvedData.filter(d => { if(!d.deadline) return false; const dDate = new Date(d.deadline); if(isNaN(dDate)) return false; return dDate.getFullYear() === calYear && dDate.getMonth() === calMonth && dDate.getDate() === day; });

        let tasksHtml = '';
        dayTasks.forEach(t => {
            const isDone = String(t.work_status).toLowerCase() === 'done';
            const taskDate = new Date(t.deadline);
            const diffTime = Math.ceil((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            const ws = t.work_status || 'Not started';
            const wsKey = ws.toLowerCase();
            const borderColors = { 'not started': '#94a3b8', 'drafting': '#f59e0b', 'internal review': '#0ea5e9', 'revision': '#ea580c', 'client review': '#8b5cf6', 'done': '#10b981' };
            const bColor = borderColors[wsKey] || '#cbd5e1';

            let daysLeftStr = diffTime > 0 ? `${diffTime}d left` : (diffTime === 0 ? 'Due Today' : 'Overdue');
            let displayStatus = daysLeftStr;
            let taskClass = 'calendar-task';
            let customStyle = `border-left-color: ${bColor};`;

            if (isDone) {
                taskClass += ' task-done';
                displayStatus = 'Done';
            } else {
                if (diffTime < 0) {
                    if (wsKey !== 'not started') {
                        displayStatus = ws;
                        customStyle += ` background: ${bColor}20; color: ${bColor}; font-weight: 700;`;
                    } else {
                        displayStatus = 'Overdue';
                        taskClass += ' overdue';
                    }
                } else if (diffTime <= 2) {
                    if (wsKey !== 'not started') {
                        displayStatus = ws;
                        customStyle += ` background: ${bColor}20;`;
                    } else {
                        taskClass += ' urgent';
                    }
                } else {
                    if (wsKey !== 'not started') {
                        displayStatus = ws;
                        customStyle += ` background: ${bColor}10;`;
                    }
                }
            }

            let flag = getFlag(t.region);
            tasksHtml += `<div class="${taskClass}" style="${customStyle}" title="${t.client_name}: ${t.project_title}"><strong>${flag} ${t.client_name}</strong><br><span style="font-size:0.65rem; font-weight:700; opacity:0.9;">${isDone ? 'Done' : displayStatus}</span></div>`;
        });

        let leavesHtml = ''; const securePin = localStorage.getItem('adtech_lead_pin');
        if (securePin && typeof globalTeamStatus !== 'undefined') {
            const dayLeaves = globalTeamStatus.filter(t => {
                if (t.Status && String(t.Status).toLowerCase().includes('on leave')) {
                    const startStrs = t.Start_Date.toString().split('|').map(s => s.trim()); const endStrs = t.End_Date.toString().split('|').map(s => s.trim()); const dayOfWeek = currentDate.getDay();
                    if(dayOfWeek === 0 || dayOfWeek === 6) return false;
                    for(let i=0; i<startStrs.length; i++) {
                        const start = new Date(startStrs[i]); start.setHours(0,0,0,0); const end = new Date(endStrs[i]); end.setHours(23,59,59,999);
                        if (currentDate >= start && currentDate <= end) return true;
                    }
                }
                return false;
            });
            dayLeaves.forEach(l => {
                let leaveLabel = 'On Leave'; const startStrs = l.Start_Date.toString().split('|').map(s => s.trim()); const endStrs = l.End_Date.toString().split('|').map(s => s.trim()); const statusStrs = l.Status.toString().split('|').map(s => s.trim());
                for(let i=0; i<startStrs.length; i++) {
                    const start = new Date(startStrs[i]); start.setHours(0,0,0,0); const end = new Date(endStrs[i]); end.setHours(23,59,59,999);
                    if (currentDate >= start && currentDate <= end) { let match = statusStrs[i].toString().match(/\(([^)]+)\)/); if(match) leaveLabel = match[1]; break; }
                }
                leavesHtml += `<div class="calendar-task" style="border-left-color: var(--text-muted); background: var(--bg-box); color: var(--text-muted);" title="${l.Name}: ${leaveLabel}"><strong>${l.Name}</strong><br><span style="font-size:0.65rem; opacity:0.8;">✈️ ${leaveLabel}</span></div>`;
            });
        }
        html += `<div class="calendar-day ${isToday ? 'today' : ''}" onclick="if(typeof openCalDay === 'function') openCalDay(${calYear}, ${calMonth}, ${day})"><div class="calendar-date">${day}</div><div style="display:flex; flex-direction:column; gap:4px;">${tasksHtml}${leavesHtml}</div></div>`;
    }
    html += `</div>`; calDiv.innerHTML = html;
}

function changeMonth(offset) {
    calMonth += offset; if (calMonth < 0) { calMonth = 11; calYear--; } else if (calMonth > 11) { calMonth = 0; calYear++; }
    const finalRegion = isSuperAdmin ? currentRegionFilter : userRegion; let approvedData = globalData.filter(d => String(d.status).toLowerCase() === 'approved');
    approvedData = filterDataByRegion(approvedData, finalRegion); renderCalendar(approvedData); refreshIcons();
}

function openCalDay(year, month, day) {
    const date = new Date(year, month, day); date.setHours(0,0,0,0); document.getElementById('calDayTitle').innerText = "Agenda: " + formatDate(date.toISOString());
    const finalRegion = isSuperAdmin ? currentRegionFilter : userRegion; let approvedData = globalData.filter(d => String(d.status).toLowerCase() === 'approved');
    approvedData = filterDataByRegion(approvedData, finalRegion);
    const dayTasks = approvedData.filter(d => { if(!d.deadline) return false; const dDate = new Date(d.deadline); return dDate.getFullYear() === year && dDate.getMonth() === month && dDate.getDate() === day; });
    let leaves = []; const securePin = localStorage.getItem('adtech_lead_pin');
    if (securePin && typeof globalTeamStatus !== 'undefined') {
        leaves = globalTeamStatus.filter(t => {
            if (t.Status && String(t.Status).toLowerCase().includes('on leave')) {
                const startStrs = t.Start_Date.toString().split('|').map(s => s.trim()); const endStrs = t.End_Date.toString().split('|').map(s => s.trim()); const dayOfWeek = date.getDay();
                if(dayOfWeek === 0 || dayOfWeek === 6) return false;
                for(let i=0; i<startStrs.length; i++) {
                    const start = new Date(startStrs[i]); start.setHours(0,0,0,0); const end = new Date(endStrs[i]); end.setHours(23,59,59,999);
                    if (date >= start && date <= end) return true;
                }
            }
            return false;
        });
    }
    let html = '';
    if (leaves.length > 0) {
        html += '<h4 style="margin:0 0 10px 0; font-size:0.85rem; color:var(--text-muted);">✈️ On Leave</h4>';
        leaves.forEach(l => {
            let leaveLabel = 'On Leave'; const startStrs = l.Start_Date.toString().split('|').map(s => s.trim()); const endStrs = l.End_Date.toString().split('|').map(s => s.trim()); const statusStrs = l.Status.toString().split('|').map(s => s.trim());
            for(let i=0; i<startStrs.length; i++) { const start = new Date(startStrs[i]); start.setHours(0,0,0,0); const end = new Date(endStrs[i]); end.setHours(23,59,59,999); if (date >= start && date <= end) { let match = statusStrs[i].toString().match(/\(([^)]+)\)/); if(match) leaveLabel = match[1]; break; } }
            html += `<div style="font-weight:600; font-size:0.9rem; color:var(--text-strong); margin-bottom:5px;">${l.Name} <span style="font-size:0.75rem; color:var(--red); font-weight:500;">(${leaveLabel})</span></div>`;
        });
        if(dayTasks.length > 0) html += '<hr style="border:none; border-top:1px dashed var(--border-main); margin:15px 0;">';
    }
    if (dayTasks.length > 0) {
        html += '<h4 style="margin:0 0 10px 0; font-size:0.85rem; color:var(--text-muted);">📋 Tasks Due</h4>';
        dayTasks.forEach(t => {
            const isDone = String(t.work_status).toLowerCase() === 'done'; const flag = getFlag(t.region);
            html += `<div style="margin-bottom:10px; padding:12px; background:var(--bg-box); border-radius:8px; border-left: 4px solid ${isDone ? 'var(--border-main)' : 'var(--accent)'}; opacity: ${isDone ? '0.6' : '1'}; cursor:pointer;" onclick="if(typeof openDetailModal === 'function') openDetailModal('${t.job_id}')"><div style="font-size:0.75rem; color:var(--text-muted); font-family:monospace; margin-bottom:4px;">[${t.job_id}] ${flag}</div><div style="font-weight:700; font-size:0.95rem; color:var(--text-strong); ${isDone ? 'text-decoration:line-through;' : ''}">${t.client_name}: ${t.project_title}</div><div style="font-size:0.75rem; margin-top:6px; color:var(--text-muted);"><i data-lucide="user" style="width:12px;height:12px;"></i> ${t.assignee}</div></div>`;
        });
    }
    if (leaves.length === 0 && dayTasks.length === 0) { html = '<div class="empty-state" style="padding:20px; border:none;"><p>No events scheduled for this day.</p></div>'; }
    document.getElementById('calDayBody').innerHTML = html; refreshIcons();
    const modal = document.getElementById('calDayModal'); modal.style.display = 'flex'; modal.offsetHeight; modal.classList.add('show'); document.body.classList.add('no-scroll');
}
// ========================================================
// 🌟 9. MODALS & POP-UPS
// ========================================================
function closeDetailModal() {
    const modal = document.getElementById('globalDetailModal');
    if(!modal) return;
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

function closeEditModal() {
    const modal = document.getElementById('editModal');
    if(!modal) return;
    modal.style.display = 'none';
    document.body.classList.remove('no-scroll');
}

function openEditModal(jobID, client, title, deadlineStr, assignee) {
    closeDetailModal();
    document.getElementById('editJobId').value = jobID;
    document.getElementById('editClient').value = client;
    document.getElementById('editTitle').value = title;

    const editAssignee = document.getElementById('editAssignee');
    if (editAssignee) {
        Array.from(editAssignee.querySelectorAll('option[data-temp-assignee="true"]')).forEach(opt => opt.remove());
        const currentAssignee = assignee || 'Unassigned';
        editAssignee.dataset.originalAssignee = currentAssignee;
        editAssignee.value = currentAssignee;

        if (editAssignee.value !== currentAssignee) {
            const tempOption = document.createElement('option');
            tempOption.value = currentAssignee;
            tempOption.textContent = `${currentAssignee} (Current)`;
            tempOption.dataset.tempAssignee = 'true';
            editAssignee.insertBefore(tempOption, editAssignee.options[1] || null);
            editAssignee.value = currentAssignee;
        }
    }

    let formattedDate = "";
    if(deadlineStr) {
        const d = new Date(deadlineStr);
        if(!isNaN(d)) formattedDate = d.toISOString().split('T')[0];
    }

    document.getElementById('editDeadline').value = formattedDate;
    document.getElementById('editModal').style.display = 'flex';
}

function getAssigneeDisplay(assignee) {
    if (!assignee || assignee === 'null') return 'Unassigned';
    return String(assignee).trim() || 'Unassigned';
}

function getAssignedPICNames(assignee) {
    const displayName = getAssigneeDisplay(assignee);
    if (displayName === 'Unassigned') return [];
    return displayName.split(',').map(name => name.trim()).filter(Boolean);
}

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
}

function renderSettingsPage() {
    populateWorkspaceCountrySelects();
    checkAdminUI();
    renderSettingsAdminControls();
    renderSettingsCountryList();
    renderSettingsTeamList();
}

function renderSettingsTeamList() {
    const wrap = document.getElementById('settingsTeamList');
    if (!wrap) return;

    const team = [...(globalTeamMembers || [])].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    if (!team.length) {
        wrap.innerHTML = '<div class="empty-state" style="padding:24px;"><i data-lucide="users"></i><p>No team members loaded yet.</p></div>';
        refreshIcons();
        return;
    }

    const counts = {
        total: team.length,
        creative: team.filter(isCreativeTeamMember).length,
        admin: team.filter(isAdminTeamMember).length,
        overseas: team.filter(t => !['malaysia', 'indonesia'].includes(String(t.region || '').toLowerCase())).length
    };

    const rows = team.map(member => {
        const isCreative = isCreativeTeamMember(member);
        const isAdmin = isAdminTeamMember(member);
        const region = member.region || 'Global';
        return `
            <div class="settings-team-row">
                <div>
                    <strong>${escapeHtml(member.name)}</strong>
                    <span>${getFlag(region)} ${escapeHtml(region)}</span>
                </div>
                <div class="settings-team-badges">
                    ${isAdmin ? `<small class="admin">${isSuperAdminName(member.name) ? 'Superadmin' : 'Admin'}</small>` : ''}
                    <small class="${isCreative ? 'creative' : ''}">${isCreative ? 'Creative PIC' : 'Requester'}</small>
                </div>
            </div>
        `;
    }).join('');

    wrap.innerHTML = `
        <div class="settings-team-summary">
            <div><span>Total</span><strong>${counts.total}</strong></div>
            <div><span>Creative</span><strong>${counts.creative}</strong></div>
            <div><span>Admin</span><strong>${counts.admin}</strong></div>
            <div><span>Overseas</span><strong>${counts.overseas}</strong></div>
        </div>
        <div class="settings-team-rows">${rows}</div>
    `;
    refreshIcons();
}

function renderSettingsCountryList() {
    const wrap = document.getElementById('settingsCountryList');
    if (!wrap) return;
    wrap.innerHTML = WORKSPACE_COUNTRIES.map(country => `
        <div class="settings-country-pill ${country.primary ? 'primary' : ''}">
            <span>${country.flag}</span>
            <strong>${country.name}</strong>
            <small>${country.code}</small>
        </div>
    `).join('');
}

function renderSettingsAdminControls() {
    const select = document.getElementById('settingsAdminMember');
    const list = document.getElementById('settingsAdminList');
    const grantBtn = document.getElementById('btnGrantAdmin');
    const revokeBtn = document.getElementById('btnRevokeAdmin');
    const note = document.getElementById('settingsAdminHelp');
    if (!select && !list) return;

    const team = [...(globalTeamMembers || [])].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    const currentSelection = select ? select.value : '';
    const canManageAdmins = isSuperAdminName();

    if (select) {
        select.innerHTML = '<option value="">Select team member...</option>' + team.map(member => {
            const name = escapeHtml(member.name);
            const region = escapeHtml(member.region || 'Global');
            const selected = member.name === currentSelection ? 'selected' : '';
            return `<option value="${name}" ${selected}>${name} · ${region}</option>`;
        }).join('');
        select.disabled = !canManageAdmins;
    }

    if (grantBtn) grantBtn.disabled = !canManageAdmins;
    if (revokeBtn) revokeBtn.disabled = !canManageAdmins;
    if (note) {
        note.innerHTML = canManageAdmins
            ? '<i data-lucide="shield-check"></i><span>Only superadmin can grant or revoke admin access.</span>'
            : '<i data-lucide="lock"></i><span>Only Faiz Shamsul can manage admin access.</span>';
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
        `).join('') : '<div class="settings-empty-note">No admin members assigned yet.</div>';
    }

    refreshIcons();
}

async function setMemberAdminAccess(shouldBeAdmin) {
    if (!isSuperAdminName()) {
        return showAppleAlert('Superadmin Only', 'Only Faiz Shamsul can grant or revoke admin access.');
    }

    const select = document.getElementById('settingsAdminMember');
    const name = select ? select.value : '';
    if (!name) return showAppleAlert('Missing Member', 'Please select a team member first.');
    if (!shouldBeAdmin && isSuperAdminName(name)) {
        return showAppleAlert('Protected Access', 'Superadmin access cannot be removed from Faiz Shamsul.');
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
        renderSettingsPage();
        return showAppleAlert(
            'Admin Saved Locally',
            `I could not find admin access columns in Supabase yet. Run supabase-admin-access.sql once to make this shared for everyone. Details: ${lastError?.message || 'Missing column'}`
        );
    }

    if (shouldBeAdmin) saveAdminOverrideName(name);
    else removeAdminOverrideName(name);
    await fetchSupabaseData(true, true);
    renderSettingsPage();
    showNotification(shouldBeAdmin ? 'Admin Granted' : 'Admin Removed', `${name} access updated`);
}

async function addTeamMember(event) {
    if (event) event.preventDefault();
    if (!hasAdminAccess()) {
        return showAppleAlert('Admin Only', 'Please unlock Admin Access before adding members.');
    }

    const nameInput = document.getElementById('settingsMemberName');
    const regionInput = document.getElementById('settingsMemberRegion');
    const roleInput = document.getElementById('settingsMemberRole');
    const btn = document.getElementById('btnAddTeamMember');
    const name = nameInput ? nameInput.value.trim() : '';
    const region = regionInput ? regionInput.value : 'Malaysia';
    const role = roleInput ? roleInput.value : 'Requester';

    if (!name) return showAppleAlert('Missing Name', 'Please enter the new team member name.');

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
            access_role: 'member'
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

        if (error && /column|schema|cache|is_creative|department|role|team|is_admin|access_role/i.test(error.message || '')) {
            const retry = await saveTeamMemberPayload(minimalPayload);
            error = retry.error;
        }

        if (error) throw new Error(error.message);

        if (role === 'Creative') saveCreativeOverrideName(name);
        if (nameInput) nameInput.value = '';

        await fetchSupabaseData(true, true);
        renderSettingsPage();
        showNotification(memberAlreadyExists ? 'Member Updated' : 'Member Added', `${name} is now in the workspace`);
    } catch(e) {
        showAppleAlert('Add Member Failed', e.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
            refreshIcons();
        }
    }
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
    vault[assignmentId] = normalizeReviewCode(code);
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
    return String(rawCode || '').trim().toUpperCase().replace(/\s+/g, '');
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

async function hashReviewCode(rawCode) {
    const normalized = normalizeReviewCode(rawCode);
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

async function fetchTeamReviewData() {
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
        const { data, error } = await supabaseClient
            .from('team_review_responses')
            .select('*')
            .order('submitted_at', { ascending: false });
        if (error) throw error;
        responses = mergeRowsById((data || []).map(normalizeReviewResponse), local.responses);
    } catch(e) {
        if (!/does not exist|schema|relation|table/i.test(e.message || '')) console.log('Team review responses fallback:', e.message);
    }

    globalReviewCycles = cycles.map(normalizeReviewCycle);
    globalReviewAssignments = assignments.map(normalizeReviewAssignment);
    globalReviewResponses = responses.map(normalizeReviewResponse);
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

async function persistTeamReviewCycle(cycle, assignments) {
    let savedToSupabase = false;
    let lastError = null;
    try {
        const { error: cycleError } = await supabaseClient
            .from('team_review_cycles')
            .upsert([cycle], { onConflict: 'id' });
        if (cycleError) throw cycleError;

        const { error: assignmentError } = await supabaseClient
            .from('team_review_assignments')
            .upsert(assignments, { onConflict: 'id' });
        if (assignmentError) throw assignmentError;
        savedToSupabase = true;
    } catch(e) {
        lastError = e;
    }

    persistReviewDataLocally({ cycles: [cycle], assignments });
    return { savedToSupabase, lastError };
}

async function persistTeamReviewSubmission(assignment, response) {
    const submittedAt = response.submitted_at || new Date().toISOString();
    const updatedAssignment = { ...assignment, status: 'submitted', submitted_at: submittedAt };
    let savedToSupabase = false;
    let lastError = null;

    try {
        const { error: responseError } = await supabaseClient
            .from('team_review_responses')
            .upsert([{ ...response, submitted_at: submittedAt }], { onConflict: 'id' });
        if (responseError) throw responseError;

        const { error: assignmentError } = await supabaseClient
            .from('team_review_assignments')
            .update({ status: 'submitted', submitted_at: submittedAt })
            .eq('id', assignment.id);
        if (assignmentError) throw assignmentError;
        savedToSupabase = true;
    } catch(e) {
        lastError = e;
    }

    globalReviewAssignments = globalReviewAssignments.map(row => row.id === assignment.id ? normalizeReviewAssignment(updatedAssignment) : row);
    const withoutOldResponse = globalReviewResponses.filter(row => row.assignment_id !== assignment.id);
    globalReviewResponses = [normalizeReviewResponse(response), ...withoutOldResponse];
    persistReviewDataLocally({ assignments: [updatedAssignment], responses: [response] });
    return { savedToSupabase, lastError };
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

    const adminAccess = hasAdminAccess();
    const shell = page.querySelector('.team-review-shell');
    if (shell) shell.classList.toggle('reviewer-only', !adminAccess);
    page.querySelectorAll('.settings-admin-only').forEach(el => {
        if (el.id === 'teamReviewAdminPanel') el.style.display = adminAccess ? 'block' : 'none';
        else el.style.display = adminAccess ? 'inline-flex' : 'none';
    });

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

    const cycles = globalReviewCycles || [];
    const assignments = globalReviewAssignments || [];
    const responses = globalReviewResponses || [];
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
    if (!hasAdminAccess()) return showAppleAlert('Admin Only', 'Please unlock Admin Access first.');
    const reviewer = document.getElementById('reviewReviewerSelect')?.value || '';
    const reviewee = document.getElementById('reviewRevieweeSelect')?.value || '';
    if (!reviewer || !reviewee) return showAppleAlert('Missing Pair', 'Please select both reviewer and reviewee.');
    if (normalizeNameKey(reviewer) === normalizeNameKey(reviewee)) return showAppleAlert('Invalid Pair', 'Reviewer and reviewee must be different people.');

    const duplicate = reviewPairDraft.some(pair => normalizeNameKey(pair.reviewer_name) === normalizeNameKey(reviewer) && normalizeNameKey(pair.reviewee_name) === normalizeNameKey(reviewee));
    if (duplicate) return showAppleAlert('Pair Exists', 'This reviewer pair is already added.');

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
    if (!hasAdminAccess()) return showAppleAlert('Admin Only', 'Please unlock Admin Access first.');

    const titleInput = document.getElementById('reviewCycleTitle');
    const deadlineInput = document.getElementById('reviewCycleDeadline');
    const btn = document.getElementById('btnCreateReviewCycle');
    const title = titleInput?.value.trim() || '';
    const deadline = deadlineInput?.value || '';

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
            status: 'active',
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
        reviewPairDraft = [];
        if (titleInput) titleInput.value = '';
        if (deadlineInput) deadlineInput.value = '';
        renderTeamReviewPage();

        const codeList = generatedCodes.map(item => `${item.reviewer_name} for ${item.reviewee_name}: ${item.code}`).join('\n');
        if (!result.savedToSupabase) {
            showAppleAlert('Saved Locally', `Team Review is ready on this device. Run supabase-team-review.sql once to make it shared for the whole team.\n\n${codeList}`);
        } else {
            showAppleAlert('Review Round Created', `Review passes are ready. Share each pass only with the assigned reviewer.\n\n${codeList}`);
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
                        <button type="button" onclick="copyReviewInvite('${assignment.id}')"><i data-lucide="copy"></i></button>
                        <button type="button" onclick="resetReviewCode('${assignment.id}')"><i data-lucide="rotate-cw"></i></button>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="review-cycle-card">
                <div class="review-cycle-top">
                    <div>
                        <span>${cycle.status === 'active' ? 'Open' : escapeHtml(cycle.status)}</span>
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

async function deleteTeamReviewCycle(cycleId) {
    if (!hasAdminAccess()) return showAppleAlert('Admin Only', 'Please unlock Admin Access first.');
    const cycle = getReviewCycle(cycleId);
    if (!cycle) return;
    const confirmed = window.confirm(`Delete review round "${cycle.title}"? This removes its assignments and responses from this workspace.`);
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
    if (!hasAdminAccess()) return showAppleAlert('Admin Only', 'Please unlock Admin Access first.');
    const assignment = globalReviewAssignments.find(row => row.id === assignmentId);
    if (!assignment) return;

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
    persistReviewDataLocally({ assignments: [updated] });
    renderTeamReviewPage();
    showAppleAlert(saved ? 'Review Code Reset' : 'Code Reset Locally', `${assignment.reviewer_name} for ${assignment.reviewee_name}: ${code}`);
}

function copyReviewInvite(assignmentId) {
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
        await fetchTeamReviewData();
        const hash = await hashReviewCode(code);
        const assignment = (globalReviewAssignments || []).find(row => row.review_code_hash === hash);
        if (!assignment) return showAppleAlert('Invalid Review Pass', 'This pass was not found. Please check with the admin.');

        activeReviewAssignment = assignment;
        const response = getReviewResponseForAssignment(assignment.id);
        activeReviewDraft = response ? {
            ratings: { ...response.ratings },
            comments: { ...response.comments },
            strengths: response.strengths || '',
            improvements: response.improvements || '',
            final_comment: response.final_comment || ''
        } : { ratings: {}, comments: {}, strengths: '', improvements: '', final_comment: '' };

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
    const questions = getTeamReviewQuestionList();
    const answered = questions.filter(question => Number(activeReviewDraft.ratings[question.id]) > 0).length;
    const progress = Math.round((answered / questions.length) * 100);

    const categories = TEAM_REVIEW_QUESTION_GROUPS.map(group => `
        <div class="review-category-card ${group.tone}">
            <div class="review-category-head">
                <div>
                    <span>${group.questions.length} questions</span>
                    <h4>${escapeHtml(group.title)}</h4>
                </div>
                <strong>${getReviewCategoryAverage(activeReviewDraft.ratings, group.key) || '--'}</strong>
            </div>
            ${group.questions.map(question => `
                <div class="review-question-row">
                    <p>${escapeHtml(question.text)}</p>
                    <div class="review-score-set">
                        ${[1, 2, 3, 4, 5].map(score => `
                            <button type="button" class="review-score-btn ${Number(activeReviewDraft.ratings[question.id]) === score ? 'active' : ''}" onclick="setReviewScore('${question.id}', ${score})">${score}</button>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
            <textarea class="review-textarea" placeholder="Optional context for this section" oninput="setReviewCategoryComment('${group.key}', this.value)">${escapeHtml(activeReviewDraft.comments[group.key] || '')}</textarea>
        </div>
    `).join('');

    wrap.innerHTML = `
        <div class="review-form-head">
            <div>
                <span>${escapeHtml(cycle?.title || 'Team Review')}</span>
                <h3>${escapeHtml(assignment.reviewee_name)}</h3>
                <p>Reviewer: ${escapeHtml(assignment.reviewer_name)} · Deadline ${formatDate(cycle?.deadline)}</p>
            </div>
            <button type="button" onclick="closeActiveReviewForm()"><i data-lucide="x"></i></button>
        </div>
        <div class="review-progress-wrap">
            <div><span>${answered}/${questions.length} rated</span><strong>${progress}%</strong></div>
            <div class="review-progress-bar"><span style="width:${progress}%"></span></div>
        </div>
        <div class="review-rating-note"><span>1 = Strongly Disagree</span><span>5 = Strongly Agree</span></div>
        <div class="review-category-stack">${categories}</div>
        <div class="review-summary-grid">
            <label>Strengths<textarea class="review-textarea" placeholder="What should this person continue doing?" oninput="setReviewSummaryField('strengths', this.value)">${escapeHtml(activeReviewDraft.strengths || '')}</textarea></label>
            <label>Improvement Area<textarea class="review-textarea" placeholder="What should this person improve next?" oninput="setReviewSummaryField('improvements', this.value)">${escapeHtml(activeReviewDraft.improvements || '')}</textarea></label>
            <label class="full">Additional Comments<textarea class="review-textarea" placeholder="Anything else admin should know?" oninput="setReviewSummaryField('final_comment', this.value)">${escapeHtml(activeReviewDraft.final_comment || '')}</textarea></label>
        </div>
        <div class="review-submit-row">
            <button type="button" onclick="submitTeamReview()" class="review-submit-btn"><i data-lucide="send"></i><span>Submit Review</span></button>
        </div>
    `;
    refreshIcons();
}

function closeActiveReviewForm() {
    activeReviewAssignment = null;
    activeReviewDraft = null;
    renderActiveReviewForm();
}

function setReviewScore(questionId, score) {
    activeReviewDraft = activeReviewDraft || { ratings: {}, comments: {}, strengths: '', improvements: '', final_comment: '' };
    activeReviewDraft.ratings[questionId] = score;
    renderActiveReviewForm();
}

function setReviewCategoryComment(categoryKey, value) {
    activeReviewDraft = activeReviewDraft || { ratings: {}, comments: {}, strengths: '', improvements: '', final_comment: '' };
    activeReviewDraft.comments[categoryKey] = value;
}

function setReviewSummaryField(field, value) {
    activeReviewDraft = activeReviewDraft || { ratings: {}, comments: {}, strengths: '', improvements: '', final_comment: '' };
    activeReviewDraft[field] = value;
}

async function submitTeamReview() {
    if (!activeReviewAssignment) return;
    activeReviewDraft = activeReviewDraft || { ratings: {}, comments: {}, strengths: '', improvements: '', final_comment: '' };
    const missing = getTeamReviewQuestionList().filter(question => !Number(activeReviewDraft.ratings[question.id]));
    if (missing.length) return showAppleAlert('Incomplete Review', 'Please rate every question before submitting.');

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

    const result = await persistTeamReviewSubmission(assignment, response);
    activeReviewAssignment = { ...assignment, status: 'submitted', submitted_at: submittedAt };
    renderTeamReviewPage();
    showNotification(result.savedToSupabase ? 'Review Submitted' : 'Review Saved Locally', 'Thank you for the honest feedback');
}

function buildTeamReviewQuestionRows() {
    return (globalReviewResponses || []).flatMap(response => {
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
    (globalReviewResponses || []).forEach(response => {
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
    return (globalReviewAssignments || []).map(assignment => {
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
    return `# Adtechinno Team Review Report Pack

Generated: ${new Date().toLocaleString('en-MY')}
Cycles exported: ${(globalReviewCycles || []).length}
Assignments exported: ${(globalReviewAssignments || []).length}
Responses exported: ${(globalReviewResponses || []).length}

## Suggested ChatGPT Prompt
You are a people operations and creative team performance analyst. Analyze these team review exports confidentially. Identify team strengths, recurring blockers, coaching opportunities, workload or collaboration risks, and recommended actions to improve productivity, quality, ownership, communication, and team expansion planning. Keep feedback constructive and avoid personal blame.

## Files
- team_review_question_scores.csv: One row per question rating with category comments.
- team_review_summary.csv: Aggregated scores and comment themes by reviewee.
- team_review_completion.csv: Reviewer assignment completion and pending status.
`;
}

function exportTeamReviewPack() {
    if (!hasAdminAccess()) return showAppleAlert('Admin Only', 'Please unlock Admin Access first.');
    if (!(globalReviewAssignments || []).length) return showAppleAlert('Export Failed', 'No team review data available yet.');

    const date = new Date().toISOString().split('T')[0];
    const base = `Adtechinno_Team_Review_${date}`;
    const questionRows = buildTeamReviewQuestionRows();
    const summaryRows = buildTeamReviewSummaryRows();
    const completionRows = buildTeamReviewCompletionRows();

    downloadTextFile(`${base}_question_scores.csv`, rowsToCSV(['cycle_title', 'deadline', 'reviewer_name', 'reviewee_name', 'reviewer_region', 'reviewee_region', 'category', 'question', 'rating', 'category_comment', 'strengths', 'improvements', 'final_comment', 'average_score', 'submitted_at'], questionRows), 'text/csv;charset=utf-8;');
    downloadTextFile(`${base}_summary.csv`, rowsToCSV(['reviewee_name', 'responses', 'average_score', 'work_quality_avg', 'ownership_avg', 'teamwork_avg', 'growth_avg', 'strengths', 'improvements'], summaryRows), 'text/csv;charset=utf-8;');
    downloadTextFile(`${base}_completion.csv`, rowsToCSV(['cycle_title', 'deadline', 'reviewer_name', 'reviewee_name', 'reviewer_region', 'reviewee_region', 'status', 'submitted_at', 'code_hint'], completionRows), 'text/csv;charset=utf-8;');
    downloadTextFile(`${base}_report_context.md`, buildTeamReviewReportContext(), 'text/markdown;charset=utf-8;');
    showNotification('Team Review Exported', 'Ready for ChatGPT reporting');
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
    return getTaskNoteValue(item) ? 1 : 0;
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
        id: row.id || row.local_id || `note-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        job_id: row.job_id || '',
        actor_name: row.actor_name || row.actor || 'Unknown',
        note_text: row.note_text || row.notes || '',
        status_at_time: row.status_at_time || row.work_status || '',
        created_at: row.created_at || new Date().toISOString()
    };
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
        const { error } = await supabaseClient.from('task_note_logs').insert([{
            job_id: row.job_id,
            actor_name: row.actor_name,
            note_text: row.note_text,
            status_at_time: row.status_at_time,
            created_at: row.created_at
        }]);
        if (error) throw error;
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
    const status = String(item.work_status || 'Not started').toLowerCase();
    const statusLog = getTaskLogs(item.job_id).find(log =>
        log.action_type === 'status_changed' && String(log.new_value || '').toLowerCase() === status
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
    const currentStatus = String(item.status || '').toLowerCase() === 'pending' ? 'Pending Approval' : (item.work_status || 'Not started');

    const timelineRows = logs.length ? logs.slice(0, 12).map(log => `
        <div class="tracking-row">
            <div class="tracking-dot"></div>
            <div class="tracking-main">
                <div class="tracking-top"><strong>${escapeHtml(log.action_type.replace(/_/g, ' '))}</strong><span>${formatDateTime(log.created_at)}</span></div>
                <div class="tracking-meta">${escapeHtml(log.actor_name)}${log.old_value || log.new_value ? ` · ${escapeHtml(log.old_value || '-')} → ${escapeHtml(log.new_value || '-')}` : ''}</div>
                ${log.note_text ? `<div class="tracking-note">${escapeHtml(log.note_text)}</div>` : ''}
            </div>
        </div>
    `).join('') : `<div class="tracking-empty">No activity logs yet. New updates will start appearing here.</div>`;

    const noteRows = noteLogs.length ? noteLogs.slice(0, 5).map(log => `
        <div class="tracking-note-row">
            <div><strong>${escapeHtml(log.actor_name)}</strong><span>${formatDateTime(log.created_at)} · ${escapeHtml(log.status_at_time || 'No status')}</span></div>
            <p>${escapeHtml(log.note_text)}</p>
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
    return { key: 'adhoc', label: 'Ad-hoc / One-off', shortLabel: 'Ad-hoc', icon: 'zap' };
}

function renderRequestTypePill(item, compact = false) {
    const meta = getRequestTypeMeta(item);
    return `<span class="request-type-pill type-${meta.key} ${compact ? 'compact' : ''}"><i data-lucide="${meta.icon}"></i>${compact ? meta.shortLabel : meta.label}</span>`;
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
    const match = note.match(/(?:monthly\s*)?(?:progress|ready|done)?\s*:?\s*(\d+)\s*\/\s*(\d+)/i) || note.match(/(\d+)\s*\/\s*(\d+)/);
    if (!match) return '';
    return Math.min(Number(match[1] || 0), total || Number(match[2] || 0));
}

function renderMonthlyProgressChip(item) {
    const summary = getMonthlyDeliverableSummary(item);
    if (!summary || !summary.total) return '';
    const ready = getMonthlyReadyCount(item, summary.total);
    const pct = ready === '' ? 0 : Math.min(Math.round((ready / summary.total) * 100), 100);
    const label = ready === '' ? `${summary.total} deliverables` : `${ready}/${summary.total} ready`;
    return `<div class="monthly-progress-mini"><div><span>${escapeHtml(label)}</span><strong>Use Partial Ready for partial handoff</strong></div><div class="monthly-progress-track"><i style="width:${pct}%;"></i></div></div>`;
}

function renderMonthlyFlowPanel(item) {
    const summary = getMonthlyDeliverableSummary(item);
    if (!summary || !summary.total) return '';
    const ready = getMonthlyReadyCount(item, summary.total);
    const pct = ready === '' ? 0 : Math.min(Math.round((ready / summary.total) * 100), 100);
    const breakdown = summary.parts.map(part => `<span>${escapeHtml(part.label)} <strong>${part.count}</strong></span>`).join('');
    return `
        <div class="monthly-flow-panel">
            <div class="monthly-flow-head">
                <div>${renderRequestTypePill(item)}<strong>${ready === '' ? summary.total + ' deliverables planned' : ready + '/' + summary.total + ' deliverables ready'}</strong></div>
                <span>${pct}%</span>
            </div>
            <div class="monthly-progress-track"><i style="width:${pct}%;"></i></div>
            <div class="monthly-breakdown">${breakdown}</div>
            <p>For partial completion, keep this request in <strong>Partial Ready</strong>. Move to <strong>Client Review</strong> only when the whole monthly set is ready for client review.</p>
        </div>
    `;
}

function canAddTaskNote(item) {
    return Boolean(item && localStorage.getItem('adtech_user_name'));
}

function renderTaskNotesBox(item) {
    const noteLogs = getTaskNoteLogs(item.job_id);
    const latest = getLatestTaskNote(item);
    const noteCount = getTaskNoteCount(item);
    const canAdd = canAddTaskNote(item);

    const rows = noteLogs.length ? noteLogs.slice(0, 12).map(log => `
        <div class="task-note-thread-row">
            <div>
                <strong>${escapeHtml(log.actor_name || 'Unknown')}</strong>
                <span>${formatDateTime(log.created_at)} · ${escapeHtml(log.status_at_time || 'No status')}</span>
            </div>
            <p>${escapeHtml(log.note_text)}</p>
        </div>
    `).join('') : (latest?.note_text ? `
        <div class="task-note-thread-row">
            <div>
                <strong>${escapeHtml(latest.actor_name || 'Unknown')}</strong>
                <span>${formatDateTime(latest.created_at)} · ${escapeHtml(latest.status_at_time || 'No status')}</span>
            </div>
            <p>${escapeHtml(latest.note_text)}</p>
        </div>
    ` : '<div class="task-note-empty">No notes yet. Add the first update for this task.</div>');

    const latestPreview = latest?.note_text
        ? `<small>${escapeHtml(latest.note_text.length > 120 ? latest.note_text.slice(0, 117) + '...' : latest.note_text)}</small>`
        : '<small>No notes yet</small>';

    return `
        <details class="task-notes-box">
            <summary>
                <span><i data-lucide="message-square-text"></i><strong>Task Notes</strong></span>
                <em>${noteCount} update${noteCount === 1 ? '' : 's'}</em>
            </summary>
            <div class="task-note-latest">${latestPreview}</div>
            ${canAdd ? `
                <textarea id="task-note-${item.job_id}" class="task-note-textarea" placeholder="Add a quick update. Example: 2/10 visuals ready, waiting for client feedback, or checking copy direction..."></textarea>
                <div class="task-note-actions">
                    <button type="button" id="btn-note-${item.job_id}" onclick="saveTaskNote(event, '${item.job_id}')" class="btn-action btn-copy"><i data-lucide="send"></i> Add Note</button>
                </div>
            ` : `
                <div class="task-note-readonly">Sign in to add notes.</div>
            `}
            <div class="task-note-thread-head">History</div>
            <div class="task-note-thread">${rows}</div>
        </details>
    `;
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
        const { error } = await supabaseClient
            .from('creative_requests')
            .update({ assignee: selectedPIC })
            .eq('job_id', jobID);

        if (error) throw error;

        if (job) job.assignee = selectedPIC;
        logTaskActivity(jobID, 'pic_changed', oldAssignee, selectedPIC, 'PIC changed from task detail');
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
        const ws = String(item.work_status || 'Not started');
        const wsClass = `ws-${ws.replace(/\s+/g, '-').toLowerCase()}`;
        const isDoneTab = String(item.status).toLowerCase() === 'approved' && String(item.work_status).toLowerCase() === 'done';
        const securePin = localStorage.getItem('adtech_lead_pin');
        const canEditPIC = securePin && String(item.status || '').toLowerCase() === 'approved';

        document.getElementById('dm-jobid').innerText = `[${item.job_id}]`;
        document.getElementById('dm-title').innerText = `${item.client_name}: ${item.project_title}`;

        let playbookBtnHtml = '';
        if(item.playbook_link) {
            playbookBtnHtml = `<a href="${item.playbook_link}" target="_blank" class="premium-playbook-btn"><i data-lucide="layout-template"></i> Open Playbook</a>`;
        }

        // --- MULA LOGIK FORMAT BRIEF BERBEZA ---
        const briefText = String(item.brief || '');
        const isPitchDeck = String(item.job_type || '').toLowerCase().includes('pitch deck');

        let formattedBriefHTML = '';

        if (isPitchDeck) {
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
                <div class="detail-item"><span>Job Type</span><strong>${renderRequestTypePill(item)}<small class="job-type-raw">${escapeHtml(item.job_type || '')}</small></strong></div>
                <div class="detail-item"><span>Deadline</span><strong style="color:var(--red);">${formatDate(item.deadline)}</strong></div>
                <div class="detail-item pic-detail"><span>Creative PIC</span>${canEditPIC ? renderPicEditor(item.job_id, actualAssignee) : `<strong>${actualAssignee}</strong>`}</div>
                <div class="detail-item"><span>Work Status</span>${String(item.status).toLowerCase() === 'pending' ? '<strong>-</strong>' : `${securePin && !isDoneTab ? `<select onchange="updateWorkStatusOptimistic('${item.job_id}', this.value)" class="ws-select ${wsClass}"><option value="Not started" ${ws === 'Not started' ? 'selected' : ''}>Not started</option><option value="Drafting" ${ws === 'Drafting' ? 'selected' : ''}>Drafting</option><option value="Partial Ready" ${ws === 'Partial Ready' ? 'selected' : ''}>Partial Ready</option><option value="Revision" ${ws === 'Revision' ? 'selected' : ''}>Revision</option><option value="Internal Review" ${ws === 'Internal Review' ? 'selected' : ''}>Internal Review</option><option value="Client Review" ${ws === 'Client Review' ? 'selected' : ''}>Client Review</option><option value="Done" ${ws === 'Done' ? 'selected' : ''}>Done</option></select>` : `<strong class="ws-badge ${wsClass}">${ws}</strong>`}`}</div>
                <div class="detail-item"><span>Revision Count</span>${securePin && !isDoneTab ? `<div style="display:flex; align-items:center; gap:8px; margin-top:2px;"><button class="rev-btn" onclick="updateRevisionOptimistic(event, '${item.job_id}', ${item.revision || 0}, -1)">-</button><strong style="min-width:15px; text-align:center;">${item.revision || 0}</strong><button class="rev-btn" onclick="updateRevisionOptimistic(event, '${item.job_id}', ${item.revision || 0}, 1)">+</button></div>` : `<strong>${item.revision || 0}</strong>`}</div>
                ${(item.approver) ? `<div class="detail-item"><span>Approved By</span><strong>${item.approver}</strong></div>` : ''}
            </div>
            ${renderMonthlyFlowPanel(item)}
            ${renderTaskNotesBox(item)}
            ${renderAdminTrackingPanel(item)}
            <div class="brief-box">
                ${formattedBriefHTML}
                ${item.ref_link ? `<p style="margin-top: 15px;"><strong>Reference:</strong> <a href="${item.ref_link}" target="_blank">Click to view reference</a></p>` : ''}
                ${formattedRemarks ? `<p style="margin-top: 15px; line-height: 1.6;"><strong>Remarks:</strong><br>${formattedRemarks}</p>` : ''}
            </div>
        `;

        let footerHtml = '';
        const handleHtml = `<div class="dm-footer-handle-wrap" onclick="document.getElementById('dm-footer-content').classList.toggle('expanded')"><div class="dm-footer-handle"></div><span style="font-size:0.65rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px;">Action Menu</span></div>`;

        if (String(item.status).toLowerCase() === 'pending') {
            if (securePin) {
                warmPlaybookGenerator();
                bodyHtml += `<div class="assign-area"><label style="font-size: 0.85rem; font-weight: 600; margin-bottom: 10px; display: block; color: var(--text-main);">1. Select Creative PIC (Multiple Allowed):</label>${renderCreativePicGroups(item.job_id)}<label style="font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; margin-top: 20px; display: block; color: var(--text-main);">2. Generate Creative Playbook:</label><div style="display:flex; gap:10px; margin-bottom: 15px; flex-wrap:wrap;"><input type="text" id="playbook-${item.job_id}" placeholder="Click Auto-Generate or paste link..." style="flex:1; min-width:200px; border-style: dashed; padding: 10px 15px; border-radius: 8px; border: 1px solid var(--border-main); background: var(--bg-input); color: var(--text-main);"><button onclick="generatePlaybook('${item.job_id}', '${safeClient}', '${safeTitle}', '${safeRequester}')" id="btn-gen-${item.job_id}" class="btn-action" style="background:var(--link-color); color:white; border:none; min-width:140px; margin:0;"><i data-lucide="sparkles"></i> Auto-Generate</button></div></div>`;
                footerHtml = handleHtml + `<div class="action-buttons"><button id="btn-approve-${item.job_id}" onclick="approveJob('${item.job_id}', '${safeClient}', '${safeTitle}')" class="btn-action btn-approve"><i data-lucide="check"></i> Approve & Assign</button><button onclick="openEditModal('${item.job_id}', '${safeClient}', '${safeTitle}', '${item.deadline}', '${safeAssignee}')" class="btn-action btn-copy"><i data-lucide="edit-2"></i> Edit Request</button><button onclick="deleteJob('${item.job_id}')" class="btn-action btn-delete"><i data-lucide="trash-2"></i> Delete</button></div>`;
            } else {
                bodyHtml += `<div class="locked-msg"><i data-lucide="lock"></i> Status: Reviewing requirements. Awaiting Admin Assignment.</div>`;
            }
        } else {
            if (securePin && !isDoneTab) {
                footerHtml = handleHtml + `<div class="action-buttons"><button onclick="copyText('requester', '${item.job_id}', '${safeClient}', '${safeTitle}', '${safeAssignee}', '${item.deadline}', '${item.playbook_link}', '${safeRequester}')" class="btn-action btn-copy"><i data-lucide="copy"></i> Msg: Requester</button><button onclick="copyText('team', '${item.job_id}', '${safeClient}', '${safeTitle}', '${safeAssignee}', '${item.deadline}', '${item.playbook_link}', '')" class="btn-action btn-copy"><i data-lucide="copy"></i> Msg: Team</button>${String(item.work_status).toLowerCase() === 'client review' ? `<button onclick="copyText('review', '${item.job_id}', '${safeClient}', '${safeTitle}', '${safeAssignee}', '${item.deadline}', '${item.playbook_link}', '${safeRequester}')" class="btn-action" style="background: #8b5cf6; color: white; border: none;"><i data-lucide="mail"></i> Msg: Review</button>` : ''}${String(item.work_status).toLowerCase() === 'client review' ? `<button onclick="copyText('chase_client', '${item.job_id}', '${safeClient}', '${safeTitle}', '${safeAssignee}', '${item.deadline}', '${item.playbook_link}', '${safeRequester}')" class="btn-action" style="background: #0ea5e9; color: white; border: none;"><i data-lucide="message-circle"></i> Chase Requester</button>` : ''}${String(item.work_status).toLowerCase() === 'revision' ? `<button onclick="copyText('revision_alert', '${item.job_id}', '${safeClient}', '${safeTitle}', '${safeAssignee}', '${item.deadline}', '${item.playbook_link}', '')" class="btn-action" style="background: #ea580c; color: white; border: none;"><i data-lucide="alert-circle"></i> Msg: Revision</button>` : ''}<button onclick="copyText('chase', '${item.job_id}', '${safeClient}', '${safeTitle}', '${safeAssignee}', '${item.deadline}', '${item.playbook_link}', '')" class="btn-action" style="background: var(--orange); color: white; border: none;"><i data-lucide="bell-ring"></i> Chase Status</button><button onclick="openEditModal('${item.job_id}', '${safeClient}', '${safeTitle}', '${item.deadline}', '${safeAssignee}')" class="btn-action btn-copy"><i data-lucide="edit-2"></i> Edit</button><button onclick="deleteJob('${item.job_id}')" class="btn-action btn-delete"><i data-lucide="trash-2"></i> Delete</button></div>`;
            } else if (securePin && isDoneTab) {
                footerHtml = handleHtml + `<div class="action-buttons"><button onclick="copyText('done_team', '${item.job_id}', '${safeClient}', '${safeTitle}', '${safeAssignee}', '${item.deadline}', '${item.playbook_link}', '${safeRequester}')" class="btn-action btn-copy" style="flex:1; background: var(--green); color: white; border: none;"><i data-lucide="check-circle"></i> Msg: Team (Done)</button><select onchange="updateWorkStatusOptimistic('${item.job_id}', this.value)" class="ws-select" style="background: var(--text-muted); flex: 1;"><option value="">Undo Status...</option><option value="Client Review">Move back to Review</option></select><button onclick="deleteJob('${item.job_id}')" class="btn-action btn-delete" style="flex: 1;"><i data-lucide="trash-2"></i> Delete Record</button></div>`;
            }
        }

        document.getElementById('dm-body-content').innerHTML = bodyHtml;
        document.getElementById('dm-footer-content').innerHTML = footerHtml;
        document.getElementById('dm-footer-content').style.display = footerHtml ? 'block' : 'none';
        document.getElementById('dm-footer-content').classList.remove('expanded');

        refreshIcons();

        if(!isUpdate) {
            document.body.classList.add('no-scroll');
            const modal = document.getElementById('globalDetailModal');
            modal.style.display = 'flex';
            modal.offsetHeight;
            modal.classList.add('show');
        }

    } catch (err) {
        console.error("Ralat masa buka Modal:", err);
        alert("Ada ralat teknikal: " + err.message);
    }
}
// ========================================================
// 🌟 10. PENGURUSAN DATA SUPABASE (SUBMIT / EDIT / DELETE)
// ========================================================
async function submitRequest() {
    const name = document.getElementById('requesterName').value || document.getElementById('manualName').value;
    const client = document.getElementById('pClient').value.trim();
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

        const payload = {
            job_id: finalJobID, requester_name: name, region: region, client_name: client, project_title: document.getElementById('pTitle').value,
            job_type: types, objective: objective, brief: fullBrief, deadline: deadline, ref_link: document.getElementById('pRefLink').value,
            remarks: document.getElementById('pRemarks').value, status: 'pending', assignee: 'Unassigned', playbook_link: '', work_status: 'Not started', revision: 0, approver: ''
        };

        // 3. HANTAR KE SUPABASE
        const { error } = await supabaseClient.from('creative_requests').insert([payload]);
        if (error) throw new Error(error.message);

        // Optimistic Update
        globalData.unshift(payload);
        logTaskActivity(finalJobID, 'submitted', '', 'pending', `Request submitted by ${name}`, { region, job_type: types });

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
    const playbookLink = document.getElementById(`playbook-${jobID}`).value.trim();
    if(!playbookLink) return showAppleAlert("Missing Link", "Please auto-generate or paste the Creative Playbook link first.");

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
        // 2. Update pangkalan data Supabase
        const { error } = await supabaseClient.from('creative_requests').update({
            assignee: selectedPIC, status: 'approved', playbook_link: playbookLink, work_status: 'Not started', revision: 0, approver: currentUser
        }).eq('job_id', jobID);

        if (error) throw error;

        // 3. Optimistic Update: Tukar data di memori serta-merta tanpa tunggu reload
        const item = globalData.find(d => d.job_id === jobID);
        const flag = getFlag(item ? item.region : '');
        const oldAssignee = item ? getAssigneeDisplay(item.assignee) : 'Unassigned';

        if (item) {
            item.status = 'approved';
            item.assignee = selectedPIC;
            item.playbook_link = playbookLink;
            item.approver = currentUser;
            item.work_status = 'Not started'; // Paksa status jadi 'Not started'
            item.revision = 0;
        }
        logTaskActivity(jobID, 'approved', 'pending', 'approved', `Approved by ${currentUser}`, { playbook_link: playbookLink });
        logTaskActivity(jobID, 'pic_changed', oldAssignee, selectedPIC, 'PIC assigned during approval');

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
    const jobID = document.getElementById('editJobId').value;
    const client = document.getElementById('editClient').value;
    const title = document.getElementById('editTitle').value;
    const deadline = document.getElementById('editDeadline').value;
    const editAssignee = document.getElementById('editAssignee');
    const assignee = editAssignee ? (editAssignee.value || editAssignee.dataset.originalAssignee || 'Unassigned') : 'Unassigned';

    if(!client || !title || !deadline) return showAppleAlert("Missing Data", "Fields cannot be empty.");
    const job = globalData.find(d => d.job_id === jobID);
    const oldSummary = job ? `${job.client_name || ''} | ${job.project_title || ''} | ${job.deadline || ''} | ${getAssigneeDisplay(job.assignee)}` : '';
    const newSummary = `${client} | ${title} | ${deadline} | ${assignee}`;

    const btn = document.getElementById('saveEditBtn');
    btn.innerHTML = 'Updating...';
    btn.disabled = true;

    try {
        const { error } = await supabaseClient.from('creative_requests').update({
            client_name: client, project_title: title, deadline: deadline, assignee: assignee
        }).eq('job_id', jobID);
        if(error) throw error;
        if (job) {
            job.client_name = client;
            job.project_title = title;
            job.deadline = deadline;
            job.assignee = assignee;
        }
        logTaskActivity(jobID, 'request_updated', oldSummary, newSummary, 'Request details edited');
        showNotification('Request Updated', '');
        closeEditModal();
    } catch(e) {
        showAppleAlert("Update Error", e.message);
    } finally {
        btn.innerHTML = 'Update Request';
        btn.disabled = false;
    }
}

async function updateWorkStatusOptimistic(jobID, newStatus, skipModal = false) {
    const job = globalData.find(d => d.job_id === jobID);
    const oldStatus = job ? job.work_status : 'Not started';

    // Kalau user pilih status yang sama, abaikan je
    if (oldStatus === newStatus) return;

    let updatePayload = { work_status: newStatus };
    const nowISO = new Date().toISOString();
    let revisionReasonText = "";

    // 🌟 LOGIK BARU: Tanya sebab kalau status ditarik/ditukar ke Revision
    if (newStatus === 'Revision') {
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
        let newRev = parseInt(job ? job.revision || 0 : 0) + 1;
        const oldReasons = job ? job.revision_reasons || "" : "";
        const todayStr = nowISO.split('T')[0];
        const newEntry = `[${todayStr}] ${revisionReasonText}`;
        let updatedReasons = oldReasons ? oldReasons + " | " + newEntry : newEntry;

        updatePayload.revision = newRev;
        updatePayload.revision_reasons = updatedReasons;

        if (job) {
            job.revision = newRev;
            job.revision_reasons = updatedReasons;
        }
    }

    // Rekod masa tepat bila status ditukar / di-drag
    updatePayload.last_moved_at = nowISO;
    if (job) job.last_moved_at = nowISO;

    if (newStatus === 'Client Review') {
        updatePayload.review_started_at = nowISO;
        if (job) job.review_started_at = nowISO;
    } else if (newStatus === 'Done') {
        updatePayload.done_at = nowISO;
        if (job) job.done_at = nowISO;
    }

    if (job) {
        job.work_status = newStatus;
        renderBoards();
        if (typeof isKanbanMode !== 'undefined' && isKanbanMode) renderKanbanBoard();
        renderDashboard();
        // Hanya buka modal jika bukan dipanggil dari Drag & Drop
        if (!skipModal) openDetailModal(jobID, true);
    }
    showNotification('Status Updated', newStatus);

    try {
        const { error } = await supabaseClient.from('creative_requests').update(updatePayload).eq('job_id', jobID);
        if(error) throw error;
        logTaskActivity(jobID, 'status_changed', oldStatus, newStatus, revisionReasonText, { update_payload: updatePayload });
    } catch(e) {
        showAppleAlert("Status Update Error", e.message);
        if(job) {
            job.work_status = oldStatus;
            renderBoards();
            if (typeof isKanbanMode !== 'undefined' && isKanbanMode) renderKanbanBoard();
            renderDashboard();
            if(!skipModal) openDetailModal(jobID, true);
        }
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
        if(val !== "3030300" && val !== "1234") return false;
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
                    job_id: mapped.jobid || d.job_id || '', requester_name: mapped.requestername || mapped.name || mapped.requester || d.requester_name || '', region: mapped.region || d.region || '', client_name: mapped.clientname || mapped.client || d.client_name || '', project_title: mapped.projecttitle || mapped.title || d.project_title || '', job_type: mapped.jobtype || mapped.type || d.job_type || '', objective: mapped.objective || d.objective || '', brief: mapped.brief || d.brief || '', deadline: mapped.deadline || d.deadline || '', ref_link: mapped.reflink || mapped.reference || d.ref_link || '', remarks: mapped.remarks || mapped.notes || d.remarks || '', status_notes: mapped.statusnotes || d.status_notes || '', status: (mapped.status || d.status || 'pending').toString().toLowerCase().trim(), assignee: mapped.assignee || mapped.pic || d.assignee || 'Unassigned', playbook_link: mapped.playbooklink || mapped.playbook || d.playbook_link || '', work_status: mapped.workstatus || mapped.progress || d.work_status || 'Not started', revision: mapped.revision || mapped.rev || d.revision || 0, approver: mapped.approver || d.approver || ''
                };
            });
            const combinedData = [...globalData, ...archived];
            let doneData = combinedData.filter(d => String(d.status || '').toLowerCase() === 'approved' && String(d.work_status || '').toLowerCase() === 'done');
            doneData = filterDataByRegion(doneData, isSuperAdmin ? currentRegionFilter : userRegion);
            const qD = document.getElementById('searchDone') ? document.getElementById('searchDone').value.toLowerCase() : '';
            if(qD) {
                doneData = doneData.filter(d => String(d.job_id || '').toLowerCase().includes(qD) || String(d.client_name || '').toLowerCase().includes(qD) || String(d.requester_name || '').toLowerCase().includes(qD) || String(d.assignee || '').toLowerCase().includes(qD) || getTaskNoteValue(d).toLowerCase().includes(qD));
            }
            if (doneData.length === 0) {
                document.getElementById('doneList').innerHTML = '<div class="empty-state"><i data-lucide="search-x"></i><p>No matching tasks found.</p></div>';
            } else {
                const groupedDone = {};
                doneData.forEach(item => {
                    let sortKey = "0000-00"; let displayLabel = "No Date";
                    if(item.deadline) {
                        const d = new Date(item.deadline);
                        if(!isNaN(d)) {
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
                    group.tasks.sort((a, b) => { let dateA = a.deadline ? new Date(a.deadline) : new Date('9999-12-31'); let dateB = b.deadline ? new Date(b.deadline) : new Date('9999-12-31'); return dateA - dateB; });
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

    const headers = ["Job ID", "Client Name", "Project Title", "Requester", "Region", "Job Type", "Objective", "Deadline", "Revision", "Revision Reasons", "Assigned Team", "Playbook Link", "Created At", "Review Started At", "Done At"];

    const rows = doneData.map(d => [
        d.job_id, d.client_name, d.project_title, d.requester_name, d.region, d.job_type, d.objective, formatDate(d.deadline), (d.revision || 0), d.revision_reasons, d.assignee, d.playbook_link,
        d.created_at ? new Date(d.created_at).toLocaleString('en-GB') : '',
        d.review_started_at ? new Date(d.review_started_at).toLocaleString('en-GB') : '',
        d.done_at ? new Date(d.done_at).toLocaleString('en-GB') : ''
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
    if (!task.created_at || !task.done_at) return '';
    const start = new Date(task.created_at);
    const done = new Date(task.done_at);
    if (isNaN(start) || isNaN(done)) return '';
    return Math.round(((done - start) / (1000 * 60 * 60)) * 10) / 10;
}

function getTaskOverdueDays(task) {
    if (!task.deadline) return '';
    const deadline = new Date(task.deadline);
    const endDate = task.done_at ? new Date(task.done_at) : new Date();
    if (isNaN(deadline) || isNaN(endDate)) return '';
    deadline.setHours(23, 59, 59, 999);
    const diff = Math.ceil((endDate - deadline) / (1000 * 60 * 60 * 24));
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
        if (!task.deadline) { gaps.push('deadline'); recommendations.push('Deadline is needed for SLA and overdue reporting.'); }
        if (!task.brief) { gaps.push('brief'); recommendations.push('Brief quality affects revision and cycle-time analysis.'); }
        if (status === 'approved' && (!task.assignee || task.assignee === 'Unassigned')) { gaps.push('assignee'); recommendations.push('Assign a PIC before work starts.'); }
        if (status === 'approved' && !task.playbook_link) { gaps.push('playbook_link'); recommendations.push('Add playbook/working link for audit and handover.'); }
        if (workStatus === 'done' && !task.done_at) { gaps.push('done_at'); recommendations.push('Capture done_at when closing task.'); }
        if (noteCount === 0 && status === 'approved') { gaps.push('notes_history'); recommendations.push('Add at least one task note for monthly reporting context.'); }
        if (Number(task.revision || 0) > 0 && !task.revision_reasons) { gaps.push('revision_reasons'); recommendations.push('Record revision reasons to identify brief/client/workflow issues.'); }

        return {
            job_id: task.job_id,
            client_name: task.client_name,
            project_title: task.project_title,
            status: task.status,
            work_status: task.work_status,
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
        const logs = getTaskLogs(task.job_id).filter(log => log.action_type === 'status_changed').sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        if (!logs.length) {
            rows.push({
                job_id: task.job_id,
                client_name: task.client_name,
                project_title: task.project_title,
                status: task.work_status || task.status || 'Unknown',
                started_at: getStatusStartedAt(task),
                ended_at: task.done_at || '',
                duration_hours: getStatusStartedAt(task) ? Math.round(((new Date(task.done_at || new Date()) - new Date(getStatusStartedAt(task))) / (1000 * 60 * 60)) * 10) / 10 : ''
            });
            return;
        }

        logs.forEach((log, index) => {
            const next = logs[index + 1];
            const end = next ? next.created_at : (task.done_at || new Date().toISOString());
            rows.push({
                job_id: task.job_id,
                client_name: task.client_name,
                project_title: task.project_title,
                status: log.new_value || '',
                started_at: log.created_at,
                ended_at: next ? next.created_at : '',
                duration_hours: Math.round(((new Date(end) - new Date(log.created_at)) / (1000 * 60 * 60)) * 10) / 10
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
"You are a creative operations analyst. Analyze these exported files from our creative request system. Identify workload trends, bottlenecks by status, overdue patterns, revision causes, team capacity issues, and recommendations to improve speed, productivity, and efficiency. Then propose whether team expansion is justified, which roles/regions need support, and what workflow changes would give the highest impact."

## Files
- tasks.csv: One row per task with lifecycle, status, deadline, assignee, revision, latest note, note count, monthly progress, and completion metrics.
- activity_logs.csv: Admin/system tracking timeline of actions.
- notes_history.csv: Full public task notes thread with author/status/time.
- team_summary.csv: Workload and completion summary by PIC.
- status_aging.csv: Time spent in current or historical statuses.
- data_gaps.csv: Missing fields that weaken reporting quality.

## Reporting Principles
Use this data for capacity planning and process improvement, not individual blame. Separate creative workload delays from client review delays, unclear briefs, revision causes, notes context, and leave/handover impact.
`;
}

function exportReportPack() {
    if (!hasAdminAccess()) return showAppleAlert("Admin Only", "Please unlock Admin Access first.");

    const tasks = getReportingTasks();
    if (!tasks.length) return showAppleAlert("Export Failed", "No tasks available for the current region filter.");

    const taskIds = new Set(tasks.map(t => t.job_id));
    const activityLogs = (globalActivityLogs || []).map(normalizeLogRow).filter(log => taskIds.has(log.job_id));
    const noteLogs = (globalNoteLogs || []).map(normalizeNoteRow).filter(log => taskIds.has(log.job_id));
    const date = new Date().toISOString().split('T')[0];
    const region = (isSuperAdmin ? currentRegionFilter : userRegion).replace(/\s+/g, '_');
    const base = `Adtechinno_${region}_Report_${date}`;

    const taskRows = tasks.map(task => {
        const latestNote = getLatestTaskNote(task);
        const statusStartedAt = getStatusStartedAt(task);
        return {
            job_id: task.job_id,
            client_name: task.client_name,
            project_title: task.project_title,
            requester_name: task.requester_name,
            region: task.region,
            job_type: task.job_type,
            status: task.status,
            work_status: task.work_status,
            assignee: getAssigneeDisplay(task.assignee),
            deadline: task.deadline,
            created_at: task.created_at,
            approved_by: task.approver,
            review_started_at: task.review_started_at,
            done_at: task.done_at,
            completion_hours: getTaskCompletionHours(task),
            overdue_days: getTaskOverdueDays(task),
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
            current_status_age_hours: getHoursBetween(statusStartedAt)
        };
    });

    const activityRows = activityLogs.map(log => ({
        job_id: log.job_id,
        action_type: log.action_type,
        actor_name: log.actor_name,
        old_value: log.old_value,
        new_value: log.new_value,
        note_text: log.note_text,
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
    downloadTextFile(`${base}_activity_logs.csv`, rowsToCSV(['job_id', 'action_type', 'actor_name', 'old_value', 'new_value', 'note_text', 'created_at'], activityRows), 'text/csv;charset=utf-8;');
    downloadTextFile(`${base}_notes_history.csv`, rowsToCSV(['job_id', 'client_name', 'project_title', 'assignee', 'actor_name', 'status_at_time', 'note_text', 'created_at'], noteRows), 'text/csv;charset=utf-8;');
    downloadTextFile(`${base}_team_summary.csv`, rowsToCSV(['pic', 'active_tasks', 'completed_tasks', 'overdue_tasks', 'total_revisions', 'avg_completion_hours', 'job_types', 'regions'], teamRows), 'text/csv;charset=utf-8;');
    downloadTextFile(`${base}_status_aging.csv`, rowsToCSV(['job_id', 'client_name', 'project_title', 'status', 'started_at', 'ended_at', 'duration_hours'], agingRows), 'text/csv;charset=utf-8;');
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
async function generatePlaybook(jobID, client, title, requester) {
    const btn = document.getElementById(`btn-gen-${jobID}`);
    const input = document.getElementById(`playbook-${jobID}`);
    if (!btn || !input || btn.dataset.generating === 'true') return;

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
    timers.push(setTimeout(() => setGeneratingState('Still working...', 'Google Drive can take a little longer on first run...'), 25000));

    try {
        const res = await gasPost(
            { action: 'generate_playbook', data: { job_id: jobID, client_name: client, project_title: title, requester_name: requester } },
            { timeoutMs: 90000 }
        );

        if(res.status === "success") {
            const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
            input.value = res.url;
            input.placeholder = originalPlaceholder;
            btn.innerHTML = '<i data-lucide="external-link"></i> Open Playbook';
            btn.style.background = 'var(--green)';
            btn.setAttribute('onclick', `window.open('${res.url}', '_blank')`);
            btn.disabled = false;
            showNotification('Playbook Generated', `Ready in ${elapsed}s`);
        } else {
            throw new Error(res.message || 'Unknown generator error');
        }
    } catch(e) {
        const isTimeout = e.name === 'AbortError';
        showAppleAlert(
            "Playbook Error",
            isTimeout
                ? "Generator took more than 90 seconds. Google Apps Script or Drive is likely busy. Please try again, or paste the Playbook link manually if you already created one."
                : "Failed generating playbook: " + e.message
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
        populateWorkspaceCountrySelects();
        checkAdminUI();
        setPresetDate();

        // 🌟 FIX BARU: Tarik data staf SEBELUM sistem boot sepenuhnya
        try {
            const { data: teamData } = await supabaseClient.from('team_members').select('*').order('name', { ascending: true });
            if (teamData) {
                hydrateTeamCollections(teamData);
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
        alert("Sistem mengalami ralat: " + err.message);
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
        alert('Passcode salah. Akses ditolak.');
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
        btnText.innerText = "Switch to Normal View";
        normalView.style.display = 'none';
        kanbanView.style.display = 'flex';
        renderKanbanBoard();
    } else {
        btnText.innerText = "Kanban/Board View";
        normalView.style.display = 'block';
        kanbanView.style.display = 'none';
        renderBoards();
    }
}

function renderKanbanBoard() {
    const kanbanContainer = document.getElementById('kanbanBoardContainer');
    if (!kanbanContainer) return;

    let data = globalData || [];
    const finalRegion = isSuperAdmin ? currentRegionFilter : userRegion;
    data = filterDataByRegion(data, finalRegion);

    // 🌟 FIX BARU: Tapis tiket Kanban supaya staf biasa nampak tiket sendiri je
    const currentUser = localStorage.getItem('adtech_user_name');
    if (!isSuperAdmin && currentUser) {
        data = data.filter(d =>
            String(d.requester_name).toLowerCase() === currentUser.toLowerCase() ||
            String(d.assignee).toLowerCase().includes(currentUser.toLowerCase())
        );
    }

    // 🌟 LOGIK BARU: Masukkan data 'pending' ke dalam Kanban
    let activeData = data.filter(d =>
        String(d.status || '').toLowerCase() === 'pending' ||
        (String(d.status || '').toLowerCase() === 'approved' && String(d.work_status || '').toLowerCase() !== 'done')
    );

    const qW = document.getElementById('searchWorkload') ? document.getElementById('searchWorkload').value.toLowerCase() : '';
    if(qW) {
        activeData = activeData.filter(d => String(d.job_id || '').toLowerCase().includes(qW) || String(d.client_name || '').toLowerCase().includes(qW) || String(d.requester_name || '').toLowerCase().includes(qW) || String(d.assignee || '').toLowerCase().includes(qW) || getTaskNoteValue(d).toLowerCase().includes(qW));
    }

    // 🌟 FIX BARU: Susun ikut masa digerakkan (Terkini atas sekali), kemudian baru ikut deadline
    activeData.sort((a, b) => {
        let movedA = a.last_moved_at ? new Date(a.last_moved_at).getTime() : 0;
        let movedB = b.last_moved_at ? new Date(b.last_moved_at).getTime() : 0;

        if (movedA !== movedB) {
            return movedB - movedA; // Yang paling baru digerakkan akan duduk atas
        }

        let dateA = a.deadline ? new Date(a.deadline).getTime() : new Date('9999-12-31').getTime();
        let dateB = b.deadline ? new Date(b.deadline).getTime() : new Date('9999-12-31').getTime();
        return dateA - dateB;
    });

    // 🌟 PETA WARNA KANBAN (Dah ditukar susunan)
    const statusConfig = [
        { name: 'Inbox (Pending)', label: 'Inbox', isPending: true, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
        { name: 'Not started', label: 'Not Started', isPending: false, color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' },
        { name: 'Drafting', isPending: false, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
        { name: 'Partial Ready', label: 'Partial', isPending: false, color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.1)' },
        { name: 'Revision', isPending: false, color: '#ea580c', bg: 'rgba(234, 88, 12, 0.1)' },
        { name: 'Internal Review', label: 'Internal', isPending: false, color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.1)' },
        { name: 'Client Review', isPending: false, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
        { name: 'Done', isPending: false, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' }
    ];

    let html = '';
    statusConfig.forEach(cfg => {
        const statusName = cfg.name;

        let colTasks = [];
        if (cfg.isPending) {
            colTasks = activeData.filter(d => String(d.status || '').toLowerCase() === 'pending');
        } else {
            colTasks = activeData.filter(d => String(d.status || '').toLowerCase() === 'approved' && String(d.work_status || 'Not started').toLowerCase() === statusName.toLowerCase());
        }

        const isDoneZone = statusName === 'Done';
        const emptyDoneUI = isDoneZone ? `<div style="text-align:center; padding: 40px 10px; color: var(--green); font-weight: 600; font-size: 0.85rem; border: 2px dashed rgba(16, 185, 129, 0.4); border-radius: 12px; margin-top: 10px;"><i data-lucide="check-circle" style="width:28px; height:28px; margin-bottom:10px; opacity:0.8;"></i><br>Drop here to complete!</div>` : '';
        const statusSlug = statusName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const columnStateClass = colTasks.length ? 'has-tasks' : 'is-empty';

        const dragDropEvents = cfg.isPending ? '' : `ondragover="allowDrop(event)" ondragleave="dragLeave(event)" ondrop="drop(event, '${statusName}')"`;

        html += `
        <div class="kanban-column ${columnStateClass} status-${statusSlug} ${isDoneZone ? 'is-done-zone' : ''}" style="border-top-color: ${cfg.color}; ${isDoneZone ? 'background: rgba(16, 185, 129, 0.03); border: 1px dashed rgba(16, 185, 129, 0.3);' : ''}" ${dragDropEvents}>
            <div class="kanban-column-header">
                <span style="color: ${cfg.color};">${cfg.label || statusName}</span>
                <span class="kanban-column-count" style="background: ${cfg.bg}; color: ${cfg.color};">${colTasks.length}</span>
            </div>
            ${colTasks.map(t => {
                const cardDragAttr = cfg.isPending ? 'draggable="false"' : 'draggable="true" ondragstart="drag(event)"';
                const cursorStyle = cfg.isPending ? 'cursor: pointer;' : 'cursor: grab;';
                const typeMeta = getRequestTypeMeta(t);

                // 🌟 LOGIK LENCANA & CAHAYA (JUST MOVED)
                let isJustMoved = false;
                if (t.last_moved_at) {
                    const diffHours = (new Date() - new Date(t.last_moved_at)) / (1000 * 60 * 60);
                    // Kad akan menyala selama 2 jam selepas kau drop
                    if (diffHours <= 2) isJustMoved = true;
                }

                // Warna lencana akan ikut warna kolum supaya nampak sangat seragam dan premium
                const glow = isJustMoved ? `border-left-color: ${cfg.color}; background: linear-gradient(90deg, ${cfg.bg} 0%, transparent 80%); box-shadow: 0 4px 15px ${cfg.bg.replace('0.1', '0.2')};` : `border-left-color: ${cfg.color};`;
                const badge = isJustMoved ? `<span style="background: ${cfg.color}; color: #ffffff; border: none; font-size: 0.55rem; font-weight: 800; padding: 2px 6px; border-radius: 10px; letter-spacing: 0.5px; box-shadow: 0 2px 6px ${cfg.bg.replace('0.1', '0.3')}; white-space: nowrap; margin-left:6px;">✨ JUST MOVED</span>` : '';

                return `
                <div class="kanban-drag-card request-type-card type-${typeMeta.key}" id="${t.job_id}" ${cardDragAttr} onclick="openDetailModal('${t.job_id}')" title="Click to view full details" style="${glow} ${cursorStyle}">
                    <div style="display:flex; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:8px;">
                        <span class="kd-id" style="margin:0; white-space:nowrap;">[${t.job_id}] ${getFlag(t.region)}</span>
                        ${renderRequestTypePill(t, true)}
                        ${badge}
                    </div>
                    <div class="kd-title">${t.client_name}: ${t.project_title}</div>
                    ${renderMonthlyProgressChip(t)}
                    ${renderTaskNotePreview(t)}
                    <div class="kd-footer">
                        <span><i data-lucide="user" style="width:12px; margin-right:4px;"></i>${t.assignee !== 'null' ? t.assignee : 'Unassigned'}</span>
                    </div>
                </div>
                `;
            }).join('')}
            ${emptyDoneUI}
        </div>`;
    });

    kanbanContainer.innerHTML = html;
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

        // 🌟 LOGIK BARU: Letupkan Confetti bila masuk zon Done!
        if (newStatus === 'Done') {
            firePremiumConfetti();
        }

        // Refresh paparan Kanban
        setTimeout(() => {
            if (isKanbanMode) renderKanbanBoard();
        }, 100);
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
