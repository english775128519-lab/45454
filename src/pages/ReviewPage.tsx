import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Volume2, CheckCircle2, ArrowLeft, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ALL_VOCAB_ITEMS, getLessonById } from '../data/curriculum';
import { speakEnglish } from '../utils/speech';
import { shuffleArray } from '../components/games/gameData';

export const ReviewPage: React.FC = () => {
  const { activeProfile, resolveMistake, navigate } = useApp();
  const [drillActive, setDrillActive] = useState(false);
  const [drillIdx, setDrillIdx] = useState(0);
  const [drillFeedback, setDrillFeedback] = useState<{
    isCorrect: boolean;
    chosen: string;
    mistakeId: string;
    message: string;
  } | null>(null);

  const sortedMistakes = useMemo(() => {
    if (!activeProfile) return [];
    return [...activeProfile.mistakes].sort((a, b) => b.mistakeCount - a.mistakeCount);
  }, [activeProfile]);

  const currentDrillItem = sortedMistakes[drillIdx];

  const drillOptions = useMemo(() => {
    if (!currentDrillItem) return [];
    const others = shuffleArray(
      ALL_VOCAB_ITEMS.filter((v) => v.ar !== currentDrillItem.ar)
    )
      .slice(0, 3)
      .map((o) => o.ar);
    return shuffleArray([currentDrillItem.ar, ...others]);
  }, [currentDrillItem]);

  useEffect(() => {
    if (!drillFeedback) return;
    const delay = drillFeedback.isCorrect ? 700 : 1150;
    const timer = window.setTimeout(() => {
      if (drillFeedback.isCorrect) {
        resolveMistake(drillFeedback.mistakeId);
        setDrillIdx(0);
      } else {
        setDrillIdx((prev) =>
          sortedMistakes.length > 1 ? (prev + 1) % sortedMistakes.length : 0
        );
      }
      setDrillFeedback(null);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [drillFeedback, resolveMistake, sortedMistakes.length]);

  if (!activeProfile) return null;

  const voiceAccent = activeProfile.settings.voiceAccent;
  const speechRate = activeProfile.settings.speechRate;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <RotateCcw className="w-7 h-7 text-orange-600" />
            راجع أخطاءك (المراجعة الذكية)
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            يجمع هذا القسم الكلمات والقواعد التي أخطأت فيها أثناء الدروس والألعاب والاختبارات، ويرتبها حسب الأكثر تكراراً.
          </p>
        </div>

        {sortedMistakes.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setDrillActive((d) => !d);
              setDrillIdx(0);
              setDrillFeedback(null);
            }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm"
          >
            <Sparkles className="w-4 h-4" />
            {drillActive ? 'عرض القائمة الكاملة' : 'بدء تمرين ذكي على الأخطاء'}
          </button>
        )}
      </div>

      {sortedMistakes.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h2 className="text-xl font-extrabold">سجلك نظيف من الأخطاء حالياً!</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            كلما واجهت كلمة صعبة أو أخطأت في لعبة أو اختبار، ستظهر هنا تلقائياً لتتدرب عليها حتى تتقنها.
          </p>
          <button
            type="button"
            onClick={() => navigate('games')}
            className="px-5 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-bold"
          >
            الانتقال للألعاب التعليمية
          </button>
        </div>
      ) : drillActive && currentDrillItem ? (
        <section className="max-w-2xl mx-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>
              التدريب <span className="font-numeric font-bold">{drillIdx + 1}</span> /{' '}
              <span className="font-numeric">{sortedMistakes.length}</span>
            </span>
            <span className="font-numeric text-rose-600 font-bold">
              عدد الأخطاء السابقة: {currentDrillItem.mistakeCount}
            </span>
          </div>

          <div className="p-6 rounded-2xl bg-[#F8F7F4] dark:bg-slate-800 text-center space-y-3">
            <p dir="ltr" className="font-english text-2xl sm:text-3xl font-extrabold">
              {currentDrillItem.en}
            </p>
            <button
              type="button"
              onClick={() =>
                speakEnglish(currentDrillItem.en, { rate: speechRate, lang: voiceAccent })
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold"
            >
              <Volume2 className="w-4 h-4" />
              استمع للنطق
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {drillOptions.map((opt) => {
              const isRight = opt === currentDrillItem.ar;
              const isChosen = drillFeedback?.chosen === opt;
              let btnStyle =
                'border-slate-200 dark:border-slate-700 hover:border-teal-600 bg-white dark:bg-slate-800';
              if (drillFeedback) {
                if (isRight) {
                  btnStyle =
                    'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200';
                } else if (isChosen) {
                  btnStyle =
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
                        mistakeId: currentDrillItem.id,
                        message: 'ممتاز! تم إتقان هذه النقطة وإزالتها من قائمة الأخطاء (+10 XP).',
                      });
                    } else {
                      setDrillFeedback({
                        isCorrect: false,
                        chosen: opt,
                        mistakeId: currentDrillItem.id,
                        message: `ليست هذه — الإجابة الصحيحة: ${currentDrillItem.ar}`,
                      });
                    }
                  }}
                  className={`p-4 rounded-xl border text-right font-bold text-base transition-colors ${btnStyle}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {drillFeedback && (
            <p
              className={`text-sm font-bold text-center ${
                drillFeedback.isCorrect
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {drillFeedback.message}
            </p>
          )}
        </section>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedMistakes.map((m) => {
            const lesson = getLessonById(m.lessonId);
            return (
              <div
                key={m.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      المصدر: {m.source === 'game' ? 'لعبة' : m.source === 'exam' ? 'اختبار' : m.source === 'conversation' ? 'محادثة' : 'درس'}
                    </span>
                    <span className="font-numeric font-bold text-rose-600">
                      تكرر {m.mistakeCount} مرة
                    </span>
                  </div>
                  <p dir="ltr" className="font-english text-lg font-extrabold text-right">
                    {m.en}
                  </p>
                  <p className="text-sm font-bold text-teal-700 dark:text-teal-400">{m.ar}</p>
                  {m.noteAr && <p className="text-xs text-slate-500">{m.noteAr}</p>}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => speakEnglish(m.en, { rate: speechRate, lang: voiceAccent })}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-teal-700" />
                      نطق
                    </button>
                    {lesson && (
                      <button
                        type="button"
                        onClick={() =>
                          navigate('lesson-detail', { levelId: lesson.levelId, lessonId: lesson.id })
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                      >
                        راجع الدرس
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => resolveMistake(m.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    أتقنتها
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
