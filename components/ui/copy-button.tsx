"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/clipboard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const RESET_MS = 2000;

interface CopyButtonProps {
  value: string;
  label?: string;
  buttonText?: string;
  className?: string;
  size?: "icon-xs" | "icon-sm" | "xs" | "sm";
  variant?: "ghost" | "outline";
  showToast?: boolean;
  toastMessage?: string;
  showCopiedLabel?: boolean;
  stopPropagation?: boolean;
  disabled?: boolean;
}

export function CopyButton({
  value,
  label = "Copy to clipboard",
  buttonText,
  className,
  size = "icon-xs",
  variant = "ghost",
  showToast = false,
  toastMessage = "Copied!",
  showCopiedLabel = false,
  stopPropagation = true,
  disabled = false,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const handleCopy = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      if (stopPropagation) {
        event.preventDefault();
        event.stopPropagation();
      }

      if (!value || disabled) return;

      const ok = await copyToClipboard(value);
      if (!ok) {
        toast.error("Could not copy to clipboard");
        return;
      }

      setCopied(true);
      if (showToast) toast.success(toastMessage);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), RESET_MS);
    },
    [value, disabled, stopPropagation, showToast, toastMessage],
  );

  const iconOnly = size === "icon-xs" || size === "icon-sm";

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(
        "shrink-0 text-muted-foreground hover:text-primary",
        iconOnly && "min-h-11 min-w-11",
        copied && "text-primary",
        className,
      )}
      onClick={handleCopy}
      disabled={disabled || !value}
      aria-label={copied ? "Copied" : label}
      title={copied ? "Copied!" : label}
    >
      {copied ? (
        <Check className={cn(iconOnly && "size-3")} aria-hidden />
      ) : (
        <Copy className={cn(iconOnly && "size-3")} aria-hidden />
      )}
      {showCopiedLabel && copied && !iconOnly ? (
        <span className="text-xs">Copied</span>
      ) : (
        buttonText && !iconOnly && <span className="text-xs">{buttonText}</span>
      )}
    </Button>
  );
}
