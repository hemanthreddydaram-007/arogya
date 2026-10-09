"use client";

import React, { useState } from "react";
import { 
  Building2, X, CheckCircle2, ArrowRight, ArrowLeft, 
  Fingerprint, Phone, Hash, ShieldCheck, Copy, Check, Download, ExternalLink, Loader2 
} from "lucide-react";

interface AbhaModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents?: any[];
  biomarkers?: any[];
  medications?: any[];
}

export function AbhaModal({ isOpen, onClose, documents = [], biomarkers = [], medications = [] }: AbhaModalProps) {
  // Navigation: 1 = Consent Screen, 2 = Auth Mode & Input, 3 = OTP Verification, 4 = Linked Profile & FHIR
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Consent checkbox
  const [consentChecked, setConsentChecked] = useState(false);

  // Auth Method: 'abha' | 'aadhaar' | 'mobile'
  const [authMethod, setAuthMethod] = useState<"abha" | "aadhaar" | "mobile">("abha");
  
  // Inputs
  const [inputValue, setInputValue] = useState("91-4829-1049-8392");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);

  // Success state & FHIR viewer
  const [isLinked, setIsLinked] = useState(false);
  const [activeTab, setActiveTab] = useState<"card" | "fhir">("card");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Format ABHA as XX-XXXX-XXXX-XXXX
  const handleInputChange = (val: string) => {
    if (authMethod === "abha") {
      const clean = val.replace(/\D/g, "").slice(0, 14);
      let formatted = "";
      for (let i = 0; i < clean.length; i++) {
        if (i === 2 || i === 6 || i === 10) formatted += "-";
        formatted += clean[i];
      }
      setInputValue(formatted || val);
    } else {
      setInputValue(val);
    }
  };

  const handleSendOtp = () => {
    if (!inputValue.trim()) {
      alert("Please enter a valid credential");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3); // Go to OTP verification
    }, 700);
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val[0];
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyOtp = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsLinked(true);
      setStep(4); // Show linked card and FHIR exporter
    }, 900);
  };

  // Generate valid HL7 FHIR Release 4 Bundle
  const fhirBundle = {
    resourceType: "Bundle",
    id: "bundle-abdm-" + (inputValue.replace(/\D/g, "") || "91482910498392"),
    type: "document",
    timestamp: new Date().toISOString(),
    entry: [
      {
        resource: {
          resourceType: "Patient",
          id: "patient-root",
          identifier: [
            {
              system: "https://healthid.ndhm.gov.in",
              value: inputValue || "91-4829-1049-8392",
            },
          ],
          name: [{ text: "Attending Patient" }],
          gender: "unknown",
        },
      },
      ...medications.map((m, idx) => ({
        resource: {
          resourceType: "MedicationStatement",
          id: `med-${idx + 1}`,
          status: m.status === "active" ? "active" : "completed",
          medicationCodeableConcept: { text: m.name },
          dosage: [{ text: `${m.dosage} (${m.frequency})` }],
        },
      })),
      ...biomarkers.map((b, idx) => ({
        resource: {
          resourceType: "Observation",
          id: `obs-${idx + 1}`,
          status: "final",
          code: { text: b.marker_name },
          valueQuantity: {
            value: Number(b.value),
            unit: b.unit || "unit",
          },
          interpretation: [{ text: b.status || "normal" }],
        },
      })),
    ],
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(fhirBundle, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(fhirBundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FHIR-R4-ABDM-Bundle.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetFlow = () => {
    setStep(1);
    setConsentChecked(false);
    setIsLinked(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-[#0C111D] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Ribbon */}
        <div className="p-6 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">ABDM / ABHA Connect</h2>
              <p className="text-xs text-neutral-400 font-sans">Government of India Digital Health</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.05] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-neutral-200">
          
          {/* ================= STEP 1: CONSENT SCREEN ================= */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Highlight Box */}
              <div className="p-4 rounded-2xl bg-emerald-500/[0.07] border border-emerald-500/20 space-y-2">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                  About Ayushman Bharat Digital Mission (ABDM)
                </h4>
                <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                  An initiative by the Government of India to create a seamless, integrated digital healthcare ecosystem across the country. Connecting allows verified diagnostic labs and hospitals to securely share authorized records.
                </p>
              </div>

              {/* Data Access Checklist */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-neutral-400">
                  What data will be accessed:
                </span>
                <ul className="space-y-2 text-xs text-neutral-300 font-sans">
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Authorized prescriptions & diagnostic reports</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Verified Ayushman Bharat Health Account (ABHA) address</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Connect seamlessly using ABHA, Aadhaar, or Phone</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>You retain 100% control to revoke access anytime</span>
                  </li>
                </ul>
              </div>

              {/* Mandatory Consent Checkbox */}
              <label className="flex items-start space-x-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] cursor-pointer hover:border-emerald-500/30 transition">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-white/20 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-transparent cursor-pointer"
                />
                <span className="text-xs text-neutral-300 leading-relaxed font-sans">
                  I have read and understood the consent information and authorize the specific data access described above. I understand that I can choose not to connect.
                </span>
              </label>

              {/* Action Button */}
              <button
                disabled={!consentChecked}
                onClick={() => setStep(2)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Continue to Connection</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-1">
                <a
                  href="https://abha.abdm.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-400 hover:underline inline-flex items-center space-x-1"
                >
                  <span>Don't have an ABHA? Register on official portal</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              </div>
            </div>
          )}

          {/* ================= STEP 2: AUTH METHOD & INPUT ================= */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h3 className="text-sm font-bold text-white">Choose How to Connect Your ABHA</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  You can authenticate using your ABHA Number, Aadhaar, or Mobile Number.
                </p>
              </div>

              {/* 3-Way Mode Pill Selector */}
              <div className="grid grid-cols-3 gap-2 bg-white/[0.04] p-1.5 rounded-2xl border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod("abha");
                    setInputValue("91-4829-1049-8392");
                  }}
                  className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                    authMethod === "abha"
                      ? "bg-emerald-700 text-white shadow-lg"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Hash className="w-3.5 h-3.5" />
                  <span>ABHA No.</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod("aadhaar");
                    setInputValue("");
                  }}
                  className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                    authMethod === "aadhaar"
                      ? "bg-emerald-700 text-white shadow-lg"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  <span>Aadhaar</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod("mobile");
                    setInputValue("");
                  }}
                  className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                    authMethod === "mobile"
                      ? "bg-emerald-700 text-white shadow-lg"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Mobile</span>
                </button>
              </div>

              {/* Input Form */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-neutral-200">
                  {authMethod === "abha" && "Enter 14-digit ABHA Number"}
                  {authMethod === "aadhaar" && "Enter 12-digit Aadhaar Number"}
                  {authMethod === "mobile" && "Enter 10-digit Registered Mobile Number"}
                </label>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder={
                    authMethod === "abha"
                      ? "91-1234-5678-9012"
                      : authMethod === "aadhaar"
                      ? "XXXX-XXXX-XXXX"
                      : "9876543210"
                  }
                  className="w-full text-center tracking-widest font-mono text-base font-bold px-4 py-3 bg-white/[0.03] border border-white/[0.1] focus:border-emerald-500 rounded-2xl text-white focus:outline-none transition"
                />
                <p className="text-[11px] text-center text-neutral-400 font-sans pt-1">
                  An OTP will be sent to the mobile linked to your {authMethod.toUpperCase()}.
                </p>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Contacting NHA Sandbox...</span>
                  </>
                ) : (
                  <span>Send Verification OTP</span>
                )}
              </button>

              <button
                onClick={() => setStep(1)}
                className="w-full py-2 text-xs text-neutral-400 hover:text-white transition flex items-center justify-center space-x-1.5 cursor-pointer font-sans"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            </div>
          )}

          {/* ================= STEP 3: OTP VERIFICATION ================= */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-3">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white">Enter 6-Digit OTP</h3>
                <p className="text-xs text-neutral-400 mt-1 font-sans">
                  We sent a one-time verification code to the mobile linked to <br />
                  <span className="font-mono text-emerald-400 font-semibold">{inputValue}</span>
                </p>
              </div>

              {/* 6-Digit Code Boxes */}
              <div className="flex justify-center space-x-2 py-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-11 h-12 text-center text-lg font-mono font-extrabold bg-white/[0.04] border border-white/[0.12] focus:border-emerald-500 rounded-xl text-white focus:outline-none transition"
                  />
                ))}
              </div>

              <div className="text-center">
                <span className="text-[11px] text-neutral-500 font-mono">
                  Demo Sandbox: Type any 6 numbers (e.g. 1 2 3 4 5 6)
                </span>
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying with NHA Gateway...</span>
                  </>
                ) : (
                  <span>Verify & Link Health Records</span>
                )}
              </button>

              <button
                onClick={() => setStep(2)}
                className="w-full py-2 text-xs text-neutral-400 hover:text-white transition flex items-center justify-center space-x-1.5 cursor-pointer font-sans"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Credential</span>
              </button>
            </div>
          )}

          {/* ================= STEP 4: LINKED & FHIR R4 EXPORT ================= */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Linked Notification Badge */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Successfully Linked to ABDM</h4>
                    <p className="text-[10px] text-emerald-300 font-mono">National Health ID Synced</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  ACTIVE
                </span>
              </div>

              {/* View Switcher: ID Card vs FHIR R4 JSON */}
              <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/[0.06] text-xs font-mono">
                <button
                  onClick={() => setActiveTab("card")}
                  className={`flex-1 py-2 font-bold rounded-lg transition cursor-pointer ${
                    activeTab === "card" ? "bg-emerald-600 text-white shadow" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  ABHA Identity Card
                </button>
                <button
                  onClick={() => setActiveTab("fhir")}
                  className={`flex-1 py-2 font-bold rounded-lg transition cursor-pointer ${
                    activeTab === "fhir" ? "bg-emerald-600 text-white shadow" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  FHIR R4 JSON ({fhirBundle.entry.length} Resources)
                </button>
              </div>

              {/* TAB: ABHA Identity Card */}
              {activeTab === "card" && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-[#0A101D] to-emerald-950/40 border border-cyan-500/30 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                        ABDM / NATIONAL HEALTH AUTHORITY
                      </span>
                      <h3 className="text-sm font-extrabold text-white mt-0.5">Ayushman Bharat Health Account</h3>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      VERIFIED
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.06]">
                    <div>
                      <span className="text-[10px] text-neutral-400 font-mono uppercase">14-Digit ABHA Number</span>
                      <div className="text-sm font-mono font-bold text-white tracking-wider mt-0.5">
                        {inputValue || "91-4829-1049-8392"}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 font-mono uppercase">ABHA Address (PHR)</span>
                      <div className="text-xs font-mono font-bold text-cyan-300 mt-1">
                        hemanth@abdm
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-neutral-400 leading-relaxed font-sans pt-1">
                    Linked records enable interoperability with hospitals, clinics, and diagnostic labs under India's Ayushman Bharat Digital Mission.
                  </p>
                </div>
              )}

              {/* TAB: FHIR R4 JSON */}
              {activeTab === "fhir" && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[11px] font-mono text-neutral-400">
                      Standard: <strong>HL7 FHIR Release 4 Document Bundle</strong>
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleCopyJson}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-mono text-neutral-200 transition flex items-center space-x-1 cursor-pointer"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? "Copied" : "Copy"}</span>
                      </button>
                      <button
                        onClick={handleDownloadJson}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-xs font-mono text-emerald-300 transition flex items-center space-x-1 cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>Export</span>
                      </button>
                    </div>
                  </div>

                  <pre className="p-3.5 rounded-xl bg-black/60 border border-white/[0.08] text-[10px] font-mono text-cyan-300/90 overflow-x-auto max-h-48 leading-relaxed">
                    {JSON.stringify(fhirBundle, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={resetFlow}
                  className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-xs font-semibold text-neutral-400 hover:text-white transition cursor-pointer"
                >
                  Unlink / Change Account
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow"
                >
                  Done
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}