import { z } from "zod";
import { emailSchema } from "@/schemas/auth";
import { PASSWORD_MISMATCH_MESSAGE } from "@/lib/password/validate-strong-password";
import { sanitizePhoneInput } from "@/lib/validation/international-phone";

export const forgotPasswordSchema = z
  .object({
    identifier: z.string().optional(),
    email: z.string().optional(),
  })
  .transform((data) => ({
    identifier: (data.identifier ?? data.email ?? "").trim(),
  }))
  .refine((data) => data.identifier.length > 0, {
    message: "Informe e-mail ou telefone",
    path: ["identifier"],
  })
  .refine(
    (data) => {
      if (data.identifier.includes("@")) return true;
      const sanitized = sanitizePhoneInput(data.identifier);
      return sanitized.replace(/\D/g, "").length >= 8;
    },
    { message: "Informe um e-mail ou telefone válido", path: ["identifier"] }
  );

export const verifyResetCodeSchema = z.object({
  identifier: z.string().min(1, "Informe e-mail ou telefone"),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Informe o código de 6 dígitos"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token obrigatório"),
    password: z.string().min(1, "Senha obrigatória"),
    confirmPassword: z.string().min(1, "Confirmar nova senha é obrigatório"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: PASSWORD_MISMATCH_MESSAGE,
    path: ["confirmPassword"],
  });

/** Compatibilidade legada */
export const forgotPasswordEmailSchema = z.object({
  email: emailSchema,
});
