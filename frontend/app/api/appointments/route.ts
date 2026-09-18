/**
 * /api/appointments  — booking records (Phase 2 / WF4, Google Calendar).
 *   POST — create an appointment row for a lead.
 *   GET  — list appointments (?leadId=... optional).
 * Route exists now so the schema + contract are ready; WF4 lands in Phase 2.
 */
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { fail, guard, json, readJson } from "@/lib/api";

const STATUSES = new Set(["pending", "booked", "cancelled"]);

export async function POST(req: Request) {
  const denied = guard(req);
  if (denied) return denied;

  const body = await readJson<{
    lead_id?: string;
    calendar_event_id?: string;
    scheduled_at?: string;
    status?: string;
  }>(req);
  if (!body) return fail("invalid JSON body");
  if (!body.lead_id) return fail("lead_id required");
  if (body.status && !STATUSES.has(body.status))
    return fail("status must be one of pending|booked|cancelled");

  const [row] = await db
    .insert(appointments)
    .values({
      leadId: body.lead_id,
      calendarEventId: body.calendar_event_id ?? null,
      scheduledAt: body.scheduled_at ?? null,
      status: body.status ?? "pending",
    })
    .returning();

  return json({ appointment: row }, 201);
}

export async function GET(req: Request) {
  const denied = guard(req);
  if (denied) return denied;

  const leadId = new URL(req.url).searchParams.get("leadId");
  const rows = await db
    .select()
    .from(appointments)
    .where(leadId ? eq(appointments.leadId, leadId) : undefined)
    .orderBy(desc(appointments.createdAt));

  return json({ appointments: rows, count: rows.length });
}
