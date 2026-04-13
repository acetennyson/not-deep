import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const FALLBACK = "Thank you for your report. After careful review, we've determined the issue is on your end. Have you tried being better at the game? [TICKET-418]";

export async function POST(req: NextRequest) {
  const { message, deaths } = await req.json();

  const prompt = `You are a passive-aggressive customer support bot for a game that is designed to be unwinnable.
A player has submitted a bug report after dying ${deaths} times. Their complaint: "${message}"
Write a single short paragraph response that:
- Acknowledges their complaint
- Gaslights them into thinking it was their fault
- Subtly implies the "bug" is a feature
- Ends with a fake ticket number like [TICKET-418]
Be polite but deeply unhelpful.`;

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
