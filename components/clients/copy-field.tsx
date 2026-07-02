"use client";

import type { ReactNode } from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";

interface CopyFieldProps {
  value: string;
  label: string;
  children?: ReactNode;
  className?: string;
  valueClassName?: string;
  stopPropagation?: boolean;
}

export function CopyField({
  value,
  label,
  children,
  className,
  valueClassName,
  stopPropagation = true,
}: CopyFieldProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-1", className)}>
      <div className={cn("min-w-0 flex-1", valueClassName)}>{children ?? value}</div>
      <CopyButton
        value={value}
        label={`Copy ${label}`}
        stopPropagation={stopPropagation}
      />
    </div>
  );
}
