import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Flame,
  Gauge,
  RotateCcw,
  Trophy,
  Volume2,
  X,
  XCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  LESSON_BY_ID,
  STAGE_BY_ID,
  STAGES_400,
  TOTAL_STAGES_COUNT,
  buildStageExercises,
  getStageKindLabelAr,
} from '../data/stages400';
import { speakEnglish, speakSlowEnglish } from '../utils/speech';
import {
  playErrorThud,
  playStageCompleteFanfare,
  playStreakChime,
  playSuccessChime,
  playTapPop,
} from '../utils/sfx';
import { BageshMascot } from '../components/BageshMascot';

export const StagePlayerPage: React.FC = () => {
  const {
    activeProfile,
    selectedStageId,
    navigate,
    visitStage,
    completeStage,
    recordMistake,
    getNextStageAfter,
  } = useApp();

  const stage = STAGE_BY_ID.get(selectedStageId) ?? STAGES_400[0];
  const lesson = LESSON_BY_ID.get(stage.sourceLessonId);
  const steps = useMemo(() => buildStageExercises(stage), [stage]);

  const [stepIndex, setStepIndex] = useState(0);
  const [selectedMcq, setSelectedMcq] = useState<number | null>(null);
  const [arrangeOrder, setArrangeOrder] = useState<number[]>([]);
  const [checkedStatus, setCheckedStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [correctDrills, setCorrectDrills] = useState(0);
  const [totalDrillsDone, setTotalDrillsDone] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showRuleSheet, setShowRuleSheet] = useState(false);
  const [autoAdvanceSec, setAutoAdvanceSec] = useState<number | null>(null);

  const soundEnabled = activeProfile?.settings.soundEffects ?? true;
  const nextTarget = useMemo(() => getNextStageAfter(stage.id), [getNextStageAfter, stage.id]);

  const goNextTarget = useCallback(() => {
    setAutoAdvanceSec(null);
    if (nextTarget.type === 'stage') {
      navigate('stage-player', {
        levelId: nextTarget.stage.levelId,
        stageId: nextTarget.stage.id,
      });
    } else if (nextTarget.type === 'checkpoint') {
      navigate('exams', { levelId: nextTarget.levelId });
    } else {
      navigate('levels');
    }
  }, [navigate, nextTarget]);

  useEffect(() => {
    visitStage(stage.id);
    setStepIndex(0);
    setSelectedMcq(null);
    setArrangeOrder([]);
    setCheckedStatus('idle');
    setCorrectDrills(0);
    setTotalDrillsDone(0);
    setComboStreak(0);
    setFinished(false);
    setShowRuleSheet(false);
    setAutoAdvanceSec(null);
  }, [stage.id, visitStage]);

  useEffect(() => {
    if (autoAdvanceSec === null) return;
    if (autoAdvanceSec <= 0) {
      goNextTarget();
      return;
    }
    const timer = window.setTimeout(() => {
      setAutoAdvanceSec((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [autoAdvanceSec, goNextTarget]);

  const currentStep = steps[stepIndex];

  const handleAdvanceStep = useCallback(() => {
    if (stepIndex + 1 < steps.length) {
      setStepIndex((i) => i + 1);
      setSelectedMcq(null);
      setArrangeOrder([]);
      setCheckedStatus('idle');
    } else {
      completeStage(stage.id);
      playStageCompleteFanfare(soundEnabled);
      setFinished(true);
      setAutoAdvanceSec(2);
    }
  }, [completeStage, soundEnabled, stage.id, stepIndex, steps.length]);

  useEffect(() => {
    if (checkedStatus === 'idle' || finished || !currentStep || currentStep.type === 'preview') return;
    const baseDelay = currentStep.type === 'arrange' ? 850 : 650;
    const delay = checkedStatus === 'correct' ? baseDelay : 1200;
    const timer = window.setTimeout(() => {
      handleAdvanceStep();
    }, delay);
    return () => window.clearTimeout(timer);
  }, [checkedStatus, currentStep, finished, handleAdvanceStep]);

  if (!activeProfile) return null;

  const voiceAccent = activeProfile.settings.voiceAccent;
  const speechRate = activeProfile.settings.speechRate;
  const progressPct = finished
    ? 100
    : Math.max(8, Math.round((stepIndex / Math.max(1, steps.length)) * 100));

  const applyEvaluation = (
    isCorrect: boolean,
    mistakeItem: { id: string; en: string; ar: string; pronunciationAr: string },
    explanationAr: string
  ) => {
    setTotalDrillsDone((n) => n + 1);
    if (isCorrect) {
      const nextCombo = comboStreak + 1;
      setCorrectDrills((n) => n + 1);
      setComboStreak(nextCombo);
      setCheckedStatus('correct');
      if (nextCombo >= 3) {
        playStreakChime(soundEnabled);
      } else {
        playSuccessChime(soundEnabled);
      }
    } else {
      setComboStreak(0);
      setCheckedStatus('wrong');
      playErrorThud(soundEnabled);
      recordMistake({
        id: mistakeItem.id,
        en: mistakeItem.en,
        ar: mistakeItem.ar,
        pronunciationAr: mistakeItem.pronunciationAr,
        lessonId: stage.sourceLessonId,
        source: 'lesson',
        noteAr: explanationAr,
      });
    }
  };

  const handleSelectMcq = (idx: number) => {
    if (!currentStep || currentStep.type !== 'mcq' || checkedStatus !== 'idle') return;
    setSelectedMcq(idx);
    const isCorrect = idx === currentStep.correctIndex;
    applyEvaluation(isCorrect, currentStep.mistakeItem, currentStep.explanationAr);
  };

  const handleSelectArrangeToken = (idx: number) => {
    if (!currentStep || currentStep.type !== 'arrange' || checkedStatus !== 'idle') return;
    if (arrangeOrder.includes(idx)) return;
    playTapPop(soundEnabled);
    const nextOrder = [...arrangeOrder, idx];
    setArrangeOrder(nextOrder);

    if (nextOrder.length === currentStep.targetTokens.length) {
      const built = nextOrder.map((tokenIdx) => currentStep.shuffledTokens[tokenIdx]);
      const joinedBuilt =
        currentStep.mode === 'letters'
          ? built.join('').toLowerCase()
          : built.join(' ').toLowerCase();
      const joinedTarget =
        currentStep.mode === 'letters'
          ? currentStep.targetTokens.join('').toLowerCase()
          : currentStep.targetTokens.join(' ').toLowerCase();
      const isCorrect = joinedBuilt === joinedTarget;
      speakEnglish(currentStep.speakText, { rate: speechRate, lang: voiceAccent });
      applyEvaluation(isCorrect, currentStep.mistakeItem, currentStep.explanationAr);
    }
  };

  const ruleBlock =
    lesson && stage.ruleIndex !== undefined
      ? lesson.explanationBlocks[stage.ruleIndex] ?? lesson.explanationBlocks[0]
      : lesson?.explanationBlocks[0];

  const accuracyPct =
    totalDrillsDone > 0 ? Math.round((correctDrills / totalDrillsDone) * 100) : 100;

  return (
    <div className="min-h-[calc(100vh-3rem)] flex flex-col justify-between gap-6">
      {/* Top Distraction-Free Progress Header */}
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('home')}
            className="p-2 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-[#F7F7F7] dark:hover:bg-[#1B2B33] min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
            aria-label="إغلاق التدريب والعودة للمسار"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>

          <div className="flex-1 h-4 rounded-full bg-[#E5E5E5] dark:bg-[#37464F] overflow-hidden relative">
            <div
              className="h-full bg-[#58CC02] rounded-full transition-all duration-300 relative"
              style={{ width: `${progressPct}%` }}
            >
              <div className="absolute inset-x-2 top-1 h-1 rounded-full bg-[#7CE030]" />
            </div>
          </div>

          {comboStreak >= 2 ? (
            <span className="inline-flex items-center gap-1 text-sm font-black text-[#FF9600] font-numeric shrink-0 animate-pop">
              <Flame className="w-5 h-5 fill-current" />
              <span>{comboStreak}</span>
            </span>
          ) : (
            <span className="text-xs sm:text-sm font-extrabold text-[#0A4191] dark:text-sky-300 font-numeric shrink-0">
              {stage.stageNumber}/{TOTAL_STAGES_COUNT}
            </span>
          )}

          {lesson && (
            <button
              type="button"
              onClick={() => setShowRuleSheet((s) => !s)}
              className="p-2 rounded-xl border-2 border-[#E5E5E5] dark:border-[#37464F] hover:border-[#1CB0F6] text-[#1CB0F6] min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
              aria-label="عرض شرح القاعدة"
              title="الشرح"
            >
              <BookOpen className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 px-1">
          <span className="truncate">
            المرحلة {stage.stageNumber}: {stage.titleAr}
          </span>
          <span className="shrink-0 font-numeric">{getStageKindLabelAr(stage.kind)}</span>
        </div>

        {showRuleSheet && lesson && (
          <div className="rounded-2xl bg-[#F7F7F7] dark:bg-[#1B2B33] border-2 border-[#E5E5E5] dark:border-[#37464F] p-4 space-y-2.5">
            {ruleBlock && (
              <>
                <p className="font-extrabold text-base">{ruleBlock.titleAr}</p>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  {ruleBlock.explanationAr}
                </p>
              </>
            )}
            <button
              type="button"
              onClick={() =>
                navigate('lesson-detail', {
                  levelId: lesson.levelId,
                  lessonId: lesson.id,
                })
              }
              className="text-sm font-extrabold text-[#1CB0F6] hover:underline"
            >
              فتح الدرس الكامل ({lesson.titleAr})
            </button>
          </div>
        )}
      </header>

      {/* Main Centered Exercise Stage */}
      <div className="flex-1 flex flex-col justify-center py-2">
        {finished ? (
          /* Wassem Bagesh Celebration Screen */
          <section className="rounded-3xl bg-white dark:bg-[#1B2B33] border-2 border-[#FFC800] p-6 sm:p-8 text-center space-y-6 animate-pop">
            <div className="flex flex-col items-center gap-3">
              <img
                src="/app-icon.png"
                alt="وسيم باقش"
                className="w-24 h-24 rounded-full object-cover shadow-md"
              />
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFC800] text-[#5C3D00] font-black text-sm">
                <Trophy className="w-4 h-4" />
                <span>المرحلة {stage.stageNumber} مكتملة!</span>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-[#58CC02]">
                {accuracyPct >= 90
                  ? `أداء خرافي يا ${activeProfile.name}!`
                  : `أحسنت يا ${activeProfile.name}! واصل التقدم`}
              </h2>
              <div className="flex items-center justify-center gap-4 text-sm sm:text-base font-extrabold pt-2">
                <span className="text-[#1CB0F6] font-numeric">+25 XP</span>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className="text-[#58CC02] font-numeric">الدقة {accuracyPct}%</span>
              </div>
              {autoAdvanceSec !== null && (
                <p className="text-xs sm:text-sm font-bold text-[#58CC02] pt-2">
                  انتقال تلقائي للمرحلة التالية خلال {autoAdvanceSec} ثوانٍ...
                </p>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={goNextTarget}
                className="w-full py-4 px-5 rounded-2xl bg-[#58CC02] hover:bg-[#61E002] border-b-4 border-[#46A302] active:translate-y-0.5 active:border-b-2 text-white font-black text-base sm:text-lg inline-flex items-center justify-center gap-2 transition-all"
              >
                <span>
                  {nextTarget.type === 'stage'
                    ? `المرحلة التالية (${nextTarget.stage.stageNumber})`
                    : nextTarget.type === 'checkpoint'
                    ? `اختبار اجتياز الوحدة ${nextTarget.levelId}`
                    : 'أتممت كل الـ 400 مرحلة! عرض المسار'}
                </span>
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex gap-2.5">
                {autoAdvanceSec !== null && (
                  <button
                    type="button"
                    onClick={() => setAutoAdvanceSec(null)}
                    className="flex-1 py-3 rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#37464F] font-extrabold text-sm"
                  >
                    توقف هنا
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setAutoAdvanceSec(null);
                    setStepIndex(0);
                    setSelectedMcq(null);
                    setArrangeOrder([]);
                    setCheckedStatus('idle');
                    setCorrectDrills(0);
                    setTotalDrillsDone(0);
                    setComboStreak(0);
                    setFinished(false);
                  }}
                  className="flex-1 py-3 rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#37464F] font-extrabold text-sm inline-flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  إعادة التدريب
                </button>
              </div>
            </div>
          </section>
        ) : currentStep?.type === 'preview' ? (
          /* STEP 1: INTRO / VOCABULARY PREVIEW WITH MOTIVATING MASCOT */
          <section className="space-y-5">
            <BageshMascot
              mood="greeting"
              messageAr={`مرحلة ${stage.stageNumber}: تعلّم هذه الكلمات ثم سنبدأ التحدي السريع معاً!`}
              speakPhraseEn="Let us learn these words together!"
              compact
              voiceAccent={voiceAccent}
              speechRate={speechRate}
              soundEnabled={soundEnabled}
            />

            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-black">{currentStep.titleAr}</h2>
              {currentStep.ruleTitleAr && (
                <p className="text-sm sm:text-base font-extrabold text-[#1CB0F6]">
                  {currentStep.ruleTitleAr}
                </p>
              )}
              {currentStep.ruleExplanationAr && (
                <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  {currentStep.ruleExplanationAr}
                </p>
              )}
            </div>

            <div className="space-y-3">
              {currentStep.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-[#F7F7F7] dark:bg-[#1B2B33] border-2 border-[#E5E5E5] dark:border-[#37464F] p-4 sm:p-5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <p dir="ltr" className="font-english font-black text-xl sm:text-2xl text-right">
                      {item.en}
                    </p>
                    <p className="text-base sm:text-lg font-extrabold text-[#58CC02]">
                      {item.ar}
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">
                      النطق: {item.pronunciationAr}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => speakEnglish(item.en, { rate: speechRate, lang: voiceAccent })}
                    className="w-12 h-12 rounded-2xl bg-[#1CB0F6] hover:bg-[#23B8FF] border-b-4 border-[#1899D6] active:translate-y-0.5 active:border-b-2 text-white flex items-center justify-center shrink-0 transition-all"
                    aria-label={`استمع إلى ${item.en}`}
                  >
                    <Volume2 className="w-6 h-6" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                playTapPop(soundEnabled);
                handleAdvanceStep();
              }}
              className="w-full py-4 px-5 rounded-2xl bg-[#58CC02] hover:bg-[#61E002] border-b-4 border-[#46A302] active:translate-y-0.5 active:border-b-2 text-white font-black text-base sm:text-lg inline-flex items-center justify-center gap-2 transition-all"
            >
              <span>فهمت — ابدأ التحدي</span>
              <ArrowLeft className="w-5 h-5" />
            </button>
          </section>
        ) : currentStep?.type === 'mcq' ? (
          /* STEP 2: MULTIPLE CHOICE / LISTENING WITH WASSEM BAGESH EMBLEM BUBBLE */
          <section className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-black leading-snug">
              {currentStep.promptAr}
            </h2>

            {(currentStep.promptEn || currentStep.speakText) && (
              <div className="flex items-center gap-3.5">
                <img
                  src="/app-icon.png"
                  alt="وسيم باقش"
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shrink-0 shadow-xs"
                />

                <div className="flex-1 rounded-2xl border-2 border-[#E5E5E5] dark:border-[#37464F] bg-white dark:bg-[#1B2B33] p-4 flex flex-wrap items-center justify-between gap-3">
                  {currentStep.promptEn && !currentStep.listenOnly ? (
                    <p dir="ltr" className="font-english text-2xl sm:text-3xl font-black text-[#1CB0F6]">
                      {currentStep.promptEn}
                    </p>
                  ) : (
                    <span className="text-sm sm:text-base font-extrabold text-slate-600 dark:text-slate-300">
                      اضغط للاستماع جيداً
                    </span>
                  )}

                  {currentStep.speakText && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          speakEnglish(currentStep.speakText!, { rate: speechRate, lang: voiceAccent })
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1CB0F6] hover:bg-[#23B8FF] border-b-4 border-[#1899D6] active:translate-y-0.5 active:border-b-2 text-white text-sm font-extrabold min-h-[44px]"
                        aria-label="استمع للنطق"
                      >
                        <Volume2 className="w-5 h-5" />
                        <span>استمع</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => speakSlowEnglish(currentStep.speakText!, voiceAccent)}
                        className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl bg-white dark:bg-[#131F24] border-2 border-b-4 border-[#E5E5E5] dark:border-[#37464F] active:translate-y-0.5 active:border-b-2 text-sm font-extrabold min-h-[44px]"
                        aria-label="نطق بطيء"
                      >
                        <Gauge className="w-4 h-4 text-[#1CB0F6]" />
                        <span>بطيء</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              {currentStep.options.map((opt, idx) => {
                const chosen = selectedMcq === idx;
                const isRight = idx === currentStep.correctIndex;
                let cardStyle =
                  'bg-white dark:bg-[#1B2B33] border-[#E5E5E5] dark:border-[#37464F] hover:bg-[#F7F7F7] dark:hover:bg-[#24363F]';

                if (checkedStatus !== 'idle') {
                  if (isRight) {
                    cardStyle =
                      'bg-[#D7FFB8] dark:bg-emerald-950/70 border-[#58CC02] text-[#46A302] dark:text-emerald-300 animate-pop';
                  } else if (chosen && !isRight) {
                    cardStyle =
                      'bg-[#FFDFE0] dark:bg-rose-950/70 border-[#FF4B4B] text-[#EA2B2B] dark:text-rose-300 animate-shake';
                  }
                } else if (chosen) {
                  cardStyle =
                    'bg-[#DDF4FF] dark:bg-sky-950/60 border-[#1CB0F6] text-[#1899D6] dark:text-sky-300';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={checkedStatus !== 'idle'}
                    dir={currentStep.optionsDir}
                    onClick={() => handleSelectMcq(idx)}
                    className={`w-full p-4 rounded-2xl border-2 border-b-4 text-base sm:text-lg font-extrabold transition-all active:translate-y-0.5 active:border-b-2 min-h-[60px] flex items-center justify-between gap-3 ${
                      currentStep.optionsDir === 'ltr' ? 'font-english text-left' : 'text-right'
                    } ${cardStyle}`}
                  >
                    <span className="flex-1">{opt}</span>
                    <span className="w-7 h-7 rounded-lg border-2 border-current/25 flex items-center justify-center text-xs font-numeric opacity-60 shrink-0">
                      {idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : currentStep?.type === 'arrange' ? (
          /* STEP 3: WORD BANK / LETTER TILES */
          <section className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-black leading-snug">
              {currentStep.promptAr}
            </h2>

            <div
              dir="ltr"
              className="min-h-[88px] p-4 rounded-2xl bg-[#F7F7F7] dark:bg-[#1B2B33] border-2 border-dashed border-[#CECECE] dark:border-[#37464F] flex flex-wrap items-center justify-center gap-2.5"
            >
              {arrangeOrder.length === 0 ? (
                <span className="text-sm font-bold text-slate-400">
                  اضغط على الكلمات بالأسفل بالترتيب
                </span>
              ) : (
                arrangeOrder.map((tokenIdx, pos) => (
                  <button
                    key={`${tokenIdx}-${pos}`}
                    type="button"
                    disabled={checkedStatus !== 'idle'}
                    onClick={() =>
                      setArrangeOrder((prev) => prev.filter((_, p) => p !== pos))
                    }
                    className="px-4 py-2.5 rounded-2xl bg-[#1CB0F6] border-b-4 border-[#1899D6] active:translate-y-0.5 active:border-b-2 text-white font-english font-extrabold text-base sm:text-lg min-h-[44px]"
                  >
                    {currentStep.shuffledTokens[tokenIdx]}
                  </button>
                ))
              )}
            </div>

            <div dir="ltr" className="flex flex-wrap items-center justify-center gap-2.5">
              {currentStep.shuffledTokens.map((token, idx) => {
                const used = arrangeOrder.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={used || checkedStatus !== 'idle'}
                    onClick={() => handleSelectArrangeToken(idx)}
                    className={`px-4 py-3 rounded-2xl border-2 border-b-4 font-english font-extrabold text-base sm:text-lg min-h-[48px] transition-all active:translate-y-0.5 active:border-b-2 ${
                      used
                        ? 'opacity-25 bg-[#E5E5E5] dark:bg-[#243137] border-[#CECECE] dark:border-[#37464F]'
                        : 'bg-white dark:bg-[#1B2B33] border-[#E5E5E5] dark:border-[#37464F] hover:border-[#1CB0F6]'
                    }`}
                  >
                    {token}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>

      {/* Bottom Instant Feedback Dock (Auto-Advances) */}
      {!finished && checkedStatus !== 'idle' && currentStep && currentStep.type !== 'preview' && (
        <footer
          className={`rounded-3xl p-4 sm:p-5 border-2 flex items-start gap-3 animate-pop ${
            checkedStatus === 'correct'
              ? 'bg-[#D7FFB8] dark:bg-emerald-950/70 border-[#58CC02] text-[#46A302] dark:text-emerald-200'
              : 'bg-[#FFDFE0] dark:bg-rose-950/70 border-[#FF4B4B] text-[#EA2B2B] dark:text-rose-200'
          }`}
        >
          {checkedStatus === 'correct' ? (
            <CheckCircle2 className="w-7 h-7 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-7 h-7 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <p className="font-black text-base sm:text-lg">
              {checkedStatus === 'correct'
                ? comboStreak >= 3
                  ? `رائع! ${comboStreak} إجابات متتالية! جاري الانتقال...`
                  : 'ممتاز! جاري الانتقال للسؤال التالي...'
                : currentStep.type === 'arrange'
                ? 'انتبه! الترتيب الصحيح:'
                : 'الإجابة الصحيحة موضحة بالأخضر:'}
            </p>
            <p
              dir={currentStep.type === 'arrange' ? 'ltr' : 'rtl'}
              className={`text-sm sm:text-base font-bold ${
                currentStep.type === 'arrange' ? 'font-english text-right' : ''
              }`}
            >
              {currentStep.type === 'arrange'
                ? currentStep.fullAnswerEn
                : currentStep.explanationAr}
            </p>
          </div>
        </footer>
      )}
    </div>
  );
};
