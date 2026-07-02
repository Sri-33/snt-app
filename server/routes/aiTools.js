import { Router } from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const MAX_LISTING_IMAGES = 50;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: MAX_LISTING_IMAGES },
});

router.use(requireAuth);

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OpenAI API key not configured');
  return new OpenAI({ apiKey: key });
}

async function chat(system, user) {
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.7,
  });
  return completion.choices[0]?.message?.content?.trim() || '';
}

const LISTING_COLOR_RULES = `COLOUR NAMING (critical — premium SNT style):
NEVER use basic/plain colour names (Green, Red, Yellow, Blue, Pink, Purple, Orange, Brown, Black, White) on their own.
ALWAYS use deep, rich, premium shade names — usually two words — that match what you see in the photo.

Body colour examples:
Bottle Green, Forest Green, Emerald Green, Olive Green, Teal Blue, Royal Blue, Navy Blue, Indigo Blue, Sky Blue, Fuchsia Pink, Ruby Red, Wine Red, Crimson Red, Maroon Red, Copper Gold, Antique Gold, Mustard Yellow, Golden Yellow, Mango Yellow, Turmeric Yellow, Lavender Purple, Royal Plum, Deep Magenta, Aqua Green, Mint Green, Peach Orange, Coral Pink, Chocolate Brown, Coffee Brown, Brick Red, Soft Lavender, Onion Pink, Rani Pink, Mehendi Green

Border/contrast examples:
Royal Blue Paisley Zari Border, Copper Gold Temple Border, Maroon Kolam Border, Wine Contrast Border, Royal Plum Contrast Peacock Border, Aqua Green Contrast, Golden Zari Woven Border, Temple Gold Border, Contrast Maroon Border

Study each image carefully — choose the deepest, most accurate shade (dark green → Bottle Green or Forest Green; bright red → Ruby Red or Crimson Red; golden yellow → Mustard Yellow or Golden Yellow). Never shorten to a single basic colour word.

Contrast phrasing: use "with Royal Plum Contrast", "with Wine Contrast", "with Aqua Green Contrast" OR "with Copper Gold Temple Border" — premium SNT style.`;

const LISTING_TITLE_FORMAT = `TITLE FORMAT — always use this exact pipe structure (no price in title):
Premium [Elampillai if applicable] [Saree Type] – [Deep Body Shade] with [Contrast/Border Detail] | [Occasion SEO Phrase] | Sri Nandhini Tex | [Product Code]

GOLD STANDARD — match this style:
Premium Elampillai Mayuri Silk Saree – Soft Lavender with Royal Plum Contrast | Traditional Wedding Silk Saree | Sri Nandhini Tex | SNTMS002

More SNT examples:
- Premium Elampillai Mayil Pattu Saree – Teal Blue with Royal Blue Paisley Zari Border | Sri Nandhini Tex | SNTMPS003
- Premium Elampillai Samudhrikha Pattu Saree – Fuchsia Pink with Copper Gold Temple Border | Traditional Wedding Silk Saree | Sri Nandhini Tex | SNTSP009
- Premium Soft Silk Saree – Navy Blue with Wine Contrast Border | Sri Nandhini Tex | SNTSS017
- Premium Sungudi Cotton Saree – Bottle Green with Maroon Kolam Border | Festive Cotton Saree | Sri Nandhini Tex | SCS001

Title rules:
- Add "Elampillai" for Mayuri Silk, Mayil Pattu, Samudhrikha Pattu and Elampillai-origin weaves
- Middle section = occasion SEO phrase (Traditional Wedding Silk Saree, Festive Cotton Saree, Bridal Pattu Saree, etc.)
- Use exact Product Code from seller instructions as the last segment`;

