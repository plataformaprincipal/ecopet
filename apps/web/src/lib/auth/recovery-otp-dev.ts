import fs from "fs";

/** Expõe OTP em testes automatizados — nunca sem AUTH_TEST_EXPOSE_OTP=1. */
export function exposeDevOtp(otp: string): string | undefined {
  if (process.env.AUTH_TEST_EXPOSE_OTP !== "1") return undefined;
  return otp;
}

export function writeDevOtpFile(otp: string): void {
  if (process.env.AUTH_TEST_EXPOSE_OTP !== "1") return;
  const file = process.env.PASSWORD_RESET_TEST_OTP_FILE?.trim();
  if (!file) return;
  try {
    fs.writeFileSync(file, otp, "utf8");
  } catch {
    /* ignore */
  }
}
