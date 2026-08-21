// Client-side Gemini API integration.
// The user supplies their own Gemini API key (Settings screen), stored only in
// localStorage on their device. Requests go directly from the device to
// Google's API — no MedFlash backend is involved.

export class GeminiError extends Error {}

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GenerateOptions {
  apiKey: string;
  model: string;
  systemInstruction?: string;
  parts: any[];
  responseMimeType?: string;
  temperature?: number;
}

async function callGemini({
  apiKey,
  model,
  systemInstruction,
  parts,
  responseMimeType,
  temperature = 0.3,
}: GenerateOptions): Promise<string> {
  if (!apiKey) {
    throw new GeminiError('کلید Gemini API تنظیم نشده است. لطفاً ابتدا از بخش تنظیمات، کلید خود را وارد کنید.');
  }

  const body: any = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature,
    },
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }
  if (responseMimeType) {
    body.generationConfig.responseMimeType = responseMimeType;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new GeminiError('اتصال به سرور Gemini برقرار نشد. اتصال اینترنت خود را بررسی کنید.');
  }

  if (!response.ok) {
    let message = `خطای Gemini API (کد ${response.status})`;
    try {
      const errData = await response.json();
      if (errData?.error?.message) {
        if (response.status === 400 && /API key/i.test(errData.error.message)) {
          message = 'کلید Gemini API نامعتبر است. لطفاً کلید را در تنظیمات بررسی کنید.';
        } else if (response.status === 429) {
          message = 'محدودیت درخواست Gemini API. کمی صبر کنید و دوباره تلاش کنید.';
        } else {
          message = errData.error.message;
        }
      }
    } catch (e) {
      // ignore, use default message
    }
    throw new GeminiError(message);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '';
  if (!text) {
    const finishReason = data?.candidates?.[0]?.finishReason;
    if (finishReason === 'SAFETY') {
      throw new GeminiError('محتوای ورودی توسط فیلترهای ایمنی Gemini مسدود شد.');
    }
    throw new GeminiError('پاسخی از Gemini دریافت نشد. لطفاً دوباره تلاش کنید.');
  }
  return text;
}

export async function testGeminiConnection(apiKey: string, model: string): Promise<void> {
  await callGemini({
    apiKey,
    model,
    parts: [{ text: 'Reply with only the word: OK' }],
    temperature: 0,
  });
}

function parseJsonLoose(text: string): any {
  try {
    return JSON.parse(text);
  } catch (e) {
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        return JSON.parse(objMatch[0]);
      } catch (e2) {
        // fall through
      }
    }
    const arrMatch = text.match(/\[[\s\S]*\]/);
    if (arrMatch) {
      try {
        return { cards: JSON.parse(arrMatch[0]) };
      } catch (e2) {
        // fall through
      }
    }
    throw new GeminiError('پاسخ هوش مصنوعی در قالب معتبر JSON دریافت نشد.');
  }
}

export interface FlashcardGenParams {
  content?: string;
  file?: { base64: string; mimeType: string; name?: string };
  language: 'persian' | 'bilingual' | 'english';
  cardCount: number;
  cardFormat: 'mcq' | 'standard' | 'mixed';
  specialty: string;
  difficulty: 'easy' | 'medium' | 'hard';
  customInstructions?: string;
}

export interface FlashcardGenResult {
  cards: any[];
  suggestedDeckTitle: string;
  summary: string;
}

