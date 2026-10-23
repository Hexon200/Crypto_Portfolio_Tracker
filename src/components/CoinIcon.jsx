import { useState } from 'react'

const local = { bitcoin: 'btc', ethereum: 'eth', solana: 'sol', binancecoin: 'bnb', ripple: 'xrp', dash: 'dash', 'bitcoin-cash': 'bch', 'quant-network': 'qnt', dogecoin: 'doge', cardano: 'ada', litecoin: 'ltc', chainlink: 'link', polkadot: 'dot', tether: 'usdt', 'usd-coin': 'usdc' }

export default function CoinIcon({ id, symbol = '', image, className = 'h-8 w-8' }) {
  const [failed, setFailed] = useState([])
  const candidates = [local[id] ? `/coin-icons/${local[id]}.svg` : null, image].filter(Boolean)
  const source = candidates.find((url) => !failed.includes(url))
  return <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 ${className}`}>
    <span aria-hidden="true" className="font-mono text-[10px] font-semibold text-acid">{symbol.slice(0, 3) || '?'}</span>
    {source && <img src={source} alt="" referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-contain" onError={() => setFailed((urls) => [...urls, source])} />}
  </span>
}
