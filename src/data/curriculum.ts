import type { AchievementBadge, Lesson, Level, VocabItem } from '../types/curriculum';
import { LEVEL_1_LESSONS } from './alphabetAndPhonetics';
import { LEVEL_2_LESSONS } from './grammarPartsOfSpeech';
import { LEVEL_3_LESSONS } from './conversationsPart1';
import { LEVEL_4_LESSONS } from './conversationsPart2';
import { LEVEL_5_LESSONS } from './conversationsPart3';
import { LEVEL_6_LESSONS } from './conversationsPart4';

export interface RoleplayScenario {
  id: string;
  titleAr: string;
  titleEn: string;
  levelId: number;
  descriptionAr: string;
  roles: [
    { id: string; labelAr: string; labelEn: string },
    { id: string; labelAr: string; labelEn: string }
  ];
  starterPromptEn: string;
}

export const LEVELS: Level[] = [
  {
    id: 1,
    titleAr: 'المستوى الأول: الحروف وقواعد النطق',
    titleEn: 'Alphabet & Phonetics',
    descriptionAr: 'تعرّف على الأبجدية الإنجليزية الـ 26 حرفاً، الحروف الكبيرة والصغيرة، وقواعد نطق الحروف المتحركة والساكنة والمركبة بدقة كما وردت في الملزمة.',
    bookSectionAr: 'القسم الأول — ص 9 إلى 25',
    requiredScoreToPass: 70,
  },
  {
    id: 2,
    titleAr: 'المستوى الثاني: أقسام الكلام والقواعد الأساسية',
    titleEn: 'Parts of Speech & Basic Grammar',
    descriptionAr: 'الاسم وقواعد الجمع الست، أدوات التعريف والتنكير، الأفعال وتصريف فعل يكون، الضمائر كلها، الظروف وحروف الجر والعطف.',
    bookSectionAr: 'القسم الثاني — ص 26 إلى 40',
    requiredScoreToPass: 70,
  },
  {
    id: 3,
    titleAr: 'المستوى الثالث: التحيات والدول والعائلة والأرقام والوقت',
    titleEn: 'Greetings, Family, Numbers & Time',
    descriptionAr: 'بداية المحادثات الحقيقية: التعارف والتحيات، الدول والجنسيات، العائلة والحواس، الأرقام الأصلية والترتيبية والكسور، الشهور والأيام والساعة.',
    bookSectionAr: 'القسم الثالث — ص 43 إلى 65',
    requiredScoreToPass: 70,
  },
  {
    id: 4,
    titleAr: 'المستوى الرابع: في المدينة والخدمات العامة',
    titleEn: 'City, Signs & Public Services',
    descriptionAr: 'اللافتات الإرشادية، الاتجاهات في الشارع، البريد والشرطة والحلاق والخياط، المكتبة، وآداب التحدث في التليفون.',
    bookSectionAr: 'القسم الرابع — ص 49 إلى 75، 109، 136',
    requiredScoreToPass: 70,
  },
  {
    id: 5,
    titleAr: 'المستوى الخامس: السفر والفندق والمطعم والبنك والمطار',
    titleEn: 'Travel, Hotel, Restaurant & Airport',
    descriptionAr: 'مفردات وحوارات السفر بالقطار والباخرة، الحجز في الفندق، طلب الطعام في المطعم، المعاملات البنكية والعملات، وإجراءات المطار.',
    bookSectionAr: 'القسم الخامس — ص 76 إلى 108',
    requiredScoreToPass: 70,
  },
  {
    id: 6,
    titleAr: 'المستوى السادس: الطبيعة والصحة والملابس والمنزل والسوق',
    titleEn: 'Nature, Health, Clothes, Home & Market',
    descriptionAr: 'الطقس وفصول السنة، عند الطبيب والأسنان والصيدلية، الرياضة والمتاحف، الألوان والصفات والملابس، وفي البيت والسوق.',
    bookSectionAr: 'القسم السادس — ص 113 إلى 160',
    requiredScoreToPass: 70,
  },
];

