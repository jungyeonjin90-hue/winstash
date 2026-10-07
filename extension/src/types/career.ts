export interface WeekSpan {
  year: number;
  month: number;
  weekOfMonth: number;
  startDate: string; // YYYY-MM-DD (Monday)
  endDate: string;   // YYYY-MM-DD (Sunday)
  label: string;     // 예: "2026년 10월 2주차"
}

export interface CareerRecord {
  id: string;
  createdAt: string;
  target_week?: WeekSpan;
  raw_memo: string;
  weekly_report?: string;
  brag_sheet_item?: string;
  star_portfolio?: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  jobRole?: string;
  toneManner?: string;
  source?: string;
}

export interface CreditStatus {
  isPro: boolean;
  remainingCredits: number;
  maxUserCredits: number;
  isUserExhausted: boolean;
  totalGeneratedCount: number;
}
