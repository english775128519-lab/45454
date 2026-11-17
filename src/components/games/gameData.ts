import type { DifficultyLevel, VocabItem } from '../../types/curriculum';
import { ALL_VOCAB_ITEMS, BOOK_LESSONS } from '../../data/curriculum';

export interface GameReport {
  gameId: number;
  gameTitleAr: string;
  correctCount: number;
  wrongCount: number;
  durationSec: number;
  xpEarned: number;
  mistakes: { en: string; ar: string; lessonId: string }[];
}

export interface SentenceOrderQuestion {
  id: string;
  words: string[];
  correctSentence: string;
  meaningAr: string;
  lessonId: string;
  difficulty: DifficultyLevel;
}

export interface FillBlankQuestion {
  id: string;
  sentenceBefore: string;
  sentenceAfter: string;
  options: string[];
  correctOption: string;
  meaningAr: string;
  lessonId: string;
  difficulty: DifficultyLevel;
}

export interface SpotErrorQuestion {
  id: string;
  wrongSentence: string;
  options: string[];
  correctIndex: number;
  explanationAr: string;
  lessonId: string;
  difficulty: DifficultyLevel;
}

export interface TrueFalseQuestion {
  id: string;
  statementAr: string;
  englishSample: string;
  isTrue: boolean;
  explanationAr: string;
  lessonId: string;
  difficulty: DifficultyLevel;
}

export interface DialogueFillQuestion {
  id: string;
  contextAr: string;
  speakerAEn: string;
  speakerAAr: string;
  options: string[];
  correctIndex: number;
  explanationAr: string;
  lessonId: string;
  difficulty: DifficultyLevel;
}

export interface SentenceChallengePrompt {
  id: string;
  situationAr: string;
  targetSample: string;
  keywords: string[];
  lessonId: string;
  difficulty: DifficultyLevel;
}

export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getSimpleVocabPool(difficulty: DifficultyLevel): VocabItem[] {
  const singleWords = ALL_VOCAB_ITEMS.filter(
    (item) => !item.en.includes('/') && !item.en.includes('=') && item.en.trim().split(' ').length <= 3
  );

  if (difficulty === 'easy') {
    const easyIds = new Set(BOOK_LESSONS.filter((l) => l.levelId <= 3).map((l) => l.id));
    return singleWords.filter((i) => easyIds.has(i.lessonId));
  }
  if (difficulty === 'medium') {
    const medIds = new Set(BOOK_LESSONS.filter((l) => l.levelId >= 2 && l.levelId <= 5).map((l) => l.id));
    return singleWords.filter((i) => medIds.has(i.lessonId));
  }
  return singleWords;
}

export function getCleanEnglishWord(raw: string): string {
  return raw.split('/')[0].split('(')[0].trim();
}

export const SENTENCE_ORDER_BANK: SentenceOrderQuestion[] = [
  { id: 'so1', words: ['How', 'are', 'you', 'today?'], correctSentence: 'How are you today?', meaningAr: 'كيف حالك اليوم؟', lessonId: 'l3-greetings', difficulty: 'easy' },
  { id: 'so2', words: ['I', 'am', 'from', 'Egypt.'], correctSentence: 'I am from Egypt.', meaningAr: 'أنا من مصر.', lessonId: 'l3-countries', difficulty: 'easy' },
  { id: 'so3', words: ['She', 'reads', 'a', 'book.'], correctSentence: 'She reads a book.', meaningAr: 'هي تقرأ كتاباً.', lessonId: 'l2-nouns-plural', difficulty: 'easy' },
  { id: 'so4', words: ['Good', 'morning,', 'my', 'friend.'], correctSentence: 'Good morning, my friend.', meaningAr: 'صباح الخير يا صديقي.', lessonId: 'l3-greetings', difficulty: 'easy' },
  { id: 'so5', words: ['What', 'time', 'is', 'it', 'now?'], correctSentence: 'What time is it now?', meaningAr: 'كم الساعة الآن؟', lessonId: 'l3-numbers-time', difficulty: 'medium' },
  { id: 'so6', words: ['Where', 'is', 'the', 'nearest', 'hospital?'], correctSentence: 'Where is the nearest hospital?', meaningAr: 'أين أقرب مستشفى؟', lessonId: 'l4-street', difficulty: 'medium' },
  { id: 'so7', words: ['A', 'table', 'for', 'two,', 'please.'], correctSentence: 'A table for two, please.', meaningAr: 'مائدة لشخصين، من فضلك.', lessonId: 'l5-restaurant', difficulty: 'medium' },
  { id: 'so8', words: ['I', 'have', 'lost', 'my', 'passport.'], correctSentence: 'I have lost my passport.', meaningAr: 'لقد فقدت جواز سفري.', lessonId: 'l4-public-services', difficulty: 'hard' },
  { id: 'so9', words: ['Can', 'you', 'put', 'me', 'through?'], correctSentence: 'Can you put me through?', meaningAr: 'هل يمكنك توصيلي (بالمكالمة)؟', lessonId: 'l4-bookshop-phone', difficulty: 'hard' },
  { id: 'so10', words: ['I', 'have', 'nothing', 'to', 'declare.'], correctSentence: 'I have nothing to declare.', meaningAr: 'ليس لدي ما أصرح عنه للجمارك.', lessonId: 'l5-airport', difficulty: 'hard' },
];

