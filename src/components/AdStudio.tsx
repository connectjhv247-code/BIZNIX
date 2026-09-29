import React, { useState } from 'react';
import { 
  Megaphone, 
  Sparkles, 
  Send, 
  Share2, 
  Download, 
  Bookmark, 
  Edit3, 
  Copy, 
  Check, 
  Layers, 
  FileText, 
  Image as ImageIcon,
  Tag,
  Clock,
  MapPin,
  Phone,
  RefreshCw,
  Facebook,
  Instagram,
  Twitter,
  Video
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AdvertisementType, SocialPlatform, AdStyle, AdvertiseSubTab } from '../types';
import { api } from '../lib/api';

const AD_TYPES: { id: AdvertisementType; label: string; icon: any }[] = [
  { id: 'Product Launch', label: 'Product Launch', icon: Layers },
  { id: 'Discount Sale', label: 'Discount Sale', icon: Tag },
  { id: 'Promotional Flyer', label: 'Promotional Flyer', icon: FileText },
  { id: 'Social Media Campaign', label: 'Social Campaign', icon: Share2 },
  { id: 'WhatsApp Advertisement', label: 'WhatsApp Promo', icon: Send },
  { id: 'Event Promotion', label: 'Event Promo', icon: Clock },
  { id: 'Special Offer', label: 'Special Offer', icon: Sparkles },
  { id: 'Customer Testimonial', label: 'Testimonial Ad', icon: Megaphone },
  { id: 'Service Highlight', label: 'Service Showcase', icon: Layers },
  { id: 'Holiday Promo', label: 'Holiday Special', icon: Sparkles },
  { id: 'Brand Awareness', label: 'Brand Awareness', icon: Megaphone },
  { id: 'Lead Generation', label: 'Lead Magnet', icon: Send },
];

const AD_STYLES: { id: AdStyle; label: string; isPro?: boolean }[] = [
  { id: 'Modern', label: 'Modern & High Energy' },
  { id: 'Professional', label: 'Professional & Corporate' },
  { id: 'Urgent', label: 'High Urgency / FOMO' },
  { id: 'Storytelling', label: 'Emotional Storytelling' },
  { id: 'Luxury', label: 'Luxury & Exclusive', isPro: true },
  { id: 'Playful', label: 'Playful & Friendly' },
  { id: 'Bold & Punchy', label: 'Bold & Punchy', isPro: true },
  { id: 'Minimalist', label: 'Minimalist & Clean' },
];

const SOCIAL_PLATFORMS: { id: SocialPlatform; label: string; icon: any }[] = [
  { id: 'Facebook', label: 'Facebook', icon: Facebook },
  { id: 'Instagram', label: 'Instagram', icon: Instagram },
  { id: 'TikTok', label: 'TikTok', icon: Video },
  { id: 'WhatsApp Status', label: 'WhatsApp Status', icon: Send },
  { id: 'X', label: 'X (Twitter)', icon: Twitter },
];

