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
import { MotionFadeUp, MotionStagger } from "@/components/layout/motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ClientWithRelations } from "@/lib/types";
import {
  getTimezoneAbbreviation,
  getTimezoneRegion,
} from "@/lib/timezone";
import { cn } from "@/lib/utils";

function SignalBars({ level, reduceMotion }: { level: number; reduceMotion: boolean }) {
  return (
    <div className="flex items-end gap-0.5 h-8">
      {[1, 2, 3, 4, 5].map((bar) => (
        <motion.div
          key={bar}
          className={cn(
            "w-1 rounded-full",
            bar <= level ? "bg-primary" : "bg-primary/20",
          )}
          style={{ height: `${bar * 20}%` }}
          animate={
            reduceMotion || bar > level
              ? undefined
              : { opacity: [0.5, 1, 0.5] }
          }
          transition={{
            duration: 1.2 + bar * 0.15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function TimezonePanel({ clients }: { clients: ClientWithRelations[] }) {
  const reduceMotion = useReducedMotion();

  const tzGroups = clients.reduce<
    Record<string, { count: number; clients: ClientWithRelations[] }>
  >((acc, client) => {
    const abbr = getTimezoneAbbreviation(client.timezone);
    if (!acc[abbr]) acc[abbr] = { count: 0, clients: [] };
    acc[abbr].count++;
    acc[abbr].clients.push(client);
    return acc;
  }, {});

  const sorted = Object.entries(tzGroups).sort((a, b) => b[1].count - a[1].count);

  return (
    <MotionStagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map(([abbr, { count, clients: tzClients }], index) => (
        <MotionFadeUp key={abbr} delay={index * 0.05}>
          <div className="glass-panel gradient-border group p-4 transition-all hover:border-primary/30 hover:shadow-[0_8px_32px_oklch(0_0_0_/_35%)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-primary/40 bg-primary/10 font-mono text-primary"
                  >
                    {abbr}
                  </Badge>
                  <span className="text-2xl font-bold tabular-nums text-foreground">
                    {count}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {getTimezoneRegion(tzClients[0]?.timezone ?? "")}
                </p>
              </div>
              <SignalBars
                level={Math.min(5, Math.ceil(count / 2) + 1)}
                reduceMotion={!!reduceMotion}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {tzClients.slice(0, 4).map((c) => (
                <span
                  key={c.id}
                  className="truncate rounded-md bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground"
                >
                  {c.company_name}
                </span>
              ))}
              {tzClients.length > 4 && (
                <span className="text-[10px] text-subtle">
                  +{tzClients.length - 4} more
                </span>
              )}
            </div>
          </div>
        </MotionFadeUp>
      ))}
    </MotionStagger>
  );
}

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
      desc: "Follow-ups & handoffs",
      icon: CheckSquare,
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

export function OpsDashboard({ clients }: { clients: ClientWithRelations[] }) {
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
              Live client coverage across {Object.keys(
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

      <ClientStats clients={clients} />

      <ContactWindowAlerts clients={clients} />

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Timezone Coverage
            </h2>
            <p className="text-sm text-muted-foreground">
              Client distribution by region — know who&apos;s awake
            </p>
          </div>
          <Link href="/clients">
            <Button variant="outline" size="sm" className="gap-2">
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
        {clients.length > 0 ? (
          <TimezonePanel clients={clients} />
        ) : (
          <div className="rounded-xl border border-dashed border-primary/30 p-8 text-center text-sm text-muted-foreground">
            No clients loaded — run{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-primary">
              pnpm seed
            </code>{" "}
            to import spreadsheet data
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Quick Actions
        </h2>
        <QuickActions />
      </section>
    </div>
  );
}
