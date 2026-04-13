import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import type { DeathPayload, JudgeResponse, PhysicsConfig } from "@/lib/types";
import { DEFAULT_PHYSICS } from "@/lib/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

export async function POST(req: NextRequest) {
  const payload: DeathPayload = await req.json();
  const { deaths, avgJumps, wallHugs, keyMashCount } = payload;

  const meanLevel = Math.min(deaths, 10);

  const prompt = `You are a savage, unfiltered roast comedian who also happens to be a game designer. A player just died in your game — again.

Player stats: ${deaths} total deaths, ${avgJumps} jumps last run, ${wallHugs} seconds hugging walls, ${keyMashCount} rage-mashes on the keyboard.
Roast intensity: ${meanLevel}/10.

Your job: write ONE brutally funny roast sentence about this specific player based on their stats. No softening. No encouragement. Pure ridicule. Reference their actual numbers. The roast should feel personal, like you watched them play and are disgusted.

Examples of the energy you should match:
- "You jumped ${avgJumps} times and still managed to die — that's not bad luck, that's a skill issue with extra steps."
- "You spent ${wallHugs} seconds hugging a wall. The wall felt sorry for you. The wall."
- "You mashed the keyboard ${keyMashCount} times in a panic. Your keyboard is filing for emotional damages."

At intensity 1-3: mockingly sympathetic. 4-6: openly contemptuous. 7-10: absolutely no mercy, go for the jugular.

Respond with ONLY valid JSON:
{
  "physics": {
    "gravity": <number 400-900>,
    "speed": <number 250-500>,
    "jumpForce": <number -600 to -400>,
    "delayEvery": <number 5-15>,
    "mass": <number 0.5-2.5>,
    "drag": <number 0-300>
  },
  "roast": "<one savage sentence, no asterisks, no emojis, just words that hurt>"
}

Physics rules:
- Higher deaths = worse physics (higher gravity, faster speed, weaker jumpForce, lower delayEvery)
- mass > 1.5 = heavy sluggish jumps. mass < 0.8 = floaty uncontrollable
- drag > 150 = teapot slows mid-air unpredictably
- keyMashCount > 3: set gravity to 80 (float away punishment)`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    return NextResponse.json(JSON.parse(text) as JudgeResponse);
  } catch (geminiErr) {
    console.error("Gemini failed, trying Groq:", geminiErr);
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });
      const result = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
      const text = result.choices[0].message.content ?? "";
      return NextResponse.json(JSON.parse(text) as JudgeResponse);
    } catch (groqErr) {
      console.error("Groq also failed:", groqErr);
      const physics: PhysicsConfig = {
        gravity: Math.min(DEFAULT_PHYSICS.gravity + deaths * 30, 900),
        speed: Math.min(DEFAULT_PHYSICS.speed + deaths * 15, 500),
        jumpForce: Math.max(DEFAULT_PHYSICS.jumpForce - deaths * 10, -600),
        delayEvery: Math.max(DEFAULT_PHYSICS.delayEvery - deaths, 5),
        mass: Math.min(1 + deaths * 0.1, 2.5),
        drag: Math.min(deaths * 20, 300),
      };
      return NextResponse.json({ physics, roast: "The AI refused to roast you. That's worse." });
    }
  }
}