const LISTING_DESCRIPTION_FORMAT = `DESCRIPTION FORMAT — match real SNT Shopify listings (SEO-rich + proper emojis only):

NO markdown (no **bold**). Use emojis ONLY in these specific places:

1. Opening — 2-3 paragraphs, SEO keywords woven in, optional single ✨ at end of closing sentence
2. Product Details — section header then • bullet lines (fabric, color, work, border, texture, occasion, blouse, care)
3. Highlights — each line starts with ✨ (one highlight per line):
   ✨ Premium Wedding Collection
   ✨ Elegant Traditional Weaving
   ✨ Soft & Comfortable Drape
4. Why You'll Love It — each line starts with ♥
   ♥ Elegant Traditional Look
   ♥ Comfortable for Long Wear
   ♥ Vibrant, Long-Lasting Colors
5. Closing festive line — end with ✨
6. Footer lines (plain text):
   Vendor: Sri Nandhini Tex
   Product Code: [code]
   Collection: [name]
   Material: [fabric]
   Occasion: Wedding | Festive | Traditional
7. Price if given: 💎 Price: ₹[amount] + Shipping

EXAMPLE STYLE (Mayuri Silk):
Celebrate your special moments with timeless tradition and premium elegance.

This beautiful Elampillai Mayuri Silk Saree is designed with a graceful Soft Lavender body enriched by elegant traditional Mayuri weaving motifs and finished with a luxurious Royal Plum contrast border for a rich and sophisticated festive appearance.

Crafted for women who love premium traditional styling, this saree brings together elegance, comfort, and celebration in one graceful drape.

Product Details

• Fabric: Premium Elampillai Mayuri Silk
• Color: Soft Lavender × Royal Plum Contrast
• Work: Rich Traditional Mayuri Weaving
• Border: Premium Contrast Peacock Border
• Texture: Soft Premium Finish
• Occasion: Muhurtham • Wedding • Reception • Engagement • Temple Wear • Festive Wear

Highlights

✨ Premium Wedding Collection
✨ Elegant Traditional Weaving
✨ Rich Grand Appearance
✨ Soft & Comfortable Drape
✨ Timeless South Indian Elegance
✨ Signature Mayuri Border Design

Perfect for creating unforgettable wedding and festive moments.

Vendor: Sri Nandhini Tex
Product Code: SNTMS002

For multi-colour products: mention "available in multiple rich colour variants" in opening — do NOT list every colour in description when titles already cover them.`;

const LISTING_SYSTEM_SINGLE = `You are SNT Product Listing Assistant for Sri Nandhini Tex, a premium saree brand from Elampillai, Tamil Nadu.

Create a complete SEO-rich Shopify product listing. Use seller notes and product photo. Use the exact product code provided in seller instructions at the end of the title (never "[SKU]" or "SKU" alone when a code is given).

${LISTING_COLOR_RULES}

${LISTING_TITLE_FORMAT}

${LISTING_DESCRIPTION_FORMAT}

META TITLE (max 60 chars) | META DESCRIPTION (max 160 chars) | exactly 10 TAGS (match actual fabric — cotton saree not silk saree for cotton products)

OUTPUT FORMAT:
━━━━━━━━━━━━━━━━━━
💎 TITLE:
[one title]

✨ DESCRIPTION:
[full description]

🔎 META TITLE:
[meta title]

🔎 META DESCRIPTION:
[meta description]

🏷 TAGS:
[10 tags]
━━━━━━━━━━━━━━━━━━`;

const LISTING_SYSTEM_MULTI = `You are SNT Product Listing Assistant for Sri Nandhini Tex, a premium saree brand from Elampillai, Tamil Nadu.

The seller uploads MULTIPLE photos of the SAME saree type in DIFFERENT COLOURS. Each photo = one colour variant.

${LISTING_COLOR_RULES}

YOUR TASK:
1. Analyze EACH attached image in order (Image 1, Image 2, etc.)
2. For each image, identify the deep/rich body shade and border/contrast colour from the photo
3. Write ONE unique SEO title per image using premium colour names (same saree type, different deep shade per photo)
4. Write ONE common description for the whole Shopify product (covers all colours, collection-level SEO)

${LISTING_TITLE_FORMAT}

${LISTING_DESCRIPTION_FORMAT}

ONE shared description for all colour variants — mention multiple colours available, use Highlights with ✨ and Why You'll Love It with ♥.

NEVER write "Multicolor" or basic single-word colours (Green, Red, Yellow, Blue) in titles — always use deep premium shade names from each image.
Use the exact PRODUCT CODE given in seller instructions at the end of each title (never "[SKU]" or "SKU" alone).

OUTPUT FORMAT (${'{N}'} = number of images):
━━━━━━━━━━━━━━━━━━
💎 TITLES:

1. [title from Image 1]

2. [title from Image 2]

[...one numbered title per image...]

✨ DESCRIPTION:
[one common description for all colour variants]

🔎 META TITLE:
[collection-level meta]

🔎 META DESCRIPTION:
[meta description]

🏷 TAGS:
[10 tags]
━━━━━━━━━━━━━━━━━━`;

