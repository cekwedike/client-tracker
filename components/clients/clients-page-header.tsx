"use client";

import { useReducedMotion } from "framer-motion";
import { PageHeader } from "@/components/layout/sidebar";

function SubtleWaveform() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 h-10 overflow-hidden opacity-35"
      aria-hidden
    >
      <svg
        className={`h-10 w-full ${reduceMotion ? "" : "animate-wave-float"}`}
        viewBox="0 0 600 40"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="clients-wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="oklch(0.55 0.12 85)" stopOpacity="0.4" />
            <stop offset="50%" stopColor="oklch(0.72 0.14 85)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="oklch(0.62 0.12 55)" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        <path
          fill="none"
          stroke="url(#clients-wave-grad)"
          strokeWidth="1.25"
          d="M0,20 C100,5 200,35 300,20 S500,5 600,20"
        />
      </svg>
    </div>
  );
}

export function ClientsPageHeader({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <div className="relative mb-6 overflow-hidden border-b border-border/60 pb-6">
      <SubtleWaveform />
      <div className="relative z-10">
        <PageHeader
          title="Clients"
          description="Ops reference — CC names, phones, emails, and live local times for lead responses"
        >
          {children}
        </PageHeader>
      </div>
    </div>
  );
}
