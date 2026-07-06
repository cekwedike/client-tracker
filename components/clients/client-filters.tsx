"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";

interface ClientFiltersProps {
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  onClearSearch?: () => void;
}

export function ClientFilters({
  searchInputRef,
  onClearSearch,
}: ClientFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => {
      router.push(`/clients?${params.toString()}`);
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter("search", search);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (!value && searchParams.get("search")) {
      onClearSearch?.();
    }
  };

  useEffect(() => {
    const current = searchParams.get("search") ?? "";
    if (search === current) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search.trim()) params.set("search", search.trim());
      else params.delete("search");
      startTransition(() => {
        router.push(`/clients?${params.toString()}`);
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [search, searchParams, router]);

  return (
    <div className="mb-6 glass-panel p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
        </div>
        <span className="hidden text-[10px] text-subtle sm:inline">
          Press <kbd className="rounded border border-border px-1 font-mono">/</kbd> to search ·{" "}
          <kbd className="rounded border border-border px-1 font-mono">?</kbd> for shortcuts
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative w-full min-w-0 flex-1 sm:min-w-[200px] sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search company, contact, CC, phone, email, city..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="border-border/80 bg-background/50 pl-9 text-foreground placeholder:text-muted-foreground"
          />
        </form>
        <Select
          value={searchParams.get("billing_model") ?? ""}
          onValueChange={(v) => updateFilter("billing_model", v ?? "")}
        >
          <SelectTrigger className="w-full border-border/80 bg-background/50 text-foreground sm:w-[140px]">
            <SelectValue placeholder="Deal type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All deal types</SelectItem>
            <SelectItem value="ppl">PPL</SelectItem>
            <SelectItem value="ppm">PPM</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={searchParams.get("status") ?? ""}
          onValueChange={(v) => updateFilter("status", v ?? "")}
        >
          <SelectTrigger className="w-full border-border/80 bg-background/50 text-foreground sm:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="churned">Churned</SelectItem>
          </SelectContent>
        </Select>
        {isPending && (
          <span className="text-xs text-muted-foreground">Filtering...</span>
        )}
      </div>
    </div>
  );
}
