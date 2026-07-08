import { prisma } from "@/lib/prisma";
import { evaluateConditions } from "./workflow-conditions";
import { executeWorkflowAction } from "./workflow-actions";
import type { WorkflowAction } from "./workflow-types";

function getActionsFromDefinition(def: {
  actions: unknown;
  triggerConfig: unknown;
}): WorkflowAction[] {
  const actions = def.actions as WorkflowAction[];
  if (Array.isArray(actions) && actions.length) return actions;
  const cfg = def.triggerConfig as { actions?: WorkflowAction[] };
  return cfg?.actions ?? [];
}

export async function runWorkflowsForEvent(eventType: string, ctx: Record<string, unknown>) {
  const defs = await prisma.workflowDefinition.findMany({
    where: { isActive: true, lifecycleStatus: "ACTIVE", triggerType: "event" },
  });

  for (const def of defs) {
    const cfg = def.triggerConfig as { eventType?: string; conditions?: unknown };
    if (cfg.eventType !== eventType && cfg.eventType !== "*") continue;
    if (!evaluateConditions(cfg.conditions as never, ctx)) continue;

    const instance = await prisma.workflowInstance.create({
      data: {
        definitionId: def.id,
        ownerId: (ctx.actorId as string) ?? undefined,
        triggerData: JSON.parse(JSON.stringify(ctx)),
        status: "RUNNING",
      },
    });

    const actions = getActionsFromDefinition(def);
    let failed = false;
    for (const action of actions) {
      try {
        await executeWorkflowAction(instance.id, action, { ...ctx, type: eventType });
      } catch {
        failed = true;
        if (!action.continueOnError) break;
      }
    }

    await prisma.workflowInstance.update({
      where: { id: instance.id },
      data: {
        status: failed ? "FAILED" : "COMPLETED",
        completedAt: new Date(),
        result: { actionsExecuted: actions.length, failed },
      },
    });
  }

  const templates = await prisma.automationTemplate.findMany({
    where: { isActive: true, triggerEvent: eventType },
  });
  for (const tpl of templates) {
    const conditions = (tpl.conditions as never) ?? [];
    if (!evaluateConditions(conditions, ctx)) continue;
    const pseudoInstance = await prisma.workflowInstance.create({
      data: {
        definitionId: `template-${tpl.slug}`,
        triggerData: JSON.parse(JSON.stringify({ template: tpl.slug, ...ctx })),
        status: "RUNNING",
      },
    }).catch(() => null);
    if (!pseudoInstance) continue;
    const actions = (tpl.actions as WorkflowAction[]) ?? [];
    for (const action of actions) {
      await executeWorkflowAction(pseudoInstance.id, action, { ...ctx, type: eventType }).catch(() => undefined);
    }
    await prisma.workflowInstance.update({
      where: { id: pseudoInstance.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    }).catch(() => undefined);
  }
}

export async function runWorkflowManually(definitionId: string, ownerId?: string, triggerData?: object) {
  const def = await prisma.workflowDefinition.findUniqueOrThrow({ where: { id: definitionId } });
  const instance = await prisma.workflowInstance.create({
    data: {
      definitionId,
      ownerId,
      triggerData: triggerData ?? {},
      status: "RUNNING",
    },
  });
  const actions = getActionsFromDefinition(def);
  let failed = false;
  for (const action of actions) {
    try {
      await executeWorkflowAction(instance.id, action, { ...(triggerData as object), type: (def.triggerConfig as { eventType?: string }).eventType });
    } catch {
      failed = true;
    }
  }
  return prisma.workflowInstance.update({
    where: { id: instance.id },
    data: { status: failed ? "FAILED" : "COMPLETED", completedAt: new Date() },
  });
}
