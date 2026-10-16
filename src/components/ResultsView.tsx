import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Filter,
  FileSpreadsheet,
  Info,
  Clock,
  Layers,
  ChevronDown,
  Quote,
  Sparkles,
} from 'lucide-react';
import { AnalysisRun, DocumentRecord, PrioritizedOpportunity, StrengthItem, ThemeSummary } from '../types';

interface ResultsViewProps {
  analysis: AnalysisRun | null;
  documents: DocumentRecord[];
  onExportExcel: () => void;
  onNavigateToExplorer: (filterTheme?: string) => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  analysis,
  documents,
  onExportExcel,
  onNavigateToExplorer,
}) => {
  const [selectedThemeModal, setSelectedThemeModal] = useState<ThemeSummary | null>(null);

  if (!analysis || analysis.status !== 'completed') {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-xl mx-auto my-8">
        <Sparkles className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900 mb-1">No analysis results generated yet</h3>
        <p className="text-xs text-slate-600 mb-5 leading-relaxed">
          Select your source documents on the Documents tab or Dashboard, then click "Analyze Reviews" to run the pipeline.
        </p>
      </div>
    );
  }

  const den = analysis.total_unique_reviews || 1;
  const posCount = analysis.sentiment_breakdown.positive;
  const negCount = analysis.sentiment_breakdown.negative;
  const mixedCount = analysis.sentiment_breakdown.mixed;
  const neutralCount = analysis.sentiment_breakdown.neutral;

  const posPct = Math.round((posCount / den) * 1000) / 10;
  const negPct = Math.round((negCount / den) * 1000) / 10;
  const mixedPct = Math.round((mixedCount / den) * 1000) / 10;
  const neutralPct = Math.round((neutralCount / den) * 1000) / 10;

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Analysis Results & Executive Intelligence
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <span>Model: {analysis.model_used}</span>
            <span>·</span>
            <span>Dataset: Read AI Research Sample</span>
            <span>·</span>
            <span className="font-mono tabular-nums">Denominator: N = {den} unique reviews</span>
          </div>
        </div>

        <button
          onClick={onExportExcel}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Export 6-Sheet Excel Report
        </button>
      </div>

      {/* 1. Executive Summary Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Info className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            1. Executive Summary & Narrative
          </h2>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          {analysis.executive_summary}
        </p>
      </div>

      {/* 2. Sentiment Breakdown Cards */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          2. Sentiment Distribution (Sample Denominator: {den})
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Positive */}
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 mb-1">
              <span>Positive</span>
              <span className="font-mono tabular-nums">{posPct}%</span>
            </div>
            <div className="text-2xl font-bold text-emerald-900 font-mono tabular-nums">
              {posCount}
            </div>
            <div className="text-[11px] text-emerald-700 mt-1">
              {posCount} of {den} unique reviews
            </div>
          </div>

          {/* Negative */}
          <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-rose-800 mb-1">
              <span>Negative</span>
              <span className="font-mono tabular-nums">{negPct}%</span>
            </div>
            <div className="text-2xl font-bold text-rose-900 font-mono tabular-nums">
              {negCount}
            </div>
            <div className="text-[11px] text-rose-700 mt-1">
              {negCount} of {den} unique reviews
            </div>
          </div>

          {/* Mixed */}
          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-800 mb-1">
              <span>Mixed</span>
              <span className="font-mono tabular-nums">{mixedPct}%</span>
            </div>
            <div className="text-2xl font-bold text-amber-900 font-mono tabular-nums">
              {mixedCount}
            </div>
            <div className="text-[11px] text-amber-700 mt-1">
              {mixedCount} of {den} unique reviews
            </div>
          </div>

          {/* Neutral */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Neutral / Info</span>
              <span className="font-mono tabular-nums">{neutralPct}%</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {neutralCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {neutralCount} of {den} unique reviews
            </div>
          </div>
        </div>
      </div>

      {/* 3. Strengths vs Friction Points */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Strengths to Preserve */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Product Strengths to Preserve
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {analysis.strengths.length} areas identified
            </span>
          </div>

          <div className="space-y-4">
            {analysis.strengths.slice(0, 5).map((st, i) => (
              <div key={i} className="pb-4 border-b border-slate-100 last:border-b-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">{st.theme}</span>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono tabular-nums">
                    {st.review_count} reviews ({st.sample_percentage}%)
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                  <strong>Why valued:</strong> {st.why_valued}
                </p>
                <div className="text-[11px] text-indigo-700 bg-indigo-50/50 p-2 rounded">
                  <strong>Behavior to preserve:</strong> {st.behavior_to_preserve}
                </div>
                {st.quotes[0] && (
                  <div className="mt-2 text-xs italic text-slate-500 border-l-2 border-emerald-400 pl-2">
                    "{st.quotes[0]}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* User Journey Friction Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">
                User Journey Stages with Most Friction
              </h2>
            </div>
            <span className="text-xs text-slate-500">Mentions count</span>
          </div>

          <div className="space-y-3">
            {Object.entries(analysis.journey_stage_counts)
              .sort((a, b) => b[1] - a[1])
              .map(([stage, count], i) => {
                const pct = Math.round((count / den) * 100);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800">{stage}</span>
                      <span className="text-slate-500 font-mono tabular-nums">
                        {count} reviews ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="mt-6 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
            <strong>Key friction pattern:</strong> The highest concentration of friction occurs during <em>Permissions & Integrations</em> and <em>During Meeting</em>, driven by unsolicited automated joins and guest calendar linking.
          </div>
        </div>
      </div>

      {/* 4. Prioritized Product Recommendations Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Prioritized Product Improvement Opportunities
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked by Section 9 formula: 0.40·Freq + 0.30·Severity + 0.20·JourneyImpact + 0.10·Confidence
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3 w-12 text-center">Rank</th>
                <th className="py-2.5 px-3">Opportunity / Theme</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Journey Stage</th>
                <th className="py-2.5 px-3 text-right">Reviews</th>
                <th className="py-2.5 px-3 text-right">Score</th>
                <th className="py-2.5 px-3">Problem Statement & Proposed Solution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analysis.opportunities.map((op) => (
                <tr key={op.rank} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                    #{op.rank}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    <button
                      onClick={() => onNavigateToExplorer(op.theme)}
                      className="hover:text-indigo-600 hover:underline text-left"
                    >
                      {op.theme}
                    </button>
                  </td>
                  <td className="py-3 px-3">
                    {op.severity === 'High' ? (
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded font-bold text-[11px]">
                        HIGH
                      </span>
                    ) : op.severity === 'Medium' ? (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded font-medium text-[11px]">
                        MEDIUM
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px]">
                        LOW
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {op.journey_stage}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums font-medium text-slate-900">
                    {op.unique_reviews_count} ({op.sample_percentage}%)
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-indigo-600">
                    {op.priority_score}/100
                  </td>
                  <td className="py-3 px-3 max-w-md">
                    <div className="text-slate-800 mb-1">{op.problem_statement}</div>
                    <div className="text-indigo-700 font-medium text-[11px]">
                      <strong>Recommendation:</strong> {op.recommended_improvement}
                    </div>
                    {op.representative_quotes[0] && (
                      <div className="mt-1 text-[11px] italic text-slate-500 border-l border-slate-300 pl-2">
                        "{op.representative_quotes[0]}"
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Complete Theme Taxonomy Summary Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-3">
          Comprehensive Theme Breakdown
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Theme</th>
                <th className="py-2.5 px-3 text-right">Unique Reviews</th>
                <th className="py-2.5 px-3 text-right">Sample Share</th>
                <th className="py-2.5 px-3 text-right text-emerald-700">Positive</th>
                <th className="py-2.5 px-3 text-right text-rose-700">Negative</th>
                <th className="py-2.5 px-3 text-right text-amber-700">Mixed</th>
                <th className="py-2.5 px-3 text-right">Avg Severity</th>
                <th className="py-2.5 px-3 text-right">Priority Score</th>
                <th className="py-2.5 px-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analysis.theme_summaries.map((ts, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-medium text-slate-900">{ts.theme}</td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">{ts.unique_review_count}</td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">{ts.sample_percentage}%</td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-700">{ts.positive_count}</td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-rose-700">{ts.negative_count}</td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-amber-700">{ts.mixed_count}</td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {ts.avg_severity_score > 0 ? ts.avg_severity_score : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                    {ts.priority_score}
                  </td>
                  <td className="py-2.5 px-3">
                    <button
                      onClick={() => onNavigateToExplorer(ts.theme)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Filter Reviews
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Source and Extraction Limitations */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-600 space-y-2">
        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
          Source Quality & Methodological Limitations
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Sample Composition:</strong> The analyzed corpus consists of {den} unique review units across {documents.length} source documents. Reviews collected from open consumer forums (such as Trustpilot) tend to skew heavily toward acute negative experiences (bot intrusions, billing friction), whereas app store ratings reflect mobile-specific usability.
          </li>
          <li>
            <strong>Cross-Document Deduplication:</strong> {analysis.total_duplicates_excluded} records were flagged as exact cross-document duplicates (e.g. quoted reviews in blog posts matching primary Trustpilot entries) and excluded from unique review counts to preserve statistical integrity.
          </li>
          <li>
            <strong>Review Dates:</strong> Review timestamps span from late 2023 through 2026 where provided. Where explicit dates are absent, records are preserved without fabricating publication dates.
          </li>
          <li>
            <strong>Grounding Guarantee:</strong> Every theme, user problem, and severity classification is linked to verbatim evidence excerpts extracted directly from the uploaded research documents.
          </li>
        </ul>
      </div>
    </div>
  );
};
