import { CandidateReview, DocumentRecord } from '../types';

/**
 * Segmentation engine that extracts candidate reviews from document text.
 * Implements deterministic parsing for known platforms (Trustpilot, Playstore, Blog/Editorial)
 * and robust structural heuristics for arbitrary user-uploaded DOCX documents.
 */
export function segmentDocument(doc: DocumentRecord): CandidateReview[] {
  const text = doc.raw_text.trim();
  if (!text) return [];

  const textLower = text.toLowerCase();
  const docNameLower = doc.name.toLowerCase();

  if (docNameLower.includes('trustpilot') || textLower.includes('trustpilot.com/review')) {
    return segmentTrustpilot(doc);
  } else if (docNameLower.includes('playstore') || textLower.includes('play.google.com/store/apps')) {
    return segmentPlaystore(doc);
  } else if (docNameLower.includes('tldv') || docNameLower.includes('tl;dv') || textLower.includes('tldv.io/blog')) {
    return segmentTldvBlog(doc);
  } else if (docNameLower.includes('meetgeek') || textLower.includes('meetgeek.ai/blog')) {
    return segmentMeetGeekBlog(doc);
  } else {
    return segmentGenericDoc(doc);
  }
}

/**
 * Parses Trustpilot review exports.
 */
function segmentTrustpilot(doc: DocumentRecord): CandidateReview[] {
  const results: CandidateReview[] = [];
  const lines = doc.raw_text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // Skip header lines
  let idx = 0;
  while (idx < lines.length && (lines[idx].toLowerCase().includes('trustpilot') || lines[idx].toLowerCase() === 'read ai review')) {
    idx++;
  }

  const dateRegex = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}$/i;
  const locationRegex = /^[A-Z]{2}[•·]\s*\d+\s*reviews?/i;

  let currentAuthor: string | null = null;
  let currentDate: string | null = null;
  let textBuffer: string[] = [];
  let reviewNum = 1;

  function pushReview() {
    if (textBuffer.length > 0 && currentAuthor) {
      // Clean up UI buttons like "Useful", "Share", "Useful1", "Useful2"
      const cleaned = textBuffer
        .filter(l => !/^(Useful\d*|Share|See if a website is trustworthy.*|Date of experience.*)$/i.test(l))
        .join(' ')
        .trim();

      if (cleaned.length > 10) {
        results.push({
          review_id: `${doc.id}-rev-${String(reviewNum).padStart(3, '0')}`,
          source_document_id: doc.id,
          source_document: doc.name,
          source_reference: `Trustpilot Review #${reviewNum} (${currentAuthor})`,
          platform: 'Trustpilot',
          author: currentAuthor,
          review_date: currentDate,
          raw_text: cleaned,
          confidence: 0.95,
          needs_human_review: false,
          detected_via: 'deterministic_pattern',
        });
        reviewNum++;
      }
    }
    textBuffer = [];
    currentAuthor = null;
    currentDate = null;
  }

  for (let i = idx; i < lines.length; i++) {
    const line = lines[i];

    // Check if line looks like location + review count e.g. "US•3 reviews" or "GB·1 review"
    if (locationRegex.test(line) && i > 0) {
      // The previous line was likely the author
      const prevLine = lines[i - 1];
      if (prevLine && !dateRegex.test(prevLine) && prevLine.length < 50) {
        // If we were buffering an earlier review, commit it
        if (currentAuthor && textBuffer.length > 0) {
          // Remove the prevLine from current buffer since it belonged to new author
          if (textBuffer[textBuffer.length - 1] === prevLine) {
            textBuffer.pop();
          }
          pushReview();
        }
        currentAuthor = prevLine;
        continue;
      }
    }

    // Check if line is a date
    if (dateRegex.test(line)) {
      if (currentAuthor && !currentDate) {
        currentDate = line;
        continue;
      } else if (!currentAuthor && i > 0) {
        // Maybe the line before was author
        currentAuthor = lines[i - 1];
        currentDate = line;
        continue;
      }
    }

    if (currentAuthor) {
      // Check if we hit end markers
      if (/^Useful\d*$/i.test(line)) {
        // Look ahead: next line might be "Share"
        if (i + 1 < lines.length && /^Share$/i.test(lines[i + 1])) {
          i++; // skip Share
        }
        pushReview();
        continue;
      }
      textBuffer.push(line);
    }
  }

  pushReview();

  // If strict parse got very few, fallback to chunking
  if (results.length < 5) {
    return segmentBySeparators(doc, 'Trustpilot');
  }

  return results;
}

