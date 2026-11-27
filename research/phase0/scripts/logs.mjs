import { createPublicClient, http, parseAbiItem } from 'viem';
import { base } from 'viem/chains';
const c = createPublicClient({ chain: base, transport: http('https://mainnet.base.org', {retryCount: 3}) });
const addr = process.argv[2]; const from = BigInt(process.argv[3]); const to = await c.getBlockNumber();
const step = BigInt(process.argv[4] || 10000);
const evs = [parseAbiItem('event Announcement(address indexed caller, string id, string description, string uri)'), parseAbiItem('event UIMultiplierUpdated(uint256 oldMultiplier, uint256 newMultiplier, uint256 effectiveAtTimestamp)'), parseAbiItem('event MultiplierUpdated(uint256 multiplier)'), parseAbiItem('event EndAnnouncement(string id)')];
// probe max range
try { const l = await c.getLogs({address: addr, events: evs, fromBlock: from, toBlock: to}); out(l); process.exit(0);} catch(e){ console.error('full-range failed:', e.shortMessage, (e.details||'').slice(0,200)); }
let all=[]; for (let b=from; b<=to; b+=step) { const e = b+step-1n>to?to:b+step-1n; for (let i=0;i<4;i++){ try { all.push(...await c.getLogs({address: addr, events: evs, fromBlock: b, toBlock: e})); break; } catch(err){ await new Promise(r=>setTimeout(r,1500*(i+1))); if(i==3) {console.error('chunk fail',b,err.shortMessage); process.exit(2);} } } }
out(all);
function out(l){ for (const x of l) console.log(JSON.stringify({ev:x.eventName, block:String(x.blockNumber), tx:x.transactionHash, logIndex:x.logIndex, args:Object.fromEntries(Object.entries(x.args).map(([k,v])=>[k,String(v)]))})); console.error('logs', l.length, 'range', from, to); }
