import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckSquare,
  Volume2,
  Mic,
  Square,
  Trophy,
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  ALL_VOCAB_ITEMS,
  BOOK_LESSONS,
  LEVELS,
  getLessonById,
  getLessonsForLevel,
} from '../data/curriculum';
import { STAGES_BY_LEVEL } from '../data/stages400';
import {
  DIALOGUE_FILL_BANK,
  FILL_BLANK_BANK,
  SPOT_ERROR_BANK,
  shuffleArray,
} from '../components/games/gameData';
import {
  evaluateSpokenMatch,
  speakEnglish,
  startSpeechRecognition,
} from '../utils/speech';
import type { ExamResultRecord } from '../types/curriculum';

type ExamMode =
  | 'level'
  | 'lesson'
  | 'comprehensive'
  | 'vocab'
  | 'grammar'
  | 'listening'
  | 'conversation'
  | 'pronunciation';

interface ExamQuestion {
  id: string;
  promptAr: string;
  englishText?: string;
  speakText?: string;
  isPronunciation?: boolean;
  options: string[];
  correctIndex: number;
  lessonId: string;
  explanationAr: string;
}

export const ExamsPage: React.FC = () => {
  const {
    activeProfile,
    selectedLevelId,
    isLevelUnlocked,
    saveExamResult,
    recordMistake,
    navigate,
  } = useApp();

  const [examMode, setExamMode] = useState<ExamMode>('level');
  const [targetLevelId, setTargetLevelId] = useState<number>(selectedLevelId || 1);
  const [targetLessonId, setTargetLessonId] = useState<string>(BOOK_LESSONS[0].id);
  const [activeQuestions, setActiveQuestions] = useState<ExamQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [pronunciationScores, setPronunciationScores] = useState<Record<string, number>>({});
  const [listeningId, setListeningId] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<{
    record: ExamResultRecord;
    unlockedNext: boolean;
  } | null>(null);

  useEffect(() => {
    if (selectedLevelId >= 1 && selectedLevelId <= 6) {
      setTargetLevelId(selectedLevelId);
      setExamMode('level');
    }
  }, [selectedLevelId]);

  if (!activeProfile) return null;

  const voiceAccent = activeProfile.settings.voiceAccent;
  const speechRate = activeProfile.settings.speechRate;

  const buildQuestions = (mode: ExamMode): ExamQuestion[] => {
    if (mode === 'lesson') {
      const lesson = getLessonById(targetLessonId) ?? BOOK_LESSONS[0];
      const quizQs: ExamQuestion[] = lesson.quiz.map((q) => ({
        id: q.id,
        promptAr: q.promptAr,
        englishText: q.englishText,
        options: q.options,
        correctIndex: q.correctIndex,
        lessonId: lesson.id,
        explanationAr: q.explanationAr,
      }));
      const vocabQs: ExamQuestion[] = shuffleArray(lesson.items)
        .slice(0, Math.max(2, 5 - quizQs.length))
        .map((item, idx) => {
          const others = shuffleArray(ALL_VOCAB_ITEMS.filter((v) => v.id !== item.id))
            .slice(0, 3)
            .map((o) => o.ar);
          const opts = shuffleArray([item.ar, ...others]);
          return {
            id: `lv_${idx}_${item.id}`,
            promptAr: `ما معنى كلمة (${item.en})؟`,
            englishText: item.en,
            options: opts,
            correctIndex: opts.indexOf(item.ar),
            lessonId: lesson.id,
            explanationAr: `الكلمة ${item.en} تعني ${item.ar}.`,
          };
        });
      return [...quizQs, ...vocabQs];
    }

    if (mode === 'level') {
      const lessons = getLessonsForLevel(targetLevelId);
      const fromQuizzes: ExamQuestion[] = lessons.flatMap((l) =>
        l.quiz.map((q) => ({
          id: `${l.id}_${q.id}`,
          promptAr: q.promptAr,
          englishText: q.englishText,
          options: q.options,
          correctIndex: q.correctIndex,
          lessonId: l.id,
          explanationAr: q.explanationAr,
        }))
      );
      const levelVocab = lessons.flatMap((l) => l.items);
      const fromVocab: ExamQuestion[] = shuffleArray(levelVocab)
        .slice(0, 4)
        .map((item, i) => {
          const others = shuffleArray(ALL_VOCAB_ITEMS.filter((x) => x.id !== item.id))
            .slice(0, 3)
            .map((o) => o.ar);
          const opts = shuffleArray([item.ar, ...others]);
          return {
            id: `lvlv_${i}_${item.id}`,
            promptAr: `اختر الترجمة العربية الصحيحة لكلمة (${item.en}):`,
            englishText: item.en,
            options: opts,
            correctIndex: opts.indexOf(item.ar),
            lessonId: item.lessonId,
            explanationAr: `${item.en} معناها ${item.ar}.`,
          };
        });
      return shuffleArray([...fromQuizzes, ...fromVocab]).slice(0, 10);
    }

    if (mode === 'grammar') {
      const q1: ExamQuestion[] = FILL_BLANK_BANK.map((f) => {
        const opts = shuffleArray(f.options);
        return {
          id: `gr_${f.id}`,
          promptAr: `أكمل الجملة (${f.meaningAr}):`,
          englishText: `${f.sentenceBefore} ____ ${f.sentenceAfter}`,
          options: opts,
          correctIndex: opts.indexOf(f.correctOption),
          lessonId: f.lessonId,
          explanationAr: `الكلمة الصحيحة هي: ${f.correctOption}.`,
        };
      });
      const q2: ExamQuestion[] = SPOT_ERROR_BANK.map((s) => ({
        id: `sp_${s.id}`,
        promptAr: `اختر التصحيح السليم للجملة (${s.wrongSentence}):`,
        englishText: s.wrongSentence,
        options: s.options,
        correctIndex: s.correctIndex,
        lessonId: s.lessonId,
        explanationAr: s.explanationAr,
      }));
      return shuffleArray([...q1, ...q2]).slice(0, 8);
    }

    if (mode === 'listening') {
      return shuffleArray(ALL_VOCAB_ITEMS)
        .slice(0, 8)
        .map((item, idx) => {
          const others = shuffleArray(ALL_VOCAB_ITEMS.filter((v) => v.id !== item.id))
            .slice(0, 3)
            .map((o) => o.ar);
          const opts = shuffleArray([item.ar, ...others]);
          return {
            id: `ls_${idx}_${item.id}`,
            promptAr: 'اضغط استماع ثم اختر المعنى الصحيح لما سمعته:',
            speakText: item.en,
            options: opts,
            correctIndex: opts.indexOf(item.ar),
            lessonId: item.lessonId,
            explanationAr: `الكلمة التي نُطقت هي (${item.en}) ومعناها: ${item.ar}.`,
          };
        });
    }

    if (mode === 'conversation') {
      return shuffleArray(DIALOGUE_FILL_BANK).map((d) => ({
        id: `cv_${d.id}`,
        promptAr: `${d.contextAr}: ماذا ترد على "${d.speakerAEn}"؟`,
        englishText: d.speakerAEn,
        speakText: d.speakerAEn,
        options: d.options,
        correctIndex: d.correctIndex,
        lessonId: d.lessonId,
        explanationAr: d.explanationAr,
      }));
    }

    if (mode === 'pronunciation') {
      return shuffleArray(ALL_VOCAB_ITEMS.filter((i) => !i.en.includes('/')))
        .slice(0, 5)
        .map((item, idx) => ({
          id: `pr_${idx}_${item.id}`,
          promptAr: `انطق الكلمة أو العبارة التالية بوضوح (${item.ar}):`,
          englishText: item.en,
          speakText: item.en,
          isPronunciation: true,
          options: ['تمت محاولة النطق'],
          correctIndex: 0,
          lessonId: item.lessonId,
          explanationAr: `النطق التقريبي: ${item.pronunciationAr}`,
        }));
    }

    if (mode === 'vocab') {
      return shuffleArray(ALL_VOCAB_ITEMS)
        .slice(0, 10)
        .map((item, idx) => {
          const others = shuffleArray(ALL_VOCAB_ITEMS.filter((v) => v.id !== item.id))
            .slice(0, 3)
            .map((o) => o.ar);
          const opts = shuffleArray([item.ar, ...others]);
          return {
            id: `vc_${idx}_${item.id}`,
            promptAr: `ما معنى (${item.en})؟`,
            englishText: item.en,
            options: opts,
            correctIndex: opts.indexOf(item.ar),
            lessonId: item.lessonId,
            explanationAr: `${item.en} تعني ${item.ar}.`,
          };
        });
    }

    // Comprehensive
    const compQuiz = shuffleArray(
      BOOK_LESSONS.flatMap((l) =>
        l.quiz.map((q) => ({
          id: `cmp_${l.id}_${q.id}`,
          promptAr: q.promptAr,
          englishText: q.englishText,
          options: q.options,
          correctIndex: q.correctIndex,
          lessonId: l.id,
          explanationAr: q.explanationAr,
        }))
      )
    );
    return compQuiz.slice(0, 12);
  };

  const examTitles: Record<ExamMode, string> = {
    level: `اختبار المستوى ${targetLevelId}`,
    lesson: `اختبار درس: ${getLessonById(targetLessonId)?.titleAr ?? ''}`,
    comprehensive: 'الاختبار الشامل للمنهج',
    vocab: 'اختبار المفردات',
    grammar: 'اختبار القواعد',
    listening: 'اختبار الاستماع',
    conversation: 'اختبار المحادثات اليومية',
    pronunciation: 'اختبار النطق الشفهي',
  };

  const handleStartExam = () => {
    setSubmittedResult(null);
    setAnswers({});
    setPronunciationScores({});
    const qs = buildQuestions(examMode);
    setActiveQuestions(qs);
  };

  const handlePronounceQuestion = (q: ExamQuestion) => {
    if (!q.englishText) return;
    setListeningId(q.id);
    startSpeechRecognition({
      lang: voiceAccent,
      onResult: (txt, isFinal) => {
        if (isFinal) {
          const res = evaluateSpokenMatch(txt, q.englishText!);
          setPronunciationScores((prev) => ({ ...prev, [q.id]: res.score }));
          setAnswers((prev) => ({ ...prev, [q.id]: res.isMatch ? 0 : 1 }));
          setListeningId(null);
        }
      },
      onError: () => setListeningId(null),
      onEnd: () => setListeningId(null),
    });
  };

  const handleSubmitExam = () => {
    if (!activeQuestions) return;
    let correctCount = 0;
    const weakSet = new Set<string>();
    const mistakesSummary: { promptAr: string; chosen: string; correct: string }[] = [];

    activeQuestions.forEach((q) => {
      const chosen = answers[q.id];
      const ok = q.isPronunciation ? (pronunciationScores[q.id] ?? 0) >= 65 : chosen === q.correctIndex;
      if (ok) {
        correctCount += 1;
      } else {
        weakSet.add(q.lessonId);
        const correctLabel = q.isPronunciation ? q.englishText || '' : q.options[q.correctIndex];
        const chosenLabel = q.isPronunciation
          ? `تطابق ${pronunciationScores[q.id] ?? 0}%`
          : chosen !== undefined
          ? q.options[chosen]
          : 'لم تُجب';
        mistakesSummary.push({
          promptAr: q.promptAr,
          chosen: chosenLabel,
          correct: correctLabel,
        });
        recordMistake({
          id: `exam_${q.id}`,
          en: q.englishText || correctLabel,
          ar: q.promptAr,
          lessonId: q.lessonId,
          source: 'exam',
          noteAr: q.explanationAr,
        });
      }
    });

    const score = Math.round((correctCount / Math.max(1, activeQuestions.length)) * 100);
    const record: ExamResultRecord = {
      id: `ex_${Date.now()}`,
      examType: examMode,
      titleAr: examTitles[examMode],
      score,
      totalQuestions: activeQuestions.length,
      correctCount,
      dateIso: new Date().toISOString(),
      weakLessonIds: Array.from(weakSet),
      mistakesSummary,
    };

    const unlockedNext = saveExamResult(record, examMode === 'level' ? targetLevelId : undefined);
    setSubmittedResult({ record, unlockedNext });
  };

  const recentExams = useMemo(() => activeProfile.examHistory.slice(0, 5), [activeProfile.examHistory]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <CheckSquare className="w-7 h-7 text-emerald-600" />
          مركز الاختبارات والتقييم الشامل
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          اختبر نفسك في أي مستوى أو مهارة. اجتياز اختبار المستوى بنسبة 70% يفتح لك المستوى التالي تلقائياً.
        </p>
      </div>

      {/* Exam Configurator */}
      {!activeQuestions && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-base font-extrabold">اختر نوع الاختبار:</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(
                [
                  { id: 'level', label: 'اختبار مستوى' },
                  { id: 'lesson', label: 'اختبار درس' },
                  { id: 'comprehensive', label: 'اختبار شامل' },
                  { id: 'vocab', label: 'اختبار مفردات' },
                  { id: 'grammar', label: 'اختبار قواعد' },
                  { id: 'listening', label: 'اختبار استماع' },
                  { id: 'conversation', label: 'اختبار محادثة' },
                  { id: 'pronunciation', label: 'اختبار نطق' },
                ] as { id: ExamMode; label: string }[]
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setExamMode(m.id)}
                  className={`p-3 rounded-xl border text-sm font-bold transition-colors ${
                    examMode === m.id
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'border-slate-200 dark:border-slate-700 hover:border-teal-600'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {examMode === 'level' && (
            <div className="space-y-2">
              <label className="text-sm font-bold block">اختر المستوى المطلوب اختباره:</label>
              <select
                value={targetLevelId}
                onChange={(e) => setTargetLevelId(Number(e.target.value))}
                className="w-full sm:w-96 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F8F7F4] dark:bg-slate-800 text-sm font-bold"
              >
                {LEVELS.map((l) => (
                  <option key={l.id} value={l.id} disabled={!isLevelUnlocked(l.id)}>
                    {l.titleAr} {!isLevelUnlocked(l.id) ? '(مقفل)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {examMode === 'lesson' && (
            <div className="space-y-2">
              <label className="text-sm font-bold block">اختر الدرس:</label>
              <select
                value={targetLessonId}
                onChange={(e) => setTargetLessonId(e.target.value)}
                className="w-full sm:w-96 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F8F7F4] dark:bg-slate-800 text-sm font-bold"
              >
                {BOOK_LESSONS.map((l) => (
                  <option key={l.id} value={l.id}>
                    المستوى {l.levelId} — {l.titleAr}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={handleStartExam}
            className="px-6 py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-base"
          >
            بدء الاختبار الآن
          </button>
        </div>
      )}

      {/* Active Exam View */}
      {activeQuestions && !submittedResult && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-xl font-extrabold">{examTitles[examMode]}</h2>
            <span className="font-numeric text-sm font-bold text-slate-500">
              {activeQuestions.length} سؤال
            </span>
          </div>

          <div className="space-y-5">
            {activeQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3"
              >
                <p className="font-bold text-base">
                  <span className="font-numeric text-teal-700 ml-1">{idx + 1}.</span>
                  {q.promptAr}
                </p>

                {q.englishText && !q.speakText && (
                  <p dir="ltr" className="font-english font-bold text-base text-right text-slate-800 dark:text-slate-200">
                    {q.englishText}
                  </p>
                )}

                {q.speakText && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => speakEnglish(q.speakText!, { rate: speechRate, lang: voiceAccent })}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold"
                    >
                      <Volume2 className="w-4 h-4" />
                      استمع للسؤال
                    </button>
                    {q.isPronunciation && (
                      <button
                        type="button"
                        onClick={() => handlePronounceQuestion(q)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold ${
                          listeningId === q.id ? 'bg-slate-900' : 'bg-rose-600'
                        }`}
                      >
                        {listeningId === q.id ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        {listeningId === q.id ? 'يتم الاستماع...' : 'انطق الآن'}
                      </button>
                    )}
                  </div>
                )}

                {q.isPronunciation ? (
                  <div className="text-xs font-bold text-teal-700">
                    {pronunciationScores[q.id] !== undefined
                      ? `تم تسجيل نطقك — نسبة تطابق النص: ${pronunciationScores[q.id]}%`
                      : 'اضغط "انطق الآن" ثم تحدث بالإنجليزية، أو اضغط "استمع" أولاً.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options.map((opt, optIdx) => (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                        className={`p-3 rounded-xl border text-right text-sm font-semibold transition-colors ${
                          answers[q.id] === optIdx
                            ? 'border-teal-700 bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200'
                            : 'border-slate-200 dark:border-slate-700 hover:border-teal-600'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSubmitExam}
              className="px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm"
            >
              تسليم الاختبار وعرض التقرير
            </button>
            <button
              type="button"
              onClick={() => setActiveQuestions(null)}
              className="px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Detailed Post-Exam Report */}
      {submittedResult && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
          <div className="p-6 rounded-2xl bg-[#F8F7F4] dark:bg-slate-800 text-center space-y-2">
            <Trophy
              className={`w-12 h-12 mx-auto ${
                submittedResult.record.score >= 70 ? 'text-amber-500' : 'text-slate-400'
              }`}
            />
            <p className="font-numeric text-4xl font-extrabold text-teal-700 dark:text-teal-400">
              {submittedResult.record.score} / 100
            </p>
            <h2 className="text-xl font-extrabold">
              {submittedResult.record.score >= 70
                ? 'مبارك! لقد اجتزت الاختبار بنجاح'
                : 'تحتاج إلى مراجعة بسيطة والمحاولة مجدداً للوصول إلى 70%'}
            </h2>
            {submittedResult.unlockedNext && (
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                تم فتح المستوى التالي لك بنجاح!
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30 space-y-1">
              <p className="font-bold text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                نقاط القوة
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                أجبت بشكل صحيح عن {submittedResult.record.correctCount} من أصل{' '}
                {submittedResult.record.totalQuestions} سؤال.
              </p>
            </div>
            <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/30 space-y-1">
              <p className="font-bold text-sm text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                الخطوة التالية المقترحة
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                {submittedResult.record.weakLessonIds.length > 0
                  ? 'راجع الدروس المرتبطة بأخطائك أدناه أو انتقل لقسم راجع أخطاءك.'
                  : 'أداء ممتاز! انتقل للمستوى التالي أو جرّب محادثة المعلم الذكي.'}
              </p>
            </div>
          </div>

          {submittedResult.record.mistakesSummary.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold">تفاصيل الأخطاء في هذا الاختبار:</h3>
              {submittedResult.record.mistakesSummary.map((m, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs space-y-1"
                >
                  <p className="font-bold">{m.promptAr}</p>
                  <p>
                    إجابتك: <span className="text-rose-600 font-semibold">{m.chosen}</span> · الصحيح:{' '}
                    <span className="text-emerald-700 font-bold">{m.correct}</span>
                  </p>
                </div>
              ))}
            </div>
          )}

          {submittedResult.record.weakLessonIds.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold">الدروس التي تحتاج مراجعة:</h3>
              <div className="flex flex-wrap gap-2">
                {submittedResult.record.weakLessonIds.map((lid) => {
                  const l = getLessonById(lid);
                  if (!l) return null;
                  return (
                    <button
                      key={lid}
                      type="button"
                      onClick={() => navigate('lesson-detail', { levelId: l.levelId, lessonId: l.id })}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold hover:border-teal-600"
                    >
                      {l.titleAr}
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {submittedResult.record.score >= 70 && examMode === 'level' && targetLevelId < 6 && (
              <button
                type="button"
                onClick={() => {
                  const nextStages = STAGES_BY_LEVEL[targetLevelId + 1] ?? [];
                  if (nextStages.length > 0) {
                    navigate('stage-player', {
                      levelId: targetLevelId + 1,
                      stageId: nextStages[0].id,
                    });
                  } else {
                    navigate('levels');
                  }
                }}
                className="flex-1 min-w-[220px] inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#0F5E59] hover:bg-[#0B4A46] text-white text-sm font-bold"
              >
                <span>ابدأ المرحلة الأولى في الوحدة {targetLevelId + 1}</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setSubmittedResult(null);
                setActiveQuestions(null);
              }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold"
            >
              <RotateCcw className="w-4 h-4" />
              اختبار آخر
            </button>
            <button
              type="button"
              onClick={() => navigate('levels')}
              className="px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold"
            >
              العودة لمسار المراحل
            </button>
          </div>
        </div>
      )}

      {/* Past Exams History */}
      {recentExams.length > 0 && !activeQuestions && (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <h2 className="text-base font-extrabold">سجل اختباراتك الأخيرة</h2>
          <div className="space-y-2">
            {recentExams.map((ex) => (
              <div
                key={ex.id}
                className="p-3.5 rounded-xl bg-[#F8F7F4] dark:bg-slate-800 flex items-center justify-between text-sm"
              >
                <div>
                  <p className="font-bold">{ex.titleAr}</p>
                  <p className="text-xs text-slate-500 font-numeric">
                    {new Date(ex.dateIso).toLocaleDateString('ar-EG')} · {ex.correctCount}/{ex.totalQuestions} صحيح
                  </p>
                </div>
                <span
                  className={`font-numeric font-extrabold text-base ${
                    ex.score >= 70 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {ex.score}%
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
