/**
 * Drizzle schema — single source of truth for the database.
 *
 * Dialect: SQLite (now). Kept intentionally portable — column semantics map
 * cleanly to Postgres/MySQL later (uuid→text, jsonb→text json, timestamptz→ISO text).
 * To switch DB: swap this to `drizzle-orm/pg-core`, change `drizzle.config.ts`
 * dialect + driver, re-generate migrations. n8n never changes (it talks to the API).
 *
 * See docs/AI-Lead-Flow-Architecture.md §6.
 */
import { randomUUID } from "crypto";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID());

const isoNow = () => new Date().toISOString();

/** Primary lead record + AI-derived fields + lifecycle state (§6, §7). */
export const leads = sqliteTable("leads", {
  id: id(),
  name: text("name"),
  email: text("email").notNull(),
  phone: text("phone"),
  source: text("source").notNull().default("web_form"), // web_form / api / whatsapp
  originalMessage: text("original_message"),

  // --- AI-extracted (WF2 AI Qualification) ---
  intent: text("intent"),
  requirements: text("requirements", { mode: "json" }), // { property_type, bedrooms, location, ... }
  budget: real("budget"),
  currency: text("currency"),
  timeline: text("timeline"),
  urgency: text("urgency"), // low / medium / high
  leadScore: integer("lead_score"), // 0-100
  qualification: text("qualification"), // qualified / warm / nurture / needs_review

  // --- lifecycle / orchestration (owned by n8n) ---
  status: text("status").notNull().default("NEW"), // see §7 state machine
  nextAction: text("next_action"),
  followUpStage: text("follow_up_stage").notNull().default("none"), // none / 1 / 2 / final
  assignedAgent: text("assigned_agent"),
  paused: integer("paused", { mode: "boolean" }).notNull().default(false), // true when human-owned

  lastContactAt: text("last_contact_at"), // last outbound message (ISO)
  lastReplyAt: text("last_reply_at"), // last inbound reply (ISO)
  createdAt: text("created_at").notNull().$defaultFn(isoNow),
  updatedAt: text("updated_at").notNull().$defaultFn(isoNow),
});

/** Every inbound/outbound message tied to a lead. */
export const conversations = sqliteTable("conversations", {
  id: id(),
  leadId: text("lead_id")
    .notNull()
    .references(() => leads.id),
  sender: text("sender").notNull(), // lead / ai / human
  direction: text("direction").notNull(), // inbound / outbound
  message: text("message").notNull(),
  channel: text("channel").notNull().default("email"), // email / whatsapp / ...
  createdAt: text("created_at").notNull().$defaultFn(isoNow),
});

/** Appointment / booking records (Phase 2 — Google Calendar). */
export const appointments = sqliteTable("appointments", {
  id: id(),
  leadId: text("lead_id")
    .notNull()
    .references(() => leads.id),
  calendarEventId: text("calendar_event_id"),
  scheduledAt: text("scheduled_at"), // ISO
  status: text("status").notNull().default("pending"), // pending / booked / cancelled
  createdAt: text("created_at").notNull().$defaultFn(isoNow),
});

/**
 * Audit log for every workflow step (§7).
 * leadId is nullable on purpose: a rejected/invalid intake (Scenario E) logs an
 * event even though no lead row was created.
 */
export const workflowEvents = sqliteTable("workflow_events", {
  id: id(),
  leadId: text("lead_id").references(() => leads.id),
  workflow: text("workflow").notNull(), // lead_intake / ai_qualification / follow_up / escalation / ...
  action: text("action").notNull(), // received / scored / sent / raised / ...
  status: text("status").notNull().default("ok"), // ok / error
  detail: text("detail", { mode: "json" }),
  error: text("error"),
  createdAt: text("created_at").notNull().$defaultFn(isoNow),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
export type WorkflowEvent = typeof workflowEvents.$inferSelect;
export type NewWorkflowEvent = typeof workflowEvents.$inferInsert;
