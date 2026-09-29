export type UserRole = 'free' | 'pro';

export type SubscriptionPlanId = 'biznix_pro_monthly' | 'biznix_pro_yearly' | 'biznix_pro_paystack' | 'PLN_lt9i01y8njw0316' | 'PLN_lt9l0iy8mjw0316';
export type SubscriptionStatus = 'free' | 'active' | 'expired' | 'canceled' | 'in_grace_period';

export interface UserSubscription {
  plan_id: SubscriptionPlanId | string | null;
  status: SubscriptionStatus;
  is_pro: boolean;
  isPro?: boolean;
  proActivatedAt?: number;
  order_id?: string;
  paystack_reference?: string;
  provider?: 'paystack' | 'google_play';
  amount?: number;
  currency?: string;
  channel?: string;
  purchase_token?: string;
  expires_at?: string;
  auto_renew?: boolean;
  started_at?: string;
  last_daily_ad_date?: string; // YYYY-MM-DD
  last_growth_recommendation_date?: string; // YYYY-MM-DD
}

export interface GooglePlayPlan {
  productId: SubscriptionPlanId;
  title: string;
  formattedPrice: string;
  priceAmountMicros: number;
  currencyCode: string;
  billingPeriod: 'P1M' | 'P1Y';
  periodLabel: string;
  savingsBadge?: string;
  description: string;
}

export interface DailyProAd {
  date: string;
  ad: GeneratedAdvertisement;
  generated_at: string;
  status: 'fresh' | 'viewed' | 'saved';
}

export interface DailyProGrowthRec {
  date: string;
  title: string;
  recommendation: string;
  category: string;
  actionable_step: string;
  generated_at: string;
  status: 'active' | 'dismissed' | 'saved';
}

export interface UsageQuota {
  today_date: string;
  is_pro: boolean;
  logos_generated_today: number;
  logos_generated_this_month: number;
  logos_generated_count: number;
  ai_messages_today: number;
  ai_messages_this_month: number;
  chat_messages_count: number;
  ads_generated_today: number;
  ads_generated_this_month: number;
  ads_generated_count: number;
  saved_logos_count: number;
  saved_ads_count: number;
  saved_projects_count: number;
  logoGenerationsLeft: number;
  aiMessagesLeft: number;
  growthToolsLeft: number;
  adGenerationsLeft: number;
  maxProjects: number;
  plan_limits: {
    logos_limit: number;
    chat_messages_limit: number;
    ads_limit: number;
    max_saved_logos: number;
    max_saved_ads: number;
  };
  limits: {
    logoGenerations: { limit: number; period: 'day' | 'month'; remaining: number };
    aiMessages: { limit: number; period: 'day' | 'month'; remaining: number };
    adGenerations: { limit: number; period: 'day' | 'month'; remaining: number };
    maxSavedLogos: number;
    maxSavedAds: number;
    maxSavedProjects: number;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  business_name: string;
  business_category: string;
  business_description?: string;
  target_audience?: string;
  products_services?: string;
  profile_image: string;
  is_pro: boolean;
  isPro?: boolean;
  proActivatedAt?: number;
  pro_since?: string;
  created_at: string;
  subscription?: UserSubscription;
  paystack?: {
    reference?: string;
    customer_code?: string;
    channel?: string;
    amount?: number;
    currency?: string;
    paid_at?: string;
  };
}

export type LogoStyle = 
  | 'Modern'
  | 'Minimal'
  | 'Luxury'
  | 'Corporate'
  | 'Technology'
  | 'Automotive'
  | 'Fashion'
  | 'Restaurant'
  | 'Real Estate'
  | 'Gaming'
  | 'Creative'
  | '3D';

export interface GeneratedLogo {
  id: string;
  user_id: string;
  business_name: string;
  slogan?: string;
  category: string;
  style: LogoStyle;
  colors: string[];
  svg_code: string;
  description?: string;
  font_style?: string;
  icon_name?: string;
  created_at: string;
  is_favorite?: boolean;
}

export type AdvertisementType =
  | 'Product Advertisement'
  | 'Business Advertisement'
  | 'WhatsApp Advertisement'
  | 'Facebook Advertisement'
  | 'Instagram Advertisement'
  | 'TikTok Content'
  | 'Promotional Flyer'
  | 'Special Offer'
  | 'Grand Opening'
  | 'New Product Announcement'
  | 'Customer Appreciation'
  | 'Sales Campaign'
  | 'Product Launch'
  | 'Discount Sale'
  | 'Social Media Campaign'
  | 'Event Promotion'
  | 'Customer Testimonial'
  | 'Service Highlight'
  | 'Holiday Promo'
  | 'Brand Awareness'
  | 'Lead Generation';

export type AdStyle =
  | 'Professional'
  | 'Luxury'
  | 'Modern'
  | 'Bold'
  | 'Colorful'
  | 'Simple'
  | 'Corporate'
  | 'Urgent'
  | 'Storytelling'
  | 'Playful'
  | 'Bold & Punchy'
  | 'Minimalist';

export type AdvertiseSubTab = 'studio' | 'flyer_designer' | 'templates';

export type SocialPlatform = 'Facebook' | 'Instagram' | 'TikTok' | 'WhatsApp Status' | 'X';

export interface GeneratedAdvertisement {
  id: string;
  user_id: string;
  type: AdvertisementType;
  platform?: SocialPlatform;
  title: string;
  headline: string;
  body_text: string;
  call_to_action: string;
  hashtags: string[];
  target_audience_tips?: string;
  special_offer?: string;
  price?: string;
  contact_info?: string;
  style?: AdStyle;
  image_prompt?: string;
  flyer_layout?: FlyerLayoutData;
  created_at: string;
}

export interface FlyerLayoutData {
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
}

export type ProjectType = 'logo' | 'advertisement' | 'flyer' | 'growth_doc' | 'conversation';

export interface ProjectItem {
  id: string;
  user_id: string;
  project_type: ProjectType;
  title: string;
  content: string; // JSON string or text content
  meta?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'model';
  message: string;
  created_at: string;
}

export type GrowthToolType = 
  | 'idea_generator'
  | 'name_generator'
  | 'slogan_generator'
  | 'business_plan'
  | 'marketing_planner'
  | 'customer_targeting'
  | 'product_description'
  | 'growth_strategy';