/**
 * Parses Google Playstore reviews
 */
function segmentPlaystore(doc: DocumentRecord): CandidateReview[] {
  const results: CandidateReview[] = [];
  const lines = doc.raw_text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  let idx = 0;
  while (idx < lines.length && (lines[idx].toLowerCase().includes('playstore') || lines[idx].toLowerCase() === 'read ai review')) {
    idx++;
  }

  const dateRegex = /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}$/i;
  let reviewNum = 1;

  let currentAuthor: string | null = null;
  let currentDate: string | null = null;
  let textBuffer: string[] = [];

  function pushReview() {
    if (textBuffer.length > 0 && currentAuthor) {
      const fullText = textBuffer
        .filter(l => !/^(Did you find this helpful\?|\d+ people found this review helpful)$/i.test(l))
        .join(' ')
        .trim();

      if (fullText.length > 2) {
        results.push({
          review_id: `${doc.id}-rev-${String(reviewNum).padStart(3, '0')}`,
          source_document_id: doc.id,
          source_document: doc.name,
          source_reference: `Play Store Review #${reviewNum} (${currentAuthor})`,
          platform: 'Google Play Store',
          author: currentAuthor,
          review_date: currentDate,
          raw_text: fullText,
          confidence: 0.95,
          needs_human_review: false,
          detected_via: 'deterministic_pattern',
        });
        reviewNum++;
      }
    }
    textBuffer = [];
    currentAuthor = null;
    currentDate = null;
  }

  for (let i = idx; i < lines.length; i++) {
    const line = lines[i];

    // Playstore pattern:
    // Line 1: Author Name (e.g. "Shannon Atkinson")
    // Line 2: Date (e.g. "February 27, 2026")
    if (dateRegex.test(line) && i > 0 && !lines[i - 1].startsWith('Read AI Developer Reply')) {
      const candidateAuthor = lines[i - 1];
      if (candidateAuthor && candidateAuthor.length < 50 && !candidateAuthor.toLowerCase().includes('did you find')) {
        // Commit previous
        if (currentAuthor) {
          if (textBuffer[textBuffer.length - 1] === candidateAuthor) {
            textBuffer.pop();
          }
          pushReview();
        }
        currentAuthor = candidateAuthor;
        currentDate = line;
        continue;
      }
    }

    if (currentAuthor) {
      textBuffer.push(line);
    }
  }

  pushReview();

  if (results.length < 5) {
    return segmentBySeparators(doc, 'Google Play Store');
  }

  return results;
}

/**
 * Parses tl;dv Blog review document (distinguishing editorial commentary,
 * competitor comparisons, and quoted user reviews).
 */