const CAPTION_SYSTEM = `You are SNT Instagram Caption Writer for Sri Nandhini Tex (@srinandhinitex / @elampillaisarees11), a premium saree brand from Elampillai, Tamil Nadu.

Write ONE complete Instagram caption matching this EXACT premium SNT structure and emoji style. Use the seller's saree name, price, and/or details — any combination may be provided (sometimes name only, sometimes price only, sometimes full description). Fill gaps intelligently from the saree name/type.

━━ REFERENCE CAPTION (match this structure & tone) ━━
💬 Comment "SAREE" 🦚 to receive all available colours & complete order details instantly. ✨

🦚 Where Tradition Meets Timeless Elegance 💙

Wrap yourself in the rich heritage of our Premium Elampillai Mayil Pattu Saree, beautifully crafted with exquisite peacock zari weaving, luxurious silk texture, and elegant royal colour combinations.

Perfect for Weddings • Muhurtham • Receptions • Temple Visits • Festive Celebrations 💙👑

✨ Premium Elampillai Mayil Pattu
🦚 Rich Peacock Zari Weaving
💙 Grand Contrast Border & Designer Pallu
💫 Soft • Elegant • Comfortable Drape

💰 Price: ₹1300 + Shipping

📲 WhatsApp: 8190951631

🌐 Shop Online:
www.srinandhinitex.com

🤍 Comment "SAREE" to receive all colours, videos & complete order details instantly.

#MayilPattuSaree #ElampillaiSaree #SilkSareeCollection #WeddingSaree #SriNandhiniTex
[...25 more hashtags to total 30]

MANDATORY CAPTION SECTIONS (in this order):
1. Opening CTA: 💬 Comment "SAREE" 🦚 to receive all available colours & complete order details instantly. ✨
2. Tagline: 🦚 [aspirational line about tradition/elegance/heritage] 💙
3. Body paragraph: 2-3 sentences — rich, emotional, describe fabric/weave/colours/feel using seller details
4. Occasions line: Perfect for [Occasion] • [Occasion] • ... 💙👑 (4-6 occasions)
5. Feature bullets — exactly 4 lines, each starting with premium emoji (✨ 🦚 💙 💫 💖 👑 🌸):
   - Line 1: product/type highlight
   - Line 2: weave/zari/work highlight
   - Line 3: border/pallu/design highlight
   - Line 4: feel/drape comfort (use • between words)
6. Price line: 💰 Price: ₹[amount] + Shipping — ONLY if price provided; if no price, skip this line entirely
7. 📲 WhatsApp: 8190951631 (always exactly this)
8. 🌐 Shop Online: / www.srinandhinitex.com (always)
9. Closing CTA: 🤍 Comment "SAREE" to receive all colours, videos & complete order details instantly.
10. Blank line then exactly 30 hashtags

EMOJI RULES:
- Use premium emojis like the reference: 💬 🦚 ✨ 💙 💫 💖 👑 💰 📲 🌐 🤍
- Do NOT use cheap/generic spam emojis
- Warm South Indian premium saree brand tone — never "Introducing" or "Check out"

HASHTAG RULES (30 total):
- Mix product-specific tags from saree name (e.g. #MayilPattuSaree #ElampillaiSaree)
- Always include #SriNandhiniTex #ElampillaiSarees
- Balance: fabric type, occasion, wedding, silk/cotton as appropriate, Tamil/south Indian fashion

If only saree name given: infer fabric type, weave, occasions from name (Mayil Pattu → peacock zari silk, wedding)
If only price given: write elegant caption for "Premium Saree Collection" using price
If only details given: extract name/type from details for hashtags and bullets

OUTPUT FORMAT:
━━━━━━━━━━━━━━━━━━
✨ INSTAGRAM CAPTION:

[full caption with line breaks exactly as posted on Instagram]

[blank line]

[all 30 hashtags on one or more lines]
━━━━━━━━━━━━━━━━━━`;

function buildCaptionUserPrompt({ sareeName, price, sareeDetails }) {
  const parts = [];
  if (sareeName?.trim()) parts.push(`Saree Name: ${sareeName.trim()}`);
  if (price?.trim()) parts.push(`Price: ₹${price.trim().replace(/^₹/, '')}`);
  if (sareeDetails?.trim()) parts.push(`Details: ${sareeDetails.trim()}`);
  return parts.join('\n') || '';
}

const COPY_SYSTEM = `You are SNT Marketing Copywriter for Sri Nandhini Tex, a premium silk saree brand from Elampillai, Tamil Nadu.

BRAND VOICE: Warm, trustworthy, festive, South Indian family values. Premium but approachable. English only.

WHATSAPP BROADCAST RULES:
- Max 3 paragraphs
- Start with a hook (not Hi or Dear Customer)
- End with CTA: Shop now → srinandhinitex.com
- Always give 2 variations: one emotional, one offer-focused

OUTPUT FORMAT:
━━━━━━━━━━━━━━━━━━
💫 COPY:

✦ Version 1 — [label]:
[message]

✦ Version 2 — [label]:
[message]
━━━━━━━━━━━━━━━━━━`;

