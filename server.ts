import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, aiConfigured: Boolean(process.env.GEMINI_API_KEY) });
  });

  // 1. Interactive AI Tutor Chat (Arabic Mode / English Mode / Roleplay / Simpler Re-explain)
  app.post('/api/tutor/chat', async (req, res) => {
    try {
      const {
        messages = [],
        mode = 'arabic',
        studentName = 'الطالب',
        studentLevel = 1,
        currentTopic = 'عام',
        explainInArabic = false,
        simplerExplanation = false,
        scenario = null,
        studentRole = 'student',
      } = req.body ?? {};

      const ai = getGeminiClient();

      const levelLabels: Record<number, string> = {
        1: 'المستوى 1: الحروف وقواعد النطق (مبتدئ تمامًا)',
        2: 'المستوى 2: أقسام الكلام والقواعد الأساسية',
        3: 'المستوى 3: التحيات والأرقام والأوقات والأساسيات',
        4: 'المستوى 4: في المدينة والخدمات العامة',
        5: 'المستوى 5: السفر والفندق والمطعم والمطار والبنك',
        6: 'المستوى 6: الصحة والطبيب والملابس والمنزل والسوق',
      };

      const roleInstructions = scenario
        ? `You are conducting a realistic roleplay scenario: "${scenario.title}" (${scenario.titleEn}).
The student chose the role: "${studentRole}". You must play the OTHER role naturally and keep the dialogue grounded in practical everyday English from the curriculum.`
        : '';

      const systemInstruction = `You are "الأستاذ ماستر" (Master Tutor), the official personal English teacher in the ENGLISH MASTER application, teaching beginners based on the book «تكلم الإنجليزية في عشرة أيام» by حسن العربي.
Student Name: ${studentName}
Student Level: ${levelLabels[studentLevel] || levelLabels[1]}
Current Topic: ${currentTopic}
Active Mode: ${mode === 'english' ? 'English Mode (Speak primarily in clear, level-appropriate English)' : 'Arabic Mode (Explain clearly in Arabic while teaching English step by step)'}
${explainInArabic ? 'CRITICAL: The student pressed "اشرح بالعربية". Explain your previous or current English point clearly in Arabic with easy examples.' : ''}
${simplerExplanation ? 'CRITICAL: The student did not understand and asked for a simpler explanation ("إعادة الشرح بطريقة أسهل"). Break it down into very simple steps with everyday analogies.' : ''}
${roleInstructions}

Your pedagogical responsibilities:
1. Correct any English mistakes kindly and clearly, showing the corrected sentence.
2. Always include Arabic pronunciation approximations when introducing new words (e.g., Book = بُوك) alongside encouraging feedback.
3. Ask ONE clear follow-up question or short exercise at the end of your reply and wait for the student's answer.
4. Keep responses concise, structured, warm, and encouraging—never overwhelming.
5. Return ONLY valid JSON matching the schema.`;

      const formattedHistory = Array.isArray(messages)
        ? messages
            .slice(-14)
            .map((m: { role: string; text: string }) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.text}`)
            .join('\n')
        : '';

      const prompt = formattedHistory
        ? `Conversation so far:\n${formattedHistory}\n\nRespond as the Tutor to the student's latest message (or start the lesson/roleplay if this is the beginning).`
        : `Start an interactive session with ${studentName} on topic "${currentTopic}". Greet them warmly, give one key concept or question, and wait for their reply.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description: 'Main tutor response text (Arabic in Arabic mode, English in English mode).',
              },
              englishSpeech: {
                type: Type.STRING,
                description: 'Pure English phrase or sentence from the reply to be read aloud via English TTS (leave empty if none).',
              },
              arabicTranslation: {
                type: Type.STRING,
                description: 'Arabic translation or explanation of the English part (especially helpful in English mode).',
              },
              correction: {
                type: Type.OBJECT,
                properties: {
                  hasMistake: { type: Type.BOOLEAN },
                  original: { type: Type.STRING },
                  corrected: { type: Type.STRING },
                  explanationAr: { type: Type.STRING },
                },
              },
              newWords: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    en: { type: Type.STRING },
                    ar: { type: Type.STRING },
                    pronunciationAr: { type: Type.STRING },
                  },
                },
              },
              suggestedReplies: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2-3 short helpful reply options the beginner student can click or say.',
              },
            },
            required: ['reply', 'englishSpeech', 'arabicTranslation', 'suggestedReplies'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown server error';
      console.error('Error in /api/tutor/chat:', errMsg);
      res.status(500).json({
        error: errMsg,
        reply: 'عذراً، تعذر الاتصال بالمعلم الذكي حالياً. تأكد من إعداد مفتاح GEMINI_API_KEY في الإعدادات السرية.',
        englishSpeech: '',
        arabicTranslation: '',
        suggestedReplies: ['Hello!', 'I want to practice greetings'],
      });
    }
  });

  // 2. Evaluate Voice or Text Conversation (End-of-Session Report)
  app.post('/api/tutor/evaluate-conversation', async (req, res) => {
    try {
      const { transcript = [], studentLevel = 1, scenarioTitle = 'محادثة يومية' } = req.body ?? {};
      const ai = getGeminiClient();

      const dialogueText = Array.isArray(transcript)
        ? transcript.map((m: { role: string; text: string }) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.text}`).join('\n')
        : '';

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Evaluate this beginner English student's conversation (Level ${studentLevel}, Topic: ${scenarioTitle}):\n\n${dialogueText}`,
        config: {
          systemInstruction: `You are an encouraging English language examiner analyzing an Arabic-speaking beginner's conversation.
Be accurate and fair. Never claim acoustic phoneme analysis since you only see the text transcript.
Provide all explanations and tips in clear Arabic.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER, description: 'Score out of 100' },
              correctSentences: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              mistakes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    said: { type: Type.STRING },
                    correction: { type: Type.STRING },
                    explanationAr: { type: Type.STRING },
                  },
                },
              },
              newWords: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    en: { type: Type.STRING },
                    ar: { type: Type.STRING },
                  },
                },
              },
              tipsAr: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              encouragementAr: { type: Type.STRING },
            },
            required: ['score', 'correctSentences', 'mistakes', 'newWords', 'tipsAr', 'encouragementAr'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in /api/tutor/evaluate-conversation:', errMsg);
      res.status(500).json({ error: errMsg });
    }
  });

  // 3. Generate Level Placement / Adaptive Exercise / Situation Evaluation
  app.post('/api/tutor/evaluate-sentence', async (req, res) => {
    try {
      const { situationAr, studentSentence, targetSample } = req.body ?? {};
      const ai = getGeminiClient();

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Situation (Arabic): ${situationAr}\nReference Example: ${targetSample}\nStudent's English Sentence: ${studentSentence}`,
        config: {
          systemInstruction: `Evaluate if the beginner student's English sentence fits the situation grammatically and practically. Give concise feedback in Arabic.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isCorrect: { type: Type.BOOLEAN },
              score: { type: Type.INTEGER },
              correctedSentence: { type: Type.STRING },
              feedbackAr: { type: Type.STRING },
            },
            required: ['isCorrect', 'score', 'correctedSentence', 'feedbackAr'],
          },
        },
      });

      res.json(JSON.parse((response.text ?? '{}').trim()));
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: errMsg });
    }
  });

  // 4. Adaptive Placement / Custom Drill Generator
  app.post('/api/tutor/generate-exercise', async (req, res) => {
    try {
      const { studentLevel = 1, weakWords = [], topic = 'المحادثة والقواعد' } = req.body ?? {};
      const ai = getGeminiClient();

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Create 4 tailored beginner multiple-choice English questions for an Arabic learner at Level ${studentLevel} focusing on topic "${topic}" and these weak words if any: ${JSON.stringify(weakWords.slice(0, 8))}.`,
        config: {
          systemInstruction: `Return 4 clear questions in JSON. Each question has an Arabic prompt, optional English snippet, 4 choices, correctIndex (0-3), and an Arabic explanation.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    promptAr: { type: Type.STRING },
                    englishText: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctIndex: { type: Type.INTEGER },
                    explanationAr: { type: Type.STRING },
                  },
                  required: ['promptAr', 'options', 'correctIndex', 'explanationAr'],
                },
              },
            },
            required: ['questions'],
          },
        },
      });

      res.json(JSON.parse((response.text ?? '{}').trim()));
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: errMsg });
    }
  });

  const httpServer = http.createServer(app);

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const enableHmr = process.env.ENABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: enableHmr,
        ws: enableHmr ? { server: httpServer } : false,
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });

    if (!enableHmr) {
      app.get('/@vite/client', (_req, res) => {
        res.type('application/javascript').send(`
import "/@vite/env";

const sheetsMap = new Map();
const linkSheetsMap = new Map();
if ("document" in globalThis) {
  document.querySelectorAll("style[data-vite-dev-id]").forEach((el) => {
    sheetsMap.set(el.getAttribute("data-vite-dev-id"), el);
  });
  document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id]').forEach((el) => {
    linkSheetsMap.set(el.getAttribute("data-vite-dev-id"), el);
  });
}

let lastInsertedStyle;
export function updateStyle(id, content) {
  if (linkSheetsMap.has(id)) return;
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement("style");
    style.setAttribute("type", "text/css");
    style.setAttribute("data-vite-dev-id", id);
    style.textContent = content;
    if (!lastInsertedStyle) {
      document.head.appendChild(style);
      setTimeout(() => {
        lastInsertedStyle = undefined;
      }, 0);
    } else {
      lastInsertedStyle.insertAdjacentElement("afterend", style);
    }
    lastInsertedStyle = style;
  } else if (style.textContent !== content) {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}

export function removeStyle(id) {
  if (linkSheetsMap.has(id)) {
    document.querySelectorAll(\`link[rel="stylesheet"][data-vite-dev-id="\${CSS.escape(id)}"]\`).forEach((el) => el.remove());
    linkSheetsMap.delete(id);
  }
  const style = sheetsMap.get(id);
  if (style) {
    document.head.removeChild(style);
    sheetsMap.delete(id);
  }
}

export function createHotContext() {
  return {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    invalidate() {},
    decline() {},
    on() {},
    off() {},
    send() {},
  };
}

export function injectQuery(url, queryToInject) {
  if (url[0] !== "." && url[0] !== "/") return url;
  const pathname = url.replace(/[?#].*$/, "");
  const { search, hash } = new URL(url, "http://vite.dev");
  return \`\${pathname}?\${queryToInject}\${search ? "&" + search.slice(1) : ""}\${hash || ""}\`;
}

export class ErrorOverlay extends HTMLElement {}
`);
      });
    }

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`ENGLISH MASTER server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
