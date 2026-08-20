import { clearAuthRateLimitBuckets } from "./helpers/rate-limit";

export default async function globalSetup() {
  await clearAuthRateLimitBuckets().catch(() => undefined);
}
