import React, { useState } from 'react';
import { 
  Palette, 
  Sparkles, 
  RefreshCw, 
  Edit3, 
  Bookmark, 
  Download, 
  Share2, 
  Crown, 
  Check, 
  Sliders, 
  Layers, 
  Type, 
  Maximize2,
  X,
  FileCode,
  Image as ImageIcon
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LogoStyle, GeneratedLogo } from '../types';
import { api, LogoConceptResponse } from '../lib/api';

const LOGO_STYLES: { id: LogoStyle; label: string; isPro?: boolean; desc: string }[] = [
  { id: 'Modern', label: 'Modern', desc: 'Clean, sleek gradients & typography' },
  { id: 'Minimal', label: 'Minimal', desc: 'Pure essential shapes & high contrast' },
  { id: 'Luxury', label: 'Luxury', isPro: true, desc: 'Gold monograms & refined crests' },
  { id: 'Corporate', label: 'Corporate', desc: 'Trustworthy, balanced enterprise marks' },
  { id: 'Technology', label: 'Technology', desc: 'Futuristic vectors & tech iconography' },
  { id: 'Automotive', label: 'Automotive', isPro: true, desc: 'Dynamic speed lines & metallic shields' },
  { id: 'Fashion', label: 'Fashion', desc: 'Editorial typography & haute couture' },
  { id: 'Restaurant', label: 'Restaurant', desc: 'Culinary emblems & warm artisan vibes' },
  { id: 'Real Estate', label: 'Real Estate', isPro: true, desc: 'Architectural geometry & luxury estates' },
  { id: 'Gaming', label: 'Gaming', isPro: true, desc: 'Bold esports mascot & vibrant badges' },
  { id: 'Creative', label: 'Creative', desc: 'Abstract dynamic art & vivid palettes' },
  { id: '3D', label: '3D', isPro: true, desc: 'Depth, isometric volume & lighting' },
];

const PRESET_PALETTES = [
  { name: 'Imperial Gold', colors: ['#d97706', '#18181b', '#fbbf24'] },
  { name: 'Navy & Gold', colors: ['#0B192C', '#D4AF37', '#1E3E62'] },
  { name: 'Indigo Pulse', colors: ['#6366f1', '#0f172a', '#38bdf8'] },
  { name: 'Emerald Luxe', colors: ['#059669', '#064e3b', '#34d399'] },
  { name: 'Charcoal Minimal', colors: ['#1e293b', '#f8fafc', '#94a3b8'] },
  { name: 'Sunset Amber', colors: ['#f59e0b', '#fb923c', '#4c0519'] },
];

