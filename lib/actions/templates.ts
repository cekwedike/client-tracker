"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/actions/auth";
import { logActivity } from "@/lib/actions/activity";
import {
  canDeleteTemplate,
  canManageTemplates,
} from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import type { MessageTemplate, MessageTemplateWithClients } from "@/lib/types";

const templateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  body: z.string().min(1, "Body is required"),
  client_ids: z.array(z.string().uuid()).optional(),
});

export async function getMessageTemplates(): Promise<MessageTemplateWithClients[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("message_templates")
    .select(
      `
      *,
      client_templates(client_id, client:clients(id, company_name))
    `,
    )
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []) as MessageTemplateWithClients[];
}

export async function getClientTemplates(clientId: string): Promise<MessageTemplate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_templates")
    .select("template:message_templates(*)")
    .eq("client_id", clientId);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.template as unknown as MessageTemplate);
}

async function syncClientTemplates(templateId: string, clientIds: string[]) {
  const supabase = await createClient();
  await supabase.from("client_templates").delete().eq("template_id", templateId);

  if (clientIds.length === 0) return;

  const { error } = await supabase.from("client_templates").insert(
    clientIds.map((client_id) => ({ client_id, template_id: templateId })),
  );
  if (error) throw new Error(error.message);
}

export async function createMessageTemplate(values: z.infer<typeof templateSchema>) {
  const user = await getCurrentUser();
  if (!user || !canManageTemplates(user.role)) {
    throw new Error("You do not have permission to create templates");
  }

  const parsed = templateSchema.parse(values);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("message_templates")
    .insert({
      name: parsed.name,
      body: parsed.body,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (parsed.client_ids?.length) {
    await syncClientTemplates(data.id, parsed.client_ids);
    for (const clientId of parsed.client_ids) {
      await logActivity(
        "template_assigned",
        { template_id: data.id, template_name: parsed.name },
        clientId,
      );
    }
  }

  revalidatePath("/templates");
  revalidatePath("/clients");
  return data as MessageTemplate;
}

export async function updateMessageTemplate(
  id: string,
  values: z.infer<typeof templateSchema>,
) {
  const user = await getCurrentUser();
  if (!user || !canManageTemplates(user.role)) {
    throw new Error("You do not have permission to update templates");
  }

  const parsed = templateSchema.parse(values);
  const supabase = await createClient();

  const { error } = await supabase
    .from("message_templates")
    .update({ name: parsed.name, body: parsed.body })
    .eq("id", id);

  if (error) throw new Error(error.message);

  if (parsed.client_ids !== undefined) {
    await syncClientTemplates(id, parsed.client_ids);
  }

  revalidatePath("/templates");
  revalidatePath("/clients");
  return { success: true };
}

export async function deleteMessageTemplate(id: string) {
  const user = await getCurrentUser();
  if (!user || !canDeleteTemplate(user.role)) {
    throw new Error("Only admins can delete templates");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("message_templates").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/templates");
  revalidatePath("/clients");
  return { success: true };
}
