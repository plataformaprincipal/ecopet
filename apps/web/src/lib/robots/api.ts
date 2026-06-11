import { api } from "@/lib/api";

export interface RobotDto {
  id: string;
  name: string;
  description: string | null;
  domain: string;
  isActive: boolean;
  status: string;
  trigger: string;
  action: string;
  lastExecution: string | null;
  nextCycle: string;
  structuralAutomation: boolean;
  aiPowered: boolean;
  logs?: { id: string; action: string; createdAt: string }[];
}

export async function fetchRobots(token: string) {
  return api<RobotDto[]>("/api/robots", { token });
}

export async function toggleRobot(token: string, robotId: string, active: boolean) {
  return api(`/api/robots/${robotId}/toggle`, { method: "PATCH", token, body: JSON.stringify({ active }) });
}

export async function runRobot(token: string, robotId: string) {
  return api<{ summary: string; executedAt: string; itemsChecked: number; alertsGenerated: number }>(
    `/api/robots/${robotId}/run`,
    { method: "POST", token, body: "{}" }
  );
}

export async function fetchRobotLogs(token: string, robotId: string) {
  return api<{ id: string; action: string; createdAt: string; metadata?: unknown }[]>(
    `/api/robots/${robotId}/logs`,
    { token }
  );
}
