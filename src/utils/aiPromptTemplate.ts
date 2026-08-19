import { AIPromptConfig } from '../types';

/**
 * Generates an optimized master AI prompt that the student can copy and paste
 * into ANY AI (ChatGPT, Claude, Gemini, DeepSeek, etc.) alongside their PDF textbook or notes.
 * Special focus on the Iranian Residency Entrance Exam (آزمون پذیرش دستیاری تخصصی پزشکی ایران).
 */
export function generateMasterAIPrompt(config: AIPromptConfig): string {
  const {
    language = 'persian',
    cardCount = 50,
    cardFormat = 'mcq',
    style = 'clinical-vignette',
    specialty = 'آزمون دستیاری تخصصی پزشکی ایران (Iran Residency Exam)',
    includeMnemonics = true,
    includeMultipleChoice = true,
    targetBook = '',
    chapterTopic = '',
  } = config;

  let languageDirective = '';
  if (language === 'persian') {
    languageDirective = `
- **زبان (Language):** تمام سوالات، گزینه‌ها و تحلیل‌ها به زبان فارسی روان، علمی و منطبق بر اصطلاحات مصوب کتب مرجع آزمون دستیاری وزارت بهداشت ایران باشد.
- اصطلاحات تخصصی پزشکی، نام داروها، آناتومی و سندرم‌ها حتماً همراه با معادل دقیق انگلیسی یا داخل پرانتز آورده شوند (مثلاً: «دکولمان جفت (Placental Abruption)» یا «لتروزول (Letrozole)»).
`;
  } else if (language === 'bilingual') {
    languageDirective = `
- **Language Mode: Bilingual (Persian + English Medical Terms)**
- Medical terms, disease names, anatomical landmarks, and drugs in English.
- Clinical vignettes and in-depth rationales in fluent Persian with English clinical keywords.
`;
  } else {
    languageDirective = `
- **Language Mode: Professional Medical English**
- Write all questions, 4 options, explanations, and key takeaways in standardized English medical terminology suitable for Board/USMLE exams.
`;
  }

  let formatDirective = '';
  if (cardFormat === 'mcq') {
    formatDirective = `
- **فرمت: سوال ۴ گزینه‌ای استاندارد آزمون دستیاری تخصصی ایران (4-Option MCQ Clinical Vignette)**:
  1. هر سوال **دقیقاً ۴ گزینه (Options)** متمایز، استاندارد و بر اساس گزینه‌های محتمل رفرنس‌های پزشکی داشته باشد.
  2. **فقط ۱ گزینه پاسخ صحیح قطعی** باشد.
  3. ۳ گزینه دیگر باید **دیستراکتورهای بالینی گمراه‌کننده و چالش‌برانگیز (High-Yield Distractors)** بر اساس اشتباهات رایج داوطلبان آزمون دستیاری باشند.
  4. فیلد \`correctOptionIndex\` یک عدد صحیح بین **0 تا 3** است که نشان‌دهنده موقعیت گزینه درست است.
  5. فیلد \`back\` باید شامل **تحلیل سناریو، علت صحت گزینه درست و دلیل رد تک‌تک ۳ گزینه دیگر به همراه رفرنس دقیق (هاریسون، شوارتز، نلسون، ویلیامز، کتزونگ، برانوالد)** باشد.
  6. فیلد \`cardType\` حتماً مقدار \`"mcq"\` باشد.
`;
  } else if (cardFormat === 'mixed') {
    formatDirective = `
- **فرمت: ترکیبی (تست‌های ۴ گزینه‌ای بالینی + فلش‌کارت‌های مفهومی سوال-جواب)**:
  - برای تست‌ها \`cardType: "mcq"\` با ۴ گزینه و برای نکات مفهومی \`cardType: "standard"\` قرار داده شود.
`;
  } else {
    formatDirective = `
- **فرمت: فلش‌کارت مرور فعال (Active Recall Flashcards)**:
  - صورت سوال/نکته در front و پاسخ تفصیلی و استدلالی در back.
`;
  }

  let styleDirective = '';
  switch (style) {
    case 'clinical-vignette':
      styleDirective = `
- **سبک سناریوی بالینی آزمون دستیاری ایران (Clinical Vignette):**
  - سوال را با سن، جنس، شکایت اصلی، علائم حیاتی، یافته‌های کلیدی معاینه بالینی، و آزمایش‌ها یا گرافی/نوار قلب مطرح کن.
  - پرسش اصلی روی «مناسب‌ترین اقدام تشخیصی/درمانی بعدی»، «محتمل‌ترین تشخیص»، «خط اول درمان» یا «خطرناک‌ترین عارضه» متمرکز باشد.
`;
      break;
    case 'drug-mechanism':
      styleDirective = `
- **سبک فارماکولوژی و سم‌شناسی بالینی (کتزونگ):**
  - تمرکز بر مکانیسم اثر، موارد مصرف خط اول، عوارض جانبی پرخطر، پادزهرهای اختصاصی، تداخلات دارویی و رژیم‌های دارویی در جمعیت‌های خاص (بارداری، نارسایی کلیه و کبد).
`;
      break;
    case 'high-yield':
    default:
      styleDirective = `
- **سبک نکات فوق‌العاده پرتکرار و طلایی (High-Yield Pearls):**
  - تمرکز بر روی علائم پاتوگنومونیک، تریادهای بالینی معروف، تست‌های استاندارد طلایی (Gold Standards)، و انحرافات از درمان استاندارد.
`;
      break;
  }

  // Large-scale batching note if requesting >= 100 cards
  const isLargeBatch = cardCount >= 100;
  const batchingAdvice = isLargeBatch
    ? `
⚠️ **نکته حیاتی برای تولید دسته‌ای بزرگ (${cardCount} کارت):**
- از آنجا که محدودیت توکن خروجی هوش مصنوعی وجود دارد، لطفاً خروجی را به صورت کامل و فشرده بدون قطعی ارسال کنید یا در پارت‌های متوالی ارائه دهید.
`
    : '';

  return `### پرامپت اختصاصی تبدیل جزوه/پی‌دی‌اف به فلش‌کارت و تست‌های استاندارد آزمون دستیاری پزشکی ایران (MedFlash System Prompt)

**نقش شما:** شما طراح ارشد سوالات آزمون پذیرش دستیار تخصصی وزارت بهداشت ایران (قطب‌های آزمون دستیاری) و متخصص طراحی سوالات چهارگزینه‌ای بر اساس کتب رفرنس مصوب (هاریسون، شوارتز، نلسون، ویلیامز، کتزونگ، برانوالد، مندل، آدامز و تینتینالی) هستید.

**وظیفه شما:**
فایل پیوست، صفحات پی‌دی‌اف یا متن ارائه شده${targetBook ? ` از کتاب «${targetBook}»` : ''}${chapterTopic ? ` پیرامون مبحث «${chapterTopic}»` : ''} را با دقت تمام بررسی کن و **دقیقاً ${cardCount} تست ۴ گزینه‌ای و فلش‌کارت استاندارد آزمون دستیاری** به فرمت JSON تولید کن.

#### دستورالعمل‌های محتوایی و علمی:
${languageDirective}
${formatDirective}
${styleDirective}
- رشته و تخصص: **${specialty}**
- **نکته کلیدی (keyPoint):** در هر کارت یک جمله طلایی و خلاصه از نکته تستی اصلی را بنویس.
${includeMnemonics ? '- **یادیار و رمز بالینی (mnemonic):** برای نکات فرار حتماً یک رمز حفظی، یادیار فارسی یا انگلیسی اضافه کن.' : ''}
${batchingAdvice}

---

### ساختار دقیق خروجی JSON (CRITICAL OUTPUT FORMAT):
پاسخ شما باید **تنها یک آرایه JSON معتبر** بدون هیچ متن اضافی، بدون پیش‌گفتار و بدون پس‌گفتار باشد تا فوراً در نرم‌افزار بارگذاری شود:

\`\`\`json
[
  {
    "cardType": "mcq",
    "front": "آقای ۵۴ ساله با سابقه سوزش سردل مزمن (GERD)، در آندوسکوپی دچار تغییر اپی‌تلیوم سنگفرشی دیستال مری به اپی‌تلیوم استوانه‌ای همراه با متامپلازی روده‌ای (مری بارت) شده است. بیوپسی دیسپلازی با درجه بالا (High-Grade Dysplasia) را نشان می‌دهد. مناسب‌ترین اقدام بعدی کدام است؟",
    "options": [
      "از بین بردن آندوسکوپیک با رادیوفرکوئنسی یا موکوزکتومی (Endoscopic Eradication Therapy / EMR)",
      "افزایش دوز امپرازول به دو برابر و تکرار آندوسکوپی ۵ سال بعد",
      "ازوفاژکتومی ساب‌توتال اورژانسی با توراکوتومی باز",
      "فوندوپلیکاسیون نیسن (Nissen Fundoplication) بدون نیاز به مداخله آندوسکوپیک"
    ],
    "correctOptionIndex": 0,
    "correctAnswer": "از بین بردن آندوسکوپیک با رادیوفرکوئنسی یا موکوزکتومی (Endoscopic Eradication Therapy / EMR)",
    "back": "پاسخ صحیح: گزینه ۱\\n\\nتحلیل رفرنس هاریسون:\\nدر مری بارت با دیسپلازی درجه بالا (HGD)، درمان انتخابی اول روش‌های آندوسکوپیک (EMR برای ندول‌های برجسته + رادیوفرکوئنسی ابلیشن) است و نسبت به ازوفاژکتومی تهاجمی اولویت دارد.\\n- گزینه ۲ غلط است زیرا تاخیر در درمان دیسپلازی بالا خطر آدنوکارسینوم دارد.\\n- گزینه ۴ مشکل ریفلاکس را کم می‌کند ولی دیسپلازی را برطرف نمی‌کند.",
    "keyPoint": "در مری بارت با دیسپلازی درجه بالا (HGD)، ابلیشن آندوسکوپیک با EMR درمان خط اول است.",
    "mnemonic": "بارت با دیسپلازی بالا = ابلیشن آندوسکوپیک بدون درنگ",
    "specialty": "${specialty}",
    "difficulty": "medium",
    "tags": ["آزمون_دستیاری", "داخلی", "هاریسون", "گوارش"]
  }
]
\`\`\`

اکنون متن، فصول کتاب یا پی‌دی‌اف پزشکی پیوست‌شده را مطالعه کن و کل آرایه JSON شامل ${cardCount} کارت را استخراج نما.`.trim();
}

