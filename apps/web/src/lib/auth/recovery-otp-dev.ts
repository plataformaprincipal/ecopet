import fs from "fs";

/** Expõe OTP em testes automatizados — nunca em produção. */
export function exposeDevOtp(otp: string): string | undefined {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
    return undefined;
  }
  if (process.env.AUTH_TEST_EXPOSE_OTP !== "1") return undefined;
  return otp;
}

export function writeDevOtpFile(otp: string): void {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
    return;
  }
  if (process.env.AUTH_TEST_EXPOSE_OTP !== "1") return;
  const file = process.env.PASSWORD_RESET_TEST_OTP_FILE?.trim();
  if (!file) return;
  try {
    fs.writeFileSync(file, otp, "utf8");
  } catch {
    /* ignore */
  }
}
