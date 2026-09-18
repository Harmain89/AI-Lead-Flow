/**
 * Database client (SQLite via better-sqlite3).
 *
 * The connection is opened LAZILY on first query — never at import time — so
 * `next build` can evaluate the route modules without opening the DB (which
 * would make parallel build workers collide with SQLITE_BUSY). A global
 * singleton keeps Next.js dev hot-reload from piling up connections.
 *
 * To switch DB engines, replace the driver here (e.g. `drizzle-orm/postgres-js`)
 * — nothing else in the app changes.
 */
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const DB_FILE = process.env.DATABASE_URL ?? "data.sqlite";

type DB = BetterSQLite3Database<typeof schema>;

const globalForDb = globalThis as unknown as { __db?: DB };

function init(): DB {
  if (globalForDb.__db) return globalForDb.__db;
  const conn = new Database(DB_FILE);
  conn.pragma("journal_mode = WAL");
  conn.pragma("busy_timeout = 5000");
  conn.pragma("foreign_keys = ON");
  const instance = drizzle(conn, { schema });
  if (process.env.NODE_ENV !== "production") globalForDb.__db = instance;
  return instance;
}

/** Lazy proxy: the real connection is created on first property access. */
export const db = new Proxy({} as DB, {
  get(_target, prop, receiver) {
    const real = init();
    return Reflect.get(real, prop, receiver);
  },
});

export { schema };
