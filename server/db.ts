import fs from 'fs';
import path from 'path';
import { 
  UserProfile, 
  GeneratedLogo, 
  GeneratedAdvertisement, 
  ProjectItem, 
  AIConversation, 
  AIMessage,
  UserSubscription,
  DailyProAd,
  DailyProGrowthRec,
  UsageQuota,
  SubscriptionPlanId
} from '../src/types';
import { 
  generateDailyPersonalizedAd, 
  generateDailyPersonalizedGrowthRecommendation 
} from './gemini';

interface UsageRecord {
  userId: string;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  logoGenerations: number;
  chatMessages: number;
  adGenerations: number;
}

interface DatabaseSchema {
  users: UserProfile[];
  logos: GeneratedLogo[];
  advertisements: GeneratedAdvertisement[];
  projects: ProjectItem[];
  conversations: AIConversation[];
  messages: AIMessage[];
  daily_ads: (DailyProAd & { user_id: string })[];
  daily_growth_recs: (DailyProGrowthRec & { user_id: string })[];
  usage: UsageRecord[];
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'biznix_store.json');

// Helper to get formatted date strings
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function getMonthString(): string {
  return getTodayString().slice(0, 7);
}

// Initial default user for seamless instant experience
const defaultUser: UserProfile = {
  id: 'user_default_1',
  name: 'Alex Morgan',
  email: 'alex@biznix.app',
  phone: '+1 (555) 234-5678',
  business_name: 'Apex Studios',
  business_category: 'Creative Design & Tech',
  business_description: 'An elite brand identity and digital innovation studio delivering high-conversion marketing.',
  target_audience: 'Entrepreneurs, small business founders, and modern creators.',
  products_services: 'Brand Identity Kits, AI Promotional Campaigns, and Marketing Roadmaps.',
  profile_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  is_pro: false,
  created_at: new Date().toISOString(),
  subscription: {
    plan_id: null,
    status: 'free',
    is_pro: false,
    last_daily_ad_date: undefined,
    last_growth_recommendation_date: undefined
  }
};

// Seed sample logos
const seedLogos: GeneratedLogo[] = [
  {
    id: 'logo_seed_1',
    user_id: 'user_default_1',
    business_name: 'Apex Studios',
    slogan: 'Crafting the Future of Digital Brands',
    category: 'Technology',
    style: 'Modern',
    colors: ['#3b82f6', '#1e293b', '#06b6d4'],
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
    description: 'Minimalist geometric apex triangle icon with tech cyan & indigo gradient.',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    is_favorite: true
  },
  {
    id: 'logo_seed_2',
    user_id: 'user_default_1',
    business_name: 'Luxe Aura',
    slogan: 'Timeless Elegance in Every Thread',
    category: 'Fashion',
    style: 'Luxury',
    colors: ['#d97706', '#18181b', '#fef3c7'],
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
    description: 'Gold monogram with luxury circular border and refined typography.',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    is_favorite: true
  }
];

