import React, { useRef, useState } from 'react';
import {
  Award,
  Trophy,
  Star,
  Flame,
  TrendingUp,
  BookOpen,
  Gamepad2,
  MessageCircle,
  Sparkles,
  Lock,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Download,
  Upload,
  LogOut,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ACHIEVEMENT_BADGES, BOOK_LESSONS, LEVELS } from '../data/curriculum';
import { STAGES_BY_LEVEL, TOTAL_STAGES_COUNT } from '../data/stages400';

/* ============================================================================
   PAGE 14: ACHIEVEMENTS PAGE (صفحة الإنجازات والأوسمة)
   ============================================================================ */
export const AchievementsPage: React.FC = () => {
  const { activeProfile } = useApp();
  if (!activeProfile) return null;

  const badgeIcon = (name: string) => {
    switch (name) {
      case 'Trophy':
        return <Trophy className="w-6 h-6" />;
      case 'BookOpen':
        return <BookOpen className="w-6 h-6" />;
      case 'Gamepad2':
        return <Gamepad2 className="w-6 h-6" />;
      case 'Flame':
        return <Flame className="w-6 h-6" />;
      case 'MessageCircle':
        return <MessageCircle className="w-6 h-6" />;
      case 'Sparkles':
        return <Sparkles className="w-6 h-6" />;
      default:
        return <Award className="w-6 h-6" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="w-7 h-7 text-purple-600" />
          إنجازاتي والأوسمة
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          كل خطوة في الدروس والألعاب والاختبارات تقرّبك من فتح الأوسمة وكسب النجوم والنقاط.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <Star className="w-8 h-8 text-amber-500 shrink-0" />
          <div>
            <p className="font-numeric text-2xl font-extrabold">{activeProfile.xp}</p>
            <p className="text-xs text-slate-500">إجمالي النقاط (XP)</p>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <Trophy className="w-8 h-8 text-teal-700 shrink-0" />
          <div>
            <p className="font-numeric text-2xl font-extrabold">{activeProfile.stars}</p>
            <p className="text-xs text-slate-500">عدد النجوم</p>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <Flame className="w-8 h-8 text-orange-500 shrink-0" />
          <div>
            <p className="font-numeric text-2xl font-extrabold">{activeProfile.streakDays}</p>
            <p className="text-xs text-slate-500">سلسلة الاستمرارية (أيام)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ACHIEVEMENT_BADGES.map((badge) => {
          const unlocked = activeProfile.unlockedBadgeIds.includes(badge.id);
          return (
            <div
              key={badge.id}
              className={`rounded-2xl border p-5 space-y-3 ${
                unlocked
                  ? 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700 shadow-2xs'
                  : 'bg-slate-100/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`p-3 rounded-xl ${
                    unlocked
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {badgeIcon(badge.iconName)}
                </div>
                {unlocked ? (
                  <span className="font-numeric text-xs font-extrabold text-emerald-600">
                    مفتوح · +{badge.xpReward} XP
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" />
                    مغلق
                  </span>
                )}
              </div>
              <div>
                <h2 className="font-extrabold text-base">{badge.titleAr}</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{badge.descriptionAr}</p>
              </div>
              <p className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                الشرط: {badge.conditionLabelAr}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================================
   PAGE 15: STUDENT PROGRESS PAGE (صفحة تقدم الطالب)
   ============================================================================ */
export const ProgressPage: React.FC = () => {
  const { activeProfile, completionPercentage, completedStagesCount, isStageCompleted, navigate } = useApp();
  if (!activeProfile) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-7 h-7 text-teal-700" />
          تقرير تقدم الطالب: {activeProfile.name}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          متابعة دقيقة لنسبة إكمال الـ 400 مرحلة، الكلمات المتقَنة، الألعاب المكتملة، ونتائج الاختبارات.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">نسبة إكمال المنهج</p>
          <p className="font-numeric text-3xl font-extrabold text-teal-700 dark:text-teal-400 mt-1">
            {completionPercentage}%
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">المراحل المكتملة</p>
          <p className="font-numeric text-3xl font-extrabold mt-1">
            {completedStagesCount} / {TOTAL_STAGES_COUNT}
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">الدروس الكاملة</p>
          <p className="font-numeric text-3xl font-extrabold mt-1">
            {activeProfile.completedLessonIds.length} / {BOOK_LESSONS.length}
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">جولات الألعاب الناجحة</p>
          <p className="font-numeric text-3xl font-extrabold mt-1">
            {activeProfile.gamesWonCount}
          </p>
        </div>
      </div>

      {/* Per-Level Breakdown */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <h2 className="text-lg font-extrabold">التقدم حسب كل وحدة (400 مرحلة)</h2>
        <div className="space-y-4">
          {LEVELS.map((lvl) => {
            const stages = STAGES_BY_LEVEL[lvl.id] ?? [];
            const done = stages.filter((s) => isStageCompleted(s.id)).length;
            const pct = stages.length > 0 ? Math.round((done / stages.length) * 100) : 0;
            return (
              <div key={lvl.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold">{lvl.titleAr}</span>
                  <span className="font-numeric text-xs font-bold text-slate-600 dark:text-slate-300">
                    {done}/{stages.length} مرحلة ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-teal-700 dark:bg-teal-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => navigate('levels')}
          className="px-5 py-3 rounded-xl bg-teal-700 text-white font-bold text-sm"
        >
          متابعة الدروس
        </button>
        <button
          type="button"
          onClick={() => navigate('review')}
          className="px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-sm"
        >
          مراجعة الأخطاء ({activeProfile.mistakes.length})
        </button>
      </div>
    </div>
  );
};

/* ============================================================================
   PAGE 16: SETTINGS & BACKUP PAGE (صفحة الإعدادات)
   ============================================================================ */
export const SettingsPage: React.FC = () => {
  const {
    activeProfile,
    updateSettings,
    exportProgressJson,
    importProgressJson,
    resetActiveProgress,
    logoutToAuth,
  } = useApp();

  const fileRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  if (!activeProfile) return null;

  const handleDownloadBackup = () => {
    const json = exportProgressJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `english-master-${activeProfile.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg('تم تنزيل نسخة احتياطية من تقدمك بصيغة JSON.');
  };

  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = importProgressJson(typeof reader.result === 'string' ? reader.result : '');
      setStatusMsg(res.messageAr);
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <SettingsIcon className="w-7 h-7 text-slate-600 dark:text-slate-300" />
          الإعدادات والملف الشخصي
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          تخصيص المظهر، سرعة النطق، نظام التدرج، والنسخ الاحتياطي لتقدم الطالب.
        </p>
      </div>

      {/* Appearance & Audio */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
        <h2 className="text-lg font-extrabold">المظهر والصوتيات</h2>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-base">وضع الألوان (النهاري / الليلي)</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">مريح للعين أثناء المذاكرة الليلية</p>
          </div>
          <button
            type="button"
            onClick={() =>
              updateSettings({
                theme: activeProfile.settings.theme === 'light' ? 'dark' : 'light',
              })
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-sm"
          >
            {activeProfile.settings.theme === 'light' ? (
              <>
                <Moon className="w-4 h-4" />
                تفعيل الوضع الليلي
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                تفعيل الوضع النهاري
              </>
            )}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            <p className="font-bold text-base">حجم الخط في التطبيق</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">اختر الحجم الأنسب لقراءة واضحة ومريحة</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'normal' as const, label: 'عادي' },
              { id: 'large' as const, label: 'كبير (واضح)' },
              { id: 'xlarge' as const, label: 'كبير جداً' },
            ].map((opt) => {
              const currentFontSize = activeProfile.settings.fontSize ?? 'large';
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateSettings({ fontSize: opt.id })}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold ${
                    currentFontSize === opt.id
                      ? 'bg-teal-700 text-white'
                      : 'border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            <p className="font-bold text-sm">اللهجة الصوتية</p>
            <p className="text-xs text-slate-500">اختر اللكنة الإنجليزية المفضلة في النطق</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateSettings({ voiceAccent: 'en-US' })}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold ${
                activeProfile.settings.voiceAccent === 'en-US'
                  ? 'bg-teal-700 text-white'
                  : 'border border-slate-300 dark:border-slate-700'
              }`}
            >
              الأمريكية (US)
            </button>
            <button
              type="button"
              onClick={() => updateSettings({ voiceAccent: 'en-GB' })}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold ${
                activeProfile.settings.voiceAccent === 'en-GB'
                  ? 'bg-teal-700 text-white'
                  : 'border border-slate-300 dark:border-slate-700'
              }`}
            >
              البريطانية (UK)
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-bold text-sm">سرعة القراءة الافتراضية</p>
            <span className="font-numeric text-sm font-bold text-teal-700">
              {activeProfile.settings.speechRate.toFixed(2)}x
            </span>
          </div>
          <input
            type="range"
            min="0.6"
            max="1.2"
            step="0.05"
            value={activeProfile.settings.speechRate}
            onChange={(e) => updateSettings({ speechRate: Number(e.target.value) })}
            className="w-full accent-teal-700"
          />
        </div>

        <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            <p className="font-bold text-sm">المؤثرات الصوتية التحفيزية</p>
            <p className="text-xs text-slate-500">
              نغمات النجاح والتشجيع أثناء حل المراحل (تعمل بدون نت)
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              updateSettings({ soundEffects: !(activeProfile.settings.soundEffects ?? true) })
            }
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shrink-0 ${
              (activeProfile.settings.soundEffects ?? true)
                ? 'bg-[#58CC02] text-white'
                : 'border border-slate-300 dark:border-slate-700'
            }`}
          >
            {(activeProfile.settings.soundEffects ?? true) ? 'مفعلة' : 'مكتومة'}
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            <p className="font-bold text-sm">نظام التدرج المتسلسل (400 مرحلة)</p>
            <p className="text-xs text-slate-500">
              عند التعطيل يمكنك فتح أي من الـ 400 مرحلة فوراً بدون انتظار
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              updateSettings({ strictProgression: !activeProfile.settings.strictProgression })
            }
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shrink-0 ${
              activeProfile.settings.strictProgression
                ? 'bg-[#0F5E59] text-white'
                : 'border border-slate-300 dark:border-slate-700'
            }`}
          >
            {activeProfile.settings.strictProgression ? 'مفعل (بالتدرج)' : 'مفتوح للكل'}
          </button>
        </div>
      </section>

      {/* Backup & Profile Switching */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <h2 className="text-lg font-extrabold">النسخ الاحتياطي وإدارة الحساب</h2>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-bold"
          >
            <Download className="w-4 h-4" />
            تصدير التقدم (JSON)
          </button>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold"
          >
            <Upload className="w-4 h-4" />
            استيراد ملف تقدم
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            onChange={handleUploadBackup}
            className="hidden"
          />

          <button
            type="button"
            onClick={logoutToAuth}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold"
          >
            <LogOut className="w-4 h-4" />
            تبديل الطالب / تسجيل الخروج
          </button>
        </div>

        {statusMsg && (
          <p className="text-sm font-semibold text-teal-700 dark:text-teal-400">{statusMsg}</p>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-2 text-xs font-bold text-rose-600 hover:underline"
            >
              <Trash2 className="w-4 h-4" />
              إعادة تعيين تقدم هذا الملف والبدء من الصفر
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-2">
              <p className="text-sm font-bold text-rose-800 dark:text-rose-200">
                هل أنت متأكد من تصفير جميع النقاط والدروس لهذا الحساب؟
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetActiveProgress();
                    setConfirmReset(false);
                    setStatusMsg('تمت إعادة تعيين التقدم.');
                  }}
                  className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold"
                >
                  نعم، أعد التعيين
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
