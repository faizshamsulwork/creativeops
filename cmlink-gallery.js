// ============================================================================
// CMLink Style Gallery — module logic
// ============================================================================
// Loaded after app.js/quote-builder.js (classic <script>, shares the page's global scope — reuses
// `supabaseClient` and `getCurrentUserName()` from app.js, same as every other feature module in
// this project). Data schema: see supabase/migrations/20260915000001_cmlink_gallery.sql. Prompt
// text/category/shot-type data: see cmlink-gallery-data.js (loaded before this file).
//
// Rendering rule this file follows throughout (see report §8 "known issues" — this was a real bug
// in the original prototype): a pick/filter/view/remove/add action re-renders ONLY the affected
// category's inner body (#cml-body-<slug>), never the whole accordion. Opening/closing a section is
// a pure CSS class toggle on the section wrapper — it never touches innerHTML — so it can't be
// reset by an unrelated re-render either.

// ---- Cloudinary config ----
// Unsigned upload — no API secret needed client-side. cloud name from the Cloudinary dashboard,
// upload preset created under Settings -> Upload -> Add upload preset (Signing Mode: Unsigned).
const CML_CLOUDINARY_CLOUD_NAME = 'gztqzowc';
const CML_CLOUDINARY_UPLOAD_PRESET = 'cmlink';

// ---- State ----
const cmlinkGalleryState = {
    shellRendered: false,
    loaded: false,
    realtimeSubscribed: false,
    images: [],       // rows from cmlink_gallery_images
    activeTab: 'gallery',
    addFormOpen: false,
    addFormCategory: 'Female',
    addFormShotType: 'Master Shot',
    category: {
        'Female': { open: false, filter: 'All', view: 'grid', slideIndex: 0 },
        'Male': { open: false, filter: 'All', view: 'grid', slideIndex: 0 },
        'Group of Friends': { open: false, filter: 'All', view: 'grid', slideIndex: 0 },
        'Phone': { open: false, filter: 'All', view: 'grid', slideIndex: 0 }
    },
    howToOpen: false,
    promptsAccordion: { 'Female': false, 'Male': false, 'Group of Friends': false },
    lightbox: null,
    confirmRemove: null,
    selectedForDownload: new Set() // image ids picked for bulk .zip download — separate from "Pick"
};

let cmlSelectedFile = null;
let cmlRealtimeChannel = null;
let cmlRealtimeDebounce = null;

// ---- Small helpers ----
function cmlSlug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }
function cmlEscHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function cmlEscJs(str) { return String(str ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }

function cmlToast(message, type) {
    const container = document.getElementById('cmlToastContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'cml-toast' + (type === 'error' ? ' error' : '');
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
        el.classList.add('leaving');
        setTimeout(() => el.remove(), 200);
    }, 2000);
}

async function cmlCopyText(text, btnEl) {
    try {
        await navigator.clipboard.writeText(text);
    } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (_) { /* best effort */ }
        document.body.removeChild(ta);
    }
    cmlToast('Copied to clipboard');
    if (btnEl) {
        const original = btnEl.textContent;
        btnEl.textContent = 'Copied!';
        setTimeout(() => { btnEl.textContent = original; }, 1200);
    }
}

// ---- Theme ----
// No theme control of its own — this module's colors are aliased to the platform's own CSS
// variables (see cmlink-gallery.css header), which already flip when the host's own light/dark
// toggle sets [data-theme="dark"] on <html>. Nothing to wire up here.

function cmlGlobalKeydown(e) {
    if (e.key !== 'Escape') return;
    if (cmlinkGalleryState.lightbox) closeCmlLightbox();
    else if (cmlinkGalleryState.confirmRemove) cmlCancelRemove();
}

// ---- Data ----
async function cmlFetchGalleryData() {
    try {
        const { data, error } = await supabaseClient.from('cmlink_gallery_images').select('*').order('added_at', { ascending: false });
        if (error) throw error;
        cmlinkGalleryState.images = data || [];
        cmlinkGalleryState.loaded = true;
        cmlUpdateUsageBadge();
    } catch (e) {
        console.error('CMLink gallery: fetch failed', e);
        cmlToast('Failed to load gallery data', 'error');
    }
}

function cmlSubscribeRealtime() {
    if (cmlRealtimeChannel || typeof supabaseClient === 'undefined') return;
    cmlRealtimeChannel = supabaseClient
        .channel('cmlink-gallery-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cmlink_gallery_images' }, cmlHandleRealtimeChange)
        .subscribe();
}
function cmlHandleRealtimeChange() {
    clearTimeout(cmlRealtimeDebounce);
    cmlRealtimeDebounce = setTimeout(async () => {
        await cmlFetchGalleryData();
        const page = document.getElementById('cmlink-gallery');
        if (page && page.classList.contains('active')) renderActiveTabContent();
    }, 400);
}

function cmlUpdateUsageBadge() {
    const el = document.getElementById('cmlUsageBadge');
    if (!el) return;
    const total = cmlinkGalleryState.images.length;
    el.textContent = `${total} image${total === 1 ? '' : 's'}`;
}

