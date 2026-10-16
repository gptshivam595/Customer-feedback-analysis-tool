import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { AnalysisRun, DocumentRecord } from '../types';

interface DashboardViewProps {
  documents: DocumentRecord[];
  analysis: AnalysisRun | null;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  onDownloadExcel: () => void;
  onReset: () => void;
  onNavigateTab: (tab: 'dashboard' | 'documents' | 'results' | 'explorer' | 'settings') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  documents,
  analysis,
  isAnalyzing,
  onAnalyze,
  onDownloadExcel,
  onReset,
  onNavigateTab,
}) => {
  const loadedDocsCount = documents.length;
  const totalExtractedCount = documents.reduce((acc, d) => acc + d.review_count_detected, 0);
  const analyzedReviewsCount = analysis?.total_unique_reviews || 0;
  const hasReport = Boolean(analysis && analysis.status === 'completed');

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner with Clean Prose */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold text-indigo-600 tracking-wider uppercase mb-1">
            Customer Feedback Research & Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 balance mb-3">
            Review Intelligence Analyzer
          </h1>
          <p className="text-base text-slate-600 leading-relaxed mb-6">
            Turn customer feedback into evidence-backed product insights. Ingest multi-source review documents, detect candidate entries, classify sentiment, map journey stages, and generate prioritized action plans.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onAnalyze}
              disabled={isAnalyzing || loadedDocsCount === 0}
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-all shadow-sm ${
                isAnalyzing || loadedDocsCount === 0
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-98'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              {isAnalyzing ? 'Running Analysis Pipeline...' : 'Analyze Reviews'}
            </button>

            <button
              onClick={onDownloadExcel}
              disabled={!hasReport}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                hasReport
                  ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-xs'
                  : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Download Excel Report
            </button>

            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Analysis
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Loaded Documents
            </span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {loadedDocsCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {loadedDocsCount > 0 ? 'Ready for processing' : 'Upload or load defaults'}
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Extracted Records
            </span>
            <Sparkles className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {totalExtractedCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Candidate review units detected
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Analyzed Unique Reviews
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {analyzedReviewsCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {analysis?.total_duplicates_excluded
              ? `${analysis.total_duplicates_excluded} duplicates excluded`
              : 'Deduplicated unit denominator'}
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Last Analysis Status
            </span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-base font-semibold text-slate-900 capitalize flex items-center gap-2">
            {analysis?.status === 'completed' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Completed
              </>
            ) : analysis?.status ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                {analysis.status}
              </>
            ) : (
              <span className="text-slate-400 font-normal">Not run yet</span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {analysis?.timestamp ? new Date(analysis.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ready to start'}
          </div>
        </div>
      </div>

      {/* When results are available, show high-impact summary preview */}
      {hasReport && analysis && (
        <div className="space-y-6">
          {/* Executive Narrative Callout */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">
                Executive Synthesis
              </h2>
              <button
                onClick={() => onNavigateTab('results')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                View Full Results <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              {analysis.executive_summary}
            </p>
          </div>

          {/* Quick 2-Column: Strengths vs Urgent Opportunities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Strengths */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Core Product Strengths to Preserve
                </h3>
              </div>
              <div className="space-y-4">
                {analysis.strengths.slice(0, 3).map((st, i) => (
                  <div key={i} className="pb-3 border-b border-slate-100 last:border-b-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-900">{st.theme}</span>
                      <span className="text-slate-500 font-mono tabular-nums">
                        {st.review_count} reviews ({st.sample_percentage}%)
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-1">{st.why_valued}</p>
                    {st.quotes[0] && (
                      <p className="text-xs italic text-slate-500 border-l-2 border-emerald-400 pl-2 mt-1">
                        "{st.quotes[0]}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Top Opportunities */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  High-Priority Improvement Opportunities
                </h3>
              </div>
              <div className="space-y-4">
                {analysis.opportunities.slice(0, 3).map((op, i) => (
                  <div key={i} className="pb-3 border-b border-slate-100 last:border-b-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">#{op.rank} {op.theme}</span>
                        <span className="text-xs px-1.5 py-0.2 bg-rose-50 text-rose-700 rounded font-medium">
                          {op.severity}
                        </span>
                      </div>
                      <span className="text-slate-500 font-mono tabular-nums">
                        Score: {op.priority_score}/100
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-1">{op.problem_statement}</p>
                    <p className="text-xs text-indigo-700 font-medium">
                      Fix: {op.recommended_improvement}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* If no analysis run yet, show helpful guided cards */}
      {!hasReport && (
        <div className="bg-slate-100/60 border border-slate-200 rounded-xl p-6">
          <h2 className="text-sm font-bold text-slate-900 mb-2">
            How to use Review Intelligence Analyzer:
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="text-xs font-semibold text-indigo-600 mb-1">Step 1</div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Source Documents</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                4 default Read AI research documents (Trustpilot, Play Store, tl;dv blog, MeetGeek blog) are ready. You can also upload custom DOCX files.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="text-xs font-semibold text-indigo-600 mb-1">Step 2</div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">AI Pipeline</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Click "Analyze Reviews" to segment candidate reviews, deduplicate, classify themes & sentiment with Groq Llama-3.3, and run QA verification.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="text-xs font-semibold text-indigo-600 mb-1">Step 3</div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Export Excel Report</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Download a clean, structured 6-sheet Excel workbook with frozen headers, conditional formats, and traceable quote citations.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
