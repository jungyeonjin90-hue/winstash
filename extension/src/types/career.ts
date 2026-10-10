export interface WeeklyReport {
  done: string[];
  in_progress: string[];
  next_week: string[];
}

export interface BragSheetItem {
  metric_summary: string;
  business_impact: string;
  quarter: string;
}

export interface StarPortfolio {
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  nda_tags?: string[];
}

export interface TransformationOutput {
  weekly_report: WeeklyReport;
  brag_sheet_item: BragSheetItem;
  star_portfolio: StarPortfolio;
}

export interface WeekSpan {
  year: number;
  month: number;
  weekOfMonth: number;
  startDate: string; // YYYY-MM-DD (Monday)
  endDate: string;   // YYYY-MM-DD (Sunday)
  label: string;     // e.g. "Week 2"
}

export interface CareerRecord {
  id: string;
  createdAt: string;
  target_week?: WeekSpan;
  raw_memo: string;
  /** Same text as raw_memo; the extension API returns both field names. */
  rawNote?: string;
  weekly_report?: WeeklyReport;
  brag_sheet_item?: BragSheetItem;
  star_portfolio?: StarPortfolio;
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
