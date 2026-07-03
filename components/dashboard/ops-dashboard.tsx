"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CheckSquare,
  Globe2,
  Radio,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { LiveClock } from "@/components/dashboard/live-clock";
import { ClientStats } from "@/components/clients/client-stats";
import { ContactWindowAlerts } from "@/components/dashboard/contact-window-alerts";
import type {
  ClientDashboardSummary,
  ClientWithRelations,
  Profile,
} from "@/lib/types";
import { getTimezoneAbbreviation } from "@/lib/timezone";

function QuickActions() {
  const reduceMotion = useReducedMotion();

  const actions = [
    {
      href: "/clients",
      label: "Client Ops",
      desc: "CC names, phones, inboxes",
      icon: Building2,
    },
    {
      href: "/tasks",
      label: "Task Queue",
      desc: "Follow-ups & assignments",
      icon: CheckSquare,
    },
    {
      href: "/team",
      label: "Team",
      desc: "Roles & members",
      icon: Users,
    },
    {
      href: "/settings",
      label: "Settings",
      desc: "Time format & display",
      icon: Globe2,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {actions.map((action, i) => (
        <motion.div
          key={action.href}
          initial={reduceMotion ? false : { opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
          whileHover={reduceMotion ? undefined : { scale: 1.02 }}
        >
          <Link
            href={action.href}
            className="flex items-center gap-3 rounded-xl glass-panel gradient-border p-4 transition-colors hover:border-primary/30"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <action.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">{action.label}</p>
              <p className="text-xs text-muted-foreground">{action.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

export function OpsDashboard({
  clients,
  profiles = [],
}: {
  clients: ClientDashboardSummary[] | ClientWithRelations[];
  profiles?: Profile[];
}) {
  const reduceMotion = useReducedMotion();
  const ppl = clients.filter((c) => c.billing_model === "ppl").length;
  const ppm = clients.filter((c) => c.billing_model === "ppm").length;
  const active = clients.filter((c) => c.status === "active").length;

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl gradient-border">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D0F12]/95 via-card/80 to-background/90" />
        <div
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl animate-pulse-glow"
          style={{ background: "#C9A227" }}
          aria-hidden
        />
        <div
          className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full opacity-20 blur-3xl"
          style={{ background: "#E8E4DC" }}
          aria-hidden
        />

        {!reduceMotion && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 overflow-hidden opacity-40">
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
                    stroke="#C9A227"
                    strokeWidth="1.5"
                    strokeOpacity="0.6"
                    d="M0,40 C75,10 150,70 225,40 S375,10 450,40 S525,70 600,40"
                  />
                </svg>
              ))}
            </div>
          </div>
        )}

        <div className="relative z-10 grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Radio className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Ops Command Center
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#E8E4DC] sm:text-4xl">
              Meridian
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Live client coverage across{" "}
              {Object.keys(
                clients.reduce<Record<string, number>>((acc, c) => {
                  acc[getTimezoneAbbreviation(c.timezone)] = 1;
                  return acc;
                }, {}),
              ).length}{" "}
              timezones · {active} active accounts
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3 py-2">
                <Target className="h-4 w-4 text-deal-ppl-fg" />
                <span className="text-sm font-medium text-foreground">
                  {ppl} PPL
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-deal-ppm/30 bg-deal-ppm/10 px-3 py-2">
                <Users className="h-4 w-4 text-deal-ppm-fg" />
                <span className="text-sm font-medium text-foreground">
                  {ppm} PPM
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {clients.length} total
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-primary/20 bg-[#0D0F12]/60 p-6 backdrop-blur-md">
            <LiveClock size="hero" />
          </div>
        </div>
      </div>

      <ClientStats clients={clients} profiles={profiles} />

      <ContactWindowAlerts clients={clients} />

      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Quick Actions
        </h2>
        <QuickActions />
      </section>
    </div>
  );
}