const YOUTUBE_WHATSAPP_LINK = 'https://wa.me/916379833991';
const YOUTUBE_SHOP_URL = 'www.srinandhinitex.com';
const YOUTUBE_IG_HANDLES = `👉 @elampillaisarees11 – https://www.instagram.com/elampillaisarees11
👉 @sri_nandhini_tex_elampillai – https://www.instagram.com/sri_nandhini_tex_elampillai`;

const YOUTUBE_SYSTEM = `You are SNT YouTube Shorts Specialist for Sri Nandhini Tex, a silk saree brand from Elampillai, Tamil Nadu with 13.1K YouTube subscribers (@elampillaisarees11).

CHANNEL STYLE: Saree showcases, clearance sales, new arrivals, draping, festive collections. Viral, hook-driven, South Indian audience. English only.

TITLE RULES (3 options):
- Max 60 characters each
- Start with a power word or number (e.g. "This", "Wait", "POV", "Only ₹750")
- Include saree type or offer keyword
- Create curiosity or FOMO
- No clickbait — must match the actual video

DESCRIPTION — match this EXACT SNT YouTube structure and emoji style:

━━ REFERENCE DESCRIPTION (follow this layout) ━━
🔥 CLEARANCE SALE ALERT! 🔥
Warm Silk Sarees at just ₹750 — Limited Stock, First Come First Served!

✅ Premium Quality Silk
✅ Unbeatable Price – ₹750 Only
✅ Fast Delivery Across India
✅ Easy Returns & Exchanges

📲 Order on WhatsApp: ${YOUTUBE_WHATSAPP_LINK}
🌐 Shop Online: ${YOUTUBE_SHOP_URL}

📸 Follow us on Instagram:
👉 ${YOUTUBE_IG_HANDLES}

⚡ Hurry! Stock is LIMITED — Once it's gone, it's GONE!

👍 Like | 🔔 Subscribe | 💬 Comment your favorite color

#SilkSaree #ClearanceSale #SareeAt750 #SriNandhiniTex
#ElampillaiSarees #SilkSareeSale #CheapSilkSaree
#SareeSale #TamilNaduSarees #OnlineSareeShop

MANDATORY DESCRIPTION SECTIONS (in this order):
1. Hook headline — 2 emojis framing it (🔥 ⚡ 💥 🎉 etc.) + ALL CAPS alert/offer line
2. One-liner — product name + price if given + urgency (Limited Stock, First Come First Served, etc.)
3. Blank line
4. Exactly 4 benefit bullets — each starts with ✅ (quality, price, delivery, returns/exchange)
5. Blank line
6. 📲 Order on WhatsApp: ${YOUTUBE_WHATSAPP_LINK} (always exactly this link)
7. 🌐 Shop Online: ${YOUTUBE_SHOP_URL} (always exactly this)
8. Blank line
9. 📸 Follow us on Instagram: then both handles on separate lines with 👉 and full Instagram URLs (exactly as reference)
10. Blank line
11. ⚡ Urgency closing line — FOMO about limited stock
12. Blank line
13. 👍 Like | 🔔 Subscribe | 💬 Comment your favorite color (always exactly this)
14. Blank line
15. 10–15 relevant hashtags — product-specific, include #SriNandhiniTex #ElampillaiSarees, price tags if applicable (#SareeAt750 style)

INPUT FLEXIBILITY:
- Seller may send saree name only, price only, offer details only, or any combination
- Infer fabric type, occasion, and hook style from saree name (clearance sale vs new arrival vs showcase)
- If no price given, use "DM for Price" or skip price bullet and focus on collection/quality
- Adapt hook (CLEARANCE SALE, NEW ARRIVAL, PREMIUM COLLECTION) to match what seller describes

OUTPUT FORMAT:
━━━━━━━━━━━━━━━━━━
🎥 YOUTUBE SHORTS:

📌 TITLE OPTIONS:
1. [title 1]
2. [title 2]
3. [title 3]

✨ DESCRIPTION:
[full description ready to paste into YouTube — line breaks exactly as posted]

#️⃣ HASHTAGS:
[same hashtags repeated or listed again for easy copy]
━━━━━━━━━━━━━━━━━━`;

function buildYoutubeUserPrompt({ sareeName, price, details }) {
  const parts = [];
  if (sareeName?.trim()) parts.push(`Saree / Offer: ${sareeName.trim()}`);
  if (price?.trim()) parts.push(`Price: ₹${price.trim().replace(/^₹/, '')}`);
  if (details?.trim()) parts.push(`Details: ${details.trim()}`);
  return parts.join('\n') || '';
}

