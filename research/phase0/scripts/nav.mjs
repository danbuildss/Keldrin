import { createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';
const c = createPublicClient({ chain: base, transport: http('https://mainnet.base.org',{retryCount:4,retryDelay:1500}) });
const feed = process.argv[2]; const tok = process.argv[3];
const abi = parseAbi(['function decimals() view returns (uint8)','function description() view returns (string)','function latestRoundData() view returns (uint80,int256,uint256,uint256,uint80)','function version() view returns (uint256)','function multiplier() view returns (uint256)']);
for (const bn of process.argv.slice(4).map(BigInt)) {
  try {
    const [d, desc, rd, m] = await Promise.all([c.readContract({address:feed,abi,functionName:'decimals',blockNumber:bn}), c.readContract({address:feed,abi,functionName:'description',blockNumber:bn}), c.readContract({address:feed,abi,functionName:'latestRoundData',blockNumber:bn}), c.readContract({address:tok,abi,functionName:'multiplier',blockNumber:bn})]);
    console.log('block',String(bn),'desc',desc,'dec',d,'answer',String(rd[1]),'updatedAt',new Date(Number(rd[3])*1000).toISOString(),'round',String(rd[0]),'tokenMultiplier',String(m));
  } catch(e) { console.log('block',String(bn),'ERR',e.shortMessage, (e.details||'').slice(0,160)); }
}
