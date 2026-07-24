/**
 * @typedef {Object} RateCardItem
 * @property {string} id
 * @property {string} category
 * @property {string} service
 * @property {number} priceFrom
 * @property {string} billingBasis
 * @property {string} description
 * @property {string} example
 * @property {string=} scopeNote
 * @property {string[]=} tags
 */

const RATE_CARD_CATEGORY_FILTERS = [
    'All',
    'Print & Offline',
    'Digital & Social',
    'Branding',
    'Presentations',
    'Web & UI',
    'Video Editing',
    'Video Production',
    'Photography',
    'AI Images',
    'AI Videos',
    'Copywriting'
];

const RATE_CARD_POPULAR_SERVICE_IDS = [
    'digital-fb-static',
    'digital-carousel',
    'edit-short-under-30',
    'prod-basic-social',
    'ai-video-property-product',
    'ai-video-hybrid-short'
];

const RATE_CARD_CATEGORY_ICONS = {
    'Print & Offline': 'printer',
    'Digital & Social': 'share-2',
    Branding: 'sparkles',
    Presentations: 'presentation',
    'Web & UI': 'monitor-smartphone',
    'Video Editing': 'scissors',
    'Video Production': 'video',
    Photography: 'camera',
    'AI Images': 'image-plus',
    'AI Videos': 'wand-sparkles',
    Copywriting: 'pen-line'
};

const RATE_CARD_COMMERCIAL_TERMS = [
    'Two minor revision rounds are included unless otherwise stated.',
    'Additional revision rounds start from RM300.',
    'Major changes after concept or storyboard approval may incur 30%-50% of the original fee.',
    'Rush requests may incur an additional 30%-50%.',
    'Editable or working files may incur an additional 20%.',
    'Weekend or public holiday production may incur an additional 30%.',
    'Printing, media placement, talent, travel, accommodation, studio rental, permits and third-party assets are quoted separately.',
    'SST is excluded where applicable.'
];

const RATE_CARD_SCENARIO_GROUPS = [
    { id: 'most-common', label: 'Most Common' },
    { id: 'design-adaptation', label: 'Design & Adaptation' },
    { id: 'social-media', label: 'Social Media' },
    { id: 'branding', label: 'Branding' },
    { id: 'web-ui', label: 'Web & UI' },
    { id: 'video-editing', label: 'Video Editing' },
    { id: 'video-production', label: 'Video Production' },
    { id: 'photography', label: 'Photography' },
    { id: 'ai-production', label: 'AI Production' },
    { id: 'copywriting', label: 'Copywriting' },
    { id: 'localisation', label: 'Localisation' },
    { id: 'commercial', label: 'Commercial Charges' },
    { id: 'multi-service', label: 'Multi-Service Projects' }
];

function rcScenario(id, group, request, category, explanation, serviceIds = [], addonServiceIds = [], addonLabels = [], questions = [], chargeTriggers = [], scopeReminder = '', separateQuote = '') {
    return { id, group, request, category, explanation, serviceIds, addonServiceIds, addonLabels, questions, chargeTriggers, scopeReminder, separateQuote };
}

