"use client";

import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CheckSquare,
  Globe2,
  LayoutDashboard,
  Radio,
} from "lucide-react";
import { LiveClock } from "@/components/dashboard/live-clock";
import { MotionCard, MotionFadeUp, MotionStagger } from "@/components/layout/motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Building2,
    title: "Client Hub",
    description:
      "Every account in one place — contacts, billing model, CC playbooks, and inbox timing rules at a glance.",
  },
  {
    icon: Globe2,
    title: "Live Timezone Clocks",
    description:
      "Know who's awake before you send. Region-aware clocks and client distribution across every timezone you cover.",
  },
  {
    icon: CheckSquare,
    title: "Task Board",
    description:
      "Team tasks tied to clients — assign, track, and close loops without losing context in the spreadsheet.",
  },
  {
    icon: LayoutDashboard,
    title: "Ops Dashboard",
    description:
      "Command-center view of active accounts, PPL/PPM split, and coverage gaps — built for outbound agency ops.",
  },
] as const;

function HeroWaveform({ reduceMotion }: { reduceMotion: boolean }) {
  if (reduceMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 overflow-hidden opacity-35">
      <div className="animate-wave-drift flex w-[200%]">
        {[0, 1].map((copy) => (
          <svg
            key={copy}
            className="h-32 w-1/2 shrink-0 animate-wave-float"
            viewBox="0 0 600 80"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              fill="none"
              stroke="#C9A227"
              strokeWidth="1.5"
              strokeOpacity="0.55"
              d="M0,40 C75,10 150,70 225,40 S375,10 450,40 S525,70 600,40"
            />
          </svg>
        ))}
      </div>
    </div>
  );
}

function MarketingHeader() {
  return (
    <header className="relative z-20 border-b border-border/40 bg-[#0D0F12]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Globe2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-[#E8E4DC]">
              Meridian
            </p>
            <p className="text-[11px] text-muted-foreground">PLNITUDE Client Ops</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="sm" render={<Link href="/login" />}>
            Sign in
          </Button>
          <Button size="sm" render={<Link href="/signup" />}>
            Get started
          </Button>
        </nav>
      </div>
    </header>
  );
}

export function LandingPage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-screen flex-col">
      <MarketingHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% -10%, oklch(0.72 0.14 85 / 12%), transparent 70%)",
            }}
            aria-hidden
          />
          <div
            className="absolute -right-32 top-0 h-96 w-96 rounded-full blur-3xl animate-pulse-glow"
            style={{ background: "#C9A227" }}
            aria-hidden
          />
          <div
            className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full opacity-15 blur-3xl"
            style={{ background: "#E8E4DC" }}
            aria-hidden
          />

          <div className="relative z-10 mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8 lg:py-24">
            <MotionFadeUp>
              <div className="mb-4 flex items-center gap-2">
                <Radio className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  Outbound agency ops
                </span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-[#E8E4DC] sm:text-5xl lg:text-6xl">
                Meridian
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                The ops layer for PLNITUDE — inbox timing, CC playbooks, and
                timezone-aware client tracking in one command center.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" render={<Link href="/signup" />}>
                  Get started
                  <ArrowRight className="ml-1" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  render={<Link href="/login" />}
                >
                  Sign in
                </Button>
              </div>
              <p className="mt-6 text-xs text-subtle">
                Internal platform · Team access only
              </p>
            </MotionFadeUp>

            <MotionFadeUp delay={0.12}>
              <div className="gradient-border relative overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0D0F12]/95 via-card/80 to-background/90" />
                <HeroWaveform reduceMotion={!!reduceMotion} />
                <div className="relative z-10 p-6 sm:p-8">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    Live coverage
                  </p>
                  <LiveClock size="hero" />
                  <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border/40 pt-6">
                    {["EST", "GMT", "PST"].map((zone) => (
                      <div
                        key={zone}
                        className="rounded-lg border border-border/50 bg-[#0D0F12]/50 px-3 py-2 text-center"
                      >
                        <p className="font-mono text-xs font-semibold text-primary">
                          {zone}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          Client ops
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </MotionFadeUp>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border/40 bg-[#0D0F12]/40 py-16 lg:py-24">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <MotionFadeUp className="mb-10 max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight text-[#E8E4DC] sm:text-3xl">
                Built for how PLNITUDE runs clients
              </h2>
              <p className="mt-3 text-muted-foreground">
                Replace the spreadsheet with a purpose-built ops platform — from
                first touch to closed loop.
              </p>
            </MotionFadeUp>

            <MotionStagger className="grid gap-4 sm:grid-cols-2">
              {FEATURES.map((feature, index) => (
                <MotionCard key={feature.title} index={index}>
                  <div className="glass-panel gradient-border h-full p-6 transition-colors hover:border-primary/25">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#E8E4DC]">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </MotionCard>
              ))}
            </MotionStagger>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden py-16 lg:py-20">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.72 0.14 85 / 8%) 0%, transparent 50%, oklch(0.92 0.015 85 / 4%) 100%)",
            }}
            aria-hidden
          />
          <MotionFadeUp className="relative z-10 mx-auto max-w-2xl px-6 text-center lg:px-8">
            <h2 className="text-2xl font-semibold tracking-tight text-[#E8E4DC] sm:text-3xl">
              Ready to run ops from Meridian?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Sign in with your PLNITUDE team account or request access from your
              admin.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" render={<Link href="/signup" />}>
                Sign up
                <ArrowRight className="ml-1" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                render={<Link href="/login" />}
              >
                Sign in
              </Button>
            </div>
          </MotionFadeUp>
        </section>
      </main>

      <footer
        className={cn(
          "border-t border-border/40 py-6 text-center text-xs text-subtle",
        )}
      >
        <p>Meridian · PLNITUDE Client Ops Platform</p>
      </footer>
    </div>
  );
}