// قسم مستقل خارج الملزمة الأصلية — لا يُنسب إلى كتاب «تكلم الإنجليزية في عشرة أيام»
export const EXTRA_LESSONS: Lesson[] = [
  {
    id: 'extra-sentence-building',
    levelId: 7,
    order: 1,
    isExtra: true,
    titleAr: 'تكوين الجملة الإنجليزية البسيطة (SVO)',
    titleEn: 'Basic English Sentence Structure',
    bookPages: 'دروس إضافية (إثرائي)',
    summaryAr: 'درس إضافي تطبيقي لتدريبك على ربط الضمائر والأفعال والمفردات التي تعلمتها من الملزمة في جمل مفيدة صحيحة الترتيب.',
    explanationBlocks: [
      {
        titleAr: 'ترتيب الجملة: فاعل + فعل + مفعول (Subject + Verb + Object)',
        explanationAr:
          'تبدأ الجملة الإنجليزية الخبرية غالباً بالفاعل (اسم أو ضمير مثل I, He, Ali)، يليه الفعل (مثل read, want, drink)، ثم المفعول أو المكمل.',
        examples: [
          { en: 'I read a book every day.', ar: 'أنا أقرأ كتاباً كل يوم.', pronunciationAr: 'آى ريد آ بُوك إڤرى دَى.' },
          { en: 'She drinks coffee in the morning.', ar: 'هي تشرب القهوة في الصباح.', pronunciationAr: 'شى درنكس كوفى إن ذا مورنينج.' },
        ],
      },
    ],
    items: [
      {
        id: 'ex-want-water',
        en: 'I want a glass of water.',
        ar: 'أريد كوباً من الماء.',
        pronunciationAr: 'آى وونت آ جلاس أوف ووتر',
        category: 'دروس إضافية',
        lessonId: 'extra-sentence-building',
        isPhrase: true,
      },
      {
        id: 'ex-speak-english',
        en: 'I speak a little English.',
        ar: 'أتحدث القليل من الإنجليزية.',
        pronunciationAr: 'آى سبيك آ لِتل إنجلش',
        category: 'دروس إضافية',
        lessonId: 'extra-sentence-building',
        isPhrase: true,
      },
    ],
    quiz: [
      {
        id: 'q-ex-1',
        type: 'mcq',
        promptAr: 'ما الترتيب الصحيح للجملة الخبرية البسيطة في الإنجليزية؟',
        options: ['فاعل + فعل + مفعول', 'فعل + فاعل + مفعول', 'مفعول + فاعل + فعل', 'فعل + مفعول + فاعل'],
        correctIndex: 0,
        explanationAr: 'الترتيب الأساسي هو الفاعل ثم الفعل ثم المفعول (Subject + Verb + Object).',
      },
    ],
  },
  {
    id: 'extra-questions-negatives',
    levelId: 7,
    order: 2,
    isExtra: true,
    titleAr: 'صياغة السؤال والنفي باستخدام Do و Does',
    titleEn: 'Forming Questions & Negatives',
    bookPages: 'دروس إضافية (إثرائي)',
    summaryAr: 'درس إضافي يوضح متى نستخدم Do أو Does لطرح الأسئلة اليومية أو نفي الجمل في المضارع البسيط.',
    explanationBlocks: [
      {
        titleAr: 'متى نستخدم Do ومتى نستخدم Does؟',
        explanationAr:
          'نستخدم Do / Don\'t مع (I, You, We, They)، ونستخدم Does / Doesn\'t مع المفرد الغائب (He, She, It) مع إرجاع الفعل إلى أصله بدون (s).',
        examples: [
          { en: 'Do you speak Arabic? — Yes, I do.', ar: 'هل تتحدث العربية؟ — نعم، أتحدثها.', pronunciationAr: 'دوو يوو سبيك أربك؟ — يس، آى دوو.' },
          { en: "He doesn't like cold weather.", ar: 'هو لا يحب الطقس البارد.', pronunciationAr: 'هى دازنت لايك كولد وِذر.' },
        ],
      },
    ],
    items: [
      {
        id: 'ex-do-you-like',
        en: 'Do you like Egyptian food?',
        ar: 'هل تحب الطعام المصري؟',
        pronunciationAr: 'دوو يوو لايك إچبشيان فوود؟',
        category: 'دروس إضافية',
        lessonId: 'extra-questions-negatives',
        isPhrase: true,
      },
      {
        id: 'ex-dont-know',
        en: "I don't understand, please repeat.",
        ar: 'لا أفهم، من فضلك كرر.',
        pronunciationAr: 'آى دونت أندرستاند، بليز ريبيت',
        category: 'دروس إضافية',
        lessonId: 'extra-questions-negatives',
        isPhrase: true,
      },
    ],
    quiz: [
      {
        id: 'q-ex-2',
        type: 'mcq',
        promptAr: 'أي أداة سؤال نستخدمها مع الضمير She في المضارع البسيط؟',
        options: ['Does', 'Do', 'Are', 'Have'],
        correctIndex: 0,
        explanationAr: 'الضمائر المفردة (He, She, It) تأخذ Does في السؤال.',
      },
    ],
  },
];

