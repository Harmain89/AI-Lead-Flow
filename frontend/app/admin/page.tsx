"use client";

import { useEffect, useState, useMemo } from "react";
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
    label: "💎 Hot Qualified Lead",
    badge: "Score: 90+",
    badgeColor: "saas-badge-emerald",
    name: "John Carter",
    email: "john.carter@example.com",
    phone: "+971500000001",
    message:
      "Hi, I am looking to buy a 3-bedroom luxury apartment in Dubai Marina. Budget is around $250k and I'd like to move within 2 months. Can we set up a call?",
  },
  {
    id: "warm",
    label: "🏡 Warm Exploratory Lead",
    badge: "Score: 50–79",
    badgeColor: "saas-badge-amber",
    name: "Sara Ahmed",
    email: "sara.ahmed@example.com",
    phone: "+971500000002",
    message:
      "Maybe interested in a villa in Dubai someday. Not sure about my budget yet or the exact timeline.",
  },
  {
    id: "escalation",
    label: "🚨 Human Escalation Trigger",
    badge: "Dispute / VIP",
    badgeColor: "saas-badge-rose",
    name: "Patricia Gomez",
    email: "patricia.gomez@example.com",
    phone: "+971500000003",
    message:
      "I already paid a deposit and there's a problem with my contract. This is unacceptable and I want to speak to a manager immediately.",
  },
  {
    id: "invalid",
    label: "❌ Validation Guard (No Email)",
    badge: "400 Error",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
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
  const [searchQuery, setSearchQuery] = useState("");
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
      const item = Array.isArray(data) ? data[0] : data;
      setTestOutput(item);

      // Refresh leads
      await fetchLeads();
    } catch (err: any) {
      setTestOutput({ error: err.message });
    } finally {
      setTestingPreset(null);
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              CRM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">Sales Operations Center</span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Staff Only
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Pipeline CRM & Automated Workflow Telemetry</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>n8n AI Engine Live</span>
            </div>

            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>← View Product Overview</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Dev & Staff Quick Test Presets */}
        <div className="saas-card p-6 space-y-4 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 text-xs font-bold uppercase tracking-wider">
                ⚡ Staff Pipeline Simulation
              </span>
              <span className="text-xs text-slate-500">(Fire test leads directly into n8n & SQLite)</span>
            </div>
            {testingPreset && (
              <span className="text-xs text-blue-600 animate-pulse font-semibold">Executing workflow...</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => runPresetTest(p)}
                disabled={testingPreset !== null}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 transition-all text-left group disabled:opacity-50 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {p.label}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${p.badgeColor}`}>
                    {p.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">{p.message}</p>
              </button>
            ))}
          </div>

          {/* Test Output Box */}
          {testOutput && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>Simulation Response:</span>
                <span className="text-[10px] text-slate-500 font-mono">Lead ID: {testOutput.lead_id || "Rejected"}</span>
              </div>
              <p className="text-slate-600">
                Score: <strong className="text-slate-900">{testOutput.lead_score ?? "N/A"}/100</strong> · Tier: <strong className="uppercase text-slate-900">{testOutput.qualification || "Rejected"}</strong> · Next Action: <strong className="text-slate-900">{testOutput.next_action || "None"}</strong> · Human Intervention: <strong className={testOutput.human_required ? "text-rose-600" : "text-emerald-600"}>{testOutput.human_required ? "YES (Alert Dispatched)" : "NO (Autonomous)"}</strong>
              </p>
            </div>
          )}
        </div>

        {/* CRM Leads Table Header with Search & Filter */}
        <div className="saas-card p-6 space-y-4 bg-white border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Database Inbound Pipeline</h2>
              <p className="text-xs text-slate-500">
                Live SQLite records stored in <code className="text-blue-700 font-mono">data.sqlite</code> ({filteredLeads.length} leads displayed)
              </p>
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search leads by name, email, phone..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {["ALL", "NEW", "QUALIFIED", "WARM", "NURTURE", "HUMAN_REQUIRED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === st
                      ? "bg-white text-blue-700 shadow-sm font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              onClick={fetchLeads}
              disabled={isLoadingLeads}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-blue-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <svg className={`w-3.5 h-3.5 ${isLoadingLeads ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh CRM</span>
            </button>
          </div>
        </div>

        {/* CRM Table */}
        <div className="saas-card overflow-hidden bg-white border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Lead Name / Email</th>
                  <th className="px-4 py-3.5">Phone</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">AI Score</th>
                  <th className="px-4 py-3.5">Source</th>
                  <th className="px-4 py-3.5">Inquiry Snippet</th>
                  <th className="px-4 py-3.5">Received At</th>
                  <th className="px-4 py-3.5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {isLoadingLeads ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-slate-400">Loading SQLite records...</td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                      No leads found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{lead.name || "Anonymous"}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{lead.email}</div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">{lead.phone || "—"}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                            lead.status === "QUALIFIED"
                              ? "saas-badge-emerald"
                              : lead.status === "HUMAN_REQUIRED"
                              ? "saas-badge-rose"
                              : lead.status === "WARM"
                              ? "saas-badge-amber"
                              : "saas-badge-blue"
                          }`}
                        >
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold">
                        {lead.leadScore !== null ? (
                          <span className={lead.leadScore >= 80 ? "text-emerald-600" : lead.leadScore >= 50 ? "text-amber-600" : "text-slate-500"}>
                            {lead.leadScore}/100
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-[11px] text-slate-500 font-mono">{lead.source}</td>
                      <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">{lead.originalMessage || "—"}</td>
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
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 transition-all cursor-pointer"
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedLead(null)}
          >
            <div
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 text-xs shadow-2xl border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
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
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Ingestion Timestamp</span>
                  <span className="font-mono text-slate-500">{new Date(selectedLead.createdAt).toISOString()}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedLead(null)}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer"
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
