import { GoogleGenAI, Type } from '@google/genai';
import { LogoStyle, AdStyle, AdvertisementType, SocialPlatform, GrowthToolType } from '../src/types';

// Lazy client initialization with proper telemetry header
let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not found in environment. Using fallback templates.');
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Resilient model cascade using supported modern Gemini models
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.1-pro-preview',
];

/**
 * Executes a Gemini operation with automatic retry, high-demand (503/429/404) fallback cascade,
 * and deterministic offline template safety.
 */
async function executeGeminiWithFallback<T>(
  operationName: string,
  generator: (ai: GoogleGenAI, modelName: string) => Promise<T | null | undefined>,
  fallbackGenerator: () => T | Promise<T>
): Promise<T> {
  const ai = getGenAI();
  if (!ai) {
    return await fallbackGenerator();
  }

  for (let i = 0; i < CANDIDATE_MODELS.length; i++) {
    const modelName = CANDIDATE_MODELS[i];
    try {
      const result = await generator(ai, modelName);
      if (result) {
        return result;
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      const isUnavailableOrRetryable =
        errMsg.includes('503') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('high demand') ||
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('Overloaded') ||
        errMsg.includes('temporarily') ||
        errMsg.includes('404') ||
        errMsg.includes('not found') ||
        errMsg.includes('no longer available') ||
        errMsg.includes('not supported');

      if (isUnavailableOrRetryable && i < CANDIDATE_MODELS.length - 1) {
        console.warn(
          `[BIZNIX AI] ${operationName}: Model ${modelName} returned (${errMsg.length > 80 ? errMsg.substring(0, 80) + '...' : errMsg}). Retrying with alternative model ${CANDIDATE_MODELS[i + 1]}...`
        );
        // Brief pause for backoff
        await new Promise((resolve) => setTimeout(resolve, 350));
        continue;
      } else {
        console.warn(
          `[BIZNIX AI] ${operationName} note with ${modelName}:`,
          errMsg.length > 160 ? errMsg.substring(0, 160) + '...' : errMsg
        );
      }
    }
  }

  console.info(`[BIZNIX AI] ${operationName}: Utilizing built-in strategic intelligence engine.`);
  return await fallbackGenerator();
}

// ----------------------------------------------------
// 1. AI LOGO CREATOR SERVICE
// ----------------------------------------------------
export interface LogoGenerationRequest {
  businessName: string;
  category: string;
  description?: string;
  style: LogoStyle;
  colors?: string[];
  slogan?: string;
  isPro?: boolean;
}

export interface LogoConcept {
  id: string;
  title: string;
  description: string;
  svgCode: string;
  colors: string[];
  fontStyle: string;
  iconName: string;
}

export async function generateLogoConcepts(params: LogoGenerationRequest): Promise<LogoConcept[]> {
  const { businessName, category, description = '', style, colors = [], slogan = '' } = params;

  return executeGeminiWithFallback<LogoConcept[]>(
    'Logo Generation',
    async (ai, model) => {
      const prompt = `You are an elite brand identity designer and SVG vector artist.
Generate 3 distinct, modern, visually stunning SVG logo designs for the business:
- Business Name: "${businessName}"
- Category/Industry: "${category}"
- Business Description: "${description || 'A modern forward-thinking enterprise'}"
- Visual Style: "${style}"
- Brand Colors: "${colors.length > 0 ? colors.join(', ') : 'Contemporary harmonious palette suited for ' + style}"
- Slogan (optional): "${slogan}"

RULES FOR SVGs:
1. Each SVG MUST be valid, standalone, responsive SVG code with viewBox="0 0 300 300".
2. Use modern vectors, clean shapes, gradients (<defs><linearGradient...>), geometry, or iconography relevant to ${category} and ${style} style.
3. Include high-contrast, polished background rect with rx="28" or transparent-compatible backdrop.
4. Render the business name "${businessName}" in readable, stylish uppercase or title-case text positioned nicely at bottom center, using standard web-safe or Google fonts like 'Space Grotesk' or 'Plus Jakarta Sans'.
5. If slogan "${slogan}" is provided, include it in smaller subtext under the business name.
6. Make all 3 concepts distinctive (Concept 1: Geometric/Abstract Emblem, Concept 2: Modern Monogram/Lettermark, Concept 3: Creative Iconographic/Thematic).
7. Return clean JSON matching the specified schema.`;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: 'You are the Master Brand & Logo Engine of BIZNIX. Return only strict JSON containing 3 logo concepts with valid SVG code.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              concepts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    svgCode: { type: Type.STRING },
                    colors: { type: Type.ARRAY, items: { type: Type.STRING } },
                    fontStyle: { type: Type.STRING },
                    iconName: { type: Type.STRING },
                  },
                  required: ['title', 'description', 'svgCode', 'colors', 'fontStyle', 'iconName'],
                },
              },
            },
            required: ['concepts'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.concepts && Array.isArray(parsed.concepts) && parsed.concepts.length > 0) {
        return parsed.concepts.map((c: any, index: number) => ({
          id: `concept_${Date.now()}_${index}`,
          title: c.title || `Concept ${index + 1}`,
          description: c.description || `${style} brand mark for ${businessName}`,
          svgCode: sanitizeSvg(c.svgCode, businessName, slogan),
          colors: c.colors || ['#6366f1', '#0f172a', '#38bdf8'],
          fontStyle: c.fontStyle || 'Space Grotesk',
          iconName: c.iconName || 'sparkles',
        }));
      }
      return null;
    },
    () => generateFallbackLogoConcepts(businessName, category, style, colors, slogan)
  );
}

