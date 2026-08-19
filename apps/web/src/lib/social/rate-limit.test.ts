import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { checkSocialRateLimit, resetSocialRateLimits } from "./rate-limit";
import { SOCIAL_RATE_LIMITS } from "./constants";

describe("social report rate limit", () => {
  it("bloqueia após o limite da janela", () => {
    resetSocialRateLimits();
    const { limit, windowMs } = SOCIAL_RATE_LIMITS.report;
    const key = "report:e2e-rate-limit";
    for (let i = 0; i < limit; i++) {
      assert.equal(checkSocialRateLimit(key, limit, windowMs), true);
    }
    assert.equal(checkSocialRateLimit(key, limit, windowMs), false);
  });
});
