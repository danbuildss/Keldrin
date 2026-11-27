import { decodeEventLog, decodeFunctionResult, encodeFunctionData, getAddress, parseAbi, type Hex } from "viem";
import { LIMITS, RPC_AUTH_HEADERS, RPC_URL } from "../config.ts";
import { fetchText } from "../lib/http.ts";

// Researcher-side chain adapter. JSON-RPC goes through fetchText (allowlist, throttle, retries);
// viem is used only to encode calls and decode results/logs.

export const TOKEN_ABI = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function multiplier() view returns (uint256)",
  "function newUIMultiplier() view returns (uint256)",
  "function effectiveAt() view returns (uint256)",
  "function extraMetadata(string) view returns (string)",
  "function OPERATOR_ROLE() view returns (bytes32)",
  "function hasRole(bytes32,address) view returns (bool)",
  "function isB20(address) view returns (bool)",
  "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)",
  "function description() view returns (string)",
  "function getRoundData(uint80) view returns (uint80, int256, uint256, uint256, uint80)",
  "function phaseId() view returns (uint16)",
  "function phaseAggregators(uint16) view returns (address)",
  "function latestRound() view returns (uint256)",
]);

export const EVENT_ABI = parseAbi([
  "event Announcement(address indexed caller, string id, string description, string uri)",
  "event EndAnnouncement(string id)",
  "event UIMultiplierUpdated(uint256 oldMultiplier, uint256 newMultiplier, uint256 effectiveAtTimestamp)",
  "event MultiplierUpdated(uint256 multiplier)",
]);

const MULTICALL3 = "0xcA11bde05977b3631167028862bE2a173976CA11";
const MULTICALL_ABI = parseAbi([
  "struct Call3 { address target; bool allowFailure; bytes callData; }",
  "struct Result { bool success; bytes returnData; }",
  "function aggregate3(Call3[] calls) payable returns (Result[] returnData)",
]);

export type RpcLog = { address: string; topics: Hex[]; data: Hex; logIndex: string; transactionHash: Hex; blockNumber: string };
export type RpcReceipt = { transactionHash: Hex; blockNumber: string; blockHash: Hex; status: string; from: string; to: string | null; logs: RpcLog[] };
export type BlockRef = { number: bigint; hash: Hex; timestamp: bigint };

let rpcId = 0;
export let rpcCalls = 0;

export async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetchText(RPC_URL, {
    method: "POST",
    body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params }),
    headers: { "content-type": "application/json", ...RPC_AUTH_HEADERS },
    minIntervalMs: LIMITS.rpcMinIntervalMs,
    retryOn: (_s, body) => body.includes('"code":-32011') || body.includes('"code":-32005'),
  });
  rpcCalls++;
  const j = JSON.parse(res.body) as { result?: T; error?: { code: number; message: string } };
  if (j.error) throw new Error(`rpc ${method} error ${j.error.code}: ${j.error.message}`);
  return j.result as T;
}

const hexBlock = (b: bigint | "latest") => (b === "latest" ? "latest" : `0x${b.toString(16)}`);

export async function getBlock(b: bigint | "latest"): Promise<BlockRef> {
  const blk = await rpc<{ number: Hex; hash: Hex; timestamp: Hex }>("eth_getBlockByNumber", [hexBlock(b), false]);
  return { number: BigInt(blk.number), hash: blk.hash, timestamp: BigInt(blk.timestamp) };
}

export const getReceipt = (tx: string) => rpc<RpcReceipt>("eth_getTransactionReceipt", [tx]);
export const getBlockReceipts = (b: bigint) => rpc<RpcReceipt[]>("eth_getBlockReceipts", [hexBlock(b)]);
export const getCode = (a: string, b: bigint | "latest") => rpc<Hex>("eth_getCode", [a, hexBlock(b)]);

type Fn = (typeof TOKEN_ABI)[number]["name"];

/** Single eth_call; returns null when the contract has no code / reverts at that block. */
export async function read(address: string, fn: Fn, args: readonly unknown[], block: bigint | "latest"): Promise<unknown | null> {
  const data = encodeFunctionData({ abi: TOKEN_ABI, functionName: fn, args } as never);
  try {
    const out = await rpc<Hex>("eth_call", [{ to: address, data }, hexBlock(block)]);
    if (!out || out === "0x") return null;
    return decodeFunctionResult({ abi: TOKEN_ABI, functionName: fn, data: out } as never);
  } catch (e) {
    if (/revert|execution/i.test(String(e))) return null;
    throw e;
  }
}

/** Batched reads through Multicall3 at one block. Failed sub-calls come back as null. */
export async function readMany(calls: { address: string; fn: Fn; args?: readonly unknown[] }[], block: bigint | "latest", batch = 150): Promise<(unknown | null)[]> {
  const out: (unknown | null)[] = [];
  for (let i = 0; i < calls.length; i += batch) {
    const chunk = calls.slice(i, i + batch);
    const data = encodeFunctionData({
      abi: MULTICALL_ABI,
      functionName: "aggregate3",
      args: [chunk.map((c) => ({ target: c.address as Hex, allowFailure: true, callData: encodeFunctionData({ abi: TOKEN_ABI, functionName: c.fn, args: c.args ?? [] } as never) }))],
    });
    const raw = await rpc<Hex>("eth_call", [{ to: MULTICALL3, data }, hexBlock(block)]);
    const results = decodeFunctionResult({ abi: MULTICALL_ABI, functionName: "aggregate3", data: raw }) as readonly { success: boolean; returnData: Hex }[];
    results.forEach((r, j) => {
      if (!r.success || r.returnData === "0x") return out.push(null);
      try {
        out.push(decodeFunctionResult({ abi: TOKEN_ABI, functionName: chunk[j].fn, data: r.returnData } as never));
      } catch {
        out.push(null);
      }
    });
  }
  return out;
}

export type DecodedLog = { eventName: string; args: Record<string, string>; logIndex: number; address: string; txHash: string; blockNumber: bigint };

/** Decode the B20 events we care about; other logs are ignored. Values are stringified (no floats). */
export function decodeB20Logs(logs: RpcLog[], address: string): DecodedLog[] {
  const want = getAddress(address);
  const out: DecodedLog[] = [];
  for (const l of logs) {
    if (getAddress(l.address) !== want) continue;
    try {
      const d = decodeEventLog({ abi: EVENT_ABI, data: l.data, topics: l.topics as [Hex, ...Hex[]] });
      out.push({
        eventName: d.eventName,
        args: Object.fromEntries(Object.entries(d.args as Record<string, unknown>).map(([k, v]) => [k, String(v)])),
        logIndex: Number(BigInt(l.logIndex)),
        address: want,
        txHash: l.transactionHash,
        blockNumber: BigInt(l.blockNumber),
      });
    } catch {
      // not one of our events (e.g. Transfer); ignore
    }
  }
  return out.sort((a, b) => (a.blockNumber === b.blockNumber ? a.logIndex - b.logIndex : Number(a.blockNumber - b.blockNumber)));
}