function sanitizeSvg(rawSvg: string, businessName: string, slogan: string): string {
  let cleaned = rawSvg.trim();
  if (cleaned.startsWith('```xml')) cleaned = cleaned.replace(/^```xml/, '');
  if (cleaned.startsWith('```svg')) cleaned = cleaned.replace(/^```svg/, '');
  if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```/, '');
  if (cleaned.endsWith('```')) cleaned = cleaned.replace(/```$/, '');
  cleaned = cleaned.trim();

  if (!cleaned.includes('<svg')) {
    // If malformed, wrap in SVG
    return `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" rx="28" fill="#0f172a"/>
      <circle cx="150" cy="120" r="45" fill="none" stroke="#6366f1" stroke-width="8"/>
      <polygon points="150,85 180,140 120,140" fill="#38bdf8"/>
      <text x="150" y="215" font-family="'Space Grotesk', sans-serif" font-size="20" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="2">${businessName.toUpperCase()}</text>
      ${slogan ? `<text x="150" y="238" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" fill="#94a3b8" text-anchor="middle" letter-spacing="1.5">${slogan.toUpperCase()}</text>` : ''}
    </svg>`;
  }
  return cleaned;
}

function generateFallbackLogoConcepts(
  businessName: string,
  category: string,
  style: LogoStyle,
  preferredColors: string[],
  slogan: string
): LogoConcept[] {
  const initial = businessName.charAt(0).toUpperCase() || 'B';
  const c1 = preferredColors[0] || (style === 'Luxury' ? '#d97706' : style === 'Technology' ? '#3b82f6' : '#6366f1');
  const c2 = preferredColors[1] || (style === 'Luxury' ? '#fbbf24' : style === 'Technology' ? '#06b6d4' : '#a855f7');
  const bg = style === 'Minimal' ? '#ffffff' : '#0f172a';
  const textColor = style === 'Minimal' ? '#0f172a' : '#ffffff';
  const subtextColor = style === 'Minimal' ? '#64748b' : '#94a3b8';

  return [
    {
      id: `fallback_1_${Date.now()}`,
      title: `${style} Geometric Mark`,
      description: `Clean geometric symbol engineered for high brand recognition across all touchpoints.`,
      colors: [c1, c2, bg],
      fontStyle: 'Space Grotesk',
      iconName: 'shapes',
      svgCode: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad_f1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${c1}" />
            <stop offset="100%" stop-color="${c2}" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" rx="28" fill="${bg}"/>
        <g transform="translate(150, 115)">
          <rect x="-42" y="-42" width="84" height="84" rx="20" fill="none" stroke="url(#grad_f1)" stroke-width="8" transform="rotate(45)"/>
          <circle cx="0" cy="0" r="18" fill="url(#grad_f1)"/>
        </g>
        <text x="150" y="212" font-family="'Space Grotesk', sans-serif" font-size="20" font-weight="700" fill="${textColor}" text-anchor="middle" letter-spacing="2.5">${businessName.toUpperCase()}</text>
        ${slogan ? `<text x="150" y="235" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" font-weight="500" fill="${subtextColor}" text-anchor="middle" letter-spacing="2">${slogan.toUpperCase()}</text>` : ''}
      </svg>`
    },
    {
      id: `fallback_2_${Date.now()}`,
      title: `${style} Monogram Emblem`,
      description: `Refined typography-focused lettermark featuring the initial "${initial}".`,
      colors: [c1, c2, '#38bdf8'],
      fontStyle: 'Plus Jakarta Sans',
      iconName: 'sparkles',
      svgCode: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad_f2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${c1}" />
            <stop offset="100%" stop-color="${c2}" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" rx="28" fill="${bg}"/>
        <g transform="translate(150, 115)">
          <circle cx="0" cy="0" r="46" fill="none" stroke="url(#grad_f2)" stroke-width="3" stroke-dasharray="6 3"/>
          <circle cx="0" cy="0" r="38" fill="url(#grad_f2)" opacity="0.15"/>
          <text x="0" y="15" font-family="'Space Grotesk', sans-serif" font-size="44" font-weight="800" fill="url(#grad_f2)" text-anchor="middle">${initial}</text>
        </g>
        <text x="150" y="212" font-family="'Space Grotesk', sans-serif" font-size="20" font-weight="700" fill="${textColor}" text-anchor="middle" letter-spacing="3">${businessName.toUpperCase()}</text>
        ${slogan ? `<text x="150" y="235" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" font-weight="500" fill="${subtextColor}" text-anchor="middle" letter-spacing="1.5">${slogan.toUpperCase()}</text>` : ''}
      </svg>`
    },
    {
      id: `fallback_3_${Date.now()}`,
      title: `${style} Dynamic Crest`,
      description: `High-energy modern badge with layered vectors tailored for ${category}.`,
      colors: [c2, c1, '#ffffff'],
      fontStyle: 'Space Grotesk',
      iconName: 'zap',
      svgCode: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad_f3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${c2}" />
            <stop offset="100%" stop-color="${c1}" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" rx="28" fill="${bg}"/>
        <g transform="translate(150, 115)">
          <path d="M-35,-25 L0,-45 L35,-25 L35,20 L0,45 L-35,20 Z" fill="none" stroke="url(#grad_f3)" stroke-width="6" stroke-linejoin="round"/>
          <path d="M-15,-5 L0,-25 L15,-5 L0,25 Z" fill="url(#grad_f3)"/>
        </g>
        <text x="150" y="212" font-family="'Space Grotesk', sans-serif" font-size="20" font-weight="700" fill="${textColor}" text-anchor="middle" letter-spacing="2.5">${businessName.toUpperCase()}</text>
        ${slogan ? `<text x="150" y="235" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" font-weight="500" fill="${subtextColor}" text-anchor="middle" letter-spacing="2">${slogan.toUpperCase()}</text>` : ''}
      </svg>`
    }
  ];
}

// ----------------------------------------------------
// 2. BIZNIX AI BUSINESS ASSISTANT SERVICE
// ----------------------------------------------------
export interface ChatMessageParam {
  role: 'user' | 'model';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessageParam[];
  userContext?: {
    businessName?: string;
    businessCategory?: string;
  };
}

export async function generateChatResponse(params: ChatRequest): Promise<string> {
  const { messages, userContext } = params;

  return executeGeminiWithFallback<string>(
    'Chat Assistant',
    async (ai, model) => {
      const systemInstruction = `You are BIZNIX AI, a world-class AI Business Partner and Executive Advisor for entrepreneurs, startups, small business owners, and creators.
Your mission: Help users CREATE, ASSIST, ADVERTISE, and GROW their businesses.

Tone: Professional, inspiring, highly actionable, friendly, structured, and strategic.
CRITICAL CONSTRAINT: You must NEVER discuss banking, wallets, bank transfers, accounts, fake money, loans, or financial balances. Focus on business strategy, brand identity, marketing funnels, customer acquisition, copywriting, operational execution, and growth tactics.

Format responses with clean Markdown, bold headers, bullet points, and concise key takeaways where appropriate.
${userContext?.businessName ? `The user runs "${userContext.businessName}" in "${userContext.businessCategory || 'general commerce'}".` : ''}`;

      // Build conversation context
      const formattedHistory = messages.map(m => `${m.role === 'user' ? 'User' : 'BIZNIX AI'}: ${m.content}`).join('\n\n');

      const response = await ai.models.generateContent({
        model,
        contents: `${formattedHistory}\n\nBIZNIX AI:`,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      if (response.text && response.text.trim().length > 0) {
        return response.text.trim();
      }
      return null;
    },
    () => {
      // Fallback intelligent business response
      const lastUserMsg = messages[messages.length - 1]?.content.toLowerCase() || '';
      if (lastUserMsg.includes('name') || lastUserMsg.includes('idea')) {
        return `### Strategic Business Recommendations from BIZNIX AI

Here are high-impact directions tailored for your venture:

1. **Focus on High-Value Differentiation**: Define your unique value proposition (UVP) in one crisp sentence that answers why a customer should choose you over existing alternatives.
2. **Rapid Organic Validation**: Start by launching a dedicated WhatsApp community and 5 short-form showcase videos to test direct interest before heavy capital commitments.
3. **Core Brand Identity**: Choose a memorable 2-word brand name that evokes clarity, velocity, and trust.

Would you like me to generate tailored slogan concepts, marketing funnels, or a complete step-by-step launch plan?`;
      }

      return `### Strategic Advisory from BIZNIX AI

Thank you for reaching out! To help you achieve maximum traction and market presence:

- **Clarity of Offer**: Make sure your primary hook clearly states the exact outcome your customer gets.
- **Multi-Channel Distribution**: Leverage WhatsApp direct marketing for high conversion alongside Instagram/TikTok for brand discovery.
- **Repeat Engagement**: Establish automated follow-up messages and customer appreciation incentives to boost retention.

Let me know what specific area you'd like to dive into next: Brand Strategy, Campaign Copywriting, or Growth Tactics!`;
    }
  );
}

