import rateLimit from "express-rate-limit";

/** Limite global por IP nos endpoints públicos de recuperação de senha */
export const forgotPasswordIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Se o e-mail estiver cadastrado, enviaremos instruções para redefinição da senha.",
  },
});

export const resetPasswordIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas. Aguarde e tente novamente mais tarde." },
});