export const LogoCreator: React.FC = () => {
  const { user, isPro, saveLogo, setShowProModal, addToast, navigateToTool } = useApp();

  // Form State
  const [businessName, setBusinessName] = useState(user.business_name || 'Apex Studios');
  const [category, setCategory] = useState(user.business_category || 'Creative Design & Tech');
  const [description, setDescription] = useState('An elite branding and digital innovation studio creating high-impact solutions.');
  const [selectedStyle, setSelectedStyle] = useState<LogoStyle>('Modern');
  const [selectedPalette, setSelectedPalette] = useState<string[]>(PRESET_PALETTES[0].colors);
  const [slogan, setSlogan] = useState('Crafting the Future of Brands');

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [concepts, setConcepts] = useState<LogoConceptResponse[]>([]);
  const [activeConceptIndex, setActiveConceptIndex] = useState(0);

  // Editor Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editedSvg, setEditedSvg] = useState('');
  const [bgMode, setBgMode] = useState<'dark' | 'light' | 'transparent'>('dark');

  const activeConcept = concepts[activeConceptIndex];

  const handleGenerate = async () => {
    if (!businessName.trim()) {
      addToast('Please enter your business name.', 'error');
      return;
    }

    const styleObj = LOGO_STYLES.find(s => s.id === selectedStyle);
    if (styleObj?.isPro && !isPro) {
      setShowProModal(true);
      return;
    }

    setIsGenerating(true);
    try {
      const generated = await api.generateLogo({
        businessName,
        category,
        description,
        style: selectedStyle,
        colors: selectedPalette,
        slogan,
        isPro
      });

      setConcepts(generated);
      setActiveConceptIndex(0);
      setEditedSvg(generated[0]?.svgCode || '');
      addToast('3 new AI Logo concepts created!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Unable to generate your logo.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToDesigns = async () => {
    if (!activeConcept) return;

    try {
      const svgToSave = isEditing && editedSvg ? editedSvg : activeConcept.svgCode;
      await saveLogo({
        business_name: businessName,
        slogan,
        category,
        style: selectedStyle,
        colors: selectedPalette,
        svg_code: svgToSave,
        description: activeConcept.description,
        font_style: activeConcept.fontStyle,
        icon_name: activeConcept.iconName,
        is_favorite: true
      });
    } catch (err: any) {
      addToast(err.message || 'Unable to save logo.', 'error');
    }
  };

  const handleDownload = (format: 'svg' | 'png' | 'hd_png') => {
    if (!activeConcept) return;

    if (format === 'hd_png' && !isPro) {
      setShowProModal(true);
      return;
    }

    const currentSvg = isEditing && editedSvg ? editedSvg : activeConcept.svgCode;

    if (format === 'svg') {
      const blob = new Blob([currentSvg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${businessName.toLowerCase().replace(/\s+/g, '_')}_logo.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast('Vector SVG downloaded successfully!', 'success');
    } else {
      const scale = format === 'hd_png' ? 4 : 2;
      const size = 300 * scale;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      const svgBlob = new Blob([currentSvg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.drawImage(img, 0, 0, size, size);
        URL.revokeObjectURL(url);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `${businessName.toLowerCase().replace(/\s+/g, '_')}_logo_${format === 'hd_png' ? 'HD' : 'standard'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast(`${format === 'hd_png' ? '4K Ultra-HD' : 'PNG'} Logo downloaded!`, 'success');
      };
      img.src = url;
    }
  };

  const handleShare = async () => {
    if (!activeConcept) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${businessName} Logo`,
          text: `Check out our new brand identity created with BIZNIX: ${slogan || businessName}`,
          url: window.location.href,
        });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(`${businessName} Logo - Created with BIZNIX`);
      addToast('Brand details copied to clipboard!', 'info');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#0B1728] p-5 rounded-3xl border border-amber-500/20 shadow-[0_6px_24px_rgba(0,0,0,0.4)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
              AI Logo Creator
            </h1>
            <span className="gold-badge shadow-xs">
              ⭐ Vector & 3D
            </span>
          </div>
          <p className="text-xs sm:text-sm text-sky-300/80 mt-1">
            Generate high-resolution, industry-tailored brand logos in seconds with custom styles and vectors.
          </p>
        </div>

        <button
          onClick={() => navigateToTool('profile', 'logos')}
          className="self-start sm:self-auto text-xs font-bold text-amber-300 hover:text-amber-200 cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30"
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>My Designs</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Inputs Column */}
        <div className="lg:col-span-6 space-y-5">
          <div className="rounded-3xl bg-[#0B1728] border border-amber-500/20 p-5 sm:p-6 shadow-[0_6px_24px_rgba(0,0,0,0.4)] space-y-4">
            
            {/* Business Name */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-sky-200 mb-1.5">
                Business Name <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g., Apex Studios, Zenith Cafe, NovaTech"
                className="w-full px-4 py-3 rounded-2xl bg-[#081220] border border-sky-500/20 text-sm font-semibold text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
              />
            </div>

            {/* Business Category & Slogan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-sky-200 mb-1.5">
                  Business Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Technology, Fashion, Real Estate"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#081220] border border-sky-500/20 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-sky-200 mb-1.5">
                  Optional Slogan
                </label>
                <input
                  type="text"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  placeholder="e.g., Quality You Can Trust"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#081220] border border-sky-500/20 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                />
              </div>
            </div>

            {/* Business Description */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-sky-200 mb-1.5">
                Business Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your brand personality, core offerings, and customer audience..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#081220] border border-sky-500/20 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none transition-all"
              />
            </div>

            {/* Logo Styles (12 options) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-sky-200">
                  Logo Style ({LOGO_STYLES.length} Styles)
                </label>
                <span className="text-[11px] text-sky-300/60">Select visual direction</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {LOGO_STYLES.map((st) => {
                  const isSelected = selectedStyle === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        if (st.isPro && !isPro) {
                          setShowProModal(true);
                          return;
                        }
                        setSelectedStyle(st.id);
                      }}
                      className={`relative p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-400 bg-amber-400/15 ring-2 ring-amber-400/40 text-amber-300'
                          : 'border-sky-500/15 bg-[#081220] hover:border-amber-400/50 hover:bg-[#0F223D] text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                          {st.label}
                        </span>
                        {st.isPro && (
                          <span className="inline-flex items-center text-[10px] font-extrabold text-amber-400">
                            ⭐ PRO
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-sky-300/60 line-clamp-1 mt-0.5">
                        {st.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preferred Colors */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-sky-200 mb-2">
                Preferred Color Palette
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_PALETTES.map((pal, idx) => {
                  const isSelected = JSON.stringify(selectedPalette) === JSON.stringify(pal.colors);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPalette(pal.colors)}
                      className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-amber-400 bg-amber-400/15 ring-1 ring-amber-400/50' 
                          : 'border-sky-500/15 bg-[#081220] hover:border-amber-400/50'
                      }`}
                    >
                      <span className="text-[11px] font-bold text-slate-200 truncate mr-2">
                        {pal.name}
                      </span>
                      <div className="flex items-center -space-x-1">
                        {pal.colors.map((c, ci) => (
                          <div 
                            key={ci} 
                            className="w-3.5 h-3.5 rounded-full border border-[#0B1728] shadow-xs" 
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Action Button in GOLD */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              id="generate-logo-submit-btn"
              className="gold-gradient-btn w-full py-3.5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-[#060D19]"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#060D19]" />
                  <span>Generating Vector Logos...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-[#060D19] text-[#060D19]" />
                  <span>Generate Logo</span>
                </>
              )}
            </button>

          </div>
        </div>

        {/* Right Preview Column */}
        <div className="lg:col-span-6 space-y-4">
          
          {concepts.length === 0 && !isGenerating ? (
            <div className="rounded-3xl bg-[#0B1728] border border-amber-500/20 p-8 shadow-[0_6px_24px_rgba(0,0,0,0.4)] text-center flex flex-col items-center justify-center min-h-[420px]">
              <div className="w-16 h-16 rounded-2xl bg-amber-400/10 text-amber-300 border border-amber-500/30 flex items-center justify-center mb-3 text-3xl shadow-xs">
                🎨
              </div>
              <h3 className="font-display text-lg font-bold text-white">
                Ready to Forge Your Brand
              </h3>
              <p className="text-xs text-sky-300/80 max-w-xs mt-1 mb-4">
                Click "Generate Logo" to create 3 responsive vector designs crafted for {businessName || 'your business'}.
              </p>
              <button
                onClick={handleGenerate}
                className="gold-gradient-btn px-5 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-1.5 text-[#060D19]"
              >
                <Sparkles className="w-3.5 h-3.5 fill-[#060D19]" />
                <span>Generate Logo</span>
              </button>
            </div>
          ) : (
            <div className="rounded-3xl bg-[#0B1728] border border-amber-500/20 p-5 sm:p-6 shadow-[0_6px_24px_rgba(0,0,0,0.4)] space-y-4">
              
              {/* Concept Selector Tabs */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#081220] border border-sky-500/20">
                  {concepts.map((c, idx) => (
                    <button
                      key={c.id || idx}
                      onClick={() => {
                        setActiveConceptIndex(idx);
                        setEditedSvg(c.svgCode);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeConceptIndex === idx
                          ? 'gold-gradient-btn text-[#060D19] shadow-xs'
                          : 'text-sky-300/70 hover:text-white'
                      }`}
                    >
                      Concept {idx + 1}
                    </button>
                  ))}
                </div>

                <span className="text-[11px] text-sky-300/70 font-semibold hidden sm:inline-block">
                  {activeConcept?.title}
                </span>
              </div>

              {/* Logo Visual Stage Canvas */}
              <div className="relative rounded-2xl bg-[#060D19] border border-amber-500/20 p-6 flex flex-col items-center justify-center min-h-[300px] sm:min-h-[340px] shadow-inner overflow-hidden group">
                
                {/* Background Grid Accent */}
                <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

                {activeConcept && (
                  <div 
                    className="w-64 h-64 sm:w-72 sm:h-72 max-w-full flex items-center justify-center transition-transform group-hover:scale-105 duration-300"
                    dangerouslySetInnerHTML={{ 
                      __html: isEditing && editedSvg ? editedSvg : activeConcept.svgCode 
                    }}
                  />
                )}

                {/* Live Concept Meta Pill */}
                {activeConcept && (
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] text-sky-200 bg-[#081220]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-sky-500/20">
                    <span className="font-semibold text-amber-400">{activeConcept.fontStyle}</span>
                    <span className="text-sky-300/70 truncate max-w-[180px]">{activeConcept.description}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons: [Generate/Regenerate], [Edit], [Save], [Download], [Share] */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                
                {/* Regenerate */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  id="logo-regenerate-btn"
                  className="p-2.5 rounded-xl bg-[#081220] hover:bg-[#0F223D] border border-sky-500/20 text-sky-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>Regenerate</span>
                </button>

                {/* Edit */}
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  id="logo-edit-btn"
                  className={`p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isEditing 
                      ? 'bg-amber-500 text-[#060D19]' 
                      : 'bg-[#081220] hover:bg-[#0F223D] border border-sky-500/20 text-sky-200'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Close Editor' : 'Edit Design'}</span>
                </button>

                {/* Save to My Designs */}
                <button
                  onClick={handleSaveToDesigns}
                  id="logo-save-btn"
                  className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Save Design</span>
                </button>

                {/* Share */}
                <button
                  onClick={handleShare}
                  id="logo-share-btn"
                  className="p-2.5 rounded-xl bg-[#081220] hover:bg-[#0F223D] border border-sky-500/20 text-sky-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              </div>

              {/* Download Options Bar */}
              <div className="p-3.5 rounded-2xl bg-[#081220] border border-sky-500/20 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-sky-200 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-amber-400" /> Export Assets
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload('svg')}
                    className="px-3 py-1.5 rounded-lg bg-[#0F223D] border border-sky-500/20 text-[11px] font-bold text-sky-200 hover:text-amber-300 hover:border-amber-400/40 transition-colors cursor-pointer"
                  >
                    SVG Vector
                  </button>

                  <button
                    onClick={() => handleDownload('png')}
                    className="px-3 py-1.5 rounded-lg bg-[#0F223D] border border-sky-500/20 text-[11px] font-bold text-sky-200 hover:text-amber-300 hover:border-amber-400/40 transition-colors cursor-pointer"
                  >
                    PNG Image
                  </button>

                  <button
                    onClick={() => handleDownload('hd_png')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg gold-gradient-btn text-[11px] font-extrabold text-[#060D19] shadow-xs cursor-pointer hover:scale-102 transition-transform"
                  >
                    <Crown className="w-3 h-3 fill-[#060D19]" />
                    <span>4K Ultra-HD</span>
                  </button>
                </div>
              </div>

              {/* Embedded Live Visual Editor Drawer */}
              {isEditing && activeConcept && (
                <div className="p-4 rounded-2xl bg-[#081220] border border-amber-500/30 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" /> Live Logo Customizer
                    </h4>
                    <span className="text-[10px] text-sky-300/70 font-medium">Instant vector adjustments</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Background Backdrop */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sky-200 mb-1">
                        Backdrop Mode
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['dark', 'light', 'transparent'] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => {
                              if (mode === 'transparent' && !isPro) {
                                setShowProModal(true);
                                return;
                              }
                              setBgMode(mode);
                              const targetBg = mode === 'dark' ? '#060d19' : mode === 'light' ? '#ffffff' : 'none';
                              setEditedSvg(prev => prev.replace(/fill="#(060d19|0f172a|ffffff|18181b|1e293b|000000)"/g, `fill="${targetBg}"`));
                            }}
                            className={`py-1 rounded-lg text-[10px] font-bold border capitalize cursor-pointer transition-colors ${
                              bgMode === mode 
                                ? 'bg-amber-500 text-[#060D19] border-amber-500 font-extrabold' 
                                : 'bg-[#0F223D] text-sky-200 border-sky-500/20 hover:border-amber-400/50'
                            }`}
                          >
                            {mode} {mode === 'transparent' && '⭐'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quick Palette Swap */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sky-200 mb-1">
                        Swap Accent Color
                      </label>
                      <div className="flex items-center gap-2">
                        {['#d4af37', '#38bdf8', '#10b981', '#f43f5e', '#a855f7', '#ffffff'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              setEditedSvg(prev => prev.replace(/stroke="#[0-9a-fA-F]{6}"/g, `stroke="${c}"`));
                            }}
                            className="w-6 h-6 rounded-full border border-sky-400/40 shadow-2xs cursor-pointer hover:scale-110 transition-transform"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
