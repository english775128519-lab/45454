import React, { useState } from 'react';
import {
  Bot,
  Send,
  Volume2,
  Languages,
  Sparkles,
  HelpCircle,
  Loader2,
  Theater,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ROLEPLAY_SCENARIOS, type RoleplayScenario } from '../data/curriculum';
import { speakEnglish } from '../utils/speech';
import { postApiJson } from '../utils/api';
import {
  buildOfflineAdaptiveQuestions,
  buildOfflineTutorReply,
} from '../utils/offlineTutor';

interface ChatMessage {
  id: string;
  role: 'user' | 'tutor';
  text: string;
  englishSpeech?: string;
  arabicTranslation?: string;
  correction?: {
    hasMistake: boolean;
    original: string;
    corrected: string;
    explanationAr: string;
  };
  newWords?: { en: string; ar: string; pronunciationAr: string }[];
  suggestedReplies?: string[];
}

interface AdaptiveQuestion {
  promptAr: string;
  englishText?: string;
  options: string[];
  correctIndex: number;
  explanationAr: string;
}

export const AITutorPage: React.FC = () => {
  const { activeProfile, addXp, recordMistake } = useApp();
  const [mode, setMode] = useState<'arabic' | 'english'>('arabic');
  const [topic, setTopic] = useState('التحيات والتعارف وبداية المحادثة');
  const [activeScenario, setActiveScenario] = useState<RoleplayScenario | null>(null);
  const [studentRole, setStudentRole] = useState<string>('student');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-tutor',
      role: 'tutor',
      text: `أهلاً بك يا ${activeProfile?.name || 'صديقي'} في معلم وسيم باقش الذكي! اختر موضوعاً أو سيناريو، أو اكتب لي أي جملة بالإنجليزية أو سؤالاً بالعربية — وسأعمل معك بالنت أو بدون نت.`,
      englishSpeech: 'Hello! I am ready to help you learn English step by step.',
      arabicTranslation: 'أهلاً! أنا جاهز لمساعدتك في تعلم الإنجليزية خطوة بخطوة.',
      suggestedReplies: ['Hello! How are you?', 'أريد التدرب على حجز فندق', 'اشرح لي قاعدة جمع الأسماء'],
    },
  ]);

  // Adaptive exercise generator state
  const [adaptiveQuestions, setAdaptiveQuestions] = useState<AdaptiveQuestion[]>([]);
  const [adaptiveAnswers, setAdaptiveAnswers] = useState<Record<number, number>>({});
  const [generatingDrill, setGeneratingDrill] = useState(false);
  const [drillError, setDrillError] = useState('');

  if (!activeProfile) return null;

  const voiceAccent = activeProfile.settings.voiceAccent;
  const speechRate = activeProfile.settings.speechRate;

  const sendTutorRequest = async (
    userText: string | null,
    opts: { explainInArabic?: boolean; simplerExplanation?: boolean; scenarioOverride?: RoleplayScenario | null; roleOverride?: string } = {}
  ) => {
    if (loading) return;
    setLoading(true);

    const historyToSend = [...messages];
    if (userText) {
      const userMsg: ChatMessage = {
        id: `u_${Date.now()}`,
        role: 'user',
        text: userText,
      };
      historyToSend.push(userMsg);
      setMessages(historyToSend);
      setInputText('');
    }

    const applyTutorResponse = (data: ReturnType<typeof buildOfflineTutorReply>) => {
      const tutorMsg: ChatMessage = {
        id: `t_${Date.now()}`,
        role: 'tutor',
        text: data.reply || 'أحسنت! تابع التمرين.',
        englishSpeech: data.englishSpeech,
        arabicTranslation: data.arabicTranslation,
        correction: data.correction,
        newWords: data.newWords,
        suggestedReplies: data.suggestedReplies,
      };

      setMessages((prev) => [...prev, tutorMsg]);
      addXp(5);

      if (data.correction?.hasMistake && data.correction.corrected) {
        recordMistake({
          id: `tutor_${data.correction.corrected}`,
          en: data.correction.corrected,
          ar: data.correction.explanationAr || 'تصحيح من المعلم الذكي',
          lessonId: 'l3-greetings',
          source: 'conversation',
          noteAr: `قلت: ${data.correction.original}`,
        });
      }

      if (data.englishSpeech) {
        speakEnglish(data.englishSpeech, { rate: speechRate, lang: voiceAccent });
      }
    };

    try {
      const data = await postApiJson<ReturnType<typeof buildOfflineTutorReply>>('/api/tutor/chat', {
        messages: historyToSend.map((m) => ({ role: m.role, text: m.text })),
        mode,
        studentName: activeProfile.name,
        studentLevel: activeProfile.unlockedLevelId,
        currentTopic: topic,
        explainInArabic: Boolean(opts.explainInArabic),
        simplerExplanation: Boolean(opts.simplerExplanation),
        scenario: opts.scenarioOverride !== undefined ? opts.scenarioOverride : activeScenario,
        studentRole: opts.roleOverride ?? studentRole,
      });
      applyTutorResponse(data);
    } catch {
      const offlineData = buildOfflineTutorReply({
        userText,
        mode,
        studentName: activeProfile.name,
        studentLevel: activeProfile.unlockedLevelId,
        currentTopic: topic,
        explainInArabic: Boolean(opts.explainInArabic),
        simplerExplanation: Boolean(opts.simplerExplanation),
        scenario: opts.scenarioOverride !== undefined ? opts.scenarioOverride : activeScenario,
      });
      applyTutorResponse(offlineData);
    } finally {
      setLoading(false);
    }
  };

  const handleStartScenario = (scenario: RoleplayScenario, roleId: string) => {
    setActiveScenario(scenario);
    setStudentRole(roleId);
    setTopic(scenario.titleAr);
    const chosenRole = scenario.roles.find((r) => r.id === roleId);
    const introMsg: ChatMessage = {
      id: `rp_start_${Date.now()}`,
      role: 'tutor',
      text: `بدأنا سيناريو «${scenario.titleAr}». دورك الآن: ${chosenRole?.labelAr}.`,
      englishSpeech: scenario.starterPromptEn,
      arabicTranslation: scenario.descriptionAr,
      suggestedReplies: ['Hello, good evening!', 'Yes, please.', 'Can you help me?'],
    };
    setMessages([introMsg]);
    speakEnglish(scenario.starterPromptEn, { rate: speechRate, lang: voiceAccent });
  };

  const handleGenerateAdaptiveDrill = async () => {
    setGeneratingDrill(true);
    setDrillError('');
    setAdaptiveAnswers({});
    try {
      const data = await postApiJson<{ questions?: AdaptiveQuestion[] }>('/api/tutor/generate-exercise', {
        studentLevel: activeProfile.unlockedLevelId,
        weakWords: activeProfile.mistakes.slice(0, 6).map((m) => m.en),
        topic,
      });
      setAdaptiveQuestions(data.questions || []);
    } catch {
      setAdaptiveQuestions(buildOfflineAdaptiveQuestions(activeProfile.unlockedLevelId));
    } finally {
      setGeneratingDrill(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Mode Controls */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src="/app-icon.png"
            alt="وسيم باقش"
            className="w-16 h-16 rounded-full object-cover shrink-0"
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Bot className="w-6 h-6 text-[#58CC02]" />
              المعلم الذكي — وسيم باقش
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              تحدث بالعربية أو الإنجليزية، بدّل وضع المحادثة في أي لحظة، ويعمل معك أونلاين أو بدون نت.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('arabic')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
              mode === 'arabic'
                ? 'bg-teal-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            الوضع العربي (شرح وتدريب)
          </button>
          <button
            type="button"
            onClick={() => setMode('english')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
              mode === 'english'
                ? 'bg-teal-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            الوضع الإنجليزي (English Mode)
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Roleplay Scenarios & Adaptive Generator */}
        <aside className="space-y-5">
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <h2 className="text-base font-extrabold flex items-center gap-2">
              <Theater className="w-5 h-5 text-amber-600" />
              تمثيل أدوار واقعية (اختر دورك)
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto pl-1">
              {ROLEPLAY_SCENARIOS.map((sc) => (
                <div
                  key={sc.id}
                  className={`p-3.5 rounded-xl border space-y-2 ${
                    activeScenario?.id === sc.id
                      ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/30'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <p className="font-bold text-sm">{sc.titleAr}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{sc.descriptionAr}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {sc.roles.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleStartScenario(sc, r.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-700 hover:text-white text-xs font-bold transition-colors"
                      >
                        العب دور: {r.labelAr}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <h2 className="text-base font-extrabold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-700" />
              تمارين تكيّفية لمستواك
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              توليد 4 أسئلة مخصصة بناءً على مستواك ({activeProfile.unlockedLevelId}) والكلمات التي أخطأت فيها.
            </p>
            <button
              type="button"
              onClick={handleGenerateAdaptiveDrill}
              disabled={generatingDrill}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-2"
            >
              {generatingDrill && <Loader2 className="w-4 h-4 animate-spin" />}
              توليد تمرين مخصص الآن
            </button>

            {drillError && <p className="text-xs text-rose-600">{drillError}</p>}

            {adaptiveQuestions.map((q, qIdx) => {
              const chosen = adaptiveAnswers[qIdx];
              return (
                <div key={qIdx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <p className="font-bold">{q.promptAr}</p>
                  {q.englishText && (
                    <p dir="ltr" className="font-english font-bold text-teal-700 text-right">
                      {q.englishText}
                    </p>
                  )}
                  <div className="space-y-1">
                    {q.options.map((opt, oIdx) => (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => setAdaptiveAnswers((prev) => ({ ...prev, [qIdx]: oIdx }))}
                        className={`w-full p-2 rounded-lg border text-right font-semibold ${
                          chosen === oIdx
                            ? oIdx === q.correctIndex
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                              : 'bg-rose-50 border-rose-500 text-rose-800'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {chosen !== undefined && <p className="text-slate-500">{q.explanationAr}</p>}
                </div>
              );
            })}
          </section>
        </aside>

        {/* Main Chat Panel */}
        <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col h-[560px] overflow-hidden">
          {/* Quick Pedagogical Helpers */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-[#F8F7F4] dark:bg-slate-800/60">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              الموضوع: {topic}
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  sendTutorRequest('اشرح لي ما سبق بالعربية من فضلك.', { explainInArabic: true })
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold hover:border-teal-600"
              >
                <Languages className="w-3.5 h-3.5 text-teal-700" />
                اشرح بالعربية
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  sendTutorRequest('لم أفهم، أعد الشرح بطريقة أسهل من فضلك.', {
                    simplerExplanation: true,
                  })
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold hover:border-amber-600"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                اشرح بطريقة أسهل
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 space-y-2.5 ${
                    msg.role === 'user'
                      ? 'bg-teal-700 text-white'
                      : 'bg-[#F8F7F4] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                  }`}
                >
                  <p className="text-sm sm:text-base leading-relaxed whitespace-pre-line">{msg.text}</p>

                  {msg.englishSpeech && (
                    <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                      <span dir="ltr" className="font-english font-bold text-sm text-slate-900 dark:text-white">
                        {msg.englishSpeech}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          speakEnglish(msg.englishSpeech!, { rate: speechRate, lang: voiceAccent })
                        }
                        className="p-1.5 rounded-lg bg-teal-700 text-white shrink-0"
                        aria-label="استماع للنص الإنجليزي"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {msg.arabicTranslation && (
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      المعنى: {msg.arabicTranslation}
                    </p>
                  )}

                  {msg.correction?.hasMistake && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs space-y-1">
                      <p className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        تصحيح لطيف:
                      </p>
                      <p dir="ltr" className="font-english font-bold text-emerald-700 dark:text-emerald-400 text-right">
                        {msg.correction.corrected}
                      </p>
                      <p className="text-slate-700 dark:text-slate-300">{msg.correction.explanationAr}</p>
                    </div>
                  )}

                  {msg.newWords && msg.newWords.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {msg.newWords.map((w, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => speakEnglish(w.en, { rate: speechRate, lang: voiceAccent })}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                        >
                          <span dir="ltr" className="font-english font-bold">
                            {w.en}
                          </span>{' '}
                          = {w.ar} ({w.pronunciationAr})
                        </button>
                      ))}
                    </div>
                  )}

                  {msg.suggestedReplies && msg.suggestedReplies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.suggestedReplies.map((rep, idx) => (
                        <button
                          key={idx}
                          type="button"
                          disabled={loading}
                          onClick={() => sendTutorRequest(rep)}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 text-xs font-bold text-teal-800 dark:text-teal-300 hover:bg-teal-50"
                        >
                          {rep}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-end">
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center gap-2 text-xs font-bold">
                  <Loader2 className="w-4 h-4 animate-spin text-teal-700" />
                  الأستاذ ماستر يكتب الرد...
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputText.trim()) sendTutorRequest(inputText.trim());
            }}
            className="p-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="اكتب رسالتك بالإنجليزية أو اسأل بالعربية..."
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F8F7F4] dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="px-5 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-sm inline-flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              إرسال
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