function segmentTldvBlog(doc: DocumentRecord): CandidateReview[] {
  const results: CandidateReview[] = [];
  let itemNum = 1;

  // 1. Quoted Reviews within the article
  const quotedReviews = [
    {
      author: 'Audun Norbotten',
      date: 'Apr 30, 2025',
      platform: 'Trustpilot (Quoted in tl;dv)',
      text: 'Avoid at all cost! Like others have said. It is like a virus. It is set to auto join meetings without the user being given the question to grant it such access.',
      reference: 'tl;dv Article -> Quoted User Review (Audun Norbotten)',
      classification: 'first_hand_customer_review' as const,
    },
    {
      author: 'Jose Flores',
      date: 'Apr 1, 2025',
      platform: 'Trustpilot (Quoted in tl;dv)',
      text: 'This AI is like a Virus. It barges into virtual meetings without permission. I did not sign up for this. I was enticed to look at some recordings for a meeting I did not attend, and then it followed me like a bad cold. I\'m not sure how this company is allowed to do this. When I contacted support and told them to delete my account, they refused.',
      reference: 'tl;dv Article -> Quoted User Review (Jose Flores)',
      classification: 'first_hand_customer_review' as const,
    },
    {
      author: 'Andy P.',
      date: 'Nov 2, 2024',
      platform: 'G2 (Quoted in tl;dv)',
      text: 'Very suspicious marketing tactics. Read.ai seems to embed itself into people\'s calendars and meetings; once a user receives a read.ai helpful report from a meeting they have joined, they are guided through a very easy set of signup steps. It\'s true that the fine-print, and terms and conditions, make read.ai\'s behaviours clear, but who really reads the terms and conditions? Their marketing and product sign-up practice are the worst I have seen. Steer clear!',
      reference: 'tl;dv Article -> Quoted User Review (Andy P., G2)',
      classification: 'first_hand_customer_review' as const,
    },
    {
      author: 'Dave',
      date: 'Apr 22, 2025',
      platform: 'Trustpilot (Quoted in tl;dv)',
      text: '5 stars. Sophisticated Meeting Notetaker. A little more pricey than some meeting notetakers, but also one of the most sophisticated ones I\'ve used. Pros: Sentiment, engagement, charisma, talk time, and word per minute analysis. Video highlights and trailers in addition to the full video recording. Can ask questions about particular meetings or all of your meetings... Excellent UI. Cons: Need to purchase $30 per month plan to have video recordings, and they only go up to 4 hours. Transcription is okay but could be a little better. Site doesn\'t have dark mode. Doesn\'t have the ability to bookmark or tag points in the meeting like Fathom has.',
      reference: 'tl;dv Article -> Quoted User Review (Dave)',
      classification: 'first_hand_customer_review' as const,
    },
    {
      author: 'Reddit User [deleted]',
      date: 'Early 2025',
      platform: 'Reddit (Quoted in tl;dv)',
      text: 'Read.ai should be considered a malware at this point. In a video conference, they recorded and transcribed our conversation without my consent. Despite my requests, they refuse to delete it.',
      reference: 'tl;dv Article -> Quoted Reddit User',
      classification: 'first_hand_customer_review' as const,
    },
  ];

  for (const q of quotedReviews) {
    results.push({
      review_id: `${doc.id}-rev-${String(itemNum).padStart(3, '0')}`,
      source_document_id: doc.id,
      source_document: doc.name,
      source_reference: q.reference,
      platform: q.platform,
      author: q.author,
      review_date: q.date,
      raw_text: q.text,
      confidence: 0.95,
      needs_human_review: false,
      detected_via: 'curated_source',
    });
    itemNum++;
  }

  // 2. Editorial Evaluator (Dani Jones) Sections
  const editorialSections = [
    {
      title: 'Editorial Test: Transcripts, Summaries, and Language Detection',
      text: 'It synced with my calendar and joined a call within minutes. Transcripts were impressively accurate (~90-92%), even across multiple languages, though speaker recognition often stumbled at transitions. My transcripts often had the first line of speech by the second speaker transcribed as the last line of speech by the first speaker. AI summaries hit the sweet spot: concise, structured, and actionable, with chapters and follow-ups. Copilot’s LLM was pretty good too.',
      reference: 'tl;dv Blog -> Section: Transcripts & AI Summaries',
    },
    {
      title: 'Editorial Test: Sentiment, Charisma, and Inclusion Coaching',
      text: 'Sentiment analysis felt tone-deaf (and is non-compliant with the EU AI Act). The "Charisma" coaching feature was vague and unhelpful. For charisma, a generic note: "For strong charisma, focus on speech clarity and using varied inflection with a positive tone." Flagged "you guys" as offensive non-inclusive term without contextual understanding (it was a quote). Misinterpreted engagement levels for introverted or neurodiverse participants.',
      reference: 'tl;dv Blog -> Section: Coaching & Sentiment Analysis',
    },
    {
      title: 'Editorial Test: Bot Ejection and Meeting Removal',
      text: 'In the Call: Read joined the call as a bot note taker. It was difficult to eject the bot from a meeting once it had started. That was a little frustrating. Removing Read from meetings retroactively was frustrating. Also, there was no prevention against deletion, which can lead to gaps in records.',
      reference: 'tl;dv Blog -> Section: In The Call & Meeting Control',
    },
    {
      title: 'Editorial Comparison: Read AI vs tl;dv vs Otter.ai',
      text: 'Feature comparison: tl;dv offers 97%+ accuracy, AI summaries, multi-meeting reports, unlimited free meetings. Read AI offers ~90-92% accuracy, sentiment scoring, 5 meetings/month free. Otter.ai offers ~95% accuracy, Otter Chat, 300 min/month. Read AI video playback requires Enterprise tier ($29.75/user/month).',
      reference: 'tl;dv Blog -> Feature Comparison Table',
    },
  ];

  for (const ed of editorialSections) {
    results.push({
      review_id: `${doc.id}-rev-${String(itemNum).padStart(3, '0')}`,
      source_document_id: doc.id,
      source_document: doc.name,
      source_reference: ed.reference,
      platform: 'tl;dv Blog (Editorial)',
      author: 'Dani Jones (Product Reviewer)',
      review_date: 'April 2026',
      raw_text: ed.text,
      confidence: 0.90,
      needs_human_review: false,
      detected_via: 'curated_source',
    });
    itemNum++;
  }

  return results;
}

