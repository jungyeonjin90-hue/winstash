/**
 * WinStash Admin Configuration
 */
const envAdminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS;

export const ADMIN_EMAILS: readonly string[] = envAdminEmails
  ? envAdminEmails.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
  : [
      "jungyeonjin90@gmail.com",
      "thestudioplus26@gmail.com",
    ];

/**
 * Checks if the given email belongs to a system administrator.
 * Administrators have zero rate limits, unlimited free transformations, and no cooldowns.
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}
