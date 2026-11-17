export type PageId =
  | 'welcome'
  | 'auth'
  | 'home'
  | 'levels'
  | 'lessons'
  | 'lesson-detail'
  | 'stage-player'
  | 'games'
  | 'ai-tutor'
  | 'voice-chat'
  | 'pronunciation'
  | 'dictionary'
  | 'exams'
  | 'review'
  | 'achievements'
  | 'progress'
  | 'settings';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface VocabItem {
  id: string;
  en: string;
  ar: string;
  pronunciationAr: string;
  category: string;
  lessonId: string;
  exampleEn?: string;
  exampleAr?: string;
  illustrationKey?: string;
  isPhrase?: boolean;
}

export interface GrammarRuleBlock {
  titleAr: string;
  explanationAr: string;
  examples: {
    en: string;
    ar: string;
    pronunciationAr?: string;
    noteAr?: string;
  }[];
}

export interface DialogueExchange {
  speaker: 'A' | 'B';
  speakerLabelAr: string;
  en: string;
  ar: string;
  pronunciationAr: string;
}

export interface LessonQuizQuestion {
  id: string;
  type: 'mcq' | 'fill' | 'true_false';
  promptAr: string;
  englishText?: string;
  options: string[];
  correctIndex: number;
  explanationAr: string;
  relatedItemId?: string;
}

export interface Lesson {
  id: string;
  levelId: number;
  order: number;
  titleAr: string;
  titleEn: string;
  bookPages: string;
  isExtra?: boolean;
  summaryAr: string;
  explanationBlocks: GrammarRuleBlock[];
  items: VocabItem[];
  dialogue?: DialogueExchange[];
  quiz: LessonQuizQuestion[];
}

export interface Level {
  id: number;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  bookSectionAr: string;
  requiredScoreToPass: number;
  isExtra?: boolean;
}

export type StageKind = 'learn' | 'vocab' | 'listen' | 'arrange' | 'review' | 'boss';

export interface LearningStage {
  id: string;
  stageNumber: number;
  levelId: number;
  orderInLevel: number;
  sourceLessonId: string;
  kind: StageKind;
  titleAr: string;
  titleEn: string;
  itemIds: string[];
  ruleIndex?: number;
}

export interface MistakeRecord {
  id: string;
  en: string;
  ar: string;
  pronunciationAr?: string;
  lessonId: string;
  source: 'lesson' | 'game' | 'exam' | 'conversation';
  mistakeCount: number;
  lastMissedAt: string;
  noteAr?: string;
}

export interface ExamResultRecord {
  id: string;
  examType: string;
  titleAr: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  dateIso: string;
  weakLessonIds: string[];
  mistakesSummary: { promptAr: string; chosen: string; correct: string }[];
}

export interface AchievementBadge {
  id: string;
  titleAr: string;
  descriptionAr: string;
  iconName: string;
  xpReward: number;
  conditionLabelAr: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  isGuest: boolean;
  createdAt: string;
  xp: number;
  stars: number;
  streakDays: number;
  lastActiveDate: string;
  completedLessonIds: string[];
  completedStageIds?: string[];
  passedLevelIds: number[];
  unlockedLevelId: number;
  lastVisitedLessonId: string | null;
  lastVisitedStageId?: string | null;
  favoriteWordIds: string[];
  learnedWordIds: string[];
  mistakes: MistakeRecord[];
  examHistory: ExamResultRecord[];
  unlockedBadgeIds: string[];
  dailyLessonsToday: number;
  dailyGamesToday: number;
  gamesWonCount: number;
  settings: {
    theme: 'light' | 'dark';
    speechRate: number;
    voiceAccent: 'en-US' | 'en-GB';
    strictProgression: boolean;
    fontSize?: 'normal' | 'large' | 'xlarge';
    soundEffects?: boolean;
  };
}
