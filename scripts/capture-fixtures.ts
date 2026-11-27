// Capture a recorded transcript of the verifier's live requests for the GOOGLc record, so tests can
// replay REAL responses offline. Output is labelled recorded (not synthetic) with retrieval time.
import { readFileSync, writeFileSync } from "node:fs";
import { liveTransport, verifyIssuerAction } from "../src/verify/verify.ts";

const src = process.argv[2];
const out = process.argv[3] ?? "fixtures/recorded/googlc-e82812a6.json";
const doc = JSON.parse(readFileSync(src, "utf8"));
const transcript: Record<string, unknown> = {};
const contract = String(doc.record.asset.contract_address).toLowerCase();
const key = (m: string, p: unknown) => `${m} ${JSON.stringify(p)}`;
const rec = {
  rpc: async (m: string, p: unknown[]) => {
    let r = await liveTransport.rpc(m, p);
    // Block receipts are large; keep only receipts with logs from this contract (all the verifier reads).
    if (m === "eth_getBlockReceipts") r = (r as any[]).map((rc) => ({ ...rc, logs: rc.logs.filter((l: any) => l.address.toLowerCase() === contract) })).filter((rc) => rc.logs.length);
    transcript[key(m, p)] = r;
    return structuredClone(r);
  },
  getJson: async (u: string) => ((transcript[key("GET", u)] = await liveTransport.getJson(u)), transcript[key("GET", u)]),
};
const review = await verifyIssuerAction(doc.record, rec);
writeFileSync(out, JSON.stringify({ note: "RECORDED real responses (Base mainnet RPC + Coinbase API), not synthetic. eth_getBlockReceipts responses are trimmed to receipts/logs of this contract. Used for offline replay tests only.", recorded_at: new Date().toISOString(), record: doc.record, payload_sha256: doc.payload_sha256, live_verdict: review.verdict, transcript }, null, 1) + "\n");
console.log("captured", Object.keys(transcript).length, "responses; live verdict", review.verdict);
