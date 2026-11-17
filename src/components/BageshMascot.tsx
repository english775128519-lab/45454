import React, { useState } from 'react';
import { Flame, Sparkles, Trophy, Volume2 } from 'lucide-react';
import { speakEnglish } from '../utils/speech';
import { playTapPop } from '../utils/sfx';

export type MascotMood = 'greeting' | 'cheer' | 'streak' | 'correct' | 'encourage' | 'trophy';

const CHEER_MESSAGES: { ar: string; en: string }[] = [
  { ar: 'أهلاً بك في وسيم باقش! جاهز لخطوة جديدة اليوم؟', en: 'Welcome! Ready to learn today?' },
  { ar: 'كل مرحلة تنجزها تقربك خطوة من الطلاقة!', en: 'Great job! Keep going!' },
  { ar: 'استمر! الممارسة اليومية تصنع الفارق الكبير.', en: 'Practice every day! You can do it!' },
  { ar: 'الخطأ ليس مشكلة، هو طريقك لتتذكر الكلمة للأبد!', en: 'Mistakes help you learn faster!' },
  { ar: 'بطل! اضغط «ابدأ» واكسب نقاطاً جديدة الآن!', en: 'Let us start and earn more points!' },
];

interface BageshMascotProps {
  mood?: MascotMood;
  messageAr?: string;
  speakPhraseEn?: string;
  streakDays?: number;
  compact?: boolean;
  voiceAccent?: 'en-US' | 'en-GB';
  speechRate?: number;
  soundEnabled?: boolean;
}

export const BageshMascot: React.FC<BageshMascotProps> = ({
  mood = 'greeting',
  messageAr,
  speakPhraseEn,
  streakDays,
  compact = false,
  voiceAccent = 'en-US',
  speechRate = 0.92,
  soundEnabled = true,
}) => {
  const [cheerIdx, setCheerIdx] = useState(0);

  const activeCheer = CHEER_MESSAGES[cheerIdx % CHEER_MESSAGES.length];
  const displayedAr = messageAr ?? activeCheer.ar;
  const displayedEn = speakPhraseEn ?? activeCheer.en;

  const handleInteract = () => {
    playTapPop(soundEnabled);
    setCheerIdx((i) => (i + 1) % CHEER_MESSAGES.length);
    if (displayedEn) {
      speakEnglish(displayedEn, { rate: speechRate, lang: voiceAccent });
    }
  };

  const ringColor =
    mood === 'correct'
      ? 'ring-[#58CC02]/35 border-[#58CC02]'
      : mood === 'trophy'
      ? 'ring-[#FFC800]/45 border-[#FFC800]'
      : mood === 'streak'
      ? 'ring-[#FF9600]/35 border-[#FF9600]'
      : mood === 'encourage'
      ? 'ring-[#1CB0F6]/35 border-[#1CB0F6]'
      : 'ring-[#1D6FD1]/30 border-[#1D6FD1]';

  return (
    <div className={`flex items-center gap-3.5 ${compact ? '' : 'w-full'}`}>
      <button
        type="button"
        onClick={handleInteract}
        className={`relative shrink-0 rounded-full p-0.5 border-2 ring-4 transition-transform active:scale-95 ${ringColor} ${
          compact ? 'w-14 h-14' : 'w-16 h-16 sm:w-18 sm:h-18'
        }`}
        title="اضغط للاستماع لتشجيع وسيم باقش"
        aria-label="تحفيز وسيم باقش"
      >
        <img
          src="/app-icon.png"
          alt="شعار وسيم باقش"
          className="w-full h-full rounded-full object-cover"
        />
        {mood === 'streak' && (
          <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#FF9600] text-white flex items-center justify-center shadow-xs">
            <Flame className="w-3.5 h-3.5 fill-current" />
          </span>
        )}
        {mood === 'trophy' && (
          <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#FFC800] text-[#5C3D00] flex items-center justify-center shadow-xs">
            <Trophy className="w-3.5 h-3.5" />
          </span>
        )}
        {(mood === 'greeting' || mood === 'cheer') && (
          <span className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-[#58CC02] text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      <div className="flex-1 min-w-0 rounded-2xl border-2 border-[#E5E5E5] dark:border-[#37464F] bg-white dark:bg-[#1B2B33] px-4 py-3 relative">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[#1D6FD1] dark:text-[#60A5FA]">
                وسيم باقش يحفّزك
              </span>
              {typeof streakDays === 'number' && streakDays > 0 && (
                <span className="text-xs font-extrabold text-[#FF9600] font-numeric">
                  · {streakDays} يوم
                </span>
              )}
            </div>
            <p className="text-sm sm:text-base font-extrabold text-[#3C3C3C] dark:text-[#F1F7F9] leading-snug">
              {displayedAr}
            </p>
          </div>
          <button
            type="button"
            onClick={handleInteract}
            className="p-2 rounded-xl bg-[#DDF4FF] dark:bg-sky-950/60 text-[#1899D6] dark:text-sky-300 shrink-0 min-w-[38px] min-h-[38px] flex items-center justify-center hover:opacity-90"
            aria-label="استمع للتشجيع"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
