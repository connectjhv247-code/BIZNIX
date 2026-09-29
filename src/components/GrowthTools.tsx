import React, { useState } from 'react';
import { 
  Lightbulb, 
  Type, 
  Sparkles, 
  FileCheck, 
  Calendar, 
  Target, 
  Layers, 
  TrendingUp, 
  RefreshCw, 
  Copy, 
  Bookmark, 
  Check, 
  ArrowRight,
  Send,
  Zap,
  Users,
  Compass,
  Briefcase,
  Megaphone
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GrowthToolType } from '../types';
import { api } from '../lib/api';

const GROWTH_TOOLS: {
  id: GrowthToolType;
  title: string;
  shortDesc: string;
  icon: any;
  category: string;
}[] = [
  { id: 'idea_generator', title: 'Business Idea Generator', shortDesc: 'Discover high-demand startup ventures based on your skills & market', icon: Lightbulb, category: 'Ideation' },
  { id: 'name_generator', title: 'Business Name Generator', shortDesc: 'Generate catchy, memorable, and available brand names', icon: Type, category: 'Branding' },
  { id: 'slogan_generator', title: 'Slogan & Tagline Maker', shortDesc: 'Create punchy, high-converting slogans that stick in minds', icon: Sparkles, category: 'Branding' },
  { id: 'business_plan', title: 'Executive Business Plan', shortDesc: 'Full 6-pillar business plan with ops, marketing & growth roadmaps', icon: FileCheck, category: 'Strategy' },
  { id: 'marketing_planner', title: 'Marketing Planner', shortDesc: 'Weekly calendars, monthly campaigns & omni-channel schedules', icon: Calendar, category: 'Growth' },
  { id: 'customer_targeting', title: 'Customer Targeting Tool', shortDesc: 'Identify high-value customer avatars, needs, & acquisition funnels', icon: Target, category: 'Audience' },
  { id: 'product_description', title: 'Product Description AI', shortDesc: 'Compelling, sales-focused product & service descriptions', icon: Layers, category: 'Sales' },
  { id: 'growth_strategy', title: 'Expansion & Growth Playbook', shortDesc: 'Retention loops, scaling tactics, and market expansion playbooks', icon: TrendingUp, category: 'Scale' },
];

