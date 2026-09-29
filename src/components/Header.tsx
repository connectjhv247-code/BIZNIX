import React from 'react';
import { Crown } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Header: React.FC = () => {
  const { user, isPro, setShowProModal, setActiveTab } = useApp();

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#081220]/90 border-b border-amber-500/20 shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Official BIZNIX Brand Logo & Wordmark */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group"
          id="header-brand-logo"
        >
          {/* Official Gold BIZNIX Emblem Logo */}
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 p-[1.5px] shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform overflow-hidden">
            <img 
              src="/biznix_logo.png" 
              alt="BIZNIX Logo" 
              className="w-full h-full object-cover rounded-[14px]"
              referrerPolicy="no-referrer"
            />
          </div>
          
          {/* Brand Wordmark & Tagline */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-2xl tracking-tight text-white group-hover:text-amber-400 transition-colors">
                BIZNIX
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/80 animate-pulse"></span>
            </div>
            <p className="text-[10px] font-extrabold text-sky-300/80 uppercase tracking-widest -mt-0.5">
              Your AI Business Partner
            </p>
          </div>
        </div>

        {/* Right Actions & Status Badges */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          
          {/* Pro Status or Upgrade Pill */}
          {isPro ? (
            <div className="bg-amber-500/15 rounded-full py-1.5 px-3.5 border border-amber-400/40 flex items-center gap-2 shadow-xs">
              <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-extrabold text-amber-300 tracking-wide">PRO ACTIVE</span>
            </div>
          ) : (
            <button
              onClick={() => setShowProModal(true)}
              id="header-upgrade-btn"
              className="gold-gradient-btn px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 fill-[#060D19]" />
              <span>⭐ Upgrade PRO</span>
            </button>
          )}

          {/* User Profile Avatar */}
          <button
            onClick={() => setActiveTab('profile')}
            id="header-profile-btn"
            className="flex items-center gap-2.5 p-1 pl-1.5 pr-3 rounded-2xl bg-[#0F223D]/80 hover:bg-[#152B4D] border border-sky-500/20 hover:border-amber-400/50 transition-all cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-[#081220] border-2 border-amber-400 overflow-hidden ring-2 ring-amber-400/20 shadow-xs">
              <img 
                src={user.profile_image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'} 
                alt={user.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-100 leading-tight">
                {user.business_name || user.name}
              </p>
              <p className="text-[9px] text-sky-400 font-semibold leading-tight uppercase tracking-wider">
                {user.business_category || 'Enterprise'}
              </p>
            </div>
          </button>

        </div>
      </div>
    </header>
  );
};
