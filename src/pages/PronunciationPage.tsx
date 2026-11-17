import React, { useState } from 'react';
import { Volume2, Gauge, Mic, Square, AudioLines, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ALL_VOCAB_ITEMS } from '../data/curriculum';
import { ENGLISH_ALPHABET } from '../data/alphabetAndPhonetics';
import {
  evaluateSpokenMatch,
  speakEnglish,
  speakSlowEnglish,
  startAudioRecording,
  startSpeechRecognition,
} from '../utils/speech';

export const PronunciationPage: React.FC = () => {
  const { activeProfile, addXp } = useApp();
  const [selectedTab, setSelectedTab] = useState<'words' | 'letters'>('words');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [matchResult, setMatchResult] = useState<{ score: number; isMatch: boolean } | null>(null);
  const [micNote, setMicNote] = useState('');
  const [recCtrl, setRecCtrl] = useState<{ stop: () => Promise<string | null> } | null>(null);
  const [sttCtrl, setSttCtrl] = useState<{ stop: () => void } | null>(null);

  if (!activeProfile) return null;

  const voiceAccent = activeProfile.settings.voiceAccent;
  const speechRate = activeProfile.settings.speechRate;

  const list = selectedTab === 'letters'
    ? ENGLISH_ALPHABET.map((a) => ({
        id: a.capital,
        en: `${a.sampleWord}`,
        displayTitle: `${a.capital} ${a.small} — ${a.sampleWord}`,
        ar: `${a.sampleMeaningAr}`,
        pronunciationAr: a.pronunciationAr,
      }))
    : ALL_VOCAB_ITEMS.slice(0, 60).map((w) => ({
        id: w.id,
        en: w.en,
        displayTitle: w.en,
        ar: w.ar,
        pronunciationAr: w.pronunciationAr,
      }));

  const current = list[selectedIndex % list.length];

  const handleStart = async () => {
    setMicNote('');
    setTranscript('');
    setMatchResult(null);
    setRecording(true);
    try {
      const r = await startAudioRecording();
      setRecCtrl(r);
    } catch {
      // ignore if recorder unavailable
    }

    const s = startSpeechRecognition({
      lang: voiceAccent,
      onResult: (txt, isFinal) => {
        setTranscript(txt);
        if (isFinal) {
          const res = evaluateSpokenMatch(txt, current.en);
          setMatchResult({ score: res.score, isMatch: res.isMatch });
          if (res.isMatch) addXp(8);
        }
      },
      onError: (msg) => setMicNote(msg),
      onEnd: () => setRecording(false),
    });
    setSttCtrl(s);
  };

  const handleStop = async () => {
    sttCtrl?.stop();
    if (recCtrl) {
      const url = await recCtrl.stop();
      if (url) setAudioUrl(url);
      setRecCtrl(null);
    }
    setRecording(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <AudioLines className="w-7 h-7 text-indigo-600" />
            مختبر الاستماع والنطق
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            استمع للنطق العادي والبطيء، شاهد دليل النطق العربي من الملزمة، وسجل صوتك لتسمع نفسك وتطابق الكلمة.
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1">
          <button
            type="button"
            onClick={() => {
              setSelectedTab('words');
              setSelectedIndex(0);
              setAudioUrl(null);
              setTranscript('');
              setMatchResult(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-bold ${
              selectedTab === 'words' ? 'bg-teal-700 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            الكلمات والعبارات
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedTab('letters');
              setSelectedIndex(0);
              setAudioUrl(null);
              setTranscript('');
              setMatchResult(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-bold ${
              selectedTab === 'letters' ? 'bg-teal-700 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            الحروف الـ 26
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Practice Card */}
        <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div className="p-6 rounded-2xl bg-[#F8F7F4] dark:bg-slate-800 text-center space-y-2.5">
            <p dir="ltr" className="font-english text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">
              {current.displayTitle}
            </p>
            <p className="text-xl font-extrabold text-teal-700 dark:text-teal-400">{current.ar}</p>
            <p className="text-base font-semibold text-slate-700 dark:text-slate-200">
              طريقة النطق العربية: {current.pronunciationAr}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => speakEnglish(current.en, { rate: speechRate, lang: voiceAccent })}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-base"
            >
              <Volume2 className="w-5 h-5" />
              استمع للنطق العادي
            </button>
            <button
              type="button"
              onClick={() => speakSlowEnglish(current.en, voiceAccent)}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 font-extrabold text-base hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Gauge className="w-4 h-4" />
              نطق بطيء للتدريب
            </button>
            {!recording ? (
              <button
                type="button"
                onClick={handleStart}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm"
              >
                <Mic className="w-4 h-4" />
                سجل صوتك الآن
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStop}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm"
              >
                <Square className="w-4 h-4" />
                إيقاف التسجيل
              </button>
            )}
          </div>

          {micNote && <p className="text-xs text-amber-700 dark:text-amber-400 text-center">{micNote}</p>}

          {transcript && (
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 space-y-1.5 text-center">
              <p className="text-sm">
                الكلمة الملتقطة عبر المتصفح:{' '}
                <span dir="ltr" className="font-english font-bold">
                  {transcript}
                </span>
              </p>
              {matchResult && (
                <p
                  className={`font-bold text-sm font-numeric ${
                    matchResult.isMatch ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  نسبة التطابق النصي: {matchResult.score}% —{' '}
                  {matchResult.isMatch ? 'تطابق ممتاز!' : 'جرب النطق البطئ ثم أعد المحاولة'}
                </p>
              )}
            </div>
          )}

          {audioUrl && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-slate-500">اسمع تسجيلك للمقارنة مع النطق الأصلي:</p>
              <audio controls src={audioUrl} className="w-full h-10" />
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <span>
              تنويه علمي صادق: يعتمد التقييم هنا على محرك التعرف النصي في المتصفح (Speech-to-Text) لمطابقة الكلمة المسموعة مع الكلمة المطلوبة، بالإضافة إلى تشغيل صوتك المسجل لتقارنه شخصياً بالنطق الصحيح، ولا يغني عن التحليل الصوتي للمخارج في الاستوديوهات المتخصصة.
            </span>
          </div>
        </section>

        {/* Selector List */}
        <aside className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <h2 className="text-lg font-extrabold">اختر عنصراً للتدريب</h2>
          <div className="space-y-2 max-h-[460px] overflow-y-auto pl-1">
            {list.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedIndex(idx);
                  setTranscript('');
                  setMatchResult(null);
                  setAudioUrl(null);
                }}
                className={`w-full p-3.5 rounded-xl border text-right flex items-center justify-between gap-2 transition-colors ${
                  idx === selectedIndex
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'border-slate-200 dark:border-slate-700 hover:border-teal-600'
                }`}
              >
                <span className="text-sm sm:text-base font-bold truncate">{item.ar}</span>
                <span dir="ltr" className="font-english font-extrabold text-base shrink-0">
                  {item.displayTitle}
                </span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};
