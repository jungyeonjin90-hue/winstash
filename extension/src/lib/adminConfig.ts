/**
 * WinStash Admin Configuration (Extension)
 */
export const ADMIN_EMAILS: readonly string[] = [
  "jungyeonjin90@gmail.com",
  "thestudioplus26@gmail.com",
];

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}