export const BOOK_LESSONS: Lesson[] = [
  ...LEVEL_1_LESSONS,
  ...LEVEL_2_LESSONS,
  ...LEVEL_3_LESSONS,
  ...LEVEL_4_LESSONS,
  ...LEVEL_5_LESSONS,
  ...LEVEL_6_LESSONS,
];

export const ALL_LESSONS: Lesson[] = [...BOOK_LESSONS, ...EXTRA_LESSONS];

export const ALL_VOCAB_ITEMS: VocabItem[] = ALL_LESSONS.flatMap((lesson) => lesson.items);

export const ROLEPLAY_SCENARIOS: RoleplayScenario[] = [
  {
    id: 'rp-greetings',
    titleAr: 'التعارف والتحية لأول مرة',
    titleEn: 'First Meeting & Greetings',
    levelId: 3,
    descriptionAr: 'تدرّب على تقديم نفسك، السؤال عن البلد والجنسية، وتحديد موعد للقاء.',
    roles: [
      { id: 'visitor', labelAr: 'الزائر الجديد', labelEn: 'New Visitor' },
      { id: 'host', labelAr: 'المضيف', labelEn: 'Friendly Host' },
    ],
    starterPromptEn: "Hello! May I introduce myself? My name is Sami. How do you do?",
  },
  {
    id: 'rp-hotel',
    titleAr: 'حجز غرفة في الفندق',
    titleEn: 'Hotel Check-in',
    levelId: 5,
    descriptionAr: 'احجز غرفة مفردة أو مزدوجة، اسأل عن الإفطار، واطلب خدمات الغرف.',
    roles: [
      { id: 'guest', labelAr: 'النزيل', labelEn: 'Hotel Guest' },
      { id: 'receptionist', labelAr: 'موظف الاستقبال', labelEn: 'Receptionist' },
    ],
    starterPromptEn: 'Good evening! Welcome to Grand Hotel. Would you like a single or double room?',
  },
  {
    id: 'rp-restaurant',
    titleAr: 'طلب الطعام في المطعم',
    titleEn: 'Ordering at a Restaurant',
    levelId: 5,
    descriptionAr: 'اطلب مائدة، اختر نوع اللحم وطريقة الطهي والمشروب، واطلب الحساب.',
    roles: [
      { id: 'customer', labelAr: 'الزبون', labelEn: 'Customer' },
      { id: 'waiter', labelAr: 'الجرسون', labelEn: 'Waiter' },
    ],
    starterPromptEn: 'Good afternoon! Here is the menu. Would you like soup or grilled steak today?',
  },
  {
    id: 'rp-airport',
    titleAr: 'في المطار والجمارك',
    titleEn: 'At the Airport & Customs',
    levelId: 5,
    descriptionAr: 'تحدث مع موظف الجمارك، اعرض جواز السفر، واسأل عن الحقائب والتاكسي.',
    roles: [
      { id: 'traveler', labelAr: 'المسافر', labelEn: 'Traveler' },
      { id: 'officer', labelAr: 'موظف الجمارك', labelEn: 'Customs Officer' },
    ],
    starterPromptEn: 'Good morning. May I see your passport? Do you have anything to declare?',
  },
  {
    id: 'rp-doctor',
    titleAr: 'زيارة عيادة الطبيب',
    titleEn: 'At the Doctor Clinic',
    levelId: 6,
    descriptionAr: 'اشرح الأعراض للطبيب واحصل على الوصفة الطبية وتعليمات الصيدلية.',
    roles: [
      { id: 'patient', labelAr: 'المريض', labelEn: 'Patient' },
      { id: 'doctor', labelAr: 'الطبيب', labelEn: 'Doctor' },
    ],
    starterPromptEn: 'Hello! Have a seat. What is troubling you today?',
  },
  {
    id: 'rp-market',
    titleAr: 'التسوق والمساومة في السوق',
    titleEn: 'Shopping at the Market',
    levelId: 6,
    descriptionAr: 'اسأل عن المقاس والسعر بالكيلو أو المتر واطلب تغليف المشتريات.',
    roles: [
      { id: 'shopper', labelAr: 'المشتري', labelEn: 'Shopper' },
      { id: 'seller', labelAr: 'البائع', labelEn: 'Shopkeeper' },
    ],
    starterPromptEn: 'Welcome! Are you looking for anything special today?',
  },
];

