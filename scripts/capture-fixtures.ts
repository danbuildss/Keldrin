// Capture a recorded transcript of the verifier's live requests for the GOOGLc record, so tests can
// replay REAL responses offline. Output is labelled recorded (not synthetic) with retrieval time.
import { readFileSync, writeFileSync } from "node:fs";
import { liveTransport, verifyIssuerAction } from "../src/verify/verify.ts";

const src = process.argv[2];
const doc = JSON.parse(readFileSync(src, "utf8"));
const transcript: Record<string, unknown> = {};
const key = (m: string, p: unknown) => `${m} ${JSON.stringify(p)}`;
const rec = {
  rpc: async (m: string, p: unknown[]) => ((transcript[key(m, p)] = await liveTransport.rpc(m, p)), transcript[key(m, p)]),
  getJson: async (u: string) => ((transcript[key("GET", u)] = await liveTransport.getJson(u)), transcript[key("GET", u)]),
};
const review = await verifyIssuerAction(doc.record, rec);
writeFileSync("fixtures/recorded/googlc-e82812a6.json", JSON.stringify({ note: "RECORDED real responses (Base mainnet RPC + Coinbase API), not synthetic. Used for offline replay tests only.", recorded_at: new Date().toISOString(), record: doc.record, payload_sha256: doc.payload_sha256, live_verdict: review.verdict, transcript }, null, 1) + "\n");
console.log("captured", Object.keys(transcript).length, "responses; live verdict", review.verdict);
