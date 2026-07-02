import { z } from "zod";

export const contactSchema = z.object({
  id: z.string().uuid().optional(),
  role: z.enum(["primary", "cc_manager", "billing", "escalation"]),
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  cc_alias: z.string().optional(),
  special_instructions: z.string().optional(),
  is_default_cc: z.boolean(),
});

export const businessHourSchema = z.object({
  day_of_week: z.number().min(0).max(6),
  start_time: z.string(),
  end_time: z.string(),
  is_closed: z.boolean(),
});

export const clientSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  primary_contact_name: z.string().optional(),
  industry: z.string().optional(),
  status: z.enum(["active", "paused", "churned"]),
  billing_model: z.enum(["ppl", "ppm"]),
  billing_notes: z.string().optional(),
  city: z.string().optional(),
  state_region: z.string().optional(),
  country: z.string(),
  timezone: z.string().min(1, "Timezone is required"),
  service_area_notes: z.string().optional(),
  website: z.string().optional(),
  services_offered: z.string().optional(),
  icp_notes: z.string().optional(),
  competitor_positioning: z.string().optional(),
  internal_notes: z.string().optional(),
  smartlead_campaign_name: z.string().optional(),
  smartlead_inbox_url: z.string().optional(),
  smartlead_operator_notes: z.string().optional(),
  primary_owner_id: z.string().uuid().optional().nullable(),
  do_not_contact_before: z.string().optional().nullable(),
  do_not_contact_after: z.string().optional().nullable(),
  holiday_notes: z.string().optional(),
  contacts: z.array(contactSchema).min(1, "At least one contact is required"),
  business_hours: z.array(businessHourSchema).optional(),
});

export type ClientFormValues = z.infer<typeof clientSchema>;
export type ContactFormValues = z.infer<typeof contactSchema>;

export const quickAddClientSchema = z.object({
  company_name: z.string().min(1, "Company is required"),
  primary_contact_name: z.string().min(1, "Name is required"),
  cc_alias: z.string().optional(),
  cc_email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  timezone: z.string().min(1),
  billing_model: z.enum(["ppl", "ppm"]),
});

export type QuickAddClientValues = z.infer<typeof quickAddClientSchema>;
