import { z } from "zod";
import { emailSchema } from "@/schemas/auth";
import { PASSWORD_MISMATCH_MESSAGE } from "@/lib/password/validate-strong-password";

export const forgotPasswordSchema = z.object({
  email: emailSchema,
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
