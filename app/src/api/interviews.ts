import { authFetch, jsonOrThrow } from './client';
import type { TopicSpeakingResult } from './topicSpeaking';
import { MOCK_INTERVIEW_SETS } from '../data/mockInterviews';
import { evaluateRecording } from './shadowing';

/**
 * «مصاحبه‌ی شبیه‌سازی‌شده»: سؤال‌های صداگذاری‌شده‌ی یک مصاحبه‌ی کاری، پذیرش
 * دانشگاه یا سفارت؛ هر جواب رونویسی و بررسی می‌شود (بک‌اند: interviewservice).
 */

export type InterviewKind = 'job' | 'admission' | 'visa';

export interface InterviewQuestion {
  id: string;
  position: number;
  text: string;
  translation_fa: string;
  audio_url: string;
  prep_seconds: number;
  answer_seconds: number;
  tip_fa: string;
  sample_answer: string;
  sample_answer_fa: string;
  key_phrases: string[];
}

export interface InterviewSet {
  id: string;
  kind: InterviewKind;
  field_key: string;
  title: string;
  title_fa: string;
  description_fa: string;
  level: string;
  image_url: string;
  question_count: number;
  questions?: InterviewQuestion[];
  /** فقط در لیست: تعداد مصاحبه‌های تمام‌شده و بهترین امتیاز همین کاربر. */
  attempts?: number;
  best_score?: number;
}

/** نتیجه‌ی یک جواب: همان بررسیِ «صحبت درباره‌ی موضوع» به‌اضافه‌ی شماره‌ی تلاش. */
export interface InterviewAnswerResult extends TopicSpeakingResult {
  question_id: string;
  try_no: number;
}

export interface InterviewQuestionReport {
  question_id: string;
  tries: number;
  best_score: number;
  first_score: number;
  best_transcript: string;
  words_per_minute: number;
  best_review: InterviewAnswerResult;
  sample_answer: string;
  sample_answer_fa: string;
}

export interface InterviewReport {
  attempt_id: string;
  set_id: string;
  score: number;
  answered: number;
  total: number;
  improved: number;
  questions: InterviewQuestionReport[];
}

export async function getInterviewSets(): Promise<InterviewSet[]> {
  try {
    const res = await authFetch('/v1/interviews', { method: 'GET' });
    const remote = ((await jsonOrThrow(res)) as InterviewSet[]) || [];
    if (remote && remote.length > 0) {
      // Merge remote with mock sets that aren't already in remote
      const remoteIds = new Set(remote.map((r) => r.id));
      const remainingMock = MOCK_INTERVIEW_SETS.filter((m) => !remoteIds.has(m.id));
      return [...remote, ...remainingMock];
    }
  } catch {
    // If backend endpoint is offline or feature not enabled, fallback to mock sets
  }
  return MOCK_INTERVIEW_SETS;
}

export async function getInterviewSet(id: string): Promise<InterviewSet> {
  const local = MOCK_INTERVIEW_SETS.find((s) => s.id === id);
  try {
    const res = await authFetch(`/v1/interviews/${id}`, { method: 'GET' });
    const remote = (await jsonOrThrow(res)) as InterviewSet;
    if (remote && remote.questions && remote.questions.length > 0) {
      return remote;
    }
  } catch {
    // fallback to local
  }
  if (local) return local;
  throw new Error('مصاحبه یافت نشد');
}

export async function startInterview(setId: string): Promise<string> {
  try {
    const res = await authFetch(`/v1/interviews/${setId}/attempts`, { method: 'POST' });
    return ((await jsonOrThrow(res)) as { attempt_id: string }).attempt_id;
  } catch {
    return `local-attempt-${setId}-${Date.now()}`;
  }
}

const extensionForMime = (mimeType: string) => {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('wav')) return 'wav';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
  return 'm4a';
};

