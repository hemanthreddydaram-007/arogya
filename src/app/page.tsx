"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Activity, UploadCloud, Pill, Calendar, Clock, MessageSquare, 
  FileText, TrendingUp, ShieldCheck, CheckCircle2, Mic, MicOff, Printer,
  RefreshCw, Send, Bell, BellRing,
  ChevronRight, Sparkles, Heart, LogIn, LogOut, Building2, Camera
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ConfirmModal } from "@/components/ConfirmModal";
import { AbhaModal } from "@/components/AbhaModal";
import { AuthModal } from "@/components/AuthModal";

const TRANSLATIONS = {
  en: {
    appTitle: "Health Copilot",
    edition: "Patient Portal",
    telemetryLive: "Online",
    abdmReady: "ABHA / ABDM Ready",
    sirenTest: "Test Alert",
    ingesting: "Analyzing...",
    ingestBtn: "Upload Report",
    cameraBtn: "Take Photo",
    signInUp: "Sign In / Register",
    signOut: "Sign Out",
    verifiedStatus: "Verified",
    menuHeader: "Main Menu",
    groundedSafeguard: "Clinical Grounding",
    safeguardDesc: "Responses are strictly validated against your uploaded medical records and prescriptions.",
    abdmBannerTitle: "Ayushman Bharat Digital Mission (ABDM)",
    abdmBannerTag: "Govt. of India",
    abdmBannerDesc: "Connect your ABHA ID or Aadhaar to securely synchronize and access your official digital health records.",
    abdmConnectBtn: "Link ABHA",
    signInRequired: "Please sign in to upload files or access records.",
    nav: {
      radar: "Overview",
      ledger: "Medical Timeline",
      regimens: "Prescriptions",
      trends: "Lab Trends",
      dossier: "Doctor Summary",
      agent: "Health Copilot"
    },
    metrics: {
      docs: "Uploaded Reports",
      docsDesc: "Analyzed documents",
      regimens: "Active Medicines",
      regimensDesc: "Ongoing prescriptions",
      markers: "Tracked Markers",
      markersDesc: "Lab test values",
      alarms: "Reminders",
      alarmsDesc: "Active medicine alerts"
    },
    summariesTitle: "Recent Medical Records",
    fullTimeline: "View Complete History",
    noDocs: "No clinical records found. Click 'Upload Report' or 'Take Photo' above to add your first record.",
    dailyAlarms: "Daily Medicine Alerts",
    armed: "Active",
    noReminders: "No alarms configured. Ask the AI assistant to set reminders for your prescribed medicines.",
    timelineHeader: "Medical History & Clinical Timeline",
    timelineSub: "Chronological documentation of consultations, prescriptions, and laboratory reports.",
    regimensHeader: "Active Medications & Dosages",
    regimensSub: "Medication regimens parsed directly from verified physician prescriptions.",
    dosage: "Dosage",
    schedule: "Instructions",
    duration: "Duration",
    trendsHeader: "Laboratory Marker Progression",
    trendsSub: "Monitor numerical shifts across blood tests, vitamins, and metabolic panels.",
    filterPlaceholder: "Search marker (e.g. Vitamin D, Sugar)...",
    needMorePoints: "Upload at least 2 reports tracking this biomarker to render a historical curve.",
    dossierHeader: "Physician Consultation Brief",
    dossierSub: "Printable briefing containing known allergies, active courses, and suggested clinical questions.",
    printBrief: "Print Summary",
    patient: "Patient Name",
    age: "Age",
    bloodGroup: "Blood Group",
    allergies: "Documented Allergies",
    currentRegimens: "Current Regimens",
    suggestedQuestions: "Recommended Questions for Your Doctor",
    agentTitle: "Clinical AI Assistant",
    chatPlaceholder: "Ask about your medications, past reports, or set reminders...",
    welcomeChat: "Hello! How can I assist you with your health records, lab reports, or medications today?",
    formulating: "Searching medical records..."
  },
  te: {
    appTitle: "హెల్త్ కోపైలట్",
    edition: "పేషెంట్ పోర్టల్",
    telemetryLive: "సిస్టమ్ సిద్ధం",
    abdmReady: "ABDM / FHIR కనెక్టెడ్",
    sirenTest: "సౌండ్ టెస్ట్",
    ingesting: "పరిశీలిస్తోంది...",
    ingestBtn: "రిపోర్ట్ అప్‌లోడ్",
    cameraBtn: "ఫోటో తీయండి",
    signInUp: "లాగిన్ / రిజిస్టర్",
    signOut: "లాగ్ అవుట్",
    verifiedStatus: "ధృవీకరించబడింది",
    menuHeader: "విభాగాలు",
    groundedSafeguard: "వైద్య భద్రతా రక్షణ",
    safeguardDesc: "సమాధానాలు కేవలం మీ డాక్టర్ ప్రిస్క్రిప్షన్లు మరియు ల్యాబ్ రిపోర్టుల ఆధారంగా మాత్రమే ఉంటాయి.",
    abdmBannerTitle: "ఆయుష్మాన్ భారత్ డిజిటల్ మిషన్ (ABDM)",
    abdmBannerTag: "భారత ప్రభుత్వం",
    abdmBannerDesc: "మీ రికార్డులను సురక్షితంగా సమకాలీకరించడానికి మీ ABHA ID లేదా ఆధార్‌ను అనుసంధానించండి.",
    abdmConnectBtn: "కనెక్ట్ చేయండి",
    signInRequired: "రికార్డులను అప్‌లోడ్ చేయడానికి దయచేసి లాగిన్ అవ్వండి.",
    nav: {
      radar: "అవలోకనం",
      ledger: "వైద్య చరిత్ర",
      regimens: "మందుల వివరాలు",
      trends: "ల్యాబ్ మార్పులు",
      dossier: "డాక్టర్ సారాంశం",
      agent: "ఏఐ సహాయకుడు"
    },
    metrics: {
      docs: "రిపోర్టులు",
      docsDesc: "విశ్లేషించిన పత్రాలు",
      regimens: "వాడుతున్న మందులు",
      regimensDesc: "ప్రస్తుత కోర్సులు",
      markers: "ట్రాక్ చేసిన పరీక్షలు",
      markersDesc: "ల్యాబ్ విలువలు",
      alarms: "రిమైండర్లు",
      alarmsDesc: "యాక్టివ్ అలారాలు"
    },
    summariesTitle: "ఇటీవలి నివేదికల సారాంశాలు",
    fullTimeline: "పూర్తి చరిత్ర చూడండి",
    noDocs: "ఎటువంటి రికార్డులు లేవు. రిపోర్ట్ అప్‌లోడ్ చేయడానికి పై బటన్ నొక్కండి.",
    dailyAlarms: "మందుల అలారాలు",
    armed: "సిద్ధం",
    noReminders: "రిమైండర్లు లేవు. చాట్‌లో అలారం సెట్ చేయమని కోరవచ్చు.",
    timelineHeader: "ఆరోగ్య చరిత్ర & వివరాలు",
    timelineSub: "మీ మునుపటి డాక్టర్ సందర్శనలు మరియు ల్యాబ్ పరీక్షల కాలక్రమ జాబితా.",
    regimensHeader: "నా మందులు & మోతాదు వివరాలు",
    regimensSub: "మీ ప్రిస్క్రిప్షన్ల నుండి సేకరించిన పూర్తి మందుల సమాచారం.",
    dosage: "మోతాదు",
    schedule: "ఎప్పుడు తీసుకోవాలి",
    duration: "ఎన్ని రోజులు",
    trendsHeader: "ల్యాబ్ మార్పుల గ్రాఫ్",
    trendsSub: "కాలక్రమేణా మీ రక్త పరీక్షల ఫలితాలు ఎలా మారాయో చూడండి.",
    filterPlaceholder: "పరీక్ష పేరు (ఉదా: Vitamin D, Glucose)...",
    needMorePoints: "గ్రాఫ్ చూడటానికి కనీసం 2 వేర్వేరు తేదీల నివేదికలు అవసరం.",
    dossierHeader: "డాక్టర్ సందర్శన పత్రం",
    dossierSub: "డాక్టర్‌ను కలిసే సమయంలో చూపించడానికి సిద్ధం చేసిన నివేదిక.",
    printBrief: "ప్రింట్ చేయండి",
    patient: "రోగి పేరు",
    age: "వయస్సు",
    bloodGroup: "రక్త వర్గం",
    allergies: "ఎలర్జీలు",
    currentRegimens: "ప్రస్తుతం వాడుతున్న మందులు",
    suggestedQuestions: "డాక్టర్‌ని అడగవలసిన ముఖ్యమైన ప్రశ్నలు",
    agentTitle: "ఏఐ ఆరోగ్య సహాయకుడు",
    chatPlaceholder: "మందుల గురించి అడగండి లేదా అలారం సెట్ చేయండి...",
    welcomeChat: "నమస్కారం! మీ ఆరోగ్య రికార్డుల గురించి నేను మీకు ఎలా సహాయపడగలను?",
    formulating: "సమాధానం సిద్ధం చేస్తోంది..."
  },
  hi: {
    appTitle: "हेल्थ कोपायलट",
    edition: "पेशेंट पोर्टल",
    telemetryLive: "सक्रिय",
    abdmReady: "ABDM / FHIR कनेक्टेड",
    sirenTest: "अलार्म टेस्ट",
    ingesting: "विश्लेषण जारी...",
    ingestBtn: "रिपोर्ट अपलोड करें",
    cameraBtn: "फोटो लें",
    signInUp: "साइन इन / रजिस्टर",
    signOut: "लॉग आउट",
    verifiedStatus: "सत्यापित",
    menuHeader: "मुख्य मेनू",
    groundedSafeguard: "सत्यापित सुरक्षा",
    safeguardDesc: "सभी उत्तर केवल आपकी अपलोड की गई रिपोर्ट और पर्चियों पर आधारित हैं।",
    abdmBannerTitle: "आयुष्मान भारत डिजिटल मिशन (ABDM)",
    abdmBannerTag: "भारत सरकार",
    abdmBannerDesc: "अपने मेडिकल रिकॉर्ड सुरक्षित रूप से सिंक करने के लिए अपना ABHA ID या आधार लिंक करें।",
    abdmConnectBtn: "लिंक करें",
    signInRequired: "मेडिकल रिकॉर्ड अपलोड करने के लिए कृपया पहले साइन इन करें।",
    nav: {
      radar: "स्वास्थ्य अवलोकन",
      ledger: "चिकित्सा इतिहास",
      regimens: "दवाइयाँ",
      trends: "लैब ग्राफ",
      dossier: "डॉक्टर सारांश",
      agent: "एआई सहायक"
    },
    metrics: {
      docs: "अपलोड रिपोर्ट",
      docsDesc: "विश्लेषित दस्तावेज",
      regimens: "सक्रिय दवाइयाँ",
      regimensDesc: "नियमित खुराक",
      markers: "ट्रैक किए गए टेस्ट",
      markersDesc: "स्वास्थ्य सूचक",
      alarms: "अलार्म",
      alarmsDesc: "सक्रिय रिमाइंडर"
    },
    summariesTitle: "हालिया रिपोर्ट सारांश",
    fullTimeline: "पूरा इतिहास देखें",
    noDocs: "कोई रिकॉर्ड उपलब्ध नहीं है। रिपोर्ट अपलोड करने के लिए ऊपर दिए गए बटन पर क्लिक करें।",
    dailyAlarms: "दवा रिमाइंडर",
    armed: "सक्रिय",
    noReminders: "कोई अलार्म सक्रिय नहीं है। चैट में अलार्म सेट करने के लिए कहें।",
    timelineHeader: "स्वास्थ्य इतिहास और समयरेखा",
    timelineSub: "आपकी पिछली डॉक्टर मुलाकातों और जांच रिपोर्ट का संपूर्ण विवरण।",
    regimensHeader: "मेरी दवाइयाँ और खुराक",
    regimensSub: "आपकी डॉक्टर पर्चियों से निकाली गई दवाइयों का विवरण।",
    dosage: "खुराक",
    schedule: "कब लेनी है",
    duration: "कितने दिन",
    trendsHeader: "लैब टेस्ट के रुझान",
    trendsSub: "देखें कि समय के साथ आपकी जांच रिपोर्ट के अंक कैसे बदले हैं।",
    filterPlaceholder: "खोजें (उदा. Vitamin D, Sugar)...",
    needMorePoints: "ग्राफ देखने के लिए कम से कम 2 अलग-अलग तारीखों की रिपोर्ट आवश्यक हैं।",
    dossierHeader: "डॉक्टर विजिट फाइल",
    dossierSub: "डॉक्टर को दिखाने के लिए तैयार की गई संक्षिप्त रिपोर्ट।",
    printBrief: "प्रिंट करें",
    patient: "मरीज़ का नाम",
    age: "उम्र",
    bloodGroup: "ब्लड ग्रुप",
    allergies: "एलर्जी विवरण",
    currentRegimens: "वर्तमान दवाइयाँ",
    suggestedQuestions: "डॉक्टर से पूछे जाने वाले सवाल",
    agentTitle: "एआई स्वास्थ्य सहायक",
    chatPlaceholder: "दवाइयों के बारे में पूछें या अलार्म सेट करें...",
    welcomeChat: "नमस्ते! आज मैं आपके स्वास्थ्य रिकॉर्ड या दवाओं के संबंध में आपकी क्या मदद कर सकता हूँ?",
    formulating: "उत्तर तैयार किया जा रहा है..."
  }
};

