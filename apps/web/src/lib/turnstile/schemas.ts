import { z } from "zod";
import { isTurnstileAction } from "./actions";
import { TURNSTILE_TOKEN_MAX_LENGTH, TURNSTILE_TOKEN_MIN_LENGTH } from "./constants";

export const turnstileTokenSchema = z
  .string()
  .min(TURNSTILE_TOKEN_MIN_LENGTH, "TOKEN_MALFORMED")
  .max(TURNSTILE_TOKEN_MAX_LENGTH, "TOKEN_MALFORMED")
  .regex(/^[A-Za-z0-9._\-]+$/, "TOKEN_MALFORMED");

export const turnstileActionSchema = z.string().refine(isTurnstileAction, {
  message: "ACTION_MISMATCH",
});

export const turnstileClientPayloadSchema = z.object({
  turnstileToken: turnstileTokenSchema.optional().nullable(),
  turnstileAction: turnstileActionSchema.optional(),
});

/** Resposta tipada do siteverify (campos usados internamente). */
export const cloudflareSiteverifySchema = z.object({
  success: z.boolean(),
  "error-codes": z.array(z.string()).optional(),
  challenge_ts: z.string().optional(),
  hostname: z.string().optional(),
  action: z.string().optional(),
  cdata: z.string().optional(),
});

export type CloudflareSiteverifyResponse = z.infer<typeof cloudflareSiteverifySchema>;
