import type { ClientWithRelations, Contact } from "./types";

const TEMPLATE_PREFIX = "Response template:";

export function getDefaultCcContact(client: ClientWithRelations): Contact | undefined {
  return (
    client.contacts.find((c) => c.is_default_cc) ??
    client.contacts.find((c) => c.role === "cc_manager") ??
    client.contacts[0]
  );
}

function extractCustomTemplate(internalNotes?: string | null): string | null {
  if (!internalNotes) return null;
  const line = internalNotes
    .split("\n")
    .find((l) => l.trim().toLowerCase().startsWith(TEMPLATE_PREFIX.toLowerCase()));
  if (!line) return null;
  return line.slice(line.indexOf(":") + 1).trim() || null;
}

function buildFromSpecialInstructions(
  instructions: string,
  phone?: string | null,
): string | null {
  const lower = instructions.toLowerCase();
  if (!lower.includes("call from")) return null;

  const match = instructions.match(/"([^"]+)"/);
  if (!match) return null;

  let template = match[1];
  if (template.includes("{Number}") && phone) {
    template = template.replace(/\{Number\}/g, phone);
  }
  return template;
}

export function buildResponseTemplate(
  client: ClientWithRelations,
  ccContact?: Contact,
): string {
  const custom = extractCustomTemplate(client.internal_notes);
  if (custom) return custom;

  const contact = ccContact ?? getDefaultCcContact(client);
  if (!contact) return "No CC contact configured.";

  if (contact.special_instructions) {
    const fromInstructions = buildFromSpecialInstructions(
      contact.special_instructions,
      contact.phone,
    );
    if (fromInstructions) return fromInstructions;
  }

  const ccName = contact.cc_alias ?? contact.name.split(" ")[0];
  const ccEmail = contact.email?.trim();

  if (ccName && ccEmail) {
    return `I'll CC ${ccName} (${ccEmail}) on this thread.`;
  }
  if (ccName) {
    return `I'll CC ${ccName} on this thread.`;
  }
  if (ccEmail) {
    return `I'll CC (${ccEmail}) on this thread.`;
  }

  return "No CC contact configured.";
}
