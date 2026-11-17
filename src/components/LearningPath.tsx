import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  Headphones,
  Layers,
  Lock,
  RotateCcw,
  Star,
  Trophy,
  Volume2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LEVELS, getLessonsForLevel } from '../data/curriculum';
import {
  STAGE_BY_NUMBER,
  STAGES_BY_LESSON_ID,
  STAGES_BY_LEVEL,
  TOTAL_STAGES_COUNT,
  getStageKindLabelAr,
} from '../data/stages400';
import type { LearningStage, StageKind } from '../types/curriculum';
import { BageshMascot } from './BageshMascot';
import { playTapPop } from '../utils/sfx';

interface UnitTheme {
  bg: string;
  borderBottom: string;
  badgeText: string;
}

const UNIT_THEMES: Record<number, UnitTheme> = {
  1: { bg: 'bg-[#58CC02]', borderBottom: 'border-[#46A302]', badgeText: 'text-[#58CC02]' },
  2: { bg: 'bg-[#CE82FF]', borderBottom: 'border-[#A55EEA]', badgeText: 'text-[#9333EA]' },
  3: { bg: 'bg-[#1CB0F6]', borderBottom: 'border-[#1899D6]', badgeText: 'text-[#1899D6]' },
  4: { bg: 'bg-[#FF9600]', borderBottom: 'border-[#E58600]', badgeText: 'text-[#E58600]' },
  5: { bg: 'bg-[#FF4B4B]', borderBottom: 'border-[#EA2B2B]', badgeText: 'text-[#EA2B2B]' },
  6: { bg: 'bg-[#0A4191]', borderBottom: 'border-[#062961]', badgeText: 'text-[#0A4191]' },
};

// Colorful Duolingo-style stage node palette cycling cleanly across stages
const STAGE_COLOR_PALETTE: { bg: string; border: string; ring: string }[] = [
  { bg: 'bg-[#58CC02]', border: 'border-[#46A302]', ring: 'ring-[#58CC02]/25' },
  { bg: 'bg-[#1CB0F6]', border: 'border-[#1899D6]', ring: 'ring-[#1CB0F6]/25' },
  { bg: 'bg-[#CE82FF]', border: 'border-[#A55EEA]', ring: 'ring-[#CE82FF]/25' },
  { bg: 'bg-[#FF9600]', border: 'border-[#E58600]', ring: 'ring-[#FF9600]/25' },
  { bg: 'bg-[#00CD9C]', border: 'border-[#00A87E]', ring: 'ring-[#00CD9C]/25' },
  { bg: 'bg-[#FF4B4B]', border: 'border-[#EA2B2B]', ring: 'ring-[#FF4B4B]/25' },
];

const MASCOT_PATH_MESSAGES: { ar: string; en: string }[] = [
  { ar: 'واصل يا بطل! كل مرحلة تفتح لك مهارة جديدة', en: 'Keep going! You are doing great!' },
  { ar: 'أنت تتقدم بسرعة رائعة في مسار وسيم باقش!', en: 'Awesome progress! Keep it up!' },
  { ar: 'المراحل الملونة والمرقمة تنتظرك — هيا نكمل!', en: 'Ready for the next stage?' },
];

function getSmallStageKindIcon(kind: StageKind) {
  switch (kind) {
    case 'learn':
      return <BookOpen className="w-3.5 h-3.5" />;
    case 'vocab':
      return <Volume2 className="w-3.5 h-3.5" />;
    case 'arrange':
      return <Layers className="w-3.5 h-3.5" />;
    case 'listen':
      return <Headphones className="w-3.5 h-3.5" />;
    case 'review':
      return <RotateCcw className="w-3.5 h-3.5" />;
    case 'boss':
      return <Trophy className="w-3.5 h-3.5" />;
  }
}

