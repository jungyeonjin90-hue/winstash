/**
 * Lemon Squeezy Payment & Subscription Configuration for WinStash
 */

export const PRO_PRICE_USD = 5.99;

/**
 * Base Checkout URL for WinStash Pro Monthly ($5.99)
 * Configurable via NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL environment variable.
 */
export const DEFAULT_LEMON_SQUEEZY_CHECKOUT_URL =
  process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL || "";

/**
 * Builds a dynamic Lemon Squeezy checkout link pre-filled with the authenticated user's ID and email.
 */
export function buildLemonSqueezyCheckoutUrl(
  userId: string,
  userEmail?: string | null,
  userName?: string | null
): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL ||
    DEFAULT_LEMON_SQUEEZY_CHECKOUT_URL;

  if (!baseUrl) {
    // If not configured yet, return a safe fallback or store placeholder
    return `https://winstash.lemonsqueezy.com/buy?checkout[custom][user_id]=${encodeURIComponent(
      userId
    )}${userEmail ? `&checkout[email]=${encodeURIComponent(userEmail)}` : ""}`;
  }

  const url = new URL(baseUrl);
  url.searchParams.set("checkout[custom][user_id]", userId);
  if (userEmail) {
    url.searchParams.set("checkout[email]", userEmail);
  }
  if (userName) {
    url.searchParams.set("checkout[name]", userName);
  }

  return url.toString();
}