function handleError(res, err) {
  console.error('AI Tools error:', err);
  if (err.message === 'OpenAI API key not configured') {
    return res.status(503).json({ error: err.message });
  }
  return res.status(500).json({ error: err.message || 'AI generation failed' });
}

function isAiRefusal(text) {
  if (!text) return true;
  const lower = text.toLowerCase();
  return (
    lower.includes('cannot fulfill') ||
    lower.includes("can't fulfill") ||
    lower.includes("can't assist") ||
    lower.includes('cannot assist') ||
    lower.includes('unable to assist') ||
    (lower.includes("i'm sorry") && (lower.includes('cannot') || lower.includes("can't")))
  );
}

function isValidListingOutput(text, multi) {
  if (!text || isAiRefusal(text)) return false;
  return multi ? text.includes('💎 TITLES:') : text.includes('💎 TITLE:');
}

const SKU_TYPE_PREFIXES = [
  [/sungudi\s*cotton/i, 'SCS'],
  [/mayil\s*pattu|mayilpattu/i, 'SNTMPS'],
  [/samudhrikha/i, 'SNTSP'],
  [/soft\s*silk/i, 'SNTSS'],
  [/mayuri\s*silk/i, 'SNTMS'],
  [/neelambari/i, 'SNTNS'],
  [/kanjivaram|kanjeevaram/i, 'SNTKPS'],
  [/kalyani\s*cotton/i, 'KCS'],
  [/half\s*saree/i, 'SNTHS'],
  [/pattu/i, 'SNTP'],
  [/cotton/i, 'SCS'],
  [/silk/i, 'SNTS'],
];

function extractCodeFromDetails(details) {
  if (!details) return null;
  const match = details.match(/\b([A-Z]{2,}[A-Z0-9]*\d{3})\b/);
  return match ? match[1] : null;
}

function deriveSkuPrefix(sareeName, details) {
  const explicit = extractCodeFromDetails(details);
  if (explicit) return explicit.replace(/\d+$/, '');

  const name = sareeName.toLowerCase();
  for (const [pattern, prefix] of SKU_TYPE_PREFIXES) {
    if (pattern.test(name)) return prefix;
  }

  const stop = new Set(['premium', 'saree', 'sari', 'elampillai', 'sri', 'nandhini', 'tex', 'the', 'and', 'with']);
  const words = sareeName.split(/\s+/).filter((w) => w.length > 1 && !stop.has(w.toLowerCase()));
  if (words.length >= 2) {
    return words.slice(0, 3).map((w) => w[0].toUpperCase()).join('');
  }
  return 'SNT';
}

function buildSkuCodes(sareeName, details, count) {
  const variantCount = Math.max(1, count);
  const explicit = extractCodeFromDetails(details);

  if (variantCount === 1 && explicit) {
    return [explicit];
  }

  const prefix = deriveSkuPrefix(sareeName, details);
  const startNum = explicit ? parseInt(explicit.match(/\d+$/)[0], 10) : 1;

  return Array.from({ length: variantCount }, (_, i) =>
    `${prefix}${String(startNum + i).padStart(3, '0')}`
  );
}

function formatSkuInstructions(skus, multi) {
  if (multi) {
    return `PRODUCT CODES — use exactly at the end of each matching title:\n${skus
      .map((code, i) => `Image ${i + 1} / Title ${i + 1}: ${code}`)
      .join('\n')}`;
  }
  return `PRODUCT CODE — use exactly at the end of the title: ${skus[0]}`;
}

async function callListingVision(system, userText, imageFiles) {
  const content = [{ type: 'text', text: userText }];
  const detail = imageFiles.length > 6 ? 'low' : 'high';

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const mimeType = file.mimetype || 'image/jpeg';
    content.push({
      type: 'image_url',
      image_url: {
        url: `data:${mimeType};base64,${file.buffer.toString('base64')}`,
        detail,
      },
    });
  }

  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content },
    ],
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content?.trim() || '';
}

