"use client";

import React from "react";
import { Sparkles, AlertCircle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  extractedData: any;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({ isOpen, extractedData, onClose, onConfirm }: ConfirmModalProps) {
  if (!isOpen || !extractedData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center space-x-2 text-blue-600">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-bold text-lg text-neutral-900">Confirm Extracted Records</h3>
        </div>
        <p className="text-xs text-neutral-500">
          Gemini analyzed your document. Please verify the parsed entities below before saving them to your active medical profile.
        </p>

        <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-2 text-sm">
          <p><strong>Document Type:</strong> <span className="capitalize">{extractedData.docType}</span></p>
          <p><strong>Identified Date:</strong> {extractedData.recordDate}</p>
          <p><strong>Summary:</strong> {extractedData.plainSummary}</p>
        </div>

        {extractedData.biomarkers?.length > 0 && (
          <div>
            <h4 className="font-bold text-xs uppercase text-neutral-500 mb-2">Detected Lab Markers</h4>
            <div className="space-y-1">
              {extractedData.biomarkers.map((b: any, i: number) => (
                <div key={i} className="flex justify-between p-2 bg-neutral-50 rounded border text-xs">
                  <span>{b.markerName}</span>
                  <span className="font-semibold">{b.value} {b.unit} ({b.status})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {extractedData.medications?.length > 0 && (
          <div>
            <h4 className="font-bold text-xs uppercase text-neutral-500 mb-2">Prescribed Medications</h4>
            <div className="space-y-1">
              {extractedData.medications.map((m: any, i: number) => (
                <div key={i} className="p-2 bg-neutral-50 rounded border text-xs">
                  <strong>{m.name}</strong> — {m.dosage} ({m.frequency})
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-2 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{extractedData.safetyDisclaimer}</p>
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm hover:bg-neutral-50">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm">
            Confirm & Add to Health Records
          </button>
        </div>
      </div>
    </div>
  );
}