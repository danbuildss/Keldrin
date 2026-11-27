import { createHash } from "node:crypto";

/** Deterministic JSON: object keys sorted recursively, no whitespace. bigint is rejected (use strings). */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(v: unknown): unknown {
  if (typeof v === "bigint") throw new TypeError("bigint in canonical payload; encode as decimal string");
  if (typeof v === "number" && !Number.isFinite(v)) throw new TypeError("non-finite number in canonical payload");
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v as object).sort()) {
      const val = (v as Record<string, unknown>)[k];
      if (val !== undefined) out[k] = sortKeys(val);
    }
    return out;
  }
  return v;
}

export const sha256Hex = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");

/** Hash of a record payload. The `verification` block is excluded so a review can bind to the content it reviewed. */
export function payloadHash(record: Record<string, unknown>): string {
  const { verification: _v, ...content } = record;
  return sha256Hex(canonicalJson(content));
}
