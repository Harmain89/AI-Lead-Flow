import { defineConfig } from "drizzle-kit";

/**
 * Migration config. Change `dialect` + `dbCredentials` here (and the driver in
 * db/index.ts + the import in db/schema.ts) to move off SQLite later.
 */
export default defineConfig({
  dialect: "sqlite",
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "data.sqlite",
  },
});
