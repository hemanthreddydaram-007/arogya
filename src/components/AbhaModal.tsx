"use client";

import React, { useState } from "react";
import { ShieldCheck, CheckCircle2, Download, Copy, X, FileCode } from "lucide-react";

interface AbhaModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: any[];
  biomarkers: any[];
  medications: any[];
}

export function AbhaModal({ isOpen, onClose, documents, biomarkers, medications }: AbhaModalProps) {
  const [abhaNumber] = useState("91-4829-1049-8392");
  const [abhaAddress] = useState("hemanth@abdm");
  const [activeTab, setActiveTab] = useState<"abha" | "fhir">("abha");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Build FHIR R4 Compliant Bundle
  const fhirBundle = {
    resourceType: "Bundle",
    id: "abdm-health-record-bundle",
    type: "document",
    timestamp: new Date().toISOString(),
    entry: [
      {
        resource: {
          resourceType: "Patient",
          id: "patient-001",
          identifier: [
            { system: "https://healthid.ndhm.gov.in", value: abhaNumber }
          ],
          name: [{ text: "Patient" }],
          telecom: [{ system: "email", value: abhaAddress }]
        }
      },
      ...biomarkers.map((b, idx) => ({
        resource: {
          resourceType: "Observation",
          id: `obs-${idx}`,
          status: "final",
          code: { text: b.marker_name },
          valueQuantity: {
            value: Number(b.value) || b.value,
            unit: b.unit || "unit"
          },
          interpretation: [{ text: b.status || "normal" }]
        }
      })),
      ...medications.map((m, idx) => ({
        resource: {
          resourceType: "MedicationStatement",
          id: `med-${idx}`,
          status: m.status === "active" ? "active" : "completed",
          medicationCodeableConcept: { text: m.name },
          dosage: [{ text: `${m.dosage} - ${m.frequency}` }]
        }
      }))
    ]
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(fhirBundle, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(fhirBundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ABDM_FHIR_Records_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-[#0B0F1D] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Ayushman Bharat Digital Mission (ABDM)</h3>
              <p className="text-[11px] text-neutral-400 font-mono">FHIR R4 Schema & National Health ID Link</p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex space-x-2 border-b border-white/[0.06] pb-2">
          <button
            onClick={() => setActiveTab("abha")}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold font-mono transition cursor-pointer ${
              activeTab === "abha" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-neutral-400 hover:text-white"
            }`}
          >
            ABHA Identity Card
          </button>
          <button
            onClick={() => setActiveTab("fhir")}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold font-mono transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === "fhir" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-neutral-400 hover:text-white"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>FHIR R4 JSON Schema ({fhirBundle.entry.length} Resources)</span>
          </button>
        </div>

        {/* TAB 1: ABHA ID Card */}
        {activeTab === "abha" && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-gradient-to-tr from-cyan-950/40 via-blue-950/20 to-neutral-900 border border-cyan-500/30 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">ABDM / National Health Authority</span>
                  <div className="text-base font-extrabold text-white mt-1">Ayushman Bharat Health Account</div>
                </div>
                <div className="flex items-center space-x-1 text-emerald-400 text-xs font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>LINKED</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <span className="text-neutral-400 text-[10px] uppercase">14-Digit ABHA Number</span>
                  <div className="text-white font-bold text-sm tracking-wider mt-0.5">{abhaNumber}</div>
                </div>
                <div>
                  <span className="text-neutral-400 text-[10px] uppercase">ABHA Address (PHR)</span>
                  <div className="text-cyan-300 font-bold text-sm mt-0.5">{abhaAddress}</div>
                </div>
              </div>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Linked records enable interoperability with hospitals, clinics, and diagnostic labs under India's Ayushman Bharat Digital Mission.
            </p>
          </div>
        )}

        {/* TAB 2: FHIR R4 Schema Inspector */}
        {activeTab === "fhir" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400 font-mono text-[11px]">Standard: HL7 FHIR Release 4 &middot; application/fhir+json</span>
              <div className="flex space-x-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1 bg-white/[0.05] hover:bg-white/[0.1] text-neutral-200 rounded-lg text-xs font-mono flex items-center space-x-1 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? "Copied!" : "Copy JSON"}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold rounded-lg text-xs font-mono flex items-center space-x-1 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Bundle</span>
                </button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto bg-black/60 rounded-xl p-4 border border-white/[0.06] font-mono text-[11px] text-cyan-300">
              <pre>{JSON.stringify(fhirBundle, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}