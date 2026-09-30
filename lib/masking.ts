import { StarPortfolio } from "@/types/career";

/**
 * Enterprise & Client NDA Masking Utility
 * Anonymizes company names, partners, project names, and financial figures
 * with strict unit boundaries to prevent latency units (e.g., ms, s) from false masking.
 */

export function maskText(text: string, lang: "ko" | "en" = "en"): string {
  if (!text) return text;

  let masked = text;

  if (lang === "en") {
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

  // Korean masking
  masked = masked.replace(/삼성[전자|물산|SDS|바이오]*/gi, "[글로벌 IT 대기업 S사]");
  masked = masked.replace(/LG[전자|디스플레이|CNS]*/gi, "[글로벌 전자기업 L사]");
  masked = masked.replace(/현대[자동차|모비스|카드]*/gi, "[대형 모빌리티/금융 H사]");
  masked = masked.replace(/SK[하이닉스|텔레콤|C&C]*/gi, "[통신/반도체 대기업 S사]");
  masked = masked.replace(/네이버/gi, "[국내 선도 포털 N사]");
  masked = masked.replace(/카카오/gi, "[대형 모바일 플랫폼 K사]");
  masked = masked.replace(/쿠팡|배달의민족|우아한형제들/gi, "[국내 1위 커머스/배달 플랫폼]");
  masked = masked.replace(/토스|비바리퍼블리카/gi, "[국내 대표 핀테크 유니콘 T사]");
  masked = masked.replace(/당근마켓/gi, "[지역 기반 커뮤니티 유니콘 D사]");
  masked = masked.replace(/Google|Apple|Microsoft|Amazon|Meta/gi, "[글로벌 빅테크 기업]");

  // 일반 고객사/파트너사 패턴 비식별화
  masked = masked.replace(/([가-힣A-Z]{2,10})\s*(고객사|클라이언트|원청사|협력사|파트너사)/g, "[A $2]");

  // 구체적인 매출액 및 예산 비식별화
  masked = masked.replace(/(\d+(?:\.\d+)?)\s*조\s*(?:원)?/g, "[O조원 규모]");
  masked = masked.replace(/(\d+(?:\.\d+)?)\s*억\s*(?:원)?/g, "[OO억원 규모]");
  masked = masked.replace(/(\d+(?:\.\d+)?)\s*천만\s*(?:원)?/g, "[O천만원 규모]");
  // ms(밀리초) 오인 방지를 위해 반드시 $ 기호 또는 백만달러/Million 단어 경계가 명확할 때만 치환
  masked = masked.replace(/\$\s*(\d+(?:\.\d+)?)\s*(?:M\b|Million|백만달러)/gi, "[$O M 규모]");

  // 내부 기밀성 프로젝트명
  masked = masked.replace(/프로젝트\s+[A-Za-z0-9가-힣]+/g, "[전사 차세대 핵심 프로젝트]");

  return masked;
}

export function maskStarPortfolio(portfolio: StarPortfolio, lang: "ko" | "en" = "en"): StarPortfolio {
  return {
    title: maskText(portfolio.title, lang),
    situation: maskText(portfolio.situation, lang),
    task: maskText(portfolio.task, lang),
    action: maskText(portfolio.action, lang),
    result: maskText(portfolio.result, lang),
    nda_tags: portfolio.nda_tags.map((tag) => maskText(tag, lang)),
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
>(item: T, lang: "ko" | "en" = "en"): T {
  return {
    ...item,
    title: maskText(item.title, lang),
    situation: maskText(item.situation, lang),
    task: maskText(item.task, lang),
    action: maskText(item.action, lang),
    result: maskText(item.result, lang),
    nda_tags: item.nda_tags.map((tag) => maskText(tag, lang)),
  };
}
