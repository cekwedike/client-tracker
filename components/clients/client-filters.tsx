"use client";

import { useState, useTransition } from "react";
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

export function ClientFilters() {
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

  return (
    <div className="mb-6 glass-panel p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filters
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative min-w-[200px] flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search company, contact, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-border/80 bg-background/50 pl-9 text-foreground placeholder:text-muted-foreground"
          />
        </form>
        <Select
          value={searchParams.get("billing_model") ?? ""}
          onValueChange={(v) => updateFilter("billing_model", v ?? "")}
        >
          <SelectTrigger className="w-[140px] border-border/80 bg-background/50 text-foreground">
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
          <SelectTrigger className="w-[140px] border-border/80 bg-background/50 text-foreground">
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
