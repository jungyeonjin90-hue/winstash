/**
 * WinStash AI 무료/유료 변환 및 비용 한도 설정
 * 1. 무료(Free):
 *    - 주간 메모 입력 및 기존 기록 수정: 총 10회 무료 제공 (MAX_USER_FREE_CREDITS = 10)
 *    - 성과평가 종합 (Brag Synthesis): 총 3회 무료 제공 (MAX_FREE_BRAG_SYNTHESIS = 3)
 *    - 포트폴리오 종합 (STAR Synthesis): 총 3회 무료 제공 (MAX_FREE_STAR_SYNTHESIS = 3)
 * 2. 유료(Pro - $5.99/월):
 *    - 주간 메모 입력 및 수정 무제한
 *    - 성과평가 & 포트폴리오 종합 무제한
 */

// 1. 개인별 기본 제공 무료 변환 횟수 (주간 입력 및 수정 공용 10회)
export const MAX_USER_FREE_CREDITS = 10;

// 2. 성과평가(Brag Sheet) 무료 종합 한도 (총 3회)
export const MAX_FREE_BRAG_SYNTHESIS = 3;

// 3. 포트폴리오(STAR Resume) 무료 종합 한도 (총 3회)
export const MAX_FREE_STAR_SYNTHESIS = 3;

// 4. 서비스 전체 누적 무료 변환 상한선 (비용 통제용 킬 스위치: 10,000회)
export const MAX_GLOBAL_SERVICE_CREDITS = 10000;

// 5. 연속 클릭 방지 쿨다운 (10초)
export const SYNTHESIS_COOLDOWN_MS = 10000;

// 6. Pro 플랜 월간 정기구독 가격 ($5.99 USD)
export const PRO_MONTHLY_PRICE_USD = 5.99;
