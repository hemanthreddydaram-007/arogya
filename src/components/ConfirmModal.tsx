"use client";

// import React, { useState } from "react";
// import { 
//   X, Check, AlertTriangle, ShieldCheck, Pill, Activity, 
//   FileText, Calendar, User, Info, AlertOctagon, HeartPulse 
// } from "lucide-react";

// At the top of src/components/ConfirmModal.tsx
import React, { useState } from "react";
import { 
  X, Check, AlertTriangle, ShieldCheck, Pill, Activity, 
  FileText, Calendar, User, Info, AlertOctagon, HeartPulse, Sparkles 
} from "lucide-react"; 

interface ConfirmModalProps {
  isOpen: boolean;
  extractedData: any;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({ isOpen, extractedData, onClose, onConfirm }: ConfirmModalProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "tests" | "meds" | "warnings">("summary");

  if (!isOpen || !extractedData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[90vh] rounded-3xl bg-[#0A0E1A] border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white tracking-tight">Clinical Summary & Human-in-the-Loop Review</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold uppercase">
                  {extractedData.docType || "Medical Record"}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5 font-mono">
                Verify the AI-extracted clinical findings and summary before saving to your permanent health ledger.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.05] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/[0.06] bg-white/[0.01] px-6 text-xs font-mono">
          <button
            onClick={() => setActiveTab("summary")}
            className={`py-3 px-4 border-b-2 font-semibold transition cursor-pointer flex items-center space-x-2 ${
              activeTab === "summary" ? "border-cyan-400 text-cyan-300" : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Clinical Summary</span>
          </button>
          <button
            onClick={() => setActiveTab("tests")}
            className={`py-3 px-4 border-b-2 font-semibold transition cursor-pointer flex items-center space-x-2 ${
              activeTab === "tests" ? "border-cyan-400 text-cyan-300" : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Lab & Biomarker Findings ({extractedData.abnormalFindings?.length || 0} abnormal)</span>
          </button>
          <button
            onClick={() => setActiveTab("meds")}
            className={`py-3 px-4 border-b-2 font-semibold transition cursor-pointer flex items-center space-x-2 ${
              activeTab === "meds" ? "border-cyan-400 text-cyan-300" : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>Medication Plan ({extractedData.medications?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab("warnings")}
            className={`py-3 px-4 border-b-2 font-semibold transition cursor-pointer flex items-center space-x-2 ${
              activeTab === "warnings" ? "border-cyan-400 text-cyan-300" : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
            <span>Warnings & Next Steps</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          
          {/* Metadata Ribbon */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-neutral-300 font-mono text-[11px]">
            <div className="flex items-center space-x-2">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Date: <strong className="text-white">{extractedData.recordDate || "Today"}</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate">Physician: <strong className="text-white">{extractedData.doctorName || "Attending Doctor"}</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
              <span className="truncate">Diagnosis: <strong className="text-white">{extractedData.primaryDiagnosis || "Routine Checkup"}</strong></span>
            </div>
          </div>

          {/* TAB 1: SUMMARY */}
          {activeTab === "summary" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 space-y-2">
                <div className="flex items-center space-x-2 text-cyan-300 font-bold font-mono uppercase tracking-wider text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Plain-Language Patient Summary</span>
                </div>
                <p className="text-neutral-200 text-xs leading-relaxed font-sans">
                  {extractedData.plainSummary}
                </p>
              </div>

              {extractedData.technicalSummary && (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                  <div className="text-[10px] font-mono text-neutral-400 uppercase font-bold tracking-wider">
                    Technical Clinical Synthesis (Physician Handover)
                  </div>
                  <p className="text-neutral-300 text-xs leading-relaxed font-mono">
                    {extractedData.technicalSummary}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LAB TESTS & BIOMARKERS */}
          {activeTab === "tests" && (
            <div className="space-y-4">
              {/* Abnormal Findings with Biological Mechanism Explanations */}
              {extractedData.abnormalFindings && extractedData.abnormalFindings.length > 0 && (
                <div className="space-y-2.5">
                  <div className="text-amber-400 font-bold font-mono uppercase text-[11px] flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Abnormal & Out-of-Range Markers (Explained)</span>
                  </div>
                  <div className="space-y-2">
                    {extractedData.abnormalFindings.map((item: any, i: number) => (
                      <div key={i} className="p-3.5 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-neutral-100">{item.markerName}</span>
                          <div className="flex items-center space-x-2 font-mono">
                            <span className="text-amber-300 font-bold">{item.value}</span>
                            <span className="text-neutral-400 text-[10px]">(Normal: {item.referenceRange || "N/A"})</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {item.status}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-neutral-300 leading-relaxed font-sans bg-black/20 p-2 rounded-lg">
                          <strong className="text-amber-200">What this means:</strong> {item.biologicalMeaning}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Normal Test Results */}
              {extractedData.normalFindings && extractedData.normalFindings.length > 0 && (
                <div className="space-y-2">
                  <div className="text-emerald-400 font-bold font-mono uppercase text-[11px] flex items-center space-x-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>Normal Markers Verified</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {extractedData.normalFindings.map((item: any, i: number) => (
                      <div key={i} className="p-2.5 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/15 flex items-center justify-between text-xs">
                        <span className="text-neutral-200">{item.markerName}</span>
                        <span className="text-emerald-300 font-mono font-semibold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MEDICATION RECONCILIATION */}
          {activeTab === "meds" && (
            <div className="space-y-3">
              <div className="text-cyan-400 font-bold font-mono uppercase text-[11px] flex items-center space-x-1.5">
                <Pill className="w-3.5 h-3.5" />
                <span>Reconciled Medication Schedule</span>
              </div>
              {extractedData.medications && extractedData.medications.length > 0 ? (
                <div className="space-y-2">
                  {extractedData.medications.map((med: any, i: number) => (
                    <div key={i} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-sm">{med.name}</span>
                          <span className="text-cyan-300 font-mono text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                            {med.dosage}
                          </span>
                        </div>
                        <div className="text-neutral-300 text-xs font-sans">
                          Schedule: <strong>{med.frequency}</strong> &bull; Duration: {med.duration || "As advised"}
                        </div>
                        {med.indication && (
                          <div className="text-[11px] text-neutral-400 font-mono">
                            Treats: {med.indication}
                          </div>
                        )}
                      </div>
                      {med.actionType && (
                        <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          {med.actionType}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-neutral-500 font-mono border border-dashed border-white/10 rounded-2xl">
                  No active medicines listed in this document.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: WARNINGS & ACTION PLAN */}
          {activeTab === "warnings" && (
            <div className="space-y-4">
              {/* Red Flags */}
              {extractedData.redFlagWarnings && extractedData.redFlagWarnings.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-500/[0.08] border border-rose-500/25 space-y-2">
                  <div className="text-rose-400 font-bold font-mono uppercase text-[11px] flex items-center space-x-1.5">
                    <AlertOctagon className="w-4 h-4" />
                    <span>Emergency Warning Symptoms (Seek Immediate Care)</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-neutral-200">
                    {extractedData.redFlagWarnings.map((warning: string, i: number) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Questions for Doctor */}
              {extractedData.questionsForDoctor && extractedData.questionsForDoctor.length > 0 && (
                <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 space-y-2">
                  <div className="text-cyan-400 font-bold font-mono uppercase text-[11px] flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>High-Yield Questions to Ask Your Physician</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-neutral-300">
                    {extractedData.questionsForDoctor.map((q: string, i: number) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Lifestyle / Diet Guidance */}
              {extractedData.lifestyleAndDiet && extractedData.lifestyleAndDiet.length > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
                  <div className="text-emerald-400 font-bold font-mono uppercase text-[11px] flex items-center space-x-1.5">
                    <HeartPulse className="w-4 h-4" />
                    <span>Dietary & Activity Recommendations</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-neutral-300">
                    {extractedData.lifestyleAndDiet.map((rec: string, i: number) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-5 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[11px] text-neutral-400 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Human-in-the-Loop review ensures zero unverified hallucination.</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-neutral-950 font-bold text-xs flex items-center space-x-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Confirm & Commit to Ledger</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}