// ----------------------------------------------------
// 3. ADVERTISEMENT & MARKETING STUDIO SERVICE
// ----------------------------------------------------
export interface AdGenerationRequest {
  type: AdvertisementType;
  businessName: string;
  productService: string;
  description?: string;
  targetAudience?: string;
  location?: string;
  price?: string;
  specialOffer?: string;
  contactInfo?: string;
  style?: AdStyle;
  platform?: SocialPlatform;
}

export interface AdGenerationResult {
  headline: string;
  subheadline: string;
  bodyText: string;
  callToAction: string;
  hashtags: string[];
  bulletPoints: string[];
  specialOfferText: string;
  targetAudienceTips: string;
  imagePrompt: string;
  formattedWhatsAppText?: string;
  flyerLayout?: {
    themeColor: string;
    accentColor: string;
    backgroundColor: string;
    headline: string;
    subheadline: string;
    bulletPoints: string[];
    badgeText: string;
    priceTag?: string;
    contactLine: string;
    footerText: string;
  };
}

export async function generateAdvertisement(params: AdGenerationRequest): Promise<AdGenerationResult> {
  const {
    type,
    businessName,
    productService,
    description = '',
    targetAudience = 'Customers interested in quality services',
    location = '',
    price = '',
    specialOffer = '',
    contactInfo = '',
    style = 'Modern',
    platform,
  } = params;

  return executeGeminiWithFallback<AdGenerationResult>(
    'Advertisement Generation',
    async (ai, model) => {
      const prompt = `You are a high-conversion copywriter and creative advertising director.
Generate a high-impact advertising package for:
- Ad Type: ${type}
- Platform: ${platform || 'Multi-platform'}
- Business Name: ${businessName}
- Product/Service: ${productService}
- Key Details/Description: ${description}
- Target Audience: ${targetAudience}
- Location: ${location || 'Available Nationwide'}
- Price (Text tag): ${price || ''}
- Special Offer / Discount: ${specialOffer || ''}
- Contact Information: ${contactInfo || ''}
- Creative Style: ${style}

REQUIREMENTS:
1. Provide a punchy, scroll-stopping headline and subheadline.
2. Provide compelling, conversion-focused body copy formatted with bullet points.
3. Provide a clear call to action (CTA).
4. Provide 5-8 trending, relevant hashtags.
5. Provide a ready-to-paste WhatsApp promo message with appropriate emojis, bold text (*word*), and clean structure.
6. Provide visual flyer layout parameters (themeColor hex, accentColor hex, bgColor hex, badgeText).`;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: 'You are the Advertisement & Marketing Studio Engine of BIZNIX. Return strict JSON.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING },
              subheadline: { type: Type.STRING },
              bodyText: { type: Type.STRING },
              callToAction: { type: Type.STRING },
              hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
              bulletPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              specialOfferText: { type: Type.STRING },
              targetAudienceTips: { type: Type.STRING },
              imagePrompt: { type: Type.STRING },
              formattedWhatsAppText: { type: Type.STRING },
              flyerLayout: {
                type: Type.OBJECT,
                properties: {
                  themeColor: { type: Type.STRING },
                  accentColor: { type: Type.STRING },
                  backgroundColor: { type: Type.STRING },
                  headline: { type: Type.STRING },
                  subheadline: { type: Type.STRING },
                  bulletPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                  badgeText: { type: Type.STRING },
                  priceTag: { type: Type.STRING },
                  contactLine: { type: Type.STRING },
                  footerText: { type: Type.STRING },
                },
                required: ['themeColor', 'accentColor', 'backgroundColor', 'headline', 'badgeText', 'contactLine'],
              },
            },
            required: ['headline', 'bodyText', 'callToAction', 'hashtags', 'bulletPoints'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.headline) {
        return parsed;
      }
      return null;
    },
    () => {
      // Fallback high quality ad
      const bullets = [
        `✨ Premium quality guaranteed by ${businessName}`,
        `🚀 Fast turnaround & exceptional customer care`,
        `🎯 Tailored specifically for ${targetAudience}`,
        specialOffer ? `🔥 Limited Time: ${specialOffer}` : `⭐ 100% Satisfaction guaranteed`,
      ];

      const whatsAppMessage = `🔥 *EXCLUSIVE ANNOUNCEMENT from ${businessName.toUpperCase()}* 🔥\n\n` +
        `Looking for the ultimate *${productService}*? We have you covered!\n\n` +
        `${bullets.join('\n')}\n\n` +
        (price ? `🏷️ *Price:* ${price}\n` : '') +
        (specialOffer ? `🎁 *Special Offer:* ${specialOffer}\n` : '') +
        (location ? `📍 *Location:* ${location}\n` : '') +
        `\n📲 *Contact Us Today:* ${contactInfo || 'Reply directly to this message to order!'}\n` +
        `⚡ Limited availability — Don't miss out!`;

      return {
        headline: specialOffer ? `${specialOffer} on ${productService}!` : `Discover Premium ${productService} at ${businessName}`,
        subheadline: `Engineered for excellence and designed for ${targetAudience}.`,
        bodyText: `${businessName} is proud to present ${productService}. Designed with uncompromising quality to elevate your daily standards. Order yours today and experience the difference!`,
        callToAction: specialOffer ? 'Claim Offer Now' : 'Order Yours Today',
        hashtags: ['#BusinessPromo', '#SpecialDeal', '#QualityFirst', '#BrandSpotlight', '#ShopNow', '#TopChoice'],
        bulletPoints: bullets,
        specialOfferText: specialOffer || 'Special Launch Discount Available',
        targetAudienceTips: `Target individuals interested in ${productService} on Instagram and WhatsApp Status updates during peak evening hours (6 PM - 9 PM).`,
        imagePrompt: `Professional commercial studio advertisement photography of ${productService}, premium aesthetic, cinematic lighting, ${style} style.`,
        formattedWhatsAppText: whatsAppMessage,
        flyerLayout: {
          themeColor: style === 'Luxury' ? '#d97706' : '#6366f1',
          accentColor: '#38bdf8',
          backgroundColor: '#0f172a',
          headline: specialOffer ? specialOffer.toUpperCase() : `PREMIUM ${productService.toUpperCase()}`,
          subheadline: `${businessName} • Elevate Your Standard`,
          bulletPoints: bullets,
          badgeText: specialOffer ? 'SPECIAL OFFER' : 'HOT DEAL',
          priceTag: price || 'BEST VALUE',
          contactLine: contactInfo || `Contact: ${businessName} Support`,
          footerText: location ? `Serving ${location} and surrounding areas` : 'Fast & reliable delivery available'
        }
      };
    }
  );
}

