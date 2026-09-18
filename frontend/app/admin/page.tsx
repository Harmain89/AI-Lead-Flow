"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface LeadRecord {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  source: string;
  originalMessage: string | null;
  intent: string | null;
  requirements: any;
  budget: number | null;
  currency: string | null;
  timeline: string | null;
  urgency: string | null;
  leadScore: number | null;
  qualification: string | null;
  status: string;
  nextAction: string | null;
  paused: boolean;
  createdAt: string;
}

const N8N_WEBHOOK_URL =
  "https://realestateleadmanagement-n8n-b138c4-13-203-193-36.sslip.io/webhook/lead-intake";

const PRESETS = [
  {
    id: "hot",
    label: "💎 Hot Lead (Dubai Marina)",
    badge: "Score: 90+",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    name: "John Carter",
    email: "john.carter@example.com",
    phone: "+971500000001",
    message:
      "Hi, I am looking to buy a 3-bedroom luxury apartment in Dubai Marina. Budget is around $250k and I'd like to move within 2 months. Can we set up a call?",
  },
  {
    id: "warm",
    label: "🏡 Warm Lead (Dubai Hills)",
    badge: "Score: 50–79",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    name: "Sara Ahmed",
    email: "sara.ahmed@example.com",
    phone: "+971500000002",
    message:
      "Maybe interested in a villa in Dubai someday. Not sure about my budget yet or the exact timeline.",
  },
  {
    id: "escalation",
    label: "🚨 Human Escalation (Dispute)",
    badge: "Urgent",
    badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    name: "Patricia Gomez",
    email: "patricia.gomez@example.com",
    phone: "+971500000003",
    message:
      "I already paid a deposit and there's a problem with my contract. This is unacceptable and I want to speak to a manager immediately.",
  },
  {
    id: "invalid",
    label: "❌ Validation Error (No Email)",
    badge: "400 Error",
    badgeColor: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    name: "Incomplete User",
    email: "",
    phone: "+971500000004",
    message: "Missing email address to test instant validation rejection.",
  },
];

