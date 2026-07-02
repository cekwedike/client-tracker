"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClientRecord, updateClient } from "@/lib/actions/clients";
import {
  clientSchema,
  type ClientFormValues,
} from "@/lib/validations/client";
import {
  DEAL_TYPES,
  CLIENT_STATUSES,
  CONTACT_ROLES,
  TIMEZONE_OPTIONS,
  type ClientWithRelations,
  type Profile,
} from "@/lib/types";
import { getDefaultBusinessHours } from "@/lib/timezone";
import { BusinessHoursEditor } from "@/components/clients/business-hours-editor";
import { Plus, Trash2 } from "lucide-react";

interface ClientFormProps {
  client?: ClientWithRelations;
  profiles?: Profile[];
}

export function ClientForm({ client, profiles = [] }: ClientFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(client);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: client
      ? {
          company_name: client.company_name,
          primary_contact_name: client.primary_contact_name ?? "",
          industry: client.industry ?? "",
          status: client.status,
          billing_model: client.billing_model,
          billing_notes: client.billing_notes ?? "",
          city: client.city ?? "",
          state_region: client.state_region ?? "",
          country: client.country ?? "US",
          timezone: client.timezone,
          service_area_notes: client.service_area_notes ?? "",
          website: client.website ?? "",
          services_offered: client.services_offered ?? "",
          icp_notes: client.icp_notes ?? "",
          competitor_positioning: client.competitor_positioning ?? "",
          internal_notes: client.internal_notes ?? "",
          smartlead_campaign_name: client.smartlead_campaign_name ?? "",
          smartlead_inbox_url: client.smartlead_inbox_url ?? "",
          smartlead_operator_notes: client.smartlead_operator_notes ?? "",
          primary_owner_id: client.primary_owner_id,
          do_not_contact_before: client.do_not_contact_before,
          do_not_contact_after: client.do_not_contact_after,
          holiday_notes: client.holiday_notes ?? "",
          contacts: client.contacts.length
            ? client.contacts.map((c) => ({
                id: c.id,
                role: c.role,
                name: c.name,
                email: c.email ?? "",
                phone: c.phone ?? "",
                cc_alias: c.cc_alias ?? "",
                special_instructions: c.special_instructions ?? "",
                is_default_cc: c.is_default_cc,
              }))
            : [
                {
                  role: "primary" as const,
                  name: client.primary_contact_name ?? "",
                  is_default_cc: false,
                },
              ],
          business_hours:
            client.business_hours.length > 0
              ? client.business_hours.map((h) => ({
                  day_of_week: h.day_of_week,
                  start_time: h.start_time,
                  end_time: h.end_time,
                  is_closed: h.is_closed,
                }))
              : getDefaultBusinessHours(),
        }
      : {
          company_name: "",
          primary_contact_name: "",
          status: "active",
          billing_model: "ppl",
          country: "US",
          timezone: "America/New_York",
          contacts: [
            { role: "primary", name: "", is_default_cc: false },
            { role: "cc_manager", name: "", is_default_cc: true },
          ],
          business_hours: getDefaultBusinessHours(),
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contacts",
  });

  const onSubmit = (values: ClientFormValues) => {
    startTransition(async () => {
      try {
        if (isEdit && client) {
          await updateClient(client.id, values);
          toast.success("Client updated");
          router.push(`/clients/${client.id}`);
        } else {
          const created = await createClientRecord(values);
          toast.success("Client created");
          router.push(`/clients/${created.id}`);
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Company Name *</Label>
            <Input {...form.register("company_name")} />
          </div>
          <div className="space-y-2">
            <Label>Primary Contact</Label>
            <Input {...form.register("primary_contact_name")} />
          </div>
          <div className="space-y-2">
            <Label>Industry</Label>
            <Input {...form.register("industry")} placeholder="Commercial Cleaning" />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.watch("status")}
              onValueChange={(v) =>
                form.setValue("status", (v as ClientFormValues["status"]) ?? "active")
              }
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CLIENT_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Deal Type</Label>
            <Select
              value={form.watch("billing_model")}
              onValueChange={(v) =>
                form.setValue("billing_model", (v as ClientFormValues["billing_model"]) ?? "ppl")
              }
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DEAL_TYPES.map((b) => (
                  <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Assigned Operator</Label>
            <Select
              value={form.watch("primary_owner_id") ?? ""}
              onValueChange={(v) => form.setValue("primary_owner_id", v || null)}
            >
              <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name ?? p.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Deal Notes</Label>
            <Textarea {...form.register("billing_notes")} rows={2} placeholder="e.g. rate context, contract terms..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Location & Timezone</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>City</Label>
            <Input {...form.register("city")} />
          </div>
          <div className="space-y-2">
            <Label>State / Region</Label>
            <Input {...form.register("state_region")} />
          </div>
          <div className="space-y-2">
            <Label>Country</Label>
            <Input {...form.register("country")} />
          </div>
          <div className="space-y-2">
            <Label>Timezone *</Label>
            <Select
              value={form.watch("timezone")}
              onValueChange={(v) => form.setValue("timezone", v ?? "America/New_York")}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEZONE_OPTIONS.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Do Not Contact Before</Label>
            <Input type="time" {...form.register("do_not_contact_before")} />
          </div>
          <div className="space-y-2">
            <Label>Do Not Contact After</Label>
            <Input type="time" {...form.register("do_not_contact_after")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Service Area Notes</Label>
            <Textarea {...form.register("service_area_notes")} rows={2} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Holiday / blackout notes</Label>
            <Textarea {...form.register("holiday_notes")} rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <BusinessHoursEditor form={form} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Contacts</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ role: "primary", name: "", is_default_cc: false })
            }
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Add Contact
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="rounded-lg border border-border/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium">Contact {index + 1}</span>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={form.watch(`contacts.${index}.role`)}
                    onValueChange={(v) =>
                      form.setValue(
                        `contacts.${index}.role`,
                        (v as ClientFormValues["contacts"][0]["role"]) ?? "primary",
                      )
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONTACT_ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input {...form.register(`contacts.${index}.name`)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input {...form.register(`contacts.${index}.email`)} type="email" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input {...form.register(`contacts.${index}.phone`)} />
                </div>
                <div className="space-y-2">
                  <Label>CC Alias (mention as)</Label>
                  <Input {...form.register(`contacts.${index}.cc_alias`)} placeholder="Glenn" />
                </div>
                <div className="space-y-2 flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      {...form.register(`contacts.${index}.is_default_cc`)}
                      className="rounded"
                    />
                    Default CC for replies
                  </label>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Special Instructions</Label>
                  <Textarea
                    {...form.register(`contacts.${index}.special_instructions`)}
                    rows={2}
                    placeholder="e.g. Email accounts already named after, just say I'll call from..."
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campaign & Ops References</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Website</Label>
            <Input {...form.register("website")} />
          </div>
          <div className="space-y-2">
            <Label>Campaign Name</Label>
            <Input {...form.register("smartlead_campaign_name")} placeholder="As it appears in your outreach tool" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Inbox Link</Label>
            <Input {...form.register("smartlead_inbox_url")} placeholder="Optional bookmark URL for this client's inbox" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Services Offered</Label>
            <Textarea {...form.register("services_offered")} rows={2} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>ICP Notes</Label>
            <Textarea {...form.register("icp_notes")} rows={2} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Operator Notes</Label>
            <Textarea {...form.register("smartlead_operator_notes")} rows={2} placeholder="Inbox-specific notes for your team" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Internal Notes</Label>
            <Textarea {...form.register("internal_notes")} rows={3} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" className="bg-emerald-700 hover:bg-emerald-600" disabled={isPending}>
          {isPending ? "Saving..." : isEdit ? "Update Client" : "Create Client"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
