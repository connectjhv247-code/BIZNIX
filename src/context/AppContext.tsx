import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  UserProfile, 
  GeneratedLogo, 
  GeneratedAdvertisement, 
  ProjectItem, 
  GrowthToolType,
  LogoStyle,
  UserSubscription,
  UsageQuota,
  DailyProAd,
  DailyProGrowthRec,
  GooglePlayPlan
} from '../types';
import { api } from '../lib/api';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  registerFirebaseUser,
  loginFirebaseUser,
  logoutFirebaseUser,
  sendPasswordReset,
  getFirestoreUserProfile,
  updateFirestoreUserProfile,
  getFirestoreLogos,
  saveFirestoreLogo,
  deleteFirestoreLogo,
  getFirestoreAds,
  saveFirestoreAd,
  getFirestoreProjects,
  saveFirestoreProject,
  deleteFirestoreProject,
  resendEmailVerification,
  checkEmailVerified
} from '../lib/firebaseAuthService';

export type MainNavTab = 'home' | 'create' | 'advertise' | 'assistant' | 'profile';
export type CreateSubTab = 'logo' | 'name' | 'slogan' | 'flyer';
export type AdvertiseSubTab = 'studio' | 'whatsapp' | 'social' | 'product' | 'flyer';
export type ProfileSubTab = 'profile' | 'logos' | 'ads' | 'projects' | 'history' | 'settings' | 'support';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  firebaseUser: FirebaseUser | null;
  isPro: boolean;
  setIsPro: (value: boolean) => void;
  subscription?: UserSubscription;
  usageQuota: UsageQuota | null;
  dailyProAd: DailyProAd | null;
  dailyProGrowth: DailyProGrowthRec | null;
  
  activeTab: MainNavTab;
  setActiveTab: (tab: MainNavTab) => void;
  createSubTab: CreateSubTab;
  setCreateSubTab: (subTab: CreateSubTab) => void;
  advertiseSubTab: AdvertiseSubTab;
  setAdvertiseSubTab: (subTab: AdvertiseSubTab) => void;
  profileSubTab: ProfileSubTab;
  setProfileSubTab: (subTab: ProfileSubTab) => void;
  activeGrowthTool: GrowthToolType;
  setActiveGrowthTool: (tool: GrowthToolType) => void;
  
  // Data
  logos: GeneratedLogo[];
  advertisements: GeneratedAdvertisement[];
  projects: ProjectItem[];
  recentProjects: ProjectItem[];
  isLoadingData: boolean;
  
  // Actions
  refreshAllData: () => Promise<void>;
  saveLogo: (logo: Partial<GeneratedLogo>) => Promise<GeneratedLogo>;
  deleteLogo: (id: string) => Promise<void>;
  saveAd: (ad: Partial<GeneratedAdvertisement>) => Promise<GeneratedAdvertisement>;
  saveProject: (project: Partial<ProjectItem>) => Promise<ProjectItem>;
  deleteProject: (id: string) => Promise<void>;
  
  // Subscription & Paystack Billing Actions
  verifyPaystackPayment: (reference: string) => Promise<boolean>;
  openPaystackPaymentPage: () => void;
  isVerifyingPayment: boolean;
  verifyGooglePlayPurchase: (productId: string, purchaseToken: string, orderId?: string) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  cancelSubscription: () => Promise<boolean>;
  regenerateDailyProAd: () => Promise<DailyProAd | null>;
  dismissDailyGrowth: () => Promise<void>;

  // Modals & UI
  showProModal: boolean;
  setShowProModal: (show: boolean) => void;
  proModalFeature: string;
  openProModal: (featureName?: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  toasts: ToastMessage[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  
  // Auth & Session
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  isAuthLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  registerAndVerify: (userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    business_name?: string;
    business_category?: string;
    profile_image?: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  sendEmailVerificationLink: () => Promise<void>;
  verifyEmailStatus: () => Promise<boolean>;

  // Cross-Navigation Shortcut
  navigateToTool: (tab: MainNavTab, subTab?: string, toolType?: GrowthToolType) => void;
}

const defaultUser: UserProfile = {
  id: 'guest_user',
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
  created_at: new Date().toISOString()
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [usageQuota, setUsageQuota] = useState<UsageQuota | null>(null);
  const [dailyProAd, setDailyProAd] = useState<DailyProAd | null>(null);
  const [dailyProGrowth, setDailyProGrowth] = useState<DailyProGrowthRec | null>(null);

  const [activeTab, setActiveTab] = useState<MainNavTab>('home');
  const [createSubTab, setCreateSubTab] = useState<CreateSubTab>('logo');
  const [advertiseSubTab, setAdvertiseSubTab] = useState<AdvertiseSubTab>('studio');
  const [profileSubTab, setProfileSubTab] = useState<ProfileSubTab>('profile');
  const [activeGrowthTool, setActiveGrowthTool] = useState<GrowthToolType>('idea_generator');
  
  const [logos, setLogos] = useState<GeneratedLogo[]>([]);
  const [advertisements, setAdvertisements] = useState<GeneratedAdvertisement[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  
  const [showProModal, setShowProModal] = useState<boolean>(false);
  const [proModalFeature, setProModalFeature] = useState<string>('Unlock All Premium Features');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState<boolean>(false);

  const isPro = !!(user.is_pro || user.isPro);

  const openProModal = (featureName?: string) => {
    setProModalFeature(featureName || 'Unlock All Premium Features');
    setShowProModal(true);
  };

  const openPaystackPaymentPage = () => {
    const userEmail = user?.email || firebaseUser?.email || '';
    if (userEmail) {
      try {
        localStorage.setItem('biznix_email', userEmail.trim());
      } catch (e) {}
    }
    const baseUrl = 'https://paystack.shop/pay/BIZNIX_pro';
    const checkoutUrl = userEmail ? `${baseUrl}?email=${encodeURIComponent(userEmail.trim())}` : baseUrl;
    window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
  };

  const setIsPro = async (value: boolean) => {
    if (value) {
      // Pro entitlement cannot be self-granted by the client.
      // Must be unlocked only via verified Paystack transaction.
      openProModal('Upgrade to BIZNIX Pro');
    } else {
      setUser(prev => ({
        ...prev,
        is_pro: false
      }));
    }
  };

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Sync initial theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Listen to Firebase Authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      setIsAuthLoading(false);

      if (fbUser) {
        setIsAuthenticated(true);
        // Load user profile from Firestore
        const profile = await getFirestoreUserProfile(fbUser.uid);
        if (profile) {
          setUser(profile);
        } else {
          // Initialize fresh profile if none exists
          const username = (fbUser.email || 'user').split('@')[0];
          const newProfile: UserProfile = {
            id: fbUser.uid,
            name: fbUser.displayName || (username.charAt(0).toUpperCase() + username.slice(1)),
            email: fbUser.email || '',
            phone: '+1 (555) 000-0000',
            business_name: `${username}'s Business`,
            business_category: 'Creative Design & Tech',
            profile_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            is_pro: false,
            created_at: new Date().toISOString()
          };
          await updateFirestoreUserProfile(fbUser.uid, newProfile);
          setUser(newProfile);
        }
      } else {
        setIsAuthenticated(false);
        setUser(defaultUser);
        setLogos([]);
        setAdvertisements([]);
        setProjects([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch Firestore Data whenever authenticated Firebase UID changes
  const refreshAllData = async () => {
    if (!firebaseUser?.uid) {
      setLogos([]);
      setAdvertisements([]);
      setProjects([]);
      return;
    }

    setIsLoadingData(true);
    try {
      const uid = firebaseUser.uid;
      const [u, l, a, p, subStatus] = await Promise.all([
        getFirestoreUserProfile(uid).catch(() => null),
        getFirestoreLogos(uid).catch(() => []),
        getFirestoreAds(uid).catch(() => []),
        getFirestoreProjects(uid).catch(() => []),
        api.getSubscriptionStatus().catch(() => null)
      ]);

      if (u) setUser(u);
      setLogos(l);
      setAdvertisements(a);
      setProjects(p);

      if (subStatus) {
        if (subStatus.quota) setUsageQuota(subStatus.quota);
        if (subStatus.dailyAd) setDailyProAd(subStatus.dailyAd);
        if (subStatus.dailyGrowth) setDailyProGrowth(subStatus.dailyGrowth);
      }
    } catch (e) {
      console.error('Error refreshing Firestore data:', e);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && firebaseUser?.uid) {
      refreshAllData();
    }
  }, [isAuthenticated, firebaseUser?.uid]);

  // LOGO ACTIONS (Firestore)
  const saveLogo = async (logoData: Partial<GeneratedLogo>): Promise<GeneratedLogo> => {
    if (!firebaseUser?.uid) {
      throw new Error('Please sign in to save logos to your account.');
    }

    try {
      const saved = await saveFirestoreLogo(firebaseUser.uid, logoData);
      setLogos(prev => [saved, ...prev.filter(l => l.id !== saved.id)]);
      addToast('Logo saved to My Designs in Firestore!', 'success');
      return saved;
    } catch (err: any) {
      addToast(err.message || 'Unable to save logo to Firestore', 'error');
      throw err;
    }
  };

  const deleteLogo = async (id: string) => {
    if (!firebaseUser?.uid) return;
    try {
      await deleteFirestoreLogo(firebaseUser.uid, id);
      setLogos(prev => prev.filter(l => l.id !== id));
      setProjects(prev => prev.filter(p => p.id !== `proj_logo_${id}` && p.id !== id));
      addToast('Logo removed from Firestore.', 'info');
    } catch (err: any) {
      addToast(err.message || 'Unable to delete logo', 'error');
    }
  };

  // AD ACTIONS (Firestore)
  const saveAd = async (adData: Partial<GeneratedAdvertisement>): Promise<GeneratedAdvertisement> => {
    if (!firebaseUser?.uid) {
      throw new Error('Please sign in to save advertisements to your account.');
    }

    try {
      const saved = await saveFirestoreAd(firebaseUser.uid, adData);
      setAdvertisements(prev => [saved, ...prev.filter(a => a.id !== saved.id)]);
      addToast('Advertisement saved to My Projects in Firestore!', 'success');
      return saved;
    } catch (err: any) {
      addToast(err.message || 'Unable to save advertisement', 'error');
      throw err;
    }
  };

  // PROJECT ACTIONS (Firestore)
  const saveProject = async (projData: Partial<ProjectItem>): Promise<ProjectItem> => {
    if (!firebaseUser?.uid) {
      throw new Error('Please sign in to save projects to your account.');
    }

    try {
      const saved = await saveFirestoreProject(firebaseUser.uid, projData);
      setProjects(prev => [saved, ...prev.filter(p => p.id !== saved.id)]);
      addToast('Project saved successfully in Firestore!', 'success');
      return saved;
    } catch (err: any) {
      addToast(err.message || 'Unable to save project', 'error');
      throw err;
    }
  };

  const deleteProject = async (id: string) => {
    if (!firebaseUser?.uid) return;
    try {
      await deleteFirestoreProject(firebaseUser.uid, id);
      setProjects(prev => prev.filter(p => p.id !== id));
      addToast('Project deleted from Firestore.', 'info');
    } catch (err: any) {
      addToast(err.message || 'Unable to delete project', 'error');
    }
  };

  // ----------------------------------------------------
  // REAL PAYSTACK PAYMENT ACTIONS & VERIFICATION
  // ----------------------------------------------------
  const verifyPaystackPayment = async (referenceOrEmail: string): Promise<boolean> => {
    const cleanInput = referenceOrEmail?.trim();
    if (!cleanInput) {
      addToast('Please enter the email used for payment or your transaction reference.', 'error');
      return false;
    }

    if (!firebaseUser?.uid) {
      addToast('Please sign in to your account first so we can attach Pro access to your profile.', 'error');
      return false;
    }

    setIsVerifyingPayment(true);
    try {
      const res = await api.verifyPaystackPayment(cleanInput);
      if (res.success && (res.is_pro || (res as any).isPro)) {
        // Entitlement verified and updated server-side in Firestore
        // Enforces /users/{uid}/isPro = true and /users/{uid}/proActivatedAt = Date.now()
        const nowTs = (res as any).proActivatedAt || Date.now();
        const nowIso = new Date().toISOString();
        setUser(prev => ({
          ...prev,
          is_pro: true,
          isPro: true,
          proActivatedAt: nowTs,
          pro_since: prev.pro_since || nowIso,
          subscription: res.subscription
        }));

        if (firebaseUser?.uid) {
          await updateFirestoreUserProfile(firebaseUser.uid, {
            is_pro: true,
            isPro: true,
            proActivatedAt: nowTs,
            pro_since: nowIso,
            subscription: res.subscription
          }).catch(() => {});
        }
        
        setShowProModal(false);
        // Requirement 3: Show "Your BIZNIX features has successfully active" - then activate pro features.
        addToast('Your BIZNIX features has successfully active', 'success');
        await refreshAllData();
        return true;
      } else {
        addToast(res.message || 'Payment could not be verified by Paystack.', 'error');
        return false;
      }
    } catch (err: any) {
      console.error('Paystack client verification error:', err);
      addToast(err?.message || 'Paystack verification failed. Please check the reference or email.', 'error');
      return false;
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  // Detect Paystack redirect/callback params and biznix:// deep link returns
  useEffect(() => {
    if (!firebaseUser?.uid) return;
    try {
      const searchStr = window.location.search || (window.location.hash.includes('?') ? window.location.hash.substring(window.location.hash.indexOf('?')) : '');
      const searchParams = new URLSearchParams(searchStr);
      const referenceParam = searchParams.get('reference') || searchParams.get('trxref');
      if (referenceParam) {
        // Clean query parameters from URL to avoid re-triggering
        const cleanPath = window.location.pathname;
        window.history.replaceState({}, document.title, cleanPath);
        addToast(`Paystack return detected. Verifying reference ${referenceParam}...`, 'info');
        verifyPaystackPayment(referenceParam);
      }
    } catch (e) {}

    // Capacitor App URL open listener for mobile biznix://pro-success deep links
    try {
      const cap = (window as any).Capacitor;
      if (cap?.Plugins?.App?.addListener) {
        cap.Plugins.App.addListener('appUrlOpen', (data: any) => {
          if (data?.url && data.url.includes('pro-success')) {
            try {
              const urlObj = new URL(data.url);
              const ref = urlObj.searchParams.get('reference') || urlObj.searchParams.get('trxref');
              if (ref) {
                addToast(`Activating Pro from deep link...`, 'info');
                verifyPaystackPayment(ref);
              }
            } catch (e) {}
          }
        });
      }
    } catch (e) {}
  }, [firebaseUser?.uid]);

  // Legacy Google Play adapter - redirects to Paystack flow
  const verifyGooglePlayPurchase = async (productId: string, purchaseToken: string, orderId?: string): Promise<boolean> => {
    addToast('Google Play simulation disabled. Opening Paystack payment page...', 'info');
    openPaystackPaymentPage();
    return false;
  };

  const restorePurchases = async (): Promise<boolean> => {
    try {
      const res = await api.restorePurchases();
      if (res.user && firebaseUser?.uid) {
        await updateFirestoreUserProfile(firebaseUser.uid, { is_pro: res.user.is_pro });
        setUser(prev => ({ ...prev, is_pro: res.user.is_pro }));
      }
      if (res.quota) setUsageQuota(res.quota);
      addToast(res.message || 'Purchases restored successfully!', 'success');
      refreshAllData();
      return true;
    } catch (e: any) {
      addToast(e.message || 'No active subscriptions found to restore.', 'info');
      return false;
    }
  };

  const cancelSubscription = async (): Promise<boolean> => {
    try {
      const res = await api.cancelSubscription();
      if (res.user) setUser(res.user);
      addToast(res.message || 'Subscription auto-renew canceled.', 'info');
      refreshAllData();
      return true;
    } catch (e: any) {
      addToast(e.message || 'Could not cancel subscription.', 'error');
      return false;
    }
  };

  const regenerateDailyProAd = async (): Promise<DailyProAd | null> => {
    try {
      const updatedAd = await api.regenerateDailyProAd();
      setDailyProAd(updatedAd);
      addToast("Generated fresh today's Pro advertisement!", 'success');
      return updatedAd;
    } catch (e: any) {
      addToast(e.message || 'Unable to regenerate daily ad.', 'error');
      return null;
    }
  };

  const dismissDailyGrowth = async () => {
    try {
      await api.dismissDailyGrowth();
      setDailyProGrowth(prev => prev ? { ...prev, status: 'dismissed' } : null);
      addToast('Recommendation dismissed for today.', 'info');
    } catch (e) {
      // ignore
    }
  };

  // REAL FIREBASE AUTHENTICATION FLOWS
  const login = async (email: string, password?: string): Promise<boolean> => {
    if (!password) {
      throw new Error('Please enter your account password.');
    }
    const { profile } = await loginFirebaseUser(email, password);
    setUser(profile);
    setIsAuthenticated(true);
    setActiveTab('home');
    addToast(`Welcome back, ${profile.name}!`, 'success');
    return true;
  };

  const registerAndVerify = async (userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    business_name?: string;
    business_category?: string;
    profile_image?: string;
  }): Promise<boolean> => {
    const { profile } = await registerFirebaseUser({
      name: userData.name,
      email: userData.email,
      password: userData.password,
      phone: userData.phone,
      business_name: userData.business_name,
      business_category: userData.business_category,
      profile_image: userData.profile_image
    });

    setUser(profile);
    setIsAuthenticated(true);
    setActiveTab('home');
    addToast(`Account created! A verification link has been sent to ${userData.email}.`, 'success');
    return true;
  };

  const logout = async () => {
    try {
      await logoutFirebaseUser();
    } catch (e) {
      console.warn('Logout error:', e);
    }
    setIsAuthenticated(false);
    setFirebaseUser(null);
    setUser(defaultUser);
    setLogos([]);
    setAdvertisements([]);
    setProjects([]);
    setActiveTab('home');
    addToast('Signed out of BIZNIX session.', 'info');
  };

  const requestPasswordReset = async (email: string) => {
    await sendPasswordReset(email);
    addToast(`Password reset link sent to ${email}`, 'success');
  };

  const sendEmailVerificationLink = async () => {
    await resendEmailVerification();
    addToast('Verification email resent! Please check your inbox.', 'success');
  };

  const verifyEmailStatus = async (): Promise<boolean> => {
    const isVerified = await checkEmailVerified();
    if (isVerified) {
      addToast('Email successfully verified!', 'success');
    } else {
      addToast('Email not yet verified. Please click the link in your email.', 'info');
    }
    return isVerified;
  };

  const navigateToTool = (tab: MainNavTab, subTab?: string, toolType?: GrowthToolType) => {
    setActiveTab(tab);
    if (tab === 'create' && subTab) {
      setCreateSubTab(subTab as CreateSubTab);
    }
    if (tab === 'advertise' && subTab) {
      setAdvertiseSubTab(subTab as AdvertiseSubTab);
    }
    if (tab === 'profile' && subTab) {
      setProfileSubTab(subTab as ProfileSubTab);
    }
    if (toolType) {
      setActiveGrowthTool(toolType);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const recentProjects = [...projects].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 6);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        firebaseUser,
        isPro,
        setIsPro,
        subscription: user.subscription,
        usageQuota,
        dailyProAd,
        dailyProGrowth,
        activeTab,
        setActiveTab,
        createSubTab,
        setCreateSubTab,
        advertiseSubTab,
        setAdvertiseSubTab,
        profileSubTab,
        setProfileSubTab,
        activeGrowthTool,
        setActiveGrowthTool,
        logos,
        advertisements,
        projects,
        recentProjects,
        isLoadingData,
        refreshAllData,
        saveLogo,
        deleteLogo,
        saveAd,
        saveProject,
        deleteProject,
        verifyPaystackPayment,
        openPaystackPaymentPage,
        isVerifyingPayment,
        verifyGooglePlayPurchase,
        restorePurchases,
        cancelSubscription,
        regenerateDailyProAd,
        dismissDailyGrowth,
        showProModal,
        setShowProModal,
        proModalFeature,
        openProModal,
        theme,
        toggleTheme,
        toasts,
        addToast,
        removeToast,
        isAuthenticated,
        setIsAuthenticated,
        isAuthLoading,
        login,
        registerAndVerify,
        logout,
        requestPasswordReset,
        sendEmailVerificationLink,
        verifyEmailStatus,
        navigateToTool
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
