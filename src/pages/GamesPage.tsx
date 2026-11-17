import React, { useState } from 'react';
import {
  Gamepad2,
  ArrowRight,
  Trophy,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  Star,
} from 'lucide-react';
import type { DifficultyLevel } from '../types/curriculum';
import { useApp } from '../context/AppContext';
import { GamesGroupA } from '../components/games/GamesGroupA';
import { GamesGroupB } from '../components/games/GamesGroupB';
import type { GameReport } from '../components/games/gameData';

interface GameCatalogItem {
  id: number;
  titleAr: string;
  descAr: string;
  categoryAr: string;
}

const GAMES_CATALOG: GameCatalogItem[] = [
  { id: 1, titleAr: '1. اختر الإجابة الصحيحة', descAr: 'كلمة إنجليزية وأربعة معانٍ عربية لاختبار الحفظ.', categoryAr: 'مفردات' },
  { id: 2, titleAr: '2. طابق الكلمات', descAr: 'اربط بين الكلمة الإنجليزية ومعناها العربي.', categoryAr: 'مفردات' },
  { id: 3, titleAr: '3. رتّب الحروف', descAr: 'كوّن الكلمة الإنجليزية الصحيحة من حروف مبعثرة.', categoryAr: 'إملاء' },
  { id: 4, titleAr: '4. رتّب الجملة', descAr: 'رتّب الكلمات المبعثرة لبناء جملة إنجليزية سليمة.', categoryAr: 'تراكيب' },
  { id: 5, titleAr: '5. استمع واختر', descAr: 'استمع للنطق الإنجليزي واختر الكلمة المطابقة.', categoryAr: 'استماع' },
  { id: 6, titleAr: '6. أكمل الفراغ', descAr: 'اختر الكلمة المناسبة لإكمال الجملة الناقصة.', categoryAr: 'قواعد' },
  { id: 7, titleAr: '7. اكتشف الخطأ', descAr: 'حدد الجملة المصححة واكتشف الخطأ النحوي.', categoryAr: 'قواعد' },
  { id: 8, titleAr: '8. صح أم خطأ', descAr: 'اختبر معلوماتك السريعة في قواعد النطق والملزمة.', categoryAr: 'معرفة' },
  { id: 9, titleAr: '9. تحدي الذاكرة', descAr: 'اقلب البطاقات واطبق الأزواج المتوافقة.', categoryAr: 'ذاكرة' },
  { id: 10, titleAr: '10. خمن الصورة', descAr: 'شاهد الرسم التوضيحي واختر الكلمة الإنجليزية.', categoryAr: 'مرئي' },
  { id: 11, titleAr: '11. تحدي السرعة', descAr: 'أجب عن أكبر عدد من الكلمات قبل انتهاء العداد.', categoryAr: 'سرعة' },
  { id: 12, titleAr: '12. أكمل المحادثة', descAr: 'اختر الرد المناسب في حوار يومي واقعي.', categoryAr: 'محادثة' },
  { id: 13, titleAr: '13. تحدي النطق', descAr: 'انطق الكلمة بالميكروفون وطابق نطقك.', categoryAr: 'نطق' },
  { id: 14, titleAr: '14. تحدي الجمل', descAr: 'اكتب جملة إنجليزية تناسب الموقف واحصل على تقييم.', categoryAr: 'كتابة' },
  { id: 15, titleAr: '15. تحدي الاستماع', descAr: 'استمع لجملة كاملة واختر معناها الصحيح.', categoryAr: 'استماع' },
];

