"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Activity, UploadCloud, Pill, Calendar, Clock, MessageSquare, 
  FileText, TrendingUp, ShieldCheck, CheckCircle2, Mic, MicOff, Printer,
  RefreshCw, Send, Bell, BellRing, Volume2, VolumeX,
  ChevronRight, Sparkles, Heart, Play, LogIn, LogOut, Building2
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ConfirmModal } from "@/components/ConfirmModal";
import { AbhaModal } from "@/components/AbhaModal";
import { AuthModal } from "@/components/AuthModal";

// Multilingual UI Dictionaries with Simple, Universal Names
const TRANSLATIONS = {
  en: {
    appTitle: "HEALTH COPILOT",
    edition: "ALTRIX EDITION",
    telemetryLive: "SYSTEM ACTIVE",
    abdmReady: "ABDM / FHIR READY",
    sirenTest: "Sound Test",
    ingesting: "Analyzing File...",
    ingestBtn: "Upload Medical Record",
    signInUp: "Sign In / Up",
    signOut: "Sign Out",
    verifiedStatus: "VERIFIED",
    menuHeader: "Navigation",
    groundedSafeguard: "Verified Medical Safety",
    safeguardDesc: "AI answers are strictly checked against your uploaded prescriptions and lab reports.",
    abdmBannerTitle: "Join Ayushman Bharat Digital Mission (ABDM)",
    abdmBannerTag: "GOVERNMENT OF INDIA",
    abdmBannerDesc: "An initiative by the Government of India to create a seamless, integrated digital healthcare ecosystem across the country. Connect your 14-digit ABHA ID or Aadhaar to securely sync records.",
    abdmConnectBtn: "Connect",
    nav: {
      radar: "Health Overview",
      ledger: "Medical History",
      regimens: "My Medicines",
      trends: "Lab Test Trends",
      dossier: "Doctor Visit Summary",
      agent: "AI Health Assistant"
    },
    metrics: {
      docs: "Uploaded Reports",
      docsDesc: "Analyzed by AI",
      regimens: "Active Medicines",
      regimensDesc: "Prescribed daily courses",
      markers: "Tracked Lab Values",
      markersDesc: "Health indicators",
      alarms: "Medicine Reminders",
      alarmsDesc: "Active alerts"
    },
    summariesTitle: "Recent Report Summaries",
    fullTimeline: "View Full History",
    noDocs: "No medical records found. Click 'Upload Medical Record' above to scan a lab report or prescription.",
    dailyAlarms: "Medicine Reminders",
    armed: "ACTIVE",
    noReminders: "No reminders set. You can say 'Set a reminder for my medicine at 8:00 AM' in the AI Assistant.",
    timelineHeader: "Medical History & Timeline",
    timelineSub: "Chronological list of all your past doctor visits, prescriptions, and lab tests",
    regimensHeader: "My Medicines & Dosages",
    regimensSub: "All active medications extracted accurately from your doctor prescriptions",
    dosage: "Dosage",
    schedule: "When to take",
    duration: "How long",
    trendsHeader: "Lab Test Progress & Charts",
    trendsSub: "See how your lab numbers (like Sugar, Cholesterol, or Vitamins) change over time",
    filterPlaceholder: "Search test (e.g. Vitamin D, Sugar)",
    needMorePoints: "Upload at least 2 reports containing this test to see your progress graph.",
    dossierHeader: "Doctor Visit Summary",
    dossierSub: "Ready-to-print summary of your medicines, allergies, and questions for your doctor",
    printBrief: "Print Summary",
    patient: "Patient Name",
    age: "Age",
    bloodGroup: "Blood Group",
    allergies: "Known Allergies",
    currentRegimens: "Current Medicines",
    suggestedQuestions: "Important Questions for Your Doctor",
    agentTitle: "AI Health Assistant",
    chatPlaceholder: "Ask about your medicines, lab values, or set reminders...",
    welcomeChat: "Hello! I am your AI Health Assistant. I can help explain your medical reports, check your medicines, or set daily reminders.",
    formulating: "Checking your medical records..."
  },
  te: {
    appTitle: "హెల్త్ కోపైలట్",
    edition: "ఆల్ట్రిక్స్ ఎడిషన్",
    telemetryLive: "వ్యవస్థ సిద్ధంగా ఉంది",
    abdmReady: "ABDM / FHIR సిద్ధం",
    sirenTest: "శబ్దం పరీక్ష",
    ingesting: "విశ్లేషిస్తోంది...",
    ingestBtn: "మెడికల్ రికార్డ్ అప్‌లోడ్",
    signInUp: "లాగిన్ / రిజిస్టర్",
    signOut: "లాగ్ అవుట్",
    verifiedStatus: "ధృవీకరించబడింది",
    menuHeader: "ముఖ్య విభాగాలు",
    groundedSafeguard: "వైద్య భద్రతా రక్షణ",
    safeguardDesc: "సమాధానాలు కేవలం మీ డాక్టర్ ప్రిస్క్రిప్షన్లు మరియు ల్యాబ్ రిపోర్టుల ఆధారంగా మాత్రమే ఉంటాయి.",
    abdmBannerTitle: "ఆయుష్మాన్ భారత్ డిజిటల్ మిషన్ (ABDM) లో చేరండి",
    abdmBannerTag: "భారత ప్రభుత్వం",
    abdmBannerDesc: "దేశవ్యాప్తంగా సురక్షిత డిజిటల్ ఆరోగ్య వ్యవస్థను రూపొందించడానికి భారత ప్రభుత్వ కార్యక్రమం. మీ రికార్డులను సమకాలీకరించడానికి 14 అంకెల ABHA నంబర్ లేదా ఆధార్‌ను అనుసంధానించండి.",
    abdmConnectBtn: "కనెక్ట్ చేయండి",
    nav: {
      radar: "ఆరోగ్య అవలోకనం",
      ledger: "వైద్య చరిత్ర",
      regimens: "నా మందులు",
      trends: "ల్యాబ్ పరీక్షల గ్రాఫ్",
      dossier: "డాక్టర్ సందర్శన పత్రం",
      agent: "ఏఐ సహాయకుడు"
    },
    metrics: {
      docs: "అప్‌లోడ్ చేసిన రికార్డులు",
      docsDesc: "ఏఐ ద్వారా పరిశీలించబడింది",
      regimens: "ప్రస్తుత మందులు",
      regimensDesc: "రోజూ వాడవలసినవి",
      markers: "రక్త పరీక్ష ఫలితాలు",
      markersDesc: "ట్రాక్ చేయబడిన విలువలు",
      alarms: "మందుల అలారాలు",
      alarmsDesc: "యాక్టివ్ టైమర్లు"
    },
    summariesTitle: "ఇటీవలి నివేదికల సారాంశాలు",
    fullTimeline: "మొత్తం చరిత్ర చూడండి",
    noDocs: "ఎటువంటి రికార్డులు లేవు. ప్రిస్క్రిప్షన్ లేదా ల్యాబ్ రిపోర్ట్ అప్‌లోడ్ చేయడానికి పైన ఉన్న బటన్ నొక్కండి.",
    dailyAlarms: "మందుల రిమైండర్లు",
    armed: "సిద్ధం",
    noReminders: "రిమైండర్లు లేవు. చాట్‌లో 'ఉదయం 8 గంటలకు మందుల అలారం పెట్టు' అని చెప్పవచ్చు.",
    timelineHeader: "ఆరోగ్య చరిత్ర & వివరాలు",
    timelineSub: "మీ మునుపటి డాక్టర్ సందర్శనలు మరియు ల్యాబ్ పరీక్షల కాలక్రమ జాబితా",
    regimensHeader: "నా మందులు & మోతాదు వివరాలు",
    regimensSub: "మీ ప్రిస్క్రిప్షన్ల నుండి సేకరించిన పూర్తి మందుల వివరాలు",
    dosage: "మోతాదు",
    schedule: "ఎప్పుడు తీసుకోవాలి",
    duration: "ఎన్ని రోజులు",
    trendsHeader: "ల్యాబ్ మార్పుల చార్ట్",
    trendsSub: "కాలక్రమేణా మీ రక్త పరీక్షల ఫలితాలు ఎలా మారాయో చూడండి",
    filterPlaceholder: "పరీక్ష పేరు (ఉదా: Vitamin D, Glucose)",
    needMorePoints: "ఈ పరీక్షకు గ్రాఫ్ చూడటానికి కనీసం 2 వేర్వేరు తేదీల నివేదికలు అవసరం.",
    dossierHeader: "డాక్టర్ సందర్శన సంక్షిప్త పత్రం",
    dossierSub: "డాక్టర్‌ను కలిసే సమయంలో చూపించడానికి సిద్ధం చేసిన నివేదిక",
    printBrief: "ప్రింట్ చేయండి",
    patient: "రోగి పేరు",
    age: "వయస్సు",
    bloodGroup: "రక్త వర్గం",
    allergies: "ఎలర్జీలు",
    currentRegimens: "ప్రస్తుతం వాడుతున్న మందులు",
    suggestedQuestions: "డాక్టర్‌ని అడగవలసిన ముఖ్యమైన ప్రశ్నలు",
    agentTitle: "ఏఐ ఆరోగ్య సహాయకుడు",
    chatPlaceholder: "మందుల గురించి అడగండి లేదా అలారం సెట్ చేయండి...",
    welcomeChat: "నమస్కారం! నేను మీ ఆరోగ్య సహాయకుడిని. మీ వైద్య నివేదికలను వివరించడంలో లేదా అలారాలు సెట్ చేయడంలో సహాయం చేయగలను.",
    formulating: "సమాధానం సిద్ధం చేస్తోంది..."
  },
  hi: {
    appTitle: "हेल्थ कोपायलट",
    edition: "ऑल्ट्रिक्स एडिशन",
    telemetryLive: "सिस्टम सक्रिय",
    abdmReady: "ABDM / FHIR तैयार",
    sirenTest: "आवाज टेस्ट",
    ingesting: "प्रक्रिया जारी...",
    ingestBtn: "मेडिकल रिकॉर्ड अपलोड करें",
    signInUp: "साइन इन / रजिस्टर",
    signOut: "लॉग आउट",
    verifiedStatus: "सत्यापित",
    menuHeader: "मुख्य मेनू",
    groundedSafeguard: "सत्यापित सुरक्षा",
    safeguardDesc: "सभी उत्तर केवल आपकी अपलोड की गई रिपोर्ट और पर्चियों पर आधारित हैं।",
    abdmBannerTitle: "आयुष्मान भारत डिजिटल मिशन (ABDM) से जुड़ें",
    abdmBannerTag: "भारत सरकार",
    abdmBannerDesc: "देश भर में एकीकृत डिजिटल स्वास्थ्य सेवा के लिए भारत सरकार की पहल। अपने मेडिकल रिकॉर्ड सुरक्षित रूप से सिंक करने के लिए अपना 14-अंकीय ABHA नंबर या आधार लिंक करें।",
    abdmConnectBtn: "कनेक्ट करें",
    nav: {
      radar: "स्वास्थ्य अवलोकन",
      ledger: "चिकित्सा इतिहास",
      regimens: "मेरी दवाइयाँ",
      trends: "लैब टेस्ट ग्राफ",
      dossier: "डॉक्टर विजिट फाइल",
      agent: "एआई सहायक"
    },
    metrics: {
      docs: "अपलोड की गई रिपोर्ट",
      docsDesc: "एआई द्वारा विश्लेषित",
      regimens: "सक्रिय दवाइयाँ",
      regimensDesc: "नियमित खुराक",
      markers: "ट्रैक किए गए टेस्ट",
      markersDesc: "स्वास्थ्य सूचक",
      alarms: "दवा के अलार्म",
      alarmsDesc: "सक्रिय रिमाइंडर"
    },
    summariesTitle: "रिपोर्ट का सारांश",
    fullTimeline: "पूरा इतिहास देखें",
    noDocs: "कोई रिकॉर्ड उपलब्ध नहीं है। रिपोर्ट या पर्ची अपलोड करने के लिए ऊपर दिए गए बटन पर क्लिक करें।",
    dailyAlarms: "दैनिक दवा अलार्म",
    armed: "सक्रिय",
    noReminders: "कोई अलार्म सक्रिय नहीं है। चैट में अलार्म सेट करने के लिए कहें।",
    timelineHeader: "स्वास्थ्य इतिहास और समयरेखा",
    timelineSub: "आपकी पिछली डॉक्टर मुलाकातों और जांच रिपोर्ट का संपूर्ण विवरण",
    regimensHeader: "मेरी दवाइयाँ और खुराक",
    regimensSub: "आपकी डॉक्टर पर्चियों से निकाली गई सक्रिय दवाइयाँ",
    dosage: "खुराक",
    schedule: "कब लेनी है",
    duration: "कितने दिन",
    trendsHeader: "लैब टेस्ट के रुझान और ग्राफ",
    trendsSub: "देखें कि समय के साथ आपकी जांच रिपोर्ट के अंक कैसे बदले हैं",
    filterPlaceholder: "खोजें (उदा. Vitamin D, Sugar)",
    needMorePoints: "ग्राफ देखने के लिए कम से कम 2 अलग-अलग तारीखों की रिपोर्ट आवश्यक हैं।",
    dossierHeader: "डॉक्टर विजिट फाइल",
    dossierSub: "डॉक्टर को दिखाने के लिए तैयार की गई संक्षिप्त रिपोर्ट",
    printBrief: "प्रिंट करें",
    patient: "मरीज़ का नाम",
    age: "उम्र",
    bloodGroup: "ब्लड ग्रुप",
    allergies: "एलर्जी विवरण",
    currentRegimens: "वर्तमान दवाइयाँ",
    suggestedQuestions: "डॉक्टर से पूछे जाने वाले सवाल",
    agentTitle: "एआई स्वास्थ्य सहायक",
    chatPlaceholder: "दवाइयों के बारे में पूछें या अलार्म सेट करें...",
    welcomeChat: "नमस्ते! मैं आपका एआई स्वास्थ्य सहायक हूँ। मैं आपकी रिपोर्ट समझाने या दवा का रिमाइंडर लगाने में मदद कर सकता हूँ।",
    formulating: "उत्तर तैयार किया जा रहा है..."
  }
};

