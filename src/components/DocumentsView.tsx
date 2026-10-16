import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  RefreshCw,
  Eye,
  CheckSquare,
  Square,
  AlertTriangle,
  CheckCircle,
  FileDown,
  X,
  FilePlus2,
} from 'lucide-react';
import { DocumentRecord } from '../types';
import { extractDocx } from '../utils/docxExtractor';
import { segmentDocument } from '../utils/segmentation';

interface DocumentsViewProps {
  documents: DocumentRecord[];
  onAddDocument: (doc: DocumentRecord) => void;
  onRemoveDocument: (id: string) => void;
  onReplaceDocument: (id: string, newDoc: DocumentRecord) => void;
  onToggleSelect: (id: string) => void;
  onSelectAll: (selected: boolean) => void;
  onPreloadDefaults: () => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  onAddDocument,
  onRemoveDocument,
  onReplaceDocument,
  onToggleSelect,
  onSelectAll,
  onPreloadDefaults,
}) => {
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [targetReplaceDocId, setTargetReplaceDocId] = useState<string | null>(null);

  const allSelected = documents.length > 0 && documents.every(d => d.selected_for_analysis);
  const someSelected = documents.some(d => d.selected_for_analysis);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check duplicate filename or hash
        const existingDoc = documents.find(d => d.name === file.name);

        const extracted = await extractDocx(file);

        // Build temporary doc to test segmentation
        const tempDoc: DocumentRecord = {
          id: 'doc-' + Date.now() + '-' + i,
          name: file.name,
          size: extracted.size,
          content_hash: extracted.content_hash,
          platform: detectPlatformFromName(file.name),
          status: extracted.warnings.length > 0 ? 'warning' : 'extracted',
          raw_text: extracted.raw_text,
          review_count_detected: 0,
          extracted_at: new Date().toISOString(),
          warnings: extracted.warnings,
          is_default: false,
          selected_for_analysis: true,
        };

        const candidateReviews = segmentDocument(tempDoc);
        tempDoc.review_count_detected = candidateReviews.length;

        if (existingDoc) {
          // If replacement has same name but different content
          onReplaceDocument(existingDoc.id, tempDoc);
        } else {
          onAddDocument(tempDoc);
        }
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to extract DOCX file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReplaceClick = (docId: string) => {
    setTargetReplaceDocId(docId);
    replaceInputRef.current?.click();
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetReplaceDocId) return;

    try {
      setIsUploading(true);
      setUploadError(null);
      const extracted = await extractDocx(file);

      const newDoc: DocumentRecord = {
        id: targetReplaceDocId,
        name: file.name,
        size: extracted.size,
        content_hash: extracted.content_hash,
        platform: detectPlatformFromName(file.name),
        status: extracted.warnings.length > 0 ? 'warning' : 'extracted',
        raw_text: extracted.raw_text,
        review_count_detected: 0,
        extracted_at: new Date().toISOString(),
        warnings: extracted.warnings,
        is_default: false,
        selected_for_analysis: true,
      };

      const candidates = segmentDocument(newDoc);
      newDoc.review_count_detected = candidates.length;

      onReplaceDocument(targetReplaceDocId, newDoc);
    } catch (err: any) {
      setUploadError(`Failed to replace document: ${err.message}`);
    } finally {
      setIsUploading(false);
      setTargetReplaceDocId(null);
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    }
  };

  function detectPlatformFromName(filename: string): string {
    const lower = filename.toLowerCase();
    if (lower.includes('trustpilot')) return 'Trustpilot';
    if (lower.includes('playstore') || lower.includes('google play')) return 'Google Play Store';
    if (lower.includes('tldv') || lower.includes('tl;dv')) return 'tl;dv Blog';
    if (lower.includes('meetgeek')) return 'MeetGeek Blog';
    if (lower.includes('g2')) return 'G2';
    return 'Customer Feedback Export';
  }

  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Source Documents
          </h1>
          <p className="text-sm text-slate-600">
            Manage research DOCX documents. Add, replace, inspect extracted text, and select documents for LLM processing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onPreloadDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
            Reload 4 Default Research Docs
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileUpload(e.target.files)}
            multiple
            accept=".docx,.txt,.md"
            className="hidden"
          />
          <input
            type="file"
            ref={replaceInputRef}
            onChange={handleReplaceFile}
            accept=".docx,.txt,.md"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            {isUploading ? 'Extracting...' : 'Upload DOCX'}
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start justify-between gap-3 text-rose-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{uploadError}</span>
          </div>
          <button onClick={() => setUploadError(null)} className="text-rose-600 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bulk Selection Bar */}
      <div className="flex items-center justify-between py-2 px-4 bg-slate-100 rounded-lg text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectAll(!allSelected)}
            className="flex items-center gap-1.5 font-medium hover:text-slate-900"
          >
            {allSelected ? (
              <CheckSquare className="w-4 h-4 text-indigo-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            Select All Documents
          </button>
          <span>·</span>
          <span>
            {documents.filter(d => d.selected_for_analysis).length} of {documents.length} included in analysis
          </span>
        </div>
        <div className="text-slate-500 font-mono">
          Total Detected: {documents.reduce((acc, d) => acc + d.review_count_detected, 0)} records
        </div>
      </div>

      {/* Documents Table */}
      {documents.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-10 text-center">
          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-900 mb-1">No research documents loaded</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Upload custom customer review DOCX files or load the bundled default research dataset for Read AI.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={onPreloadDefaults}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
            >
              Load Default Research Files
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Upload DOCX
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4 w-10 text-center"></th>
                  <th className="py-3 px-4">Document Name</th>
                  <th className="py-3 px-4">Platform / Source</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Reviews Detected</th>
                  <th className="py-3 px-4 text-right">Size</th>
                  <th className="py-3 px-4">Content Hash</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onToggleSelect(doc.id)}
                        className="text-slate-400 hover:text-indigo-600"
                      >
                        {doc.selected_for_analysis ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="truncate max-w-xs">{doc.name}</span>
                        {doc.is_default && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                            DEFAULT
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {doc.platform}
                    </td>
                    <td className="py-3 px-4">
                      {doc.status === 'warning' ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          Warning
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Extracted
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-800 tabular-nums">
                      {doc.review_count_detected}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 font-mono tabular-nums">
                      {formatBytes(doc.size)}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {doc.content_hash.slice(0, 14)}...
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
                        title="Preview extracted text"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleReplaceClick(doc.id)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                        title="Replace with updated version"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onRemoveDocument(doc.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Remove document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Text Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in-50">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/60">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  {previewDoc.name}
                </h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  Platform: {previewDoc.platform} · {previewDoc.review_count_detected} candidate records detected · {formatBytes(previewDoc.size)}
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {previewDoc.warnings.length > 0 && (
              <div className="px-6 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs">
                <strong>Extraction Warnings:</strong> {previewDoc.warnings.join('; ')}
              </div>
            )}

            <div className="p-6 overflow-y-auto font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap bg-slate-50/30">
              {previewDoc.raw_text}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/80 flex justify-end">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
