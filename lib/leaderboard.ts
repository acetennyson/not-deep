import { db } from "./firebase";
import { collection, addDoc, getCountFromServer, query, where, serverTimestamp } from "firebase/firestore";

export async function recordDeath(sessionId: string, deathCount: number): Promise<number> {
  try {
    await addDoc(collection(db, "ND.deaths"), {
      sessionId,
      deathCount,
      timestamp: serverTimestamp(),
    });
    // rank = number of sessions with fewer deaths than this one + 1
    const worse = await getCountFromServer(
      query(collection(db, "ND.deaths"), where("deathCount", ">", deathCount))
    );
    return worse.data().count + 1;
  } catch {
    return 0;
  }
}
