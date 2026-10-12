import type { JobRole, RegionCode, SeniorityLevel, ToneManner } from "../types/career";

const JOB_ROLES: readonly JobRole[] = ["engineering", "product", "marketing", "operations", "design", "sales"];
const TONE_MANNERS: readonly ToneManner[] = ["impact", "problem_solving", "stability", "leadership"];
const SENIORITY_LEVELS: readonly SeniorityLevel[] = ["junior", "mid", "senior", "staff_plus", "lead_executive"];
const REGION_CODES: readonly RegionCode[] = ["US", "EU", "APAC", "LATAM", "GLOBAL", "KR"];

function pick<T extends string>(allowed: readonly T[], ...candidates: unknown[]): T | undefined {
  return candidates.find((c): c is T => typeof c === "string" && (allowed as readonly string[]).includes(c));
}

export interface ResolvedPersona {
  jobRole: JobRole;
  toneManner: ToneManner;
  seniorityLevel?: SeniorityLevel;
  industry?: string;
  region?: RegionCode;
}

/**
 * Persona for an extension submit. The saved web persona (users/{uid}/settings/persona) wins,
 * then a valid value from the request body, then "engineering"/"impact". Invalid values are skipped.
 * Profile hints (seniority/industry/region) come from the saved persona only, as in the web app.
 */
export function resolveExtensionPersona(persona: unknown, body: unknown): ResolvedPersona {
  const p = (persona && typeof persona === "object" ? persona : {}) as Record<string, unknown>;
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  return {
    jobRole: pick(JOB_ROLES, p.jobRole, b.job_role) ?? "engineering",
    toneManner: pick(TONE_MANNERS, p.toneManner, b.tone_manner) ?? "impact",
    seniorityLevel: pick(SENIORITY_LEVELS, p.seniorityLevel),
    // Free-text profile field that lands in the system prompt: keep it a short string.
    industry: typeof p.industry === "string" && p.industry.trim() ? p.industry.slice(0, 100) : undefined,
    region: pick(REGION_CODES, p.region),
  };
}
