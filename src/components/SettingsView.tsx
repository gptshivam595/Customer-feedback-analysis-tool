import React, { useState } from 'react';
import {
  Key,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Save,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { AppSettings, PrioritizationWeights } from '../types';
import { DEFAULT_WEIGHTS } from '../utils/prioritization';

interface SettingsViewProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  serverHasKey: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  serverHasKey,
}) => {
  const [modelName, setModelName] = useState(settings.model_name);
  const [batchSize, setBatchSize] = useState(settings.batch_size);
  const [customInstructions, setCustomInstructions] = useState(settings.custom_instructions);
  const [weights, setWeights] = useState<PrioritizationWeights>(settings.weights);

  const [overrideApiKey, setOverrideApiKey] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage(null);

    try {
      const res = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: overrideApiKey || undefined }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestStatus('success');
        setTestMessage(`Successfully connected to Groq API using ${data.model}!`);
      } else {
        setTestStatus('error');
        setTestMessage(data.message || data.error || 'Connection failed.');
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(err.message || 'Network error connecting to backend.');
    }
  };

  const handleSave = () => {
    onSaveSettings({
      model_name: modelName,
      batch_size: batchSize,
      custom_instructions: customInstructions,
      weights,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleResetWeights = () => {
    setWeights(DEFAULT_WEIGHTS);
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Analysis & Provider Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure the LLM inference provider, prioritization weights, batch limits, and privacy parameters.
        </p>
      </div>

      {/* Provider & Credentials */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900">
            LLM Provider & Authentication
          </h2>
        </div>

        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Server-Side Private Groq API Key Configured</div>
            <p className="text-emerald-800 mt-0.5 leading-relaxed">
              Your Groq API key is stored privately in server environment variables (<code>GROQ_API_KEY</code>) and proxied exclusively through server-side routes (<code>/api/*</code>). It is never exposed in client bundles, browser storage, or exported Excel workbooks.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Active LLM Model
            </label>
            <select
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500"
            >
              <option value="openai/gpt-oss-120b">GPT OSS 120B via Groq (Recommended - High Reasoning)</option>
              <option value="openai/gpt-oss-20b">GPT OSS 20B via Groq (Fast & Accurate)</option>
              <option value="qwen/qwen3.8-27b">Qwen 3.8 27B via Groq</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Supports 131k context window, JSON mode, and structured outputs with sub-second inference.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Optional API Key Override (Masked)
            </label>
            <input
              type="password"
              placeholder={serverHasKey ? '•••••••••••••••••••••••• (Default from server)' : 'gsk_...'}
              value={overrideApiKey}
              onChange={(e) => setOverrideApiKey(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Leave blank to use the secure server-configured key.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleTestConnection}
            disabled={testStatus === 'testing'}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            {testStatus === 'testing' ? (
              <>
                <div className="w-3 h-3 border-2 border-slate-400 border-t-indigo-600 rounded-full animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Test Connection
              </>
            )}
          </button>

          {testStatus === 'success' && (
            <div className="flex items-center gap-1 text-xs text-emerald-700 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>{testMessage}</span>
            </div>
          )}

          {testStatus === 'error' && (
            <div className="flex items-center gap-1 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>{testMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Prioritization Weights Configuration */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Prioritization Framework Weights
            </h2>
          </div>
          <button
            onClick={handleResetWeights}
            className="text-xs text-slate-500 hover:text-slate-800 underline inline-flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Reset to Defaults (40/30/20/10)
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Section 9 formula: <code>priority_score = w1·frequency + w2·severity + w3·journey_impact + w4·confidence</code>. Total must equal 100%.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Frequency */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
              <span>Frequency Weight</span>
              <span className="font-mono">{Math.round(weights.frequency * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.7"
              step="0.05"
              value={weights.frequency}
              onChange={(e) => setWeights({ ...weights, frequency: parseFloat(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">Share of unique reviews</span>
          </div>

          {/* Severity */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
              <span>Severity Weight</span>
              <span className="font-mono">{Math.round(weights.severity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.7"
              step="0.05"
              value={weights.severity}
              onChange={(e) => setWeights({ ...weights, severity: parseFloat(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">High=3, Med=2, Low=1</span>
          </div>

          {/* Journey Impact */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
              <span>Journey Impact</span>
              <span className="font-mono">{Math.round(weights.journey_impact * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.5"
              step="0.05"
              value={weights.journey_impact}
              onChange={(e) => setWeights({ ...weights, journey_impact: parseFloat(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">Value-blocker stage score</span>
          </div>

          {/* Confidence */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
              <span>Confidence</span>
              <span className="font-mono">{Math.round(weights.confidence * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.3"
              step="0.05"
              value={weights.confidence}
              onChange={(e) => setWeights({ ...weights, confidence: parseFloat(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">Evidence clarity indicator</span>
          </div>
        </div>
      </div>

      {/* Analysis Batching & Custom Instructions */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900">
          Pipeline Batching & Custom Directives
        </h2>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Analysis Batch Size (Reviews per LLM request)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="3"
              max="20"
              step="1"
              value={batchSize}
              onChange={(e) => setBatchSize(parseInt(e.target.value, 10))}
              className="w-64 accent-indigo-600 cursor-pointer"
            />
            <span className="text-xs font-mono font-bold text-slate-900">{batchSize} reviews / batch</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Lower batch sizes prevent token truncation and provide maximum classification precision.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Optional Custom Analysis Directives
          </label>
          <textarea
            rows={3}
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="e.g., Focus specifically on comparisons with tl;dv, Fathom, and MeetGeek, and highlight GDPR enterprise concerns."
            className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {isSaved && (
          <span className="text-xs text-emerald-700 font-semibold animate-in fade-in">
            Settings saved successfully!
          </span>
        )}
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
        >
          <Save className="w-4 h-4" /> Save Settings
        </button>
      </div>
    </div>
  );
};
