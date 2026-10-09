import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is missing in .env.local" }, { status: 500 });
    }

    const { base64Data, mimeType, targetLanguage = "en" } = await req.json();

    if (!base64Data) {
      return NextResponse.json({ error: "No document data provided" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const languageInstruction = 
      targetLanguage === "te" ? "Translate plainSummary, abnormal explanations, and doctor questions into fluent TELUGU (తెలుగు)." :
      targetLanguage === "hi" ? "Translate plainSummary, abnormal explanations, and doctor questions into fluent HINDI (हिन्दी)." :
      "Provide plainSummary, abnormal explanations, and doctor questions in clear, empathetic ENGLISH.";

    const extractionPrompt = `
You are an expert clinical ingestion and ABDM/FHIR interoperability engine.
Analyze the provided medical document (prescription, laboratory report, or clinical note).
Document may be bilingual or contain handwritten clinical script.

${languageInstruction}

Extract and structure the data into JSON matching this exact schema:
{
  "docType": "prescription" | "lab_report" | "clinical_note",
  "recordDate": "YYYY-MM-DD",
  "doctorName": "Physician name if present",
  "diagnosis": "Primary diagnosis or clinical indication",
  "plainSummary": "A clear, empathetic 2-sentence explanation of what this report says, free of complex jargon.",
  "technicalSummary": "A precise clinical summary with key findings.",
  "medications": [
    {
      "name": "Medication name",
      "dosage": "e.g. 500mg",
      "frequency": "e.g. Twice daily after meals",
      "duration": "e.g. 14 days"
    }
  ],
  "biomarkers": [
    {
      "markerName": "e.g. HbA1c, Fasting Blood Sugar, Vitamin D",
      "value": "Numeric value or result",
      "unit": "e.g. mg/dL, ng/mL",
      "status": "normal" | "high" | "low" | "critical",
      "abnormalExplanation": "Clear, plain-language explanation of what this specific abnormal reading means for the human body and overall health."
    }
  ],
  "questionsForDoctor": [
    "Relevant, actionable questions the patient should ask their doctor at their next consultation"
  ],
  "fhirBundle": {
    "resourceType": "Bundle",
    "type": "collection",
    "entry": [
      {
        "resource": {
          "resourceType": "DiagnosticReport",
          "status": "final",
          "code": { "text": "Clinical Ingestion Document" }
        }
      }
    ]
  }
}

Return ONLY valid JSON. Do not wrap in markdown triple backticks.
`;

    const filePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType || "image/png"
      }
    };

    let rawText = "";

    // Primary: gemini-3.1-flash-lite, Fallback: gemini-3.5-flash-lite
    try {
      const primaryModel = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
      const result = await primaryModel.generateContent([extractionPrompt, filePart]);
      rawText = result.response.text();
    } catch (modelErr: any) {
      console.warn("Primary model error, falling back to gemini-3.5-flash-lite...", modelErr?.message);
      const fallbackModel = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
      const fallbackResult = await fallbackModel.generateContent([extractionPrompt, filePart]);
      rawText = fallbackResult.response.text();
    }

    const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(cleanJson);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Extraction error:", error);
    return NextResponse.json({ error: error.message || "Failed to parse document" }, { status: 500 });
  }
}