export async function generateFlashcardsFromSource(
  params: FlashcardGenParams,
  apiKey: string,
  model: string
): Promise<FlashcardGenResult> {
  const { content, file, language, cardCount, cardFormat, specialty, difficulty, customInstructions } = params;

  if (!content && !file?.base64) {
    throw new GeminiError('لطفاً متن یا فایل منبع (PDF، تصویر یا یادداشت) را ارسال کنید.');
  }

  const languageInstruction =
    language === 'persian'
      ? 'زبان خروجی: فارسی روان و دقیق علمی (اصطلاحات کلیدی پزشکی به انگلیسی در پرانتز آورده شوند).'
      : language === 'bilingual'
      ? 'زبان خروجی: دو زبانه (صورت سوال و توضیحات به فارسی روان همراه با متن دقیق انگلیسی).'
      : 'Language: Professional English with comprehensive medical accuracy.';

  const formatInstruction =
    cardFormat === 'mcq'
      ? `تولید تست‌های استاندارد ۴ گزینه‌ای بالینی (MCQ):
         - "cardType": "mcq"
         - "front": صورت تست یا سناریوی بالینی دقیق (Clinical Vignette)
         - "options": دقیقاً یک آرایه ۴ گزینه‌ای [گزینه ۱، گزینه ۲، گزینه ۳، گزینه ۴]
         - "correctOptionIndex": عدد صحیح بین ۰ تا ۳ که نشان‌دهنده اندیس گزینه صحیح است
         - "correctAnswer": متن دقیق گزینه صحیح
         - "back": تحلیل تشریحی و جامع (پاسخ تشریحی کامل، علت صحیح بودن پاسخ و رد تک‌تک سایر گزینه‌ها)`
      : cardFormat === 'standard'
      ? `تولید فلش‌کارت‌های مفهومی پرسش و پاسخ (Active Recall):
         - "cardType": "standard"
         - "front": سوال تحلیلی یا علامت بالینی یا مکانیسم بیماری/دارو
         - "back": پاسخ دقیق، گام‌به‌گام و مکانیسم پاتوفیزیولوژی`
      : `تولید ترکیبی از تست‌های ۴ گزینه‌ای (MCQ) و فلش‌کارت‌های استاندارد فعال یادآوری.`;

  const systemPrompt = `شما یک استاد برجسته آموزش پزشکی، طراح سوالات آزمون‌های پذیرش دستیاری تخصصی و فوق‌تخصصی پزشکی، و متخصص تکنیک‌های یادگیری تکرار فاصله‌دار (Spaced Repetition) هستید.

وظیفه شما:
فایل/متن ارائه‌شده (کتاب رفرنس، جزوه، اسلاید، تصویر صفحه کتاب یا یادداشت بالینی) را با دقت و جامعیت بررسی کنید و از روی مهم‌ترین نکات امتحانی و بالینی آن، تعداد ${cardCount} کارت/تست با کیفیت فوق‌العاده بالا تولید کنید.

قوانین ساختار خروجی:
۱. سطح دشواری: ${difficulty}
۲. تخصص/مبحث: ${specialty}
۳. ${languageInstruction}
۴. ${formatInstruction}
۵. برای هر کارت حتماً فیلدهای زیر را پر کنید:
   - "keyPoint": یک نکته طلایی و کلیدی کوتاه (High-Yield Pearl)
   - "mnemonic": رمزمفید یا تکنیک یادسپاری (در صورت وجود یا مناسب بودن)
   - "specialty": باید دقیقاً یکی از این دو حالت باشد: یا برابر "${specialty}" و یا در صورتی که از روی محتوای فایل موضوع دقیق‌تری قابل تشخیص است، همان زیرشاخه تخصصی دقیق‌تر (مثلاً "قلب و عروق"، "گوارش")
   - "difficultyRating": "${difficulty}"
   - "tags": ۲ تا ۴ برچسب مرتبط
${customInstructions ? `۶. دستورات اختصاصی کاربر: ${customInstructions}` : ''}

پاسخ را منحصراً در قالب یک آبجکت معتبر JSON با ساختار زیر ارسال کنید (بدون Markdown fencing، فقط JSON خام):
{
  "suggestedDeckTitle": "عنوان پیشنهادی مناسب و دقیق برای این مجموعه کارت بر اساس مبحث منبع",
  "summary": "خلاصه کوتاه ۱ یا ۲ خطی از مباحث پوشش داده شده در این فایل",
  "cards": [
    {
      "cardType": "mcq",
      "front": "متن سوال بالینی...",
      "options": ["گزینه ۱", "گزینه ۲", "گزینه ۳", "گزینه ۴"],
      "correctOptionIndex": 0,
      "correctAnswer": "گزینه ۱",
      "back": "پاسخ تشریحی کامل و تحلیل رد گزینه‌ها...",
      "keyPoint": "نکته طلایی امتحانی...",
      "mnemonic": "کدینگ یادسپاری...",
      "specialty": "${specialty}",
      "difficultyRating": "${difficulty}",
      "tags": ["تگ ۱", "تگ ۲"]
    }
  ]
}`;

  const parts: any[] = [];

  if (file?.base64) {
    let cleanBase64 = file.base64;
    let mimeType = file.mimeType || 'application/pdf';
    if (cleanBase64.includes(';base64,')) {
      const split = cleanBase64.split(';base64,');
      const mimeMatch = split[0].match(/data:([^;]+)/);
      if (mimeMatch) mimeType = mimeMatch[1];
      cleanBase64 = split[1];
    }
    parts.push({ inlineData: { mimeType, data: cleanBase64 } });
  }

  if (content && typeof content === 'string') {
    parts.push({ text: `متن تکمیلی یا یادداشت همراه:\n"""\n${content.slice(0, 30000)}\n"""` });
  }

  parts.push({
    text: 'لطفاً بر اساس فایل و توضیحات بالا، فلش‌کارت‌ها را طبق دستورالعمل دقیقاً در قالب JSON خواسته شده ایجاد کنید.',
  });

  const text = await callGemini({
    apiKey,
    model,
    systemInstruction: systemPrompt,
    parts,
    responseMimeType: 'application/json',
    temperature: 0.25,
  });

  const parsed = parseJsonLoose(text);
  const rawCards = Array.isArray(parsed) ? parsed : parsed.cards || [];
  if (rawCards.length === 0) {
    throw new GeminiError('هوش مصنوعی کارتی برای این محتوا تولید نکرد. لطفاً کیفیت فایل یا متن را بررسی کنید.');
  }

  return {
    cards: rawCards,
    suggestedDeckTitle: parsed.suggestedDeckTitle || (file?.name ? file.name.replace(/\.[^/.]+$/, '') : 'کارت‌های هوش مصنوعی'),
    summary: parsed.summary || `شامل ${rawCards.length} فلش‌کارت استخراج‌شده با هوش مصنوعی`,
  };
}

