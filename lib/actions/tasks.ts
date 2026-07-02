"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { taskSchema, type TaskFormValues } from "@/lib/validations/task";
import type { Task } from "@/lib/types";

export async function getTasks(filters?: {
  status?: string;
  assignee_id?: string;
  client_id?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("tasks")
    .select(
      `
      *,
      client:clients(id, company_name, billing_model),
      assignee:profiles!tasks_assignee_id_fkey(id, full_name, email)
    `,
    )
    .order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.assignee_id) query = query.eq("assignee_id", filters.assignee_id);
  if (filters?.client_id) query = query.eq("client_id", filters.client_id);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as Task[];
}

export async function getMyTasks(userId: string) {
  return getTasks({ assignee_id: userId });
}

export async function createTask(values: TaskFormValues) {
  const parsed = taskSchema.parse(values);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...parsed, created_by: user?.id })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
  return data;
}

export async function updateTaskStatus(id: string, status: Task["status"]) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
}

export async function updateTask(id: string, values: Partial<TaskFormValues>) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update(values).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
}

export async function deleteTask(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
}
