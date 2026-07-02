export function buildCcLeadBlock(options: {
  ccName?: string | null;
  ccEmail?: string | null;
  phone?: string | null;
  companyName?: string | null;
  includeCompany?: boolean;
}): string {
  const ccName = options.ccName?.trim();
  const ccEmail = options.ccEmail?.trim();
  const phone = options.phone?.trim();
  const companyName = options.companyName?.trim();

  if (options.includeCompany && companyName) {
    const parts = [companyName];
    if (ccName) parts.push(`CC ${ccName}`);
    if (ccEmail) parts.push(ccEmail);
    if (phone) parts.push(phone);
    return parts.join(" — ");
  }

  const lines: string[] = [];
  if (ccName) lines.push(`CC as ${ccName}`);
  if (ccEmail) lines.push(ccEmail);
  if (phone) lines.push(phone);
  return lines.join("\n");
}
