/**
 * WinStash AI 무료 변환 및 비용 한도 설정
 * 언제든지 필요에 따라 한도 수치를 수정할 수 있습니다.
 */

// 1. 개인별 기본 제공 무료 변환 횟수 (기본 5회)
export const MAX_USER_FREE_CREDITS = 5;

// 2. 서비스 전체 누적 무료 변환 상한선 (기본 10,000회 - 비용 통제용 킬 스위치)
export const MAX_GLOBAL_SERVICE_CREDITS = 10000;

// 3. Brag/STAR AI 종합 일일 재생성 상한 (사용자당 일일 5회)
export const MAX_DAILY_SYNTHESIS_LIMIT = 5;

// 4. 연속 클릭 방지 쿨다운 (10초)
export const SYNTHESIS_COOLDOWN_MS = 10000;

