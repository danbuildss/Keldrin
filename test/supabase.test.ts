import { test } from "node:test";
import assert from "node:assert/strict";
import { dollarQuote, inlineParams, sqlLiteral } from "../src/db/supabase.ts";

test("parameters are inlined as safe literals", () => {
  assert.equal(sqlLiteral(null), "NULL");
  assert.equal(sqlLiteral(42), "42");
  assert.equal(sqlLiteral(true), "TRUE");
  assert.equal(sqlLiteral("O'Reilly"), "$kld$O'Reilly$kld$");
  assert.equal(inlineParams("SELECT $1, $2", ["a", 2]), "SELECT $kld$a$kld$, 2");
});

test("a value containing the quote tag cannot break out of its literal", () => {
  const evil = "x$kld$; DROP TABLE records; --";
  const q = dollarQuote(evil);
  assert.ok(q.startsWith("$kld0$") && q.endsWith("$kld0$"), q);
  assert.equal(q.slice(6, -6), evil);
});

test("$10 is not confused with $1, and unbound placeholders are rejected", () => {
  const p = Array.from({ length: 10 }, (_, i) => i + 1);
  assert.equal(inlineParams("$1,$10", p), "1,10");
  assert.throws(() => inlineParams("SELECT $1, $2", ["a"]), /unbound/);
});

test("a parameter whose text looks like a placeholder is not re-substituted", () => {
  assert.equal(inlineParams("SELECT $1, $2", ["$2", "b"]), "SELECT $kld$$2$kld$, $kld$b$kld$");
});
