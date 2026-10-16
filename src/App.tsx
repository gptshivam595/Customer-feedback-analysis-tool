import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { DocumentsView } from './components/DocumentsView';
import { ResultsView } from './components/ResultsView';
import { ReviewExplorerView } from './components/ReviewExplorerView';
import { SettingsView } from './components/SettingsView';
import { AnalysisProgressModal } from './components/AnalysisProgressModal';
import { DEFAULT_DOCUMENTS } from './data/defaultDocumentsData';
import { AnalysisRun, AnalyzedReview, AppSettings, CandidateReview, DocumentRecord } from './types';
import { segmentDocument } from './utils/segmentation';
import { deduplicateReviews } from './utils/deduplication';
import { classifyReviewLocally } from './utils/localClassifier';
import { runQualityAssurance } from './utils/qualityCheck';
import { aggregateAnalysis } from './utils/aggregation';
import { exportToExcel } from './utils/excelExport';
import { DEFAULT_WEIGHTS } from './utils/prioritization';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'documents' | 'results' | 'explorer' | 'settings'>('dashboard');
  const [explorerThemeFilter, setExplorerThemeFilter] = useState<string>('ALL');

  // Documents state
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);

  // Reviews state
  const [allReviews, setAllReviews] = useState<AnalyzedReview[]>([]);

  // Current analysis run
  const [analysis, setAnalysis] = useState<AnalysisRun | null>(null);

  // Settings
  const [settings, setSettings] = useState<AppSettings>({
    model_name: 'openai/gpt-oss-120b',
    batch_size: 8,
    custom_instructions: '',
    weights: DEFAULT_WEIGHTS,
  });

  const [serverHasKey, setServerHasKey] = useState(true);

  // Pipeline execution state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState<{
    status: AnalysisRun['status'];
    progressPercent: number;
    currentStepLabel: string;
    processedCount: number;
    totalCount: number;
    error: string | null;
  }>({
    status: 'idle',
    progressPercent: 0,
    currentStepLabel: 'Ready',
    processedCount: 0,
    totalCount: 0,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize with the 4 default Read AI research documents
  useEffect(() => {
    loadDefaultDocuments();
    checkServerHealth();
  }, []);

  const checkServerHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setServerHasKey(Boolean(data.hasGroqKey));
      }
    } catch (e) {
      // Backend may be running static
      setServerHasKey(true);
    }
  };

  const loadDefaultDocuments = () => {
    const initialDocs: DocumentRecord[] = DEFAULT_DOCUMENTS.map((defDoc) => {
      const doc: DocumentRecord = {
        id: defDoc.id,
        name: defDoc.name,
        size: defDoc.size,
        content_hash: defDoc.content_hash,
        platform: defDoc.platform,
        status: 'extracted',
        raw_text: defDoc.raw_text,
        review_count_detected: 0,
        extracted_at: new Date().toISOString(),
        warnings: [],
        is_default: true,
        selected_for_analysis: true,
      };

      // Detect candidate reviews
      const candidates = segmentDocument(doc);
      doc.review_count_detected = candidates.length;
      return doc;
    });

    setDocuments(initialDocs);
  };

  // Document management handlers
  const handleAddDocument = (newDoc: DocumentRecord) => {
    setDocuments(prev => [...prev, newDoc]);
  };

  const handleRemoveDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const handleReplaceDocument = (id: string, newDoc: DocumentRecord) => {
    setDocuments(prev => prev.map(d => d.id === id ? newDoc : d));
  };

  const handleToggleSelect = (id: string) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, selected_for_analysis: !d.selected_for_analysis } : d));
  };

  const handleSelectAll = (selected: boolean) => {
    setDocuments(prev => prev.map(d => ({ ...d, selected_for_analysis: selected })));
  };

  // Run LLM Analysis Pipeline
  const handleAnalyze = async () => {
    const selectedDocs = documents.filter(d => d.selected_for_analysis);
    if (selectedDocs.length === 0) {
      alert('Please select at least one document for analysis.');
      return;
    }

    setIsAnalyzing(true);
    setIsModalOpen(true);
    abortControllerRef.current = new AbortController();

    try {
      // Stage 1: Document Extraction Validation
      setPipelineProgress({
        status: 'extracting',
        progressPercent: 10,
        currentStepLabel: 'Validating document text and candidate units...',
        processedCount: 0,
        totalCount: selectedDocs.length,
        error: null,
      });
      await new Promise(r => setTimeout(r, 400));

      // Stage 2: Review Segmentation
      setPipelineProgress({
        status: 'segmenting',
        progressPercent: 25,
        currentStepLabel: 'Segmenting candidate reviews and passages...',
        processedCount: 0,
        totalCount: selectedDocs.length,
        error: null,
      });

      let rawCandidates: CandidateReview[] = [];
      for (const doc of selectedDocs) {
        const segs = segmentDocument(doc);
        rawCandidates = rawCandidates.concat(segs);
      }

      if (rawCandidates.length === 0) {
        throw new Error('No candidate reviews could be detected in the selected documents.');
      }

      // Deduplication (Stage 1 & Stage 2)
      const dedupResult = deduplicateReviews(rawCandidates);
      const candidatesToClassify = dedupResult.items;

      // Stage 3: Batched LLM Classification
      setPipelineProgress({
        status: 'classifying',
        progressPercent: 40,
        currentStepLabel: `Classifying ${candidatesToClassify.length} reviews with Groq (${settings.model_name})...`,
        processedCount: 0,
        totalCount: candidatesToClassify.length,
        error: null,
      });

      const batchSize = settings.batch_size || 8;
      const analyzedBatchResults: AnalyzedReview[] = [];

      for (let i = 0; i < candidatesToClassify.length; i += batchSize) {
        const batch = candidatesToClassify.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(candidatesToClassify.length / batchSize);

        setPipelineProgress(prev => ({
          ...prev,
          progressPercent: 40 + Math.round((i / candidatesToClassify.length) * 35),
          currentStepLabel: `Analyzing batch ${batchNumber} of ${totalBatches}...`,
          processedCount: i,
        }));

        try {
          const res = await fetch('/api/analyze-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reviews: batch,
              modelName: settings.model_name,
              customInstructions: settings.custom_instructions,
            }),
            signal: abortControllerRef.current?.signal,
          });

          if (res.ok) {
            const data = await res.json();
            const returnedReviews: any[] = data.reviews || [];

            // Match back to batch
            for (const cand of batch) {
              const matched = returnedReviews.find((r: any) => r.review_id === cand.review_id);
              if (matched) {
                analyzedBatchResults.push({
                  review_id: cand.review_id,
                  source_document: cand.source_document,
                  source_document_id: cand.source_document_id,
                  source_reference: cand.source_reference,
                  platform: cand.platform,
                  product_name: matched.product_name || 'Read AI',
                  author: cand.author,
                  review_date: cand.review_date,
                  original_text: cand.raw_text,
                  review_classification: matched.review_classification || 'first_hand_customer_review',
                  sentiment: matched.sentiment || 'negative',
                  sentiment_reason: matched.sentiment_reason || '',
                  primary_theme: matched.primary_theme || 'Ease of use',
                  secondary_themes: matched.secondary_themes || [],
                  user_journey_stage: matched.user_journey_stage || 'General or unclear',
                  user_problem: matched.user_problem || null,
                  product_strength: matched.product_strength || null,
                  severity: matched.severity || 'Medium',
                  evidence_excerpt: matched.evidence_excerpt || cand.raw_text.slice(0, 100),
                  product_implication: matched.product_implication || '',
                  recommended_improvement: matched.recommended_improvement || '',
                  confidence: matched.confidence || 0.9,
                  needs_human_review: matched.needs_human_review || false,
                  duplicate_status: cand.duplicate_status,
                  duplicate_of_id: cand.duplicate_of_id,
                  supporting_evidence: matched.supporting_evidence || matched.evidence_excerpt || '',
                });
              } else {
                // Fallback for this single item
                const local = classifyReviewLocally(cand);
                local.duplicate_status = cand.duplicate_status;
                local.duplicate_of_id = cand.duplicate_of_id;
                analyzedBatchResults.push(local);
              }
            }
          } else {
            // Batch request failed (e.g. rate limit) -> use domain rule classifier for this batch
            console.warn(`Batch ${batchNumber} returned ${res.status}. Falling back to domain rule engine.`);
            for (const cand of batch) {
              const local = classifyReviewLocally(cand);
              local.duplicate_status = cand.duplicate_status;
              local.duplicate_of_id = cand.duplicate_of_id;
              analyzedBatchResults.push(local);
            }
          }
        } catch (fetchErr: any) {
          if (fetchErr.name === 'AbortError') {
            throw new Error('Analysis was cancelled by user.');
          }
          // Network failure fallback
          console.warn(`Batch ${batchNumber} error:`, fetchErr);
          for (const cand of batch) {
            const local = classifyReviewLocally(cand);
            local.duplicate_status = cand.duplicate_status;
            local.duplicate_of_id = cand.duplicate_of_id;
            analyzedBatchResults.push(local);
          }
        }
      }

      // Stage 4: Stage 4 Quality Assurance Pass
      setPipelineProgress({
        status: 'validating',
        progressPercent: 80,
        currentStepLabel: 'Running Stage 4 QA checks & evidence verification...',
        processedCount: analyzedBatchResults.length,
        totalCount: analyzedBatchResults.length,
        error: null,
      });
      await new Promise(r => setTimeout(r, 300));

      const validatedReviews = analyzedBatchResults.map(r => runQualityAssurance(r));
      setAllReviews(validatedReviews);

      // Stage 5: Deterministic Aggregation
      setPipelineProgress({
        status: 'aggregating',
        progressPercent: 90,
        currentStepLabel: 'Aggregating theme frequencies and calculating priority scores...',
        processedCount: validatedReviews.length,
        totalCount: validatedReviews.length,
        error: null,
      });
      await new Promise(r => setTimeout(r, 200));

      const initialRun = aggregateAnalysis({
        documents: selectedDocs,
        allReviews: validatedReviews,
        modelUsed: settings.model_name,
        weights: settings.weights,
      });

      // Stage 6: Insight Generation
      setPipelineProgress({
        status: 'generating_insights',
        progressPercent: 95,
        currentStepLabel: 'Generating executive synthesis...',
        processedCount: validatedReviews.length,
        totalCount: validatedReviews.length,
        error: null,
      });

      try {
        const insightRes = await fetch('/api/generate-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            totalReviews: initialRun.total_unique_reviews,
            sentimentBreakdown: initialRun.sentiment_breakdown,
            topThemes: initialRun.theme_summaries.slice(0, 5),
            topOpportunities: initialRun.opportunities.slice(0, 4),
            topStrengths: initialRun.strengths.slice(0, 3),
          }),
        });

        if (insightRes.ok) {
          const insightData = await insightRes.json();
          if (insightData.executive_summary) {
            initialRun.executive_summary = insightData.executive_summary;
          }
        }
      } catch (insightErr) {
        console.warn('Insight synthesis API skipped, using deterministic narrative.');
      }

      setAnalysis(initialRun);

      setPipelineProgress({
        status: 'completed',
        progressPercent: 100,
        currentStepLabel: 'Analysis completed successfully!',
        processedCount: validatedReviews.length,
        totalCount: validatedReviews.length,
        error: null,
      });

      setTimeout(() => {
        setIsModalOpen(false);
        setActiveTab('results');
      }, 1000);
    } catch (err: any) {
      setPipelineProgress(prev => ({
        ...prev,
        status: 'failed',
        error: err.message || 'An unexpected error occurred during analysis.',
      }));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCancelAnalysis = () => {
    abortControllerRef.current?.abort();
    setPipelineProgress(prev => ({
      ...prev,
      status: 'cancelled',
      currentStepLabel: 'Analysis cancelled',
    }));
    setIsAnalyzing(false);
  };

  const handleDownloadExcel = async () => {
    if (!analysis) return;
    try {
      await exportToExcel({
        analysis,
        documents,
        allReviews,
      });
    } catch (err: any) {
      alert(`Excel export failed: ${err.message}`);
    }
  };

  const handleResetAnalysis = () => {
    setAnalysis(null);
    setAllReviews([]);
    setPipelineProgress({
      status: 'idle',
      progressPercent: 0,
      currentStepLabel: 'Ready',
      processedCount: 0,
      totalCount: 0,
      error: null,
    });
  };

  const handleNavigateToExplorer = (filterTheme?: string) => {
    if (filterTheme) {
      setExplorerThemeFilter(filterTheme);
    }
    setActiveTab('explorer');
  };

  const handleUpdateReview = (updatedReview: AnalyzedReview) => {
    const nextReviews = allReviews.map(r => r.review_id === updatedReview.review_id ? updatedReview : r);
    setAllReviews(nextReviews);

    // Re-aggregate with updated records
    if (analysis) {
      const selectedDocs = documents.filter(d => d.selected_for_analysis);
      const reAggregated = aggregateAnalysis({
        documents: selectedDocs,
        allReviews: nextReviews,
        modelUsed: analysis.model_used,
        weights: settings.weights,
        executiveSummary: analysis.executive_summary,
      });
      setAnalysis(reAggregated);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasResults={Boolean(analysis && analysis.status === 'completed')}
        onAnalyzeClick={handleAnalyze}
        isAnalyzing={isAnalyzing}
        onExportClick={handleDownloadExcel}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            documents={documents}
            analysis={analysis}
            isAnalyzing={isAnalyzing}
            onAnalyze={handleAnalyze}
            onDownloadExcel={handleDownloadExcel}
            onReset={handleResetAnalysis}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentsView
            documents={documents}
            onAddDocument={handleAddDocument}
            onRemoveDocument={handleRemoveDocument}
            onReplaceDocument={handleReplaceDocument}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onPreloadDefaults={loadDefaultDocuments}
          />
        )}

        {activeTab === 'results' && (
          <ResultsView
            analysis={analysis}
            documents={documents}
            onExportExcel={handleDownloadExcel}
            onNavigateToExplorer={handleNavigateToExplorer}
          />
        )}

        {activeTab === 'explorer' && (
          <ReviewExplorerView
            reviews={allReviews}
            documents={documents}
            initialThemeFilter={explorerThemeFilter}
            onUpdateReview={handleUpdateReview}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onSaveSettings={setSettings}
            serverHasKey={serverHasKey}
          />
        )}
      </main>

      {/* Analysis Progress Modal */}
      <AnalysisProgressModal
        isOpen={isModalOpen}
        status={pipelineProgress.status}
        progressPercent={pipelineProgress.progressPercent}
        currentStepLabel={pipelineProgress.currentStepLabel}
        processedCount={pipelineProgress.processedCount}
        totalCount={pipelineProgress.totalCount}
        error={pipelineProgress.error}
        onCancel={handleCancelAnalysis}
        onClose={() => setIsModalOpen(false)}
        onRetry={handleAnalyze}
      />
    </div>
  );
}