// ---- Entry point (called by showPage('cmlink-gallery') in app.js) ----
async function renderCmlinkGalleryPage() {
    const root = document.getElementById('cmlinkGalleryRoot');
    if (!root) return;

    if (!cmlinkGalleryState.shellRendered) {
        root.className = 'cmlink-gallery-root';
        root.innerHTML = cmlShellHtml();
        cmlinkGalleryState.shellRendered = true;
        document.addEventListener('keydown', cmlGlobalKeydown);
        window.addEventListener('resize', cmlUpdateTabIndicator);
        window.addEventListener('resize', cmlSyncAllSlideTracks);
    }

    const tabContent = document.getElementById('cmlTabContent');
    if (!cmlinkGalleryState.loaded && tabContent) {
        tabContent.innerHTML = '<div class="cml-skeleton">' + '<div class="cml-skeleton-bar"></div>'.repeat(4) + '</div>';
    }
    await cmlFetchGalleryData();
    if (!cmlinkGalleryState.realtimeSubscribed) {
        cmlSubscribeRealtime();
        cmlinkGalleryState.realtimeSubscribed = true;
    }
    renderActiveTabContent();
}

function cmlShellHtml() {
    return `
    <div class="cml-masthead">
        <div class="cml-masthead-title">
            <span class="cml-eyebrow">Talent Casting</span>
            <h1>Style gallery</h1>
            <p>Shared prompt library + pick/review gallery for AI talent-casting campaigns.</p>
        </div>
        <div class="cml-masthead-actions">
            <span class="cml-usage-badge cml-glass" id="cmlUsageBadge">— images</span>
        </div>
    </div>
    <button class="cml-howto-toggle-btn" type="button" onclick="cmlToggleHowTo()">
        <i data-lucide="info"></i> How to use
        <i data-lucide="chevron-down" class="cml-chevron" id="cmlHowToChevron"></i>
    </button>
    <div class="cml-howto-body" id="cmlHowToBody">
        <div class="cml-howto-panel cml-glass">
            <p>Generate casting options from the Prompts tab, upload the outputs in Gallery, and pick the approved ones — picks are shared with the whole team. Tick the checkbox on any image to select it, then download your selection as one .zip.</p>
            <div class="cml-combo-line-box">
                <p><strong>Combo line</strong> — paste this first when a shot needs both an identity reference AND the iPhone 17 Pro Max reference together: ${cmlEscHtml(window.CMLINK_COMBO_LINE)}</p>
                <button class="cml-copy-btn" type="button" onclick="cmlCopyText(window.CMLINK_COMBO_LINE, this)">Copy</button>
            </div>
        </div>
    </div>
    <div class="cml-tabs" id="cmlTabsRow">
        <button class="cml-tab-btn active" type="button" data-tab="gallery" onclick="cmlSwitchTab('gallery')">Gallery</button>
        <button class="cml-tab-btn" type="button" data-tab="prompts" onclick="cmlSwitchTab('prompts')">Prompts</button>
        <span class="cml-tab-indicator" id="cmlTabIndicator"></span>
    </div>
    <div id="cmlTabContent"></div>
    <div class="cml-toast-container" id="cmlToastContainer"></div>`;
}

function cmlToggleHowTo() {
    cmlinkGalleryState.howToOpen = !cmlinkGalleryState.howToOpen;
    const body = document.getElementById('cmlHowToBody');
    const chevron = document.getElementById('cmlHowToChevron');
    if (!body) return;
    body.style.maxHeight = cmlinkGalleryState.howToOpen ? body.scrollHeight + 'px' : '0px';
    if (chevron) chevron.style.transform = cmlinkGalleryState.howToOpen ? 'rotate(180deg)' : 'rotate(0deg)';
}

