import React, { useMemo, useState } from 'react';
import { Search, Volume2, Star, CheckCircle2, Gauge } from 'lucide-react';
import { ALL_VOCAB_ITEMS } from '../data/curriculum';
import { useApp } from '../context/AppContext';
import { speakEnglish, speakSlowEnglish } from '../utils/speech';

export const DictionaryPage: React.FC = () => {
  const { activeProfile, toggleFavoriteWord, toggleLearnedWord } = useApp();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(ALL_VOCAB_ITEMS.map((i) => i.category)));
    return ['الكل', ...cats];
  }, []);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_VOCAB_ITEMS.filter((item) => {
      if (selectedCategory !== 'الكل' && item.category !== selectedCategory) return false;
      if (onlyFavorites && !(activeProfile?.favoriteWordIds.includes(item.id) ?? false)) return false;
      if (!q) return true;
      return (
        item.en.toLowerCase().includes(q) ||
        item.ar.toLowerCase().includes(q) ||
        item.pronunciationAr.toLowerCase().includes(q)
      );
    });
  }, [query, selectedCategory, onlyFavorites, activeProfile?.favoriteWordIds]);

  const suggestions = useMemo(() => {
    if (query.trim().length < 2) return [];
    return filteredItems.slice(0, 5);
  }, [query, filteredItems]);

  if (!activeProfile) return null;

  const voiceAccent = activeProfile.settings.voiceAccent;
  const speechRate = activeProfile.settings.speechRate;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Search className="w-7 h-7 text-sky-600" />
          القاموس الذكي للمنهج
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          ابحث فوراً بالعربية أو الإنجليزية في <span className="font-numeric font-bold">{ALL_VOCAB_ITEMS.length}</span> كلمة وعبارة من الكتاب مع النطق الصوتي والمفضلة.
        </p>
      </div>

      {/* Search & Filter Controls */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute right-4 top-3.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن كلمة إنجليزية أو معنى عربي... (مثال: Hotel, مطار, Book)"
            className="w-full pr-12 pl-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F8F7F4] dark:bg-slate-800 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
          {suggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {suggestions.map((sug) => (
                <button
                  key={sug.id}
                  type="button"
                  onClick={() => setQuery(sug.en)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold hover:bg-teal-50"
                >
                  <span dir="ltr" className="font-english font-bold">
                    {sug.en}
                  </span>{' '}
                  — {sug.ar}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
              aria-label="تصفية حسب القسم"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  القسم: {cat}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setOnlyFavorites((f) => !f)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-semibold ${
                onlyFavorites
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-800 dark:text-amber-300'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
            >
              <Star className="w-4 h-4" fill={onlyFavorites ? 'currentColor' : 'none'} />
              المفضلة ({activeProfile.favoriteWordIds.length})
            </button>
          </div>

          <span className="font-numeric text-xs font-bold text-slate-500">
            النتائج: {filteredItems.length}
          </span>
        </div>
      </div>

      {/* Dictionary Results */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center space-y-2">
          <p className="font-bold text-lg">لا توجد كلمات مطابقة لبحثك</p>
          <p className="text-sm text-slate-500">جرّب كتابة كلمة أخرى أو اختيار «الكل» في التصنيفات.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.slice(0, 80).map((item) => {
            const isFav = activeProfile.favoriteWordIds.includes(item.id);
            const isLearned = activeProfile.learnedWordIds.includes(item.id);

            return (
              <div
                key={item.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{item.category}</span>
                    <p dir="ltr" className="font-english text-2xl font-extrabold text-slate-900 dark:text-white text-right">
                      {item.en}
                    </p>
                    <p className="text-lg font-extrabold text-teal-700 dark:text-teal-400">{item.ar}</p>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                      النطق التقريبي: {item.pronunciationAr}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleFavoriteWord(item.id)}
                      className={`p-2 rounded-lg ${
                        isFav ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' : 'text-slate-400'
                      }`}
                      aria-label="المفضلة"
                    >
                      <Star className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleLearnedWord(item.id)}
                      className={`p-2 rounded-lg ${
                        isLearned ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' : 'text-slate-400'
                      }`}
                      aria-label="تم الحفظ"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {item.exampleEn && (
                  <div className="p-3 rounded-xl bg-[#F8F7F4] dark:bg-slate-800 text-sm space-y-1">
                    <p dir="ltr" className="font-english font-bold text-right">
                      {item.exampleEn}
                    </p>
                    {item.exampleAr && <p className="text-slate-600 dark:text-slate-300">{item.exampleAr}</p>}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => speakEnglish(item.en, { rate: speechRate, lang: voiceAccent })}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-bold"
                  >
                    <Volume2 className="w-4 h-4" />
                    استمع
                  </button>
                  <button
                    type="button"
                    onClick={() => speakSlowEnglish(item.en, voiceAccent)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                  >
                    <Gauge className="w-3.5 h-3.5" />
                    بطيء
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
