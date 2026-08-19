import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Check if server-side AI is available
  app.get("/api/ai/status", (_req, res) => {
    const hasKey = !!process.env.GEMINI_API_KEY;
    res.json({
      available: hasKey,
      model: "gemini-3.7-flash",
      supportedFormats: ["pdf", "image/jpeg", "image/png", "image/webp", "txt", "docx", "md"],
    });
  });

  // Server-side AI generation endpoint for medical flashcards from files or text
  app.post("/api/ai/generate-flashcards", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          error: "GEMINI_API_KEY is not configured in the project secrets. Please add GEMINI_API_KEY in the Settings > Secrets panel or use the AI Prompt Generator.",
        });
      }

      const {
        content,
        file, // { base64: string, mimeType: string, name?: string }
        language = "persian",
        cardCount = 10,
        cardFormat = "mcq", // 'mcq' | 'standard' | 'mixed'
        specialty = "پزشکی عمومی / بالینی",
        difficulty = "medium",
        customInstructions = "",
      } = req.body;

      if (!content && !file?.base64) {
        return res.status(400).json({ error: "لطفاً متن یا فایل منبع (PDF، تصویر یا یادداشت) را ارسال کنید." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const languageInstruction =
        language === "persian"
          ? "زبان خروجی: فارسی روان و دقیق علمی (اصطلاحات کلیدی پزشکی به انگلیسی در پرانتز آورده شوند)."
          : language === "bilingual"
          ? "زبان خروجی: دو زبانه (صورت سوال و توضیحات به فارسی روان همراه با متن دقیق انگلیسی)."
          : "Language: Professional English with comprehensive medical accuracy.";

      const formatInstruction =
        cardFormat === "mcq"
          ? `تولید تست‌های استاندارد ۴ گزینه‌ای بالینی (MCQ):
             - "cardType": "mcq"
             - "front": صورت تست یا سناریوی بالینی دقیق (Clinical Vignette)
             - "options": دقیقاً یک آرایه ۴ گزینه‌ای [گزینه ۱، گزینه ۲، گزینه ۳، گزینه ۴]
             - "correctOptionIndex": عدد صحیح بین ۰ تا ۳ که نشان‌دهنده اندیس گزینه صحیح است
             - "correctAnswer": متن دقیق گزینه صحیح
             - "back": تحلیل تشریحی و جامع (پاسخ تشریحی کامل، علت صحیح بودن پاسخ و رد تک‌تک سایر گزینه‌ها)`
          : cardFormat === "standard"
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
   - "specialty": "${specialty}"
   - "difficultyRating": "${difficulty}"
   - "tags": ۲ تا ۴ برچسب مرتبط
${customInstructions ? `۶. دستورات اختصاصی کاربر: ${customInstructions}` : ""}

پاسخ را منحصراً در قالب یک آبجکت معتبر JSON با ساختار زیر ارسال کنید:
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

      // Build content parts
      const parts: any[] = [];

      if (file?.base64) {
        // Clean base64 header if present (e.g. data:application/pdf;base64,...)
        let cleanBase64 = file.base64;
        let mimeType = file.mimeType || "application/pdf";
        if (cleanBase64.includes(";base64,")) {
          const split = cleanBase64.split(";base64,");
          const mimeMatch = split[0].match(/data:([^;]+)/);
          if (mimeMatch) mimeType = mimeMatch[1];
          cleanBase64 = split[1];
        }

        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64,
          },
        });
      }

      if (content && typeof content === "string") {
        parts.push({
          text: `متن تکمیلی یا یادداشت همراه:\n"""\n${content.slice(0, 30000)}\n"""`,
        });
      }

      parts.push({
        text: `لطفاً بر اساس فایل و توضیحات بالا، فلش‌کارت‌ها را طبق دستورالعمل دقیقاً در قالب JSON خواسته شده ایجاد کنید.`,
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: { parts },
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const text = response.text || "{}";
      let parsedData: any = {};
      try {
        parsedData = JSON.parse(text);
      } catch (parseErr) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          // Check if it returned a direct array
          const arrMatch = text.match(/\[[\s\S]*\]/);
          if (arrMatch) {
            parsedData = { cards: JSON.parse(arrMatch[0]), suggestedDeckTitle: "فلش‌کارت‌های استخراج‌شده با هوش مصنوعی" };
          } else {
            throw new Error("پاسخ هوش مصنوعی در قالب معتبر JSON دریافت نشد.");
          }
        }
      }

      const rawCards = Array.isArray(parsedData) ? parsedData : parsedData.cards || [];
      const suggestedDeckTitle = parsedData.suggestedDeckTitle || (file?.name ? file.name.replace(/\.[^/.]+$/, "") : "کارت‌های هوش مصنوعی");
      const summary = parsedData.summary || `شامل ${rawCards.length} فلش‌کارت استخراج‌شده با هوش مصنوعی`;

      return res.json({
        success: true,
        cards: rawCards,
        suggestedDeckTitle,
        summary,
        count: rawCards.length,
      });
    } catch (err: any) {
      console.error("AI File Generation Error:", err);
      return res.status(500).json({
        error: err.message || "خطا در پردازش هوش مصنوعی فایل",
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MedFlash Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