/**
 * Generates a segmented prompt specifically for generating a 500-question
 * Residency Exam package in 5 easy parts of 100 questions each.
 */
export function generateResidencyBatchPartPrompt(
  partNumber: number,
  totalParts: number = 5,
  subjectName: string = 'ماژور بیماری‌های داخلی (هاریسون)',
  questionsPerPart: number = 100
): string {
  return `### پرامپت تولید بخش ${partNumber} از ${totalParts} آزمون جامع ۵۰۰ سوالی دستیاری پزشکی ایران

**موضوع این پارت:** ${subjectName}
**تعداد سوالات این بخش:** ${questionsPerPart} تست ۴ گزینه‌ای بالینی استاندارد آزمون دستیاری

لطفاً بر اساس متن یا کتاب پیوست‌شده (یا بر اساس سرفصل‌های رفرنس مصوب وزارت بهداشت ایران)، دقیقاً **${questionsPerPart} سوال چهارگزینه‌ای با ۴ گزینه و ۱ پاسخ صحیح و تشریح کامل به فرمت JSON** تولید کن.

قوانین:
۱. خروجی فقط یک آرایه JSON بدون هیچ متن اضافی باشد.
۲. هر سوال ۴ گزینه داشته باشد و \`correctOptionIndex\` بین 0 تا 3 باشد.
۳. فیلد \`back\` شامل تحلیل گزینه صحیح و رد سایر گزینه‌ها بر اساس رفرنس باشد.
۴. فیلدهای \`keyPoint\` و \`mnemonic\` برای یادگیری Spaced-Repetition تکمیل شوند.

فرمت JSON:
\`\`\`json
[
  {
    "cardType": "mcq",
    "front": "صورت سوال بالینی بر اساس کیس آزمون دستیاری...",
    "options": ["گزینه ۱", "گزینه ۲", "گزینه ۳", "گزینه ۴"],
    "correctOptionIndex": 0,
    "correctAnswer": "گزینه ۱",
    "back": "پاسخ صحیح: گزینه ۱\\n\\nتشریح بر اساس رفرنس...",
    "keyPoint": "نکته تستی کلیدی...",
    "mnemonic": "رمز یا یادیار...",
    "specialty": "${subjectName}",
    "tags": ["آزمون_دستیاری", "${subjectName}"]
  }
]
\`\`\``.trim();
}

