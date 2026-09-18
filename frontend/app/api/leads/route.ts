/**
 * /api/leads
 *   POST — create a lead (WF1 Lead Intake).
 *   GET  — list leads, with filters used by WF6 Follow-up Scheduler.
 *
 * n8n calls these via the HTTP Request node. See docs §6, §4 (WF1/WF6).
 */
import { and, desc, eq, inArray, lte } from "drizzle-orm";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { fail, guard, isEmail, json, readJson } from "@/lib/api";

export async function POST(req: Request) {
  const denied = guard(req);
  if (denied) return denied;

  const body = await readJson<{
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
    original_message?: string;
    source?: string;
  }>(req);
  if (!body) return fail("invalid JSON body");
  if (!isEmail(body.email)) return fail("email required");

  const [row] = await db
    .insert(leads)
    .values({
      name: body.name?.trim() || null,
      email: body.email.trim().toLowerCase(),
      phone: body.phone?.trim() || null,
      source: body.source?.trim() || "web_form",
      originalMessage: body.original_message ?? body.message ?? null,
      status: "NEW",
    })
    .returning();

  return json({ lead_id: row.id, status: "received", lead: row }, 201);
}

export async function GET(req: Request) {
  const denied = guard(req);
  if (denied) return denied;

  const url = new URL(req.url);
  const filters = [];

  const status = url.searchParams.get("status"); // comma-separated
  if (status) filters.push(inArray(leads.status, status.split(",").map((s) => s.trim())));

  const paused = url.searchParams.get("paused");
  if (paused === "true" || paused === "false")
    filters.push(eq(leads.paused, paused === "true"));

  // leads whose last outbound message is older than this ISO instant (due for follow-up)
  const dueBefore = url.searchParams.get("dueBefore");
  if (dueBefore) filters.push(lte(leads.lastContactAt, dueBefore));

  const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 500);

  const rows = await db
    .select()
    .from(leads)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(leads.createdAt))
    .limit(limit);

  return json({ leads: rows, count: rows.length });
}
