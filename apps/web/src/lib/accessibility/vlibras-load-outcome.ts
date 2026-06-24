export type VLibrasLoadStatus = "ready" | "unavailable" | "timeout" | "failed";

export type VLibrasLoadOutcome = { status: VLibrasLoadStatus };

export function vlibrasReady(): VLibrasLoadOutcome {
  return { status: "ready" };
}

/** Mapeia falha de carregamento do script — nunca lança exceção. */
export function vlibrasFromScriptEvent(
  event: "onerror" | "timeout" | "init-failed" | "global-missing" | "button-missing"
): VLibrasLoadOutcome {
  switch (event) {
    case "timeout":
      return { status: "timeout" };
    case "onerror":
      return { status: "unavailable" };
    case "global-missing":
    case "button-missing":
      return { status: "unavailable" };
    case "init-failed":
      return { status: "unavailable" };
  }
}

export function isVLibrasLoadReady(outcome: VLibrasLoadOutcome): boolean {
  return outcome.status === "ready";
}

/** Handler seguro para script.onerror — usado pelo loader e testes. */
export function handleScriptOnError(): VLibrasLoadOutcome {
  return vlibrasFromScriptEvent("onerror");
}

/** Próxima URL de script a tentar (fallback secundário). */
export function nextScriptUrl(
  urls: readonly string[],
  attempted: readonly string[]
): string | null {
  return urls.find((url) => !attempted.includes(url)) ?? null;
}