export interface ExplainReference {
  title: string;
  url: string;
}

export interface ExplainCardResult {
  explanation: string;
  references: ExplainReference[];
}

/**
 * Asks Gemini to produce a deeper, more comprehensive explanation of a
 * flashcard's answer, grounded with real web sources via Gemini's built-in
 * Google Search tool. Returns the explanation text plus a de-duplicated
 * list of reference links pulled from the grounding metadata.
 */
export async function explainCardInDepth(
  card: { front: string; back: string; keyPoint?: string; specialty?: string },
  apiKey: string,
  model: string
): Promise<ExplainCardResult> {
  if (!apiKey) {
    throw new GeminiError('کلید Gemini API تنظیم نشده است. لطفاً ابتدا از بخش تنظیمات، کلید خود را وارد کنید.');
  }

  const systemInstruction = `شما یک استاد و مرجع برجسته آموزش پزشکی هستید. وظیفه شما ارائه یک توضیح جامع‌تر، عمیق‌تر و دقیق‌تر علمی برای پاسخ یک فلش‌کارت پزشکی است، با استفاده از جستجوی وب برای یافتن رفرنس‌های معتبر و به‌روز (مانند UpToDate، کتب مرجع مانند Harrison/Robbins/Katzung، مقالات PubMed/NEJM/Lancet، یا منابع دانشگاهی معتبر).

قوانین پاسخ:
۱. ابتدا موضوع را در وب جستجو کن تا مطمئن شوی توضیح دقیق و به‌روز است.
۲. پاسخ را به زبان فارسی روان (با اصطلاحات کلیدی انگلیسی در پرانتز) و به‌صورت ساختاریافته با تیتر‌های کوتاه (با **) و بولت (با -) بنویس.
۳. مکانیسم فیزیوپاتولوژیک/فارماکولوژیک، نکات بالینی افتراقی، و اگر مرتبط است رفرنس دقیق کتاب/گایدلاین را ذکر کن.
۴. طولانی‌تر و عمیق‌تر از پاسخ اصلی کارت باش، اما دقیق و بدون حاشیه‌روی غیرضروری (حداکثر حدود ۳۰۰ تا ۴۰۰ کلمه).
۵. از تکرار عین متن پاسخ کارت پرهیز کن؛ روی افزودن عمق و جزئیات تمرکز کن.`;

  const promptText = `سوال/روی کارت:\n${card.front}\n\nپاسخ فعلی کارت:\n${card.back}\n${
    card.keyPoint ? `\nنکته کلیدی فعلی:\n${card.keyPoint}\n` : ''
  }${card.specialty ? `\nتخصص/مبحث: ${card.specialty}\n` : ''}\nلطفاً یک توضیح تشریحی جامع‌تر و عمیق‌تر با استفاده از جستجوی منابع معتبر پزشکی ارائه بده.`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: promptText }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    tools: [{ google_search: {} }],
    generationConfig: { temperature: 0.3 },
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new GeminiError('اتصال به سرور Gemini برقرار نشد. اتصال اینترنت خود را بررسی کنید.');
  }

  if (!response.ok) {
    let message = `خطای Gemini API (کد ${response.status})`;
    try {
      const errData = await response.json();
      if (errData?.error?.message) {
        if (response.status === 400 && /API key/i.test(errData.error.message)) {
          message = 'کلید Gemini API نامعتبر است. لطفاً کلید را در تنظیمات بررسی کنید.';
        } else if (response.status === 429) {
          message = 'محدودیت درخواست Gemini API. کمی صبر کنید و دوباره تلاش کنید.';
        } else {
          message = errData.error.message;
        }
      }
    } catch (e) {
      // ignore, use default message
    }
    throw new GeminiError(message);
  }

  const data = await response.json();
  const candidate = data?.candidates?.[0];
  const explanation: string =
    candidate?.content?.parts?.map((p: any) => p.text || '').join('') || '';

  if (!explanation) {
    const finishReason = candidate?.finishReason;
    if (finishReason === 'SAFETY') {
      throw new GeminiError('محتوای ورودی توسط فیلترهای ایمنی Gemini مسدود شد.');
    }
    throw new GeminiError('پاسخی از Gemini دریافت نشد. لطفاً دوباره تلاش کنید.');
  }

  // Extract reference links from grounding metadata (Google Search tool results)
  const chunks = candidate?.groundingMetadata?.groundingChunks || [];
  const seenUrls = new Set<string>();
  const references: ExplainReference[] = [];
  for (const chunk of chunks) {
    const web = chunk?.web;
    if (web?.uri && !seenUrls.has(web.uri)) {
      seenUrls.add(web.uri);
      references.push({ title: web.title || web.uri, url: web.uri });
    }
  }

  return { explanation, references };
}

export async function analyzeStudyPerformance(
  promptText: string,
  apiKey: string,
  model: string
): Promise<string> {
  return callGemini({
    apiKey,
    model,
    systemInstruction:
      'شما یک مربی تحصیلی متخصص در پزشکی و روش‌های یادگیری تکرار فاصله‌دار هستید. بر اساس آمار مطالعه کاربر، نقاط قوت، نقاط ضعف و توصیه‌های عملی و مشخص ارائه دهید. پاسخ را به فارسی، خوانا، با استفاده از تیتر‌های کوتاه با ** و بولت‌های با - بنویسید. از کلی‌گویی پرهیز کنید و دقیقاً به مباحث و تخصص‌های ذکر شده در داده‌ها اشاره کنید.',
    parts: [{ text: promptText }],
    temperature: 0.4,
  });
}
