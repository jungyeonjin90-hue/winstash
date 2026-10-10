/**
 * Who counts as Pro, shared by the web app, the server quota check and the extension status API.
 *
 * - active / on_trial / paid: Pro.
 * - cancelled: Pro until the paid period (endsAt) runs out.
 * - past_due: a renewal payment failed and Lemon Squeezy is retrying (about two weeks). Pro is kept
 *   during the retries so a temporary card problem does not cut a paying user off; Lemon Squeezy
 *   then sends unpaid / expired. The grace is capped from `pastDueSince` in case that event never arrives.
 */
export const PAST_DUE_GRACE_MS = 16 * 24 * 60 * 60 * 1000;

export interface PlanFields {
  plan?: unknown;
  planStatus?: unknown;
  endsAt?: unknown;
  pastDueSince?: unknown;
}

function toTime(value: unknown): number {
  if (typeof value !== "string" || !value) return NaN;
  return Date.parse(value);
}

export function isInPastDueGrace(pastDueSince: unknown, now: number = Date.now()): boolean {
  const since = toTime(pastDueSince);
  return !Number.isNaN(since) && now - since < PAST_DUE_GRACE_MS;
}

export function hasProAccess(fields: PlanFields | undefined, now: number = Date.now()): boolean {
  if (fields?.plan !== "pro") return false;
  switch (fields.planStatus) {
    case "active":
    case "on_trial":
    case "paid":
      return true;
    case "cancelled":
      return toTime(fields.endsAt) > now;
    case "past_due":
      return isInPastDueGrace(fields.pastDueSince, now);
    default:
      return false;
  }
}