export default function HealthCopilotApp() {
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "medications" | "trends" | "chat" | "doctor-prep">("overview");

  const [selectedLang, setSelectedLang] = useState<"en" | "te" | "hi">("en");
  const t = TRANSLATIONS[selectedLang];

  const [showAbhaModal, setShowAbhaModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [sessionUser, setSessionUser] = useState<any>(null);
  const [profile, setProfile] = useState<{
    name: string;
    blood_group: string;
    age: number | string;
    gender: string;
    allergies: string[];
  } | null>(null);

  const [documents, setDocuments] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [biomarkers, setBiomarkers] = useState<any[]>([]);

  const [uploading, setUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [activeAlarm, setActiveAlarm] = useState<any>(null);
  const triggeredAlarmsRef = useRef<Set<string>>(new Set());

  const [chatMessages, setChatMessages] = useState<{ role: "user" | "copilot"; text: string; action?: string }[]>([
    { role: "copilot", text: TRANSLATIONS.en.welcomeChat }
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState("Vitamin D");

  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
        fetchDashboardData(session.user);
      } else {
        setSessionUser(null);
        setProfile(null);
        setDocuments([]);
        setMedications([]);
        setReminders([]);
        setBiomarkers([]);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSessionUser(session.user);
        loadUserProfile(session.user);
        fetchDashboardData(session.user);
      } else {
        setSessionUser(null);
        setProfile(null);
        setDocuments([]);
        setMedications([]);
        setReminders([]);
        setBiomarkers([]);
      }
    });

    requestNotificationPermission();

    return () => {
      subscription.unsubscribe();
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

          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification(`Prescription Reminder: ${r.title}`, {
              body: `Scheduled time: ${r.time}.`,
              icon: "/favicon.ico"
            });
          }
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [reminders]);

  const fetchDashboardData = async (userParam?: any) => {
    const targetUser = userParam || sessionUser;

    if (!targetUser?.id) {
      setDocuments([]);
      setMedications([]);
      setReminders([]);
      setBiomarkers([]);
      return;
    }

    try {
      const { data: docs } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", targetUser.id)
        .order("record_date", { ascending: false });

      const { data: meds } = await supabase
        .from("medications")
        .select("*")
        .eq("user_id", targetUser.id);

      const { data: rems } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", targetUser.id)
        .order("time", { ascending: true });

      const { data: bio } = await supabase
        .from("biomarkers")
        .select("*")
        .eq("user_id", targetUser.id)
        .order("test_date", { ascending: true });

      setDocuments(docs || []);
      setMedications(meds || []);
      setReminders(rems || []);
      setBiomarkers(bio || []);
    } catch (err) {
      console.error("Data load error:", err);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSessionUser(null);
    setProfile(null);
    setDocuments([]);
    setMedications([]);
    setReminders([]);
    setBiomarkers([]);
  };

  const handleUploadClick = () => {
    if (!sessionUser) {
      alert(t.signInRequired);
      setShowAuthModal(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    if (!sessionUser) {
      alert(t.signInRequired);
      setShowAuthModal(true);
      return;
    }
    cameraInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!sessionUser) {
      alert(t.signInRequired);
      setShowAuthModal(true);
      e.target.value = "";
      return;
    }

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
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (cameraInputRef.current) cameraInputRef.current.value = "";
      }
    };

    reader.readAsDataURL(file);
  };

  const handleConfirmSave = async () => {
    if (!extractedData || !sessionUser?.id) return;

    const isValidDate = (d: string) => d && /^\d{4}-\d{2}-\d{2}$/.test(d);
    const safeDate = isValidDate(extractedData.recordDate)
      ? extractedData.recordDate
      : new Date().toISOString().split("T")[0];

    try {
      const docPayload = {
        user_id: sessionUser.id,
        doc_type: extractedData.docType || "prescription",
        record_date: safeDate,
        doctor_name: extractedData.doctorName || "Attending Physician",
        plain_summary: extractedData.plainSummary || "",
        technical_summary: extractedData.technicalSummary || "",
        questions: extractedData.questionsForDoctor || []
      };

      const { data: docData, error: docErr } = await supabase
        .from("documents")
        .insert([docPayload])
        .select()
        .single();

      if (docErr) throw docErr;

      if (extractedData.biomarkers?.length > 0 && docData?.id) {
        const markerInserts = extractedData.biomarkers.map((b: any) => ({
          user_id: sessionUser.id,
          document_id: docData.id,
          marker_name: b.markerName,
          value: Number(b.value) || 0,
          unit: b.unit || "",
          status: b.status || "normal",
          test_date: safeDate
        }));

        const { error: bioErr } = await supabase.from("biomarkers").insert(markerInserts);
        if (bioErr) console.warn("Biomarker error:", bioErr);
      }

      if (extractedData.medications?.length > 0) {
        const medInserts = extractedData.medications.map((m: any) => ({
          user_id: sessionUser.id,
          name: m.name,
          dosage: m.dosage || "As advised",
          frequency: m.frequency || "Daily",
          duration: m.duration || "30 days",
          status: m.actionType === "discontinued" ? "discontinued" : "active"
        }));

        const { error: medErr } = await supabase.from("medications").insert(medInserts);
        if (medErr) console.warn("Medication error:", medErr);
      }

      const auditPayload = {
        user_id: sessionUser.id,
        action: "CLINICAL_DOCUMENT_SUMMARY_COMMITTED",
        resource: extractedData.docType || "prescription"
      };
      await supabase.from("audit_logs").insert([auditPayload]);

      setShowConfirmModal(false);
      setExtractedData(null);
      await fetchDashboardData(sessionUser);
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
        body: JSON.stringify({ message: userText, language: selectedLang, userId: sessionUser?.id }),
      });
      const data = await res.json();

      if (data.error) {
        setChatMessages(prev => [...prev, { role: "copilot", text: "Notice: " + data.error }]);
      } else {
        setChatMessages(prev => [
          ...prev, 
          { role: "copilot", text: data.reply, action: data.actionTaken }
        ]);
      }

      if (data.actionTaken) fetchDashboardData(sessionUser);
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
          console.warn("Speech error:", e);
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
    fetchDashboardData(sessionUser);
  };

  const trendData = biomarkers
    .filter(b => b.marker_name?.toLowerCase().includes(selectedMarker.toLowerCase()))
    .map(b => ({ date: b.test_date, value: Number(b.value) }));

  const navItems = [
    { id: "overview", label: t.nav.radar, icon: Activity, badge: `${documents.length}` },
    { id: "timeline", label: t.nav.ledger, icon: Calendar, badge: `${documents.length}` },
    { id: "medications", label: t.nav.regimens, icon: Pill, badge: `${medications.filter(m => m.status === "active").length}` },
    { id: "trends", label: t.nav.trends, icon: TrendingUp, badge: "Charts" },
    { id: "doctor-prep", label: t.nav.dossier, icon: Printer, badge: "Brief" },
    { id: "chat", label: t.nav.agent, icon: MessageSquare, badge: "AI" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 antialiased pb-12">
      {/* Adherence Alert Banner */}
      {activeAlarm && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-white border border-amber-300 text-slate-800 px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-4 animate-in fade-in">
          <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600">
            <BellRing className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Medicine Alert</div>
            <div className="text-xs font-semibold text-slate-800">{activeAlarm.title} &bull; <span className="text-amber-700 font-bold">{activeAlarm.time}</span></div>
          </div>
          <button
            onClick={() => {
              toggleReminder(activeAlarm.id, false);
              setActiveAlarm(null);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shadow-sm cursor-pointer"
          >
            I took it
          </button>
        </div>
      )}

      {/* Clean White Top Navigation Header */}
      <header className="h-16 px-6 sm:px-8 border-b border-slate-200 bg-white/95 backdrop-blur-md flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <Heart className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900">{t.appTitle}</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                {t.edition}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500">
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span> {t.telemetryLive}
              </span>
              <span>&bull;</span>
              <span>{t.abdmReady}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Language Switcher */}
          <div className="flex bg-slate-100 border border-slate-200 rounded-lg p-0.5 text-xs font-medium">
            <button 
              onClick={() => setSelectedLang("en")} 
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${selectedLang === "en" ? "bg-white text-emerald-800 font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              EN
            </button>
            <button 
              onClick={() => setSelectedLang("te")} 
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${selectedLang === "te" ? "bg-white text-emerald-800 font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              తెలుగు
            </button>
            <button 
              onClick={() => setSelectedLang("hi")} 
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${selectedLang === "hi" ? "bg-white text-emerald-800 font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              हिन्दी
            </button>
          </div>

          {/* ABHA Gateway */}
          <button
            onClick={() => setShowAbhaModal(true)}
            className="hidden sm:flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ABHA & FHIR</span>
          </button>

          <button 
            onClick={playAlarmSound}
            className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition cursor-pointer"
            title="Test alert notification chime"
          >
            <Bell className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">{t.sirenTest}</span>
          </button>

          {/* Camera Scan Action */}
          <button
            type="button"
            onClick={handleCameraClick}
            disabled={uploading}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-semibold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition disabled:opacity-50"
            title="Snap prescription photo"
          >
            <Camera className="w-4 h-4 text-emerald-600" />
            <span className="hidden md:inline">{uploading ? "..." : t.cameraBtn}</span>
          </button>
          <input 
            ref={cameraInputRef}
            type="file" 
            accept="image/*" 
            capture="environment"
            onChange={handleFileUpload} 
            disabled={uploading} 
            className="hidden" 
          />

          {/* Primary Upload Button */}
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={uploading}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3.5 py-1.5 rounded-lg text-xs cursor-pointer transition shadow-xs disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{uploading ? t.ingesting : t.ingestBtn}</span>
          </button>
          <input 
            ref={fileInputRef}
            type="file" 
            accept="*/*" 
            onChange={handleFileUpload} 
            disabled={uploading} 
            className="hidden" 
          />

          <div className="h-6 w-px bg-slate-200 mx-1" />

          {/* User Status Profile */}
          {sessionUser ? (
            <div className="flex items-center space-x-2.5 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg">
              <div className="w-7 h-7 rounded-md bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                {profile?.name ? profile.name[0].toUpperCase() : sessionUser.email[0].toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[110px]">
                  {profile?.name || sessionUser.email}
                </div>
                <div className="text-[10px] text-emerald-700 font-medium">
                  {profile?.blood_group ? `Type ${profile.blood_group}` : t.verifiedStatus}
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="p-1 rounded-md hover:bg-slate-200 text-slate-500 hover:text-rose-600 transition cursor-pointer"
                title={t.signOut}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-semibold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t.signInUp}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-64 border-r border-slate-200 bg-white p-4 flex flex-col justify-between shrink-0 shadow-xs">
          <nav className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">{t.menuHeader}</div>
            {navItems.map(item => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    active 
                      ? "bg-emerald-50 text-emerald-900 font-semibold border border-emerald-200 shadow-xs" 
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${active ? "text-emerald-700" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    active ? "bg-emerald-200/60 text-emerald-900 border-emerald-300" : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}>
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <div className="flex items-center space-x-1.5 text-emerald-800 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-[11px] uppercase tracking-wider">{t.groundedSafeguard}</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {t.safeguardDesc}
            </p>
          </div>
        </aside>

        {/* Dynamic Canvas Area */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* TAB 1: HEALTH OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Telemetry Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: t.metrics.docs, val: documents.length, desc: t.metrics.docsDesc, icon: FileText },
                  { label: t.metrics.regimens, val: medications.filter(m => m.status === "active").length, desc: t.metrics.regimensDesc, icon: Pill },
                  { label: t.metrics.markers, val: biomarkers.length, desc: t.metrics.markersDesc, icon: TrendingUp },
                  { label: t.metrics.alarms, val: reminders.filter(r => !r.completed).length, desc: t.metrics.alarmsDesc, icon: Clock },
                ].map((c, i) => {
                  const Icon = c.icon;
                  return (
                    <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{c.label}</span>
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{c.val}</div>
                        <div className="text-xs text-slate-500 mt-1">{c.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ABDM Banner Card */}
              <div 
                onClick={() => setShowAbhaModal(true)}
                className="p-5 rounded-2xl bg-white border border-emerald-200 hover:border-emerald-300 transition cursor-pointer flex items-center justify-between shadow-xs group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-slate-900">
                        {t.abdmBannerTitle}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {t.abdmBannerTag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                      {t.abdmBannerDesc}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 text-emerald-700 text-xs font-bold pl-4 shrink-0">
                  <span>{t.abdmConnectBtn}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                </div>
              </div>

              {/* Summaries & Reminders Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <h3 className="font-bold text-base text-slate-900">{t.summariesTitle}</h3>
                    </div>
                    <button onClick={() => setActiveTab("timeline")} className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1 cursor-pointer">
                      <span>{t.fullTimeline}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {documents.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl text-xs">
                      {t.noDocs}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {documents.slice(0, 3).map((doc, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-200">
                                {doc.doc_type}
                              </span>
                              <span className="text-slate-500 text-[11px] font-medium">
                                {doc.record_date}
                              </span>
                            </div>
                            {doc.doctor_name && (
                              <span className="text-slate-600 font-medium text-[11px] truncate max-w-[180px]">
                                {doc.doctor_name}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed">
                            {doc.plain_summary}
                          </p>
                          {doc.questions && doc.questions.length > 0 && (
                            <div className="pt-2 border-t border-slate-200/60 text-[11px] text-emerald-800 flex items-center space-x-1.5">
                              <span className="font-bold text-[10px] uppercase text-emerald-700">Question:</span>
                              <span className="truncate">{doc.questions[0]}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Daily Reminders */}
                <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <h3 className="font-bold text-base text-slate-900">{t.dailyAlarms}</h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{t.armed}</span>
                  </div>

                  {reminders.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                      {t.noReminders}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {reminders.map((r, i) => (
                        <div 
                          key={i} 
                          onClick={() => toggleReminder(r.id, r.completed)}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition ${
                            r.completed 
                              ? "bg-slate-50 border-slate-200 line-through text-slate-400" 
                              : "bg-white border-slate-200 hover:border-emerald-300 text-slate-800"
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <div className={`p-1.5 rounded-lg ${r.completed ? "bg-slate-100 text-slate-400" : "bg-emerald-50 text-emerald-700"}`}>
                              <Bell className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{r.title}</p>
                              <span className="text-[11px] text-slate-500">{r.time}</span>
                            </div>
                          </div>
                          <CheckCircle2 className={`w-4 h-4 ${r.completed ? "text-emerald-600" : "text-slate-300 hover:text-slate-400"}`} />
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
                <h2 className="text-xl font-extrabold text-slate-900">{t.timelineHeader}</h2>
                <p className="text-xs text-slate-500 mt-1">{t.timelineSub}</p>
              </div>

              {documents.length === 0 ? (
                <div className="p-10 text-center text-slate-500 border border-dashed border-slate-200 rounded-2xl text-xs bg-white">
                  {t.noDocs}
                </div>
              ) : (
                <div className="relative border-l-2 border-emerald-200 ml-4 pl-6 space-y-6">
                  {documents.map((doc, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[31px] top-2 w-3.5 h-3.5 rounded-full bg-emerald-600 border-4 border-white shadow-xs" />
                      <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-xs transition space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {doc.doc_type}
                          </span>
                          <span className="text-slate-500 text-[11px] font-medium">{doc.record_date}</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900">{doc.doctor_name || "Diagnostic Finding"}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{doc.plain_summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACTIVE MEDICINES */}
          {activeTab === "medications" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">{t.regimensHeader}</h2>
                <p className="text-xs text-slate-500 mt-1">{t.regimensSub}</p>
              </div>

              {medications.length === 0 ? (
                <div className="p-10 text-center text-slate-500 border border-dashed border-slate-200 rounded-2xl text-xs bg-white">
                  No active medicines recorded yet. Upload a prescription to automatically extract your medicines.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {medications.map((m, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{m.name}</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {m.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-slate-600">
                        <div><strong className="text-slate-800">{t.dosage}:</strong> {m.dosage}</div>
                        <div><strong className="text-slate-800">{t.schedule}:</strong> {m.frequency}</div>
                        {m.duration && <div><strong className="text-slate-800">{t.duration}:</strong> {m.duration}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LAB TEST TRENDS */}
          {activeTab === "trends" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">{t.trendsHeader}</h2>
                  <p className="text-xs text-slate-500 mt-1">{t.trendsSub}</p>
                </div>
                <input 
                  type="text" 
                  value={selectedMarker} 
                  onChange={(e) => setSelectedMarker(e.target.value)} 
                  placeholder={t.filterPlaceholder}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-emerald-500 shadow-xs"
                />
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 uppercase">{selectedMarker} Progression</h3>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Chart</span>
                </div>

                {trendData.length > 1 ? (
                  <div className="h-72 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#059669" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={11} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                        />
                        <Area type="monotone" dataKey="value" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#emeraldGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="p-12 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                    {t.needMorePoints}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: DOCTOR SUMMARY */}
          {activeTab === "doctor-prep" && (
            <div className="max-w-3xl mx-auto rounded-2xl bg-white border border-slate-200 p-8 shadow-xs space-y-6">
              <div className="flex justify-between items-start border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">{t.dossierHeader}</h2>
                  <p className="text-xs text-slate-500 mt-1">{t.dossierSub}</p>
                </div>
                <button onClick={() => window.print()} className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs">
                  <Printer className="w-4 h-4" />
                  <span>{t.printBrief}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs">
                <div><span className="text-slate-500">{t.patient}:</span> <strong className="text-slate-900">{profile?.name || "Not signed in"}</strong></div>
                <div><span className="text-slate-500">{t.age}:</span> <strong className="text-slate-900">{profile?.age || "--"}</strong></div>
                <div><span className="text-slate-500">{t.bloodGroup}:</span> <strong className="text-slate-900">{profile?.blood_group || "--"}</strong></div>
                <div><span className="text-slate-500">{t.allergies}:</span> <strong className="text-slate-900">{profile?.allergies?.join(", ") || "None"}</strong></div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">{t.currentRegimens}</h4>
                {medications.length === 0 ? (
                  <p className="text-xs text-slate-500">No active medications registered.</p>
                ) : (
                  <ul className="list-disc pl-5 text-xs space-y-1 text-slate-700">
                    {medications.map((m, i) => (
                      <li key={i}>{m.name} — {m.dosage} ({m.frequency})</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">{t.suggestedQuestions}</h4>
                <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1">
                  {documents[0]?.questions?.map((q: string, i: number) => <li key={i}>{q}</li>) || (
                    <li>Inquire about the duration and tapering of active therapies.</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 6: AI CLINICAL COPILOT */}
          {activeTab === "chat" && (
            <div className="max-w-3xl mx-auto h-[calc(100vh-140px)] flex flex-col rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-bold text-xs text-slate-900">{t.agentTitle}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                  {selectedLang === "te" ? "తెలుగు" : selectedLang === "hi" ? "हिन्दी" : "English"}
                </span>
              </div>

              <div className="flex-1 p-5 overflow-y-auto space-y-3.5">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.role === "user" 
                        ? "bg-emerald-600 text-white rounded-br-none shadow-xs" 
                        : "bg-slate-100 border border-slate-200 text-slate-800 rounded-bl-none"
                    }`}>
                      {msg.action && (
                        <div className="text-[10px] font-bold text-emerald-800 mb-1">
                          [Action: {msg.action}]
                        </div>
                      )}
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 border border-slate-200 p-3 rounded-2xl text-xs text-slate-500 flex items-center space-x-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      <span>{t.formulating}</span>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-3.5 border-t border-slate-100 flex items-center space-x-2 bg-slate-50">
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`p-2.5 rounded-xl border transition cursor-pointer ${
                    isListening ? "bg-rose-50 text-rose-600 border-rose-300 animate-pulse" : "text-slate-500 hover:text-slate-800 border-slate-200 hover:bg-slate-200"
                  }`}
                  title="Voice Input"
                >
                  {isListening ? <Mic className="w-4 h-4 text-rose-600" /> : <MicOff className="w-4 h-4" />}
                </button>
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder={t.chatPlaceholder}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 shadow-xs placeholder:text-slate-400"
                />
                <button 
                  type="submit" 
                  disabled={chatLoading} 
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition disabled:opacity-50 cursor-pointer shadow-xs"
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

      <AbhaModal
        isOpen={showAbhaModal}
        onClose={() => setShowAbhaModal(false)}
        documents={documents}
        biomarkers={biomarkers}
        medications={medications}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => fetchDashboardData(sessionUser)}
      />
    </div>
  );
}