import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
} from "firebase/firestore";
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
 * Builds a deterministic Content-Addressable cache key that strictly incorporates
 * the exact list of current record IDs. If any record is added or deleted,
 * the cache key changes immediately, preventing ghost records from ever surfacing.
 */
export function buildSummaryCacheKey(
  type: "brag" | "star",
  year: string,
  half: string = "ALL",
  quarter: string = "ALL",
  scope: 3 | 5 | 10,
  jobRole: JobRole = "engineering",
  toneManner: ToneManner = "impact",
  recordIds: string[] = []
): string {
  const sortedIds = recordIds.slice().sort().join("_");
  return `${type}_${year}_${half}_${quarter}_${scope}_${jobRole}_${toneManner}_records:[${sortedIds || "none"}]`;
}

const LOCAL_STORAGE_CACHE_PREFIX = "career_pulse_summary_cache_v2_";
const LEGACY_STORAGE_CACHE_PREFIX = "career_pulse_summary_cache_";

/**
 * Purges all legacy unkeyed or stale summary caches from localStorage
 */
export function purgeLegacySummaryCaches(): void {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // If it's the old prefix and not the new v2 prefix, or doesn't have records:[
      if (key && key.startsWith(LEGACY_STORAGE_CACHE_PREFIX) && !key.startsWith(LOCAL_STORAGE_CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.warn("Failed to purge legacy summary caches:", e);
  }
}

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
 * Saves synthesized summary into Firestore and LocalStorage, and tracks the latest entry per type
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
      // Track as latest generated summary for this type
      localStorage.setItem(
        `${LOCAL_STORAGE_CACHE_PREFIX}${userId}_latest_${entry.type}`,
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

      // Track as latest generated summary in Firestore
      const latestDocRef = doc(db, "users", userId, "summary_cache", `latest_${entry.type}`);
      await setDoc(latestDocRef, entry);
    } catch (e) {
      console.error("Firestore summary cache write failed:", e);
    }
  }
}

/**
 * Retrieves the most recently generated summary cache entry for a given type (brag | star)
 */
export async function getLatestSummaryCache(
  userId: string,
  isDemo: boolean,
  type: "brag" | "star"
): Promise<SummaryCacheEntry | null> {
  // 1. Check LocalStorage first for instant latency
  if (typeof window !== "undefined") {
    try {
      const localData = localStorage.getItem(`${LOCAL_STORAGE_CACHE_PREFIX}${userId}_latest_${type}`);
      if (localData) {
        return JSON.parse(localData) as SummaryCacheEntry;
      }
    } catch (e) {
      console.warn("Failed to read latest summary cache from localStorage:", e);
    }
  }

  // 2. Fallback to Firestore
  if (isFirebaseConfigured && db && !isDemo && userId) {
    try {
      const docRef = doc(db, "users", userId, "summary_cache", `latest_${type}`);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as SummaryCacheEntry;
      }
    } catch (e) {
      console.warn("Failed to fetch latest summary cache from Firestore:", e);
    }
  }

  return null;
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

/**
 * Strict cache validity check:
 * Returns true ONLY if:
 * 1. Cache exists
 * 2. Current records is not empty
 * 3. Count matches exactly
 * 4. The sourceRecordIds in the cache match currentRecordIds 1:1 with NO deleted or missing records
 */
export function isCacheValid(
  cachedEntry: SummaryCacheEntry | null,
  currentRecordIds: string[]
): boolean {
  if (!cachedEntry) return false;
  if (!currentRecordIds || currentRecordIds.length === 0) return false;
  if (!Array.isArray(cachedEntry.sourceRecordIds)) return false;
  if (cachedEntry.sourceRecordCount !== currentRecordIds.length) return false;
  if (cachedEntry.sourceRecordIds.length !== currentRecordIds.length) return false;

  const currentSet = new Set(currentRecordIds);
  const cachedSet = new Set(cachedEntry.sourceRecordIds);

  // If any current record is missing from cache, it's invalid
  if (currentRecordIds.some((id) => !cachedSet.has(id))) return false;
  // If any cached record is no longer in current records (e.g. deleted), it's invalid!
  if (cachedEntry.sourceRecordIds.some((id) => !currentSet.has(id))) return false;

  return true;
}

/**
 * Deletes a single summary cache entry from Firestore and LocalStorage
 */
export async function deleteSummaryCache(
  userId: string,
  isDemo: boolean,
  cacheKey: string
): Promise<void> {
  // 1. LocalStorage
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(`${LOCAL_STORAGE_CACHE_PREFIX}${userId}_${cacheKey}`);
    } catch (e) {
      console.warn("Failed to remove local summary cache item:", e);
    }
  }

  // 2. Firestore
  if (isFirebaseConfigured && db && !isDemo && userId) {
    try {
      const docRef = doc(db, "users", userId, "summary_cache", cacheKey);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn("Failed to delete Firestore summary cache doc:", e);
    }
  }
}

/**
 * Completely purges all summary caches for a user.
 * Must be called when any weekly record is deleted or significantly modified to prevent ghost summaries.
 */
export async function clearUserSummaryCache(
  userId: string,
  isDemo: boolean
): Promise<void> {
  // 1. Purge LocalStorage entries matching user prefix
  if (typeof window !== "undefined") {
    try {
      const userPrefix = `${LOCAL_STORAGE_CACHE_PREFIX}${userId}_`;
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith(LOCAL_STORAGE_CACHE_PREFIX) ||
            key.startsWith(LEGACY_STORAGE_CACHE_PREFIX))
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn("Failed to clear local summary cache:", e);
    }
  }

  // 2. Purge Firestore summary_cache collection
  if (isFirebaseConfigured && db && !isDemo && userId) {
    try {
      const colRef = collection(db, "users", userId, "summary_cache");
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (e) {
      console.warn("Failed to clear Firestore summary cache collection:", e);
    }
  }
}

