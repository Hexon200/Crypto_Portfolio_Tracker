// Explicit identity mappings, never guesses from a ticker alone.
export const PAPRIKA_IDS = {
  bitcoin: 'btc-bitcoin', ethereum: 'eth-ethereum', solana: 'sol-solana', binancecoin: 'bnb-binance-coin', ripple: 'xrp-xrp',
  livepeer: 'lpt-livepeer', tether: 'usdt-tether', 'usd-coin': 'usdc-usd-coin', dogecoin: 'doge-dogecoin', cardano: 'ada-cardano',
  litecoin: 'ltc-litecoin', 'bitcoin-cash': 'bch-bitcoin-cash', chainlink: 'link-chainlink', polkadot: 'dot-polkadot',
  avalanche: 'avax-avalanche', uniswap: 'uni-uniswap', stellar: 'xlm-stellar', monero: 'xmr-monero', dash: 'dash-dash',
  zcash: 'zec-zcash', 'ethereum-classic': 'etc-ethereum-classic', cosmos: 'atom-cosmos', algorand: 'algo-algorand',
  filecoin: 'fil-filecoin', aave: 'aave-aave', near: 'near-near-protocol', 'internet-computer': 'icp-internet-computer',
  'shiba-inu': 'shib-shiba-inu', 'quant-network': 'qnt-quant', tron: 'trx-tron', tezos: 'xtz-tezos',
}
const reverse = Object.fromEntries(Object.entries(PAPRIKA_IDS).map(([id, paprika]) => [paprika, id]))
export const canonicalId = (paprikaId) => reverse[paprikaId] || `paprika:${paprikaId}`
export const paprikaId = (id) => id.startsWith('paprika:') ? id.slice(8) : PAPRIKA_IDS[id]
