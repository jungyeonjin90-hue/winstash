import { WeekSpan } from "../types/career";

/**
 * 로컬 시간대 기준 YYYY-MM-DD 포맷팅 (UTC 시차 오차 방지)
 */
export function formatDateLocal(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

/**
 * 주어진 날짜가 속한 주의 월요일(자정) 구하기
 */
export function getMondayOfDate(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay(); // 0(일) ~ 6(토)
  const daysToSubtract = day === 0 ? 6 : day - 1; // 일요일은 6일 전, 월요일은 0일 전
  date.setDate(date.getDate() - daysToSubtract);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * 한국/ISO 8601 표준 주차 계산 엔진
 * - 한 주의 시작: 월요일, 종료: 일요일
 * - 한 주의 소속 월: 목요일(한 주의 과반)이 속한 연도 및 월
 */
export function getWeekSpanFromDate(d: Date = new Date()): WeekSpan {
  const monday = getMondayOfDate(d);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // 목요일 (월요일 + 3일)
  const thursday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 3);
  const year = thursday.getFullYear();
  const month = thursday.getMonth() + 1; // 1 ~ 12

  // 해당 월 1일의 목요일 찾기
  const firstOfMonth = new Date(year, month - 1, 1);
  const firstMonday = getMondayOfDate(firstOfMonth);
  const firstThursday = new Date(
    firstMonday.getFullYear(),
    firstMonday.getMonth(),
    firstMonday.getDate() + 3
  );

  // 만약 1일이 속한 주의 목요일이 전 달에 있다면, 해당 월 1주차는 다음 주부터 시작
  let baseThursday = firstThursday;
  if (firstThursday.getMonth() + 1 !== month) {
    baseThursday = new Date(
      firstThursday.getFullYear(),
      firstThursday.getMonth(),
      firstThursday.getDate() + 7
    );
  }

  const diffTime = thursday.getTime() - baseThursday.getTime();
  const weekNumber = Math.round(diffTime / (7 * 24 * 60 * 60 * 1000)) + 1;

  const startStr = formatDateLocal(monday);
  const endStr = formatDateLocal(sunday);

  return {
    year,
    month,
    weekOfMonth: Math.max(1, weekNumber),
    startDate: startStr,
    endDate: endStr,
    label: `${year}년 ${month}월 ${weekNumber}주차`,
  };
}

/**
 * 현재 오늘 기준의 WeekSpan 반환
 */
export function getCurrentWeekSpan(): WeekSpan {
  return getWeekSpanFromDate(new Date());
}

/**
 * 특정 연도와 월에 존재하는 모든 주차 목록(날짜 범위 포함) 산출
 */
export function getWeeksForMonth(year: number, month: number): WeekSpan[] {
  const weeks: WeekSpan[] = [];
  const seenWeeks = new Set<string>();

  const lastDay = new Date(year, month, 0).getDate();
  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(year, month - 1, day);
    const span = getWeekSpanFromDate(d);
    if (span.year === year && span.month === month) {
      if (!seenWeeks.has(span.startDate)) {
        seenWeeks.add(span.startDate);
        weeks.push(span);
      }
    }
  }

  weeks.sort((a, b) => a.weekOfMonth - b.weekOfMonth);
  return weeks;
}
