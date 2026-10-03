import React, { useState, useRef } from 'react';
import { 
  UserPlus, 
  LogIn, 
  Sparkles, 
  Palette, 
  Megaphone, 
  Bot, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Mail, 
  User, 
  Building, 
  Briefcase, 
  Phone, 
  KeyRound, 
  X, 
  Camera, 
  Upload, 
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const BUSINESS_CATEGORIES = [
  'Creative Design & Tech',
  'Marketing & Advertising',
  'E-Commerce & Retail',
  'Consulting & Strategy',
  'Restaurant & Hospitality',
  'Health, Wellness & Beauty',
  'Real Estate & Construction',
  'Automotive & Engineering',
  'Professional Services'
];

export const WelcomeScreen: React.FC = () => {
  const { 
    login, 
    registerAndVerify, 
    requestPasswordReset, 
    sendEmailVerificationLink,
    verifyEmailStatus,
    addToast 
  } = useApp();

  // Active Auth Modal / Flow State
  const [activeModal, setActiveModal] = useState<'create_account' | 'login' | 'reset_password' | null>(null);
  
  // Registration Form State
  const [regStep, setRegStep] = useState<'form' | 'verification_notice'>('form');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regCategory, setRegCategory] = useState(BUSINESS_CATEGORIES[0]);
  const [regAvatar, setRegAvatar] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Verification State
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Reset Password State
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Gallery File Input Ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle Photo Gallery Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Please select a valid image file.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast('Photo exceeds 5MB. Please choose a smaller image.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setRegAvatar(result);
        addToast('Profile avatar uploaded!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Open Create Account Flow
  const handleOpenCreateAccount = () => {
    setRegStep('form');
    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setRegPhone('');
    setRegBusinessName('');
    setRegCategory(BUSINESS_CATEGORIES[0]);
    setRegAvatar('');
    setActiveModal('create_account');
  };

  // Open Login Flow
  const handleOpenLogin = () => {
    setLoginEmail('');
    setLoginPassword('');
    setActiveModal('login');
  };

  // Step 1: Submit Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      addToast('Please enter your full name.', 'error');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      addToast('Please enter a valid email address.', 'error');
      return;
    }
    if (!regPassword.trim() || regPassword.length < 6) {
      addToast('Password must be at least 6 characters.', 'error');
      return;
    }

    setIsRegistering(true);
    try {
      await registerAndVerify({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        phone: regPhone.trim() || '+1 (555) 234-5678',
        business_name: regBusinessName.trim() || `${regName.trim()}'s Business`,
        business_category: regCategory,
        profile_image: regAvatar
      });
      // Registration succeeded
      setRegStep('verification_notice');
    } catch (err: any) {
      let msg = err.message || 'Registration failed. Please check your credentials.';
      if (msg.includes('auth/operation-not-allowed')) {
        msg = 'Account registration is currently being maintained. Please contact Jaz Media Parustarta support.';
      } else if (msg.includes('auth/email-already-in-use')) {
        msg = 'This email address is already registered. Please sign in instead.';
      } else if (msg.includes('auth/invalid-email')) {
        msg = 'The email address format is invalid.';
      } else if (msg.includes('auth/weak-password')) {
        msg = 'Password is too weak. Please use at least 6 characters.';
      } else if (msg.includes('auth/api-key-not-valid')) {
        msg = 'Authentication configuration is being refreshed. Please try again.';
      }
      addToast(msg, 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  // Check email verification status and enter dashboard
  const handleCheckEmailVerified = async () => {
    setIsCheckingVerification(true);
    try {
      const verified = await verifyEmailStatus();
      if (verified) {
        setActiveModal(null);
      }
    } catch (err: any) {
      addToast(err.message || 'Error checking verification status', 'error');
    } finally {
      setIsCheckingVerification(false);
    }
  };

  // Handle BIZNIX Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginEmail.includes('@')) {
      addToast('Please enter your valid BIZNIX account email.', 'error');
      return;
    }
    if (!loginPassword.trim()) {
      addToast('Please enter your password.', 'error');
      return;
    }

    setIsLoggingIn(true);
    try {
      await login(loginEmail.trim(), loginPassword);
      setActiveModal(null);
    } catch (err: any) {
      let msg = err.message || 'Login failed. Please verify credentials.';
      if (msg.includes('auth/operation-not-allowed')) {
        msg = 'Authentication services are temporarily undergoing maintenance. Please contact BIZNIX support at Jaz Media Parustarta.';
      } else if (msg.includes('auth/invalid-credential') || msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password')) {
        msg = 'Invalid email or password. Please check your credentials.';
      } else if (msg.includes('auth/too-many-requests')) {
        msg = 'Access temporarily disabled due to many failed attempts. Try again later or reset password.';
      }
      addToast(msg, 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Password Reset Submit
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      addToast('Please enter your registered email address.', 'error');
      return;
    }

    setIsResetting(true);
    try {
      await requestPasswordReset(resetEmail.trim());
      setResetSent(true);
      setTimeout(() => {
        setActiveModal('login');
        setResetSent(false);
      }, 3000);
    } catch (err: any) {
      let msg = err.message || 'Could not send password reset email.';
      if (msg.includes('auth/user-not-found')) {
        msg = 'No BIZNIX user found with this email address.';
      }
      addToast(msg, 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060D19] text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950 relative overflow-hidden">
      {/* Ambient Luxury Glow Effects */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-gradient-to-b from-amber-500/15 via-sky-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[450px] h-[450px] bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-[40%] right-[-10%] w-[400px] h-[400px] bg-sky-500/10 blur-3xl pointer-events-none rounded-full" />

      {/* Main Container */}
      <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 flex-1 flex flex-col justify-center items-center relative z-10">
        
        {/* 1. OFFICIAL BIZNIX LOGO & BRANDING */}
        <div className="flex flex-col items-center text-center mb-8 sm:mb-10">
          
          {/* Prominent BIZNIX Logo Emblem */}
          <div className="relative group mb-5">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-600 rounded-3xl blur-md opacity-70 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#081220] p-2 border-2 border-amber-400/80 shadow-[0_0_35px_rgba(217,119,6,0.35)] flex items-center justify-center overflow-hidden">
              <img 
                src="/biznix_logo.png" 
                alt="BIZNIX Official Logo" 
                className="w-full h-full object-cover rounded-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* BIZNIX Name */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight text-white mb-1.5 flex items-center gap-2">
            BIZNIX
            <span className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_12px_#F59E0B] inline-block animate-pulse"></span>
          </h1>

          {/* YOUR AI BUSINESS PARTNER */}
          <p className="text-xs sm:text-sm font-black tracking-[0.28em] text-sky-300 uppercase">
            YOUR AI BUSINESS PARTNER
          </p>
        </div>

        {/* 2. WELCOME MESSAGE */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-extrabold uppercase tracking-wider mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Next-Generation Enterprise AI</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3">
            Build. Brand. Grow.
          </h2>

          <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed max-w-xl mx-auto">
            Your AI-powered business partner for creating your brand, advertising your business, and growing your ideas.
          </p>
        </div>

        {/* 3. TWO MAIN ACCOUNT BUTTONS */}
        <div className="w-full max-w-md mx-auto space-y-4 mb-12">
          
          {/* Primary Button: Create Account */}
          <button
            onClick={handleOpenCreateAccount}
            id="welcome-btn-create-account"
            className="w-full text-left p-5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-bold shadow-[0_10px_30px_rgba(217,119,6,0.3)] hover:shadow-[0_12px_35px_rgba(217,119,6,0.45)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group border border-amber-300/40 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-slate-950/15 flex items-center justify-center text-slate-950 font-black border border-slate-950/10">
                  <UserPlus className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-slate-950 flex items-center gap-1.5">
                    Create Account
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-slate-950/20 text-slate-900">
                      BIZNIX
                    </span>
                  </h3>
                  <p className="text-xs font-bold text-slate-900/80 mt-0.5">
                    New to BIZNIX? Create your account
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-950 group-hover:translate-x-1 transition-transform stroke-[2.5]" />
            </div>
          </button>

          {/* Secondary Button: Login */}
          <button
            onClick={handleOpenLogin}
            id="welcome-btn-login"
            className="w-full text-left p-5 rounded-2xl bg-[#0F223D]/90 hover:bg-[#152D50] border border-amber-400/30 hover:border-amber-400/60 text-white shadow-lg hover:shadow-amber-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group relative"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <LogIn className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-white group-hover:text-amber-300 transition-colors">
                    Login
                  </h3>
                  <p className="text-xs font-medium text-sky-200/80 mt-0.5">
                    Already have a BIZNIX account? Login here
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-sky-300 group-hover:text-amber-400 group-hover:translate-x-1 transition-all stroke-[2.2]" />
            </div>
          </button>

        </div>

        {/* 4. CORE SUITE PREVIEWS (Informational & Brand Context) */}
        <div className="w-full max-w-3xl mx-auto pt-6 border-t border-slate-800/80">
          <div className="text-center mb-6">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-sky-400/80">
              Integrated AI Business Suite
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            
            {/* Logo Creator */}
            <div className="p-3.5 rounded-2xl bg-[#091526]/80 border border-sky-500/15 flex flex-col items-center text-center">
              <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 mb-2">
                <Palette className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-100">AI Logo Creator</h4>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">Vector branding & kits</p>
            </div>

            {/* Advertise */}
            <div className="p-3.5 rounded-2xl bg-[#091526]/80 border border-sky-500/15 flex flex-col items-center text-center">
              <div className="w-9 h-9 rounded-xl bg-sky-400/10 border border-sky-400/30 flex items-center justify-center text-sky-400 mb-2">
                <Megaphone className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-100">Ad Studio</h4>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">High-converting flyers</p>
            </div>

            {/* AI Assistant */}
            <div className="p-3.5 rounded-2xl bg-[#091526]/80 border border-sky-500/15 flex flex-col items-center text-center">
              <div className="w-9 h-9 rounded-xl bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 mb-2">
                <Bot className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-100">AI Assistant</h4>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">24/7 strategic advisor</p>
            </div>

            {/* Business Growth */}
            <div className="p-3.5 rounded-2xl bg-[#091526]/80 border border-sky-500/15 flex flex-col items-center text-center">
              <div className="w-9 h-9 rounded-xl bg-purple-400/10 border border-purple-400/30 flex items-center justify-center text-purple-400 mb-2">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-100">Growth Tools</h4>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">Roadmaps & strategies</p>
            </div>

          </div>
        </div>

      </div>

      {/* Footer Branding */}
      <footer className="text-center py-6 text-[11px] font-semibold text-slate-500 border-t border-slate-900 relative z-10 space-y-1">
        <p>© {new Date().getFullYear()} BIZNIX AI. Developed & Powered by Jaz Media Parustarta. All rights reserved.</p>
        <p className="text-[10px] text-slate-600">Enterprise Cloud Architecture • High-Security Encrypted Systems</p>
      </footer>

      {/* ========================================================================= */}
      {/* MODAL: CREATE ACCOUNT (BIZNIX AUTHENTICATION)                             */}
      {/* ========================================================================= */}
      {activeModal === 'create_account' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg bg-[#0A1628] border border-amber-400/40 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden my-8">
            
            {/* Header */}
            <div className="p-6 bg-gradient-to-b from-[#10233D] to-[#0A1628] border-b border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  {regStep === 'form' ? <UserPlus className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {regStep === 'form' ? 'Create Your BIZNIX Account' : 'Verify Your Email'}
                  </h3>
                  <p className="text-xs text-sky-300/80">
                    {regStep === 'form' ? 'BIZNIX Cloud Intelligence • Jaz Media Parustarta' : 'Official BIZNIX Email Verification'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveModal(null)}
                id="close-create-modal-btn"
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* STEP 1: Registration Form */}
            {regStep === 'form' && (
              <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-sky-300 uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Jenkins"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      id="reg-input-name"
                      className="w-full bg-[#070F1C] border border-sky-500/20 focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-sky-300 uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
                    <input
                      type="email"
                      required
                      placeholder="you@company.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      id="reg-input-email"
                      className="w-full bg-[#070F1C] border border-sky-500/20 focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-sky-300 uppercase tracking-wider mb-1.5">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      id="reg-input-password"
                      className="w-full bg-[#070F1C] border border-sky-500/20 focus:border-amber-400 rounded-xl pl-10 pr-11 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Business Name (Optional) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-sky-300 uppercase tracking-wider mb-1.5">
                      Business Name
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
                      <input
                        type="text"
                        placeholder="Apex Brands"
                        value={regBusinessName}
                        onChange={(e) => setRegBusinessName(e.target.value)}
                        id="reg-input-business"
                        className="w-full bg-[#070F1C] border border-sky-500/20 focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold text-sky-300 uppercase tracking-wider mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        id="reg-input-phone"
                        className="w-full bg-[#070F1C] border border-sky-500/20 focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Business Category */}
                <div>
                  <label className="block text-xs font-bold text-sky-300 uppercase tracking-wider mb-1.5">
                    Industry / Category
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
                    <select
                      value={regCategory}
                      onChange={(e) => setRegCategory(e.target.value)}
                      id="reg-input-category"
                      className="w-full bg-[#070F1C] border border-sky-500/20 focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none transition-colors appearance-none cursor-pointer"
                    >
                      {BUSINESS_CATEGORIES.map(cat => (
                        <option key={cat} value={cat} className="bg-[#0A1628] text-white">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Profile Picture Upload */}
                <div>
                  <label className="block text-xs font-bold text-sky-300 uppercase tracking-wider mb-2">
                    Profile Picture (Optional)
                  </label>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full border-2 border-amber-400/60 overflow-hidden shrink-0 shadow-md bg-[#0F223D] flex items-center justify-center text-amber-400 font-extrabold text-lg">
                      {regAvatar ? (
                        <img 
                          src={regAvatar} 
                          alt="Selected Avatar" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span>{regName ? regName.charAt(0).toUpperCase() : 'U'}</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-[#0F223D] hover:bg-[#152B4D] border border-sky-500/30 text-sky-200 hover:text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-amber-400" />
                      <span>{regAvatar ? 'Change Photo' : 'Upload From Device'}</span>
                    </button>
                    <input 
                      ref={fileInputRef} 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handlePhotoUpload} 
                    />
                  </div>
                </div>

                {/* Action Submit */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isRegistering}
                    id="reg-btn-continue"
                    className="w-full gold-gradient-btn py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    {isRegistering ? (
                      <span>Creating BIZNIX Account...</span>
                    ) : (
                      <>
                        <span>Create Account & Verify</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Switch to Login */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal('login')}
                    className="text-xs font-semibold text-sky-300 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    Already have a BIZNIX account? <span className="underline font-bold text-amber-400">Login here</span>
                  </button>
                </div>

              </form>
            )}

            {/* STEP 2: Secure Verification Screen */}
            {regStep === 'verification_notice' && (
              <div className="p-6 space-y-6">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 mx-auto mb-2 shadow-inner">
                    <Mail className="w-8 h-8 stroke-[2.2]" />
                  </div>
                  <h4 className="text-lg font-bold text-white">Verification Link Sent</h4>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                    A secure BIZNIX verification link has been dispatched to your email:
                  </p>
                  <p className="text-sm font-bold text-amber-300 bg-[#070F1C] py-1.5 px-3.5 rounded-lg border border-amber-400/30 inline-block font-mono">
                    {regEmail}
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Please check your inbox (and spam folder) and click the verification link to verify your BIZNIX business profile.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  {/* Enter Dashboard Directly or After Verification */}
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    id="reg-btn-enter-dashboard"
                    className="w-full gold-gradient-btn py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Enter BIZNIX Dashboard</span>
                  </button>

                  {/* Check Status */}
                  <button
                    type="button"
                    disabled={isCheckingVerification}
                    onClick={handleCheckEmailVerified}
                    className="w-full py-2.5 rounded-xl bg-[#0F223D] border border-sky-500/20 hover:border-amber-400/50 text-xs font-bold text-sky-200 hover:text-amber-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingVerification ? 'animate-spin' : ''}`} />
                    <span>Check Verification Status</span>
                  </button>

                  {/* Resend Link */}
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => sendEmailVerificationLink()}
                      className="text-xs text-amber-400 hover:underline font-semibold cursor-pointer"
                    >
                      Didn't receive email? Resend verification link
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LOGIN (BIZNIX AUTHENTICATION)                                      */}
      {/* ========================================================================= */}
      {activeModal === 'login' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-md bg-[#0A1628] border border-amber-400/40 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden my-8">
            
            {/* Header */}
            <div className="p-6 bg-gradient-to-b from-[#10233D] to-[#0A1628] border-b border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <LogIn className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Login to BIZNIX</h3>
                  <p className="text-xs text-sky-300/80">BIZNIX Secure Access • Jaz Media Parustarta</p>
                </div>
              </div>

              <button
                onClick={() => setActiveModal(null)}
                id="close-login-modal-btn"
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
              
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-sky-300 uppercase tracking-wider mb-1.5">
                  Account Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    id="login-input-email"
                    className="w-full bg-[#070F1C] border border-sky-500/20 focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(loginEmail);
                      setActiveModal('reset_password');
                    }}
                    className="text-xs font-medium text-amber-400 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    id="login-input-password"
                    className="w-full bg-[#070F1C] border border-sky-500/20 focus:border-amber-400 rounded-xl pl-10 pr-11 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  id="login-btn-submit"
                  className="w-full gold-gradient-btn py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  {isLoggingIn ? (
                    <span>Authenticating with BIZNIX...</span>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In to BIZNIX</span>
                    </>
                  )}
                </button>
              </div>

              {/* Switch to Create Account */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleOpenCreateAccount}
                  className="text-xs font-semibold text-sky-300 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  New to BIZNIX? <span className="underline font-bold text-amber-400">Create your account</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RESET PASSWORD (BIZNIX PASSWORD RECOVERY)                          */}
      {/* ========================================================================= */}
      {activeModal === 'reset_password' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-md bg-[#0A1628] border border-amber-400/40 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden my-8">
            
            {/* Header */}
            <div className="p-6 bg-gradient-to-b from-[#10233D] to-[#0A1628] border-b border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Reset Password</h3>
                  <p className="text-xs text-sky-300/80">BIZNIX Account Recovery • Jaz Media Parustarta</p>
                </div>
              </div>

              <button
                onClick={() => setActiveModal('login')}
                id="close-reset-modal-btn"
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Reset Form */}
            <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Enter your registered email address and BIZNIX will send you a secure link to reset your account password.
              </p>

              <div>
                <label className="block text-xs font-bold text-sky-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    id="reset-input-email"
                    className="w-full bg-[#070F1C] border border-sky-500/20 focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={isResetting}
                  id="reset-btn-submit"
                  className="w-full gold-gradient-btn py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  {isResetting ? (
                    <span>Sending Recovery Link...</span>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Send Recovery Instructions</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModal('login')}
                  className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  ← Back to Login
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
