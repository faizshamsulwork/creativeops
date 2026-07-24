(function() {
    const ACTIVE_KEY = 'adtech_quote_builder_active_v1';
    const DRAFTS_KEY = 'adtech_quote_builder_drafts_v1';
    const MAX_DRAFTS = 20;

    let quote = null;
    let expandedItems = new Set();
    let expandedSections = new Set(['review-services', 'suggestions']);
    let showDraftTools = false;
    let activeQuoteMode = 'build';
    let quoteCopyUnlocked = false;
    let quoteSearchTerm = '';
    let showMoreSuggestions = false;
    let quoteDialogFocus = null;

    const THIRD_PARTY_PRESETS = [
        'Talent', 'Voice-Over Talent', 'Studio', 'Venue', 'Transport',
        'Accommodation', 'Equipment', 'Permit', 'Stock Assets', 'Premium Music',
        'Printing', 'Media Spending', 'Media Handling', 'Freelancer / Specialist', 'Other'
    ];

    const OUTPUT_TERMS = [
        'All rates are starting rates and subject to confirmed scope.',
        'Two minor revision rounds are included unless otherwise stated.',
        'Major changes after approval may be quoted separately.',
        'Rush requests may incur an additional fee.',
        'Talent, travel, permits, media spending and third-party costs are excluded unless listed.',
        'Editable working files are excluded unless listed.',
        'SST is excluded where applicable.',
        'Quotation validity may be confirmed separately.'
    ];

    function nowDate() {
        return new Date().toISOString().slice(0, 10);
    }

    function newQuoteState() {
        const year = new Date().getFullYear();
        return {
            id: uid('quote'),
            draftName: 'Untitled Estimate',
            savedAt: '',
            info: {
                client: '',
                project: '',
                preparedBy: '',
                reference: `ADTI-${year}-001`,
                date: nowDate(),
                currency: 'MYR'
            },
            items: [],
            thirdParty: [],
            dismissedSuggestions: [],
            discountMode: 'global',
            volumeDiscount: 'none',
            customVolumeDiscount: 0,
            sstMode: 'not-applicable',
            sstPercent: 0,
            checks: {},
            outputSettings: {
                unitRates: true,
                lineTotals: true,
                discount: true,
                thirdParty: true,
                terms: true,
                clientNotes: true
            },
            terms: OUTPUT_TERMS.map((term, index) => ({ id: `term-${index + 1}`, text: term, enabled: true }))
        };
    }

    function uid(prefix = 'id') {
        return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function qbEscape(value) {
        if (typeof escapeHtml === 'function') return escapeHtml(value);
        return String(value || '').replace(/[&<>"']/g, char => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[char]));
    }

    function num(value, fallback = 0) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function cents(value) {
        return Math.round(num(value) * 100);
    }

    function fromCents(value) {
        return Math.round(num(value)) / 100;
    }

    function money(value) {
        const amount = num(value);
        const hasDecimal = !Number.isInteger(amount);
        return new Intl.NumberFormat('en-MY', {
            style: 'currency',
            currency: 'MYR',
            minimumFractionDigits: hasDecimal ? 2 : 0,
            maximumFractionDigits: hasDecimal ? 2 : 0
        }).format(amount).replace('MYR', 'RM');
    }

    function findService(serviceId) {
        if (typeof findRateCardItem === 'function') return findRateCardItem(serviceId);
        const categories = Array.isArray(window.RATE_CARD_CATEGORIES) ? window.RATE_CARD_CATEGORIES : [];
        for (const category of categories) {
            const item = (category.items || []).find(row => row.id === serviceId);
            if (item) return { ...item, categoryId: category.id, categoryTitle: category.title };
        }
        return null;
    }

    function loadQuote() {
        if (quote) return quote;
        try {
            const saved = JSON.parse(localStorage.getItem(ACTIVE_KEY) || 'null');
            quote = normaliseQuote(saved || newQuoteState());
        } catch(e) {
            quote = newQuoteState();
        }
        return quote;
    }

    function normaliseQuote(input) {
        const base = newQuoteState();
        const next = { ...base, ...(input || {}) };
        next.info = { ...base.info, ...(input?.info || {}) };
        next.outputSettings = { ...base.outputSettings, ...(input?.outputSettings || {}) };
        next.items = Array.isArray(input?.items) ? input.items.map(normaliseItem) : [];
        next.thirdParty = Array.isArray(input?.thirdParty) ? input.thirdParty.map(normaliseThirdParty) : [];
        next.dismissedSuggestions = Array.isArray(input?.dismissedSuggestions) ? input.dismissedSuggestions : [];
        next.terms = Array.isArray(input?.terms) && input.terms.length ? input.terms : base.terms;
        next.checks = input?.checks || {};
        return next;
    }

    function normaliseItem(item) {
        return {
            id: item.id || uid('line'),
            serviceId: item.serviceId || '',
            serviceName: item.serviceName || 'Custom Item',
            category: item.category || 'Custom',
            description: item.description || '',
            billingBasis: item.billingBasis || '',
            quantity: Math.max(0, num(item.quantity, 1)),
            unitRate: Math.max(0, num(item.unitRate, 0)),
            minimumRecommendedRate: Math.max(0, num(item.minimumRecommendedRate, 0)),
            discountPercentage: Math.max(0, num(item.discountPercentage, 0)),
            isDiscountEligible: item.isDiscountEligible !== false,
            costType: item.costType || 'creative',
            internalNote: item.internalNote || '',
            clientNote: item.clientNote || item.scopeNote || item.billingBasis || '',
            scopeNote: item.scopeNote || '',
            expanded: !!item.expanded
        };
    }

    function normaliseThirdParty(item) {
        return {
            id: item.id || uid('third'),
            description: item.description || 'Third-party cost',
            quantity: Math.max(0, num(item.quantity, 1)),
            unitCost: Math.max(0, num(item.unitCost, 0)),
            markupPercentage: Math.max(0, num(item.markupPercentage, 0)),
            useMarkup: item.useMarkup !== false,
            internalNote: item.internalNote || ''
        };
    }

    function saveActiveQuote() {
        if (!quote) return;
        quote.savedAt = new Date().toISOString();
        localStorage.setItem(ACTIVE_KEY, JSON.stringify(quote));
        renderQuoteIndicator();
    }

    function updateQuote(mutator, rerender = true) {
        loadQuote();
        mutator(quote);
        saveActiveQuote();
        if (rerender) renderQuoteBuilderPage();
    }

    function serviceToQuoteItem(service, options = {}) {
        return normaliseItem({
            id: uid('line'),
            serviceId: service.id,
            serviceName: service.service,
            category: service.category,
            description: service.description,
            billingBasis: service.billingBasis,
            quantity: options.quantity || 1,
            unitRate: service.priceFrom,
            minimumRecommendedRate: service.priceFrom,
            discountPercentage: 0,
            isDiscountEligible: true,
            costType: 'creative',
            internalNote: '',
            clientNote: service.billingBasis || service.scopeNote || '',
            scopeNote: service.scopeNote || ''
        });
    }

    function getQuoteServiceQuantity(serviceId) {
        loadQuote();
        return quote.items
            .filter(item => item.serviceId === serviceId)
            .reduce((sum, item) => sum + num(item.quantity), 0);
    }

    function addServiceToQuote(serviceId, options = {}) {
        const service = findService(serviceId);
        if (!service) return;
        loadQuote();
        const existing = quote.items.find(item => item.serviceId === serviceId);
        if (existing && !options.mode) {
            openDuplicateServiceDialog(serviceId);
            return;
        }
        if (existing && options.mode === 'increase') {
            existing.quantity = Math.max(0, num(existing.quantity, 1)) + 1;
            saveActiveQuote();
            renderQuoteBuilderPage();
            renderRateCardIfActive();
            showQuoteToast('Quantity updated', true);
            return;
        }
        quote.items.unshift(serviceToQuoteItem(service, options));
        saveActiveQuote();
        renderQuoteBuilderPage();
        renderRateCardIfActive();
        showQuoteToast('Added to Quote', true);
    }

    function removeServiceFromQuote(serviceId) {
        updateQuote(state => {
            state.items = state.items.filter(item => item.serviceId !== serviceId);
        });
        renderRateCardIfActive();
        showQuoteToast('Service removed from quote.');
    }

    function setQuoteMode(mode) {
        loadQuote();
        if (mode !== 'build' && !quote.items.length) {
            activeQuoteMode = 'build';
            renderQuoteBuilderPage();
            return;
        }
        if (mode === 'review') quoteCopyUnlocked = true;
        if (mode === 'copy' && !quoteCopyUnlocked) quoteCopyUnlocked = true;
        activeQuoteMode = ['build', 'review', 'copy'].includes(mode) ? mode : 'build';
        showDraftTools = false;
        renderQuoteBuilderPage();
        document.getElementById('quoteBuilderRoot')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function updateQuoteSearch(value) {
        quoteSearchTerm = value || '';
        renderQuoteBuilderPage();
        setTimeout(() => {
            const input = document.querySelector('.quote-service-search input');
            if (!input) return;
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
        }, 0);
    }

    function adjustQuoteItemQuantity(itemId, delta) {
        updateQuote(state => {
            const item = state.items.find(row => row.id === itemId);
            if (!item) return;
            item.quantity = Math.max(0, num(item.quantity, 0) + delta);
        });
    }

    function toggleMoreQuoteSuggestions() {
        showMoreSuggestions = !showMoreSuggestions;
        renderQuoteBuilderPage();
    }

    function openQuoteServiceMenu(serviceId) {
        const service = findService(serviceId);
        if (!service) return;
        openQuoteDialog(`
            <div class="quote-mini-dialog">
                <span>Already Added</span>
                <h3>${qbEscape(service.service)}</h3>
                <p>This service is already in the active quote.</p>
                <div class="quote-dialog-actions">
                    <button type="button" onclick="addServiceToQuote('${qbEscape(serviceId)}', { mode: 'increase' }); closeQuoteDialog();">Increase Quantity</button>
                    <button type="button" onclick="showPage('quote-builder'); closeQuoteDialog();">Open Quote Builder</button>
                    <button type="button" class="danger" onclick="removeServiceFromQuote('${qbEscape(serviceId)}'); closeQuoteDialog();">Remove</button>
                </div>
            </div>
        `);
    }

    function openDuplicateServiceDialog(serviceId) {
        const service = findService(serviceId);
        if (!service) return;
        openQuoteDialog(`
            <div class="quote-mini-dialog">
                <span>Duplicate Service</span>
                <h3>${qbEscape(service.service)}</h3>
                <p>This service is already in the quote. Use a separate line when the scope, language or rate differs.</p>
                <div class="quote-dialog-actions">
                    <button type="button" onclick="addServiceToQuote('${qbEscape(serviceId)}', { mode: 'increase' }); closeQuoteDialog();">Increase Quantity</button>
                    <button type="button" onclick="addServiceToQuote('${qbEscape(serviceId)}', { mode: 'separate' }); closeQuoteDialog();">Add Separate Line</button>
                    <button type="button" class="quiet" onclick="closeQuoteDialog()">Cancel</button>
                </div>
            </div>
        `);
    }

    function renderQuoteBuilderPage() {
        loadQuote();
        const root = document.getElementById('quoteBuilderRoot');
        if (!root) return;
        if (!quote.items.length && activeQuoteMode !== 'build') activeQuoteMode = 'build';
        const totals = calculateQuoteTotals();
        root.innerHTML = `
            <div class="quote-page quote-mode-${activeQuoteMode}">
                ${renderQuoteHeader(totals)}
                ${showDraftTools ? renderQuoteDraftTools() : ''}
                <div class="quote-layout">
                    <main class="quote-main quote-workspace">
                        ${activeQuoteMode === 'build' ? renderQuoteBuildMode(totals) : ''}
                        ${activeQuoteMode === 'review' ? renderQuoteReviewMode(totals) : ''}
                        ${activeQuoteMode === 'copy' ? renderQuoteCopyMode(totals) : ''}
                    </main>
                    ${renderQuoteSummary(totals)}
                </div>
                ${renderQuoteMobileBar(totals)}
            </div>
            <div id="quoteBuilderDialog" class="quote-dialog-overlay" aria-hidden="true"></div>
            <div id="quoteBuilderToast" class="quote-toast" aria-live="polite"></div>
        `;
        refreshIcons?.();
        renderQuoteIndicator();
    }

    function renderQuoteHeader(totals) {
        return `
            <div class="quote-hero simplified">
                <div>
                    <div class="quote-title-row">
                        <h1>Quote Builder</h1>
                        <button type="button" class="quote-title-info" onclick="openQuoteInfoNote(this, event)" aria-label="Quote Builder guidance"><i data-lucide="info"></i></button>
                    </div>
                    <p>Build an estimated client quotation using Adtechinno rates.</p>
                    <div class="quote-save-status"><span></span>Saved automatically</div>
                </div>
                <div class="quote-hero-actions">
                    <span class="quote-badge subtle"><i data-lucide="lock-keyhole"></i> Internal Estimate</span>
                    <button type="button" onclick="confirmNewQuote()" class="quote-secondary-btn"><i data-lucide="file-plus-2"></i> New Quote</button>
                    <button type="button" onclick="toggleQuoteDraftTools()" class="quote-icon-btn" aria-label="More quote options" aria-expanded="${showDraftTools}"><i data-lucide="more-horizontal"></i></button>
                </div>
            </div>
            ${renderQuoteStepNav()}
        `;
    }

    function renderQuoteStepNav() {
        const hasItems = quote.items.length > 0;
        const steps = [
            ['build', 'Build', true],
            ['review', 'Review', hasItems],
            ['copy', 'Copy', hasItems && quoteCopyUnlocked]
        ];
        return `
            <div class="quote-step-nav" aria-label="Quote workflow">
                ${steps.map(([mode, label, enabled]) => `
                    <button type="button" class="${activeQuoteMode === mode ? 'active' : ''}" onclick="setQuoteMode('${mode}')" ${enabled ? '' : 'disabled'}>${label}</button>
                `).join('')}
            </div>
        `;
    }

    function renderQuoteDraftTools() {
        const drafts = getQuoteDrafts();
        return `
            <section class="quote-more-menu" aria-label="Quote options">
                <div class="quote-more-grid">
                    <label>Draft name<input type="text" value="${qbEscape(quote.draftName)}" oninput="updateQuoteDraftName(this.value)"></label>
                    <button type="button" onclick="saveQuoteDraft()"><i data-lucide="save"></i> Save Draft</button>
                    <button type="button" onclick="duplicateQuoteDraft()"><i data-lucide="copy"></i> Duplicate</button>
                    <button type="button" onclick="downloadQuoteCsv()" ${quote.items.length ? '' : 'disabled'}><i data-lucide="download"></i> Download CSV</button>
                    <button type="button" onclick="window.print()" ${quote.items.length ? '' : 'disabled'}><i data-lucide="printer"></i> Print View</button>
                    <button type="button" class="danger" onclick="confirmDeleteActiveDraft()"><i data-lucide="trash-2"></i> Delete Draft</button>
                </div>
                ${drafts.length ? `<div class="quote-draft-list">${drafts.slice(0, 6).map(draft => `<button type="button" onclick="loadQuoteDraft('${draft.id}')"><strong>${qbEscape(draft.draftName || 'Untitled Estimate')}</strong><span>${qbEscape(draft.info?.reference || '')}</span></button>`).join('')}</div>` : ''}
            </section>
        `;
    }

    function renderQuoteBuildMode(totals) {
        return `
            ${renderQuoteServiceSearch()}
            ${quote.items.length ? renderQuoteLineItems('build') : renderQuoteEmptyState(totals)}
        `;
    }

    function renderQuoteReviewMode(totals) {
        return `
            ${renderReviewServicesSection()}
            ${renderSuggestedAddOns()}
            ${renderClientDetailsSection()}
            ${renderAdditionalCostsSection()}
            ${renderDiscountSection(totals)}
            ${renderQuoteCheckSection()}
            ${renderCommercialSettingsSection()}
            ${renderReviewTotalSection(totals)}
        `;
    }

    function renderQuoteCopyMode(totals) {
        return `
            <section class="quote-section quote-copy-stage">
                <div class="quote-section-head">
                    <div>
                        <h2>Ready to Copy</h2>
                        <p>Review how this will appear before copying it into a deck, document or email.</p>
                    </div>
                </div>
                ${renderClientPreview(totals)}
                <div class="quote-copy-actions">
                    <button type="button" class="primary" onclick="copyQuoteOutput('table')"><i data-lucide="table"></i> Copy as Table</button>
                    <button type="button" class="primary" onclick="copyQuoteOutput('proposal')"><i data-lucide="file-text"></i> Copy as Proposal Text</button>
                    <button type="button" onclick="toggleQuoteSection('copy-more')"><i data-lucide="more-horizontal"></i> More</button>
                </div>
                ${expandedSections.has('copy-more') ? `
                    <div class="quote-copy-more">
                        <button type="button" onclick="copyQuoteOutput('internal')"><i data-lucide="lock-keyhole"></i> Copy Internal Summary</button>
                        <button type="button" onclick="downloadQuoteCsv()"><i data-lucide="download"></i> Download CSV</button>
                        <button type="button" onclick="window.print()"><i data-lucide="printer"></i> Print View</button>
                    </div>
                ` : ''}
            </section>
        `;
    }

    function renderQuoteServiceSearch() {
        const results = getQuoteSearchResults();
        const query = quoteSearchTerm.trim();
        return `
            <section class="quote-search-panel">
                <div class="quote-service-search">
                    <i data-lucide="search"></i>
                    <input type="search" value="${qbEscape(quoteSearchTerm)}" placeholder="Search or describe what the client needs" oninput="updateQuoteSearch(this.value)">
                    ${query ? `<button type="button" onclick="updateQuoteSearch('')" aria-label="Clear search"><i data-lucide="x"></i></button>` : ''}
                </div>
                <div class="quote-search-actions">
                    <button type="button" onclick="showPage('rate-card')"><i data-lucide="badge-dollar-sign"></i> Browse Rate Card</button>
                    <button type="button" onclick="showPage('rate-card'); setTimeout(() => openRateCardModal('choose'), 0)"><i data-lucide="route"></i> Help Me Choose</button>
                    <button type="button" onclick="openCustomQuoteItemDialog()"><i data-lucide="plus"></i> Add Custom Item</button>
                </div>
                ${query ? renderQuoteSearchResults(results) : ''}
            </section>
        `;
    }

    function renderQuoteSearchResults(results) {
        if (!results.length) {
            return `
                <div class="quote-search-empty">
                    <strong>No matching services found.</strong>
                    <span>Try another service name or describe the client request differently.</span>
                </div>
            `;
        }
        return `
            <div class="quote-search-results">
                ${results.map(service => `
                    <div class="quote-search-result">
                        <div>
                            <strong>${qbEscape(service.service)}</strong>
                            <span>${qbEscape(service.category)} · ${qbEscape(service.billingBasis)}</span>
                        </div>
                        <b>${money(service.priceFrom)}</b>
                        <button type="button" onclick="addServiceToQuote('${qbEscape(service.id)}')">${getQuoteServiceQuantity(service.id) ? 'Added' : 'Add'}</button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function getQuoteSearchResults() {
        const query = quoteSearchTerm.trim().toLowerCase();
        if (!query) return [];
        return getAllQuoteServices()
            .filter(service => getQuoteServiceSearchText(service).includes(query))
            .sort((a, b) => Number(a.priceFrom) - Number(b.priceFrom))
            .slice(0, 7);
    }

    function getAllQuoteServices() {
        if (typeof getRateCardItems === 'function') return getRateCardItems();
        const categories = Array.isArray(window.RATE_CARD_CATEGORIES) ? window.RATE_CARD_CATEGORIES : [];
        return categories.flatMap(category => (category.items || []).map(item => ({ ...item, categoryTitle: category.title, categoryId: category.id })));
    }

    function getQuoteServiceSearchText(service) {
        return [
            service.service,
            service.category,
            service.categoryTitle,
            service.description,
            service.example,
            service.billingBasis,
            service.scopeNote,
            ...(service.tags || [])
        ].join(' ').toLowerCase();
    }

    function renderQuoteEmptyState(totals) {
        return `
            <section class="quote-empty-state compact">
                <h2>Start building your quote</h2>
                <p>Add services from the Rate Card or use Help Me Choose to identify the right starting scope.</p>
                <div>
                    <button type="button" onclick="showPage('rate-card')"><i data-lucide="badge-dollar-sign"></i> Browse Services</button>
                    <button type="button" onclick="showPage('rate-card'); setTimeout(() => openRateCardModal('choose'), 0)"><i data-lucide="route"></i> Help Me Choose</button>
                    <button type="button" onclick="openCustomQuoteItemDialog()"><i data-lucide="plus"></i> Add Custom Item</button>
                </div>
                <strong>Estimated Total ${money(totals.estimatedTotal)}</strong>
            </section>
        `;
    }

    function renderQuoteLineItems(mode = activeQuoteMode) {
        return `
            <section class="quote-section quote-selected-services" id="quoteLineItems">
                <div class="quote-section-head minimal">
                    <div>
                        <h2>${mode === 'review' ? 'Selected Services' : 'Selected Services'}</h2>
                        <p>${quote.items.length} service${quote.items.length === 1 ? '' : 's'} selected.</p>
                    </div>
                    ${mode === 'build' ? `<button type="button" onclick="openCustomQuoteItemDialog()"><i data-lucide="plus"></i> Add Custom Item</button>` : ''}
                </div>
                <div class="quote-line-list relaxed">
                    ${quote.items.map(item => renderQuoteLineItem(item, mode)).join('')}
                </div>
            </section>
        `;
    }

    function renderReviewServicesSection() {
        return renderReviewSection('review-services', 'Selected Services', `${quote.items.length} item${quote.items.length === 1 ? '' : 's'}`, renderQuoteLineItems('review'), true);
    }

    function renderQuoteLineItem(item, mode = activeQuoteMode) {
        const calc = calculateLineItem(item);
        const expanded = expandedItems.has(item.id) || item.expanded;
        const scopeSensitive = isScopeSensitiveItem(item);
        const showWarnings = expanded || mode === 'review';
        return `
            <article class="quote-line-item clean ${calc.belowRate ? 'has-warning' : ''}" data-quote-line-id="${qbEscape(item.id)}">
                <div class="quote-line-primary simple">
                    <div class="quote-line-service">
                        <span>${qbEscape(item.category || 'Custom')}</span>
                        <strong>${qbEscape(item.serviceName)}</strong>
                        <small>${shortBillingBasis(item)}</small>
                        ${calc.minimumApplied ? `<em>Minimum ${money(calc.minimumRate)} applied</em>` : ''}
                    </div>
                    <div class="quote-qty-control" aria-label="Quantity for ${qbEscape(item.serviceName)}">
                        <button type="button" onclick="adjustQuoteItemQuantity('${item.id}', -1)" aria-label="Decrease quantity"><i data-lucide="minus"></i></button>
                        <input type="number" min="0" step="${isPerWordItem(item) ? '1' : '1'}" value="${item.quantity}" oninput="updateQuoteItem('${item.id}', 'quantity', this.value)">
                        <button type="button" onclick="adjustQuoteItemQuantity('${item.id}', 1)" aria-label="Increase quantity"><i data-lucide="plus"></i></button>
                    </div>
                    <div class="quote-unit-rate"><span>${money(item.unitRate)}</span><small>each</small></div>
                    <div class="quote-line-total"><span>Total</span><strong>${money(calc.total)}</strong></div>
                    <div class="quote-line-actions">
                        <button type="button" onclick="removeQuoteItem('${item.id}')" aria-label="Remove ${qbEscape(item.serviceName)}"><i data-lucide="trash-2"></i></button>
                        <button type="button" onclick="toggleQuoteLine('${item.id}')" aria-expanded="${expanded}" aria-label="Edit ${qbEscape(item.serviceName)} details"><i data-lucide="${expanded ? 'chevron-up' : 'chevron-down'}"></i></button>
                    </div>
                </div>
                ${showWarnings ? renderQuoteWarnings(item, calc, scopeSensitive) : ''}
                ${expanded ? renderQuoteLineExpanded(item) : ''}
            </article>
        `;
    }

    function shortBillingBasis(item) {
        const basis = item.billingBasis || item.description || 'Custom scope';
        return qbEscape(basis.replace(/^From\s+/i, '').replace(/\s*\(.*?\)\s*/g, ' ').trim());
    }

    function renderQuoteWarnings(item, calc, scopeSensitive) {
        const warnings = [];
        if (num(item.quantity) <= 0 || num(item.unitRate) <= 0) warnings.push(['circle-alert', 'Quantity or rate is zero', 'Use zero only when this line is intentionally non-chargeable.']);
        if (calc.belowRate) warnings.push(['alert-triangle', 'Below starting rate', 'Management review may be required.']);
        if (scopeSensitive) warnings.push(['info', 'Starting rate', 'Confirm complexity, duration, locations, talent and revisions.']);
        if (!String(item.clientNote || '').trim()) warnings.push(['file-warning', 'Scope missing', 'Add a short client-facing scope before copying.']);
        if (calc.minimumApplied) warnings.push(['badge-alert', 'Minimum charge applied', `Minimum line total is ${money(calc.minimumRate)}.`]);
        return warnings.length ? `<div class="quote-warning-list compact">${warnings.map(([icon, title, text]) => `<div><i data-lucide="${icon}"></i><span><strong>${title}</strong>${text}</span></div>`).join('')}</div>` : '';
    }

    function renderQuoteLineExpanded(item) {
        return `
            <div class="quote-line-expanded simplified">
                <label>Client-facing scope<textarea oninput="updateQuoteItem('${item.id}', 'clientNote', this.value)">${qbEscape(item.clientNote)}</textarea></label>
                <label>Internal note<textarea oninput="updateQuoteItem('${item.id}', 'internalNote', this.value)">${qbEscape(item.internalNote)}</textarea></label>
                <label>Unit rate<input type="number" min="0" step="${isPerWordItem(item) ? '0.01' : '1'}" value="${item.unitRate}" oninput="updateQuoteItem('${item.id}', 'unitRate', this.value)"></label>
                <label>Line discount %<input type="number" min="0" max="100" step="0.1" value="${item.discountPercentage}" oninput="updateQuoteItem('${item.id}', 'discountPercentage', this.value)"></label>
                <label class="quote-check-label"><input type="checkbox" ${item.isDiscountEligible ? 'checked' : ''} onchange="updateQuoteItem('${item.id}', 'isDiscountEligible', this.checked)"> Include in discount count</label>
                <label>Internal category
                    <select onchange="updateQuoteItem('${item.id}', 'costType', this.value)">
                        <option value="creative" ${item.costType === 'creative' ? 'selected' : ''}>Creative / Production</option>
                        <option value="custom" ${item.costType === 'custom' ? 'selected' : ''}>Custom</option>
                        <option value="third-party" ${item.costType === 'third-party' ? 'selected' : ''}>Additional Cost</option>
                    </select>
                </label>
                <button type="button" onclick="duplicateQuoteItem('${item.id}')"><i data-lucide="copy"></i> Duplicate</button>
            </div>
        `;
    }

    function renderSuggestedAddOns() {
        const all = getQuoteSuggestions();
        const suggestions = (showMoreSuggestions ? all : all.slice(0, 4));
        if (!quote.items.length || !suggestions.length) return '';
        return renderReviewSection('suggestions', 'Suggested Add-Ons', `${all.length} available`, `
            <div class="quote-suggestion-grid simple">
                ${suggestions.map(renderQuoteSuggestion).join('')}
            </div>
            ${all.length > 4 ? `<button type="button" class="quote-link-btn" onclick="toggleMoreQuoteSuggestions()">${showMoreSuggestions ? 'Show fewer suggestions' : 'View more suggestions'}</button>` : ''}
        `, true);
    }

    function renderQuoteSuggestion(suggestion) {
        const service = suggestion.serviceId ? findService(suggestion.serviceId) : null;
        return `
            <article class="quote-suggestion simple">
                <div>
                    <strong>${qbEscape(service?.service || suggestion.label)}</strong>
                    <p>${qbEscape(suggestion.reason)}</p>
                    <span>${service ? money(service.priceFrom) : 'Add amount later'}</span>
                </div>
                <div>
                    <button type="button" onclick="addQuoteSuggestion('${qbEscape(suggestion.key)}')">Add</button>
                    <button type="button" onclick="dismissQuoteSuggestion('${qbEscape(suggestion.key)}')" aria-label="Dismiss ${qbEscape(service?.service || suggestion.label)}"><i data-lucide="x"></i></button>
                </div>
            </article>
        `;
    }

    function renderClientDetailsSection() {
        const info = quote.info;
        return renderReviewSection('client-details', 'Client & Project Details', info.client || info.project ? `${info.client || 'Client'} / ${info.project || 'Project'}` : 'Add details', `
            <div class="quote-info-grid primary">
                ${renderQuoteInfoInput('Client or Brand Name', 'client', info.client)}
                ${renderQuoteInfoInput('Project or Campaign Name', 'project', info.project)}
            </div>
            <button type="button" class="quote-link-btn" onclick="toggleQuoteSection('more-details')">More details</button>
            ${expandedSections.has('more-details') ? `
                <div class="quote-info-grid more">
                    ${renderQuoteInfoInput('Prepared By', 'preparedBy', info.preparedBy)}
                    ${renderQuoteInfoInput('Date', 'date', info.date, 'date')}
                    ${renderQuoteInfoInput('Quote Reference', 'reference', info.reference)}
                    ${renderQuoteInfoInput('Currency', 'currency', info.currency)}
                </div>
            ` : ''}
        `);
    }

    function renderQuoteInfoInput(label, key, value, type = 'text') {
        return `<label>${label}<input type="${type}" value="${qbEscape(value)}" oninput="updateQuoteInfo('${key}', this.value)"></label>`;
    }

    function renderAdditionalCostsSection() {
        return renderReviewSection('additional-costs', 'Additional Costs', `${quote.thirdParty.length} item${quote.thirdParty.length === 1 ? '' : 's'}`, `
            <p class="quote-section-note">Add talent, travel, venue, media or other external costs when required.</p>
            <div class="quote-quick-add compact">
                ${THIRD_PARTY_PRESETS.map(name => `<button type="button" onclick="addThirdPartyCost('${qbEscape(name)}')">${compactCostName(name)}</button>`).join('')}
            </div>
            <div class="quote-third-list simple">
                ${quote.thirdParty.length ? quote.thirdParty.map(renderThirdPartyItem).join('') : '<p class="quote-muted">No additional costs added.</p>'}
            </div>
        `);
    }

    function compactCostName(name) {
        return qbEscape(name
            .replace('Talent Fee', 'Talent')
            .replace('Studio Rental', 'Studio')
            .replace('Venue Rental', 'Venue')
            .replace('Equipment Rental', 'Equipment')
            .replace('Stock Footage', 'Stock Assets')
            .replace('Stock Images', 'Stock Assets')
            .replace('Premium Music Licence', 'Premium Music')
            .replace('Freelancer or Specialist Fee', 'Freelancer / Specialist'));
    }

    function renderThirdPartyItem(item) {
        const calc = calculateThirdParty(item);
        const internalOpen = expandedItems.has(`cost-${item.id}`);
        return `
            <article class="quote-third-item simple">
                <label>Item<input type="text" value="${qbEscape(item.description)}" oninput="updateThirdParty('${item.id}', 'description', this.value)"></label>
                <label>Qty<input type="number" min="0" step="0.01" value="${item.quantity}" oninput="updateThirdParty('${item.id}', 'quantity', this.value)"></label>
                <label>Client-facing amount<input type="number" min="0" step="1" value="${calc.total}" oninput="updateThirdPartyClientAmount('${item.id}', this.value)"></label>
                <label>Note<input type="text" value="${qbEscape(item.internalNote)}" oninput="updateThirdParty('${item.id}', 'internalNote', this.value)"></label>
                <button type="button" onclick="toggleQuoteLine('cost-${item.id}')" aria-expanded="${internalOpen}"><i data-lucide="lock-keyhole"></i> Internal costing</button>
                <button type="button" onclick="removeThirdParty('${item.id}')" aria-label="Remove ${qbEscape(item.description)}"><i data-lucide="trash-2"></i></button>
                ${internalOpen ? `
                    <div class="quote-internal-costing">
                        <span>Internal Only</span>
                        <label>Internal Cost<input type="number" min="0" step="1" value="${item.unitCost}" oninput="updateThirdParty('${item.id}', 'unitCost', this.value)"></label>
                        <label>Markup %<input type="number" min="0" step="0.1" value="${item.markupPercentage}" oninput="updateThirdParty('${item.id}', 'markupPercentage', this.value)"></label>
                        <label class="quote-check-label"><input type="checkbox" ${item.useMarkup ? 'checked' : ''} onchange="updateThirdParty('${item.id}', 'useMarkup', this.checked)"> Use markup</label>
                    </div>
                ` : ''}
            </article>
        `;
    }

    function renderDiscountSection(totals) {
        const recommended = getRecommendedVolumeDiscount();
        const applied = getAppliedVolumeDiscount();
        const approval = applied >= 8 || (quote.volumeDiscount === 'custom' && applied > 5);
        return renderReviewSection('discount', 'Discount', applied ? `${applied}% applied` : 'Standard rate', `
            <div class="quote-discount-card">
                <div>
                    <strong>${totals.eligibleQuantity} eligible deliverable${totals.eligibleQuantity === 1 ? '' : 's'} detected</strong>
                    <span>Recommended discount: ${recommended ? `${recommended}%` : 'Standard rate'}</span>
                </div>
                <div class="quote-discount-actions">
                    ${recommended ? `<button type="button" onclick="applyRecommendedVolumeDiscount()">Apply ${recommended}%</button>` : ''}
                    <button type="button" onclick="updateVolumeDiscount('none')">No Discount</button>
                    <button type="button" onclick="updateVolumeDiscount('custom')">Custom</button>
                </div>
                <select onchange="updateVolumeDiscount(this.value)" aria-label="Discount option">
                    <option value="none" ${quote.volumeDiscount === 'none' ? 'selected' : ''}>No discount</option>
                    <option value="3" ${quote.volumeDiscount === '3' ? 'selected' : ''}>3%</option>
                    <option value="5" ${quote.volumeDiscount === '5' ? 'selected' : ''}>5%</option>
                    <option value="8" ${quote.volumeDiscount === '8' ? 'selected' : ''}>8%</option>
                    <option value="custom" ${quote.volumeDiscount === 'custom' ? 'selected' : ''}>Custom</option>
                </select>
                ${quote.volumeDiscount === 'custom' ? `<label>Custom discount %<input type="number" min="0" step="0.1" value="${quote.customVolumeDiscount}" oninput="updateCustomVolumeDiscount(this.value)"></label>` : ''}
                ${approval ? '<em>Management approval recommended</em>' : ''}
            </div>
        `);
    }

    function renderQuoteCheckSection() {
        const checks = getRelevantQuoteChecks();
        const unresolved = checks.filter(check => (quote.checks[check.id] || 'review') === 'review').length;
        return renderReviewSection('quote-check', 'Quote Check', `${unresolved} item${unresolved === 1 ? '' : 's'} need attention`, `
            <div class="quote-check-grid compact">
                ${checks.map(check => renderQuoteCheck(check)).join('')}
            </div>
        `);
    }

    function renderQuoteCheck(check) {
        const status = quote.checks[check.id] || 'review';
        return `
            <div class="quote-check-item ${status}">
                <span>${qbEscape(check.label)}</span>
                <select onchange="updateQuoteCheck('${check.id}', this.value)" aria-label="${qbEscape(check.label)} status">
                    <option value="review" ${status === 'review' ? 'selected' : ''}>Review Needed</option>
                    <option value="confirmed" ${status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="not-required" ${status === 'not-required' ? 'selected' : ''}>Not Required</option>
                </select>
            </div>
        `;
    }

    function renderCommercialSettingsSection() {
        return renderReviewSection('commercial-settings', 'Commercial Settings', quote.sstMode === 'not-applicable' ? 'SST not applicable' : 'SST configured', `
            <div class="quote-commercial-grid">
                <label>SST
                    <select onchange="updateSstMode(this.value)">
                        <option value="not-applicable" ${quote.sstMode === 'not-applicable' ? 'selected' : ''}>Not Applicable</option>
                        <option value="included" ${quote.sstMode === 'included' ? 'selected' : ''}>Included</option>
                        <option value="add" ${quote.sstMode === 'add' ? 'selected' : ''}>Add SST</option>
                        <option value="custom" ${quote.sstMode === 'custom' ? 'selected' : ''}>Custom</option>
                    </select>
                </label>
                ${(quote.sstMode === 'add' || quote.sstMode === 'custom') ? `<label>SST %<input type="number" min="0" step="0.1" value="${quote.sstPercent}" oninput="updateSstPercent(this.value)"></label>` : ''}
            </div>
            <div class="quote-terms-list compact">
                ${quote.terms.map(term => `<label><input type="checkbox" ${term.enabled ? 'checked' : ''} onchange="toggleQuoteTerm('${term.id}', this.checked)"> ${qbEscape(simplifyTerm(term.text))}</label>`).join('')}
            </div>
        `);
    }

    function simplifyTerm(term) {
        return term
            .replace('All rates are starting rates and subject to confirmed scope.', 'Starting rates subject to confirmed scope')
            .replace('Two minor revision rounds are included unless otherwise stated.', 'Two minor revision rounds included')
            .replace('Major changes after approval may be quoted separately.', 'Major changes quoted separately')
            .replace('Rush requests may incur an additional fee.', 'Rush fees may apply')
            .replace('Talent, travel, permits, media spending and third-party costs are excluded unless listed.', 'Third-party costs excluded unless listed')
            .replace('Editable working files are excluded unless listed.', 'Editable files excluded unless listed')
            .replace('SST is excluded where applicable.', 'SST excluded where applicable')
            .replace('Quotation validity may be confirmed separately.', 'Quotation validity to be confirmed');
    }

    function renderReviewTotalSection(totals) {
        return `
            <section class="quote-section quote-final-total">
                <div>
                    <span>Estimated Total</span>
                    <strong>${money(totals.estimatedTotal)}</strong>
                </div>
                <div class="quote-final-actions">
                    <button type="button" onclick="setQuoteMode('build')">Back to Edit</button>
                    <button type="button" class="primary" onclick="setQuoteMode('copy')">Continue to Copy</button>
                </div>
            </section>
        `;
    }

    function renderReviewSection(id, title, summary, content, openDefault = false) {
        const open = expandedSections.has(id);
        return `
            <section class="quote-section quote-review-section ${open ? 'open' : ''}">
                <button type="button" class="quote-review-head" onclick="toggleQuoteSection('${id}')" aria-expanded="${open}">
                    <span><strong>${qbEscape(title)}</strong><small>${qbEscape(summary)}</small></span>
                    <i data-lucide="${open ? 'chevron-up' : 'chevron-down'}"></i>
                </button>
                ${open ? `<div class="quote-review-body">${content}</div>` : ''}
            </section>
        `;
    }

    function renderClientPreview(totals) {
        const settings = quote.outputSettings;
        const rows = quote.items.map(item => {
            const calc = calculateLineItem(item);
            return `
                <div class="quote-preview-row">
                    <div>
                        <strong>${qbEscape(item.serviceName)}</strong>
                        <span>${qbEscape(settings.clientNotes ? (item.clientNote || item.billingBasis || item.description || '-') : (item.billingBasis || '-'))}</span>
                    </div>
                    <span>${item.quantity}</span>
                    <span>${settings.unitRates ? money(item.unitRate) : '-'}</span>
                    <b>${settings.lineTotals ? money(calc.total) : '-'}</b>
                </div>
            `;
        }).join('');
        const costRows = settings.thirdParty ? quote.thirdParty.map(item => {
            const calc = calculateThirdParty(item);
            return `
                <div class="quote-preview-row">
                    <div><strong>${qbEscape(item.description)}</strong><span>Additional cost</span></div>
                    <span>${item.quantity}</span>
                    <span>-</span>
                    <b>${money(calc.total)}</b>
                </div>
            `;
        }).join('') : '';
        return `
            <div class="quote-preview-card">
                <div class="quote-preview-head">
                    <div>
                        <span>Client / Project</span>
                        <strong>${qbEscape(quote.info.client || 'Client')} / ${qbEscape(quote.info.project || 'Project')}</strong>
                    </div>
                    <em>${qbEscape(quote.info.reference || '')}</em>
                </div>
                <div class="quote-preview-table">
                    <div class="quote-preview-row heading"><span>Deliverable</span><span>Qty</span><span>Rate</span><span>Total</span></div>
                    ${rows}
                    ${costRows}
                </div>
                <div class="quote-preview-total">
                    ${settings.discount && (totals.lineDiscounts || totals.volumeDiscount) ? `<span>Discount -${money(totals.lineDiscounts + totals.volumeDiscount)}</span>` : ''}
                    ${totals.sstAmount ? `<span>SST ${money(totals.sstAmount)}</span>` : ''}
                    <strong>Estimated Total ${money(totals.estimatedTotal)}</strong>
                </div>
                ${settings.terms ? `<div class="quote-preview-terms">${quote.terms.filter(term => term.enabled).map(term => `<span>${qbEscape(term.text)}</span>`).join('')}</div>` : ''}
            </div>
        `;
    }

    function renderQuoteSummary(totals) {
        if (!quote.items.length) {
            return `
                <aside class="quote-summary simplified">
                    <div class="quote-summary-card compact">
                        <span>Estimated Total</span>
                        <strong>${money(totals.estimatedTotal)}</strong>
                    </div>
                </aside>
            `;
        }
        const showFull = activeQuoteMode !== 'build';
        return `
            <aside class="quote-summary simplified">
                <div class="quote-summary-card compact">
                    <span>Estimated Total</span>
                    <strong>${money(totals.estimatedTotal)}</strong>
                    <div class="quote-summary-lines compact">
                        <div><span>Subtotal</span><b>${money(totals.creativeSubtotal)}</b></div>
                        ${(totals.lineDiscounts || totals.volumeDiscount) ? `<div><span>Discount</span><b>-${money(totals.lineDiscounts + totals.volumeDiscount)}</b></div>` : ''}
                        ${showFull ? `<div><span>Additional Costs</span><b>${money(totals.thirdPartyTotal)}</b></div>` : ''}
                        ${showFull ? `<div><span>SST</span><b>${money(totals.sstAmount)}</b></div>` : ''}
                    </div>
                    ${activeQuoteMode === 'build' ? `<button type="button" class="quote-summary-primary" onclick="setQuoteMode('review')">Review Quote</button>` : ''}
                    ${activeQuoteMode === 'review' ? `<button type="button" class="quote-summary-primary" onclick="setQuoteMode('copy')">Continue to Copy</button><button type="button" class="quote-summary-secondary" onclick="setQuoteMode('build')">Back to Edit</button>` : ''}
                    ${activeQuoteMode === 'copy' ? `<button type="button" class="quote-summary-secondary" onclick="setQuoteMode('review')">Back to Review</button>` : ''}
                </div>
            </aside>
        `;
    }

    function renderQuoteMobileBar(totals) {
        if (!quote.items.length) return '';
        const action = activeQuoteMode === 'build' ? 'Review Quote' : activeQuoteMode === 'review' ? 'Continue' : 'Back to Review';
        const target = activeQuoteMode === 'build' ? 'review' : activeQuoteMode === 'review' ? 'copy' : 'review';
        return `
            <div class="quote-mobile-total-bar">
                <span>${quote.items.length} item${quote.items.length === 1 ? '' : 's'} · ${money(totals.estimatedTotal)}</span>
                <button type="button" onclick="setQuoteMode('${target}')">${action}</button>
            </div>
        `;
    }

    function renderOutputToggle(key, label) {
        return `<label><input type="checkbox" ${quote.outputSettings[key] ? 'checked' : ''} onchange="updateOutputSetting('${key}', this.checked)"> ${label}</label>`;
    }

    function calculateLineItem(item) {
        const quantity = Math.max(0, num(item.quantity));
        const unitRate = Math.max(0, num(item.unitRate));
        const raw = cents(quantity * unitRate);
        const minimumRate = parseMinimumRate(item.billingBasis);
        const minimum = cents(minimumRate);
        const base = minimum > 0 && raw > 0 ? Math.max(raw, minimum) : raw;
        const discount = Math.round(base * (Math.max(0, num(item.discountPercentage)) / 100));
        const total = Math.max(0, base - discount);
        return {
            subtotal: fromCents(base),
            discount: fromCents(discount),
            total: fromCents(total),
            minimumRate,
            minimumApplied: minimum > 0 && raw > 0 && raw < minimum,
            belowRate: item.serviceId && unitRate < num(item.minimumRecommendedRate)
        };
    }

    function calculateThirdParty(item) {
        const base = cents(Math.max(0, num(item.quantity)) * Math.max(0, num(item.unitCost)));
        const markup = item.useMarkup ? Math.round(base * (Math.max(0, num(item.markupPercentage)) / 100)) : 0;
        return { subtotal: fromCents(base), markup: fromCents(markup), total: fromCents(base + markup) };
    }

    function calculateQuoteTotals() {
        loadQuote();
        let creativeSubtotal = 0;
        let lineDiscounts = 0;
        let eligibleSubtotal = 0;
        let eligibleQuantity = 0;

        quote.items.forEach(item => {
            const calc = calculateLineItem(item);
            const isThirdParty = item.costType === 'third-party';
            if (!isThirdParty) creativeSubtotal += calc.subtotal;
            lineDiscounts += calc.discount;
            if (!isThirdParty && item.isDiscountEligible) {
                eligibleSubtotal += calc.total;
                eligibleQuantity += Math.max(0, num(item.quantity));
            }
        });

        const thirdPartyTotal = quote.thirdParty.reduce((sum, item) => sum + calculateThirdParty(item).total, 0)
            + quote.items.filter(item => item.costType === 'third-party').reduce((sum, item) => sum + calculateLineItem(item).total, 0);
        const volumeDiscountRate = getAppliedVolumeDiscount();
        const volumeDiscount = fromCents(Math.round(cents(eligibleSubtotal) * (volumeDiscountRate / 100)));
        const subtotalAfterDiscounts = Math.max(0, creativeSubtotal - lineDiscounts - volumeDiscount);
        const sstPercent = (quote.sstMode === 'add' || quote.sstMode === 'custom') ? Math.max(0, num(quote.sstPercent)) : 0;
        const sstAmount = fromCents(Math.round(cents(subtotalAfterDiscounts + thirdPartyTotal) * (sstPercent / 100)));
        return {
            creativeSubtotal,
            lineDiscounts,
            eligibleSubtotal,
            eligibleQuantity,
            volumeDiscount,
            thirdPartyTotal,
            sstAmount,
            estimatedTotal: subtotalAfterDiscounts + thirdPartyTotal + sstAmount
        };
    }

    function parseMinimumRate(billingBasis = '') {
        const match = String(billingBasis).match(/minimum\s*RM\s*([0-9,.]+)/i);
        return match ? num(match[1].replace(/,/g, '')) : 0;
    }

    function isPerWordItem(item) {
        return /per word/i.test(item.billingBasis || '') || item.unitRate < 1;
    }

    function isScopeSensitiveItem(item) {
        const text = `${item.category} ${item.serviceName} ${item.description}`.toLowerCase();
        return /(video production|branding|website|web|full ai|hybrid|photography|animation|campaign|film|property)/i.test(text);
    }

    function getRecommendedVolumeDiscount() {
        const total = calculateQuoteTotals();
        if (total.eligibleQuantity >= 20) return 8;
        if (total.eligibleQuantity >= 10) return 5;
        if (total.eligibleQuantity >= 5) return 3;
        return 0;
    }

    function getAppliedVolumeDiscount() {
        if (!quote || quote.volumeDiscount === 'none') return 0;
        if (quote.volumeDiscount === 'custom') return Math.max(0, num(quote.customVolumeDiscount));
        return Math.max(0, num(quote.volumeDiscount));
    }

    function getQuoteSuggestions() {
        loadQuote();
        const activeIds = new Set(quote.items.map(item => item.serviceId).filter(Boolean));
        const dismissed = new Set(quote.dismissedSuggestions);
        const suggestions = new Map();
        const add = (key, serviceId, label, reason) => {
            if (dismissed.has(key)) return;
            if (serviceId && activeIds.has(serviceId)) return;
            if (!suggestions.has(key)) suggestions.set(key, { key, serviceId, label, reason });
        };
        quote.items.forEach(item => {
            const serviceText = `${item.serviceId} ${item.serviceName} ${item.category}`.toLowerCase();
            if (/digital-fb-static|static post/.test(serviceText)) {
                add('copy-caption', 'copy-caption', '', 'Captions are often scoped separately from visual design.');
                add('copy-translation', 'copy-translation', '', 'Add language versions when markets differ.');
                add('digital-resize', 'digital-resize', '', 'Social posts often need story or platform adaptations.');
                add('media-management', '', 'Media Campaign Management', 'Posting, scheduling and media handling are not included by default.');
            }
            if (/digital-carousel|carousel/.test(serviceText)) {
                add('copy-carousel', 'copy-carousel', '', 'Carousel slide copy may need separate writing.');
                add('digital-carousel-frame', 'digital-carousel-frame', '', 'Extra frames should be charged clearly.');
                add('carousel-language', 'copy-transcreation', '', 'Additional market versions may need localisation.');
                add('carousel-resize', 'digital-resize', '', 'Carousels may need story or ad format adaptations.');
            }
            if (/video editing|edit-/.test(serviceText)) {
                add('edit-subtitling', 'edit-subtitling', '', 'Subtitles are commonly requested after editing begins.');
                add('edit-translated-subtitles', 'edit-translated-subtitles', '', 'Translated subtitles are separate from editing.');
                add('edit-aspect', 'edit-aspect', '', 'Add format conversion for vertical, square or landscape outputs.');
                add('edit-audio-clean', 'edit-audio-clean', '', 'Audio cleanup may be needed for supplied footage.');
            }
            if (/video production|prod-/.test(serviceText)) {
                add('copy-video-script', 'copy-video-script', '', 'Scriptwriting may not be included in filming fees.');
                add('talent-fee', '', 'Talent Fee', 'Talent is a third-party or production cost.');
                add('prod-teleprompter', 'prod-teleprompter', '', 'Scripted talking-head videos may need a teleprompter.');
                add('prod-additional-day', 'prod-additional-day', '', 'Extra shoot days should be separated.');
                add('production-transport', '', 'Transport', 'Travel and logistics are excluded unless listed.');
            }
            if (/ai-video|ai video|ai videos/.test(serviceText)) {
                add('ai-video-add-scene', 'ai-video-add-scene', '', 'Additional AI scenes are easy to miss.');
                add('ai-video-character-style', 'ai-video-character-style', '', 'Character or style consistency may require setup.');
                add('ai-video-regen-scene', 'ai-video-regen-scene', '', 'Approved AI scene changes are chargeable.');
                add('ai-video-voiceover', 'ai-video-voiceover', '', 'AI voice-over may be required for final output.');
                add('ai-video-localisation', 'ai-video-localisation', '', 'Additional language versions need localisation.');
                add('ai-video-aspect', 'ai-video-aspect', '', 'AI video adaptations may be needed for social formats.');
            }
            if (/blog|seo|article/.test(serviceText)) {
                add('keyword-research', '', 'Keyword Research', 'SEO scope may need keyword research before writing.');
                add('content-brief', '', 'Content Brief', 'Some articles need outline and messaging direction.');
                add('blog-translation', 'copy-translation', '', 'Articles may need additional language versions.');
                add('digital-infographic', 'digital-infographic', '', 'Articles sometimes need supporting visuals.');
            }
        });
        return [...suggestions.values()];
    }

    function getRelevantQuoteChecks() {
        const text = quote.items.map(item => `${item.serviceId} ${item.serviceName} ${item.category}`).join(' ').toLowerCase();
        const checks = [
            ['quantity', 'Are all required quantities confirmed?'],
            ['revision', 'Are revision limits stated?'],
            ['deadline', 'Is the deadline a rush request?'],
            ['sst', 'Is SST applicable?']
        ];
        if (/social|carousel|post|copy/.test(text)) checks.push(['copywriting', 'Is copywriting included?']);
        if (/resize|adaptation|video|social|carousel/.test(text)) checks.push(['formats', 'Are additional formats included?']);
        if (/translation|localisation|subtitle|language/.test(text)) checks.push(['languages', 'Are additional languages included?']);
        if (/video|film|shoot|production/.test(text)) {
            checks.push(['duration', 'Is final duration confirmed?']);
            checks.push(['subtitles', 'Are subtitles required?']);
        }
        if (/production|shoot|hybrid/.test(text)) {
            checks.push(['locations', 'Are the number of locations confirmed?']);
            checks.push(['talent', 'Is talent included?']);
            checks.push(['travel', 'Are travel and accommodation included?']);
            checks.push(['studio', 'Are studio or venue costs included?']);
        }
        if (/ai-video|ai video/.test(text)) checks.push(['ai-scenes', 'Are AI scene limits confirmed?']);
        if (/media|gdn|sem/.test(text)) checks.push(['media-management', 'Is media management required?']);
        if (quote.thirdParty.length) checks.push(['third-party', 'Are third-party costs included?']);
        checks.push(['editable-files', 'Are editable files required?']);
        return checks.map(([id, label]) => ({ id, label })).slice(0, 14);
    }

    function updateQuoteInfo(key, value) {
        updateQuote(state => { state.info[key] = value; }, false);
    }

    function updateQuoteItem(itemId, key, value) {
        updateQuote(state => {
            const item = state.items.find(row => row.id === itemId);
            if (!item) return;
            if (['quantity', 'unitRate', 'discountPercentage'].includes(key)) item[key] = Math.max(0, num(value));
            else if (key === 'isDiscountEligible') item[key] = !!value;
            else item[key] = value;
        });
    }

    function duplicateQuoteItem(itemId) {
        updateQuote(state => {
            const item = state.items.find(row => row.id === itemId);
            if (item) state.items.unshift({ ...item, id: uid('line'), internalNote: `${item.internalNote || ''}`.trim() });
        });
        showQuoteToast('Line item duplicated.');
    }

    function removeQuoteItem(itemId) {
        updateQuote(state => { state.items = state.items.filter(item => item.id !== itemId); });
        renderRateCardIfActive();
        showQuoteToast('Line item removed.');
    }

    function toggleQuoteLine(itemId) {
        if (expandedItems.has(itemId)) expandedItems.delete(itemId);
        else expandedItems.add(itemId);
        renderQuoteBuilderPage();
    }

    function toggleQuoteSection(section) {
        if (expandedSections.has(section)) expandedSections.delete(section);
        else expandedSections.add(section);
        renderQuoteBuilderPage();
    }

    function addThirdPartyCost(description = 'Third-party cost') {
        updateQuote(state => {
            state.thirdParty.unshift(normaliseThirdParty({ description }));
        });
    }

    function updateThirdParty(itemId, key, value) {
        updateQuote(state => {
            const item = state.thirdParty.find(row => row.id === itemId);
            if (!item) return;
            if (['quantity', 'unitCost', 'markupPercentage'].includes(key)) item[key] = Math.max(0, num(value));
            else if (key === 'useMarkup') item[key] = !!value;
            else item[key] = value;
        });
    }

    function updateThirdPartyClientAmount(itemId, value) {
        updateQuote(state => {
            const item = state.thirdParty.find(row => row.id === itemId);
            if (!item) return;
            const quantity = Math.max(1, num(item.quantity, 1));
            item.unitCost = Math.max(0, num(value)) / quantity;
            item.markupPercentage = 0;
            item.useMarkup = false;
        });
    }

    function removeThirdParty(itemId) {
        updateQuote(state => { state.thirdParty = state.thirdParty.filter(item => item.id !== itemId); });
    }

    function addQuoteSuggestion(key) {
        const suggestion = getQuoteSuggestions().find(row => row.key === key);
        if (!suggestion) return;
        if (suggestion.serviceId) addServiceToQuote(suggestion.serviceId);
        else addThirdPartyCost(suggestion.label);
    }

    function dismissQuoteSuggestion(key) {
        updateQuote(state => {
            if (!state.dismissedSuggestions.includes(key)) state.dismissedSuggestions.push(key);
        });
    }

    function updateQuoteCheck(id, value) {
        updateQuote(state => { state.checks[id] = value; }, false);
        const node = document.querySelector(`.quote-check-item select[onchange*="${id}"]`)?.closest('.quote-check-item');
        if (node) node.className = `quote-check-item ${value}`;
        renderQuoteIndicator();
    }

    function updateVolumeDiscount(value) {
        updateQuote(state => { state.volumeDiscount = value; });
    }

    function updateCustomVolumeDiscount(value) {
        updateQuote(state => { state.customVolumeDiscount = Math.max(0, num(value)); });
    }

    function applyRecommendedVolumeDiscount() {
        const recommended = getRecommendedVolumeDiscount();
        if (!recommended) return;
        updateQuote(state => { state.volumeDiscount = String(recommended); });
    }

    function updateSstMode(value) {
        updateQuote(state => { state.sstMode = value; });
    }

    function updateSstPercent(value) {
        updateQuote(state => { state.sstPercent = Math.max(0, num(value)); });
    }

    function updateOutputSetting(key, value) {
        updateQuote(state => { state.outputSettings[key] = !!value; }, false);
    }

    function toggleQuoteTerm(termId, enabled) {
        updateQuote(state => {
            const term = state.terms.find(row => row.id === termId);
            if (term) term.enabled = !!enabled;
        }, false);
    }

    function updateQuoteDraftName(value) {
        updateQuote(state => { state.draftName = value || 'Untitled Estimate'; }, false);
    }

    function toggleQuoteDraftTools() {
        showDraftTools = !showDraftTools;
        renderQuoteBuilderPage();
    }

    function getQuoteDrafts() {
        try {
            return JSON.parse(localStorage.getItem(DRAFTS_KEY) || '[]');
        } catch(e) {
            return [];
        }
    }

    function setQuoteDrafts(drafts) {
        localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts.slice(0, MAX_DRAFTS)));
    }

    function saveQuoteDraft() {
        loadQuote();
        const drafts = getQuoteDrafts().filter(draft => draft.id !== quote.id);
        quote.savedAt = new Date().toISOString();
        setQuoteDrafts([{ ...quote }, ...drafts]);
        saveActiveQuote();
        showQuoteToast('Draft saved on this device.');
        renderQuoteBuilderPage();
    }

    function duplicateQuoteDraft() {
        loadQuote();
        quote = { ...quote, id: uid('quote'), draftName: `${quote.draftName || 'Untitled Estimate'} Copy` };
        quote.items = quote.items.map(item => ({ ...item, id: uid('line') }));
        quote.thirdParty = quote.thirdParty.map(item => ({ ...item, id: uid('third') }));
        saveQuoteDraft();
    }

    function loadQuoteDraft(draftId) {
        const draft = getQuoteDrafts().find(row => row.id === draftId);
        if (!draft) return;
        quote = normaliseQuote(draft);
        saveActiveQuote();
        renderQuoteBuilderPage();
        showQuoteToast('Draft loaded.');
    }

    function confirmDeleteActiveDraft() {
        openQuoteDialog(`
            <div class="quote-mini-dialog">
                <span>Delete Draft</span>
                <h3>Remove this saved draft?</h3>
                <p>The active quote will remain open, but this saved draft copy will be removed from this device.</p>
                <div class="quote-dialog-actions">
                    <button type="button" class="danger" onclick="deleteActiveQuoteDraft(); closeQuoteDialog();">Delete Draft</button>
                    <button type="button" class="quiet" onclick="closeQuoteDialog()">Cancel</button>
                </div>
            </div>
        `);
    }

    function deleteActiveQuoteDraft() {
        setQuoteDrafts(getQuoteDrafts().filter(draft => draft.id !== quote.id));
        showQuoteToast('Draft deleted.');
        renderQuoteBuilderPage();
    }

    function confirmNewQuote() {
        loadQuote();
        if (!quote.items.length && !quote.thirdParty.length) {
            startNewQuote();
            return;
        }
        openQuoteDialog(`
            <div class="quote-mini-dialog">
                <span>New Quote</span>
                <h3>Start a new estimate?</h3>
                <p>Unsaved changes in the current active quote may be lost. Saved drafts remain on this device.</p>
                <div class="quote-dialog-actions">
                    <button type="button" class="danger" onclick="startNewQuote(); closeQuoteDialog();">Start New Quote</button>
                    <button type="button" class="quiet" onclick="closeQuoteDialog()">Cancel</button>
                </div>
            </div>
        `);
    }

    function startNewQuote() {
        quote = newQuoteState();
        expandedItems = new Set();
        expandedSections = new Set(['review-services', 'suggestions']);
        activeQuoteMode = 'build';
        quoteCopyUnlocked = false;
        quoteSearchTerm = '';
        showMoreSuggestions = false;
        saveActiveQuote();
        renderQuoteBuilderPage();
        renderRateCardIfActive();
    }

    function openCustomQuoteItemDialog() {
        openQuoteDialog(`
            <form class="quote-mini-dialog" onsubmit="event.preventDefault(); submitCustomQuoteItem();">
                <span>Custom Item</span>
                <h3>Add Custom Line Item</h3>
                <div class="quote-dialog-grid">
                    <label>Item Name<input id="customQuoteName" type="text" placeholder="Talent Fee" required></label>
                    <label>Category<input id="customQuoteCategory" type="text" value="Custom"></label>
                    <label>Description<input id="customQuoteDescription" type="text" placeholder="Client-facing scope"></label>
                    <label>Quantity<input id="customQuoteQty" type="number" min="0" step="0.01" value="1"></label>
                    <label>Unit Rate<input id="customQuoteRate" type="number" min="0" step="1" value="0"></label>
                    <label>Cost Type<select id="customQuoteCostType"><option value="custom">Custom</option><option value="creative">Creative / Production</option><option value="third-party">Third-party</option></select></label>
                    <label class="quote-check-label"><input id="customQuoteEligible" type="checkbox"> Discount eligible</label>
                    <label>Internal Note<textarea id="customQuoteInternal"></textarea></label>
                </div>
                <div class="quote-dialog-actions">
                    <button type="submit">Add Item</button>
                    <button type="button" class="quiet" onclick="closeQuoteDialog()">Cancel</button>
                </div>
            </form>
        `);
        setTimeout(() => document.getElementById('customQuoteName')?.focus(), 0);
    }

    function submitCustomQuoteItem() {
        const name = document.getElementById('customQuoteName')?.value || 'Custom Item';
        const category = document.getElementById('customQuoteCategory')?.value || 'Custom';
        const description = document.getElementById('customQuoteDescription')?.value || '';
        const quantity = document.getElementById('customQuoteQty')?.value || 1;
        const unitRate = document.getElementById('customQuoteRate')?.value || 0;
        const costType = document.getElementById('customQuoteCostType')?.value || 'custom';
        const eligible = !!document.getElementById('customQuoteEligible')?.checked;
        const internal = document.getElementById('customQuoteInternal')?.value || '';
        updateQuote(state => {
            state.items.unshift(normaliseItem({
                serviceName: name,
                category,
                description,
                billingBasis: 'Custom scope',
                quantity,
                unitRate,
                costType,
                isDiscountEligible: eligible,
                internalNote: internal,
                clientNote: description
            }));
        });
        closeQuoteDialog();
        showQuoteToast('Custom item added.');
    }

    function openQuoteRecommendationPicker(guideId, openAfter = false) {
        const row = (window.RATE_CARD_CLASSIFICATION_GUIDE || []).find(item => item.id === guideId);
        if (!row) return;
        const base = (row.serviceIds || []).map(findService).filter(Boolean);
        const addons = (row.addonServiceIds || []).map(findService).filter(Boolean);
        if (!base.length && !addons.length) return;
        openQuoteDialog(`
            <form class="quote-mini-dialog quote-rec-dialog" onsubmit="event.preventDefault(); submitQuoteRecommendation('${guideId}', ${openAfter});">
                <span>Add Recommendation</span>
                <h3>${qbEscape(row.category)}</h3>
                <p>Select the services to add. Add-ons are optional and should be scoped before quoting.</p>
                <div class="quote-rec-list">
                    ${base.map(service => renderRecommendationOption(service, true)).join('')}
                    ${addons.map(service => renderRecommendationOption(service, false)).join('')}
                </div>
                <div class="quote-dialog-actions">
                    <button type="submit">Add Selected Items</button>
                    <button type="button" onclick="submitQuoteRecommendation('${guideId}', true)">Add and Open Quote Builder</button>
                    <button type="button" class="quiet" onclick="closeQuoteDialog()">Cancel</button>
                </div>
            </form>
        `);
    }

    function renderRecommendationOption(service, checked) {
        return `
            <label>
                <input type="checkbox" value="${qbEscape(service.id)}" ${checked ? 'checked' : ''}>
                <span><strong>${qbEscape(service.service)}</strong><em>${money(service.priceFrom)} · ${qbEscape(service.billingBasis)}</em></span>
            </label>
        `;
    }

    function submitQuoteRecommendation(guideId, openAfter = false) {
        const checked = [...document.querySelectorAll('.quote-rec-list input:checked')].map(input => input.value);
        checked.forEach(serviceId => addServiceToQuote(serviceId, { mode: getQuoteServiceQuantity(serviceId) ? 'increase' : 'separate' }));
        closeQuoteDialog();
        showQuoteToast(`${checked.length} item${checked.length === 1 ? '' : 's'} added to quote.`, true);
        if (openAfter) {
            activeQuoteMode = 'build';
            showPage('quote-builder');
        }
    }

    function copyQuoteOutput(type) {
        const text = type === 'proposal'
            ? formatProposalText()
            : type === 'internal'
                ? formatInternalSummary()
                : formatClientTable();
        navigator.clipboard?.writeText(text)
            ?.then(() => showQuoteToast(type === 'table' ? 'Pricing table copied.' : 'Quote text copied.'))
            .catch(() => showQuoteToast('Copy failed. Please try again.'));
    }

    function formatClientTable() {
        const totals = calculateQuoteTotals();
        const settings = quote.outputSettings;
        const rows = quote.items.map(item => {
            const calc = calculateLineItem(item);
            return [
                item.serviceName,
                settings.clientNotes ? (item.clientNote || item.billingBasis || item.description || '-') : (item.billingBasis || '-'),
                item.quantity,
                settings.unitRates ? money(item.unitRate) : '-',
                settings.lineTotals ? money(calc.total) : '-'
            ];
        });
        const thirdRows = settings.thirdParty ? quote.thirdParty.map(item => {
            const calc = calculateThirdParty(item);
            return [item.description, 'Additional cost', item.quantity, '-', settings.lineTotals ? money(calc.total) : '-'];
        }) : [];
        const lines = [
            'PROPOSED DELIVERABLES',
            '',
            '| Deliverable | Scope | Qty | Unit Rate | Total |',
            '|---|---|---:|---:|---:|',
            ...[...rows, ...thirdRows].map(row => `| ${row.map(cell => String(cell).replace(/\|/g, '/')).join(' | ')} |`),
            '',
            `Creative & Production Subtotal: ${money(totals.creativeSubtotal)}`,
            settings.discount ? `Line-Item Discounts: -${money(totals.lineDiscounts)}` : '',
            settings.discount ? `Volume Discount: -${money(totals.volumeDiscount)}` : '',
            settings.thirdParty ? `Additional Costs: ${money(totals.thirdPartyTotal)}` : '',
            quote.sstMode === 'included' ? 'SST: Included in rates' : '',
            totals.sstAmount ? `SST: ${money(totals.sstAmount)}` : '',
            `Estimated Total: ${money(totals.estimatedTotal)}`,
            '',
            settings.terms ? 'Notes:' : '',
            ...(settings.terms ? quote.terms.filter(term => term.enabled).map(term => `- ${term.text}`) : [])
        ].filter(line => line !== '');
        return lines.join('\n');
    }

    function formatProposalText() {
        const totals = calculateQuoteTotals();
        const serviceText = quote.items.map(item => `${item.quantity} x ${item.serviceName}`).join(', ') || 'the selected services';
        return [
            `The proposed scope includes ${serviceText}.`,
            '',
            `The estimated creative and production fee is ${money(totals.creativeSubtotal - totals.lineDiscounts - totals.volumeDiscount)}, excluding additional costs and SST where applicable.`,
            quote.thirdParty.length ? `Listed additional costs are estimated at ${money(totals.thirdPartyTotal)}.` : '',
            '',
            'Final pricing is subject to the confirmed production scope, timeline and approval requirements.'
        ].filter(Boolean).join('\n');
    }

    function formatInternalSummary() {
        const totals = calculateQuoteTotals();
        const unresolved = getRelevantQuoteChecks().filter(check => (quote.checks[check.id] || 'review') === 'review').map(check => check.label);
        const warnings = quote.items.flatMap(item => {
            const calc = calculateLineItem(item);
            return calc.belowRate ? [`${item.serviceName}: below recommended starting rate`] : [];
        });
        return [
            'INTERNAL QUOTE SUMMARY',
            '',
            `Client / Project: ${quote.info.client || '-'} / ${quote.info.project || '-'}`,
            `Reference: ${quote.info.reference || '-'}`,
            '',
            'Selected services:',
            ...quote.items.map(item => {
                const calc = calculateLineItem(item);
                return `- ${item.serviceName}: ${item.quantity} x ${money(item.unitRate)} = ${money(calc.total)}${item.internalNote ? ` | Internal note: ${item.internalNote}` : ''}`;
            }),
            quote.thirdParty.length ? '' : '',
            quote.thirdParty.length ? 'Additional costs:' : '',
            ...quote.thirdParty.map(item => {
                const calc = calculateThirdParty(item);
                return `- ${item.description}: internal ${money(item.unitCost)} x ${item.quantity}, markup ${item.useMarkup ? `${item.markupPercentage}%` : 'not used'}, client amount ${money(calc.total)}${item.internalNote ? ` | ${item.internalNote}` : ''}`;
            }),
            '',
            `Estimated total: ${money(totals.estimatedTotal)}`,
            warnings.length ? `Warnings: ${warnings.join('; ')}` : 'Warnings: none',
            unresolved.length ? `Review needed: ${unresolved.join(', ')}` : 'Review needed: none'
        ].filter(line => line !== '').join('\n');
    }

    function downloadQuoteCsv() {
        const rows = [['Service', 'Category', 'Description', 'Quantity', 'Unit Rate', 'Discount', 'Line Total', 'Cost Type', 'Client Note', 'Internal Note']];
        quote.items.forEach(item => {
            const calc = calculateLineItem(item);
            rows.push([item.serviceName, item.category, item.description, item.quantity, item.unitRate, item.discountPercentage, calc.total, item.costType, item.clientNote, item.internalNote]);
        });
        quote.thirdParty.forEach(item => {
            const calc = calculateThirdParty(item);
            rows.push([item.description, 'Additional Cost', 'External cost', item.quantity, calc.total / Math.max(1, num(item.quantity)), 0, calc.total, 'additional-cost', item.description, item.internalNote]);
        });
        const csv = rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${quote.info.reference || 'quote-estimate'}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }

    function openQuoteInfoNote(anchor, event) {
        event?.stopPropagation();
        openQuoteDialog(`
            <div class="quote-mini-dialog">
                <span>Internal Guidance</span>
                <h3>Quote Builder</h3>
                <p>This tool provides internal quotation guidance only. Final pricing must be reviewed against the confirmed scope, timeline and third-party requirements.</p>
                <div class="quote-dialog-actions"><button type="button" onclick="closeQuoteDialog()">OK</button></div>
            </div>
        `);
    }

    function openQuoteDialog(html) {
        quoteDialogFocus = document.activeElement;
        let overlay = document.getElementById('quoteBuilderDialog');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'quoteBuilderDialog';
            overlay.className = 'quote-dialog-overlay';
            document.body.appendChild(overlay);
        }
        overlay.innerHTML = `<div class="quote-dialog-sheet" role="dialog" aria-modal="true" onclick="event.stopPropagation()">${html}</div>`;
        overlay.classList.add('show');
        overlay.setAttribute('aria-hidden', 'false');
        overlay.onclick = event => {
            if (event.target === overlay) closeQuoteDialog();
        };
        document.addEventListener('keydown', quoteDialogKeydown);
        setTimeout(() => overlay.querySelector('button, input, select, textarea')?.focus(), 0);
        refreshIcons?.();
    }

    function closeQuoteDialog() {
        const overlay = document.getElementById('quoteBuilderDialog');
        if (overlay) {
            overlay.classList.remove('show');
            overlay.setAttribute('aria-hidden', 'true');
            overlay.innerHTML = '';
        }
        document.removeEventListener('keydown', quoteDialogKeydown);
        quoteDialogFocus?.focus?.();
    }

    function quoteDialogKeydown(event) {
        if (event.key === 'Escape') closeQuoteDialog();
    }

    function showQuoteToast(message, withAction = false) {
        let toast = document.getElementById('quoteBuilderToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'quoteBuilderToast';
            toast.className = 'quote-toast';
            document.body.appendChild(toast);
        }
        toast.innerHTML = withAction
            ? `<span>${qbEscape(message)}</span><button type="button" onclick="showPage('quote-builder'); setQuoteMode('build')">View Quote</button>`
            : `<span>${qbEscape(message)}</span>`;
        toast.classList.add('show');
        clearTimeout(showQuoteToast.timer);
        showQuoteToast.timer = setTimeout(() => toast.classList.remove('show'), 1800);
        renderQuoteIndicator();
    }

    function renderQuoteIndicator() {
        loadQuote();
        let indicator = document.getElementById('quoteIndicator');
        if (!indicator) {
            indicator = document.createElement('button');
            indicator.id = 'quoteIndicator';
            indicator.className = 'quote-indicator';
            indicator.type = 'button';
            indicator.onclick = openQuoteTray;
            document.body.appendChild(indicator);
        }
        const itemCount = quote.items.length + quote.thirdParty.length;
        if (!itemCount) {
            indicator.classList.remove('show');
            return;
        }
        const totals = calculateQuoteTotals();
        indicator.innerHTML = `<i data-lucide="file-spreadsheet"></i><span>Quote · ${itemCount} item${itemCount === 1 ? '' : 's'} · ${money(totals.estimatedTotal)}</span>`;
        indicator.classList.add('show');
        refreshIcons?.();
    }

    function openQuoteTray() {
        loadQuote();
        const totals = calculateQuoteTotals();
        const items = quote.items.slice(0, 5);
        openQuoteDialog(`
            <div class="quote-mini-dialog quote-tray-dialog">
                <span>Quote Summary</span>
                <h3>${quote.items.length} selected service${quote.items.length === 1 ? '' : 's'}</h3>
                <div class="quote-tray-list">
                    ${items.map(item => {
                        const calc = calculateLineItem(item);
                        return `<div><strong>${qbEscape(item.serviceName)}</strong><span>${item.quantity} x ${money(item.unitRate)}</span><b>${money(calc.total)}</b></div>`;
                    }).join('')}
                    ${quote.items.length > items.length ? `<p>${quote.items.length - items.length} more item${quote.items.length - items.length === 1 ? '' : 's'}</p>` : ''}
                </div>
                <div class="quote-tray-total"><span>Current total</span><strong>${money(totals.estimatedTotal)}</strong></div>
                <div class="quote-dialog-actions">
                    <button type="button" onclick="closeQuoteDialog(); showPage('quote-builder'); setQuoteMode('build');">Open Quote Builder</button>
                    <button type="button" class="quiet" onclick="closeQuoteDialog()">Close</button>
                </div>
            </div>
        `);
    }

    function renderRateCardIfActive() {
        const page = document.getElementById('rate-card');
        if (page?.classList.contains('active') && typeof renderRateCardPage === 'function') renderRateCardPage();
    }

    window.renderQuoteBuilderPage = renderQuoteBuilderPage;
    window.setQuoteMode = setQuoteMode;
    window.updateQuoteSearch = updateQuoteSearch;
    window.adjustQuoteItemQuantity = adjustQuoteItemQuantity;
    window.toggleMoreQuoteSuggestions = toggleMoreQuoteSuggestions;
    window.addServiceToQuote = addServiceToQuote;
    window.openQuoteServiceMenu = openQuoteServiceMenu;
    window.getQuoteServiceQuantity = getQuoteServiceQuantity;
    window.openQuoteRecommendationPicker = openQuoteRecommendationPicker;
    window.openQuoteInfoNote = openQuoteInfoNote;
    window.closeQuoteDialog = closeQuoteDialog;
    window.confirmNewQuote = confirmNewQuote;
    window.startNewQuote = startNewQuote;
    window.saveQuoteDraft = saveQuoteDraft;
    window.toggleQuoteDraftTools = toggleQuoteDraftTools;
    window.updateQuoteDraftName = updateQuoteDraftName;
    window.duplicateQuoteDraft = duplicateQuoteDraft;
    window.confirmDeleteActiveDraft = confirmDeleteActiveDraft;
    window.deleteActiveQuoteDraft = deleteActiveQuoteDraft;
    window.loadQuoteDraft = loadQuoteDraft;
    window.updateQuoteInfo = updateQuoteInfo;
    window.updateQuoteItem = updateQuoteItem;
    window.duplicateQuoteItem = duplicateQuoteItem;
    window.removeQuoteItem = removeQuoteItem;
    window.toggleQuoteLine = toggleQuoteLine;
    window.toggleQuoteSection = toggleQuoteSection;
    window.addThirdPartyCost = addThirdPartyCost;
    window.updateThirdParty = updateThirdParty;
    window.updateThirdPartyClientAmount = updateThirdPartyClientAmount;
    window.removeThirdParty = removeThirdParty;
    window.addQuoteSuggestion = addQuoteSuggestion;
    window.dismissQuoteSuggestion = dismissQuoteSuggestion;
    window.updateQuoteCheck = updateQuoteCheck;
    window.updateVolumeDiscount = updateVolumeDiscount;
    window.updateCustomVolumeDiscount = updateCustomVolumeDiscount;
    window.applyRecommendedVolumeDiscount = applyRecommendedVolumeDiscount;
    window.updateSstMode = updateSstMode;
    window.updateSstPercent = updateSstPercent;
    window.updateOutputSetting = updateOutputSetting;
    window.toggleQuoteTerm = toggleQuoteTerm;
    window.openCustomQuoteItemDialog = openCustomQuoteItemDialog;
    window.submitCustomQuoteItem = submitCustomQuoteItem;
    window.submitQuoteRecommendation = submitQuoteRecommendation;
    window.copyQuoteOutput = copyQuoteOutput;
    window.downloadQuoteCsv = downloadQuoteCsv;
    window.removeServiceFromQuote = removeServiceFromQuote;
    window.openQuoteTray = openQuoteTray;

    document.addEventListener('DOMContentLoaded', () => {
        loadQuote();
        renderQuoteIndicator();
        if (document.getElementById('quote-builder')?.classList.contains('active')) renderQuoteBuilderPage();
    });
})();
