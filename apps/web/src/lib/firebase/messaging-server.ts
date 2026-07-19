import "server-only";

/**
 * API server-only de envio FCM.
 * Reexporta o dispatcher — importação única para canais de notificação.
 */
export {
  sendPushToUser,
  sendPushBatch,
  retryPendingDeliveries,
  FCM_MULTICAST_LIMIT,
  type SendPushToUserInput,
} from "./notification-dispatcher";

export { isFirebaseAdminConfigured, getFirebaseMessaging } from "./admin";
