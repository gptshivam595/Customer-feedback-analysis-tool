import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Eye,
  Check,
  X,
  AlertCircle,
  FileText,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Edit2,
  Save,
} from 'lucide-react';
import { AnalyzedReview, DocumentRecord, ReviewClassification, Sentiment, Severity, THEME_TAXONOMY, UserJourneyStage } from '../types';

interface ReviewExplorerViewProps {
  reviews: AnalyzedReview[];
  documents: DocumentRecord[];
  initialThemeFilter?: string;
  onUpdateReview?: (updated: AnalyzedReview) => void;
}

export const ReviewExplorerView: React.FC<ReviewExplorerViewProps> = ({
  reviews,
  documents,
  initialThemeFilter = '',
  onUpdateReview,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState('ALL');
  const [selectedPlatform, setSelectedPlatform] = useState('ALL');
  const [selectedSentiment, setSelectedSentiment] = useState('ALL');
  const [selectedTheme, setSelectedTheme] = useState(initialThemeFilter || 'ALL');
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedClassification, setSelectedClassification] = useState('ALL');
  const [selectedDuplicateStatus, setSelectedDuplicateStatus] = useState('ALL');

  const [activeReviewDetail, setActiveReviewDetail] = useState<AnalyzedReview | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<AnalyzedReview | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  // Platform options
  const platforms = useMemo(() => {
    const set = new Set<string>();
    reviews.forEach(r => { if (r.platform) set.add(r.platform); });
    return Array.from(set).sort();
  }, [reviews]);

  // Unique themes in current reviews
  const existingThemes = useMemo(() => {
    const set = new Set<string>();
    reviews.forEach(r => { if (r.primary_theme) set.add(r.primary_theme); });
    return Array.from(set).sort();
  }, [reviews]);

  // Filtering
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      if (selectedDoc !== 'ALL' && r.source_document !== selectedDoc) return false;
      if (selectedPlatform !== 'ALL' && r.platform !== selectedPlatform) return false;
      if (selectedSentiment !== 'ALL' && r.sentiment !== selectedSentiment) return false;
      if (selectedTheme !== 'ALL' && r.primary_theme !== selectedTheme) return false;
      if (selectedStage !== 'ALL' && r.user_journey_stage !== selectedStage) return false;
      if (selectedSeverity !== 'ALL' && r.severity !== selectedSeverity) return false;
      if (selectedClassification !== 'ALL' && r.review_classification !== selectedClassification) return false;
      if (selectedDuplicateStatus !== 'ALL' && r.duplicate_status !== selectedDuplicateStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inText = r.original_text.toLowerCase().includes(q);
        const inAuthor = (r.author || '').toLowerCase().includes(q);
        const inQuote = (r.evidence_excerpt || '').toLowerCase().includes(q);
        const inId = r.review_id.toLowerCase().includes(q);
        const inProblem = (r.user_problem || '').toLowerCase().includes(q);
        if (!inText && !inAuthor && !inQuote && !inId && !inProblem) return false;
      }

      return true;
    });
  }, [
    reviews,
    selectedDoc,
    selectedPlatform,
    selectedSentiment,
    selectedTheme,
    selectedStage,
    selectedSeverity,
    selectedClassification,
    selectedDuplicateStatus,
    searchQuery,
  ]);

  const totalPages = Math.ceil(filteredReviews.length / PAGE_SIZE) || 1;
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredReviews.slice(start, start + PAGE_SIZE);
  }, [filteredReviews, currentPage]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDoc('ALL');
    setSelectedPlatform('ALL');
    setSelectedSentiment('ALL');
    setSelectedTheme('ALL');
    setSelectedStage('ALL');
    setSelectedSeverity('ALL');
    setSelectedClassification('ALL');
    setSelectedDuplicateStatus('ALL');
    setCurrentPage(1);
  };

  const handleOpenDetail = (review: AnalyzedReview) => {
    setActiveReviewDetail(review);
    setEditForm({ ...review });
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    if (!editForm || !onUpdateReview) return;
    const updated: AnalyzedReview = {
      ...editForm,
      user_edited: true,
    };
    onUpdateReview(updated);
    setActiveReviewDetail(updated);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Review Explorer
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Search, filter, and inspect verified review passages, quotes, and classification metadata.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs">
          Showing <strong>{filteredReviews.length}</strong> of <strong>{reviews.length}</strong> reviews
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by keywords, reviewer name, quote, or problem statement..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-xs">
          {/* Document */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Source Doc</label>
            <select
              value={selectedDoc}
              onChange={(e) => { setSelectedDoc(e.target.value); setCurrentPage(1); }}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-slate-700 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Documents</option>
              {documents.map(d => (
                <option key={d.id} value={d.name}>{d.name.slice(0, 20)}...</option>
              ))}
            </select>
          </div>

          {/* Platform */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Platform</label>
            <select
              value={selectedPlatform}
              onChange={(e) => { setSelectedPlatform(e.target.value); setCurrentPage(1); }}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-slate-700 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Platforms</option>
              {platforms.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Sentiment */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Sentiment</label>
            <select
              value={selectedSentiment}
              onChange={(e) => { setSelectedSentiment(e.target.value); setCurrentPage(1); }}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-slate-700 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="mixed">Mixed</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>

          {/* Primary Theme */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Primary Theme</label>
            <select
              value={selectedTheme}
              onChange={(e) => { setSelectedTheme(e.target.value); setCurrentPage(1); }}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-slate-700 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Themes</option>
              {existingThemes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Journey Stage */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Journey Stage</label>
            <select
              value={selectedStage}
              onChange={(e) => { setSelectedStage(e.target.value); setCurrentPage(1); }}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-slate-700 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Stages</option>
              <option value="Permissions and integrations">Permissions & Integrations</option>
              <option value="During meeting">During Meeting</option>
              <option value="Signup and onboarding">Signup & Onboarding</option>
              <option value="Billing and account management">Billing & Account</option>
              <option value="Post-meeting review">Post-Meeting Review</option>
              <option value="Follow-up and action">Follow-up & Action</option>
              <option value="Search and retrieval">Search & Retrieval</option>
              <option value="General or unclear">General / Unclear</option>
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Severity</label>
            <select
              value={selectedSeverity}
              onChange={(e) => { setSelectedSeverity(e.target.value); setCurrentPage(1); }}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-slate-700 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Severities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>

          {/* Classification */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Classification</label>
            <select
              value={selectedClassification}
              onChange={(e) => { setSelectedClassification(e.target.value); setCurrentPage(1); }}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-slate-700 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Classifications</option>
              <option value="first_hand_customer_review">Direct Customer</option>
              <option value="editorial_review">Editorial</option>
              <option value="aggregated_review_summary">Aggregated</option>
              <option value="competitor_comparison">Competitor Comparison</option>
            </select>
          </div>

          {/* Duplicate Status */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Duplicates</label>
            <select
              value={selectedDuplicateStatus}
              onChange={(e) => { setSelectedDuplicateStatus(e.target.value); setCurrentPage(1); }}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-slate-700 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Records</option>
              <option value="unique">Unique Only</option>
              <option value="exact_duplicate">Exact Duplicates</option>
              <option value="potential_duplicate">Potential Duplicates</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        <div className="flex justify-end pt-1">
          <button
            onClick={resetFilters}
            className="text-[11px] text-slate-500 hover:text-slate-900 underline"
          >
            Reset All Filters
          </button>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3 w-16">ID</th>
                <th className="py-2.5 px-3">Author / Date</th>
                <th className="py-2.5 px-3">Platform</th>
                <th className="py-2.5 px-3">Sentiment</th>
                <th className="py-2.5 px-3">Primary Theme</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Journey Stage</th>
                <th className="py-2.5 px-3">Evidence Excerpt</th>
                <th className="py-2.5 px-3 w-16 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedReviews.map((r) => (
                <tr key={r.review_id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {r.review_id.split('-').slice(-2).join('-')}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900 truncate max-w-[140px]">
                      {r.author || 'Anonymous'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {r.review_date || 'Date N/A'}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                    {r.platform}
                  </td>
                  <td className="py-3 px-3">
                    {r.sentiment === 'positive' ? (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-medium">
                        Positive
                      </span>
                    ) : r.sentiment === 'negative' ? (
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-800 rounded font-medium">
                        Negative
                      </span>
                    ) : r.sentiment === 'mixed' ? (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded font-medium">
                        Mixed
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                        Neutral
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-900 whitespace-nowrap">
                    {r.primary_theme}
                  </td>
                  <td className="py-3 px-3">
                    {r.severity === 'High' ? (
                      <span className="font-bold text-rose-700">High</span>
                    ) : r.severity === 'Medium' ? (
                      <span className="text-amber-700 font-medium">Med</span>
                    ) : (
                      <span className="text-slate-500">Low</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-600 text-[11px] whitespace-nowrap">
                    {r.user_journey_stage}
                  </td>
                  <td className="py-3 px-3 text-slate-600 italic max-w-xs truncate" title={r.evidence_excerpt}>
                    "{r.evidence_excerpt || r.original_text.slice(0, 60)}"
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleOpenDetail(r)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
                      title="Inspect full text & analysis"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
          <div>
            Page <span className="font-semibold text-slate-900">{currentPage}</span> of{' '}
            <span className="font-semibold text-slate-900">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Review Detail Inspection & Audit Modal */}
      {activeReviewDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {activeReviewDetail.review_id}
                  </span>
                  {activeReviewDetail.duplicate_status !== 'unique' && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                      {activeReviewDetail.duplicate_status.toUpperCase()}
                    </span>
                  )}
                  {activeReviewDetail.needs_human_review && (
                    <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-medium">
                      NEEDS HUMAN REVIEW
                    </span>
                  )}
                  {activeReviewDetail.user_edited && (
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium">
                      USER EDITED
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Source: {activeReviewDetail.source_document} · {activeReviewDetail.source_reference}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                ) : (
                  <button
                    onClick={handleSaveEdit}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-white bg-indigo-600 rounded hover:bg-indigo-700"
                  >
                    <Save className="w-3 h-3" /> Save Changes
                  </button>
                )}
                <button
                  onClick={() => { setActiveReviewDetail(null); setIsEditing(false); }}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Original Text Box */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Original Extracted Review Text
                </label>
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 font-sans leading-relaxed whitespace-pre-wrap select-text">
                  {activeReviewDetail.original_text}
                </div>
              </div>

              {/* Verified Verbatim Excerpt */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Grounded Evidence Excerpt (Verbatim Passage)
                </label>
                <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-lg text-indigo-950 font-medium italic">
                  "{activeReviewDetail.evidence_excerpt}"
                </div>
              </div>

              {/* Editable or View Classification Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <span className="block text-[10px] text-slate-500 font-semibold uppercase">Classification</span>
                  {isEditing ? (
                    <select
                      value={editForm?.review_classification}
                      onChange={(e) => setEditForm(prev => prev ? ({ ...prev, review_classification: e.target.value as any }) : null)}
                      className="mt-1 w-full p-1 bg-white border border-slate-300 rounded text-xs"
                    >
                      <option value="first_hand_customer_review">first_hand_customer_review</option>
                      <option value="editorial_review">editorial_review</option>
                      <option value="aggregated_review_summary">aggregated_review_summary</option>
                      <option value="competitor_comparison">competitor_comparison</option>
                    </select>
                  ) : (
                    <span className="text-slate-800 font-medium capitalize">
                      {activeReviewDetail.review_classification.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>

                <div>
                  <span className="block text-[10px] text-slate-500 font-semibold uppercase">Sentiment</span>
                  {isEditing ? (
                    <select
                      value={editForm?.sentiment}
                      onChange={(e) => setEditForm(prev => prev ? ({ ...prev, sentiment: e.target.value as any }) : null)}
                      className="mt-1 w-full p-1 bg-white border border-slate-300 rounded text-xs"
                    >
                      <option value="positive">positive</option>
                      <option value="negative">negative</option>
                      <option value="mixed">mixed</option>
                      <option value="neutral">neutral</option>
                    </select>
                  ) : (
                    <span className="font-semibold capitalize text-slate-900">
                      {activeReviewDetail.sentiment}
                    </span>
                  )}
                </div>

                <div>
                  <span className="block text-[10px] text-slate-500 font-semibold uppercase">Severity</span>
                  {isEditing ? (
                    <select
                      value={editForm?.severity}
                      onChange={(e) => setEditForm(prev => prev ? ({ ...prev, severity: e.target.value as any }) : null)}
                      className="mt-1 w-full p-1 bg-white border border-slate-300 rounded text-xs"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  ) : (
                    <span className="font-semibold text-slate-900">
                      {activeReviewDetail.severity}
                    </span>
                  )}
                </div>

                <div>
                  <span className="block text-[10px] text-slate-500 font-semibold uppercase">Primary Theme</span>
                  {isEditing ? (
                    <select
                      value={editForm?.primary_theme}
                      onChange={(e) => setEditForm(prev => prev ? ({ ...prev, primary_theme: e.target.value }) : null)}
                      className="mt-1 w-full p-1 bg-white border border-slate-300 rounded text-xs"
                    >
                      {THEME_TAXONOMY.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-semibold text-slate-900">
                      {activeReviewDetail.primary_theme}
                    </span>
                  )}
                </div>

                <div>
                  <span className="block text-[10px] text-slate-500 font-semibold uppercase">Journey Stage</span>
                  {isEditing ? (
                    <select
                      value={editForm?.user_journey_stage}
                      onChange={(e) => setEditForm(prev => prev ? ({ ...prev, user_journey_stage: e.target.value as any }) : null)}
                      className="mt-1 w-full p-1 bg-white border border-slate-300 rounded text-xs"
                    >
                      <option value="Discovery and evaluation">Discovery and evaluation</option>
                      <option value="Signup and onboarding">Signup and onboarding</option>
                      <option value="Permissions and integrations">Permissions and integrations</option>
                      <option value="During meeting">During meeting</option>
                      <option value="Post-meeting review">Post-meeting review</option>
                      <option value="Follow-up and action">Follow-up and action</option>
                      <option value="Billing and account management">Billing and account management</option>
                      <option value="General or unclear">General or unclear</option>
                    </select>
                  ) : (
                    <span className="text-slate-800">
                      {activeReviewDetail.user_journey_stage}
                    </span>
                  )}
                </div>

                <div>
                  <span className="block text-[10px] text-slate-500 font-semibold uppercase">Confidence</span>
                  <span className="font-mono tabular-nums text-slate-900">
                    {Math.round(activeReviewDetail.confidence * 100)}%
                  </span>
                </div>
              </div>

              {/* User Problem & Recommended Improvement */}
              {activeReviewDetail.user_problem && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Stated User Problem
                  </label>
                  <p className="text-slate-800 bg-rose-50/50 p-2.5 rounded border border-rose-200">
                    {activeReviewDetail.user_problem}
                  </p>
                </div>
              )}

              {activeReviewDetail.recommended_improvement && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Recommended Product Response
                  </label>
                  <p className="text-indigo-900 bg-indigo-50/50 p-2.5 rounded border border-indigo-200 font-medium">
                    {activeReviewDetail.recommended_improvement}
                  </p>
                </div>
              )}

              {activeReviewDetail.product_strength && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Recognized Product Strength
                  </label>
                  <p className="text-emerald-900 bg-emerald-50/50 p-2.5 rounded border border-emerald-200">
                    {activeReviewDetail.product_strength}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/80 flex justify-end">
              <button
                onClick={() => { setActiveReviewDetail(null); setIsEditing(false); }}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
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
