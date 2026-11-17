import React from 'react';
import { ArrowLeft, BookOpen, Bot, Gamepad2, WifiOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BageshMascot } from '../components/BageshMascot';

export const WelcomePage: React.FC = () => {
  const { navigate, loginOrCreateProfile } = useApp();

  return (
    <div className="min-h-screen bg-white dark:bg-[#131F24] text-[#3C3C3C] dark:text-[#F1F7F9] flex flex-col justify-between">
      <header className="w-full max-w-5xl mx-auto px-6 py-5 flex items-center justify-between border-b-2 border-[#E5E5E5] dark:border-[#243137]">
        <div className="flex items-center gap-3">
          <img
            src="/app-icon.png"
            alt="وسيم باقش"
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <span className="font-black text-lg text-[#0A4191] dark:text-sky-300 block leading-tight">
              وسيم باقش
            </span>
            <span className="font-english text-xs font-extrabold text-slate-500 dark:text-slate-400 block">
              WASSEM BAGESH
            </span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#58CC02]">
          <WifiOff className="w-4 h-4" />
          يعمل بالنت وبدون نت
        </span>
      </header>

      <main className="w-full max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="flex flex-col items-center lg:items-start text-center lg:text-right space-y-5">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight">
            تعلّم الإنجليزية مع تطبيق وسيم باقش بمتعة وحماس
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
            400 مرحلة ملونة ومرقمة بأسلوب تفاعلي، انتقال تلقائي ذكي، تشجيع مستمر، ونطق صوتي واضح — شغال معك أونلاين أو بدون إنترنت.
          </p>

          <div className="w-full max-w-md space-y-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('auth')}
              className="w-full py-4 px-6 rounded-2xl bg-[#58CC02] hover:bg-[#61E002] border-b-4 border-[#46A302] active:translate-y-0.5 active:border-b-2 text-white font-black text-base sm:text-lg flex items-center justify-center gap-2 transition-all"
            >
              <span>ابدأ التعلم الآن</span>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => loginOrCreateProfile('زائر', true)}
              className="w-full py-3.5 px-6 rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#37464F] bg-white dark:bg-[#1B2B33] hover:bg-[#F7F7F7] dark:hover:bg-[#24363F] active:translate-y-0.5 active:border-b-2 text-[#1CB0F6] font-black text-base sm:text-lg transition-all"
            >
              الدخول السريع كزائر
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl bg-[#F7F7F7] dark:bg-[#1B2B33] border-2 border-[#E5E5E5] dark:border-[#37464F] p-6 flex flex-col items-center text-center space-y-5">
            <img
              src="/app-icon.png"
              alt="وسيم باقش — WASSEM BAGESH"
              className="w-40 h-40 rounded-full object-cover shadow-md"
            />
            <BageshMascot
              mood="greeting"
              messageAr="أهلاً بك! أنا معك في تطبيق وسيم باقش لنبدأ رحلة تعلم الإنجليزية خطوة بخطوة!"
              speakPhraseEn="Welcome to Wassem Bagesh! Let us learn English together!"
              compact
            />
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1B2B33] border-2 border-[#E5E5E5] dark:border-[#37464F] space-y-1.5">
              <BookOpen className="w-6 h-6 text-[#58CC02] mx-auto" />
              <p className="font-extrabold text-sm">400 مرحلة</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1B2B33] border-2 border-[#E5E5E5] dark:border-[#37464F] space-y-1.5">
              <Gamepad2 className="w-6 h-6 text-[#FF9600] mx-auto" />
              <p className="font-extrabold text-sm">15 لعبة</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1B2B33] border-2 border-[#E5E5E5] dark:border-[#37464F] space-y-1.5">
              <Bot className="w-6 h-6 text-[#1CB0F6] mx-auto" />
              <p className="font-extrabold text-sm">معلم ذكي</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs font-bold text-slate-400">
        وسيم باقش · WASSEM BAGESH — يعمل بالإنترنت وبدون إنترنت
      </footer>
    </div>
  );
};
