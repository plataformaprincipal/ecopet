/**
 * Testes da camada de IA de negócio (sem OpenAI live / sem DB).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { planToolsFromMessage, detectModuleFromPage } from "./modules/intent-router";
import { buildBusinessSystemPrompt } from "./modules/module-prompts";
import { listBusinessTools, getBusinessTool, toOpenAiToolSchemas } from "./modules/tool-registry";
import {
  validateToolParams,
  sanitizeToolResult,
  stripSensitiveParams,
} from "./modules/tool-validator";
import { canRoleUseTool } from "./modules/permission-checker";
import { buildExtractiveSummary } from "./modules/conversation-summary";
import { estimateTokens, buildSlidingWindow, truncateToTokenBudget } from "./modules/token-manager";
import { getSmartSuggestions } from "./modules/suggestions";
import { FUNCTION_CALLING_READY, parseFunctionCallArguments } from "./modules/function-calling";
import { withAiCache, getAiCache } from "./modules/cache";

describe("context / intent", () => {
  it("detecta módulo marketplace e ferramenta de produtos", () => {
    const plan = planToolsFromMessage("Quero comparar ração no marketplace", "CLIENT");
    assert.equal(plan.module, "marketplace");
    assert.ok(plan.tools.some((t) => t.name === "consult_products"));
  });

  it("não oferece summary de parceiro para cliente", () => {
    const plan = planToolsFromMessage("quero dashboard de vendas", "CLIENT");
    assert.ok(!plan.tools.some((t) => t.name === "consult_partner_summary"));
  });

  it("detecta página", () => {
    assert.equal(detectModuleFromPage("/client/meu-pet"), "mypet");
    assert.equal(detectModuleFromPage("/marketplace"), "marketplace");
  });
});

describe("prompt builder", () => {
  it("monta prompt por persona e módulo", () => {
    const p = buildBusinessSystemPrompt({
      persona: "PARTNER",
      locale: "pt-BR",
      module: "partners",
      displayName: "Loja",
    });
    assert.ok(p.includes("Parceiro") || p.includes("partner") || p.includes("Loja"));
    assert.ok(p.includes("Markdown") || p.includes("dados"));
  });
});

describe("tool registry / function calling", () => {
  it("lista ferramentas e schemas OpenAI", () => {
    const tools = listBusinessTools("CLIENT");
    assert.ok(tools.length >= 5);
    assert.ok(!tools.some((t) => t.name === "consult_partner_summary"));
    const schemas = toOpenAiToolSchemas("CLIENT");
    assert.equal(schemas[0]?.type, "function");
    assert.ok(FUNCTION_CALLING_READY.schemas);
    assert.equal(FUNCTION_CALLING_READY.openAiToolLoop, true);
    assert.equal(FUNCTION_CALLING_READY.mcp, false);
  });

  it("valida params e remove secrets", () => {
    const tool = getBusinessTool("consult_social");
    assert.ok(tool);
    const bad = validateToolParams(tool!, {});
    assert.equal(bad.ok, false);
    const good = validateToolParams(tool!, { query: "pets" });
    assert.equal(good.ok, true);
    const cleaned = stripSensitiveParams({ query: "x", password: "secret", cpf: "123" });
    assert.equal(cleaned.password, undefined);
    assert.equal(cleaned.cpf, undefined);
  });

  it("sanitize remove email/telefone do resultado", () => {
    const out = sanitizeToolResult({
      name: "Ana",
      email: "a@b.com",
      telefone: "11999999999",
      ok: true,
    }) as Record<string, unknown>;
    assert.equal(out.email, undefined);
    assert.equal(out.telefone, undefined);
    assert.equal(out.name, "Ana");
  });

  it("permissões por role", () => {
    const partnerTool = getBusinessTool("consult_partner_summary")!;
    assert.equal(canRoleUseTool("CLIENT", partnerTool), false);
    assert.equal(canRoleUseTool("PARTNER", partnerTool), true);
  });

  it("parse function call args", () => {
    assert.deepEqual(parseFunctionCallArguments('{"query":"ração"}'), { query: "ração" });
    assert.deepEqual(parseFunctionCallArguments("not-json"), {});
  });
});

describe("memory / summary / tokens", () => {
  it("resumo extrativo incremental", () => {
    const s = buildExtractiveSummary("", "olá", "tudo bem");
    assert.ok(s.includes("U:"));
    assert.ok(s.includes("A:"));
  });

  it("janela deslizante e estimativa", () => {
    assert.ok(estimateTokens("abcd") >= 1);
    const win = buildSlidingWindow(
      [
        { content: "a".repeat(400) },
        { content: "b".repeat(400) },
        { content: "c".repeat(40) },
      ],
      10,
      50
    );
    assert.ok(win.length >= 1);
    assert.ok(truncateToTokenBudget("x".repeat(500), 10).includes("truncado"));
  });
});

describe("suggestions / cache", () => {
  it("sugestões por persona", () => {
    const client = getSmartSuggestions("CLIENT", "pt-BR");
    const admin = getSmartSuggestions("ADMIN", "pt-BR");
    assert.ok(client.length >= 4);
    assert.ok(admin.some((s) => /moder|token|integra|ferramenta/i.test(s)));
  });

  it("cache memória com TTL", async () => {
    await getAiCache().clear();
    let calls = 0;
    const v1 = await withAiCache("test:k", 5_000, async () => {
      calls += 1;
      return 42;
    });
    const v2 = await withAiCache("test:k", 5_000, async () => {
      calls += 1;
      return 99;
    });
    assert.equal(v1, 42);
    assert.equal(v2, 42);
    assert.equal(calls, 1);
  });
});
