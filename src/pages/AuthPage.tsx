import React, { useRef, useState } from 'react';
import { UserPlus, UserCheck, Upload, ArrowRight, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AuthPage: React.FC = () => {
  const { profiles, loginOrCreateProfile, selectExistingProfile, importProgressJson, navigate } = useApp();
  const [studentName, setStudentName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = studentName.trim();
    if (cleaned.length < 2) {
      setErrorMsg('يرجى كتابة اسم لا يقل عن حرفين لبدء حفظ تقدمك.');
      return;
    }
    setErrorMsg('');
    loginOrCreateProfile(cleaned, false);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const result = importProgressJson(text);
      setImportMsg(result.messageAr);
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#131F24] text-[#3C3C3C] dark:text-[#F1F7F9] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl bg-white dark:bg-[#1B2B33] border-2 border-[#E5E5E5] dark:border-[#37464F] rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('welcome')}
            className="inline-flex items-center gap-1.5 text-sm font-extrabold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowRight className="w-4 h-4" />
            العودة
          </button>
          <div className="flex items-center gap-2">
            <img src="/app-icon.png" alt="وسيم باقش" className="w-9 h-9 rounded-full object-cover" />
            <div className="text-left">
              <span className="font-black text-sm text-[#0A4191] dark:text-sky-300 block leading-tight">
                وسيم باقش
              </span>
              <span className="font-english font-bold text-[10px] text-slate-400 block">
                WASSEM BAGESH
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-black">أنشئ ملفك التعليمي</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">
            احفظ نقاطك وسلسلة أيامك ومراحلك الـ 400 على جهازك.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="student-name" className="block text-sm font-extrabold mb-1.5">
              اسم الطالب
            </label>
            <input
              id="student-name"
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="مثال: أحمد محمد"
              className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E5E5E5] dark:border-[#37464F] bg-[#F7F7F7] dark:bg-[#131F24] focus:outline-none focus:border-[#1CB0F6] text-base font-bold"
            />
            {errorMsg && <p className="text-sm font-bold text-[#FF4B4B] mt-1.5">{errorMsg}</p>}
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 py-4 px-5 rounded-2xl bg-[#58CC02] hover:bg-[#61E002] border-b-4 border-[#46A302] active:translate-y-0.5 active:border-b-2 text-white font-black text-base transition-all"
          >
            <UserPlus className="w-5 h-5" />
            ابدأ التعلم الآن
          </button>
        </form>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => loginOrCreateProfile('زائر', true)}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#37464F] hover:bg-[#F7F7F7] dark:hover:bg-[#24363F] active:translate-y-0.5 active:border-b-2 text-sm font-extrabold transition-all"
          >
            <Sparkles className="w-4 h-4 text-[#FF9600]" />
            الدخول كزائر
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#37464F] hover:bg-[#F7F7F7] dark:hover:bg-[#24363F] active:translate-y-0.5 active:border-b-2 text-sm font-extrabold transition-all"
          >
            <Upload className="w-4 h-4 text-[#1CB0F6]" />
            استعادة التقدم
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>

        {importMsg && (
          <p className="text-sm font-bold text-[#46A302] dark:text-emerald-300 bg-[#D7FFB8] dark:bg-emerald-950/50 p-3 rounded-2xl border-2 border-[#58CC02]">
            {importMsg}
          </p>
        )}

        {profiles.length > 0 && (
          <div className="pt-4 border-t-2 border-[#E5E5E5] dark:border-[#37464F] space-y-2.5">
            <h2 className="text-sm font-extrabold text-slate-600 dark:text-slate-300">
              ملفات محفوظة على هذا الجهاز
            </h2>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {profiles.map((prof) => (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() => selectExistingProfile(prof.id)}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#37464F] hover:border-[#1CB0F6] active:translate-y-0.5 active:border-b-2 transition-all text-right"
                >
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-[#58CC02] shrink-0" />
                    <div>
                      <p className="font-extrabold text-sm">{prof.name}</p>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 font-numeric">
                        الوحدة {prof.unlockedLevelId} · {prof.completedStageIds?.length ?? 0} مرحلة
                      </p>
                    </div>
                  </div>
                  <span className="font-numeric text-sm font-extrabold text-[#1CB0F6]">
                    {prof.xp} XP
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