const RATE_CARD_CLASSIFICATION_GUIDE = [
    rcScenario('guide-standard-edit', 'most-common', 'We already have footage. Please edit it.', 'Video Editing & Motion Graphics', 'Use standard video editing when the client supplies the footage and no AI generation or filming is required.', ['edit-short-under-30', 'edit-cutdown'], ['edit-subtitling', 'edit-aspect'], [], ['How much raw footage is supplied?', 'What is the final duration?', 'Is the footage organised?', 'Are subtitles required?', 'Are multiple formats required?', 'Is motion graphics required?'], ['Subtitles, localisation, multiple formats and motion graphics should be charged separately.']),
    rcScenario('guide-resize', 'design-adaptation', 'Use the same approved artwork in another size.', 'Digital Resize / Adaptation', 'Use this when the visual direction, copy, product and composition are already approved and only size adaptation is required.', ['digital-resize'], ['digital-adaptation-package', 'print-adaptation', 'web-adaptation'], ['Additional sizes'], ['How many sizes are required?', 'Is all copy unchanged?', 'Are the images and products unchanged?', 'Is the visual direction already approved?'], ['If the layout, message, product or composition changes significantly, classify it as Creative Adaptation or a new design.']),
    rcScenario('guide-creative-adaptation', 'design-adaptation', 'Use the same design but replace the copy, product and promotion.', 'Creative Adaptation', 'This is more than a simple resize because core content must be replaced or rearranged.', ['digital-adaptation-package'], ['digital-resize', 'copy-social-visual'], ['New design direction if composition changes'], ['How many products or markets?', 'Is the new copy supplied?', 'Does the hierarchy need to change?', 'Are new images required?'], ['Major composition changes require a new design quotation.']),
    rcScenario('guide-adaptation-package', 'design-adaptation', 'Create ten sizes from one approved campaign key visual.', 'Adaptation Package', 'Use an adaptation package when one approved key visual needs multiple standard output sizes.', ['digital-adaptation-package'], ['digital-resize', 'print-adaptation', 'copy-transcreation'], ['Platform-specific layout changes'], ['How many sizes are required?', 'Which platforms are included?', 'Are any print sizes required?', 'Are language versions required?'], ['Complex sizes that require a new composition should not be charged as simple resizing.']),
    rcScenario('guide-editable-files', 'commercial', 'The client wants the editable source file.', 'Editable / Working Files', 'Editable or working files are commercial handover items and should be reviewed before release.', [], [], ['Editable files', 'Font licences', 'Stock assets', 'Third-party licence transfer'], ['Which files are required?', 'Are fonts, stock assets and licences transferable?', 'Does the file contain third-party assets?', 'Is the request for final artwork or full working files?'], ['Editable files may incur an additional percentage based on the commercial terms.']),
    rcScenario('guide-social-static-caption', 'social-media', 'We need one social media visual and a caption.', 'Social Media Static Post + Caption', 'Quote the visual and caption separately unless the approved package already includes copywriting.', ['digital-fb-static', 'copy-caption'], ['copy-social-visual', 'digital-resize'], [], ['Is the caption supplied?', 'Is visual copy required inside the artwork?', 'Are hashtags required?', 'Are additional language versions required?'], ['Do not assume caption writing is included unless the selected design service explicitly includes it.']),
    rcScenario('guide-social-carousel-copy', 'social-media', 'We need five connected social media slides.', 'Social Media Carousel', 'Use carousel design for connected slide visuals and add carousel copywriting when the slide text is not supplied.', ['digital-carousel', 'copy-carousel'], ['digital-carousel-frame', 'copy-transcreation'], [], ['How many frames?', 'Is copy supplied?', 'Is research required?', 'Are additional language versions required?'], ['Extra frames, research and localisation can increase the quote.']),
    rcScenario('guide-monthly-content', 'multi-service', 'We need ten posts every month.', 'Monthly Retainer / Custom Package', 'Bundle the required outputs into a monthly scope rather than quoting one generic item.', [], ['digital-fb-static', 'digital-carousel', 'edit-short-under-30', 'copy-caption'], ['Posting', 'Scheduling', 'Community management', 'Reporting'], ['How many static posts, carousels and videos?', 'Is copywriting included?', 'Is posting included?', 'Is community management included?', 'Is reporting included?', 'Are revisions consolidated monthly?'], ['Posting, scheduling, community management, media buying and reporting are separate unless explicitly included.'], 'Custom package pricing'),
    rcScenario('guide-community-management', 'social-media', 'Please post the content and reply to comments.', 'Social Media Management / Community Management', 'Content production does not automatically include posting, scheduling, inbox management or community response.', [], [], ['Posting', 'Scheduling', 'Community management', 'Reporting'], ['Which platforms are included?', 'How often should posts be scheduled?', 'Who approves replies?', 'Is reporting required?'], ['This is separate from creative production.'], 'Separate quotation required'),
    rcScenario('guide-blog-article', 'copywriting', 'Write a normal educational article.', 'Blog Article Writing', 'Use blog article writing for general editorial or thought-leadership content without detailed SEO research.', ['copy-blog-article'], ['copy-proofreading', 'copy-translation'], ['Expert consultation', 'Original research'], ['What is the topic?', 'What is the word count?', 'Is expert input required?', 'Is original research required?', 'Is SEO optimisation required?'], ['SEO keyword research and interviews are separate.']),
    rcScenario('guide-seo-article', 'copywriting', 'Write an article that should rank on Google.', 'SEO Article Writing', 'Use SEO article writing when the article must follow an agreed keyword and on-page SEO structure.', ['copy-seo-article'], ['copy-proofreading', 'copy-translation'], ['Keyword research', 'Content brief', 'Existing article optimisation', 'Website implementation'], ['Is the primary keyword supplied?', 'Is detailed keyword research required?', 'Who is the target reader?', 'Is metadata required?', 'Who will upload and implement the article?'], ['Full technical SEO, backlink strategy and implementation are separate.']),
    rcScenario('guide-sem-copy', 'copywriting', 'Write Google Search advertisements.', 'SEM Search Ad Copywriting', 'Use SEM Search Ad Copywriting for ad words only: headlines and descriptions for a search ad group or copy set.', ['copy-sem-search-ad'], [], ['Keyword research', 'Google Ads setup', 'Campaign management', 'Media spending', 'Performance optimisation'], ['How many ad groups?', 'Are keywords supplied?', 'How many campaign messages?', 'Is campaign setup required?', 'Is ongoing optimisation required?'], ['Campaign setup, media management, keyword research and media spending are separate.']),
    rcScenario('guide-gdn-copy', 'copywriting', 'Write copy for Google Display advertisements.', 'GDN Display Ad Copywriting', 'Use GDN copywriting for words only. Banner visual design and campaign management are separate scopes.', ['copy-gdn-display-ad'], ['digital-gdn', 'digital-adaptation-package'], ['Media campaign management - separate quotation required'], ['Is copy only required?', 'Is banner design also required?', 'How many campaign messages?', 'Is Google Ads campaign setup required?'], ['GDN Responsive Advertisement Set covers design adaptation, not campaign setup or management.']),
    rcScenario('guide-copy-editing', 'copywriting', 'The client provided rough copy but wants us to improve and rewrite it.', 'Copy Editing / Rewrite', 'This is more extensive than proofreading because wording, structure and message clarity must be improved.', ['copy-social-visual', 'copy-website', 'copy-blog-article'], ['copy-proofreading'], ['Custom quotation may be required'], ['How rough is the copy?', 'How long is the copy?', 'Does the message need restructuring?', 'Is marketing tone required?'], ['If the message must be rewritten, it is not proofreading.']),
    rcScenario('guide-proofreading', 'copywriting', 'Only check the spelling and grammar.', 'Proofreading', 'Use proofreading when the message is already written and only language accuracy needs checking.', ['copy-proofreading'], [], [], ['What is the word count?', 'Which language?', 'Is rewriting required?', 'Is the source final?'], ['If sentences, structure or marketing messaging must be rewritten, it is no longer proofreading.']),
    rcScenario('guide-translation', 'localisation', 'Translate this exactly.', 'Translation', 'Use translation when the approved source copy should retain the same meaning in another language.', ['copy-translation'], ['copy-proofreading'], [], ['What is the word count?', 'Which language pair?', 'Is the source copy final?', 'Is proofreading required?'], ['Changes to meaning or market tone should be transcreation.']),
    rcScenario('guide-transcreation', 'localisation', 'Rewrite this naturally for another country or audience.', 'Transcreation / Marketing Localisation', 'Use transcreation when the message must sound natural and relevant in another language or market.', ['copy-transcreation'], ['copy-translation'], [], ['Which market or country?', 'What tone should it use?', 'Is direct translation enough?', 'Are cultural references involved?'], ['The message may need to change culturally rather than being translated word for word.']),
    rcScenario('guide-edit-cutdown', 'video-editing', 'Create three shorter versions from the approved master video.', 'Master Video Cut-Down', 'Use cut-downs when shorter versions are created from an approved master video.', ['edit-cutdown'], ['edit-aspect', 'edit-subtitling', 'edit-localisation'], ['New end frames'], ['How many versions?', 'What are the durations?', 'Are formats different?', 'Does the message change?'], ['Charge per version unless a package has been approved.']),
    rcScenario('guide-video-aspect', 'video-editing', 'Convert the video into vertical, square and landscape versions.', 'Aspect-Ratio Conversion', 'Use aspect-ratio conversion when approved video content only needs format adaptation.', ['edit-aspect'], ['edit-cutdown', 'edit-subtitling'], [], ['Is simple reframing sufficient?', 'Must text and graphics be rearranged?', 'Are platform-specific durations required?'], ['Major re-editing or restructuring is not a simple aspect-ratio conversion.']),
    rcScenario('guide-video-subtitle-translation', 'localisation', 'Translate and subtitle the video.', 'Translation + Translated Subtitles', 'Use translation for the language work and translated subtitles for timed subtitle application.', ['copy-translation', 'edit-translated-subtitles'], ['edit-localisation', 'ai-video-voiceover', 'ai-video-lip-sync'], ['On-screen text replacement'], ['How many languages?', 'Are subtitle files supplied?', 'Must on-screen text also be replaced?', 'Is voice-over required?', 'Is lip-sync required?'], ['Replacing on-screen graphics or adding lip-sync is separate from subtitle translation.']),
    rcScenario('guide-film-production', 'video-production', 'Your team needs to come and film.', 'Video Production', 'Use video production when our team is responsible for filming, crew, equipment and post-production.', ['prod-basic-social', 'prod-full-day'], ['prod-additional-day', 'prod-camera-operator', 'prod-teleprompter'], ['Talent', 'Transport', 'Permits', 'Special equipment'], ['Filming duration', 'Number of locations', 'Crew size', 'Number of cameras', 'Talent', 'Equipment', 'Transport', 'Final video duration', 'Number of final versions'], ['Production costs increase with locations, crew, equipment, talent and usage needs.']),
    rcScenario('guide-multi-location-shoot', 'video-production', 'We need to film at two or more locations.', 'Video Production with additional location or extended shoot scope', 'Multi-location filming should be scoped beyond a basic production setup.', ['prod-full-day', 'prod-additional-day'], ['prod-camera-operator'], ['Additional filming hours', 'Transport', 'Permits', 'Equipment movement', 'Additional crew'], ['How many locations?', 'Are locations confirmed?', 'Is travel time included?', 'Are permits required?'], ['Additional filming hours, shoot days and logistics are chargeable.']),
    rcScenario('guide-script-change-after-shoot', 'commercial', 'The script changed after filming was completed.', 'Reshoot / Additional Production', 'A client-requested script change after filming may require new production or voice-over fees.', [], ['prod-additional-day', 'prod-human-vo-home', 'prod-ai-vo'], ['Reshoot', 'Additional edit', 'Talent return'], ['Can the change be solved through editing?', 'Is new voice-over sufficient?', 'Must talent return?', 'Is the original location still available?'], ['Changes after filming may require a new production fee.'], 'Subject to incurred cost and project stage'),
    rcScenario('guide-shoot-postponed', 'commercial', 'The confirmed shoot date has been postponed or cancelled.', 'Rescheduling / Cancellation Review', 'Cancellation or postponement should be reviewed against booked crew, studio, talent and work already completed.', [], [], ['Crew cancellation fees', 'Studio cancellation fees', 'Talent cancellation fees', 'Equipment bookings', 'Non-refundable transport'], ['When was it postponed?', 'What has already been booked?', 'Can vendors be rescheduled?', 'What work is already completed?'], ['Fees depend on incurred cost and project stage.'], 'Subject to incurred cost and project stage'),
    rcScenario('guide-brand-kv', 'branding', 'Create a campaign key visual for a launch.', 'Campaign Key Visual', 'Use a campaign key visual when the client needs one main creative direction before rolling out assets.', ['brand-campaign-kv'], ['digital-adaptation-package', 'copy-social-visual'], ['Stock assets', 'Premium illustration', 'Additional campaign routes'], ['Is the campaign direction approved?', 'How many routes are required?', 'Which assets will be rolled out?', 'Are copy and images supplied?'], ['Rollout sizes, copywriting and new routes should be charged separately.']),
    rcScenario('guide-brand-template', 'branding', 'Create reusable social templates for recurring content.', 'Social Media Template Set', 'Use social templates when the client needs reusable layouts for repeated content formats.', ['brand-social-template'], ['copy-caption', 'digital-resize'], ['Editable files'], ['How many templates?', 'Which content formats?', 'Does the client need editable files?', 'Are brand guidelines supplied?'], ['Editable files and extra templates may increase the quote.']),
    rcScenario('guide-web-landing', 'web-ui', 'Design a landing page for a campaign.', 'Landing Page Design', 'Use landing page design when the client needs one campaign or product page design.', ['web-landing-page'], ['copy-website', 'copy-seo-article'], ['Development', 'Forms', 'Tracking setup'], ['Is copy supplied?', 'Is development required?', 'Are forms or tracking included?', 'Is mobile design required?'], ['Development, forms, SEO and tracking are separate unless quoted.']),
    rcScenario('guide-web-breakpoint', 'web-ui', 'Adapt the approved website design for mobile.', 'Website Design Adaptation', 'Use breakpoint adaptation when an approved page design needs another responsive layout.', ['web-adaptation'], ['web-inner-page'], [], ['Which breakpoint is required?', 'Is content unchanged?', 'Are components already approved?'], ['New sections or major content changes are not simple breakpoint adaptation.']),
    rcScenario('guide-photo-property', 'photography', 'Take property or interior photos for marketing.', 'Property / Interior Photography', 'Use property or interior photography when the client needs real location photos for marketing assets.', ['photo-property'], ['photo-retouch-basic', 'photo-manipulation'], ['Transport', 'Permit', 'Additional location'], ['How many locations?', 'How many final images?', 'Is styling required?', 'Are permits needed?'], ['Additional locations, styling, permits and retouching should be scoped separately.']),
    rcScenario('guide-photo-product', 'photography', 'Take product photos for listings or campaign use.', 'Product Photography', 'Use product photography for real SKU images and add lifestyle photography if styling is required.', ['photo-product'], ['photo-lifestyle-product', 'photo-retouch-basic'], ['Props', 'Styling', 'Studio'], ['How many SKUs?', 'Is lifestyle styling required?', 'Are props needed?', 'How many final images?'], ['Styling, props, studio and lifestyle setups are separate from basic product photos.']),
    rcScenario('guide-ai-assisted-light', 'ai-production', 'We have existing footage and only need a few AI enhancements.', 'AI-Assisted Short-Form Video', 'Use this when existing footage or visuals remain the main content and AI only enhances one or two small improvements.', ['ai-video-assisted-short'], ['ai-video-bg-replace', 'ai-video-object-replace'], ['Additional AI scene'], ['How many scenes require AI?', 'Is object removal required?', 'Is background extension required?', 'Are existing assets supplied?', 'Is product accuracy critical?'], ['Multiple generated scenes or complex compositing should use Advanced AI-Assisted Video.']),
    rcScenario('guide-ai-property-product', 'ai-production', 'Create several cinematic scenes from approved property renders.', 'AI-Assisted Property / Product Cinematic Video', 'Use this when approved property renders, photos or product visuals remain the main source but need cinematic AI-assisted motion.', ['ai-video-property-product'], ['ai-video-add-scene', 'ai-video-character-style'], ['Artist-impression disclaimer'], ['How many approved renders?', 'How many AI scenes?', 'Is architectural accuracy required?', 'Are lifestyle characters required?', 'Are facilities shown real or conceptual?', 'Is an artist-impression disclaimer required?'], ['High accuracy or more scenes may require custom quotation.']),
    rcScenario('guide-ai-assisted-advanced', 'ai-production', 'We have existing assets, but several scenes need advanced AI generation or major visual replacement.', 'Advanced AI-Assisted Video', 'Use this when existing assets remain important but several scenes need heavier AI generation, replacement or compositing.', ['ai-video-assisted-advanced'], ['ai-video-add-scene', 'ai-video-bg-replace', 'ai-video-object-replace'], ['Complex compositing'], ['How many scenes require AI?', 'What must be replaced?', 'Is product accuracy critical?', 'Are references approved?'], ['More than five AI scenes or heavy visual effects require custom quotation.']),
    rcScenario('guide-ai-full', 'ai-production', 'No filming is needed. Generate the whole video using AI.', 'Full AI-Generated Video', 'Use this when the complete video is generated without physical filming and does not rely mainly on client-supplied footage.', ['ai-video-full-short', 'ai-video-full-60'], ['ai-video-character-style', 'ai-video-add-scene', 'ai-video-voiceover'], ['Additional formats', 'Additional language'], ['Final duration', 'Number of scenes', 'Character consistency', 'Product consistency', 'Voice-over', 'Required formats', 'Required languages'], ['Complex consistency or product accuracy may increase the quotation.']),
    rcScenario('guide-avatar', 'ai-production', 'Create a virtual presenter reading our script.', 'AI Avatar / Presenter Video', 'Use this when a digital presenter needs to deliver a client-approved script.', ['ai-video-avatar'], ['copy-video-script', 'ai-video-voiceover', 'ai-video-localisation'], [], ['Is the script approved?', 'What language is required?', 'Is localisation required?', 'What format is needed?'], ['Scriptwriting and localisation may be separate.']),
    rcScenario('guide-ai-character', 'ai-production', 'Create the same fictional person across multiple scenes.', 'AI Character-Led Video', 'Use this when the same fictional AI character needs to stay consistent across multiple scenes.', ['ai-video-character'], ['ai-video-character-style', 'ai-video-add-scene'], ['Additional formats', 'Additional language'], ['How many scenes are required?', 'Does the character need the same outfit?', 'Are facial details critical?', 'Is a style development round required?'], ['Initial character or visual-style development may be charged separately.']),
    rcScenario('guide-image-to-video', 'ai-production', 'Animate our existing property render.', 'AI Image-to-Video Animation', 'Use this when an existing still image or render needs AI-generated camera movement or environmental motion.', ['ai-video-image-to-video'], ['ai-video-add-scene'], [], ['Is a high-resolution render supplied?', 'How many scenes?', 'What movement is required?', 'Is exact architecture important?'], ['The client must provide an approved high-resolution image or render.']),
    rcScenario('guide-hybrid-short', 'ai-production', 'Film real footage and add AI-generated scenes.', 'Hybrid Short-Form Video', 'Use this when our team needs to film a short real-world setup and combine it with selected AI-generated scenes.', ['ai-video-hybrid-short'], ['ai-video-add-scene', 'ai-video-character-style', 'edit-aspect', 'copy-translation'], ['Talent', 'Location', 'Transport', 'Additional formats'], ['Filming duration', 'Number of locations', 'Number of AI scenes', 'Final formats', 'Required languages'], ['Third-party production costs are quoted separately.']),
    rcScenario('guide-hybrid-live', 'ai-production', 'We need a 30-60 second shoot combined with multiple AI sequences.', 'Hybrid Live-Action + AI Video', 'Use this when a physical shoot needs to be combined with several AI-generated environments or visual sequences.', ['ai-video-hybrid-live'], ['ai-video-add-scene', 'prod-camera-operator', 'edit-aspect'], ['Talent', 'Location', 'Transport', 'Additional language'], ['How long is the shoot?', 'How many AI scenes?', 'How many locations?', 'Is talent required?', 'How many final formats?'], ['More AI scenes, talent, locations and formats increase the quote.']),
    rcScenario('guide-ai-regen', 'ai-production', 'The client changed an already approved AI scene.', 'AI Scene Regeneration After Approval', 'Regeneration caused by a change to an approved creative direction is chargeable.', ['ai-video-regen-scene'], ['ai-video-add-scene', 'ai-video-revision'], [], ['Was the scene already approved?', 'What changed?', 'How many scenes are affected?'], ['Approved AI scene changes should be charged.']),
    rcScenario('guide-ai-exact-accuracy', 'ai-production', 'The AI visual must reproduce the product or building exactly.', 'Advanced AI Production / Custom Quotation', 'High visual accuracy may require reference preparation, compositing, manual correction and multiple generations.', ['ai-video-assisted-advanced', 'ai-video-property-product'], ['ai-video-character-style'], ['Manual correction', 'Legal disclaimer review'], ['Are approved references supplied?', 'Is exact product geometry required?', 'Is exact architecture required?', 'Are legal disclaimers required?', 'Who approves factual accuracy?'], ['Exact reproduction and legal accuracy should be reviewed before quoting.'], 'Custom quotation may be required'),
    rcScenario('guide-additional-revision', 'commercial', 'The client requests changes after the included revision rounds.', 'Additional Revision Round', 'Charge an additional revision when the included rounds have been used.', ['ai-video-revision'], [], ['Additional revision'], ['How many revision rounds were included?', 'How many have been used?', 'Is the change minor or major?'], ['Two minor revision rounds are included unless otherwise stated.']),
    rcScenario('guide-major-change', 'commercial', 'The client changes the approved concept or storyboard.', 'Major Change After Approval', 'Major changes after approval should be treated as a commercial change, not a normal minor revision.', [], [], ['Major creative change', 'New concept', 'Storyboard rewrite'], ['What was approved?', 'What changed?', 'How much work must be redone?'], ['Major changes may incur an additional percentage of the original fee.']),
    rcScenario('guide-rush', 'commercial', 'The client needs the work urgently.', 'Rush Request', 'Rush requests should be reviewed against team capacity and timeline impact.', [], [], ['Rush fee', 'Weekend fee'], ['What is the deadline?', 'What approvals are required?', 'Can scope be reduced?', 'Does it affect other work?'], ['Rush requests may incur additional charges.']),
    rcScenario('guide-weekend', 'commercial', 'The work must be completed on a weekend or public holiday.', 'Weekend / Public Holiday Production', 'Weekend or public holiday production requires commercial review.', [], [], ['Weekend fee', 'Public holiday fee', 'Crew availability'], ['Which dates are required?', 'Who needs to work?', 'Are vendors involved?'], ['Additional weekend or public holiday charges may apply.']),
    rcScenario('guide-volume-discount', 'commercial', 'The client wants ten or more deliverables.', 'Volume Discount Review', 'Review eligible creative fee subtotal against the volume discount rules before confirming.', [], [], ['Volume discount review'], ['How many deliverables?', 'Are they under one campaign?', 'Are third-party costs included?', 'Is management approval required?'], ['Third-party costs are not eligible for creative volume discounts.']),
    rcScenario('guide-custom-campaign', 'multi-service', 'The project requires design, video, copywriting, adaptation and localisation.', 'Custom Campaign Package', 'Combine all relevant services into a scoped quotation instead of quoting only one base service.', ['digital-campaign-kv', 'copy-transcreation', 'edit-short-under-30', 'digital-adaptation-package'], ['copy-translation', 'edit-aspect', 'copy-caption'], ['Production', 'Media usage', 'Reporting'], ['Total deliverables', 'Formats', 'Languages', 'Timeline', 'Production requirements', 'Approval process', 'Media usage', 'Revision expectations'], ['Multi-service projects should be scoped as packages with clear inclusions and exclusions.'])
];

