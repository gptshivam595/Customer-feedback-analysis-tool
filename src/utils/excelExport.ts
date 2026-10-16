import ExcelJS from 'exceljs';
import { AnalysisRun, AnalyzedReview, DocumentRecord } from '../types';

/**
 * Generates and downloads a rich, multi-sheet .xlsx workbook matching Section 11 specifications.
 */
export async function exportToExcel(params: {
  analysis: AnalysisRun;
  documents: DocumentRecord[];
  allReviews: AnalyzedReview[];
}): Promise<void> {
  const { analysis, documents, allReviews } = params;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Review Intelligence Analyzer';
  workbook.lastModifiedBy = 'Review Intelligence Analyzer';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Color constants
  const BRAND_HEADER_FILL: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' }, // Dark slate
  };
  const WHITE_FONT: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };
  const SECTION_HEADER_FILL: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF1F5F9' }, // Light slate
  };
  const BORDER_THIN: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  };

  // Helper to format table headers
  function formatHeaderRow(row: ExcelJS.Row) {
    row.eachCell(cell => {
      cell.fill = BRAND_HEADER_FILL;
      cell.font = WHITE_FONT;
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = BORDER_THIN;
    });
    row.height = 26;
  }

  // -------------------------------------------------------------
  // Sheet 1: Executive Summary
  // -------------------------------------------------------------
  const s1 = workbook.addWorksheet('Executive Summary', {
    views: [{ state: 'frozen', ySplit: 4 }],
  });

  s1.columns = [
    { header: 'Dimension', key: 'key', width: 28 },
    { header: 'Value / Metric', key: 'value', width: 45 },
    { header: 'Percentage / Denominator', key: 'detail', width: 32 },
    { header: 'Notes & Methodology', key: 'notes', width: 50 },
  ];
  formatHeaderRow(s1.getRow(1));

  // Meta rows
  s1.addRow({ key: 'Target Product', value: 'Read AI (Meeting Copilot)', detail: '100% of sample', notes: 'Includes competitor context vs tl;dv, MeetGeek, Otter' });
  s1.addRow({ key: 'Analysis Timestamp', value: new Date(analysis.timestamp).toLocaleString(), detail: '-', notes: 'Automated extraction & classification' });
  s1.addRow({ key: 'Source Documents Included', value: analysis.total_documents_included, detail: `${documents.length} files parsed`, notes: 'Trustpilot, Play Store, tl;dv Blog, MeetGeek Blog' });
  s1.addRow({ key: 'Total Extracted Candidate Records', value: analysis.total_candidates_detected, detail: '100%', notes: 'Initial segmented units' });
  s1.addRow({ key: 'Total Unique Reviews Analyzed', value: analysis.total_unique_reviews, detail: `Denominator: ${analysis.total_unique_reviews}`, notes: 'Each unique review counted strictly once' });
  s1.addRow({ key: 'Excluded Cross-Document Duplicates', value: analysis.total_duplicates_excluded, detail: `${analysis.total_duplicates_excluded} records`, notes: 'Deduplicated via content hash and exact text comparison' });
  s1.addRow({ key: 'Ambiguous / Needs Human Review', value: analysis.needs_review_count, detail: `${analysis.needs_review_count} records`, notes: 'Preserved without inflating unique metric' });

  // Sentiment Breakdown
  const den = analysis.total_unique_reviews || 1;
  s1.addRow({ key: '', value: '', detail: '', notes: '' });
  const sRow = s1.addRow({ key: 'SENTIMENT BREAKDOWN', value: 'COUNT', detail: 'PERCENTAGE', notes: 'AUDIT SUMMARY' });
  sRow.font = { bold: true };
  sRow.eachCell(c => c.fill = SECTION_HEADER_FILL);

  s1.addRow({ key: 'Positive Sentiment', value: analysis.sentiment_breakdown.positive, detail: `${Math.round((analysis.sentiment_breakdown.positive / den) * 1000) / 10}% (${analysis.sentiment_breakdown.positive}/${den})`, notes: 'Praise for transcription speed, summary clarity, action items' });
  s1.addRow({ key: 'Negative Sentiment', value: analysis.sentiment_breakdown.negative, detail: `${Math.round((analysis.sentiment_breakdown.negative / den) * 1000) / 10}% (${analysis.sentiment_breakdown.negative}/${den})`, notes: 'Severe backlash regarding unauthorized bot joining, calendar consent' });
  s1.addRow({ key: 'Mixed Sentiment', value: analysis.sentiment_breakdown.mixed, detail: `${Math.round((analysis.sentiment_breakdown.mixed / den) * 1000) / 10}% (${analysis.sentiment_breakdown.mixed}/${den})`, notes: 'Likes core transcription but complains about tone-deaf sentiment/pricing' });
  s1.addRow({ key: 'Neutral / Informational', value: analysis.sentiment_breakdown.neutral, detail: `${Math.round((analysis.sentiment_breakdown.neutral / den) * 1000) / 10}% (${analysis.sentiment_breakdown.neutral}/${den})`, notes: 'Short remarks, ratings, or feature descriptions' });

  // Top Strengths & Opportunities
  s1.addRow({ key: '', value: '', detail: '', notes: '' });
  const tRow = s1.addRow({ key: 'TOP PRODUCT STRENGTHS', value: 'SUPPORTING REVIEWS', detail: 'PERCENTAGE', notes: 'KEY VALUE DRIVER' });
  tRow.font = { bold: true };
  tRow.eachCell(c => c.fill = SECTION_HEADER_FILL);

  for (const str of analysis.strengths.slice(0, 4)) {
    s1.addRow({ key: str.theme, value: str.review_count, detail: `${str.sample_percentage}% (${str.review_count}/${den})`, notes: str.why_valued });
  }

  s1.addRow({ key: '', value: '', detail: '', notes: '' });
  const oRow = s1.addRow({ key: 'PRIORITY IMPROVEMENT OPPORTUNITIES', value: 'RANK & PRIORITY SCORE', detail: 'SEVERITY & STAGE', notes: 'PROBLEM STATEMENT' });
  oRow.font = { bold: true };
  oRow.eachCell(c => c.fill = SECTION_HEADER_FILL);

  for (const op of analysis.opportunities.slice(0, 5)) {
    s1.addRow({ key: op.theme, value: `Rank #${op.rank} (Score: ${op.priority_score}/100)`, detail: `Severity: ${op.severity} | Stage: ${op.journey_stage}`, notes: op.problem_statement });
  }

  // Executive narrative
  s1.addRow({ key: '', value: '', detail: '', notes: '' });
  const nRow = s1.addRow({ key: 'EXECUTIVE NARRATIVE', value: analysis.executive_summary, detail: '', notes: '' });
  nRow.font = { italic: true };

  // -------------------------------------------------------------
  // Sheet 2: Review-Level Data
  // -------------------------------------------------------------
  const s2 = workbook.addWorksheet('Review-Level Data', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  s2.columns = [
    { header: 'Review ID', key: 'review_id', width: 16 },
    { header: 'Source Document', key: 'source_document', width: 28 },
    { header: 'Platform', key: 'platform', width: 18 },
    { header: 'Date', key: 'review_date', width: 15 },
    { header: 'Author', key: 'author', width: 20 },
    { header: 'Classification', key: 'classification', width: 26 },
    { header: 'Sentiment', key: 'sentiment', width: 14 },
    { header: 'Primary Theme', key: 'primary_theme', width: 24 },
    { header: 'Severity', key: 'severity', width: 14 },
    { header: 'Journey Stage', key: 'journey_stage', width: 24 },
    { header: 'Confidence', key: 'confidence', width: 12 },
    { header: 'Duplicate Status', key: 'duplicate_status', width: 18 },
    { header: 'Needs Review', key: 'needs_review', width: 14 },
    { header: 'Evidence Excerpt', key: 'evidence_excerpt', width: 45 },
    { header: 'User Problem', key: 'user_problem', width: 35 },
    { header: 'Product Implication', key: 'product_implication', width: 35 },
    { header: 'Recommended Improvement', key: 'recommended_improvement', width: 40 },
    { header: 'Original Review Text', key: 'original_text', width: 55 },
  ];
  formatHeaderRow(s2.getRow(1));
  s2.autoFilter = 'A1:R1';

  allReviews.forEach(r => {
    const row = s2.addRow({
      review_id: r.review_id,
      source_document: r.source_document,
      platform: r.platform,
      review_date: r.review_date || 'Unknown',
      author: r.author || 'Anonymous',
      classification: r.review_classification,
      sentiment: r.sentiment,
      primary_theme: r.primary_theme,
      severity: r.severity,
      journey_stage: r.user_journey_stage,
      confidence: r.confidence,
      duplicate_status: r.duplicate_status,
      needs_review: r.needs_human_review ? 'YES' : 'NO',
      evidence_excerpt: r.evidence_excerpt,
      user_problem: r.user_problem || '-',
      product_implication: r.product_implication || '-',
      recommended_improvement: r.recommended_improvement || '-',
      original_text: r.original_text,
    });

    row.alignment = { vertical: 'top', wrapText: true };
    row.border = BORDER_THIN;

    // Apply color highlights to sentiment & severity
    const sentimentCell = row.getCell('sentiment');
    if (r.sentiment === 'positive') {
      sentimentCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }; // Light green
    } else if (r.sentiment === 'negative') {
      sentimentCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // Light red
    } else if (r.sentiment === 'mixed') {
      sentimentCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }; // Light yellow
    }

    const severityCell = row.getCell('severity');
    if (r.severity === 'High') {
      severityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
      severityCell.font = { bold: true, color: { argb: 'FF991B1B' } };
    } else if (r.severity === 'Medium') {
      severityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEDD5' } };
      severityCell.font = { color: { argb: 'FF9A3412' } };
    }
  });

  // -------------------------------------------------------------
  // Sheet 3: Theme Analysis
  // -------------------------------------------------------------
  const s3 = workbook.addWorksheet('Theme Analysis', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  s3.columns = [
    { header: 'Theme', key: 'theme', width: 28 },
    { header: 'Unique Review Count', key: 'count', width: 20 },
    { header: 'Sample Percentage', key: 'pct', width: 18 },
    { header: 'Positive', key: 'pos', width: 12 },
    { header: 'Negative', key: 'neg', width: 12 },
    { header: 'Mixed', key: 'mixed', width: 12 },
    { header: 'Neutral', key: 'neutral', width: 12 },
    { header: 'Average Severity (1-3)', key: 'avg_sev', width: 22 },
    { header: 'Priority Score (0-100)', key: 'priority', width: 22 },
    { header: 'Supporting Review IDs', key: 'ids', width: 35 },
    { header: 'Representative Evidence', key: 'evidence', width: 50 },
  ];
  formatHeaderRow(s3.getRow(1));
  s3.autoFilter = 'A1:K1';

  analysis.theme_summaries.forEach(t => {
    const row = s3.addRow({
      theme: t.theme,
      count: t.unique_review_count,
      pct: `${t.sample_percentage}% (${t.unique_review_count}/${den})`,
      pos: t.positive_count,
      neg: t.negative_count,
      mixed: t.mixed_count,
      neutral: t.neutral_count,
      avg_sev: t.avg_severity_score > 0 ? t.avg_severity_score : 'Unscored',
      priority: t.priority_score,
      ids: t.supporting_review_ids.slice(0, 8).join(', ') + (t.supporting_review_ids.length > 8 ? '...' : ''),
      evidence: t.evidence_summary,
    });
    row.alignment = { vertical: 'middle', wrapText: true };
    row.border = BORDER_THIN;
  });

  // -------------------------------------------------------------
  // Sheet 4: Product Recommendations
  // -------------------------------------------------------------
  const s4 = workbook.addWorksheet('Product Recommendations', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  s4.columns = [
    { header: 'Rank', key: 'rank', width: 10 },
    { header: 'Opportunity / Theme', key: 'theme', width: 26 },
    { header: 'Priority Score', key: 'priority_score', width: 16 },
    { header: 'Severity', key: 'severity', width: 14 },
    { header: 'Journey Stage', key: 'stage', width: 24 },
    { header: 'Supporting Reviews', key: 'count', width: 18 },
    { header: 'Sample Share', key: 'pct', width: 16 },
    { header: 'Evidence-Backed Problem Statement', key: 'problem', width: 45 },
    { header: 'Proposed Product Improvement', key: 'improvement', width: 45 },
    { header: 'Representative Quotes', key: 'quotes', width: 50 },
    { header: 'Source References', key: 'sources', width: 30 },
    { header: 'Limitations & Context', key: 'limitations', width: 35 },
  ];
  formatHeaderRow(s4.getRow(1));
  s4.autoFilter = 'A1:L1';

  analysis.opportunities.forEach(op => {
    const row = s4.addRow({
      rank: op.rank,
      theme: op.theme,
      priority_score: `${op.priority_score}/100`,
      severity: op.severity,
      stage: op.journey_stage,
      count: op.unique_reviews_count,
      pct: `${op.sample_percentage}%`,
      problem: op.problem_statement,
      improvement: op.recommended_improvement,
      quotes: op.representative_quotes.join(' | '),
      sources: op.source_references.join(', '),
      limitations: op.limitations,
    });
    row.alignment = { vertical: 'top', wrapText: true };
    row.border = BORDER_THIN;

    if (op.severity === 'High') {
      const sevCell = row.getCell('severity');
      sevCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
      sevCell.font = { bold: true, color: { argb: 'FF991B1B' } };
    }
  });

  // -------------------------------------------------------------
  // Sheet 5: Source Register
  // -------------------------------------------------------------
  const s5 = workbook.addWorksheet('Source Register', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  s5.columns = [
    { header: 'Filename', key: 'name', width: 32 },
    { header: 'Platform', key: 'platform', width: 20 },
    { header: 'Content Hash / Version', key: 'hash', width: 24 },
    { header: 'File Size (Bytes)', key: 'size', width: 18 },
    { header: 'Extraction Status', key: 'status', width: 18 },
    { header: 'Candidate Records', key: 'candidates', width: 18 },
    { header: 'Usable Unique Reviews', key: 'usable', width: 22 },
    { header: 'Duplicates Excluded', key: 'dups', width: 20 },
    { header: 'Extraction Warnings', key: 'warnings', width: 45 },
  ];
  formatHeaderRow(s5.getRow(1));
  s5.autoFilter = 'A1:I1';

  documents.forEach(doc => {
    const docReviews = allReviews.filter(r => r.source_document_id === doc.id);
    const docUnique = docReviews.filter(r => r.duplicate_status === 'unique').length;
    const docDups = docReviews.filter(r => r.duplicate_status === 'exact_duplicate').length;

    const row = s5.addRow({
      name: doc.name,
      platform: doc.platform,
      hash: doc.content_hash,
      size: doc.size,
      status: doc.status.toUpperCase(),
      candidates: docReviews.length,
      usable: docUnique,
      dups: docDups,
      warnings: doc.warnings.length > 0 ? doc.warnings.join('; ') : 'None',
    });
    row.alignment = { vertical: 'middle', wrapText: true };
    row.border = BORDER_THIN;
  });

  // -------------------------------------------------------------
  // Sheet 6: Review Audit
  // -------------------------------------------------------------
  const s6 = workbook.addWorksheet('Review Audit', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  s6.columns = [
    { header: 'Review ID', key: 'id', width: 16 },
    { header: 'Audit Status', key: 'audit_status', width: 22 },
    { header: 'Audit Reason', key: 'reason', width: 35 },
    { header: 'Source Document', key: 'doc', width: 28 },
    { header: 'Author / Identifier', key: 'author', width: 20 },
    { header: 'Original Text Excerpt', key: 'text', width: 50 },
    { header: 'Duplicate Of ID', key: 'dup_of', width: 18 },
    { header: 'Confidence', key: 'conf', width: 14 },
  ];
  formatHeaderRow(s6.getRow(1));
  s6.autoFilter = 'A1:H1';

  const auditRecords = allReviews.filter(
    r => r.duplicate_status !== 'unique' || r.needs_human_review || r.confidence < 0.85 || r.user_edited
  );

  auditRecords.forEach(r => {
    let auditStatus = 'FLAGGED';
    let reason = '';

    if (r.duplicate_status === 'exact_duplicate') {
      auditStatus = 'EXCLUDED_DUPLICATE';
      reason = `Exact duplicate of record ${r.duplicate_of_id} (identical normalized text across documents).`;
    } else if (r.duplicate_status === 'potential_duplicate') {
      auditStatus = 'POTENTIAL_DUPLICATE';
      reason = `High lexical similarity (>82%) with ${r.duplicate_of_id}.`;
    } else if (r.needs_human_review) {
      auditStatus = 'NEEDS_HUMAN_REVIEW';
      reason = 'Ambiguous review boundary, missing rating metadata, or short text passage.';
    } else if (r.confidence < 0.85) {
      auditStatus = 'LOW_CONFIDENCE';
      reason = 'Model classification confidence below 85% threshold.';
    } else if (r.user_edited) {
      auditStatus = 'USER_MODIFIED';
      reason = 'Fields manually adjusted by user.';
    }

    const row = s6.addRow({
      id: r.review_id,
      audit_status: auditStatus,
      reason,
      doc: r.source_document,
      author: r.author || 'Anonymous',
      text: r.original_text.slice(0, 160) + (r.original_text.length > 160 ? '...' : ''),
      dup_of: r.duplicate_of_id || '-',
      conf: r.confidence,
    });
    row.alignment = { vertical: 'middle', wrapText: true };
    row.border = BORDER_THIN;
  });

  // Export buffer & download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Read_AI_Review_Intelligence_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
