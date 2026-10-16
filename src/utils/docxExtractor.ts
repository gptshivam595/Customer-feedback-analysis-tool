import mammoth from 'mammoth';

export interface ExtractedDocxResult {
  raw_text: string;
  size: number;
  content_hash: string;
  warnings: string[];
}

/**
 * Fast deterministic string hash for content tracking
 */
export function calculateSimpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return 'h_' + Math.abs(hash).toString(16);
}

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

/**
 * Extracts text and structure from a DOCX File or ArrayBuffer.
 */
export async function extractDocx(file: File | { name: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> }): Promise<ExtractedDocxResult> {
  const warnings: string[] = [];

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds maximum allowed limit of 25 MB.`);
  }

  if (file.size === 0) {
    throw new Error('Uploaded file is completely empty (0 bytes).');
  }

  // Validate extension
  const isDocx = file.name.toLowerCase().endsWith('.docx');
  const isTxt = file.name.toLowerCase().endsWith('.txt') || file.name.toLowerCase().endsWith('.md');

  if (!isDocx && !isTxt) {
    warnings.push(`File "${file.name}" does not have standard .docx extension. Attempting extraction.`);
  }

  try {
    const arrayBuffer = await file.arrayBuffer();

    if (isTxt) {
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(arrayBuffer);
      return {
        raw_text: text,
        size: file.size,
        content_hash: calculateSimpleHash(text),
        warnings,
      };
    }

    // Try extracting with mammoth
    const result = await mammoth.extractRawText({ arrayBuffer });
    const extractedText = result.value.trim();

    if (!extractedText) {
      warnings.push('Document text extraction yielded no readable text. File may contain only images or unsupported objects.');
    }

    if (result.messages && result.messages.length > 0) {
      for (const msg of result.messages) {
        if (msg.type === 'warning' || msg.type === 'error') {
          warnings.push(`Mammoth warning: ${msg.message}`);
        }
      }
    }

    return {
      raw_text: extractedText,
      size: file.size,
      content_hash: calculateSimpleHash(extractedText),
      warnings,
    };
  } catch (err: any) {
    throw new Error(`Failed to parse DOCX file "${file.name}": ${err.message || 'Corrupt or unreadable zip archive'}`);
  }
}
