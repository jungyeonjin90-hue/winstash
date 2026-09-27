import { CareerRecord } from "@/types/career";
import { PeriodPreset } from "@/components/PeriodFilter";

export function filterRecordsByPeriod(
  records: CareerRecord[],
  preset: PeriodPreset,
  customStart?: string,
  customEnd?: string
): CareerRecord[] {
  if (preset === "ALL") return records;

  const now = new Date();

  if (preset === "LAST_3_MONTHS") {
    const cutoff = new Date(now);
    cutoff.setMonth(cutoff.getMonth() - 3);
    return records.filter((r) => new Date(r.createdAt) >= cutoff);
  }

  if (preset === "LAST_6_MONTHS") {
    const cutoff = new Date(now);
    cutoff.setMonth(cutoff.getMonth() - 6);
    return records.filter((r) => new Date(r.createdAt) >= cutoff);
  }

  if (preset === "THIS_YEAR") {
    const cutoff = new Date(now.getFullYear(), 0, 1);
    return records.filter((r) => new Date(r.createdAt) >= cutoff);
  }

  if (preset === "CUSTOM") {
    const start = customStart ? new Date(customStart).getTime() : 0;
    // Set customEnd to end of that day (23:59:59.999)
    let end = Infinity;
    if (customEnd) {
      const endD = new Date(customEnd);
      endD.setHours(23, 59, 59, 999);
      end = endD.getTime();
    }

    return records.filter((r) => {
      const t = new Date(r.createdAt).getTime();
      return t >= start && t <= end;
    });
  }

  return records;
}

export function formatPeriodLabel(
  preset: PeriodPreset,
  customStart?: string,
  customEnd?: string
): string {
  const currentYear = new Date().getFullYear();
  if (preset === "ALL") return "전체 누적 기간";
  if (preset === "LAST_3_MONTHS") return "최근 3개월 (분기)";
  if (preset === "LAST_6_MONTHS") return "최근 6개월 (상/하반기)";
  if (preset === "THIS_YEAR") return `${currentYear}년도 전체`;
  if (preset === "CUSTOM") return `${customStart || "시작일"} ~ ${customEnd || "종료일"}`;
  return "선택 기간";
}