export const FILL_BLANK_BANK: FillBlankQuestion[] = [
  { id: 'fb1', sentenceBefore: 'I am', sentenceAfter: 'Egypt.', options: ['from', 'on', 'under', 'between'], correctOption: 'from', meaningAr: 'أنا من مصر.', lessonId: 'l3-countries', difficulty: 'easy' },
  { id: 'fb2', sentenceBefore: 'He is', sentenceAfter: 'apple.', options: ['an', 'a', 'the', 'two'], correctOption: 'an', meaningAr: 'كلمة apple تبدأ بحرف متحرك فتأخذ an.', lessonId: 'l2-articles', difficulty: 'easy' },
  { id: 'fb3', sentenceBefore: 'How', sentenceAfter: 'you today?', options: ['are', 'is', 'am', 'be'], correctOption: 'are', meaningAr: 'كيف حالك اليوم؟', lessonId: 'l2-verbs-pronouns', difficulty: 'easy' },
  { id: 'fb4', sentenceBefore: 'No', sentenceAfter: 'in the hospital.', options: ['Smoking', 'Apple', 'Pillow', 'Bread'], correctOption: 'Smoking', meaningAr: 'ممنوع التدخين في المستشفى.', lessonId: 'l4-signs', difficulty: 'medium' },
  { id: 'fb5', sentenceBefore: 'Bring me the', sentenceAfter: ', please.', options: ['bill', 'platform', 'envelope', 'stamp'], correctOption: 'bill', meaningAr: 'أحضر لي الحساب (الفاتورة) من فضلك.', lessonId: 'l5-restaurant', difficulty: 'medium' },
  { id: 'fb6', sentenceBefore: 'I want a single', sentenceAfter: 'with a bath.', options: ['room', 'street', 'cloud', 'shoe'], correctOption: 'room', meaningAr: 'أريد غرفة مفردة بحمام.', lessonId: 'l5-hotel', difficulty: 'medium' },
  { id: 'fb7', sentenceBefore: 'Take this', sentenceAfter: 'to the pharmacy.', options: ['prescription', 'passport', 'menu', 'suitcase'], correctOption: 'prescription', meaningAr: 'خذ هذه الوصفة الطبية إلى الصيدلية.', lessonId: 'l6-doctor-body', difficulty: 'hard' },
  { id: 'fb8', sentenceBefore: 'Can you make it', sentenceAfter: 'per kilo?', options: ['cheaper', 'salty', 'foggy', 'asleep'], correctOption: 'cheaper', meaningAr: 'هل يمكنك جعله أرخص للكيلو؟', lessonId: 'l6-home-market', difficulty: 'hard' },
];

