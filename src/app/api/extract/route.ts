import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const maxDuration = 60; // Allow sufficient time for high-resolution vision inference

export async function POST(req: Request) {
  try {
    const { base64Data, mimeType, targetLanguage = "en" } = await req.json();

    if (!base64Data || !mimeType) {
      return NextResponse.json({ error: "Missing document payload" }, { status: 400 });
    }

    const langDirective =
      targetLanguage === "te"
        ? "Telugu (తెలుగు)"
        : targetLanguage === "hi"
        ? "Hindi (हिन्दी)"
        : "English";

    const prompt = `
You are an expert Clinical Informatics & Hospital Documentation Specialist.
Your task is to analyze this hospital record (which may be a handwritten prescription, diagnostic lab panel, discharge summary, or outpatient consult note) and produce an authoritative, comprehensive, patient-centered clinical summary following standard health communication guidelines.

TARGET LANGUAGE REQUIREMENT:
Generate all patient-facing fields (plainSummary, diagnosis, abnormalFindings, normalFindings, medicationReconciliation, redFlagWarnings, lifestyleAndDiet, questionsForDoctor) in ${langDirective}. 
If ${langDirective} is Telugu or Hindi, render fluent, natural regional script (keep drug names like Metformin/Paracetamol recognizable in parentheses if transliterated).

Follow this strict clinical reasoning process:
1. DOCUMENT IDENTIFICATION: Identify whether this is a prescription, laboratory report, discharge summary, or radiology/diagnostic report.
2. CLINICAL CONTEXT: Extract the date, attending physician/hospital, and primary diagnoses/indications.
3. BIOMARKER & TEST EXTRACTION:
   - Identify every numerical test value, reference interval, and clinical unit.
   - For any abnormal or borderline value, provide a clear, empathetic biological explanation: Explain what it biologically means in the human body (e.g. "Elevated HbA1c means excess glucose has bound to hemoglobin over the last 90 days, indicating insulin resistance").
4. MEDICATION RECONCILIATION:
   - Extract generic/brand name, exact strength (e.g. 500mg), route, frequency schedule (translate Latin codes like OD, BD, TDS, SOS into plain daily instructions like "Once daily in the morning"), duration, and purpose.
   - Note if a medicine is newly started, continued, or stopped.
   - If handwriting is unreadable, tag as "[Unclear: Confirm with pharmacist]".
5. RED-FLAG WARNINGS: Identify emergency symptoms that require urgent medical attention based on the diagnosis and medications.
6. ACTIONABLE FOLLOW-UP: Explicit next steps and smart, high-yield questions for the patient's next consultation.

You MUST respond strictly with a valid JSON object with NO surrounding markdown or backticks:

{
  "docType": "prescription" | "lab_report" | "discharge_summary" | "diagnostic_record",
  "recordDate": "YYYY-MM-DD",
  "doctorName": "Doctor or Hospital name",
  "primaryDiagnosis": "Primary diagnosis or clinical reason for consultation in ${langDirective}",
  
  "plainSummary": "A cohesive, 3-to-4 sentence compassionate summary in ${langDirective} explaining what happened, the overall health assessment, and the main goal of the treatment plan.",
  "technicalSummary": "A precise clinical summary in English using medical nomenclature for clinical handover.",
  
  "abnormalFindings": [
    {
      "markerName": "Test Name",
      "value": "Measured Value",
      "referenceRange": "Normal Range",
      "status": "high" | "low" | "critical",
      "biologicalMeaning": "Simple explanation in ${langDirective} of why this value is out of range and what it means for the body"
    }
  ],

  "normalFindings": [
    {
      "markerName": "Test Name",
      "value": "Measured Value with unit",
      "status": "normal"
    }
  ],

  "biomarkers": [
    {
      "markerName": "Test Name",
      "value": 120,
      "unit": "mg/dL",
      "status": "normal" | "high" | "low" | "critical"
    }
  ],

  "medications": [
    {
      "name": "Drug Name",
      "dosage": "e.g. 500mg",
      "frequency": "e.g. Twice daily after meals",
      "duration": "e.g. 14 days",
      "indication": "What this medicine treats",
      "actionType": "started" | "continued" | "adjusted" | "discontinued"
    }
  ],

  "redFlagWarnings": [
    "Specific symptom warning requiring immediate hospital attention in ${langDirective}"
  ],

  "lifestyleAndDiet": [
    "Practical diet or activity guidance based on the findings in ${langDirective}"
  ],

  "questionsForDoctor": [
    "High-value question the patient should ask their doctor at their next visit in ${langDirective}"
  ]
}
`;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    };

    let textResponse = "";

    // Dual-model resilient execution (Primary: 3.1 Flash-Lite, Fallback: 3.5 Flash-Lite)
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
      const result = await model.generateContent([prompt, imagePart]);
      textResponse = result.response.text();
    } catch {
      const fallbackModel = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
      const fallbackResult = await fallbackModel.generateContent([prompt, imagePart]);
      textResponse = fallbackResult.response.text();
    }

    // Clean JSON markdown wrappings if present
    const cleaned = textResponse
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const parsedData = JSON.parse(cleaned);
    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Clinical document summarization failure:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process and summarize clinical document" },
      { status: 500 }
    );
  }
}