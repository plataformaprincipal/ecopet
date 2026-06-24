import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  USERNAME_REGEX,
  USERNAME_INVALID_MESSAGE,
  isValidUsername,
  normalizeUsername,
  sanitizeUsernameInput,
  usernameSchema,
} from "./username";

describe("username validation", () => {
  it("aceita apenas letras", () => {
    assert.equal(isValidUsername("ana"), true);
    assert.equal(isValidUsername("maria"), true);
  });

  it("aceita letras e números", () => {
    assert.equal(isValidUsername("user123"), true);
  });

  it("aceita underline, ponto e hífen", () => {
    assert.equal(isValidUsername("user_name"), true);
    assert.equal(isValidUsername("user.name"), true);
    assert.equal(isValidUsername("user-name"), true);
  });

  it("normaliza para minúsculas", () => {
    assert.equal(normalizeUsername("  Ana_Silva  "), "ana_silva");
    assert.equal(isValidUsername("Ana_Silva"), true);
  });

  it("rejeita nomes curtos", () => {
    assert.equal(isValidUsername("ab"), false);
    assert.equal(isValidUsername("a"), false);
  });

  it("rejeita nomes longos", () => {
    assert.equal(isValidUsername("a".repeat(31)), false);
  });

  it("rejeita espaços", () => {
    assert.equal(isValidUsername("ana silva"), false);
    assert.equal(sanitizeUsernameInput("ana silva"), "anasilva");
  });

  it("schema zod aplica trim e lowercase", () => {
    const parsed = usernameSchema.safeParse("  Joao_1  ");
    assert.equal(parsed.success, true);
    if (parsed.success) assert.equal(parsed.data, "joao_1");
  });

  it("schema zod retorna mensagem padronizada", () => {
    const parsed = usernameSchema.safeParse("ab");
    assert.equal(parsed.success, false);
    if (!parsed.success) {
      assert.equal(parsed.error.errors[0]?.message, USERNAME_INVALID_MESSAGE);
    }
  });

  it("regex cobre exatamente 3 a 30 caracteres", () => {
    assert.match("abc", USERNAME_REGEX);
    assert.match("a".repeat(30), USERNAME_REGEX);
    assert.doesNotMatch("ab", USERNAME_REGEX);
    assert.doesNotMatch("a".repeat(31), USERNAME_REGEX);
  });
});
