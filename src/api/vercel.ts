import type { IncomingMessage, ServerResponse } from "node:http";
import type { PGlite } from "@electric-sql/pglite";
import { handle } from "./server.ts";
import { openPg, type ReadDb } from "../db/pg.ts";

// Vercel Node.js function entry. Bundled to api/index.mjs by `npm run build:api`.
// Needs DATABASE_URL = the Supabase pooler URL for the read-only `keldrin_reader` login.

/**
 * Rebuild the client's original path. Vercel rewrites every request to /api/index?__path=/<path>&<query>;
 * direct calls (tests, local) arrive unchanged. The internal __path parameter never reaches the router.
 */
export function normalisePath(url: string | undefined): string {
  const u = new URL(url ?? "/", "http://x");
  const original = u.searchParams.get("__path");
  if (original !== null) {
    u.searchParams.delete("__path");
    const qs = u.searchParams.toString();
    const path = ("/" + original.replace(/^\/+/, "")).replace(/\/+$/, "") || "/";
    return path + (qs ? "?" + qs : "");
  }
  if (u.pathname === "/api" || u.pathname === "/api/index" || u.pathname.startsWith("/api/")) {
    const rest = u.pathname === "/api" || u.pathname === "/api/index" ? "/" : u.pathname.slice(4);
    return rest + u.search;
  }
  return u.pathname + u.search;
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
