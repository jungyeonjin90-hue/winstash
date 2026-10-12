/**
 * Unit tests for lib/extensionPersona.ts (which job role/tone an extension submit uses).
 *
 *   npm run test:unit
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { resolveExtensionPersona } from "../../lib/extensionPersona.ts";

describe("resolveExtensionPersona", () => {
  test("the saved web persona wins over the body", () => {
    const r = resolveExtensionPersona(
      { jobRole: "operations", toneManner: "stability" },
      { job_role: "engineering", tone_manner: "impact" }
    );
    assert.equal(r.jobRole, "operations");
    assert.equal(r.toneManner, "stability");
  });

  test("without a persona, a valid body value is used", () => {
    const r = resolveExtensionPersona(undefined, { job_role: "product", tone_manner: "leadership" });
    assert.equal(r.jobRole, "product");
    assert.equal(r.toneManner, "leadership");
  });

  test("defaults to engineering/impact when nothing valid is given", () => {
    for (const [persona, body] of [[undefined, {}], [null, null], [{}, { job_role: "ceo", tone_manner: 3 }]]) {
      const r = resolveExtensionPersona(persona, body);
      assert.equal(r.jobRole, "engineering");
      assert.equal(r.toneManner, "impact");
    }
  });

  test("invalid persona fields fall through field by field", () => {
    const r = resolveExtensionPersona({ jobRole: "astronaut", toneManner: "problem_solving" }, { job_role: "sales" });
    assert.equal(r.jobRole, "sales");
    assert.equal(r.toneManner, "problem_solving");
  });

  test("profile hints come from the persona and are validated", () => {
    const r = resolveExtensionPersona(
      { jobRole: "design", seniorityLevel: "senior", industry: "x".repeat(150), region: "KR" },
      { seniority_level: "junior" }
    );
    assert.equal(r.seniorityLevel, "senior");
    assert.equal(r.industry.length, 100);
    assert.equal(r.region, "KR");
    const bad = resolveExtensionPersona({ seniorityLevel: "god", region: "MARS", industry: "  " }, {});
    assert.equal(bad.seniorityLevel, undefined);
    assert.equal(bad.region, undefined);
    assert.equal(bad.industry, undefined);
  });
});
