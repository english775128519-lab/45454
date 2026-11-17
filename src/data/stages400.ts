import type { LearningStage, Lesson, StageKind, VocabItem } from '../types/curriculum';
import { ALL_VOCAB_ITEMS, BOOK_LESSONS, LEVELS, getLessonsForLevel } from './curriculum';

export const TOTAL_STAGES_COUNT = 400;

const LEVEL_STAGE_QUOTAS: Record<number, number> = {
  1: 75,
  2: 65,
  3: 75,
  4: 60,
  5: 65,
  6: 60,
};

const STAGE_KINDS_CYCLE: StageKind[] = ['learn', 'vocab', 'listen', 'arrange', 'review'];

const STAGE_KIND_AR: Record<StageKind, string> = {
  learn: 'تعلّم وفهم',
  vocab: 'إتقان المفردات',
  listen: 'استماع ونطق',
  arrange: 'تركيب وتكوين',
  review: 'مراجعة سريعة',
  boss: 'تحدي الختام',
};

const STAGE_KIND_EN: Record<StageKind, string> = {
  learn: 'Learn & Understand',
  vocab: 'Vocabulary Drill',
  listen: 'Listen & Identify',
  arrange: 'Build & Arrange',
  review: 'Quick Review',
  boss: 'Section Mastery',
};

