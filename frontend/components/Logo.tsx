"use client";

import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  showBadge?: boolean;
  href?: string;
  className?: string;
}

export default function Logo({
  size = "md",
  showText = true,
  showBadge = true,
  href = "/",
  className = "",
}: LogoProps) {
  const iconDimensions = {
    sm: { class: "w-8 h-8 rounded-lg" },
    md: { class: "w-10 h-10 rounded-xl" },
    lg: { class: "w-14 h-14 rounded-2xl" },
  }[size];

  const content = (
    <div className={`flex items-center gap-3 select-none group ${className}`}>
      {/* Dynamic Infinite Flow Logo Icon */}
      <div
        className={`relative overflow-hidden shrink-0 shadow-md shadow-slate-900/10 border border-slate-800/10 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-[#ff6d5a]/20 transition-all duration-300 ${iconDimensions.class}`}
      >
        <img
          src="/ai-lead-flow-logo.png"
          alt="AI Lead Flow Logo"
          className="w-full h-full object-cover"
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-slate-950 tracking-tight leading-none text-base sm:text-lg flex items-center">
              <span>AI</span>
              <span className="text-slate-400 mx-1">·</span>
              <span>Lead</span>
              <span className="bg-gradient-to-r from-[#ff6d5a] to-[#f43f5e] bg-clip-text text-transparent ml-1">
                Flow
              </span>
            </span>

            {showBadge && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                n8n
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 font-medium tracking-wide">
            Autonomous Sales Engine
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