async function generateListing({ sareeName, price, details, files }) {
  const imageFiles = files || [];
  const multi = imageFiles.length > 1;
  const system = multi ? LISTING_SYSTEM_MULTI : LISTING_SYSTEM_SINGLE;

  const priceLine = price
    ? `Price: ₹${price.replace(/^[₹Rs.\s]+/i, '')} (show once in description as "💎 Price: ₹X + Shipping")`
    : 'Price: not provided';

  const detailsBlock = details
    ? `Seller notes:\n${details}`
    : 'Seller notes: none — infer from saree name and photos.';

  const variantCount = multi ? imageFiles.length : 1;
  const skuCodes = buildSkuCodes(sareeName, details, variantCount);
  const skuBlock = formatSkuInstructions(skuCodes, multi);

  let userText = `Saree Name: ${sareeName}
${priceLine}

${detailsBlock}

${skuBlock}`;

  if (multi) {
    userText += `

${imageFiles.length} colour-variant photos attached in order.
Image 1 = first photo, Image 2 = second photo, and so on through Image ${imageFiles.length}.
Analyze each image for its specific body shade and border/contrast.
Use deep premium colour names in every title (e.g. Bottle Green, Ruby Red, Mustard Yellow — never plain Green, Red, Yellow).
Write exactly ${imageFiles.length} numbered titles — one per image.
Write exactly ONE common description for the Shopify listing (not per colour).`;
    const output = await callListingVision(system, userText, imageFiles);
    if (isValidListingOutput(output, true)) return output;
    throw new Error('Could not generate listings — try adding saree details or fewer photos');
  }

  if (imageFiles.length === 1) {
    userText += '\n\nOne product photo attached — use it to confirm exact colour and border in the title.';
    const output = await callListingVision(system, userText, imageFiles);
    if (isValidListingOutput(output, false)) return output;
  }

  userText += '\n\nGenerate listing from text' + (imageFiles.length ? ' and photo' : '') + '.';
  let output = imageFiles.length
    ? await callListingVision(system, userText, imageFiles)
    : await chat(system, userText);

  if (!isValidListingOutput(output, false)) {
    output = await chat(system, `${userText}\n\nGenerate from text only.`);
  }
  if (!isValidListingOutput(output, false)) {
    throw new Error('Could not generate listing — try adding saree details or a photo');
  }
  return output;
}

router.post('/listing', upload.array('images', MAX_LISTING_IMAGES), async (req, res) => {
  try {
    const sareeName = (req.body.sareeName || '').trim();
    const price = (req.body.price || '').trim();
    const details = (req.body.sareeDetails || '').trim();
    const files = req.files || [];

    if (!sareeName) {
      return res.status(400).json({ error: 'Saree name is required' });
    }
    if (files.length > MAX_LISTING_IMAGES) {
      return res.status(400).json({ error: `Maximum ${MAX_LISTING_IMAGES} images allowed` });
    }

    const output = await generateListing({ sareeName, price, details, files });
    res.json({ output });
  } catch (err) {
    handleError(res, err);
  }
});

router.post('/caption', async (req, res) => {
  try {
    const sareeName = (req.body.sareeName || '').trim();
    const price = (req.body.price || '').trim();
    const sareeDetails = (req.body.sareeDetails || req.body.details || '').trim();
    const legacyInput = (req.body.input || '').trim();

    const userPrompt = buildCaptionUserPrompt({ sareeName, price, sareeDetails }) || legacyInput;
    if (!userPrompt) {
      return res.status(400).json({ error: 'Provide saree name, price, or details' });
    }

    const output = await chat(CAPTION_SYSTEM, userPrompt);
    res.json({ output });
  } catch (err) {
    handleError(res, err);
  }
});

router.post('/copy', async (req, res) => {
  try {
    const input = (req.body.input || '').trim();
    if (!input) {
      return res.status(400).json({ error: 'Input is required' });
    }
    const output = await chat(COPY_SYSTEM, input);
    res.json({ output });
  } catch (err) {
    handleError(res, err);
  }
});

const WHATSAPP_PHONE = '918190951631';

