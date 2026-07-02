export type UserRole = "admin" | "manager" | "operator" | "viewer";
export type BillingModel = "ppl" | "ppm";
export type ClientStatus = "active" | "paused" | "churned";
export type ContactRole = "primary" | "cc_manager" | "billing" | "escalation";
export type TaskStatus = "backlog" | "in_progress" | "waiting_on_client" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type ChannelType = "general" | "client" | "handoff";
export type ReportType = "daily_handoff" | "weekly_client";
export type ContactWindowStatus = "open" | "closing" | "closed";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  company_name: string;
  primary_contact_name: string | null;
  industry: string | null;
  status: ClientStatus;
  billing_model: BillingModel;
  billing_notes: string | null;
  city: string | null;
  state_region: string | null;
  country: string | null;
  timezone: string;
  service_area_notes: string | null;
  website: string | null;
  services_offered: string | null;
  icp_notes: string | null;
  competitor_positioning: string | null;
  internal_notes: string | null;
  smartlead_campaign_name: string | null;
  smartlead_inbox_url: string | null;
  smartlead_operator_notes: string | null;
  primary_owner_id: string | null;
  do_not_contact_before: string | null;
  do_not_contact_after: string | null;
  holiday_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  client_id: string;
  role: ContactRole;
  name: string;
  email: string | null;
  phone: string | null;
  cc_alias: string | null;
  special_instructions: string | null;
  is_default_cc: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessHour {
  id: string;
  client_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_closed: boolean;
}

export interface ClientNote {
  id: string;
  client_id: string;
  author_id: string | null;
  content: string;
  created_at: string;
  author?: Profile | null;
}

export interface Task {
  id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  created_by: string | null;
  due_at: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  client?: Client | null;
  assignee?: Profile | null;
}

export interface Channel {
  id: string;
  name: string;
  slug: string;
  type: ChannelType;
  client_id: string | null;
  description: string | null;
  created_at: string;
  client?: Client | null;
}

export interface Message {
  id: string;
  channel_id: string;
  author_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  author?: Profile | null;
}

export interface Report {
  id: string;
  type: ReportType;
  client_id: string | null;
  author_id: string | null;
  title: string;
  content: Record<string, unknown>;
  created_at: string;
  client?: Client | null;
  author?: Profile | null;
}

export interface ClientWithRelations extends Client {
  contacts: Contact[];
  business_hours: BusinessHour[];
  primary_owner?: Profile | null;
}

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting_on_client", label: "Waiting on Client" },
  { value: "done", label: "Done" },
];

export const TASK_PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const DEAL_TYPES: { value: BillingModel; label: string; kpi: string }[] = [
  { value: "ppl", label: "Pay-per-Lead (PPL)", kpi: "Leads generated" },
  { value: "ppm", label: "Pay-per-Meeting (PPM)", kpi: "Meetings booked" },
];

/** @deprecated Use DEAL_TYPES — kept for DB field name compatibility */
export const BILLING_MODELS = DEAL_TYPES;

export const CLIENT_STATUSES: { value: ClientStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "churned", label: "Churned" },
];

export const CONTACT_ROLES: { value: ContactRole; label: string }[] = [
  { value: "primary", label: "Primary Contact" },
  { value: "cc_manager", label: "CC Manager" },
  { value: "billing", label: "Billing" },
  { value: "escalation", label: "Escalation" },
];

export const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern (EST/EDT)" },
  { value: "America/Chicago", label: "Central (CST/CDT)" },
  { value: "America/Denver", label: "Mountain (MT/MST)" },
  { value: "America/Los_Angeles", label: "Pacific (PST/PDT)" },
  { value: "America/Phoenix", label: "Arizona (MST)" },
  { value: "Europe/London", label: "UK (GMT/BST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
];

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const TASK_TAGS = [
  "copy review",
  "inbox escalation",
  "onboarding",
  "report due",
  "client follow-up",
];
