"use client";

import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CheckSquare,
  Clock3,
  Globe2,
  LayoutDashboard,
  Lock,
  Radio,
  ShieldCheck,
  Users,
} from "lucide-react";
import { LiveClock } from "@/components/dashboard/live-clock";
import { MotionCard, MotionFadeUp, MotionStagger } from "@/components/layout/motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CAPABILITIES = [
  {
    icon: Building2,
    title: "Client Hub",
    description:
      "Every account in one place — contacts, billing model, CC playbooks, and inbox timing rules at a glance.",
    tag: "Coverage",
  },
  {
    icon: Globe2,
    title: "Live Timezone Clocks",
    description:
      "Know who's awake before you send. Region-aware clocks and client distribution across every timezone you cover.",
    tag: "Timing",
  },
  {
    icon: CheckSquare,
    title: "Task Board",
    description:
      "Team tasks tied to clients — assign, track, and close loops without losing context in the spreadsheet.",
    tag: "Workflow",
  },
  {
    icon: LayoutDashboard,
    title: "Ops Dashboard",
    description:
      "Command-center view of active accounts, PPL/PPM split, and coverage gaps — built for outbound agency ops.",
    tag: "Command",
  },
] as const;

const WORKFLOW = [
  {
    step: "01",
    title: "Map every client",
    description:
      "Centralize accounts, playbooks, and billing context so the whole team shares one source of truth.",
  },
  {
    step: "02",
    title: "Align on timing",
    description:
      "Live clocks and region coverage show when to reach out — before messages land at the wrong hour.",
  },
  {
    step: "03",
    title: "Close the loop",
    description:
      "Tasks, assignments, and activity feed keep outbound ops moving from first touch to handoff.",
  },
] as const;

const TRUST_SIGNALS = [
  {
    icon: Lock,
    label: "Invite-only access",
    detail: "Team members join via admin invite",
  },
  {
    icon: ShieldCheck,
    label: "Ops-grade data",
    detail: "Scoped to your PLNITUDE workspace",
  },
  {
    icon: Users,
    label: "Built for teams",
    detail: "Operators, leads, and admins in sync",
  },
] as const;

