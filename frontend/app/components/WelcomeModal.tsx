"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const [activeTab, setActiveTab] = useState<"vision" | "pipeline" | "usecases" | "testing">("vision");
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ai_lead_flow_hide_welcome_v1");
      if (saved === "true") {
        setDontShowAgain(true);
      }
    }
  }, []);

  if (!isOpen) return null;

  const handleClose = () => {
    if (typeof window !== "undefined" && dontShowAgain) {
      localStorage.setItem("ai_lead_flow_hide_welcome_v1", "true");
    } else if (typeof window !== "undefined") {
      localStorage.removeItem("ai_lead_flow_hide_welcome_v1");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0b0f19] border border-amber-500/30 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden">
        {/* Top Glow Accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-600" />

        {/* Modal Header */}
        <div className="p-5 sm:p-7 border-b border-white/[0.08] flex items-start justify-between gap-4 bg-gradient-to-b from-white/[0.02] to-transparent">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] bg-amber-400/10 text-amber-300 border border-amber-400/25">
                Executive Architecture Briefing
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-400 font-medium">Autonomous Sales Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide">
              AI Lead Flow <span className="text-amber-400 font-sans font-light text-base">| System Blueprint</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Real-time inbound lead qualification, deterministic scoring, and omni-channel dispatch engine engineered for premier Dubai real estate brokerages and high-ticket sales pipelines.
            </p>
          </div>

          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 flex items-center justify-center transition-all shrink-0"
            title="Close Guide"
          >
            ✕
          </button>
        </div>

        {/* Interactive Tabs */}
        <div className="flex border-b border-white/[0.08] bg-slate-950/40 px-5 sm:px-7 overflow-x-auto text-xs font-semibold scrollbar-none">
          {[
            { id: "vision", label: "1. Mission & The Problem Solved" },
            { id: "pipeline", label: "2. Autonomous 4-Phase Architecture" },
            { id: "usecases", label: "3. Real-World Enterprise ROI" },
            { id: "testing", label: "4. Live Demo Walkthrough" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3.5 px-4 border-b-2 transition-all shrink-0 ${
                activeTab === tab.id
                  ? "border-amber-400 text-amber-300 font-bold"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-slate-300 text-xs leading-relaxed">
          {/* ================= TAB 1: VISION & PROBLEM ================= */}
          {activeTab === "vision" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Architecture Blueprint Visual Hero */}
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950 group">
                <img
                  src="/architecture-diagram.jpg"
                  alt="AI Lead Flow System Architecture Blueprint"
                  className="w-full h-auto object-cover max-h-[320px] transition-transform duration-500 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60 pointer-events-none" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none">
                  <span className="text-[11px] font-semibold text-slate-200 bg-slate-900/80 backdrop-blur px-3 py-1 rounded-lg border border-white/10">
                    Live Data Flow: Inbound Webhook → GPT-4o Qualification → Discord/Gmail Dispatches
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsImageExpanded(true)}
                    className="pointer-events-auto text-[11px] font-bold text-amber-300 bg-slate-900/90 hover:bg-slate-800 backdrop-blur px-3 py-1 rounded-lg border border-amber-500/30 transition-all flex items-center gap-1.5"
                  >
                    <span>🔍 Full View</span>
                  </button>
                </div>
              </div>

              {/* The Core Industry Problem */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                    <span>⚠️ The Status Quo Problem</span>
                  </div>
                  <p className="text-slate-300">
                    In luxury real estate, <strong>over 60% of prospective buyers go cold</strong> because average agency response times exceed 12 to 24 hours. High-net-worth investors inquiring from London, Singapore, or New York are greeted by generic &quot;We received your inquiry&quot; emails, while sales teams waste hours manually vetting unqualified leads.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <span>✨ The AI Lead Flow Solution</span>
                  </div>
                  <p className="text-slate-300">
                    AI Lead Flow acts as a <strong>24/7 Autonomous Sales Concierge</strong>. In under <strong>5 seconds</strong>, it extracts buyer intent, property type, budget, and urgency, assigns a deterministic 0–100 score, drafts a tailored consultation response, and alerts senior brokers via Discord and Gmail.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: 4-PHASE ARCHITECTURE ================= */}
          {activeTab === "pipeline" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <p className="text-slate-300 text-xs">
                The platform is powered by an orchestrated 18-node production pipeline built in <strong>n8n</strong>, integrated with <strong>OpenAI GPT-4o</strong>, and mirrored in a local <strong>SQLite CRM</strong>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 text-sm">Phase 1: Ingest & Guard</span>
                    <span className="text-[10px] text-slate-500 font-mono">&lt;50ms</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Captures multi-channel inquiries via high-speed Webhook. Performs strict email RFC validation and field normalization. Rejects incomplete or invalid payloads with HTTP 400.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 text-sm">Phase 2: GPT-4o Qualification</span>
                    <span className="text-[10px] text-slate-500 font-mono">1.2s – 2.5s</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Analyzes free-form buyer inquiries. Extracts structured criteria (Property Type, Bedrooms, Budget, Location, Buying Timeline) and calculates a deterministic <strong>0–100 Lead Score</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 text-sm">Phase 3: Human Escalation & Triage</span>
                    <span className="text-[10px] text-slate-500 font-mono">Instant Branch</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    If an inquiry mentions contracts, deposits, legal queries, or requests a senior partner meeting, it instantly branches to <strong>Human Escalation</strong>, pinging the leadership team directly.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 text-sm">Phase 4: Omni-Channel Action</span>
                    <span className="text-[10px] text-slate-500 font-mono">Automated</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Dispatches personalized outbound email to the client, alerts the sales team on Discord with full lead intelligence, and returns an instant on-screen consultation brief.
                  </p>
                </div>
              </div>

              {/* Scoring Rubric Reference */}
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2 mt-4">
                <span className="font-serif font-bold text-amber-300 text-sm block">Deterministic Scoring Rubric</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-emerald-500/20">
                    <strong className="text-emerald-400 block mb-1">HOT (Score 80–100)</strong>
                    Specific budget, clear location, &lt;3 months timeline, or requesting immediate consultation.
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-amber-500/20">
                    <strong className="text-amber-400 block mb-1">WARM (Score 50–79)</strong>
                    Flexible budget, exploratory 3–6 months timeline, general market research.
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                    <strong className="text-slate-400 block mb-1">NURTURE (Score 0–49)</strong>
                    Vague timeline &gt;12 months, unrealistic parameters, automated nurture sequence.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: REAL WORLD USE CASES ================= */}
          {activeTab === "usecases" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏢</span>
                    <h3 className="font-bold text-white text-sm">Dubai Luxury Brokerages (Off-Plan & Secondary)</h3>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Brokerages running millions in Google & Meta ad campaigns receive hundreds of inquiries a day. AI Lead Flow filters out tire-kickers and delivers verified, high-net-worth investors straight to senior closing agents in seconds.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🌍</span>
                    <h3 className="font-bold text-white text-sm">Cross-Border Investor Triage (24/7 Multi-Timezone)</h3>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    When a buyer in Hong Kong or Zurich inquires at 3:00 AM Dubai time, they receive an immediate, professional, highly contextual advisory brief—eliminating the risk of them booking a tour with a competing agency.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚖️</span>
                    <h3 className="font-bold text-white text-sm">Escalation & Risk Management</h3>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Client disputes, payment issues, and legal inquiries are automatically flagged with zero delay. Executive management is notified directly via emergency email and Discord alerts before a complaint escalates.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 4: HOW TO TEST ================= */}
          {activeTab === "testing" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 space-y-3">
                <h3 className="font-bold text-indigo-300 text-sm">Recommended Evaluation Workflow</h3>
                <ol className="list-decimal list-inside space-y-2 text-[11px] text-slate-300 leading-relaxed">
                  <li>
                    <strong>Browse the Curated Portfolio:</strong> Click <em>&quot;Prime Portfolio&quot;</em> in the top navigation, explore Dubai residences, and click <em>&quot;Select for Consultation&quot;</em> to auto-populate your inquiry specs.
                  </li>
                  <li>
                    <strong>Submit an Inquiry:</strong> Enter your contact information and submit the form to experience the &lt;5s live AI qualification.
                  </li>
                  <li>
                    <strong>Review Instant Consultation Brief:</strong> Step 4 renders the personalized AI response generated by the live n8n GPT-4o node.
                  </li>
                  <li>
                    <strong>Inspect Staff CRM:</strong> Visit the <code className="text-amber-300 bg-black/40 px-1.5 py-0.5 rounded">/admin</code> portal to inspect live SQLite records, test pre-built scenario buttons, and view workflow telemetry.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 sm:p-6 border-t border-white/[0.08] bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <label className="flex items-center gap-2.5 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-900 border-white/20 text-amber-500 focus:ring-amber-500/30 cursor-pointer"
            />
            <span>Do not open automatically on next visit</span>
          </label>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto py-2.5 px-6 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 hover:shadow-lg hover:shadow-amber-500/20 transition-all"
            >
              Explore Live Platform →
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Image Modal */}
      {isImageExpanded && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl"
          onClick={() => setIsImageExpanded(false)}
        >
          <div className="relative max-w-6xl w-full max-h-[90vh]">
            <button
              onClick={() => setIsImageExpanded(false)}
              className="absolute -top-12 right-0 text-white hover:text-amber-400 text-sm font-semibold bg-white/10 px-3 py-1 rounded-lg"
            >
              ✕ Close Preview
            </button>
            <img
              src="/architecture-diagram.jpg"
              alt="Expanded Blueprint"
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl border border-white/20 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
