import React, { useState } from 'react';
import { 
  Crown, 
  Sparkles, 
  Check, 
  X, 
  ShieldCheck, 
  RefreshCw, 
  Calendar, 
  Lock, 
  ArrowRight,
  ExternalLink,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';

export const ProUpgradeModal: React.FC = () => {
  const { 
    showProModal, 
    setShowProModal, 
    proModalFeature, 
    isPro, 
    subscription, 
    user,
    isAuthenticated,
    openPaystackPaymentPage,
    verifyPaystackPayment,
    isVerifyingPayment,
    restorePurchases, 
    cancelSubscription,
    addToast,
    setActiveTab
  } = useApp();

  const [transactionRef, setTransactionRef] = useState('');
  const [showManualVerify, setShowManualVerify] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  if (!showProModal) return null;

  // Handles clicking the main BIZNIX Pro button
  const handleProButtonClick = () => {
    // Requirement 1: On BIZNIX Pro button click: window.open("https://paystack.shop/pay/BIZNIX_pro", "_blank")
    window.open("https://paystack.shop/pay/BIZNIX_pro", "_blank");
    setShowManualVerify(true);
    addToast('Opening Paystack secure checkout. Return here to confirm after completing payment.', 'info');
  };

  const handleVerifyReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionRef.trim()) {
      addToast('Please enter the email used for payment or your transaction reference.', 'error');
      return;
    }

    const success = await verifyPaystackPayment(transactionRef.trim());
    if (success) {
      try {
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.5 },
          colors: ['#D4AF37', '#38BDF8', '#10B981', '#F59E0B', '#FFFFFF']
        });
      } catch (e) {}
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await restorePurchases();
    } finally {
      setIsRestoring(false);
    }
  };

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel subscription auto-renew? You will continue to retain Pro benefits until the end of your paid billing period.')) {
      await cancelSubscription();
    }
  };

  const proBenefits = [
    { text: 'Daily Automatic AI Advertisement generated for your business every morning', highlight: 'Daily Auto-Ad' },
    { text: 'Daily AI Business Growth Recommendation tailored to your exact business', highlight: 'Daily Growth Rec' },
    { text: '50 AI logo generations per month & all 12 styles (Luxury, 3D, Automotive, etc.)', highlight: '50 Logos/mo' },
    { text: '4K Ultra-HD & Transparent PNG/SVG vector downloads with ZERO watermark', highlight: 'No Watermark' },
    { text: '500 AI Business Assistant messages per month with Priority GPU processing', highlight: '500 Messages' },
    { text: '100 AI Advertisements & Flyers per month across all social channels', highlight: '100 Ads/mo' },
    { text: 'Full Business Plan, Competitor Analysis & Growth Roadmap generators', highlight: 'Full Growth Suite' },
    { text: 'High-capacity storage: Save up to 200 logos, 200 ads, and 500 total projects', highlight: '200+ Storage' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#091527] to-[#040913] border border-[#D4AF37]/40 rounded-3xl p-5 sm:p-7 shadow-[0_0_50px_rgba(212,175,55,0.15)] text-white my-6">
        
        {/* Close Button */}
        <button
          onClick={() => setShowProModal(false)}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Feature Trigger Banner if opened via specific lock */}
        {proModalFeature && (
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-amber-300 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Unlock with BIZNIX Pro: {proModalFeature}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-[#D4AF37]/30 to-[#D4AF37]/5 border border-[#D4AF37]/50 shadow-[0_0_20px_rgba(212,175,55,0.3)] mb-3">
            <Crown className="w-8 h-8 text-[#D4AF37] animate-pulse" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            BIZNIX <span className="bg-gradient-to-r from-[#D4AF37] via-amber-200 to-[#D4AF37] bg-clip-text text-transparent">PRO ⭐</span>
          </h2>
          <p className="text-sm text-sky-200/80 mt-1 max-w-sm mx-auto font-medium">
            Power your business with daily AI growth, automated ads, and elite branding tools.
          </p>
        </div>

        {/* If user is already active Pro */}
        {isPro ? (
          <div className="space-y-4 my-4">
            <div className="p-5 rounded-2xl bg-[#0B1E36] border border-emerald-500/40 text-center">
              <div className="inline-flex p-2 rounded-xl bg-emerald-500/20 text-emerald-400 mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Active BIZNIX Pro Entitlement</h3>
              <p className="text-xs text-sky-200/70 mt-1">
                Status: <span className="text-emerald-400 font-bold uppercase tracking-wider">Verified Active</span>
              </p>
              {subscription?.expires_at && (
                <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Valid until: {new Date(subscription.expires_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              )}
              {subscription?.paystack_reference && (
                <p className="text-[10px] text-slate-500 mt-1 font-mono">Paystack Ref: {subscription.paystack_reference}</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => setShowProModal(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-amber-500 text-slate-950 font-bold text-xs hover:brightness-110 transition-all cursor-pointer"
              >
                Continue Creating
              </button>
              {subscription?.auto_renew && (
                <button
                  onClick={handleCancel}
                  className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors cursor-pointer border border-white/10"
                >
                  Cancel Auto-renew
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Authenticated Account Badge */}
            <div className="mb-4 p-3 rounded-xl bg-[#081525] border border-sky-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-slate-300 font-medium">Account:</span>
                <span className="text-amber-300 font-bold truncate max-w-[200px]">{user.email || 'Signed in User'}</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                Current: Free Plan
              </span>
            </div>

            {/* Pro Benefits Checklist */}
            <div className="p-4 rounded-2xl bg-[#071322] border border-white/10 space-y-2 mb-6">
              <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> What you unlock with BIZNIX Pro:
              </p>
              <div className="grid grid-cols-1 gap-2">
                {proBenefits.map((b, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-200">
                    <div className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="leading-snug">
                      <strong className="text-amber-200 font-bold">{b.highlight}:</strong> {b.text.replace(b.highlight, '')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Action: Normal BIZNIX Pro Button (URL NOT displayed on button) */}
            <div className="space-y-3">
              <button
                onClick={handleProButtonClick}
                id="biznix-pro-action-btn"
                className="w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wide bg-gradient-to-r from-[#D4AF37] via-amber-400 to-[#D4AF37] text-slate-950 shadow-[0_4px_25px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Crown className="w-4 h-4 text-slate-950 fill-slate-950" />
                <span>BIZNIX Pro</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Secure Verification Section */}
              <div className="pt-2">
                {!showManualVerify ? (
                  <div className="text-center">
                    <button
                      onClick={() => setShowManualVerify(true)}
                      className="text-xs text-sky-300/80 hover:text-amber-300 font-medium underline underline-offset-4 transition-colors cursor-pointer"
                    >
                      Already paid? Verify transaction reference
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyReference} className="p-4 rounded-2xl bg-[#09182C] border border-[#D4AF37]/30 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                      <CreditCard className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Verify Real Paystack Transaction</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Enter the email address you used for payment or your transaction reference (e.g. trx_abc123):
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        placeholder="e.g. Enter email used for payment"
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#050C17] border border-sky-500/25 text-white placeholder-slate-500 text-xs font-mono focus:outline-hidden focus:border-[#D4AF37]"
                      />
                      <button
                        type="submit"
                        disabled={isVerifyingPayment || !transactionRef.trim()}
                        className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {isVerifyingPayment ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        )}
                        <span>{isVerifyingPayment ? 'Verifying...' : 'Verify'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Restore & Policy Links */}
              <div className="flex items-center justify-between text-[11px] text-sky-200/70 pt-2 border-t border-sky-900/40">
                <button
                  onClick={handleRestore}
                  disabled={isRestoring}
                  className="hover:text-amber-300 font-medium transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isRestoring ? 'animate-spin' : ''}`} />
                  <span>Restore Entitlement</span>
                </button>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">Server Verified via Paystack</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">Cancel Anytime</span>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
