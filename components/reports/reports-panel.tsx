"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createDailyHandoff, createWeeklyReport } from "@/lib/actions/chat";
import { formatWeeklyReportMarkdown } from "@/lib/reports";
import {
  dailyHandoffSchema,
  weeklyReportSchema,
  type DailyHandoffValues,
  type WeeklyReportValues,
} from "@/lib/validations/task";
import type { Client, Report } from "@/lib/types";
import { Download } from "lucide-react";

export function ReportsPanel({
  clients,
  handoffs,
  weeklyReports,
}: {
  clients: Pick<Client, "id" | "company_name">[];
  handoffs: Report[];
  weeklyReports: Report[];
}) {
  return (
    <Tabs defaultValue="handoff">
      <TabsList>
        <TabsTrigger value="handoff">Daily Handoff</TabsTrigger>
        <TabsTrigger value="weekly">Weekly Report</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsContent value="handoff" className="mt-4">
        <DailyHandoffForm />
      </TabsContent>
      <TabsContent value="weekly" className="mt-4">
        <WeeklyReportForm clients={clients} />
      </TabsContent>
      <TabsContent value="history" className="mt-4">
        <ReportHistory handoffs={handoffs} weeklyReports={weeklyReports} />
      </TabsContent>
    </Tabs>
  );
}

function DailyHandoffForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<DailyHandoffValues>({
    resolver: zodResolver(dailyHandoffSchema),
    defaultValues: {
      clients_touched: "",
      blockers: "",
      leads_logged: 0,
      meetings_logged: 0,
      notes: "",
    },
  });

  const onSubmit = (values: DailyHandoffValues) => {
    startTransition(async () => {
      try {
        await createDailyHandoff(values);
        toast.success("Handoff posted to #handoff channel");
        form.reset();
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to submit");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Daily Handoff</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Clients Touched *</Label>
            <Textarea
              {...form.register("clients_touched")}
              placeholder="List clients you worked on today..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Blockers</Label>
            <Textarea {...form.register("blockers")} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Leads Logged</Label>
              <Input
                type="number"
                min={0}
                {...form.register("leads_logged", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Meetings Logged</Label>
              <Input
                type="number"
                min={0}
                {...form.register("meetings_logged", { valueAsNumber: true })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea {...form.register("notes")} rows={2} />
          </div>
          <Button type="submit" className="bg-emerald-700" disabled={isPending}>
            {isPending ? "Posting..." : "Post Handoff"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function WeeklyReportForm({
  clients,
}: {
  clients: Pick<Client, "id" | "company_name">[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<WeeklyReportValues>({
    resolver: zodResolver(weeklyReportSchema),
    defaultValues: {
      client_id: "",
      status_summary: "",
      tasks_completed: "",
      operator_notes: "",
      kpi_notes: "",
    },
  });

  const onSubmit = (values: WeeklyReportValues) => {
    startTransition(async () => {
      try {
        const report = await createWeeklyReport(values);
        toast.success("Weekly report created");
        const md = formatWeeklyReportMarkdown(report);
        const blob = new Blob([md], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${report.title.replace(/[^a-z0-9]/gi, "-")}.md`;
        a.click();
        form.reset();
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to create report");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Weekly Client Report</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Client *</Label>
            <Select
              value={form.watch("client_id")}
              onValueChange={(v) => form.setValue("client_id", v ?? "")}
            >
              <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status Summary *</Label>
            <Textarea {...form.register("status_summary")} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Tasks Completed</Label>
            <Textarea {...form.register("tasks_completed")} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Operator Notes</Label>
            <Textarea {...form.register("operator_notes")} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>KPI Notes (PPL/PPM)</Label>
            <Textarea {...form.register("kpi_notes")} rows={2} />
          </div>
          <Button type="submit" className="gap-2 bg-emerald-700" disabled={isPending}>
            <Download className="h-4 w-4" />
            {isPending ? "Generating..." : "Generate & Download"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ReportHistory({
  handoffs,
  weeklyReports,
}: {
  handoffs: Report[];
  weeklyReports: Report[];
}) {
  const all = [...handoffs, ...weeklyReports].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  if (all.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No reports yet</p>;
  }

  return (
    <div className="space-y-3">
      {all.map((report) => (
        <Card key={report.id} className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium">{report.title}</p>
              <p className="text-xs text-muted-foreground">
                {report.author?.full_name} · {new Date(report.created_at).toLocaleString()}
              </p>
            </div>
            <span className="rounded bg-muted px-2 py-0.5 text-xs capitalize">
              {report.type.replace("_", " ")}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}