export const GamesPage: React.FC = () => {
  const { recordGameWin, navigate } = useApp();
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
  const [activeGameId, setActiveGameId] = useState<number | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [report, setReport] = useState<GameReport | null>(null);

  const handleGameFinish = (res: GameReport) => {
    setReport(res);
    if (res.correctCount >= res.wrongCount && res.correctCount > 0) {
      recordGameWin(res.xpEarned, 1);
    } else {
      recordGameWin(Math.max(10, Math.round(res.xpEarned / 2)), 0);
    }
  };

  if (activeGameId !== null) {
    const gameMeta = GAMES_CATALOG.find((g) => g.id === activeGameId)!;
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setActiveGameId(null);
              setReport(null);
            }}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowRight className="w-4 h-4" />
            العودة لقائمة الألعاب
          </button>
          <span className="text-xs font-bold text-teal-700 dark:text-teal-400">
            المستوى: {difficulty === 'easy' ? 'سهل' : difficulty === 'medium' ? 'متوسط' : 'متقدم'}
          </span>
        </div>

        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {gameMeta.titleAr}
          </h1>

          {report ? (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-[#F8F7F4] dark:bg-slate-800 text-center space-y-2">
                <Trophy className="w-12 h-12 text-amber-500 mx-auto" />
                <h2 className="text-2xl font-extrabold">انتهت الجولة!</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  تم حفظ نتيجتك وأضيفت الأخطاء تلقائياً إلى قسم «راجع أخطاءك».
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                  <p className="font-numeric text-xl font-extrabold">{report.correctCount}</p>
                  <p className="text-xs text-slate-500">إجابات صحيحة</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <XCircle className="w-5 h-5 text-rose-600 mx-auto mb-1" />
                  <p className="font-numeric text-xl font-extrabold">{report.wrongCount}</p>
                  <p className="text-xs text-slate-500">أخطاء</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Clock className="w-5 h-5 text-sky-600 mx-auto mb-1" />
                  <p className="font-numeric text-xl font-extrabold">{report.durationSec} ث</p>
                  <p className="text-xs text-slate-500">الوقت المستغرق</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Star className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <p className="font-numeric text-xl font-extrabold">+{report.xpEarned}</p>
                  <p className="text-xs text-slate-500">نقاط مكتسبة</p>
                </div>
              </div>

              {report.mistakes.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400">
                    الكلمات التي تحتاج مراجعة:
                  </h3>
                  <div className="space-y-1.5">
                    {report.mistakes.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 flex items-center justify-between text-sm"
                      >
                        <span className="font-semibold">{m.ar}</span>
                        <span dir="ltr" className="font-english font-bold">
                          {m.en}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setReport(null);
                    setSessionKey((k) => k + 1);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  العب مرة أخرى
                </button>
                {report.mistakes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => navigate('review')}
                    className="px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-sm"
                  >
                    راجع أخطاءك الآن
                  </button>
                )}
              </div>
            </div>
          ) : activeGameId <= 8 ? (
            <GamesGroupA
              key={`${activeGameId}-${difficulty}-${sessionKey}`}
              gameId={activeGameId}
              difficulty={difficulty}
              onFinish={handleGameFinish}
            />
          ) : (
            <GamesGroupB
              key={`${activeGameId}-${difficulty}-${sessionKey}`}
              gameId={activeGameId}
              difficulty={difficulty}
              onFinish={handleGameFinish}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Gamepad2 className="w-7 h-7 text-amber-600" />
            مركز الألعاب التعليمية (15 لعبة تفاعلية)
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            اختر مستوى الصعوبة ثم ابدأ أي لعبة. جميع الألعاب مرتبطة بمفردات وقواعد الملزمة وتضيف النقاط وتُسجل أخطاءك للمراجعة.
          </p>
        </div>

        {/* Difficulty Toggle */}
        <div className="inline-flex rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 self-start">
          {[
            { id: 'easy' as const, label: 'سهل' },
            { id: 'medium' as const, label: 'متوسط' },
            { id: 'hard' as const, label: 'متقدم' },
          ].map((lvl) => (
            <button
              key={lvl.id}
              type="button"
              onClick={() => setDifficulty(lvl.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                difficulty === lvl.id
                  ? 'bg-teal-700 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lvl.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {GAMES_CATALOG.map((game) => (
          <button
            key={game.id}
            type="button"
            onClick={() => {
              setReport(null);
              setActiveGameId(game.id);
              setSessionKey((k) => k + 1);
            }}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-600 text-right transition-all flex flex-col justify-between gap-3 shadow-2xs hover:shadow-sm"
          >
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                {game.categoryAr}
              </span>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{game.titleAr}</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{game.descAr}</p>
            </div>
            <span className="text-xs font-bold text-teal-700 dark:text-teal-400 pt-2 border-t border-slate-100 dark:border-slate-800 block">
              ابدأ اللعب ←
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