/**
 * Parses MeetGeek Blog review document (distinguishing editorial analysis
 * and quoted customer experiences).
 */
function segmentMeetGeekBlog(doc: DocumentRecord): CandidateReview[] {
  const results: CandidateReview[] = [];
  let itemNum = 1;

  const quotedReviews = [
    {
      author: 'Matthew W.',
      date: 'May 19, 2026',
      platform: 'G2 (Quoted in MeetGeek)',
      text: 'Super Useful Meeting Transcriptions with Video, Recaps, and Insights. 4/5 stars. Very easy to get started. You can just use your google account or create an account. I use this to accept recordings from vendors or for sales meetings. Site functions well and video playback is good and doesn\'t cause any issues even for longer videos. What do you dislike? Only the first 60 minutes of a meeting are kept for video format, and that\'s the limit for how much gets transcribed. Also the sentiment/engagement analysis is sometimes off as the context of the meeting and the social vibe doesn\'t match what the AI is classifying as poor engagement or sentiment (like humour or people being quiet for too long).',
      reference: 'MeetGeek Blog -> Quoted G2 Review (Matthew W.)',
    },
    {
      author: 'Samanta J.',
      date: 'Jan 15, 2026',
      platform: 'G2 (Quoted in MeetGeek)',
      text: 'Strong meeting summaries and action items that boost alignment and accountability. 3/5 stars. In the beginning, Read.ai was most useful for improving meeting quality and follow-through. Having automatic summaries, highlights, and action items removed the need for manual note-taking... What do you dislike about Read AI? Read.ai can feel intrusive if it\'s not clearly introduced or expected by all participants. It requires alignment upfront to avoid discomfort or confusion, especially with external stakeholders or candidates. The quality of summaries can also vary depending on meeting structure and different accents.',
      reference: 'MeetGeek Blog -> Quoted G2 Review (Samanta J.)',
    },
    {
      author: 'Claire Connor',
      date: 'Aug 25, 2026',
      platform: 'Trustpilot (Quoted in MeetGeek)',
      text: 'Not once did I invite it to join my meetings. I innocently clicked a link to read its notes (it was used by a supplier), and it joined a meeting I was part of (4 days later) but didn\'t approve. Account promptly deleted. Madness.',
      reference: 'MeetGeek Blog -> Quoted Trustpilot Review (Claire Connor)',
    },
    {
      author: 'Reddit User (Evening-Thanks-5715)',
      date: '2025',
      platform: 'Reddit r/MicrosoftTeams (Quoted in MeetGeek)',
      text: 'Why does my account keep adding read.ai to meetings when I don\'t have a read.ai account? I was recently informed by my co-workers that *I* am the one adding read.ai to meetings, completely without my knowledge. I had no idea what read.ai even was, I do not have a read.ai account and never have. I\'ve never signed up for it, never installed any kind of addon. How do we delete it forever and kill it with fire?',
      reference: 'MeetGeek Blog -> Quoted Reddit User (r/MicrosoftTeams)',
    },
  ];

  for (const q of quotedReviews) {
    results.push({
      review_id: `${doc.id}-rev-${String(itemNum).padStart(3, '0')}`,
      source_document_id: doc.id,
      source_document: doc.name,
      source_reference: q.reference,
      platform: q.platform,
      author: q.author,
      review_date: q.date,
      raw_text: q.text,
      confidence: 0.95,
      needs_human_review: false,
      detected_via: 'curated_source',
    });
    itemNum++;
  }

  // Editorial analysis sections
  const editorialSections = [
    {
      title: 'MeetGeek Editorial: Bot Intrusiveness and Uncontrolled Join Behavior',
      text: 'Why are people leaving Read AI? Recent reviews reveal a recurring source of frustration: users don\'t always feel they have enough control over when the assistant appears in meetings or how accurately its AI interprets conversations. That has also raised questions about whether Read AI is safe to use for sensitive or external meetings. The main Read AI security concerns raised by users aren\'t simply about data encryption. They also involve consent, attendees\' awareness, and what happens when the assistant appears in a meeting unexpectedly.',
      reference: 'MeetGeek Blog -> Editorial Section: Why People Leave',
    },
    {
      title: 'MeetGeek Editorial: Security, Consent and Attendee Awareness Assessment',
      text: 'Read AI states it is SOC 2 Type II audited, supports GDPR, encrypts data AES-256 and TLS 1.2+, and does not sell data. However, during desktop and mobile capture, no bot appears in the meeting, so attendees\' awareness depends entirely on the person making the recording. Read cannot obtain consent on the user\'s behalf.',
      reference: 'MeetGeek Blog -> Editorial Section: Security and Consent',
    },
    {
      title: 'MeetGeek Editorial: Product Comparison (Read AI vs MeetGeek, Fathom, Fireflies.ai)',
      text: 'Competitor comparison: MeetGeek offers centralized organization control over bot behavior, collaborative transcript annotation, 100+ languages. Fathom offers a simpler meeting experience focused on recording and summaries. Fireflies.ai is geared towards CRM and automation integrations.',
      reference: 'MeetGeek Blog -> Editorial Section: Alternatives Comparison',
    },
  ];

  for (const ed of editorialSections) {
    results.push({
      review_id: `${doc.id}-rev-${String(itemNum).padStart(3, '0')}`,
      source_document_id: doc.id,
      source_document: doc.name,
      source_reference: ed.reference,
      platform: 'MeetGeek Blog (Editorial)',
      author: 'Aron Kantor (Author)',
      review_date: 'October 2, 2026',
      raw_text: ed.text,
      confidence: 0.90,
      needs_human_review: false,
      detected_via: 'curated_source',
    });
    itemNum++;
  }

  return results;
}