// ----------------------------------------------------
// 4. BUSINESS GROWTH TOOLS SERVICE
// ----------------------------------------------------
export interface GrowthToolRequest {
  toolType: GrowthToolType;
  inputs: Record<string, any>;
  businessName?: string;
}

export async function generateGrowthToolOutput(params: GrowthToolRequest): Promise<any> {
  const { toolType, inputs, businessName = 'My Business' } = params;

  const toolPrompts: Record<GrowthToolType, string> = {
    idea_generator: `Generate 5 innovative, profitable business ideas based on:
Industry: ${inputs.industry || 'Tech & Services'}
Location: ${inputs.location || 'Global/Urban'}
Founder Skills: ${inputs.skills || 'Creative & Management'}
Interests: ${inputs.interests || 'Modern Solutions'}
Target Customers: ${inputs.targetCustomers || 'Digital-native consumers'}

Return structured JSON with an array of "ideas", each having: "title", "tagline", "targetMarket", "monetizationModel", "startupDifficulty", "whyItWorks".`,

    name_generator: `Generate 8 catchy, modern, memorable business name ideas for a business in "${inputs.industry || 'Creative & Tech'}" focused on "${inputs.focus || 'modern excellence'}".
Keywords/Vibe: ${inputs.keywords || 'modern, premium, innovative'}.

Return structured JSON with an array of "names", each having: "name", "categoryVibe", "suggestedDomain", "brandMeaning", "sloganPairing".`,

    slogan_generator: `Generate 8 powerful, persuasive business slogans for "${businessName}" in the "${inputs.industry || 'Modern Business'}" sector.
Brand Tone: ${inputs.tone || 'Professional & Inspiring'}.
Key Benefit: ${inputs.benefit || 'Premium Quality & Fast Results'}.

Return structured JSON with an array of "slogans", each having: "slogan", "theme", "bestPlatform", "psychologicalAngle".`,

    business_plan: `Generate a comprehensive, executive-ready Business Plan for "${businessName}" in "${inputs.industry || 'Services & Retail'}".
Details: ${inputs.description || 'A growing business offering high quality products and services'}.
Location: ${inputs.location || 'Urban centers'}.

Include strictly non-financial sections:
1. Executive Summary & Vision
2. Target Customer Segments & Personas
3. Products & Services Breakdown
4. Marketing & Customer Acquisition Strategy
5. Operations, Workflow & Tools
6. Growth, Scaling & Expansion Roadmap

Return structured JSON with fields: "title", "executiveSummary", "targetCustomers", "productsAndServices", "marketingStrategy", "operationsPlan", "growthRoadmap", "actionChecklist".`,

    marketing_planner: `Generate a 30-day comprehensive Marketing Plan for "${businessName}".
Main Goal: ${inputs.goal || 'Increase customer inquiries & brand awareness'}
Primary Channels: ${inputs.channels || 'WhatsApp, Instagram, TikTok, Facebook'}
Audience: ${inputs.audience || 'Local and online customers'}

Return structured JSON containing:
"summary",
"weeklyPlans" (array of 4 weeks with "weekNumber", "focusTheme", "actions", "contentSchedule"),
"promotionalStrategies" (array of strategies),
"socialMediaSchedule" (recommended posting times and formats).`,

    customer_targeting: `Perform an in-depth Customer Targeting and Audience Persona analysis for "${businessName}" providing "${inputs.productService || 'Services'}".
Return structured JSON containing:
"primaryPersona" (object with "personaName", "demographics", "coreNeeds", "painPoints", "buyingTriggers"),
"secondaryAudience",
"recommendedMarketingChannels",
"acquisitionTactics",
"messagingHooks".`,

    product_description: `Write 3 high-converting product descriptions for "${inputs.productName || 'Premium Product'}" by "${businessName}".
Product Features: ${inputs.features || 'Durable, stylish, modern design, easy to use'}
Audience: ${inputs.audience || 'Discerning customers'}
Tone: ${inputs.tone || 'Persuasive, modern, compelling'}

Return structured JSON with:
"descriptions" (array of 3 variations: 1. Storytelling/Emotional, 2. Feature-Benefit Bullets, 3. Short Social/E-commerce hook),
"recommendedBulletPoints",
"seoKeywords".`,

    growth_strategy: `Develop 5 high-impact Growth & Scaling Strategies for "${businessName}" in "${inputs.industry || 'Commerce & Services'}".
Current Stage: ${inputs.stage || 'Startup / Early Growth'}.
Objective: ${inputs.objective || 'Double customer base & expand brand reach'}.

Return structured JSON containing:
"overallStrategy",
"pillars" (array of 5 pillars: 1. Customer Acquisition, 2. Marketing Optimization, 3. Brand Authority, 4. Customer Retention & Loyalty, 5. Product/Service Expansion), each with "title", "description", "immediateSteps", "expectedImpact".`
  };

  return executeGeminiWithFallback<any>(
    `Growth Tool [${toolType}]`,
    async (ai, model) => {
      const prompt = toolPrompts[toolType] || toolPrompts.idea_generator;
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: 'You are the Business Growth Intelligence Engine of BIZNIX. You MUST NOT include any banking or fake financial account numbers. Return structured JSON only.',
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (Object.keys(parsed).length > 0) {
        return parsed;
      }
      return null;
    },
    () => getFallbackGrowthOutput(toolType, businessName, inputs)
  );
}

