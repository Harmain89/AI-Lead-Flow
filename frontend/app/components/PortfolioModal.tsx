"use client";

import { useState } from "react";

export interface LuxuryProperty {
  id: string;
  name: string;
  category: "villas" | "penthouses" | "apartments";
  propertyType: string;
  bedrooms: string;
  location: string;
  budget: string;
  priceGuide: string;
  tag: string;
  description: string;
  amenities: string[];
  gradient: string;
}

export const LUXURY_PROPERTIES: LuxuryProperty[] = [
  {
    id: "prop-1",
    name: "The Palm Horizon Signature Villa",
    category: "villas",
    propertyType: "Luxury Villa",
    bedrooms: "5+ Bedrooms",
    location: "Palm Jumeirah",
    budget: "$2,000,000+",
    priceGuide: "$4,850,000",
    tag: "Beachfront Frond Trophy",
    description: "Exclusive private beachfront residence on the prestigious Palm Jumeirah Fronds. Featuring private infinity pool, direct white-sand beach access, and custom Italian marble craftsmanship.",
    amenities: ["Private Beach Access", "Infinity Pool", "Smart Home Automation", "Private Yacht Mooring"],
    gradient: "from-amber-950/40 via-slate-900 to-slate-950",
  },
  {
    id: "prop-2",
    name: "Burj Crown Sky Penthouse",
    category: "penthouses",
    propertyType: "Waterfront Penthouse",
    bedrooms: "4 Bedrooms",
    location: "Downtown Dubai",
    budget: "$1,000,000 – $2,000,000",
    priceGuide: "$3,400,000",
    tag: "High-Floor Sky Mansion",
    description: "Duplex penthouse perched high above Downtown Dubai with 360-degree vistas of the Dubai Fountain and Burj Khalifa. Features double-height living ceilings and private elevator lobby.",
    amenities: ["Private Key Elevator", "Fountain Views", "24/7 Butler Service", "Temperature Wine Cellar"],
    gradient: "from-indigo-950/40 via-slate-900 to-slate-950",
  },
  {
    id: "prop-3",
    name: "Marina Grand Azure Residence",
    category: "apartments",
    propertyType: "Luxury Apartment",
    bedrooms: "3 Bedrooms",
    location: "Dubai Marina",
    budget: "$500,000 – $1,000,000",
    priceGuide: "$1,250,000",
    tag: "Waterfront Panoramas",
    description: "Spectacular corner apartment overlooking the yacht harbor. Expansive glass terraces, designer Poliform kitchen, and steps from the Dubai Marina Yacht Club.",
    amenities: ["Full Yacht Marina View", "Direct Boardwalk Access", "Spa & Wellness Suites", "Valet Parking"],
    gradient: "from-cyan-950/40 via-slate-900 to-slate-950",
  },
  {
    id: "prop-4",
    name: "The Fairway Sanctuary Estate",
    category: "villas",
    propertyType: "Luxury Villa",
    bedrooms: "5+ Bedrooms",
    location: "Dubai Hills Estate",
    budget: "$2,000,000+",
    priceGuide: "$5,900,000",
    tag: "Championship Golf Views",
    description: "A sanctuary of privacy overlooking the 18-hole championship golf course. Boasting landscaped courtyard gardens, basement cinema, and independent staff quarters.",
    amenities: ["Golf Course Frontage", "Private Cinema", "Staff Quarters", "Landscaped Courtyard"],
    gradient: "from-emerald-950/40 via-slate-900 to-slate-950",
  },
];

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFilter?: "all" | "villas" | "penthouses" | "apartments";
  onSelectProperty: (property: LuxuryProperty) => void;
}

export default function PortfolioModal({
  isOpen,
  onClose,
  initialFilter = "all",
  onSelectProperty,
}: PortfolioModalProps) {
  const [filter, setFilter] = useState<"all" | "villas" | "penthouses" | "apartments">(initialFilter);

  if (!isOpen) return null;

  const filteredProperties = LUXURY_PROPERTIES.filter((p) => {
    if (filter === "all") return true;
    return p.category === filter;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-[#090d16] border border-amber-500/30 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden">
        {/* Top Glow Accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-600" />

        {/* Modal Header */}
        <div className="p-5 sm:p-7 border-b border-white/[0.08] flex items-start justify-between gap-4 bg-gradient-to-b from-white/[0.02] to-transparent">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] bg-amber-400/10 text-amber-300 border border-amber-400/25">
                Curated Private Collection
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-400 font-medium">Dubai Luxury Real Estate</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide">
              Prime Portfolio Showcase
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Explore hand-selected trophy residences across Dubai. Select any property to immediately pre-fill your bespoke consultation inquiry.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 flex items-center justify-center transition-all shrink-0"
            title="Close Portfolio"
          >
            ✕
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex border-b border-white/[0.08] bg-slate-950/40 px-5 sm:px-7 py-3 gap-2 overflow-x-auto text-xs font-semibold scrollbar-none">
          {[
            { id: "all", label: "All Properties (4)" },
            { id: "villas", label: "Signature Villas" },
            { id: "penthouses", label: "Waterfront Penthouses" },
            { id: "apartments", label: "Luxury Apartments" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id as any)}
              className={`py-1.5 px-4 rounded-xl border transition-all shrink-0 ${
                filter === cat.id
                  ? "bg-amber-400 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-400/20"
                  : "bg-slate-900/60 text-slate-400 hover:text-white border-white/10"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Properties Grid */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-4 text-slate-300 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProperties.map((prop) => (
              <div
                key={prop.id}
                className={`p-5 rounded-2xl bg-gradient-to-br ${prop.gradient} border border-white/10 hover:border-amber-400/40 transition-all flex flex-col justify-between group shadow-lg`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-400/10 text-amber-300 border border-amber-400/25">
                      {prop.tag}
                    </span>
                    <span className="text-sm font-serif font-bold text-amber-300">
                      {prop.priceGuide}
                    </span>
                  </div>

                  <h3 className="text-base font-serif font-bold text-white group-hover:text-amber-300 transition-colors">
                    {prop.name}
                  </h3>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 my-2">
                    <span>📍 {prop.location}</span>
                    <span>•</span>
                    <span>🛏️ {prop.bedrooms}</span>
                    <span>•</span>
                    <span>🏛️ {prop.propertyType}</span>
                  </div>

                  <p className="text-[11px] text-slate-300 line-clamp-2 mb-3 leading-relaxed">
                    {prop.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {prop.amenities.map((am) => (
                      <span
                        key={am}
                        className="px-2 py-0.5 rounded-md text-[9px] font-medium bg-white/5 border border-white/5 text-slate-300"
                      >
                        ✓ {am}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Guide Budget: <strong className="text-slate-200">{prop.budget}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectProperty(prop)}
                    className="py-1.5 px-4 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md shadow-amber-400/15 transition-all flex items-center gap-1.5"
                  >
                    <span>Select for Consultation</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Private off-market opportunities available upon confidential qualification.</span>
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
