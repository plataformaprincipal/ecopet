export type WorkflowActionType =
  | "send_notification"
  | "send_email"
  | "create_task"
  | "create_audit_log"
  | "change_status"
  | "create_ticket"
  | "create_alert"
  | "call_ai"
  | "call_webhook"
  | "add_tag"
  | "generate_report"
  | "reprocess_job";

export type WorkflowAction = {
  type: WorkflowActionType | string;
  config?: Record<string, unknown>;
  label?: string;
  continueOnError?: boolean;
};

export type WorkflowCondition = {
  field: string;
  operator: "eq" | "neq" | "gt" | "lt" | "exists" | "not_empty";
  value?: unknown;
};

export type WorkflowDefinitionInput = {
  name: string;
  description?: string;
  triggerEvent: string;
  conditions?: WorkflowCondition[];
  actions: WorkflowAction[];
  status?: "ACTIVE" | "INACTIVE" | "DRAFT" | "FAILED";
};
