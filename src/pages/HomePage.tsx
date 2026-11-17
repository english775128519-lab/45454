import React from 'react';
import {
  Play,
  Gamepad2,
  Bot,
  Search,
  RotateCcw,
  Trophy,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LEVELS } from '../data/curriculum';
import { TOTAL_STAGES_COUNT } from '../data/stages400';
import { LearningPath } from '../components/LearningPath';
import { BageshMascot } from '../components/BageshMascot';
import { playTapPop } from '../utils/sfx';

export const HomePage: React.FC = () => {
  const {
    activeProfile,
    navigate,
    completionPercentage,
    completedStagesCount,
    getCurrentActiveStage,
  } = useApp();

  if (!activeProfile) return null;

  const soundEnabled = activeProfile.settings.soundEffects ?? true;
  const activeStage = getCurrentActiveStage();
  const activeLevelId =
    activeStage.type === 'stage'
      ? activeStage.stage.levelId
      : activeStage.type === 'checkpoint'
      ? activeStage.levelId
      : 6;
  const currentLevel = LEVELS.find((l) => l.id === activeLevelId) ?? LEVELS[0];

  const handlePrimaryStart = () => {
    playTapPop(soundEnabled);
    if (activeStage.type === 'stage') {
      navigate('stage-player', {
        levelId: activeStage.stage.levelId,
        stageId: activeStage.stage.id,
      });
    } else if (activeStage.type === 'checkpoint') {
      navigate('exams', { levelId: activeStage.levelId });
    } else {
      navigate('levels');
    }
  };

  const mascotMessage =
    activeStage.type === 'checkpoint'
      ? `رائع يا ${activeProfile.name}! جاهز لاختبار اجتياز الوحدة ${activeStage.levelId}؟`
      : activeStage.type === 'stage'
      ? `هيا يا ${activeProfile.name}! المرحلة ${activeStage.stage.stageNumber} جاهزة — اكسب +25 XP الآن!`
      : `إنجاز أسطوري يا ${activeProfile.name}! أتممت جميع المراحل الـ 400!`;

  return (
    <div className="space-y-6">
      {/* Motivating Wassem Bagesh Greeting + Dominant Green Start CTA */}
      <section className="rounded-3xl bg-[#F7F7F7] dark:bg-[#1B2B33] border-2 border-[#E5E5E5] dark:border-[#37464F] p-5 space-y-4">
        <BageshMascot
          mood={activeProfile.streakDays >= 3 ? 'streak' : 'greeting'}
          messageAr={mascotMessage}
          speakPhraseEn={`Welcome ${activeProfile.name}! Ready for stage ${
            activeStage.type === 'stage' ? activeStage.stage.stageNumber : ''
          }?`}
          streakDays={activeProfile.streakDays}
          voiceAccent={activeProfile.settings.voiceAccent}
          speechRate={activeProfile.settings.speechRate}
          soundEnabled={soundEnabled}
        />

        <div className="flex items-center justify-between text-xs sm:text-sm font-extrabold text-slate-600 dark:text-slate-300 px-1">
          <span className="truncate">{currentLevel.titleAr}</span>
          <span className="font-numeric shrink-0 text-[#58CC02]">
            {completedStagesCount}/{TOTAL_STAGES_COUNT} ({completionPercentage}%)
          </span>
        </div>

        <button
          type="button"
          onClick={handlePrimaryStart}
          className="w-full py-3.5 px-5 rounded-2xl bg-[#58CC02] hover:bg-[#61E002] border-b-4 border-[#46A302] active:translate-y-0.5 active:border-b-2 text-white font-black text-base sm:text-lg flex items-center justify-center gap-2.5 transition-all"
        >
          {activeStage.type === 'checkpoint' ? (
            <>
              <Trophy className="w-5 h-5" />
              <span>اجتز اختبار الوحدة {activeStage.levelId} لفتح التالية</span>
            </>
          ) : activeStage.type === 'stage' ? (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span className="truncate">
                ابدأ المرحلة {activeStage.stage.stageNumber}: {activeStage.stage.titleAr}
              </span>
            </>
          ) : (
            <>
              <BookOpen className="w-5 h-5" />
              <span>أتممت الـ 400 مرحلة! استعرض المسار</span>
            </>
          )}
        </button>
      </section>

      {/* Open Duolingo Colorful & Numbered Winding Path */}
      <LearningPath />

      {/* Mobile Compact Practice Shortcuts */}
      <section className="lg:hidden space-y-3 pt-2">
        <h3 className="text-base font-extrabold text-slate-600 dark:text-slate-300 px-1">
          أدوات التدريب السريع
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              id: 'games' as const,
              label: 'الألعاب',
              icon: <Gamepad2 className="w-5 h-5 text-[#FF9600]" />,
            },
            {
              id: 'ai-tutor' as const,
              label: 'المعلم الذكي',
              icon: <Bot className="w-5 h-5 text-[#1CB0F6]" />,
            },
            {
              id: 'dictionary' as const,
              label: 'القاموس',
              icon: <Search className="w-5 h-5 text-[#58CC02]" />,
            },
            {
              id: 'review' as const,
              label: `أخطائي (${activeProfile.mistakes.length})`,
              icon: <RotateCcw className="w-5 h-5 text-[#FF4B4B]" />,
            },
          ].map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => navigate(tool.id)}
              className="p-4 rounded-2xl bg-white dark:bg-[#1B2B33] border-2 border-b-4 border-[#E5E5E5] dark:border-[#37464F] hover:border-[#1CB0F6] active:translate-y-0.5 active:border-b-2 transition-all flex items-center gap-3 text-right"
            >
              <div className="p-2 rounded-xl bg-[#F7F7F7] dark:bg-[#131F24] shrink-0">
                {tool.icon}
              </div>
              <span className="font-extrabold text-sm truncate">{tool.label}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
