// CMLink Style Gallery — static seed data.
//
// This holds the 4 categories, the 11 shot types, and the 33 verbatim prompts (11 shot types x
// Female/Male/Group of Friends — Phone has no prompts, it's a single reference-photo category).
// Deliberately a static file, not a DB table: this content is fixed, hand-tuned copy that rarely
// changes, so keeping it out of the database means opening the Prompts tab costs zero DB
// reads/egress. See the migration file for the same reasoning applied to the images/selections
// tables.
//
// Loaded as a plain <script> tag (same convention as rate-card-data.js) — everything here hangs
// off `window`, no bundler/module system in this project.

const CMLINK_GALLERY_CATEGORIES = ['Female', 'Male', 'Group of Friends', 'Phone'];

// Shot types for Female / Male / Group of Friends, in display order. Phone uses a single
// "Reference" pseudo-shot-type instead (handled separately — see CMLINK_SHOT_TYPES_BY_CATEGORY).
const CMLINK_SHOT_TYPES = [
    'Master Shot',
    'Wardrobe',
    'Outfit Swap',
    'Action Studio',
    'Outdoor Shoot',
    'Street Flash',
    'Airport Travel',
    'Traveler',
    'Product / QR / SIM',
    'Close-up Crop',
    'Reaction / Promo-Excited'
];

const CMLINK_SHOT_TYPES_BY_CATEGORY = {
    'Female': CMLINK_SHOT_TYPES,
    'Male': CMLINK_SHOT_TYPES,
    'Group of Friends': CMLINK_SHOT_TYPES,
    'Phone': ['Reference']
};

// Short description shown under each numbered step in the Prompts tab.
const CMLINK_SHOT_TYPE_DESCRIPTIONS = {
    'Master Shot': 'Front + 45° pose, identity casting — 3 style options per generation. This is the anchor reference every other shot type builds on.',
    'Wardrobe': 'Garment-only flat-lay, 3 outfit set options to choose from before redressing the talent.',
    'Outfit Swap': 'Combine an approved Master Shot + a chosen garment set to redress the talent, still front + 45°.',
    'Action Studio': 'Studio lifestyle shot, phone in hand, varied genuine actions — not three versions of the same pose.',
    'Outdoor Shoot': 'Singapore lifestyle setting, natural daylight, candid energy.',
    'Street Flash': 'Candid slow-shutter flash photography, Singapore night settings (street / MRT / bus stop), varied actions.',
    'Airport Travel': 'Travel attire, luggage, airport terminal setting.',
    'Traveler': 'Travel attire abroad, camera instead of phone.',
    'Product / QR / SIM': 'Interacting with SIM packaging or scanning a QR code — the booth-relevant product moment.',
    'Close-up Crop': 'Tight face + phone framing for banners, story ads, or thumbnails.',
    'Reaction / Promo-Excited': 'Genuine surprised-delight reaction, suited for promo/discount callouts.'
};

