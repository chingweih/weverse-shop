import { SHOP_BASE_URL, DEFAULT_LOCALE, DEFAULT_CURRENCY } from './constants'
import { getBuildId } from './buildid'
import { parseNextDataResponse, extractArtistIdFromResponse } from './parser'
import { HttpFetchError } from './errors'

import type { SaleData, GetSaleOptions, Locale, Currency } from './types'

function buildDataUrl(
  buildId: string,
  saleId: number,
  artistId: number,
  locale: Locale,
  currency: Currency,
): string {
  const path = `/_next/data/${buildId}/${locale}/shop/${currency}/artists/${artistId}/sales/${saleId}.json`
  const params = new URLSearchParams({
    shopAndCurrency: currency,
    artistId: artistId.toString(),
    saleId: saleId.toString(),
  })
  return `${SHOP_BASE_URL}${path}?${params}`
}

async function fetchSaleData(
  buildId: string,
  saleId: number,
  artistId: number,
  locale: Locale,
  currency: Currency,
): Promise<{ json: unknown; response: Response }> {
  const url = buildDataUrl(buildId, saleId, artistId, locale, currency)
  const response = await fetch(url)

  if (!response.ok) {
    const responseBody = await response.text()
    throw new HttpFetchError({
      status: response.status,
      statusText: response.statusText,
      url,
      responseBody,
    })
  }

  const json = await response.json()
  return { json, response }
}

export async function getSale(
  saleId: number,
  options: GetSaleOptions = {},
): Promise<SaleData> {
  const locale = options.locale ?? DEFAULT_LOCALE
  const currency = options.currency ?? DEFAULT_CURRENCY

  let buildId = await getBuildId(false)

  // artistId might not be known upfront, so we try a common one first
  // The Next.js data endpoint seems to work with any artistId in the path
  // as long as the saleId is valid, so we use a placeholder
  const initialArtistId = options.artistId ?? 2

  try {
    const { json } = await fetchSaleData(
      buildId,
      saleId,
      initialArtistId,
      locale,
      currency,
    )

    // If artistId was not provided, extract it from the response for verification
    if (!options.artistId) {
      const extractedArtistId = extractArtistIdFromResponse(json)
      if (extractedArtistId && extractedArtistId !== initialArtistId) {
        // Refetch with correct artistId for consistency (optional, but cleaner)
        const { json: correctJson } = await fetchSaleData(
          buildId,
          saleId,
          extractedArtistId,
          locale,
          currency,
        )
        return parseNextDataResponse(correctJson)
      }
    }

    return parseNextDataResponse(json)
  } catch (error) {
    // Force buildId refresh on 404 since Next.js rotates buildIds on deployment
    if (error instanceof HttpFetchError && error.status === 404) {
      console.warn(
        'Got 404 error, buildId may be expired. Refreshing cache and retrying...',
      )

      buildId = await getBuildId(true)

      const { json } = await fetchSaleData(
        buildId,
        saleId,
        initialArtistId,
        locale,
        currency,
      )
      return parseNextDataResponse(json)
    }

    throw error
  }
}
