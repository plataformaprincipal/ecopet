/**
 * TranslationService — tradução automática server-side.
 * Provedores: OpenAI (padrão) | DeepL | Google (via env)
 * Chaves NUNCA expostas ao frontend.
 */

const MAX_CHARS = 5000;
const MAX_BATCH = 50;
const CACHE_MAX = 2000;

interface CacheEntry {
  text: string;
  ts: number;
}

const cache = new Map<string, CacheEntry>();
const failureLog: { at: string; error: string }[] = [];

function cacheKey(source: string, target: string, text: string) {
  return `${source}|${target}|${text.slice(0, 200)}|${text.length}`;
}

function getCached(key: string): string | undefined {
  const e = cache.get(key);
  if (!e) return undefined;
  return e.text;
}

function setCache(key: string, text: string) {
  if (cache.size >= CACHE_MAX) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
  cache.set(key, { text, ts: Date.now() });
}

function logFailure(error: string) {
  failureLog.push({ at: new Date().toISOString(), error });
  if (failureLog.length > 100) failureLog.shift();
  console.error("[TranslationService]", error);
}

async function translateWithOpenAI(text: string, target: string, source: string): Promise<string> {
  const OpenAI = (await import("openai")).default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Translate the following text from ${source} to ${target}. Return ONLY the translation, no quotes.`,
      },
      { role: "user", content: text },
    ],
    max_tokens: Math.min(4000, text.length * 2),
  });
  return completion.choices[0]?.message?.content?.trim() || text;
}

async function translateWithDeepL(text: string, target: string, source: string): Promise<string> {
  const key = process.env.DEEPL_API_KEY!;
  const targetLang = target.split("-")[0].toUpperCase();
  const sourceLang = source.split("-")[0].toUpperCase();
  const params = new URLSearchParams({
    auth_key: key,
    text,
    target_lang: targetLang === "PT" ? "PT-BR" : targetLang,
    source_lang: sourceLang,
  });
  const res = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  if (!res.ok) throw new Error(`DeepL error: ${res.status}`);
  const data = (await res.json()) as { translations: { text: string }[] };
  return data.translations[0]?.text ?? text;
}

export async function translateText(
  text: string,
  targetLocale: string,
  sourceLocale = "pt-BR"
): Promise<{ translated: string; cached: boolean; provider: string }> {
  if (!text?.trim()) return { translated: text, cached: false, provider: "none" };
  if (text.length > MAX_CHARS) {
    logFailure(`Text exceeds ${MAX_CHARS} chars`);
    return { translated: text, cached: false, provider: "fallback" };
  }
  if (targetLocale === sourceLocale) return { translated: text, cached: false, provider: "same" };

  const key = cacheKey(sourceLocale, targetLocale, text);
  const cached = getCached(key);
  if (cached) return { translated: cached, cached: true, provider: "cache" };

  try {
    let translated = text;
    let provider = "fallback";

    if (process.env.DEEPL_API_KEY) {
      translated = await translateWithDeepL(text, targetLocale, sourceLocale);
      provider = "deepl";
    } else if (process.env.OPENAI_API_KEY) {
      translated = await translateWithOpenAI(text, targetLocale, sourceLocale);
      provider = "openai";
    } else if (process.env.GOOGLE_TRANSLATE_API_KEY) {
      const url = `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: text, source: sourceLocale.split("-")[0], target: targetLocale.split("-")[0] }),
      });
      if (res.ok) {
        const data = (await res.json()) as { data: { translations: { translatedText: string }[] } };
        translated = data.data.translations[0]?.translatedText ?? text;
        provider = "google";
      }
    }

    setCache(key, translated);
    return { translated, cached: false, provider };
  } catch (e) {
    logFailure(e instanceof Error ? e.message : "Unknown error");
    return { translated: text, cached: false, provider: "fallback" };
  }
}

export async function translateBatch(
  texts: Record<string, string>,
  targetLocale: string,
  sourceLocale = "pt-BR"
): Promise<Record<string, string>> {
  const entries = Object.entries(texts).slice(0, MAX_BATCH);
  const out: Record<string, string> = {};
  for (const [k, v] of entries) {
    const { translated } = await translateText(v, targetLocale, sourceLocale);
    out[k] = translated;
  }
  return out;
}

export async function detectLanguage(text: string): Promise<{ language: string; confidence: number }> {
  if (!text?.trim()) return { language: "pt-BR", confidence: 0 };
  if (text.length > MAX_CHARS) return { language: "unknown", confidence: 0 };

  try {
    if (process.env.OPENAI_API_KEY) {
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: 'Detect language. Reply JSON only: {"language":"pt-BR","confidence":0.95}',
          },
          { role: "user", content: text.slice(0, 500) },
        ],
        max_tokens: 50,
      });
      const raw = completion.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(raw) as { language: string; confidence: number };
      return parsed;
    }
    return { language: "pt-BR", confidence: 0.5 };
  } catch (e) {
    logFailure(`detectLanguage: ${e instanceof Error ? e.message : "error"}`);
    return { language: "pt-BR", confidence: 0 };
  }
}

export function getFailureLogs() {
  return [...failureLog];
}

export const TranslationService = { translateText, translateBatch, detectLanguage, getFailureLogs };