function HeroWaveform({ reduceMotion }: { reduceMotion: boolean }) {
  if (reduceMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 overflow-hidden opacity-30">
      <div className="animate-wave-drift flex w-[200%]">
        {[0, 1].map((copy) => (
          <svg
            key={copy}
            className="h-28 w-1/2 shrink-0 animate-wave-float"
            viewBox="0 0 600 80"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              fill="none"
              stroke="var(--meridian-brass)"
              strokeWidth="1.5"
              strokeOpacity="0.5"
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
    <header className="sticky top-0 z-30 border-b border-border/40 bg-[var(--meridian-void)]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-[0_0_24px_oklch(0.72_0.14_85_/_18%)] transition-shadow group-hover:shadow-[0_0_32px_oklch(0.72_0.14_85_/_28%)]">
            <Globe2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold tracking-tight text-[var(--meridian-cream)]">
              Meridian
            </p>
            <p className="text-[11px] text-muted-foreground">PLNITUDE Client Ops</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Button size="sm" render={<Link href="/login" />}>
            Sign in
            <ArrowRight className="ml-0.5 h-3.5 w-3.5" />
          </Button>
        </nav>
      </div>
    </header>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="h-px w-6 bg-primary/60" aria-hidden />
      <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
        {children}
      </span>
    </div>
  );
}

export function LandingPage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-screen flex-col">
      <div
        className="marketing-grid marketing-noise pointer-events-none absolute inset-0 opacity-80"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% -5%, oklch(0.72 0.14 85 / 14%), transparent 65%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-40 top-20 h-[28rem] w-[28rem] rounded-full opacity-[0.12] blur-3xl"
        style={{ background: "var(--meridian-brass)" }}
        aria-hidden
      />

      <MarketingHeader />

      <main className="relative z-10 flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-16 lg:px-8 lg:py-24">
            <MotionFadeUp>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-1">
                <Radio className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
                  Outbound agency ops
                </span>
              </div>

              <h1 className="font-display text-[2.75rem] font-bold leading-[1.05] tracking-tight text-[var(--meridian-cream)] sm:text-5xl lg:text-[3.5rem]">
                The command center for{" "}
                <span className="text-primary">client operations</span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Meridian is PLNITUDE&apos;s internal ops layer — inbox timing, CC
                playbooks, timezone-aware coverage, and team tasks in one place.
                Replace the spreadsheet with a platform built for how you run
                clients.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button size="lg" render={<Link href="/login" />}>
                  Sign in to Meridian
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              <p className="mt-5 flex items-center gap-2 text-xs text-subtle">
                <Lock className="h-3.5 w-3.5 shrink-0 text-primary/80" />
                Invite-only platform · Request access from your PLNITUDE admin
              </p>
            </MotionFadeUp>

            <MotionFadeUp delay={0.1}>
              <div className="gradient-border relative overflow-hidden rounded-2xl shadow-[0_24px_80px_oklch(0_0_0_/_45%)]">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--meridian-void)]/95 via-card/85 to-background/90" />
                <HeroWaveform reduceMotion={!!reduceMotion} />

                <div className="relative z-10 p-6 sm:p-8">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                      Live coverage
                    </p>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-400">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                      Active
                    </span>
                  </div>

                  <LiveClock size="hero" />

                  <div className="mt-6 grid grid-cols-3 gap-2.5 border-t border-border/40 pt-6 sm:gap-3">
                    {[
                      { zone: "EST", clients: "Americas" },
                      { zone: "GMT", clients: "EMEA" },
                      { zone: "PST", clients: "West" },
                    ].map((item) => (
                      <div
                        key={item.zone}
                        className="rounded-lg border border-border/50 bg-[var(--meridian-void)]/55 px-2.5 py-2.5 text-center sm:px-3"
                      >
                        <p className="font-mono text-xs font-semibold text-primary">
                          {item.zone}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {item.clients}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </MotionFadeUp>
          </div>
        </section>

        {/* Platform value */}
        <section className="border-y border-border/40 bg-[var(--meridian-void)]/50 py-10">
          <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
            <MotionFadeUp className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <p className="font-display max-w-2xl text-xl font-semibold leading-snug text-[var(--meridian-cream)] sm:text-2xl">
                One ops layer from first touch to closed loop — built for
                outbound teams who can&apos;t afford missed context.
              </p>
              <div className="flex shrink-0 items-center gap-2 rounded-lg border border-border/50 bg-card/40 px-4 py-3">
                <Clock3 className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs font-medium text-[var(--meridian-cream)]">
                    Timezone-first
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Send when clients are awake
                  </p>
                </div>
              </div>
            </MotionFadeUp>
          </div>
        </section>

        {/* Workflow */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
            <MotionFadeUp className="mb-12 max-w-2xl">
              <SectionLabel>How it works</SectionLabel>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-[var(--meridian-cream)] sm:text-3xl">
                From scattered spreadsheets to a single ops surface
              </h2>
              <p className="mt-3 text-muted-foreground">
                Meridian connects client data, regional timing, and team workflow
                so operators always know what to do next.
              </p>
            </MotionFadeUp>

            <MotionStagger className="grid gap-4 lg:grid-cols-3">
              {WORKFLOW.map((item, index) => (
                <MotionCard key={item.step} index={index}>
                  <article className="glass-panel relative h-full overflow-hidden p-6 lg:p-7">
                    <span
                      className="font-display pointer-events-none absolute -right-2 -top-4 text-7xl font-bold leading-none text-primary/10"
                      aria-hidden
                    >
                      {item.step}
                    </span>
                    <p className="font-mono text-xs font-semibold text-primary">
                      {item.step}
                    </p>
                    <h3 className="mt-3 font-display text-lg font-semibold text-[var(--meridian-cream)]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </article>
                </MotionCard>
              ))}
            </MotionStagger>
          </div>
        </section>

        {/* Capabilities */}
        <section className="border-t border-border/40 bg-[var(--meridian-void)]/35 py-16 lg:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
            <MotionFadeUp className="mb-12 max-w-2xl">
              <SectionLabel>Capabilities</SectionLabel>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-[var(--meridian-cream)] sm:text-3xl">
                Everything your ops team needs, nothing it doesn&apos;t
              </h2>
              <p className="mt-3 text-muted-foreground">
                Purpose-built modules for PLNITUDE&apos;s outbound client
                workflow — not another generic CRM bolt-on.
              </p>
            </MotionFadeUp>

            <MotionStagger className="grid gap-4 sm:grid-cols-2">
              {CAPABILITIES.map((feature, index) => (
                <MotionCard key={feature.title} index={index}>
                  <article className="gradient-border group h-full transition-colors hover:border-primary/30">
                    <div className="glass-panel h-full p-6 transition-colors group-hover:bg-card/90 sm:p-7">
                      <div className="mb-5 flex items-start justify-between gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
                          <feature.icon className="h-5 w-5 text-primary" />
                        </div>
                        <span className="rounded-md border border-border/60 bg-background/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-subtle">
                          {feature.tag}
                        </span>
                      </div>
                      <h3 className="font-display text-lg font-semibold text-[var(--meridian-cream)]">
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </article>
                </MotionCard>
              ))}
            </MotionStagger>
          </div>
        </section>

        {/* Trust */}
        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
            <MotionFadeUp>
              <div className="gradient-border overflow-hidden rounded-2xl">
                <div className="relative bg-gradient-to-br from-card/90 via-[var(--meridian-void)]/80 to-background/95 px-6 py-10 sm:px-10 sm:py-12">
                  <div
                    className="pointer-events-none absolute inset-0 opacity-40"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.72 0.14 85 / 6%) 0%, transparent 55%)",
                    }}
                    aria-hidden
                  />

                  <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16">
                    <div className="max-w-xl">
                      <SectionLabel>Trust & access</SectionLabel>
                      <h2 className="font-display text-2xl font-semibold tracking-tight text-[var(--meridian-cream)] sm:text-3xl">
                        Internal platform, production-grade ops
                      </h2>
                      <p className="mt-3 text-muted-foreground">
                        Meridian is not open to the public. Access is granted by
                        your team admin — keeping client data and playbooks
                        inside PLNITUDE.
                      </p>
                    </div>

                    <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 lg:gap-4 xl:grid-cols-3">
                      {TRUST_SIGNALS.map((signal) => (
                        <li
                          key={signal.label}
                          className="flex gap-3 rounded-xl border border-border/50 bg-background/40 p-4"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <signal.icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--meridian-cream)]">
                              {signal.label}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {signal.detail}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </MotionFadeUp>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/40 py-16 lg:py-24">
          <MotionFadeUp className="mx-auto max-w-2xl px-5 text-center sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-[var(--meridian-cream)] sm:text-3xl">
              Ready to run ops from Meridian?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Sign in with your PLNITUDE credentials. New to the platform?
              Ask your admin for an invite.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" render={<Link href="/login" />}>
                Sign in
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <p className="mt-5 text-xs text-subtle">
              No public signup · Access by invitation only
            </p>
          </MotionFadeUp>
        </section>
      </main>

      <footer
        className={cn(
          "relative z-10 border-t border-border/40 bg-[var(--meridian-void)]/60 py-8",
        )}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/90">
              <Globe2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="text-left">
              <p className="font-display text-sm font-semibold text-[var(--meridian-cream)]">
                Meridian
              </p>
              <p className="text-[11px] text-subtle">PLNITUDE Client Ops Platform</p>
            </div>
          </div>
          <p className="text-xs text-subtle">
            Internal use only · {new Date().getFullYear()} PLNITUDE
          </p>
        </div>
      </footer>
    </div>
  );
}
