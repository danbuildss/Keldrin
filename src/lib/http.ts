import { createHash } from "node:crypto";
import { ALLOWED_HOSTS, HTTP_USER_AGENT, LIMITS } from "../config.ts";

export type Fetched = { url: string; status: number; body: string; sha256: string; retrievedAt: string; bytes: number };

export class HttpError extends Error {
  status: number;
  url: string;
  constructor(message: string, status: number, url: string) {
    super(message);
    this.status = status;
    this.url = url;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const lastCall = new Map<string, number>();

/** Throttle per host so bounded jobs never burst against a source. */
async function throttle(host: string, minIntervalMs: number) {
  const now = Date.now();
  const wait = (lastCall.get(host) ?? 0) + minIntervalMs - now;
  if (wait > 0) await sleep(wait);
  lastCall.set(host, Date.now());
}

export function assertAllowed(url: string) {
  const u = new URL(url);
  if (u.protocol !== "https:") throw new HttpError(`blocked non-https url ${url}`, 0, url);
  if (!ALLOWED_HOSTS.has(u.host)) throw new HttpError(`host not allowlisted: ${u.host}`, 0, url);
}

/**
 * Fetch with host allowlist, no redirects to other hosts, size cap, timeout and bounded retries.
 * Fetched content is untrusted data: callers parse it, never execute or follow instructions in it.
 */
export async function fetchText(
  url: string,
  opts: { method?: string; body?: string; headers?: Record<string, string>; minIntervalMs?: number; retryOn?: (status: number, body: string) => boolean } = {},
): Promise<Fetched> {
  assertAllowed(url);
  const host = new URL(url).host;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= LIMITS.maxAttempts; attempt++) {
    await throttle(host, opts.minIntervalMs ?? 100);
    try {
      const res = await fetch(url, {
        method: opts.method ?? "GET",
        body: opts.body,
        redirect: "manual",
        headers: { "user-agent": HTTP_USER_AGENT, accept: "application/json", ...opts.headers },
        signal: AbortSignal.timeout(LIMITS.httpTimeoutMs),
      });
      if (res.status >= 300 && res.status < 400) throw new HttpError(`redirect refused (${res.status})`, res.status, url);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > LIMITS.maxResponseBytes) throw new HttpError(`response too large (${buf.length})`, res.status, url);
      const body = buf.toString("utf8");
      const retry = res.status === 429 || res.status >= 500 || (opts.retryOn?.(res.status, body) ?? false);
      if (retry && attempt < LIMITS.maxAttempts) {
        await sleep(1000 * 2 ** attempt);
        continue;
      }
      return {
        url,
        status: res.status,
        body,
        sha256: createHash("sha256").update(buf).digest("hex"),
        retrievedAt: new Date().toISOString(),
        bytes: buf.length,
      };
    } catch (e) {
      lastErr = e;
      if (e instanceof HttpError && e.status === 0) throw e; // policy errors are never retried
      if (attempt < LIMITS.maxAttempts) await sleep(1000 * 2 ** attempt);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export async function fetchJson<T = unknown>(url: string, opts: Parameters<typeof fetchText>[1] = {}): Promise<{ data: T; meta: Fetched }> {
  const meta = await fetchText(url, opts);
  if (meta.status !== 200) throw new HttpError(`HTTP ${meta.status} from ${url}: ${meta.body.slice(0, 200)}`, meta.status, url);
  return { data: JSON.parse(meta.body) as T, meta };
}
