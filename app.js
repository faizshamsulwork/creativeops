// ========================================================
// 🌟 1. SETUP SUPABASE & CONFIGURATION
// ========================================================
const SUPABASE_URL = 'https://jceiajlgymtvpviebfnk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjZWlhamxneW10dnB2aWViZm5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NTQ2NzcsImV4cCI6MjA5MTUzMDY3N30.gGmc7kL01FD8rRmZC1wiLFHgn5Wlbn0Lmp3IY9C2ODs';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const GAS_API = 'https://script.google.com/macros/s/AKfycbwKNzX9BsgsTz2Cu-L_egPvrwKe-hrcsVMSEAxVy7sDgdCYd8TYyzWAnxJwjf1wOlXx/exec'; 
const TELEGRAM_API = 'https://script.google.com/macros/s/AKfycbyC-UgaT5QWgaWqfAQN2K-tRE2BhFYumAWzDxM6GBApTddvI9SmQHcAyMoh1sN2UML1/exec'; 

const PIC_LIST = ["Abel", "Aaron", "Simon", "Alya", "Steven", "Faiz Shamsul", "Miftahul Fikri", "Youke Yap", "Annisya Y."]; 
const дизайнериMY = ["Abel", "Aaron", "Simon", "Alya", "Steven", "Faiz Shamsul"];
const дизайнериID = ["Miftahul Fikri", "Youke Yap", "Annisya Y."];

let globalData = []; 
let globalTeamStatus = []; 
let calMonth = new Date().getMonth();
let calYear = new Date().getFullYear();
let currentRegionFilter = 'all';
let userRegion = '';
let isSuperAdmin = false;
let currentRequestType = 'adhoc'; 

// ========================================================
// 🌟 2. UTILITIES & HELPERS
// ========================================================
function refreshIcons() {
    try { if (typeof lucide !== 'undefined') lucide.createIcons(); } 
    catch(e) { console.log("Ikon gagal dimuatkan."); }
}

