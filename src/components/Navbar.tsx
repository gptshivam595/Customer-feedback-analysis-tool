import React from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  Sliders,
  Sparkles,
  Layers,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'documents' | 'results' | 'explorer' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'documents' | 'results' | 'explorer' | 'settings') => void;
  hasResults: boolean;
  onAnalyzeClick: () => void;
  isAnalyzing: boolean;
  onExportClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  hasResults,
  onAnalyzeClick,
  isAnalyzing,
  onExportClick,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-8">
          {/* Brand Zone: 1 text element */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
              Review Intelligence Analyzer
            </span>
          </div>

          {/* Nav Links: 5 clean text items */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'documents'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Source Documents
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'results'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Analysis Results
            </button>
            <button
              onClick={() => setActiveTab('explorer')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'explorer'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Review Explorer
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Settings
            </button>
          </nav>

          {/* Primary Action Zone */}
          <div className="flex items-center gap-3 shrink-0">
            {hasResults && (
              <button
                onClick={onExportClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs whitespace-nowrap"
                title="Download multi-sheet .xlsx audit workbook"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Export Excel
              </button>
            )}

            <button
              onClick={onAnalyzeClick}
              disabled={isAnalyzing}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg transition-all shadow-sm whitespace-nowrap ${
                isAnalyzing
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-98'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Analyze Reviews
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