const AUTODM_SYSTEM = `You are a social media copywriter for Sri Nandhini Tex, a premium silk saree shop in Elampillai, Tamil Nadu.

Write Instagram DM reply text for Super Profile. A customer commented a keyword — the shop sends this DM with buttons below. Match the EXACT style of these real SNT examples:

━━ EXAMPLE FORMAT A (Premium Silk / Pattu) ━━
Hi 👋💙

Thank you for your interest in our Premium Elampillai Mayil Pattu Sarees 🦚✨

Tap the button below to instantly view:

━━ EXAMPLE FORMAT B (Cotton / Colour collections) ━━
Thank you for your interest in our Sungudi Cotton Sarees ❤️

Click the button below to view all available colours and latest collections ✨

━━ EXAMPLE FORMAT C (Collection with bullets) ━━
✨ Traditional Half Saree Collection

💖 Elegant Traditional Look
💖 Soft & Comfortable Material
💖 Perfect for Functions & Festive Wear
💖 Trending Ethnic Collection

🚚 Pan India Shipping Available

👇 Choose your preferred option below

RULES:
- Pick Format A for silk, pattu, kanjivaram, premium sarees
- Pick Format B for cotton, sungudi, daily wear, colour range posts
- Pick Format C for collections, half saree, festive sets, multiple products
- Keep DM SHORT like the examples — 4-8 lines max, no long paragraphs
- Do NOT paste srinandhinitex.com in the DM body (buttons handle links)
- Use emojis exactly like the examples (👋💙 🦚✨ ❤️ 💖 🚚 👇)
- English only, warm South Indian saree brand tone
- Max 900 characters total

Button labels MUST include a leading emoji. Shop examples: 🛍️ Shop Now, 🔗 View Collection, ✨ Explore Sarees, 👗 View All Colours. Pick the best fit for the product.

Also write exactly 3 public comment auto-replies (1 line each). Use these as STYLE REFERENCES only — rewrite fresh each time for the specific product. Do NOT copy them word-for-word:

Reference Style 1 (inbox / details sent):
💙 Details have been sent to your DM. Please check your inbox. 🦚✨

Reference Style 2 (thank you + colours/videos):
Thank you! 🤍 We've sent all colours, videos & order details to your DM. ✨

Reference Style 3 (collection / price / order):
📩 Check your DM for complete collection, price & ordering details. Happy shopping! 💙

Comment reply rules:
- Reply 1 must follow Style 1 tone (DM sent, check inbox) — new wording, mention product if natural
- Reply 2 must follow Style 2 tone (thank you + colours/videos/details) — different words from Reply 1
- Reply 3 must follow Style 3 tone (collection, price, ordering, happy shopping) — different words from Replies 1 & 2
- All 3 must be clearly different from each other — never repeat the same sentence
- Keep 1 line each, same emoji warmth as references

OUTPUT FORMAT — return exactly this, no extra commentary:
━━━━━━━━━━━━━━━━━━
💌 AUTO DM:

DM Content:
[message matching Format A, B or C]

Shop Button:
[emoji + shop button text, max 25 chars, e.g. 🛍️ View Collection]

Auto-Reply Comments:

1. [fresh variation — Style 1]

2. [fresh variation — Style 2]

3. [fresh variation — Style 3]
━━━━━━━━━━━━━━━━━━`;

const COMMENT_REPLY_REFERENCES = [
  '💙 Details have been sent to your DM. Please check your inbox. 🦚✨',
  'Thank you! 🤍 We\'ve sent all colours, videos & order details to your DM. ✨',
  '📩 Check your DM for complete collection, price & ordering details. Happy shopping! 💙',
];

function parseCommentReplies(output) {
  const match = output.match(/Auto-Reply Comments?:\s*\n([\s\S]*?)(?=\n\n💚|\n💚 WhatsApp|\n━━━━|$)/i);
  if (!match) return null;

  const replies = match[1]
    .split(/\n+/)
    .map((line) => line.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);

  return replies.length >= 3 ? replies.slice(0, 3) : null;
}

function repliesAreTooSimilar(replies) {
  const normalized = replies.map((r) => r.toLowerCase().replace(/\s+/g, ' ').trim());
  if (new Set(normalized).size < 3) return true;

  return replies.some((reply) => {
    const a = reply.toLowerCase().replace(/\s+/g, ' ').trim();
    return COMMENT_REPLY_REFERENCES.some((ref) => a === ref.toLowerCase().replace(/\s+/g, ' ').trim());
  });
}

function buildCommentRepliesFallback(promo) {
  const product = promo.trim();
  return [
    `💙 ${product} details have been sent to your DM. Please check your inbox. 🦚✨`,
    `Thank you! 🤍 We've sent all colours, videos & ${product} details to your DM. ✨`,
    `📩 Check your DM for ${product} — price, collection & ordering info. Happy shopping! 💙`,
  ];
}

function formatCommentRepliesSection(replies) {
  return `Auto-Reply Comments:\n\n${replies.map((reply, i) => `${i + 1}. ${reply}`).join('\n\n')}`;
}

function ensureCommentReplies(output, promo) {
  let replies = parseCommentReplies(output);
  if (!replies || repliesAreTooSimilar(replies)) {
    replies = buildCommentRepliesFallback(promo);
  }

  const base = output
    .replace(/\nAuto-Reply Comments?:[\s\S]*?(?=\n\n💚|\n💚 WhatsApp|\n━━━━|$)/i, '')
    .replace(/\nAuto-Reply Comment:\s*\n[\s\S]*?(?=\n\n💚|\n💚 WhatsApp|\n━━━━|$)/i, '')
    .trim();

  return `${base}\n\n${formatCommentRepliesSection(replies)}`;
}