export default function AdminPage() {
  const [leadsList, setLeadsList] = useState<LeadRecord[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);

  // Quick Test Runner
  const [testOutput, setTestOutput] = useState<any | null>(null);
  const [testingPreset, setTestingPreset] = useState<string | null>(null);

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

  const runPresetTest = async (preset: (typeof PRESETS)[0]) => {
    setTestingPreset(preset.id);
    setTestOutput(null);

    const payload = {
      name: preset.name,
      email: preset.email,
      phone: preset.phone,
      message: preset.message,
      source: "admin_test",
    };

    try {
      // Save locally
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Call n8n
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setTestOutput(Array.isArray(data) ? data[0] : data);
      fetchLeads();
    } catch (e: any) {
      setTestOutput({ error: e.message });
    } finally {
      setTestingPreset(null);
    }
  };

  const filteredLeads = leadsList.filter((lead) => {
    if (statusFilter === "ALL") return true;
    return lead.status?.toUpperCase() === statusFilter;
  });

  return (
    <div className="min-h-screen flex flex-col text-slate-100 bg-[#090d16]">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-amber-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-indigo-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Admin Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-400/40">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white">Sales Operations Center</span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Staff Only
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Pipeline CRM & Automated Workflow Telemetry</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>n8n AI Engine Live</span>
            </div>
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 transition-all flex items-center gap-1.5"
            >
              <span>← View Client Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 relative z-10">
        {/* Dev & Staff Quick Test Presets */}
        <div className="glass-panel rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">⚡ Staff Pipeline Simulation</span>
              <span className="text-[11px] text-slate-400">(Fire test leads into n8n & SQLite)</span>
            </div>
            {testingPreset && (
              <span className="text-xs text-amber-300 animate-pulse font-medium">Executing workflow...</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => runPresetTest(p)}
                disabled={testingPreset !== null}
                className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/5 hover:border-amber-500/30 transition-all text-left group disabled:opacity-50"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                    {p.label}
                  </span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${p.badgeColor}`}>
                    {p.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1">{p.message}</p>
              </button>
            ))}
          </div>

          {/* Test Output Box */}
          {testOutput && (
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/20 text-xs space-y-1 mt-2">
              <div className="flex items-center justify-between font-semibold text-amber-300">
                <span>Simulation Result:</span>
                <span className="text-[10px] text-slate-400 font-mono">Lead ID: {testOutput.lead_id || "Rejected"}</span>
              </div>
              <p className="text-slate-300">
                Score: <strong className="text-white">{testOutput.lead_score ?? "N/A"}/100</strong> · Tier: <strong className="uppercase text-white">{testOutput.qualification || "Rejected"}</strong> · Next Action: <strong className="text-white">{testOutput.next_action || "None"}</strong> · Human Intervention: <strong className={testOutput.human_required ? "text-rose-400" : "text-emerald-400"}>{testOutput.human_required ? "YES (Dispatched)" : "NO"}</strong>
              </p>
            </div>
          )}
        </div>

        {/* CRM Leads Table Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel rounded-2xl p-5">
          <div>
            <h2 className="text-base font-bold text-white">Database Inbound Pipeline</h2>
            <p className="text-xs text-slate-400">Live SQLite records stored in <code className="text-amber-300 font-mono">data.sqlite</code></p>
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-white/10">
            {["ALL", "NEW", "QUALIFIED", "WARM", "NURTURE", "HUMAN_REQUIRED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? "bg-amber-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}
            <button
              onClick={fetchLeads}
              disabled={isLoadingLeads}
              title="Refresh Leads"
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-white/5 transition-all"
            >
              <svg className={`w-4 h-4 ${isLoadingLeads ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* CRM Table */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider border-b border-white/5 text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Lead Name / Email</th>
                  <th className="px-4 py-3.5">Phone</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">AI Score</th>
                  <th className="px-4 py-3.5">Inquiry Snippet</th>
                  <th className="px-4 py-3.5">Received At</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {isLoadingLeads ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500">Loading leads from SQLite...</td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                      No leads found matching filter &quot;{statusFilter}&quot;.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-white">{lead.name || "Anonymous Lead"}</div>
                        <div className="text-[11px] text-slate-400">{lead.email}</div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">{lead.phone || "—"}</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          lead.status === "QUALIFIED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : lead.status === "HUMAN_REQUIRED"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : lead.status === "WARM"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold">
                        {lead.leadScore !== null ? (
                          <span className={lead.leadScore >= 80 ? "text-emerald-400" : lead.leadScore >= 50 ? "text-amber-400" : "text-slate-400"}>
                            {lead.leadScore}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 max-w-xs truncate">{lead.originalMessage || "—"}</td>
                      <td className="px-4 py-3.5 text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(lead.createdAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLead(lead);
                          }}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white/5 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-white/10 transition-all"
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

        {/* Lead Inspection Modal */}
        {selectedLead && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setSelectedLead(null)}
          >
            <div
              className="glass-panel-glow rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">Lead Details</h3>
                  <p className="text-slate-400 font-mono text-[10px]">{selectedLead.id}</p>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="text-slate-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2.5 text-slate-300">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Name</span>
                    <span className="font-semibold text-white">{selectedLead.name || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Email</span>
                    <span className="font-semibold text-white">{selectedLead.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Phone</span>
                    <span>{selectedLead.phone || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Status</span>
                    <span className="font-bold text-amber-400">{selectedLead.status}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Original Customer Message</span>
                  <p className="p-3 rounded-xl bg-slate-900/90 border border-white/5 text-slate-200 mt-1 leading-relaxed">
                    &quot;{selectedLead.originalMessage || "No message recorded."}&quot;
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedLead(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-all text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
