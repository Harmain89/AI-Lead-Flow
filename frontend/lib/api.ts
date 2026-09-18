/**
 * Shared helpers for the DB API routes that n8n calls.
 * - `json()` / `fail()` — uniform response shapes.
 * - `guard()` — optional shared-secret check. Set LEAD_API_KEY in the env and
 *   have n8n send it as `x-api-key`; if the env var is unset, auth is skipped
 *   (convenient for local dev).
 */
import { NextResponse } from "next/server";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(error: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status });
}

/** Returns a 401 response if the request is unauthorized, otherwise null. */
export function guard(req: Request): NextResponse | null {
  const expected = process.env.LEAD_API_KEY;
  if (!expected) return null; // auth disabled in dev
  const got = req.headers.get("x-api-key");
  if (got !== expected) return fail("unauthorized", 401);
  return null;
}

export async function readJson<T = Record<string, unknown>>(
  req: Request,
): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isEmail = (v: unknown): v is string =>
  typeof v === "string" && EMAIL_RE.test(v);
