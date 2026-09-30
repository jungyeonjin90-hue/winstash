/**
 * WinStash Admin Configuration
 */
export const ADMIN_EMAILS: readonly string[] = [
  "jungyeonjin90@gmail.com",
];

/**
 * Checks if the given email belongs to a system administrator.
 * Administrators have zero rate limits, unlimited free transformations, and no cooldowns.
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}
