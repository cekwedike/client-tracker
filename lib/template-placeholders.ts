import { getDefaultCcContact } from "@/lib/response-template";
import type { ClientWithRelations, Contact } from "@/lib/types";

export type TemplatePreviewClient = Pick<
  ClientWithRelations,
  "id" | "company_name" | "contacts"
>;

export const TEMPLATE_PLACEHOLDERS = [
  { key: "cc_name", label: "CC name" },
  { key: "company", label: "Company" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
] as const;

export function renderTemplateBody(
  body: string,
  client: TemplatePreviewClient | ClientWithRelations,
  ccContact?: Contact,
): string {
  const contact = ccContact ?? getDefaultCcContact(client);
  const ccName = contact?.cc_alias ?? contact?.name?.split(" ")[0] ?? "";
  const phone =
    contact?.phone ?? client.contacts.find((c) => c.phone)?.phone ?? "";
  const email = contact?.email ?? "";

  const values: Record<string, string> = {
    cc_name: ccName,
    company: client.company_name ?? "",
    phone,
    email,
  };

  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] ?? `{{${key}}}`);
}

export function getTemplateCcEmail(
  client: TemplatePreviewClient | ClientWithRelations,
): string | null {
  const contact = getDefaultCcContact(client);
  const email = contact?.email?.trim();
  return email || null;
}
