export function extractSaleIdFromUrl(url: string) {
  const regex = /https:\/\/.*(?:sale|sales)\/(\d+)$/

  const match = url.match(regex)

  return match ? match[1] : null
}
