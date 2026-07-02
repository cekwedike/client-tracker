import type { Report } from "./types";

export function formatWeeklyReportMarkdown(report: Report): string {
  const c = report.content as Record<string, string>;
  return `# ${report.title}

**Client:** ${report.client?.company_name ?? "N/A"}
**Author:** ${report.author?.full_name ?? "Unknown"}
**Date:** ${new Date(report.created_at).toLocaleDateString()}

## Status Summary
${c.status_summary ?? ""}

## Tasks Completed
${c.tasks_completed ?? "None noted"}

## Operator Notes
${c.operator_notes ?? "None"}

## KPI Notes
${c.kpi_notes ?? "None"}
`;
}