export const LearningPath: React.FC = () => {
  const {
    activeProfile,
    navigate,
    isLevelUnlocked,
    isLevelLessonsCompleted,
    isStageCompleted,
    isStageUnlocked,
    getCurrentActiveStage,
  } = useApp();

  const activeStageTarget = getCurrentActiveStage();
  const activeUnitId =
    activeStageTarget.type === 'stage'
      ? activeStageTarget.stage.levelId
      : activeStageTarget.type === 'checkpoint'
      ? activeStageTarget.levelId
      : 6;

  const [selectedUnitId, setSelectedUnitId] = useState<number>(activeUnitId);
  const [lockedHint, setLockedHint] = useState<string | null>(null);
  const [jumpNumber, setJumpNumber] = useState('');

  useEffect(() => {
    setSelectedUnitId(activeUnitId);
  }, [activeUnitId]);

  const unitLessonGroups = useMemo(() => {
    const map: Record<number, { lessonId: string; titleAr: string; stages: LearningStage[] }[]> = {};
    for (const lvl of LEVELS) {
      const lessons = getLessonsForLevel(lvl.id);
      map[lvl.id] = lessons.map((l) => ({
        lessonId: l.id,
        titleAr: l.titleAr,
        stages: STAGES_BY_LESSON_ID.get(l.id) ?? [],
      }));
    }
    return map;
  }, []);

  if (!activeProfile) return null;

  const soundEnabled = activeProfile.settings.soundEffects ?? true;
  const currentLevel = LEVELS.find((l) => l.id === selectedUnitId) ?? LEVELS[0];
  const theme = UNIT_THEMES[currentLevel.id] ?? UNIT_THEMES[1];
  const unitUnlocked = isLevelUnlocked(currentLevel.id);
  const unitPassed = activeProfile.passedLevelIds.includes(currentLevel.id);
  const lvlStages = STAGES_BY_LEVEL[currentLevel.id] ?? [];
  const doneCount = lvlStages.filter((s) => isStageCompleted(s.id)).length;
  const allStagesDone = isLevelLessonsCompleted(currentLevel.id);
  const checkpointOpen =
    unitUnlocked && (allStagesDone || !activeProfile.settings.strictProgression);
  const sections = unitLessonGroups[currentLevel.id] ?? [];
  const firstStageNum = lvlStages[0]?.stageNumber ?? 1;
  const lastStageNum = lvlStages[lvlStages.length - 1]?.stageNumber ?? 1;

  const handleJumpToStage = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(jumpNumber);
    if (!Number.isInteger(num) || num < 1 || num > TOTAL_STAGES_COUNT) {
      setLockedHint(`أدخل رقم مرحلة صحيح من 1 إلى ${TOTAL_STAGES_COUNT}.`);
      return;
    }
    const target = STAGE_BY_NUMBER.get(num);
    if (!target) return;

    setSelectedUnitId(target.levelId);
    if (isStageUnlocked(target.stageNumber)) {
      playTapPop(soundEnabled);
      setLockedHint(null);
      navigate('stage-player', { levelId: target.levelId, stageId: target.id });
    } else {
      setLockedHint(
        `المرحلة ${num} في الوحدة ${target.levelId} مقفلة حالياً. أكمل المراحل السابقة أو فعّل التعلّم الحر من الإعدادات.`
      );
    }
  };

  let runningNodeIdx = 0;

  return (
    <div className="space-y-5">
      {/* Compact Unit Switcher Tabs + Quick Stage Jump */}
      <div className="space-y-3">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {LEVELS.map((lvl) => {
            const unlocked = isLevelUnlocked(lvl.id);
            const passed = activeProfile.passedLevelIds.includes(lvl.id);
            const isSelected = selectedUnitId === lvl.id;
            const unitTheme = UNIT_THEMES[lvl.id] ?? UNIT_THEMES[1];

            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => {
                  playTapPop(soundEnabled);
                  setSelectedUnitId(lvl.id);
                  setLockedHint(null);
                }}
                className={`py-2.5 px-2 rounded-2xl border-2 border-b-4 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1 transition-all active:translate-y-0.5 active:border-b-2 ${
                  isSelected
                    ? `${unitTheme.bg} ${unitTheme.borderBottom} text-white`
                    : 'bg-white dark:bg-[#1B2B33] border-[#E5E5E5] dark:border-[#37464F] text-[#3C3C3C] dark:text-[#F1F7F9] hover:bg-[#F7F7F7] dark:hover:bg-[#24363F]'
                }`}
              >
                {passed ? (
                  <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />
                ) : !unlocked ? (
                  <Lock className="w-3.5 h-3.5 shrink-0 opacity-75" />
                ) : null}
                <span>وحدة {lvl.id}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleJumpToStage} className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={TOTAL_STAGES_COUNT}
            value={jumpNumber}
            onChange={(e) => setJumpNumber(e.target.value)}
            placeholder={`انتقال سريع لأي مرحلة (1 - ${TOTAL_STAGES_COUNT})`}
            className="flex-1 min-w-0 px-4 py-2.5 rounded-2xl bg-[#F7F7F7] dark:bg-[#1B2B33] border-2 border-[#E5E5E5] dark:border-[#37464F] text-sm sm:text-base font-bold font-numeric focus:outline-none focus:border-[#1CB0F6]"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-2xl bg-[#1CB0F6] hover:bg-[#23B8FF] border-b-4 border-[#1899D6] active:translate-y-0.5 active:border-b-2 text-white text-sm font-extrabold shrink-0 min-h-[44px] transition-all"
          >
            انتقال
          </button>
        </form>
      </div>

      {lockedHint && (
        <div className="rounded-2xl bg-[#FFF4E5] dark:bg-amber-950/60 border-2 border-[#FF9600]/40 px-4 py-3 text-xs sm:text-sm font-bold text-[#9A5B00] dark:text-amber-200 flex items-center justify-between gap-3">
          <span>{lockedHint}</span>
          <button
            type="button"
            onClick={() => setLockedHint(null)}
            className="text-xs font-extrabold underline shrink-0"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Duolingo Sticky Colored Unit Banner */}
      <div
        className={`rounded-3xl ${theme.bg} border-b-4 ${theme.borderBottom} text-white p-5 flex items-center justify-between gap-4 shadow-xs`}
      >
        <div className="min-w-0 space-y-1">
          <p className="text-xs sm:text-sm font-extrabold text-white/90 font-numeric">
            الوحدة {currentLevel.id} · المراحل {firstStageNum}–{lastStageNum} · {doneCount}/{lvlStages.length}
          </p>
          <h3 className="text-xl sm:text-2xl font-black leading-snug">
            {currentLevel.titleAr.replace(/^المستوى [^:]+:\s*/, '')}
          </h3>
        </div>

        <button
          type="button"
          onClick={() => navigate('lessons', { levelId: currentLevel.id })}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-black/15 hover:bg-black/25 border-2 border-white/30 text-white text-xs sm:text-sm font-extrabold transition-colors min-h-[44px]"
        >
          <BookOpen className="w-4 h-4" />
          <span className="hidden sm:inline">دليل الوحدة</span>
        </button>
      </div>

      {/* Open Duolingo Colorful & Numbered Winding Path */}
      <div className="py-4 space-y-8">
        {sections.map((section, secIdx) => {
          const secDone = section.stages.filter((s) => isStageCompleted(s.id)).length;
          const cheerMsg = MASCOT_PATH_MESSAGES[secIdx % MASCOT_PATH_MESSAGES.length];
          const showMascotHere = secIdx > 0 && secIdx % 2 === 1;

          return (
            <div key={section.lessonId} className="space-y-6">
              {/* Clean Horizontal Lesson Section Divider */}
              <div className="flex items-center gap-3 px-2">
                <div className="h-0.5 flex-1 bg-[#E5E5E5] dark:bg-[#243137]" />
                <div className="text-center max-w-[78%]">
                  <p className="text-sm sm:text-base font-extrabold text-slate-600 dark:text-slate-300 truncate">
                    {section.titleAr}
                  </p>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 font-numeric">
                    مراحل {section.stages[0]?.stageNumber} – {section.stages[section.stages.length - 1]?.stageNumber} · {secDone}/{section.stages.length}
                  </p>
                </div>
                <div className="h-0.5 flex-1 bg-[#E5E5E5] dark:bg-[#243137]" />
              </div>

              {showMascotHere && (
                <div className="px-2">
                  <BageshMascot
                    mood="cheer"
                    messageAr={cheerMsg.ar}
                    speakPhraseEn={cheerMsg.en}
                    compact
                    voiceAccent={activeProfile.settings.voiceAccent}
                    speechRate={activeProfile.settings.speechRate}
                    soundEnabled={soundEnabled}
                  />
                </div>
              )}

              {/* Winding S-Curve Colorful Numbered Stage Nodes */}
              <div className="flex flex-col items-center gap-6 py-2">
                {section.stages.map((stage) => {
                  const idx = runningNodeIdx++;
                  const offsetX = Math.round(Math.sin(idx * 0.9) * 54);
                  const done = isStageCompleted(stage.id);
                  const unlocked = isStageUnlocked(stage.stageNumber);
                  const isCurrent =
                    activeStageTarget.type === 'stage' &&
                    activeStageTarget.stage.id === stage.id;
                  const palette = STAGE_COLOR_PALETTE[(stage.stageNumber - 1) % STAGE_COLOR_PALETTE.length];

                  return (
                    <div
                      key={stage.id}
                      style={{ transform: `translateX(${offsetX}px)` }}
                      className="relative flex flex-col items-center text-center z-10"
                    >
                      {/* Floating "ابدأ" START Bubble above active current stage */}
                      {isCurrent && (
                        <div className="animate-duo-bob mb-2 relative">
                          <div className="px-4 py-1.5 rounded-2xl bg-white dark:bg-[#1B2B33] border-2 border-[#E5E5E5] dark:border-[#37464F] shadow-sm text-sm font-black text-[#58CC02]">
                            ابدأ الآن
                          </div>
                          <div className="w-3 h-3 bg-white dark:bg-[#1B2B33] border-r-2 border-b-2 border-[#E5E5E5] dark:border-[#37464F] rotate-45 mx-auto -mt-1.5" />
                        </div>
                      )}

                      {/* Colorful Numbered Tactile 3D Node */}
                      <div className="relative flex items-center justify-center">
                        {isCurrent && (
                          <span
                            aria-hidden="true"
                            className="absolute -inset-2.5 rounded-full border-4 border-[#58CC02]/40"
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (unlocked) {
                              playTapPop(soundEnabled);
                              setLockedHint(null);
                              navigate('stage-player', {
                                levelId: stage.levelId,
                                stageId: stage.id,
                              });
                            } else if (!unitUnlocked) {
                              setLockedHint(
                                `الوحدة ${currentLevel.id} مقفلة حتى تجتاز اختبار الوحدة ${currentLevel.id - 1}.`
                              );
                            } else {
                              setLockedHint(
                                `أكمل المرحلة ${stage.stageNumber - 1} أولاً لفتح المرحلة ${stage.stageNumber} تلقائياً.`
                              );
                            }
                          }}
                          aria-label={`المرحلة ${stage.stageNumber}: ${getStageKindLabelAr(stage.kind)}`}
                          className={`relative w-[78px] h-[78px] rounded-full flex flex-col items-center justify-center transition-all active:translate-y-1 active:border-b-2 ${
                            done
                              ? 'bg-[#FFC800] text-[#5C3D00] border-b-[6px] border-[#E5A400]'
                              : isCurrent
                              ? `${palette.bg} text-white border-b-[6px] ${palette.border} ring-6 ${palette.ring}`
                              : unlocked
                              ? `${palette.bg} text-white border-b-[6px] ${palette.border}`
                              : 'bg-[#E5E5E5] dark:bg-[#37464F] text-[#7D878E] dark:text-[#8DA1AB] border-b-[6px] border-[#CECECE] dark:border-[#243137]'
                          }`}
                        >
                          {/* Prominent Stage Number ON the circular node */}
                          <span className="font-numeric font-black text-xl leading-none">
                            {stage.stageNumber}
                          </span>
                          <span className="mt-1 opacity-95">
                            {unlocked ? getSmallStageKindIcon(stage.kind) : <Lock className="w-3.5 h-3.5" />}
                          </span>

                          {/* Corner Completion Gold Star Badge */}
                          {done && (
                            <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#58CC02] border-2 border-white dark:border-[#131F24] text-white flex items-center justify-center shadow-xs">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          )}
                          {!done && isCurrent && (
                            <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-[#1B2B33] border-2 border-[#FFC800] text-[#FFC800] flex items-center justify-center shadow-xs">
                              <Star className="w-3.5 h-3.5 fill-current" />
                            </span>
                          )}
                        </button>
                      </div>

                      <p
                        className={`mt-2 text-xs sm:text-sm font-extrabold ${
                          unlocked
                            ? 'text-[#3C3C3C] dark:text-[#F1F7F9]'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {getStageKindLabelAr(stage.kind)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Unit Trophy Checkpoint Gate */}
        <div className="pt-4 pb-6 flex flex-col items-center text-center">
          <div className="h-0.5 w-full bg-[#E5E5E5] dark:bg-[#243137] mb-6" />
          <button
            type="button"
            onClick={() => {
              if (checkpointOpen) {
                playTapPop(soundEnabled);
                setLockedHint(null);
                navigate('exams', { levelId: currentLevel.id });
              } else if (!unitUnlocked) {
                setLockedHint(`اجتز الوحدة ${currentLevel.id - 1} أولاً.`);
              } else {
                setLockedHint(
                  `أكمل مراحل الوحدة ${currentLevel.id} (${doneCount}/${lvlStages.length}) لفتح بوابة اجتياز الوحدة.`
                );
              }
            }}
            className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all active:translate-y-1 active:border-b-2 ${
              unitPassed
                ? 'bg-[#FFC800] text-[#5C3D00] border-b-[6px] border-[#E5A400]'
                : checkpointOpen
                ? 'bg-[#FFC800] text-[#5C3D00] border-b-[6px] border-[#E5A400] ring-6 ring-[#FFC800]/25'
                : 'bg-[#E5E5E5] dark:bg-[#37464F] text-[#AFAFAF] border-b-[6px] border-[#CECECE] dark:border-[#243137]'
            }`}
          >
            <Trophy className="w-9 h-9" />
          </button>
          <p className="mt-3 text-base sm:text-lg font-extrabold">
            بوابة اجتياز الوحدة {currentLevel.id}
          </p>
          <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 mt-0.5">
            {unitPassed
              ? 'تم اجتياز الوحدة وفتح التالية!'
              : checkpointOpen
              ? 'جاهزة الآن — اجتز الاختبار لفتح الوحدة التالية'
              : `تُفتح عند إكمال مراحل الوحدة (${doneCount}/${lvlStages.length})`}
          </p>
        </div>
      </div>
    </div>
  );
};
