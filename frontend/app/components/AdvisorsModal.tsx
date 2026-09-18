"use client";

export interface Advisor {
  id: string;
  name: string;
  title: string;
  department: string;
  experience: string;
  languages: string[];
  specialty: string;
  status: "available" | "in_consultation";
  phone: string;
  avatarInitials: string;
}

export const ADVISORS: Advisor[] = [
  {
    id: "adv-1",
    name: "Tariq Al-Mansoori",
    title: "Senior Managing Director",
    department: "Private Client Advisory",
    experience: "14+ Years in Dubai Ultra-Luxury",
    languages: ["English", "Arabic", "French"],
    specialty: "Palm Jumeirah Fronds, Emirates Hills Trophy Estates",
    status: "available",
    phone: "+971500000001",
    avatarInitials: "TA",
  },
  {
    id: "adv-2",
    name: "Elena Rostova",
    title: "Principal Waterfront & Penthouse Advisor",
    department: "High-Rise & Skyline Portfolios",
    experience: "11+ Years in Prime International Real Estate",
    languages: ["English", "Russian", "German"],
    specialty: "Downtown Dubai Penthouses, Dubai Marina Waterfront Mansions",
    status: "available",
    phone: "+971500000002",
    avatarInitials: "ER",
  },
  {
    id: "adv-3",
    name: "Zaid Al-Hashimi",
    title: "Director of Institutional Acquisitions",
    department: "Global Investor & Family Office Desk",
    experience: "9+ Years in Capital Markets & UAE Golden Visa",
    languages: ["English", "Arabic"],
    specialty: "Off-Plan Landmark Launches, Multi-Unit Residential Portfolios",
    status: "available",
    phone: "+971500000003",
    avatarInitials: "ZH",
  },
];

interface AdvisorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAdvisor: (advisor: Advisor) => void;
}

export default function AdvisorsModal({ isOpen, onClose, onSelectAdvisor }: AdvisorsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#090d16] border border-amber-500/30 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden">
        {/* Top Glow Accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-600" />

        {/* Modal Header */}
        <div className="p-5 sm:p-7 border-b border-white/[0.08] flex items-start justify-between gap-4 bg-gradient-to-b from-white/[0.02] to-transparent">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                Executive Desk Active
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-400 font-medium">Dubai Time (GMT+4)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide">
              Private Real Estate Advisors
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              Our licensed senior partners provide discreet, conflict-free representation for acquisitions, off-market transactions, and UAE Golden Visa structuring.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 flex items-center justify-center transition-all shrink-0"
            title="Close Advisors"
          >
            ✕
          </button>
        </div>

        {/* Advisors List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-4 text-slate-300 text-xs">
          <div className="space-y-3">
            {ADVISORS.map((advisor) => (
              <div
                key={advisor.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-white/5 hover:border-amber-400/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 text-slate-950 font-serif font-black flex items-center justify-center text-base shadow-lg shadow-amber-500/20 shrink-0">
                    {advisor.avatarInitials}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                        {advisor.name}
                      </h3>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Available for Call
                      </span>
                    </div>
                    <p className="text-amber-400/90 text-[11px] font-medium">
                      {advisor.title} · <span className="text-slate-400">{advisor.department}</span>
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      Specialization: <strong className="text-slate-300">{advisor.specialty}</strong>
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-0.5">
                      <span>{advisor.experience}</span>
                      <span>•</span>
                      <span>Languages: {advisor.languages.join(", ")}</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectAdvisor(advisor)}
                    className="w-full sm:w-auto py-2 px-4 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md shadow-amber-400/15 transition-all"
                  >
                    Request Advisory →
                  </button>
                  <a
                    href={`https://wa.me/${advisor.phone.replace("+", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto py-1.5 px-3 rounded-xl text-[11px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-center transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>💬 WhatsApp</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>All advisors hold certified Dubai Real Estate Regulatory Agency (RERA) credentials.</span>
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
