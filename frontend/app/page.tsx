"use client";

import { useState } from "react";
import Link from "next/link";

interface ConsultationResult {
  success: boolean;
  lead_id?: string;
  lead_score?: number;
  qualification?: string;
  intent?: string;
  next_action?: string;
  human_required?: boolean;
  reply_subject?: string;
  personalized_reply?: string;
  error?: string;
}

const N8N_WEBHOOK_URL =
  "https://realestateleadmanagement-n8n-b138c4-13-203-193-36.sslip.io/webhook/lead-intake";

export default function ClientPortal() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Contact
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Step 2: Property Specs
  const [propertyType, setPropertyType] = useState("Luxury Apartment");
  const [bedrooms, setBedrooms] = useState("3 Bedrooms");
  const [preferredLocation, setPreferredLocation] = useState("Dubai Marina");
  const [budget, setBudget] = useState("$250,000 – $500,000");

  // Step 3: Inquiry & Timeline
  const [timeline, setTimeline] = useState("Within 1 to 2 Months");
  const [inquiryNotes, setInquiryNotes] = useState("");

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [consultationResult, setConsultationResult] = useState<ConsultationResult | null>(null);

  // Validation
  const isStep1Valid = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return fullName.trim().length > 1 && emailRegex.test(email.trim());
  };

  const handleNextFromStep1 = () => {
    if (!isStep1Valid()) {
      setSubmissionError("Please provide your full name and a valid email address.");
      return;
    }
    setSubmissionError(null);
    setCurrentStep(2);
  };

  const handleNextFromStep2 = () => {
    setCurrentStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionError(null);

    // Combine structured answers into a natural customer inquiry message
    const combinedMessage = `I am interested in acquiring a ${bedrooms} ${propertyType} in ${preferredLocation}. My target budget is ${budget}, and my intended timeline to finalize is ${timeline}.${
      inquiryNotes.trim() ? ` Additional details: "${inquiryNotes.trim()}"` : ""
    }`;

    const payload = {
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || "+971500000000",
      message: combinedMessage,
      source: "client_portal",
    };

    try {
      // 1. Save to local SQLite database
      try {
        await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn("Local DB persist skipped", err);
      }

      // 2. Dispatch to live n8n AI Engine
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      const item = Array.isArray(data) ? data[0] : data;

      if (!res.ok || item.success === false) {
        setSubmissionError(item.error || "We could not process your inquiry. Please check your information.");
      } else {
        setConsultationResult({
          success: true,
          lead_id: item.lead_id,
          lead_score: item.lead_score,
          qualification: item.qualification,
          intent: item.intent,
          next_action: item.next_action,
          human_required: item.human_required,
          reply_subject: item.reply_subject,
          personalized_reply: item.personalized_reply,
        });
        setCurrentStep(4);
      }
    } catch (err: any) {
      setSubmissionError("Network communication error. Please check your internet connection or try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetInquiry = () => {
    setFullName("");
    setEmail("");
    setPhone("");
    setInquiryNotes("");
    setConsultationResult(null);
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen flex flex-col text-slate-100 bg-[#070b14]">
      {/* Ambient background lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-gradient-to-b from-amber-500/10 via-amber-600/5 to-transparent rounded-full blur-[140px]" />
        <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] bg-indigo-900/15 rounded-full blur-[180px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-950/15 rounded-full blur-[180px]" />
      </div>

      {/* Luxury Brand Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-1 ring-amber-200/50">
              <span className="font-serif font-black text-slate-950 text-xl tracking-wider">H</span>
            </div>
            <div>
              <span className="font-serif font-bold text-lg tracking-wide text-white block">
                AL-HARMAIN
              </span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-amber-300 font-semibold block">
                Premier Properties · Dubai
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-300">
            <span className="hover:text-amber-300 transition-colors cursor-pointer">Prime Portfolio</span>
            <span className="hover:text-amber-300 transition-colors cursor-pointer">Signature Villas</span>
            <span className="hover:text-amber-300 transition-colors cursor-pointer">Waterfront Penthouses</span>
            <span className="text-amber-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Advisors Online Now</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://wa.me/971500000000"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-all flex items-center gap-2"
            >
              <span className="text-emerald-400">●</span>
              <span>WhatsApp Direct</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Introduction */}
      <section className="relative z-10 pt-10 pb-6 text-center max-w-3xl mx-auto px-4">
        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-[0.2em] bg-amber-500/10 text-amber-300 border border-amber-500/25 mb-4">
          Bespoke Real Estate Advisory
        </span>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-white">
          Find Your Next Signature Property in Dubai
        </h1>
        <p className="text-slate-400 text-sm mt-3 leading-relaxed max-w-xl mx-auto">
          Share your desired property specifications with our executive advisory team. Our AI consultation engine immediately analyzes curated private listings and prepares your bespoke options.
        </p>
      </section>

      {/* Main Interactive Intake Flow */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 pb-16 relative z-10">
        {/* Step Progress Pills */}
        <div className="flex items-center justify-between mb-8 px-2">
          {[
            { step: 1, label: "Your Details" },
            { step: 2, label: "Property Specs" },
            { step: 3, label: "Timeline & Inquiry" },
            { step: 4, label: "Advisory Consultation" },
          ].map((s, idx) => (
            <div key={s.step} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep === s.step
                    ? "bg-amber-400 text-slate-950 ring-4 ring-amber-500/20 shadow-lg shadow-amber-500/30"
                    : currentStep > s.step
                    ? "bg-emerald-500 text-slate-950 font-black"
                    : "bg-slate-800 text-slate-500 border border-white/10"
                }`}
              >
                {currentStep > s.step ? "✓" : s.step}
              </div>
              <span
                className={`hidden sm:inline text-xs font-semibold ${
                  currentStep === s.step
                    ? "text-amber-300"
                    : currentStep > s.step
                    ? "text-slate-300"
                    : "text-slate-500"
                }`}
              >
                {s.label}
              </span>
              {idx < 3 && <div className="hidden sm:block w-8 h-[1px] bg-white/10 mx-1" />}
            </div>
          ))}
        </div>

        {/* Form Container */}
        <div className="glass-panel-glow rounded-3xl p-6 sm:p-10 transition-all duration-300">
          {/* Error Banner */}
          {submissionError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <span className="text-sm">⚠️</span>
              <span>{submissionError}</span>
            </div>
          )}

          {/* ================= STEP 1: CONTACT DETAILS ================= */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="border-b border-white/[0.08] pb-4">
                <h2 className="text-xl font-serif font-bold text-white">Step 1: Your Contact Information</h2>
                <p className="text-xs text-slate-400 mt-1">
                  We will transmit your private consultation proposal directly to your verified contact.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Full Name <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Carter"
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Email Address <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. john.carter@example.com"
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Your tailored property brief and advisory notes will be sent to this email.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +971 50 123 4567"
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleNextFromStep1}
                  className="py-3 px-7 rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-lg bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 hover:shadow-amber-500/25 flex items-center gap-2 group"
                >
                  <span>Continue to Property Preferences</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: PROPERTY PREFERENCES ================= */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="border-b border-white/[0.08] pb-4">
                <h2 className="text-xl font-serif font-bold text-white">Step 2: Property Specifications</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Specify the type of luxury residence, layout, and preferred neighborhood in Dubai.
                </p>
              </div>

              <div className="space-y-5">
                {/* Property Type Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                    Residence Type
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {["Luxury Apartment", "Signature Villa", "Sky Penthouse", "Townhouse"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setPropertyType(type)}
                        className={`p-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                          propertyType === type
                            ? "bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-md shadow-amber-500/20"
                            : "bg-slate-900/60 hover:bg-slate-800 text-slate-300 border-white/5"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bedrooms Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                    Bedrooms
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {["1 Bed", "2 Beds", "3 Bedrooms", "4 Beds", "5+ Beds"].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBedrooms(b)}
                        className={`py-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                          bedrooms === b
                            ? "bg-amber-400 text-slate-950 border-amber-300 font-bold shadow"
                            : "bg-slate-900/60 hover:bg-slate-800 text-slate-300 border-white/5"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferred Area */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                    Target Dubai Neighborhood
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      "Dubai Marina",
                      "Downtown Dubai",
                      "Palm Jumeirah",
                      "Dubai Hills Estate",
                      "Business Bay",
                      "Emirates Hills",
                    ].map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setPreferredLocation(loc)}
                        className={`p-2.5 rounded-xl text-xs font-medium border transition-all text-center ${
                          preferredLocation === loc
                            ? "bg-amber-400 text-slate-950 border-amber-300 font-bold shadow"
                            : "bg-slate-900/60 hover:bg-slate-800 text-slate-300 border-white/5"
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget Range */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                    Anticipated Investment Budget
                  </label>
                  <select
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm bg-slate-900"
                  >
                    <option value="$150,000 – $250,000">$150,000 – $250,000 (AED 550k – 900k)</option>
                    <option value="$250,000 – $500,000">$250,000 – $500,000 (AED 900k – 1.8M)</option>
                    <option value="$500,000 – $1,000,000">$500,000 – $1,000,000 (AED 1.8M – 3.6M)</option>
                    <option value="$1,000,000 – $3,000,000">$1,000,000 – $3,000,000 (AED 3.6M – 11M)</option>
                    <option value="Over $3,000,000+">Ultra Luxury / Over $3,000,000+ (AED 11M+)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="py-2.5 px-5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleNextFromStep2}
                  className="py-3 px-7 rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-lg bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 hover:shadow-amber-500/25 flex items-center gap-2 group"
                >
                  <span>Next: Inquiry & Timeline</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: TIMELINE & INQUIRY ================= */}
          {currentStep === 3 && (
            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="border-b border-white/[0.08] pb-4">
                <h2 className="text-xl font-serif font-bold text-white">Step 3: Timeline & Specific Queries</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Tell us your intended timeframe and any special architectural or lifestyle preferences.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                    When are you looking to purchase / move?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {["Immediate (< 1 mo)", "Within 1 to 2 Months", "3 to 6 Months", "Flexible / Exploring"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTimeline(t)}
                        className={`p-2.5 rounded-xl text-xs font-medium border transition-all text-center ${
                          timeline === t
                            ? "bg-amber-400 text-slate-950 border-amber-300 font-bold shadow"
                            : "bg-slate-900/60 hover:bg-slate-800 text-slate-300 border-white/5"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Additional Notes / Specific Questions
                  </label>
                  <textarea
                    rows={4}
                    value={inquiryNotes}
                    onChange={(e) => setInquiryNotes(e.target.value)}
                    placeholder="e.g. High-floor sea view preferred, interested in private financing or post-handover payment plan. Can we schedule an advisory call?"
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm resize-none"
                  />
                </div>
              </div>

              {/* Inquiry Summary Preview */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 text-xs text-slate-300 space-y-1">
                <div className="flex items-center justify-between text-slate-400 font-semibold text-[10px] uppercase">
                  <span>Inquiry Summary</span>
                  <span>Al-Harmain Advisory</span>
                </div>
                <p>
                  <strong>{fullName}</strong> ({email}) looking for <strong>{bedrooms} {propertyType}</strong> in <strong>{preferredLocation}</strong> within budget <strong>{budget}</strong>.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={isSubmitting}
                  className="py-2.5 px-5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-3.5 px-8 rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 hover:shadow-amber-500/25 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-slate-950" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Analyzing & Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Property Request</span>
                      <span>✓</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ================= STEP 4: ADVISORY CONFIRMATION SCREEN ================= */}
          {currentStep === 4 && consultationResult && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-400">
              <div className="text-center space-y-2 border-b border-white/[0.08] pb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-300 text-slate-950 flex items-center justify-center mx-auto text-2xl font-black shadow-lg shadow-emerald-500/30">
                  ✓
                </div>
                <h2 className="text-2xl font-serif font-bold text-white">Inquiry Successfully Received</h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Thank you, <strong className="text-amber-300">{fullName}</strong>. Your property consultation request has been analyzed and logged under Ref:{" "}
                  <code className="text-slate-300 font-mono text-[11px]">{consultationResult.lead_id?.substring(0, 18)}</code>.
                </p>
              </div>

              {/* Instant AI Consultation Brief */}
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-amber-500/25 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-xs font-serif font-bold text-amber-300">
                      Immediate Advisory Brief
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                    {consultationResult.reply_subject || "Bespoke Portfolio Review"}
                  </span>
                </div>

                <div className="text-xs text-slate-200 leading-relaxed space-y-3 whitespace-pre-line font-sans">
                  {consultationResult.personalized_reply ||
                    "Thank you for contacting Al-Harmain Premier Properties. A dedicated senior advisor has received your parameters and will connect with you to review floorplans and arrange private viewings."}
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Dispatched to: <strong className="text-slate-200">{email}</strong></span>
                  <span className="text-emerald-400 font-medium">✓ Priority Status Assigned</span>
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={resetInquiry}
                  className="py-2.5 px-6 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all"
                >
                  Submit Another Property Inquiry
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer with Discreet Staff Portal Link */}
      <footer className="border-t border-white/[0.07] bg-slate-950/80 py-6 text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-serif font-semibold text-slate-300">Al-Harmain Premier Properties</span> · Exclusive Dubai Real Estate
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-[11px] text-slate-500 hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              <span>🔒 Staff Operations & CRM Portal</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
