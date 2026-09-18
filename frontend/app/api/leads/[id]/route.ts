/**
 * /api/leads/[id]
 *   GET   — fetch one lead (with its conversations).
 *   PATCH — update lead fields (WF2 stores qualification; any WF writes state).
 *
 * PATCH only touches a whitelist of columns so id/createdAt can't be clobbered.
 */
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { conversations, leads } from "@/db/schema";
import { fail, guard, json, readJson } from "@/lib/api";

// columns n8n is allowed to update
const UPDATABLE = new Set([
  "name",
  "email",
  "phone",
  "source",
  "intent",
  "requirements",
  "budget",
  "currency",
  "timeline",
  "urgency",
  "leadScore",
  "qualification",
  "status",
  "nextAction",
  "followUpStage",
  "assignedAgent",
  "paused",
  "lastContactAt",
  "lastReplyAt",
]);

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = guard(req);
  if (denied) return denied;

  const { id } = await ctx.params;
  const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  if (!lead) return fail("lead not found", 404);

  const convos = await db
    .select()
    .from(conversations)
    .where(eq(conversations.leadId, id));

  return json({ lead, conversations: convos });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = guard(req);
  if (denied) return denied;

  const { id } = await ctx.params;
  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return fail("invalid JSON body");

  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (UPDATABLE.has(k)) patch[k] = v;
  }
  if (Object.keys(patch).length === 0) return fail("no updatable fields provided");
  patch.updatedAt = new Date().toISOString();

  const [updated] = await db
    .update(leads)
    .set(patch)
    .where(eq(leads.id, id))
    .returning();

  if (!updated) return fail("lead not found", 404);
  return json({ lead: updated });
}
