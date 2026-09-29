import React, { useState } from 'react';
import { 
  FolderKanban, 
  Palette, 
  Megaphone, 
  FileText, 
  FileCheck, 
  Trash2, 
  Download, 
  Share2, 
  Copy, 
  Eye, 
  Clock, 
  Search, 
  Plus, 
  ExternalLink,
  Crown,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProjectItem, GeneratedLogo, GeneratedAdvertisement } from '../types';

export const MyProjects: React.FC = () => {
  const { 
    projects, 
    logos, 
    advertisements, 
    deleteProject, 
    deleteLogo, 
    saveProject, 
    isPro, 
    setShowProModal, 
    addToast,
    navigateToTool 
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<'all' | 'logo' | 'advertisement' | 'flyer' | 'growth_doc'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewProject, setPreviewProject] = useState<ProjectItem | null>(null);

  const categories = [
    { id: 'all', label: 'All Projects', count: projects.length },
    { id: 'logo', label: 'Logos (My Designs)', count: projects.filter(p => p.project_type === 'logo').length },
    { id: 'advertisement', label: 'Advertisements', count: projects.filter(p => p.project_type === 'advertisement').length },
    { id: 'flyer', label: 'Promotional Flyers', count: projects.filter(p => p.project_type === 'flyer').length },
    { id: 'growth_doc', label: 'Business Documents', count: projects.filter(p => p.project_type === 'growth_doc').length },
  ];

  const filteredProjects = projects.filter(p => {
    const matchesCategory = activeCategory === 'all' || p.project_type === activeCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDuplicate = async (proj: ProjectItem) => {
    try {
      await saveProject({
        title: `${proj.title} (Copy)`,
        project_type: proj.project_type,
        content: proj.content,
      });
      addToast('Project duplicated successfully!', 'success');
    } catch (e) {
      addToast('Unable to duplicate project.', 'error');
    }
  };

  const handleDownloadItem = (proj: ProjectItem) => {
    try {
      const parsed = JSON.parse(proj.content);
      if (proj.project_type === 'logo' && parsed.svg_code) {
        const blob = new Blob([parsed.svg_code], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${proj.title.toLowerCase().replace(/\s+/g, '_')}.svg`;
        a.click();
        URL.revokeObjectURL(url);
        addToast('Logo SVG downloaded!', 'success');
      } else {
        const textToSave = typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2);
        const blob = new Blob([textToSave], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${proj.title.toLowerCase().replace(/\s+/g, '_')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        addToast('Document downloaded!', 'success');
      }
    } catch (e) {
      addToast('Download completed.', 'info');
    }
  };

  const handleShareItem = (proj: ProjectItem) => {
    if (navigator.share) {
      navigator.share({
        title: proj.title,
        text: `Check out our business asset created with BIZNIX: ${proj.title}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${proj.title} - Created with BIZNIX`);
      addToast('Project details copied to clipboard!', 'info');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-sky-100 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
              My Projects Library
            </h1>
            <span className="gold-badge shadow-xs">
              {projects.length} Saved Assets
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access, edit, duplicate, and export all your logos, promotional ads, flyers, and strategy blueprints.
          </p>
        </div>

        <button
          onClick={() => navigateToTool('create', 'logo')}
          className="gold-gradient-btn self-start sm:self-auto px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Brand Asset</span>
        </button>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white border border-sky-100 text-slate-700 hover:bg-sky-50 shadow-2xs'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-sky-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Project Cards Grid */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-3xl bg-white border border-sky-100 p-12 text-center shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)]">
          <FolderKanban className="w-12 h-12 text-amber-500/60 mx-auto mb-3" />
          <h3 className="font-display text-base font-bold text-slate-900">
            No projects in this category
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-4">
            {searchQuery ? 'No matches found for your search query.' : 'Create logos, marketing ads, or business strategies to populate your library.'}
          </p>
          <button
            onClick={() => navigateToTool('create', 'logo')}
            className="gold-gradient-btn px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
          >
            Create First Asset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((proj) => {
            const isLogo = proj.project_type === 'logo';
            let parsed: any = {};
            try {
              parsed = JSON.parse(proj.content);
            } catch (e) {}

            return (
              <div
                key={proj.id}
                className="group rounded-3xl bg-white border border-sky-100 p-4 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)] hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Visual Header / Thumbnail */}
                  {isLogo && parsed.svg_code ? (
                    <div 
                      className="w-full h-36 rounded-2xl bg-slate-900 p-3 flex items-center justify-center mb-3 shadow-inner overflow-hidden cursor-pointer"
                      onClick={() => setPreviewProject(proj)}
                      dangerouslySetInnerHTML={{ __html: parsed.svg_code }}
                    />
                  ) : (
                    <div 
                      className="w-full h-24 rounded-2xl bg-sky-50/70 border border-sky-100 p-3 flex items-center justify-center mb-3 cursor-pointer"
                      onClick={() => setPreviewProject(proj)}
                    >
                      {proj.project_type === 'advertisement' ? (
                        <Megaphone className="w-8 h-8 text-amber-600 opacity-80" />
                      ) : proj.project_type === 'flyer' ? (
                        <FileText className="w-8 h-8 text-amber-600 opacity-80" />
                      ) : (
                        <FileCheck className="w-8 h-8 text-amber-600 opacity-80" />
                      )}
                    </div>
                  )}

                  {/* Title & Metadata */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-sky-50 text-slate-700 border border-sky-100">
                      {proj.project_type}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(proj.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-amber-700 transition-colors">
                    {proj.title}
                  </h3>

                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                    {typeof parsed.headline === 'string'
                      ? parsed.headline
                      : parsed.description || parsed.slogan || (parsed.executiveSummary ? parsed.executiveSummary.slice(0, 100) : 'Saved business asset')}
                  </p>
                </div>

                {/* Actions Toolbar */}
                <div className="mt-3 pt-2.5 border-t border-sky-100 flex items-center justify-between">
                  <button
                    onClick={() => setPreviewProject(proj)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-amber-800 hover:bg-amber-50 transition-colors cursor-pointer"
                    title="Preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDuplicate(proj)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-amber-800 hover:bg-amber-50 transition-colors cursor-pointer"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDownloadItem(proj)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-amber-800 hover:bg-amber-50 transition-colors cursor-pointer"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleShareItem(proj)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-amber-800 hover:bg-amber-50 transition-colors cursor-pointer"
                    title="Share"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => deleteProject(proj.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-sky-100 rounded-3xl p-6 shadow-2xl text-slate-900 my-8">
            <button
              onClick={() => setPreviewProject(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-sky-50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                {previewProject.project_type}
              </span>
              <h2 className="font-display text-lg font-bold mt-1.5 text-slate-900">
                {previewProject.title}
              </h2>
              <p className="text-xs text-slate-400">
                Created: {new Date(previewProject.created_at).toLocaleString()}
              </p>
            </div>

            {/* Content Display */}
            {(() => {
              try {
                const parsed = JSON.parse(previewProject.content);
                if (previewProject.project_type === 'logo' && parsed.svg_code) {
                  return (
                    <div className="w-full h-64 bg-slate-900 rounded-2xl p-4 flex items-center justify-center border border-slate-800 shadow-inner"
                      dangerouslySetInnerHTML={{ __html: parsed.svg_code }}
                    />
                  );
                }
                return (
                  <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 text-xs font-mono whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed text-slate-800">
                    {typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2)}
                  </div>
                );
              } catch (e) {
                return (
                  <div className="p-4 rounded-2xl bg-sky-50/70 text-xs whitespace-pre-wrap text-slate-800">
                    {previewProject.content}
                  </div>
                );
              }
            })()}

            <div className="mt-5 pt-3 border-t border-sky-100 flex items-center justify-between">
              <button
                onClick={() => handleDownloadItem(previewProject)}
                className="gold-gradient-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Asset</span>
              </button>

              <button
                onClick={() => setPreviewProject(null)}
                className="px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-slate-700 text-xs font-bold cursor-pointer border border-sky-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
