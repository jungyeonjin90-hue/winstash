import { StarPortfolio } from "@/types/career";

/**
 * Enterprise & Client NDA Masking Utility
 * Anonymizes company names, partners, project names, and financial figures
 * with strict unit boundaries to prevent latency units (e.g., ms, s) from false masking.
 */

export function maskText(text: string): string {
  if (!text) return text;

  let masked = text;

  // 1. Tech & Enterprise masking (English)
  masked = masked.replace(/\b(Google|Apple|Microsoft|Amazon|Meta|Netflix)\b/gi, "[Tier-1 Big Tech]");
  masked = masked.replace(/\b(Samsung|LG|SK|Hyundai)\s*(?:Electronics|Corp|Group|Mobility)?\b/gi, "[Global Conglomerate]");
  masked = masked.replace(/\b(Naver|Kakao|Coupang|Toss|Woowa|Baemin)\b/gi, "[Leading Tech Unicorn]");
  masked = masked.replace(/\b(Shopee|Grab|Lazada|GoTo)\b/gi, "[Tier-1 Regional Partner]");

  // 2. Generic client/partner masking (e.g. Acme client -> [Key Client])
  masked = masked.replace(/\b([A-Z][a-zA-Z0-9]+)\s+(client|partner|vendor|customer)\b/gi, "[Key $2]");

  // 3. Budgets & Revenue masking (Strict boundaries to PREVENT latency units like ms from being masked!)
  // Note: NEVER match bare 'm' followed by 's' (ms = milliseconds)
  masked = masked.replace(/\$\s*(\d+(?:\.\d+)?)\s*(?:M\b|Million\b)/gi, "[$XX Million]");
  masked = masked.replace(/\$\s*(\d+(?:\.\d+)?)\s*(?:B\b|Billion\b)/gi, "[$X Billion]");
  masked = masked.replace(/\b\d+(?:\.\d+)?\s*(?:Million|M)\s*KRW\b/gi, "[$XXM KRW]");
  masked = masked.replace(/\b\d+(?:\.\d+)?\s*(?:Billion|B)\s*KRW\b/gi, "[$X Billion KRW]");
  masked = masked.replace(/(\b\d+(?:\.\d+)?)\s*(?:hundred\s+million|billion)\s*won\b/gi, "[Confidential Budget]");
  masked = masked.replace(/(\b\d+\s*억\s*(?:원)?\b)/gi, "[Confidential Budget]");

  // 4. Confidential Project names (e.g., Project Apollo -> [Mission-Critical Initiative])
  masked = masked.replace(/\bProject\s+[A-Za-z0-9_-]+\b/gi, "[Mission-Critical Initiative]");

  return masked;
}

export function maskStarPortfolio(portfolio: StarPortfolio): StarPortfolio {
  return {
    title: maskText(portfolio.title),
    situation: maskText(portfolio.situation),
    task: maskText(portfolio.task),
    action: maskText(portfolio.action),
    result: maskText(portfolio.result),
    nda_tags: portfolio.nda_tags.map((tag) => maskText(tag)),
  };
}

export function maskSynthesizedStarItem<
  T extends {
    title: string;
    situation: string;
    task: string;
    action: string;
    result: string;
    nda_tags: string[];
  }
>(item: T): T {
  return {
    ...item,
    title: maskText(item.title),
    situation: maskText(item.situation),
    task: maskText(item.task),
    action: maskText(item.action),
    result: maskText(item.result),
    nda_tags: item.nda_tags.map((tag) => maskText(tag)),
  };
}
