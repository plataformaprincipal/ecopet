import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  collectUniqueErrorMessages,
  duplicateRegistrationError,
} from "./collect-step-errors";
import { USER_ALREADY_REGISTERED_MESSAGE } from "./document-messages";

describe("collect-step-errors", () => {
  it("retorna mensagem única", () => {
    assert.deepEqual(collectUniqueErrorMessages({ email: "Digite um e-mail válido." }), [
      "Digite um e-mail válido.",
    ]);
  });

  it("remove duplicatas e valores vazios", () => {
    assert.deepEqual(
      collectUniqueErrorMessages({
        a: "Informe o CPF.",
        b: "Informe o CPF.",
        c: "",
      }),
      ["Informe o CPF."]
    );
  });

  it("lista múltiplos erros distintos", () => {
    const messages = collectUniqueErrorMessages({
      email: "Digite um e-mail válido.",
      areas: "Selecione ao menos uma área de atuação.",
      cpf: "Informe o CPF.",
    });
    assert.equal(messages.length, 3);
    assert.ok(messages.includes("Digite um e-mail válido."));
  });

  it("duplicidade retorna apenas mensagem genérica", () => {
    assert.deepEqual(collectUniqueErrorMessages(duplicateRegistrationError()), [
      USER_ALREADY_REGISTERED_MESSAGE,
    ]);
    assert.deepEqual(
      collectUniqueErrorMessages({
        ...duplicateRegistrationError(),
        email: "Digite um e-mail válido.",
        cpf: "Digite um CPF válido.",
      }),
      [USER_ALREADY_REGISTERED_MESSAGE]
    );
  });
});
