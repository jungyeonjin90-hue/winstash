/**
 * Lemon Squeezy Payment & Subscription Configuration for WinStash
 */

export const PRO_PRICE_USD = 5.99;

/**
 * Flag indicating whether Lemon Squeezy payment is live or in review/coming soon.
 * Once Lemon Squeezy approves the store, set NEXT_PUBLIC_LEMON_SQUEEZY_IS_LIVE="true" in .env.local / Vercel,
 * or change this default to true.
 */
export const IS_PAYMENT_GATEWAY_LIVE =
  process.env.NEXT_PUBLIC_LEMON_SQUEEZY_IS_LIVE !== "false";

/**
 * Base Checkout URL for WinStash Pro Monthly ($5.99)
 * Configurable via NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL environment variable.
 */
export const DEFAULT_LEMON_SQUEEZY_CHECKOUT_URL =
  process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL ||
  "https://winstash.lemonsqueezy.com/checkout/buy/4b670dbe-398d-4378-a97a-28b7b450ff88";

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