// ---- Tabs ----
function cmlSwitchTab(tab) {
    cmlinkGalleryState.activeTab = tab;
    document.querySelectorAll('.cml-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    cmlUpdateTabIndicator();
    renderActiveTabContent();
}

function cmlUpdateTabIndicator() {
    const row = document.getElementById('cmlTabsRow');
    const indicator = document.getElementById('cmlTabIndicator');
    const activeBtn = row && row.querySelector('.cml-tab-btn.active');
    if (!row || !indicator || !activeBtn) return;
    const rowRect = row.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    indicator.style.left = (btnRect.left - rowRect.left) + 'px';
    indicator.style.width = btnRect.width + 'px';
}

function renderActiveTabContent() {
    const container = document.getElementById('cmlTabContent');
    if (!container) return;
    if (cmlinkGalleryState.activeTab === 'gallery') {
        container.innerHTML = cmlGalleryTabHtml();
        renderAddFormArea();
        renderSelectionBar();
        Object.keys(cmlinkGalleryState.category).forEach(renderCategoryBody);
    } else if (cmlinkGalleryState.activeTab === 'prompts') {
        container.innerHTML = '<div id="cmlPromptsArea"></div>';
        renderPromptsTab();
    }
    container.classList.remove('cml-fade-in');
    void container.offsetWidth;
    container.classList.add('cml-fade-in');
    if (typeof lucide !== 'undefined') lucide.createIcons();
    cmlUpdateTabIndicator();
}

// ============================================================================
// Gallery tab
// ============================================================================
function cmlGalleryTabHtml() {
    return `
    <div id="cmlAddFormArea"></div>
    <div id="cmlSelectionBarArea"></div>
    <div class="cml-accordion">
        ${CMLINK_GALLERY_CATEGORIES.map(cat => {
            const slug = cmlSlug(cat);
            const st = cmlinkGalleryState.category[cat];
            return `
            <div class="cml-accordion-section cml-glass ${st.open ? 'open' : ''}" id="cml-section-${slug}">
                <div class="cml-accordion-header" onclick="cmlToggleAccordion('${cmlEscJs(cat)}')">
                    <div class="cml-accordion-header-left">
                        <h3>${cmlEscHtml(cat)}</h3>
                        <span class="cml-accordion-count" id="cml-count-${slug}">0</span>
                    </div>
                    <i data-lucide="chevron-down" class="cml-chevron"></i>
                </div>
                <div class="cml-accordion-body"><div class="cml-accordion-body-inner" id="cml-body-${slug}"></div></div>
            </div>`;
        }).join('')}
    </div>`;
}

function cmlToggleAccordion(category) {
    const st = cmlinkGalleryState.category[category];
    if (!st) return;
    st.open = !st.open;
    const section = document.getElementById('cml-section-' + cmlSlug(category));
    if (!section) return;
    section.classList.toggle('open', st.open);
    cmlSyncAccordionHeight(section, st.open);
}

// Measures the real content height and drives max-height in JS rather than guessing a fixed
// number or leaning on a pure-CSS 0fr grid trick (which leaked a sliver of content while
// "closed" in testing — a real Chromium quirk with that technique on nested overflow content).
function cmlSyncAccordionHeight(section, open) {
    const body = section.querySelector('.cml-accordion-body');
    const inner = section.querySelector('.cml-accordion-body-inner');
    if (!body || !inner) return;
    body.style.maxHeight = open ? inner.scrollHeight + 'px' : '0px';
}

// ---- Add-image form ----
function renderAddFormArea() {
    const el = document.getElementById('cmlAddFormArea');
    if (!el) return;
    if (!cmlinkGalleryState.addFormOpen) {
        el.innerHTML = `<button class="cml-add-toggle-btn" type="button" onclick="cmlinkGalleryState.addFormOpen = true; renderAddFormArea();"><i data-lucide="plus"></i> Add an image</button>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }
    const cat = cmlinkGalleryState.addFormCategory;
    const shotTypes = CMLINK_SHOT_TYPES_BY_CATEGORY[cat];
    el.innerHTML = `
    <form class="cml-add-form cml-glass" onsubmit="cmlSubmitAddImage(event)">
        <div class="cml-field">
            <label>Category</label>
            <select id="cmlAddCategory" onchange="cmlOnAddCategoryChange(this.value)">
                ${CMLINK_GALLERY_CATEGORIES.map(c => `<option value="${cmlEscHtml(c)}" ${c === cat ? 'selected' : ''}>${cmlEscHtml(c)}</option>`).join('')}
            </select>
        </div>
        <div class="cml-field">
            <label>Shot type</label>
            <select id="cmlAddShotType">
                ${shotTypes.map(t => `<option value="${cmlEscHtml(t)}" ${t === cmlinkGalleryState.addFormShotType ? 'selected' : ''}>${cmlEscHtml(t)}</option>`).join('')}
            </select>
        </div>
        <div class="cml-field">
            <label>Image</label>
            <div class="cml-dropzone" id="cmlDropzone" onclick="document.getElementById('cmlFileInput').click()">Click or drag an image here</div>
            <input type="file" id="cmlFileInput" accept="image/*" style="display:none" onchange="cmlOnFileChosen(this.files[0])">
        </div>
        <div class="cml-field">
            <label>Note (optional)</label>
            <input type="text" id="cmlAddLabel" placeholder="e.g. approved by Sarah">
        </div>
        <div style="display:flex; gap:8px; grid-column: 1 / -1;">
            <button type="submit" class="cml-submit-btn" id="cmlAddSubmitBtn">Add to gallery</button>
            <button type="button" class="cml-toggle-btn" onclick="cmlSelectedFile = null; cmlinkGalleryState.addFormOpen = false; renderAddFormArea();">Cancel</button>
        </div>
    </form>`;
    setupCmlDropzone();
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function cmlOnAddCategoryChange(cat) {
    cmlinkGalleryState.addFormCategory = cat;
    cmlinkGalleryState.addFormShotType = CMLINK_SHOT_TYPES_BY_CATEGORY[cat][0];
    renderAddFormArea();
}

function cmlOnFileChosen(file) {
    cmlSelectedFile = file || null;
    const dz = document.getElementById('cmlDropzone');
    if (dz) {
        dz.textContent = file ? `Selected: ${file.name}` : 'Click or drag an image here';
        dz.classList.toggle('has-file', !!file);
    }
}

function setupCmlDropzone() {
    const dz = document.getElementById('cmlDropzone');
    if (!dz) return;
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
    dz.addEventListener('drop', e => {
        e.preventDefault();
        dz.classList.remove('dragover');
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) {
            const input = document.getElementById('cmlFileInput');
            if (input) input.files = e.dataTransfer.files;
            cmlOnFileChosen(file);
        }
    });
}

async function cmlSubmitAddImage(event) {
    event.preventDefault();
    const category = document.getElementById('cmlAddCategory').value;
    const shotType = document.getElementById('cmlAddShotType').value;
    const label = document.getElementById('cmlAddLabel').value.trim();
    if (!cmlSelectedFile) { cmlToast('Choose an image first', 'error'); return; }

    const btn = document.getElementById('cmlAddSubmitBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Uploading…'; }
    try {
        const { url, publicId } = await cmlUploadToCloudinary(cmlSelectedFile);
        const addedBy = (typeof getCurrentUserName === 'function' ? getCurrentUserName() : '') || 'Unknown';
        const { data, error } = await supabaseClient
            .from('cmlink_gallery_images')
            .insert({ category, shot_type: shotType, label: label || null, image_url: url, cloudinary_public_id: publicId, added_by: addedBy })
            .select()
            .single();
        if (error) throw error;

        cmlinkGalleryState.images.unshift(data);
        cmlSelectedFile = null;
        cmlinkGalleryState.addFormOpen = false;
        cmlinkGalleryState.addFormShotType = CMLINK_SHOT_TYPES_BY_CATEGORY[category][0];
        renderAddFormArea();
        renderCategoryBody(category);
        cmlUpdateUsageBadge();
        cmlToast('Image added to gallery');
    } catch (e) {
        console.error('CMLink gallery: add image failed', e);
        cmlToast(e.message || 'Upload failed', 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Add to gallery'; }
    }
}

// ---- Category body (the isolated re-render target — see file header) ----
function renderCategoryBody(category) {
    const slug = cmlSlug(category);
    const bodyEl = document.getElementById('cml-body-' + slug);
    const countEl = document.getElementById('cml-count-' + slug);
    if (!bodyEl) return;

    const st = cmlinkGalleryState.category[category];
    const shotTypes = CMLINK_SHOT_TYPES_BY_CATEGORY[category];
    const allImages = cmlinkGalleryState.images.filter(img => img.category === category);
    if (countEl) countEl.textContent = String(allImages.length);

    // Empty category: skip the filter chips + Grid/Slide toggle entirely — 12 filter buttons for
    // zero images is pure noise, not a real choice. Just show the empty state directly.
    if (!allImages.length) {
        bodyEl.innerHTML = `<div class="cml-empty-note">No images yet. Use "+ Add an image" above.</div>`;
        return;
    }

    const filtered = st.filter === 'All' ? allImages : allImages.filter(img => img.shot_type === st.filter);

    const chips = ['All', ...shotTypes]
        .map(t => `<button class="cml-filter-chip ${st.filter === t ? 'active' : ''}" onclick="cmlSetFilter('${cmlEscJs(category)}', '${cmlEscJs(t)}')">${cmlEscHtml(t)}</button>`)
        .join('');

    const viewToggle = `
    <div class="cml-view-toggle">
        <button class="${st.view === 'grid' ? 'active' : ''}" onclick="cmlSetView('${cmlEscJs(category)}', 'grid')"><i data-lucide="grid-3x3"></i>Grid</button>
        <button class="${st.view === 'slide' ? 'active' : ''}" onclick="cmlSetView('${cmlEscJs(category)}', 'slide')"><i data-lucide="gallery-horizontal"></i>Slide</button>
    </div>`;

    let content;
    if (!filtered.length) {
        content = `<div class="cml-empty-note">No images for "${cmlEscHtml(st.filter)}" yet.</div>`;
    } else if (st.view === 'grid') {
        content = `<div class="cml-grid">${filtered.map((img, i) => cmlCardHtml(img, i)).join('')}</div>`;
    } else {
        if (st.slideIndex >= filtered.length) st.slideIndex = 0;
        const dots = filtered.length > 1 && filtered.length <= 12
            ? `<div class="cml-slide-dots">${filtered.map((_, i) => `<button class="cml-slide-dot ${i === st.slideIndex ? 'active' : ''}" onclick="cmlSlideGoTo('${cmlEscJs(category)}', ${i}, ${filtered.length})"></button>`).join('')}</div>`
            : '';
        content = `
        <div class="cml-slide">
            <button class="cml-slide-arrow cml-slide-prev" onclick="cmlSlideNav('${cmlEscJs(category)}', -1)" ${st.slideIndex === 0 ? 'disabled' : ''}><i data-lucide="chevron-left"></i></button>
            <div class="cml-slide-viewport" id="cml-slide-viewport-${slug}">
                <div class="cml-slide-track" id="cml-slide-track-${slug}">
                    ${filtered.map((img, i) => `<div class="cml-slide-item">${cmlCardHtml(img, i)}</div>`).join('')}
                </div>
            </div>
            <button class="cml-slide-arrow cml-slide-next" onclick="cmlSlideNav('${cmlEscJs(category)}', 1)" ${st.slideIndex === filtered.length - 1 ? 'disabled' : ''}><i data-lucide="chevron-right"></i></button>
        </div>
        <div class="cml-slide-counter" id="cml-slide-counter-${slug}">${st.slideIndex + 1} / ${filtered.length}</div>
        ${dots}`;
    }

    bodyEl.innerHTML = `
    <div class="cml-filter-row">
        <div class="cml-filter-chips">${chips}</div>
        ${viewToggle}
    </div>
    ${content}`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    if (st.view === 'slide' && filtered.length) cmlSetupSlideDrag(category, filtered.length);
    // Content just changed under a section that might already be open (filter/pick/add/remove) —
    // resync its measured height so it doesn't clip new content or leave stale empty space.
    if (st.open) {
        const section = document.getElementById('cml-section-' + slug);
        if (section) cmlSyncAccordionHeight(section, true);
    }
}

function cmlCardHtml(img, index) {
    const selected = cmlinkGalleryState.selectedForDownload.has(img.id);
    const delay = Math.min(index || 0, 10) * 35;
    return `
    <div class="cml-card cml-glass ${selected ? 'selected-for-download' : ''}" style="animation-delay: ${delay}ms;">
        <div class="cml-card-img-wrap" onclick="cmlOpenLightbox(${img.id})">
            <button type="button" class="cml-select-checkbox ${selected ? 'selected' : ''}" title="Select for download" onclick="cmlToggleSelectForDownload(${img.id}, '${cmlEscJs(img.category)}', event)"><i data-lucide="check"></i></button>
            <img src="${img.image_url}" alt="" loading="lazy">
        </div>
        <div class="cml-card-body">
            <div class="cml-card-meta">${cmlEscHtml(img.category)} · ${cmlEscHtml(img.shot_type)}</div>
            <div class="cml-card-note">${cmlEscHtml(img.label || '')}</div>
            <div class="cml-card-actions">
                <button class="cml-remove-btn cml-remove-btn-full" title="Remove" onclick="cmlRequestRemove(${img.id}, '${cmlEscJs(img.category)}')"><i data-lucide="trash-2"></i> Remove</button>
            </div>
        </div>
    </div>`;
}

function cmlSetFilter(category, filter) {
    const st = cmlinkGalleryState.category[category];
    st.filter = filter;
    st.slideIndex = 0;
    renderCategoryBody(category);
}
function cmlSetView(category, view) {
    cmlinkGalleryState.category[category].view = view;
    renderCategoryBody(category);
}
function cmlSlideNav(category, dir) {
    const st = cmlinkGalleryState.category[category];
    const allImages = cmlinkGalleryState.images.filter(img => img.category === category);
    const filtered = st.filter === 'All' ? allImages : allImages.filter(img => img.shot_type === st.filter);
    if (!filtered.length) return;
    cmlSlideGoTo(category, st.slideIndex + dir, filtered.length);
}

// Coverflow-style carousel: every slide is always in the DOM and visible, positioned by one
// translateX on the track. "Focus" (full opacity/sharp/full size vs. dimmed/blurred/shrunk) is a
// continuous function of each item's distance from the current (possibly fractional, mid-drag)
// index — not a discrete class swap — so it reads as one smooth gradient sliding past, in both a
// button/dot nav (eased) and a live drag (1:1 with the pointer, no easing lag).

function cmlSlideMeasure(viewport) {
    const track = viewport.querySelector('.cml-slide-track');
    const items = track ? Array.from(track.children) : [];
    if (!items.length) return null;
    const itemWidth = items[0].getBoundingClientRect().width;
    const step = items.length > 1 ? (items[1].offsetLeft - items[0].offsetLeft) : itemWidth;
    return { track, items, itemWidth, step, viewportWidth: viewport.clientWidth };
}

function cmlApplySlideFocus(items, continuousIndex) {
    items.forEach((item, i) => {
        const d = Math.abs(i - continuousIndex);
        const opacity = Math.max(0.25, 1 - d * 0.55);
        const blur = Math.min(6, d * 3.2);
        const scale = Math.max(0.85, 1 - d * 0.1);
        item.style.opacity = opacity.toFixed(2);
        item.style.filter = blur > 0.05 ? `blur(${blur.toFixed(1)}px)` : 'none';
        item.style.transform = `scale(${scale.toFixed(3)})`;
    });
}

function cmlPositionSlideTrack(viewport, continuousIndex, animate) {
    const m = cmlSlideMeasure(viewport);
    if (!m) return;
    const offset = -(continuousIndex * m.step) + (m.viewportWidth - m.itemWidth) / 2;
    m.track.style.transition = animate ? 'transform 0.5s var(--cml-ease)' : 'none';
    m.items.forEach(item => {
        item.style.transition = animate
            ? 'opacity 0.4s var(--cml-ease), filter 0.4s var(--cml-ease), transform 0.4s var(--cml-ease)'
            : 'none';
    });
    m.track.style.transform = `translateX(${offset}px)`;
    cmlApplySlideFocus(m.items, continuousIndex);
}

// Moves the carousel to a given index with a smooth animated transform + refocus — no re-render,
// no image reload, just the track sliding and the focus gradient easing to its new center.
// Clamped, not wrapped — the first/last image is a real end, not an infinite loop.
function cmlSlideGoTo(category, newIndex, count) {
    const st = cmlinkGalleryState.category[category];
    st.slideIndex = Math.max(0, Math.min(count - 1, newIndex));
    const slug = cmlSlug(category);
    const viewport = document.getElementById('cml-slide-viewport-' + slug);
    if (viewport) cmlPositionSlideTrack(viewport, st.slideIndex, true);
    const counterEl = document.getElementById('cml-slide-counter-' + slug);
    if (counterEl) counterEl.textContent = `${st.slideIndex + 1} / ${count}`;
    document.querySelectorAll(`#cml-body-${slug} .cml-slide-dot`).forEach((dot, i) => dot.classList.toggle('active', i === st.slideIndex));
    const prevBtn = document.querySelector(`#cml-body-${slug} .cml-slide-prev`);
    const nextBtn = document.querySelector(`#cml-body-${slug} .cml-slide-next`);
    if (prevBtn) prevBtn.disabled = st.slideIndex === 0;
    if (nextBtn) nextBtn.disabled = st.slideIndex === count - 1;
}

function cmlSetupSlideDrag(category, count) {
    const slug = cmlSlug(category);
    const viewport = document.getElementById('cml-slide-viewport-' + slug);
    const st = cmlinkGalleryState.category[category];
    if (!viewport) return;

    cmlPositionSlideTrack(viewport, st.slideIndex, false); // fresh render, no animation

    let dragging = false;
    let startX = 0;
    let deltaX = 0;

    const pointX = (e) => (e.touches ? e.touches[0].clientX : e.clientX);

    function onDown(e) {
        if (count < 2) return;
        dragging = true;
        deltaX = 0;
        startX = pointX(e);
    }
    function onMove(e) {
        if (!dragging) return;
        deltaX = pointX(e) - startX;
        const m = cmlSlideMeasure(viewport);
        if (!m) return;
        const continuousIndex = st.slideIndex - (deltaX / m.step);
        const offset = -(continuousIndex * m.step) + (m.viewportWidth - m.itemWidth) / 2;
        m.track.style.transition = 'none';
        m.items.forEach(item => { item.style.transition = 'none'; });
        m.track.style.transform = `translateX(${offset}px)`;
        cmlApplySlideFocus(m.items, continuousIndex); // live, 1:1 with the pointer — no easing lag
    }
    function onUp() {
        if (!dragging) return;
        dragging = false;
        const m = cmlSlideMeasure(viewport);
        const threshold = (m ? m.step : viewport.clientWidth) * 0.18;
        if (deltaX < -threshold) cmlSlideGoTo(category, st.slideIndex + 1, count);
        else if (deltaX > threshold) cmlSlideGoTo(category, st.slideIndex - 1, count);
        else cmlSlideGoTo(category, st.slideIndex, count); // snap back
        deltaX = 0;
    }

    viewport.addEventListener('pointerdown', onDown);
    viewport.addEventListener('pointermove', onMove);
    viewport.addEventListener('pointerup', onUp);
    viewport.addEventListener('pointerleave', onUp);
    viewport.addEventListener('pointercancel', onUp);

    // Trackpad / mouse-wheel horizontal scroll — only when the gesture is horizontal-dominant
    // (two-finger trackpad swipe, or shift+wheel), so a normal vertical scroll over the carousel
    // still scrolls the page instead of being hijacked.
    //
    // Tracks the whole gesture live (1:1 with every wheel tick — track + focus follow the raw
    // accumulated delta directly, exactly like the drag handler above), instead of "cross a
    // threshold once, then jump and lock". A threshold+lock approach can only ever produce one
    // discrete jump per gesture and blocks everything else until it decides the gesture is over —
    // that's what read as "stuck" on a slow or continuous scroll. Snapping to the nearest slide
    // only happens once wheel ticks actually stop (idle for ~130ms), so momentum/inertia tails
    // keep flowing smoothly instead of being cut off mid-motion.
    let wheelAccumPx = 0;
    let wheelIdleTimer = null;
    function onWheel(e) {
        if (count < 2) return;
        if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
        e.preventDefault();

        wheelAccumPx += e.deltaX;
        const m = cmlSlideMeasure(viewport);
        if (!m) return;
        const continuousIndex = st.slideIndex + wheelAccumPx / m.step;
        const offset = -(continuousIndex * m.step) + (m.viewportWidth - m.itemWidth) / 2;
        m.track.style.transition = 'none';
        m.items.forEach(item => { item.style.transition = 'none'; });
        m.track.style.transform = `translateX(${offset}px)`;
        cmlApplySlideFocus(m.items, continuousIndex);

        clearTimeout(wheelIdleTimer);
        wheelIdleTimer = setTimeout(() => {
            const nearest = Math.round(continuousIndex);
            wheelAccumPx = 0;
            cmlSlideGoTo(category, nearest, count);
        }, 130);
    }
    viewport.addEventListener('wheel', onWheel, { passive: false });
}

// Item widths/steps are measured in px at render/drag time — resync (no transition) on resize so
// a window resize doesn't leave the carousel visibly offset or mis-focused.
function cmlSyncAllSlideTracks() {
    Object.keys(cmlinkGalleryState.category).forEach(category => {
        const st = cmlinkGalleryState.category[category];
        if (st.view !== 'slide') return;
        const slug = cmlSlug(category);
        const viewport = document.getElementById('cml-slide-viewport-' + slug);
        if (viewport) cmlPositionSlideTrack(viewport, st.slideIndex, false);
    });
}

// ---- Remove (admin PIN required) ----
function cmlRequestRemove(imageId, category) {
    cmlinkGalleryState.confirmRemove = { imageId, category };
    renderConfirmDialog();
}
function cmlCancelRemove() {
    cmlinkGalleryState.confirmRemove = null;
    const el = document.getElementById('cmlConfirmOverlay');
    if (el) el.remove();
}
// Same admin PIN gate the rest of the platform already uses (hasAdminAccess() / the "3030300" /
// "1234" PIN checked in app.js's unlockAdmin flow) — reused here rather than inventing a separate
// password just for this delete, so it's one PIN the team already knows, not two to remember.
function cmlHasAdminAccess() {
    return typeof hasAdminAccess === 'function' ? hasAdminAccess() : false;
}
function cmlCheckPin(pin) {
    return pin === '3030300' || pin === '1234';
}

function renderConfirmDialog() {
    let el = document.getElementById('cmlConfirmOverlay');
    if (!el) {
        el = document.createElement('div');
        el.id = 'cmlConfirmOverlay';
        el.className = 'cml-lightbox-overlay';
        document.body.appendChild(el);
    }
    el.onclick = (e) => { if (e.target === el) cmlCancelRemove(); };
    const needsPin = !cmlHasAdminAccess();
    el.innerHTML = `
    <div class="cml-confirm-box" id="cmlConfirmBox">
        <h4>Remove this image?</h4>
        <p>This deletes it from the gallery for everyone. This can't be undone.</p>
        ${needsPin ? `
        <div class="cml-field" style="text-align:left; margin-bottom:14px;">
            <label>Admin PIN required</label>
            <input type="password" inputmode="numeric" id="cmlDeletePinInput" placeholder="Enter PIN" autocomplete="off"
                onkeydown="if(event.key==='Enter'){event.preventDefault(); cmlConfirmRemove();}">
            <div id="cmlDeletePinError" style="color:var(--cml-danger); font-size:11.5px; margin-top:5px; display:none;">Incorrect PIN</div>
        </div>` : ''}
        <div class="cml-confirm-actions">
            <button class="cml-confirm-cancel" onclick="cmlCancelRemove()">Cancel</button>
            <button class="cml-confirm-delete" onclick="cmlConfirmRemove()">Remove</button>
        </div>
    </div>`;
    const pinInput = document.getElementById('cmlDeletePinInput');
    if (pinInput) pinInput.focus();
}
async function cmlConfirmRemove() {
    const pending = cmlinkGalleryState.confirmRemove;
    if (!pending) return;
    const { imageId, category } = pending;

    if (!cmlHasAdminAccess()) {
        const pinInput = document.getElementById('cmlDeletePinInput');
        const pin = pinInput ? pinInput.value.trim() : '';
        if (!cmlCheckPin(pin)) {
            const errEl = document.getElementById('cmlDeletePinError');
            if (errEl) errEl.style.display = 'block';
            const box = document.getElementById('cmlConfirmBox');
            if (box) {
                box.classList.remove('cml-shake');
                void box.offsetWidth;
                box.classList.add('cml-shake');
            }
            if (pinInput) { pinInput.value = ''; pinInput.focus(); }
            return; // don't proceed — wrong or missing PIN
        }
    }

    try {
        const { error } = await supabaseClient.from('cmlink_gallery_images').delete().eq('id', imageId);
        if (error) throw error;
        cmlinkGalleryState.images = cmlinkGalleryState.images.filter(i => i.id !== imageId);
        cmlinkGalleryState.selectedForDownload.delete(imageId);
        cmlToast('Image removed');
        // Note: the file itself stays on Cloudinary (unsigned uploads can't be auto-deleted without
        // a server-side API secret — see migration 20260915000002). Harmless against the 25GB free
        // tier for a small team tool; cloudinary_public_id is kept on the row history for now in
        // case a server-side cleanup script is ever written.
    } catch (e) {
        console.error('CMLink gallery: remove failed', e);
        cmlToast('Failed to remove image', 'error');
    }
    cmlinkGalleryState.confirmRemove = null;
    const el = document.getElementById('cmlConfirmOverlay');
    if (el) el.remove();
    renderCategoryBody(category);
    renderSelectionBar();
    cmlUpdateUsageBadge();
    if (cmlinkGalleryState.lightbox && cmlinkGalleryState.lightbox.id === imageId) closeCmlLightbox();
}

// ---- Lightbox ----
function cmlOpenLightbox(imageId) {
    const img = cmlinkGalleryState.images.find(i => i.id === imageId);
    if (!img) return;
    cmlinkGalleryState.lightbox = img;
    renderLightbox();
}
function closeCmlLightbox() {
    cmlinkGalleryState.lightbox = null;
    const el = document.getElementById('cmlLightboxOverlay');
    if (el) el.remove();
}
function renderLightbox() {
    let el = document.getElementById('cmlLightboxOverlay');
    if (!el) {
        el = document.createElement('div');
        el.id = 'cmlLightboxOverlay';
        el.className = 'cml-lightbox-overlay';
        document.body.appendChild(el);
    }
    el.onclick = (e) => { if (e.target === el) closeCmlLightbox(); };
    const img = cmlinkGalleryState.lightbox;
    el.innerHTML = `
    <div class="cml-lightbox-box" style="position:relative;">
        <button class="cml-lightbox-close" onclick="closeCmlLightbox()"><i data-lucide="x"></i></button>
        <img src="${img.image_url}" alt="">
        <div class="cml-lightbox-footer">
            <div class="cml-card-meta">${cmlEscHtml(img.category)} · ${cmlEscHtml(img.shot_type)}${img.label ? ` — ${cmlEscHtml(img.label)}` : ''}</div>
            <button class="cml-remove-btn" title="Remove" onclick="cmlRequestRemove(${img.id}, '${cmlEscJs(img.category)}')"><i data-lucide="trash-2"></i></button>
        </div>
    </div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ============================================================================
// Bulk selection + download (replaces "Build a shot" — team found it fiddly; a plain multi-select
// + one .zip download covers the actual need, no picking a reference/shot-type dance required)
// ============================================================================
function cmlToggleSelectForDownload(imageId, category, event) {
    if (event) event.stopPropagation(); // don't also open the lightbox
    if (cmlinkGalleryState.selectedForDownload.has(imageId)) cmlinkGalleryState.selectedForDownload.delete(imageId);
    else cmlinkGalleryState.selectedForDownload.add(imageId);
    renderCategoryBody(category);
    renderSelectionBar();
}

function cmlClearSelection() {
    cmlinkGalleryState.selectedForDownload.clear();
    Object.keys(cmlinkGalleryState.category).forEach(renderCategoryBody);
    renderSelectionBar();
}

function renderSelectionBar() {
    const el = document.getElementById('cmlSelectionBarArea');
    if (!el) return;
    const count = cmlinkGalleryState.selectedForDownload.size;
    if (!count) { el.innerHTML = ''; return; }
    el.innerHTML = `
    <div class="cml-selection-bar cml-glass">
        <span>${count} image${count === 1 ? '' : 's'} selected</span>
        <div class="cml-selection-bar-actions">
            <button class="cml-toggle-btn" onclick="cmlClearSelection()">Clear</button>
            <button class="cml-submit-btn" id="cmlDownloadSelectedBtn" onclick="cmlDownloadSelected()"><i data-lucide="download"></i> Download ${count}</button>
        </div>
    </div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function cmlDownloadSelected() {
    const ids = Array.from(cmlinkGalleryState.selectedForDownload);
    if (!ids.length) return;
    if (typeof JSZip === 'undefined') { cmlToast('Zip library failed to load — try refreshing the page', 'error'); return; }

    const btn = document.getElementById('cmlDownloadSelectedBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = 'Preparing…'; }
    try {
        const images = ids.map(id => cmlinkGalleryState.images.find(i => i.id === id)).filter(Boolean);
        const zip = new JSZip();
        let failed = 0;
        await Promise.all(images.map(async (img) => {
            try {
                const res = await fetch(img.image_url);
                if (!res.ok) throw new Error('fetch failed');
                const blob = await res.blob();
                const ext = (img.image_url.match(/\.(jpg|jpeg|png|webp)(\?|$)/i) || [null, 'jpg'])[1];
                const name = `${img.category}-${img.shot_type}-${img.id}`.replace(/\s+/g, '-').toLowerCase() + '.' + ext;
                zip.file(name, blob);
            } catch (e) {
                failed++;
            }
        }));
        if (!Object.keys(zip.files).length) throw new Error('All downloads failed');

        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cmlink-gallery-${new Date().toISOString().slice(0, 10)}.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        cmlToast(failed ? `Downloaded ${images.length - failed} of ${images.length} (${failed} failed)` : `Downloaded ${images.length} image${images.length === 1 ? '' : 's'}`);
    } catch (e) {
        console.error('CMLink gallery: bulk download failed', e);
        cmlToast('Download failed — try again', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i data-lucide="download"></i> Download ${cmlinkGalleryState.selectedForDownload.size}`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }
}

// ============================================================================
// Prompts tab
// ============================================================================
function renderPromptsTab() {
    const container = document.getElementById('cmlPromptsArea');
    if (!container) return;
    const categories = ['Female', 'Male', 'Group of Friends'];
    container.innerHTML = categories.map(cat => {
        const slug = cmlSlug(cat);
        const open = cmlinkGalleryState.promptsAccordion[cat];
        const steps = CMLINK_SHOT_TYPES.map((shotType, idx) => {
            const entry = CMLINK_PROMPTS[cat][shotType];
            const key = `${slug}__${cmlSlug(shotType)}`;
            const desc = CMLINK_SHOT_TYPE_DESCRIPTIONS[shotType] || '';
            return `
            <div class="cml-prompt-step">
                <div class="cml-prompt-step-num">${idx + 1}</div>
                <div class="cml-prompt-step-body">
                    <div class="cml-prompt-step-title">${cmlEscHtml(entry.title)}</div>
                    <p class="cml-prompt-step-desc">${cmlEscHtml(desc)}${entry.note ? ' — ' + cmlEscHtml(entry.note) : ''}</p>
                    <div class="cml-prompt-card">
                        <div class="cml-prompt-card-head">
                            <strong>${cmlEscHtml(shotType)}</strong>
                            <div class="cml-prompt-card-actions">
                                <button class="cml-toggle-btn" id="cml-toggle-${key}" onclick="cmlTogglePromptVisible('${key}')">Show</button>
                                <button class="cml-copy-btn" onclick="cmlCopyText(document.getElementById('cml-textarea-${key}').value, this)">Copy</button>
                            </div>
                        </div>
                        <textarea readonly hidden id="cml-textarea-${key}">${cmlEscHtml(entry.prompt)}</textarea>
                    </div>
                </div>
            </div>`;
        }).join('');
        return `
        <div class="cml-accordion-section cml-glass ${open ? 'open' : ''}" id="cml-prompt-section-${slug}">
            <div class="cml-accordion-header" onclick="cmlTogglePromptAccordion('${cmlEscJs(cat)}')">
                <div class="cml-accordion-header-left"><h3>${cmlEscHtml(cat)}</h3></div>
                <i data-lucide="chevron-down" class="cml-chevron"></i>
            </div>
            <div class="cml-accordion-body"><div class="cml-accordion-body-inner">${steps}</div></div>
        </div>`;
    }).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function cmlTogglePromptAccordion(cat) {
    cmlinkGalleryState.promptsAccordion[cat] = !cmlinkGalleryState.promptsAccordion[cat];
    const section = document.getElementById('cml-prompt-section-' + cmlSlug(cat));
    if (!section) return;
    const open = cmlinkGalleryState.promptsAccordion[cat];
    section.classList.toggle('open', open);
    cmlSyncAccordionHeight(section, open);
}

function cmlTogglePromptVisible(key) {
    const ta = document.getElementById('cml-textarea-' + key);
    const btn = document.getElementById('cml-toggle-' + key);
    if (!ta) return;
    ta.hidden = !ta.hidden;
    if (btn) btn.textContent = ta.hidden ? 'Show' : 'Hide';
    if (!ta.hidden) {
        ta.classList.remove('cml-fade-in');
        void ta.offsetWidth;
        ta.classList.add('cml-fade-in');
    }
    // Revealing/hiding a prompt textarea changes the height of content inside an already-open
    // accordion section — resync that section's measured max-height so it doesn't clip the reveal.
    const section = ta.closest('.cml-accordion-section');
    if (section && section.classList.contains('open')) cmlSyncAccordionHeight(section, true);
}

// ============================================================================
// Imgur upload
// ============================================================================
function cmlResizeImage(file, maxDim, quality) {
    maxDim = maxDim || 1800;
    quality = quality || 0.85;
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = () => {
            img.onload = () => {
                let { width, height } = img;
                if (width > maxDim || height > maxDim) {
                    if (width > height) { height = Math.round(height * (maxDim / width)); width = maxDim; }
                    else { width = Math.round(width * (maxDim / height)); height = maxDim; }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Failed to compress image')), 'image/jpeg', quality);
            };
            img.onerror = reject;
            img.src = reader.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function cmlUploadToCloudinary(file) {
    if (!CML_CLOUDINARY_CLOUD_NAME || !CML_CLOUDINARY_UPLOAD_PRESET) {
        throw new Error('Cloudinary is not configured yet — set CML_CLOUDINARY_CLOUD_NAME / CML_CLOUDINARY_UPLOAD_PRESET at the top of cmlink-gallery.js');
    }
    const blob = await cmlResizeImage(file, 1800, 0.85);
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', CML_CLOUDINARY_UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CML_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json || !json.secure_url) {
        const msg = (json && json.error && json.error.message) || 'Cloudinary upload failed';
        throw new Error(msg);
    }
    return { url: json.secure_url, publicId: json.public_id };
}
