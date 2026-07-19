export class GoogleMapsConfigError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "GoogleMapsConfigError";
    this.code = code;
  }
}

export class GoogleMapsApiError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  constructor(code: string, message: string, retryable = false) {
    super(message);
    this.name = "GoogleMapsApiError";
    this.code = code;
    this.retryable = retryable;
  }
}

export function sanitizeMapsErrorMessage(message: string | undefined): string {
  if (!message) return "UNKNOWN_ERROR";
  return message
    .replace(/key=[A-Za-z0-9_-]+/gi, "key=[redacted]")
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, "[redacted-key]")
    .slice(0, 240);
}