/**
 * Ready-made quick templates that students can instantly view and copy
 */
export const QUICK_TEMPLATES = [
  {
    id: 'residency_500_bank',
    title: '🏆 بسته ۵۰۰ تستی جامع آزمون پذیرش دستیاری ایران (Iran Residency 500+)',
    desc: 'پکیج جامع ۵۰۰ سوالی در ۵ پارت ۱۰۰تایی برای پوشش تمامی ماژورها و مینورهای دستیاری',
    config: {
      language: 'persian' as const,
      cardCount: 500,
      cardFormat: 'mcq' as const,
      style: 'clinical-vignette' as const,
      specialty: 'آزمون پذیرش دستیار تخصصی پزشکی ایران',
      includeMnemonics: true,
      includeMultipleChoice: true,
      targetBook: 'هاریسون، شوارتز، نلسون، ویلیامز، کتزونگ، برانوالد',
    },
  },
  {
    id: 'residency_internal',
    title: '🩺 داخلی آزمون دستیاری (هاریسون و سیسیل)',
    desc: 'گوارش، کبد، غدد، ریه، روماتولوژی، نفرولوژی و هماتولوژی با سناریوهای بالینی ۴ گزینه‌ای',
    config: {
      language: 'persian' as const,
      cardCount: 50,
      cardFormat: 'mcq' as const,
      style: 'clinical-vignette' as const,
      specialty: 'بیماری‌های داخلی آزمون دستیاری (هاریسون)',
      includeMnemonics: true,
      includeMultipleChoice: true,
      targetBook: 'اصول طب داخلی هاریسون',
    },
  },
  {
    id: 'residency_surgery',
    title: '🔪 جراحی عمومی آزمون دستیاری (شوارتز و لارنس)',
    desc: 'تروما (ATLS)، شکم حاد، بیماری‌های پستان و تیروئید، هپاتوبیلیاری و فتق‌ها',
    config: {
      language: 'persian' as const,
      cardCount: 50,
      cardFormat: 'mcq' as const,
      style: 'clinical-vignette' as const,
      specialty: 'جراحی عمومی آزمون دستیاری (شوارتز)',
      includeMnemonics: true,
      includeMultipleChoice: true,
      targetBook: 'اصول جراحی شوارتز',
    },
  },
  {
    id: 'residency_pediatrics',
    title: '👶 کودکان و نوزادان آزمون دستیاری (نلسون)',
    desc: 'نوزادان، رشد و نمو، واکسیناسیون کشوری، بیماری‌های عفونی اطفال و اورژانس‌ها',
    config: {
      language: 'persian' as const,
      cardCount: 50,
      cardFormat: 'mcq' as const,
      style: 'clinical-vignette' as const,
      specialty: 'کودکان و نوزادان آزمون دستیاری (نلسون)',
      includeMnemonics: true,
      includeMultipleChoice: true,
      targetBook: 'مبانی طب کودکان نلسون',
    },
  },
  {
    id: 'residency_obgyn',
    title: '🤰 زنان و زایمان آزمون دستیاری (ویلیامز و دنفورث)',
    desc: 'مامایی پرخطر، پره‌اکلامپسی، خونریزی‌ها، حاملگی خارج رحمی (EP) و ژنیکولوژی',
    config: {
      language: 'persian' as const,
      cardCount: 50,
      cardFormat: 'mcq' as const,
      style: 'clinical-vignette' as const,
      specialty: 'زنان و زایمان آزمون دستیاری (ویلیامز)',
      includeMnemonics: true,
      includeMultipleChoice: true,
      targetBook: 'مامایی ویلیامز و بیماری‌های زنان دنفورث',
    },
  },
  {
    id: 'residency_pharma_tox',
    title: '💊 فارماکولوژی و مسمومیت‌ها (کتزونگ)',
    desc: 'پادزهرهای شایع، مسمومیت‌های اورژانس (قرص برنج، متانول، ارگانوفسفره) و تداخلات',
    config: {
      language: 'persian' as const,
      cardCount: 50,
      cardFormat: 'mcq' as const,
      style: 'drug-mechanism' as const,
      specialty: 'فارماکولوژی و سم‌شناسی بالینی (کتزونگ)',
      includeMnemonics: true,
      includeMultipleChoice: true,
      targetBook: 'فارماکولوژی پایه و بالینی کتزونگ',
    },
  },
  {
    id: 'residency_cardio_ecg',
    title: '🫀 قلب، عروق و نوار قلب (برانوالد)',
    desc: 'تفسیر ECGهای تستی دستیاری، STEMI/NSTEMI، آریتمی‌ها و نارسایی قلبی',
    config: {
      language: 'persian' as const,
      cardCount: 50,
      cardFormat: 'mcq' as const,
      style: 'clinical-vignette' as const,
      specialty: 'بیماری‌های قلب و عروق و ECG (برانوالد)',
      includeMnemonics: true,
      includeMultipleChoice: true,
      targetBook: 'بیماری‌های قلب برانوالد',
    },
  },
  {
    id: 'residency_infectious',
    title: '🦠 بیماری‌های عفونی و تب‌دار (مندل و هاریسون)',
    desc: 'سپسیس، مننژیت‌ها، سل ریوی و خارج ریوی، بروسلوز (تب مالت) و آنتی‌بیوتیک‌تراپی',
    config: {
      language: 'persian' as const,
      cardCount: 50,
      cardFormat: 'mcq' as const,
      style: 'clinical-vignette' as const,
      specialty: 'بیماری‌های عفونی آزمون دستیاری (مندل)',
      includeMnemonics: true,
      includeMultipleChoice: true,
      targetBook: 'بیماری‌های عفونی مندل و هاریسون',
    },
  },
  {
    id: 'residency_emergency_icu',
    title: '🚨 اورژانس، بیهوشی و مراقبت ویژه (تینتینالی و ACLS)',
    desc: 'الگوریتم‌های ACLS، شوک‌ها، ABG، مدیریت راه هوایی و تروماهای اورژانس',
    config: {
      language: 'persian' as const,
      cardCount: 50,
      cardFormat: 'mcq' as const,
      style: 'clinical-vignette' as const,
      specialty: 'طب اورژانس و بیهوشی (تینتینالی)',
      includeMnemonics: true,
      includeMultipleChoice: true,
      targetBook: 'طب اورژانس تینتینالی و راهنمای ACLS',
    },
  },
];

