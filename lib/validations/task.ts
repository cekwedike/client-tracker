import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  client_id: z.string().uuid().optional().nullable(),
  status: z.enum(["backlog", "in_progress", "waiting_on_client", "done"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  assignee_id: z.string().uuid().optional().nullable(),
  due_at: z.string().optional().nullable(),
  tags: z.array(z.string()),
});

export type TaskFormValues = z.infer<typeof taskSchema>;

export const dailyHandoffSchema = z.object({
  clients_touched: z.string().min(1, "List clients you worked on"),
  blockers: z.string().optional(),
  leads_logged: z.number().min(0),
  meetings_logged: z.number().min(0),
  notes: z.string().optional(),
});

export type DailyHandoffValues = z.infer<typeof dailyHandoffSchema>;

export const weeklyReportSchema = z.object({
  client_id: z.string().uuid("Select a client"),
  status_summary: z.string().min(1, "Status summary is required"),
  tasks_completed: z.string().optional(),
  operator_notes: z.string().optional(),
  kpi_notes: z.string().optional(),
});

export type WeeklyReportValues = z.infer<typeof weeklyReportSchema>;