export default function HealthCopilotApp() {
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "medications" | "trends" | "chat" | "doctor-prep">("overview");

  // Multi-Language State
  const [selectedLang, setSelectedLang] = useState<"en" | "te" | "hi">("en");
  const t = TRANSLATIONS[selectedLang];

  const [showAbhaModal, setShowAbhaModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Authenticated User State
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [profile, setProfile] = useState<{
    name: string;
    blood_group: string;
    age: number | string;
    gender: string;
    allergies: string[];
  } | null>(null);

  // Clinical Records State
  const [documents, setDocuments] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [biomarkers, setBiomarkers] = useState<any[]>([]);

  // Extraction & Upload State
  const [uploading, setUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Adherence Alarm State
  const [activeAlarm, setActiveAlarm] = useState<any>(null);
  const triggeredAlarmsRef = useRef<Set<string>>(new Set());

  // Text-To-Speech State
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);
  const [currentlySpeakingText, setCurrentlySpeakingText] = useState("");

  // AI Copilot Agent State
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "copilot"; text: string; action?: string }[]>([
    { 
      role: "copilot", 
      text: TRANSLATIONS.en.welcomeChat
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState("Vitamin D");

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (chatMessages.length === 1 && chatMessages[0].role === "copilot") {
      setChatMessages([{ role: "copilot", text: t.welcomeChat }]);
    }
  }, [selectedLang]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSessionUser(session.user);
        loadUserProfile(session.user);
      }
      fetchDashboardData();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSessionUser(session.user);
        loadUserProfile(session.user);
      } else {
        setSessionUser(null);
        setProfile(null);
      }
      fetchDashboardData();
    });

    requestNotificationPermission();

    return () => {
      subscription.unsubscribe();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const loadUserProfile = async (user: any) => {
    try {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) {
        setProfile(data);
      } else {
        setProfile({
          name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Active Patient",
          blood_group: user.user_metadata?.blood_group || "O+",
          age: user.user_metadata?.age || "--",
          gender: "Not Specified",
          allergies: []
        });
      }
    } catch (e) {
      console.error("Error loading profile:", e);
    }
  };

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

          speakText(`Reminder: ${r.title} at ${r.time}`);

          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification(`Adherence Alert: ${r.title}`, {
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSessionUser(null);
    setProfile(null);
  };

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
      // 1. Build document payload safely
      const docPayload: any = {
        doc_type: extractedData.docType || "prescription",
        record_date: safeDate,
        doctor_name: extractedData.doctorName || "Attending Physician",
        plain_summary: extractedData.plainSummary || "",
        technical_summary: extractedData.technicalSummary || "",
        questions: extractedData.questionsForDoctor || []
      };
      if (sessionUser?.id) {
        docPayload.user_id = sessionUser.id;
      }

      let { data: docData, error: docErr } = await supabase
        .from("documents")
        .insert([docPayload])
        .select()
        .single();

      // If user_id column doesn't exist yet in Supabase schema cache, retry without user_id
      if (docErr && docErr.message?.includes("user_id")) {
        delete docPayload.user_id;
        const retry = await supabase
          .from("documents")
          .insert([docPayload])
          .select()
          .single();
        docData = retry.data;
        docErr = retry.error;
      }

      if (docErr) throw docErr;

      // 2. Insert extracted biomarkers
      if (extractedData.biomarkers?.length > 0 && docData?.id) {
        const markerInserts = extractedData.biomarkers.map((b: any) => {
          const item: any = {
            document_id: docData.id,
            marker_name: b.markerName,
            value: b.value,
            unit: b.unit || "",
            status: b.status || "normal",
            test_date: safeDate
          };
          if (sessionUser?.id) item.user_id = sessionUser.id;
          return item;
        });

        const { error: bioErr } = await supabase.from("biomarkers").insert(markerInserts);
        if (bioErr && bioErr.message?.includes("user_id")) {
          const fallbackMarkers = markerInserts.map(({ user_id, ...rest }: any) => rest);
          await supabase.from("biomarkers").insert(fallbackMarkers);
        }
      }

      // 3. Insert reconciled medications
      if (extractedData.medications?.length > 0) {
        const medInserts = extractedData.medications.map((m: any) => {
          const item: any = {
            name: m.name,
            dosage: m.dosage || "As advised",
            frequency: m.frequency || "Daily",
            duration: m.duration || "14 days",
            status: m.actionType === "discontinued" ? "discontinued" : "active"
          };
          if (sessionUser?.id) item.user_id = sessionUser.id;
          return item;
        });

        const { error: medErr } = await supabase.from("medications").insert(medInserts);
        if (medErr && medErr.message?.includes("user_id")) {
          const fallbackMeds = medInserts.map(({ user_id, ...rest }: any) => rest);
          await supabase.from("medications").insert(fallbackMeds);
        }
      }

      // 4. Record audit log
      const auditPayload: any = {
        action: "CLINICAL_DOCUMENT_SUMMARY_COMMITTED",
        resource: extractedData.docType || "prescription"
      };
      if (sessionUser?.id) auditPayload.user_id = sessionUser.id;
      
      const { error: auditErr } = await supabase.from("audit_logs").insert([auditPayload]);
      if (auditErr && auditErr.message?.includes("user_id")) {
        delete auditPayload.user_id;
        await supabase.from("audit_logs").insert([auditPayload]);
      }

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
        body: JSON.stringify({ message: userText, language: selectedLang }),
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
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
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

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
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

  // Everyday, intuitive labels for everyone
  const navItems = [
    { id: "overview", label: t.nav.radar, icon: Activity, badge: "Live" },
    { id: "timeline", label: t.nav.ledger, icon: Calendar, badge: `${documents.length}` },
    { id: "medications", label: t.nav.regimens, icon: Pill, badge: `${medications.filter(m => m.status === "active").length}` },
    { id: "trends", label: t.nav.trends, icon: TrendingUp, badge: "Charts" },
    { id: "doctor-prep", label: t.nav.dossier, icon: Printer, badge: "Printable" },
    { id: "chat", label: t.nav.agent, icon: MessageSquare, badge: "AI" },
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
            <div className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold">Medicine Alert</div>
            <div className="text-xs font-semibold text-neutral-100">{activeAlarm.title} &bull; <span className="text-amber-300">{activeAlarm.time}</span></div>
          </div>
          <button
            onClick={() => {
              toggleReminder(activeAlarm.id, false);
              setActiveAlarm(null);
            }}
            className="bg-amber-500 hover:bg-amber-400 text-neutral-950 px-4 py-1.5 rounded-full text-xs font-bold transition shadow-sm cursor-pointer"
          >
            I took it
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

      {/* Header Bar */}
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
              <span className="font-extrabold text-sm tracking-tight text-white uppercase">{t.appTitle}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold tracking-wider">{t.edition}</span>
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-neutral-400 font-mono">
              <span className="text-emerald-400 font-bold">&bull; {t.telemetryLive}</span>
              <span>&mdash;</span>
              <span>{t.abdmReady}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Multi-Language Selector */}
          <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-xl p-0.5 text-xs font-mono">
            <button 
              onClick={() => setSelectedLang("en")} 
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-semibold ${selectedLang === "en" ? "bg-cyan-500 text-black font-bold" : "text-neutral-400 hover:text-white"}`}
            >
              EN
            </button>
            <button 
              onClick={() => setSelectedLang("te")} 
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-semibold ${selectedLang === "te" ? "bg-cyan-500 text-black font-bold" : "text-neutral-400 hover:text-white"}`}
            >
              తెలుగు
            </button>
            <button 
              onClick={() => setSelectedLang("hi")} 
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-semibold ${selectedLang === "hi" ? "bg-cyan-500 text-black font-bold" : "text-neutral-400 hover:text-white"}`}
            >
              हिन्दी
            </button>
          </div>

          {/* ABDM Modal Trigger */}
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
            <span className="font-mono text-[11px]">{t.sirenTest}</span>
          </button>

          <label className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-neutral-950 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer transition shadow-[0_0_25px_rgba(6,182,212,0.3)]">
            <UploadCloud className="w-4 h-4" />
            <span>{uploading ? t.ingesting : t.ingestBtn}</span>
            <input type="file" accept="*/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
          </label>

          <div className="h-6 w-px bg-white/[0.08] mx-1" />

          {/* Auth Capsule */}
          {sessionUser ? (
            <div className="flex items-center space-x-3 bg-white/[0.03] border border-white/[0.08] px-3.5 py-1.5 rounded-xl backdrop-blur-md">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center text-xs font-bold text-cyan-300">
                {profile?.name ? profile.name[0].toUpperCase() : sessionUser.email[0].toUpperCase()}
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-white leading-tight truncate max-w-[120px]">
                  {profile?.name || sessionUser.email}
                </div>
                <div className="text-[10px] text-cyan-400 font-mono tracking-wider">
                  {profile?.blood_group ? `TYPE ${profile.blood_group}` : t.verifiedStatus}
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-red-400 transition cursor-pointer"
                title={t.signOut}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center space-x-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-cyan-300 font-mono px-3.5 py-2 rounded-xl text-xs transition cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t.signInUp}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Rail with Simple Universal Labels */}
        <aside className="w-68 border-r border-white/[0.06] bg-[#070B16]/50 p-4 flex flex-col justify-between">
          <nav className="space-y-1.5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 px-3 mb-2 font-bold">{t.menuHeader}</div>
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
              <span className="font-mono text-[11px] tracking-wider uppercase">{t.groundedSafeguard}</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
              {t.safeguardDesc}
            </p>
          </div>
        </aside>

        {/* Dynamic Canvas */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="max-w-6xl mx-auto space-y-7 animate-in fade-in duration-200">
              {/* Telemetry Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: t.metrics.docs, val: documents.length, desc: t.metrics.docsDesc, icon: FileText, border: "border-cyan-500/20", glow: "from-cyan-500/10 to-transparent", text: "text-cyan-400" },
                  { label: t.metrics.regimens, val: medications.filter(m => m.status === "active").length, desc: t.metrics.regimensDesc, icon: Pill, border: "border-emerald-500/20", glow: "from-emerald-500/10 to-transparent", text: "text-emerald-400" },
                  { label: t.metrics.markers, val: biomarkers.length, desc: t.metrics.markersDesc, icon: TrendingUp, border: "border-blue-500/20", glow: "from-blue-500/10 to-transparent", text: "text-blue-400" },
                  { label: t.metrics.alarms, val: reminders.filter(r => !r.completed).length, desc: t.metrics.alarmsDesc, icon: Clock, border: "border-amber-500/20", glow: "from-amber-500/10 to-transparent", text: "text-amber-400" },
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

              {/* ABDM Official NHA Banner Card (Matches Mobile Screenshot) */}
              <div 
                onClick={() => setShowAbhaModal(true)}
                className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/20 via-[#0A101D] to-cyan-950/20 border border-emerald-500/30 hover:border-emerald-400/50 backdrop-blur-xl transition cursor-pointer flex items-center justify-between group shadow-[0_0_30px_rgba(16,185,129,0.06)]"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-white tracking-tight">
                        {t.abdmBannerTitle}
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        {t.abdmBannerTag}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 mt-1 font-sans max-w-2xl leading-relaxed">
                      {t.abdmBannerDesc}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold font-mono pl-4 shrink-0">
                  <span>{t.abdmConnectBtn}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>

              {/* Feed: Clinical Summaries & Alarms */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-3xl bg-[#0A0E1A]/60 border border-white/[0.08] p-6 backdrop-blur-2xl space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <h3 className="font-bold text-base text-white tracking-tight">{t.summariesTitle}</h3>
                    </div>
                    <button onClick={() => setActiveTab("timeline")} className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1 cursor-pointer">
                      <span>{t.fullTimeline}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {documents.length === 0 ? (
                    <div className="p-10 text-center text-neutral-500 border border-dashed border-white/[0.08] rounded-2xl text-xs font-mono">
                      {t.noDocs}
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {documents.slice(0, 3).map((doc, idx) => (
                        <div key={idx} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-cyan-500/30 transition space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-[10px] uppercase font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                                {doc.doc_type}
                              </span>
                              <span className="text-neutral-400 font-mono text-[11px]">
                                {doc.record_date}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {doc.doctor_name && (
                                <span className="text-neutral-400 font-mono text-[11px] truncate max-w-[150px]">
                                  {doc.doctor_name}
                                </span>
                              )}
                              <button
                                onClick={() => speakText(doc.plain_summary)}
                                title="Listen"
                                className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition cursor-pointer"
                              >
                                <Play className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-neutral-200 leading-relaxed font-sans">
                            {doc.plain_summary}
                          </p>
                          {doc.questions && doc.questions.length > 0 && (
                            <div className="pt-2 border-t border-white/[0.04] text-[11px] text-cyan-300 font-sans flex items-center space-x-1.5">
                              <span className="font-mono font-bold text-[10px] text-cyan-400 uppercase">Suggested Question:</span>
                              <span className="truncate">{doc.questions[0]}</span>
                            </div>
                          )}
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
                      <h3 className="font-bold text-base text-white tracking-tight">{t.dailyAlarms}</h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold">{t.armed}</span>
                  </div>

                  {reminders.length === 0 ? (
                    <div className="p-8 text-center text-xs font-mono text-neutral-500 border border-dashed border-white/[0.08] rounded-2xl">
                      {t.noReminders}
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

          {/* TAB 2: MEDICAL HISTORY */}
          {activeTab === "timeline" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">{t.timelineHeader}</h2>
                <p className="text-xs text-neutral-400 mt-1">{t.timelineSub}</p>
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

          {/* TAB 3: MY MEDICINES */}
          {activeTab === "medications" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">{t.regimensHeader}</h2>
                <p className="text-xs text-neutral-400 mt-1">{t.regimensSub}</p>
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
                      <div><strong className="text-neutral-400">{t.dosage}:</strong> {m.dosage}</div>
                      <div><strong className="text-neutral-400">{t.schedule}:</strong> {m.frequency}</div>
                      {m.duration && <div><strong className="text-neutral-400">{t.duration}:</strong> {m.duration}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: LAB TEST TRENDS */}
          {activeTab === "trends" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">{t.trendsHeader}</h2>
                  <p className="text-xs text-neutral-400 mt-1">{t.trendsSub}</p>
                </div>
                <input 
                  type="text" 
                  value={selectedMarker} 
                  onChange={(e) => setSelectedMarker(e.target.value)}
                  placeholder={t.filterPlaceholder}
                  className="px-3.5 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-xs text-neutral-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="p-6 rounded-3xl bg-[#0A0E1A]/80 border border-white/[0.08] backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white font-mono uppercase">{selectedMarker} Progress</h3>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">Graph</span>
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
                    {t.needMorePoints}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: DOCTOR VISIT SUMMARY */}
          {activeTab === "doctor-prep" && (
            <div className="max-w-3xl mx-auto rounded-3xl bg-[#0A0E1A]/80 border border-white/[0.08] p-8 backdrop-blur-xl space-y-6">
              <div className="flex justify-between items-start border-b border-white/[0.08] pb-5">
                <div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">{t.dossierHeader}</h2>
                  <p className="text-xs text-neutral-400 mt-1">{t.dossierSub}</p>
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
                    <span>{t.printBrief}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-white/[0.02] border border-white/[0.05] p-4 rounded-2xl text-xs font-sans">
                <div><span className="text-neutral-400">{t.patient}:</span> <strong className="text-white">{profile?.name || "Not signed in"}</strong></div>
                <div><span className="text-neutral-400">{t.age}:</span> <strong className="text-white">{profile?.age || "--"}</strong></div>
                <div><span className="text-neutral-400">{t.bloodGroup}:</span> <strong className="text-white">{profile?.blood_group || "--"}</strong></div>
                <div><span className="text-neutral-400">{t.allergies}:</span> <strong className="text-white">{profile?.allergies?.join(", ") || "None"}</strong></div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400">{t.currentRegimens}</h4>
                <ul className="list-disc pl-5 text-xs space-y-1 text-neutral-200">
                  {medications.map((m, i) => (
                    <li key={i}>{m.name} — {m.dosage} ({m.frequency})</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">{t.suggestedQuestions}</h4>
                <ul className="list-disc pl-5 text-xs text-neutral-300 space-y-1">
                  {documents[0]?.questions?.map((q: string, i: number) => <li key={i}>{q}</li>) || (
                    <li>Inquire about the duration and tapering of active therapies.</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 6: AI HEALTH ASSISTANT */}
          {activeTab === "chat" && (
            <div className="max-w-3xl mx-auto h-[calc(100vh-160px)] flex flex-col rounded-3xl bg-[#0A0E1A]/80 border border-white/[0.08] overflow-hidden backdrop-blur-xl shadow-2xl">
              <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="font-bold text-xs text-white">{t.agentTitle}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase">
                  {selectedLang === "te" ? "తెలుగు" : selectedLang === "hi" ? "हिन्दी" : "English"}
                </span>
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
                      <div className="whitespace-pre-wrap">{msg.text}</div>
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
                      <span>{t.formulating}</span>
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
                  placeholder={t.chatPlaceholder}
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

      {/* ABDM & FHIR Resource Modal */}
      <AbhaModal
        isOpen={showAbhaModal}
        onClose={() => setShowAbhaModal(false)}
        documents={documents}
        biomarkers={biomarkers}
        medications={medications}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
}