export const AdStudio: React.FC = () => {
  const { 
    user, 
    isPro, 
    advertiseSubTab, 
    setAdvertiseSubTab, 
    saveAd, 
    setShowProModal, 
    addToast 
  } = useApp();

  // Form State
  const [selectedType, setSelectedType] = useState<AdvertisementType>('Special Offer');
  const [businessName, setBusinessName] = useState(user.business_name || 'Apex Studios');
  const [productService, setProductService] = useState('AI Brand Identity & Growth Package');
  const [description, setDescription] = useState('All-in-one branding package including logo vector files, 30-day marketing plan, and custom WhatsApp promo funnel.');
  const [targetAudience, setTargetAudience] = useState('Entrepreneurs, startup founders, and local business owners looking to modernize.');
  const [location, setLocation] = useState('Available Nationwide / Online');
  const [price, setPrice] = useState('Special $49 (Regular $199)');
  const [specialOffer, setSpecialOffer] = useState('75% OFF + Free 30-Day Marketing Roadmap');
  const [contactInfo, setContactInfo] = useState(user.phone || '+1 (555) 234-5678');
  const [selectedStyle, setSelectedStyle] = useState<AdStyle>('Modern');
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>('Instagram');

  // Generation Results
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAd, setGeneratedAd] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBody, setEditedBody] = useState('');
  const [editedHeadline, setEditedHeadline] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const activeMode = advertiseSubTab;

  const handleGenerate = async () => {
    if (!businessName.trim() || !productService.trim()) {
      addToast('Please enter your business name and product/service.', 'error');
      return;
    }

    const styleObj = AD_STYLES.find(s => s.id === selectedStyle);
    if (styleObj?.isPro && !isPro) {
      setShowProModal(true);
      return;
    }

    setIsGenerating(true);
    try {
      let adType = selectedType;
      if (activeMode === 'whatsapp') adType = 'WhatsApp Advertisement';
      else if (activeMode === 'flyer') adType = 'Promotional Flyer';
      else if (activeMode === 'product') adType = 'Product Advertisement';
      else if (activeMode === 'social') adType = `${selectedPlatform} Advertisement` as AdvertisementType;

      const result = await api.generateAd({
        type: adType,
        businessName,
        productService,
        description,
        targetAudience,
        location,
        price,
        specialOffer,
        contactInfo,
        style: selectedStyle,
        platform: selectedPlatform
      });

      setGeneratedAd(result);
      setEditedHeadline(result.headline || '');
      setEditedBody(result.bodyText || '');
      addToast('Advertisement generated successfully!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Unable to generate advertisement.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToProjects = async () => {
    if (!generatedAd) return;

    try {
      await saveAd({
        business_name: businessName,
        type: selectedType,
        platform: selectedPlatform,
        title: editedHeadline || generatedAd.headline || `${businessName} Promo`,
        headline: editedHeadline || generatedAd.headline,
        body_text: editedBody || generatedAd.bodyText,
        call_to_action: generatedAd.callToAction,
        hashtags: generatedAd.hashtags || [],
        special_offer: specialOffer,
        price,
        contact_info: contactInfo,
        style: selectedStyle,
        image_prompt: generatedAd.imagePrompt,
        flyer_layout: generatedAd.flyerLayout
      });
    } catch (e: any) {
      addToast(e.message || 'Unable to save advertisement.', 'error');
    }
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    addToast('Copied to clipboard!', 'info');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleShareToWhatsApp = () => {
    const textToSend = generatedAd?.formattedWhatsAppText || 
      `*${editedHeadline || generatedAd?.headline}*\n\n${editedBody || generatedAd?.bodyText}\n\n👉 *Offer:* ${specialOffer}\n💰 *Price:* ${price}\n📞 *Contact:* ${contactInfo}`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(textToSend)}`;
    window.open(url, '_blank');
  };

  const handleDownloadFlyer = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background Gradient (Navy with Gold accents)
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1350);
    bgGrad.addColorStop(0, '#0B192C');
    bgGrad.addColorStop(1, '#1E3E62');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1350);

    // Decorative Gold Top Bar
    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(0, 0, 1080, 24);

    // Special Offer Tag Badge
    ctx.fillStyle = '#D4AF37';
    ctx.beginPath();
    ctx.roundRect(140, 90, 800, 70, 35);
    ctx.fill();

    ctx.fillStyle = '#0B192C';
    ctx.font = 'bold 28px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((specialOffer || 'EXCLUSIVE OFFER').toUpperCase(), 540, 135);

    // Business Name
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 68px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(businessName.toUpperCase(), 540, 240);

    // Subtitle / Product
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(productService, 540, 305);

    // Headline Box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(80, 360, 920, 220, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    
    // Word wrap for headline
    const headline = editedHeadline || generatedAd?.headline || 'Grow Your Enterprise Today';
    const words = headline.split(' ');
    let line1 = '';
    let line2 = '';
    words.forEach((w) => {
      if ((line1 + w).length < 24) line1 += `${w} `;
      else line2 += `${w} `;
    });
    ctx.fillText(line1.trim(), 540, 445);
    if (line2) ctx.fillText(line2.trim(), 540, 505);

    // Feature Highlights Box
    const bulletPoints = generatedAd?.bulletPoints || [
      'Industry-leading conversion design',
      'Engineered for maximum ROI and engagement',
      'Rapid turnkey deployment across channels'
    ];

    let yOffset = 630;
    bulletPoints.slice(0, 4).forEach((bp: string) => {
      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 32px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('✓', 120, yOffset);

      ctx.fillStyle = '#f1f5f9';
      ctx.font = '500 30px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(bp.slice(0, 45), 170, yOffset);
      yOffset += 65;
    });

    // Price Tag Box
    if (price) {
      ctx.fillStyle = '#0B192C';
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(120, yOffset + 30, 840, 130, 24);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 46px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(price, 540, yOffset + 110);
    }

    // Footer Contact
    ctx.fillStyle = '#070F1B';
    ctx.fillRect(0, 1210, 1080, 140);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`📲 Contact: ${contactInfo}  •  📍 ${location}`, 540, 1290);

    const pngUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = `${businessName.toLowerCase().replace(/\s+/g, '_')}_promotional_flyer.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Promotional Flyer downloaded!', 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-sky-100 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
              Advertisement & Marketing Studio
            </h1>
            <span className="gold-badge shadow-xs">
              ⭐ AI Campaign Studio
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create high-converting WhatsApp ads, social media campaigns, product copy, and promotional flyers.
          </p>
        </div>
      </div>

      {/* Studio Navigation Subtabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
        {[
          { id: 'studio', label: 'All-in-One Studio', icon: Megaphone },
          { id: 'whatsapp', label: 'WhatsApp Ads', icon: Send },
          { id: 'social', label: 'Social Media Content', icon: Share2 },
          { id: 'flyer', label: 'Promotional Flyers', icon: FileText },
          { id: 'product', label: 'Product Ads', icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeMode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAdvertiseSubTab(tab.id as AdvertiseSubTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'gold-gradient-btn'
                  : 'bg-white border border-sky-100 text-slate-700 hover:bg-sky-50 shadow-xs'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Inputs Column */}
        <div className="lg:col-span-6 space-y-5">
          <div className="rounded-3xl bg-white border border-sky-100 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)] space-y-4">
            
            {/* If All-in-One Mode: Show 12 Ad Types Selector */}
            {activeMode === 'studio' && (
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                  Advertisement Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AD_TYPES.map((type) => {
                    const isSelected = selectedType === type.id;
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setSelectedType(type.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-400/30 font-bold'
                            : 'border-slate-200 bg-sky-50/40 text-slate-700 hover:border-amber-300 text-xs font-medium'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* If Social Mode: Show Social Platform Selector */}
            {activeMode === 'social' && (
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                  Select Social Platform
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SOCIAL_PLATFORMS.map((platform) => {
                    const isSelected = selectedPlatform === platform.id;
                    const Icon = platform.icon;
                    return (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => setSelectedPlatform(platform.id)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-400/30 font-bold'
                            : 'border-slate-200 bg-sky-50/40 text-slate-700 hover:border-amber-300 text-xs font-medium'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0 text-amber-600" />
                        <span>{platform.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Business Name & Product/Service */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                  Business Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g., Apex Studios"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-sky-50/60 border border-sky-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                  Product / Service <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={productService}
                  onChange={(e) => setProductService(e.target.value)}
                  placeholder="e.g., Branding Kit, Fresh Pastries"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-sky-50/60 border border-sky-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Description & Target Audience */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                Key Details / Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What makes this offer special? Highlight key benefits, speed, quality..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-sky-50/60 border border-sky-200/80 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white resize-none transition-all"
              />
            </div>

            {/* Target Audience & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g., Working parents, entrepreneurs"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-sky-50/60 border border-sky-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                  Location / Coverage
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Downtown Metro, Nationwide"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-sky-50/60 border border-sky-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Price Tag & Special Offer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                  Price (Tag text)
                </label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g., $29.99, From $99, Free Consult"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-sky-50/60 border border-sky-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                  Special Offer / Discount
                </label>
                <input
                  type="text"
                  value={specialOffer}
                  onChange={(e) => setSpecialOffer(e.target.value)}
                  placeholder="e.g., 50% OFF This Weekend Only"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-sky-50/60 border border-sky-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Contact Information & Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                  Contact Info / Phone / WhatsApp
                </label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="e.g., +1 (555) 234-5678, @apexstudios"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-sky-50/60 border border-sky-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                  Advertising Style
                </label>
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value as AdStyle)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-sky-50/60 border border-sky-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                >
                  {AD_STYLES.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.label} {st.isPro ? '(PRO ⭐)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Primary Action Button: Create Advertisement */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              id="generate-ad-btn"
              className="gold-gradient-btn w-full py-3.5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Creating Campaign...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-white" />
                  <span>Create Advertisement</span>
                </>
              )}
            </button>

          </div>
        </div>

        {/* Right Output Stage Column */}
        <div className="lg:col-span-6 space-y-4">
          
          {!generatedAd && !isGenerating ? (
            <div className="rounded-3xl bg-white border border-sky-100 p-8 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)] text-center flex flex-col items-center justify-center min-h-[420px]">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center justify-center mb-3 text-3xl shadow-xs">
                📢
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900">
                Advertising Creative Studio
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1 mb-4">
                Generate high-converting promotional copy, WhatsApp messages, social posts, or downloadable visual flyers.
              </p>
              <button
                onClick={handleGenerate}
                className="gold-gradient-btn px-5 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 fill-white" />
                <span>Create Advertisement</span>
              </button>
            </div>
          ) : (
            <div className="rounded-3xl bg-white border border-sky-100 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)] space-y-4">
              
              {/* Campaign Result Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200/80">
                    {selectedType}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {selectedStyle} Style
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    id="ad-regenerate-btn"
                    className="p-2 rounded-xl text-slate-500 hover:text-amber-800 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-colors cursor-pointer"
                    title="Regenerate"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    id="ad-edit-btn"
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      isEditing ? 'bg-amber-600 text-white' : 'text-slate-500 hover:bg-sky-50'
                    }`}
                    title="Edit copy"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* DEDICATED WHATSAPP AD VIEWER */}
              {(activeMode === 'whatsapp' || generatedAd?.formattedWhatsAppText) && (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-800 flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-emerald-600" /> Ready-to-Share WhatsApp Promo
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium">1-Click Direct Share</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white text-slate-800 text-xs font-mono whitespace-pre-wrap leading-relaxed border border-emerald-200 shadow-2xs">
                    {generatedAd?.formattedWhatsAppText}
                  </div>

                  {/* WhatsApp Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyText(generatedAd?.formattedWhatsAppText || '', 'whatsapp')}
                      id="whatsapp-copy-btn"
                      className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      {copiedKey === 'whatsapp' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'whatsapp' ? 'Copied' : 'Copy Message'}</span>
                    </button>

                    <button
                      onClick={handleShareToWhatsApp}
                      id="share-to-whatsapp-btn"
                      className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs transition-all hover:scale-[1.01] cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Share to WhatsApp</span>
                    </button>
                  </div>
                </div>
              )}

              {/* PROMOTIONAL FLYER VISUAL CARD */}
              {(activeMode === 'flyer' || generatedAd?.flyerLayout) && (
                <div className="rounded-2xl bg-[#0B192C] border border-slate-700/80 p-5 space-y-3 text-white shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-400" /> Promotional Flyer Visual
                    </span>
                    <button
                      onClick={handleDownloadFlyer}
                      id="flyer-download-btn"
                      className="text-[11px] font-bold text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download Flyer PNG</span>
                    </button>
                  </div>

                  {/* Flyer Visual Preview Canvas Box */}
                  <div className="rounded-xl overflow-hidden border border-slate-700 bg-gradient-to-b from-[#0B192C] to-[#1E3E62] p-5 space-y-3 text-center shadow-lg">
                    <div className="inline-block px-3 py-1 rounded-full bg-[#D4AF37] text-slate-950 font-extrabold text-[10px] tracking-wider uppercase mb-1">
                      {generatedAd?.flyerLayout?.badgeText || specialOffer || 'LIMITED OFFER'}
                    </div>

                    <h2 className="font-display text-lg sm:text-xl font-extrabold text-white">
                      {editedHeadline || generatedAd?.headline}
                    </h2>

                    <p className="text-xs font-bold text-amber-300">
                      {businessName} • {productService}
                    </p>

                    <div className="space-y-1.5 text-left bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-xs text-slate-200">
                      {(generatedAd?.bulletPoints || []).map((pt: string, idx: number) => (
                        <p key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-400">✓</span> {pt}
                        </p>
                      ))}
                    </div>

                    {price && (
                      <div className="p-2 rounded-lg bg-[#0B192C]/90 border border-amber-500/40 text-center">
                        <span className="text-sm font-extrabold text-amber-400">{price}</span>
                      </div>
                    )}

                    <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-800 flex items-center justify-between">
                      <span>📲 {contactInfo}</span>
                      <span>📍 {location}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Standard Ad Copy Details */}
              <div className="space-y-3">
                {/* Headline */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Headline
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedHeadline}
                      onChange={(e) => setEditedHeadline(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-sky-50 border border-sky-200 text-xs font-bold text-slate-900"
                    />
                  ) : (
                    <h3 className="text-sm font-bold text-slate-900">
                      {editedHeadline || generatedAd?.headline}
                    </h3>
                  )}
                </div>

                {/* Body Text */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Ad Copy / Body
                  </label>
                  {isEditing ? (
                    <textarea
                      rows={4}
                      value={editedBody}
                      onChange={(e) => setEditedBody(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-sky-50 border border-sky-200 text-xs font-medium text-slate-900 resize-none"
                    />
                  ) : (
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {editedBody || generatedAd?.bodyText}
                    </p>
                  )}
                </div>

                {/* Bullet Points */}
                {generatedAd?.bulletPoints && generatedAd.bulletPoints.length > 0 && (
                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold uppercase text-slate-500">
                      Key Highlights
                    </label>
                    <div className="grid grid-cols-1 gap-1">
                      {generatedAd.bulletPoints.map((bp: string, i: number) => (
                        <div key={i} className="text-xs text-slate-700 flex items-center gap-1.5">
                          <span className="text-emerald-600 font-bold">✓</span> {bp}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Call to Action & Hashtags */}
                <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600">Call to Action:</span>
                    <span className="font-bold text-amber-800">
                      {generatedAd?.callToAction}
                    </span>
                  </div>

                  {generatedAd?.hashtags && (
                    <div className="flex flex-wrap gap-1 pt-1 border-t border-sky-200/60">
                      {generatedAd.hashtags.map((tag: string, idx: number) => (
                        <span key={idx} className="text-[10px] font-semibold text-slate-500">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer: [Save], [Copy], [Download] */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <button
                  onClick={handleSaveToProjects}
                  id="ad-save-btn"
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Save Project</span>
                </button>

                <button
                  onClick={() => handleCopyText(`${editedHeadline || generatedAd?.headline || ''}\n\n${editedBody || generatedAd?.bodyText || ''}\n\n${generatedAd?.callToAction || ''}\n\n${(generatedAd?.hashtags || []).join(' ')}`, 'all_copy')}
                  id="ad-copy-all-btn"
                  className="py-2.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedKey === 'all_copy' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'all_copy' ? 'Copied' : 'Copy Copy'}</span>
                </button>

                <button
                  onClick={handleDownloadFlyer}
                  id="ad-download-btn"
                  className="py-2.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
