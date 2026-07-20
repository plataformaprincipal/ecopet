import { defineEvent } from "./definitions";

export const AdminEvents = {
  LOGIN: defineEvent({
    event_name: "admin_login",
    category: "admin",
    action: "login",
    module: "admin",
  }),
  DASHBOARD_OPEN: defineEvent({
    event_name: "admin_dashboard_open",
    category: "admin",
    action: "dashboard_open",
    module: "admin",
  }),
  USER_APPROVE: defineEvent({
    event_name: "admin_user_approve",
    category: "admin",
    action: "approve",
    module: "admin",
  }),
  USER_SUSPEND: defineEvent({
    event_name: "admin_user_suspend",
    category: "admin",
    action: "suspend",
    module: "admin",
  }),
  CONFIG_CHANGE: defineEvent({
    event_name: "admin_config_change",
    category: "admin",
    action: "config_change",
    module: "admin",
  }),
  LOGS_VIEW: defineEvent({
    event_name: "admin_logs_view",
    category: "admin",
    action: "logs_view",
    module: "admin",
  }),
  BI_OPEN: defineEvent({
    event_name: "admin_bi_open",
    category: "admin_internal",
    action: "bi_open",
    module: "admin",
  }),
  ANALYTICS_OPEN: defineEvent({
    event_name: "admin_analytics_open",
    category: "admin_internal",
    action: "analytics_open",
    module: "admin",
  }),
  INTEGRATIONS_OPEN: defineEvent({
    event_name: "admin_integrations_open",
    category: "admin_internal",
    action: "integrations_open",
    module: "admin",
  }),
  MARKETPLACE_OPEN: defineEvent({
    event_name: "admin_marketplace_open",
    category: "admin_internal",
    action: "marketplace_open",
    module: "admin",
  }),
  FINANCE_OPEN: defineEvent({
    event_name: "admin_finance_open",
    category: "admin_internal",
    action: "finance_open",
    module: "admin",
  }),
  USERS_OPEN: defineEvent({
    event_name: "admin_users_open",
    category: "admin_internal",
    action: "users_open",
    module: "admin",
  }),
  NGO_OPEN: defineEvent({
    event_name: "admin_ngo_open",
    category: "admin_internal",
    action: "ngo_open",
    module: "admin",
  }),
  PARTNERS_OPEN: defineEvent({
    event_name: "admin_partners_open",
    category: "admin_internal",
    action: "partners_open",
    module: "admin",
  }),
  SYSTEM_OPEN: defineEvent({
    event_name: "admin_system_open",
    category: "admin_internal",
    action: "system_open",
    module: "admin",
  }),
} as const;
