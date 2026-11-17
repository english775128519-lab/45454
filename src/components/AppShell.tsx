import React, { useState } from 'react';
import {
  BookOpen,
  Gamepad2,
  Bot,
  Mic,
  Search,
  Award,
  Settings,
  Home,
  LayoutGrid,
  X,
  Download,
  Share,
  WifiOff,
  CheckSquare,
  RotateCcw,
  TrendingUp,
  AudioLines,
  Sun,
  Moon,
  ArrowRight,
  Smartphone,
  Flame,
  Zap,
  Target,
} from 'lucide-react';
import type { PageId } from '../types/curriculum';
import { useApp } from '../context/AppContext';
import { TOTAL_STAGES_COUNT } from '../data/stages400';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface AppShellProps {
  children: React.ReactNode;
}

const ROOT_TABS: PageId[] = ['home', 'levels', 'games', 'ai-tutor'];

const PAGE_TITLES: Record<PageId, string> = {
  welcome: 'مرحباً بك',
  auth: 'حساب الطالب',
  home: 'المسار التعليمي',
  levels: 'الوحدات والمراحل',
  lessons: 'دروس الوحدة',
  'lesson-detail': 'الدرس التفصيلي',
  'stage-player': 'تدريب المرحلة',
  games: 'الألعاب التعليمية',
  'ai-tutor': 'المعلم الذكي',
  'voice-chat': 'المحادثة الصوتية',
  pronunciation: 'الاستماع والنطق',
  dictionary: 'القاموس الناطق',
  exams: 'اختبارات الاجتياز',
  review: 'راجع أخطاءك',
  achievements: 'إنجازاتي',
  progress: 'تقدمي',
  settings: 'الإعدادات',
};

const DESKTOP_NAV_ITEMS: {
  id: PageId;
  label: string;
  icon: React.ReactNode;
  matchPages?: PageId[];
}[] = [
  {
    id: 'home',
    label: 'تعلّم',
    icon: <Home className="w-5 h-5" />,
    matchPages: ['home'],
  },
  {
    id: 'levels',
    label: 'الوحدات',
    icon: <BookOpen className="w-5 h-5" />,
    matchPages: ['levels', 'lessons', 'lesson-detail'],
  },
  {
    id: 'games',
    label: 'الألعاب',
    icon: <Gamepad2 className="w-5 h-5" />,
    matchPages: ['games'],
  },
  {
    id: 'ai-tutor',
    label: 'المعلم الذكي',
    icon: <Bot className="w-5 h-5" />,
    matchPages: ['ai-tutor', 'voice-chat'],
  },
  {
    id: 'review',
    label: 'مراجعة الأخطاء',
    icon: <RotateCcw className="w-5 h-5" />,
    matchPages: ['review'],
  },
  {
    id: 'dictionary',
    label: 'القاموس',
    icon: <Search className="w-5 h-5" />,
    matchPages: ['dictionary', 'pronunciation'],
  },
  {
    id: 'exams',
    label: 'الاختبارات',
    icon: <CheckSquare className="w-5 h-5" />,
    matchPages: ['exams'],
  },
  {
    id: 'achievements',
    label: 'الإنجازات',
    icon: <Award className="w-5 h-5" />,
    matchPages: ['achievements', 'progress'],
  },
  {
    id: 'settings',
    label: 'الإعدادات',
    icon: <Settings className="w-5 h-5" />,
    matchPages: ['settings'],
  },
];

