"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { quickAddClient } from "@/lib/actions/clients";
import {
  quickAddClientSchema,
  type QuickAddClientValues,
} from "@/lib/validations/client";
import { TIMEZONE_OPTIONS, getDealTypeLabel } from "@/lib/types";
import { Plus } from "lucide-react";

export function QuickAddClientDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<QuickAddClientValues>({
    resolver: zodResolver(quickAddClientSchema),
    defaultValues: {
      company_name: "",
      primary_contact_name: "",
      cc_alias: "",
      cc_email: "",
      phone: "",
      timezone: "America/New_York",
      billing_model: "ppl",
    },
  });

  const onSubmit = (values: QuickAddClientValues) => {
    startTransition(async () => {
      try {
        const client = await quickAddClient(values);
        toast.success(`${values.company_name} added`);
        setOpen(false);
        form.reset();
        router.push(`/clients/${client.id}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to add client");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button className="gap-2" />}
      >
        <Plus className="h-4 w-4" />
        Quick Add
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Company</Label>
            <Input {...form.register("company_name")} placeholder="Impeccably Clean LLC" />
          </div>
          <div className="space-y-2">
            <Label>Contact Name</Label>
            <Input {...form.register("primary_contact_name")} placeholder="Taylor Juchs" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>CC Name (Manager)</Label>
              <Input {...form.register("cc_alias")} placeholder="Taylor" />
            </div>
            <div className="space-y-2">
              <Label>CC Email</Label>
              <Input {...form.register("cc_email")} type="email" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input {...form.register("phone")} />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select
                value={form.watch("timezone")}
                onValueChange={(v) => form.setValue("timezone", v ?? "America/New_York")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Deal Type</Label>
            <Select
              value={form.watch("billing_model")}
              onValueChange={(v) =>
                form.setValue("billing_model", (v as "ppl" | "ppm") ?? "ppl")
              }
            >
              <SelectTrigger>
                <SelectValue>
                  {getDealTypeLabel(form.watch("billing_model"))}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ppl">Pay-per-Lead (PPL)</SelectItem>
                <SelectItem value="ppm">Pay-per-Meeting (PPM)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Adding..." : "Add Client"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
