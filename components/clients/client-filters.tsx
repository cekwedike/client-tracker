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
import { Search } from "lucide-react";

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
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search company, contact, city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </form>
      <Select
        value={searchParams.get("billing_model") ?? ""}
        onValueChange={(v) => updateFilter("billing_model", v ?? "")}
      >
        <SelectTrigger className="w-[140px]">
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
        <SelectTrigger className="w-[140px]">
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
  );
}
