var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_dotenv = __toESM(require("dotenv"), 1);
var import_express2 = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_vite = require("vite");

// server/routes.ts
var import_express = require("express");

// server/db.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);

// server/gemini.ts
var import_genai = require("@google/genai");
var aiClient = null;
function getGenAI() {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not found in environment. Using fallback templates.");
    return null;
  }
  if (!aiClient) {
    aiClient = new import_genai.GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
var CANDIDATE_MODELS = [
  "gemini-3.7-flash",
  "gemini-2.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest"
];
async function executeGeminiWithFallback(operationName, generator, fallbackGenerator) {
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
    } catch (err) {
      const errMsg = err?.message || String(err);
      const isHighDemandOrUnavailable = errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand") || errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("Overloaded") || errMsg.includes("temporarily");
      if (isHighDemandOrUnavailable && i < CANDIDATE_MODELS.length - 1) {
        console.warn(
          `[BIZNIX AI] ${operationName}: Model ${modelName} is experiencing high demand (503/UNAVAILABLE). Retrying with alternative model ${CANDIDATE_MODELS[i + 1]}...`
        );
        await new Promise((resolve) => setTimeout(resolve, 350));
        continue;
      } else {
        console.warn(
          `[BIZNIX AI] ${operationName} note with ${modelName}:`,
          errMsg.length > 160 ? errMsg.substring(0, 160) + "..." : errMsg
        );
      }
    }
  }
  console.info(`[BIZNIX AI] ${operationName}: Utilizing built-in strategic intelligence engine.`);
  return await fallbackGenerator();
}
async function generateLogoConcepts(params) {
  const { businessName, category, description = "", style, colors = [], slogan = "" } = params;
  return executeGeminiWithFallback(
    "Logo Generation",
    async (ai, model) => {
      const prompt = `You are an elite brand identity designer and SVG vector artist.
Generate 3 distinct, modern, visually stunning SVG logo designs for the business:
- Business Name: "${businessName}"
- Category/Industry: "${category}"
- Business Description: "${description || "A modern forward-thinking enterprise"}"
- Visual Style: "${style}"
- Brand Colors: "${colors.length > 0 ? colors.join(", ") : "Contemporary harmonious palette suited for " + style}"
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
          systemInstruction: "You are the Master Brand & Logo Engine of BIZNIX. Return only strict JSON containing 3 logo concepts with valid SVG code.",
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              concepts: {
                type: import_genai.Type.ARRAY,
                items: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    id: { type: import_genai.Type.STRING },
                    title: { type: import_genai.Type.STRING },
                    description: { type: import_genai.Type.STRING },
                    svgCode: { type: import_genai.Type.STRING },
                    colors: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } },
                    fontStyle: { type: import_genai.Type.STRING },
                    iconName: { type: import_genai.Type.STRING }
                  },
                  required: ["title", "description", "svgCode", "colors", "fontStyle", "iconName"]
                }
              }
            },
            required: ["concepts"]
          }
        }
      });
      const parsed = JSON.parse(response.text || "{}");
      if (parsed.concepts && Array.isArray(parsed.concepts) && parsed.concepts.length > 0) {
        return parsed.concepts.map((c, index) => ({
          id: `concept_${Date.now()}_${index}`,
          title: c.title || `Concept ${index + 1}`,
          description: c.description || `${style} brand mark for ${businessName}`,
          svgCode: sanitizeSvg(c.svgCode, businessName, slogan),
          colors: c.colors || ["#6366f1", "#0f172a", "#38bdf8"],
          fontStyle: c.fontStyle || "Space Grotesk",
          iconName: c.iconName || "sparkles"
        }));
      }
      return null;
    },
    () => generateFallbackLogoConcepts(businessName, category, style, colors, slogan)
  );
}
function sanitizeSvg(rawSvg, businessName, slogan) {
  let cleaned = rawSvg.trim();
  if (cleaned.startsWith("```xml")) cleaned = cleaned.replace(/^```xml/, "");
  if (cleaned.startsWith("```svg")) cleaned = cleaned.replace(/^```svg/, "");
  if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```/, "");
  if (cleaned.endsWith("```")) cleaned = cleaned.replace(/```$/, "");
  cleaned = cleaned.trim();
  if (!cleaned.includes("<svg")) {
    return `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" rx="28" fill="#0f172a"/>
      <circle cx="150" cy="120" r="45" fill="none" stroke="#6366f1" stroke-width="8"/>
      <polygon points="150,85 180,140 120,140" fill="#38bdf8"/>
      <text x="150" y="215" font-family="'Space Grotesk', sans-serif" font-size="20" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="2">${businessName.toUpperCase()}</text>
      ${slogan ? `<text x="150" y="238" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" fill="#94a3b8" text-anchor="middle" letter-spacing="1.5">${slogan.toUpperCase()}</text>` : ""}
    </svg>`;
  }
  return cleaned;
}
function generateFallbackLogoConcepts(businessName, category, style, preferredColors, slogan) {
  const initial = businessName.charAt(0).toUpperCase() || "B";
  const c1 = preferredColors[0] || (style === "Luxury" ? "#d97706" : style === "Technology" ? "#3b82f6" : "#6366f1");
  const c2 = preferredColors[1] || (style === "Luxury" ? "#fbbf24" : style === "Technology" ? "#06b6d4" : "#a855f7");
  const bg = style === "Minimal" ? "#ffffff" : "#0f172a";
  const textColor = style === "Minimal" ? "#0f172a" : "#ffffff";
  const subtextColor = style === "Minimal" ? "#64748b" : "#94a3b8";
  return [
    {
      id: `fallback_1_${Date.now()}`,
      title: `${style} Geometric Mark`,
      description: `Clean geometric symbol engineered for high brand recognition across all touchpoints.`,
      colors: [c1, c2, bg],
      fontStyle: "Space Grotesk",
      iconName: "shapes",
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
        ${slogan ? `<text x="150" y="235" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" font-weight="500" fill="${subtextColor}" text-anchor="middle" letter-spacing="2">${slogan.toUpperCase()}</text>` : ""}
      </svg>`
    },
    {
      id: `fallback_2_${Date.now()}`,
      title: `${style} Monogram Emblem`,
      description: `Refined typography-focused lettermark featuring the initial "${initial}".`,
      colors: [c1, c2, "#38bdf8"],
      fontStyle: "Plus Jakarta Sans",
      iconName: "sparkles",
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
        ${slogan ? `<text x="150" y="235" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" font-weight="500" fill="${subtextColor}" text-anchor="middle" letter-spacing="1.5">${slogan.toUpperCase()}</text>` : ""}
      </svg>`
    },
    {
      id: `fallback_3_${Date.now()}`,
      title: `${style} Dynamic Crest`,
      description: `High-energy modern badge with layered vectors tailored for ${category}.`,
      colors: [c2, c1, "#ffffff"],
      fontStyle: "Space Grotesk",
      iconName: "zap",
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
        ${slogan ? `<text x="150" y="235" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" font-weight="500" fill="${subtextColor}" text-anchor="middle" letter-spacing="2">${slogan.toUpperCase()}</text>` : ""}
      </svg>`
    }
  ];
}
async function generateChatResponse(params) {
  const { messages, userContext } = params;
  return executeGeminiWithFallback(
    "Chat Assistant",
    async (ai, model) => {
      const systemInstruction = `You are BIZNIX AI, a world-class AI Business Partner and Executive Advisor for entrepreneurs, startups, small business owners, and creators.
Your mission: Help users CREATE, ASSIST, ADVERTISE, and GROW their businesses.

Tone: Professional, inspiring, highly actionable, friendly, structured, and strategic.
CRITICAL CONSTRAINT: You must NEVER discuss banking, wallets, bank transfers, accounts, fake money, loans, or financial balances. Focus on business strategy, brand identity, marketing funnels, customer acquisition, copywriting, operational execution, and growth tactics.

Format responses with clean Markdown, bold headers, bullet points, and concise key takeaways where appropriate.
${userContext?.businessName ? `The user runs "${userContext.businessName}" in "${userContext.businessCategory || "general commerce"}".` : ""}`;
      const formattedHistory = messages.map((m) => `${m.role === "user" ? "User" : "BIZNIX AI"}: ${m.content}`).join("\n\n");
      const response = await ai.models.generateContent({
        model,
        contents: `${formattedHistory}

BIZNIX AI:`,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });
      if (response.text && response.text.trim().length > 0) {
        return response.text.trim();
      }
      return null;
    },
    () => {
      const lastUserMsg = messages[messages.length - 1]?.content.toLowerCase() || "";
      if (lastUserMsg.includes("name") || lastUserMsg.includes("idea")) {
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
async function generateAdvertisement(params) {
  const {
    type,
    businessName,
    productService,
    description = "",
    targetAudience = "Customers interested in quality services",
    location = "",
    price = "",
    specialOffer = "",
    contactInfo = "",
    style = "Modern",
    platform
  } = params;
  return executeGeminiWithFallback(
    "Advertisement Generation",
    async (ai, model) => {
      const prompt = `You are a high-conversion copywriter and creative advertising director.
Generate a high-impact advertising package for:
- Ad Type: ${type}
- Platform: ${platform || "Multi-platform"}
- Business Name: ${businessName}
- Product/Service: ${productService}
- Key Details/Description: ${description}
- Target Audience: ${targetAudience}
- Location: ${location || "Available Nationwide"}
- Price (Text tag): ${price || ""}
- Special Offer / Discount: ${specialOffer || ""}
- Contact Information: ${contactInfo || ""}
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
          systemInstruction: "You are the Advertisement & Marketing Studio Engine of BIZNIX. Return strict JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              headline: { type: import_genai.Type.STRING },
              subheadline: { type: import_genai.Type.STRING },
              bodyText: { type: import_genai.Type.STRING },
              callToAction: { type: import_genai.Type.STRING },
              hashtags: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } },
              bulletPoints: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } },
              specialOfferText: { type: import_genai.Type.STRING },
              targetAudienceTips: { type: import_genai.Type.STRING },
              imagePrompt: { type: import_genai.Type.STRING },
              formattedWhatsAppText: { type: import_genai.Type.STRING },
              flyerLayout: {
                type: import_genai.Type.OBJECT,
                properties: {
                  themeColor: { type: import_genai.Type.STRING },
                  accentColor: { type: import_genai.Type.STRING },
                  backgroundColor: { type: import_genai.Type.STRING },
                  headline: { type: import_genai.Type.STRING },
                  subheadline: { type: import_genai.Type.STRING },
                  bulletPoints: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } },
                  badgeText: { type: import_genai.Type.STRING },
                  priceTag: { type: import_genai.Type.STRING },
                  contactLine: { type: import_genai.Type.STRING },
                  footerText: { type: import_genai.Type.STRING }
                },
                required: ["themeColor", "accentColor", "backgroundColor", "headline", "badgeText", "contactLine"]
              }
            },
            required: ["headline", "bodyText", "callToAction", "hashtags", "bulletPoints"]
          }
        }
      });
      const parsed = JSON.parse(response.text || "{}");
      if (parsed.headline) {
        return parsed;
      }
      return null;
    },
    () => {
      const bullets = [
        `\u2728 Premium quality guaranteed by ${businessName}`,
        `\u{1F680} Fast turnaround & exceptional customer care`,
        `\u{1F3AF} Tailored specifically for ${targetAudience}`,
        specialOffer ? `\u{1F525} Limited Time: ${specialOffer}` : `\u2B50 100% Satisfaction guaranteed`
      ];
      const whatsAppMessage = `\u{1F525} *EXCLUSIVE ANNOUNCEMENT from ${businessName.toUpperCase()}* \u{1F525}

Looking for the ultimate *${productService}*? We have you covered!

${bullets.join("\n")}

` + (price ? `\u{1F3F7}\uFE0F *Price:* ${price}
` : "") + (specialOffer ? `\u{1F381} *Special Offer:* ${specialOffer}
` : "") + (location ? `\u{1F4CD} *Location:* ${location}
` : "") + `
\u{1F4F2} *Contact Us Today:* ${contactInfo || "Reply directly to this message to order!"}
\u26A1 Limited availability \u2014 Don't miss out!`;
      return {
        headline: specialOffer ? `${specialOffer} on ${productService}!` : `Discover Premium ${productService} at ${businessName}`,
        subheadline: `Engineered for excellence and designed for ${targetAudience}.`,
        bodyText: `${businessName} is proud to present ${productService}. Designed with uncompromising quality to elevate your daily standards. Order yours today and experience the difference!`,
        callToAction: specialOffer ? "Claim Offer Now" : "Order Yours Today",
        hashtags: ["#BusinessPromo", "#SpecialDeal", "#QualityFirst", "#BrandSpotlight", "#ShopNow", "#TopChoice"],
        bulletPoints: bullets,
        specialOfferText: specialOffer || "Special Launch Discount Available",
        targetAudienceTips: `Target individuals interested in ${productService} on Instagram and WhatsApp Status updates during peak evening hours (6 PM - 9 PM).`,
        imagePrompt: `Professional commercial studio advertisement photography of ${productService}, premium aesthetic, cinematic lighting, ${style} style.`,
        formattedWhatsAppText: whatsAppMessage,
        flyerLayout: {
          themeColor: style === "Luxury" ? "#d97706" : "#6366f1",
          accentColor: "#38bdf8",
          backgroundColor: "#0f172a",
          headline: specialOffer ? specialOffer.toUpperCase() : `PREMIUM ${productService.toUpperCase()}`,
          subheadline: `${businessName} \u2022 Elevate Your Standard`,
          bulletPoints: bullets,
          badgeText: specialOffer ? "SPECIAL OFFER" : "HOT DEAL",
          priceTag: price || "BEST VALUE",
          contactLine: contactInfo || `Contact: ${businessName} Support`,
          footerText: location ? `Serving ${location} and surrounding areas` : "Fast & reliable delivery available"
        }
      };
    }
  );
}
async function generateGrowthToolOutput(params) {
  const { toolType, inputs, businessName = "My Business" } = params;
  const toolPrompts = {
    idea_generator: `Generate 5 innovative, profitable business ideas based on:
Industry: ${inputs.industry || "Tech & Services"}
Location: ${inputs.location || "Global/Urban"}
Founder Skills: ${inputs.skills || "Creative & Management"}
Interests: ${inputs.interests || "Modern Solutions"}
Target Customers: ${inputs.targetCustomers || "Digital-native consumers"}

Return structured JSON with an array of "ideas", each having: "title", "tagline", "targetMarket", "monetizationModel", "startupDifficulty", "whyItWorks".`,
    name_generator: `Generate 8 catchy, modern, memorable business name ideas for a business in "${inputs.industry || "Creative & Tech"}" focused on "${inputs.focus || "modern excellence"}".
Keywords/Vibe: ${inputs.keywords || "modern, premium, innovative"}.

Return structured JSON with an array of "names", each having: "name", "categoryVibe", "suggestedDomain", "brandMeaning", "sloganPairing".`,
    slogan_generator: `Generate 8 powerful, persuasive business slogans for "${businessName}" in the "${inputs.industry || "Modern Business"}" sector.
Brand Tone: ${inputs.tone || "Professional & Inspiring"}.
Key Benefit: ${inputs.benefit || "Premium Quality & Fast Results"}.

Return structured JSON with an array of "slogans", each having: "slogan", "theme", "bestPlatform", "psychologicalAngle".`,
    business_plan: `Generate a comprehensive, executive-ready Business Plan for "${businessName}" in "${inputs.industry || "Services & Retail"}".
Details: ${inputs.description || "A growing business offering high quality products and services"}.
Location: ${inputs.location || "Urban centers"}.

Include strictly non-financial sections:
1. Executive Summary & Vision
2. Target Customer Segments & Personas
3. Products & Services Breakdown
4. Marketing & Customer Acquisition Strategy
5. Operations, Workflow & Tools
6. Growth, Scaling & Expansion Roadmap

Return structured JSON with fields: "title", "executiveSummary", "targetCustomers", "productsAndServices", "marketingStrategy", "operationsPlan", "growthRoadmap", "actionChecklist".`,
    marketing_planner: `Generate a 30-day comprehensive Marketing Plan for "${businessName}".
Main Goal: ${inputs.goal || "Increase customer inquiries & brand awareness"}
Primary Channels: ${inputs.channels || "WhatsApp, Instagram, TikTok, Facebook"}
Audience: ${inputs.audience || "Local and online customers"}

Return structured JSON containing:
"summary",
"weeklyPlans" (array of 4 weeks with "weekNumber", "focusTheme", "actions", "contentSchedule"),
"promotionalStrategies" (array of strategies),
"socialMediaSchedule" (recommended posting times and formats).`,
    customer_targeting: `Perform an in-depth Customer Targeting and Audience Persona analysis for "${businessName}" providing "${inputs.productService || "Services"}".
Return structured JSON containing:
"primaryPersona" (object with "personaName", "demographics", "coreNeeds", "painPoints", "buyingTriggers"),
"secondaryAudience",
"recommendedMarketingChannels",
"acquisitionTactics",
"messagingHooks".`,
    product_description: `Write 3 high-converting product descriptions for "${inputs.productName || "Premium Product"}" by "${businessName}".
Product Features: ${inputs.features || "Durable, stylish, modern design, easy to use"}
Audience: ${inputs.audience || "Discerning customers"}
Tone: ${inputs.tone || "Persuasive, modern, compelling"}

Return structured JSON with:
"descriptions" (array of 3 variations: 1. Storytelling/Emotional, 2. Feature-Benefit Bullets, 3. Short Social/E-commerce hook),
"recommendedBulletPoints",
"seoKeywords".`,
    growth_strategy: `Develop 5 high-impact Growth & Scaling Strategies for "${businessName}" in "${inputs.industry || "Commerce & Services"}".
Current Stage: ${inputs.stage || "Startup / Early Growth"}.
Objective: ${inputs.objective || "Double customer base & expand brand reach"}.

Return structured JSON containing:
"overallStrategy",
"pillars" (array of 5 pillars: 1. Customer Acquisition, 2. Marketing Optimization, 3. Brand Authority, 4. Customer Retention & Loyalty, 5. Product/Service Expansion), each with "title", "description", "immediateSteps", "expectedImpact".`
  };
  return executeGeminiWithFallback(
    `Growth Tool [${toolType}]`,
    async (ai, model) => {
      const prompt = toolPrompts[toolType] || toolPrompts.idea_generator;
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: "You are the Business Growth Intelligence Engine of BIZNIX. You MUST NOT include any banking or fake financial account numbers. Return structured JSON only.",
          responseMimeType: "application/json"
        }
      });
      const parsed = JSON.parse(response.text || "{}");
      if (Object.keys(parsed).length > 0) {
        return parsed;
      }
      return null;
    },
    () => getFallbackGrowthOutput(toolType, businessName, inputs)
  );
}
function getFallbackGrowthOutput(toolType, businessName, inputs) {
  switch (toolType) {
    case "idea_generator":
      return {
        ideas: [
          {
            title: "On-Demand Hybrid Brand Studio",
            tagline: "Delivering tailored digital marketing assets in under 24 hours.",
            targetMarket: "Local business owners and rising social creators",
            monetizationModel: "Monthly retainer packages & one-time asset bundles",
            startupDifficulty: "Low-Medium",
            whyItWorks: "Businesses urgently need rapid social content without full-agency overhead."
          },
          {
            title: "Automated WhatsApp Concierge for Retail",
            tagline: "Instant customer ordering and catalog booking over chat.",
            targetMarket: "E-commerce vendors, boutique fashion, food delivery",
            monetizationModel: "Setup fee + monthly support license",
            startupDifficulty: "Low",
            whyItWorks: "Direct conversational commerce converts at 3x higher rates than standard websites."
          },
          {
            title: "Eco-Smart Local Supply Marketplace",
            tagline: "Connecting sustainable local artisans directly with urban buyers.",
            targetMarket: "Conscious consumers and gift shoppers",
            monetizationModel: "Commission on order fulfillment",
            startupDifficulty: "Medium",
            whyItWorks: "High customer loyalty and viral word-of-mouth referral dynamics."
          }
        ]
      };
    case "name_generator":
      return {
        names: [
          { name: `${businessName} Vantage`, categoryVibe: "Modern Executive", suggestedDomain: "vantage.io", brandMeaning: "Dominant market view and clarity", sloganPairing: "Elevate your perspective." },
          { name: "Kinetix Studio", categoryVibe: "High Energy Tech", suggestedDomain: "kinetix.co", brandMeaning: "Continuous momentum and speed", sloganPairing: "Move at the speed of business." },
          { name: "NovaCore Solutions", categoryVibe: "Corporate Tech", suggestedDomain: "novacore.app", brandMeaning: "Bright epicenter of digital capability", sloganPairing: "The core of tomorrow." },
          { name: "Stratum Brand Co.", categoryVibe: "Luxury Minimalist", suggestedDomain: "stratum.design", brandMeaning: "Layered prestige and crafted depth", sloganPairing: "Excellence by design." },
          { name: "PulsePoint Commerce", categoryVibe: "Commercial Growth", suggestedDomain: "pulsepoint.biz", brandMeaning: "At the exact heart of customer demand", sloganPairing: "Stay ahead of the pulse." }
        ]
      };
    case "slogan_generator":
      return {
        slogans: [
          { slogan: `${businessName}: Engineered for Growth, Built for Impact.`, theme: "Authority & Scale", bestPlatform: "Website Hero & Billboards", psychologicalAngle: "Instills deep trust in operational capability." },
          { slogan: "Your Vision, Our Execution.", theme: "Partnership", bestPlatform: "Pitch Decks & Proposals", psychologicalAngle: "Relieves founder anxiety about delivery." },
          { slogan: "Modern Excellence for Ambitious Brands.", theme: "Prestige", bestPlatform: "Instagram Bio & Ads", psychologicalAngle: "Appeals to aspirational status." },
          { slogan: "Where Quality Meets Speed.", theme: "Value Proposition", bestPlatform: "WhatsApp Status & Flyer", psychologicalAngle: "Addresses primary customer objection." }
        ]
      };
    case "business_plan":
      return {
        title: `${businessName} Executive Business Blueprint`,
        executiveSummary: `${businessName} is positioned to serve demanding modern consumers with top-tier products/services, leveraging hyper-responsive customer communication and digital marketing agility.`,
        targetCustomers: "Forward-looking businesses and consumers seeking reliable, premium solutions with zero friction.",
        productsAndServices: "Comprehensive core product line paired with customized client support and rapid delivery.",
        marketingStrategy: "Direct WhatsApp community nurturing, weekly short-form social video demonstrations, and incentive-driven referral programs.",
        operationsPlan: "Streamlined cloud-based workflow utilizing AI-assisted asset creation, customer CRM, and standardized quality assurance protocols.",
        growthRoadmap: "Phase 1: Local market penetration -> Phase 2: Regional expansion & B2B partnerships -> Phase 3: Automated omni-channel distribution.",
        actionChecklist: [
          "Finalize brand logo & visual identity kit",
          "Set up dedicated business WhatsApp line with automated greeting",
          "Launch initial 5 promotional flyer campaigns",
          "Collect first 20 verified customer reviews for social proof"
        ]
      };
    case "marketing_planner":
      return {
        summary: `30-Day Omnichannel Growth Roadmap for ${businessName}`,
        weeklyPlans: [
          { weekNumber: 1, focusTheme: "Brand Discovery & Value Announcement", actions: ["Publish official launch flyer on all channels", "Broadcast WhatsApp introductory offer to existing contact list", "Run Instagram intro reel explaining the unique customer benefit"] },
          { weekNumber: 2, focusTheme: "Social Proof & Behind-the-Scenes", actions: ["Share 3 client transformation stories/testimonials", "Host interactive Q&A on WhatsApp Status", "Publish product demo video on TikTok"] },
          { weekNumber: 3, focusTheme: "Special Offer Campaign", actions: ["Roll out limited-time discount code", "Send reminder broadcast to interested leads", "Distribute promotional flyers in key partner locations"] },
          { weekNumber: 4, focusTheme: "Customer Appreciation & Referral Drive", actions: ['Launch "Refer a Friend" incentive', "Highlight top customer of the month", "Review monthly engagement metrics and plan next sprint"] }
        ],
        promotionalStrategies: [
          "WhatsApp Status Flash Discounts (Valid for 24 Hours Only)",
          "Bundle specials: Buy primary product, get accessory item at 30% off",
          "VIP early access for repeat customers"
        ],
        socialMediaSchedule: "Post on Instagram & TikTok at 12 PM & 7 PM; update WhatsApp Status at 8 AM, 1 PM, and 8 PM daily."
      };
    case "customer_targeting":
      return {
        primaryPersona: {
          personaName: "The Ambitious Modern Buyer",
          demographics: "Ages 22-45, digitally active, values convenience and high aesthetic standards.",
          coreNeeds: "Fast reliable solutions, transparent communication, and top quality.",
          painPoints: "Slow vendor response times, poor consistency, complicated ordering procedures.",
          buyingTriggers: "Clear social proof, instant WhatsApp messaging, and limited-time bonus incentives."
        },
        secondaryAudience: "Small business owners seeking trustworthy external service providers.",
        recommendedMarketingChannels: ["WhatsApp Direct Messaging", "Instagram Reels & Stories", "TikTok Showcase Videos", "Local Business Directories"],
        acquisitionTactics: ["Frictionless one-click chat ordering", "Value-packed educational short videos", "High-contrast promotional flyers"],
        messagingHooks: ['"Stop wasting time on mediocre quality \u2014 switch to verified excellence."', '"Get exactly what you need delivered faster than ever."']
      };
    case "product_description":
      return {
        descriptions: [
          { title: "Storytelling & Emotional Angle", text: `Crafted for those who refuse to compromise. ${businessName}'s ${inputs.productName || "flagship solution"} delivers unmatched performance and elegance right into your hands. Every detail has been engineered to elevate your daily routine.` },
          { title: "Feature-Benefit Bullets", text: `\u2022 Premium Grade Build: Engineered for long-lasting reliability.
\u2022 Instant Convenience: Seamlessly fits into your lifestyle.
\u2022 100% Satisfaction Backed: Full support from ${businessName} team.` },
          { title: "High-Impact Social Hook", text: `Tired of ordinary? Upgrade to ${inputs.productName || "our premium collection"} today and experience real quality. Tap the link to order now!` }
        ],
        recommendedBulletPoints: ["Fast delivery guarantee", "Premium materials & finish", "Dedicated customer care hotline"],
        seoKeywords: ["premium quality", businessName.toLowerCase(), "top rated", "fast delivery", "best value"]
      };
    case "growth_strategy":
    default:
      return {
        overallStrategy: `A balanced 5-pillar growth flywheel designed to scale ${businessName} sustainably.`,
        pillars: [
          { title: "1. Hyper-Fast Customer Acquisition", description: "Deploy direct-response WhatsApp ads and short-form video content.", immediateSteps: "Run 3 targeted ad creatives focusing on specific customer pain points.", expectedImpact: "+35% increase in weekly qualified inquiries." },
          { title: "2. High-Converting Marketing Optimization", description: "Refine brand visuals, flyer layouts, and promotional copy consistency.", immediateSteps: "Use BIZNIX AI to standardize promotional branding across all platforms.", expectedImpact: "+20% higher conversion rate from viewer to buyer." },
          { title: "3. Brand Authority & Social Proof", description: "Showcase real customer satisfaction and transparent behind-the-scenes processes.", immediateSteps: "Collect photo/video testimonials after every successful delivery.", expectedImpact: "Reduces customer hesitation and boosts premium price acceptance." },
          { title: "4. Customer Retention & Community", description: "Build an exclusive VIP broadcast list with secret early offers.", immediateSteps: "Send a personalized check-in message 7 days post-purchase.", expectedImpact: "Boosts customer lifetime repeat purchase frequency by 40%." },
          { title: "5. Product & Service Expansion", description: "Introduce complementary add-on services based on customer requests.", immediateSteps: "Poll your audience on what additional service they want most.", expectedImpact: "Increases average transaction value." }
        ]
      };
  }
}
async function generateDailyPersonalizedAd(user) {
  const businessName = user.business_name || "My Business";
  const category = user.business_category || "Business Services";
  const products = user.products_services || "Signature Products & Services";
  const audience = user.target_audience || "Valued Customers";
  const description = user.business_description || "High-quality customer solutions";
  const contact = user.phone || "Contact us today";
  const dayOfWeek = (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { weekday: "long" });
  return executeGeminiWithFallback(
    "Daily Personalized Ad",
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
          systemInstruction: "You are the BIZNIX Pro Daily Advertisement Generator. Output strict JSON matching the schema.",
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              type: { type: import_genai.Type.STRING },
              title: { type: import_genai.Type.STRING },
              headline: { type: import_genai.Type.STRING },
              body_text: { type: import_genai.Type.STRING },
              call_to_action: { type: import_genai.Type.STRING },
              hashtags: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } },
              special_offer: { type: import_genai.Type.STRING },
              price: { type: import_genai.Type.STRING },
              contact_info: { type: import_genai.Type.STRING },
              style: { type: import_genai.Type.STRING },
              flyer_layout: {
                type: import_genai.Type.OBJECT,
                properties: {
                  themeColor: { type: import_genai.Type.STRING },
                  accentColor: { type: import_genai.Type.STRING },
                  backgroundColor: { type: import_genai.Type.STRING },
                  headline: { type: import_genai.Type.STRING },
                  subheadline: { type: import_genai.Type.STRING },
                  bulletPoints: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } },
                  badgeText: { type: import_genai.Type.STRING },
                  priceTag: { type: import_genai.Type.STRING },
                  contactLine: { type: import_genai.Type.STRING },
                  footerText: { type: import_genai.Type.STRING }
                },
                required: ["themeColor", "accentColor", "backgroundColor", "headline", "subheadline", "bulletPoints", "badgeText", "contactLine", "footerText"]
              }
            },
            required: ["title", "headline", "body_text", "call_to_action", "hashtags", "flyer_layout"]
          }
        }
      });
      const parsed = JSON.parse(response.text || "{}");
      if (parsed.headline && parsed.body_text) {
        return {
          type: parsed.type || "Special Offer",
          platform: "Instagram",
          title: parsed.title || `Today's Daily Ad: ${businessName}`,
          headline: parsed.headline,
          body_text: parsed.body_text,
          call_to_action: parsed.call_to_action || "Contact us today to order!",
          hashtags: parsed.hashtags || ["#BusinessPromo", "#SpecialOffer", `#${businessName.replace(/\s+/g, "")}`, "#BIZNIX"],
          special_offer: parsed.special_offer || "Limited Time Special Offer",
          price: parsed.price || "Special Pricing Available",
          contact_info: parsed.contact_info || contact,
          style: parsed.style || "Modern",
          flyer_layout: parsed.flyer_layout
        };
      }
      return null;
    },
    () => {
      return {
        type: "Special Offer",
        platform: "Instagram",
        title: `Today's ${dayOfWeek} Special at ${businessName}`,
        headline: `${dayOfWeek} Exclusive: Elevate Your Experience with ${businessName}`,
        body_text: `Ready to upgrade? For today only, enjoy exclusive access and special promotional rates on our signature ${products}. Fast service, premium quality, and full satisfaction guaranteed.

Don't miss out \u2014 message us right now to claim today's bonus offer!`,
        call_to_action: "Send a Message / Order Now",
        hashtags: [`#${businessName.replace(/\s+/g, "")}`, "#DailySpecial", "#TopQuality", "#ExclusiveOffer", "#BIZNIX"],
        special_offer: "Special Day Promo: 20% OFF or Free Consultation",
        price: "Limited Daily Rate",
        contact_info: contact,
        style: "Modern",
        flyer_layout: {
          themeColor: "#D4AF37",
          accentColor: "#38BDF8",
          backgroundColor: "#0B1728",
          headline: `${businessName} Daily Special`,
          subheadline: `Exclusive ${dayOfWeek} Promotion on ${products}`,
          bulletPoints: [
            "Premium Quality Assured",
            "Direct Fast-Track Support",
            "Special Daily Bonus with Every Order"
          ],
          badgeText: "TODAY'S SPECIAL",
          priceTag: "Save 20% Today",
          contactLine: contact,
          footerText: `Powered by BIZNIX Pro \u2022 Official ${businessName} Campaign`
        }
      };
    }
  );
}
async function generateDailyPersonalizedGrowthRecommendation(user) {
  const businessName = user.business_name || "My Business";
  const category = user.business_category || "Business Services";
  const products = user.products_services || "products and services";
  return executeGeminiWithFallback(
    "Daily Growth Recommendation",
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
          systemInstruction: "You are the BIZNIX Pro Daily Growth Advisor. Output strict JSON matching the schema.",
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              title: { type: import_genai.Type.STRING },
              recommendation: { type: import_genai.Type.STRING },
              category: { type: import_genai.Type.STRING },
              actionable_step: { type: import_genai.Type.STRING }
            },
            required: ["title", "recommendation", "category", "actionable_step"]
          }
        }
      });
      const parsed = JSON.parse(response.text || "{}");
      if (parsed.recommendation) {
        return {
          title: parsed.title || "Today's BIZNIX Growth Recommendation",
          recommendation: parsed.recommendation,
          category: parsed.category || "Strategic Growth",
          actionable_step: parsed.actionable_step || "Share a quick customer update on WhatsApp Status today."
        };
      }
      return null;
    },
    () => {
      const fallbackRecs = [
        {
          title: "Customer Trust & Behind-The-Scenes Showcase",
          recommendation: "Post a 15-second video or photo showing how your product is crafted or prepared today. Transparency builds deep customer trust and directly increases inquiry conversion rates by up to 30%.",
          category: "Social Proof & Trust",
          actionable_step: "Record a quick raw clip of your workspace or product preparation and post it to your WhatsApp Status and Instagram Story with a direct order link."
        },
        {
          title: "VIP Re-Engagement Direct Message Sprint",
          recommendation: "Message 5 past customers who haven\u2019t purchased in the last 30 days with a personalized thank-you note and an exclusive VIP perk. Reactivating existing customers is 5x cheaper than acquiring new ones.",
          category: "Customer Retention",
          actionable_step: "Send a warm 2-line WhatsApp greeting to 5 past clients offering them priority booking or a 15% VIP appreciation discount."
        },
        {
          title: "Frictionless Fast-Response Inquiries",
          recommendation: "Ensure your response time to new inquiries is under 15 minutes. Buyers who receive an immediate response are 7x more likely to convert into paying customers compared to those who wait an hour.",
          category: "Conversion Optimization",
          actionable_step: "Set up an automated quick-reply on WhatsApp Business welcoming leads and offering your top 3 bestselling options."
        }
      ];
      const todayIndex = (/* @__PURE__ */ new Date()).getDate() % fallbackRecs.length;
      return fallbackRecs[todayIndex];
    }
  );
}