export function getStageKindLabelAr(kind: StageKind): string {
  return STAGE_KIND_AR[kind];
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(arr: readonly T[], seed: number): T[] {
  const copy = [...arr];
  const rand = mulberry32(seed);
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function distributeCounts(lessons: Lesson[], totalForLevel: number): number[] {
  if (lessons.length === 0) return [];
  const weights = lessons.map((l) => Math.max(8, l.items.length));
  const weightSum = weights.reduce((acc, w) => acc + w, 0);
  const counts = weights.map((w) => Math.max(4, Math.floor((w / weightSum) * totalForLevel)));
  let currentSum = counts.reduce((acc, c) => acc + c, 0);

  let idx = 0;
  while (currentSum < totalForLevel) {
    counts[idx % counts.length] += 1;
    currentSum += 1;
    idx += 1;
  }
  idx = 0;
  while (currentSum > totalForLevel) {
    const pos = idx % counts.length;
    if (counts[pos] > 4) {
      counts[pos] -= 1;
      currentSum -= 1;
    }
    idx += 1;
  }
  return counts;
}

function buildAll400Stages(): LearningStage[] {
  const stages: LearningStage[] = [];
  let globalNumber = 1;

  for (const level of LEVELS) {
    const quota = LEVEL_STAGE_QUOTAS[level.id] ?? 60;
    const lessons = getLessonsForLevel(level.id);
    const counts = distributeCounts(lessons, quota);
    let orderInLevel = 1;

    lessons.forEach((lesson, lessonIdx) => {
      const stageCount = counts[lessonIdx];
      const itemCount = lesson.items.length;
      const sliceSize = Math.min(4, Math.max(3, Math.ceil(itemCount / Math.max(1, Math.ceil(stageCount / 2)))));

      for (let localIdx = 0; localIdx < stageCount; localIdx++) {
        const isLastInLesson = localIdx === stageCount - 1;
        const kind: StageKind =
          localIdx === 0
            ? 'learn'
            : isLastInLesson
            ? 'boss'
            : STAGE_KINDS_CYCLE[localIdx % STAGE_KINDS_CYCLE.length];

        const start = itemCount > 0 ? (localIdx * 2) % itemCount : 0;
        const pickedIds: string[] = [];
        for (let k = 0; k < Math.min(sliceSize, itemCount); k++) {
          const item = lesson.items[(start + k) % itemCount];
          if (!pickedIds.includes(item.id)) {
            pickedIds.push(item.id);
          }
        }

        const ruleCount = lesson.explanationBlocks.length;
        const ruleIndex = ruleCount > 0 ? localIdx % ruleCount : undefined;

        stages.push({
          id: `stage-${globalNumber}`,
          stageNumber: globalNumber,
          levelId: level.id,
          orderInLevel,
          sourceLessonId: lesson.id,
          kind,
          titleAr: `${lesson.titleAr} — ${STAGE_KIND_AR[kind]}`,
          titleEn: `${lesson.titleEn} · ${STAGE_KIND_EN[kind]}`,
          itemIds: pickedIds,
          ruleIndex,
        });

        globalNumber += 1;
        orderInLevel += 1;
      }
    });
  }

  return stages;
}

export const STAGES_400: LearningStage[] = buildAll400Stages();

export const STAGE_BY_ID: Map<string, LearningStage> = new Map(
  STAGES_400.map((s) => [s.id, s])
);

export const STAGE_BY_NUMBER: Map<number, LearningStage> = new Map(
  STAGES_400.map((s) => [s.stageNumber, s])
);

export const STAGES_BY_LEVEL: Record<number, LearningStage[]> = {
  1: STAGES_400.filter((s) => s.levelId === 1),
  2: STAGES_400.filter((s) => s.levelId === 2),
  3: STAGES_400.filter((s) => s.levelId === 3),
  4: STAGES_400.filter((s) => s.levelId === 4),
  5: STAGES_400.filter((s) => s.levelId === 5),
  6: STAGES_400.filter((s) => s.levelId === 6),
};

export const VOCAB_BY_ID: Map<string, VocabItem> = new Map(
  ALL_VOCAB_ITEMS.map((item) => [item.id, item])
);

export const LESSON_BY_ID: Map<string, Lesson> = new Map(
  BOOK_LESSONS.map((l) => [l.id, l])
);

export const STAGES_BY_LESSON_ID: Map<string, LearningStage[]> = (() => {
  const map = new Map<string, LearningStage[]>();
  for (const stage of STAGES_400) {
    const existing = map.get(stage.sourceLessonId);
    if (existing) existing.push(stage);
    else map.set(stage.sourceLessonId, [stage]);
  }
  return map;
})();

export function getStageById(stageId: string): LearningStage | undefined {
  return STAGE_BY_ID.get(stageId);
}

/* ============================================================================
   DETERMINISTIC ZERO-ERROR STAGE EXERCISES BUILDER
   ============================================================================ */

export type StageStep =
  | {
      id: string;
      type: 'preview';
      titleAr: string;
      ruleTitleAr?: string;
      ruleExplanationAr?: string;
      items: VocabItem[];
    }
  | {
      id: string;
      type: 'mcq';
      promptAr: string;
      promptEn?: string;
      speakText?: string;
      listenOnly?: boolean;
      options: string[];
      optionsDir: 'rtl' | 'ltr';
      correctIndex: number;
      explanationAr: string;
      mistakeItem: VocabItem;
    }
  | {
      id: string;
      type: 'arrange';
      mode: 'words' | 'letters';
      promptAr: string;
      targetTokens: string[];
      shuffledTokens: string[];
      fullAnswerEn: string;
      speakText: string;
      explanationAr: string;
      mistakeItem: VocabItem;
    };

function pickUniqueDistractors(
  target: VocabItem,
  field: 'ar' | 'en',
  sameLessonItems: VocabItem[],
  seed: number
): string[] {
  const targetVal = target[field].trim();
  const seen = new Set<string>([targetVal.toLowerCase()]);
  const picked: string[] = [];

  const candidatePool = [
    ...seededShuffle(sameLessonItems, seed),
    ...seededShuffle(ALL_VOCAB_ITEMS, seed + 17).slice(0, 40),
  ];

  for (const cand of candidatePool) {
    const val = cand[field].trim();
    const key = val.toLowerCase();
    if (!val || seen.has(key)) continue;
    seen.add(key);
    picked.push(val);
    if (picked.length === 3) break;
  }

  return picked;
}

function buildMcqStep(
  id: string,
  item: VocabItem,
  mode: 'en-to-ar' | 'ar-to-en' | 'listen-to-ar',
  sameLessonItems: VocabItem[],
  seed: number
): StageStep {
  const field = mode === 'ar-to-en' ? 'en' : 'ar';
  const distractors = pickUniqueDistractors(item, field, sameLessonItems, seed);
  const correctValue = item[field].trim();
  const options = seededShuffle([correctValue, ...distractors], seed + 7);
  const correctIndex = options.indexOf(correctValue);

  if (mode === 'ar-to-en') {
    return {
      id,
      type: 'mcq',
      promptAr: `اختر الإنجليزية الصحيحة لمعنى: "${item.ar}"`,
      options,
      optionsDir: 'ltr',
      correctIndex: Math.max(0, correctIndex),
      explanationAr: `${item.en} تعني "${item.ar}" (${item.pronunciationAr})`,
      mistakeItem: item,
    };
  }

  if (mode === 'listen-to-ar') {
    return {
      id,
      type: 'mcq',
      promptAr: 'استمع إلى النطق ثم اختر المعنى الصحيح:',
      speakText: item.en,
      listenOnly: true,
      options,
      optionsDir: 'rtl',
      correctIndex: Math.max(0, correctIndex),
      explanationAr: `الكلمة المنطوقة هي "${item.en}" وتعني: ${item.ar}`,
      mistakeItem: item,
    };
  }

  return {
    id,
    type: 'mcq',
    promptAr: 'ما معنى هذه الكلمة أو العبارة؟',
    promptEn: item.en,
    speakText: item.en,
    options,
    optionsDir: 'rtl',
    correctIndex: Math.max(0, correctIndex),
    explanationAr: `${item.en} تعني "${item.ar}" (${item.pronunciationAr})`,
    mistakeItem: item,
  };
}

function tryBuildArrangeStep(
  id: string,
  item: VocabItem,
  seed: number
): StageStep | null {
  const clean = item.en.trim();
  if (clean.includes('/') || clean.includes('(') || clean.includes('—')) {
    return null;
  }

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2 && words.length <= 6) {
    const shuffled = seededShuffle(words, seed + 13);
    if (shuffled.join(' ') === words.join(' ') && shuffled.length > 1) {
      [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
    }
    return {
      id,
      type: 'arrange',
      mode: 'words',
      promptAr: `رتّب الكلمات لتكوين معنى: "${item.ar}"`,
      targetTokens: words,
      shuffledTokens: shuffled,
      fullAnswerEn: clean,
      speakText: clean,
      explanationAr: `الترتيب الصحيح: ${clean}`,
      mistakeItem: item,
    };
  }

  if (words.length === 1 && /^[A-Za-z]{3,8}$/.test(clean)) {
    const letters = clean.split('');
    const shuffled = seededShuffle(letters, seed + 19);
    if (shuffled.join('') === letters.join('') && shuffled.length > 1) {
      [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
    }
    return {
      id,
      type: 'arrange',
      mode: 'letters',
      promptAr: `رتّب الحروف لكتابة كلمة "${item.ar}"`,
      targetTokens: letters,
      shuffledTokens: shuffled,
      fullAnswerEn: clean,
      speakText: clean,
      explanationAr: `الكلمة الصحيحة: ${clean} (${item.pronunciationAr})`,
      mistakeItem: item,
    };
  }

  return null;
}

export function buildStageExercises(stage: LearningStage): StageStep[] {
  const lesson = LESSON_BY_ID.get(stage.sourceLessonId) ?? BOOK_LESSONS[0];
  const stageItems = stage.itemIds
    .map((id) => VOCAB_BY_ID.get(id))
    .filter((v): v is VocabItem => Boolean(v));

  const activeItems = stageItems.length > 0 ? stageItems : lesson.items.slice(0, 3);
  const steps: StageStep[] = [];
  const baseSeed = stage.stageNumber * 97;

  // 1) Quick Learn Card at start of 'learn' stages
  if (stage.kind === 'learn') {
    const rule =
      stage.ruleIndex !== undefined
        ? lesson.explanationBlocks[stage.ruleIndex]
        : lesson.explanationBlocks[0];
    steps.push({
      id: `${stage.id}-preview`,
      type: 'preview',
      titleAr: 'كلمات ومفاهيم هذه المرحلة',
      ruleTitleAr: rule?.titleAr,
      ruleExplanationAr: rule?.explanationAr,
      items: activeItems,
    });
  }

  // 2) Interactive Drills based on stage kind
  activeItems.forEach((item, idx) => {
    const stepSeed = baseSeed + idx * 13;
    if (stage.kind === 'listen') {
      steps.push(
        buildMcqStep(
          `${stage.id}-q-${idx}`,
          item,
          idx % 2 === 0 ? 'listen-to-ar' : 'en-to-ar',
          lesson.items,
          stepSeed
        )
      );
    } else if (stage.kind === 'arrange') {
      const arrange = tryBuildArrangeStep(`${stage.id}-arr-${idx}`, item, stepSeed);
      if (arrange) {
        steps.push(arrange);
      } else {
        steps.push(buildMcqStep(`${stage.id}-q-${idx}`, item, 'ar-to-en', lesson.items, stepSeed));
      }
    } else if (stage.kind === 'vocab') {
      steps.push(
        buildMcqStep(
          `${stage.id}-q-${idx}`,
          item,
          idx % 2 === 0 ? 'en-to-ar' : 'ar-to-en',
          lesson.items,
          stepSeed
        )
      );
    } else if (stage.kind === 'review' || stage.kind === 'boss') {
      if (idx === 1) {
        const arrange = tryBuildArrangeStep(`${stage.id}-arr-${idx}`, item, stepSeed);
        if (arrange) {
          steps.push(arrange);
          return;
        }
      }
      steps.push(
        buildMcqStep(
          `${stage.id}-q-${idx}`,
          item,
          idx === 0 ? 'listen-to-ar' : idx % 2 === 0 ? 'en-to-ar' : 'ar-to-en',
          lesson.items,
          stepSeed
        )
      );
    } else {
      // 'learn' stage drills
      steps.push(
        buildMcqStep(
          `${stage.id}-q-${idx}`,
          item,
          idx === 0 ? 'en-to-ar' : idx === 1 ? 'ar-to-en' : 'listen-to-ar',
          lesson.items,
          stepSeed
        )
      );
    }
  });

  // 3) Include a real textbook quiz check on 'review' and 'boss' stages if available
  if ((stage.kind === 'review' || stage.kind === 'boss') && lesson.quiz.length > 0) {
    const q = lesson.quiz[stage.stageNumber % lesson.quiz.length];
    const fallbackItem = activeItems[0];
    steps.push({
      id: `${stage.id}-rulequiz`,
      type: 'mcq',
      promptAr: q.promptAr,
      promptEn: q.englishText,
      speakText: q.englishText,
      options: q.options,
      optionsDir: 'rtl',
      correctIndex: q.correctIndex,
      explanationAr: q.explanationAr,
      mistakeItem: fallbackItem,
    });
  }

  return steps;
}
