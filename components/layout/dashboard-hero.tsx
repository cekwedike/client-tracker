"use client";

import { useReducedMotion } from "framer-motion";

function WaveformSvg() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 h-24 overflow-hidden opacity-50"
      aria-hidden
    >
      <div
        className={reduceMotion ? undefined : "animate-wave-drift flex w-[200%]"}
      >
        {[0, 1].map((copy) => (
          <svg
            key={copy}
            className={`h-24 w-1/2 shrink-0 ${reduceMotion ? "" : "animate-wave-float"}`}
            viewBox="0 0 600 80"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={`wave-grad-${copy}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="oklch(0.55 0.12 85)" stopOpacity="0.5" />
                <stop offset="50%" stopColor="oklch(0.72 0.14 85)" stopOpacity="0.85" />
                <stop offset="100%" stopColor="oklch(0.62 0.12 55)" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <path
              fill="none"
              stroke={`url(#wave-grad-${copy})`}
              strokeWidth="1.5"
              d="M0,40 C75,10 150,70 225,40 S375,10 450,40 S525,70 600,40"
            />
            <path
              fill="none"
              stroke={`url(#wave-grad-${copy})`}
              strokeWidth="1"
              strokeOpacity="0.6"
              d="M0,55 C100,30 200,80 300,55 S500,30 600,55"
            />
          </svg>
        ))}
      </div>
    </div>
  );
}

export function DashboardHero({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl gradient-border">
      <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.18_0.01_260/80)] via-card/70 to-background/90" />
      <div
        className="absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl animate-pulse-glow"
        style={{ background: "oklch(0.55 0.12 85)" }}
      />
      <div
        className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full opacity-15 blur-3xl"
        style={{ background: "oklch(0.62 0.12 55)" }}
      />
      <WaveformSvg />
      <div className="relative z-10 p-6 sm:p-8">{children}</div>
    </div>
  );
}
