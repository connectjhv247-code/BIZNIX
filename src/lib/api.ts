import { 
  GeneratedLogo, 
  GeneratedAdvertisement, 
  ProjectItem, 
  UserProfile, 
  LogoStyle, 
  AdvertisementType, 
  AdStyle, 
  SocialPlatform, 
  GrowthToolType,
  AIConversation,
  AIMessage
} from '../types';
import { auth } from './firebase';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      headers['x-user-id'] = user.uid;
      if (user.email) headers['x-user-email'] = user.email;
    }
  } catch (e) {}
  return headers;
}

export interface LogoConceptResponse {
  id: string;
  title: string;
  description: string;
  svgCode: string;
  colors: string[];
  fontStyle: string;
  iconName: string;
}

export const api = {
  // User
  async getUser(): Promise<UserProfile> {
    const res = await fetch('/api/user');
    const data = await res.json();
    return data.user;
  },

  async updateUser(updates: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    return data.user;
  },

  // Logos
  async generateLogo(params: {
    businessName: string;
    category: string;
    description?: string;
    style: LogoStyle;
    colors?: string[];
    slogan?: string;
    isPro?: boolean;
  }): Promise<LogoConceptResponse[]> {
    const res = await fetch('/api/logo/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'Unable to generate your logo.');
    }
    return data.concepts;
  },

  async getLogos(): Promise<GeneratedLogo[]> {
    const res = await fetch('/api/logos');
    const data = await res.json();
    return data.logos || [];
  },

  async saveLogo(logo: Partial<GeneratedLogo>): Promise<GeneratedLogo> {
    const res = await fetch('/api/logos/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logo),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Unable to save logo.');
    return data.logo;
  },

  async deleteLogo(id: string): Promise<boolean> {
    const res = await fetch(`/api/logos/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  },

  // AI Assistant Chat
  async sendChatMessage(params: {
    messages: { role: 'user' | 'model'; content: string }[];
    conversationId?: string;
    userContext?: { businessName?: string; businessCategory?: string };
  }): Promise<string> {
    const res = await fetch('/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'AI Assistant is temporarily unavailable.');
    }
    return data.reply;
  },

  async getConversations(): Promise<AIConversation[]> {
    const res = await fetch('/api/chat/conversations');
    const data = await res.json();
    return data.conversations || [];
  },

  async getChatMessages(convId: string): Promise<AIMessage[]> {
    const res = await fetch(`/api/chat/messages/${convId}`);
    const data = await res.json();
    return data.messages || [];
  },

  async clearChat(conversationId: string): Promise<boolean> {
    const res = await fetch('/api/chat/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId }),
    });
    const data = await res.json();
    return data.success;
  },

  // Advertisements
  async generateAd(params: {
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
  }): Promise<any> {
    const res = await fetch('/api/ad/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'Something went wrong. Please try again.');
    }
    return data.advertisement;
  },

  async getAds(): Promise<GeneratedAdvertisement[]> {
    const res = await fetch('/api/ads');
    const data = await res.json();
    return data.advertisements || [];
  },

  async saveAd(ad: Partial<GeneratedAdvertisement>): Promise<GeneratedAdvertisement> {
    const res = await fetch('/api/ads/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ad),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Unable to save advertisement.');
    return data.advertisement;
  },

  // Growth Tools
  async generateGrowthTool(params: {
    toolType: GrowthToolType;
    inputs: Record<string, any>;
    businessName?: string;
  }): Promise<any> {
    const res = await fetch('/api/growth/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'Something went wrong. Please try again.');
    }
    return data.output;
  },

  // Projects Library
  async getProjects(): Promise<ProjectItem[]> {
    const res = await fetch('/api/projects');
    const data = await res.json();
    return data.projects || [];
  },

  async saveProject(project: Partial<ProjectItem>): Promise<ProjectItem> {
    const res = await fetch('/api/projects/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Unable to save project.');
    return data.project;
  },

  async deleteProject(id: string): Promise<boolean> {
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  },

  // ----------------------------------------------------
  // SUBSCRIPTIONS & REAL PAYSTACK VERIFICATION
  // ----------------------------------------------------
  async getSubscriptionPlans(): Promise<any[]> {
    const res = await fetch('/api/subscription/plans');
    const data = await res.json();
    return data.plans || [];
  },

  async getSubscriptionStatus(): Promise<any> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/subscription/status', { headers });
    const data = await res.json();
    return data;
  },

  async getPaystackConfig(): Promise<{ configured: boolean; paymentUrl: string }> {
    const res = await fetch('/api/paystack/config');
    return await res.json();
  },

  async createPaystackSession(email?: string): Promise<{ success: boolean; paymentUrl: string; checkoutUrl: string }> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/paystack/create-session', {
      method: 'POST',
      headers,
      body: JSON.stringify({ email }),
    });
    return await res.json();
  },

  async verifyPaystackPayment(reference: string): Promise<{
    success: boolean;
    is_pro: boolean;
    alreadyFulfilled?: boolean;
    message: string;
    subscription?: any;
    paystack?: any;
  }> {
    const headers = await getAuthHeaders();
    const cleanInput = reference.trim();
    const res = await fetch('/api/paystack/verify', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        reference: cleanInput,
        email: cleanInput.includes('@') ? cleanInput : undefined
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Paystack payment verification failed.');
    }
    return data;
  },

  async restorePurchases(): Promise<any> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/subscription/restore', {
      method: 'POST',
      headers,
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'No active entitlement found to restore.');
    }
    return data;
  },

  async cancelSubscription(): Promise<any> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/subscription/cancel', {
      method: 'POST',
      headers,
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'Cancellation failed.');
    }
    return data;
  },

  // ----------------------------------------------------
  // PRO DAILY AUTOMATED CONTENT
  // ----------------------------------------------------
  async getDailyProAd(): Promise<any> {
    const res = await fetch('/api/pro/daily-ad');
    const data = await res.json();
    return data.dailyAd;
  },

  async regenerateDailyProAd(): Promise<any> {
    const res = await fetch('/api/pro/daily-ad/regenerate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to regenerate daily ad.');
    return data.dailyAd;
  },

  async getDailyProGrowth(): Promise<any> {
    const res = await fetch('/api/pro/daily-growth');
    const data = await res.json();
    return data.dailyGrowth;
  },

  async dismissDailyGrowth(date?: string): Promise<boolean> {
    const res = await fetch('/api/pro/daily-growth/dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date }),
    });
    const data = await res.json();
    return data.success;
  }
};
