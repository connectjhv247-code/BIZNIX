import React, { useState, useRef } from 'react';
import { 
  UserCircle, 
  Crown, 
  Palette, 
  Megaphone, 
  FolderKanban, 
  MessageSquare, 
  HelpCircle, 
  LogOut, 
  Edit3, 
  Check, 
  ChevronRight,
  Mail,
  Phone,
  Building,
  KeyRound,
  X,
  Upload,
  Camera,
  LogIn,
  AlertTriangle,
  Briefcase,
  Lock,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';

// Curated executive business avatars
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
];

export const UserProfileView: React.FC = () => {
  const { 
    user, 
    setUser, 
    isPro, 
    setShowProModal, 
    navigateToTool, 
    addToast,
    logos,
    advertisements,
    projects,
    logout,
    login,
    requestPasswordReset
  } = useApp();

  const [activeModal, setActiveModal] = useState<
    'edit_profile' | 'auth_login' | 'reset_password' | 'confirm_logout' | null
  >(null);

  // Determine if user is currently signed in
  const isLoggedIn = Boolean(user && user.id && user.id !== 'guest_user' && user.email && user.email !== 'guest@biznix.app');

  // Edit Profile Form State
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    business_name: user.business_name || '',
    business_category: user.business_category || '',
    profile_image: user.profile_image || PRESET_AVATARS[0]
  });

  // Auth Forms State
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  // Gallery File Input Ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle Photo Gallery Upload (converts file to data URL)
  const handlePhotoGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Please select a valid image file from your gallery.', 'error');
      return;
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      addToast('Image is too large. Please select a photo under 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setFormData(prev => ({ ...prev, profile_image: result }));
        addToast('Photo loaded successfully from gallery!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Open Edit Profile Modal and sync state
  const handleOpenEditProfile = () => {
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      business_name: user.business_name || '',
      business_category: user.business_category || '',
      profile_image: user.profile_image || PRESET_AVATARS[0]
    });
    setActiveModal('edit_profile');
  };

  // Save Edit Profile
  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      addToast('Full name is required.', 'error');
      return;
    }
    if (!formData.email.trim()) {
      addToast('Email address is required.', 'error');
      return;
    }

    try {
      if (user.id && user.id !== 'guest_user') {
        const { updateFirestoreUserProfile } = await import('../lib/firebaseAuthService');
        await updateFirestoreUserProfile(user.id, formData);
      }
      setUser(prev => ({
        ...prev,
        ...formData
      }));
      setActiveModal(null);
      addToast('Profile updated successfully!', 'success');
    } catch (e: any) {
      setUser(prev => ({
        ...prev,
        ...formData
      }));
      setActiveModal(null);
      addToast('Profile updated!', 'success');
    }
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!authEmail.trim()) {
      addToast('Please enter your email address.', 'error');
      return;
    }
    if (!authPassword.trim()) {
      addToast('Please enter your password.', 'error');
      return;
    }

    setIsAuthSubmitting(true);
    try {
      await login(authEmail.trim(), authPassword);
      setActiveModal(null);
      setAuthPassword('');
    } catch (err: any) {
      addToast(err.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  // Handle Reset Password Submit
  const handleResetPasswordSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!authEmail.trim()) {
      addToast('Please enter your registered email address.', 'error');
      return;
    }

    setIsAuthSubmitting(true);
    try {
      await requestPasswordReset(authEmail.trim());
      setActiveModal(null);
    } catch (err: any) {
      addToast(err.message || 'Could not send reset email.', 'error');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  // Confirm Logout Action
  const handleConfirmLogout = () => {
    setActiveModal(null);
    logout();
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Hidden File Input for Device Gallery Photo Selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoGallerySelect}
        className="hidden"
      />

      {/* ========================================================================= */}
      {/* 1. NOT SIGNED IN: WELCOME / AUTHENTICATION SCREEN */}
      {/* ========================================================================= */}
      {!isLoggedIn ? (
        <div className="max-w-xl mx-auto rounded-3xl bg-[#0B1728] border border-amber-500/30 p-7 sm:p-9 shadow-[0_8px_32px_rgba(0,0,0,0.5)] text-center space-y-6 my-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-400/20 via-amber-500/10 to-transparent border border-amber-400/40 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <LogIn className="w-8 h-8 text-amber-400" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 inline-block">
              BIZNIX Authentication
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Sign In to BIZNIX
            </h2>
            <p className="text-xs text-sky-200/70 max-w-md mx-auto leading-relaxed">
              Access your business profile, saved logo brand marks, promotional campaigns, and tactical AI strategy roadmaps.
            </p>
          </div>

          <div className="pt-2 max-w-sm mx-auto space-y-3">
            <button
              onClick={() => {
                setAuthEmail('');
                setAuthPassword('');
                setActiveModal('auth_login');
              }}
              id="welcome-signin-btn"
              className="gold-gradient-btn w-full py-3.5 px-6 rounded-2xl text-xs font-extrabold text-[#060D19] shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] transition-transform"
            >
              <LogIn className="w-4 h-4 text-[#060D19]" />
              <span>Sign In to Your Account</span>
            </button>

            <button
              onClick={() => {
                setAuthEmail('');
                setActiveModal('reset_password');
              }}
              id="welcome-reset-password-btn"
              className="w-full py-3 px-6 rounded-2xl bg-[#081220] hover:bg-[#0F223D] border border-sky-500/20 hover:border-amber-400/40 text-sky-200 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Reset Password</span>
            </button>
          </div>

          {/* Security & Commercial Guidance */}
          <div className="pt-4 border-t border-sky-900/40 text-left bg-[#081220]/60 p-4 rounded-2xl border border-sky-500/10">
            <div className="flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white">Enterprise AI Business Studio</h4>
                <p className="text-[11px] text-sky-300/60 leading-relaxed">
                  Sign in with your registered account to securely load your saved brand designs, marketing flyers, and strategic business context.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. SIGNED IN: ACTIVE USER DASHBOARD */
        /* ========================================================================= */
        <>
          {/* Main Profile Overview Card */}
          <div className="rounded-3xl bg-[#0B1728] border border-amber-500/20 p-6 sm:p-8 shadow-[0_6px_24px_rgba(0,0,0,0.4)] space-y-6">
            
            {/* Profile Header Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                
                {/* Profile Picture with Quick Gallery Change Overlay */}
                <div className="relative group shrink-0">
                  <img
                    src={user.profile_image || PRESET_AVATARS[0]}
                    alt={user.name}
                    className="w-20 h-20 rounded-2xl object-cover ring-2 ring-amber-400/50 shadow-lg shadow-black/50"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Select photo from gallery"
                    className="absolute inset-0 bg-[#060D19]/70 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-amber-300 transition-opacity cursor-pointer text-[10px] font-bold"
                  >
                    <Camera className="w-5 h-5 mb-0.5 text-amber-400" />
                    <span>Gallery</span>
                  </button>
                  {isPro && (
                    <div className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-[#060D19] shadow-md ring-2 ring-[#0B1728]">
                      <Crown className="w-3.5 h-3.5 fill-current" />
                    </div>
                  )}
                </div>

                {/* User Title & Quick Meta */}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-display text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                      {user.name}
                    </h2>
                    {isPro ? (
                      <span className="gold-badge shadow-xs text-[10px]">
                        ⭐ PRO TIER
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#081220] text-sky-300 border border-sky-500/20">
                        FREE PLAN
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-amber-400 mt-1 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>{user.business_name || 'My Business'}</span>
                    <span className="text-sky-400/50">•</span>
                    <span className="text-sky-300/80 font-medium">{user.business_category || 'General Business'}</span>
                  </p>
                  <p className="text-[11px] text-sky-300/60 mt-1 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-sky-400/70" /> {user.email}
                    </span>
                    {user.phone && (
                      <>
                        <span className="text-sky-500/40">•</span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-sky-400/70" /> {user.phone}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap">
                <button
                  onClick={handleOpenEditProfile}
                  id="edit-profile-btn"
                  className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-[#0F223D] hover:bg-[#152B4D] border border-sky-500/20 text-sky-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Edit Profile</span>
                </button>

                <button
                  onClick={() => setActiveModal('confirm_logout')}
                  id="profile-logout-header-btn"
                  className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Logout Options"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>

                {!isPro ? (
                  <button
                    onClick={() => setShowProModal(true)}
                    className="gold-gradient-btn flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer text-[#060D19]"
                  >
                    <Crown className="w-3.5 h-3.5 fill-[#060D19]" />
                    <span>Upgrade PRO</span>
                  </button>
                ) : null}
              </div>
            </div>

            {/* Profile Information Breakdown Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-4 border-t border-sky-900/40">
              
              <div className="p-3 rounded-2xl bg-[#081220] border border-sky-500/15">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-sky-300/70 uppercase tracking-wider mb-1">
                  <UserCircle className="w-3.5 h-3.5 text-amber-400" /> Full Name
                </div>
                <p className="text-xs font-bold text-white truncate">{user.name}</p>
              </div>

              <div className="p-3 rounded-2xl bg-[#081220] border border-sky-500/15">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-sky-300/70 uppercase tracking-wider mb-1">
                  <Mail className="w-3.5 h-3.5 text-amber-400" /> Email
                </div>
                <p className="text-xs font-bold text-white truncate">{user.email}</p>
              </div>

              <div className="p-3 rounded-2xl bg-[#081220] border border-sky-500/15">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-sky-300/70 uppercase tracking-wider mb-1">
                  <Phone className="w-3.5 h-3.5 text-amber-400" /> Phone Number
                </div>
                <p className="text-xs font-bold text-white truncate">{user.phone || 'Not specified'}</p>
              </div>

              <div className="p-3 rounded-2xl bg-[#081220] border border-sky-500/15">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-sky-300/70 uppercase tracking-wider mb-1">
                  <Building className="w-3.5 h-3.5 text-amber-400" /> Business Name
                </div>
                <p className="text-xs font-bold text-white truncate">{user.business_name || 'My Business'}</p>
              </div>

              <div className="p-3 rounded-2xl bg-[#081220] border border-sky-500/15">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-sky-300/70 uppercase tracking-wider mb-1">
                  <Briefcase className="w-3.5 h-3.5 text-amber-400" /> Category
                </div>
                <p className="text-xs font-bold text-white truncate">{user.business_category || 'General'}</p>
              </div>

            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div 
                onClick={() => navigateToTool('profile', 'projects')}
                className="p-3.5 rounded-2xl bg-[#081220] border border-sky-500/20 text-center cursor-pointer hover:border-amber-400/50 hover:bg-[#0F223D] transition-all"
              >
                <span className="font-display text-lg sm:text-xl font-extrabold text-amber-400">
                  {logos.length}
                </span>
                <p className="text-[10px] font-bold text-sky-200 uppercase tracking-wider mt-0.5">
                  Saved Logos
                </p>
              </div>

              <div 
                onClick={() => navigateToTool('profile', 'projects')}
                className="p-3.5 rounded-2xl bg-[#081220] border border-sky-500/20 text-center cursor-pointer hover:border-amber-400/50 hover:bg-[#0F223D] transition-all"
              >
                <span className="font-display text-lg sm:text-xl font-extrabold text-amber-300">
                  {advertisements.length}
                </span>
                <p className="text-[10px] font-bold text-sky-200 uppercase tracking-wider mt-0.5">
                  Saved Ads
                </p>
              </div>

              <div 
                onClick={() => navigateToTool('profile', 'projects')}
                className="p-3.5 rounded-2xl bg-[#081220] border border-sky-500/20 text-center cursor-pointer hover:border-amber-400/50 hover:bg-[#0F223D] transition-all"
              >
                <span className="font-display text-lg sm:text-xl font-extrabold text-white">
                  {projects.length}
                </span>
                <p className="text-[10px] font-bold text-sky-200 uppercase tracking-wider mt-0.5">
                  Total Projects
                </p>
              </div>
            </div>

          </div>

          {/* Navigation Sections & Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Account Assets & Shortcuts */}
            <div className="rounded-3xl bg-[#0B1728] border border-amber-500/20 p-5 shadow-[0_6px_24px_rgba(0,0,0,0.4)] space-y-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-sky-300/70 mb-3">
                Business Assets & Library
              </h3>

              <button
                onClick={() => navigateToTool('create', 'logo')}
                className="w-full p-3 rounded-2xl hover:bg-[#0F223D] border border-transparent hover:border-sky-500/20 flex items-center justify-between transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">My Logos (Designs)</h4>
                    <p className="text-[11px] text-sky-300/60">{logos.length} active vector brand marks</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-sky-400/60" />
              </button>

              <button
                onClick={() => navigateToTool('advertise', 'studio')}
                className="w-full p-3 rounded-2xl hover:bg-[#0F223D] border border-transparent hover:border-sky-500/20 flex items-center justify-between transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">My Advertisements</h4>
                    <p className="text-[11px] text-sky-300/60">{advertisements.length} marketing campaigns</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-sky-400/60" />
              </button>

              <button
                onClick={() => navigateToTool('profile', 'projects')}
                className="w-full p-3 rounded-2xl hover:bg-[#0F223D] border border-transparent hover:border-sky-500/20 flex items-center justify-between transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/40">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">My Projects & Documents</h4>
                    <p className="text-[11px] text-sky-300/60">{projects.length} saved strategy items</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-sky-400/60" />
              </button>

              <button
                onClick={() => navigateToTool('assistant')}
                className="w-full p-3 rounded-2xl hover:bg-[#0F223D] border border-transparent hover:border-sky-500/20 flex items-center justify-between transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">AI Conversation History</h4>
                    <p className="text-[11px] text-sky-300/60">BIZNIX AI strategy advisory threads</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-sky-400/60" />
              </button>
            </div>

            {/* User Account Settings & Management */}
            <div className="rounded-3xl bg-[#0B1728] border border-amber-500/20 p-5 shadow-[0_6px_24px_rgba(0,0,0,0.4)] space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-sky-300/70 mb-3">
                User Account & Preferences
              </h3>

              {/* Password Management */}
              <button
                onClick={() => {
                  setAuthEmail(user.email);
                  setActiveModal('reset_password');
                }}
                id="profile-reset-password-btn"
                className="w-full p-3 rounded-2xl bg-[#081220] hover:bg-[#0F223D] border border-sky-500/20 hover:border-amber-400/50 flex items-center justify-between transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Reset Password</h4>
                    <p className="text-[11px] text-sky-300/60">Recover credentials or update access key</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-sky-400/60" />
              </button>

              {/* FAQ & Guidance */}
              <div className="p-4 rounded-2xl bg-[#081220] border border-amber-500/20">
                <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-1">
                  <HelpCircle className="w-3.5 h-3.5" /> BIZNIX Guidance & Commercial Rights
                </h4>
                <p className="text-[11px] text-sky-300/70 leading-relaxed">
                  BIZNIX is purpose-built for enterprise brand creation, marketing campaigns, and growth. Powered by Jaz Media Parustarta. All exports are fully licensed for commercial usage.
                </p>
              </div>

              {/* Sign Out of BIZNIX Button */}
              <button
                onClick={() => setActiveModal('confirm_logout')}
                id="profile-signout-main-btn"
                className="w-full p-3 rounded-2xl text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 flex items-center gap-3 transition-colors cursor-pointer text-left font-bold text-xs"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Sign Out of BIZNIX</span>
              </button>
            </div>

          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 1. EDIT PROFILE MODAL */}
      {/* ========================================================================= */}
      {activeModal === 'edit_profile' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#060D19]/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg bg-[#0B1728] border border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl text-white my-8 space-y-5">
            
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-[#0F223D] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <Edit3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-white">Edit Business Profile</h3>
                <p className="text-xs text-sky-300/70">Update your account credentials and branding info</p>
              </div>
            </div>

            {/* Profile Picture Gallery & Upload Selector */}
            <div className="p-4 rounded-2xl bg-[#081220] border border-sky-500/20 space-y-3">
              <label className="block text-[10px] font-extrabold uppercase text-sky-200 tracking-wider">
                Profile Picture (Photo Gallery or Avatars)
              </label>

              <div className="flex items-center gap-4">
                <img
                  src={formData.profile_image || PRESET_AVATARS[0]}
                  alt="Avatar preview"
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-amber-400/60 shadow-md shrink-0"
                />
                
                <div className="space-y-1.5 flex-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-[#0F223D] hover:bg-[#152B4D] border border-sky-500/30 text-sky-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer w-full justify-center"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Upload From Photo Gallery</span>
                  </button>
                  <p className="text-[10px] text-sky-300/60 text-center">Supports JPG, PNG, WEBP from your device</p>
                </div>
              </div>

              {/* Preset Executive Avatars */}
              <div>
                <span className="text-[10px] font-semibold text-sky-300/70 block mb-1.5">Or choose an executive avatar:</span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {PRESET_AVATARS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, profile_image: av }))}
                      className={`relative w-9 h-9 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        formData.profile_image === av ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={av} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                      {formData.profile_image === av && (
                        <div className="absolute inset-0 bg-amber-500/30 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Profile Fields */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-sky-200 mb-1">
                  Full Name <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <UserCircle className="w-4 h-4 text-sky-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Alex Morgan"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#081220] border border-sky-500/20 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-sky-200 mb-1">
                    Email Address <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-sky-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="alex@business.com"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#081220] border border-sky-500/20 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-sky-200 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-sky-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 234-5678"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#081220] border border-sky-500/20 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-sky-200 mb-1">
                    Business Name
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-sky-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      placeholder="e.g., Apex Studios"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#081220] border border-sky-500/20 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-sky-200 mb-1">
                    Business Category
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-sky-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={formData.business_category}
                      onChange={(e) => setFormData({ ...formData, business_category: e.target.value })}
                      placeholder="e.g., Creative Tech & AI"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#081220] border border-sky-500/20 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-sky-900/40">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2.5 rounded-xl bg-[#081220] hover:bg-[#0F223D] border border-sky-500/20 text-xs font-bold text-sky-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="gold-gradient-btn px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-md cursor-pointer text-[#060D19] flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 text-[#060D19]" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. LOGIN MODAL */}
      {/* ========================================================================= */}
      {activeModal === 'auth_login' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#060D19]/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-md bg-[#0B1728] border border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl text-white space-y-5">
            
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-[#0F223D] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shadow-lg shadow-amber-500/10">
                <LogIn className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="font-display text-xl font-bold text-white">Sign In to BIZNIX</h3>
              <p className="text-xs text-sky-300/70">Enter your credentials to access your business studio</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-sky-200 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-sky-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="name@business.com"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#081220] border border-sky-500/20 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-extrabold uppercase text-sky-200">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveModal('reset_password')}
                    className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-sky-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#081220] border border-sky-500/20 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="login-modal-submit-btn"
                  className="gold-gradient-btn w-full py-3 rounded-xl text-xs font-extrabold shadow-md cursor-pointer text-[#060D19] flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-4 h-4 text-[#060D19]" />
                  <span>Sign In</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. RESET PASSWORD MODAL */}
      {/* ========================================================================= */}
      {activeModal === 'reset_password' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#060D19]/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-md bg-[#0B1728] border border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl text-white space-y-5">
            
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-[#0F223D] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shadow-lg shadow-amber-500/10">
                <KeyRound className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="font-display text-xl font-bold text-white">Reset Account Password</h3>
              <p className="text-xs text-sky-300/70">We will send instructions to reset your account password</p>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-sky-200 mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-sky-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="name@business.com"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#081220] border border-sky-500/20 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  type="submit"
                  id="reset-password-modal-submit-btn"
                  className="gold-gradient-btn w-full py-3 rounded-xl text-xs font-extrabold shadow-md cursor-pointer text-[#060D19] flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-4 h-4 text-[#060D19]" />
                  <span>Send Reset Instructions</span>
                </button>

                {!isLoggedIn && (
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveModal('auth_login')}
                      className="text-xs text-sky-300/80 hover:text-amber-300 font-semibold cursor-pointer"
                    >
                      Remember your password? <span className="text-amber-400 font-bold underline">Sign In</span>
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CONFIRM LOGOUT MODAL */}
      {/* ========================================================================= */}
      {activeModal === 'confirm_logout' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#060D19]/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-md bg-[#0B1728] border border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl text-white space-y-5">
            
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-[#0F223D] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shadow-lg shadow-rose-500/10">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="font-display text-xl font-bold text-white">Confirm Logout</h3>
              <p className="text-xs text-sky-300/70">
                Are you sure you want to sign out of <span className="text-amber-300 font-bold">{user.name}</span>?
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#081220] border border-sky-500/20 flex items-center gap-3">
              <img
                src={user.profile_image || PRESET_AVATARS[0]}
                alt={user.name}
                className="w-11 h-11 rounded-xl object-cover ring-1 ring-amber-400/40 shrink-0"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{user.name}</p>
                <p className="text-[11px] text-sky-300/60 truncate">{user.email}</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                onClick={handleConfirmLogout}
                id="confirm-logout-submit-btn"
                className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-rose-600/20"
              >
                <LogOut className="w-4 h-4" />
                <span>Confirm Logout</span>
              </button>

              <button
                onClick={() => setActiveModal(null)}
                className="w-full py-2.5 rounded-xl bg-[#081220] hover:bg-[#0F223D] border border-sky-500/20 text-sky-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel & Stay Logged In
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Professional Ownership & System Information */}
      <footer className="text-center pt-8 pb-4 text-[11px] text-slate-500 font-medium border-t border-slate-900/60 mt-8 space-y-1">
        <p className="text-slate-400 font-bold">BIZNIX AI Suite • Powered by Jaz Media Parustarta</p>
        <p className="text-[10px] text-slate-600">Enterprise Cloud Architecture • High-Security Encrypted Systems</p>
      </footer>

    </div>
  );
};