export const GrowthTools: React.FC = () => {
  const { 
    user, 
    activeGrowthTool, 
    setActiveGrowthTool, 
    saveProject, 
    addToast,
    navigateToTool 
  } = useApp();

  // Input states
  const [inputs, setInputs] = useState<Record<string, string>>({
    industry: user.business_category || 'Creative Design & Technology',
    interests: 'AI, Branding, Mobile Apps, Local Business Growth',
    skills: 'Design, Marketing, Leadership, Sales',
    location: 'North America / Global Online',
    businessName: user.business_name || 'Apex Studios',
    keywords: 'modern, premium, innovative, reliable',
    style: 'Modern & Catchy',
    taglineTheme: 'Visionary, Trustworthy, Bold',
    productName: 'All-in-One Brand Identity Kit',
    productFeatures: 'Vector Logo, 30-Day Marketing Roadmap, Custom WhatsApp Ads, Social Graphics',
    audience: 'Entrepreneurs, Small Business Owners, Agency Founders',
    goals: 'Reach 1,000 active clients in 12 months, build recurring revenue'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const currentTool = GROWTH_TOOLS.find(t => t.id === activeGrowthTool) || GROWTH_TOOLS[0];

  const handleInputChange = (field: string, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await api.generateGrowthTool({
        toolType: activeGrowthTool,
        inputs,
        businessName: inputs.businessName || user.business_name
      });
      setOutput(result);
      addToast(`${currentTool.title} generated successfully!`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Unable to generate tool output.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    addToast('Copied to clipboard!', 'info');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSaveToProjects = async () => {
    if (!output) return;
    try {
      await saveProject({
        title: `${currentTool.title} - ${inputs.businessName || 'BIZNIX Blueprint'}`,
        project_type: 'growth_doc',
        content: JSON.stringify({
          tool: activeGrowthTool,
          title: currentTool.title,
          inputs,
          output,
          createdAt: new Date().toISOString()
        })
      });
      addToast('Saved to My Projects!', 'success');
    } catch (e: any) {
      addToast(e.message || 'Unable to save to projects.', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-sky-100 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
              Business Growth Tools
            </h1>
            <span className="gold-badge shadow-xs">
              ⭐ 8 Strategic Engines
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Build executive business plans, uncover viral ideas, target high-paying customers, and scale revenue.
          </p>
        </div>
      </div>

      {/* 8 Growth Tools Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {GROWTH_TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isSelected = activeGrowthTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => {
                setActiveGrowthTool(tool.id);
                setOutput(null);
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-amber-500 bg-amber-50/90 ring-2 ring-amber-400/30 shadow-xs'
                  : 'border-sky-100 bg-white hover:border-amber-300 hover:bg-amber-50/30 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl ${
                  isSelected ? 'bg-amber-500 text-white' : 'bg-sky-50 text-slate-700'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-sky-50 text-slate-600 border border-sky-100">
                  {tool.category}
                </span>
              </div>
              <div>
                <h4 className={`text-xs font-bold ${isSelected ? 'text-amber-900' : 'text-slate-900'}`}>
                  {tool.title}
                </h4>
                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                  {tool.shortDesc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Inputs Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl bg-white border border-sky-100 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)] space-y-4">
            
            <div className="flex items-center gap-2 pb-2 border-b border-sky-100">
              {React.createElement(currentTool.icon, { className: "w-5 h-5 text-amber-600" })}
              <h3 className="font-display text-sm font-bold text-slate-900">
                {currentTool.title} Inputs
              </h3>
            </div>

            {/* Inputs based on tool type */}
            {activeGrowthTool === 'idea_generator' && (
              <>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Industry / Passion
                  </label>
                  <input
                    type="text"
                    value={inputs.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    placeholder="e.g., Tech, Food, Wellness, E-commerce"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-sky-50/60 border border-sky-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Your Skills & Superpowers
                  </label>
                  <input
                    type="text"
                    value={inputs.skills}
                    onChange={(e) => handleInputChange('skills', e.target.value)}
                    placeholder="e.g., Social media, sales, coding, baking"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-sky-50/60 border border-sky-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Location / Target Market
                  </label>
                  <input
                    type="text"
                    value={inputs.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g., Downtown Austin, Online Global"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-sky-50/60 border border-sky-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  />
                </div>
              </>
            )}

            {(activeGrowthTool === 'name_generator' || activeGrowthTool === 'slogan_generator') && (
              <>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Business / Concept Name
                  </label>
                  <input
                    type="text"
                    value={inputs.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    placeholder="e.g., Apex Studios"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-sky-50/60 border border-sky-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Core Keywords & Vibe
                  </label>
                  <input
                    type="text"
                    value={inputs.keywords}
                    onChange={(e) => handleInputChange('keywords', e.target.value)}
                    placeholder="e.g., modern, high-tech, luxury, approachable"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-sky-50/60 border border-sky-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  />
                </div>
              </>
            )}

            {(activeGrowthTool === 'business_plan' || activeGrowthTool === 'marketing_planner' || activeGrowthTool === 'growth_strategy' || activeGrowthTool === 'customer_targeting') && (
              <>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={inputs.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    placeholder="e.g., Apex Studios"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-sky-50/60 border border-sky-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Industry / Offering
                  </label>
                  <input
                    type="text"
                    value={inputs.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    placeholder="e.g., Creative Design & Technology Services"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-sky-50/60 border border-sky-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Target Customers / Audience
                  </label>
                  <input
                    type="text"
                    value={inputs.audience}
                    onChange={(e) => handleInputChange('audience', e.target.value)}
                    placeholder="e.g., Founders, busy professionals, local retail"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-sky-50/60 border border-sky-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Primary 12-Month Goal
                  </label>
                  <input
                    type="text"
                    value={inputs.goals}
                    onChange={(e) => handleInputChange('goals', e.target.value)}
                    placeholder="e.g., Acquire 500 recurring clients, launch app"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-sky-50/60 border border-sky-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  />
                </div>
              </>
            )}

            {activeGrowthTool === 'product_description' && (
              <>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Product / Service Name
                  </label>
                  <input
                    type="text"
                    value={inputs.productName}
                    onChange={(e) => handleInputChange('productName', e.target.value)}
                    placeholder="e.g., Ultimate Brand Kit"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-sky-50/60 border border-sky-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Key Features & Materials
                  </label>
                  <textarea
                    rows={3}
                    value={inputs.productFeatures}
                    onChange={(e) => handleInputChange('productFeatures', e.target.value)}
                    placeholder="List bullet points, benefits, what is included..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-sky-50/60 border border-sky-200/80 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white resize-none transition-all"
                  />
                </div>
              </>
            )}

            {/* Action [Generate] */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              id="growth-tool-generate-btn"
              className="gold-gradient-btn w-full py-3.5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Strategy...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-white" />
                  <span>Generate {currentTool.title}</span>
                </>
              )}
            </button>

          </div>
        </div>

        {/* Right Output Column */}
        <div className="lg:col-span-7 space-y-4">
          
          {!output && !isGenerating ? (
            <div className="rounded-3xl bg-white border border-sky-100 p-8 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)] text-center flex flex-col items-center justify-center min-h-[420px]">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center justify-center mb-3 text-3xl shadow-xs">
                📈
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900">
                {currentTool.title}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1 mb-4">
                {currentTool.shortDesc}. Click Generate to produce your strategic analysis.
              </p>
              <button
                onClick={handleGenerate}
                className="gold-gradient-btn px-5 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 fill-white" />
                <span>Generate Strategy</span>
              </button>
            </div>
          ) : (
            <div className="rounded-3xl bg-white border border-sky-100 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)] space-y-4">
              
              <div className="flex items-center justify-between border-b border-sky-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200/80">
                    {currentTool.title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveToProjects}
                    id="growth-save-btn"
                    className="p-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Save Project</span>
                  </button>
                </div>
              </div>

              {/* RENDER DIVERSE OUTPUT TYPES */}

              {/* 1. Name Generator Output */}
              {activeGrowthTool === 'name_generator' && Array.isArray(output.names) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {output.names.map((item: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-extrabold text-amber-900">{item.name}</h4>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-700 border border-sky-100">{item.style}</span>
                        </div>
                        <p className="text-xs font-medium text-slate-700">{item.tagline}</p>
                        <p className="text-[10px] text-slate-500 mt-1 italic">{item.rationale}</p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-sky-200/60 flex items-center justify-between">
                        <button
                          onClick={() => handleCopy(`${item.name} - ${item.tagline}`, `name_${idx}`)}
                          className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey === `name_${idx}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === `name_${idx}` ? 'Copied' : 'Copy'}</span>
                        </button>
                        <button
                          onClick={() => {
                            navigateToTool('create', 'logo');
                          }}
                          className="text-[11px] font-bold text-amber-700 hover:text-amber-900 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Make Logo</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 2. Slogan Generator Output */}
              {activeGrowthTool === 'slogan_generator' && Array.isArray(output.slogans) && (
                <div className="space-y-2">
                  {output.slogans.map((slog: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">{slog.category}</span>
                          <span className="text-[10px] text-slate-500">{slog.vibe}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">"{slog.slogan}"</h4>
                      </div>
                      <button
                        onClick={() => handleCopy(slog.slogan, `slog_${idx}`)}
                        className="p-2 rounded-xl bg-white border border-sky-200 text-slate-700 hover:text-amber-800 cursor-pointer shrink-0 shadow-2xs"
                      >
                        {copiedKey === `slog_${idx}` ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 3. Business Plan 6-Pillar Document Output */}
              {activeGrowthTool === 'business_plan' && output.executiveSummary && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
                    <h4 className="font-extrabold text-amber-950 uppercase text-[11px] mb-1">Executive Summary</h4>
                    <p className="text-slate-800 leading-relaxed font-medium">{output.executiveSummary}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100">
                      <h5 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-amber-600" /> Target Customers
                      </h5>
                      <p className="text-slate-700 leading-relaxed">{output.targetCustomers}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100">
                      <h5 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-600" /> Products & Services
                      </h5>
                      <p className="text-slate-700 leading-relaxed">{output.productsServices}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100">
                      <h5 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                        <Megaphone className="w-3.5 h-3.5 text-amber-600" /> Marketing Strategy
                      </h5>
                      <p className="text-slate-700 leading-relaxed">{output.marketingStrategy}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100">
                      <h5 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-amber-600" /> Operations Overview
                      </h5>
                      <p className="text-slate-700 leading-relaxed">{output.operationsOverview}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <h4 className="font-extrabold text-emerald-950 uppercase text-[11px] mb-1">Growth & Scaling Roadmap</h4>
                    <p className="text-slate-800 leading-relaxed font-medium">{output.growthStrategy}</p>
                  </div>
                </div>
              )}

              {/* 4. Idea Generator Output */}
              {activeGrowthTool === 'idea_generator' && Array.isArray(output.ideas) && (
                <div className="space-y-3">
                  {output.ideas.map((idea: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900">{idea.title}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">{idea.targetAudience}</span>
                      </div>
                      <p className="text-xs text-slate-700">{idea.description}</p>
                      <div className="p-2.5 rounded-xl bg-white border border-sky-200 text-[11px] text-slate-700">
                        <span className="font-bold text-amber-800">Competitive Edge:</span> {idea.competitiveEdge}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Generic/Rich JSON Fallback formatted cleanly */}
              {!Array.isArray(output.names) && !Array.isArray(output.slogans) && !output.executiveSummary && !Array.isArray(output.ideas) && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-mono max-h-[400px] overflow-y-auto">
                    {JSON.stringify(output, null, 2)}
                  </div>
                </div>
              )}

              {/* Bottom copy all action */}
              <div className="pt-2 border-t border-sky-100 flex items-center justify-end">
                <button
                  onClick={() => handleCopy(JSON.stringify(output, null, 2), 'growth_all')}
                  className="text-xs font-bold text-slate-600 hover:text-amber-800 flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedKey === 'growth_all' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Complete Strategy</span>
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