function getFallbackGrowthOutput(toolType: GrowthToolType, businessName: string, inputs: Record<string, any>): any {
  switch (toolType) {
    case 'idea_generator':
      return {
        ideas: [
          {
            title: 'On-Demand Hybrid Brand Studio',
            tagline: 'Delivering tailored digital marketing assets in under 24 hours.',
            targetMarket: 'Local business owners and rising social creators',
            monetizationModel: 'Monthly retainer packages & one-time asset bundles',
            startupDifficulty: 'Low-Medium',
            whyItWorks: 'Businesses urgently need rapid social content without full-agency overhead.'
          },
          {
            title: 'Automated WhatsApp Concierge for Retail',
            tagline: 'Instant customer ordering and catalog booking over chat.',
            targetMarket: 'E-commerce vendors, boutique fashion, food delivery',
            monetizationModel: 'Setup fee + monthly support license',
            startupDifficulty: 'Low',
            whyItWorks: 'Direct conversational commerce converts at 3x higher rates than standard websites.'
          },
          {
            title: 'Eco-Smart Local Supply Marketplace',
            tagline: 'Connecting sustainable local artisans directly with urban buyers.',
            targetMarket: 'Conscious consumers and gift shoppers',
            monetizationModel: 'Commission on order fulfillment',
            startupDifficulty: 'Medium',
            whyItWorks: 'High customer loyalty and viral word-of-mouth referral dynamics.'
          }
        ]
      };

    case 'name_generator':
      return {
        names: [
          { name: `${businessName} Vantage`, categoryVibe: 'Modern Executive', suggestedDomain: 'vantage.io', brandMeaning: 'Dominant market view and clarity', sloganPairing: 'Elevate your perspective.' },
          { name: 'Kinetix Studio', categoryVibe: 'High Energy Tech', suggestedDomain: 'kinetix.co', brandMeaning: 'Continuous momentum and speed', sloganPairing: 'Move at the speed of business.' },
          { name: 'NovaCore Solutions', categoryVibe: 'Corporate Tech', suggestedDomain: 'novacore.app', brandMeaning: 'Bright epicenter of digital capability', sloganPairing: 'The core of tomorrow.' },
          { name: 'Stratum Brand Co.', categoryVibe: 'Luxury Minimalist', suggestedDomain: 'stratum.design', brandMeaning: 'Layered prestige and crafted depth', sloganPairing: 'Excellence by design.' },
          { name: 'PulsePoint Commerce', categoryVibe: 'Commercial Growth', suggestedDomain: 'pulsepoint.biz', brandMeaning: 'At the exact heart of customer demand', sloganPairing: 'Stay ahead of the pulse.' }
        ]
      };

    case 'slogan_generator':
      return {
        slogans: [
          { slogan: `${businessName}: Engineered for Growth, Built for Impact.`, theme: 'Authority & Scale', bestPlatform: 'Website Hero & Billboards', psychologicalAngle: 'Instills deep trust in operational capability.' },
          { slogan: 'Your Vision, Our Execution.', theme: 'Partnership', bestPlatform: 'Pitch Decks & Proposals', psychologicalAngle: 'Relieves founder anxiety about delivery.' },
          { slogan: 'Modern Excellence for Ambitious Brands.', theme: 'Prestige', bestPlatform: 'Instagram Bio & Ads', psychologicalAngle: 'Appeals to aspirational status.' },
          { slogan: 'Where Quality Meets Speed.', theme: 'Value Proposition', bestPlatform: 'WhatsApp Status & Flyer', psychologicalAngle: 'Addresses primary customer objection.' }
        ]
      };

    case 'business_plan':
      return {
        title: `${businessName} Executive Business Blueprint`,
        executiveSummary: `${businessName} is positioned to serve demanding modern consumers with top-tier products/services, leveraging hyper-responsive customer communication and digital marketing agility.`,
        targetCustomers: 'Forward-looking businesses and consumers seeking reliable, premium solutions with zero friction.',
        productsAndServices: 'Comprehensive core product line paired with customized client support and rapid delivery.',
        marketingStrategy: 'Direct WhatsApp community nurturing, weekly short-form social video demonstrations, and incentive-driven referral programs.',
        operationsPlan: 'Streamlined cloud-based workflow utilizing AI-assisted asset creation, customer CRM, and standardized quality assurance protocols.',
        growthRoadmap: 'Phase 1: Local market penetration -> Phase 2: Regional expansion & B2B partnerships -> Phase 3: Automated omni-channel distribution.',
        actionChecklist: [
          'Finalize brand logo & visual identity kit',
          'Set up dedicated business WhatsApp line with automated greeting',
          'Launch initial 5 promotional flyer campaigns',
          'Collect first 20 verified customer reviews for social proof'
        ]
      };

    case 'marketing_planner':
      return {
        summary: `30-Day Omnichannel Growth Roadmap for ${businessName}`,
        weeklyPlans: [
          { weekNumber: 1, focusTheme: 'Brand Discovery & Value Announcement', actions: ['Publish official launch flyer on all channels', 'Broadcast WhatsApp introductory offer to existing contact list', 'Run Instagram intro reel explaining the unique customer benefit'] },
          { weekNumber: 2, focusTheme: 'Social Proof & Behind-the-Scenes', actions: ['Share 3 client transformation stories/testimonials', 'Host interactive Q&A on WhatsApp Status', 'Publish product demo video on TikTok'] },
          { weekNumber: 3, focusTheme: 'Special Offer Campaign', actions: ['Roll out limited-time discount code', 'Send reminder broadcast to interested leads', 'Distribute promotional flyers in key partner locations'] },
          { weekNumber: 4, focusTheme: 'Customer Appreciation & Referral Drive', actions: ['Launch "Refer a Friend" incentive', 'Highlight top customer of the month', 'Review monthly engagement metrics and plan next sprint'] }
        ],
        promotionalStrategies: [
          'WhatsApp Status Flash Discounts (Valid for 24 Hours Only)',
          'Bundle specials: Buy primary product, get accessory item at 30% off',
          'VIP early access for repeat customers'
        ],
        socialMediaSchedule: 'Post on Instagram & TikTok at 12 PM & 7 PM; update WhatsApp Status at 8 AM, 1 PM, and 8 PM daily.'
      };

    case 'customer_targeting':
      return {
        primaryPersona: {
          personaName: 'The Ambitious Modern Buyer',
          demographics: 'Ages 22-45, digitally active, values convenience and high aesthetic standards.',
          coreNeeds: 'Fast reliable solutions, transparent communication, and top quality.',
          painPoints: 'Slow vendor response times, poor consistency, complicated ordering procedures.',
          buyingTriggers: 'Clear social proof, instant WhatsApp messaging, and limited-time bonus incentives.'
        },
        secondaryAudience: 'Small business owners seeking trustworthy external service providers.',
        recommendedMarketingChannels: ['WhatsApp Direct Messaging', 'Instagram Reels & Stories', 'TikTok Showcase Videos', 'Local Business Directories'],
        acquisitionTactics: ['Frictionless one-click chat ordering', 'Value-packed educational short videos', 'High-contrast promotional flyers'],
        messagingHooks: ['"Stop wasting time on mediocre quality — switch to verified excellence."', '"Get exactly what you need delivered faster than ever."']
      };

    case 'product_description':
      return {
        descriptions: [
          { title: 'Storytelling & Emotional Angle', text: `Crafted for those who refuse to compromise. ${businessName}'s ${inputs.productName || 'flagship solution'} delivers unmatched performance and elegance right into your hands. Every detail has been engineered to elevate your daily routine.` },
          { title: 'Feature-Benefit Bullets', text: `• Premium Grade Build: Engineered for long-lasting reliability.\n• Instant Convenience: Seamlessly fits into your lifestyle.\n• 100% Satisfaction Backed: Full support from ${businessName} team.` },
          { title: 'High-Impact Social Hook', text: `Tired of ordinary? Upgrade to ${inputs.productName || 'our premium collection'} today and experience real quality. Tap the link to order now!` }
        ],
        recommendedBulletPoints: ['Fast delivery guarantee', 'Premium materials & finish', 'Dedicated customer care hotline'],
        seoKeywords: ['premium quality', businessName.toLowerCase(), 'top rated', 'fast delivery', 'best value']
      };

    case 'growth_strategy':
    default:
      return {
        overallStrategy: `A balanced 5-pillar growth flywheel designed to scale ${businessName} sustainably.`,
        pillars: [
          { title: '1. Hyper-Fast Customer Acquisition', description: 'Deploy direct-response WhatsApp ads and short-form video content.', immediateSteps: 'Run 3 targeted ad creatives focusing on specific customer pain points.', expectedImpact: '+35% increase in weekly qualified inquiries.' },
          { title: '2. High-Converting Marketing Optimization', description: 'Refine brand visuals, flyer layouts, and promotional copy consistency.', immediateSteps: 'Use BIZNIX AI to standardize promotional branding across all platforms.', expectedImpact: '+20% higher conversion rate from viewer to buyer.' },
          { title: '3. Brand Authority & Social Proof', description: 'Showcase real customer satisfaction and transparent behind-the-scenes processes.', immediateSteps: 'Collect photo/video testimonials after every successful delivery.', expectedImpact: 'Reduces customer hesitation and boosts premium price acceptance.' },
          { title: '4. Customer Retention & Community', description: 'Build an exclusive VIP broadcast list with secret early offers.', immediateSteps: 'Send a personalized check-in message 7 days post-purchase.', expectedImpact: 'Boosts customer lifetime repeat purchase frequency by 40%.' },
          { title: '5. Product & Service Expansion', description: 'Introduce complementary add-on services based on customer requests.', immediateSteps: 'Poll your audience on what additional service they want most.', expectedImpact: 'Increases average transaction value.' }
        ]
      };
  }
}

