import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { TranslationService } from "../services/translation-service.js";

const router = Router();

const translateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Limite de traduções excedido. Tente novamente em 1 minuto." },
});

const textSchema = z.object({
  text: z.string().min(1).max(5000),
  targetLocale: z.string().min(2).max(10),
  sourceLocale: z.string().min(2).max(10).optional(),
});

const batchSchema = z.object({
  texts: z.record(z.string(), z.string().max(5000)).refine((o) => Object.keys(o).length <= 50, {
    message: "Máximo 50 chaves por lote",
  }),
  targetLocale: z.string().min(2).max(10),
  sourceLocale: z.string().min(2).max(10).optional(),
});

const detectSchema = z.object({
  text: z.string().min(1).max(5000),
});

router.post("/text", translateLimiter, async (req, res, next) => {
  try {
    const { text, targetLocale, sourceLocale } = textSchema.parse(req.body);
    const result = await TranslationService.translateText(text, targetLocale, sourceLocale ?? "pt-BR");
    res.json({ translated: result.translated, cached: result.cached, provider: result.provider });
  } catch (e) {
    next(e);
  }
});

router.post("/batch", translateLimiter, async (req, res, next) => {
  try {
    const { texts, targetLocale, sourceLocale } = batchSchema.parse(req.body);
    const translations = await TranslationService.translateBatch(texts, targetLocale, sourceLocale ?? "pt-BR");
    res.json({ translations });
  } catch (e) {
    next(e);
  }
});

router.post("/detect", translateLimiter, async (req, res, next) => {
  try {
    const { text } = detectSchema.parse(req.body);
    const result = await TranslationService.detectLanguage(text);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
