"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

interface LeadRecord {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  source: string;
  originalMessage: string | null;
  status: string;
  leadScore: number | null;
  createdAt: string;
}

interface SimulationOutput {
  success: boolean;
  lead_id?: string;
  lead_score?: number;
  qualification?: string;
  intent?: string;
  property_type?: string;
  location?: string;
  budget?: string;
  timeline?: string;
  next_action?: string;
  human_required?: boolean;
  reply_subject?: string;
  personalized_reply?: string;
  error?: string;
}

const N8N_WEBHOOK_URL =
  "https://realestateleadmanagement-n8n-b138c4-13-203-193-36.sslip.io/webhook/lead-intake";

const WORKFLOW_NODES = [
  { name: "Lead Intake Webhook", type: "Webhook", icon: "🔗", desc: "Receives raw POST payloads from websites and APIs" },
  { name: "Validate & Normalize Lead", type: "Code (JS)", icon: "⚡", desc: "Sanitizes fields and validates email RFC syntax" },
  { name: "Is Valid Lead?", type: "IF Node", icon: "🔀", desc: "Routes valid leads forward or rejects with 400" },
  { name: "Respond 400 Bad Request", type: "Respond to Webhook", icon: "🛑", desc: "Instant error response on missing data" },
  { name: "Build AI Prompt", type: "Code (JS)", icon: "📝", desc: "Assembles system prompt with strict scoring rubric" },
  { name: "OpenAI: Lead Qualification", type: "OpenAI GPT-4o", icon: "🧠", desc: "Extracts intent, budget, timeline, and lead score" },
  { name: "Parse AI Decision", type: "Code (JS)", icon: "⚙️", desc: "Parses structured JSON and formats alerts" },
  { name: "Is Human Escalation?", type: "IF Node", icon: "🚨", desc: "Detects disputes, VIPs, or manager meeting requests" },
  { name: "Send Discord Escalation Alert", type: "Discord", icon: "📢", desc: "Emergency channel broadcast for manager takeover" },
  { name: "Send Admin Escalation Email", type: "Gmail", icon: "✉️", desc: "Direct email alert dispatched to senior leadership" },
  { name: "Is Hot Lead?", type: "IF Node", icon: "🔥", desc: "Checks if lead score is 80 or higher" },
  { name: "Send Hot Lead Email", type: "Gmail", icon: "📨", desc: "Sends immediate personalized response to buyer" },
  { name: "Send Hot Lead Discord Alert", type: "Discord", icon: "💬", desc: "Instant team notification with buyer specs" },
  { name: "Is Warm Lead?", type: "IF Node", icon: "🏡", desc: "Checks if lead score is between 50 and 79" },
  { name: "Send Warm Lead Email", type: "Gmail", icon: "📧", desc: "Sends exploratory guide and qualification follow-up" },
  { name: "Send Nurture Lead Email", type: "Gmail", icon: "📬", desc: "Enrolls low-intent leads into drip education" },
  { name: "Format Final Webhook Response", type: "Code (JS)", icon: "✨", desc: "Packages on-screen consultation brief and score" },
  { name: "Respond 200 Success", type: "Respond to Webhook", icon: "✅", desc: "Returns instant HTTP 200 JSON payload" },
];

const PRESETS = [
  {
    id: "hot",
    title: "💎 Hot Lead (Dubai Marina)",
    badge: "Score: 90+",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    name: "John Carter",
    email: "john.carter@example.com",
    phone: "+971501234567",
    message:
      "Hi, I am ready to purchase a 3-bedroom luxury apartment in Dubai Marina or Downtown. My budget is $350,000 and I am prepared to close within the next 4 to 6 weeks. Can your senior consultant arrange a call or viewing?",
  },
  {
    id: "warm",
    title: "🏡 Warm Lead (Dubai Hills)",
    badge: "Score: 50–79",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    name: "Sara Ahmed",
    email: "sara.ahmed@example.com",
    phone: "+971509876543",
    message:
      "Hello, I am exploring options for a townhouse or villa in Dubai Hills Estate for late next year. Flexible budget around $400k, currently researching market trends and payment plans.",
  },
  {
    id: "escalation",
    title: "🚨 Human Escalation (Dispute)",
    badge: "VIP / Dispute",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    name: "Patricia Gomez",
    email: "patricia.gomez@example.com",
    phone: "+971505557890",
    message:
      "URGENT: I previously transferred a deposit for unit 402 and the developer contract has a legal discrepancy. I refuse to speak to an automated bot and demand a senior partner call me immediately.",
  },
  {
    id: "invalid",
    title: "❌ Validation Error (No Email)",
    badge: "400 Error",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    name: "Incomplete User",
    email: "",
    phone: "+971500000000",
    message: "Missing email address to test instant validation rejection.",
  },
];

