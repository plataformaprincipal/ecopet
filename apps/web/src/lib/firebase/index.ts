/** Exports seguros para uso compartilhado (sem Admin SDK). */
export {
  getFirebasePublicConfig,
  isFirebasePublicConfigured,
  isFirebaseVapidConfigured,
  isFirebaseClientReady,
  getFirebaseVapidKey,
  maskProjectId,
} from "./config";

export type {
  FirebasePublicConfig,
  PushPermissionState,
  PushCategory,
  FcmNotificationPayload,
  SendPushSummary,
  PushDevicePublicStatus,
  FirebaseAdminSanitizedStatus,
} from "./types";

export {
  sanitizeNotificationUrl,
  isSafeInternalNotificationUrl,
} from "./safe-url";

export {
  buildFcmPayload,
  mapNotificationTypeToCategory,
  toFcmDataRecord,
} from "./notification-builder";

export {
  classifyFcmError,
  sanitizeErrorMessage,
  PERMANENT_TOKEN_ERROR_CODES,
  TRANSIENT_ERROR_CODES,
} from "./errors";
