/**
 * Retry exponencial para erros recuperáveis da OpenAI.
 * Nunca usar em operações não-idempotentes sem análise.
 */
export type RetryOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** Se retornar false, não retenta. */
  isRetryable?: (error: unknown) => boolean;
};

const DEFAULT_RETRYABLE = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const e = error as { status?: number; code?: string; message?: string };
  const status = e.status;
  if (status === 429 || status === 408 || status === 500 || status === 502 || status === 503) {
    return true;
  }
  const code = String(e.code ?? "").toLowerCase();
  if (code.includes("rate_limit") || code.includes("timeout") || code.includes("overloaded")) {
    return true;
  }
  const msg = String(e.message ?? "").toLowerCase();
  return msg.includes("rate limit") || msg.includes("timeout") || msg.includes("econnreset");
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {}
): Promise<T> {
  const maxAttempts = Math.max(1, opts.maxAttempts ?? 3);
  const baseDelayMs = opts.baseDelayMs ?? 400;
  const maxDelayMs = opts.maxDelayMs ?? 8_000;
  const isRetryable = opts.isRetryable ?? DEFAULT_RETRYABLE;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (attempt >= maxAttempts || !isRetryable(e)) throw e;
      const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      const jitter = Math.floor(Math.random() * 100);
      await sleep(delay + jitter);
    }
  }
  throw lastError;
}
