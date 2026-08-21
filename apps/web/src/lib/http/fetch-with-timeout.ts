export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit & { timeoutMs?: number }
): Promise<Response> {
  const timeoutMs = init?.timeoutMs ?? 12_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  init?.signal?.addEventListener("abort", onAbort);

  try {
    return await fetch(input, { ...init, signal: controller.signal, credentials: init?.credentials ?? "include" });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("A solicitação demorou demais. Tente novamente.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
    init?.signal?.removeEventListener("abort", onAbort);
  }
}
