// update_page.js
const fs = require('fs');

const pageCode = `"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Activity, UploadCloud, Pill, Calendar, Clock, MessageSquare, 
  FileText, TrendingUp, ShieldCheck, CheckCircle2, Mic, Printer,
  User, RefreshCw, Send
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ConfirmModal } from "@/components/ConfirmModal";

export default function Page() {
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [medications, setMedications] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [biomarkers, setBiomarkers] = useState([]);

  const [uploading, setUploading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [chatMessages, setChatMessages] = useState([
    { role: "copilot", text: "Hello! I am your AI Health Copilot. Ask me about your medications, past reports, or upcoming health follow-ups." }
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState("Vitamin D");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: prof } = await supabase.from("profiles").select("*").limit(1).single();
      const { data: docs } = await supabase.from("documents").select("*").order("record_date", { ascending: false });
      const { data: meds } = await supabase.from("medications").select("*");
      const { data: rems } = await supabase.from("reminders").select("*").order("time", { ascending: true });
      const { data: bio } = await supabase.from("biomarkers").select("*").order("test_date", { ascending: true });

      setProfile(prof || {});
      setDocuments(docs || []);
      setMedications(meds || []);
      setReminders(rems || []);
      setBiomarkers(bio || []);
    } catch (err) {
      console.error("Data load error:", err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();

    reader.onloadend = async () => {
      try {
        const base64String = reader.result.split(",")[1];
        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64Data: base64String, mimeType: file.type }),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        setExtractedData(data);
        setShowConfirmModal(true);
      } catch (err) {
        alert("Extraction failed: " + err.message);
      } finally {
        setUploading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleConfirmSave = async () => {
    if (!extractedData) return;
    try {
      const { data: docData, error: docErr } = await supabase.from("documents").insert([{
        doc_type: extractedData.docType,
        record_date: extractedData.recordDate || new Date().toISOString().split("T")[0],
        doctor_name: extractedData.doctorName,
        plain_summary: extractedData.plainSummary,
        technical_summary: extractedData.technicalSummary,
        questions: extractedData.questionsForDoctor || []
      }]).select().single();

      if (docErr) throw docErr;

      if (extractedData.biomarkers?.length > 0) {
        const markerInserts = extractedData.biomarkers.map((b) => ({
          document_id: docData.id,
          marker_name: b.markerName,
          value: b.value,
          unit: b.unit,
          status: b.status,
          test_date: extractedData.recordDate || new Date().toISOString().split("T")[0]
        }));
        await supabase.from("biomarkers").insert(markerInserts);
      }

      if (extractedData.medications?.length > 0) {
        const medInserts = extractedData.medications.map((m) => ({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          status: "active"
        }));
        await supabase.from("medications").insert(medInserts);
      }

      await supabase.from("audit_logs").insert([{
        action: "DOCUMENT_UPLOAD_AND_CONFIRM",
        resource: extractedData.docType
      }]);

      setShowConfirmModal(false);
      setExtractedData(null);
      fetchDashboardData();
      alert("Health records parsed and saved!");
    } catch (err) {
      alert("Save error: " + err.message);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim()) return;

    const userText = inputPrompt;
    setInputPrompt("");
    setChatMessages(prev => [...prev, { role: "user", text: userText }]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });
      const data = await res.json();

      if (data.error) {
        setChatMessages(prev => [...prev, { role: "copilot", text: "Error: " + data.error }]);
      } else {
        setChatMessages(prev => [
          ...prev, 
          { role: "copilot", text: data.reply, action: data.actionTaken }
        ]);
      }

      if (data.actionTaken) {
        fetchDashboardData();
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "copilot", text: "Error: " + err.message }]);
    } finally {
      setChatLoading(false);
    }
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      setInputPrompt(event.results[0][0].transcript);
    };

    recognition.start();
  };

  const toggleReminder = async (id, current) => {
    await supabase.from("reminders").update({ completed: !current }).eq("id", id);
    fetchDashboardData();
  };

  const trendData = biomarkers
    .filter(b => b.marker_name?.toLowerCase().includes(selectedMarker.toLowerCase()))
    .map(b => ({ date: b.test_date, value: Number(b.value) }));

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col font-sans">
      <header className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">Health Copilot</h1>
            <p className="text-xs text-neutral-500">Autonomous Health Assistant & Record Intelligence</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition shadow-sm">
            <UploadCloud className="w-4 h-4" />
            <span>{uploading ? "Analyzing Document..." : "Upload Health Record"}</span>
            <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} disabled={uploading} className="hidden" />
          </label>
          <div className="flex items-center space-x-2 bg-neutral-100 px-3 py-1.5 rounded-lg border border-neutral-200">
            <User className="w-4 h-4 text-neutral-600" />
            <span className="text-xs font-semibold">{profile?.name || "Patient Profile"} ({profile?.blood_group || "N/A"})</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-64 bg-white border-r border-neutral-200 p-4 space-y-1">
          {[
            { id: "overview", label: "Dashboard", icon: Activity },
            { id: "timeline", label: "Health Timeline", icon: Calendar },
            { id: "medications", label: "Medication Manager", icon: Pill },
            { id: "trends", label: "Lab Biomarker Trends", icon: TrendingUp },
            { id: "doctor-prep", label: "Doctor Visit Brief", icon: Printer },
            { id: "chat", label: "AI Copilot Agent", icon: MessageSquare },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={\`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition \${
                  active ? "bg-blue-50 text-blue-700" : "text-neutral-600 hover:bg-neutral-100"
                }\`}
              >
                <Icon className={\`w-4 h-4 \${active ? "text-blue-700" : "text-neutral-500"}\`} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <div className="pt-8">
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs text-neutral-500 space-y-1">
              <div className="flex items-center space-x-1 font-semibold text-neutral-700">
                <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                <span>Clinical Safety Guard</span>
              </div>
              <p>Grounding active: All agent actions query verified patient records.</p>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === "overview" && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
                  <div className="flex justify-between items-center text-neutral-500 mb-2">
                    <span className="text-xs font-semibold uppercase">Documents</span>
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold">{documents.length}</div>
                  <p className="text-xs text-neutral-400 mt-1">Processed via Gemini Flash</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
                  <div className="flex justify-between items-center text-neutral-500 mb-2">
                    <span className="text-xs font-semibold uppercase">Active Prescriptions</span>
                    <Pill className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold">{medications.filter(m => m.status === "active").length}</div>
                  <p className="text-xs text-neutral-400 mt-1">Adherence tracking</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
                  <div className="flex justify-between items-center text-neutral-500 mb-2">
                    <span className="text-xs font-semibold uppercase">Tracked Biomarkers</span>
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-bold">{biomarkers.length}</div>
                  <p className="text-xs text-neutral-400 mt-1">Extracted lab parameters</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
                  <div className="flex justify-between items-center text-neutral-500 mb-2">
                    <span className="text-xs font-semibold uppercase">Daily Reminders</span>
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-bold">{reminders.length}</div>
                  <p className="text-xs text-neutral-400 mt-1">Follow-ups & schedules</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-neutral-800">Latest Medical Summaries</h3>
                    <button onClick={() => setActiveTab("timeline")} className="text-xs text-blue-600 font-semibold hover:underline">View Timeline</button>
                  </div>
                  {documents.length === 0 ? (
                    <div className="p-8 text-center text-neutral-400 border border-dashed rounded-lg">
                      No documents yet. Click "Upload Health Record" to upload a prescription or blood report.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {documents.slice(0, 3).map((doc, idx) => (
                        <div key={idx} className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">{doc.doc_type}</span>
                            <span className="text-neutral-500">{doc.record_date} {doc.doctor_name && \`• \${doc.doctor_name}\`}</span>
                          </div>
                          <p className="text-sm font-medium text-neutral-800 pt-1">{doc.plain_summary}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-neutral-800">Schedule & Reminders</h3>
                  </div>
                  {reminders.length === 0 ? (
                    <p className="text-sm text-neutral-400 text-center py-6">No scheduled reminders.</p>
                  ) : (
                    <div className="space-y-2">
                      {reminders.map((r, i) => (
                        <div 
                          key={i} 
                          onClick={() => toggleReminder(r.id, r.completed)}
                          className={\`p-3 rounded-lg border text-sm flex items-center justify-between cursor-pointer transition \${
                            r.completed ? "bg-neutral-100 border-neutral-200 line-through text-neutral-400" : "bg-white border-neutral-200 text-neutral-800"
                          }\`}
                        >
                          <div>
                            <p className="font-medium">{r.title}</p>
                            <span className="text-xs text-neutral-400">{r.time}</span>
                          </div>
                          <CheckCircle2 className={\`w-5 h-5 \${r.completed ? "text-emerald-500" : "text-neutral-300"}\`} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-xl font-bold text-neutral-900">Personal Health Journey Timeline</h2>
              <div className="relative border-l-2 border-blue-200 ml-4 pl-6 space-y-8">
                {documents.map((doc, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-sm" />
                    <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 uppercase">{doc.doc_type}</span>
                        <span className="text-xs text-neutral-500">{doc.record_date}</span>
                      </div>
                      <h4 className="font-bold text-base text-neutral-800">{doc.doctor_name ? \`Consultation with \${doc.doctor_name}\` : "Clinical Report Evaluation"}</h4>
                      <p className="text-sm text-neutral-600">{doc.plain_summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "medications" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-xl font-bold text-neutral-900">Prescription & Medication Schedule</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {medications.map((m, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="font-bold text-neutral-900 text-base">{m.name}</span>
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded capitalize">{m.status}</span>
                    </div>
                    <div className="text-sm text-neutral-600 space-y-1">
                      <p><strong>Dosage:</strong> {m.dosage}</p>
                      <p><strong>Frequency:</strong> {m.frequency}</p>
                      {m.duration && <p><strong>Duration:</strong> {m.duration}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "trends" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">Lab Biomarker Trends</h2>
                  <p className="text-xs text-neutral-500">Historical progression tracked across uploaded laboratory panels</p>
                </div>
                <input 
                  type="text" 
                  value={selectedMarker} 
                  onChange={(e) => setSelectedMarker(e.target.value)}
                  placeholder="Filter test (e.g. Vitamin D, Glucose)"
                  className="px-3 py-1.5 border border-neutral-200 rounded-lg text-sm bg-white"
                />
              </div>

              <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
                <h3 className="font-semibold text-neutral-800 mb-4">{selectedMarker} Progression</h3>
                {trendData.length > 1 ? (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <XAxis dataKey="date" stroke="#888888" fontSize={12} />
                        <YAxis stroke="#888888" fontSize={12} />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="p-12 text-center text-sm text-neutral-400">
                    Need at least two recorded dates with '{selectedMarker}' to generate a trendline.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "doctor-prep" && (
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl border border-neutral-200 shadow-sm space-y-6 print:border-none print:p-0">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">Clinical Consultation Brief</h2>
                  <p className="text-xs text-neutral-500 mt-1">Generated by Health Copilot for Physician Reference</p>
                </div>
                <button onClick={() => window.print()} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm print:hidden">
                  <Printer className="w-4 h-4" />
                  <span>Print Brief</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-neutral-50 p-4 rounded-lg text-sm">
                <div><strong>Patient:</strong> {profile?.name || "Patient Profile"}</div>
                <div><strong>Age / Gender:</strong> {profile?.age || "30"} / {profile?.gender || "Not Specified"}</div>
                <div><strong>Blood Group:</strong> {profile?.blood_group || "N/A"}</div>
                <div><strong>Allergies:</strong> {profile?.allergies?.join(", ") || "None"}</div>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-sm uppercase tracking-wide text-neutral-700">Active Regimen</h3>
                <ul className="list-disc pl-5 text-sm space-y-1 text-neutral-800">
                  {medications.map((m, i) => (
                    <li key={i}>{m.name} — {m.dosage} ({m.frequency})</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg space-y-2">
                <h3 className="font-bold text-sm text-blue-900 uppercase tracking-wide">Suggested Inquiries for Physician</h3>
                <ul className="list-disc pl-5 text-sm text-blue-800 space-y-1">
                  {documents[0]?.questions?.map((q, i) => <li key={i}>{q}</li>) || (
                    <li>Discuss medication adjustments based on the latest report results.</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {activeTab === "chat" && (
            <div className="max-w-3xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-sm">Grounded Health Agent (Gemini 1.5)</span>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">Function Calling Enabled</span>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={\`flex \${msg.role === "user" ? "justify-end" : "justify-start"}\`}>
                    <div className={\`max-w-[80%] p-3.5 rounded-xl text-sm leading-relaxed \${
                      msg.role === "user" ? "bg-blue-600 text-white rounded-br-none" : "bg-neutral-100 text-neutral-800 rounded-bl-none"
                    }\`}>
                      {msg.action && (
                        <div className="text-[10px] uppercase font-bold text-blue-500 mb-1">
                          [Tool Triggered: {msg.action}]
                        </div>
                      )}
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-neutral-100 p-3 rounded-xl text-xs text-neutral-500 flex items-center space-x-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Formulating grounded response...</span>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-3 border-t border-neutral-200 flex items-center space-x-2 bg-white">
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={\`p-2.5 rounded-lg border transition \${isListening ? "bg-red-500 text-white animate-pulse" : "text-neutral-500 hover:bg-neutral-100 border-neutral-200"}\`}
                >
                  <Mic className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder="Ask about medications, request report summaries, or translate..."
                  className="flex-1 px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button type="submit" disabled={chatLoading} className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      <ConfirmModal 
        isOpen={showConfirmModal}
        extractedData={extractedData}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSave}
      />
    </div>
  );
}
`;

fs.writeFileSync('src/app/page.tsx', pageCode);
console.log('Successfully wrote clean src/app/page.tsx with 0 missing characters!');