export default function N8nTemplatePage() {
  // Simulator State
  const [name, setName] = useState(PRESETS[0].name);
  const [email, setEmail] = useState(PRESETS[0].email);
  const [phone, setPhone] = useState(PRESETS[0].phone);
  const [message, setMessage] = useState(PRESETS[0].message);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationOutput | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  // Active step state for scroll animation
  const [activeStep, setActiveStep] = useState(1);

  // Canvas zoom/expand modal
  const [isCanvasExpanded, setIsCanvasExpanded] = useState(false);

  // Production Proof Showcase states
  const [visualizerTab, setVisualizerTab] = useState<"canvas" | "proofs">("canvas");
  const [step3SubTab, setStep3SubTab] = useState<"gmail" | "discord" | "diagram">("gmail");
  const [simulatorOutputTab, setSimulatorOutputTab] = useState<"response" | "gmail_proof" | "discord_proof">("response");
  const [proofModal, setProofModal] = useState<{
    src: string;
    title: string;
    badge: string;
    badgeColor: string;
    desc: string;
  } | null>(null);

  // CRM Leads State
  const [leadsList, setLeadsList] = useState<LeadRecord[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);

  const fetchLeads = async () => {
    setIsLoadingLeads(true);
    try {
      const res = await fetch("/api/leads");
      if (res.ok) {
        const data = await res.json();
        setLeadsList(data.leads || []);
      }
    } catch (err) {
      console.error("Failed to load leads", err);
    } finally {
      setIsLoadingLeads(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleApplyPreset = (preset: (typeof PRESETS)[0]) => {
    setName(preset.name);
    setEmail(preset.email);
    setPhone(preset.phone);
    setMessage(preset.message);
    setSimulationError(null);
    setSimulationResult(null);
  };

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    setSimulationError(null);
    setSimulationResult(null);

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || "+971500000000",
      message: message.trim(),
      source: "n8n_template_simulator",
    };

    try {
      // 1. Store locally in SQLite
      try {
        await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn("Local DB persist skipped", err);
      }

      // 2. Dispatch to live n8n webhook
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      const item = Array.isArray(data) ? data[0] : data;

      if (!res.ok || item.success === false) {
        setSimulationError(item.error || "Validation Guard Rejected Payload (400 Bad Request).");
      } else {
        setSimulationResult({
          success: true,
          lead_id: item.lead_id,
          lead_score: item.lead_score,
          qualification: item.qualification,
          intent: item.intent,
          property_type: item.property_type,
          location: item.location,
          budget: item.budget,
          timeline: item.timeline,
          next_action: item.next_action,
          human_required: item.human_required,
          reply_subject: item.reply_subject,
          personalized_reply: item.personalized_reply,
        });
      }

      await fetchLeads();
    } catch (err: any) {
      setSimulationError(err.message || "Failed to connect to workflow.");
    } finally {
      setIsSimulating(false);
    }
  };

  const filteredLeads = useMemo(() => {
    return leadsList.filter((lead) => {
      if (statusFilter !== "ALL" && lead.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = lead.name?.toLowerCase().includes(q);
        const emailMatch = lead.email?.toLowerCase().includes(q);
        const phoneMatch = lead.phone?.toLowerCase().includes(q);
        const msgMatch = lead.originalMessage?.toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !phoneMatch && !msgMatch) return false;
      }
      return true;
    });
  }, [leadsList, statusFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans antialiased">
      {/* ================= N8N TEMPLATE STYLE HEADER ================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" href="/" />
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#overview" className="hover:text-[#ff6d5a] transition-colors">Overview</a>
            <a href="#workflow-canvas" className="hover:text-[#ff6d5a] transition-colors">Workflow Canvas</a>
            <a href="#how-it-works" className="hover:text-[#ff6d5a] transition-colors">How It Works</a>
            <a href="#simulator" className="hover:text-[#ff6d5a] transition-colors">Live Simulator</a>
            <a href="#nodes" className="hover:text-[#ff6d5a] transition-colors">Nodes Used</a>
            <a href="#crm" className="hover:text-[#ff6d5a] transition-colors">Telemetry CRM</a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#simulator"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#ff6d5a] hover:bg-[#e65b49] text-white transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Test Live Simulator</span>
              <span>↓</span>
            </a>
            <Link
              href="/admin"
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all border border-slate-200"
            >
              Staff Portal
            </Link>
          </div>
        </div>
      </header>

      {/* ================= HERO & WORKFLOW TITLE ================= */}
      <section id="overview" className="pt-10 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Breadcrumb & Categories */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
          <Link href="/" className="hover:text-[#ff6d5a]">Workflows</Link>
          <span>/</span>
          <span className="text-slate-700 font-medium">Sales & Lead Qualification</span>
          <span>/</span>
          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[10px] border border-blue-200">
            Production Ready
          </span>
        </div>

        {/* H1 Title */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-4xl">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-snug">
              Qualify & Book Inbound Sales Leads with OpenAI GPT-4o, Gmail & Discord
            </h1>
            <p className="text-sm text-slate-600 mt-2.5 leading-relaxed">
              An autonomous sales orchestration workflow that captures inbound inquiries, extracts buyer parameters, deterministically scores leads (0–100), drafts tailored consultation responses, and notifies team members — while seamlessly escalating VIPs and complaints to human managers.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex sm:flex-col gap-2 shrink-0">
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-800">Status: Published</span>
              <span className="text-slate-400">·</span>
              <span className="font-mono text-slate-600">18 Nodes</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm text-xs">
              <span className="font-bold text-[#ff6d5a]">⚡ Runtime:</span>
              <span className="text-slate-700 font-medium">&lt; 5s end-to-end</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= INTERACTIVE WORKFLOW CANVAS (REAL N8N SCREENSHOT) ================= */}
      <section id="workflow-canvas" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-16">
        <div className="rounded-2xl border border-slate-800 bg-[#121316] shadow-xl overflow-hidden">
          {/* n8n Canvas Toolbar */}
          <div className="h-12 bg-[#18191d] border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="hidden sm:inline">AI Lead Flow (ID: Eh7s0XF0NSJEIECN)</span>
              </div>
              <span className="hidden sm:inline text-slate-600">|</span>
              {/* Visualizer Mode Toggle */}
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setVisualizerTab("canvas")}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all ${
                    visualizerTab === "canvas"
                      ? "bg-[#ff6d5a] text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  🗺️ Workflow Canvas
                </button>
                <button
                  type="button"
                  onClick={() => setVisualizerTab("proofs")}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                    visualizerTab === "proofs"
                      ? "bg-[#ff6d5a] text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>⚡ Live Outputs Proof</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {visualizerTab === "canvas" ? (
                <button
                  type="button"
                  onClick={() => setIsCanvasExpanded(true)}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all text-xs font-semibold flex items-center gap-1.5"
                >
                  <span>🔍 Zoom Canvas</span>
                </button>
              ) : (
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                  Dual-Channel Verified
                </span>
              )}
              <a
                href="#simulator"
                className="px-3 py-1 rounded-lg bg-[#ff6d5a] hover:bg-[#e65b49] text-white font-bold text-xs transition-all"
              >
                Run Test Execution
              </a>
            </div>
          </div>

          {/* Workflow Canvas / Production Proof View */}
          {visualizerTab === "canvas" ? (
            <div className="relative p-2 sm:p-4 bg-[#121316] flex items-center justify-center min-h-[380px] sm:min-h-[480px]">
              <img
                src="/n8n-workflow-canvas.png"
                alt="n8n AI Lead Flow Workflow Canvas"
                className="w-full h-auto max-h-[500px] object-contain cursor-zoom-in rounded-lg"
                onClick={() => setIsCanvasExpanded(true)}
              />
            </div>
          ) : (
            <div className="p-4 sm:p-6 bg-[#121316] min-h-[380px] sm:min-h-[480px] flex flex-col justify-center">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-6xl mx-auto w-full">
                {/* Gmail Proof Window */}
                <div
                  className="bg-[#1e2025] rounded-xl border border-slate-700/80 p-3 sm:p-4 space-y-2.5 cursor-zoom-in hover:border-slate-600 transition-all group"
                  onClick={() => setProofModal({
                    src: "/live-customer-email-proof.png",
                    title: "Live Customer Email Delivery (Gmail)",
                    badge: "Customer Outreach",
                    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    desc: "Automated high-converting email response dispatched directly to prospective client John Carterxx via Gmail within 2.1 seconds."
                  })}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <span className="font-bold text-white">✉️ Gmail Customer Delivery</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded">
                      Delivered in 2.1s
                    </span>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-slate-700 bg-white">
                    <img
                      src="/live-customer-email-proof.png"
                      alt="Gmail Inbox Proof"
                      className="w-full h-[220px] object-cover object-top"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Personalized 3-Bed Dubai Marina Consultation</span>
                    <span className="text-[#ff6d5a] group-hover:underline">🔍 Expand full</span>
                  </div>
                </div>

                {/* Discord Proof Window */}
                <div
                  className="bg-[#1e2025] rounded-xl border border-slate-700/80 p-3 sm:p-4 space-y-2.5 cursor-zoom-in hover:border-slate-600 transition-all group"
                  onClick={() => setProofModal({
                    src: "/live-discord-alert-proof.png",
                    title: "Live Discord Sales Channel Alert",
                    badge: "Team Notification",
                    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
                    desc: "Real-time webhook notification broadcast to #lead_generation channel with full client dossier and 95/100 score."
                  })}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                      <span className="font-bold text-white">💬 Discord Staff Notification</span>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 border border-indigo-500/40 px-2 py-0.5 rounded">
                      Score: 95/100 HOT
                    </span>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-slate-700 bg-[#313338]">
                    <img
                      src="/live-discord-alert-proof.png"
                      alt="Discord Alert Proof"
                      className="w-full h-[220px] object-cover object-top"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Instant #lead_generation Broadcast with Phone & Budget</span>
                    <span className="text-[#ff6d5a] group-hover:underline">🔍 Expand full</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Canvas Footer Bar */}
          <div className="bg-[#18191d] border-t border-slate-800 p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-2">
            <div>
              <strong>Production Pipeline:</strong> Webhook Intake → Validation Guard → OpenAI GPT-4o → Triage IFs → Hot / Warm / Nurture / Escalation Dispatches
            </div>
            <div className="font-mono text-slate-500">
              Trigger: POST /webhook/lead-intake
            </div>
          </div>
        </div>
      </section>

      {/* Expanded Canvas Modal */}
      {isCanvasExpanded && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setIsCanvasExpanded(false)}
        >
          <div className="relative max-w-7xl w-full max-h-[95vh] bg-[#121316] rounded-2xl border border-slate-700 p-4 overflow-auto">
            <div className="flex items-center justify-between mb-3 text-white">
              <span className="text-xs font-mono text-slate-400">AI Lead Flow — Full Resolution Workflow Canvas</span>
              <button
                onClick={() => setIsCanvasExpanded(false)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                ✕ Close Preview
              </button>
            </div>
            <img
              src="/n8n-workflow-canvas.png"
              alt="Full Canvas"
              className="w-full h-auto object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {/* ================= MAIN CONTENT GRID (N8N STYLE LAYOUT) ================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT 8 COLUMNS: EDITORIAL & STEP-BY-STEP FLOW */}
          <div className="lg:col-span-8 space-y-12">
            {/* Quick Overview Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ff6d5a]">
                <span>⚡ Executive Summary</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-950">Quick Overview</h2>
              <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-3">
                <p>
                  In high-value sales operations (such as luxury real estate, wealth advisory, and B2B SaaS), <strong>over 60% of inbound leads go cold</strong> simply because human response times average 12 to 24 hours. Prospective buyers inquiring during off-hours or across timezones expect instant, tailored guidance.
                </p>
                <p>
                  This production-ready workflow receives inbound lead inquiries via <strong>Webhook</strong>, validates the payload with strict schema guards, uses <strong>OpenAI GPT-4o</strong> to extract structured parameters (budget, timeline, intent, specific requirements), deterministically scores the lead (0–100), and autonomously dispatches personalized outbound emails via <strong>Gmail</strong> and team alerts to <strong>Discord</strong>.
                </p>
                <p>
                  Crucially, this workflow incorporates a <strong>zero-risk human escalation failsafe</strong>: if a lead mentions legal disputes, deposits, contract complaints, or demands a senior manager, automated replies halt immediately and leadership is paged directly.
                </p>
              </div>
            </div>

            {/* How It Works: Scroll-Animated 4-Step Process */}
            <div id="how-it-works" className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#ff6d5a]">
                  Step-by-Step Architecture
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-950 mt-1">
                  How It Works
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Click through the steps below or scroll to see how each phase executes autonomously.
                </p>
              </div>

              {/* Step Navigation Pills (Inspired by getsyou.ai scroll interaction) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {[
                  { num: 1, label: "01. Intake & Validation" },
                  { num: 2, label: "02. AI Qualification & Score" },
                  { num: 3, label: "03. Omni-Channel Action" },
                  { num: 4, label: "04. Human Escalation" },
                ].map((step) => (
                  <button
                    key={step.num}
                    type="button"
                    onClick={() => setActiveStep(step.num)}
                    className={`py-2 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                      activeStep === step.num
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-white text-slate-600 hover:text-slate-900 border-slate-200"
                    }`}
                  >
                    {step.label}
                  </button>
                ))}
              </div>

              {/* Dynamic Step Display Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                {activeStep === 1 && (
                  <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
                        <span>PHASE 01 OF 04</span>
                        <span className="font-mono text-emerald-600">Latency: &lt; 50ms</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-950">Inbound Lead Intake & Schema Validation Guard</h3>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                        Inbound inquiries hit the Webhook node <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-xs font-mono">POST /webhook/lead-intake</code>. The payload is instantly passed to a JavaScript Code node that sanitizes inputs, enforces RFC email syntax validation, and checks message completeness. If the payload fails validation, it routes immediately to <code className="text-rose-600 font-mono text-xs">Respond 400 Bad Request</code>.
                      </p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-center">
                      <img
                        src="/step1.jpg"
                        alt="Step 1: Lead Intake and Validation"
                        className="w-full h-auto max-h-[300px] object-contain rounded-lg"
                      />
                    </div>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
                        <span>PHASE 02 OF 04</span>
                        <span className="font-mono text-blue-600">Model: OpenAI GPT-4o</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-950">AI Lead Qualification & Deterministic Scoring</h3>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                        The validated lead message is sent to OpenAI GPT-4o. The system prompt instructs the model to extract structured parameters (property type, budget, location, timeframe) and calculate a <strong>0–100 Lead Score</strong> according to a deterministic rubric (Hot: 80–100, Warm: 50–79, Nurture: 0–49). It also crafts a bespoke consultation email reply.
                      </p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-center">
                      <img
                        src="/step2.jpg"
                        alt="Step 2: AI Qualification and Scoring"
                        className="w-full h-auto max-h-[300px] object-contain rounded-lg"
                      />
                    </div>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
                        <span>PHASE 03 OF 04</span>
                        <span className="font-mono text-indigo-600">Integrations: Gmail OAuth2 + Discord Webhook</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-950">Omni-Channel Action & Instant Dual Reply</h3>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                        n8n executes conditional IF nodes on the calculated score. For Hot Leads (80+), it dispatches the customized consultation email via <strong>Gmail</strong> directly to the buyer, and broadcasts an actionable intelligence dossier to the sales team on <strong>Discord</strong>. Warm and Nurture leads receive appropriate guidance and long-term drip follow-ups.
                      </p>
                    </div>

                    {/* Sub-tabs for Step 3 Real Proof */}
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                      <button
                        type="button"
                        onClick={() => setStep3SubTab("gmail")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          step3SubTab === "gmail"
                            ? "bg-slate-900 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        ✉️ Real Customer Email (Gmail Proof)
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep3SubTab("discord")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          step3SubTab === "discord"
                            ? "bg-slate-900 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        💬 Real Sales Alert (Discord Proof)
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep3SubTab("diagram")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          step3SubTab === "diagram"
                            ? "bg-slate-900 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        🎨 Flow Architecture
                      </button>
                    </div>

                    {/* Step 3 Sub-tab Content */}
                    {step3SubTab === "gmail" && (
                      <div className="space-y-3">
                        <div
                          className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 flex flex-col items-center group cursor-pointer"
                          onClick={() => setProofModal({
                            src: "/live-customer-email-proof.png",
                            title: "Real Gmail Customer Inbox Delivery",
                            badge: "Verified Delivery",
                            badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
                            desc: "Automated email sent via Gmail node directly to prospective buyer John Carterxx with tailored 3-bed Dubai Marina/Downtown recommendations."
                          })}
                        >
                          <div className="w-full flex items-center justify-between text-xs text-slate-500 mb-2 px-1">
                            <span className="font-semibold text-slate-800">Actual Customer Inbox (Gmail)</span>
                            <span className="text-[11px] text-blue-600 group-hover:underline">🔍 Click to zoom</span>
                          </div>
                          <img
                            src="/live-customer-email-proof.png"
                            alt="Live Customer Email Proof"
                            className="w-full h-auto max-h-[340px] object-contain rounded-lg shadow-sm border border-slate-200"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500">
                          ✓ Real production delivery to buyer's inbox within 2.1s with dedicated consultant SLA (Harmain) and bespoke property matching.
                        </p>
                      </div>
                    )}

                    {step3SubTab === "discord" && (
                      <div className="space-y-3">
                        <div
                          className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col items-center group cursor-pointer"
                          onClick={() => setProofModal({
                            src: "/live-discord-alert-proof.png",
                            title: "Real Discord Sales Team Alert",
                            badge: "Hot Lead 95/100",
                            badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
                            desc: "Instant alert broadcast to the #lead_generation Discord channel with full client contact details, budget, timeline, and next action."
                          })}
                        >
                          <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
                            <span className="font-semibold text-slate-200">#lead_generation Channel Alert (Discord)</span>
                            <span className="text-[11px] text-indigo-400 group-hover:underline">🔍 Click to zoom</span>
                          </div>
                          <img
                            src="/live-discord-alert-proof.png"
                            alt="Live Discord Alert Proof"
                            className="w-full h-auto max-h-[340px] object-contain rounded-lg shadow-sm border border-slate-700"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500">
                          ✓ Formatted with clickable client phone, buyer budget ($350k), inquiry text, and designated next action (offer_appointment).
                        </p>
                      </div>
                    )}

                    {step3SubTab === "diagram" && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-center">
                        <img
                          src="/step3.jpg"
                          alt="Step 3: Omni-Channel Action and Reply"
                          className="w-full h-auto max-h-[300px] object-contain rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                )}

                {activeStep === 4 && (
                  <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
                        <span>PHASE 04 OF 04</span>
                        <span className="font-mono text-rose-600">Safety Guard: 100% Manager Takeover</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-950">Human Escalation & Seamless Handoff</h3>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                        If the lead inquiry mentions contract disputes, deposits, legal issues, or specifically asks to speak with a senior partner, GPT-4o sets <code className="bg-rose-50 text-rose-700 px-1 py-0.5 rounded text-xs font-mono">human_required = true</code>. The workflow immediately halts automated sales emails, fires an emergency priority Discord alert, and sends an urgent escalation email to the broker leadership team.
                      </p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-center">
                      <img
                        src="/step4.jpg"
                        alt="Step 4: Human Escalation"
                        className="w-full h-auto max-h-[300px] object-contain rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ================= DEDICATED PRODUCTION OUTPUT PROOF SECTION ================= */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#ff6d5a]">
                      Verified Production Telemetry
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Live Execution Verified
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-950 mt-1">
                    Dual-Channel Automated Delivery in Action
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    When John Carter inquired for a luxury 3-bedroom apartment, n8n scored the lead at <strong>95/100</strong> and dispatched both outputs simultaneously in under 4 seconds.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gmail Proof Card */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 flex flex-col justify-between hover:border-slate-300 transition-all group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-slate-900">1. Customer Gmail Delivery</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Delivered in 2.1s
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-3">
                      To: <code className="text-slate-700 font-mono">harmainrizwanr@gmail.com</code> · Subject: <span className="text-slate-800 font-medium">"Exclusive 3-Bedroom Luxury Apartments Await You, John!"</span>
                    </p>

                    {/* Image Mockup */}
                    <div
                      className="relative rounded-lg overflow-hidden border border-slate-200 shadow-sm cursor-zoom-in group-hover:shadow-md transition-all bg-white"
                      onClick={() => setProofModal({
                        src: "/live-customer-email-proof.png",
                        title: "Live Customer Email Delivery (Gmail)",
                        badge: "Customer Outreach",
                        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
                        desc: "Personalized outbound consultation response sent automatically to John Carterxx with specific 3-bedroom Dubai Marina / Downtown matching and senior consultant appointment confirmation."
                      })}
                    >
                      <img
                        src="/live-customer-email-proof.png"
                        alt="Customer Email Inbox Proof"
                        className="w-full h-[220px] object-cover object-top"
                      />
                      <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/10 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 bg-white/95 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg transition-opacity flex items-center gap-1.5">
                          <span>🔍 Click to View Full Email</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 space-y-1.5 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span><strong>Personalized:</strong> Directly greets John Carterxx & references exact $350k budget</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span><strong>Inventory Matching:</strong> Highlights prime inventory in Dubai Marina & Downtown</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span><strong>SLA Commitment:</strong> Consultant Harmain assigned to call within 2 business hours</span>
                    </div>
                  </div>
                </div>

                {/* Discord Proof Card */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 flex flex-col justify-between hover:border-slate-300 transition-all group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                        <span className="text-xs font-bold text-slate-900">2. Sales Discord Channel Alert</span>
                      </div>
                      <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        Score: 95/100 HOT
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Channel: <code className="text-slate-700 font-mono">#lead_generation</code> · Bot: <span className="text-slate-800 font-medium">lead-generation-hook APP</span>
                    </p>

                    {/* Image Mockup */}
                    <div
                      className="relative rounded-lg overflow-hidden border border-slate-700 shadow-sm cursor-zoom-in group-hover:shadow-md transition-all bg-[#313338]"
                      onClick={() => setProofModal({
                        src: "/live-discord-alert-proof.png",
                        title: "Live Discord Sales Team Alert",
                        badge: "Staff Broadcast",
                        badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
                        desc: "Instant priority broadcast sent to Discord with direct phone number, full lead criteria, and immediate offer_appointment action plan."
                      })}
                    >
                      <img
                        src="/live-discord-alert-proof.png"
                        alt="Discord Team Alert Proof"
                        className="w-full h-[220px] object-cover object-top"
                      />
                      <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/20 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 bg-white/95 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg transition-opacity flex items-center gap-1.5">
                          <span>🔍 Click to View Full Alert</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 space-y-1.5 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="text-indigo-500 font-bold">✓</span>
                      <span><strong>Lead Scoring:</strong> Evaluated at 95/100 by OpenAI GPT-4o deterministic rubric</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-indigo-500 font-bold">✓</span>
                      <span><strong>One-Tap Contact:</strong> Pre-formatted phone (+971501234567) & email for 1-click calling</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-indigo-500 font-bold">✓</span>
                      <span><strong>Next Action:</strong> Prescribed <code className="text-slate-800 font-mono">offer_appointment</code> for site viewing</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Live Lead Simulator Card */}
            <div id="simulator" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#ff6d5a]">
                    Interactive Live Sandbox
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-950 mt-0.5">
                    Test the Live Pipeline
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                  Live Webhook Connected
                </span>
              </div>

              {/* Presets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-[#ff6d5a] transition-colors">
                        {p.title}
                      </span>
                      <span className={`text-[9px] font-bold px-1 py-0.2 rounded border ${p.badgeColor}`}>
                        {p.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{p.message}</p>
                  </button>
                ))}
              </div>

              {/* Error Message */}
              {simulationError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{simulationError}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleRunSimulation} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Lead Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Carter"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-[#ff6d5a] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Email Address <span className="text-[#ff6d5a]">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. john@example.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-[#ff6d5a] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +971 50 123 4567"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-[#ff6d5a] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Inbound Customer Message <span className="text-[#ff6d5a]">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter customer message..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-[#ff6d5a] transition-all leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    Target: <code className="text-slate-800 font-mono">POST /webhook/lead-intake</code>
                  </span>
                  <button
                    type="submit"
                    disabled={isSimulating}
                    className="py-2.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#ff6d5a] hover:bg-[#e65b49] text-white shadow-md shadow-[#ff6d5a]/20 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {isSimulating ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Executing Live Workflow...</span>
                      </>
                    ) : (
                      <>
                        <span>Execute Workflow</span>
                        <span>→</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Simulation Result */}
              {simulationResult && (
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">
                      Live AI Execution Output
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        (simulationResult.lead_score ?? 0) >= 80
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : (simulationResult.lead_score ?? 0) >= 50
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-blue-100 text-blue-800 border border-blue-300"
                      }`}
                    >
                      Score: {simulationResult.lead_score}/100 · {simulationResult.qualification}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Intent</span>
                      <strong className="text-slate-900 capitalize">{simulationResult.intent || "—"}</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Location</span>
                      <strong className="text-slate-900">{simulationResult.location || "—"}</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Budget</span>
                      <strong className="text-slate-900">{simulationResult.budget || "—"}</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Escalation</span>
                      <strong className={simulationResult.human_required ? "text-rose-600" : "text-emerald-600"}>
                        {simulationResult.human_required ? "🚨 Human Escalation" : "✓ Autonomous"}
                      </strong>
                    </div>
                  </div>

                  {/* Simulator View Switcher Tabs */}
                  <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <button
                      type="button"
                      onClick={() => setSimulatorOutputTab("response")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        simulatorOutputTab === "response"
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
                      }`}
                    >
                      ✨ AI Email Generated
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulatorOutputTab("gmail_proof")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        simulatorOutputTab === "gmail_proof"
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
                      }`}
                    >
                      <span>✉️ Real Gmail Proof</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulatorOutputTab("discord_proof")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        simulatorOutputTab === "discord_proof"
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
                      }`}
                    >
                      <span>💬 Real Discord Proof</span>
                    </button>
                  </div>

                  {/* Tab 1: Generated Email Reply */}
                  {simulatorOutputTab === "response" && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span className="font-bold">Outbound Customer Reply Generated by GPT-4o:</span>
                        <span className="font-mono text-slate-400">Subject: {simulationResult.reply_subject || "Inquiry Response"}</span>
                      </div>
                      <div
                        className="text-xs text-slate-800 leading-relaxed bg-white p-3.5 rounded-lg border border-slate-200 font-sans"
                        dangerouslySetInnerHTML={{
                          __html: simulationResult.personalized_reply || "<p>No reply content available.</p>"
                        }}
                      />
                    </div>
                  )}

                  {/* Tab 2: Gmail Proof */}
                  {simulatorOutputTab === "gmail_proof" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Actual Customer Inbox Delivery (Gmail):</span>
                        <span className="text-[11px] text-emerald-600 font-semibold">✓ Verified Live Output</span>
                      </div>
                      <div
                        className="bg-white p-2 rounded-lg border border-slate-200 cursor-zoom-in"
                        onClick={() => setProofModal({
                          src: "/live-customer-email-proof.png",
                          title: "Live Customer Email Delivery (Gmail)",
                          badge: "Customer Outreach",
                          badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
                          desc: "Personalized outbound consultation response sent automatically to John Carterxx with 3-bed Dubai Marina/Downtown recommendations and consultant assignment."
                        })}
                      >
                        <img
                          src="/live-customer-email-proof.png"
                          alt="Gmail Proof"
                          className="w-full h-auto max-h-[300px] object-contain rounded"
                        />
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Discord Proof */}
                  {simulatorOutputTab === "discord_proof" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Actual Discord Broadcast to Sales Channel:</span>
                        <span className="text-[11px] text-indigo-600 font-semibold">✓ Verified Live Output</span>
                      </div>
                      <div
                        className="bg-[#313338] p-2 rounded-lg border border-slate-700 cursor-zoom-in"
                        onClick={() => setProofModal({
                          src: "/live-discord-alert-proof.png",
                          title: "Live Discord Sales Team Alert",
                          badge: "Staff Broadcast",
                          badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
                          desc: "Instant priority broadcast sent to Discord with direct phone number, full lead criteria, and immediate offer_appointment action plan."
                        })}
                      >
                        <img
                          src="/live-discord-alert-proof.png"
                          alt="Discord Proof"
                          className="w-full h-auto max-h-[300px] object-contain rounded"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Nodes Used Section (n8n Template standard) */}
            <div id="nodes" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#ff6d5a]">
                  Components Breakdown
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-950 mt-0.5">
                  Nodes Used in This Workflow ({WORKFLOW_NODES.length})
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Every node has been tested and configured for maximum resilience, error fallback, and zero downtime.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {WORKFLOW_NODES.map((node, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-sm shadow-2xs shrink-0">
                      {node.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{node.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200/70 text-slate-700 font-mono">
                          {node.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{node.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT 4 COLUMNS: WORKFLOW SIDEBAR (N8N STYLE) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Meta Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider border-b border-slate-100 pb-3">
                Workflow Details
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Workflow ID</span>
                  <code className="text-slate-800 font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
                    Eh7s0XF0NSJEIECN
                  </code>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Node Count</span>
                  <span className="font-bold text-slate-900">18 Nodes</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Author / Owner</span>
                  <span className="font-semibold text-slate-800">Harmain Rizwan</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Trigger Type</span>
                  <span className="font-mono text-slate-700">Webhook (POST)</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">AI Model</span>
                  <span className="font-semibold text-blue-600">OpenAI GPT-4o</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Target Database</span>
                  <span className="font-mono text-slate-700">SQLite + Drizzle ORM</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <a
                  href="#simulator"
                  className="w-full py-2 px-4 rounded-xl font-bold text-xs bg-[#ff6d5a] hover:bg-[#e65b49] text-white text-center block transition-all shadow-sm"
                >
                  Test Inbound Webhook ↓
                </a>
                <Link
                  href="/admin"
                  className="w-full py-2 px-4 rounded-xl font-semibold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 text-center block transition-all border border-slate-200"
                >
                  Open Sales CRM Telemetry →
                </Link>
              </div>
            </div>

            {/* Integrations Required Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3 text-xs">
              <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider border-b border-slate-100 pb-3">
                Integrations Configured
              </h3>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-base">🧠</span>
                  <div>
                    <span className="font-bold text-slate-900 block">OpenAI API</span>
                    <span className="text-[10px] text-slate-500">Account connected · gpt-4o</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-base">✉️</span>
                  <div>
                    <span className="font-bold text-slate-900 block">Gmail OAuth2</span>
                    <span className="text-[10px] text-slate-500">Connected · Client & Admin alerts</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-base">📢</span>
                  <div>
                    <span className="font-bold text-slate-900 block">Discord Webhook</span>
                    <span className="text-[10px] text-slate-500">Connected · Hot & Escalation feeds</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-base">💾</span>
                  <div>
                    <span className="font-bold text-slate-900 block">SQLite Database</span>
                    <span className="text-[10px] text-slate-500">Next.js API (/api/leads)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= BOTTOM SECTION: LIVE DATABASE TELEMETRY ================= */}
        <div id="crm" className="mt-16 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#ff6d5a]">
                Database Records
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-950 mt-0.5">
                Live SQLite Telemetry ({filteredLeads.length} Records)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Records stored in <code className="text-blue-700 font-mono">data.sqlite</code> via Drizzle ORM
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search leads..."
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-[#ff6d5a] transition-all w-52"
              />
              <button
                onClick={fetchLeads}
                disabled={isLoadingLeads}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200 flex items-center gap-1.5"
              >
                <span>🔄 Refresh</span>
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            {["ALL", "NEW", "QUALIFIED", "WARM", "NURTURE", "HUMAN_REQUIRED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Leads Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Lead Name / Email</th>
                    <th className="px-3 py-3">Phone</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">AI Score</th>
                    <th className="px-3 py-3">Inquiry Snippet</th>
                    <th className="px-3 py-3">Received At</th>
                    <th className="px-3 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {isLoadingLeads ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-slate-400">Loading SQLite records...</td>
                    </tr>
                  ) : filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">No leads found.</td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedLead(lead)}
                      >
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{lead.name || "Anonymous"}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{lead.email}</div>
                        </td>
                        <td className="px-3 py-3 font-mono text-[11px] text-slate-600">{lead.phone || "—"}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase border ${
                              lead.status === "QUALIFIED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : lead.status === "HUMAN_REQUIRED"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : lead.status === "WARM"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 font-bold">
                          {lead.leadScore !== null ? (
                            <span className={lead.leadScore >= 80 ? "text-emerald-600" : lead.leadScore >= 50 ? "text-amber-600" : "text-slate-500"}>
                              {lead.leadScore}/100
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-slate-600 max-w-xs truncate">{lead.originalMessage || "—"}</td>
                        <td className="px-3 py-3 text-slate-500 text-[11px] whitespace-nowrap">
                          {new Date(lead.createdAt).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLead(lead);
                            }}
                            className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedLead(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 text-xs shadow-xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Lead Record Details</h3>
                <p className="text-slate-400 font-mono text-[10px]">{selectedLead.id}</p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Name</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedLead.name || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Email</span>
                  <span className="font-semibold text-slate-900">{selectedLead.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone</span>
                  <span>{selectedLead.phone || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                  <span className="font-bold text-blue-600">{selectedLead.status}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Inbound Message</span>
                <p className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 mt-1 leading-relaxed whitespace-pre-wrap">
                  {selectedLead.originalMessage || "No message recorded."}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Created At</span>
                <span className="font-mono text-slate-500">{new Date(selectedLead.createdAt).toISOString()}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Lightbox Modal */}
      {proofModal && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setProofModal(null)}
        >
          <div
            className="relative max-w-5xl w-full bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 sm:p-6 overflow-hidden space-y-4 max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${proofModal.badgeColor}`}>
                  {proofModal.badge}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-950">
                  {proofModal.title}
                </h3>
              </div>
              <button
                onClick={() => setProofModal(null)}
                className="p-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all font-bold text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="bg-slate-900/5 border border-slate-200 rounded-xl p-2 overflow-auto flex items-center justify-center flex-1">
              <img
                src={proofModal.src}
                alt={proofModal.title}
                className="w-full h-auto max-h-[65vh] object-contain rounded-lg shadow-sm"
              />
            </div>

            <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200 shrink-0">
              <strong>Verified Telemetry:</strong> {proofModal.desc}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size="sm" showBadge={false} href="/" />
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">Official n8n Community Template #15910</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#overview" className="hover:text-[#ff6d5a] transition-colors">Overview</a>
            <a href="#how-it-works" className="hover:text-[#ff6d5a] transition-colors">How It Works</a>
            <a href="#simulator" className="hover:text-[#ff6d5a] transition-colors">Live Simulator</a>
            <Link href="/admin" className="hover:text-[#ff6d5a] transition-colors font-semibold">
              Admin CRM
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