const MORE_TOOLS: { id: PageId; label: string; desc: string; icon: React.ReactNode; bg: string }[] = [
  {
    id: 'dictionary',
    label: 'القاموس الناطق',
    desc: 'ابحث عن أي كلمة',
    icon: <Search className="w-6 h-6 text-[#1CB0F6]" />,
    bg: 'bg-sky-50 dark:bg-sky-950/50',
  },
  {
    id: 'pronunciation',
    label: 'الاستماع والنطق',
    desc: 'تدرّب وسجّل صوتك',
    icon: <AudioLines className="w-6 h-6 text-indigo-500" />,
    bg: 'bg-indigo-50 dark:bg-indigo-950/50',
  },
  {
    id: 'voice-chat',
    label: 'المحادثة الصوتية',
    desc: 'حوار مباشر بالميكروفون',
    icon: <Mic className="w-6 h-6 text-[#FF4B4B]" />,
    bg: 'bg-rose-50 dark:bg-rose-950/50',
  },
  {
    id: 'exams',
    label: 'الاختبارات',
    desc: 'افتح الوحدة التالية',
    icon: <CheckSquare className="w-6 h-6 text-[#58CC02]" />,
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
  },
  {
    id: 'review',
    label: 'راجع أخطاءك',
    desc: 'تدريب ذكي للأخطاء',
    icon: <RotateCcw className="w-6 h-6 text-[#FF9600]" />,
    bg: 'bg-amber-50 dark:bg-amber-950/50',
  },
  {
    id: 'achievements',
    label: 'إنجازاتي',
    desc: 'الأوسمة والنجوم',
    icon: <Award className="w-6 h-6 text-purple-500" />,
    bg: 'bg-purple-50 dark:bg-purple-950/50',
  },
  {
    id: 'progress',
    label: 'تقدمي',
    desc: 'إحصائيات المنهج',
    icon: <TrendingUp className="w-6 h-6 text-[#58CC02]" />,
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
  },
  {
    id: 'settings',
    label: 'الإعدادات',
    desc: 'الصوت والخط والحساب',
    icon: <Settings className="w-6 h-6 text-slate-600 dark:text-slate-300" />,
    bg: 'bg-slate-100 dark:bg-slate-800',
  },
];

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const {
    currentPage,
    navigate,
    activeProfile,
    updateSettings,
    selectedLevelId,
    completedStagesCount,
    completionPercentage,
  } = useApp();
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  const isDark = activeProfile?.settings.theme === 'dark';
  const isRootTab = ROOT_TABS.includes(currentPage);
  const isLessonFocusMode = currentPage === 'stage-player';

  const handleBack = () => {
    if (currentPage === 'lesson-detail') {
      navigate('lessons', { levelId: selectedLevelId });
    } else if (currentPage === 'lessons') {
      navigate('levels');
    } else {
      navigate('home');
    }
  };

  const handleInstallAction = async () => {
    if (isInstallable) {
      await promptInstall();
      return;
    }
    setShowInstallModal(true);
  };

  const dailyGoalTarget = 3;
  const dailyDone = (activeProfile?.dailyLessonsToday ?? 0) + (activeProfile?.dailyGamesToday ?? 0);
  const dailyGoalPct = Math.min(100, Math.round((dailyDone / dailyGoalTarget) * 100));

  // Distraction-free full-focus mode for active Duolingo-style stage exercises
  if (isLessonFocusMode) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#131F24] text-[#3C3C3C] dark:text-[#F1F7F9]">
        {!isOnline && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 text-xs py-1.5 px-4 flex items-center justify-center gap-2 border-b border-emerald-200 dark:border-emerald-800 font-bold">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>وضع بدون نت مفعّل — التمارين تعمل بالكامل.</span>
          </div>
        )}
        <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#131F24] text-[#3C3C3C] dark:text-[#F1F7F9]">
      {!isOnline && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 text-xs sm:text-sm py-2 px-4 flex items-center justify-center gap-2 border-b border-emerald-200 dark:border-emerald-800 font-bold">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>وضع بدون نت مفعّل — جميع المراحل الـ 400 والألعاب والقاموس والمعلم شغالة بالكامل.</span>
        </div>
      )}

      {/* Mobile Compact Top Stats Bar (< lg) */}
      <header className="lg:hidden sticky top-0 z-30 h-14 bg-white/95 dark:bg-[#131F24]/95 backdrop-blur-md border-b-2 border-[#E5E5E5] dark:border-[#243137] px-3.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {!isRootTab ? (
            <button
              type="button"
              onClick={handleBack}
              className="p-2 rounded-xl hover:bg-[#F7F7F7] dark:hover:bg-[#1B2B33] min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="رجوع"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('home')}
              className="shrink-0 flex items-center gap-2 min-h-[44px]"
              aria-label="الرئيسية"
            >
              <img src="/app-icon.png" alt="وسيم باقش" className="w-9 h-9 rounded-full object-cover" />
              <span className="font-black text-sm sm:text-base text-[#0A4191] dark:text-sky-300 truncate">
                وسيم باقش
              </span>
            </button>
          )}
          {!isRootTab && (
            <h1 className="font-extrabold text-base truncate">{PAGE_TITLES[currentPage]}</h1>
          )}
        </div>

        {/* Clean Unboxed Duolingo Stat Counters */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate('progress')}
            className="inline-flex items-center gap-1 text-sm font-extrabold text-[#FF9600] font-numeric min-h-[44px] px-1"
            title="سلسلة الأيام المتواصلة"
          >
            <Flame className="w-5 h-5 fill-current" />
            <span>{activeProfile?.streakDays ?? 1}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('progress')}
            className="inline-flex items-center gap-1 text-sm font-extrabold text-[#1CB0F6] font-numeric min-h-[44px] px-1"
            title="مجموع النقاط"
          >
            <Zap className="w-5 h-5 fill-current" />
            <span>{activeProfile?.xp ?? 0}</span>
          </button>

          {activeProfile && (
            <button
              type="button"
              onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark' })}
              className="p-2 rounded-xl hover:bg-[#F7F7F7] dark:hover:bg-[#1B2B33] text-slate-600 dark:text-amber-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="تبديل المظهر"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          )}
        </div>
      </header>

      {/* Responsive Desktop 3-Column / Mobile Single-Column Workspace */}
      <div className="w-full max-w-7xl mx-auto flex justify-center">
        {/* Desktop Right Sidebar Rail (RTL start side) */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 sticky top-0 h-screen border-l-2 border-[#E5E5E5] dark:border-[#243137] px-4 py-6 justify-between">
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => navigate('home')}
              className="flex items-center gap-3 px-2 text-right w-full"
            >
              <img src="/app-icon.png" alt="وسيم باقش" className="w-11 h-11 rounded-full object-cover shrink-0" />
              <div className="min-w-0">
                <span className="font-black text-base text-[#0A4191] dark:text-sky-300 block leading-tight">
                  وسيم باقش
                </span>
                <span className="font-english text-[11px] font-extrabold text-slate-500 dark:text-slate-400 block truncate">
                  WASSEM BAGESH
                </span>
              </div>
            </button>

            <nav className="space-y-1.5" aria-label="القائمة الجانبية">
              {DESKTOP_NAV_ITEMS.map((item) => {
                const isActive = item.matchPages?.includes(currentPage) ?? currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.id)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-extrabold transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-[#DDF4FF] dark:bg-sky-950/60 border-2 border-[#84D8FF] dark:border-sky-700 text-[#1899D6] dark:text-sky-300'
                        : 'border-2 border-transparent text-slate-600 dark:text-slate-300 hover:bg-[#F7F7F7] dark:hover:bg-[#1B2B33]'
                    }`}
                  >
                    <span className={isActive ? 'text-[#1899D6] dark:text-sky-300' : 'text-slate-500 dark:text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="space-y-2 pt-4 border-t-2 border-[#E5E5E5] dark:border-[#243137]">
            {activeProfile && (
              <button
                type="button"
                onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark' })}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl hover:bg-[#F7F7F7] dark:hover:bg-[#1B2B33] text-sm font-bold"
              >
                <span>{isDark ? 'الوضع النهاري' : 'الوضع الليلي'}</span>
                {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-500" />}
              </button>
            )}
            {!isInstalled && (
              <button
                type="button"
                onClick={handleInstallAction}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#37464F] bg-white dark:bg-[#1B2B33] hover:bg-[#F7F7F7] text-sm font-extrabold text-[#1CB0F6]"
              >
                <Download className="w-4 h-4" />
                <span>تثبيت على أندرويد</span>
              </button>
            )}
          </div>
        </aside>

        {/* Main Center Content Column */}
        <main className="flex-1 min-w-0 max-w-2xl px-4 sm:px-6 py-5 pb-24 lg:pb-10">
          {children}
        </main>

        {/* Desktop Left Stats & Daily Quests Panel (RTL end side) */}
        <aside className="hidden xl:flex flex-col w-80 shrink-0 sticky top-0 h-screen py-6 px-4 space-y-5 overflow-y-auto">
          {/* Clean Unboxed Stats Header */}
          <div className="flex items-center justify-between px-2 py-1">
            <button
              type="button"
              onClick={() => navigate('progress')}
              className="flex items-center gap-1.5 font-extrabold text-[#FF9600] font-numeric"
            >
              <Flame className="w-6 h-6 fill-current" />
              <span>{activeProfile?.streakDays ?? 1}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('progress')}
              className="flex items-center gap-1.5 font-extrabold text-[#1CB0F6] font-numeric"
            >
              <Zap className="w-6 h-6 fill-current" />
              <span>{activeProfile?.xp ?? 0} XP</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('achievements')}
              className="flex items-center gap-1.5 font-extrabold text-[#FFC800] font-numeric"
            >
              <Award className="w-6 h-6" />
              <span>{activeProfile?.unlockedBadgeIds.length ?? 0}</span>
            </button>
          </div>

          {/* Daily Goal Card */}
          <div className="rounded-2xl border-2 border-[#E5E5E5] dark:border-[#37464F] bg-white dark:bg-[#1B2B33] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-base flex items-center gap-2">
                <Target className="w-5 h-5 text-[#58CC02]" />
                <span>هدفك اليومي</span>
              </h2>
              <span className="font-numeric text-sm font-extrabold text-[#58CC02]">
                {dailyDone}/{dailyGoalTarget}
              </span>
            </div>
            <div className="w-full h-3.5 rounded-full bg-[#E5E5E5] dark:bg-[#37464F] overflow-hidden">
              <div
                className="h-full bg-[#58CC02] rounded-full transition-all duration-300"
                style={{ width: `${dailyGoalPct}%` }}
              />
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {dailyDone >= dailyGoalTarget
                ? 'رائع! أكملت هدفك اليومي بنجاح.'
                : `أكمل ${dailyGoalTarget - dailyDone} تمارين إضافية اليوم للحفاظ على سلسلتك.`}
            </p>
          </div>

          {/* 400-Stage Overall Progress Card */}
          <div className="rounded-2xl border-2 border-[#E5E5E5] dark:border-[#37464F] bg-white dark:bg-[#1B2B33] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-base">تقدمك في الـ 400 مرحلة</h2>
              <span className="font-numeric text-sm font-extrabold text-[#1CB0F6]">
                {completionPercentage}%
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-[#E5E5E5] dark:bg-[#37464F] overflow-hidden">
              <div
                className="h-full bg-[#1CB0F6] rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 font-numeric">
              أنجزت {completedStagesCount} من أصل {TOTAL_STAGES_COUNT} مرحلة
            </p>
          </div>

          {/* Mistakes Quick Review Card */}
          <div className="rounded-2xl border-2 border-[#E5E5E5] dark:border-[#37464F] bg-white dark:bg-[#1B2B33] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-base">صندوق الأخطاء</h2>
              <span className="font-numeric text-sm font-extrabold text-[#FF9600]">
                {activeProfile?.mistakes.length ?? 0}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">
              {(activeProfile?.mistakes.length ?? 0) > 0
                ? 'لديك كلمات أخطأت فيها سابقاً — راجعها الآن لتتقنها وتكسب نقاطاً إضافية.'
                : 'سجلك نظيف حالياً! واصل التقدم في المراحل.'}
            </p>
            {(activeProfile?.mistakes.length ?? 0) > 0 && (
              <button
                type="button"
                onClick={() => navigate('review')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#FF9600] hover:bg-[#E58600] border-b-4 border-[#CC7700] active:translate-y-0.5 active:border-b-2 text-white font-extrabold text-sm transition-all"
              >
                تدرّب على الأخطاء
              </button>
            )}
          </div>
        </aside>
      </div>

      {/* Mobile Bottom Navigation Bar (< lg) */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-white/95 dark:bg-[#131F24]/95 backdrop-blur-md border-t-2 border-[#E5E5E5] dark:border-[#243137] px-2 flex items-center justify-around"
        aria-label="التنقل السفلي"
      >
        {[
          { id: 'home' as PageId, label: 'تعلّم', icon: <Home className="w-5 h-5" /> },
          {
            id: 'levels' as PageId,
            label: 'الوحدات',
            icon: <BookOpen className="w-5 h-5" />,
            match:
              currentPage === 'levels' ||
              currentPage === 'lessons' ||
              currentPage === 'lesson-detail',
          },
          { id: 'games' as PageId, label: 'الألعاب', icon: <Gamepad2 className="w-5 h-5" /> },
          { id: 'ai-tutor' as PageId, label: 'المعلم', icon: <Bot className="w-5 h-5" /> },
        ].map((tab) => {
          const active = !moreSheetOpen && (tab.match ?? currentPage === tab.id);
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setMoreSheetOpen(false);
                navigate(tab.id);
              }}
              className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[48px] py-1"
            >
              <div
                className={`px-3 py-1 rounded-xl transition-colors ${
                  active
                    ? 'bg-[#DDF4FF] dark:bg-sky-950/70 text-[#1899D6] dark:text-sky-300 border border-[#84D8FF] dark:border-sky-700'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.icon}
              </div>
              <span
                className={`text-[11px] font-extrabold whitespace-nowrap ${
                  active ? 'text-[#1899D6] dark:text-sky-300' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setMoreSheetOpen((o) => !o)}
          className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[48px] py-1"
        >
          <div
            className={`px-3 py-1 rounded-xl transition-colors ${
              moreSheetOpen || !isRootTab
                ? 'bg-[#DDF4FF] dark:bg-sky-950/70 text-[#1899D6] dark:text-sky-300 border border-[#84D8FF] dark:border-sky-700'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
          </div>
          <span
            className={`text-[11px] font-extrabold whitespace-nowrap ${
              moreSheetOpen || !isRootTab
                ? 'text-[#1899D6] dark:text-sky-300'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            المزيد
          </span>
        </button>
      </nav>

      {/* Mobile Bottom Sheet ("المزيد") */}
      {moreSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={() => setMoreSheetOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#1B2B33] rounded-t-3xl border-t-2 border-[#E5E5E5] dark:border-[#37464F] p-5 pb-8 space-y-4 shadow-2xl max-h-[82vh] overflow-y-auto">
            <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 mx-auto" />
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-xl">كل أدوات التطبيق</h2>
              <button
                type="button"
                onClick={() => setMoreSheetOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!isInstalled && (
              <button
                type="button"
                onClick={() => {
                  setMoreSheetOpen(false);
                  handleInstallAction();
                }}
                className="w-full py-3 px-4 rounded-2xl bg-[#58CC02] border-b-4 border-[#46A302] text-white font-extrabold text-sm flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>تثبيت التطبيق على أندرويد</span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-3">
              {MORE_TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => {
                    setMoreSheetOpen(false);
                    navigate(tool.id);
                  }}
                  className="p-3.5 rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#37464F] bg-white dark:bg-[#131F24] hover:border-[#1CB0F6] text-right flex items-center gap-3 active:translate-y-0.5 active:border-b-2 transition-all"
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${tool.bg}`}>{tool.icon}</div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-sm truncate">{tool.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{tool.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Android Install Guide Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1B2B33] border-2 border-[#E5E5E5] dark:border-[#37464F] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#58CC02]" />
                تثبيت التطبيق على هاتفك الأندرويد
              </h3>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {isIOS ? (
              <ol className="space-y-3 text-sm text-slate-700 dark:text-slate-300 list-decimal list-inside">
                <li className="flex items-start gap-2">
                  <span>اضغط على أيقونة المشاركة</span>
                  <Share className="w-4 h-4 text-[#1CB0F6] shrink-0 mt-1" />
                  <span>في سفاري.</span>
                </li>
                <li>اختر «إضافة إلى الشاشة الرئيسية».</li>
              </ol>
            ) : (
              <ol className="space-y-3 text-sm text-slate-700 dark:text-slate-300 list-decimal list-inside leading-relaxed">
                <li>افتح التطبيق في متصفح <strong>Google Chrome</strong> على هاتفك الأندرويد.</li>
                <li>اضغط على قائمة النقاط الثلاث (⋮) أعلى الشاشة.</li>
                <li>اختر <strong>«تثبيت التطبيق» (Install App)</strong> أو <strong>«الإضافة إلى الشاشة الرئيسية»</strong>.</li>
                <li>سيُثبّت مباشرة كأيقونة أندرويد مستقلة بملء الشاشة وبدون شريط متصفح!</li>
              </ol>
            )}
            <button
              type="button"
              onClick={() => setShowInstallModal(false)}
              className="w-full py-3.5 rounded-2xl bg-[#58CC02] hover:bg-[#61E002] border-b-4 border-[#46A302] text-white font-extrabold"
            >
              حسناً، فهمت
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
