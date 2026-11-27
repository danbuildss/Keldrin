import { createPublicClient, http, parseAbi, parseAbiItem } from 'viem';
import { base } from 'viem/chains';
const c = createPublicClient({ chain: base, transport: http('https://mainnet.base.org') });
const addr = process.argv[2];
const abi = parseAbi(['function name() view returns (string)','function symbol() view returns (string)','function decimals() view returns (uint8)','function totalSupply() view returns (uint256)','function multiplier() view returns (uint256)','function newUIMultiplier() view returns (uint256)','function effectiveAt() view returns (uint256)','function contractURI() view returns (string)','function isB20(address) view returns (bool)','function extraMetadata(string) view returns (string)']);
const block = await c.getBlock();
console.log('chainId', await c.getChainId(), 'block', block.number, 'ts', new Date(Number(block.timestamp)*1000).toISOString(), 'hash', block.hash);
for (const fn of ['name','symbol','decimals','totalSupply','multiplier','newUIMultiplier','effectiveAt','contractURI']) {
  try { console.log(fn, String(await c.readContract({address: addr, abi, functionName: fn, blockNumber: block.number}))); } catch (e) { console.log(fn, 'ERR', e.shortMessage); }
}
for (const k of ['isin','reference','category','cusip','underlying']) { try { console.log('extra', k, JSON.stringify(await c.readContract({address: addr, abi, functionName: 'extraMetadata', args:[k]}))); } catch(e){ console.log('extra',k,'ERR',e.shortMessage);} }
console.log('factory.isB20', await c.readContract({address:'0xB20f000000000000000000000000000000000000', abi, functionName:'isB20', args:[addr]}).catch(e=>'ERR '+e.shortMessage));