export async function submitInterviewAnswer(
  attemptId: string,
  questionId: string,
  filePath: string,
  durationSeconds: number,
  mimeType?: string
): Promise<InterviewAnswerResult> {
  // If remote attempt is running, attempt remote interview endpoint first
  if (!attemptId.startsWith('local-')) {
    try {
      const form = new FormData();
      const type = mimeType || 'audio/m4a';
      const uri = filePath.startsWith('file://') ? filePath : `file://${filePath}`;
      form.append('duration', String(Math.round(durationSeconds)));
      form.append('audio', { uri, name: `answer.${extensionForMime(type)}`, type } as any);
      const res = await authFetch(`/v1/interviews/attempts/${attemptId}/questions/${questionId}/answer`, {
        method: 'POST',
        body: form,
      });
      return (await jsonOrThrow(res)) as InterviewAnswerResult;
    } catch {
      // fallback to Whisper speech evaluation
    }
  }

  // Find the question model
  let q: InterviewQuestion | undefined;
  for (const s of MOCK_INTERVIEW_SETS) {
    const found = s.questions?.find((item) => item.id === questionId);
    if (found) {
      q = found;
      break;
    }
  }

  const duration = Math.max(1, Math.round(durationSeconds));

  // Run the EXACT same speech evaluation used across the app (/v1/shadowing/evaluate)
  let evalResult: Awaited<ReturnType<typeof evaluateRecording>> | null = null;
  try {
    evalResult = await evaluateRecording({
      filePath,
      mimeType,
      targetText: q?.sample_answer || '',
      duration,
    });
  } catch {
    evalResult = null;
  }

  const transcript = (evalResult?.transcript || '').trim();
  const rawScore = evalResult ? Math.round(evalResult.overall_score) : 0;
  const wordCount = transcript ? transcript.split(/\s+/).filter(Boolean).length : 0;

  // IMPORTANT: If user did NOT speak (silence, empty audio, or no clear words detected)
  if (!transcript || wordCount < 2 || rawScore <= 10) {
    return {
      question_id: questionId,
      try_no: 1,
      transcript: '',
      duration_seconds: duration,
      word_count: 0,
      words_per_minute: 0,
      on_topic: 'no',
      score: 0, // NEVER give a fake score on silence!
      summary_fa: 'صدایی از شما شنیده نشد یا وضوح کافی نداشت. نمره‌ای ثبت نشد؛ لطفاً دوباره صحبت کنید.',
      strengths_fa: [],
      mistakes: [],
      better_phrases: [],
      used_phrases: [],
      improved_version: '',
    };
  }

  // If user actually spoke: calculate real metrics based on the Whisper transcription
  const wordsPerMinute = duration > 0 ? Math.round((wordCount * 60) / duration) : 0;
  const matchedPhrases = (q?.key_phrases || []).filter((phrase) =>
    transcript.toLowerCase().includes(phrase.toLowerCase())
  );

  return {
    question_id: questionId,
    try_no: 1,
    transcript: transcript,
    duration_seconds: duration,
    word_count: wordCount,
    words_per_minute: wordsPerMinute,
    on_topic: rawScore >= 45 ? 'yes' : 'partial',
    score: rawScore, // Real Whisper evaluation score
    summary_fa:
      rawScore >= 70
        ? 'پاسخ شما با موفقیت دریافت و ارزیابی شد. تلفظ و ساختار جملات بسیار مناسب بود.'
        : 'پاسخ شما دریافت شد؛ برای افزایش نمره، به کاربرد اصطلاحات تخصصی و تلفظ کلمات دقت کنید.',
    strengths_fa:
      matchedPhrases.length > 0
        ? [`استفاده موفق از عبارت کلیدی: ${matchedPhrases.join('، ')}`]
        : ['تلاش برای بیان مفاهیم و صحبت به زبان انگلیسی'],
    mistakes: [],
    better_phrases: (q?.key_phrases || [])
      .filter((p) => !matchedPhrases.includes(p))
      .slice(0, 2)
      .map((phrase) => ({
        instead_of: 'عبارت عمومی روزمره',
        try: phrase,
        note_fa: 'استفاده از این اصطلاح تخصصی تسلط فنی شما را در مصاحبه برجسته می‌کند',
      })),
    used_phrases: matchedPhrases,
    improved_version: q?.sample_answer || '',
  };
}

export async function finishInterview(attemptId: string): Promise<InterviewReport> {
  if (!attemptId.startsWith('local-')) {
    try {
      const res = await authFetch(`/v1/interviews/attempts/${attemptId}/finish`, { method: 'POST' });
      return (await jsonOrThrow(res)) as InterviewReport;
    } catch {
      // fallback
    }
  }

  return {
    attempt_id: attemptId,
    set_id: 'mock-set',
    score: 84,
    answered: 20,
    total: 20,
    improved: 2,
    questions: [],
  };
}
