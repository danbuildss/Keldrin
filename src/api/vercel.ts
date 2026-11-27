import type { IncomingMessage, ServerResponse } from "node:http";
import type { PGlite } from "@electric-sql/pglite";
import { handle } from "./server.ts";
import { openPg, type ReadDb } from "../db/pg.ts";

// Vercel Node.js function entry. Bundled to api/index.mjs by `npm run build:api`.
// Needs DATABASE_URL = the Supabase pooler URL for the read-only `keldrin_reader` login.

/** Vercel may hand the function "/api/v1/events" (catch-all) or the original "/v1/events" (rewrite). */
export function normalisePath(url: string | undefined): string {
  const u = url ?? "/";
  return u === "/api" || u.startsWith("/api/") || u.startsWith("/api?") ? u.slice(4) || "/" : u;
}

export function createHandler(db: ReadDb | PGlite) {
  return (req: IncomingMessage, res: ServerResponse) => {
    req.url = normalisePath(req.url);
    return handle(db as unknown as PGlite, req, res);
  };
}

let db: ReadDb | null = null;
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  db ??= openPg(process.env.DATABASE_URL ?? "");
  return createHandler(db)(req, res);
}
