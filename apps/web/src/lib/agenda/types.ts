export type AgendaEventType = "consultation" | "service" | "health" | "meeting" | "campaign" | "task";

export interface AgendaEvent {
  id: string;
  title: string;
  type: AgendaEventType;
  date: string;
  time: string;
  duration: string;
  partner: string;
  status: "confirmed" | "pending" | "cancelled";
  recurring: boolean;
}

export type AgendaView = "day" | "week" | "month";