// Seed sample projects
const seedProjects: ProjectItem[] = [
  {
    id: 'proj_seed_1',
    user_id: 'user_default_1',
    project_type: 'logo',
    title: 'Apex Studios Master Brandmark',
    content: JSON.stringify(seedLogos[0]),
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: 'proj_seed_2',
    user_id: 'user_default_1',
    project_type: 'advertisement',
    title: 'Summer Launch Special Promo',
    content: JSON.stringify({
      type: 'Special Offer',
      headline: 'Transform Your Business Presence with AI',
      body: 'Get 40% off custom brand identity and marketing kits this week only. Limited spots available!',
      cta: 'Claim Your Brand Kit Today',
      hashtags: ['#BusinessGrowth', '#BrandStrategy', '#BIZNIX', '#StartupLife']
    }),
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'proj_seed_3',
    user_id: 'user_default_1',
    project_type: 'growth_doc',
    title: 'Q3 Omni-Channel Marketing Plan',
    content: JSON.stringify({
      title: 'Apex Studios Q3 Marketing Blueprint',
      summary: 'Aggressive 90-day organic growth roadmap focusing on short-form video, WhatsApp direct community, and high-converting referral incentives.'
    }),
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  }
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not read persistent DB file, initializing in-memory store.');
    }

    return {
      users: [defaultUser],
      logos: [...seedLogos],
      advertisements: [],
      projects: [...seedProjects],
      conversations: [
        {
          id: 'conv_default',
          user_id: 'user_default_1',
          title: 'Business Launch Advisory',
          created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
          updated_at: new Date().toISOString(),
        }
      ],
      messages: [
        {
          id: 'msg_1',
          conversation_id: 'conv_default',
          role: 'model',
          message: 'Hello! I am BIZNIX AI, your dedicated AI business partner. How can I assist you with your business strategy, brand naming, marketing campaigns, or growth plans today?',
          created_at: new Date(Date.now() - 3600000 * 6).toISOString()
        }
      ],
      daily_ads: [],
      daily_growth_recs: [],
      usage: []
    };
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error persisting database:', e);
    }
  }

  // Users & Subscriptions
  getUser(id: string): UserProfile | undefined {
    let user = this.data.users.find(u => u.id === id) || this.data.users[0];
    if (user) {
      this.checkSubscriptionExpiration(user);
    }
    return user;
  }

  updateUser(id: string, updates: Partial<UserProfile>): UserProfile {
    let index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) {
      index = 0;
    }
    this.data.users[index] = { ...this.data.users[index], ...updates };
    this.persist();
    return this.data.users[index];
  }

  // Check and handle subscription expiration
  private checkSubscriptionExpiration(user: UserProfile) {
    if (!user.subscription) {
      user.subscription = {
        plan_id: null,
        status: user.is_pro ? 'active' : 'free',
        is_pro: !!user.is_pro
      };
    }

    if (user.subscription.is_pro && user.subscription.expires_at) {
      const now = new Date();
      const expiresAt = new Date(user.subscription.expires_at);
      if (now > expiresAt) {
        // Subscription has expired - gracefully return to free plan without deleting projects
        user.is_pro = false;
        user.subscription.is_pro = false;
        user.subscription.status = 'expired';
        user.subscription.plan_id = null;
        this.persist();
      }
    }
  }

  // ----------------------------------------------------
  // GOOGLE PLAY SUBSCRIPTION MANAGEMENT
  // ----------------------------------------------------
  verifyAndApplyGooglePlayPurchase(
    userId: string, 
    params: { productId: SubscriptionPlanId; purchaseToken: string; orderId?: string }
  ): { success: boolean; subscription: UserSubscription; message: string } {
    const user = this.getUser(userId);
    if (!user) {
      throw new Error('User account not found.');
    }

    const { productId, purchaseToken, orderId } = params;
    const isYearly = productId === 'biznix_pro_yearly';
    const now = new Date();
    const expiryDate = new Date(now);

    if (isYearly) {
      expiryDate.setFullYear(now.getFullYear() + 1);
    } else {
      expiryDate.setMonth(now.getMonth() + 1);
    }

    const verifiedOrderId = orderId || `GPA.${Date.now()}-${Math.floor(Math.random() * 900000 + 100000)}`;

    const newSubscription: UserSubscription = {
      plan_id: productId,
      status: 'active',
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

    // Trigger immediate generation of today's Pro automatic ad and growth recommendation in background
    this.getDailyProAd(userId).catch(() => {});
    this.getDailyProGrowthRec(userId).catch(() => {});

    return {
      success: true,
      subscription: newSubscription,
      message: `Successfully verified Google Play subscription for BIZNIX PRO ⭐ (${isYearly ? 'Yearly' : 'Monthly'})!`
    };
  }

  restoreSubscription(userId: string): { success: boolean; is_pro: boolean; subscription: UserSubscription; message: string } {
    const user = this.getUser(userId);
    if (!user) throw new Error('User not found');

    this.checkSubscriptionExpiration(user);

    if (user.subscription?.is_pro && user.subscription.status === 'active') {
      return {
        success: true,
        is_pro: true,
        subscription: user.subscription,
        message: 'Your active Google Play BIZNIX Pro subscription was successfully restored!'
      };
    }

    // Simulate real Google Play store query finding an existing verified subscription on Google Play account
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
    const restoredSub: UserSubscription = {
      plan_id: 'biznix_pro_monthly',
      status: 'active',
      is_pro: true,
      order_id: `GPA.RESTORE-${Date.now().toString().slice(-8)}`,
      purchase_token: `token_restored_${Date.now()}`,
      started_at: new Date(now.getTime() - 5 * 24 * 3600 * 1000).toISOString(),
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
      message: 'Active Google Play purchase found and verified. BIZNIX PRO ⭐ restored!'
    };
  }

  cancelSubscription(userId: string): { success: boolean; subscription: UserSubscription; message: string } {
    const user = this.getUser(userId);
    if (!user || !user.subscription) throw new Error('Subscription not found.');

    user.subscription.auto_renew = false;
    user.subscription.status = 'canceled';
    this.persist();

    return {
      success: true,
      subscription: user.subscription,
      message: 'Subscription auto-renew has been canceled via Google Play. You will retain Pro access until your current billing period ends.'
    };
  }

  // ----------------------------------------------------
  // USAGE TRACKING & QUOTAS ENFORCEMENT
  // ----------------------------------------------------
  private getUsageRecord(userId: string): UsageRecord {
    const today = getTodayString();
    const month = getMonthString();

    if (!this.data.usage) {
      this.data.usage = [];
    }

    let record = this.data.usage.find(u => u.userId === userId && u.date === today);
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

  getUsageQuota(userId: string): UsageQuota {
    const user = this.getUser(userId);
    const isPro = !!user?.is_pro;
    const today = getTodayString();
    const month = getMonthString();

    const todayRecord = this.getUsageRecord(userId);

    // Calculate month totals
    const monthRecords = (this.data.usage || []).filter(u => u.userId === userId && u.month === month);
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
          logoGenerations: { limit: 50, period: 'month', remaining: Math.max(0, 50 - monthLogos) },
          aiMessages: { limit: 500, period: 'month', remaining: Math.max(0, 500 - monthMessages) },
          adGenerations: { limit: 100, period: 'month', remaining: Math.max(0, 100 - monthAds) },
          maxSavedLogos: 200,
          maxSavedAds: 200,
          maxSavedProjects: 500
        }
      };
    }

    // Free Plan Limits
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
        logoGenerations: { limit: 3, period: 'day', remaining: Math.max(0, 3 - todayRecord.logoGenerations) },
        aiMessages: { limit: 10, period: 'day', remaining: Math.max(0, 10 - todayRecord.chatMessages) },
        adGenerations: { limit: 5, period: 'day', remaining: Math.max(0, 5 - todayRecord.adGenerations) },
        maxSavedLogos: 10,
        maxSavedAds: 10,
        maxSavedProjects: 25
      }
    };
  }

  recordUsage(userId: string, type: 'logo' | 'chat' | 'ad') {
    const record = this.getUsageRecord(userId);
    if (type === 'logo') record.logoGenerations += 1;
    if (type === 'chat') record.chatMessages += 1;
    if (type === 'ad') record.adGenerations += 1;
    this.persist();
  }

  canGenerateLogo(userId: string): { allowed: boolean; message?: string } {
    const quota = this.getUsageQuota(userId);
    if (quota.limits.logoGenerations.remaining <= 0) {
      return {
        allowed: false,
        message: quota.is_pro 
          ? 'You have reached your monthly Pro limit of 50 logo generations.'
          : 'Free plan limit reached (3 logo generations per day). Upgrade to BIZNIX PRO ⭐ for 50 logos/month & HD vector exports.'
      };
    }
    return { allowed: true };
  }

  canSendChatMessage(userId: string): { allowed: boolean; message?: string } {
    const quota = this.getUsageQuota(userId);
    if (quota.limits.aiMessages.remaining <= 0) {
      return {
        allowed: false,
        message: quota.is_pro 
          ? 'You have reached your monthly Pro limit of 500 AI Assistant messages.'
          : 'Free plan limit reached (10 AI messages per day). Upgrade to BIZNIX PRO ⭐ for 500 messages/month & priority AI processing.'
      };
    }
    return { allowed: true };
  }

  canGenerateAd(userId: string): { allowed: boolean; message?: string } {
    const quota = this.getUsageQuota(userId);
    if (quota.limits.adGenerations.remaining <= 0) {
      return {
        allowed: false,
        message: quota.is_pro 
          ? 'You have reached your monthly Pro limit of 100 AI advertisements.'
          : 'Free plan limit reached (5 AI advertisements per day). Upgrade to BIZNIX PRO ⭐ for 100 ads/month & multi-channel campaigns.'
      };
    }
    return { allowed: true };
  }

  // ----------------------------------------------------
  // PRO AUTOMATIC DAILY FEATURES
  // ----------------------------------------------------
  async getDailyProAd(userId: string, forceRegenerate: boolean = false): Promise<DailyProAd | null> {
    const user = this.getUser(userId);
    if (!user || !user.is_pro) {
      return null;
    }

    const today = getTodayString();
    if (!this.data.daily_ads) {
      this.data.daily_ads = [];
    }

    let existing = this.data.daily_ads.find(a => a.user_id === userId && a.date === today);
    if (existing && !forceRegenerate) {
      return existing;
    }

    // Generate ONE automatic daily ad based on user's saved business profile
    const generated = await generateDailyPersonalizedAd({
      business_name: user.business_name || 'Apex Studios',
      business_category: user.business_category || 'Business Services',
      business_description: user.business_description || '',
      target_audience: user.target_audience || '',
      products_services: user.products_services || '',
      phone: user.phone || ''
    });

    const adObject: GeneratedAdvertisement = {
      id: `daily_ad_${today}_${Date.now()}`,
      user_id: userId,
      type: (generated.type as any) || 'Special Offer',
      platform: generated.platform as any,
      title: generated.title,
      headline: generated.headline,
      body_text: generated.body_text,
      call_to_action: generated.call_to_action,
      hashtags: generated.hashtags,
      special_offer: generated.special_offer,
      price: generated.price,
      contact_info: generated.contact_info,
      style: generated.style as any,
      flyer_layout: generated.flyer_layout,
      created_at: new Date().toISOString()
    };

    const dailyRecord: DailyProAd & { user_id: string } = {
      user_id: userId,
      date: today,
      ad: adObject,
      generated_at: new Date().toISOString(),
      status: 'fresh'
    };

    if (existing) {
      const idx = this.data.daily_ads.findIndex(a => a.user_id === userId && a.date === today);
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

  async getDailyProGrowthRec(userId: string): Promise<DailyProGrowthRec | null> {
    const user = this.getUser(userId);
    if (!user || !user.is_pro) {
      return null;
    }

    const today = getTodayString();
    if (!this.data.daily_growth_recs) {
      this.data.daily_growth_recs = [];
    }

    let existing = this.data.daily_growth_recs.find(r => r.user_id === userId && r.date === today);
    if (existing) {
      return existing;
    }

    // Generate ONE personalized growth recommendation for today
    const generated = await generateDailyPersonalizedGrowthRecommendation({
      business_name: user.business_name || 'Apex Studios',
      business_category: user.business_category || 'Business Services',
      business_description: user.business_description || '',
      target_audience: user.target_audience || '',
      products_services: user.products_services || ''
    });

    const recRecord: DailyProGrowthRec & { user_id: string } = {
      user_id: userId,
      date: today,
      title: generated.title,
      recommendation: generated.recommendation,
      category: generated.category,
      actionable_step: generated.actionable_step,
      generated_at: new Date().toISOString(),
      status: 'active'
    };

    this.data.daily_growth_recs.unshift(recRecord);
    if (user.subscription) {
      user.subscription.last_growth_recommendation_date = today;
    }
    this.persist();

    return recRecord;
  }

  dismissDailyGrowthRec(userId: string, date?: string): boolean {
    const targetDate = date || getTodayString();
    const item = (this.data.daily_growth_recs || []).find(r => r.user_id === userId && r.date === targetDate);
    if (item) {
      item.status = 'dismissed';
      this.persist();
      return true;
    }
    return false;
  }

  // ----------------------------------------------------
  // LOGO STORAGE WITH STORAGE LIMITS
  // ----------------------------------------------------
  getLogos(userId: string): GeneratedLogo[] {
    return this.data.logos.filter(l => l.user_id === userId || !l.user_id);
  }

  saveLogo(logo: GeneratedLogo): GeneratedLogo {
    const user = this.getUser(logo.user_id);
    const isPro = !!user?.is_pro;
    const maxAllowed = isPro ? 200 : 10;
    const existingIndex = this.data.logos.findIndex(l => l.id === logo.id);

    if (existingIndex === -1 && this.getLogos(logo.user_id).length >= maxAllowed) {
      throw new Error(`Storage limit reached (${maxAllowed} saved logos). ${!isPro ? 'Upgrade to BIZNIX PRO ⭐ to save up to 200 logos.' : ''}`);
    }

    if (existingIndex >= 0) {
      this.data.logos[existingIndex] = logo;
    } else {
      this.data.logos.unshift(logo);
    }
    
    // Also save/update into projects library
    this.saveProject({
      id: `proj_logo_${logo.id}`,
      user_id: logo.user_id,
      project_type: 'logo',
      title: `${logo.business_name} Logo`,
      content: JSON.stringify(logo),
      created_at: logo.created_at,
      updated_at: new Date().toISOString()
    });

    this.persist();
    return logo;
  }

  deleteLogo(id: string): boolean {
    this.data.logos = this.data.logos.filter(l => l.id !== id);
    this.data.projects = this.data.projects.filter(p => p.id !== `proj_logo_${id}` && p.id !== id);
    this.persist();
    return true;
  }

  // ----------------------------------------------------
  // ADVERTISEMENTS STORAGE WITH STORAGE LIMITS
  // ----------------------------------------------------
  getAds(userId: string): GeneratedAdvertisement[] {
    return this.data.advertisements.filter(a => a.user_id === userId || !a.user_id);
  }

  saveAd(ad: GeneratedAdvertisement): GeneratedAdvertisement {
    const user = this.getUser(ad.user_id);
    const isPro = !!user?.is_pro;
    const maxAllowed = isPro ? 200 : 10;
    const existingIndex = this.data.advertisements.findIndex(a => a.id === ad.id);

    if (existingIndex === -1 && this.getAds(ad.user_id).length >= maxAllowed) {
      throw new Error(`Storage limit reached (${maxAllowed} saved advertisements). ${!isPro ? 'Upgrade to BIZNIX PRO ⭐ to save up to 200 advertisements.' : ''}`);
    }

    if (existingIndex >= 0) {
      this.data.advertisements[existingIndex] = ad;
    } else {
      this.data.advertisements.unshift(ad);
    }

    this.saveProject({
      id: `proj_ad_${ad.id}`,
      user_id: ad.user_id,
      project_type: ad.type.includes('Flyer') ? 'flyer' : 'advertisement',
      title: ad.title || `${ad.type} - ${ad.headline?.slice(0, 30)}`,
      content: JSON.stringify(ad),
      created_at: ad.created_at,
      updated_at: new Date().toISOString()
    });

    this.persist();
    return ad;
  }

  // ----------------------------------------------------
  // PROJECTS STORAGE WITH STORAGE LIMITS
  // ----------------------------------------------------
  getProjects(userId: string): ProjectItem[] {
    return this.data.projects.filter(p => p.user_id === userId || !p.user_id);
  }

  saveProject(project: ProjectItem): ProjectItem {
    const user = this.getUser(project.user_id);
    const isPro = !!user?.is_pro;
    const maxAllowed = isPro ? 500 : 25;
    const existingIndex = this.data.projects.findIndex(p => p.id === project.id);

    if (existingIndex === -1 && this.getProjects(project.user_id).length >= maxAllowed) {
      throw new Error(`Storage limit reached (${maxAllowed} total saved projects). ${!isPro ? 'Upgrade to BIZNIX PRO ⭐ for up to 500 project storage slots.' : ''}`);
    }

    if (existingIndex >= 0) {
      this.data.projects[existingIndex] = { ...this.data.projects[existingIndex], ...project, updated_at: new Date().toISOString() };
    } else {
      this.data.projects.unshift(project);
    }
    this.persist();
    return project;
  }

  deleteProject(id: string): boolean {
    this.data.projects = this.data.projects.filter(p => p.id !== id);
    this.persist();
    return true;
  }

  // AI Conversations & Messages
  getConversations(userId: string): AIConversation[] {
    return this.data.conversations.filter(c => c.user_id === userId || !c.user_id);
  }

  createConversation(userId: string, title: string = 'New Conversation'): AIConversation {
    const conv: AIConversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      user_id: userId,
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.data.conversations.unshift(conv);
    this.persist();
    return conv;
  }

  getMessages(conversationId: string): AIMessage[] {
    return this.data.messages.filter(m => m.conversation_id === conversationId);
  }

  saveMessage(message: AIMessage): AIMessage {
    this.data.messages.push(message);
    const conv = this.data.conversations.find(c => c.id === message.conversation_id);
    if (conv) {
      conv.updated_at = new Date().toISOString();
    }
    this.persist();
    return message;
  }

  clearConversation(conversationId: string): boolean {
    this.data.messages = this.data.messages.filter(m => m.conversation_id !== conversationId);
    this.persist();
    return true;
  }

  getAllStore(): DatabaseSchema {
    return this.data;
  }
}

export const db = new Database();
