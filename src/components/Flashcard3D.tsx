import React, { useState } from 'react';
import { Volume2, RotateCw, Star, CheckCircle2, Gauge } from 'lucide-react';
import type { VocabItem } from '../types/curriculum';
import { useApp } from '../context/AppContext';
import { speakEnglish, speakSlowEnglish } from '../utils/speech';
import { VocabIllustration } from './VocabIllustration';

interface Flashcard3DProps {
  item: VocabItem;
}

export const Flashcard3D: React.FC<Flashcard3DProps> = ({ item }) => {
  const [flipped, setFlipped] = useState(false);
  const { activeProfile, toggleFavoriteWord, toggleLearnedWord } = useApp();

  const isFav = activeProfile?.favoriteWordIds.includes(item.id) ?? false;
  const isLearned = activeProfile?.learnedWordIds.includes(item.id) ?? false;
  const voiceAccent = activeProfile?.settings.voiceAccent ?? 'en-US';
  const speechRate = activeProfile?.settings.speechRate ?? 0.92;

  return (
    <div className="perspective-1000 h-80 w-full">
      <div
        onClick={() => setFlipped((f) => !f)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setFlipped((f) => !f);
          }
        }}
        className={`relative w-full h-full preserve-3d cursor-pointer transition-transform duration-500 ${
          flipped ? 'rotate-y-180' : ''
        }`}
        aria-label={`بطاقة تعليمية للكلمة ${item.en} — اضغط للقلب`}
      >
        {/* Front Face (English) */}
        <div className="absolute inset-0 backface-hidden rounded-3xl border border-[#E7E2D8] dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {item.category}
            </span>
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => toggleFavoriteWord(item.id)}
                className={`p-2 rounded-xl transition-colors ${
                  isFav
                    ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                    : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title="إضافة للمفضلة"
                aria-label="إضافة للمفضلة"
              >
                <Star className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} />
              </button>
              <button
                type="button"
                onClick={() => toggleLearnedWord(item.id)}
                className={`p-2 rounded-xl transition-colors ${
                  isLearned
                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                    : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title={isLearned ? 'تم حفظ الكلمة' : 'تحديد كمحفوظة'}
                aria-label="تحديد كمحفوظة"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center text-center gap-3 my-auto">
            {item.illustrationKey && (
              <VocabIllustration illustrationKey={item.illustrationKey} size={62} />
            )}
            <p
              dir="ltr"
              className="font-english font-bold text-2xl sm:text-3xl text-slate-900 dark:text-white leading-snug"
            >
              {item.en}
            </p>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <RotateCw className="w-3.5 h-3.5" />
              اضغط لقلب البطاقة ورؤية المعنى والنطق
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/60" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => speakEnglish(item.en, { rate: speechRate, lang: voiceAccent })}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-[#0F5E59] hover:bg-[#0B4A46] text-white text-sm font-bold transition-colors"
            >
              <Volume2 className="w-4 h-4" />
              استمع للنطق
            </button>
            <button
              type="button"
              onClick={() => speakSlowEnglish(item.en, voiceAccent)}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-2xl border border-[#E7E2D8] dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold transition-colors"
              title="نطق بطيء"
            >
              <Gauge className="w-4 h-4" />
              بطيء
            </button>
          </div>
        </div>

        {/* Back Face (Arabic Meaning + Phonetics) */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-3xl border border-teal-200 dark:border-teal-800 bg-[#F2FBF9] dark:bg-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-sm text-[#0F5E59] dark:text-teal-300 font-bold">
            <span>المعنى وطريقة النطق</span>
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs">
              <RotateCw className="w-3.5 h-3.5" />
              اقلب البطاقة
            </span>
          </div>

          <div className="text-center space-y-2.5 my-auto">
            <p className="text-2xl font-bold text-slate-900 dark:text-white leading-snug">
              {item.ar}
            </p>
            <p className="text-base font-bold text-[#0F5E59] dark:text-teal-300">
              النطق التقريبي: {item.pronunciationAr}
            </p>
            {item.exampleEn && (
              <div className="pt-2 border-t border-teal-200/70 dark:border-slate-700 space-y-1">
                <p dir="ltr" className="font-english text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {item.exampleEn}
                </p>
                {item.exampleAr && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">{item.exampleAr}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => speakEnglish(item.exampleEn || item.en, { rate: speechRate, lang: voiceAccent })}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-[#0F5E59] hover:bg-[#0B4A46] text-white text-sm font-bold transition-colors"
            >
              <Volume2 className="w-4 h-4" />
              أعد سماع النطق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