const RATE_CARD_VOLUME_DISCOUNTS = [
    ['1-4 deliverables', 'Standard rate'],
    ['5-9 deliverables', 'Up to 3% discount'],
    ['10-19 deliverables', '5% discount'],
    ['20 or more deliverables', 'Up to 8%, subject to management approval'],
    ['Monthly retainers', 'Custom package pricing']
].map(([range, value]) => ({ range, value }));

function rcItem(id, category, service, priceFrom, billingBasis, description, example, scopeNote = '', tags = []) {
    return { id, category, service, priceFrom, billingBasis, description, example, scopeNote, tags };
}

const RATE_CARD_CATEGORIES = [
    {
        id: 'print-offline',
        filter: 'Print & Offline',
        title: 'Print & Offline Design',
        description: 'Printed and offline campaign materials prepared for suppliers, events, retail and outdoor placements.',
        items: [
            rcItem('print-magazine-ad', 'Print & Offline', 'Magazine / Newspaper Advertisement', 500, 'Per design', 'A press-ready advertisement layout for magazine or newspaper placement.', 'Create a half-page recruitment advertisement for a business newspaper.', 'Media booking and publication fees are excluded.'),
            rcItem('print-poster', 'Print & Offline', 'Poster - A3, A4 or Equivalent', 500, 'Per design', 'A single poster layout for print display or internal communication.', 'Design an A3 event poster for office notice boards.'),
            rcItem('print-flyer-single', 'Print & Offline', 'Flyer - Single-Sided', 400, 'Per design', 'A one-sided flyer layout for promotional handouts.', 'Create a single-sided school open day flyer.'),
            rcItem('print-flyer-double', 'Print & Offline', 'Flyer - Double-Sided', 600, 'Per design', 'A two-sided flyer layout with front and back information.', 'Design a product promo flyer with offer details on the back.'),
            rcItem('print-brochure', 'Print & Offline', 'Bi-Fold / Tri-Fold Brochure', 800, 'Per design', 'A folded brochure layout for concise product or company information.', 'Create a tri-fold brochure for a property launch.', 'Copywriting and printing are quoted separately.'),
            rcItem('print-booklet-cover', 'Print & Offline', 'Booklet Cover', 500, 'Per design', 'A cover design for a booklet, guide or report.', 'Design the cover for an annual programme booklet.'),
            rcItem('print-booklet-pages', 'Print & Offline', 'Booklet Inner Pages', 150, 'Per page', 'Inner page layout based on approved content and visual style.', 'Lay out a 12-page event booklet.', 'Complex charts or infographics may be quoted separately.'),
            rcItem('print-profile-report', 'Print & Offline', 'Company Profile / Annual Report Layout', 200, 'Per page', 'Page layout for corporate profiles, annual reports or formal documents.', 'Lay out a 30-page company profile from approved copy.'),
            rcItem('print-backdrop', 'Print & Offline', 'Backdrop Banner', 600, 'Per design', 'Large-format backdrop artwork for events, launches or stage areas.', 'Design a stage backdrop for a product launch.'),
            rcItem('print-pull-up', 'Print & Offline', 'Pull-Up Banner', 500, 'Per design', 'Vertical banner artwork for portable roll-up displays.', 'Create a pull-up banner for a trade booth.'),
            rcItem('print-bunting', 'Print & Offline', 'Event Bunting', 400, 'Per design', 'Tall-format event or directional bunting artwork.', 'Design bunting for a university roadshow.'),
            rcItem('print-wall-panel', 'Print & Offline', 'Wall Panel Design', 1000, 'Per design', 'Large wall panel artwork for exhibitions, showrooms or offices.', 'Create a showroom feature wall about product benefits.'),
            rcItem('print-panel-ad', 'Print & Offline', 'Panel Advertisement', 1000, 'Per design', 'Panel-format advertisement for physical placements or display zones.', 'Design a mall panel ad for a sales campaign.'),
            rcItem('print-billboard', 'Print & Offline', 'Billboard / Out-of-Home Advertisement', 1200, 'Per design', 'Large outdoor advertisement artwork with simplified high-impact messaging.', 'Create a roadside billboard for a property campaign.', 'Media placement and site adaptation are excluded.'),
            rcItem('print-standee', 'Print & Offline', 'Standee / Life-Size Cut-Out', 700, 'Per design', 'Freestanding display artwork for events, retail or reception spaces.', 'Design a life-size ambassador standee for a launch.'),
            rcItem('print-table-tent', 'Print & Offline', 'Table Tent / Counter Display', 500, 'Per design', 'Small counter or tabletop promotional display artwork.', 'Create a table tent for a bank branch offer.'),
            rcItem('print-menu', 'Print & Offline', 'Menu / Price List', 800, 'Up to 4 pages', 'Structured menu or price list design for print or PDF use.', 'Design a four-page spa treatment price list.'),
            rcItem('print-certificate', 'Print & Offline', 'Certificate', 300, 'Per design', 'Certificate layout using approved event or brand details.', 'Create a training completion certificate template.'),
            rcItem('print-invite-card', 'Print & Offline', 'Event Invitation Card', 500, 'Per design', 'Invitation card design for print or digital distribution.', 'Design a formal dinner invitation card.'),
            rcItem('print-label', 'Print & Offline', 'Packaging Label / Sticker', 800, 'Per design', 'Label or sticker artwork for product packaging.', 'Create a bottle label for a new beverage SKU.'),
            rcItem('print-packaging', 'Print & Offline', 'Product Packaging Design', 1500, 'Per SKU', 'Packaging artwork for one product SKU based on supplied dieline.', 'Design a box sleeve for a skincare product.', 'Dieline creation, mockups and printing are quoted separately.'),
            rcItem('print-adaptation', 'Print & Offline', 'Print Artwork Adaptation', 150, 'Per size', 'Resize an approved print design to another supplier size.', 'Adapt an A4 poster into A5 and A3 versions.', 'Major layout changes may require a new design quotation.')
        ]
    },
    {
        id: 'digital-social',
        filter: 'Digital & Social',
        title: 'Digital & Social Media Design',
        description: 'Digital campaign assets for social, display, email, marketplaces and always-on content.',
        items: [
            rcItem('digital-fb-static', 'Digital & Social', 'Social Media Static Post', 300, 'Per design', 'A static social media visual for one approved message.', 'Design an Instagram post announcing a new package.'),
            rcItem('digital-story', 'Digital & Social', 'Facebook / Instagram Story', 300, 'Per design', 'Vertical story artwork for social media placement.', 'Create a story visual for a flash sale.'),
            rcItem('digital-linkedin', 'Digital & Social', 'LinkedIn Static Post', 400, 'Per design', 'A professional static post sized for LinkedIn feed.', 'Design a LinkedIn post for a corporate partnership announcement.'),
            rcItem('digital-carousel', 'Digital & Social', 'Social Media Carousel', 600, 'Up to 5 frames', 'Connected social slides designed to explain one topic or campaign message.', 'Create a five-slide Instagram carousel explaining insurance benefits.'),
            rcItem('digital-carousel-frame', 'Digital & Social', 'Additional Carousel Frame', 150, 'Per frame', 'Extra carousel slide added to an existing carousel set.', 'Add two more slides to a product explainer carousel.'),
            rcItem('digital-cover', 'Digital & Social', 'Social Media Cover / Header', 500, 'Per design', 'Profile header artwork for social pages or campaign periods.', 'Create a Facebook cover for a festive campaign.'),
            rcItem('digital-thumbnail', 'Digital & Social', 'Social Media Thumbnail', 250, 'Per design', 'Thumbnail artwork for a video, reel or content listing.', 'Design a YouTube thumbnail for an interview clip.'),
            rcItem('digital-edm-header', 'Digital & Social', 'EDM Header Banner', 500, 'Per design', 'Top banner artwork for an email campaign.', 'Create an email hero banner for a product launch.'),
            rcItem('digital-edm-full', 'Digital & Social', 'Full EDM Design', 800, 'Per EDM', 'Complete email design layout using approved copy and sections.', 'Design a full promotional email for a membership offer.', 'HTML coding is excluded unless quoted separately.'),
            rcItem('digital-infographic', 'Digital & Social', 'Infographic', 800, 'Per design', 'A visual explanation of data, process or key information.', 'Summarise survey findings into one infographic.'),
            rcItem('digital-advertorial-design', 'Digital & Social', 'Advertorial Design', 1200, 'Per design', 'Editorial-style article layout for digital or print distribution.', 'Design a sponsored article about a healthcare service.'),
            rcItem('digital-web-banner', 'Digital & Social', 'Web Banner', 400, 'Per size', 'Banner artwork for a website, landing page or media placement.', 'Create a homepage banner for a new promotion.'),
            rcItem('digital-gdn', 'Digital & Social', 'GDN Responsive Advertisement Set', 600, 'Two formats', 'Display ad set prepared for Google responsive placements.', 'Create square and landscape ads for remarketing.'),
            rcItem('digital-gif', 'Digital & Social', 'GIF / Simple Animated Post', 800, 'Per output', 'Simple looped animation based on approved design elements.', 'Animate text and product image for a social promo.'),
            rcItem('digital-campaign-kv', 'Digital & Social', 'Digital Campaign Key Visual', 2000, 'Per direction', 'Main visual direction for a digital campaign rollout.', 'Create a key visual for a bank acquisition campaign.'),
            rcItem('digital-ecommerce', 'Digital & Social', 'E-Commerce Product Listing Visual', 400, 'Per design', 'Marketplace product image designed for listing or promotion.', 'Create a Shopee product listing visual for a bundle.'),
            rcItem('digital-marketplace-banner', 'Digital & Social', 'Marketplace Store Banner', 600, 'Per design', 'Storefront banner artwork for e-commerce marketplace pages.', 'Design a Lazada store banner for payday sale.'),
            rcItem('digital-invite', 'Digital & Social', 'Digital Invitation / E-Card', 400, 'Per design', 'Digital invitation artwork for email, chat or social sharing.', 'Create an e-card for a webinar invitation.'),
            rcItem('digital-wallpaper', 'Digital & Social', 'Wallpaper / Screensaver', 400, 'Per design', 'Screen artwork for desktop, kiosk or internal display use.', 'Design an office monitor screensaver for a campaign.'),
            rcItem('digital-resize', 'Digital & Social', 'Digital Resize / Adaptation', 100, 'Per size', 'Resize an approved digital design to another platform size.', 'Adapt a square post into story format.', 'New design direction is not included.'),
            rcItem('digital-adaptation-package', 'Digital & Social', 'Adaptation Package', 400, 'Up to 5 sizes', 'A small bundle of resizes from one approved master design.', 'Resize one campaign visual into five media sizes.')
        ]
    },
    {
        id: 'branding',
        filter: 'Branding',
        title: 'Branding & Campaign Design',
        description: 'Brand identity, campaign systems, reusable templates, visual directions and brand assets.',
        items: [
            rcItem('brand-logo-refresh', 'Branding', 'Logo Refresh', 2500, 'Per project', 'Refine an existing logo without changing the core brand identity.', 'Modernise an old logo while keeping its original symbol.'),
            rcItem('brand-new-logo', 'Branding', 'New Logo Design', 3500, 'Per project', 'Create a new logo direction for a brand, product or campaign.', 'Design a logo for a new property sub-brand.'),
            rcItem('brand-mini-guide', 'Branding', 'Mini Brand Guide', 5000, 'Per project', 'Basic rules for logo usage, colours, typography and sample applications.', 'Prepare brand usage rules for a startup launch.'),
            rcItem('brand-full-guide', 'Branding', 'Full Brand Guidelines', 10000, 'Per project', 'Comprehensive identity system covering usage, tone and applications.', 'Create full guidelines for a regional corporate rebrand.'),
            rcItem('brand-campaign-kv', 'Branding', 'Campaign Key Visual', 2000, 'Per direction', 'Main visual direction for a campaign concept.', 'Develop the launch visual for a graduate programme.'),
            rcItem('brand-visual-system', 'Branding', 'Campaign Visual System', 5000, 'Per campaign', 'A set of campaign design rules and rollout examples.', 'Build a campaign system for social, banners and event displays.'),
            rcItem('brand-social-template', 'Branding', 'Social Media Template Set', 1500, 'Up to 5 templates', 'Reusable social layouts for recurring content formats.', 'Create templates for tips, quotes, announcements and promos.'),
            rcItem('brand-icon-set', 'Branding', 'Custom Icon Set', 1500, 'Up to 10 icons', 'A set of custom icons in one visual style.', 'Create icons for product features on a landing page.'),
            rcItem('brand-illustration', 'Branding', 'Custom Illustration', 800, 'Per illustration', 'A bespoke illustration for a specific message or layout.', 'Illustrate a customer journey for a brochure.'),
            rcItem('brand-mascot', 'Branding', 'Mascot / Character Design', 3000, 'Per character', 'Design a mascot or character with basic visual direction.', 'Create a friendly mascot for a learning campaign.'),
            rcItem('brand-stationery', 'Branding', 'Stationery Design Set', 1500, 'Per set', 'Business card, letterhead and related stationery layouts.', 'Create stationery for a refreshed corporate identity.'),
            rcItem('brand-presentation-template', 'Branding', 'Brand Presentation Template', 2500, 'Up to 10 master layouts', 'Reusable presentation layouts based on brand rules.', 'Create branded master slides for sales presentations.')
        ]
    },
    {
        id: 'presentations',
        filter: 'Presentations',
        title: 'Presentation & Document Design',
        description: 'Decks, reports, proposals and editable document templates for business communication.',
        items: [
            rcItem('pres-template', 'Presentations', 'Presentation Template Design', 2500, 'Up to 10 master slides', 'Reusable slide masters for consistent presentation creation.', 'Create master slides for quarterly business reviews.'),
            rcItem('pres-standard-slide', 'Presentations', 'Standard Presentation Slide', 150, 'Per slide', 'Clean slide layout using existing content and simple visuals.', 'Design one agenda or section divider slide.'),
            rcItem('pres-complex-slide', 'Presentations', 'Complex Presentation Slide', 300, 'Per slide', 'Slide design with heavier diagrams, charts or visual hierarchy.', 'Design a market landscape slide with multiple data points.'),
            rcItem('pres-pitch-deck', 'Presentations', 'Pitch Deck Design', 3000, 'Up to 20 slides', 'A polished deck for proposals, sales or investor presentations.', 'Design a 20-slide agency proposal deck.'),
            rcItem('pres-report-layout', 'Presentations', 'Proposal / Report Layout', 180, 'Per page', 'Structured page design for formal reports or proposals.', 'Lay out a 15-page partnership proposal.'),
            rcItem('pres-company-profile', 'Presentations', 'Company Profile Design', 200, 'Per page', 'Corporate profile page layout using approved copy and assets.', 'Design a 12-page company profile PDF.'),
            rcItem('pres-chart', 'Presentations', 'Chart / Data Visualisation', 300, 'Per chart', 'Convert data into a clean chart or diagram.', 'Create a revenue comparison chart for a report.'),
            rcItem('pres-interactive-pdf', 'Presentations', 'Interactive PDF', 1500, 'Per document', 'PDF with clickable navigation, links or simple interactive structure.', 'Create a clickable proposal PDF with section tabs.'),
            rcItem('pres-editable-template', 'Presentations', 'Editable Document Template', 1000, 'Per template', 'Reusable document template prepared for team editing.', 'Create an editable quotation template in brand style.')
        ]
    },
    {
        id: 'web-ui',
        filter: 'Web & UI',
        title: 'Web & UI Design',
        description: 'Design-only digital interfaces for landing pages, websites, microsites and product screens.',
        note: 'Design only. Development is excluded unless separately quoted.',
        items: [
            rcItem('web-landing-page', 'Web & UI', 'Landing Page Design', 3000, 'Per page', 'A single campaign or product landing page design.', 'Design a landing page for a webinar registration campaign.', 'Development and forms are excluded.'),
            rcItem('web-homepage', 'Web & UI', 'Website Homepage Design', 1500, 'Per page', 'Homepage layout and visual direction for a website.', 'Design a corporate homepage for a services company.'),
            rcItem('web-inner-page', 'Web & UI', 'Website Inner Page Design', 1000, 'Per page', 'Secondary website page following an approved homepage direction.', 'Design About Us and Services pages.'),
            rcItem('web-microsite', 'Web & UI', 'Microsite Design', 5000, 'Up to 5 pages', 'Small website design for a campaign or focused product experience.', 'Design a five-page microsite for a launch campaign.'),
            rcItem('web-ui-screen', 'Web & UI', 'Mobile App / Web UI Screen', 800, 'Per screen', 'One interface screen for an app, portal or web tool.', 'Design a dashboard screen for a customer portal.'),
            rcItem('web-wireframe', 'Web & UI', 'Wireframe Design', 500, 'Per screen', 'Low-fidelity layout structure before detailed visual design.', 'Map the structure for a checkout page.'),
            rcItem('web-email-template', 'Web & UI', 'Email Template Design', 800, 'Per template', 'Reusable email layout design for marketing or communication.', 'Design a newsletter template for monthly updates.'),
            rcItem('web-banner-set', 'Web & UI', 'Website Banner Set', 800, 'Up to 3 banners', 'A small set of website banners in one campaign style.', 'Create three homepage carousel banners.'),
            rcItem('web-design-system', 'Web & UI', 'UI Design System', 5000, 'Per project', 'Reusable UI components, styles and usage rules for digital products.', 'Create buttons, cards and forms for an internal portal.'),
            rcItem('web-adaptation', 'Web & UI', 'Website Design Adaptation', 500, 'Per breakpoint', 'Adapt an approved page design for another responsive breakpoint.', 'Adapt a desktop landing page into mobile view.')
        ]
    },
    {
        id: 'video-editing',
        filter: 'Video Editing',
        title: 'Video Editing & Motion Graphics',
        description: 'Post-production, cut-downs, captions, animation, grading and localisation using supplied or approved footage.',
        items: [
            rcItem('edit-short-under-30', 'Video Editing', 'Short-Form Video Editing', 1000, 'Under 30 seconds', 'Edit supplied footage into a short social-ready video.', 'Turn event clips into a 20-second reel.', 'Filming is excluded.'),
            rcItem('edit-30-60', 'Video Editing', 'Video Editing - 30-60 Seconds', 1800, 'Per video', 'Edit supplied footage into a 30 to 60 second video.', 'Create a 45-second product highlight from client footage.'),
            rcItem('edit-1-3', 'Video Editing', 'Video Editing - 1-3 Minutes', 2500, 'Per video', 'Edit supplied footage into a longer explanatory or corporate video.', 'Create a two-minute interview video from recorded footage.'),
            rcItem('edit-long-form', 'Video Editing', 'Long-Form Video Editing - 3-10 Minutes', 4000, 'Per video', 'Edit longer supplied footage into a structured final video.', 'Edit a 7-minute training video from workshop footage.'),
            rcItem('edit-cutdown', 'Video Editing', 'Master Video Cut-Down', 700, 'Per version', 'A shorter version created from an already approved master video.', 'Turn a 60-second campaign video into a 15-second ad.', 'Major restructuring or new scenes may require a separate quotation.'),
            rcItem('edit-recap', 'Video Editing', 'Highlight / Recap Edit', 1500, 'Up to 60 seconds', 'A concise recap video from event or activity footage.', 'Create a 60-second highlight from roadshow footage.'),
            rcItem('edit-subtitling', 'Video Editing', 'Subtitling and Captioning', 150, 'Per minute, per language', 'Add timed subtitles or captions to an approved video.', 'Add English captions to a three-minute interview.'),
            rcItem('edit-translated-subtitles', 'Video Editing', 'Translated Subtitles', 350, 'Per minute, per language', 'Translate and apply subtitles to an approved video.', 'Add Mandarin subtitles to an English product video.'),
            rcItem('edit-motion-titles', 'Video Editing', 'Motion Graphics / Animated Titles', 600, 'Per video', 'Animated text, title cards or simple graphic elements.', 'Add animated section titles to a corporate video.'),
            rcItem('edit-motion-30', 'Video Editing', 'Motion Graphics Video - Up to 30 Seconds', 3500, 'Per video', 'A short video built mainly from animated graphics.', 'Create a 30-second animated promo about a new plan.'),
            rcItem('edit-2d-explainer', 'Video Editing', '2D Animated Explainer - Up to 60 Seconds', 6000, 'Per video', 'A one-minute explainer using 2D animation and graphics.', 'Explain a claim process with animated icons and scenes.'),
            rcItem('edit-3d-animation', 'Video Editing', '3D Animation - Up to 10 Seconds', 5000, 'Per sequence', 'A short 3D animated sequence for a product or scene.', 'Animate a product part rotating for a launch video.'),
            rcItem('edit-logo-animation', 'Video Editing', 'Logo Animation', 1000, 'Per animation', 'Animate an approved logo for video intros or outros.', 'Create a five-second animated logo reveal.'),
            rcItem('edit-product-animation', 'Video Editing', 'Product Animation', 3500, 'Per sequence', 'Animate a product visual or model for video use.', 'Animate a device opening to show key features.'),
            rcItem('edit-localisation', 'Video Editing', 'Video Localisation', 500, 'Per language', 'Adapt text, graphics or basic language elements for another market.', 'Change English supers to Bahasa Malaysia.'),
            rcItem('edit-aspect', 'Video Editing', 'Aspect-Ratio Conversion', 300, 'Per format', 'Adapt an approved video into another screen format.', 'Convert a 16:9 video into 9:16 story format.'),
            rcItem('edit-thumbnail', 'Video Editing', 'Video Thumbnail', 250, 'Per design', 'Thumbnail artwork for a video or platform listing.', 'Create a thumbnail for a webinar recording.'),
            rcItem('edit-basic-colour', 'Video Editing', 'Basic Colour Correction', 500, 'Per video', 'Basic exposure and colour balancing for a video.', 'Correct indoor footage that looks slightly too yellow.'),
            rcItem('edit-grading', 'Video Editing', 'Advanced Colour Grading', 1000, 'Per video', 'More polished colour treatment for a specific visual mood.', 'Grade a campaign video for a premium cinematic look.'),
            rcItem('edit-audio-clean', 'Video Editing', 'Audio Cleaning and Enhancement', 300, 'Per video', 'Basic cleanup of noise, levels and clarity.', 'Reduce room noise in an interview recording.')
        ]
    },
    {
        id: 'video-production',
        filter: 'Video Production',
        title: 'Video Production',
        description: 'Live-action filming, crew, equipment and post-production for corporate, social, event and product videos.',
        items: [
            rcItem('prod-basic-social', 'Video Production', 'Basic Indoor Social Video Production', 1000, 'Basic indoor shoot', 'Small-scale indoor shoot and simple edit for short social content.', 'Film a simple product demo at the client office.', 'Single indoor setup only. Talent, permits, travel and special equipment are excluded.'),
            rcItem('prod-full-day', 'Video Production', 'Full-Day Video Production', 7000, 'One shoot day', 'Full-day filming with standard crew and post-production.', 'Film interviews and b-roll across one office location.'),
            rcItem('prod-indoor-corporate', 'Video Production', 'Indoor Corporate / Interview Video', 8000, 'Per video', 'Corporate or interview video filmed indoors with planned setup.', 'Film a CEO message with supporting office footage.'),
            rcItem('prod-outdoor-corporate', 'Video Production', 'Outdoor Corporate Video', 10000, 'Per video', 'Outdoor corporate video requiring more planning and logistics.', 'Film a factory or project site corporate video.'),
            rcItem('prod-event-highlight', 'Video Production', 'Event Highlight Video', 5000, 'Half-day coverage', 'Film and edit highlights from an event or activation.', 'Create a recap video from a half-day launch event.'),
            rcItem('prod-talking-head', 'Video Production', 'Talking-Head / Testimonial Video', 4000, 'Half-day production', 'Simple filmed spokesperson or testimonial video.', 'Film two customer testimonials in one location.'),
            rcItem('prod-demo', 'Video Production', 'Product Demonstration Video', 5000, 'Per video', 'Filmed video showing how a product works.', 'Demonstrate a device setup process on camera.'),
            rcItem('prod-recruitment', 'Video Production', 'Recruitment / Employer Branding Video', 8000, 'Per video', 'Recruitment-focused film using people, workplace and story.', 'Film employees sharing why they joined the company.'),
            rcItem('prod-livestream', 'Video Production', 'Live-Streaming Production', 6000, 'Half-day production', 'Basic live-stream setup and production support.', 'Stream a townhall with camera and audio setup.'),
            rcItem('prod-additional-day', 'Video Production', 'Additional Shoot Day', 5000, 'Per day', 'Extra production day added to an existing shoot plan.', 'Add a second day to film another location.'),
            rcItem('prod-camera-operator', 'Video Production', 'Additional Camera Operator', 1500, 'Per day', 'Extra camera operator for wider coverage or multi-angle filming.', 'Add a second camera operator for a panel session.'),
            rcItem('prod-teleprompter', 'Video Production', 'Teleprompter Setup', 500, 'Per shoot', 'Teleprompter equipment and setup for scripted delivery.', 'Use a teleprompter for a leadership announcement.'),
            rcItem('prod-ai-vo', 'Video Production', 'AI Voice-Over', 400, 'Up to 60 seconds', 'AI-generated voice-over from an approved script.', 'Create an English AI voice-over for a product video.'),
            rcItem('prod-human-vo-home', 'Video Production', 'Human Voice-Over - Home Studio', 1200, 'Up to 60 seconds', 'Voice-over recorded by a human talent in a home studio.', 'Record a warm narration for a social video.', 'Usage rights may vary by talent.'),
            rcItem('prod-human-vo-pro', 'Video Production', 'Professional Studio Voice-Over', 2000, 'Excluding usage rights', 'Professional studio voice-over recording with voice talent.', 'Record a broadcast-quality narration for a campaign film.', 'Studio fees and usage rights may be quoted separately.')
        ]
    },
    {
        id: 'photography',
        filter: 'Photography',
        title: 'Photography',
        description: 'Corporate, product, event, interior and retouching services for campaign and business use.',
        items: [
            rcItem('photo-corporate', 'Photography', 'Corporate Photography', 2500, 'Half-day', 'Professional photography for people, workplace or corporate content.', 'Photograph office environment and leadership portraits.'),
            rcItem('photo-full-day', 'Photography', 'Full-Day Photography', 4500, 'Full day', 'Full-day photography coverage for larger shot lists.', 'Photograph multiple departments and activities in one day.'),
            rcItem('photo-event', 'Photography', 'Event Photography', 2500, 'Half-day', 'Photography coverage for events, launches or activations.', 'Cover a half-day media launch.'),
            rcItem('photo-headshot', 'Photography', 'Corporate Headshot', 500, 'Per person', 'Professional profile portrait for business use.', 'Photograph one executive for LinkedIn and profile use.'),
            rcItem('photo-product', 'Photography', 'Product Photography', 150, 'Per SKU', 'Basic product photography for one SKU.', 'Shoot a packshot of one supplement bottle.', 'Styling and props may be quoted separately.'),
            rcItem('photo-lifestyle-product', 'Photography', 'Lifestyle Product Photography', 3000, 'Half-day', 'Styled product photography in a lifestyle setting.', 'Photograph skincare products in a bathroom setup.'),
            rcItem('photo-property', 'Photography', 'Property / Interior Photography', 2500, 'Per location', 'Interior or property photography for marketing use.', 'Photograph a showroom, lobby and sample unit.'),
            rcItem('photo-retouch-basic', 'Photography', 'Basic Photo Retouching', 80, 'Per image', 'Basic cleanup, colour correction and minor touch-ups.', 'Clean dust marks from product photos.'),
            rcItem('photo-manipulation', 'Photography', 'Advanced Photo Manipulation', 300, 'Per image', 'More complex image editing or compositing work.', 'Combine multiple images into one polished hero visual.')
        ]
    },
    {
        id: 'ai-images',
        filter: 'AI Images',
        title: 'AI Image Production',
        description: 'AI-generated visuals, enhancement, extensions, characters and campaign image sets.',
        items: [
            rcItem('ai-img-standard', 'AI Images', 'Standard AI-Generated Image', 500, 'Per final image', 'A final image generated using AI from an approved direction.', 'Generate a lifestyle image for a service campaign.', 'Prompt exploration before approval may affect scope.', ['ai']),
            rcItem('ai-img-kv', 'AI Images', 'AI Campaign Key Visual', 1500, 'Per direction', 'AI-generated main visual direction for a campaign.', 'Create a futuristic key visual for a technology campaign.', '', ['ai']),
            rcItem('ai-img-product-property', 'AI Images', 'AI Product / Property Visual', 1200, 'Per final image', 'AI visual based on approved product or property references.', 'Create an AI lifestyle scene using a supplied property render.', 'Accuracy depends on reference quality.', ['ai']),
            rcItem('ai-img-character-dev', 'AI Images', 'AI Character Development', 1200, 'Per character direction', 'Develop the look of a consistent AI character.', 'Create an AI property agent character direction.', '', ['ai']),
            rcItem('ai-img-character-set', 'AI Images', 'Consistent AI Character Set', 2500, 'Up to 5 images', 'A set of images using the same approved AI character.', 'Show the same character in office, home and outdoor scenes.', '', ['ai']),
            rcItem('ai-img-social-set', 'AI Images', 'AI Social Visual Set', 2500, 'Up to 5 visuals', 'A small set of AI visuals for one social campaign.', 'Generate five visuals for a festive promo campaign.', '', ['ai']),
            rcItem('ai-img-enhancement', 'AI Images', 'AI Image Enhancement / Extension', 400, 'Per image', 'Improve, expand or refine an existing image using AI.', 'Extend a product photo background for a banner.', '', ['ai']),
            rcItem('ai-img-bg-replace', 'AI Images', 'AI Background Replacement', 300, 'Per image', 'Replace an image background with an AI-generated environment.', 'Place a product in a premium kitchen scene.', '', ['ai']),
            rcItem('ai-img-regeneration', 'AI Images', 'Additional AI Image Regeneration', 250, 'Per approved direction', 'Regenerate an AI image after a direction has been approved.', 'Create another variation of an approved campaign visual.', '', ['ai'])
        ]
    },
    {
        id: 'ai-videos',
        filter: 'AI Videos',
        title: 'AI Video Production',
        description: 'AI-assisted, fully AI-generated and hybrid live-action video services for modern production workflows.',
        note: 'Hybrid starting rates assume a basic production setup. Professional talent, make-up, wardrobe, studio rental, venue fees, specialised equipment, props, transport, permits, accommodation, premium music and third-party assets are quoted separately.',
        items: [
            rcItem('ai-video-image-to-video', 'AI Videos', 'AI Image-to-Video Animation', 600, 'Up to 10 seconds and 2 scenes', 'An existing image, render or product visual is animated using AI-generated camera movement or environmental motion.', 'Animate a property exterior render with moving clouds, trees and a slow camera push-in.', 'The client must provide an approved high-resolution image or render.', ['ai', 'assisted']),
            rcItem('ai-video-assisted-short', 'AI Videos', 'AI-Assisted Short-Form Video', 1800, 'Under 30 seconds', 'The client provides the main footage, images or renders. AI is used only to enhance or transform selected parts of the video.', 'Edit an existing property reel and use AI to extend the background, remove an unwanted object or generate one transition scene.', 'Starting scope: client assets, standard editing, up to 1-2 AI-enhanced scenes, simple object removal or background extension, basic music and subtitles, and two minor revision rounds. Multiple generated scenes or complex compositing should use Advanced AI-Assisted Video.', ['ai', 'assisted']),
            rcItem('ai-video-assisted-advanced', 'AI Videos', 'Advanced AI-Assisted Video', 2500, 'Under 30-45 seconds', 'Existing footage, photos or renders remain the main assets, but multiple scenes require heavier AI generation, visual replacement or compositing.', 'Create a property marketing video using approved renders, then generate several cinematic lifestyle, interior and environmental scenes around them.', 'Starting scope: up to 3-5 AI-generated or AI-enhanced scenes, environment replacement, visual cleanup, compositing, music, subtitles, sound design and two minor revision rounds. More than five AI scenes require a custom quote.', ['ai', 'assisted']),
            rcItem('ai-video-property-product', 'AI Videos', 'AI-Assisted Property / Product Cinematic Video', 2500, 'Up to 45 seconds', 'A cinematic AI-assisted video created mainly from approved property renders, photographs or product images.', 'Turn static property renders into a cinematic social video showing exterior movement, interior transitions and lifestyle environments.', 'Starting scope: approved property renders, photos or product visuals, up to 3-5 AI-generated or enhanced scenes, cinematic camera movement, editing, music, sound design, basic on-screen copy or subtitles and two minor revision rounds.', ['ai', 'assisted']),
            rcItem('ai-video-full-short', 'AI Videos', 'Full AI-Generated Video', 3000, 'Under 30 seconds and up to 6 scenes', 'The complete video is generated without physical filming and does not rely mainly on client-supplied footage.', 'Create a futuristic technology advertisement entirely using AI-generated environments, subjects and motion.', 'Starting scope: one approved creative direction, basic script and storyboard, up to 6 AI-generated scenes, AI voice-over where required, editing, music, sound design and two minor revision rounds.', ['ai', 'ai-only']),
            rcItem('ai-video-full-60', 'AI Videos', 'Full AI-Generated Video', 3500, '30-60 seconds and up to 10 scenes', 'A longer fully AI-generated video containing multiple environments, visual sequences, transitions and supporting audio.', 'Create a 45-second brand film showing several AI-generated locations, products or characters.', 'Complex character consistency, highly accurate product replication or advanced visual effects may require a higher quotation.', ['ai', 'ai-only']),
            rcItem('ai-video-avatar', 'AI Videos', 'AI Avatar / Presenter Video', 1000, 'Up to 60 seconds', 'A digital presenter delivers an approved client script.', 'A virtual presenter explains a mobile plan in a social media video.', '', ['ai', 'ai-only']),
            rcItem('ai-video-explainer', 'AI Videos', 'AI Explainer Video', 3000, 'Up to 60 seconds', 'AI-generated visuals, graphics and voice-over explain a product, service or process.', 'Explain a mortgage application process using AI scenes and supporting animated information.', '', ['ai', 'ai-only']),
            rcItem('ai-video-character', 'AI Videos', 'AI Character-Led Video', 3500, 'Under 30 seconds', 'The same fictional AI character is maintained across multiple video scenes.', 'An AI property agent introduces several areas of a home while maintaining the same appearance and outfit.', 'Initial character or visual-style development may be charged separately.', ['ai', 'ai-only']),
            rcItem('ai-video-hybrid-short', 'AI Videos', 'Hybrid Short-Form Video', 3500, 'Under 30 seconds', 'Our team films real footage and combines it with selected AI-generated scenes or visual transformations.', 'Film a property agent opening a showroom door and transition into an AI-generated fully furnished apartment.', 'Starting scope: short filming session, one location, one videographer, basic camera, lighting and audio, up to 2-3 AI-generated or enhanced scenes, editing, simple sound design and two minor revision rounds.', ['ai', 'hybrid']),
            rcItem('ai-video-hybrid-live', 'AI Videos', 'Hybrid Live-Action + AI Video', 4500, '30-60 seconds', 'A physical production shoot is combined with several AI-generated visual sequences or environments.', 'Film a spokesperson explaining a project while AI-generated property and lifestyle scenes appear around them.', 'Starting scope: half-day filming, one location, basic production crew, up to 4-6 AI-generated or enhanced scenes, editing, music, subtitles, sound design and two minor revision rounds.', ['ai', 'hybrid']),
            rcItem('ai-video-hybrid-campaign', 'AI Videos', 'Hybrid Campaign Film', 6500, '60-90 seconds', 'A larger campaign production combining live-action filming, AI-generated scenes and more advanced post-production.', 'Combine employee interviews and office footage with futuristic AI-generated working environments.', 'Starting rates assume a basic production setup. External production costs are quoted separately.', ['ai', 'hybrid']),
            rcItem('ai-video-hybrid-property', 'AI Videos', 'Hybrid Property Cinematic Video', 4500, 'Up to 60 seconds', 'Real property, showroom or talent footage is combined with AI-generated interior, exterior or lifestyle visualisations.', 'Film a real showroom and use AI to visualise future landscaping, interiors or facilities.', 'Starting rates assume a basic production setup. External production costs are quoted separately.', ['ai', 'hybrid']),
            rcItem('ai-video-hybrid-product', 'AI Videos', 'Hybrid Product Commercial', 4500, 'Up to 60 seconds', 'A real product is filmed and combined with AI-generated backgrounds, environments or visual effects.', 'Film a real device and transition it through several AI-generated environments.', 'Starting rates assume a basic production setup. External production costs are quoted separately.', ['ai', 'hybrid']),
            rcItem('ai-video-hybrid-recruitment', 'AI Videos', 'Hybrid Recruitment / Employer Branding Video', 5000, 'Up to 60 seconds', 'Real employee or talent footage is combined with AI-supported storytelling and visual sequences.', 'Film an employee speaking and transition into AI-generated scenes illustrating their career journey.', 'Starting rates assume a basic production setup. External production costs are quoted separately.', ['ai', 'hybrid']),
            rcItem('ai-video-character-style', 'AI Videos', 'Consistent AI Character / Style Development', 1000, 'Initial setup', 'Initial development of consistent AI character or visual style.', 'Develop a recurring AI ambassador before video production.', '', ['ai', 'add-on']),
            rcItem('ai-video-add-scene', 'AI Videos', 'Additional AI-Generated Scene', 300, 'Per 5-8 second scene', 'Extra AI-generated scene added to an approved video scope.', 'Add one more AI interior scene to a property video.', '', ['ai', 'add-on']),
            rcItem('ai-video-regen-scene', 'AI Videos', 'AI Scene Regeneration After Approval', 200, 'Per scene', 'Regenerate an approved AI scene after direction approval.', 'Regenerate a lobby scene after client changes the mood.', '', ['ai', 'add-on']),
            rcItem('ai-video-bg-replace', 'AI Videos', 'AI Background Replacement', 500, 'Per scene', 'Replace a video scene background using AI.', 'Change an office background into a showroom setting.', '', ['ai', 'add-on']),
            rcItem('ai-video-object-replace', 'AI Videos', 'AI Object Addition / Replacement', 300, 'Per scene', 'Add or replace objects in a video scene using AI.', 'Add a product display into an existing scene.', '', ['ai', 'add-on']),
            rcItem('ai-video-voiceover', 'AI Videos', 'AI Voice-Over', 500, 'Up to 60 seconds', 'Generate voice-over audio from an approved script.', 'Create a Bahasa Malaysia voice-over for a short video.', '', ['ai', 'add-on']),
            rcItem('ai-video-localisation', 'AI Videos', 'AI Video Localisation', 500, 'Per language', 'Adapt an approved video for another language market.', 'Localise an English video into Mandarin.', '', ['ai', 'add-on']),
            rcItem('ai-video-lip-sync', 'AI Videos', 'AI Lip-Sync Adaptation', 500, 'Per language', 'Match visible mouth movement to a new language audio track.', 'Adapt an English presenter video into Mandarin with lip-sync.', '', ['ai', 'add-on']),
            rcItem('ai-video-aspect', 'AI Videos', 'AI Video Aspect-Ratio Adaptation', 100, 'Per simple format', 'Adapt an approved AI video into another aspect ratio.', 'Convert an AI video from 16:9 to 9:16.', '', ['ai', 'add-on']),
            rcItem('ai-video-revision', 'AI Videos', 'Additional Revision Round', 300, 'Per round', 'Extra revision round beyond the included scope.', 'Client requests another AI scene revision after approval.', '', ['ai', 'add-on'])
        ]
    },
    {
        id: 'copywriting',
        filter: 'Copywriting',
        title: 'Copywriting & Localisation',
        description: 'Writing, script, translation, proofreading and localisation support for creative deliverables.',
        note: 'Standalone copywriting rates should only be charged when copywriting is not already included in another selected service.',
        items: [
            rcItem('copy-social-visual', 'Copywriting', 'Social Media Visual Copy', 150, 'Per post', 'Copy written specifically for text that appears inside a social media visual.', 'Write the headline, supporting message and CTA for one Instagram static post.'),
            rcItem('copy-caption', 'Copywriting', 'Social Media Caption', 200, 'Per caption', 'The accompanying social media caption published together with the creative asset.', 'Write one Facebook or Instagram caption with key message, CTA and hashtags.'),
            rcItem('copy-carousel', 'Copywriting', 'Carousel Copywriting', 350, 'Up to 5 frames', 'Structured copy written across a connected sequence of carousel slides.', 'Write a five-frame carousel explaining the steps required to apply for a mortgage.'),
            rcItem('copy-edm', 'Copywriting', 'EDM Copywriting', 400, 'Per EDM', 'Email marketing copy including subject direction, headline, body message and CTA.', 'Write one promotional email announcing a campaign offer.'),
            rcItem('copy-advertorial', 'Copywriting', 'Advertorial Copywriting', 600, 'Up to 500 words', 'A promotional article written in an editorial style.', 'Write a 500-word article introducing a new financial product.'),
            rcItem('copy-video-script', 'Copywriting', 'Video Scriptwriting', 400, 'Up to 60 seconds', 'A short script for social, promotional or explanatory video content.', 'Write a 45-second recruitment video script with hook, key message and CTA.'),
            rcItem('copy-corporate-video', 'Copywriting', 'Corporate Video Script', 800, 'Up to 3 minutes', 'A longer structured script for corporate, interview-led or brand video production.', 'Write a three-minute corporate profile video script.'),
            rcItem('copy-website', 'Copywriting', 'Website Copywriting', 400, 'Per standard page', 'Copy for a standard website page using an approved messaging direction.', 'Write the content for one About Us or Service page.', 'Long-form landing pages, messaging strategy and SEO research may require separate quotation.'),
            rcItem('copy-blog-article', 'Copywriting', 'Blog Article Writing', 500, 'Up to 800 words', 'A general educational, editorial or thought-leadership article without detailed SEO research.', 'Write an article titled "Five Things First-Time Homebuyers Should Know".', 'Starting scope: one approved topic, basic desktop research, basic heading structure and one minor revision round. Interviews, original research, expert consultation, data collection and SEO keyword research are excluded.'),
            rcItem('copy-seo-article', 'Copywriting', 'SEO Article Writing', 700, 'Up to 1,000 words', 'An article written around an agreed search keyword with basic on-page SEO structure.', 'Write an article targeting "first home loan Malaysia" with optimised headings and metadata.', 'Starting scope: one agreed primary keyword, supporting keyword integration, heading structure, meta title, meta description and one minor revision round. Full technical SEO, backlink strategy, advanced keyword research and website implementation are excluded.'),
            rcItem('copy-sem-search-ad', 'Copywriting', 'SEM Search Ad Copywriting', 300, 'Per ad group or copy set', 'Google Search ad headlines and descriptions written around an agreed keyword and campaign objective.', 'Prepare one set of search-ad headlines and descriptions for a property financing campaign.', 'Keyword research, Google Ads setup, campaign management, media spending, landing-page copy and performance optimisation are excluded.'),
            rcItem('copy-gdn-display-ad', 'Copywriting', 'GDN Display Ad Copywriting', 250, 'Per campaign or copy set', 'Short headlines, long headlines and descriptions written for responsive Google Display Network advertising.', 'Prepare GDN remarketing copy for users who previously visited a campaign landing page.', 'Banner design, GDN campaign setup, audience targeting, media spending and performance optimisation are excluded.'),
            rcItem('copy-translation', 'Copywriting', 'Translation', 0.3, 'Per word, minimum RM200', 'Direct translation that preserves the meaning of the approved source copy.', 'Translate an approved English article into Bahasa Malaysia.'),
            rcItem('copy-proofreading', 'Copywriting', 'Proofreading', 0.15, 'Per word, minimum RM100', 'Checking spelling, grammar, punctuation and basic language accuracy without rewriting the message.', 'Proofread an already written company profile.'),
            rcItem('copy-transcreation', 'Copywriting', 'Transcreation / Marketing Localisation', 400, 'Per output', 'Rewriting a marketing message so it sounds natural and relevant in another language or market.', 'Adapt an English campaign headline into natural Malaysian Mandarin.')
        ]
    }
];

window.RATE_CARD_CATEGORY_FILTERS = RATE_CARD_CATEGORY_FILTERS;
window.RATE_CARD_POPULAR_SERVICE_IDS = RATE_CARD_POPULAR_SERVICE_IDS;
window.RATE_CARD_CATEGORY_ICONS = RATE_CARD_CATEGORY_ICONS;
window.RATE_CARD_CATEGORIES = RATE_CARD_CATEGORIES;
window.RATE_CARD_SCENARIO_GROUPS = RATE_CARD_SCENARIO_GROUPS;
window.RATE_CARD_CLASSIFICATION_GUIDE = RATE_CARD_CLASSIFICATION_GUIDE;
window.RATE_CARD_VOLUME_DISCOUNTS = RATE_CARD_VOLUME_DISCOUNTS;
window.RATE_CARD_COMMERCIAL_TERMS = RATE_CARD_COMMERCIAL_TERMS;
