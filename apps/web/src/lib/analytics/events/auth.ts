import { defineEvent } from "./definitions";

export const AuthEvents = {
  LOGIN_VIEW: defineEvent({
    event_name: "auth_login_view",
    category: "auth",
    action: "view",
    module: "auth",
  }),
  SIGNUP_VIEW: defineEvent({
    event_name: "auth_signup_view",
    category: "auth",
    action: "view",
    module: "auth",
  }),
  FIRST_ACCESS: defineEvent({
    event_name: "auth_first_access",
    category: "auth",
    action: "first_access",
    module: "auth",
  }),
  LOGIN: defineEvent({
    event_name: "login",
    category: "auth",
    action: "login",
    module: "auth",
  }),
  LOGOUT: defineEvent({
    event_name: "auth_logout",
    category: "auth",
    action: "logout",
    module: "auth",
  }),
  SIGN_UP: defineEvent({
    event_name: "sign_up",
    category: "auth",
    action: "sign_up",
    module: "auth",
  }),
  PASSWORD_RECOVER: defineEvent({
    event_name: "auth_password_recover",
    category: "auth",
    action: "recover",
    module: "auth",
  }),
  PASSWORD_CHANGE: defineEvent({
    event_name: "auth_password_change",
    category: "auth",
    action: "change_password",
    module: "auth",
  }),
  EMAIL_CONFIRM: defineEvent({
    event_name: "auth_email_confirm",
    category: "auth",
    action: "confirm_email",
    module: "auth",
  }),
  LOGIN_ERROR: defineEvent({
    event_name: "auth_login_error",
    category: "auth",
    action: "error",
    module: "auth",
  }),
  ACCOUNT_BLOCKED: defineEvent({
    event_name: "auth_account_blocked",
    category: "auth",
    action: "blocked",
    module: "auth",
  }),
  ACCOUNT_UNBLOCKED: defineEvent({
    event_name: "auth_account_unblocked",
    category: "auth",
    action: "unblocked",
    module: "auth",
  }),
} as const;
