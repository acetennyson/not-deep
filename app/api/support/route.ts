import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const FALLBACK = "Thank you for your report. After careful review, we've determined the issue is on your end. Have you tried being better at the game? [TICKET-418]";

export async function POST(req: NextRequest) {
  const { message, deaths } = await req.json();

  const prompt = `You are a support agent for an intentionally unwinnable game. You think the player is an idiot but you're barely hiding it.

Player died ${deaths} times. Their complaint: "${message}"

Write ONE short paragraph (3-4 sentences max). Rules:
- First sentence: acknowledge the complaint in a way that immediately implies they caused it
- Middle: gaslight them with something specific — e.g. "our logs show the jump registered correctly", "thousands of players complete this section daily", "this behavior is documented in the FAQ you didn't read"
- Last sentence: something that sounds helpful but is actually a dismissal. End with [TICKET-418] marked as "Priority: Cosmetic".

Examples of the RIGHT tone:
- "After reviewing your session, our systems registered 47 successful jump inputs — all of which appear to have been timed incorrectly on your end."
- "This is the first report of this nature in 6 months, which suggests the issue may be environmental. Have you tried being better?"
- "We've escalated this to our physics team, who have confirmed that gravity is, in fact, working correctly. [TICKET-418] Priority: Cosmetic."

Do NOT use corporate phrases like "we appreciate your feedback", "we're sorry to hear", or "thank you for reaching out". Be direct, condescending, and specific to their complaint.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    return NextResponse.json({ response: result.response.text().trim() }, { status: 418 });
  } catch (geminiErr) {
    console.error("Gemini failed, trying Groq:", geminiErr);
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });
      const result = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
      });
      const response = result.choices[0].message.content ?? FALLBACK;
      return NextResponse.json({ response }, { status: 418 });
    } catch (groqErr) {
      console.error("Groq also failed:", groqErr);
      return NextResponse.json({ response: FALLBACK }, { status: 418 });
    }
  }
}
