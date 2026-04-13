import { db } from "./firebase";
import { doc, setDoc, getDoc, serverTimestamp, collection, query, orderBy, where, getCountFromServer, getDocs, limit } from "firebase/firestore";
import type { PhysicsConfig } from "./types";

export interface MatchRecord {
  matchNumber: number;
  survivedMs: number;
  jumps: number;
  wallHugs: number;
  keyMashes: number;
  physicsApplied: PhysicsConfig;
  roast: string;
  timestamp: number;
}

// --- localStorage match history ---

export function saveMatch(match: MatchRecord) {
  if (typeof window === "undefined") return;
  const existing = getMatches();
  existing.push(match);
  localStorage.setItem("teapot_matches", JSON.stringify(existing));
}

export function getMatches(): MatchRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("teapot_matches") ?? "[]");
  } catch { return []; }
}

// --- Firestore session (one doc per session) ---

export async function updateSession(
  sessionId: string,
  deathCount: number,
  totalSurvivedMs: number
): Promise<number> {
  try {
    const ref = doc(db, "sessions", sessionId);
    const existing = await getDoc(ref);
    const minutesPlayed = Math.max(0.1, totalSurvivedMs / 60000);
    const deathRate = deathCount / minutesPlayed;

    await setDoc(ref, {
      deathCount,
      minutesPlayed: parseFloat(minutesPlayed.toFixed(2)),
      deathRate: parseFloat(deathRate.toFixed(3)),
      lastActive: serverTimestamp(),
      ...(existing.exists() ? {} : { startTime: serverTimestamp() }),
    }, { merge: true });

    // rank = sessions with higher deathRate than this one + 1
    const worse = await getCountFromServer(
      query(collection(db, "sessions"), where("deathRate", ">", deathRate))
    );
    return worse.data().count + 1;
  } catch {
    return 0;
  }
}

export async function getTopShame(n = 5): Promise<{ rank: number; deathRate: number; deathCount: number }[]> {
  try {
    const snap = await getDocs(
      query(collection(db, "sessions"), orderBy("deathRate", "desc"), limit(n))
    );
    return snap.docs.map((d, i) => ({
      rank: i + 1,
      deathRate: d.data().deathRate,
      deathCount: d.data().deathCount,
    }));
  } catch { return []; }
}
