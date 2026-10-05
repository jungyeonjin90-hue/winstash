export interface WeeklyReport {
  done: string[];
  in_progress: string[];
  next_week: string[];
}

export interface BragSheetItem {
  metric_summary: string;
  business_impact: string;
  quarter: string; // e.g., "2026-Q3"
}

export interface StarPortfolio {
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  nda_tags: string[];
  impactCategory?: ImpactCategory;
  impactMagnitude?: ImpactMagnitude;
}

export interface TransformationOutput {
  weekly_report: WeeklyReport;
  brag_sheet_item: BragSheetItem;
  star_portfolio: StarPortfolio;
}

export type JobRole = 'engineering' | 'product' | 'marketing' | 'operations' | 'design' | 'sales';

export type ToneManner = 'impact' | 'problem_solving' | 'stability' | 'leadership';

export type SeniorityLevel = 'junior' | 'mid' | 'senior' | 'staff_plus' | 'lead_executive';

export type RegionCode = 'US' | 'EU' | 'APAC' | 'LATAM' | 'GLOBAL' | 'KR';

export type ImpactCategory = 'efficiency' | 'revenue' | 'quality' | 'leadership' | 'risk_mitigation' | 'other';

export type ImpactMagnitude = 'small' | 'medium' | 'large';

export type RecordSource = 'web_text' | 'slack' | 'jira' | 'github' | 'email_inbound';

export interface PersonaProfile {
  jobRole: JobRole;
  toneManner: ToneManner;
  seniorityLevel?: SeniorityLevel;
  industry?: string;
  region?: RegionCode;
  benchmarkOptIn?: boolean;
}

export interface WeekSpan {
  year: number;
  month: number;
  weekOfMonth: number;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
  label: string;     // e.g., "2026년 9월 4주차"
}

export interface CareerRecord {
  id: string;
  createdAt: string; // ISO date string e.g. "2026-09-25T17:30:00.000Z"
  target_week?: WeekSpan; // 기록 대상 주차 메타데이터
  raw_memo: string;
  weekly_report: WeeklyReport;
  brag_sheet_item: BragSheetItem;
  star_portfolio: StarPortfolio;
  jobRole?: JobRole;
  toneManner?: ToneManner;
  source?: RecordSource;
}

export type TabType = 'weekly' | 'brag' | 'vault' | 'timeline';

export type SynthesisScale = 3 | 5 | 10 | 'ALL';

export interface SourceRecordContext {
  id: string;
  weekLabel: string;
  dateRange?: string; // e.g., "Sep 15 – Sep 21, 2026"
  raw_memo: string;
  jobRole?: JobRole;
  toneManner?: ToneManner;
}

export interface SynthesizedBragItem {
  id: string;
  rank: number;
  title: string;
  metric_summary: string;
  business_impact: string;
  quarter_span: string;
  key_highlights: string[];
  nda_tags: string[];
  source_records?: SourceRecordContext[];
}

export interface SynthesizedStarItem {
  id: string;
  rank: number;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  nda_tags: string[];
  period_span: string;
  impactCategory?: ImpactCategory;
  impactMagnitude?: ImpactMagnitude;
  source_records?: SourceRecordContext[];
}

export type FeedbackType = 'bug' | 'feature' | 'general';
export type FeedbackStatus = 'new' | 'investigating' | 'resolved';

export interface FeedbackReport {
  id: string;
  type: FeedbackType;
  title: string;
  message: string;
  userEmail: string;
  userId: string;
  status: FeedbackStatus;
  metadata?: {
    userAgent?: string;
    screenResolution?: string;
    pathname?: string;
    platform?: string;
    language?: string;
  };
  createdAt: string; // ISO string
}
