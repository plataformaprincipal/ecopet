import type { WorkflowCondition } from "./workflow-types";

export function evaluateConditions(
  conditions: WorkflowCondition[] | undefined,
  ctx: Record<string, unknown>
): boolean {
  if (!conditions?.length) return true;
  const payload = (ctx.payload as Record<string, unknown>) ?? ctx;
  return conditions.every((c) => {
    const val = c.field.includes(".")
      ? c.field.split(".").reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], ctx)
      : payload[c.field] ?? ctx[c.field];
    switch (c.operator) {
      case "eq":
        return val === c.value;
      case "neq":
        return val !== c.value;
      case "gt":
        return typeof val === "number" && typeof c.value === "number" && val > c.value;
      case "lt":
        return typeof val === "number" && typeof c.value === "number" && val < c.value;
      case "exists":
        return val !== undefined && val !== null;
      case "not_empty":
        return val !== undefined && val !== null && val !== "";
      default:
        return false;
    }
  });
}
