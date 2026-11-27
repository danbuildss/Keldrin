import { FEEDBACK_SQL } from "../db/pg.ts";
import { clientHash } from "./trial.ts";

// POST /v1/feedback (Phase 12): the website form. Email required; X handle and message optional. Validated here and
// again by table constraints; stored only through feedback_submit (rate limited: 5 per client per day). A filled
// honeypot field gets a quiet 200 and is not stored. If storage is not enabled yet, the answer is 503, never a fake "ok".

type Out = { status: number; body: unknown };
type Db = { query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>; writeOne?: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const err = (status: number, code: string, message: string): Out => ({ status, body: { error: { code, message } } });

export async function submitFeedback(db: Db, raw: unknown, client: string): Promise<Out> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return err(400, "BAD_REQUEST", "send a JSON object");
  const b = raw as Record<string, unknown>;
  if (typeof b.website === "string" && b.website.trim()) return { status: 200, body: { data: { received: true } } }; // bot
  const email = typeof b.email === "string" ? b.email.trim() : "";
  const x = typeof b.x === "string" ? b.x.trim().replace(/^@/, "") : "";
  const message = typeof b.message === "string" ? b.message.trim() : "";
  if (!EMAIL.test(email) || email.length > 200) return err(400, "BAD_EMAIL", "Please enter a valid email.");
  if (x && !/^[A-Za-z0-9_]{1,15}$/.test(x)) return err(400, "BAD_X_HANDLE", "An X handle is up to 15 letters, numbers or underscores.");
  if (message.length > 1000) return err(400, "TOO_LONG", "Please keep the message under 1,000 characters.");
  try {
    const args = [email, x, message, clientHash(client)];
    const r = db.writeOne ? await db.writeOne(FEEDBACK_SQL, args) : await db.query(FEEDBACK_SQL, args);
    const result = r.rows[0]?.result;
    if (result === "rate_limited") return err(429, "RATE_LIMITED", "Thanks, we already have your messages for today.");
    if (result !== "ok") return err(503, "FEEDBACK_UNAVAILABLE", "Feedback could not be saved right now.");
    return { status: 200, body: { data: { received: true } } };
  } catch (e) {
    console.warn("feedback not stored:", (e as Error).message);
    return err(503, "FEEDBACK_UNAVAILABLE", "Feedback isn't open yet. Please try again soon.");
  }
}