// ----------------------------------------------------
// 5. PRO AUTOMATIC DAILY FEATURES (Ad & Growth Rec)
// ----------------------------------------------------

export async function generateDailyPersonalizedAd(user: {
  business_name: string;
  business_category: string;
  business_description?: string;
  target_audience?: string;
  products_services?: string;
  phone?: string;
}) {
  const businessName = user.business_name || 'My Business';
  const category = user.business_category || 'Business Services';
  const products = user.products_services || 'Signature Products & Services';
  const audience = user.target_audience || 'Valued Customers';
  const description = user.business_description || 'High-quality customer solutions';
  const contact = user.phone || 'Contact us today';

  const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return executeGeminiWithFallback<any>(
    'Daily Personalized Ad',
    async (ai, model) => {
      const prompt = `You are BIZNIX AI Pro Advertising Engine.
Create today's ONE special high-converting daily promotional advertisement for an active BIZNIX Pro subscriber.
Business details:
- Business Name: "${businessName}"
- Industry / Category: "${category}"
- Products/Services: "${products}"
- Target Audience: "${audience}"
- Business Description: "${description}"
- Contact Info: "${contact}"
- Current Day: ${dayOfWeek}

Rules:
1. Create a timely, compelling, ready-to-share promotional ad for ${dayOfWeek}.
2. Provide catchy headline, engaging body copy with clear offer/value, strong call to action, and 4-6 hashtags.
3. Include flyer layout specifications (theme colors, badge, bullet points, price tag or special discount).
4. Return strict JSON.`;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: 'You are the BIZNIX Pro Daily Advertisement Generator. Output strict JSON matching the schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              title: { type: Type.STRING },
              headline: { type: Type.STRING },
              body_text: { type: Type.STRING },
              call_to_action: { type: Type.STRING },
              hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
              special_offer: { type: Type.STRING },
              price: { type: Type.STRING },
              contact_info: { type: Type.STRING },
              style: { type: Type.STRING },
              flyer_layout: {
                type: Type.OBJECT,
                properties: {
                  themeColor: { type: Type.STRING },
                  accentColor: { type: Type.STRING },
                  backgroundColor: { type: Type.STRING },
                  headline: { type: Type.STRING },
                  subheadline: { type: Type.STRING },
                  bulletPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                  badgeText: { type: Type.STRING },
                  priceTag: { type: Type.STRING },
                  contactLine: { type: Type.STRING },
                  footerText: { type: Type.STRING },
                },
                required: ['themeColor', 'accentColor', 'backgroundColor', 'headline', 'subheadline', 'bulletPoints', 'badgeText', 'contactLine', 'footerText']
              }
            },
            required: ['title', 'headline', 'body_text', 'call_to_action', 'hashtags', 'flyer_layout']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.headline && parsed.body_text) {
        return {
          type: parsed.type || 'Special Offer',
          platform: 'Instagram',
          title: parsed.title || `Today's Daily Ad: ${businessName}`,
          headline: parsed.headline,
          body_text: parsed.body_text,
          call_to_action: parsed.call_to_action || 'Contact us today to order!',
          hashtags: parsed.hashtags || ['#BusinessPromo', '#SpecialOffer', `#${businessName.replace(/\s+/g, '')}`, '#BIZNIX'],
          special_offer: parsed.special_offer || 'Limited Time Special Offer',
          price: parsed.price || 'Special Pricing Available',
          contact_info: parsed.contact_info || contact,
          style: parsed.style || 'Modern',
          flyer_layout: parsed.flyer_layout
        };
      }
      return null;
    },
    () => {
      // High quality fallback daily ad
      return {
        type: 'Special Offer',
        platform: 'Instagram',
        title: `Today's ${dayOfWeek} Special at ${businessName}`,
        headline: `${dayOfWeek} Exclusive: Elevate Your Experience with ${businessName}`,
        body_text: `Ready to upgrade? For today only, enjoy exclusive access and special promotional rates on our signature ${products}. Fast service, premium quality, and full satisfaction guaranteed.\n\nDon't miss out — message us right now to claim today's bonus offer!`,
        call_to_action: 'Send a Message / Order Now',
        hashtags: [`#${businessName.replace(/\s+/g, '')}`, '#DailySpecial', '#TopQuality', '#ExclusiveOffer', '#BIZNIX'],
        special_offer: 'Special Day Promo: 20% OFF or Free Consultation',
        price: 'Limited Daily Rate',
        contact_info: contact,
        style: 'Modern',
        flyer_layout: {
          themeColor: '#D4AF37',
          accentColor: '#38BDF8',
          backgroundColor: '#0B1728',
          headline: `${businessName} Daily Special`,
          subheadline: `Exclusive ${dayOfWeek} Promotion on ${products}`,
          bulletPoints: [
            'Premium Quality Assured',
            'Direct Fast-Track Support',
            'Special Daily Bonus with Every Order'
          ],
          badgeText: "TODAY'S SPECIAL",
          priceTag: 'Save 20% Today',
          contactLine: contact,
          footerText: `Powered by BIZNIX Pro • Official ${businessName} Campaign`
        }
      };
    }
  );
}