async function gasPost(payload) {
    const res = await fetch(GAS_API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
    return res.json();
}

function formatDate(dateStr) {
    if (!dateStr) return '-'; const d = new Date(dateStr); if (isNaN(d)) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getFlag(region) {
    const r = String(region).toLowerCase();
    if (r === 'malaysia') return '🇲🇾'; if (r === 'indonesia') return '🇮🇩'; if (r === 'japan') return '🇯🇵';
    if (r === 'singapore') return '🇸🇬'; if (r === 'hong kong') return '🇭🇰'; if (r === 'china') return '🇨🇳'; if (r === 'vietnam') return '🇻🇳';
    return '🌐';
}

function filterDataByRegion(data, regionFilter) {
    if (regionFilter === 'all') return data;
    if (regionFilter === 'Global') return data.filter(d => String(d.region).toLowerCase() !== 'malaysia' && String(d.region).toLowerCase() !== 'indonesia');
    return data.filter(d => String(d.region).toLowerCase() === String(regionFilter).toLowerCase());
}

function updateLiveClock() {
    const timeDisplay = document.getElementById('currentTimeDisplay'); if (!timeDisplay) return;
    let tz = 'Asia/Kuala_Lumpur'; const activeRegion = isSuperAdmin ? currentRegionFilter : userRegion;
    if (activeRegion === 'Indonesia') tz = 'Asia/Jakarta'; else if (activeRegion === 'Malaysia') tz = 'Asia/Kuala_Lumpur'; else if (activeRegion === 'Japan') tz = 'Asia/Tokyo';
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
    
    // 🌟 LOGIK BARU: Kosongkan 4 Kotak Brief Berstruktur
    if (document.getElementById('briefHook')) {
        document.getElementById('briefHook').value = '';
        document.getElementById('briefAudience').value = '';
        document.getElementById('briefVibe').value = '';
        document.getElementById('briefMandatory').value = '';
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
    
    if(navItem) navItem.classList.add('active');

    // Minta kebenaran notifikasi jika Admin baru masuk
    if (id === 'dashboard' && localStorage.getItem('adtech_lead_pin') && 'Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
    }

    // Render semula data mengikut tab yang aktif
    if(globalData && globalData.length > 0) { 
        if(id === 'dashboard') renderDashboard(); 
        if(id === 'workload' || id === 'done') renderBoards(); 
    }
}

/**
 * Logik pertukaran tab dashboard untuk paparan mobile.
 */
function switchDashTab(tab) {
    if(window.innerWidth > 992) return; 
    document.querySelectorAll('.dash-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active-section'));
    document.getElementById(`btn-tab-${tab}`).classList.add('active');
    document.getElementById(`section-${tab}`).classList.add('active-section');
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
    const securePin = localStorage.getItem('adtech_lead_pin');
    
    const btnLoadArchive = document.getElementById('btnLoadArchive');
    const btnExportCSV = document.getElementById('btnExportCSV');
    const btnKanban = document.getElementById('adminKanbanToggle'); 

    if(securePin) { 
        btn.innerHTML = '<i data-lucide="unlock"></i> <span>Admin Unlocked</span>'; 
        btn.classList.add('unlocked'); 
        if(radar) radar.style.display = 'grid';
        if(document.getElementById('superAdminControls')) document.getElementById('superAdminControls').style.display = 'inline-flex'; 
        if(document.getElementById('btnArchive')) document.getElementById('btnArchive').style.display = 'inline-flex'; 
        
        if(btnLoadArchive) btnLoadArchive.style.display = 'inline-flex';
        if(btnExportCSV) btnExportCSV.style.display = 'inline-flex';
        if(btnKanban) btnKanban.style.display = 'block'; 
        
        isSuperAdmin = true;

        // 🌟 AUTO-TRIGGER: Tukar ke Kanban secara automatik
        if (typeof isKanbanMode !== 'undefined' && !isKanbanMode) {
            if (typeof toggleKanbanMode === 'function') toggleKanbanMode();
        }
        
    } else { 
        btn.innerHTML = '<i data-lucide="lock"></i> <span>Admin Access</span>'; 
        btn.classList.remove('unlocked'); 
        if(radar) radar.style.display = 'none';
        if(document.getElementById('superAdminControls')) document.getElementById('superAdminControls').style.display = 'none'; 
        if(document.getElementById('btnArchive')) document.getElementById('btnArchive').style.display = 'none'; 
        
        if(btnLoadArchive) btnLoadArchive.style.display = 'none';
        if(btnExportCSV) btnExportCSV.style.display = 'none';
        if(btnKanban) btnKanban.style.display = 'none'; 
        
        isSuperAdmin = false;
        
        // 🌟 AUTO-TRIGGER: Kembali ke paparan biasa jika Admin dikunci
        if(typeof isKanbanMode !== 'undefined' && isKanbanMode) {
            if (typeof toggleKanbanMode === 'function') toggleKanbanMode();
        }
    }
    if (typeof updateLiveClock === 'function') updateLiveClock(); 
    if (typeof refreshIcons === 'function') refreshIcons();
}

/**
 * Mengendalikan proses log masuk/keluar Admin menggunakan PIN.
 */
async function toggleAdmin() {
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
            // PIN keselamatan
            if(val === "3030300" || val === "1234") { 
                isSuperAdmin = true; 
                return true; 
            } 
            return false;
        });
        if(pin) {
            localStorage.setItem('adtech_lead_pin', pin); 
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
        if (country === 'Malaysia') names = ["Aaron", "Abel", "Ain Sabrina", "Alya", "Ammelia", "Angie Ng", "Bernice Mah", "Boon Jie Xin", "Chong Jia Jun", "Darren (Boo Hwa Chian)", "Dillon Frederick Kugan", "Faiz Shamsul", "Hao Yun", "Joanne Yap", "Joseph Chong", "Kevin Tan", "Lina Leong", "Nurul Iman Natasha", "Simon", "Steven", "Syaheerah Atiqah", "Wilson Ng Guan De", "Xuan Lee", "Zulkarnain Mustapa"];
        else if (country === 'Indonesia') names = ["Angelina", "Annisya Y.", "Arbaasya D.F.", "Areta G.P.", "Ashley Karamoy", "Avira P.P.", "Ayu Aprillia", "Fadhil Zuhayr", "Fajar Abhirama", "Jap Hetty", "Joanne Chan", "Lutfan Allen R.", "Marlina S.", "Miftahul Fikri", "Moh. Reza P.", "Naufal Hilmy", "Tiffani Y.", "Verincia T.", "Youke Yap"];
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
        
        userRegion = finalRegion; localStorage.setItem('adtech_user_name', userName); localStorage.setItem('adtech_region', finalRegion);
        setGreetingAndDate(userName); 
        
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
    
    // Kalau nama yang ditaip tu tak wujud lagi
    if(names.length === 0) {
        list.innerHTML = `<div style="padding:12px 20px; color:var(--text-muted); font-size:0.85rem; font-style:italic;">Type to add this new client...</div>`;
        return;
    }
    
    // Letak ikon Muji-style kat tepi nama client
    list.innerHTML = names.map(name => `<div class="dropdown-item" onmousedown="selectClientName('${name.replace(/'/g, "\\'")}')"><i data-lucide="building-2" style="width:16px; height:16px; color:var(--text-muted);"></i> ${name}</div>`).join('');
    refreshIcons();
}

// Tunjuk dropdown bila user klik kotak input
function showClientDropdown() {
    const list = document.getElementById('customClientList');
    if(list) list.classList.add('show');
    if(window.allClients) renderClientOptions(window.allClients);
}

// Sorok dropdown bila user klik tempat lain
function hideClientDropdown() {
    setTimeout(() => {
        const list = document.getElementById('customClientList');
        if(list) list.classList.remove('show');
    }, 150); 
}

// Tapis nama masa user menaip (Search)
function filterClientDropdown() {
    const input = document.getElementById('pClient').value.toLowerCase();
    if(!window.allClients) return;
    const filtered = window.allClients.filter(c => c.toLowerCase().includes(input));
    renderClientOptions(filtered);
}

// Masukkan nama ke dalam kotak bila user klik pada pilihan
function selectClientName(name) {
    document.getElementById('pClient').value = name;
    hideClientDropdown();
}

// 🌟 FUNGSI UTAMA: Tarik semua data (YANG TERPADAM TADI)
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
        // Tarik senarai client setiap kali sync
        await fetchClientsList();

        try {
            const { data: leaveData, error: leaveError } = await supabaseClient.from('team_leaves').select('*');
            if (leaveData) {
                globalTeamStatus = leaveData.map(row => ({
                    Name: row.name, Status: row.status || "", Start_Date: row.start_date || "", End_Date: row.end_date || "", Passcode: row.passcode || ""
                }));
            }
        } catch (e) { console.log("Gagal tarik data cuti Supabase:", e.message); }

       const { data, error } = await supabaseClient.from('creative_requests').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        
        const oldDataString = JSON.stringify(globalData);
        const newDataString = JSON.stringify(data || []);
        
        globalData = data || [];
        
        if (oldDataString !== newDataString) {
            if(document.getElementById('dashboard').classList.contains('active')) renderDashboard();
            if(document.getElementById('workload').classList.contains('active') || document.getElementById('done').classList.contains('active')) renderBoards();
            if(document.getElementById('leave').classList.contains('active') && typeof renderLeaveHistory === 'function') renderLeaveHistory();
        }

    } catch (e) { 
        console.error("Supabase load error:", e.message); 
    } finally {
        if (!silent) {
            const overlay = document.getElementById('soft-refresh-overlay');
            if (overlay) overlay.classList.remove('show');
        } else if (syncIndicator) {
            syncIndicator.style.opacity = '0';
            setTimeout(() => { if(syncIndicator) syncIndicator.remove(); }, 300);
        }
    }
}

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
    
    document.getElementById('total-val').innerText = data.length; document.getElementById('pending-val').innerText = pendingData.length; document.getElementById('active-val').innerText = activeData.length;

   const maxRecent = window.innerWidth <= 992 ? 3 : 5; 
    
    // 🌟 FIX: Terbalikkan (reverse) data dulu supaya ia dibaca dari bawah, 
    // kemudian baru sort. Ini selesaikan masalah data import yang ada tarikh/masa serentak!
    const sortedData = [...data].reverse().sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
    });
    
    const recent5 = sortedData.slice(0, maxRecent);
    
    document.getElementById('recent-list').innerHTML = recent5.length ? recent5.map((d, index) => `<tr onclick="if(typeof openDetailModal === 'function') openDetailModal('${d.job_id}')" class="clickable-row stagger-card" style="animation-delay: ${index * 0.05}s;" title="Click to view details"><td><span class="job-id-pill">${d.job_id} ${getFlag(d.region)}</span></td><td><div class="td-client">${d.client_name}</div><div style="font-size:0.75rem; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:150px;">${d.project_title}</div></td><td>${formatDate(d.deadline)}</td><td style="text-align:center;"><div style="font-size:1.2rem; cursor:help;" title="${String(d.status || '').toUpperCase()}">${String(d.status || '').toLowerCase() === 'pending' ? '⏳' : '✅'}</div></td></tr>`).join('') : '<tr><td colspan="4"><div class="empty-state" style="padding:20px;"><i data-lucide="inbox"></i><p>No requests yet.</p></div></td></tr>';

    const today = new Date(); today.setHours(0,0,0,0); const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);
    const urgentJobs = activeData.filter(d => { if(!d.deadline) return false; const dDate = new Date(d.deadline); return dDate >= today && dDate <= nextWeek; }).sort((a,b) => new Date(a.deadline) - new Date(b.deadline));
    
    document.getElementById('urgent-list').innerHTML = urgentJobs.length ? urgentJobs.map((u, index) => `<div class="urgent-item clickable-row stagger-card" style="animation-delay: ${index * 0.05}s;" onclick="if(typeof openDetailModal === 'function') openDetailModal('${u.job_id}')" title="Click to view details"><div style="flex:1; overflow:hidden; padding-right:10px;"><div class="urgent-client">${u.client_name}</div><div class="urgent-meta"><span class="job-id-pill" style="padding: 2px 6px; font-size: 0.65rem;">${u.job_id} ${getFlag(u.region)}</span> • ${u.assignee && u.assignee !== 'null' ? u.assignee : 'Unassigned'}</div></div><div class="urgent-date">${formatDate(u.deadline)}</div></div>`).join('') : '<div class="empty-state" style="padding:20px;"><i data-lucide="coffee"></i><p>Relax, no urgent deadlines.</p></div>';

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
            activeData = activeData.filter(d => String(d.job_id || '').toLowerCase().includes(qW) || String(d.client_name || '').toLowerCase().includes(qW) || String(d.requester_name || '').toLowerCase().includes(qW) || String(d.assignee || '').toLowerCase().includes(qW));
        }

        const statusOrder = {
            'pending': 0, 'not started': 1, 'drafting': 2, 'internal review': 3, 'revision': 4, 'client review': 5
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
                    { id: 'internal review', label: 'Internal Review', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.1)' },
                    { id: 'revision', label: 'Revision', color: '#ea580c', bg: 'rgba(234, 88, 12, 0.1)' },
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
        if(qD) doneData = doneData.filter(d => String(d.job_id || '').toLowerCase().includes(qD) || String(d.client_name || '').toLowerCase().includes(qD) || String(d.requester_name || '').toLowerCase().includes(qD) || String(d.assignee || '').toLowerCase().includes(qD));

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
    const borderColors = { 'Inbox (Pending)': '#ef4444', 'Not started': '#94a3b8', 'Drafting': '#f59e0b', 'Internal Review': '#0ea5e9', 'Revision': '#ea580c', 'Client Review': '#8b5cf6', 'Done': '#10b981' };
    const borderColor = borderColors[ws] || '#cbd5e1';
    
    const jobTypeStr = String(item.job_type).toLowerCase();
    let typeIcon = '⚡'; 
    if (jobTypeStr.includes('monthly')) typeIcon = '📅'; 
    else if (jobTypeStr.includes('pitch')) typeIcon = '🖥️'; 

    let isJustDone = false;
    if (isDoneTab && item.done_at) {
        const diffHours = (new Date() - new Date(item.done_at)) / (1000 * 60 * 60);
        if (diffHours <= 24) isJustDone = true;
    }

    // 🌟 FIX: Guna class CSS baru yang lebih kemas & menyokong Light/Dark Mode
    const glowStyle = isJustDone ? `border-left-color: var(--green); background: linear-gradient(90deg, rgba(16,185,129,0.05) 0%, transparent 80%); box-shadow: 0 4px 15px rgba(16,185,129,0.1);` : `border-left-color: ${borderColor};`;
    
    const newBadge = isJustDone ? `<span class="badge-recent">✨ RECENTLY DONE</span>` : '';
    
    return `
        <div class="kanban-card stagger-card" style="${glowStyle} animation-delay: ${index * 0.05}s;" onclick="if(typeof openDetailModal === 'function') openDetailModal('${item.job_id}')">
            <div class="kb-header" style="display:flex; align-items:flex-start; justify-content:space-between; gap: 8px;">
                <div style="display:flex; align-items:center; flex-wrap:wrap; gap:6px;">
                    <span class="kb-id" style="margin:0; white-space:nowrap;">${typeIcon} [${item.job_id}] ${getFlag(item.region)}</span>
                    ${newBadge}
                </div>
                <strong class="ws-badge ${wsClass}" ${isPending ? 'style="background: #ef4444;"' : ''}>${ws}</strong>
            </div>
            <div class="kb-title">${item.client_name}: ${item.project_title}</div>
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
    document.getElementById('editAssignee').value = assignee || 'Unassigned';
    
    let formattedDate = ""; 
    if(deadlineStr) { 
        const d = new Date(deadlineStr); 
        if(!isNaN(d)) formattedDate = d.toISOString().split('T')[0]; 
    }
    
    document.getElementById('editDeadline').value = formattedDate; 
    document.getElementById('editModal').style.display = 'flex';
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
        const actualAssignee = (item.assignee && item.assignee !== 'null') ? item.assignee : 'Unassigned';
        const actualRequester = (item.requester_name && item.requester_name !== 'null') ? item.requester_name : 'Unknown';

        const safeAssignee = String(actualAssignee).replace(/'/g, "\\'").replace(/"/g, '&quot;'); 
        const safeRequester = String(actualRequester).replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const ws = String(item.work_status || 'Not started'); 
        const wsClass = `ws-${ws.replace(/\s+/g, '-').toLowerCase()}`; 
        const isDoneTab = String(item.status).toLowerCase() === 'approved' && String(item.work_status).toLowerCase() === 'done'; 
        const securePin = localStorage.getItem('adtech_lead_pin');

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
            // Kita pecahkan Brief teks tu kalau dia Pitch Deck, supaya nampak kemas
            const formatPitchLinks = briefText.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color:var(--orange); font-weight: 600; text-decoration:underline; word-break:break-all;"><i data-lucide="external-link" style="width:14px; height:14px; vertical-align:middle;"></i> Open Link</a>').replace(/\n/g, '<br>');
            formattedBriefHTML = `<div style="background: rgba(245, 158, 11, 0.05); padding: 15px; border-radius: 8px; border: 1px solid rgba(245, 158, 11, 0.2);"><h4 style="color: var(--orange); margin: 0 0 10px 0; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;"><i data-lucide="presentation" style="width:16px; height:16px; vertical-align:middle; margin-right:5px;"></i> Pitch Deck Details</h4><p style="margin:0;">${formatPitchLinks}</p></div>`;
        } else {
            // Format standard
            const formattedBrief = briefText ? briefText.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color:var(--link-color); text-decoration:underline; word-break:break-all;">$1</a>').replace(/\n/g, '<br>') : 'No brief provided.';
            formattedBriefHTML = `<p><strong>Creative Brief & Plan:</strong><br>${formattedBrief}</p>`;
        }
        // --- TAMAT LOGIK FORMAT BRIEF ---

        let bodyHtml = `
            ${playbookBtnHtml}
            <div class="job-details">
                <div class="detail-item"><span>Region</span><strong>${getFlag(item.region)} ${item.region || 'Malaysia'}</strong></div>
                <div class="detail-item"><span>Requester</span><strong>${actualRequester}</strong></div>
                <div class="detail-item"><span>Job Type</span><strong>${item.job_type}</strong></div>
                <div class="detail-item"><span>Deadline</span><strong style="color:var(--red);">${formatDate(item.deadline)}</strong></div>
                <div class="detail-item"><span>Work Status</span>${String(item.status).toLowerCase() === 'pending' ? '<strong>-</strong>' : `${securePin && !isDoneTab ? `<select onchange="updateWorkStatusOptimistic('${item.job_id}', this.value)" class="ws-select ${wsClass}"><option value="Not started" ${ws === 'Not started' ? 'selected' : ''}>Not started</option><option value="Drafting" ${ws === 'Drafting' ? 'selected' : ''}>Drafting</option><option value="Internal Review" ${ws === 'Internal Review' ? 'selected' : ''}>Internal Review</option><option value="Revision" ${ws === 'Revision' ? 'selected' : ''}>Revision</option><option value="Client Review" ${ws === 'Client Review' ? 'selected' : ''}>Client Review</option><option value="Done" ${ws === 'Done' ? 'selected' : ''}>Done</option></select>` : `<strong class="ws-badge ${wsClass}">${ws}</strong>`}`}</div>
                <div class="detail-item"><span>Revision Count</span>${securePin && !isDoneTab ? `<div style="display:flex; align-items:center; gap:8px; margin-top:2px;"><button class="rev-btn" onclick="updateRevisionOptimistic(event, '${item.job_id}', ${item.revision || 0}, -1)">-</button><strong style="min-width:15px; text-align:center;">${item.revision || 0}</strong><button class="rev-btn" onclick="updateRevisionOptimistic(event, '${item.job_id}', ${item.revision || 0}, 1)">+</button></div>` : `<strong>${item.revision || 0}</strong>`}</div>
                ${(item.approver) ? `<div class="detail-item"><span>Approved By</span><strong>${item.approver}</strong></div>` : ''}
            </div>
            <div class="brief-box">
                ${formattedBriefHTML}
                ${item.ref_link ? `<p style="margin-top: 15px;"><strong>Reference:</strong> <a href="${item.ref_link}" target="_blank">Click to view reference</a></p>` : ''}
                ${item.remarks ? `<p style="margin-top: 10px;"><strong>Remarks:</strong> ${item.remarks}</p>` : ''}
            </div>
        `;

        let footerHtml = ''; 
        const handleHtml = `<div class="dm-footer-handle-wrap" onclick="document.getElementById('dm-footer-content').classList.toggle('expanded')"><div class="dm-footer-handle"></div><span style="font-size:0.65rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px;">Action Menu</span></div>`;

        if (String(item.status).toLowerCase() === 'pending') {
            if (securePin) {
                bodyHtml += `<div class="assign-area"><label style="font-size: 0.85rem; font-weight: 600; margin-bottom: 10px; display: block; color: var(--text-main);">1. Select Creative PIC (Multiple Allowed):</label><div class="designer-grid">${дизайнериMY.map(d => `<label class="check-item"><input type="checkbox" value="${d}" class="cb-${item.job_id}"> ${d}</label>`).join('')}${дизайнериID.map(d => `<label class="check-item"><input type="checkbox" value="${d}" class="cb-${item.job_id}"> ${d}</label>`).join('')}</div><label style="font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; margin-top: 20px; display: block; color: var(--text-main);">2. Generate Creative Playbook:</label><div style="display:flex; gap:10px; margin-bottom: 15px; flex-wrap:wrap;"><input type="text" id="playbook-${item.job_id}" placeholder="Click Auto-Generate or paste link..." style="flex:1; min-width:200px; border-style: dashed; padding: 10px 15px; border-radius: 8px; border: 1px solid var(--border-main); background: var(--bg-input); color: var(--text-main);"><button onclick="generatePlaybook('${item.job_id}', '${safeClient}', '${safeTitle}', '${safeRequester}')" id="btn-gen-${item.job_id}" class="btn-action" style="background:var(--link-color); color:white; border:none; min-width:140px; margin:0;"><i data-lucide="sparkles"></i> Auto-Generate</button></div></div>`;
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
    const client = document.getElementById('pClient').value.trim(); // .trim() supaya takde extra space
    const deadline = document.getElementById('pDeadline').value;
    const region = document.getElementById('pRegion').value || userRegion; 
    
    if(!name || !client || !deadline) return showAppleAlert("Incomplete Fields", "Please fill in Name, Client, and Deadline.");

    // 🌟 LOGIK BARU: Auto-Simpan nama client ke database jika belum wujud
    try {
        await supabaseClient.from('clients').upsert([{ name: client, region: region }], { onConflict: 'name', ignoreDuplicates: true });
        fetchClientsList(); // Refresh datalist secara senyap di background
    } catch(e) {
        console.log("Silent error saving new client:", e.message);
    }

    // Smart Validation untuk Ad-Hoc & Monthly
    if (currentRequestType !== 'pitch') {
        const hook = document.getElementById('briefHook') ? document.getElementById('briefHook').value.trim() : '';
        const audience = document.getElementById('briefAudience') ? document.getElementById('briefAudience').value.trim() : '';
        const vibe = document.getElementById('briefVibe') ? document.getElementById('briefVibe').value.trim() : '';
        
        if (!hook || !audience || !vibe) {
            return showAppleAlert("Incomplete Brief", "Please fill in The Big Idea, Target Audience, and Tone & Vibe. Designers cannot read minds!");
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
        const clientPrefix = client.substring(0, 3).toUpperCase().replace(/\s/g, 'X'); 
        const now = new Date();
        const yy = now.getFullYear().toString().slice(-2); 
        const mm = (now.getMonth() + 1).toString().padStart(2, '0'); 
        
        const { data: existingJobs } = await supabaseClient.from('creative_requests').select('job_id');
        const nextNumber = (existingJobs ? existingJobs.length : 0) + 1;
        const serial = nextNumber.toString().padStart(3, '0');
        
        const finalJobID = `${clientPrefix}-${yy}${mm}-${serial}`;

        // 2. KUMPUL DATA BORANG
        let objective = Array.from(document.querySelectorAll('#jobObjectives input[type="checkbox"]:checked')).map(cb => cb.value).join(', ');
        const otherInput = document.getElementById('objectiveOtherInput');
        if (otherInput && otherInput.value.trim()) { 
            objective = (objective ? objective + ', ' : '') + 'Other: ' + otherInput.value.trim(); 
        }
        if (!objective) objective = 'N/A';

        let types = ""; let compiledSizes = ""; // 🌟 LOGIK BARU: Cantumkan 4 kotak menjadi satu teks penuh
        let fullBrief = "";
        if (currentRequestType !== 'pitch') {
            const hook = document.getElementById('briefHook') ? document.getElementById('briefHook').value.trim() : '';
            const audience = document.getElementById('briefAudience') ? document.getElementById('briefAudience').value.trim() : '';
            const vibe = document.getElementById('briefVibe') ? document.getElementById('briefVibe').value.trim() : '';
            const mandatory = document.getElementById('briefMandatory') ? document.getElementById('briefMandatory').value.trim() : 'None';
            
            fullBrief = `[MAIN MESSAGE / HOOK]:\n${hook}\n\n[TARGET AUDIENCE]:\n${audience}\n\n[TONE, VIBE & REFERENCE]:\n${vibe}\n\n[MANDATORY / NO-GO]:\n${mandatory}`;
        } else {
            fullBrief = document.getElementById('pBrief') ? document.getElementById('pBrief').value : '';
        }

        // 🌟 LOGIK BARU: TANGKAP JENIS REQUEST DENGAN BETUL 🌟
        if (currentRequestType === 'monthly') {
            types = "Monthly Content Plan"; 
            const sCount = document.getElementById('mStatic').value || 0; 
            const vCount = document.getElementById('mVideo').value || 0; 
            const cCount = document.getElementById('mCarousel').value || 0;
            const capCount = document.getElementById('mCaption') ? document.getElementById('mCaption').value : 0; 
            
            compiledSizes = `- Static Posters: ${sCount}\n- Videos / Reels: ${vCount}\n- Carousels: ${cCount}\n- Caption Only: ${capCount}\n`;
            
        } else if (currentRequestType === 'pitch') {
            types = "Pitch Deck Proposal";
            objective = "Pitch / Proposal"; // Override objective supaya kemas
            
            const pitchSupport = Array.from(document.querySelectorAll('#pitchSupportTypes input[type="checkbox"]:checked')).map(cb => cb.value).join(', ');
            const pitchIdea = document.getElementById('pPitchIdea') ? document.getElementById('pPitchIdea').value.trim() : '';
            const pitchDraft = document.getElementById('pPitchDraft') ? document.getElementById('pPitchDraft').value.trim() : '';
            const pitchAsset = document.getElementById('pPitchAsset') ? document.getElementById('pPitchAsset').value.trim() : '';
            const pitchDate = document.getElementById('pPitchDate') ? document.getElementById('pPitchDate').value : '';
            
            if(!pitchDraft || !pitchAsset) throw new Error("Draft Deck Link and Brand Assets are mandatory for Pitch Deck.");
            
            fullBrief = `[PITCH STRATEGY / BIG IDEA]:\n${pitchIdea || 'N/A'}\n\n[PITCH SUPPORT NEEDED]:\n${pitchSupport || 'N/A'}\n\n[DRAFT DECK LINK]:\n${pitchDraft}\n\n[BRAND ASSETS]:\n${pitchAsset}\n\n[ACTUAL PITCH DATE]:\n${pitchDate ? formatDate(pitchDate) : 'Not specified'}`;
            
        } else {
            types = Array.from(document.querySelectorAll('#jobTypes input:checked')).map(cb => cb.value).join(', '); 
            const sizeRows = document.querySelectorAll('.size-row');
            sizeRows.forEach(row => {
                const sDetail = row.querySelector('.dyn-size-detail').value.trim(); 
                const sInput = row.querySelector('.dyn-size-input').value.trim(); 
                const sNotes = row.querySelector('.dyn-size-notes').value.trim();
                if (sDetail || sInput) compiledSizes += `- Detail: ${sDetail || 'N/A'}, Size: ${sInput || 'N/A'}, Notes: ${sNotes || '-'}\n`;
            });
        }

        // Cantumkan brief mengikut jenis
        if (compiledSizes) fullBrief = "[DELIVERABLES REQUIRED]:\n" + compiledSizes + "\n\n" + fullBrief;
        
        if (currentRequestType !== 'pitch') {
            const monthlyPlan = document.getElementById('pMonthlyPlan') ? document.getElementById('pMonthlyPlan').value : ''; 
            if(monthlyPlan) fullBrief += "\n\n[Monthly Plan Details]:\n" + monthlyPlan;
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
        
        if (item) { 
            item.status = 'approved'; 
            item.assignee = selectedPIC; 
            item.playbook_link = playbookLink; 
            item.approver = currentUser; 
            item.work_status = 'Not started'; // Paksa status jadi 'Not started'
            item.revision = 0;
        }

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
    const assignee = document.getElementById('editAssignee').value; 
    
    if(!client || !title || !deadline) return showAppleAlert("Missing Data", "Fields cannot be empty.");
    
    const btn = document.getElementById('saveEditBtn'); 
    btn.innerHTML = 'Updating...'; 
    btn.disabled = true;
    
    try {
        const { error } = await supabaseClient.from('creative_requests').update({ 
            client_name: client, project_title: title, deadline: deadline, assignee: assignee 
        }).eq('job_id', jobID);
        if(error) throw error; 
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
    
    let updatePayload = { work_status: newStatus };
    const nowISO = new Date().toISOString();

    // 🌟 LOGIK BARU: Rekod masa tepat bila status ditukar / di-drag
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
        renderDashboard(); 
        // Hanya buka modal jika bukan dipanggil dari Drag & Drop
        if (!skipModal) openDetailModal(jobID, true); 
    }
    showNotification('Status Updated', newStatus);
    
    try { 
        const { error } = await supabaseClient.from('creative_requests').update(updatePayload).eq('job_id', jobID); 
        if(error) throw error; 
    } catch(e) { 
        showAppleAlert("Status Update Error", e.message); 
        if(job) { job.work_status = oldStatus; renderBoards(); renderDashboard(); if(!skipModal) openDetailModal(jobID, true); } 
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
                    job_id: mapped.jobid || d.job_id || '', requester_name: mapped.requestername || mapped.name || mapped.requester || d.requester_name || '', region: mapped.region || d.region || '', client_name: mapped.clientname || mapped.client || d.client_name || '', project_title: mapped.projecttitle || mapped.title || d.project_title || '', job_type: mapped.jobtype || mapped.type || d.job_type || '', objective: mapped.objective || d.objective || '', brief: mapped.brief || d.brief || '', deadline: mapped.deadline || d.deadline || '', ref_link: mapped.reflink || mapped.reference || d.ref_link || '', remarks: mapped.remarks || mapped.notes || d.remarks || '', status: (mapped.status || d.status || 'pending').toString().toLowerCase().trim(), assignee: mapped.assignee || mapped.pic || d.assignee || 'Unassigned', playbook_link: mapped.playbooklink || mapped.playbook || d.playbook_link || '', work_status: mapped.workstatus || mapped.progress || d.work_status || 'Not started', revision: mapped.revision || mapped.rev || d.revision || 0, approver: mapped.approver || d.approver || '' 
                };
            });
            const combinedData = [...globalData, ...archived];
            let doneData = combinedData.filter(d => String(d.status || '').toLowerCase() === 'approved' && String(d.work_status || '').toLowerCase() === 'done');
            doneData = filterDataByRegion(doneData, isSuperAdmin ? currentRegionFilter : userRegion);
            const qD = document.getElementById('searchDone') ? document.getElementById('searchDone').value.toLowerCase() : '';
            if(qD) { 
                doneData = doneData.filter(d => String(d.job_id || '').toLowerCase().includes(qD) || String(d.client_name || '').toLowerCase().includes(qD) || String(d.requester_name || '').toLowerCase().includes(qD) || String(d.assignee || '').toLowerCase().includes(qD)); 
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
        // 🌟 BILA BALIK CUTI, KITA KEMBALIKAN SEMUA JOB KEPADA NAMA ASAL
        const btnReset = document.getElementById('btnResetLeave');
        btnReset.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Restoring Tasks...';
        btnReset.disabled = true;
        await processReturnFromLeave(name);
        btnReset.innerHTML = '<i data-lucide="check-circle"></i> I\'m Back (Reset)';
        btnReset.disabled = false;
        
    } else {
        if(!startDate || !endDate) return showAppleAlert("Missing Dates", "Please select leave start and end dates.");
        const lType = document.getElementById('leaveType').value; 
        const lOther = document.getElementById('leaveOtherInput').value.trim().replace(/\|/g, ''); 
        displayLeave = lType; 
        if (lType === 'Others' && lOther) { displayLeave = lOther; }
        
        let newStatus = "On Leave (" + displayLeave + ")";
        existingStatuses.push(newStatus); existingStarts.push(startDate); existingEnds.push(endDate);
        
        finalStatus = existingStatuses.join(' | '); 
        finalStart = existingStarts.join(' | '); 
        finalEnd = existingEnds.join(' | ');

        // 🌟 BILA NAK CUTI, SEMAK KALAU ADA KERJA BELUM SIAP (HANDOVER TRIGGER)
        const activeJobs = globalData.filter(d => String(d.status).toLowerCase() === 'approved' && String(d.work_status).toLowerCase() !== 'done' && String(d.assignee).includes(name));
        
        if(activeJobs.length > 0) {
            const payload = { name, passcode, finalStatus, finalStart, finalEnd, startDate, endDate, displayLeave, statusParam };
            openHandoverModal(activeJobs, payload);
            return; // BERHENTI! Tunggu form Handover diisi
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
function generatePlaybook(jobID, client, title, requester) {
    const btn = document.getElementById(`btn-gen-${jobID}`); 
    const input = document.getElementById(`playbook-${jobID}`);
    const originalHtml = btn.innerHTML; 
    btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Generating...'; 
    btn.disabled = true; 
    refreshIcons();
    
    gasPost({ action: 'generate_playbook', data: { job_id: jobID, client_name: client, project_title: title, requester_name: requester } })
    .then(res => {
        if(res.status === "success") { 
            input.value = res.url; 
            btn.innerHTML = '<i data-lucide="external-link"></i> Open Playbook'; 
            btn.style.background = 'var(--green)'; 
            btn.setAttribute('onclick', `window.open('${res.url}', '_blank')`); 
            btn.disabled = false; 
            showNotification('Playbook Generated', 'Link added successfully!'); 
        } else { 
            throw new Error(res.message); 
        }
    }).catch(e => { 
        showAppleAlert("Playbook Error", "Failed generating playbook: " + e.message); 
        btn.innerHTML = originalHtml; 
        btn.disabled = false; 
    }).finally(() => refreshIcons());
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
window.addEventListener('DOMContentLoaded', () => {
    try {
        initTheme(); 
        checkAdminUI(); 
        setPresetDate();
        
        const savedName = localStorage.getItem('adtech_user_name');
        if (savedName) { 
            checkSavedName(); 
        } else { 
            showPage('dashboard'); 
            document.getElementById('introPage').style.display = 'flex'; 
        }
        
        setInterval(updateLiveClock, 1000); 
        
        // 🌟 Aktifkan mode senyap animasi selepas 2.5 saat
        setTimeout(() => { document.body.classList.add('live-mode'); }, 2500); 
        
        // 🌟 TRIGGER SILENT SYNC BILA TUKAR TAB
        document.addEventListener("visibilitychange", () => { 
            if (document.visibilityState === "visible") { 
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
        btnText.innerText = "Admin: Switch to Normal View";
        normalView.style.display = 'none';
        kanbanView.style.display = 'flex';
        renderKanbanBoard();
    } else {
        btnText.innerText = "Admin: Kanban View";
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
    
    // 🌟 LOGIK BARU: Masukkan data 'pending' ke dalam Kanban
    let activeData = data.filter(d => 
        String(d.status || '').toLowerCase() === 'pending' || 
        (String(d.status || '').toLowerCase() === 'approved' && String(d.work_status || '').toLowerCase() !== 'done')
    );
    
    const qW = document.getElementById('searchWorkload') ? document.getElementById('searchWorkload').value.toLowerCase() : '';
    if(qW) {
        activeData = activeData.filter(d => String(d.job_id || '').toLowerCase().includes(qW) || String(d.client_name || '').toLowerCase().includes(qW) || String(d.requester_name || '').toLowerCase().includes(qW) || String(d.assignee || '').toLowerCase().includes(qW));
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

    // 🌟 PETA WARNA KANBAN
    const statusConfig = [
        { name: 'Inbox (Pending)', isPending: true, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
        { name: 'Not started', isPending: false, color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' },
        { name: 'Drafting', isPending: false, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
        { name: 'Internal Review', isPending: false, color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.1)' },
        { name: 'Revision', isPending: false, color: '#ea580c', bg: 'rgba(234, 88, 12, 0.1)' },
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

        const dragDropEvents = cfg.isPending ? '' : `ondragover="allowDrop(event)" ondragleave="dragLeave(event)" ondrop="drop(event, '${statusName}')"`;

        html += `
        <div class="kanban-column" style="border-top-color: ${cfg.color}; ${isDoneZone ? 'background: rgba(16, 185, 129, 0.03); border: 1px dashed rgba(16, 185, 129, 0.3);' : ''}" ${dragDropEvents}>
            <div class="kanban-column-header">
                <span style="color: ${cfg.color};">${statusName}</span> 
                <span class="kanban-column-count" style="background: ${cfg.bg}; color: ${cfg.color};">${colTasks.length}</span>
            </div>
            ${colTasks.map(t => {
                const cardDragAttr = cfg.isPending ? 'draggable="false"' : 'draggable="true" ondragstart="drag(event)"';
                const cursorStyle = cfg.isPending ? 'cursor: pointer;' : 'cursor: grab;';
                
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
                <div class="kanban-drag-card" id="${t.job_id}" ${cardDragAttr} onclick="openDetailModal('${t.job_id}')" title="Click to view full details" style="${glow} ${cursorStyle}">
                    <div style="display:flex; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:8px;">
                        <span class="kd-id" style="margin:0; white-space:nowrap;">[${t.job_id}] ${getFlag(t.region)}</span>
                        ${badge}
                    </div>
                    <div class="kd-title">${t.client_name}: ${t.project_title}</div>
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

