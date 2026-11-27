import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { Ajv2020 } from "ajv/dist/2020.js";
import addFormatsMod from "ajv-formats";

const addFormats = (addFormatsMod as unknown as { default?: typeof addFormatsMod }).default ?? addFormatsMod;
const schema = JSON.parse(readFileSync(new URL("../schemas/issuer-action.schema.json", import.meta.url), "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: true });
(addFormats as unknown as (a: Ajv2020) => void)(ajv);
const validate = ajv.compile(schema);
const fx = JSON.parse(readFileSync(new URL("../fixtures/recorded/googlc-e82812a6.json", import.meta.url), "utf8"));

test("recorded real GOOGLc record validates against schema v0.2", () => {
  assert.ok(validate(fx.record), JSON.stringify(validate.errors));
});

test("schema rejects floats for WAD values, wrong chain and synthetic records", () => {
  for (const mutate of [
    (r: any) => (r.action.multiplier_after_wad = 1.0003771186767842),
    (r: any) => (r.action.multiplier_after_wad = "1.0003771186767842"),
    (r: any) => (r.asset.chain_id = 1),
    (r: any) => (r.synthetic = true),
    (r: any) => (r.sources = []),
    (r: any) => (r.extra = "field"),
  ]) {
    const r = structuredClone(fx.record);
    mutate(r);
    assert.equal(validate(r), false);
  }
});

test("every exported record in records/ validates", () => {
  const files = readdirSync(new URL("../records/", import.meta.url)).filter((f) => f.startsWith("kld_") && f.endsWith(".json"));
  assert.ok(files.length >= 1);
  for (const f of files) {
    const doc = JSON.parse(readFileSync(new URL(`../records/${f}`, import.meta.url), "utf8"));
    assert.ok(validate(doc.record), `${f}: ${JSON.stringify(validate.errors)}`);
  }
});
