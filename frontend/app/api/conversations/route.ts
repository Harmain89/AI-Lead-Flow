/**
 * /api/conversations
 *   POST — record a message (AI reply, follow-up, or inbound lead reply).
 *   GET  — list messages for a lead (?leadId=...).
 */
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { conversations } from "@/db/schema";
import { fail, guard, json, readJson } from "@/lib/api";

const SENDERS = new Set(["lead", "ai", "human"]);
const DIRECTIONS = new Set(["inbound", "outbound"]);

export async function POST(req: Request) {
  const denied = guard(req);
  if (denied) return denied;

  const body = await readJson<{
    lead_id?: string;
    sender?: string;
    direction?: string;
    message?: string;
    channel?: string;
  }>(req);
  if (!body) return fail("invalid JSON body");
  if (!body.lead_id) return fail("lead_id required");
  if (!body.sender || !SENDERS.has(body.sender))
    return fail("sender must be one of lead|ai|human");
  if (!body.direction || !DIRECTIONS.has(body.direction))
    return fail("direction must be one of inbound|outbound");
  if (!body.message?.trim()) return fail("message required");

  const [row] = await db
    .insert(conversations)
    .values({
      leadId: body.lead_id,
      sender: body.sender,
      direction: body.direction,
      message: body.message,
      channel: body.channel?.trim() || "email",
    })
    .returning();

  return json({ conversation: row }, 201);
}

export async function GET(req: Request) {
  const denied = guard(req);
  if (denied) return denied;

  const leadId = new URL(req.url).searchParams.get("leadId");
  if (!leadId) return fail("leadId query param required");

  const rows = await db
    .select()
    .from(conversations)
    .where(eq(conversations.leadId, leadId))
    .orderBy(desc(conversations.createdAt));

  return json({ conversations: rows, count: rows.length });
}
