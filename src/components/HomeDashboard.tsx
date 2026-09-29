import React, { useState } from 'react';
import { 
  Palette, 
  Megaphone, 
  TrendingUp, 
  ArrowRight, 
  Sparkles, 
  Share2, 
  Zap, 
  FileCheck, 
  Send, 
  ChevronRight, 
  Target, 
  Crown,
  Lock,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  AlertCircle,
  Lightbulb,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const HomeDashboard: React.FC = () => {
  const { 
    user,
    isPro,
    usageQuota,
    dailyProAd,
    dailyProGrowth,
    projects, 
    logos, 
    advertisements, 
    navigateToTool, 
    openProModal,
    regenerateDailyProAd,
    dismissDailyGrowth,
    addToast
  } = useApp();

  const [copiedAd, setCopiedAd] = useState(false);
  const [isRegeneratingAd, setIsRegeneratingAd] = useState(false);

  const growthQuickTools = [
    { label: 'Business Names', icon: '✏️', tool: 'name' as const },
    { label: 'Slogan Gen', icon: '🏷️', tool: 'slogan' as const },
    { label: 'Marketing Planner', icon: '🗺️', tool: 'marketing_plan' as const },
    { label: 'Customer Targeting', icon: '🎯', tool: 'customer_targeting' as const },
    { label: 'Business Plan', icon: '📋', tool: 'business_plan' as const },
    { label: 'Growth Playbook', icon: '🚀', tool: 'expansion_playbook' as const },
  ];

  const handleCopyDailyAd = () => {
    if (!dailyProAd) return;
    const ad = dailyProAd.ad || (dailyProAd as any).ad_copy || (dailyProAd as any);
    const headline = ad.headline || ad.title || 'Special Offer';
    const bodyText = ad.body_text || ad.bodyText || '';
    const cta = ad.call_to_action || ad.callToAction || '';
    const hashtags = Array.isArray(ad.hashtags) ? ad.hashtags.join(' ') : '';
    const textToCopy = `${headline}\n\n${bodyText}\n\n${cta}\n\n${hashtags}`.trim();
    navigator.clipboard.writeText(textToCopy);
    setCopiedAd(true);
    addToast('Daily advertisement copied to clipboard!', 'success');
    setTimeout(() => setCopiedAd(false), 2500);
  };

  const handleShareDailyAdWhatsApp = () => {
    if (!dailyProAd) return;
    const ad = dailyProAd.ad || (dailyProAd as any).ad_copy || (dailyProAd as any);
    const headline = ad.headline || ad.title || 'Special Offer';
    const bodyText = ad.body_text || ad.bodyText || '';
    const cta = ad.call_to_action || ad.callToAction || 'Learn More';
    const text = encodeURIComponent(`*${headline}*\n\n${bodyText}\n\n👉 *${cta}*`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleRegenerateAd = async () => {
    setIsRegeneratingAd(true);
    try {
      await regenerateDailyProAd();
    } finally {
      setIsRegeneratingAd(false);
    }
  };

  return (
    <div className="space-y-7 pb-16">
      
      {/* Official BIZNIX Executive Cover & Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0D1E36] via-[#091526] to-[#060D19] border border-amber-500/25 p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        
        {/* Subtle Background Glow Elements */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-sky-500/10 blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Left Hero Content */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-extrabold text-amber-300 tracking-wide">
                Next-Gen AI Business Operating System
              </span>
            </div>

            <div className="space-y-1">
              <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight flex items-center justify-center md:justify-start gap-2.5">
                <span>BIZNIX</span>
                <span className="text-amber-400 text-2xl sm:text-3xl">⭐</span>
                {isPro && (
                  <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider">
                    PRO
                  </span>
                )}
              </h1>
              <p className="text-base sm:text-lg font-bold text-sky-300">
                Your AI Business Partner
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Create brand identities, generate promotional ads, consult strategic AI advisors, and scale enterprise revenue effortlessly.
            </p>

            {/* Quick Hero Actions */}
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <button
                onClick={() => navigateToTool('create', 'logo')}
                className="gold-gradient-btn px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 cursor-pointer"
              >
                <Palette className="w-4 h-4 text-[#060D19]" />
                <span>Create Brand Logo</span>
              </button>

              <button
                onClick={() => navigateToTool('advertise', 'studio')}
                className="px-4 py-2.5 rounded-xl bg-[#0F223D] hover:bg-[#152B4D] border border-sky-400/25 text-sky-200 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all"
              >
                <Megaphone className="w-4 h-4 text-amber-400" />
                <span>Launch Campaign</span>
              </button>

              {!isPro && (
                <button
                  onClick={() => openProModal('Unlock Unlimited Generations & HD Vector Exports')}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37]/20 to-amber-500/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/60 text-amber-300 font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Upgrade to Pro</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Official Cover / Logo Emblem Showcase */}
          <div className="relative shrink-0 flex items-center justify-center">
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-3xl p-1 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 shadow-[0_0_40px_rgba(245,158,11,0.3)] ring-4 ring-amber-400/20 group">
              <img 
                src="/biznix_logo.png" 
                alt="Official BIZNIX Logo Emblem" 
                className="w-full h-full object-cover rounded-[22px] shadow-inner"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#060D19] border border-amber-400/60 shadow-lg text-[9px] font-black text-amber-300 uppercase tracking-widest whitespace-nowrap">
                Official BIZNIX Emblem
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Plan Quota Status Bar (Free vs Pro) */}
      <section className="p-4 rounded-2xl bg-[#091628] border border-sky-500/20 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sky-900/40">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-xl ${isPro ? 'bg-amber-500/20 text-[#D4AF37]' : 'bg-sky-500/20 text-sky-300'}`}>
              {isPro ? <Crown className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {isPro ? 'BIZNIX PRO ⭐ ACTIVE' : 'BIZNIX FREE PLAN'}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${isPro ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-300'}`}>
                  {isPro ? 'Monthly Quota' : 'Daily Free Quota'}
                </span>
              </div>
              <p className="text-[11px] text-sky-200/70 mt-0.5">
                {isPro ? 'Unrestricted 4K exports, 12 styles, priority processing & daily automatic content' : 'Daily generation limits apply. Upgrade to Pro for 50 logos, 100 ads, and 4K vector downloads.'}
              </p>
            </div>
          </div>

          {!isPro && (
            <button
              onClick={() => openProModal('Full Access with BIZNIX Pro')}
              className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-amber-500 text-slate-950 font-black text-xs hover:brightness-110 transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Get BIZNIX Pro</span>
            </button>
          )}
        </div>

        {/* Quota Indicators */}
        <div className="grid grid-cols-3 gap-2.5 pt-3">
          {/* Logo Quota */}
          <div className="p-2.5 rounded-xl bg-[#060D19] border border-sky-500/10">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium">Logos</span>
              <span className="font-bold text-amber-400">
                {usageQuota ? `${usageQuota.logos_generated_count} / ${usageQuota.plan_limits.logos_limit}` : (isPro ? '0 / 50' : '0 / 3')}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 mt-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all"
                style={{ 
                  width: `${Math.min(100, usageQuota ? (usageQuota.logos_generated_count / usageQuota.plan_limits.logos_limit) * 100 : 0)}%` 
                }}
              />
            </div>
          </div>

          {/* AI Assistant Quota */}
          <div className="p-2.5 rounded-xl bg-[#060D19] border border-sky-500/10">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium">AI Chat</span>
              <span className="font-bold text-sky-400">
                {usageQuota ? `${usageQuota.chat_messages_count} / ${usageQuota.plan_limits.chat_messages_limit}` : (isPro ? '0 / 500' : '0 / 10')}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 mt-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-full transition-all"
                style={{ 
                  width: `${Math.min(100, usageQuota ? (usageQuota.chat_messages_count / usageQuota.plan_limits.chat_messages_limit) * 100 : 0)}%` 
                }}
              />
            </div>
          </div>

          {/* Ads Quota */}
          <div className="p-2.5 rounded-xl bg-[#060D19] border border-sky-500/10">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium">Ad Studio</span>
              <span className="font-bold text-emerald-400">
                {usageQuota ? `${usageQuota.ads_generated_count} / ${usageQuota.plan_limits.ads_limit}` : (isPro ? '0 / 100' : '0 / 5')}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 mt-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all"
                style={{ 
                  width: `${Math.min(100, usageQuota ? (usageQuota.ads_generated_count / usageQuota.plan_limits.ads_limit) * 100 : 0)}%` 
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* PRO EXCLUSIVE SECTION 1: Daily Automatic AI Advertisement */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1B30] to-[#071322] border border-amber-500/30 p-5 sm:p-6 shadow-[0_6px_24px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-400/40 text-amber-300">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold text-white">
                  Today's Automated AI Advertisement
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[#D4AF37] border border-amber-500/40 text-[10px] font-black uppercase tracking-wider">
                  ⭐ PRO DAILY
                </span>
              </div>
              <p className="text-xs text-sky-200/70">
                Fresh, high-converting promotional ad generated automatically every morning for {user.business_name}
              </p>
            </div>
          </div>

          {isPro && (
            <button
              onClick={handleRegenerateAd}
              disabled={isRegeneratingAd}
              className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingAd ? 'animate-spin' : ''}`} />
              <span>Regenerate Fresh Ad</span>
            </button>
          )}
        </div>

        {isPro ? (
          dailyProAd ? (() => {
            const ad = dailyProAd.ad || (dailyProAd as any).ad_copy || (dailyProAd as any);
            const headline = ad.headline || ad.title || 'Special Promotion';
            const bodyText = ad.body_text || ad.bodyText || 'Exclusive promotional update for your business.';
            const cta = ad.call_to_action || ad.callToAction || 'Contact Us';
            const hashtags = Array.isArray(ad.hashtags) ? ad.hashtags : [];
            const adType = ad.type || dailyProAd.ad_type || 'Special Offer';
            const platform = ad.platform || 'Multi-Channel';

            return (
              <div className="p-4 rounded-2xl bg-[#060D19] border border-sky-500/20 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                      {adType} • {platform}
                    </span>
                    <h4 className="text-base font-bold text-white mt-0.5">
                      {headline}
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-[#0A1626] p-3 rounded-xl border border-sky-950">
                  {bodyText}
                </p>

                <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-[#0F223D] border border-sky-400/30 text-amber-300 font-bold text-xs">
                      👉 {cta}
                    </span>
                    {hashtags.length > 0 && (
                      <span className="text-[11px] text-sky-400/80">
                        {hashtags.slice(0, 3).join(' ')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyDailyAd}
                      className="px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedAd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedAd ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={handleShareDailyAdWhatsApp}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })() : (
            <div className="p-6 rounded-2xl bg-[#060D19] border border-sky-500/20 text-center">
              <p className="text-xs text-slate-400">Loading today's automated advertisement...</p>
            </div>
          )
        ) : (
          /* Locked State for Free Users */
          <div className="p-6 rounded-2xl bg-[#060D19]/90 border border-[#D4AF37]/30 text-center space-y-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/5 to-transparent pointer-events-none" />
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] mx-auto">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Daily Automatic AI Ads is a BIZNIX Pro Feature</h4>
              <p className="text-xs text-sky-200/70 max-w-md mx-auto">
                Pro members receive a fresh, high-converting advertisement for their business every single morning, ready to publish on WhatsApp, Instagram, and Facebook in 1 click.
              </p>
            </div>
            <button
              onClick={() => openProModal('Daily Automatic AI Advertisements')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-amber-500 text-slate-950 font-black text-xs hover:brightness-110 transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Unlock Daily AI Ads</span>
            </button>
          </div>
        )}
      </section>

      {/* PRO EXCLUSIVE SECTION 2: Daily AI Business Growth Recommendation */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#09172A] to-[#050E1A] border border-sky-500/25 p-5 sm:p-6 shadow-[0_6px_24px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/20 border border-sky-400/40 text-sky-300">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold text-white">
                  Daily AI Business Growth Recommendation
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 text-[10px] font-black uppercase tracking-wider">
                  ⭐ PRO INTELLIGENCE
                </span>
              </div>
              <p className="text-xs text-sky-200/70">
                Actionable, strategic guidance generated every morning tailored to your business category
              </p>
            </div>
          </div>
        </div>

        {isPro ? (
          dailyProGrowth && dailyProGrowth.status !== 'dismissed' ? (() => {
            const growthTitle = dailyProGrowth.title || (dailyProGrowth as any).recommendation_title || "Today's Strategic Growth Move";
            const growthRec = dailyProGrowth.recommendation || (dailyProGrowth as any).tactical_summary || 'Focus on high-value client outreach and follow-ups today.';
            const growthCategory = dailyProGrowth.category || (dailyProGrowth as any).focus_area || 'Strategic Growth';
            const actionStep = dailyProGrowth.actionable_step || '';

            return (
              <div className="p-4 rounded-2xl bg-[#060D19] border border-sky-500/20 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase">
                      {growthCategory}
                    </span>
                    <span className="text-xs text-emerald-400 font-bold">
                      🚀 High Impact
                    </span>
                  </div>
                  <button
                    onClick={dismissDailyGrowth}
                    className="text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    Dismiss for today
                  </button>
                </div>

                <h4 className="text-sm font-bold text-white">
                  {growthTitle}
                </h4>

                <p className="text-xs text-slate-300 leading-relaxed bg-[#0A1626] p-3 rounded-xl border border-sky-950">
                  {growthRec}
                </p>

                {actionStep && (
                  <div className="space-y-1 pt-1">
                    <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">Action Step for Today:</p>
                    <div className="p-2.5 rounded-xl bg-[#091526] border border-sky-900/40 text-[11px] text-slate-200 flex items-start gap-2">
                      <span className="font-bold text-[#D4AF37]">⚡</span>
                      <span>{actionStep}</span>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => navigateToTool('assistant')}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0F223D] hover:bg-[#152B4D] border border-sky-400/30 text-sky-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Discuss Strategy with BIZNIX AI</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                </div>
              </div>
            );
          })() : (
            <div className="p-4 rounded-2xl bg-[#060D19] border border-sky-500/20 text-center">
              <p className="text-xs text-slate-400">Today's growth recommendation reviewed! A new strategic roadmap item will generate tomorrow morning.</p>
            </div>
          )
        ) : (
          /* Locked State for Free Users */
          <div className="p-6 rounded-2xl bg-[#060D19]/90 border border-[#D4AF37]/30 text-center space-y-3 relative overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/40 flex items-center justify-center text-sky-300 mx-auto">
              <Lock className="w-5 h-5 text-amber-400" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Daily AI Business Growth Intelligence is a Pro Feature</h4>
              <p className="text-xs text-sky-200/70 max-w-md mx-auto">
                Get an executive tactical briefing delivered every morning with specific revenue-generating action steps tailored to {user.business_name || 'your business'}.
              </p>
            </div>
            <button
              onClick={() => openProModal('Daily AI Business Growth Recommendations')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-amber-500 text-slate-950 font-black text-xs hover:brightness-110 transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Unlock Growth Intelligence</span>
            </button>
          </div>
        )}
      </section>

      {/* 4 Core Features Cards Grid */}
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-sky-400/90">
            Core Business Engines
          </h2>
          <span className="text-xs font-bold text-amber-400">
            4 All-in-One Modules
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* CARD 1: AI Logo Creator */}
          <div 
            className="feature-card p-6 flex flex-col justify-between relative group bg-[#0B1728] border border-sky-500/15"
            id="feature-card-logo"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl shadow-xs">
                  🎨
                </div>
                <span className="gold-badge shadow-xs">
                  ⭐ AI Vector
                </span>
              </div>

              <h3 className="font-display text-xl font-bold text-white mt-4 tracking-tight group-hover:text-amber-400 transition-colors">
                AI Logo Creator
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Design custom vector logos, monogram emblems, and full brand identities in 12 premium design styles.
              </p>

              {/* Visual Preview Samples */}
              <div className="mt-4 p-3.5 rounded-2xl bg-[#081220] border border-sky-500/15 flex items-center justify-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#0F223D] border border-amber-400/40 flex items-center justify-center text-amber-300 font-extrabold text-sm shadow-xs group-hover:scale-105 transition-transform">
                  BX
                </div>
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-[#060D19] flex items-center justify-center font-black text-sm shadow-xs group-hover:scale-105 transition-transform">
                  AP
                </div>
                <div className="w-11 h-11 rounded-xl bg-[#091526] border border-sky-400/30 text-sky-300 flex items-center justify-center font-extrabold text-sm shadow-xs group-hover:scale-105 transition-transform">
                  NX
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-sky-900/40 flex items-center justify-between">
              <span className="text-xs text-sky-300/70 font-medium">SVG & HD PNG Export</span>
              <button
                onClick={() => navigateToTool('create', 'logo')}
                id="btn-generate-logo"
                className="gold-gradient-btn px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 cursor-pointer"
              >
                <span>Generate Logo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* CARD 2: AI Business Assistant */}
          <div 
            className="feature-card p-6 flex flex-col justify-between relative group bg-[#0B1728] border border-sky-500/15"
            id="feature-card-assistant"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-2xl shadow-xs">
                  🤖
                </div>
                <span className="gold-badge shadow-xs">
                  ⭐ 24/7 Advisor
                </span>
              </div>

              <h3 className="font-display text-xl font-bold text-white mt-4 tracking-tight group-hover:text-amber-400 transition-colors">
                BIZNIX AI Business Assistant
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Strategic executive advisor for instant answers on marketing, pricing, contracts, operations, and growth.
              </p>

              {/* Chat Bubble Teaser */}
              <div className="mt-4 p-3 rounded-2xl bg-[#081220] border-l-4 border-amber-400 border-sky-900/40 text-xs text-slate-200 leading-relaxed shadow-xs">
                <p className="font-bold text-amber-300 text-[11px] mb-0.5">💡 Strategy Prompt</p>
                "How do I boost retail conversion rates by 25% this month?"
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-sky-900/40 flex items-center justify-between">
              <span className="text-xs text-sky-300/70 font-medium">Executive AI Intelligence</span>
              <button
                onClick={() => navigateToTool('assistant')}
                id="btn-ask-biznix"
                className="gold-gradient-btn px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 cursor-pointer"
              >
                <span>Ask BIZNIX</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* CARD 3: Advertisement & Marketing Studio */}
          <div 
            className="feature-card p-6 flex flex-col justify-between relative group bg-[#0B1728] border border-sky-500/15"
            id="feature-card-ad-studio"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl shadow-xs">
                  📢
                </div>
                <span className="gold-badge shadow-xs">
                  ⭐ Multi-Channel
                </span>
              </div>

              <h3 className="font-display text-xl font-bold text-white mt-4 tracking-tight group-hover:text-amber-400 transition-colors">
                Advertisement & Marketing Studio
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Generate high-converting ad copy, visual flyers, social posts, and WhatsApp promotional messages with 1-click sharing.
              </p>

              {/* Multi-channel Indicator Chips */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="p-2 rounded-xl bg-[#081220] border border-sky-500/15 text-center">
                  <p className="text-[10px] font-bold text-slate-200">WhatsApp</p>
                  <p className="text-[9px] text-emerald-400 font-bold">1-Click Send</p>
                </div>
                <div className="p-2 rounded-xl bg-[#081220] border border-sky-500/15 text-center">
                  <p className="text-[10px] font-bold text-slate-200">Instagram</p>
                  <p className="text-[9px] text-amber-400 font-bold">Viral Hooks</p>
                </div>
                <div className="p-2 rounded-xl bg-[#081220] border border-sky-500/15 text-center">
                  <p className="text-[10px] font-bold text-slate-200">Flyers</p>
                  <p className="text-[9px] text-sky-400 font-bold">Print Ready</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-sky-900/40 flex items-center justify-between">
              <span className="text-xs text-sky-300/70 font-medium">12 Ad Types Supported</span>
              <button
                onClick={() => navigateToTool('advertise', 'studio')}
                id="btn-create-advertisement"
                className="gold-gradient-btn px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 cursor-pointer"
              >
                <span>Create Advertisement</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* CARD 4: Business Growth Tools */}
          <div 
            className="feature-card p-6 flex flex-col justify-between relative group bg-[#0B1728] border border-sky-500/15"
            id="feature-card-growth-tools"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-2xl shadow-xs">
                  📈
                </div>
                <span className="gold-badge shadow-xs">
                  ⭐ 8 AI Engines
                </span>
              </div>

              <h3 className="font-display text-xl font-bold text-white mt-4 tracking-tight group-hover:text-amber-400 transition-colors">
                Business Growth Tools
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Unlock 8 specialized engines: brand naming, slogans, business plans, marketing calendars, and target audience personas.
              </p>

              {/* Quick tool pills */}
              <div className="mt-4 grid grid-cols-3 gap-1.5">
                {growthQuickTools.slice(0, 6).map((tool, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigateToTool('create', 'name', tool.tool)}
                    className="p-1.5 rounded-lg bg-[#081220] hover:bg-[#0F223D] border border-sky-500/15 text-[10px] font-bold text-slate-200 truncate text-left flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>{tool.icon}</span>
                    <span className="truncate">{tool.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-sky-900/40 flex items-center justify-between">
              <span className="text-xs text-sky-300/70 font-medium">Complete Scalability Suite</span>
              <button
                onClick={() => navigateToTool('create', 'name')}
                id="btn-grow-my-business"
                className="gold-gradient-btn px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 cursor-pointer"
              >
                <span>Grow My Business</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Quick Launch One-Click Actions Grid */}
      <section className="bg-[#0B1728] rounded-3xl p-5 border border-amber-500/20 shadow-[0_6px_24px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
              Instant Launch Shortcuts
            </h3>
          </div>
          <span className="text-xs font-bold text-amber-400">
            One-Click Creation
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            onClick={() => navigateToTool('create', 'logo')}
            className="flex items-center gap-2 p-3 rounded-xl bg-[#081220] border border-sky-500/15 text-slate-200 hover:text-amber-300 hover:border-amber-400/40 hover:bg-[#0F223D] transition-all text-xs font-bold cursor-pointer"
          >
            <Palette className="w-4 h-4 text-amber-400" />
            <span>AI Logo</span>
          </button>

          <button
            onClick={() => navigateToTool('advertise', 'whatsapp')}
            className="flex items-center gap-2 p-3 rounded-xl bg-[#081220] border border-sky-500/15 text-slate-200 hover:text-emerald-300 hover:border-emerald-400/40 hover:bg-[#0F223D] transition-all text-xs font-bold cursor-pointer"
          >
            <Send className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp Ad</span>
          </button>

          <button
            onClick={() => navigateToTool('create', 'name', 'business_plan')}
            className="flex items-center gap-2 p-3 rounded-xl bg-[#081220] border border-sky-500/15 text-slate-200 hover:text-sky-300 hover:border-sky-400/40 hover:bg-[#0F223D] transition-all text-xs font-bold cursor-pointer"
          >
            <FileCheck className="w-4 h-4 text-sky-400" />
            <span>Business Plan</span>
          </button>

          <button
            onClick={() => navigateToTool('create', 'flyer')}
            className="flex items-center gap-2 p-3 rounded-xl bg-[#081220] border border-sky-500/15 text-slate-200 hover:text-amber-300 hover:border-amber-400/40 hover:bg-[#0F223D] transition-all text-xs font-bold cursor-pointer"
          >
            <Megaphone className="w-4 h-4 text-amber-400" />
            <span>Flyer Maker</span>
          </button>

          <button
            onClick={() => navigateToTool('advertise', 'social')}
            className="flex items-center gap-2 p-3 rounded-xl bg-[#081220] border border-sky-500/15 text-slate-200 hover:text-pink-300 hover:border-pink-400/40 hover:bg-[#0F223D] transition-all text-xs font-bold cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-pink-400" />
            <span>Social Post</span>
          </button>

          <button
            onClick={() => navigateToTool('create', 'name', 'customer_targeting')}
            className="flex items-center gap-2 p-3 rounded-xl bg-[#081220] border border-sky-500/15 text-slate-200 hover:text-purple-300 hover:border-purple-400/40 hover:bg-[#0F223D] transition-all text-xs font-bold cursor-pointer"
          >
            <Target className="w-4 h-4 text-purple-400" />
            <span>Target Persona</span>
          </button>
        </div>
      </section>

      {/* Saved Projects Library Card */}
      <section 
        onClick={() => navigateToTool('profile', 'projects')}
        className="bg-[#0B1728] rounded-3xl p-6 border border-sky-500/15 hover:border-amber-400/40 shadow-[0_6px_24px_rgba(0,0,0,0.4)] transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-lg">
              📂
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                My Projects Library
              </h3>
              <p className="text-xs text-sky-300/70">
                {projects.length} Saved Assets ({logos.length} Logos, {advertisements.length} Ads)
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-amber-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Open Library <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </section>

      {/* Executive Growth Directive Banner */}
      <section className="rounded-3xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 p-6 text-[#060D19] shadow-xl shadow-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-amber-300/50">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-[#060D19]/20 backdrop-blur-sm text-[#060D19] shrink-0">
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-sm font-black text-[#060D19] flex items-center gap-2">
              BIZNIX Growth Strategy Directive
            </h4>
            <p className="text-xs text-[#060D19]/90 font-medium mt-0.5 leading-relaxed max-w-xl">
              WhatsApp conversational commerce delivers up to 98% open rates and 45% reply rates. Deploy our dedicated WhatsApp Ad Generator to create high-conversion messages with direct one-click sharing.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigateToTool('advertise', 'whatsapp')}
          className="shrink-0 px-4 py-2.5 rounded-xl bg-[#060D19] hover:bg-[#0B1728] text-amber-300 font-extrabold text-xs transition-colors cursor-pointer shadow-md border border-amber-400/40"
        >
          Launch WhatsApp Campaign
        </button>
      </section>

    </div>
  );
};
