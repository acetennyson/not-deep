import type { PhysicsConfig, DeathPayload, JudgeResponse } from "./types";
import { DEFAULT_PHYSICS } from "./types";

export async function judgePlayer(payload: DeathPayload): Promise<JudgeResponse> {
  try {
    const res = await fetch("/api/judge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Judge API error:", data);
      throw new Error(JSON.stringify(data));
    }
    return data;
  } catch (e) {
    console.error("judgePlayer failed:", e);
    return { physics: DEFAULT_PHYSICS, roast: "You died. Again. Shocking." };
  }
}

export async function submitBugReport(message: string, deaths: number): Promise<string> {
  try {
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, deaths }),
    });
    // 418 is expected — always read the body
    const data = await res.json();
    return data.response;
  } catch (e) {
    console.error("submitBugReport failed:", e);
    return "Your complaint has been brewed and discarded.";
  }
}
