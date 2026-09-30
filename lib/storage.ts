import { CareerRecord, JobRole, ToneManner, SeniorityLevel, RegionCode } from "@/types/career";
import { INITIAL_CAREER_RECORDS } from "./initialData";

const STORAGE_KEY = "career_pulse_records_v1";
const SETTINGS_KEY = "career_pulse_settings_v1";

export interface AppSettings {
  provider: "gemini" | "openai";
  jobRole: JobRole;
  toneManner: ToneManner;
  seniorityLevel?: SeniorityLevel;
  industry?: string;
  region?: RegionCode;
  benchmarkOptIn?: boolean;
  firebaseConfig?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  enableFirebase: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  provider: "gemini",
  jobRole: "engineering",
  toneManner: "impact",
  benchmarkOptIn: false,
  enableFirebase: false,
};

export function getSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error("Failed to load settings:", err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getStoredRecords(): CareerRecord[] {
  if (typeof window === "undefined") return INITIAL_CAREER_RECORDS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CAREER_RECORDS));
      return INITIAL_CAREER_RECORDS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CAREER_RECORDS;
  } catch (err) {
    console.error("Failed to load records from localStorage:", err);
    return INITIAL_CAREER_RECORDS;
  }
}

export function saveStoredRecord(record: CareerRecord): CareerRecord[] {
  if (typeof window === "undefined") return [record];
  const records = getStoredRecords();
  const updated = [record, ...records.filter((r) => r.id !== record.id)];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteStoredRecord(id: string): CareerRecord[] {
  if (typeof window === "undefined") return [];
  const records = getStoredRecords();
  const updated = records.filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function resetToInitialRecords(): CareerRecord[] {
  if (typeof window === "undefined") return INITIAL_CAREER_RECORDS;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CAREER_RECORDS));
  return INITIAL_CAREER_RECORDS;
}

export function exportRecordsAsJSON(): string {
  const records = getStoredRecords();
  return JSON.stringify(records, null, 2);
}

export function importRecordsFromJSON(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
