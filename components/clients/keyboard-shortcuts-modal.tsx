"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SHORTCUTS = [
  { keys: ["⌘/Ctrl", "K"], description: "Open command palette" },
  { keys: ["/"], description: "Focus client search" },
  { keys: ["Esc"], description: "Clear search and blur" },
  { keys: ["?"], description: "Show keyboard shortcuts" },
];

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsModal({
  open,
  onOpenChange,
}: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Quick keys for daily client ops on this page
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2">
          {SHORTCUTS.map((shortcut) => (
            <li
              key={shortcut.description}
              className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
            >
              <span className="text-sm text-foreground">{shortcut.description}</span>
              <span className="flex gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="rounded border border-border bg-background px-2 py-0.5 font-mono text-xs text-primary"
                  >
                    {key}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

export function useClientKeyboardShortcuts(options: {
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onClearSearch: () => void;
}) {
  const { searchInputRef, onClearSearch } = options;

  return {
    handleKeyDown: (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (event.key === "?" && !isTyping && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        return "show-help" as const;
      }

      if (event.key === "/" && !isTyping && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return null;
      }

      if (event.key === "Escape" && isTyping && target === searchInputRef.current) {
        event.preventDefault();
        onClearSearch();
        searchInputRef.current?.blur();
        return null;
      }

      return null;
    },
  };
}
