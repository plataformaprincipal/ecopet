export async function withDuration<T>(fn: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
  const start = Date.now();
  const result = await fn();
  return { result, durationMs: Date.now() - start };
}

export function durationSince(startMs: number): number {
  return Date.now() - startMs;
}
