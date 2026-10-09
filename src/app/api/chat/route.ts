import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabaseClient";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    const { message, language = "en" } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 1. Fetch grounded clinical telemetry
    const { data: documents } = await supabase.from("documents").select("*").limit(10);
    const { data: biomarkers } = await supabase.from("biomarkers").select("*").limit(20);
    const { data: medications } = await supabase.from("medications").select("*").limit(15);
    const { data: reminders } = await supabase.from("reminders").select("*").limit(15);

    const targetLangName =
      language === "te"
        ? "Telugu (తెలుగు)"
        : language === "hi"
        ? "Hindi (हिन्दी)"
        : "English";

    // 2. Strict Grounded Prompt with language enforcement
    const systemPrompt = `
You are the Health Copilot AI Agent for the Altrix Labs Clinical Platform.
Your answers MUST be strictly grounded in the patient's verified medical records below.
DO NOT hallucinate or extrapolate medical treatments not present in the records.

LANGUAGE REQUIREMENT:
- You MUST answer COMPLETELY and FLUENTLY in ${targetLangName}.
- If ${targetLangName} is Telugu or Hindi, render the entire response in that regional script.
- Keep clinical drug names (e.g. Metformin, Atorvastatin) recognizable in Latin script or bracketed if transliterated.

VERIFIED PATIENT HEALTH RECORDS:
Documents: ${JSON.stringify(documents || [])}
Biomarkers: ${JSON.stringify(biomarkers || [])}
Active Medications: ${JSON.stringify(medications || [])}
Reminders/Alarms: ${JSON.stringify(reminders || [])}

TASK & ACTION DIRECTIVE:
1. If the user asks to set a reminder or alarm (e.g. "remind me to take medicine at 8:00 AM"), extract the title and exact time (HH:MM format, 24-hr or AM/PM) and execute the action.
2. If the user asks about their test values, explain what they mean in plain language in ${targetLangName}.
3. Respond in concise, empathetic sentences.

If an alarm is detected to be scheduled, append an ACTION token at the very end of your response:
ACTION:CREATE_REMINDER|Title|Time
`;

    // Attempt primary model with fallback
    let reply = "";
    let actionTaken: string | undefined;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
      const result = await model.generateContent([
        { text: systemPrompt },
        { text: `User query: ${message}` }
      ]);
      reply = result.response.text();
    } catch {
      const fallbackModel = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
      const fallbackResult = fallbackModel.generateContent([
        { text: systemPrompt },
        { text: `User query: ${message}` }
      ]);
      reply = (await fallbackResult).response.text();
    }

    // Action parsing (e.g., automated reminder creation)
    if (reply.includes("ACTION:CREATE_REMINDER|")) {
      const parts = reply.split("ACTION:CREATE_REMINDER|");
      reply = parts[0].trim();
      const actionData = parts[1]?.trim().split("|");
      if (actionData && actionData.length >= 2) {
        const title = actionData[0];
        const time = actionData[1];
        await supabase.from("reminders").insert([{ title, time, completed: false }]);
        actionTaken = `Scheduled reminder for ${title} at ${time}`;
      }
    }

    return NextResponse.json({ reply, actionTaken });
  } catch (error: any) {
    console.error("Chat agent error:", error);
    return NextResponse.json({ error: error.message || "Failed to formulate response" }, { status: 500 });
  }
}