export const SPOT_ERROR_BANK: SpotErrorQuestion[] = [
  { id: 'se1', wrongSentence: 'I are a student.', options: ['I am a student.', 'I is a student.', 'I be a student.', 'Me am a student.'], correctIndex: 0, explanationAr: 'الضمير I يأخذ دائماً am في المضارع: I am.', lessonId: 'l2-verbs-pronouns', difficulty: 'easy' },
  { id: 'se2', wrongSentence: 'She have an book.', options: ['She has a book.', 'She have a book.', 'She has an book.', 'She are a book.'], correctIndex: 0, explanationAr: 'She تأخذ has وليس have، وكلمة book تبدأ بساكن فتأخذ a.', lessonId: 'l2-articles', difficulty: 'easy' },
  { id: 'se3', wrongSentence: 'Two knife are on the table.', options: ['Two knives are on the table.', 'Two knifes is on the table.', 'Two knife is on the table.', 'Two knive are on the table.'], correctIndex: 0, explanationAr: 'جمع كلمة knife المنتهية بـ fe هو knives.', lessonId: 'l2-nouns-plural', difficulty: 'medium' },
  { id: 'se4', wrongSentence: 'There are three childs here.', options: ['There are three children here.', 'There is three child here.', 'There are three childes here.', 'There am three children here.'], correctIndex: 0, explanationAr: 'جمع كلمة child الشاذ هو children.', lessonId: 'l2-nouns-plural', difficulty: 'medium' },
  { id: 'se5', wrongSentence: 'He don’t speak English.', options: ["He doesn't speak English.", "He don't speaks English.", "He isn't speak English.", "He no speak English."], correctIndex: 0, explanationAr: 'الضمير المفرد الغائب He ينفى باستخدام doesn’t وليس don’t.', lessonId: 'extra-questions-negatives', difficulty: 'hard' },
  { id: 'se6', wrongSentence: 'I have nothing for declare.', options: ['I have nothing to declare.', 'I has nothing to declare.', 'I have nothing at declare.', 'I am nothing to declare.'], correctIndex: 0, explanationAr: 'الصيغة الصحيحة في المطار هي: I have nothing to declare.', lessonId: 'l5-airport', difficulty: 'hard' },
];

export const TRUE_FALSE_BANK: TrueFalseQuestion[] = [
  { id: 'tf1', statementAr: 'حرف K لا يُنطق إذا جاء في أول الكلمة وبعده حرف N مثل Knife.', englishSample: 'Knife (نايف)', isTrue: true, explanationAr: 'صحيح تماماً: حرف K صامت قبل N كما في Knife و Knock.', lessonId: 'l1-consonants-single', difficulty: 'easy' },
  { id: 'tf2', statementAr: 'كلمة Honest تُنطق بالهاء في بدايتها.', englishSample: 'Honest (أونست)', isTrue: false, explanationAr: 'خطأ: حرف H صامت في Honest و Hour.', lessonId: 'l1-vowels-i-o-u-y-h', difficulty: 'easy' },
  { id: 'tf3', statementAr: 'التركيب Ph يُنطق مثل حرف الفاء (F) كما في Elephant.', englishSample: 'Elephant / Phone', isTrue: true, explanationAr: 'صحيح: الحرفان Ph يُنطقان فاءً.', lessonId: 'l1-consonant-clusters', difficulty: 'easy' },
  { id: 'tf4', statementAr: 'كلمة Sheep تُجمع بإضافة S لتصبح Sheeps.', englishSample: 'Sheep -> Sheep', isTrue: false, explanationAr: 'خطأ: كلمة Sheep لا تتغير في الجمع (مفردها مثل جمعها).', lessonId: 'l2-nouns-plural', difficulty: 'medium' },
  { id: 'tf5', statementAr: 'عبارة Out of order في اللافتات تعني الدخول مجاناً.', englishSample: 'Out of order', isTrue: false, explanationAr: 'خطأ: Out of order تعني معطل / لا يعمل، بينما Admission Free تعني الدخول مجاناً.', lessonId: 'l4-signs', difficulty: 'medium' },
  { id: 'tf6', statementAr: 'في المطعم تعني عبارة The bill, please أحضر لي الحساب.', englishSample: 'The bill, please', isTrue: true, explanationAr: 'صحيح: Bill تعني الفاتورة أو الحساب.', lessonId: 'l5-restaurant', difficulty: 'medium' },
  { id: 'tf7', statementAr: 'كلمة Receipt (إيصال) يُنطق فيها حرف P بوضوح.', englishSample: 'Receipt (ريسيت)', isTrue: false, explanationAr: 'خطأ: حرف P صامت في كلمة Receipt.', lessonId: 'l5-hotel', difficulty: 'hard' },
  { id: 'tf8', statementAr: 'كلمة Customs official تعني موظف الجمارك في المطار.', englishSample: 'Customs official', isTrue: true, explanationAr: 'صحيح: موظف الجمارك هو Customs official.', lessonId: 'l5-airport', difficulty: 'hard' },
];