export const SAMPLE_JSON_DEMO = `[
  {
    "cardType": "mcq",
    "front": "آقای ۵۴ ساله با سابقه سوزش سردل مزمن (GERD)، در آندوسکوپی دچار تغییر اپی‌تلیوم سنگفرشی دیستال مری به اپی‌تلیوم استوانه‌ای همراه با متامپلازی روده‌ای (مری بارت) شده است. بیوپسی دیسپلازی با درجه بالا (High-Grade Dysplasia) را نشان می‌دهد. مناسب‌ترین اقدام بعدی کدام است؟",
    "options": [
      "از بین بردن آندوسکوپیک با رادیوفرکوئنسی یا موکوزکتومی (Endoscopic Eradication Therapy / EMR)",
      "افزایش دوز امپرازول به دو برابر و تکرار آندوسکوپی ۵ سال بعد",
      "ازوفاژکتومی ساب‌توتال اورژانسی با توراکوتومی باز",
      "فوندوپلیکاسیون نیسن (Nissen Fundoplication) بدون نیاز به مداخله آندوسکوپیک"
    ],
    "correctOptionIndex": 0,
    "correctAnswer": "از بین بردن آندوسکوپیک با رادیوفرکوئنسی یا موکوزکتومی (Endoscopic Eradication Therapy / EMR)",
    "back": "پاسخ صحیح: گزینه ۱ (EMR / Radiofrequency Ablation)\\n\\nدر مری بارت با دیسپلازی درجه بالا (HGD)، درمان انتخابی روش‌های آندوسکوپیک است.",
    "keyPoint": "در مری بارت با دیسپلازی بالا، ابلیشن آندوسکوپیک خط اول است.",
    "mnemonic": "بارت با دیسپلازی بالا = ابلیشن آندوسکوپیک فوری",
    "specialty": "داخلی (گوارش)",
    "tags": ["آزمون_دستیاری", "گوارش", "هاریسون"]
  }
]`;