export const ACHIEVEMENT_BADGES: AchievementBadge[] = [
  {
    id: 'first-lesson',
    titleAr: 'الخطوة الأولى',
    descriptionAr: 'أكملت أول درس بنجاح في رحلة تعلم الإنجليزية.',
    iconName: 'Award',
    xpReward: 50,
    conditionLabelAr: 'إكمال درس واحد على الأقل',
  },
  {
    id: 'level-1-master',
    titleAr: 'خبير الحروف والنطق',
    descriptionAr: 'اجتزت اختبار المستوى الأول بنجاح وأتقنت قواعد نطق الحروف.',
    iconName: 'BookOpen',
    xpReward: 120,
    conditionLabelAr: 'اجتياز المستوى الأول',
  },
  {
    id: 'vocab-25',
    titleAr: 'جامع الكلمات',
    descriptionAr: 'أضفت 25 كلمة أو عبارة إلى قائمة الكلمات المتقَنة.',
    iconName: 'Sparkles',
    xpReward: 100,
    conditionLabelAr: 'إتقان 25 كلمة',
  },
  {
    id: 'game-winner-5',
    titleAr: 'بطل الألعاب التعليمية',
    descriptionAr: 'حققت الفوز في 5 جولات من الألعاب التفاعلية.',
    iconName: 'Gamepad2',
    xpReward: 100,
    conditionLabelAr: 'الفوز في 5 ألعاب',
  },
  {
    id: 'streak-3',
    titleAr: 'المتعلم المواظب',
    descriptionAr: 'حافظت على استمرارية التعلم لمدة 3 أيام.',
    iconName: 'Flame',
    xpReward: 80,
    conditionLabelAr: 'سلسلة 3 أيام',
  },
  {
    id: 'level-3-master',
    titleAr: 'محاور البدايات',
    descriptionAr: 'اجتزت المستوى الثالث وأتقنت التحيات والأرقام والأوقات.',
    iconName: 'MessageCircle',
    xpReward: 150,
    conditionLabelAr: 'اجتياز المستوى الثالث',
  },
  {
    id: 'polyglot-graduate',
    titleAr: 'خريج ENGLISH MASTER',
    descriptionAr: 'اجتزت جميع المستويات الستة الأساسية من المنهج الكامل.',
    iconName: 'Trophy',
    xpReward: 300,
    conditionLabelAr: 'اجتياز المستويات الستة كلها',
  },
];

export function getLessonsForLevel(levelId: number): Lesson[] {
  if (levelId === 7) return EXTRA_LESSONS;
  return BOOK_LESSONS.filter((l) => l.levelId === levelId).sort((a, b) => a.order - b.order);
}

export function getLessonById(lessonId: string): Lesson | undefined {
  return ALL_LESSONS.find((l) => l.id === lessonId);
}
