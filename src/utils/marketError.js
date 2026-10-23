export function marketErrorMessage(error) {
  if (error?.status === 429) return 'CoinGecko has temporarily limited requests. Wait a minute before retrying. Any previously loaded figures remain visible.'
  if (error?.status === 401 || error?.status === 403) return 'CoinGecko rejected access to market statistics. The API configuration or plan may need checking.'
  if (error?.status === 404) return 'CoinGecko could not find market statistics for this coin.'
  if (error?.status >= 500) return 'CoinGecko is having a service problem. Try again shortly.'
  return 'Market statistics could not refresh. A connection failure or timeout may be responsible. Previously loaded figures remain visible; missing values are shown as —.'
}
