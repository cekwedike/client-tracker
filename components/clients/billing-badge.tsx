import { Badge } from "@/components/ui/badge";
import type { BillingModel, ClientStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function BillingBadge({ model }: { model: BillingModel }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium",
        model === "ppl"
          ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
          : "border-purple-500/30 bg-purple-500/10 text-purple-400",
      )}
    >
      {model === "ppl" ? "PPL" : "PPM"}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: ClientStatus }) {
  const styles: Record<ClientStatus, string> = {
    active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    paused: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    churned: "border-red-500/30 bg-red-500/10 text-red-400",
  };

  return (
    <Badge variant="outline" className={cn("text-xs capitalize", styles[status])}>
      {status}
    </Badge>
  );
}
