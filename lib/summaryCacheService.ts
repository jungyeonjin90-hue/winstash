import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { SynthesizedBragItem, SynthesizedStarItem, JobRole, ToneManner } from "@/types/career";

export interface SummaryCacheEntry {
  cacheKey: string;
  type: "brag" | "star";
  year: string;
  half: string;
  quarter: string;
  scope: 3 | 5 | 10;
  jobRole: JobRole;
  toneManner: ToneManner;
  items: SynthesizedBragItem[] | SynthesizedStarItem[];
  sourceRecordIds: string[];
  sourceRecordCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Builds a deterministic cache key that incorporates Narrative Tone & Voice and JobRole
 */
export function buildSummaryCacheKey(
  type: "brag" | "star",
  year: string,
  half: string = "ALL",
  quarter: string = "ALL",
  scope: 3 | 5 | 10,
  jobRole: JobRole = "engineering",
  toneManner: ToneManner = "impact"
): string {
  return `${type}_${year}_${half}_${quarter}_${scope}_${jobRole}_${toneManner}`;
}

const LOCAL_STORAGE_CACHE_PREFIX = "career_pulse_summary_cache_";

/**
 * Retrieves cached summary from Firestore or LocalStorage
 */
export async function getSummaryCache(
  userId: string,
  isDemo: boolean,
  cacheKey: string
): Promise<SummaryCacheEntry | null> {
  // 1. Try Firestore if configured
  if (isFirebaseConfigured && db && !isDemo && userId) {
    try {
      const docRef = doc(db, "users", userId, "summary_cache", cacheKey);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as SummaryCacheEntry;
      }
    } catch (e) {
      console.warn("Failed to fetch summary cache from Firestore, falling back to local:", e);
    }
  }

  // 2. Fallback to LocalStorage
  if (typeof window !== "undefined") {
    try {
      const localData = localStorage.getItem(`${LOCAL_STORAGE_CACHE_PREFIX}${userId}_${cacheKey}`);
      if (localData) {
        return JSON.parse(localData) as SummaryCacheEntry;
      }
    } catch (e) {
      console.error("Failed to read local summary cache:", e);
    }
  }

  return null;
}

/**
 * Saves synthesized summary into Firestore and LocalStorage
 */
export async function saveSummaryCache(
  userId: string,
  isDemo: boolean,
  entry: SummaryCacheEntry
): Promise<void> {
  // 1. Save to LocalStorage always for instantaneous client cache
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        `${LOCAL_STORAGE_CACHE_PREFIX}${userId}_${entry.cacheKey}`,
        JSON.stringify(entry)
      );
    } catch (e) {
      console.warn("Local storage cache write failed:", e);
    }
  }

  // 2. Save to Firestore if available
  if (isFirebaseConfigured && db && !isDemo && userId) {
    try {
      const docRef = doc(db, "users", userId, "summary_cache", entry.cacheKey);
      await setDoc(docRef, entry);
    } catch (e) {
      console.error("Firestore summary cache write failed:", e);
    }
  }
}

/**
 * Checks if the cached summary is stale compared to the current records in the selected period
 */
export function isSummaryStale(
  cachedEntry: SummaryCacheEntry | null,
  currentRecordIds: string[]
): boolean {
  if (!cachedEntry) return false;
  // If count differs, or if any new record ID is not in cached sourceRecordIds
  if (cachedEntry.sourceRecordCount !== currentRecordIds.length) {
    return true;
  }
  const cachedSet = new Set(cachedEntry.sourceRecordIds);
  return currentRecordIds.some((id) => !cachedSet.has(id));
}
