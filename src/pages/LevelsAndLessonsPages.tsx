import React, { useCallback, useEffect, useState } from 'react';
import {
  Lock,
  CheckCircle2,
  BookOpen,
  Volume2,
  Gauge,
  Mic,
  Square,
  Play,
  ArrowRight,
  ArrowLeft,
  Gamepad2,
  Sparkles,
  CheckSquare,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  ALL_LESSONS,
  EXTRA_LESSONS,
  LEVELS,
  getLessonById,
  getLessonsForLevel,
} from '../data/curriculum';
import { ENGLISH_ALPHABET } from '../data/alphabetAndPhonetics';
import { Flashcard3D } from '../components/Flashcard3D';
import { LearningPath } from '../components/LearningPath';
import {
  speakEnglish,
  speakSlowEnglish,
  startAudioRecording,
  startSpeechRecognition,
  evaluateSpokenMatch,
} from '../utils/speech';

/* ============================================================================
   PAGE 4: LEVELS PAGE (المستويات + قسم الدروس الإضافية المستقل)
   ============================================================================ */
export const LevelsPage: React.FC = () => {
  const { activeProfile, navigate } = useApp();

  if (!activeProfile) return null;

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          مسار المراحل والوحدات
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          منهج كتاب «تكلم الإنجليزية في عشرة أيام» مقسّم إلى 6 وحدات متدرجة. أكمل كل مرحلة لتفتح التالية تلقائياً، ثم اجتز بوابة الوحدة لفتح الوحدة الجديدة.
        </p>
      </div>

      <LearningPath />

      {/* Standalone Extra Lessons Section (دروس إضافية - outside original PDF) */}
      <section className="rounded-3xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-slate-900 p-5 sm:p-6 space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">دروس إضافية (إثرائية)</h2>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-300 font-semibold">
            قسم مستقل خارج محتوى الملزمة الأصلية لمساعدتك في تكوين الجمل والأسئلة
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EXTRA_LESSONS.map((lesson) => {
            const done = activeProfile.completedLessonIds.includes(lesson.id);
            return (
              <div
                key={lesson.id}
                className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-700 dark:text-amber-400 font-semibold">{lesson.bookPages}</span>
                    {done && (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        مكتمل
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{lesson.titleAr}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{lesson.summaryAr}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('lesson-detail', { levelId: 7, lessonId: lesson.id })}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold transition-colors"
                >
                  فتح الدرس الإضافي
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

/* ============================================================================
   PAGE 5: LESSONS LIST PAGE (صفحة الدروس)
   ============================================================================ */
export const LessonsPage: React.FC = () => {
  const { activeProfile, selectedLevelId, navigate, isLevelUnlocked, isLessonUnlocked } = useApp();
  const [filterLevel, setFilterLevel] = useState<number>(selectedLevelId || 1);

  if (!activeProfile) return null;

  const currentLevelObj = LEVELS.find((l) => l.id === filterLevel);
  const lessons = getLessonsForLevel(filterLevel);
  const unlocked = isLevelUnlocked(filterLevel);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {currentLevelObj ? currentLevelObj.titleAr : 'دروس إضافية'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {currentLevelObj ? currentLevelObj.bookSectionAr : 'دروس تطبيقية إثرائية مستقلة عن الملزمة'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('levels')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowRight className="w-4 h-4" />
          خريطة المراحل
        </button>
      </div>

      {/* Level Switcher Tabs */}
      <div className="flex flex-wrap gap-2">
        {LEVELS.map((lvl) => {
          const lvlUnlocked = isLevelUnlocked(lvl.id);
          return (
            <button
              key={lvl.id}
              type="button"
              onClick={() => setFilterLevel(lvl.id)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 ${
                filterLevel === lvl.id
                  ? 'bg-[#0F5E59] text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {!lvlUnlocked && <Lock className="w-3.5 h-3.5" />}
              الوحدة {lvl.id}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setFilterLevel(7)}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
            filterLevel === 7
              ? 'bg-amber-600 text-white'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          دروس إضافية
        </button>
      </div>

      {!unlocked ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
          <Lock className="w-10 h-10 text-slate-400 mx-auto" />
          <h2 className="text-lg font-bold">هذه الوحدة مقفلة حالياً</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            اجتز اختبار الوحدة {filterLevel - 1} بنسبة 70% لفتح مراحل هذه الوحدة.
          </p>
          <button
            type="button"
            onClick={() => navigate('exams', { levelId: filterLevel - 1 })}
            className="px-5 py-2.5 rounded-xl bg-[#0F5E59] text-white text-sm font-bold"
          >
            الانتقال لاختبار الوحدة {filterLevel - 1}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lessons.map((lesson) => {
            const done = activeProfile.completedLessonIds.includes(lesson.id);
            const lessonOpen = isLessonUnlocked(lesson.id);
            return (
              <div
                key={lesson.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-colors ${
                  lessonOpen
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    : 'bg-slate-100/80 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-75'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      المرحلة <span className="font-numeric">{lesson.order}</span> · {lesson.bookPages}
                    </span>
                    {done ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        مكتملة
                      </span>
                    ) : !lessonOpen ? (
                      <span className="text-slate-500 font-bold flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" />
                        مقفلة
                      </span>
                    ) : (
                      <span className="text-[#0F5E59] dark:text-teal-400 font-bold">متاحة الآن</span>
                    )}
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{lesson.titleAr}</h3>
                  <p dir="ltr" className="font-english text-xs text-slate-500 text-right">
                    {lesson.titleEn}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {lesson.summaryAr}
                  </p>
                </div>

                {lessonOpen ? (
                  <button
                    type="button"
                    onClick={() =>
                      navigate('lesson-detail', { levelId: lesson.levelId, lessonId: lesson.id })
                    }
                    className="w-full py-2.5 px-4 rounded-xl bg-[#0F5E59] hover:bg-[#0B4A46] text-white text-sm font-bold transition-colors"
                  >
                    {done ? 'مراجعة المرحلة' : 'ابدأ هذه المرحلة'}
                  </button>
                ) : (
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 py-1.5">
                    أكمل المرحلة السابقة لفتحها تلقائياً.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   PAGE 6: LESSON DETAIL PAGE (شرح الدرس الكامل)
   ============================================================================ */
export const LessonDetailPage: React.FC = () => {
  const {
    activeProfile,
    selectedLessonId,
    navigate,
    visitLesson,
    completeLesson,
    recordMistake,
    addXp,
  } = useApp();

  const lesson = getLessonById(selectedLessonId) ?? ALL_LESSONS[0];
  const [activeTab, setActiveTab] = useState<'explain' | 'cards' | 'practice' | 'quiz'>('explain');

  // Voice recording & STT practice state inside lesson
  const [practiceIdx, setPracticeIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [spokenText, setSpokenText] = useState('');
  const [speechScore, setSpeechScore] = useState<number | null>(null);
  const [recorderCtrl, setRecorderCtrl] = useState<{ stop: () => Promise<string | null> } | null>(null);
  const [sttCtrl, setSttCtrl] = useState<{ stop: () => void } | null>(null);
  const [micNote, setMicNote] = useState('');

  // Quick interactive practice drill inside lesson
  const [drillIdx, setDrillIdx] = useState(0);
  const [drillFeedback, setDrillFeedback] = useState<{
    isCorrect: boolean;
    chosen: string;
    message: string;
  } | null>(null);

  // Lesson quiz & stage completion auto-advance state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [stageFinishedNow, setStageFinishedNow] = useState(false);
  const [autoAdvanceSeconds, setAutoAdvanceSeconds] = useState<number | null>(null);

  const nextStage = React.useMemo(() => {
    if (lesson.levelId === 7) {
      const idx = EXTRA_LESSONS.findIndex((l) => l.id === lesson.id);
      if (idx >= 0 && idx + 1 < EXTRA_LESSONS.length) {
        return { type: 'lesson' as const, lesson: EXTRA_LESSONS[idx + 1] };
      }
      return { type: 'completed-all' as const };
    }
    const levelLessons = getLessonsForLevel(lesson.levelId);
    const idx = levelLessons.findIndex((l) => l.id === lesson.id);
    if (idx >= 0 && idx + 1 < levelLessons.length) {
      return { type: 'lesson' as const, lesson: levelLessons[idx + 1] };
    }
    if (!activeProfile?.passedLevelIds.includes(lesson.levelId)) {
      return { type: 'checkpoint' as const, levelId: lesson.levelId };
    }
    if (lesson.levelId < 6) {
      const nextLvl = getLessonsForLevel(lesson.levelId + 1);
      if (nextLvl.length > 0) {
        return { type: 'lesson' as const, lesson: nextLvl[0] };
      }
    }
    return { type: 'completed-all' as const };
  }, [activeProfile?.passedLevelIds, lesson.id, lesson.levelId]);

  const goToNextStage = useCallback(() => {
    setAutoAdvanceSeconds(null);
    if (nextStage.type === 'lesson') {
      navigate('lesson-detail', {
        levelId: nextStage.lesson.levelId,
        lessonId: nextStage.lesson.id,
      });
    } else if (nextStage.type === 'checkpoint') {
      navigate('exams', { levelId: nextStage.levelId });
    } else {
      navigate('levels');
    }
  }, [navigate, nextStage]);

  useEffect(() => {
    visitLesson(lesson.id);
    setActiveTab('explain');
    setQuizAnswers({});
    setQuizSubmitted(false);
    setStageFinishedNow(false);
    setAutoAdvanceSeconds(null);
    setPracticeIdx(0);
    setSpokenText('');
    setSpeechScore(null);
    setRecordedAudioUrl(null);
    setDrillIdx(0);
    setDrillFeedback(null);
  }, [lesson.id, visitLesson]);

  useEffect(() => {
    if (autoAdvanceSeconds === null) return;
    if (autoAdvanceSeconds <= 0) {
      goToNextStage();
      return;
    }
    const timer = window.setTimeout(() => {
      setAutoAdvanceSeconds((s) => (s !== null ? s - 1 : null));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [autoAdvanceSeconds, goToNextStage]);

  useEffect(() => {
    if (!drillFeedback) return;
    const delay = drillFeedback.isCorrect ? 700 : 1150;
    const timer = window.setTimeout(() => {
      setDrillIdx((d) => (lesson.items.length > 0 ? (d + 1) % lesson.items.length : 0));
      setDrillFeedback(null);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [drillFeedback, lesson.items.length]);

  if (!activeProfile) return null;

  const isCompleted = activeProfile.completedLessonIds.includes(lesson.id);
  const voiceAccent = activeProfile.settings.voiceAccent;
  const speechRate = activeProfile.settings.speechRate;
  const currentPracticeItem = lesson.items[practiceIdx] ?? lesson.items[0];

  const handleStartPracticeMic = async () => {
    setMicNote('');
    setSpokenText('');
    setSpeechScore(null);
    setIsRecording(true);

    try {
      const rec = await startAudioRecording();
      setRecorderCtrl(rec);
    } catch {
      // STT can still run or inform user
    }

    const ctrl = startSpeechRecognition({
      lang: voiceAccent,
      onResult: (transcript, isFinal) => {
        setSpokenText(transcript);
        if (isFinal && currentPracticeItem) {
          const res = evaluateSpokenMatch(transcript, currentPracticeItem.en);
          setSpeechScore(res.score);
          if (res.isMatch) addXp(5);
        }
      },
      onError: (msg) => setMicNote(msg),
      onEnd: () => setIsRecording(false),
    });
    setSttCtrl(ctrl);
  };

  const handleStopPracticeMic = async () => {
    sttCtrl?.stop();
    if (recorderCtrl) {
      const url = await recorderCtrl.stop();
      if (url) setRecordedAudioUrl(url);
      setRecorderCtrl(null);
    }
    setIsRecording(false);
  };

  // Build 4 Arabic options for quick practice item
  const currentDrillItem = lesson.items[drillIdx % Math.max(1, lesson.items.length)];
  const drillOptions = React.useMemo(() => {
    if (!currentDrillItem) return [];
    const others = lesson.items
      .filter((i) => i.id !== currentDrillItem.id)
      .slice(0, 3)
      .map((i) => i.ar);
    const all = [currentDrillItem.ar, ...others];
    return all.sort((a, b) => a.localeCompare(b));
  }, [lesson.items, currentDrillItem]);

  const finishAndQueueNextStage = () => {
    completeLesson(lesson.id);
    setStageFinishedNow(true);
    setAutoAdvanceSeconds(4);
  };

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
    let correct = 0;
    lesson.quiz.forEach((q) => {
      const chosen = quizAnswers[q.id];
      if (chosen === q.correctIndex) {
        correct += 1;
      } else {
        recordMistake({
          id: `quiz_${lesson.id}_${q.id}`,
          en: q.englishText || q.options[q.correctIndex],
          ar: q.promptAr,
          lessonId: lesson.id,
          source: 'lesson',
          noteAr: q.explanationAr,
        });
      }
    });
    if (lesson.quiz.length === 0 || correct / lesson.quiz.length >= 0.5) {
      finishAndQueueNextStage();
    }
  };

  const quizCorrectCount = lesson.quiz.filter((q) => quizAnswers[q.id] === q.correctIndex).length;
  const stepIndex = activeTab === 'explain' ? 1 : activeTab === 'cards' ? 2 : activeTab === 'practice' ? 3 : 4;

  return (
    <div className="space-y-6">
      {/* Top Lesson Header + Duolingo-style Step Bar */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => navigate('levels')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowRight className="w-4 h-4" />
            العودة لمسار المراحل
          </button>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            المرحلة <span className="font-numeric">{lesson.order}</span> · {lesson.bookPages}
          </span>
        </div>

        {/* Step Progress Bar inside stage */}
        <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full bg-[#0F5E59] dark:bg-teal-400 rounded-full transition-all duration-300"
            style={{ width: `${(stepIndex / 4) * 100}%` }}
          />
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {lesson.titleAr}
            </h1>
            <p dir="ltr" className="font-english text-sm font-medium text-[#0F5E59] dark:text-teal-400 text-right">
              {lesson.titleEn}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl pt-1">
              {lesson.summaryAr}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={finishAndQueueNextStage}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                isCompleted
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-[#0F5E59] hover:bg-[#0B4A46] text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isCompleted ? 'المرحلة مكتملة' : 'إتمام المرحلة والانتقال للتالية'}
            </button>
            <button
              type="button"
              onClick={() => navigate('games')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold"
            >
              <Gamepad2 className="w-4 h-4 text-amber-600" />
              ألعاب إضافية
            </button>
          </div>
        </div>

        {/* Lesson Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          {[
            { id: 'explain' as const, label: '1. الشرح والأمثلة' },
            { id: 'cards' as const, label: '2. البطاقات' },
            { id: 'practice' as const, label: '3. النطق والتمرين' },
            { id: 'quiz' as const, label: '4. اختبار المرحلة' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#0F5E59] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stage Complete Auto-Advance Banner */}
      {stageFinishedNow && (
        <section className="rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-emerald-950 dark:text-emerald-100">
                أحسنت! أتممت هذه المرحلة بنجاح
              </h2>
              <p className="text-sm text-emerald-800 dark:text-emerald-300">
                {autoAdvanceSeconds !== null
                  ? `سيتم نقلك تلقائياً إلى المرحلة التالية خلال ${autoAdvanceSeconds} ثوانٍ...`
                  : 'المرحلة التالية أصبحت مفتوحة وجاهزة لك الآن.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={goToNextStage}
              className="flex-1 min-w-[220px] py-3.5 px-5 rounded-2xl bg-[#0F5E59] hover:bg-[#0B4A46] text-white font-bold text-sm sm:text-base inline-flex items-center justify-center gap-2 shadow-sm"
            >
              <span>
                {nextStage.type === 'lesson'
                  ? `المرحلة التالية: ${nextStage.lesson.titleAr}`
                  : nextStage.type === 'checkpoint'
                  ? `ابدأ اختبار اجتياز الوحدة ${nextStage.levelId}`
                  : 'تم إنهاء المنهج! عرض المسار'}
              </span>
              <ArrowLeft className="w-5 h-5" />
            </button>

            {autoAdvanceSeconds !== null && (
              <button
                type="button"
                onClick={() => setAutoAdvanceSeconds(null)}
                className="px-4 py-3.5 rounded-2xl border border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-sm font-bold"
              >
                البقاء للمراجعة
              </button>
            )}
          </div>
        </section>
      )}

      {/* TAB 1: EXPLANATION + ALPHABET TABLE + EXAMPLES + DIALOGUE */}
      {activeTab === 'explain' && (
        <div className="space-y-6">
          {lesson.explanationBlocks.map((block, idx) => (
            <section
              key={idx}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            >
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-700 dark:text-teal-400" />
                {block.titleAr}
              </h2>
              <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                {block.explanationAr}
              </p>

              <div className="space-y-2.5 pt-2">
                {block.examples.map((ex, exIdx) => (
                  <div
                    key={exIdx}
                    className="rounded-xl bg-[#F8F7F4] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <p dir="ltr" className="font-english font-bold text-base text-slate-900 dark:text-white text-right">
                        {ex.en}
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{ex.ar}</p>
                      {ex.pronunciationAr && (
                        <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                          النطق بالعربية: {ex.pronunciationAr}
                        </p>
                      )}
                      {ex.noteAr && <p className="text-xs text-amber-700 dark:text-amber-400">{ex.noteAr}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => speakEnglish(ex.en, { rate: speechRate, lang: voiceAccent })}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold"
                      >
                        <Volume2 className="w-4 h-4" />
                        استمع
                      </button>
                      <button
                        type="button"
                        onClick={() => speakSlowEnglish(ex.en, voiceAccent)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-semibold hover:bg-white dark:hover:bg-slate-700"
                      >
                        <Gauge className="w-4 h-4" />
                        بطيء
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* Complete 26-Letter Interactive Table for Alphabet Overview Lesson */}
          {(lesson.id === 'l1-alphabet' || lesson.id === 'l1-alphabet-overview') && (
            <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <h2 className="text-lg font-extrabold">جدول الحروف الأبجدية الـ 26 كاملة (اضغط للاستماع)</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ENGLISH_ALPHABET.map((item) => (
                  <button
                    key={item.capital}
                    type="button"
                    onClick={() =>
                      speakEnglish(`${item.capital}. ${item.sampleWord}`, {
                        rate: speechRate,
                        lang: voiceAccent,
                      })
                    }
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-600 bg-[#F8F7F4] dark:bg-slate-800 text-center space-y-1 transition-colors"
                  >
                    <p dir="ltr" className="font-english text-2xl font-extrabold text-teal-700 dark:text-teal-400">
                      {item.capital} {item.small}
                    </p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{item.pronunciationAr}</p>
                    <p dir="ltr" className="font-english text-xs text-slate-500">
                      {item.sampleWord}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">{item.sampleMeaningAr}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Dialogue Section if present */}
          {lesson.dialogue && lesson.dialogue.length > 0 && (
            <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">محادثة عملية من الدرس</h2>
                <button
                  type="button"
                  onClick={() =>
                    speakEnglish(lesson.dialogue!.map((d) => d.en).join('. '), {
                      rate: speechRate,
                      lang: voiceAccent,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold"
                >
                  <Volume2 className="w-4 h-4" />
                  تشغيل المحادثة كاملة
                </button>
              </div>
              <div className="space-y-3">
                {lesson.dialogue.map((line, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-2xl border ${
                      line.speaker === 'A'
                        ? 'bg-teal-50/60 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800'
                        : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700'
                    } flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-teal-800 dark:text-teal-300 block">
                        {line.speakerLabelAr}
                      </span>
                      <p dir="ltr" className="font-english font-bold text-base text-slate-900 dark:text-white text-right">
                        {line.en}
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{line.ar}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        النطق: {line.pronunciationAr}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => speakEnglish(line.en, { rate: speechRate, lang: voiceAccent })}
                      className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold shrink-0"
                    >
                      <Volume2 className="w-4 h-4 text-teal-700" />
                      أعد النطق
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
          {/* Step 1 Next Button */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('cards');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full py-4 px-5 rounded-2xl bg-[#0F5E59] hover:bg-[#0B4A46] text-white font-bold text-base inline-flex items-center justify-center gap-2 shadow-sm"
          >
            <span>التالي: البطاقات التفاعلية</span>
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* TAB 2: 3D FLASHCARDS */}
      {activeTab === 'cards' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {lesson.items.map((item) => (
              <Flashcard3D key={item.id} item={item} />
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveTab('practice');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full py-4 px-5 rounded-2xl bg-[#0F5E59] hover:bg-[#0B4A46] text-white font-bold text-base inline-flex items-center justify-center gap-2 shadow-sm"
          >
            <span>التالي: تدريب النطق والتمارين</span>
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* TAB 3: PRONUNCIATION + MINI PRACTICE DRILL */}
      {activeTab === 'practice' && (
        <div className="grid grid-cols-1 gap-6">
          {/* Pronunciation Recorder */}
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h2 className="text-lg font-extrabold">تدرّب على نطق كلمات الدرس بصوتك</h2>
            {currentPracticeItem && (
              <div className="p-4 rounded-xl bg-[#F8F7F4] dark:bg-slate-800 space-y-2 text-center">
                <p dir="ltr" className="font-english text-2xl font-extrabold text-slate-900 dark:text-white">
                  {currentPracticeItem.en}
                </p>
                <p className="text-base font-bold text-teal-700 dark:text-teal-400">
                  {currentPracticeItem.ar}
                </p>
                <p className="text-xs text-slate-500">النطق التقريبي: {currentPracticeItem.pronunciationAr}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 justify-center">
              <button
                type="button"
                onClick={() =>
                  currentPracticeItem &&
                  speakEnglish(currentPracticeItem.en, { rate: speechRate, lang: voiceAccent })
                }
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-bold"
              >
                <Volume2 className="w-4 h-4" />
                استمع
              </button>
              <button
                type="button"
                onClick={() =>
                  currentPracticeItem && speakSlowEnglish(currentPracticeItem.en, voiceAccent)
                }
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold"
              >
                <Gauge className="w-4 h-4" />
                بطيء
              </button>
              {!isRecording ? (
                <button
                  type="button"
                  onClick={handleStartPracticeMic}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold"
                >
                  <Mic className="w-4 h-4" />
                  سجّل نطقك
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopPracticeMic}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold"
                >
                  <Square className="w-4 h-4" />
                  إيقاف التسجيل
                </button>
              )}
            </div>

            {micNote && <p className="text-xs text-amber-700 dark:text-amber-400 text-center">{micNote}</p>}

            {spokenText && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm space-y-1">
                <p>
                  ما تعرف عليه المتصفح: <span dir="ltr" className="font-english font-bold">{spokenText}</span>
                </p>
                {speechScore !== null && (
                  <p className="font-bold text-teal-700 dark:text-teal-400 font-numeric">
                    نسبة تطابق النص المسموع: {speechScore}%
                  </p>
                )}
              </div>
            )}

            {recordedAudioUrl && (
              <div className="flex items-center justify-center gap-2">
                <audio controls src={recordedAudioUrl} className="w-full h-10" />
              </div>
            )}

            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
              ملاحظة تقنية: يقيس المتصفح تطابق الكلمات المتعرف عليها نصياً مع الكلمة المستهدفة ويسمح لك بسماع تسجيلك للمقارنة الذاتية.
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setPracticeIdx((i) => Math.max(0, i - 1));
                  setSpokenText('');
                  setSpeechScore(null);
                  setRecordedAudioUrl(null);
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
              >
                الكلمة السابقة
              </button>
              <span className="font-numeric text-xs text-slate-500">
                {practiceIdx + 1} / {lesson.items.length}
              </span>
              <button
                type="button"
                onClick={() => {
                  setPracticeIdx((i) => (i + 1) % lesson.items.length);
                  setSpokenText('');
                  setSpeechScore(null);
                  setRecordedAudioUrl(null);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-teal-700 text-white text-xs font-bold"
              >
                الكلمة التالية
              </button>
            </div>
          </section>

          {/* Instant Meaning Drill */}
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h2 className="text-lg font-extrabold">تمرين سريع على مفردات الدرس</h2>
            {currentDrillItem && (
              <>
                <div className="p-4 rounded-xl bg-[#F8F7F4] dark:bg-slate-800 flex items-center justify-between">
                  <span dir="ltr" className="font-english text-xl font-extrabold">
                    {currentDrillItem.en}
                  </span>
                  <button
                    type="button"
                    onClick={() => speakEnglish(currentDrillItem.en, { rate: speechRate, lang: voiceAccent })}
                    className="p-2 rounded-xl bg-teal-700 text-white"
                    aria-label="استماع"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {drillOptions.map((opt) => {
                    const isRight = opt === currentDrillItem.ar;
                    const isChosen = drillFeedback?.chosen === opt;
                    let optionStyle =
                      'border-slate-200 dark:border-slate-700 hover:border-teal-600 bg-white dark:bg-slate-800';
                    if (drillFeedback) {
                      if (isRight) {
                        optionStyle =
                          'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200';
                      } else if (isChosen) {
                        optionStyle =
                          'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200';
                      }
                    }

                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={Boolean(drillFeedback)}
                        onClick={() => {
                          if (drillFeedback) return;
                          if (isRight) {
                            setDrillFeedback({
                              isCorrect: true,
                              chosen: opt,
                              message: 'إجابة صحيحة! جاري الانتقال للسؤال التالي...',
                            });
                            addXp(5);
                          } else {
                            setDrillFeedback({
                              isCorrect: false,
                              chosen: opt,
                              message: `غير صحيح — المعنى الصحيح: ${currentDrillItem.ar}`,
                            });
                            recordMistake({
                              id: currentDrillItem.id,
                              en: currentDrillItem.en,
                              ar: currentDrillItem.ar,
                              pronunciationAr: currentDrillItem.pronunciationAr,
                              lessonId: lesson.id,
                              source: 'lesson',
                            });
                          }
                        }}
                        className={`p-3.5 rounded-xl border text-right font-semibold text-sm transition-colors ${optionStyle}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {drillFeedback && (
                  <p
                    className={`text-sm font-bold ${
                      drillFeedback.isCorrect
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {drillFeedback.message}
                  </p>
                )}
              </>
            )}
          </section>
          {/* Step 3 Next Button -> Quiz */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('quiz');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full py-4 px-5 rounded-2xl bg-[#0F5E59] hover:bg-[#0B4A46] text-white font-bold text-base inline-flex items-center justify-center gap-2 shadow-sm"
          >
            <span>التالي: اختبار اجتياز المرحلة</span>
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* TAB 4: SHORT LESSON QUIZ */}
      {activeTab === 'quiz' && (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-teal-700" />
              الاختبار القصير للدرس
            </h2>
            {quizSubmitted && (
              <span className="font-numeric text-sm font-extrabold text-teal-700 dark:text-teal-400">
                النتيجة: {quizCorrectCount} / {lesson.quiz.length}
              </span>
            )}
          </div>

          <div className="space-y-5">
            {lesson.quiz.map((q, qIndex) => {
              const selected = quizAnswers[q.id];
              return (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3"
                >
                  <p className="font-bold text-base">
                    <span className="font-numeric text-teal-700 ml-1">{qIndex + 1}.</span>
                    {q.promptAr}
                  </p>
                  {q.englishText && (
                    <p dir="ltr" className="font-english font-bold text-sm text-slate-700 dark:text-slate-300 text-right">
                      {q.englishText}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options.map((opt, optIdx) => {
                      const isChosen = selected === optIdx;
                      const isRight = optIdx === q.correctIndex;
                      let style =
                        'border-slate-200 dark:border-slate-700 hover:border-teal-600 bg-white dark:bg-slate-800';
                      if (quizSubmitted) {
                        if (isRight) {
                          style = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200';
                        } else if (isChosen && !isRight) {
                          style = 'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200';
                        }
                      } else if (isChosen) {
                        style = 'border-teal-700 bg-teal-50 dark:bg-teal-950/50';
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          disabled={quizSubmitted}
                          onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                          className={`p-3 rounded-xl border text-right text-sm font-semibold transition-colors ${style}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {quizSubmitted && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 pt-1">
                      التوضيح: {q.explanationAr}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3">
            {!quizSubmitted ? (
              <button
                type="button"
                onClick={handleQuizSubmit}
                disabled={Object.keys(quizAnswers).length < lesson.quiz.length}
                className="px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-sm"
              >
                تصحيح الاختبار القصير
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setQuizAnswers({});
                  setQuizSubmitted(false);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold"
              >
                <RotateCcw className="w-4 h-4" />
                إعادة المحاولة
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
