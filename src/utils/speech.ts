export interface SpeechMatchResult {
  score: number; // 0 to 100
  isMatch: boolean;
  spokenClean: string;
  targetClean: string;
  matchedWords: string[];
  missingWords: string[];
}

export function isTtsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

export function isSttSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function stopSpeech(): void {
  if (isTtsSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore WebView TTS engine errors
    }
  }
}

export function speakEnglish(
  text: string,
  options: { rate?: number; lang?: 'en-US' | 'en-GB'; onEnd?: () => void } = {}
): void {
  if (!text || !isTtsSupported()) {
    options.onEnd?.();
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/\s*\([^)]*\)/g, '').replace(/\s*\/\s*/g, ', ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = options.lang ?? 'en-US';
    utterance.rate = options.rate ?? 0.92;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => v.lang === utterance.lang) ||
      voices.find((v) => v.lang.startsWith('en'));
    if (preferred) {
      utterance.voice = preferred;
    }
    if (options.onEnd) {
      utterance.onend = () => options.onEnd?.();
      utterance.onerror = () => options.onEnd?.();
    }
    window.speechSynthesis.speak(utterance);
  } catch {
    options.onEnd?.();
  }
}

export function speakSlowEnglish(text: string, lang: 'en-US' | 'en-GB' = 'en-US', onEnd?: () => void): void {
  speakEnglish(text, { rate: 0.62, lang, onEnd });
}

export function speakArabic(text: string): void {
  if (!text || !isTtsSupported()) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-EG';
    utterance.rate = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const arVoice = voices.find((v) => v.lang.startsWith('ar'));
    if (arVoice) utterance.voice = arVoice;
    window.speechSynthesis.speak(utterance);
  } catch {
    // ignore WebView TTS engine errors
  }
}

export function normalizeEnglishForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

export function evaluateSpokenMatch(spoken: string, target: string): SpeechMatchResult {
  // Handle alternatives separated by "/" in book entries (e.g. "Single / Double")
  const variants = target
    .split('/')
    .map((part) => normalizeEnglishForComparison(part))
    .filter(Boolean);
  const spokenClean = normalizeEnglishForComparison(spoken);

  if (!spokenClean || variants.length === 0) {
    return {
      score: 0,
      isMatch: false,
      spokenClean,
      targetClean: variants[0] ?? '',
      matchedWords: [],
      missingWords: variants[0] ? variants[0].split(' ') : [],
    };
  }

  let bestScore = 0;
  let bestTarget = variants[0];
  let bestMatched: string[] = [];
  let bestMissing: string[] = [];

  for (const variant of variants) {
    const targetWords = variant.split(' ').filter(Boolean);
    const spokenWords = spokenClean.split(' ').filter(Boolean);
    const matchedWords = targetWords.filter((tw) =>
      spokenWords.some((sw) => sw === tw || levenshteinDistance(sw, tw) <= 1)
    );
    const missingWords = targetWords.filter((tw) => !matchedWords.includes(tw));
    const maxLen = Math.max(variant.length, spokenClean.length, 1);
    const charSim = Math.max(0, 1 - levenshteinDistance(spokenClean, variant) / maxLen);
    const wordSim = targetWords.length > 0 ? matchedWords.length / targetWords.length : 0;
    const combined = Math.round((charSim * 0.45 + wordSim * 0.55) * 100);
    if (combined >= bestScore) {
      bestScore = combined;
      bestTarget = variant;
      bestMatched = matchedWords;
      bestMissing = missingWords;
    }
  }

  return {
    score: bestScore,
    isMatch: bestScore >= 72,
    spokenClean,
    targetClean: bestTarget,
    matchedWords: bestMatched,
    missingWords: bestMissing,
  };
}

export interface RecognitionController {
  stop: () => void;
}

export function startSpeechRecognition(callbacks: {
  lang?: string;
  interimResults?: boolean;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (errorMessageAr: string) => void;
  onEnd?: () => void;
}): RecognitionController | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  };
  const SpeechRec = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!SpeechRec) {
    callbacks.onError?.('متصفحك لا يدعم التعرف المباشر على الكلام. يمكنك استخدام التسجيل الصوتي أو الكتابة اليدوية.');
    callbacks.onEnd?.();
    return null;
  }

  const recognition = new SpeechRec();
  recognition.lang = callbacks.lang ?? 'en-US';
  recognition.interimResults = callbacks.interimResults ?? true;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    let transcript = '';
    let isFinal = false;
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
      if (event.results[i].isFinal) isFinal = true;
    }
    callbacks.onResult(transcript.trim(), isFinal);
  };

  recognition.onerror = (event) => {
    const code = event.error;
    if (code === 'not-allowed' || code === 'service-not-allowed') {
      callbacks.onError?.('لم يتم السماح باستخدام الميكروفون. فعّل إذن الميكروفون من إعدادات المتصفح.');
    } else if (code === 'no-speech') {
      callbacks.onError?.('لم يُسمع صوت واضح. حاول الاقتراب من الميكروفون والتحدث بوضوح.');
    } else {
      callbacks.onError?.('تعذر إتمام التعرف على الصوت. تأكد من اتصال الإنترنت وإذن الميكروفون.');
    }
  };

  recognition.onend = () => {
    callbacks.onEnd?.();
  };

  try {
    recognition.start();
    return {
      stop: () => {
        try {
          recognition.stop();
        } catch {
          // ignore if already stopped
        }
      },
    };
  } catch {
    callbacks.onError?.('تعذر تشغيل الميكروفون حالياً.');
    callbacks.onEnd?.();
    return null;
  }
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export async function startAudioRecording(): Promise<{
  stop: () => Promise<string | null>;
} | null> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    return null;
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks: BlobPart[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.start();

  return {
    stop: () =>
      new Promise((resolve) => {
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          if (chunks.length === 0) {
            resolve(null);
            return;
          }
          const blob = new Blob(chunks, { type: 'audio/webm' });
          resolve(URL.createObjectURL(blob));
        };
        recorder.stop();
      }),
  };
}
