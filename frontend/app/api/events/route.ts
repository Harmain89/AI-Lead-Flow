/**
 * /api/events  — workflow_events audit log (§7).
 *   POST — append an event. lead_id is optional (an invalid intake logs an
 *          event even though no lead was created — Scenario E).
 *   GET  — list events, optionally filtered by ?leadId=...
 */
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { workflowEvents } from "@/db/schema";
import { fail, guard, json, readJson } from "@/lib/api";

export async function POST(req: Request) {
  const denied = guard(req);
  if (denied) return denied;

  const body = await readJson<{
    lead_id?: string;
    workflow?: string;
    action?: string;
    status?: string;
    detail?: unknown;
    error?: string;
  }>(req);
  if (!body) return fail("invalid JSON body");
  if (!body.workflow?.trim()) return fail("workflow required");
  if (!body.action?.trim()) return fail("action required");

  const [row] = await db
    .insert(workflowEvents)
    .values({
      leadId: body.lead_id ?? null,
      workflow: body.workflow,
      action: body.action,
      status: body.status === "error" ? "error" : "ok",
      detail: body.detail ?? null,
      error: body.error ?? null,
    })
    .returning();

  return json({ event: row }, 201);
}

export async function GET(req: Request) {
  const denied = guard(req);
  if (denied) return denied;

  const leadId = new URL(req.url).searchParams.get("leadId");
  const rows = await db
    .select()
    .from(workflowEvents)
    .where(leadId ? eq(workflowEvents.leadId, leadId) : undefined)
    .orderBy(desc(workflowEvents.createdAt))
    .limit(200);

  return json({ events: rows, count: rows.length });
}