// prompts[category][shotType] = { title, note, prompt }
// note = the short italic usage hint from the handoff spec (kept as-is, including the Malay bits).
const CMLINK_PROMPTS = {
    'Female': {
        'Master Shot': {
            title: 'Female master reference — front + 45°',
            note: 'Front shot (pandang kamera) + 45-degree shot (tak pandang kamera), berdiri tegak. Ini anchor reference untuk semua shot lain.',
            prompt: `Generate 3 separate, individual reference images (not a grid, not a filmstrip, not a collage, not a split-screen, not a triptych, not panels divided by borders or lines within one canvas — these must be 3 completely separate, independent photographs, each its own full-canvas image). If your platform can only output one image per turn, generate and post the 3 one at a time in sequence — do not stitch or compress them into a single combined picture to fit them in one response. Each image is a distinct casting option — a genuinely different woman, not the same person shown three times. Treat this as a completely fresh casting call each time — don't default to the same face, hairstyle, or outfit combination a similar prompt might have produced before; aim for genuinely new looks every time this is generated.

Shared casting brief for all 3 options: a young Mainland Chinese woman, early-to-mid 20s. Features, bone structure, skin undertone, and styling must clearly read as Mainland Chinese specifically — explicitly not Korean idol or K-beauty styling, not Chinese-diaspora or other East Asian region styling, not doll-like or overly glamorous. Proper and youthful appearance, sincere and approachable energy. Natural minimal makeup: soft dewy base, light natural brow fill, no heavy contour, no false lashes.

Vary these three things across the 3 options so each reads as a distinct individual, while every option still stays within the shared casting brief above:
1) Face structure — randomly pick 3 different shapes each time (e.g. oval with soft jaw, round with full cheeks, long with high cheekbones, heart-shaped, square with soft angles) — don't reuse the same 3 combination every generation.
2) Hairstyle — randomly pick 3 genuinely different lengths and styles each time (e.g. straight long, shoulder-length waves, short bob, layered shag, high ponytail, soft curtain bangs) — don't default to the same 3 every generation.
3) Attire — each option in a genuinely different style archetype, not just a different color of the same basic outfit. Randomly pick 3 different archetypes each time from a wide range such as: relaxed streetwear (oversized tee or hoodie + wide-leg or cargo pants), smart-casual minimalist (fitted button-up or blouse + tailored trousers or midi skirt), soft knitwear layered look (cardigan or sweater + straight-leg trousers), sporty athleisure (zip-up jacket or crop top + joggers), preppy collared look (polo or knit vest + pleated skirt or chinos), or relaxed linen summer look (linen shirt + wide trousers or sundress) — vary silhouette, formality, and layering across the 3, not just hue. Work a touch of soft blue and/or green into each outfit somewhere (a jacket, bag, or shoes is enough — it doesn't need to dominate), rest of the palette can be neutral (white, beige, grey, black). No two options should read as the same outfit in a different color, and don't default to the same 3 archetypes every generation.

Within EACH of the 3 option images, show two full-body poses of that option's character, side by side:
LEFT figure: front-facing full-body pose, standing up straight, looking directly at the camera, natural relaxed posture, hands resting naturally at her sides or loosely holding an iPhone 17 Pro Max.
RIGHT figure: 45-degree angled full-body pose, body turned at a 45-degree angle from camera, standing up straight. She is looking in the same direction her body is turned toward — not at the camera — a natural head-and-gaze match to the body angle.

Background: neutral seamless light grey studio background, soft even studio lighting, no harsh shadows, no clutter, identical across all 3 options.

Style: photorealistic commercial studio photography, sharp focus, natural fabric folds and textures, anatomically correct hands and feet with five fingers each, consistent facial identity and hairstyle between the two poses within each option, premium believable realism, not overly fashion-editorial, not doll-like.

No text, no labels, no watermark, no logos anywhere in any image.

Format: 3 separate still images, vertical 9:16 portrait aspect ratio, full body visible head to toe in both poses, same framing and canvas size across all 3. Do not output this as one image with 3 panels side by side — 3 separate image files/generations only.`
        },
        'Wardrobe': {
            title: 'Female wardrobe — garment flat-lay',
            note: 'Garment-only flat-lay, 3 outfit sets to pick from before redressing the talent.',
            prompt: `Generate 3 separate, individual garment-only flat-lay images (not a grid, not a filmstrip, not a collage, not a split-screen, not a triptych, not panels divided by borders or lines within one canvas — these must be 3 completely separate, independent photographs, each its own full-canvas image). If your platform can only output one image per turn, generate and post the 3 one at a time in sequence — do not stitch or compress them into a single combined picture to fit them in one response. No person, no mannequin, no body parts anywhere in any image.

Each image is one distinct outfit set for the same casting brief: a simple, clean modern casual outfit (top + bottom, plus one accessory if relevant) incorporating soft blue and/or green tones (brand palette) — vary the exact cut, color balance, and styling detail across the 3 sets so there are real options to choose from, while keeping the same simple casual character type as the CMLink talent look (not overly formal, not sporty, not flashy).

Layout: garments shown fully unfolded and laid flat at full size on a neutral surface (soft grey or white), arranged neatly as a styled flat-lay, not folded or stacked. Soft even top-down studio lighting, true-to-life fabric colors and textures, sharp focus on fabric weave and detail.

No people, no mannequins, no body parts, no text, no labels, no brand tags or logos visible anywhere in any image.

Format: 3 separate still images, vertical 9:16 portrait aspect ratio, same framing and background across all 3. Do not output this as one image with 3 panels side by side — 3 separate image files/generations only.`
        },
        'Outfit Swap': {
            title: 'Female outfit swap template',
            note: 'Combine approved Master Shot + chosen garment to redress the talent, still front + 45°.',
            prompt: `Using the two uploaded images — the first is the approved master character reference sheet (front-facing and 45-degree full-body poses), the second is the chosen outfit/garment flat-lay reference — redress the same woman from the master reference into the exact outfit shown in the garment image.

Keep everything else from the master reference unchanged: same face, identity, hairstyle, skin tone, body proportions, same neutral grey studio background, same lighting, same standing pose and camera framing as the master reference.

LEFT figure: front-facing full-body pose, standing up straight, looking directly at the camera, wearing the new outfit exactly as shown in the garment reference image — same garments, same colors, same styling.

RIGHT figure: 45-degree angled full-body pose, standing up straight, body turned at a 45-degree angle, looking in the same direction her body is turned toward — not at the camera. Wearing the same new outfit as the left figure, matching in styling, fit, and color exactly.

Style: photorealistic commercial studio photography, sharp focus, natural fabric folds, anatomically correct hands and feet, consistent facial identity between both poses.

No text, no labels, no watermark, no logos anywhere in the image.

Format: single still image, vertical 9:16 portrait aspect ratio, full body visible head to toe in both poses.`
        },
        'Action Studio': {
            title: 'Female studio action — phone interaction',
            note: 'Guna gambar master shot yang dah approve sebagai reference upload.',
            prompt: `Using the uploaded reference image — the approved master character reference sheet — generate 3 separate, individual studio action shots of the same woman (not a grid, not a filmstrip, not a collage, not a split-screen, not a triptych, not panels divided by borders or lines within one canvas — these must be 3 completely separate, independent photographs, each its own full-canvas image). If your platform can only output one image per turn, generate and post the 3 one at a time in sequence — do not stitch or compress them into a single combined picture to fit them in one response. Keep the exact same face, identity, hairstyle, skin tone, body proportions, and outfit as the reference in all 3 images.

Give each of the 3 images a genuinely different action and pose — not three variations of the same "looking at the phone" moment. She should be holding or carrying an iPhone 17 Pro Max in each image, but the phone is not always the focus of her attention:

Option 1: standing relaxed with weight on one leg, phone held loosely down at her side or in front of her waist with one hand, she is NOT looking at the phone — instead looking toward the camera with a soft natural smile, easy confident body language.

Option 2: caught mid-motion adjusting her hair or sleeve with one hand, the phone held in her other hand at waist height, her gaze looking off to the side or slightly downward — a candid moment that has nothing to do with the phone, natural unposed energy.

Option 3: mid-laugh or mid-turn, head tilted back or to the side, phone held casually near her shoulder or hip as if she just glanced away from it a moment ago, hair or fabric caught in slight natural motion, dynamic candid energy.

Keep face, hairstyle, and outfit identical across all 3 — only the pose, action, and phone placement change.

Background: neutral seamless light grey studio backdrop, soft even studio lighting with a gentle catch-light, no harsh shadows.

Style: photorealistic commercial studio lifestyle photography, sharp focus on face and phone, natural fabric folds, anatomically correct hands holding the phone realistically, same facial identity as the reference image across all 3, believable natural realism, candid unposed energy — not a stiff product-ad pose.

No text, no labels, no watermark, no logos anywhere in any image, including the phone screen — keep it a soft blurred glow, no readable UI.

Format: 3 separate still images, vertical 9:16 portrait aspect ratio, same framing and canvas size across all 3. Do not output this as one image with 3 panels side by side — 3 separate image files/generations only.`
        },
        'Outdoor Shoot': {
            title: 'Female outdoor lifestyle shot',
            note: 'Lifestyle setting, natural daylight, candid energy.',
            prompt: `Using the uploaded reference image — the approved master character reference sheet — generate 3 separate, individual outdoor lifestyle shots of the same woman (not a grid, not a filmstrip, not a collage, not a split-screen, not a triptych, not panels divided by borders or lines within one canvas — these must be 3 completely separate, independent photographs, each its own full-canvas image). If your platform can only output one image per turn, generate and post the 3 one at a time in sequence — do not stitch or compress them into a single combined picture to fit them in one response. Keep the exact same face, identity, hairstyle, skin tone, body proportions, and outfit as the reference in all 3 images.

Scene (same core scene across all 3, vary only pose/angle/expression as noted): she is walking or standing casually along a Singapore street — think HDB estate walkway, a shophouse-lined street (e.g. Tiong Bahru/Chinatown style architecture), or a café terrace with a Singapore CBD/Marina Bay skyline element visible in the distance — natural daylight (soft midday or golden-hour light), holding an iPhone 17 Pro Max naturally at waist or chest level, caught in a mid-candid moment — glancing at the phone, or smiling softly — not posed stiffly at the camera.

Vary these details slightly across the 3 images so I can compare and pick the best one: walking vs. standing, exact head angle and gaze direction, and micro-expression (soft smile vs. relaxed neutral vs. light laugh). Keep everything else — face, hairstyle, outfit, Singapore location type, lighting — identical across all 3.

Background: softly blurred authentic Singapore streetscape — recognizable local architecture such as HDB blocks, colonial-era shophouses, or a hawker centre exterior, optionally with a soft distant skyline silhouette recognizable as Singapore (e.g. Marina Bay Sands) — believable shallow depth of field keeping her sharp while the background is softly out of focus, natural tropical ambient light and shadow.

Style: photorealistic lifestyle/editorial street photography, natural candid energy, sharp focus on subject, anatomically correct hands and natural fabric movement, same facial identity as the reference image across all 3, not overly polished or CGI-looking.

No text, no logos, no watermark, no readable signage anywhere in any image.

Format: 3 separate still images, vertical 9:16 portrait aspect ratio, same framing and canvas size across all 3. Do not output this as one image with 3 panels side by side — 3 separate image files/generations only.`
        },
        'Street Flash': {
            title: 'Female street flash shot',
            note: 'Candid slow-shutter flash street photography, night city atmosphere.',
            prompt: `Using the uploaded reference image — the approved master character reference sheet — generate 3 separate, individual candid slow-shutter flash street-photography shots of the same woman (not a grid, not a filmstrip, not a collage, not a split-screen, not a triptych, not panels divided by borders or lines within one canvas — these must be 3 completely separate, independent photographs, each its own full-canvas image). If your platform can only output one image per turn, generate and post the 3 one at a time in sequence — do not stitch or compress them into a single combined picture to fit them in one response. Keep the exact same face, identity, hairstyle, skin tone, body proportions, and outfit as the reference in all 3 images.

Give each of the 3 images a genuinely different action AND a different place — not three walking poses in different backdrops. All 3 share the same candid slow-shutter flash-photography style: direct on-camera flash illuminating her sharply against a softly motion-blurred background (slow-shutter drag effect), natural candid unposed energy, caught mid-moment, not looking directly at camera, an iPhone 17 Pro Max visible in her hand or bag in each image.

Option 1 — walking: mid-stride along a Singapore street at night — think Chinatown, Tiong Bahru, or a hawker centre/shophouse front — glancing at or holding the phone, glowing shopfronts and wet-look pavement reflections in the background.

Option 2 — sitting or leaning: seated on a bench or leaning against a pillar on an MRT station platform at night, phone in hand but not the focus, relaxed waiting posture, a completely different body position from Option 1 — a recognisably Singaporean transit moment, no visible station name text or signage.

Option 3 — crouching or bending: crouched down adjusting a shoe or bag strap at a bus stop or street corner, caught mid-motion in this bent-down position, phone tucked in one hand or her bag, a genuinely different pose from both other options, blurred traffic light trails or bus lights in the background.

Keep face, hairstyle, and outfit identical across all 3 — only the place and action change.

Background: nighttime Singapore streetscape appropriate to each option's setting (street/shophouse front, MRT platform, or crossing/bus stop) with soft bokeh light trails and a distinctly Singaporean tropical heartland atmosphere rather than a generic city, no readable signage, station names, or route numbers anywhere.

Style: photorealistic candid flash street photography, high contrast between the sharp flash-lit subject and the blurred ambient background, authentic grainy film-flash texture, sharp focus on subject's face, anatomically correct hands, same facial identity as the reference image across all 3.

No text, no logos, no watermark, no readable signage anywhere in any image.

Format: 3 separate still images, vertical 9:16 portrait aspect ratio, same framing and canvas size across all 3. Do not output this as one image with 3 panels side by side — 3 separate image files/generations only.`
        },
        'Airport Travel': {
            title: 'Female airport travel shot',
            note: 'Travel attire with luggage, airport terminal setting.',
            prompt: `Using the uploaded reference image — the approved master character reference sheet — generate 3 separate, individual airport travel shots of the same woman (not a grid, not a filmstrip, not a collage, not a split-screen, not a triptych, not panels divided by borders or lines within one canvas — these must be 3 completely separate, independent photographs, each its own full-canvas image). If your platform can only output one image per turn, generate and post the 3 one at a time in sequence — do not stitch or compress them into a single combined picture to fit them in one response. Keep the exact same face, identity, hairstyle, skin tone, body proportions, and outfit as the reference in all 3 images, but now dressed for travel: a comfortable travel-appropriate outer layer (light jacket or cardigan over her usual outfit), practical travel shoes.

Scene: she is at an airport terminal, pulling a carry-on suitcase, a passport and an iPhone 17 Pro Max held together in one hand, natural candid mid-stride or mid-pause energy — checking her phone or glancing toward the departure boards, not posed stiffly at the camera.

Vary these details across the 3 images so I can compare and pick the best one — Option 1: mid-stride pulling the suitcase, glancing at the phone; Option 2: paused near a window with the suitcase beside her, looking at the passport/phone together; Option 3: slight over-the-shoulder candid moment, suitcase handle in hand, soft natural smile. Keep face, hairstyle, and outfit identical across all 3.

Background: a clean, modern airport terminal interior — departure boards, large glass windows, soft natural daylight, other travelers softly blurred in the background as atmosphere, not identifiable subjects.

Style: photorealistic lifestyle/editorial travel photography, natural candid energy, sharp focus on the subject, anatomically correct hands, same facial identity as the reference image across all 3, not overly polished or CGI-looking.

No text, no logos, no watermark, no readable signage, gate numbers, or airline branding anywhere in any image.

Format: 3 separate still images, vertical 9:16 portrait aspect ratio, same framing and canvas size across all 3. Do not output this as one image with 3 panels side by side — 3 separate image files/generations only.`
        },
        'Traveler': {
            title: 'Female traveler shot',
            note: 'Traveler outfit abroad, camera instead of phone.',
            prompt: `Using the uploaded reference image — the approved master character reference sheet — generate 3 separate, individual traveler-style shots of the same woman (not a grid, not a filmstrip, not a collage, not a split-screen, not a triptych, not panels divided by borders or lines within one canvas — these must be 3 completely separate, independent photographs, each its own full-canvas image). If your platform can only output one image per turn, generate and post the 3 one at a time in sequence — do not stitch or compress them into a single combined picture to fit them in one response. Keep the exact same face, identity, hairstyle, skin tone, body proportions, and outfit as the reference in all 3 images, but now dressed as a traveler abroad: a versatile lightweight travel outfit layered over her usual look (light jacket, vest, or scarf), comfortable walking shoes, a small crossbody bag or backpack. She is holding or wearing a compact mirrorless-style camera on a neck strap — plain, unbranded design, no visible logos or brand marks. No phone in this shot — the camera replaces it as her only prop.

Give each of the 3 images a genuinely different travel moment:

Option 1: walking through a charming overseas old-town street lined with cafés and small shopfronts, camera raised to her eye mid-shot, candid unposed energy.

Option 2: standing at a scenic outdoor viewpoint or overlook, camera lowered in both hands as she reviews a photo on the screen, soft natural smile.

Option 3: mid-motion, slightly turned or crouched as if she just captured a photo, camera hanging from the neck strap, natural laughter or focused expression.

Keep face, hairstyle, and outfit identical across all 3 — only the setting and action change.

Background: a generic, non-landmark-specific overseas travel setting matching each option (charming old-town street, scenic outdoor viewpoint, or a lively unbranded plaza), natural daylight, softly blurred surroundings. No readable signage, no real identifiable landmarks or monuments, no flags or country-specific iconography.

Style: photorealistic lifestyle/editorial travel photography, natural candid energy, sharp focus on subject, anatomically correct hands, same facial identity as the reference image across all 3, not overly polished or CGI-looking.

No text, no logos, no watermark, no readable signage or landmark branding anywhere in any image.

Format: 3 separate still images, vertical 9:16 portrait aspect ratio, same framing and canvas size across all 3. Do not output this as one image with 3 panels side by side — 3 separate image files/generations only.`
        },
        'Product / QR / SIM': {
            title: 'Female product interaction shot',
            note: 'Booth-relevant moment: SIM packaging or QR scan interaction.',
            prompt: `Using the uploaded reference image — the approved master character reference sheet — generate 3 separate, individual product-interaction shots of the same woman (not a grid, not a filmstrip, not a collage, not a split-screen, not a triptych, not panels divided by borders or lines within one canvas — these must be 3 completely separate, independent photographs, each its own full-canvas image). If your platform can only output one image per turn, generate and post the 3 one at a time in sequence — do not stitch or compress them into a single combined picture to fit them in one response. Keep the exact same face, identity, hairstyle, skin tone, body proportions, and outfit as the reference in all 3 images.

Scene: she is engaging with the CMLink SIM product moment. Vary the exact interaction across the 3 images so I can compare and pick the best one — Option 1: holding a simple unbranded white SIM card packaging box in one hand next to an iPhone 17 Pro Max held in the other, looking at the box; Option 2: holding the phone up at chest-to-eye level as if scanning a QR code, natural focused expression; Option 3: mid-gesture of opening/unboxing the SIM packaging, looking down at her hands. Keep face, hairstyle, and outfit identical across all 3.

Background: neutral seamless light grey studio backdrop, soft even studio lighting with a gentle catch-light, no harsh shadows.

Style: photorealistic commercial studio lifestyle photography, sharp focus on face, hands, and props, anatomically correct hands, same facial identity as the reference image across all 3, believable natural realism, candid unposed energy.

No text, no labels, no watermark, no logos anywhere in any image — keep the SIM packaging plain/unbranded and the phone screen a soft blurred glow only, no readable UI, no scannable QR pattern.

Format: 3 separate still images, vertical 9:16 portrait aspect ratio, same framing and canvas size across all 3. Do not output this as one image with 3 panels side by side — 3 separate image files/generations only.`
        },
        'Close-up Crop': {
            title: 'Female close-up crop shot',
            note: 'Tight face + phone framing for banners, story ads, or thumbnails.',
            prompt: `Using the uploaded reference image — the approved master character reference sheet — generate 3 separate, individual close-up crop shots of the same woman (not a grid, not a filmstrip, not a collage, not a split-screen, not a triptych, not panels divided by borders or lines within one canvas — these must be 3 completely separate, independent photographs, each its own full-canvas image). If your platform can only output one image per turn, generate and post the 3 one at a time in sequence — do not stitch or compress them into a single combined picture to fit them in one response. Keep the exact same face, identity, hairstyle, skin tone, body proportions, and outfit as the reference in all 3 images.

Scene: a tight close-up crop from roughly chest/shoulders up, she is holding an iPhone 17 Pro Max near her collarbone or chin height, looking at the phone with a soft natural expression — designed for use as a cropped banner, story ad, or thumbnail, so keep her face and the phone both clearly readable within the tight frame.

Vary these details across the 3 images so I can compare and pick the best one: exact head tilt and gaze angle, and micro-expression (soft smile vs. relaxed neutral focus vs. light natural laugh). Keep everything else — face, hairstyle, outfit, background, lighting — identical across all 3.

Background: neutral seamless light grey studio backdrop, softly blurred, so the subject reads clearly even at small crop sizes.

Style: photorealistic commercial studio portrait photography, sharp focus on face and phone, anatomically correct hand holding the phone, same facial identity as the reference image across all 3, clean and legible at small sizes.

No text, no labels, no watermark, no logos anywhere in any image, including the phone screen — keep it a soft blurred glow, no readable UI.

Format: 3 separate still images, vertical 9:16 portrait aspect ratio, crop-friendly framing with subject centered and headroom, same framing and canvas size across all 3. Do not output this as one image with 3 panels side by side — 3 separate image files/generations only.`
        },
        'Reaction / Promo-Excited': {
            title: 'Female reaction shot',
            note: 'Genuine surprised-delight reaction, suited for promo/discount callouts.',
            prompt: `Using the uploaded reference image — the approved master character reference sheet — generate 3 separate, individual excited-reaction shots of the same woman (not a grid, not a filmstrip, not a collage, not a split-screen, not a triptych, not panels divided by borders or lines within one canvas — these must be 3 completely separate, independent photographs, each its own full-canvas image). If your platform can only output one image per turn, generate and post the 3 one at a time in sequence — do not stitch or compress them into a single combined picture to fit them in one response. Keep the exact same face, identity, hairstyle, skin tone, body proportions, and outfit as the reference in all 3 images.

Scene: she is reacting with genuine surprised delight while looking at an iPhone 17 Pro Max, as if she's just seen a great promo or deal — bright natural smile, eyes slightly widened, energetic but believable, not cartoonish or overacted.

Vary these details across the 3 images so I can compare and pick the best one — Option 1: both hands holding the phone up near her face, mouth open in a happy gasp; Option 2: one hand holding the phone, the other hand near her cheek in a pleasantly surprised gesture; Option 3: pointing at the phone screen with a bright excited smile, phone held at chest height. Keep face identity, hairstyle, and outfit identical across all 3.

Background: neutral seamless light grey studio backdrop, soft even studio lighting with a gentle catch-light, no harsh shadows.

Style: photorealistic commercial studio lifestyle photography, sharp focus on face and phone, natural energetic but believable expression, anatomically correct hands, same facial identity as the reference image across all 3.

No text, no labels, no watermark, no logos anywhere in any image, including the phone screen — keep it a soft blurred glow, no readable UI.

Format: 3 separate still images, vertical 9:16 portrait aspect ratio, same framing and canvas size across all 3. Do not output this as one image with 3 panels side by side — 3 separate image files/generations only.`
        }
    },

    'Male': {
        'Master Shot': {
            title: 'Male master reference — front + 45°',
            note: 'Front shot (pandang kamera) + 45-degree shot (tak pandang kamera), berdiri tegak.',
            prompt: `Generate 3 separate, individual reference images (not a grid, not a filmstrip, not a collage, not a split-screen, not a triptych, not panels divided by borders or lines within one canvas — these must be 3 completely separate, independent photographs, each its own full-canvas image). If your platform can only output one image per turn, generate and post the 3 one at a time in sequence — do not stitch or compress them into a single combined picture to fit them in one response. Each image is a distinct casting option — a genuinely different man, not the same person shown three times. Treat this as a completely fresh casting call each time — don't default to the same face, hairstyle, or outfit combination a similar prompt might have produced before; aim for genuinely new looks every time this is generated.

Shared casting brief for all 3 options: a young Mainland Chinese man, early-to-mid 20s. Features, bone structure, skin undertone, and styling must clearly read as Mainland Chinese specifically — not Korean idol styling, not Chinese-diaspora or other East Asian region styling, not overly muscular, not a gym-influencer physique, not idol-styled. Proper and youthful appearance, sincere and friendly energy, clean natural grooming, no heavy styling or makeup.

Vary these three things across the 3 options so each reads as a distinct individual, while every option still stays within the shared casting brief above:
1) Face structure — randomly pick 3 different shapes each time (e.g. square jaw, round soft face, long narrow jaw, angular, soft heart-shaped) — don't reuse the same 3 combination every generation.
2) Hairstyle — randomly pick 3 genuinely different lengths and styles each time (e.g. short buzz, side part with length on top, textured crop with fringe, slicked back, tousled medium-length) — don't default to the same 3 every generation.
3) Attire — each option in a genuinely different style archetype, not just a different color of the same basic outfit. Randomly pick 3 different archetypes each time from a wide range such as: relaxed streetwear (oversized tee or hoodie + cargo or wide-leg pants), smart-casual minimalist (button-up or henley + tailored trousers), knitwear layered look (cardigan or sweater over a shirt + straight-leg trousers), sporty athleisure (zip-up track jacket + joggers), preppy collared look (polo + chinos), or relaxed linen summer look (linen shirt + relaxed trousers) — vary silhouette, formality, and layering across the 3, not just hue. Work a touch of soft blue and/or green into each outfit somewhere (a jacket, cap, or shoes is enough — it doesn't need to dominate), rest of the palette can be neutral (white, beige, grey, black). No two options should read as the same outfit in a different color, and don't default to the same 3 archetypes every generation.

Within EACH of the 3 option images, show two full-body poses of that option's character, side by side:
LEFT figure: front-facing full-body pose, standing up straight, looking directly at the camera, natural relaxed posture, hands resting naturally at his sides or loosely holding an iPhone 17 Pro Max.
RIGHT figure: 45-degree angled full-body pose, body turned at a 45-degree angle from camera, standing up straight. He is looking in the same direction his body is turned toward — not at the camera — a natural head-and-gaze match to the body angle.

Background: neutral seamless light grey studio background, soft even studio lighting, no harsh shadows, no clutter, identical across all 3 options.

Style: photorealistic commercial studio photography, sharp focus, natural fabric folds and textures, anatomically correct hands and feet with five fingers each, consistent facial identity and hairstyle between the two poses within each option, premium believable realism, not overly fashion-editorial.

No text, no labels, no watermark, no logos anywhere in any image.

Format: 3 separate still images, vertical 9:16 portrait aspect ratio, full body visible head to toe in both poses, same framing and canvas size across all 3. Do not output this as one image with 3 panels side by side — 3 separate image files/generations only.`
        },
        'Wardrobe': {
            title: 'Male wardrobe — garment flat-lay',
            note: 'Garment-only flat-lay, 3 outfit sets to pick from before redressing the talent.',
            prompt: `Generate 3 separate, individual garment-only flat-lay images (not a grid, not a filmstrip, not a collage, not a split-screen, not a triptych, not panels divided by borders or lines within one canvas — these must be 3 completely separate, independent photographs, each its own full-canvas image). If your platform can only output one image per turn, generate and post the 3 one at a time in sequence — do not stitch or compress them into a single combined picture to fit them in one response. No person, no mannequin, no body parts anywhere in any image.

Each image is one distinct outfit set for the same casting brief: a simple, clean modern casual outfit (top + bottom, plus one accessory if relevant) incorporating soft blue and/or green tones (brand palette) — vary the exact cut, color balance, and styling detail across the 3 sets so there are real options to choose from, while keeping the same simple casual character type as the CMLink talent look (not overly formal, not sporty, not flashy).

Layout: garments shown fully unfolded and laid flat at full size on a neutral surface (soft grey or white), arranged neatly as a styled flat-lay, not folded or stacked. Soft even top-down studio lighting, true-to-life fabric colors and textures, sharp focus on fabric weave and detail.

No people, no mannequins, no body parts, no text, no labels, no brand tags or logos visible anywhere in any image.

Format: 3 separate still images, vertical 9:16 portrait aspect ratio, same framing and background across all 3. Do not output this as one image with 3 panels side by side — 3 separate image files/generations only.`
        },
        'Outfit Swap': {
            title: 'Male outfit swap template',
            note: 'Combine approved Master Shot + chosen garment to redress the talent, still front + 45°.',
            prompt: `Using the two uploaded images — the first is the approved master character reference sheet (front-facing and 45-degree full-body poses), the second is the chosen outfit/garment flat-lay reference — redress the same man from the master reference into the exact outfit shown in the garment image.

Keep everything else from the master reference unchanged: same face, identity, hairstyle, skin tone, body proportions, same neutral grey studio background, same lighting, same standing pose and camera framing as the master reference.

LEFT figure: front-facing full-body pose, standing up straight, looking directly at the camera, wearing the new outfit exactly as shown in the garment reference image — same garments, same colors, same styling.

RIGHT figure: 45-degree angled full-body pose, standing up straight, body turned at a 45-degree angle, looking in the same direction his body is turned toward — not at the camera. Wearing the same new outfit as the left figure, matching in styling, fit, and color exactly.

Style: photorealistic commercial studio photography, sharp focus, natural fabric folds, anatomically correct hands and feet, consistent facial identity between both poses.

No text, no labels, no watermark, no logos anywhere in the image.

Format: single still image, vertical 9:16 portrait aspect ratio, full body visible head to toe in both poses.`
        },
        'Action Studio': {
            title: 'Male studio action — phone interaction',
            note: 'Guna gambar master shot yang dah approve sebagai reference upload.',
            prompt: `Using the uploaded reference image — the approved master character reference sheet — generate 3 separate, individual studio action shots of the same man (not a grid, not a filmstrip, not a collage, not a split-screen, not a triptych, not panels divided by borders or lines within one canvas — these must be 3 completely separate, independent photographs, each its own full-canvas image). If your platform can only output one image per turn, generate and post the 3 one at a time in sequence — do not stitch or compress them into a single combined picture to fit them in one response. Keep the exact same face, identity, hairstyle, skin tone, body proportions, and outfit as the reference in all 3 images.

Give each of the 3 images a genuinely different action and pose — not three variations of the same "looking at the phone" moment. He should be holding or carrying an iPhone 17 Pro Max in each image, but the phone is not always the focus of his attention:

Option 1: standing relaxed with weight on one leg, one hand in his pocket, the phone held loosely in his other hand down at his side, he is NOT looking at the phone — instead looking toward the camera with a natural confident expression.

Option 2: caught mid-motion adjusting his jacket, sleeve, or collar with one hand, the phone held in his other hand at waist height, his gaze looking off to the side or slightly downward — a candid moment that has nothing to do with the phone, natural unposed energy.

Option 3: mid-laugh or mid-turn, head tilted back or to the side, phone held casually near his shoulder or hip as if he just glanced away from it a moment ago, natural motion in his posture, dynamic candid energy.

Keep face, hairstyle, and outfit identical across all 3 — only the pose, action, and phone placement change.

Background: neutral seamless light grey studio backdrop, soft even studio lighting with a gentle catch-light, no harsh shadows.

Style: photorealistic commercial studio lifestyle photography, sharp focus on face and phone, natural fabric folds, anatomically correct hands holding the phone realistically, same facial identity as the reference image across all 3, believable natural realism, candid unposed energy — not a stiff product-ad pose.

No text, no labels, no watermark, no logos anywhere in any image, including the phone screen — keep it a soft blurred glow, no readable UI.

Format: 3 separate still images, vertical 9:16 portrait aspect ratio, same framing and canvas size across all 3. Do not output this as one image with 3 panels side by side — 3 separate image files/generations only.`
        },
        'Outdoor Shoot': {
            title: 'Male outdoor lifestyle shot',
            note: 'Lifestyle setting, natural daylight, candid energy.',
            prompt: `Using the uploaded reference image — the approved master character reference sheet — generate 3 separate, individual outdoor lifestyle shots of the same man (not a grid, not a filmstrip, not a collage, not a split-screen, not a triptych, not panels divided by borders or lines within one canvas — these must be 3 completely separate, independent photographs, each its own full-canvas image). If your platform can only output one image per turn, generate and post the 3 one at a time in sequence — do not stitch or compress them into a single combined picture to fit them in one response. Keep the exact same face, identity, hairstyle, skin tone, body proportions, and outfit as the reference in all 3 images.

Scene (same core scene across all 3, vary only pose/angle/expression as noted): he is walking or standing casually along a Singapore street — think HDB estate walkway, a shophouse-lined street (e.g. Tiong Bahru/Chinatown style architecture), or a café terrace with a Singapore CBD/Marina Bay skyline element visible in the distance — natural daylight (soft midday or golden-hour light), holding an iPhone 17 Pro Max naturally at waist or chest level, caught in a mid-candid moment — glancing at the phone, or smiling softly — not posed stiffly at the camera.

Vary these details slightly across the 3 images so I can compare and pick the best one: walking vs. standing, exact head angle and gaze direction, and micro-expression (soft smile vs. relaxed neutral vs. light laugh). Keep everything else — face, hairstyle, outfit, Singapore location type, lighting — identical across all 3.

Background: softly blurred authentic Singapore streetscape — recognizable local architecture such as HDB blocks, colonial-era shophouses, or a hawker centre exterior, optionally with a soft distant skyline silhouette recognizable as Singapore (e.g. Marina Bay Sands) — believable shallow depth of field keeping him sharp while the background is softly out of focus, natural tropical ambient light and shadow.

Style: photorealistic lifestyle/editorial street photography, natural candid energy, sharp focus on subject, anatomically correct hands and natural fabric movement, same facial identity as the reference image across all 3, not overly polished or CGI-looking.

No text, no logos, no watermark, no readable signage anywhere in any image.

Format: 3 separate still images, vertical 9:16 portrait aspect ratio, same framing and canvas size across all 3. Do not output this as one image with 3 panels side by side — 3 separate image files/generations only.`
        },
        'Street Flash': {
            title: 'Male street flash shot',
            note: 'Candid slow-shutter flash street photography, night city atmosphere.',
            prompt: `Using the uploaded reference image — the approved master character reference sheet — generate 3 separate, individual candid slow-shutter flash street-photography shots of the same man (not a grid, not a filmstrip, not a collage, not a split-screen, not a triptych, not panels divided by borders or lines within one canvas — these must be 3 completely separate, independent photographs, each its own full-canvas image). If your platform can only output one image per turn, generate and post the 3 one at a time in sequence — do not stitch or compress them into a single combined picture to fit them in one response. Keep the exact same face, identity, hairstyle, skin tone, body proportions, and outfit as the reference in all 3 images.

Give each of the 3 images a genuinely different action AND a different place — not three walking poses in different backdrops. All 3 share the same candid slow-shutter flash-photography style: direct on-camera flash illuminating him sharply against a softly motion-blurred background (slow-shutter drag effect), natural candid unposed energy, caught mid-moment, not looking directly at camera, an iPhone 17 Pro Max visible in his hand or pocket in each image.

Option 1 — walking: mid-stride along a Singapore street at night — think Chinatown, Tiong Bahru, or a hawker centre/shophouse front — glancing at or holding the phone, glowing shopfronts and wet-look pavement reflections in the background.

Option 2 — sitting or leaning: seated on a bench or leaning against a pillar on an MRT station platform at night, phone in hand but not the focus, relaxed waiting posture, a completely different body position from Option 1 — a recognisably Singaporean transit moment, no visible station name text or signage.

Option 3 — crouching or bending: crouched down adjusting a shoe or bag strap at a bus stop or street corner, caught mid-motion in this bent-down position, phone tucked in one hand or his pocket, a genuinely different pose from both other options, blurred traffic light trails or bus lights in the background.

Keep face, hairstyle, and outfit identical across all 3 — only the place and action change.

Background: nighttime Singapore streetscape appropriate to each option's setting (street/shophouse front, MRT platform, or crossing/bus stop) with soft bokeh light trails and a distinctly Singaporean tropical heartland atmosphere rather than a generic city, no readable signage, station names, or route numbers anywhere.

Style: photorealistic candid flash street photography, high contrast between the sharp flash-lit subject and the blurred ambient background, authentic grainy film-flash texture, sharp focus on subject's face, anatomically correct hands, same facial identity as the reference image across all 3.

No text, no logos, no watermark, no readable signage anywhere in any image.

Format: 3 separate still images, vertical 9:16 portrait aspect ratio, same framing and canvas size across all 3. Do not output this as one image with 3 panels side by side — 3 separate image files/generations only.`
        },
        'Airport Travel': {
            title: 'Male airport travel shot',
            note: 'Travel attire with luggage, airport terminal setting.',
            prompt: `Using the uploaded reference image — the approved master character reference sheet — generate 3 separate, individual airport travel shots of the same man (not a grid, not a filmstrip, not a collage, not a split-screen, not a triptych, not panels divided by borders or lines within one canvas — these must be 3 completely separate, independent photographs, each its own full-canvas image). If your platform can only output one image per turn, generate and post the 3 one at a time in sequence — do not stitch or compress them into a single combined picture to fit them in one response. Keep the exact same face, identity, hairstyle, skin tone, body proportions, and outfit as the reference in all 3 images, but now dressed for travel: a comfortable travel-appropriate outer layer (light jacket or overshirt over his usual outfit), practical travel shoes, a crossbody or backpack strap visible if natural.

Scene: he is at an airport terminal, pulling a carry-on suitcase, a passport and an iPhone 17 Pro Max held together in one hand, natural candid mid-stride or mid-pause energy — checking his phone or glancing toward the departure boards, not posed stiffly at the camera.

Vary these details across the 3 images so I can compare and pick the best one — Option 1: mid-stride pulling the suitcase, glancing at the phone; Option 2: paused near a window with the suitcase beside him, looking at the passport/phone together; Option 3: slight over-the-shoulder candid moment, suitcase handle in hand, soft natural smile. Keep face, hairstyle, and outfit identical across all 3.

Background: a clean, modern airport terminal interior — departure boards, large glass windows, soft natural daylight, other travelers softly blurred in the background as atmosphere, not identifiable subjects.

Style: photorealistic lifestyle/editorial travel photography, natural candid energy, sharp focus on the subject, anatomically correct hands, same facial identity as the reference image across all 3, not overly polished or CGI-looking.

No text, no logos, no watermark, no readable signage, gate numbers, or airline branding anywhere in any image.

Format: 3 separate still images, vertical 9:16 portrait aspect ratio, same framing and canvas size across all 3. Do not output this as one image with 3 panels side by side — 3 separate image files/generations only.`
        },
        'Traveler': {
            title: 'Male traveler shot',
            note: 'Traveler outfit abroad, camera instead of phone.',
            prompt: `Using the uploaded reference image — the approved master character reference sheet — generate 3 separate, individual traveler-style shots of the same man (not a grid, not a filmstrip, not a collage, not a split-screen, not a triptych, not panels divided by borders or lines within one canvas — these must be 3 completely separate, independent photographs, each its own full-canvas image). If your platform can only output one image per turn, generate and post the 3 one at a time in sequence — do not stitch or compress them into a single combined picture to fit them in one response. Keep the exact same face, identity, hairstyle, skin tone, body proportions, and outfit as the reference in all 3 images, but now dressed as a traveler abroad: a versatile lightweight travel outfit layered over his usual look (light jacket, overshirt, or scarf), comfortable walking shoes, a small crossbody bag or backpack. He is holding or wearing a compact mirrorless-style camera on a neck strap — plain, unbranded design, no visible logos or brand marks. No phone in this shot — the camera replaces it as his only prop.

Give each of the 3 images a genuinely different travel moment:

Option 1: walking through a charming overseas old-town street lined with cafés and small shopfronts, camera raised to his eye mid-shot, candid unposed energy.

Option 2: standing at a scenic outdoor viewpoint or overlook, camera lowered in both hands as he reviews a photo on the screen, natural relaxed expression.

Option 3: mid-motion, slightly turned or crouched as if he just captured a photo, camera hanging from the neck strap, natural laughter or focused expression.

Keep face, hairstyle, and outfit identical across all 3 — only the setting and action change.

Background: a generic, non-landmark-specific overseas travel setting matching each option (charming old-town street, scenic outdoor viewpoint, or a lively unbranded plaza), natural daylight, softly blurred surroundings. No readable signage, no real identifiable landmarks or monuments, no flags or country-specific iconography.

Style: photorealistic lifestyle/editorial travel photography, natural candid energy, sharp focus on subject, anatomically correct hands, same facial identity as the reference image across all 3, not overly polished or CGI-looking.

No text, no logos, no watermark, no readable signage or landmark branding anywhere in any image.

Format: 3 separate still images, vertical 9:16 portrait aspect ratio, same framing and canvas size across all 3. Do not output this as one image with 3 panels side by side — 3 separate image files/generations only.`
        },
        'Product / QR / SIM': {
            title: 'Male product interaction shot',
            note: 'Booth-relevant moment: SIM packaging or QR scan interaction.',
            prompt: `Using the uploaded reference image — the approved master character reference sheet — generate 3 separate, individual product-interaction shots of the same man (not a grid, not a filmstrip, not a collage, not a split-screen, not a triptych, not panels divided by borders or lines within one canvas — these must be 3 completely separate, independent photographs, each its own full-canvas image). If your platform can only output one image per turn, generate and post the 3 one at a time in sequence — do not stitch or compress them into a single combined picture to fit them in one response. Keep the exact same face, identity, hairstyle, skin tone, body proportions, and outfit as the reference in all 3 images.

Scene: he is engaging with the CMLink SIM product moment. Vary the exact interaction across the 3 images so I can compare and pick the best one — Option 1: holding a simple unbranded white SIM card packaging box in one hand next to an iPhone 17 Pro Max held in the other, looking at the box; Option 2: holding the phone up at chest-to-eye level as if scanning a QR code, natural focused expression; Option 3: mid-gesture of opening/unboxing the SIM packaging, looking down at his hands. Keep face, hairstyle, and outfit identical across all 3.

Background: neutral seamless light grey studio backdrop, soft even studio lighting with a gentle catch-light, no harsh shadows.

Style: photorealistic commercial studio lifestyle photography, sharp focus on face, hands, and props, anatomically correct hands, same facial identity as the reference image across all 3, believable natural realism, candid unposed energy.

No text, no labels, no watermark, no logos anywhere in any image — keep the SIM packaging plain/unbranded and the phone screen a soft blurred glow only, no readable UI, no scannable QR pattern.

Format: 3 separate still images, vertical 9:16 portrait aspect ratio, same framing and canvas size across all 3. Do not output this as one image with 3 panels side by side — 3 separate image files/generations only.`
        },
        'Close-up Crop': {
            title: 'Male close-up crop shot',
            note: 'Tight face + phone framing for banners, story ads, or thumbnails.',
            prompt: `Using the uploaded reference image — the approved master character reference sheet — generate 3 separate, individual close-up crop shots of the same man (not a grid, not a filmstrip, not a collage, not a split-screen, not a triptych, not panels divided by borders or lines within one canvas — these must be 3 completely separate, independent photographs, each its own full-canvas image). If your platform can only output one image per turn, generate and post the 3 one at a time in sequence — do not stitch or compress them into a single combined picture to fit them in one response. Keep the exact same face, identity, hairstyle, skin tone, body proportions, and outfit as the reference in all 3 images.

Scene: a tight close-up crop from roughly chest/shoulders up, he is holding an iPhone 17 Pro Max near his collarbone or chin height, looking at the phone with a soft natural expression — designed for use as a cropped banner, story ad, or thumbnail, so keep his face and the phone both clearly readable within the tight frame.

Vary these details across the 3 images so I can compare and pick the best one: exact head tilt and gaze angle, and micro-expression (soft smile vs. relaxed neutral focus vs. light natural laugh). Keep everything else — face, hairstyle, outfit, background, lighting — identical across all 3.

Background: neutral seamless light grey studio backdrop, softly blurred, so the subject reads clearly even at small crop sizes.

Style: photorealistic commercial studio portrait photography, sharp focus on face and phone, anatomically correct hand holding the phone, same facial identity as the reference image across all 3, clean and legible at small sizes.

No text, no labels, no watermark, no logos anywhere in any image, including the phone screen — keep it a soft blurred glow, no readable UI.

Format: 3 separate still images, vertical 9:16 portrait aspect ratio, crop-friendly framing with subject centered and headroom, same framing and canvas size across all 3. Do not output this as one image with 3 panels side by side — 3 separate image files/generations only.`
        },
        'Reaction / Promo-Excited': {
            title: 'Male reaction shot',
            note: 'Genuine surprised-delight reaction, suited for promo/discount callouts.',
            prompt: `Using the uploaded reference image — the approved master character reference sheet — generate 3 separate, individual excited-reaction shots of the same man (not a grid, not a filmstrip, not a collage, not a split-screen, not a triptych, not panels divided by borders or lines within one canvas — these must be 3 completely separate, independent photographs, each its own full-canvas image). If your platform can only output one image per turn, generate and post the 3 one at a time in sequence — do not stitch or compress them into a single combined picture to fit them in one response. Keep the exact same face, identity, hairstyle, skin tone, body proportions, and outfit as the reference in all 3 images.

Scene: he is reacting with genuine surprised delight while looking at an iPhone 17 Pro Max, as if he's just seen a great promo or deal — bright natural smile, eyes slightly widened, energetic but believable, not cartoonish or overacted.

Vary these details across the 3 images so I can compare and pick the best one — Option 1: both hands holding the phone up near his face, mouth open in a happy laugh; Option 2: one hand holding the phone, the other hand near his jaw in a pleasantly surprised gesture; Option 3: pointing at the phone screen with a bright excited smile, phone held at chest height. Keep face identity, hairstyle, and outfit identical across all 3.

Background: neutral seamless light grey studio backdrop, soft even studio lighting with a gentle catch-light, no harsh shadows.

Style: photorealistic commercial studio lifestyle photography, sharp focus on face and phone, natural energetic but believable expression, anatomically correct hands, same facial identity as the reference image across all 3.

No text, no labels, no watermark, no logos anywhere in any image, including the phone screen — keep it a soft blurred glow, no readable UI.

Format: 3 separate still images, vertical 9:16 portrait aspect ratio, same framing and canvas size across all 3. Do not output this as one image with 3 panels side by side — 3 separate image files/generations only.`
        }
    },

    'Group of Friends': {
        'Master Shot': {
            title: 'Group master reference — front + 45°',
            note: 'Front shot (semua pandang kamera) + 45-degree shot (semua tak pandang kamera), berdiri tegak dalam satu group cluster.',
            prompt: `Generate 3 separate, individual reference images (not a grid, not a filmstrip, not a collage, not a split-screen, not a triptych, not panels divided by borders or lines within one canvas — these must be 3 completely separate, independent photographs, each its own full-canvas image). If your platform can only output one image per turn, generate and post the 3 one at a time in sequence — do not stitch or compress them into a single combined picture to fit them in one response. Each image is a distinct casting option for the whole friend group — a genuinely different trio of people, not the same three people shown three times. Treat this as a completely fresh casting call each time — don't default to the same faces, hairstyles, or outfit combinations a similar prompt might have produced before; aim for genuinely new looks every time this is generated.

Shared casting brief for all 3 options: a group of three young Mainland Chinese friends, early-to-mid 20s — two women and one man. Features, bone structure, skin undertone, and styling must clearly read as Mainland Chinese specifically — explicitly not Korean idol or K-beauty styling, not Chinese-diaspora or other East Asian region styling, not doll-like. Proper and youthful appearance, natural friendly camaraderie between them, natural minimal makeup on the women, clean natural grooming on the man.

Vary these three things across the 3 options for all three friends, so each option reads as a genuinely different trio while staying within the shared casting brief above:
1) Face structure of each friend — randomly vary jaw shape, cheekbones, and face length option to option, for each person — don't reuse the same combination every generation.
2) Hairstyle of each friend — randomly vary length and styling option to option, for each person (drawing from a wide range: straight long, shoulder waves, short bob, layered shag, ponytail for the women; buzz cut, side part, textured crop, slicked back, tousled medium-length for the man) — don't default to the same 3 every generation.
3) Attire — each option dresses the trio in a genuinely different style archetype set, not just a different color of the same basic outfits. Randomly pick a different archetype combination each time from a wide range such as: relaxed streetwear, smart-casual minimalist, knitwear layered looks, sporty athleisure, preppy collared looks, or relaxed linen summer looks — individually varied in cut per person but coordinated in overall formality/vibe across the trio. Work a touch of soft blue and/or green into each option's outfits somewhere (doesn't need to dominate — an accent piece per person is enough), rest of the palette can be neutral. No two options should read as the same outfit set in a different color, and don't default to the same 3 archetypes every generation.

Within EACH of the 3 option images, show two full-body group poses of that option's trio, side by side:
LEFT group: front-facing full-body pose, all three standing up straight as individual figures, each in their own separate standing position spaced apart from one another with clear visible gaps between each person — not touching, not clustered together, not overlapping, no arm-around-shoulder contact — evenly spaced across the frame like three individual portrait poses placed side by side, all looking directly at the camera.
RIGHT group: 45-degree angled full-body pose, all three turned at a 45-degree angle from camera, standing up straight in the same evenly spaced, separated arrangement as the left group — each person still their own independent standing figure with clear space between them, not clustered — looking in the same direction their bodies are turned toward — not at the camera — natural head-and-gaze match to the body angle for each person.

Background: neutral seamless light grey studio background, soft even studio lighting, no harsh shadows, no clutter, identical across all 3 options.

Style: photorealistic commercial studio photography, sharp focus, natural fabric folds and textures, anatomically correct hands and feet with five fingers each on all three characters, consistent facial identity and hairstyle for each person between the two poses within each option, premium believable realism, not overly fashion-editorial.

No text, no labels, no watermark, no logos anywhere in any image.

Format: 3 separate still images, vertical 9:16 portrait aspect ratio, full body visible head to toe for all three in both poses, same framing and canvas size across all 3. Do not output this as one image with 3 panels side by side — 3 separate image files/generations only.`
        },
        'Wardrobe': {
            title: 'Group wardrobe — garment flat-lay',
            note: 'Garment-only flat-lay, 3 coordinated outfit sets to pick from before redressing the trio.',
            prompt: `Generate 3 separate, individual garment-only flat-lay images (not a grid, not a filmstrip, not a collage, not a split-screen, not a triptych, not panels divided by borders or lines within one canvas — these must be 3 completely separate, independent photographs, each its own full-canvas image). If your platform can only output one image per turn, generate and post the 3 one at a time in sequence — do not stitch or compress them into a single combined picture to fit them in one response. No people, no mannequins, no body parts anywhere in any image.

Each image is one distinct coordinated outfit set for the same three-person casting brief (two women's outfits + one man's outfit, shown together in one flat-lay grouping): simple, clean modern casual outfits, individually varied in cut per person but coordinated in palette — soft blue and/or green tones running across the set (brand palette). Vary the exact cut, color balance, and styling detail across the 3 sets so there are real options to choose from, while keeping the same simple casual character type as the CMLink talent look (not overly formal, not sporty, not flashy).

Layout: all garments for the trio shown fully unfolded and laid flat at full size on a neutral surface (soft grey or white), arranged neatly as a styled flat-lay grouped by person, not folded or stacked. Soft even top-down studio lighting, true-to-life fabric colors and textures, sharp focus on fabric weave and detail.

No people, no mannequins, no body parts, no text, no labels, no brand tags or logos visible anywhere in any image.

Format: 3 separate still images, vertical 9:16 portrait aspect ratio, same framing and background across all 3. Do not output this as one image with 3 panels side by side — 3 separate image files/generations only.`
        },
        'Outfit Swap': {
            title: 'Group outfit swap template',
            note: 'Combine approved Master Shot + chosen outfit set to redress the trio, still front + 45°.',
            prompt: `Using the two uploaded images — the first is the approved master group reference sheet (front-facing and 45-degree full-body group poses), the second is the chosen coordinated outfit-set flat-lay reference — redress the same three friends from the master reference into the exact outfits shown in the garment image (each friend into their corresponding garment set).

Keep everything else from the master reference unchanged: same faces, identities, hairstyles, skin tones, body proportions, same neutral grey studio background, same lighting, same standing group arrangement and camera framing as the master reference.

LEFT group: front-facing full-body pose, all three standing up straight in the same relaxed cluster as the master reference, looking directly at the camera, each wearing their new outfit exactly as shown in the garment reference image.

RIGHT group: 45-degree angled full-body pose, all three turned at a 45-degree angle, standing up straight in the same relaxed cluster arrangement, looking in the same direction their bodies are turned toward — not at the camera. Wearing the same new outfits as the left group, matching in styling, fit, and color exactly.

Style: photorealistic commercial studio photography, sharp focus, natural fabric folds, anatomically correct hands and feet on all three, consistent facial identities between both poses.

No text, no labels, no watermark, no logos anywhere in the image.

Format: single still image, vertical 9:16 portrait aspect ratio, full body visible head to toe for all three in both poses.`
        },
        'Action Studio': {
            title: 'Group studio action — huddled around phone',
            note: 'Guna gambar master shot yang dah approve sebagai reference upload.',
            prompt: `Using the uploaded reference image — the approved master group reference sheet — generate 3 separate, individual studio action shots of the same three friends (not a grid, not a filmstrip, not a collage, not a split-screen, not a triptych, not panels divided by borders or lines within one canvas — these must be 3 completely separate, independent photographs, each its own full-canvas image). If your platform can only output one image per turn, generate and post the 3 one at a time in sequence — do not stitch or compress them into a single combined picture to fit them in one response. Keep the exact same faces, identities, hairstyles, skin tones, body proportions, and outfits as the reference in all 3 images.

Give each of the 3 images a genuinely different action and group dynamic — not three variations of the same "all looking at the phone" moment. One of them should be holding an iPhone 17 Pro Max in each image, but the phone is not always the focus of the group's attention:

Option 1: the group standing in easy conversation, one holding the phone down at their side, not looking at it — instead the three are looking at each other or toward the camera, mid-conversation, natural relaxed body language.

Option 2: caught mid-motion as if walking or turning together, one holding the phone loosely at waist height, the group's attention on each other — someone gesturing while talking, natural candid group energy, not phone-focused.

Option 3: mid-laugh, heads tilted back or turned toward one another, the phone visible in someone's hand but forgotten in the moment of shared laughter, dynamic candid energy across all three.

Keep faces, hairstyles, and outfits identical across all 3 — only the pose, action, and group dynamic change.

Background: neutral seamless light grey studio backdrop, soft even studio lighting with a gentle catch-light, no harsh shadows.

Style: photorealistic commercial studio lifestyle photography, sharp focus across all three faces and the phone, natural fabric folds, anatomically correct hands, same facial identities as the reference image across all 3, believable natural group realism, candid unposed energy.

No text, no labels, no watermark, no logos anywhere in any image, including the phone screen — keep it a soft blurred glow, no readable UI.

Format: 3 separate still images, vertical 9:16 portrait aspect ratio, same framing and canvas size across all 3. Do not output this as one image with 3 panels side by side — 3 separate image files/generations only.`
        },
        'Outdoor Shoot': {
            title: 'Group outdoor lifestyle shot',
            note: 'Lifestyle setting, natural daylight, candid group energy.',
            prompt: `Using the uploaded reference image — the approved master group reference sheet — generate 3 separate, individual outdoor lifestyle shots of the same three friends (not a grid, not a filmstrip, not a collage, not a split-screen, not a triptych, not panels divided by borders or lines within one canvas — these must be 3 completely separate, independent photographs, each its own full-canvas image). If your platform can only output one image per turn, generate and post the 3 one at a time in sequence — do not stitch or compress them into a single combined picture to fit them in one response. Keep the exact same faces, identities, hairstyles, skin tones, body proportions, and outfits as the reference in all 3 images.

Scene (same core scene across all 3, vary only pose/angle/expression as noted): the three friends are walking together or sitting casually along a Singapore street — think HDB estate walkway, a shophouse-lined street (e.g. Tiong Bahru/Chinatown style architecture), a hawker centre seating area, or a café terrace with a Singapore CBD/Marina Bay skyline element visible in the distance — natural daylight (soft midday or golden-hour light), relaxed natural group body language — one glancing at an iPhone 17 Pro Max another is holding, mid-conversation, mid-laugh — not posed stiffly in a lineup at the camera.

Vary these details slightly across the 3 images so I can compare and pick the best one: walking vs. sitting, exact arrangement and spacing of the group, and micro-expression (mid-laugh vs. relaxed conversation vs. soft smiles). Keep everything else — faces, hairstyles, outfits, Singapore location type, lighting — identical across all 3.

Background: softly blurred authentic Singapore streetscape — recognizable local architecture such as HDB blocks, colonial-era shophouses, or a hawker centre, optionally with a soft distant skyline silhouette recognizable as Singapore (e.g. Marina Bay Sands) — believable shallow depth of field keeping the group sharp while the background is softly out of focus, natural tropical ambient light and shadow.

Style: photorealistic lifestyle/editorial street photography, natural candid group energy, sharp focus on all three subjects, anatomically correct hands and natural fabric movement, same facial identities as the reference image across all 3, not overly polished or CGI-looking.

No text, no logos, no watermark, no readable signage anywhere in any image.

Format: 3 separate still images, vertical 9:16 portrait aspect ratio, same framing and canvas size across all 3. Do not output this as one image with 3 panels side by side — 3 separate image files/generations only.`
        },
        'Street Flash': {
            title: 'Group street flash shot',
            note: 'Candid slow-shutter flash street photography, night city atmosphere.',
            prompt: `Using the uploaded reference image — the approved master group reference sheet — generate 3 separate, individual candid slow-shutter flash street-photography shots of the same three friends (not a grid, not a filmstrip, not a collage, not a split-screen, not a triptych, not panels divided by borders or lines within one canvas — these must be 3 completely separate, independent photographs, each its own full-canvas image). If your platform can only output one image per turn, generate and post the 3 one at a time in sequence — do not stitch or compress them into a single combined picture to fit them in one response. Keep the exact same faces, identities, hairstyles, skin tones, body proportions, and outfits as the reference in all 3 images.

Give each of the 3 images a genuinely different action AND a different place — not three walking poses in different backdrops. All 3 share the same candid slow-shutter flash-photography style: direct on-camera flash illuminating the group sharply against a softly motion-blurred background (slow-shutter drag effect), natural candid unposed group energy, caught mid-moment, not looking directly at camera, an iPhone 17 Pro Max visible in one of their hands in each image.

Option 1 — walking: the group mid-stride together along a Singapore street at night — think Chinatown, Tiong Bahru, or a hawker centre/shophouse front — mid-conversation or mid-laugh, glowing shopfronts and wet-look pavement reflections in the background.

Option 2 — sitting or leaning: the group seated together on a bench or leaning against a pillar on an MRT station platform at night, relaxed waiting posture, a completely different body position from Option 1 — a recognisably Singaporean transit moment, no visible station name text or signage.

Option 3 — crouching or bending: the group crouched or bent down together, adjusting shoes or bags at a bus stop or street corner, caught mid-motion in this lowered position, a genuinely different pose from both other options, blurred traffic light trails or bus lights in the background.

Keep faces, hairstyles, and outfits identical across all 3 — only the place and action change.

Background: nighttime Singapore streetscape appropriate to each option's setting (street/shophouse front, MRT platform, or crossing/bus stop) with soft bokeh light trails and a distinctly Singaporean tropical heartland atmosphere rather than a generic city, no readable signage, station names, or route numbers anywhere.

Style: photorealistic candid flash street photography, high contrast between the sharp flash-lit group and the blurred ambient background, authentic grainy film-flash texture, sharp focus across all three faces, anatomically correct hands, same facial identities as the reference image across all 3.

No text, no logos, no watermark, no readable signage anywhere in any image.

Format: 3 separate still images, vertical 9:16 portrait aspect ratio, same framing and canvas size across all 3. Do not output this as one image with 3 panels side by side — 3 separate image files/generations only.`
        },
        'Airport Travel': {
            title: 'Group airport travel shot',
            note: 'Travel attire with luggage, airport terminal setting.',
            prompt: `Using the uploaded reference image — the approved master group reference sheet — generate 3 separate, individual airport travel shots of the same three friends (not a grid, not a filmstrip, not a collage, not a split-screen, not a triptych, not panels divided by borders or lines within one canvas — these must be 3 completely separate, independent photographs, each its own full-canvas image). If your platform can only output one image per turn, generate and post the 3 one at a time in sequence — do not stitch or compress them into a single combined picture to fit them in one response. Keep the exact same faces, identities, hairstyles, skin tones, body proportions, and outfits as the reference in all 3 images, but now dressed for travel: comfortable travel-appropriate outer layers over their usual outfits, practical travel shoes, each pulling their own carry-on suitcase.

Scene: the group is walking together through an airport terminal, suitcases in tow, one holding an iPhone 17 Pro Max and passports, natural candid group energy — chatting, laughing, or glancing at the phone together, not posed stiffly in a lineup at the camera.

Vary these details across the 3 images so I can compare and pick the best one — Option 1: all three mid-stride walking together pulling suitcases; Option 2: paused together near a window, suitcases grouped, looking at a phone/passport together; Option 3: candid over-the-shoulder walking moment, mid-laugh, suitcases in hand. Keep faces, hairstyles, and outfits identical across all 3.

Background: a clean, modern airport terminal interior — departure boards, large glass windows, soft natural daylight, other travelers softly blurred in the background as atmosphere, not identifiable subjects.

Style: photorealistic lifestyle/editorial travel photography, natural candid group energy, sharp focus across all three faces, anatomically correct hands, same facial identities as the reference image across all 3, not overly polished or CGI-looking.

No text, no logos, no watermark, no readable signage, gate numbers, or airline branding anywhere in any image.

Format: 3 separate still images, vertical 9:16 portrait aspect ratio, same framing and canvas size across all 3. Do not output this as one image with 3 panels side by side — 3 separate image files/generations only.`
        },
        'Traveler': {
            title: 'Group traveler shot',
            note: 'Traveler outfit abroad, camera instead of phone.',
            prompt: `Using the uploaded reference image — the approved master group reference sheet — generate 3 separate, individual traveler-style shots of the same three friends (not a grid, not a filmstrip, not a collage, not a split-screen, not a triptych, not panels divided by borders or lines within one canvas — these must be 3 completely separate, independent photographs, each its own full-canvas image). If your platform can only output one image per turn, generate and post the 3 one at a time in sequence — do not stitch or compress them into a single combined picture to fit them in one response. Keep the exact same faces, identities, hairstyles, skin tones, body proportions, and outfits as the reference in all 3 images, but now dressed as travelers abroad: versatile lightweight travel outfits layered over their usual looks (light jackets, vests, or scarves), comfortable walking shoes, small crossbody bags or backpacks. At least one of them is holding or wearing a compact mirrorless-style camera on a neck strap — plain, unbranded design, no visible logos or brand marks. No phones in this shot — the camera replaces them as the group's only prop.

Give each of the 3 images a genuinely different travel moment:

Option 1: walking together through a charming overseas old-town street lined with cafés and small shopfronts, one holding the camera up mid-shot while the others walk alongside, candid unposed group energy.

Option 2: standing together at a scenic outdoor viewpoint or overlook, one holding the camera lowered as the group looks at a photo on the screen together, natural shared smiles.

Option 3: mid-motion, walking or turning together as if one just captured a photo of the group, natural laughter, camera visible hanging from its strap.

Keep faces, hairstyles, and outfits identical across all 3 — only the setting and action change.

Background: a generic, non-landmark-specific overseas travel setting matching each option (charming old-town street, scenic outdoor viewpoint, or a lively unbranded plaza), natural daylight, softly blurred surroundings. No readable signage, no real identifiable landmarks or monuments, no flags or country-specific iconography.

Style: photorealistic lifestyle/editorial travel photography, natural candid group energy, sharp focus across all three faces, anatomically correct hands, same facial identities as the reference image across all 3, not overly polished or CGI-looking.

No text, no logos, no watermark, no readable signage or landmark branding anywhere in any image.

Format: 3 separate still images, vertical 9:16 portrait aspect ratio, same framing and canvas size across all 3. Do not output this as one image with 3 panels side by side — 3 separate image files/generations only.`
        },
        'Product / QR / SIM': {
            title: 'Group product interaction shot',
            note: 'Booth-relevant moment: SIM packaging or QR scan interaction, together.',
            prompt: `Using the uploaded reference image — the approved master group reference sheet — generate 3 separate, individual product-interaction shots of the same three friends (not a grid, not a filmstrip, not a collage, not a split-screen, not a triptych, not panels divided by borders or lines within one canvas — these must be 3 completely separate, independent photographs, each its own full-canvas image). If your platform can only output one image per turn, generate and post the 3 one at a time in sequence — do not stitch or compress them into a single combined picture to fit them in one response. Keep the exact same faces, identities, hairstyles, skin tones, body proportions, and outfits as the reference in all 3 images.

Scene: the group is engaging with the CMLink SIM product moment together. Vary the exact interaction across the 3 images so I can compare and pick the best one — Option 1: one friend holding up a simple unbranded white SIM card packaging box while the other two lean in to look; Option 2: one friend holding an iPhone 17 Pro Max up at chest-to-eye level as if scanning a QR code while the others watch with natural curiosity; Option 3: all three gathered close, one mid-gesture unboxing the SIM packaging. Keep faces, hairstyles, and outfits identical across all 3.

Background: neutral seamless light grey studio backdrop, soft even studio lighting with a gentle catch-light, no harsh shadows.

Style: photorealistic commercial studio lifestyle photography, sharp focus across all three faces, hands, and props, anatomically correct hands, same facial identities as the reference image across all 3, believable natural group realism, candid unposed energy.

No text, no labels, no watermark, no logos anywhere in any image — keep the SIM packaging plain/unbranded and the phone screen a soft blurred glow only, no readable UI, no scannable QR pattern.

Format: 3 separate still images, vertical 9:16 portrait aspect ratio, same framing and canvas size across all 3. Do not output this as one image with 3 panels side by side — 3 separate image files/generations only.`
        },
        'Close-up Crop': {
            title: 'Group close-up crop shot',
            note: 'Tight faces + phone framing for banners, story ads, or thumbnails.',
            prompt: `Using the uploaded reference image — the approved master group reference sheet — generate 3 separate, individual close-up crop shots of the same three friends (not a grid, not a filmstrip, not a collage, not a split-screen, not a triptych, not panels divided by borders or lines within one canvas — these must be 3 completely separate, independent photographs, each its own full-canvas image). If your platform can only output one image per turn, generate and post the 3 one at a time in sequence — do not stitch or compress them into a single combined picture to fit them in one response. Keep the exact same faces, identities, hairstyles, skin tones, body proportions, and outfits as the reference in all 3 images.

Scene: a tight close-up crop from roughly chest/shoulders up, all three friends grouped closely together, one holding an iPhone 17 Pro Max in the middle of the group at collarbone height, everyone looking at the phone together with soft natural expressions — designed for use as a cropped banner, story ad, or thumbnail, so keep all three faces and the phone clearly readable within the tight frame.

Vary these details across the 3 images so I can compare and pick the best one: exact head angles and how closely they're huddled, and micro-expression (soft smiles vs. shared light laughter vs. relaxed focused curiosity). Keep everything else — faces, hairstyles, outfits, background, lighting — identical across all 3.

Background: neutral seamless light grey studio backdrop, softly blurred, so the group reads clearly even at small crop sizes.

Style: photorealistic commercial studio portrait photography, sharp focus across all three faces and the phone, anatomically correct hands, same facial identities as the reference image across all 3, clean and legible at small sizes.

No text, no labels, no watermark, no logos anywhere in any image, including the phone screen — keep it a soft blurred glow, no readable UI.

Format: 3 separate still images, vertical 9:16 portrait aspect ratio, crop-friendly framing with the group centered and headroom, same framing and canvas size across all 3. Do not output this as one image with 3 panels side by side — 3 separate image files/generations only.`
        },
        'Reaction / Promo-Excited': {
            title: 'Group reaction shot',
            note: 'Genuine shared surprised-delight reaction, suited for promo/discount callouts.',
            prompt: `Using the uploaded reference image — the approved master group reference sheet — generate 3 separate, individual excited-reaction shots of the same three friends (not a grid, not a filmstrip, not a collage, not a split-screen, not a triptych, not panels divided by borders or lines within one canvas — these must be 3 completely separate, independent photographs, each its own full-canvas image). If your platform can only output one image per turn, generate and post the 3 one at a time in sequence — do not stitch or compress them into a single combined picture to fit them in one response. Keep the exact same faces, identities, hairstyles, skin tones, body proportions, and outfits as the reference in all 3 images.

Scene: the group is reacting together with genuine surprised delight while looking at an iPhone 17 Pro Max one of them is holding, as if they've just seen a great promo or deal — bright natural smiles, shared energetic but believable reactions, not cartoonish or overacted.

Vary these details across the 3 images so I can compare and pick the best one — Option 1: all three leaning in toward the phone, mouths open in happy shared laughter; Option 2: one holding the phone up while the other two react with hands near their faces in pleasant surprise; Option 3: one pointing excitedly at the phone screen while the others smile and look on. Keep faces, hairstyles, and outfits identical across all 3.

Background: neutral seamless light grey studio backdrop, soft even studio lighting with a gentle catch-light, no harsh shadows.

Style: photorealistic commercial studio lifestyle photography, sharp focus across all three faces and the phone, natural energetic but believable group expression, anatomically correct hands, same facial identities as the reference image across all 3.

No text, no labels, no watermark, no logos anywhere in any image, including the phone screen — keep it a soft blurred glow, no readable UI.

Format: 3 separate still images, vertical 9:16 portrait aspect ratio, same framing and canvas size across all 3. Do not output this as one image with 3 panels side by side — 3 separate image files/generations only.`
        }
    }

    // 'Phone' has no shot-type prompts — it's a single reference-photo category (team picks one
    // approved iPhone 17 Pro Max reference photo to standardize on; no AI generation prompt needed).
};

// The multi-reference "combo line" (see report §6) — surfaced as a copyable snippet in the Gallery
// tab. Used when a shot needs BOTH the approved identity reference AND a real iPhone 17 Pro Max
// product photo, since text alone can't reliably render a specific recent phone model.
const CMLINK_COMBO_LINE = `Using the uploaded Reference A (identity photo) as the approved identity — keep the exact same face(s), hairstyle(s), skin tone(s), body proportions, and outfit(s) as shown. Using the uploaded Reference B as the exact phone to match in every generated image — same color, camera layout, and shape as shown, no other phone model.`;

if (typeof window !== 'undefined') {
    window.CMLINK_GALLERY_CATEGORIES = CMLINK_GALLERY_CATEGORIES;
    window.CMLINK_SHOT_TYPES = CMLINK_SHOT_TYPES;
    window.CMLINK_SHOT_TYPES_BY_CATEGORY = CMLINK_SHOT_TYPES_BY_CATEGORY;
    window.CMLINK_SHOT_TYPE_DESCRIPTIONS = CMLINK_SHOT_TYPE_DESCRIPTIONS;
    window.CMLINK_PROMPTS = CMLINK_PROMPTS;
    window.CMLINK_COMBO_LINE = CMLINK_COMBO_LINE;
}
