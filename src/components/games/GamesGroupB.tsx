import React, { useEffect, useMemo, useState } from 'react';
import { Volume2, Mic, Square, Send, Loader2, Timer } from 'lucide-react';
import type { DifficultyLevel } from '../../types/curriculum';
import { ALL_VOCAB_ITEMS } from '../../data/curriculum';
import { useApp } from '../../context/AppContext';
import { VocabIllustration } from '../VocabIllustration';
import {
  evaluateSpokenMatch,
  speakEnglish,
  speakSlowEnglish,
  startSpeechRecognition,
} from '../../utils/speech';
import { apiUrl } from '../../utils/api';
import {
  DIALOGUE_FILL_BANK,
  SENTENCE_CHALLENGE_PROMPTS,
  getSimpleVocabPool,
  shuffleArray,
  type GameReport,
} from './gameData';

interface GameProps {
  gameId: number;
  difficulty: DifficultyLevel;
  onFinish: (report: GameReport) => void;
}

export const GamesGroupB: React.FC<GameProps> = ({ gameId, difficulty, onFinish }) => {
  const { activeProfile, recordMistake } = useApp();
  const voiceAccent = activeProfile?.settings.voiceAccent ?? 'en-US';
  const speechRate = activeProfile?.settings.speechRate ?? 0.92;

  const [startTime] = useState(() => Date.now());
  const [roundIdx, setRoundIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [mistakes, setMistakes] = useState<{ en: string; ar: string; lessonId: string }[]>([]);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const rounds = difficulty === 'hard' ? 8 : difficulty === 'medium' ? 6 : 4;
  const vocabPool = useMemo(() => shuffleArray(getSimpleVocabPool(difficulty)), [difficulty, gameId]);

  const finishNow = (
    finalCorrect: number,
    finalWrong: number,
    finalMistakes: { en: string; ar: string; lessonId: string }[],
    titleAr: string
  ) => {
    const durationSec = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    const mult = difficulty === 'hard' ? 16 : difficulty === 'medium' ? 13 : 10;
    onFinish({
      gameId,
      gameTitleAr: titleAr,
      correctCount: finalCorrect,
      wrongCount: finalWrong,
      durationSec,
      xpEarned: Math.max(15, finalCorrect * mult),
      mistakes: finalMistakes,
    });
  };

  const advanceOrFinish = (
    wasCorrect: boolean,
    mistakeItem: { en: string; ar: string; lessonId: string } | null,
    titleAr: string,
    maxRounds: number
  ) => {
    const nextCorrect = correctCount + (wasCorrect ? 1 : 0);
    const nextWrong = wrongCount + (wasCorrect ? 0 : 1);
    const nextMistakes = mistakeItem ? [...mistakes, mistakeItem] : mistakes;
    if (mistakeItem) {
      recordMistake({
        id: `game_${gameId}_${mistakeItem.en}`,
        en: mistakeItem.en,
        ar: mistakeItem.ar,
        lessonId: mistakeItem.lessonId,
        source: 'game',
      });
    }
    setCorrectCount(nextCorrect);
    setWrongCount(nextWrong);
    setMistakes(nextMistakes);

    setTimeout(() => {
      setFeedback(null);
      if (roundIdx + 1 >= maxRounds) {
        finishNow(nextCorrect, nextWrong, nextMistakes, titleAr);
      } else {
        setRoundIdx((r) => r + 1);
      }
    }, 950);
  };

  /* --------------------------------------------------------------------------
     GAME 9: تحدي الذاكرة (Memory Flip Cards)
     -------------------------------------------------------------------------- */
  const memPairsCount = difficulty === 'hard' ? 6 : difficulty === 'medium' ? 5 : 4;
  const memoryDeck = useMemo(() => {
    const slice = vocabPool.slice(0, memPairsCount);
    const cards = slice.flatMap((item) => [
      { cardId: `${item.id}_en`, pairId: item.id, text: item.en, isEn: true, item },
      { cardId: `${item.id}_ar`, pairId: item.id, text: item.ar, isEn: false, item },
    ]);
    return shuffleArray(cards);
  }, [vocabPool, memPairsCount]);

  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [solvedPairIds, setSolvedPairIds] = useState<string[]>([]);

  /* --------------------------------------------------------------------------
     GAME 10: خمن الصورة (Custom VocabIllustration SVG)
     -------------------------------------------------------------------------- */
  const illustratedItems = useMemo(
    () => shuffleArray(ALL_VOCAB_ITEMS.filter((i) => Boolean(i.illustrationKey))),
    [gameId, difficulty]
  );

  /* --------------------------------------------------------------------------
     GAME 11: تحدي السرعة (Countdown Speed Challenge)
     -------------------------------------------------------------------------- */
  const speedLimit = difficulty === 'hard' ? 30 : 45;
  const [timeLeft, setTimeLeft] = useState(speedLimit);

  useEffect(() => {
    if (gameId !== 11) return;
    if (timeLeft <= 0) {
      finishNow(correctCount, wrongCount, mistakes, 'تحدي السرعة');
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [gameId, timeLeft]);

  /* --------------------------------------------------------------------------
     GAME 12 & 15 Helpers
     -------------------------------------------------------------------------- */
  const dialogueList = useMemo(() => shuffleArray(DIALOGUE_FILL_BANK), [gameId, difficulty]);
  const phraseItems = useMemo(
    () => shuffleArray(ALL_VOCAB_ITEMS.filter((i) => i.isPhrase || i.en.split(' ').length >= 3)),
    [gameId, difficulty]
  );

  /* --------------------------------------------------------------------------
     GAME 13: تحدي النطق (Pronunciation Challenge)
     -------------------------------------------------------------------------- */
  const [listeningMic, setListeningMic] = useState(false);
  const [spokenInput, setSpokenInput] = useState('');
  const [micController, setMicController] = useState<{ stop: () => void } | null>(null);

  /* --------------------------------------------------------------------------
     GAME 14: تحدي الجمل (AI or keyword evaluation)
     -------------------------------------------------------------------------- */
  const challengePrompts = useMemo(() => shuffleArray(SENTENCE_CHALLENGE_PROMPTS), [gameId, difficulty]);
  const [sentenceDraft, setSentenceDraft] = useState('');
  const [evaluatingSentence, setEvaluatingSentence] = useState(false);

  // GAME 9 RENDER: تحدي الذاكرة
  if (gameId === 9) {
    const handleCardClick = (index: number) => {
      const card = memoryDeck[index];
      if (!card || solvedPairIds.includes(card.pairId) || flippedIndices.includes(index) || flippedIndices.length >= 2) {
        return;
      }
      if (card.isEn) speakEnglish(card.text, { rate: speechRate, lang: voiceAccent });
      const nextFlipped = [...flippedIndices, index];
      setFlippedIndices(nextFlipped);

      if (nextFlipped.length === 2) {
        const c1 = memoryDeck[nextFlipped[0]];
        const c2 = memoryDeck[nextFlipped[1]];
        if (c1.pairId === c2.pairId) {
          const nextSolved = [...solvedPairIds, c1.pairId];
          setSolvedPairIds(nextSolved);
          setCorrectCount((c) => c + 1);
          setTimeout(() => {
            setFlippedIndices([]);
            if (nextSolved.length === memPairsCount) {
              finishNow(correctCount + 1, wrongCount, mistakes, 'تحدي الذاكرة');
            }
          }, 450);
        } else {
          setWrongCount((w) => w + 1);
          setTimeout(() => setFlippedIndices([]), 850);
        }
      }
    };

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between text-sm">
          <span>اقلب البطاقات لتطابق كل كلمة إنجليزية بمعناها العربي</span>
          <span className="font-numeric font-bold text-teal-700">
            الأزواج: {solvedPairIds.length} / {memPairsCount}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {memoryDeck.map((card, idx) => {
            const revealed = flippedIndices.includes(idx) || solvedPairIds.includes(card.pairId);
            return (
              <button
                key={card.cardId}
                type="button"
                onClick={() => handleCardClick(idx)}
                className={`h-24 p-3 rounded-2xl border font-bold text-sm transition-all flex items-center justify-center text-center ${
                  solvedPairIds.includes(card.pairId)
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 text-emerald-800 dark:text-emerald-300'
                    : revealed
                    ? 'bg-white dark:bg-slate-800 border-teal-600 text-slate-900 dark:text-white'
                    : 'bg-teal-700 text-white border-teal-800 hover:bg-teal-800'
                }`}
              >
                {revealed ? (
                  <span dir={card.isEn ? 'ltr' : 'rtl'} className={card.isEn ? 'font-english' : ''}>
                    {card.text}
                  </span>
                ) : (
                  <span>؟</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // GAME 10 RENDER: خمن الصورة
  if (gameId === 10) {
    const maxPicRounds = Math.min(rounds, illustratedItems.length);
    const target = illustratedItems[roundIdx % illustratedItems.length];
    const distractors = shuffleArray(illustratedItems.filter((i) => i.id !== target.id)).slice(0, 3);
    const options = shuffleArray([target, ...distractors]);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            الصورة <span className="font-numeric font-bold">{roundIdx + 1}</span> /{' '}
            <span className="font-numeric">{maxPicRounds}</span>
          </span>
          <span className="font-numeric font-bold text-teal-700">صح: {correctCount}</span>
        </div>

        <div className="p-6 rounded-2xl bg-[#F8F7F4] dark:bg-slate-800 flex flex-col items-center gap-3">
          <VocabIllustration illustrationKey={target.illustrationKey} size={108} />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">ما الكلمة الإنجليزية التي تعبّر عن هذه الصورة؟</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={Boolean(feedback)}
              onClick={() => {
                const ok = opt.id === target.id;
                if (ok) speakEnglish(target.en, { rate: speechRate, lang: voiceAccent });
                setFeedback({
                  ok,
                  msg: ok ? `صحيح! ${target.en} (${target.ar})` : `خطأ — الصورة هي: ${target.en} (${target.ar})`,
                });
                advanceOrFinish(
                  ok,
                  ok ? null : { en: target.en, ar: target.ar, lessonId: target.lessonId },
                  'خمن الصورة',
                  maxPicRounds
                );
              }}
              dir="ltr"
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-600 font-english font-bold text-base"
            >
              {opt.en}
            </button>
          ))}
        </div>

        {feedback && (
          <p className={`text-center text-sm font-bold ${feedback.ok ? 'text-emerald-600' : 'text-rose-600'}`}>
            {feedback.msg}
          </p>
        )}
      </div>
    );
  }

  // GAME 11 RENDER: تحدي السرعة
  if (gameId === 11) {
    const target = vocabPool[roundIdx % vocabPool.length];
    const distractors = shuffleArray(vocabPool.filter((i) => i.id !== target.id)).slice(0, 3);
    const options = shuffleArray([target, ...distractors]);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 font-numeric font-extrabold text-lg text-rose-600">
            <Timer className="w-5 h-5" />
            {timeLeft} ثانية
          </span>
          <span className="font-numeric font-bold text-teal-700">
            النقاط: {correctCount} · الأخطاء: {wrongCount}
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-[#F8F7F4] dark:bg-slate-800 text-center">
          <p dir="ltr" className="font-english text-3xl font-extrabold">
            {target.en}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                if (opt.id === target.id) {
                  setCorrectCount((c) => c + 1);
                } else {
                  setWrongCount((w) => w + 1);
                  const m = { en: target.en, ar: target.ar, lessonId: target.lessonId };
                  setMistakes((prev) => [...prev, m]);
                  recordMistake({
                    id: `game_11_${target.id}`,
                    en: target.en,
                    ar: target.ar,
                    lessonId: target.lessonId,
                    source: 'game',
                  });
                }
                setRoundIdx((r) => r + 1);
              }}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-600 font-bold text-base"
            >
              {opt.ar}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // GAME 12 RENDER: أكمل المحادثة
  if (gameId === 12) {
    const maxDlg = Math.min(rounds, dialogueList.length);
    const q = dialogueList[roundIdx % dialogueList.length];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            الموقف: {q.contextAr} (<span className="font-numeric">{roundIdx + 1}/{maxDlg}</span>)
          </span>
          <span className="font-numeric font-bold text-teal-700">صح: {correctCount}</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#F8F7F4] dark:bg-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-700">المتحدث الأول يسأل:</span>
            <button
              type="button"
              onClick={() => speakEnglish(q.speakerAEn, { rate: speechRate, lang: voiceAccent })}
              className="inline-flex items-center gap-1 text-xs font-bold text-teal-700"
            >
              <Volume2 className="w-4 h-4" />
              استمع
            </button>
          </div>
          <p dir="ltr" className="font-english text-lg font-extrabold text-right">
            {q.speakerAEn}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">{q.speakerAAr}</p>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {q.options.map((opt, idx) => (
            <button
              key={opt}
              type="button"
              disabled={Boolean(feedback)}
              onClick={() => {
                const ok = idx === q.correctIndex;
                setFeedback({ ok, msg: q.explanationAr });
                advanceOrFinish(
                  ok,
                  ok ? null : { en: q.options[q.correctIndex], ar: q.explanationAr, lessonId: q.lessonId },
                  'أكمل المحادثة',
                  maxDlg
                );
              }}
              dir="ltr"
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-600 font-english font-bold text-sm sm:text-base text-left"
            >
              {opt}
            </button>
          ))}
        </div>

        {feedback && (
          <p className={`text-sm font-bold ${feedback.ok ? 'text-emerald-600' : 'text-rose-600'}`}>
            {feedback.msg}
          </p>
        )}
      </div>
    );
  }

  // GAME 13 RENDER: تحدي النطق
  if (gameId === 13) {
    const target = vocabPool[roundIdx % vocabPool.length];

    const toggleMic = () => {
      if (listeningMic && micController) {
        micController.stop();
        setListeningMic(false);
        return;
      }
      setSpokenInput('');
      setListeningMic(true);
      const ctrl = startSpeechRecognition({
        lang: voiceAccent,
        onResult: (txt, isFinal) => {
          setSpokenInput(txt);
          if (isFinal) {
            setListeningMic(false);
            const match = evaluateSpokenMatch(txt, target.en);
            setFeedback({
              ok: match.isMatch,
              msg: match.isMatch
                ? `نطق واضح! نسبة التطابق ${match.score}%`
                : `تعرف المتصفح على "${txt}" — حاول نطق: ${target.en}`,
            });
            advanceOrFinish(
              match.isMatch,
              match.isMatch ? null : { en: target.en, ar: target.ar, lessonId: target.lessonId },
              'تحدي النطق',
              rounds
            );
          }
        },
        onError: (msg) => {
          setFeedback({ ok: false, msg });
          setListeningMic(false);
        },
      });
      setMicController(ctrl);
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            التحدي <span className="font-numeric font-bold">{roundIdx + 1}</span> /{' '}
            <span className="font-numeric">{rounds}</span>
          </span>
          <span className="font-numeric font-bold text-teal-700">صح: {correctCount}</span>
        </div>

        <div className="p-6 rounded-2xl bg-[#F8F7F4] dark:bg-slate-800 text-center space-y-2">
          <p dir="ltr" className="font-english text-3xl font-extrabold text-slate-900 dark:text-white">
            {target.en}
          </p>
          <p className="text-base font-bold text-teal-700 dark:text-teal-400">{target.ar}</p>
          <p className="text-xs text-slate-500">النطق التقريبي: {target.pronunciationAr}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => speakEnglish(target.en, { rate: speechRate, lang: voiceAccent })}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-sm"
          >
            <Volume2 className="w-4 h-4 text-teal-700" />
            اسمع النموذج
          </button>
          <button
            type="button"
            onClick={toggleMic}
            className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm ${
              listeningMic ? 'bg-slate-900' : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {listeningMic ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {listeningMic ? 'إيقاف الميكروفون' : 'انطق الكلمة الآن'}
          </button>
          <button
            type="button"
            onClick={() =>
              advanceOrFinish(
                false,
                { en: target.en, ar: target.ar, lessonId: target.lessonId },
                'تحدي النطق',
                rounds
              )
            }
            className="px-4 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-800"
          >
            تخطي هذه الكلمة
          </button>
        </div>

        {spokenInput && (
          <p className="text-center text-sm">
            ما تم سماعه: <span dir="ltr" className="font-english font-bold">{spokenInput}</span>
          </p>
        )}

        {feedback && (
          <p className={`text-center text-sm font-bold ${feedback.ok ? 'text-emerald-600' : 'text-rose-600'}`}>
            {feedback.msg}
          </p>
        )}
      </div>
    );
  }

  // GAME 14 RENDER: تحدي الجمل
  if (gameId === 14) {
    const maxSc = Math.min(rounds, challengePrompts.length);
    const q = challengePrompts[roundIdx % challengePrompts.length];

    const handleSubmitSentence = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!sentenceDraft.trim() || evaluatingSentence) return;
      setEvaluatingSentence(true);
      try {
        const res = await fetch(apiUrl('/api/tutor/evaluate-sentence'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            situationAr: q.situationAr,
            studentSentence: sentenceDraft,
            targetSample: q.targetSample,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            isCorrect: boolean;
            correctedSentence: string;
            feedbackAr: string;
          };
          setFeedback({
            ok: data.isCorrect,
            msg: `${data.feedbackAr} (${data.correctedSentence})`,
          });
          setSentenceDraft('');
          advanceOrFinish(
            data.isCorrect,
            data.isCorrect ? null : { en: data.correctedSentence || q.targetSample, ar: q.situationAr, lessonId: q.lessonId },
            'تحدي الجمل',
            maxSc
          );
          setEvaluatingSentence(false);
          return;
        }
      } catch {
        // Offline / unconfigured fallback using curriculum keyword check
      }

      const lower = sentenceDraft.toLowerCase();
      const matched = q.keywords.filter((kw) => lower.includes(kw)).length;
      const ok = matched >= Math.max(1, Math.ceil(q.keywords.length / 2));
      setFeedback({
        ok,
        msg: ok ? `جملة مناسبة! مثال مرجعي: ${q.targetSample}` : `جرب صياغة مثل: ${q.targetSample}`,
      });
      setSentenceDraft('');
      setEvaluatingSentence(false);
      advanceOrFinish(
        ok,
        ok ? null : { en: q.targetSample, ar: q.situationAr, lessonId: q.lessonId },
        'تحدي الجمل',
        maxSc
      );
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            التحدي <span className="font-numeric font-bold">{roundIdx + 1}</span> /{' '}
            <span className="font-numeric">{maxSc}</span>
          </span>
          <span className="font-numeric font-bold text-teal-700">صح: {correctCount}</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#F8F7F4] dark:bg-slate-800 space-y-2">
          <p className="text-xs font-bold text-teal-700">اكتب جملة إنجليزية تعبّر عن الموقف التالي:</p>
          <p className="text-lg font-extrabold text-slate-900 dark:text-white">{q.situationAr}</p>
        </div>

        <form onSubmit={handleSubmitSentence} className="space-y-3">
          <input
            dir="ltr"
            type="text"
            value={sentenceDraft}
            onChange={(e) => setSentenceDraft(e.target.value)}
            placeholder="Write your English sentence here..."
            className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-english text-base focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
          <button
            type="submit"
            disabled={!sentenceDraft.trim() || evaluatingSentence}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-sm"
          >
            {evaluatingSentence ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            تقييم الجملة
          </button>
        </form>

        {feedback && (
          <p className={`text-sm font-bold ${feedback.ok ? 'text-emerald-600' : 'text-rose-600'}`}>
            {feedback.msg}
          </p>
        )}
      </div>
    );
  }

  // GAME 15 RENDER: تحدي الاستماع (Listen to full phrase/sentence -> pick meaning)
  const maxListen = Math.min(rounds, phraseItems.length);
  const listenTarget = phraseItems[roundIdx % phraseItems.length];
  const listenOptions = useMemo(() => {
    const others = shuffleArray(phraseItems.filter((p) => p.id !== listenTarget.id)).slice(0, 3);
    return shuffleArray([listenTarget, ...others]);
  }, [phraseItems, listenTarget]);

  useEffect(() => {
    if (gameId === 15 && listenTarget) {
      speakEnglish(listenTarget.en, { rate: speechRate, lang: voiceAccent });
    }
  }, [gameId, roundIdx, listenTarget, speechRate, voiceAccent]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          الجملة <span className="font-numeric font-bold">{roundIdx + 1}</span> /{' '}
          <span className="font-numeric">{maxListen}</span>
        </span>
        <span className="font-numeric font-bold text-teal-700">صح: {correctCount}</span>
      </div>

      <div className="p-6 rounded-2xl bg-[#F8F7F4] dark:bg-slate-800 text-center space-y-3">
        <p className="text-sm font-bold">استمع جيداً للجملة أو العبارة ثم اختر معناها الصحيح بالعربية:</p>
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => speakEnglish(listenTarget.en, { rate: speechRate, lang: voiceAccent })}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-700 text-white font-bold text-sm"
          >
            <Volume2 className="w-4 h-4" />
            تشغيل الجملة
          </button>
          <button
            type="button"
            onClick={() => speakSlowEnglish(listenTarget.en, voiceAccent)}
            className="px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 font-bold text-sm"
          >
            استماع بطيء
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {listenOptions.map((opt) => (
          <button
            key={opt.id}
            type="button"
            disabled={Boolean(feedback)}
            onClick={() => {
              const ok = opt.id === listenTarget.id;
              setFeedback({
                ok,
                msg: ok ? `ممتاز! (${listenTarget.en})` : `الصحيح هو: ${listenTarget.ar} (${listenTarget.en})`,
              });
              advanceOrFinish(
                ok,
                ok ? null : { en: listenTarget.en, ar: listenTarget.ar, lessonId: listenTarget.lessonId },
                'تحدي الاستماع',
                maxListen
              );
            }}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-600 text-right font-bold text-sm sm:text-base"
          >
            {opt.ar}
          </button>
        ))}
      </div>

      {feedback && (
        <p className={`text-sm font-bold text-center ${feedback.ok ? 'text-emerald-600' : 'text-rose-600'}`}>
          {feedback.msg}
        </p>
      )}
    </div>
  );
};
