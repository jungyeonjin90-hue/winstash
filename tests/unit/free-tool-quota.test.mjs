/**
 * Unit tests for the free STAR tool's daily limits (lib/freeToolQuota.ts).
 *
 *   npm run test:unit
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  decideFreeToolQuota,
  freeToolDayKey,
  hashClientIp,
  FREE_TOOL_DAILY_PER_IP,
  FREE_TOOL_DAILY_GLOBAL,
} from "../../lib/freeToolQuota.ts";

describe("decideFreeToolQuota", () => {
  test("allows a request under both limits", () => {
    assert.deepEqual(decideFreeToolQuota(0, 0), { ok: true });
    assert.deepEqual(decideFreeToolQuota(FREE_TOOL_DAILY_PER_IP - 1, FREE_TOOL_DAILY_GLOBAL - 1), { ok: true });
  });

  test("blocks an IP that used today's tries", () => {
    const r = decideFreeToolQuota(FREE_TOOL_DAILY_PER_IP, 0);
    assert.equal(r.ok, false);
    assert.equal(r.reason, "ip_daily");
  });

  test("blocks everyone once the global daily cap is reached", () => {
    const r = decideFreeToolQuota(0, FREE_TOOL_DAILY_GLOBAL);
    assert.equal(r.ok, false);
    assert.equal(r.reason, "global_daily");
  });
});

describe("hashClientIp", () => {
  test("does not contain the raw IP and is stable within a day", () => {
    const a = hashClientIp("203.0.113.7", "2026-10-12", "salt");
    assert.equal(a, hashClientIp("203.0.113.7", "2026-10-12", "salt"));
    assert.ok(!a.includes("203.0.113.7"));
    assert.match(a, /^[0-9a-f]{32}$/);
  });

  test("changes with the day and the salt", () => {
    const a = hashClientIp("203.0.113.7", "2026-10-12", "salt");
    assert.notEqual(a, hashClientIp("203.0.113.7", "2026-10-13", "salt"));
    assert.notEqual(a, hashClientIp("203.0.113.7", "2026-10-12", "other"));
  });
});

test("freeToolDayKey uses the UTC date", () => {
  assert.equal(freeToolDayKey(new Date("2026-10-12T23:59:59Z")), "2026-10-12");
  assert.equal(freeToolDayKey(new Date("2026-10-13T00:00:00Z")), "2026-10-13");
});