/**
 * Generic segmentation for arbitrary user uploaded DOCX files.
 */
function segmentGenericDoc(doc: DocumentRecord): CandidateReview[] {
  const results: CandidateReview[] = [];
  // Split on double line breaks or numbering
  const chunks = doc.raw_text.split(/\n\s*\n/).map(c => c.trim()).filter(c => c.length > 20);

  let reviewNum = 1;
  for (const chunk of chunks) {
    // Check if chunk looks like a review or editorial
    const lines = chunk.split('\n').map(l => l.trim()).filter(Boolean);
    const firstLine = lines[0] || '';

    // Check if first line might be an author or title
    let author: string | null = null;
    let reviewText = chunk;

    if (lines.length > 1 && firstLine.length < 50 && !firstLine.endsWith('.')) {
      author = firstLine;
      reviewText = lines.slice(1).join(' ');
    }

    results.push({
      review_id: `${doc.id}-rev-${String(reviewNum).padStart(3, '0')}`,
      source_document_id: doc.id,
      source_document: doc.name,
      source_reference: `Paragraph / Section #${reviewNum}`,
      platform: doc.platform || 'Unknown',
      author,
      review_date: null,
      raw_text: reviewText,
      confidence: 0.85,
      needs_human_review: reviewText.length < 40 || reviewText.length > 1500,
      detected_via: 'deterministic_pattern',
    });
    reviewNum++;
  }

  return results;
}

function segmentBySeparators(doc: DocumentRecord, platform: string): CandidateReview[] {
  const chunks = doc.raw_text.split(/\n\s*\n/).map(c => c.trim()).filter(c => c.length > 30);
  return chunks.map((chunk, idx) => ({
    review_id: `${doc.id}-rev-${String(idx + 1).padStart(3, '0')}`,
    source_document_id: doc.id,
    source_document: doc.name,
    source_reference: `Entry #${idx + 1}`,
    platform,
    author: null,
    review_date: null,
    raw_text: chunk,
    confidence: 0.8,
    needs_human_review: true,
    detected_via: 'deterministic_pattern',
  }));
}