export const DIALOGUE_FILL_BANK: DialogueFillQuestion[] = [
  {
    id: 'df1',
    contextAr: 'التحية بين الأصدقاء',
    speakerAEn: 'Hello! How are you today?',
    speakerAAr: 'أهلاً! كيف حالك اليوم؟',
    options: ['Very well, thank you.', 'No Smoking.', 'Out of order.', 'Wrong number.'],
    correctIndex: 0,
    explanationAr: 'الرد الطبيعي على How are you? هو Very well, thank you.',
    lessonId: 'l3-greetings',
    difficulty: 'easy',
  },
  {
    id: 'df2',
    contextAr: 'السؤال عن البلد',
    speakerAEn: 'Where are you from?',
    speakerAAr: 'من أين أنت؟',
    options: ["I'm from Egypt.", 'Good night.', 'A single ticket.', 'It is foggy.'],
    correctIndex: 0,
    explanationAr: 'نرد على Where are you from? بـ I’m from + اسم البلد.',
    lessonId: 'l3-countries',
    difficulty: 'easy',
  },
  {
    id: 'df3',
    contextAr: 'في الفندق',
    speakerAEn: 'Would you like a single room or a double room?',
    speakerAAr: 'هل تفضل غرفة مفردة أم مزدوجة؟',
    options: ['A single room with a bath, please.', 'Two kilos of apples.', 'Breathe deeply.', 'Keep off the grass.'],
    correctIndex: 0,
    explanationAr: 'في الفندق نختار نوع الغرفة: A single room with a bath, please.',
    lessonId: 'l5-hotel',
    difficulty: 'medium',
  },
  {
    id: 'df4',
    contextAr: 'في المطعم',
    speakerAEn: 'How would you like your steak?',
    speakerAAr: 'كيف تفضل شريحة اللحم؟',
    options: ['Well done, please.', 'Turn left at the crossroads.', 'I lost my passport.', 'The line is busy.'],
    correctIndex: 0,
    explanationAr: 'في المطعم نختار درجة طهي اللحم مثل Well done أو Medium.',
    lessonId: 'l5-restaurant',
    difficulty: 'medium',
  },
  {
    id: 'df5',
    contextAr: 'في المطار والجمارك',
    speakerAEn: 'Do you have anything to declare?',
    speakerAAr: 'هل معك ما يستوجب التصريح الجمركي؟',
    options: ['No, I have nothing to declare.', 'Wrap it up.', 'Put me through.', 'Mashed potatoes.'],
    correctIndex: 0,
    explanationAr: 'الرد القياسي في الجمارك: No, I have nothing to declare.',
    lessonId: 'l5-airport',
    difficulty: 'hard',
  },
  {
    id: 'df6',
    contextAr: 'في السوق',
    speakerAEn: 'Can I help you find something?',
    speakerAAr: 'هل يمكنني مساعدتك في إيجاد شيء ما؟',
    options: ["No thank you, I'm just looking.", 'Return ticket.', 'Emergency exit.', 'My tonsils hurt.'],
    correctIndex: 0,
    explanationAr: 'عند التفرج على البضاعة تقول: No thank you, I’m just looking.',
    lessonId: 'l6-home-market',
    difficulty: 'hard',
  },
];

export const SENTENCE_CHALLENGE_PROMPTS: SentenceChallengePrompt[] = [
  { id: 'sc1', situationAr: 'عرّف بنفسك واذكر بلدك بالإنجليزية.', targetSample: 'Hello, my name is Ali and I am from Egypt.', keywords: ['name', 'from'], lessonId: 'l3-countries', difficulty: 'easy' },
  { id: 'sc2', situationAr: 'اطلب مائدة لشخصين في المطعم.', targetSample: 'A table for two, please.', keywords: ['table', 'two'], lessonId: 'l5-restaurant', difficulty: 'easy' },
  { id: 'sc3', situationAr: 'اسأل موظف الاستقبال عن غرفة مفردة بحمام.', targetSample: 'Do you have a single room with a bath?', keywords: ['single', 'room'], lessonId: 'l5-hotel', difficulty: 'medium' },
  { id: 'sc4', situationAr: 'اسأل في الشارع عن أقرب مستشفى.', targetSample: 'Where is the nearest hospital?', keywords: ['where', 'hospital'], lessonId: 'l4-street', difficulty: 'medium' },
  { id: 'sc5', situationAr: 'أبلغ موظف الجمارك أنه ليس معك شيء للتصريح عنه.', targetSample: 'I have nothing to declare.', keywords: ['nothing', 'declare'], lessonId: 'l5-airport', difficulty: 'hard' },
];