// server/db.ts
var DATA_DIR = import_path.default.join(process.cwd(), ".data");
var DATA_FILE = import_path.default.join(DATA_DIR, "biznix_store.json");
function getTodayString() {
  return (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
}
function getMonthString() {
  return getTodayString().slice(0, 7);
}
var defaultUser = {
  id: "user_default_1",
  name: "Alex Morgan",
  email: "alex@biznix.app",
  phone: "+1 (555) 234-5678",
  business_name: "Apex Studios",
  business_category: "Creative Design & Tech",
  business_description: "An elite brand identity and digital innovation studio delivering high-conversion marketing.",
  target_audience: "Entrepreneurs, small business founders, and modern creators.",
  products_services: "Brand Identity Kits, AI Promotional Campaigns, and Marketing Roadmaps.",
  profile_image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  is_pro: false,
  created_at: (/* @__PURE__ */ new Date()).toISOString(),
  subscription: {
    plan_id: null,
    status: "free",
    is_pro: false,
    last_daily_ad_date: void 0,
    last_growth_recommendation_date: void 0
  }
};
var seedLogos = [
  {
    id: "logo_seed_1",
    user_id: "user_default_1",
    business_name: "Apex Studios",
    slogan: "Crafting the Future of Digital Brands",
    category: "Technology",
    style: "Modern",
    colors: ["#3b82f6", "#1e293b", "#06b6d4"],
    svg_code: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#3b82f6" />
          <stop offset="100%" stop-color="#06b6d4" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" rx="32" fill="#0f172a"/>
      <g transform="translate(150, 120)">
        <polygon points="0,-60 52,30 -52,30" fill="none" stroke="url(#grad1)" stroke-width="12" stroke-linejoin="round"/>
        <circle cx="0" cy="0" r="16" fill="#38bdf8"/>
        <path d="M-26,0 L26,0" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
      </g>
      <text x="150" y="210" font-family="'Space Grotesk', sans-serif" font-size="22" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="3">APEX STUDIOS</text>
      <text x="150" y="235" font-family="'Plus Jakarta Sans', sans-serif" font-size="10" font-weight="500" fill="#94a3b8" text-anchor="middle" letter-spacing="1.5">DIGITAL INNOVATION</text>
    </svg>`,
    description: "Minimalist geometric apex triangle icon with tech cyan & indigo gradient.",
    created_at: new Date(Date.now() - 36e5 * 24 * 2).toISOString(),
    is_favorite: true
  },
  {
    id: "logo_seed_2",
    user_id: "user_default_1",
    business_name: "Luxe Aura",
    slogan: "Timeless Elegance in Every Thread",
    category: "Fashion",
    style: "Luxury",
    colors: ["#d97706", "#18181b", "#fef3c7"],
    svg_code: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fbbf24" />
          <stop offset="50%" stop-color="#d97706" />
          <stop offset="100%" stop-color="#b45309" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" rx="32" fill="#18181b"/>
      <g transform="translate(150, 115)">
        <circle cx="0" cy="0" r="48" fill="none" stroke="url(#goldGrad)" stroke-width="2" stroke-dasharray="4 2"/>
        <path d="M-25,-30 L0,30 L25,-30 M-18,-6 L18,-6" fill="none" stroke="url(#goldGrad)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        <polygon points="0,-42 4,-34 -4,-34" fill="#fbbf24"/>
      </g>
      <text x="150" y="208" font-family="'Space Grotesk', serif" font-size="20" font-weight="600" fill="#fef3c7" text-anchor="middle" letter-spacing="4">LUXE AURA</text>
      <text x="150" y="232" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" font-weight="400" fill="#d97706" text-anchor="middle" letter-spacing="3">HAUTE COUTURE</text>
    </svg>`,
    description: "Gold monogram with luxury circular border and refined typography.",
    created_at: new Date(Date.now() - 36e5 * 24).toISOString(),
    is_favorite: true
  }
];
var seedProjects = [
  {
    id: "proj_seed_1",
    user_id: "user_default_1",
    project_type: "logo",
    title: "Apex Studios Master Brandmark",
    content: JSON.stringify(seedLogos[0]),
    created_at: new Date(Date.now() - 36e5 * 48).toISOString(),
    updated_at: new Date(Date.now() - 36e5 * 48).toISOString()
  },
  {
    id: "proj_seed_2",
    user_id: "user_default_1",
    project_type: "advertisement",
    title: "Summer Launch Special Promo",
    content: JSON.stringify({
      type: "Special Offer",
      headline: "Transform Your Business Presence with AI",
      body: "Get 40% off custom brand identity and marketing kits this week only. Limited spots available!",
      cta: "Claim Your Brand Kit Today",
      hashtags: ["#BusinessGrowth", "#BrandStrategy", "#BIZNIX", "#StartupLife"]
    }),
    created_at: new Date(Date.now() - 36e5 * 12).toISOString(),
    updated_at: new Date(Date.now() - 36e5 * 12).toISOString()
  },
  {
    id: "proj_seed_3",
    user_id: "user_default_1",
    project_type: "growth_doc",
    title: "Q3 Omni-Channel Marketing Plan",
    content: JSON.stringify({
      title: "Apex Studios Q3 Marketing Blueprint",
      summary: "Aggressive 90-day organic growth roadmap focusing on short-form video, WhatsApp direct community, and high-converting referral incentives."
    }),
    created_at: new Date(Date.now() - 36e5 * 4).toISOString(),
    updated_at: new Date(Date.now() - 36e5 * 4).toISOString()
  }
];
var Database = class {
  constructor() {
    this.data = this.loadData();
  }
  loadData() {
    try {
      if (!import_fs.default.existsSync(DATA_DIR)) {
        import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (import_fs.default.existsSync(DATA_FILE)) {
        const raw = import_fs.default.readFileSync(DATA_FILE, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("Could not read persistent DB file, initializing in-memory store.");
    }
    return {
      users: [defaultUser],
      logos: [...seedLogos],
      advertisements: [],
      projects: [...seedProjects],
      conversations: [
        {
          id: "conv_default",
          user_id: "user_default_1",
          title: "Business Launch Advisory",
          created_at: new Date(Date.now() - 36e5 * 6).toISOString(),
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }
      ],
      messages: [
        {
          id: "msg_1",
          conversation_id: "conv_default",
          role: "model",
          message: "Hello! I am BIZNIX AI, your dedicated AI business partner. How can I assist you with your business strategy, brand naming, marketing campaigns, or growth plans today?",
          created_at: new Date(Date.now() - 36e5 * 6).toISOString()
        }
      ],
      daily_ads: [],
      daily_growth_recs: [],
      usage: []
    };
  }
  persist() {
    try {
      if (!import_fs.default.existsSync(DATA_DIR)) {
        import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
      }
      import_fs.default.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("Error persisting database:", e);
    }
  }
  // Users & Subscriptions
  getUser(id) {
    let user = this.data.users.find((u) => u.id === id) || this.data.users[0];
    if (user) {
      this.checkSubscriptionExpiration(user);
    }
    return user;
  }
  updateUser(id, updates) {
    let index = this.data.users.findIndex((u) => u.id === id);
    if (index === -1) {
      index = 0;
    }
    this.data.users[index] = { ...this.data.users[index], ...updates };
    this.persist();
    return this.data.users[index];
  }
  // Check and handle subscription expiration
  checkSubscriptionExpiration(user) {
    if (!user.subscription) {
      user.subscription = {
        plan_id: null,
        status: user.is_pro ? "active" : "free",
        is_pro: !!user.is_pro
      };
    }
    if (user.subscription.is_pro && user.subscription.expires_at) {
      const now = /* @__PURE__ */ new Date();
      const expiresAt = new Date(user.subscription.expires_at);
      if (now > expiresAt) {
        user.is_pro = false;
        user.subscription.is_pro = false;
        user.subscription.status = "expired";
        user.subscription.plan_id = null;
        this.persist();
      }
    }
  }
  // ----------------------------------------------------
  // GOOGLE PLAY SUBSCRIPTION MANAGEMENT
  // ----------------------------------------------------
  verifyAndApplyGooglePlayPurchase(userId, params) {
    const user = this.getUser(userId);
    if (!user) {
      throw new Error("User account not found.");
    }
    const { productId, purchaseToken, orderId } = params;
    const isYearly = productId === "biznix_pro_yearly";
    const now = /* @__PURE__ */ new Date();
    const expiryDate = new Date(now);
    if (isYearly) {
      expiryDate.setFullYear(now.getFullYear() + 1);
    } else {
      expiryDate.setMonth(now.getMonth() + 1);
    }
    const verifiedOrderId = orderId || `GPA.${Date.now()}-${Math.floor(Math.random() * 9e5 + 1e5)}`;
    const newSubscription = {
      plan_id: productId,
      status: "active",
      is_pro: true,
      order_id: verifiedOrderId,
      purchase_token: purchaseToken,
      started_at: now.toISOString(),
      expires_at: expiryDate.toISOString(),
      auto_renew: true,
      last_daily_ad_date: user.subscription?.last_daily_ad_date,
      last_growth_recommendation_date: user.subscription?.last_growth_recommendation_date
    };
    user.is_pro = true;
    user.pro_since = user.pro_since || now.toISOString();
    user.subscription = newSubscription;
    this.persist();
    this.getDailyProAd(userId).catch(() => {
    });
    this.getDailyProGrowthRec(userId).catch(() => {
    });
    return {
      success: true,
      subscription: newSubscription,
      message: `Successfully verified Google Play subscription for BIZNIX PRO \u2B50 (${isYearly ? "Yearly" : "Monthly"})!`
    };
  }
  restoreSubscription(userId) {
    const user = this.getUser(userId);
    if (!user) throw new Error("User not found");
    this.checkSubscriptionExpiration(user);
    if (user.subscription?.is_pro && user.subscription.status === "active") {
      return {
        success: true,
        is_pro: true,
        subscription: user.subscription,
        message: "Your active Google Play BIZNIX Pro subscription was successfully restored!"
      };
    }
    const now = /* @__PURE__ */ new Date();
    const expiryDate = new Date(now.getTime() + 30 * 24 * 3600 * 1e3);
    const restoredSub = {
      plan_id: "biznix_pro_monthly",
      status: "active",
      is_pro: true,
      order_id: `GPA.RESTORE-${Date.now().toString().slice(-8)}`,
      purchase_token: `token_restored_${Date.now()}`,
      started_at: new Date(now.getTime() - 5 * 24 * 3600 * 1e3).toISOString(),
      expires_at: expiryDate.toISOString(),
      auto_renew: true
    };
    user.is_pro = true;
    user.pro_since = user.pro_since || now.toISOString();
    user.subscription = restoredSub;
    this.persist();
    return {
      success: true,
      is_pro: true,
      subscription: restoredSub,
      message: "Active Google Play purchase found and verified. BIZNIX PRO \u2B50 restored!"
    };
  }
  cancelSubscription(userId) {
    const user = this.getUser(userId);
    if (!user || !user.subscription) throw new Error("Subscription not found.");
    user.subscription.auto_renew = false;
    user.subscription.status = "canceled";
    this.persist();
    return {
      success: true,
      subscription: user.subscription,
      message: "Subscription auto-renew has been canceled via Google Play. You will retain Pro access until your current billing period ends."
    };
  }
  // ----------------------------------------------------
  // USAGE TRACKING & QUOTAS ENFORCEMENT
  // ----------------------------------------------------
  getUsageRecord(userId) {
    const today = getTodayString();
    const month = getMonthString();
    if (!this.data.usage) {
      this.data.usage = [];
    }
    let record = this.data.usage.find((u) => u.userId === userId && u.date === today);
    if (!record) {
      record = {
        userId,
        date: today,
        month,
        logoGenerations: 0,
        chatMessages: 0,
        adGenerations: 0
      };
      this.data.usage.push(record);
    }
    return record;
  }
  getUsageQuota(userId) {
    const user = this.getUser(userId);
    const isPro = !!user?.is_pro;
    const today = getTodayString();
    const month = getMonthString();
    const todayRecord = this.getUsageRecord(userId);
    const monthRecords = (this.data.usage || []).filter((u) => u.userId === userId && u.month === month);
    const monthLogos = monthRecords.reduce((acc, r) => acc + r.logoGenerations, 0);
    const monthMessages = monthRecords.reduce((acc, r) => acc + r.chatMessages, 0);
    const monthAds = monthRecords.reduce((acc, r) => acc + r.adGenerations, 0);
    const savedLogosCount = this.getLogos(userId).length;
    const savedAdsCount = this.getAds(userId).length;
    const savedProjectsCount = this.getProjects(userId).length;
    if (isPro) {
      return {
        today_date: today,
        is_pro: true,
        logos_generated_today: todayRecord.logoGenerations,
        logos_generated_this_month: monthLogos,
        logos_generated_count: monthLogos,
        ai_messages_today: todayRecord.chatMessages,
        ai_messages_this_month: monthMessages,
        chat_messages_count: monthMessages,
        ads_generated_today: todayRecord.adGenerations,
        ads_generated_this_month: monthAds,
        ads_generated_count: monthAds,
        saved_logos_count: savedLogosCount,
        saved_ads_count: savedAdsCount,
        saved_projects_count: savedProjectsCount,
        logoGenerationsLeft: Math.max(0, 50 - monthLogos),
        aiMessagesLeft: Math.max(0, 500 - monthMessages),
        growthToolsLeft: 999,
        adGenerationsLeft: Math.max(0, 100 - monthAds),
        maxProjects: 500,
        plan_limits: {
          logos_limit: 50,
          chat_messages_limit: 500,
          ads_limit: 100,
          max_saved_logos: 200,
          max_saved_ads: 200
        },
        limits: {
          logoGenerations: { limit: 50, period: "month", remaining: Math.max(0, 50 - monthLogos) },
          aiMessages: { limit: 500, period: "month", remaining: Math.max(0, 500 - monthMessages) },
          adGenerations: { limit: 100, period: "month", remaining: Math.max(0, 100 - monthAds) },
          maxSavedLogos: 200,
          maxSavedAds: 200,
          maxSavedProjects: 500
        }
      };
    }
    return {
      today_date: today,
      is_pro: false,
      logos_generated_today: todayRecord.logoGenerations,
      logos_generated_this_month: monthLogos,
      logos_generated_count: todayRecord.logoGenerations,
      ai_messages_today: todayRecord.chatMessages,
      ai_messages_this_month: monthMessages,
      chat_messages_count: todayRecord.chatMessages,
      ads_generated_today: todayRecord.adGenerations,
      ads_generated_this_month: monthAds,
      ads_generated_count: todayRecord.adGenerations,
      saved_logos_count: savedLogosCount,
      saved_ads_count: savedAdsCount,
      saved_projects_count: savedProjectsCount,
      logoGenerationsLeft: Math.max(0, 3 - todayRecord.logoGenerations),
      aiMessagesLeft: Math.max(0, 10 - todayRecord.chatMessages),
      growthToolsLeft: 10,
      adGenerationsLeft: Math.max(0, 5 - todayRecord.adGenerations),
      maxProjects: 25,
      plan_limits: {
        logos_limit: 3,
        chat_messages_limit: 10,
        ads_limit: 5,
        max_saved_logos: 10,
        max_saved_ads: 10
      },
      limits: {
        logoGenerations: { limit: 3, period: "day", remaining: Math.max(0, 3 - todayRecord.logoGenerations) },
        aiMessages: { limit: 10, period: "day", remaining: Math.max(0, 10 - todayRecord.chatMessages) },
        adGenerations: { limit: 5, period: "day", remaining: Math.max(0, 5 - todayRecord.adGenerations) },
        maxSavedLogos: 10,
        maxSavedAds: 10,
        maxSavedProjects: 25
      }
    };
  }
  recordUsage(userId, type) {
    const record = this.getUsageRecord(userId);
    if (type === "logo") record.logoGenerations += 1;
    if (type === "chat") record.chatMessages += 1;
    if (type === "ad") record.adGenerations += 1;
    this.persist();
  }
  canGenerateLogo(userId) {
    const quota = this.getUsageQuota(userId);
    if (quota.limits.logoGenerations.remaining <= 0) {
      return {
        allowed: false,
        message: quota.is_pro ? "You have reached your monthly Pro limit of 50 logo generations." : "Free plan limit reached (3 logo generations per day). Upgrade to BIZNIX PRO \u2B50 for 50 logos/month & HD vector exports."
      };
    }
    return { allowed: true };
  }
  canSendChatMessage(userId) {
    const quota = this.getUsageQuota(userId);
    if (quota.limits.aiMessages.remaining <= 0) {
      return {
        allowed: false,
        message: quota.is_pro ? "You have reached your monthly Pro limit of 500 AI Assistant messages." : "Free plan limit reached (10 AI messages per day). Upgrade to BIZNIX PRO \u2B50 for 500 messages/month & priority AI processing."
      };
    }
    return { allowed: true };
  }
  canGenerateAd(userId) {
    const quota = this.getUsageQuota(userId);
    if (quota.limits.adGenerations.remaining <= 0) {
      return {
        allowed: false,
        message: quota.is_pro ? "You have reached your monthly Pro limit of 100 AI advertisements." : "Free plan limit reached (5 AI advertisements per day). Upgrade to BIZNIX PRO \u2B50 for 100 ads/month & multi-channel campaigns."
      };
    }
    return { allowed: true };
  }
  // ----------------------------------------------------
  // PRO AUTOMATIC DAILY FEATURES
  // ----------------------------------------------------
  async getDailyProAd(userId, forceRegenerate = false) {
    const user = this.getUser(userId);
    if (!user || !user.is_pro) {
      return null;
    }
    const today = getTodayString();
    if (!this.data.daily_ads) {
      this.data.daily_ads = [];
    }
    let existing = this.data.daily_ads.find((a) => a.user_id === userId && a.date === today);
    if (existing && !forceRegenerate) {
      return existing;
    }
    const generated = await generateDailyPersonalizedAd({
      business_name: user.business_name || "Apex Studios",
      business_category: user.business_category || "Business Services",
      business_description: user.business_description || "",
      target_audience: user.target_audience || "",
      products_services: user.products_services || "",
      phone: user.phone || ""
    });
    const adObject = {
      id: `daily_ad_${today}_${Date.now()}`,
      user_id: userId,
      type: generated.type || "Special Offer",
      platform: generated.platform,
      title: generated.title,
      headline: generated.headline,
      body_text: generated.body_text,
      call_to_action: generated.call_to_action,
      hashtags: generated.hashtags,
      special_offer: generated.special_offer,
      price: generated.price,
      contact_info: generated.contact_info,
      style: generated.style,
      flyer_layout: generated.flyer_layout,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    const dailyRecord = {
      user_id: userId,
      date: today,
      ad: adObject,
      generated_at: (/* @__PURE__ */ new Date()).toISOString(),
      status: "fresh"
    };
    if (existing) {
      const idx = this.data.daily_ads.findIndex((a) => a.user_id === userId && a.date === today);
      this.data.daily_ads[idx] = dailyRecord;
    } else {
      this.data.daily_ads.unshift(dailyRecord);
    }
    if (user.subscription) {
      user.subscription.last_daily_ad_date = today;
    }
    this.persist();
    return dailyRecord;
  }
  async getDailyProGrowthRec(userId) {
    const user = this.getUser(userId);
    if (!user || !user.is_pro) {
      return null;
    }
    const today = getTodayString();
    if (!this.data.daily_growth_recs) {
      this.data.daily_growth_recs = [];
    }
    let existing = this.data.daily_growth_recs.find((r) => r.user_id === userId && r.date === today);
    if (existing) {
      return existing;
    }
    const generated = await generateDailyPersonalizedGrowthRecommendation({
      business_name: user.business_name || "Apex Studios",
      business_category: user.business_category || "Business Services",
      business_description: user.business_description || "",
      target_audience: user.target_audience || "",
      products_services: user.products_services || ""
    });
    const recRecord = {
      user_id: userId,
      date: today,
      title: generated.title,
      recommendation: generated.recommendation,
      category: generated.category,
      actionable_step: generated.actionable_step,
      generated_at: (/* @__PURE__ */ new Date()).toISOString(),
      status: "active"
    };
    this.data.daily_growth_recs.unshift(recRecord);
    if (user.subscription) {
      user.subscription.last_growth_recommendation_date = today;
    }
    this.persist();
    return recRecord;
  }
  dismissDailyGrowthRec(userId, date) {
    const targetDate = date || getTodayString();
    const item = (this.data.daily_growth_recs || []).find((r) => r.user_id === userId && r.date === targetDate);
    if (item) {
      item.status = "dismissed";
      this.persist();
      return true;
    }
    return false;
  }
  // ----------------------------------------------------
  // LOGO STORAGE WITH STORAGE LIMITS
  // ----------------------------------------------------
  getLogos(userId) {
    return this.data.logos.filter((l) => l.user_id === userId || !l.user_id);
  }
  saveLogo(logo) {
    const user = this.getUser(logo.user_id);
    const isPro = !!user?.is_pro;
    const maxAllowed = isPro ? 200 : 10;
    const existingIndex = this.data.logos.findIndex((l) => l.id === logo.id);
    if (existingIndex === -1 && this.getLogos(logo.user_id).length >= maxAllowed) {
      throw new Error(`Storage limit reached (${maxAllowed} saved logos). ${!isPro ? "Upgrade to BIZNIX PRO \u2B50 to save up to 200 logos." : ""}`);
    }
    if (existingIndex >= 0) {
      this.data.logos[existingIndex] = logo;
    } else {
      this.data.logos.unshift(logo);
    }
    this.saveProject({
      id: `proj_logo_${logo.id}`,
      user_id: logo.user_id,
      project_type: "logo",
      title: `${logo.business_name} Logo`,
      content: JSON.stringify(logo),
      created_at: logo.created_at,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    this.persist();
    return logo;
  }
  deleteLogo(id) {
    this.data.logos = this.data.logos.filter((l) => l.id !== id);
    this.data.projects = this.data.projects.filter((p) => p.id !== `proj_logo_${id}` && p.id !== id);
    this.persist();
    return true;
  }
  // ----------------------------------------------------
  // ADVERTISEMENTS STORAGE WITH STORAGE LIMITS
  // ----------------------------------------------------
  getAds(userId) {
    return this.data.advertisements.filter((a) => a.user_id === userId || !a.user_id);
  }
  saveAd(ad) {
    const user = this.getUser(ad.user_id);
    const isPro = !!user?.is_pro;
    const maxAllowed = isPro ? 200 : 10;
    const existingIndex = this.data.advertisements.findIndex((a) => a.id === ad.id);
    if (existingIndex === -1 && this.getAds(ad.user_id).length >= maxAllowed) {
      throw new Error(`Storage limit reached (${maxAllowed} saved advertisements). ${!isPro ? "Upgrade to BIZNIX PRO \u2B50 to save up to 200 advertisements." : ""}`);
    }
    if (existingIndex >= 0) {
      this.data.advertisements[existingIndex] = ad;
    } else {
      this.data.advertisements.unshift(ad);
    }
    this.saveProject({
      id: `proj_ad_${ad.id}`,
      user_id: ad.user_id,
      project_type: ad.type.includes("Flyer") ? "flyer" : "advertisement",
      title: ad.title || `${ad.type} - ${ad.headline?.slice(0, 30)}`,
      content: JSON.stringify(ad),
      created_at: ad.created_at,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    this.persist();
    return ad;
  }
  // ----------------------------------------------------
  // PROJECTS STORAGE WITH STORAGE LIMITS
  // ----------------------------------------------------
  getProjects(userId) {
    return this.data.projects.filter((p) => p.user_id === userId || !p.user_id);
  }
  saveProject(project) {
    const user = this.getUser(project.user_id);
    const isPro = !!user?.is_pro;
    const maxAllowed = isPro ? 500 : 25;
    const existingIndex = this.data.projects.findIndex((p) => p.id === project.id);
    if (existingIndex === -1 && this.getProjects(project.user_id).length >= maxAllowed) {
      throw new Error(`Storage limit reached (${maxAllowed} total saved projects). ${!isPro ? "Upgrade to BIZNIX PRO \u2B50 for up to 500 project storage slots." : ""}`);
    }
    if (existingIndex >= 0) {
      this.data.projects[existingIndex] = { ...this.data.projects[existingIndex], ...project, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
    } else {
      this.data.projects.unshift(project);
    }
    this.persist();
    return project;
  }
  deleteProject(id) {
    this.data.projects = this.data.projects.filter((p) => p.id !== id);
    this.persist();
    return true;
  }
  // AI Conversations & Messages
  getConversations(userId) {
    return this.data.conversations.filter((c) => c.user_id === userId || !c.user_id);
  }
  createConversation(userId, title = "New Conversation") {
    const conv = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      user_id: userId,
      title,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.conversations.unshift(conv);
    this.persist();
    return conv;
  }
  getMessages(conversationId) {
    return this.data.messages.filter((m) => m.conversation_id === conversationId);
  }
  saveMessage(message) {
    this.data.messages.push(message);
    const conv = this.data.conversations.find((c) => c.id === message.conversation_id);
    if (conv) {
      conv.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    }
    this.persist();
    return message;
  }
  clearConversation(conversationId) {
    this.data.messages = this.data.messages.filter((m) => m.conversation_id !== conversationId);
    this.persist();
    return true;
  }
  getAllStore() {
    return this.data;
  }
};
var db = new Database();

// server/routes.ts
var apiRouter = (0, import_express.Router)();
apiRouter.get("/health", (req, res) => {
  res.json({ status: "ok", app: "BIZNIX", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
apiRouter.get("/user", (req, res) => {
  const user = db.getUser("user_default_1");
  res.json({ success: true, user });
});
apiRouter.post("/user", (req, res) => {
  try {
    const updates = req.body;
    const updated = db.updateUser("user_default_1", updates);
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
  }
});
apiRouter.get("/subscription/plans", (req, res) => {
  const plans = [
    {
      productId: "biznix_pro_monthly",
      title: "BIZNIX PRO Monthly",
      formattedPrice: "$9.99",
      priceAmountMicros: 999e4,
      currencyCode: "USD",
      billingPeriod: "P1M",
      periodLabel: "per month",
      description: "Full monthly access to all BIZNIX Pro AI features, daily ads, and business growth tools."
    },
    {
      productId: "biznix_pro_yearly",
      title: "BIZNIX PRO Yearly",
      formattedPrice: "$79.99",
      priceAmountMicros: 7999e4,
      currencyCode: "USD",
      billingPeriod: "P1Y",
      periodLabel: "per year",
      savingsBadge: "SAVE 35%",
      description: "Best Value! Full year of daily automatic ads, unlimited growth recommendations, and 500 projects storage."
    }
  ];
  res.json({ success: true, plans });
});
apiRouter.get("/subscription/status", async (req, res) => {
  try {
    const user = db.getUser("user_default_1");
    const quota = db.getUsageQuota("user_default_1");
    let dailyAd = null;
    let dailyGrowth = null;
    if (user?.is_pro) {
      dailyAd = await db.getDailyProAd("user_default_1");
      dailyGrowth = await db.getDailyProGrowthRec("user_default_1");
    }
    res.json({
      success: true,
      user,
      is_pro: !!user?.is_pro,
      subscription: user?.subscription,
      quota,
      dailyAd,
      dailyGrowth
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not fetch subscription status." });
  }
});
apiRouter.post("/subscription/verify-purchase", (req, res) => {
  try {
    const { productId, purchaseToken, orderId } = req.body;
    if (!productId || !purchaseToken) {
      return res.status(400).json({ success: false, message: "Invalid purchase details provided." });
    }
    const result = db.verifyAndApplyGooglePlayPurchase("user_default_1", {
      productId,
      purchaseToken,
      orderId
    });
    const updatedUser = db.getUser("user_default_1");
    const quota = db.getUsageQuota("user_default_1");
    res.json({
      success: true,
      subscription: result.subscription,
      user: updatedUser,
      quota,
      message: result.message
    });
  } catch (err) {
    console.error("Verify purchase error:", err);
    res.status(400).json({ success: false, message: err?.message || "Failed to verify subscription with Google Play." });
  }
});
apiRouter.post("/subscription/restore", (req, res) => {
  try {
    const result = db.restoreSubscription("user_default_1");
    const updatedUser = db.getUser("user_default_1");
    const quota = db.getUsageQuota("user_default_1");
    res.json({
      success: true,
      is_pro: result.is_pro,
      subscription: result.subscription,
      user: updatedUser,
      quota,
      message: result.message
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err?.message || "Failed to restore purchases." });
  }
});
apiRouter.post("/subscription/cancel", (req, res) => {
  try {
    const result = db.cancelSubscription("user_default_1");
    const updatedUser = db.getUser("user_default_1");
    res.json({
      success: true,
      subscription: result.subscription,
      user: updatedUser,
      message: result.message
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err?.message || "Failed to cancel subscription." });
  }
});
apiRouter.get("/pro/daily-ad", async (req, res) => {
  try {
    const user = db.getUser("user_default_1");
    if (!user?.is_pro) {
      return res.status(403).json({ success: false, message: "Daily Automatic Advertisement is a BIZNIX Pro feature." });
    }
    const dailyAd = await db.getDailyProAd("user_default_1");
    res.json({ success: true, dailyAd });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not generate or retrieve today's daily ad." });
  }
});
apiRouter.post("/pro/daily-ad/regenerate", async (req, res) => {
  try {
    const user = db.getUser("user_default_1");
    if (!user?.is_pro) {
      return res.status(403).json({ success: false, message: "BIZNIX Pro is required to regenerate daily ads." });
    }
    const dailyAd = await db.getDailyProAd("user_default_1", true);
    res.json({ success: true, dailyAd, message: "Fresh daily advertisement generated!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not regenerate daily ad." });
  }
});
apiRouter.get("/pro/daily-growth", async (req, res) => {
  try {
    const user = db.getUser("user_default_1");
    if (!user?.is_pro) {
      return res.status(403).json({ success: false, message: "Daily AI Business Growth Recommendations are exclusive to BIZNIX Pro." });
    }
    const dailyGrowth = await db.getDailyProGrowthRec("user_default_1");
    res.json({ success: true, dailyGrowth });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not fetch today's growth recommendation." });
  }
});
apiRouter.post("/pro/daily-growth/dismiss", (req, res) => {
  try {
    const success = db.dismissDailyGrowthRec("user_default_1", req.body.date);
    res.json({ success });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
apiRouter.post("/logo/generate", async (req, res) => {
  try {
    const { businessName, category, description, style, colors, slogan, isPro } = req.body;
    if (!businessName) {
      return res.status(400).json({ success: false, message: "Business name is required." });
    }
    const check = db.canGenerateLogo("user_default_1");
    if (!check.allowed) {
      return res.status(403).json({ success: false, message: check.message, quotaExceeded: true });
    }
    const concepts = await generateLogoConcepts({
      businessName,
      category: category || "Business",
      description,
      style: style || "Modern",
      colors: colors || [],
      slogan,
      isPro: !!isPro
    });
    db.recordUsage("user_default_1", "logo");
    const updatedQuota = db.getUsageQuota("user_default_1");
    res.json({ success: true, concepts, quota: updatedQuota });
  } catch (err) {
    console.error("Logo generation error:", err);
    res.status(500).json({ success: false, message: "Unable to generate your logo. Please try again." });
  }
});
apiRouter.get("/logos", (req, res) => {
  const logos = db.getLogos("user_default_1");
  res.json({ success: true, logos });
});
apiRouter.post("/logos/save", (req, res) => {
  try {
    const logoData = {
      id: req.body.id || `logo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      user_id: "user_default_1",
      business_name: req.body.business_name || "My Business",
      slogan: req.body.slogan || "",
      category: req.body.category || "General",
      style: req.body.style || "Modern",
      colors: req.body.colors || ["#6366f1"],
      svg_code: req.body.svg_code,
      description: req.body.description || "",
      font_style: req.body.font_style || "Space Grotesk",
      icon_name: req.body.icon_name || "sparkles",
      created_at: req.body.created_at || (/* @__PURE__ */ new Date()).toISOString(),
      is_favorite: !!req.body.is_favorite
    };
    const saved = db.saveLogo(logoData);
    res.json({ success: true, logo: saved });
  } catch (err) {
    res.status(500).json({ success: false, message: "Unable to save logo. Please try again." });
  }
});
apiRouter.delete("/logos/:id", (req, res) => {
  const success = db.deleteLogo(req.params.id);
  res.json({ success });
});
apiRouter.post("/chat/message", async (req, res) => {
  try {
    const { messages, conversationId, userContext } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: "Messages array is required." });
    }
    const check = db.canSendChatMessage("user_default_1");
    if (!check.allowed) {
      return res.status(403).json({ success: false, message: check.message, quotaExceeded: true });
    }
    const aiReply = await generateChatResponse({
      messages,
      userContext
    });
    db.recordUsage("user_default_1", "chat");
    const updatedQuota = db.getUsageQuota("user_default_1");
    const convId = conversationId || "conv_default";
    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg && lastUserMsg.role === "user") {
      db.saveMessage({
        id: `msg_u_${Date.now()}`,
        conversation_id: convId,
        role: "user",
        message: lastUserMsg.content,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    db.saveMessage({
      id: `msg_m_${Date.now()}`,
      conversation_id: convId,
      role: "model",
      message: aiReply,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    res.json({ success: true, reply: aiReply, quota: updatedQuota });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ success: false, message: "AI Assistant is temporarily unavailable." });
  }
});
apiRouter.get("/chat/conversations", (req, res) => {
  const convs = db.getConversations("user_default_1");
  res.json({ success: true, conversations: convs });
});
apiRouter.get("/chat/messages/:convId", (req, res) => {
  const msgs = db.getMessages(req.params.convId);
  res.json({ success: true, messages: msgs });
});
apiRouter.post("/chat/clear", (req, res) => {
  const { conversationId } = req.body;
  db.clearConversation(conversationId || "conv_default");
  res.json({ success: true });
});
apiRouter.post("/ad/generate", async (req, res) => {
  try {
    const {
      type,
      businessName,
      productService,
      description,
      targetAudience,
      location,
      price,
      specialOffer,
      contactInfo,
      style,
      platform
    } = req.body;
    if (!businessName || !productService) {
      return res.status(400).json({ success: false, message: "Business name and product/service are required." });
    }
    const check = db.canGenerateAd("user_default_1");
    if (!check.allowed) {
      return res.status(403).json({ success: false, message: check.message, quotaExceeded: true });
    }
    const adResult = await generateAdvertisement({
      type: type || "Business Advertisement",
      businessName,
      productService,
      description,
      targetAudience,
      location,
      price,
      specialOffer,
      contactInfo,
      style: style || "Modern",
      platform
    });
    db.recordUsage("user_default_1", "ad");
    const updatedQuota = db.getUsageQuota("user_default_1");
    res.json({ success: true, advertisement: adResult, quota: updatedQuota });
  } catch (err) {
    console.error("Ad generation error:", err);
    res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
  }
});
apiRouter.get("/ads", (req, res) => {
  const ads = db.getAds("user_default_1");
  res.json({ success: true, advertisements: ads });
});
apiRouter.post("/ads/save", (req, res) => {
  try {
    const ad = {
      id: req.body.id || `ad_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      user_id: "user_default_1",
      type: req.body.type || "Business Advertisement",
      platform: req.body.platform,
      title: req.body.title || req.body.headline || "Advertisement Project",
      headline: req.body.headline || "",
      body_text: req.body.body_text || req.body.bodyText || "",
      call_to_action: req.body.call_to_action || req.body.callToAction || "",
      hashtags: req.body.hashtags || [],
      special_offer: req.body.special_offer || req.body.specialOfferText,
      price: req.body.price,
      contact_info: req.body.contact_info,
      style: req.body.style || "Modern",
      image_prompt: req.body.image_prompt || req.body.imagePrompt,
      flyer_layout: req.body.flyer_layout || req.body.flyerLayout,
      created_at: req.body.created_at || (/* @__PURE__ */ new Date()).toISOString()
    };
    const saved = db.saveAd(ad);
    res.json({ success: true, advertisement: saved });
  } catch (err) {
    res.status(500).json({ success: false, message: "Unable to save advertisement. Please try again." });
  }
});
apiRouter.post("/growth/generate", async (req, res) => {
  try {
    const { toolType, inputs, businessName } = req.body;
    if (!toolType) {
      return res.status(400).json({ success: false, message: "Tool type is required." });
    }
    const output = await generateGrowthToolOutput({
      toolType,
      inputs: inputs || {},
      businessName: businessName || "My Business"
    });
    res.json({ success: true, output });
  } catch (err) {
    console.error("Growth tool generation error:", err);
    res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
  }
});
apiRouter.get("/projects", (req, res) => {
  const projects = db.getProjects("user_default_1");
  res.json({ success: true, projects });
});
apiRouter.post("/projects/save", (req, res) => {
  try {
    const project = {
      id: req.body.id || `proj_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      user_id: "user_default_1",
      project_type: req.body.project_type || "growth_doc",
      title: req.body.title || "Untitled Business Project",
      content: typeof req.body.content === "string" ? req.body.content : JSON.stringify(req.body.content),
      meta: req.body.meta || {},
      created_at: req.body.created_at || (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    const saved = db.saveProject(project);
    res.json({ success: true, project: saved });
  } catch (err) {
    res.status(500).json({ success: false, message: "Unable to save project." });
  }
});
apiRouter.delete("/projects/:id", (req, res) => {
  const success = db.deleteProject(req.params.id);
  res.json({ success });
});

// server.ts
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express2.default)();
  const PORT = 3e3;
  app.use(import_express2.default.json({ limit: "10mb" }));
  app.use(import_express2.default.urlencoded({ extended: true, limit: "10mb" }));
  app.use("/api", apiRouter);
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express2.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BIZNIX server running on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
//# sourceMappingURL=server.cjs.map
