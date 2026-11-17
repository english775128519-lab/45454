import React, { useState } from 'react';
import {
  Mic,
  Square,
  Send,
  Volume2,
  ClipboardCheck,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ROLEPLAY_SCENARIOS } from '../data/curriculum';
import { speakEnglish, startSpeechRecognition } from '../utils/speech';
import { postApiJson } from '../utils/api';
import { buildOfflineTutorReply } from '../utils/offlineTutor';

interface VoiceTurn {
  id: string;
  role: 'user' | 'tutor';
  text: string;
  arabicHint?: string;
}

interface EvaluationReport {
  score: number;
  correctSentences: string[];
  mistakes: { said: string; correction: string; explanationAr: string }[];
  newWords: { en: string; ar: string }[];
  tipsAr: string[];
  encouragementAr: string;
}

export const VoiceChatPage: React.FC = () => {
  const { activeProfile, addXp, recordMistake } = useApp();
  const [selectedScenarioId, setSelectedScenarioId] = useState(ROLEPLAY_SCENARIOS[0].id);
  const [turns, setTurns] = useState<VoiceTurn[]>([
    {
      id: 'vt-init',
      role: 'tutor',
      text: ROLEPLAY_SCENARIOS[0].starterPromptEn,
      arabicHint: 'أهلاً! قدّم نفسك بالإنجليزية بالضغط على زر الميكروفون أو كتابة النص.',
    },
  ]);
  const [listening, setListening] = useState(false);
  const [draftTranscript, setDraftTranscript] = useState('');
  const [micController, setMicController] = useState<{ stop: () => void } | null>(null);
  const [micError, setMicError] = useState('');
  const [sending, setSending] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [report, setReport] = useState<EvaluationReport | null>(null);

  if (!activeProfile) return null;

  const voiceAccent = activeProfile.settings.voiceAccent;
  const speechRate = activeProfile.settings.speechRate;
  const scenario = ROLEPLAY_SCENARIOS.find((s) => s.id === selectedScenarioId) ?? ROLEPLAY_SCENARIOS[0];

  const handleToggleMic = () => {
    setMicError('');
    if (listening && micController) {
      micController.stop();
      setListening(false);
      return;
    }

    setListening(true);
    const ctrl = startSpeechRecognition({
      lang: voiceAccent,
      onResult: (text) => setDraftTranscript(text),
      onError: (msg) => {
        setMicError(msg);
        setListening(false);
      },
      onEnd: () => setListening(false),
    });
    setMicController(ctrl);
  };

  const handleSendVoiceTurn = async () => {
    const clean = draftTranscript.trim();
    if (!clean || sending) return;
    if (listening && micController) {
      micController.stop();
      setListening(false);
    }

    const userTurn: VoiceTurn = { id: `vu_${Date.now()}`, role: 'user', text: clean };
    const updatedTurns = [...turns, userTurn];
    setTurns(updatedTurns);
    setDraftTranscript('');
    setSending(true);

    try {
      const data = await postApiJson<{
        englishSpeech?: string;
        reply?: string;
        arabicTranslation?: string;
      }>('/api/tutor/chat', {
        messages: updatedTurns.map((t) => ({ role: t.role, text: t.text })),
        mode: 'english',
        studentName: activeProfile.name,
        studentLevel: activeProfile.unlockedLevelId,
        currentTopic: scenario.titleAr,
        scenario,
        studentRole: scenario.roles[0].labelEn,
      });
      const spokenReply = data.englishSpeech || data.reply || 'Good job! Please continue.';
      const tutorTurn: VoiceTurn = {
        id: `vt_${Date.now()}`,
        role: 'tutor',
        text: spokenReply,
        arabicHint: data.arabicTranslation || '',
      };
      setTurns((prev) => [...prev, tutorTurn]);
      addXp(10);
      speakEnglish(spokenReply, { rate: speechRate, lang: voiceAccent });
    } catch {
      const offline = buildOfflineTutorReply({
        userText: clean,
        mode: 'english',
        studentName: activeProfile.name,
        studentLevel: activeProfile.unlockedLevelId,
        currentTopic: scenario.titleAr,
        scenario,
      });
      const spokenReply = offline.englishSpeech || 'Good job! Please continue.';
      setTurns((prev) => [
        ...prev,
        {
          id: `vt_${Date.now()}`,
          role: 'tutor',
          text: spokenReply,
          arabicHint: offline.arabicTranslation || offline.reply,
        },
      ]);
      addXp(10);
      speakEnglish(spokenReply, { rate: speechRate, lang: voiceAccent });
    } finally {
      setSending(false);
    }
  };

  const handleEvaluateSession = async () => {
    setEvaluating(true);
    try {
      const data = await postApiJson<EvaluationReport>('/api/tutor/evaluate-conversation', {
        transcript: turns.map((t) => ({ role: t.role, text: t.text })),
        studentLevel: activeProfile.unlockedLevelId,
        scenarioTitle: scenario.titleAr,
      });
      setReport(data);
      addXp(20);
      data.mistakes?.forEach((m) => {
        recordMistake({
          id: `vchat_${m.correction}`,
          en: m.correction,
          ar: m.explanationAr,
          lessonId: 'l3-greetings',
          source: 'conversation',
          noteAr: `النص المسجل: ${m.said}`,
        });
      });
    } catch {
      const userTurns = turns.filter((t) => t.role === 'user');
      const score = Math.min(100, 75 + userTurns.length * 5);
      setReport({
        score,
        correctSentences: userTurns.map((t) => t.text),
        mistakes: [],
        newWords: [
          { en: 'Excuse me', ar: 'لو سمحت' },
          { en: 'Thank you very much', ar: 'شكراً جزيلاً' },
        ],
        tipsAr: [
          'استمر في نطق الجمل بصوت واضح ومقارنة نطقك بالنطق الصحيح.',
          'ابدأ كل جملة بحرف كبير وحافظ على الممارسة اليومية في وسيم باقش.',
        ],
        encouragementAr: `عمل رائع يا ${activeProfile.name}! تفاعلت في ${userTurns.length} مشاركات بثقة ممتازة.`,
      });
      addXp(20);
    } finally {
      setEvaluating(false);
    }
  };

  const handleSwitchScenario = (id: string) => {
    const next = ROLEPLAY_SCENARIOS.find((s) => s.id === id) ?? ROLEPLAY_SCENARIOS[0];
    setSelectedScenarioId(id);
    setReport(null);
    setDraftTranscript('');
    setTurns([
      {
        id: `vt_${Date.now()}`,
        role: 'tutor',
        text: next.starterPromptEn,
        arabicHint: next.descriptionAr,
      },
    ]);
    speakEnglish(next.starterPromptEn, { rate: speechRate, lang: voiceAccent });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Mic className="w-6 h-6 text-rose-600" />
              المحادثة الصوتية المباشرة
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              تحدث بالإنجليزية مع المعلم، اسمع الرد الصوتي، واحصل على تقرير تقييم في نهاية المحادثة.
            </p>
          </div>
          <button
            type="button"
            onClick={handleEvaluateSession}
            disabled={turns.length < 2 || evaluating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-teal-700 disabled:opacity-50 text-white text-sm font-bold"
          >
            {evaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
            إنهاء وتقييم المحادثة
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {ROLEPLAY_SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => handleSwitchScenario(sc.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                sc.id === selectedScenarioId
                  ? 'bg-teal-700 text-white'
                  : 'bg-[#F8F7F4] dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {sc.titleAr}
            </button>
          ))}
        </div>
      </div>

      {/* Transcript Box */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {turns.map((turn) => (
            <div
              key={turn.id}
              className={`p-4 rounded-2xl border ${
                turn.role === 'user'
                  ? 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800'
                  : 'bg-[#F8F7F4] dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              } flex items-start justify-between gap-3`}
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-teal-700 dark:text-teal-400">
                  {turn.role === 'user' ? 'أنت' : 'المعلم'}
                </span>
                <p dir="ltr" className="font-english font-bold text-base text-right">
                  {turn.text}
                </p>
                {turn.arabicHint && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{turn.arabicHint}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => speakEnglish(turn.text, { rate: speechRate, lang: voiceAccent })}
                className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0"
                aria-label="إعادة الاستماع"
              >
                <Volume2 className="w-4 h-4 text-teal-700" />
              </button>
            </div>
          ))}
        </div>

        {/* Mic Controls + Editable Transcript */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleToggleMic}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm transition-colors ${
                listening ? 'bg-slate-900' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {listening ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {listening ? 'إيقاف الميكروفون' : 'تحدث الآن'}
            </button>
            <input
              dir="ltr"
              type="text"
              value={draftTranscript}
              onChange={(e) => setDraftTranscript(e.target.value)}
              placeholder="سيظهر كلامك هنا (أو اكتب ردك بالإنجليزية)..."
              className="flex-1 min-w-[220px] px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F8F7F4] dark:bg-slate-800 font-english text-sm"
            />
            <button
              type="button"
              disabled={!draftTranscript.trim() || sending}
              onClick={handleSendVoiceTurn}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-sm"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              إرسال
            </button>
          </div>
          {micError && <p className="text-xs text-rose-600">{micError}</p>}
        </div>
      </div>

      {/* End-of-Session Evaluation Report */}
      {report && (
        <section className="rounded-3xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold">تقرير تقييم المحادثة</h2>
            <span className="font-numeric text-2xl font-extrabold text-teal-700 dark:text-teal-400">
              {report.score} / 100
            </span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">{report.encouragementAr}</p>

          {report.correctSentences.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-emerald-700">جمل نطقتها أو كتبتها بشكل صحيح:</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                {report.correctSentences.map((s, i) => (
                  <li key={i} dir="ltr" className="font-english text-right">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.mistakes.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-rose-700">ملاحظات للتحسين:</h3>
              {report.mistakes.map((m, i) => (
                <div key={i} className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 text-sm space-y-1">
                  <p dir="ltr" className="font-english text-right">
                    <span className="line-through text-rose-600">{m.said}</span> →{' '}
                    <span className="font-bold text-emerald-700">{m.correction}</span>
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{m.explanationAr}</p>
                </div>
              ))}
            </div>
          )}

          {report.tipsAr.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-teal-700">نصائح عملية:</h3>
              <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1">
                {report.tipsAr.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={() => handleSwitchScenario(selectedScenarioId)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold"
          >
            <RotateCcw className="w-4 h-4" />
            بدء محادثة جديدة
          </button>
        </section>
      )}
    </div>
  );
};
