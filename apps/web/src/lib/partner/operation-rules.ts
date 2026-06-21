/** Modos que exigem dias e horários de funcionamento. */
export const SCHEDULE_REQUIRED_MODES = ["FIXED_HOURS", "SPECIFIC_DAYS"] as const;

/** Modos flexíveis — não exigem dias/horários quando selecionados isoladamente. */
export const FLEXIBLE_OPERATION_MODES = ["BY_APPOINTMENT", "EMERGENCY", "HOURS_24"] as const;

export const OPERATION_SCHEDULE_MESSAGE = "Informe os dias e horários de funcionamento.";

export function requiresOperationSchedule(modes: string[]): boolean {
  return modes.some((m) => (SCHEDULE_REQUIRED_MODES as readonly string[]).includes(m));
}

export function validateOperationSchedule(
  modes: string[],
  weekdays: string[],
  openTime: string,
  closeTime: string
): { field?: string; message: string } | null {
  if (!requiresOperationSchedule(modes)) return null;

  if (!weekdays.length || !openTime?.trim() || !closeTime?.trim()) {
    return { field: "weekdays", message: OPERATION_SCHEDULE_MESSAGE };
  }

  if (openTime >= closeTime) {
    return {
      field: "closeTime",
      message: "Horário de fechamento deve ser posterior ao de abertura.",
    };
  }

  return null;
}
