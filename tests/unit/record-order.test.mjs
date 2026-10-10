/**
 * Unit tests for lib/recordOrder.ts (history ordering and "Latest").
 *
 *   npm run test:unit
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { getMostRecentlySavedId, sortRecordsByWeek, upsertRecordSorted } from "../../lib/recordOrder.ts";

const rec = (id, week, savedAt) => ({ id, createdAt: `${week}T09:00:00.000Z`, ...(savedAt ? { savedAt } : {}) });
const ids = (list) => list.map((r) => r.id);

describe("sortRecordsByWeek", () => {
  test("orders by the record's week, newest week first, regardless of save order", () => {
    const list = [rec("sep", "2026-09-05"), rec("oct", "2026-10-10"), rec("aug", "2026-08-15")];
    assert.deepEqual(ids(sortRecordsByWeek(list)), ["oct", "sep", "aug"]);
  });

  test("same week: most recently saved first", () => {
    const list = [rec("a", "2026-10-10", "2026-10-09T01:00:00Z"), rec("b", "2026-10-10", "2026-10-09T05:00:00Z")];
    assert.deepEqual(ids(sortRecordsByWeek(list)), ["b", "a"]);
  });

  test("target_week wins over createdAt (extension records stored the save time in createdAt)", () => {
    const extAug = {
      id: "ext-aug",
      createdAt: "2026-10-10T03:28:23.516Z", // save time
      target_week: { year: 2026, month: 8, weekOfMonth: 1, startDate: "2026-08-02", endDate: "2026-08-08", label: "Week 1" },
    };
    const list = [rec("oct-w2", "2026-10-17"), extAug, rec("oct-w1", "2026-10-10"), rec("sep-w5", "2026-10-03")];
    assert.deepEqual(ids(sortRecordsByWeek(list)), ["oct-w2", "oct-w1", "sep-w5", "ext-aug"]);
  });

  test("does not mutate the input", () => {
    const list = [rec("old", "2026-01-01"), rec("new", "2026-02-01")];
    sortRecordsByWeek(list);
    assert.deepEqual(ids(list), ["old", "new"]);
  });
});

describe("upsertRecordSorted", () => {
  test("a note saved for an older week goes to its place, not to the top", () => {
    const list = [rec("oct", "2026-10-10"), rec("sep", "2026-09-26")];
    const out = upsertRecordSorted(list, rec("aug", "2026-08-15", "2026-10-10T00:00:00Z"));
    assert.deepEqual(ids(out), ["oct", "sep", "aug"]);
  });

  test("updating an existing record replaces it in place", () => {
    const list = [rec("oct", "2026-10-10"), rec("sep", "2026-09-26")];
    const out = upsertRecordSorted(list, { ...rec("sep", "2026-09-26", "2026-10-10T00:00:00Z"), raw_memo: "edited" });
    assert.deepEqual(ids(out), ["oct", "sep"]);
    assert.equal(out[1].raw_memo, "edited");
  });
});

describe("getMostRecentlySavedId", () => {
  test("is the most recently saved record, not the newest week", () => {
    const list = sortRecordsByWeek([
      rec("oct", "2026-10-10", "2026-10-06T00:00:00Z"),
      rec("sep", "2026-09-05", "2026-10-09T00:00:00Z"),
      rec("aug", "2026-08-15", "2026-10-01T00:00:00Z"),
    ]);
    assert.equal(getMostRecentlySavedId(list), "sep");
  });

  test("records without savedAt (legacy) never beat records that have it", () => {
    const list = sortRecordsByWeek([rec("legacy-new-week", "2026-12-01"), rec("saved", "2026-01-01", "2026-10-01T00:00:00Z")]);
    assert.equal(getMostRecentlySavedId(list), "saved");
  });

  test("falls back to the newest week when nothing has savedAt", () => {
    const list = sortRecordsByWeek([rec("sep", "2026-09-05"), rec("oct", "2026-10-10")]);
    assert.equal(getMostRecentlySavedId(list), "oct");
  });

  test("empty list -> undefined", () => {
    assert.equal(getMostRecentlySavedId([]), undefined);
  });
});
