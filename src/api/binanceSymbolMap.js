// CoinGecko IDs and Binance symbols are separate namespaces. This curated map
// intentionally covers common portfolio assets rather than guessing from a coin's
// ticker (tickers can collide). TODO: expand/validate dynamically with Binance's
// public /api/v3/exchangeInfo endpoint if broader coverage becomes necessary.
//
// A missing entry is not an error: portfolio rows without a Binance market use
// CoinGecko REST polling every 30 seconds and are labeled "polling fallback".
export const BINANCE_SYMBOL_MAP = Object.freeze({
  bitcoin: 'BTCUSDT', ethereum: 'ETHUSDT', tether: 'USDTUSDT', binancecoin: 'BNBUSDT', solana: 'SOLUSDT',
  'usd-coin': 'USDCUSDT', ripple: 'XRPUSDT', dogecoin: 'DOGEUSDT', cardano: 'ADAUSDT', avalanche: 'AVAXUSDT',
  'shiba-inu': 'SHIBUSDT', 'the-open-network': 'TONUSDT', chainlink: 'LINKUSDT', 'bitcoin-cash': 'BCHUSDT', polkadot: 'DOTUSDT',
  dai: 'DAIUSDT', litecoin: 'LTCUSDT', 'matic-network': 'POLUSDT', uniswap: 'UNIUSDT', near: 'NEARUSDT',
  'internet-computer': 'ICPUSDT', aptos: 'APTUSDT', stellar: 'XLMUSDT', filecoin: 'FILUSDT', cosmos: 'ATOMUSDT',
  cronos: 'CROUSDT', arbitrum: 'ARBUSDT', optimism: 'OPUSDT', vechain: 'VETUSDT', maker: 'MKRUSDT',
  immutable: 'IMXUSDT', injective: 'INJUSDT', 'the-graph': 'GRTUSDT', aave: 'AAVEUSDT', theta: 'THETAUSDT',
  algorand: 'ALGOUSDT', fantom: 'FTMUSDT', flow: 'FLOWUSDT', 'the-sandbox': 'SANDUSDT', decentraland: 'MANAUSDT',
  'axie-infinity': 'AXSUSDT', eos: 'EOSUSDT', tezos: 'XTZUSDT', elrond: 'EGLDUSDT', neo: 'NEOUSDT',
  'kucoin-shares': 'KCSUSDT', 'rocket-pool-eth': 'RETHUSDT', 'lido-dao': 'LDOUSDT', 'quant-network': 'QNTUSDT', kaspa: 'KASUSDT',
  'render-token': 'RENDERUSDT', 'first-digital-usd': 'FDUSDUSDT', mantle: 'MNTUSDT', 'staked-ether': 'STETHUSDT', whitebit: 'WBTUSDT',
  'wrapped-bitcoin': 'WBTCUSDT', bonk: 'BONKUSDT', pepe: 'PEPEUSDT', floki: 'FLOKIUSDT', 'fetch-ai': 'FETUSDT',
  bittensor: 'TAOUSDT', 'sei-network': 'SEIUSDT', celestia: 'TIAUSDT', 'worldcoin-wld': 'WLDUSDT', 'ondo-finance': 'ONDOUSDT',
  jasmycoin: 'JASMYUSDT', coredaoorg: 'COREUSDT', 'ethena-usde': 'USDEUSDT', 'pyth-network': 'PYTHUSDT', 'jupiter-exchange-solana': 'JUPUSDT',
  thorchain: 'RUNEUSDT', 'curve-dao-token': 'CRVUSDT', pancakeswap: 'CAKEUSDT', 'ethereum-name-service': 'ENSUSDT', 'compound-governance-token': 'COMPUSDT',
  'synthetix-network-token': 'SNXUSDT', '1inch': '1INCHUSDT', chiliz: 'CHZUSDT', 'basic-attention-token': 'BATUSDT', zcash: 'ZECUSDT',
  dash: 'DASHUSDT', iota: 'IOTAUSDT', gala: 'GALAUSDT', enjincoin: 'ENJUSDT', 'mina-protocol': 'MINAUSDT',
  kava: 'KAVAUSDT', 'oasis-network': 'ROSEUSDT', 'convex-finance': 'CVXUSDT', 'frax-share': 'FXSUSDT', dydx: 'DYDXUSDT',
  starknet: 'STRKUSDT', wormhole: 'WUSDT', notcoin: 'NOTUSDT', 'dogwifcoin': 'WIFUSDT', 'beam-2': 'BEAMXUSDT',
  'singularitynet': 'AGIXUSDT', 'stepn': 'GMTUSDT', blur: 'BLURUSDT', 'trust-wallet-token': 'TWTUSDT', 'zksync': 'ZKUSDT',
})

export function toBinanceSymbol(coingeckoId) {
  if (!coingeckoId) return null
  return BINANCE_SYMBOL_MAP[coingeckoId] || null
}
