import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  FileSearch,
  Filter,
  ShieldCheck,
  BarChart2,
  StopCircle,
} from 'lucide-react';

interface AnalysisProgressModalProps {
  isOpen: boolean;
  status:
    | 'idle'
    | 'extracting'
    | 'segmenting'
    | 'classifying'
    | 'validating'
    | 'aggregating'
    | 'generating_insights'
    | 'completed'
    | 'failed'
    | 'partially_completed'
    | 'cancelled';
  progressPercent: number;
  currentStepLabel: string;
  processedCount: number;
  totalCount: number;
  error?: string | null;
  onCancel?: () => void;
  onClose?: () => void;
  onRetry?: () => void;
}

const STAGES = [
  { key: 'extracting', label: 'Document Extraction', icon: FileSearch },
  { key: 'segmenting', label: 'Review Segmentation', icon: Filter },
  { key: 'classifying', label: 'LLM Classification', icon: Sparkles },
  { key: 'validating', label: 'Quality Assurance & Grounding', icon: ShieldCheck },
  { key: 'aggregating', label: 'Metric Aggregation', icon: BarChart2 },
  { key: 'generating_insights', label: 'Strategic Synthesis', icon: CheckCircle2 },
];

export const AnalysisProgressModal: React.FC<AnalysisProgressModalProps> = ({
  isOpen,
  status,
  progressPercent,
  currentStepLabel,
  processedCount,
  totalCount,
  error,
  onCancel,
  onClose,
  onRetry,
}) => {
  if (!isOpen) return null;

  const isFinished = status === 'completed' || status === 'failed' || status === 'cancelled';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in-50">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Review Intelligence Pipeline
              </h3>
              <p className="text-xs text-slate-500">
                {status === 'completed' ? 'Processing finished' : 'Executing multi-stage analysis'}
              </p>
            </div>
          </div>

          {isFinished && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="my-5 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-slate-800">{currentStepLabel}</span>
            <span className="font-mono tabular-nums text-slate-600">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                status === 'failed' ? 'bg-rose-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {totalCount > 0 && (
            <div className="text-[11px] text-slate-500 text-right font-mono">
              Processed {processedCount} of {totalCount} units
            </div>
          )}
        </div>

        {/* Pipeline Stage Indicators */}
        <div className="space-y-2 my-4">
          {STAGES.map((st, i) => {
            const Icon = st.icon;
            const stageIndex = STAGES.findIndex(s => s.key === status);
            const isDone = stageIndex > i || status === 'completed';
            const isCurrent = st.key === status;

            return (
              <div
                key={st.key}
                className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                  isCurrent
                    ? 'bg-indigo-50/70 border border-indigo-200 text-indigo-900 font-semibold'
                    : isDone
                    ? 'text-slate-700'
                    : 'text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{st.label}</span>
                </div>
                <div>
                  {isDone ? (
                    <span className="text-emerald-600 text-[11px] font-medium">Done</span>
                  ) : isCurrent ? (
                    <div className="w-3 h-3 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                  ) : (
                    <span className="text-[11px] text-slate-400">Waiting</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2 my-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="flex-1">
              <strong>Pipeline Warning / Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
          {!isFinished ? (
            <button
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              <StopCircle className="w-3.5 h-3.5 text-slate-500" />
              Cancel Run
            </button>
          ) : (
            <>
              {status === 'failed' && onRetry && (
                <button
                  onClick={onRetry}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  Retry Analysis
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
