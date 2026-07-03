import { Badge } from "@/components/ui/badge";
import type { BillingModel, ClientStatus, ClientTier } from "@/lib/types";
import { cn } from "@/lib/utils";

export function BillingBadge({ model }: { model: BillingModel }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium",
        model === "ppl"
          ? "border-deal-ppl/30 bg-deal-ppl/10 text-deal-ppl-fg"
          : "border-deal-ppm/30 bg-deal-ppm/10 text-deal-ppm-fg",
      )}
    >
      {model === "ppl" ? "PPL" : "PPM"}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: ClientStatus }) {
  const styles: Record<ClientStatus, string> = {
    active: "border-primary/30 bg-primary/10 text-primary",
    paused: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    churned: "border-red-500/30 bg-red-500/10 text-red-300",
  };

  return (
    <Badge variant="outline" className={cn("text-xs capitalize", styles[status])}>
      {status}
    </Badge>
  );
}

export function TierBadge({ tier }: { tier: ClientTier }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium",
        tier === "trial"
          ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
          : "border-primary/30 bg-primary/10 text-primary",
      )}
    >
      {tier === "trial" ? "Trial" : "Full"}
    </Badge>
  );
}
