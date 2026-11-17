import React, { useEffect, useMemo, useState } from 'react';
import { Volume2, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import type { DifficultyLevel } from '../../types/curriculum';
import { useApp } from '../../context/AppContext';
import { speakEnglish } from '../../utils/speech';
import {
  DIALOGUE_FILL_BANK,
  FILL_BLANK_BANK,
  SENTENCE_ORDER_BANK,
  SPOT_ERROR_BANK,
  TRUE_FALSE_BANK,
  getCleanEnglishWord,
  getSimpleVocabPool,
  shuffleArray,
  type GameReport,
} from './gameData';

interface GameProps {
  gameId: number;
  difficulty: DifficultyLevel;
  onFinish: (report: GameReport) => void;
}

const TOTAL_ROUNDS: Record<DifficultyLevel, number> = {
  easy: 5,
  medium: 7,
  hard: 9,
};

export const GamesGroupA: React.FC<GameProps> = ({ gameId, difficulty, onFinish }) => {
  const { activeProfile, recordMistake } = useApp();
  const voiceAccent = activeProfile?.settings.voiceAccent ?? 'en-US';
  const speechRate = activeProfile?.settings.speechRate ?? 0.92;
  const rounds = TOTAL_ROUNDS[difficulty];

  const [startTime] = useState(() => Date.now());
  const [roundIdx, setRoundIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [mistakes, setMistakes] = useState<{ en: string; ar: string; lessonId: string }[]>([]);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const vocabPool = useMemo(() => shuffleArray(getSimpleVocabPool(difficulty)), [difficulty, gameId]);

  const finishNow = (finalCorrect: number, finalWrong: number, finalMistakes: { en: string; ar: string; lessonId: string }[], titleAr: string) => {
    const durationSec = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    const mult = difficulty === 'hard' ? 15 : difficulty === 'medium' ? 12 : 10;
    onFinish({
      gameId,
      gameTitleAr: titleAr,
      correctCount: finalCorrect,
      wrongCount: finalWrong,
      durationSec,
      xpEarned: Math.max(10, finalCorrect * mult),
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
     GAME 1: اختر الإجابة الصحيحة (1 EN word -> 4 AR options)
     GAME 5: استمع واختر (Listen via TTS -> pick EN word from 4 options)
     -------------------------------------------------------------------------- */
  const mcqQuestion = useMemo(() => {
    const target = vocabPool[roundIdx % vocabPool.length];
    const distractors = shuffleArray(vocabPool.filter((v) => v.id !== target.id)).slice(0, 3);
    const options = shuffleArray([target, ...distractors]);
    return { target, options };
  }, [vocabPool, roundIdx]);

  useEffect(() => {
    if (gameId === 5 && mcqQuestion.target) {
      speakEnglish(mcqQuestion.target.en, { rate: speechRate, lang: voiceAccent });
    }
  }, [gameId, roundIdx, mcqQuestion.target, speechRate, voiceAccent]);

  /* --------------------------------------------------------------------------
     GAME 2: طابق الكلمات (Match EN left <-> AR right)
     -------------------------------------------------------------------------- */
  const pairCount = difficulty === 'hard' ? 6 : difficulty === 'medium' ? 5 : 4;
  const matchPairs = useMemo(() => vocabPool.slice(0, pairCount), [vocabPool, pairCount]);
  const shuffledRightPairs = useMemo(() => shuffleArray(matchPairs), [matchPairs]);
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [matchErrorPair, setMatchErrorPair] = useState<string | null>(null);

  /* --------------------------------------------------------------------------
     GAME 3: رتّب الحروف (Unscramble letters to spell English word)
     -------------------------------------------------------------------------- */
  const letterWords = useMemo(
    () =>
      shuffleArray(
        vocabPool.filter((w) => {
          const clean = getCleanEnglishWord(w.en);
          return /^[A-Za-z]{3,9}$/.test(clean);
        })
      ),
    [vocabPool]
  );
  const targetLetterItem = letterWords[roundIdx % Math.max(1, letterWords.length)];
  const targetCleanWord = targetLetterItem ? getCleanEnglishWord(targetLetterItem.en).toUpperCase() : 'BOOK';
  const [letterPool, setLetterPool] = useState<{ idx: number; ch: string }[]>([]);
  const [pickedLetters, setPickedLetters] = useState<{ idx: number; ch: string }[]>([]);

  useEffect(() => {
    if (gameId === 3 && targetCleanWord) {
      const chars = targetCleanWord.split('').map((ch, idx) => ({ idx, ch }));
      setLetterPool(shuffleArray(chars));
      setPickedLetters([]);
    }
  }, [gameId, roundIdx, targetCleanWord]);

  /* --------------------------------------------------------------------------
     GAME 4: رتّب الجملة (Unscramble words)
     -------------------------------------------------------------------------- */
  const sentenceList = useMemo(() => {
    const filtered = SENTENCE_ORDER_BANK.filter((s) =>
      difficulty === 'easy' ? s.difficulty === 'easy' : difficulty === 'medium' ? s.difficulty !== 'hard' : true
    );
    return shuffleArray(filtered.length > 0 ? filtered : SENTENCE_ORDER_BANK);
  }, [difficulty]);
  const currentSentenceQ = sentenceList[roundIdx % sentenceList.length];
  const [wordTiles, setWordTiles] = useState<{ idx: number; w: string }[]>([]);
  const [pickedWords, setPickedWords] = useState<{ idx: number; w: string }[]>([]);

  useEffect(() => {
    if (gameId === 4 && currentSentenceQ) {
      setWordTiles(shuffleArray(currentSentenceQ.words.map((w, idx) => ({ idx, w }))));
      setPickedWords([]);
    }
  }, [gameId, roundIdx, currentSentenceQ]);

  /* --------------------------------------------------------------------------
     GAMES 6, 7, 8 Question Lists
     -------------------------------------------------------------------------- */
  const fillList = useMemo(() => shuffleArray(FILL_BLANK_BANK), [gameId, difficulty]);
  const spotList = useMemo(() => shuffleArray(SPOT_ERROR_BANK), [gameId, difficulty]);
  const tfList = useMemo(() => shuffleArray(TRUE_FALSE_BANK), [gameId, difficulty]);

  // GAME 1 & GAME 5 RENDER
  if (gameId === 1 || gameId === 5) {
    const title = gameId === 1 ? 'اختر الإجابة الصحيحة' : 'استمع واختر';
    const { target, options } = mcqQuestion;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            الجولة <span className="font-numeric font-bold">{roundIdx + 1}</span> /{' '}
            <span className="font-numeric">{rounds}</span>
          </span>
          <span className="font-numeric font-bold text-teal-700">صح: {correctCount} · خطأ: {wrongCount}</span>
        </div>

        <div className="p-6 rounded-2xl bg-[#F8F7F4] dark:bg-slate-800 text-center space-y-3">
          {gameId === 1 ? (
            <>
              <p className="text-xs font-semibold text-slate-500">ما المعنى العربي الصحيح لهذه الكلمة؟</p>
              <p dir="ltr" className="font-english text-3xl font-extrabold text-slate-900 dark:text-white">
                {target.en}
              </p>
              <button
                type="button"
                onClick={() => speakEnglish(target.en, { rate: speechRate, lang: voiceAccent })}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-700 text-white text-xs font-bold"
              >
                <Volume2 className="w-4 h-4" />
                استمع للكلمة
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                اضغط للاستماع ثم اختر الكلمة الإنجليزية التي سمعتها:
              </p>
              <button
                type="button"
                onClick={() => speakEnglish(target.en, { rate: speechRate, lang: voiceAccent })}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-base"
              >
                <Volume2 className="w-5 h-5" />
                تشغيل الصوت الآن
              </button>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={Boolean(feedback)}
              onClick={() => {
                const ok = opt.id === target.id;
                setFeedback({
                  ok,
                  msg: ok ? 'إجابة صحيحة! أحسنت.' : `خطأ — الإجابة الصحيحة: ${gameId === 1 ? target.ar : target.en}`,
                });
                advanceOrFinish(
                  ok,
                  ok ? null : { en: target.en, ar: target.ar, lessonId: target.lessonId },
                  title,
                  rounds
                );
              }}
              dir={gameId === 5 ? 'ltr' : 'rtl'}
              className={`p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-600 font-bold text-base transition-colors ${
                gameId === 5 ? 'font-english text-center' : 'text-right'
              }`}
            >
              {gameId === 1 ? opt.ar : opt.en}
            </button>
          ))}
        </div>

        {feedback && (
          <div
            className={`p-3.5 rounded-xl flex items-center gap-2 text-sm font-bold ${
              feedback.ok
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 animate-pop'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 animate-shake'
            }`}
          >
            {feedback.ok ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <span>{feedback.msg}</span>
          </div>
        )}
      </div>
    );
  }

  // GAME 2: طابق الكلمات
  if (gameId === 2) {
    const handlePickRight = (rightId: string) => {
      if (!selectedLeftId || matchedIds.includes(rightId)) return;
      if (selectedLeftId === rightId) {
        const nextMatched = [...matchedIds, rightId];
        setMatchedIds(nextMatched);
        setSelectedLeftId(null);
        setCorrectCount((c) => c + 1);
        if (nextMatched.length === matchPairs.length) {
          finishNow(correctCount + 1, wrongCount, mistakes, 'طابق الكلمات');
        }
      } else {
        const missed = matchPairs.find((p) => p.id === selectedLeftId);
        setWrongCount((w) => w + 1);
        setMatchErrorPair(rightId);
        if (missed) {
          const item = { en: missed.en, ar: missed.ar, lessonId: missed.lessonId };
          setMistakes((m) => [...m, item]);
          recordMistake({
            id: `game_2_${missed.id}`,
            en: missed.en,
            ar: missed.ar,
            lessonId: missed.lessonId,
            source: 'game',
          });
        }
        setTimeout(() => {
          setMatchErrorPair(null);
          setSelectedLeftId(null);
        }, 600);
      }
    };

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">
            اضغط على الكلمة الإنجليزية ثم اضغط على معناها العربي المطابق:
          </span>
          <span className="font-numeric font-bold text-teal-700">
            {matchedIds.length} / {matchPairs.length}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2.5">
            {matchPairs.map((item) => {
              const isDone = matchedIds.includes(item.id);
              const isSelected = selectedLeftId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isDone}
                  onClick={() => {
                    setSelectedLeftId(item.id);
                    speakEnglish(item.en, { rate: speechRate, lang: voiceAccent });
                  }}
                  dir="ltr"
                  className={`w-full p-3.5 rounded-xl border font-english font-bold text-sm sm:text-base transition-colors ${
                    isDone
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-700 opacity-60'
                      : isSelected
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-teal-600'
                  }`}
                >
                  {item.en}
                </button>
              );
            })}
          </div>

          <div className="space-y-2.5">
            {shuffledRightPairs.map((item) => {
              const isDone = matchedIds.includes(item.id);
              const isWrong = matchErrorPair === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isDone}
                  onClick={() => handlePickRight(item.id)}
                  className={`w-full p-3.5 rounded-xl border font-bold text-sm sm:text-base transition-colors ${
                    isDone
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-700 opacity-60'
                      : isWrong
                      ? 'bg-rose-100 border-rose-500 text-rose-800 animate-shake'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-teal-600'
                  }`}
                >
                  {item.ar}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // GAME 3: رتّب الحروف
  if (gameId === 3 && targetLetterItem) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            الجولة <span className="font-numeric font-bold">{roundIdx + 1}</span> /{' '}
            <span className="font-numeric">{rounds}</span>
          </span>
          <span className="font-numeric font-bold text-teal-700">صح: {correctCount}</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#F8F7F4] dark:bg-slate-800 text-center space-y-2">
          <p className="text-xs text-slate-500">رتّب الحروف لتكوين معنى هذه الكلمة:</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{targetLetterItem.ar}</p>
          <button
            type="button"
            onClick={() => speakEnglish(targetCleanWord, { rate: speechRate, lang: voiceAccent })}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-400"
          >
            <Volume2 className="w-4 h-4" />
            تلميح صوتي
          </button>
        </div>

        {/* Built word slot */}
        <div
          dir="ltr"
          className="min-h-16 p-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center gap-2 flex-wrap"
        >
          {pickedLetters.length === 0 ? (
            <span className="text-xs text-slate-400">اضغط على الحروف بالأسفل بالترتيب</span>
          ) : (
            pickedLetters.map((item) => (
              <button
                key={item.idx}
                type="button"
                disabled={Boolean(feedback)}
                onClick={() => {
                  setPickedLetters((p) => p.filter((x) => x.idx !== item.idx));
                  setLetterPool((pool) => [...pool, item]);
                }}
                className="w-11 h-11 rounded-xl bg-teal-700 text-white font-english font-extrabold text-lg"
              >
                {item.ch}
              </button>
            ))
          )}
        </div>

        {/* Letter pool */}
        <div dir="ltr" className="flex items-center justify-center gap-2 flex-wrap">
          {letterPool.map((item) => (
            <button
              key={item.idx}
              type="button"
              disabled={Boolean(feedback)}
              onClick={() => {
                if (feedback) return;
                const nextPool = letterPool.filter((x) => x.idx !== item.idx);
                const nextPicked = [...pickedLetters, item];
                setLetterPool(nextPool);
                setPickedLetters(nextPicked);
                if (nextPool.length === 0) {
                  const nextBuilt = nextPicked.map((l) => l.ch).join('');
                  const ok = nextBuilt === targetCleanWord;
                  speakEnglish(targetCleanWord, { rate: speechRate, lang: voiceAccent });
                  setFeedback({
                    ok,
                    msg: ok
                      ? 'ممتاز! جاري الانتقال للسؤال التالي...'
                      : `غير صحيح — الكلمة الصحيحة: ${targetCleanWord}`,
                  });
                  advanceOrFinish(
                    ok,
                    ok ? null : { en: targetCleanWord, ar: targetLetterItem.ar, lessonId: targetLetterItem.lessonId },
                    'رتّب الحروف',
                    rounds
                  );
                }
              }}
              className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-english font-extrabold text-lg hover:border-teal-600"
            >
              {item.ch}
            </button>
          ))}
        </div>

        {!feedback && pickedLetters.length > 0 && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => {
                setLetterPool(shuffleArray(targetCleanWord.split('').map((ch, idx) => ({ idx, ch }))));
                setPickedLetters([]);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold"
            >
              <RotateCcw className="w-4 h-4" />
              إعادة الترتيب
            </button>
          </div>
        )}

        {feedback && (
          <p className={`text-center text-sm font-bold ${feedback.ok ? 'text-emerald-600' : 'text-rose-600'}`}>
            {feedback.msg}
          </p>
        )}
      </div>
    );
  }

  // GAME 4: رتّب الجملة
  if (gameId === 4 && currentSentenceQ) {
    const maxSentenceRounds = Math.min(rounds, sentenceList.length);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            الجملة <span className="font-numeric font-bold">{roundIdx + 1}</span> /{' '}
            <span className="font-numeric">{maxSentenceRounds}</span>
          </span>
          <span className="font-numeric font-bold text-teal-700">صح: {correctCount}</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#F8F7F4] dark:bg-slate-800 text-center space-y-1.5">
          <p className="text-xs text-slate-500">رتّب الكلمات لتكوين هذه الجملة بالإنجليزية:</p>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">{currentSentenceQ.meaningAr}</p>
        </div>

        <div
          dir="ltr"
          className="min-h-16 p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center gap-2 flex-wrap"
        >
          {pickedWords.length === 0 ? (
            <span className="text-xs text-slate-400">اضغط على الكلمات بالأسفل بالترتيب</span>
          ) : (
            pickedWords.map((item) => (
              <button
                key={item.idx}
                type="button"
                disabled={Boolean(feedback)}
                onClick={() => {
                  setPickedWords((p) => p.filter((x) => x.idx !== item.idx));
                  setWordTiles((t) => [...t, item]);
                }}
                className="px-3.5 py-2 rounded-xl bg-teal-700 text-white font-english font-bold text-sm"
              >
                {item.w}
              </button>
            ))
          )}
        </div>

        <div dir="ltr" className="flex items-center justify-center gap-2 flex-wrap">
          {wordTiles.map((item) => (
            <button
              key={item.idx}
              type="button"
              disabled={Boolean(feedback)}
              onClick={() => {
                if (feedback) return;
                const nextTiles = wordTiles.filter((x) => x.idx !== item.idx);
                const nextPicked = [...pickedWords, item];
                setWordTiles(nextTiles);
                setPickedWords(nextPicked);
                if (nextTiles.length === 0) {
                  const nextSentence = nextPicked.map((w) => w.w).join(' ');
                  const ok = nextSentence === currentSentenceQ.correctSentence;
                  speakEnglish(currentSentenceQ.correctSentence, { rate: speechRate, lang: voiceAccent });
                  setFeedback({
                    ok,
                    msg: ok
                      ? 'ترتيب ممتاز! جاري الانتقال...'
                      : `الترتيب الصحيح: ${currentSentenceQ.correctSentence}`,
                  });
                  advanceOrFinish(
                    ok,
                    ok
                      ? null
                      : {
                          en: currentSentenceQ.correctSentence,
                          ar: currentSentenceQ.meaningAr,
                          lessonId: currentSentenceQ.lessonId,
                        },
                    'رتّب الجملة',
                    maxSentenceRounds
                  );
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-english font-bold text-sm hover:border-teal-600"
            >
              {item.w}
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

  // GAME 6: أكمل الفراغ
  if (gameId === 6) {
    const maxFill = Math.min(rounds, fillList.length);
    const q = fillList[roundIdx % fillList.length];
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            السؤال <span className="font-numeric font-bold">{roundIdx + 1}</span> /{' '}
            <span className="font-numeric">{maxFill}</span>
          </span>
          <span className="font-numeric font-bold text-teal-700">صح: {correctCount}</span>
        </div>

        <div className="p-6 rounded-2xl bg-[#F8F7F4] dark:bg-slate-800 text-center space-y-2">
          <p dir="ltr" className="font-english text-2xl font-extrabold text-slate-900 dark:text-white">
            {q.sentenceBefore} <span className="underline decoration-teal-600 px-2">_____</span> {q.sentenceAfter}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">{q.meaningAr}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {q.options.map((opt) => (
            <button
              key={opt}
              type="button"
              disabled={Boolean(feedback)}
              onClick={() => {
                const ok = opt === q.correctOption;
                setFeedback({
                  ok,
                  msg: ok ? 'إجابة صحيحة!' : `الكلمة المناسبة: ${q.correctOption}`,
                });
                advanceOrFinish(
                  ok,
                  ok
                    ? null
                    : {
                        en: `${q.sentenceBefore} ${q.correctOption} ${q.sentenceAfter}`,
                        ar: q.meaningAr,
                        lessonId: q.lessonId,
                      },
                  'أكمل الفراغ',
                  maxFill
                );
              }}
              dir="ltr"
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-600 font-english font-bold text-base"
            >
              {opt}
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

  // GAME 7: اكتشف الخطأ
  if (gameId === 7) {
    const maxSpot = Math.min(rounds, spotList.length);
    const q = spotList[roundIdx % spotList.length];
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            السؤال <span className="font-numeric font-bold">{roundIdx + 1}</span> /{' '}
            <span className="font-numeric">{maxSpot}</span>
          </span>
          <span className="font-numeric font-bold text-teal-700">صح: {correctCount}</span>
        </div>

        <div className="p-6 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-center space-y-2">
          <p className="text-xs font-bold text-rose-700 dark:text-rose-300">الجملة التالية بها خطأ لغوي — اختر التصحيح الصحيح:</p>
          <p dir="ltr" className="font-english text-xl font-extrabold text-slate-900 dark:text-white">
            {q.wrongSentence}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {q.options.map((opt, idx) => (
            <button
              key={opt}
              type="button"
              disabled={Boolean(feedback)}
              onClick={() => {
                const ok = idx === q.correctIndex;
                setFeedback({
                  ok,
                  msg: ok ? `ممتاز! ${q.explanationAr}` : `خطأ — ${q.explanationAr}`,
                });
                advanceOrFinish(
                  ok,
                  ok
                    ? null
                    : { en: q.options[q.correctIndex], ar: q.explanationAr, lessonId: q.lessonId },
                  'اكتشف الخطأ',
                  maxSpot
                );
              }}
              dir="ltr"
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-600 font-english font-bold text-base text-left"
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

  // GAME 8: صح أم خطأ
  if (gameId === 8) {
    const maxTf = Math.min(rounds, tfList.length);
    const q = tfList[roundIdx % tfList.length];
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            العبارة <span className="font-numeric font-bold">{roundIdx + 1}</span> /{' '}
            <span className="font-numeric">{maxTf}</span>
          </span>
          <span className="font-numeric font-bold text-teal-700">صح: {correctCount}</span>
        </div>

        <div className="p-6 rounded-2xl bg-[#F8F7F4] dark:bg-slate-800 text-center space-y-2">
          <p className="text-lg font-extrabold text-slate-900 dark:text-white">{q.statementAr}</p>
          <p dir="ltr" className="font-english text-sm font-semibold text-teal-700 dark:text-teal-400">
            {q.englishSample}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            disabled={Boolean(feedback)}
            onClick={() => {
              const ok = q.isTrue === true;
              setFeedback({ ok, msg: q.explanationAr });
              advanceOrFinish(
                ok,
                ok ? null : { en: q.englishSample, ar: q.explanationAr, lessonId: q.lessonId },
                'صح أم خطأ',
                maxTf
              );
            }}
            className="p-4 rounded-2xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 font-extrabold text-lg"
          >
            صح
          </button>
          <button
            type="button"
            disabled={Boolean(feedback)}
            onClick={() => {
              const ok = q.isTrue === false;
              setFeedback({ ok, msg: q.explanationAr });
              advanceOrFinish(
                ok,
                ok ? null : { en: q.englishSample, ar: q.explanationAr, lessonId: q.lessonId },
                'صح أم خطأ',
                maxTf
              );
            }}
            className="p-4 rounded-2xl border border-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-800 dark:text-rose-300 font-extrabold text-lg"
          >
            خطأ
          </button>
        </div>

        {feedback && (
          <p className={`text-sm font-bold text-center ${feedback.ok ? 'text-emerald-600' : 'text-rose-600'}`}>
            {feedback.msg}
          </p>
        )}
      </div>
    );
  }

  // Fallback unused
  void DIALOGUE_FILL_BANK;
  return null;
};