function isGptRefusal(text) {
  if (!text) return true;
  const lower = text.toLowerCase();
  if (
    lower.includes('cannot fulfill') ||
    lower.includes("can't fulfill") ||
    lower.includes('unable to fulfill') ||
    lower.includes('as an ai') ||
    (lower.includes("i'm sorry") && (lower.includes('cannot') || lower.includes("can't")))
  ) {
    return true;
  }
  return !text.includes('DM Content:');
}

function pickAutodmFormat(promo) {
  const p = promo.toLowerCase();
  if (/cotton|sungudi|daily|colour|color/i.test(p)) return 'B';
  if (/collection|half saree|festive|set|bridal|wedding/i.test(p)) return 'C';
  return 'A';
}

function buildAutodmFallback(promo) {
  const format = pickAutodmFormat(promo);

  let dmContent;
  let shopButton;
  if (format === 'B') {
    dmContent = `Thank you for your interest in our ${promo} ❤️

Click the button below to view all available colours and latest collections ✨`;
    shopButton = '👗 View All Colours';
  } else if (format === 'C') {
    dmContent = `✨ ${promo}

💖 Elegant Traditional Look
💖 Soft & Comfortable Material
💖 Perfect for Functions & Festive Wear
💖 Trending Ethnic Collection

🚚 Pan India Shipping Available

👇 Choose your preferred option below`;
    shopButton = '✨ Explore Collection';
  } else {
    dmContent = `Hi 👋💙

Thank you for your interest in our ${promo} 🦚✨

Tap the button below to instantly view:`;
    shopButton = '🛍️ View Collection';
  }

  return `━━━━━━━━━━━━━━━━━━
💌 AUTO DM:

DM Content:
${dmContent}

Shop Button:
${shopButton}

${formatCommentRepliesSection(buildCommentRepliesFallback(promo))}
━━━━━━━━━━━━━━━━━━`;
}

function buildWhatsAppMessage(promo) {
  return `Hi 👋 I'm interested in the ${promo} from Sri Nandhini Tex. Please share price, available colours & photos. Thank you! 🙏`;
}

function buildWhatsAppLink(message) {
  return `https://api.whatsapp.com/send/?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(message)}`;
}

function finalizeAutodmOutput(gptOutput, promo) {
  const waLink = buildWhatsAppLink(buildWhatsAppMessage(promo));
  const cleaned = gptOutput
    .replace(/\n*Trigger Keyword:[\s\S]*?(?=\n\nAuto-Reply|\nAuto-Reply|\n━━━━|$)/gi, '')
    .replace(/\n*WhatsApp Message:[\s\S]*?(?=\n\nAuto-Reply|\nAuto-Reply|\n\nTrigger|\n━━━━|$)/gi, '')
    .trim();

  const withComments = ensureCommentReplies(cleaned, promo);

  if (withComments.includes('WhatsApp Link:')) {
    return withComments.replace(/WhatsApp Link:[\s\S]*?(?=\n\n|━━━━|$)/i, `💚 WhatsApp Link:\n${waLink}`).trim();
  }

  return `${withComments}

💚 WhatsApp Link:
${waLink}`;
}

router.post('/autodm', async (req, res) => {
  try {
    const promo = (req.body.promo || '').trim();
    if (!promo) {
      return res.status(400).json({ error: 'Promo is required' });
    }
    const user = `Product/collection: ${promo}`;
    let gptOutput = await chat(AUTODM_SYSTEM, user);
    if (isGptRefusal(gptOutput)) {
      gptOutput = buildAutodmFallback(promo);
    }
    const output = finalizeAutodmOutput(gptOutput, promo);
    res.json({ output });
  } catch (err) {
    handleError(res, err);
  }
});

router.post('/youtube', async (req, res) => {
  try {
    const sareeName = (req.body.sareeName || req.body.offer || '').trim();
    const price = (req.body.price || '').trim();
    const details = (req.body.details || req.body.sareeDetails || '').trim();
    const legacyInput = (req.body.input || '').trim();

    const userPrompt = buildYoutubeUserPrompt({ sareeName, price, details }) || legacyInput;
    if (!userPrompt) {
      return res.status(400).json({ error: 'Provide saree name, price, or details' });
    }

    const output = await chat(YOUTUBE_SYSTEM, userPrompt);
    res.json({ output });
  } catch (err) {
    handleError(res, err);
  }
});

export default router;
