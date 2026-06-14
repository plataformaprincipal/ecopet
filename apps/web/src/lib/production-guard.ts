/**
 * Bloqueia importação de módulos mock/demo em produção.
 * Usado por testes estáticos — não importar mock-data em runtime.
 */
const FORBIDDEN_PATH_FRAGMENTS = ["mock-data", "DemoContentBanner"] as const;

export function assertProductionSafeModule(moduleId: string): void {
  if (process.env.NODE_ENV !== "production") return;
  for (const fragment of FORBIDDEN_PATH_FRAGMENTS) {
    if (moduleId.includes(fragment)) {
      throw new Error(`Importação proibida em produção: ${moduleId}`);
    }
  }
}
