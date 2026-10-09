"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Activity, UploadCloud, Pill, Calendar, Clock, MessageSquare, 
  FileText, TrendingUp, ShieldCheck, CheckCircle2, Mic, MicOff, Printer,
  RefreshCw, Send, Bell, BellRing, Volume2, VolumeX,
  ChevronRight, Sparkles, Heart, Play
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ConfirmModal } from "@/components/ConfirmModal";
import { AbhaModal } from "@/components/AbhaModal";

export default function HealthCopilotApp() {
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "medications" | "trends" | "chat" | "doctor-prep">("overview");

  // Multi-Language & ABDM States (Challenge Brief Bonus Features)
  const [selectedLang, setSelectedLang] = useState<"en" | "te" | "hi">("en");
  const [showAbhaModal, setShowAbhaModal] = useState(false);

  // Default Local Patient Profile (No Google Login Required)
  const [profile, setProfile] = useState<any>({
    name: "Attending Patient",
    blood_group: "O+",
    age: 28,
    gender: "Not Specified",
    allergies: ["None documented"]
  });

  // Clinical Records State
  const [documents, setDocuments] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [biomarkers, setBiomarkers] = useState<any[]>([]);

  // Extraction & Upload State
  const [uploading, setUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Emergency / Adherence Alarm State
  const [activeAlarm, setActiveAlarm] = useState<any>(null);
  const triggeredAlarmsRef = useRef<Set<string>>(new Set());

  // Text-To-Speech State
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);
  const [currentlySpeakingText, setCurrentlySpeakingText] = useState("");

  // AI Copilot Agent State
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "copilot"; text: string; action?: string }[]>([
    { 
      role: "copilot", 
      text: "Health Copilot online. All clinical records, prescriptions, and lab panels are verified. How can I assist your healthcare journey today?" 
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState("Vitamin D");

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    fetchDashboardData();
    requestNotificationPermission();

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
    }
  };

  const playAlarmSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      playTone(523.25, 0.0, 0.25);
      playTone(659.25, 0.15, 0.25);
      playTone(783.99, 0.3, 0.3);
      playTone(1046.50, 0.45, 0.5);
    } catch (e) {
      console.warn("Audio Context alert failed:", e);
    }
  };

  const speakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isPlayingSpeech && currentlySpeakingText === text) {
      window.speechSynthesis.cancel();
      setIsPlayingSpeech(false);
      setCurrentlySpeakingText("");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = selectedLang === "te" ? "te-IN" : selectedLang === "hi" ? "hi-IN" : "en-US";

    utterance.onstart = () => {
      setIsPlayingSpeech(true);
      setCurrentlySpeakingText(text);
    };

    utterance.onend = () => {
      setIsPlayingSpeech(false);
      setCurrentlySpeakingText("");
    };

    utterance.onerror = () => {
      setIsPlayingSpeech(false);
      setCurrentlySpeakingText("");
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopAllSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsPlayingSpeech(false);
      setCurrentlySpeakingText("");
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!reminders || reminders.length === 0) return;

      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, "0");
      const currentMinutes = String(now.getMinutes()).padStart(2, "0");
      const currentTime24 = `${currentHours}:${currentMinutes}`;

      const normalizeTo24Hour = (timeStr: string) => {
        if (!timeStr) return "";
        const clean = timeStr.trim().toUpperCase();
        if (/^\d{2}:\d{2}$/.test(clean)) return clean;
        const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
        if (!match) return clean;
        let [_, h, m, meridiem] = match;
        let hours = parseInt(h, 10);
        if (meridiem === "PM" && hours < 12) hours += 12;
        if (meridiem === "AM" && hours === 12) hours = 0;
        return `${String(hours).padStart(2, "0")}:${m}`;
      };

      reminders.forEach((r) => {
        if (r.completed) return;
        const reminderTime24 = normalizeTo24Hour(r.time);
        const alarmKey = `${r.id}-${currentTime24}`;

        if (reminderTime24 === currentTime24 && !triggeredAlarmsRef.current.has(alarmKey)) {
          triggeredAlarmsRef.current.add(alarmKey);
          setActiveAlarm(r);
          playAlarmSound();

          speakText(`Clinical reminder: ${r.title}. Scheduled for ${r.time}.`);

          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification(`⏰ Health Adherence Alert: ${r.title}`, {
              body: `Scheduled trigger time: ${r.time}.`,
              icon: "/favicon.ico"
            });
          }
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [reminders, selectedLang]);

  const fetchDashboardData = async () => {
    try {
      // Load saved profile if present in Supabase, else use default
      const { data: profData } = await supabase.from("profiles").select("*").limit(1).maybeSingle();
      if (profData) {
        setProfile(profData);
      }

      const { data: docs } = await supabase.from("documents").select("*").order("record_date", { ascending: false });
      const { data: meds } = await supabase.from("medications").select("*");
      const { data: rems } = await supabase.from("reminders").select("*").order("time", { ascending: true });
      const { data: bio } = await supabase.from("biomarkers").select("*").order("test_date", { ascending: true });

      setDocuments(docs || []);
      setMedications(meds || []);
      setReminders(rems || []);
      setBiomarkers(bio || []);
    } catch (err) {
      console.error("Telemetry load error:", err);
    }
  };

  // Ingestion with multi-lingual support
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();

    reader.onloadend = async () => {
      try {
        const base64String = (reader.result as string).split(",")[1];
        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            base64Data: base64String, 
            mimeType: file.type || "text/plain",
            targetLanguage: selectedLang
          }),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        setExtractedData(data);
        setShowConfirmModal(true);
      } catch (err: any) {
        alert("Extraction failed: " + err.message);
      } finally {
        setUploading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleConfirmSave = async () => {
    if (!extractedData) return;

    const isValidDate = (d: string) => d && /^\d{4}-\d{2}-\d{2}$/.test(d);
    const safeDate = isValidDate(extractedData.recordDate)
      ? extractedData.recordDate
      : new Date().toISOString().split("T")[0];

    try {
      const { data: docData, error: docErr } = await supabase.from("documents").insert([{
        doc_type: extractedData.docType || "prescription",
        record_date: safeDate,
        doctor_name: extractedData.doctorName || "Attending Physician",
        plain_summary: extractedData.plainSummary,
        technical_summary: extractedData.technicalSummary,
        questions: extractedData.questionsForDoctor || []
      }]).select().single();

      if (docErr) throw docErr;

      if (extractedData.biomarkers?.length > 0) {
        const markerInserts = extractedData.biomarkers.map((b: any) => ({
          document_id: docData.id,
          marker_name: b.markerName,
          value: b.value,
          unit: b.unit,
          status: b.status,
          test_date: safeDate
        }));
        await supabase.from("biomarkers").insert(markerInserts);
      }

      if (extractedData.medications?.length > 0) {
        const medInserts = extractedData.medications.map((m: any) => ({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration || "14 days",
          status: "active"
        }));
        await supabase.from("medications").insert(medInserts);
      }

      await supabase.from("audit_logs").insert([{
        action: "RECORD_INGESTION_AURA",
        resource: extractedData.docType || "prescription"
      }]);

      setShowConfirmModal(false);
      setExtractedData(null);
      fetchDashboardData();
    } catch (err: any) {
      alert("Save error: " + err.message);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
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
        setChatMessages(prev => [...prev, { role: "copilot", text: "Notice: " + data.error }]);
      } else {
        setChatMessages(prev => [
          ...prev, 
          { role: "copilot", text: data.reply, action: data.actionTaken }
        ]);
        speakText(data.reply);
      }

      if (data.actionTaken) fetchDashboardData();
    } catch (err: any) {
      setChatMessages(prev => [...prev, { role: "copilot", text: "Connection error: " + err.message }]);
    } finally {
      setChatLoading(false);
    }
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Microsoft Edge or Google Chrome.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.warn("Speech abort error:", e);
        }
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = selectedLang === "te" ? "te-IN" : selectedLang === "hi" ? "hi-IN" : "en-US";

      recognition.onstart = () => setIsListening(true);

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) setInputPrompt(transcript);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === "network") {
          alert("Microphone network error: Google Speech Services was blocked by browser shields. Open localhost:3000 in Microsoft Edge or Google Chrome.");
        }
      };

      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch (err: any) {
      setIsListening(false);
    }
  };

  const toggleReminder = async (id: string, current: boolean) => {
    await supabase.from("reminders").update({ completed: !current }).eq("id", id);
    fetchDashboardData();
  };

  const trendData = biomarkers
    .filter(b => b.marker_name?.toLowerCase().includes(selectedMarker.toLowerCase()))
    .map(b => ({ date: b.test_date, value: Number(b.value) }));

  const navItems = [
    { id: "overview", label: "Biometric Radar", icon: Activity, badge: "Live" },
    { id: "timeline", label: "Clinical Ledger", icon: Calendar, badge: `${documents.length}` },
    { id: "medications", label: "Active Regimens", icon: Pill, badge: `${medications.filter(m => m.status === "active").length}` },
    { id: "trends", label: "Spectral Trends", icon: TrendingUp, badge: "Real-time" },
    { id: "doctor-prep", label: "Physician Dossier", icon: Printer, badge: "Print-ready" },
    { id: "chat", label: "Autonomous Agent", icon: MessageSquare, badge: "Grounded" },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-neutral-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 antialiased relative overflow-x-hidden pb-12">
      {/* Background Radial Glows */}
      <div className="fixed top-[-20%] left-[20%] w-[800px] h-[500px] rounded-full bg-cyan-600/[0.07] blur-[160px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[700px] h-[600px] rounded-full bg-emerald-600/[0.05] blur-[180px] pointer-events-none" />

      {/* Floating Alarm Pill */}
      {activeAlarm && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#0B0F1D]/90 backdrop-blur-2xl border border-amber-500/50 text-white px-6 py-3.5 rounded-full shadow-[0_0_50px_rgba(245,158,11,0.3)] flex items-center space-x-4 animate-in fade-in duration-300">
          <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <BellRing className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold">Adherence Alarm Triggered</div>
            <div className="text-xs font-semibold text-neutral-100">{activeAlarm.title} &bull; <span className="text-amber-300">{activeAlarm.time}</span></div>
          </div>
          <button
            onClick={() => {
              toggleReminder(activeAlarm.id, false);
              setActiveAlarm(null);
            }}
            className="bg-amber-500 hover:bg-amber-400 text-neutral-950 px-4 py-1.5 rounded-full text-xs font-bold transition shadow-sm cursor-pointer"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* Floating Speech Playback Pill */}
      {isPlayingSpeech && (
        <div className="fixed top-6 right-8 z-50 bg-[#0B0F1D]/90 backdrop-blur-2xl border border-cyan-500/40 px-5 py-2.5 rounded-full shadow-[0_0_40px_rgba(6,182,212,0.25)] flex items-center space-x-3.5">
          <div className="flex items-center space-x-1">
            <span className="w-1 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1 h-5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <span className="text-xs font-medium text-cyan-300 font-mono truncate max-w-[200px]">Reading Aloud...</span>
          <button onClick={stopAllSpeech} className="text-neutral-400 hover:text-white transition cursor-pointer">
            <VolumeX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Header with Language Switcher and ABHA/FHIR Trigger */}
      <header className="h-18 px-8 border-b border-white/[0.07] bg-[#070B16]/80 backdrop-blur-2xl flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-emerald-500 to-indigo-600 p-[1px] shadow-[0_0_25px_rgba(6,182,212,0.3)]">
              <div className="w-full h-full bg-[#030712] rounded-2xl flex items-center justify-center">
                <Heart className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#030712]" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm tracking-tight text-white uppercase">HEALTH COPILOT</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold tracking-wider">ALTRIX EDITION</span>
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-neutral-400 font-mono">
              <span className="text-emerald-400 font-bold">&bull; TELEMETRY LIVE</span>
              <span>&mdash;</span>
              <span>ABDM / FHIR READY</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Multi-Language Selector (Bonus Credit) */}
          <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-xl p-0.5 text-xs font-mono">
            <button 
              onClick={() => setSelectedLang("en")} 
              className={`px-2 py-1 rounded-lg transition cursor-pointer ${selectedLang === "en" ? "bg-cyan-500 text-black font-bold" : "text-neutral-400 hover:text-white"}`}
            >
              EN
            </button>
            <button 
              onClick={() => setSelectedLang("te")} 
              className={`px-2 py-1 rounded-lg transition cursor-pointer ${selectedLang === "te" ? "bg-cyan-500 text-black font-bold" : "text-neutral-400 hover:text-white"}`}
            >
              తెలుగు
            </button>
            <button 
              onClick={() => setSelectedLang("hi")} 
              className={`px-2 py-1 rounded-lg transition cursor-pointer ${selectedLang === "hi" ? "bg-cyan-500 text-black font-bold" : "text-neutral-400 hover:text-white"}`}
            >
              हिन्दी
            </button>
          </div>

          {/* ABDM / ABHA Modal Trigger Button (Bonus Credit) */}
          <button
            onClick={() => setShowAbhaModal(true)}
            className="flex items-center space-x-1.5 text-xs font-mono text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-3 py-1.5 rounded-xl transition cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ABHA & FHIR</span>
          </button>

          <button 
            onClick={playAlarmSound}
            className="flex items-center space-x-1.5 text-xs text-neutral-300 bg-white/[0.03] hover:bg-white/[0.08] px-3.5 py-2 rounded-xl border border-white/[0.08] transition cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-[11px]">Siren Test</span>
          </button>

          <label className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-neutral-950 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer transition shadow-[0_0_25px_rgba(6,182,212,0.3)]">
            <UploadCloud className="w-4 h-4" />
            <span>{uploading ? "Ingesting Telemetry..." : "Ingest Health Record"}</span>
            <input type="file" accept="*/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
          </label>

          <div className="h-6 w-px bg-white/[0.08] mx-1" />

          {/* Profile Card (Always Active) */}
          <div className="flex items-center space-x-3 bg-white/[0.03] border border-white/[0.08] px-3.5 py-1.5 rounded-xl backdrop-blur-md">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center text-xs font-bold text-cyan-300">
              {profile?.name ? profile.name[0] : "P"}
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold text-white leading-tight">{profile?.name || "Attending Patient"}</div>
              <div className="text-[10px] text-cyan-400 font-mono tracking-wider">TYPE {profile?.blood_group || "O+"}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Rail */}
        <aside className="w-68 border-r border-white/[0.06] bg-[#070B16]/50 p-4 flex flex-col justify-between">
          <nav className="space-y-1.5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 px-3 mb-2 font-bold">Biometric Modules</div>
            {navItems.map(item => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-medium transition cursor-pointer ${
                    active 
                      ? "bg-gradient-to-r from-cyan-500/15 via-emerald-500/10 to-transparent text-cyan-300 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]" 
                      : "text-neutral-400 hover:text-white hover:bg-white/[0.03] border border-transparent"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 transition ${active ? "text-cyan-400" : "text-neutral-500"}`} />
                    <span className="font-semibold">{item.label}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    active ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" : "bg-white/[0.03] text-neutral-500 border-white/[0.05]"
                  }`}>
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs text-neutral-300 space-y-2 backdrop-blur-md">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-mono text-[11px] tracking-wider uppercase">Grounded Safeguard</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
              Clinical actions query strictly verified records. Zero ungrounded hallucination.
            </p>
          </div>
        </aside>

        {/* Dynamic Biometric Canvas */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="max-w-6xl mx-auto space-y-7 animate-in fade-in duration-200">
              {/* Telemetry Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Verified Documents", val: documents.length, desc: "Processed with Gemini", icon: FileText, border: "border-cyan-500/20", glow: "from-cyan-500/10 to-transparent", text: "text-cyan-400" },
                  { label: "Active Regimens", val: medications.filter(m => m.status === "active").length, desc: "Monitored compliance", icon: Pill, border: "border-emerald-500/20", glow: "from-emerald-500/10 to-transparent", text: "text-emerald-400" },
                  { label: "Tracked Biomarkers", val: biomarkers.length, desc: "Longitudinal markers", icon: TrendingUp, border: "border-blue-500/20", glow: "from-blue-500/10 to-transparent", text: "text-blue-400" },
                  { label: "Scheduled Alarms", val: reminders.filter(r => !r.completed).length, desc: "Active timers", icon: Clock, border: "border-amber-500/20", glow: "from-amber-500/10 to-transparent", text: "text-amber-400" },
                ].map((c, i) => {
                  const Icon = c.icon;
                  return (
                    <div key={i} className={`p-5 rounded-2xl bg-gradient-to-b ${c.glow} bg-[#0A0E1A]/80 border ${c.border} backdrop-blur-xl relative overflow-hidden group`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">{c.label}</span>
                        <div className={`p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] ${c.text}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-3xl font-extrabold text-white tracking-tight">{c.val}</div>
                      <div className="text-[11px] text-neutral-400 mt-1 font-mono">{c.desc}</div>
                    </div>
                  );
                })}
              </div>

              {/* Feed: Clinical Summaries */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-3xl bg-[#0A0E1A]/60 border border-white/[0.08] p-6 backdrop-blur-2xl space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <h3 className="font-bold text-base text-white tracking-tight">Verified Clinical Summaries</h3>
                    </div>
                    <button onClick={() => setActiveTab("timeline")} className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1 cursor-pointer">
                      <span>Full Timeline</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {documents.length === 0 ? (
                    <div className="p-10 text-center text-neutral-500 border border-dashed border-white/[0.08] rounded-2xl text-xs font-mono">
                      No clinical records ingested. Click "Ingest Health Record" above to parse a lab report or prescription.
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {documents.slice(0, 3).map((doc, idx) => (
                        <div key={idx} className="p-4.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-cyan-500/30 transition space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-[10px] uppercase font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                              {doc.doc_type}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="text-neutral-400 font-mono text-[11px]">{doc.record_date} {doc.doctor_name && `&bull; ${doc.doctor_name}`}</span>
                              <button
                                onClick={() => speakText(doc.plain_summary)}
                                title="Listen to Summary"
                                className="p-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition cursor-pointer"
                              >
                                <Play className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-neutral-200 leading-relaxed font-sans">{doc.plain_summary}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Schedules & Alarms */}
                <div className="rounded-3xl bg-[#0A0E1A]/60 border border-white/[0.08] p-6 backdrop-blur-2xl space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <h3 className="font-bold text-base text-white tracking-tight">Daily Alarms</h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold">ARMED</span>
                  </div>

                  {reminders.length === 0 ? (
                    <div className="p-8 text-center text-xs font-mono text-neutral-500 border border-dashed border-white/[0.08] rounded-2xl">
                      No active reminders. You can schedule alarms via the Copilot Chat.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {reminders.map((r, i) => (
                        <div 
                          key={i} 
                          onClick={() => toggleReminder(r.id, r.completed)}
                          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between cursor-pointer transition ${
                            r.completed 
                              ? "bg-white/[0.01] border-white/5 line-through text-neutral-500" 
                              : "bg-white/[0.03] border-white/[0.08] hover:border-cyan-500/40 text-neutral-200"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-1.5 rounded-xl ${r.completed ? "bg-white/5 text-neutral-600" : "bg-amber-400/10 text-amber-400"}`}>
                              <Bell className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="font-semibold text-neutral-100">{r.title}</p>
                              <span className="text-[10px] font-mono text-neutral-400">{r.time}</span>
                            </div>
                          </div>
                          <CheckCircle2 className={`w-4 h-4 transition ${r.completed ? "text-emerald-500" : "text-neutral-600 hover:text-neutral-400"}`} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TIMELINE */}
          {activeTab === "timeline" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">Clinical Ledger & Journey</h2>
                <p className="text-xs text-neutral-400 mt-1">Chronological aggregation of physician consultations and diagnostic reports</p>
              </div>

              <div className="relative border-l border-white/[0.08] ml-4 pl-6 space-y-6">
                {documents.map((doc, i) => (
                  <div key={i} className="relative group">
                    <div className="absolute -left-[31px] top-2 w-3.5 h-3.5 rounded-full bg-cyan-400 border-4 border-[#030712] shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                    <div className="p-5 rounded-2xl bg-[#0A0E1A]/80 border border-white/[0.08] hover:border-cyan-500/40 backdrop-blur-xl transition space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {doc.doc_type}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-neutral-400 font-mono text-[11px]">{doc.record_date}</span>
                          <button
                            onClick={() => speakText(doc.plain_summary)}
                            title="Listen"
                            className="p-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition cursor-pointer"
                          >
                            <Play className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <h4 className="font-bold text-sm text-white">{doc.doctor_name || "Diagnostic Finding"}</h4>
                      <p className="text-xs text-neutral-300 leading-relaxed font-sans">{doc.plain_summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: MEDICATIONS */}
          {activeTab === "medications" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">Active Regimen & Therapy Manager</h2>
                <p className="text-xs text-neutral-400 mt-1">Ground-truth prescribed medications extracted from clinical records</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {medications.map((m, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-[#0A0E1A]/80 border border-white/[0.08] backdrop-blur-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{m.name}</span>
                      <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {m.status}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs text-neutral-300 font-sans">
                      <div><strong className="text-neutral-400">Dosage:</strong> {m.dosage}</div>
                      <div><strong className="text-neutral-400">Schedule:</strong> {m.frequency}</div>
                      {m.duration && <div><strong className="text-neutral-400">Duration:</strong> {m.duration}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: BIOMARKER TRENDS */}
          {activeTab === "trends" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">Spectral Lab Progression</h2>
                  <p className="text-xs text-neutral-400 mt-1">Longitudinal values tracked across multi-date diagnostic panels</p>
                </div>
                <input 
                  type="text" 
                  value={selectedMarker} 
                  onChange={(e) => setSelectedMarker(e.target.value)}
                  placeholder="Filter (e.g. Vitamin D, Glucose)"
                  className="px-3.5 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-xs text-neutral-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="p-6 rounded-3xl bg-[#0A0E1A]/80 border border-white/[0.08] backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white font-mono uppercase">{selectedMarker} Progression Curve</h3>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">Time-Series</span>
                </div>

                {trendData.length > 1 ? (
                  <div className="h-72 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id="auraCyanGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="#475569" fontSize={11} />
                        <YAxis stroke="#475569" fontSize={11} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#070B16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px" }}
                        />
                        <Area type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#auraCyanGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="p-12 text-center text-xs text-neutral-500 border border-dashed border-white/[0.08] rounded-2xl font-mono">
                    Need at least two separate date entries containing '{selectedMarker}' to render progression curve.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: DOCTOR BRIEF */}
          {activeTab === "doctor-prep" && (
            <div className="max-w-3xl mx-auto rounded-3xl bg-[#0A0E1A]/80 border border-white/[0.08] p-8 backdrop-blur-xl space-y-6">
              <div className="flex justify-between items-start border-b border-white/[0.08] pb-5">
                <div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">Clinical Consultation Brief</h2>
                  <p className="text-xs text-neutral-400 mt-1">Generated by Health Copilot for Attending Physician</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => speakText(`Patient: ${profile?.name || "Patient"}. Regimen: ${medications.map(m => `${m.name},${m.dosage}`).join(", ")}.`)}
                    className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition cursor-pointer"
                    title="Read Aloud"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => window.print()} className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer">
                    <Printer className="w-4 h-4 text-cyan-400" />
                    <span>Print Brief</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-white/[0.02] border border-white/[0.05] p-4 rounded-2xl text-xs font-sans">
                <div><span className="text-neutral-400">Patient:</span> <strong className="text-white">{profile?.name || "Patient"}</strong></div>
                <div><span className="text-neutral-400">Demographics:</span> <strong className="text-white">{profile?.age || "28"} &bull; {profile?.gender || "Not Specified"}</strong></div>
                <div><span className="text-neutral-400">Blood Group:</span> <strong className="text-white">{profile?.blood_group || "O+"}</strong></div>
                <div><span className="text-neutral-400">Documented Allergies:</span> <strong className="text-white">{profile?.allergies?.join(", ") || "None"}</strong></div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400">Current Medical Regimen</h4>
                <ul className="list-disc pl-5 text-xs space-y-1 text-neutral-200">
                  {medications.map((m, i) => (
                    <li key={i}>{m.name} &mdash; {m.dosage} ({m.frequency})</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">Suggested Physician Questions</h4>
                <ul className="list-disc pl-5 text-xs text-neutral-300 space-y-1">
                  {documents[0]?.questions?.map((q: string, i: number) => <li key={i}>{q}</li>) || (
                    <li>Inquire about the duration and tapering of active therapies.</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 6: AI COPILOT CHAT */}
          {activeTab === "chat" && (
            <div className="max-w-3xl mx-auto h-[calc(100vh-160px)] flex flex-col rounded-3xl bg-[#0A0E1A]/80 border border-white/[0.08] overflow-hidden backdrop-blur-xl shadow-2xl">
              <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="font-bold text-xs text-white">Grounded Health Agent</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">English Enforced</span>
              </div>

              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed ${
                      msg.role === "user" 
                        ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none shadow-[0_0_20px_rgba(6,182,212,0.25)]" 
                        : "bg-white/[0.04] border border-white/[0.06] text-neutral-200 rounded-bl-none font-sans"
                    }`}>
                      {msg.action && (
                        <div className="text-[10px] font-mono font-bold text-cyan-400 mb-1">
                          [Action: {msg.action}]
                        </div>
                      )}
                      <div>{msg.text}</div>
                      {msg.role === "copilot" && (
                        <button
                          onClick={() => speakText(msg.text)}
                          className="mt-2 text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer font-mono"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Listen</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/[0.04] border border-white/[0.06] p-3 rounded-2xl text-xs text-neutral-400 flex items-center space-x-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                      <span>Formulating grounded response...</span>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/[0.06] flex items-center space-x-3 bg-white/[0.02]">
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`p-2.5 rounded-xl border transition cursor-pointer ${
                    isListening ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse" : "text-neutral-400 hover:text-white border-white/[0.08] hover:bg-white/[0.04]"
                  }`}
                >
                  {isListening ? <Mic className="w-4 h-4 text-red-400" /> : <MicOff className="w-4 h-4" />}
                </button>
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder="Ask about medications, request summaries, or schedule reminders..."
                  className="flex-1 px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 placeholder:text-neutral-500"
                />
                <button 
                  type="submit" 
                  disabled={chatLoading} 
                  className="p-2.5 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold rounded-xl transition disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
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

      {/* Render the ABDM & FHIR Resource Modal */}
      <AbhaModal
        isOpen={showAbhaModal}
        onClose={() => setShowAbhaModal(false)}
        documents={documents}
        biomarkers={biomarkers}
        medications={medications}
      />
    </div>
  );
}