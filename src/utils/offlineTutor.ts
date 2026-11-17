import { ALL_VOCAB_ITEMS, BOOK_LESSONS, type RoleplayScenario } from '../data/curriculum';

export interface OfflineTutorReply {
  reply: string;
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

export interface OfflineAdaptiveQuestion {
  promptAr: string;
  englishText?: string;
  options: string[];
  correctIndex: number;
  explanationAr: string;
}

export function buildOfflineTutorReply(params: {
  userText: string | null;
  mode: 'arabic' | 'english';
  studentName: string;
  studentLevel: number;
  currentTopic: string;
  explainInArabic?: boolean;
  simplerExplanation?: boolean;
  scenario?: RoleplayScenario | null;
}): OfflineTutorReply {
  const { userText, mode, studentName, studentLevel, currentTopic, explainInArabic, simplerExplanation, scenario } = params;
  const query = (userText ?? '').trim();
  const qLower = query.toLowerCase();

  // 1) If active roleplay scenario, respond cleanly in character using scenario context
  if (scenario) {
    const replyPool = [
      {
        en: 'Thank you! That is very clear. Would you like anything else?',
        ar: 'شكراً لك! كلامك واضح جداً. هل ترغب في شيء آخر؟',
      },
      {
        en: 'Great! You are speaking very well. Please continue!',
        ar: 'ممتاز! تتحدث الإنجليزية بشكل رائع. واصل!',
      },
      {
        en: 'Of course, I can help you with that right away.',
        ar: 'بالتأكيد، يمكنني مساعدتك في ذلك حالاً.',
      },
      {
        en: scenario.starterPromptEn,
        ar: scenario.descriptionAr,
      },
    ];
    const picked = replyPool[query.length % replyPool.length];
    const enSpeech = picked.en;
    const arTrans = picked.ar;

    return {
      reply:
        mode === 'english' && !explainInArabic
          ? `${enSpeech}\n(${arTrans})`
          : `أحسنت يا ${studentName}! إليك الرد المناسب في سيناريو «${scenario.titleAr}»: ${enSpeech}`,
      englishSpeech: enSpeech,
      arabicTranslation: arTrans,
      newWords: ALL_VOCAB_ITEMS.slice(0, 2).map((w) => ({
        en: w.en,
        ar: w.ar,
        pronunciationAr: w.pronunciationAr,
      })),
      suggestedReplies: ['Yes, please.', 'How much is it?', 'Thank you very much!'],
    };
  }

  // 2) Match any vocabulary word/phrase from the 400-stage curriculum
  if (query.length >= 2) {
    const matchedVocab = ALL_VOCAB_ITEMS.filter(
      (item) =>
        item.en.toLowerCase().includes(qLower) ||
        item.ar.includes(query)
    ).slice(0, 3);

    if (matchedVocab.length > 0) {
      const top = matchedVocab[0];
      return {
        reply: simplerExplanation
          ? `ببساطة يا ${studentName}: كلمة «${top.en}» تعني «${top.ar}» وتُنطق (${top.pronunciationAr}).`
          : `ممتاز يا ${studentName}! كلمة «${top.en}» معناها «${top.ar}» والنطق التقريبي لها (${top.pronunciationAr}).`,
        englishSpeech: top.exampleEn || top.en,
        arabicTranslation: top.exampleAr || top.ar,
        newWords: matchedVocab.map((w) => ({
          en: w.en,
          ar: w.ar,
          pronunciationAr: w.pronunciationAr,
        })),
        suggestedReplies: ['أعطني مثالاً آخر', 'اشرح لي قاعدة أخرى', 'Hello! How are you?'],
      };
    }

    // 3) Match any grammar lesson block
    const matchedLesson = BOOK_LESSONS.find(
      (l) =>
        l.titleAr.includes(query) ||
        l.summaryAr.includes(query) ||
        l.explanationBlocks.some((b) => b.titleAr.includes(query) || b.explanationAr.includes(query))
    );

    if (matchedLesson) {
      const block = matchedLesson.explanationBlocks[0];
      const example = block?.examples[0];
      return {
        reply: `شرح سريع لدرس «${matchedLesson.titleAr}»: ${block?.explanationAr ?? matchedLesson.summaryAr}`,
        englishSpeech: example?.en ?? matchedLesson.items[0]?.en,
        arabicTranslation: example?.ar ?? matchedLesson.items[0]?.ar,
        newWords: matchedLesson.items.slice(0, 3).map((w) => ({
          en: w.en,
          ar: w.ar,
          pronunciationAr: w.pronunciationAr,
        })),
        suggestedReplies: ['أريد أمثلة أكثر', 'اختبرني في هذا الدرس'],
      };
    }
  }

  // 4) Gentle English grammar check for common beginner sentences
  if (/[a-zA-Z]/.test(query)) {
    const needsCap = /^[a-z]/.test(query);
    const hasDoubleSpace = /\s{2,}/.test(query);
    const hasGreeting = /\b(hi|hello|good|name|how|thank|please)\b/i.test(query);
    const corrected = query.charAt(0).toUpperCase() + query.slice(1).replace(/\s{2,}/g, ' ');

    return {
      reply:
        mode === 'english' && !explainInArabic
          ? `Great sentence, ${studentName}! Keep practicing English every day.`
          : `أحسنت المحاولة يا ${studentName}! جملتك ممتازة${hasGreeting ? ' ومناسبة للمحادثة اليومية' : ''}. واصل التحدث بثقة!`,
      englishSpeech: hasGreeting
        ? 'Great! Nice to meet you. How can I help you today?'
        : 'Well done! Keep practicing your English sentences.',
      arabicTranslation: 'عمل رائع! استمر في ممارسة الجمل الإنجليزية.',
      correction:
        needsCap || hasDoubleSpace
          ? {
              hasMistake: true,
              original: query,
              corrected,
              explanationAr: 'في الإنجليزية نبدأ الجملة دائماً بحرف كبير (Capital letter).',
            }
          : undefined,
      suggestedReplies: ['I am fine, thank you.', 'What is your name?', 'اشرح لي بالعربية'],
    };
  }

  // 5) Default encouraging curriculum response (works 100% offline!)
  const levelLesson = BOOK_LESSONS.find((l) => l.levelId === studentLevel) ?? BOOK_LESSONS[0];
  const sampleItem = levelLesson.items[Math.floor(Date.now() / 1000) % levelLesson.items.length];

  return {
    reply: explainInArabic
      ? `أنا معك يا ${studentName} (الوضع السريع بدون إنترنت). نركز الآن على «${currentTopic}» ضمن درس «${levelLesson.titleAr}». تدرّب على نطق هذه العبارة:`
      : `أهلاً يا ${studentName}! المعلم في تطبيق وسيم باقش جاهز دائماً حتى بدون إنترنت. جرّب تكرار هذه العبارة المهمة:`,
    englishSpeech: sampleItem?.en ?? 'Hello! Let us learn English together.',
    arabicTranslation: sampleItem?.ar ?? 'أهلاً! هيا نتعلم الإنجليزية معاً.',
    newWords: levelLesson.items.slice(0, 3).map((w) => ({
      en: w.en,
      ar: w.ar,
      pronunciationAr: w.pronunciationAr,
    })),
    suggestedReplies: [
      sampleItem?.en || 'Hello!',
      `اشرح لي ${levelLesson.titleAr}`,
      'أريد جملة جديدة للمحادثة',
    ],
  };
}

export function buildOfflineAdaptiveQuestions(studentLevel: number): OfflineAdaptiveQuestion[] {
  const levelLessons = BOOK_LESSONS.filter((l) => l.levelId === studentLevel);
  const pool = (levelLessons.length > 0 ? levelLessons : BOOK_LESSONS).flatMap((l) => l.quiz);
  if (pool.length >= 4) {
    return pool.slice(0, 4).map((q) => ({
      promptAr: q.promptAr,
      englishText: q.englishText,
      options: q.options,
      correctIndex: q.correctIndex,
      explanationAr: q.explanationAr,
    }));
  }

  return ALL_VOCAB_ITEMS.slice(0, 4).map((item, idx) => {
    const distractors = ALL_VOCAB_ITEMS.filter((x) => x.id !== item.id)
      .slice(idx * 3, idx * 3 + 3)
      .map((d) => d.ar);
    const options = [item.ar, ...distractors];
    return {
      promptAr: `ما معنى كلمة (${item.en})؟`,
      englishText: item.en,
      options,
      correctIndex: 0,
      explanationAr: `${item.en} تعني: ${item.ar}`,
    };
  });
}