export async function generateDailyPersonalizedGrowthRecommendation(user: {
  business_name: string;
  business_category: string;
  business_description?: string;
  target_audience?: string;
  products_services?: string;
}) {
  const businessName = user.business_name || 'My Business';
  const category = user.business_category || 'Business Services';
  const products = user.products_services || 'products and services';

  return executeGeminiWithFallback<any>(
    'Daily Growth Recommendation',
    async (ai, model) => {
      const prompt = `You are BIZNIX AI Chief Growth Officer.
Create ONE personalized, highly practical, high-impact business growth recommendation for today for an active BIZNIX Pro subscriber.
Business details:
- Name: "${businessName}"
- Category: "${category}"
- Offerings: "${products}"

Provide:
1. Title (e.g., "Customer Trust Accelerator", "WhatsApp Video Showcase Tactic")
2. Recommendation (2-3 sentences explaining exactly what to do today and why it drives revenue or customer trust)
3. Category (e.g., "Marketing", "Customer Retention", "Sales Funnel", "Social Discovery", "Conversion Optimization")
4. Actionable Step (One concrete 10-minute task they can do right now).
Return strict JSON.`;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: 'You are the BIZNIX Pro Daily Growth Advisor. Output strict JSON matching the schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              recommendation: { type: Type.STRING },
              category: { type: Type.STRING },
              actionable_step: { type: Type.STRING },
            },
            required: ['title', 'recommendation', 'category', 'actionable_step']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.recommendation) {
        return {
          title: parsed.title || "Today's BIZNIX Growth Recommendation",
          recommendation: parsed.recommendation,
          category: parsed.category || 'Strategic Growth',
          actionable_step: parsed.actionable_step || 'Share a quick customer update on WhatsApp Status today.'
        };
      }
      return null;
    },
    () => {
      // High quality fallback recommendations
      const fallbackRecs = [
        {
          title: 'Customer Trust & Behind-The-Scenes Showcase',
          recommendation: 'Post a 15-second video or photo showing how your product is crafted or prepared today. Transparency builds deep customer trust and directly increases inquiry conversion rates by up to 30%.',
          category: 'Social Proof & Trust',
          actionable_step: 'Record a quick raw clip of your workspace or product preparation and post it to your WhatsApp Status and Instagram Story with a direct order link.'
        },
        {
          title: 'VIP Re-Engagement Direct Message Sprint',
          recommendation: 'Message 5 past customers who haven’t purchased in the last 30 days with a personalized thank-you note and an exclusive VIP perk. Reactivating existing customers is 5x cheaper than acquiring new ones.',
          category: 'Customer Retention',
          actionable_step: 'Send a warm 2-line WhatsApp greeting to 5 past clients offering them priority booking or a 15% VIP appreciation discount.'
        },
        {
          title: 'Frictionless Fast-Response Inquiries',
          recommendation: 'Ensure your response time to new inquiries is under 15 minutes. Buyers who receive an immediate response are 7x more likely to convert into paying customers compared to those who wait an hour.',
          category: 'Conversion Optimization',
          actionable_step: 'Set up an automated quick-reply on WhatsApp Business welcoming leads and offering your top 3 bestselling options.'
        }
      ];

      const todayIndex = new Date().getDate() % fallbackRecs.length;
      return fallbackRecs[todayIndex];
    }
  );
}

