import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  handleScriptOnError,
  isVLibrasLoadReady,
  nextScriptUrl,
  vlibrasFromScriptEvent,
  vlibrasReady,
} from "./vlibras-load-outcome";
import { VLIBRAS_AVATAR_POLL_MS, VLIBRAS_AVATAR_TIMEOUT_MS } from "./constants";

describe("vlibras-load-outcome", () => {
  it("handleScriptOnError não lança exceção e retorna unavailable", () => {
    assert.doesNotThrow(() => handleScriptOnError());
    const outcome = handleScriptOnError();
    assert.equal(outcome.status, "unavailable");
    assert.equal(isVLibrasLoadReady(outcome), false);
  });

  it("timeout retorna status timeout sem lançar", () => {
    const outcome = vlibrasFromScriptEvent("timeout");
    assert.equal(outcome.status, "timeout");
    assert.doesNotThrow(() => outcome);
  });

  it("button-missing retorna unavailable (sem falso positivo ready)", () => {
    const outcome = vlibrasFromScriptEvent("button-missing");
    assert.equal(outcome.status, "unavailable");
    assert.equal(isVLibrasLoadReady(outcome), false);
  });

  it("vlibrasReady indica sucesso", () => {
    assert.equal(isVLibrasLoadReady(vlibrasReady()), true);
  });

  it("nextScriptUrl tenta fallback secundário", () => {
    const urls = [
      "https://vlibras.gov.br/app/vlibras-plugin.js",
      "https://www.vlibras.gov.br/app/vlibras-plugin.js",
    ] as const;
    assert.equal(
      nextScriptUrl(urls, ["https://vlibras.gov.br/app/vlibras-plugin.js"]),
      "https://www.vlibras.gov.br/app/vlibras-plugin.js"
    );
    assert.equal(nextScriptUrl(urls, [...urls]), null);
  });

  it("poll do avatar: 500ms por até 10s", () => {
    assert.equal(VLIBRAS_AVATAR_POLL_MS, 500);
    assert.equal(VLIBRAS_AVATAR_TIMEOUT_MS, 10_000);
  });
});
