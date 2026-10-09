import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is missing in .env.local" }, { status: 500 });
    }

    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message prompt is required" }, { status: 400 });
    }

    // 1. Retrieve current verified patient records for clinical RAG grounding
    const { data: profile } = await supabase.from("profiles").select("*").limit(1).maybeSingle();
    const { data: documents } = await supabase.from("documents").select("*").order("record_date", { ascending: false });
    const { data: medications } = await supabase.from("medications").select("*");
    const { data: biomarkers } = await supabase.from("biomarkers").select("*").order("test_date", { ascending: false });
    const { data: reminders } = await supabase.from("reminders").select("*").order("time", { ascending: true });

    let actionTaken: string | undefined = undefined;
    const lower = message.toLowerCase();

    // 2. Dynamic Reminder & Alarm Parser
    if (lower.includes("remind") || lower.includes("reminder") || lower.includes("alarm")) {
      try {
        let extractedTime = "09:00 AM";

        const match24 = message.match(/\b([01]?[0-9]|2[0-3]):([0-5][0-9])\b/);
        const match12 = message.match(/\b(1[0-2]|0?[1-9]):([0-5][0-9])\s*(am|pm)\b/i);

        if (match12) {
          extractedTime = match12[0].toUpperCase();
        } else if (match24) {
          extractedTime = match24[0];
        } else if (lower.includes("night") || lower.includes("bedtime")) {
          extractedTime = "21:00";
        } else if (lower.includes("evening")) {
          extractedTime = "18:00";
        } else if (lower.includes("afternoon")) {
          extractedTime = "14:00";
        } else if (lower.includes("morning")) {
          extractedTime = "08:00";
        }

        let cleanTitle = message
          .replace(/^(please\s+)?(remind me to|set a reminder to|set an alarm for|remind me)\s*/i, "")
          .replace(/\b(at|around)\s*([01]?[0-9]|2[0-3]):[0-5][0-9](\s*(am|pm))?\b/i, "")
          .trim();

        cleanTitle = cleanTitle.replace(/^["']|["']$/g, "").trim();

        await supabase.from("reminders").insert([{
          title: cleanTitle || "Medication Reminder",
          time: extractedTime,
          type: "medication"
        }]);

        actionTaken = `createReminder (set for ${extractedTime})`;
      } catch (remErr) {
        console.warn("Failed to auto-insert reminder:", remErr);
      }
    }

    // 3. Assemble clinical grounding context
    const contextText = `
=== VERIFIED PATIENT CLINICAL DATA ===
Patient Profile: ${JSON.stringify(profile || {})}
Active Regimens: ${JSON.stringify(medications || [])}
Tracked Biomarkers: ${JSON.stringify(biomarkers || [])}
Clinical Documents & Consultation Notes: ${JSON.stringify(documents || [])}
Active Reminders & Alarms: ${JSON.stringify(reminders || [])}
=======================================
`;

    const systemInstruction = `You are Health Copilot, an autonomous clinical assistant.
CRITICAL LANGUAGE REQUIREMENT: You MUST ALWAYS respond in clear, professional English. Never answer in Hindi or any other language unless the user explicitly commands: "Translate into [Language]".
Ground every answer strictly on the provided verified patient data.
Never fabricate dates, dosages, or lab numbers.
Explain findings concisely and directly. Always maintain safety guardrails: never independently alter prescription regimens, and remind the user to consult their physician.`;

    const prompt = `${contextText}\n\nUser Question: ${message}`;
    const genAI = new GoogleGenerativeAI(apiKey);

    let replyText = "";

    // 4. Primary: gemini-3.1-flash-lite, Fallback: gemini-3.5-flash-lite
    try {
      const primaryModel = genAI.getGenerativeModel({
        model: "gemini-3.1-flash-lite",
        systemInstruction
      });
      const result = await primaryModel.generateContent(prompt);
      replyText = result.response.text();
    } catch (modelErr: any) {
      console.warn("gemini-3.1-flash-lite error, falling back to gemini-3.5-flash-lite...", modelErr?.message);
      const fallbackModel = genAI.getGenerativeModel({
        model: "gemini-3.5-flash-lite",
        systemInstruction
      });
      const fallbackResult = await fallbackModel.generateContent(prompt);
      replyText = fallbackResult.response.text();
    }

    return NextResponse.json({
      reply: replyText,
      actionTaken
    });
  } catch (error: any) {
    console.error("Chat agent error:", error);
    return NextResponse.json({ error: error.message || "Failed to communicate with Health Copilot" }, { status: 500 });
  }
}