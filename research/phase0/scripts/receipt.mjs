import { createPublicClient, http, parseAbi, decodeEventLog } from 'viem';
import { base } from 'viem/chains';
const c = createPublicClient({ chain: base, transport: http('https://mainnet.base.org',{retryCount:4,retryDelay:1500}) });
const abi = parseAbi(['event Announcement(address indexed caller, string id, string description, string uri)','event EndAnnouncement(string id)','event UIMultiplierUpdated(uint256 oldMultiplier, uint256 newMultiplier, uint256 effectiveAtTimestamp)','event MultiplierUpdated(uint256 multiplier)','event Transfer(address indexed from, address indexed to, uint256 amount)']);
for (const h of process.argv.slice(2)) {
  const r = await c.getTransactionReceipt({hash: h}); const b = await c.getBlock({blockNumber: r.blockNumber});
  console.log('TX', h, 'status', r.status, 'block', String(r.blockNumber), 'blockHash', r.blockHash, 'time', new Date(Number(b.timestamp)*1000).toISOString(), 'from', r.from, 'to', r.to);
  for (const l of r.logs) { try { const d = decodeEventLog({abi, data: l.data, topics: l.topics}); console.log('  log', l.logIndex, l.address, d.eventName, JSON.stringify(d.args, (k,v)=>typeof v==='bigint'?v.toString():v)); } catch { console.log('  log', l.logIndex, l.address, 'undecoded', l.topics[0]); } }
}
