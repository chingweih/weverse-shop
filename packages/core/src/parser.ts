import { saleDataSchema } from './types'
import {
  InvalidResponseStructureError,
  SaleNotFoundError,
  ValidationError,
} from './errors'

import type { SaleData } from './types'

type DehydratedQuery = {
  queryKey: unknown[]
  state: {
    data: unknown
  }
}

type NextDataResponse = {
  pageProps: {
    $dehydratedState: {
      queries: DehydratedQuery[]
    }
  }
}

function isNextDataResponse(data: unknown): data is NextDataResponse {
  if (typeof data !== 'object' || data === null) {
    return false
  }

  const obj = data as Record<string, unknown>
  if (typeof obj.pageProps !== 'object' || obj.pageProps === null) {
    return false
  }

  const pageProps = obj.pageProps as Record<string, unknown>
  const dehydratedState = pageProps['$dehydratedState']
  if (typeof dehydratedState !== 'object' || dehydratedState === null) {
    return false
  }

  const state = dehydratedState as Record<string, unknown>
  return Array.isArray(state.queries)
}

export function parseNextDataResponse(rawJson: unknown): SaleData {
  if (!isNextDataResponse(rawJson)) {
    throw new InvalidResponseStructureError(
      'Invalid Next.js data response structure.\n' +
        'Expected pageProps.$dehydratedState.queries array.\n' +
        'The API response format may have changed.',
      rawJson,
    )
  }

  const queries = rawJson.pageProps.$dehydratedState.queries
  const saleQuery = queries.find((query) => {
    const queryKey = query.queryKey
    return (
      Array.isArray(queryKey) && queryKey[0] === 'GET:/api/v1/sales/:saleId'
    )
  })

  if (!saleQuery) {
    const availableQueryKeys = queries.map((q) =>
      Array.isArray(q.queryKey) ? String(q.queryKey[0]) : 'unknown',
    )

    // Extract saleId from the query if available
    const saleIdMatch = queries
      .flatMap((q) => (Array.isArray(q.queryKey) ? q.queryKey : []))
      .find((key) => typeof key === 'number')

    throw new SaleNotFoundError(saleIdMatch ?? 0, availableQueryKeys)
  }

  const saleData = saleQuery.state.data
  const parseResult = saleDataSchema.safeParse(saleData)

  if (!parseResult.success) {
    throw new ValidationError(parseResult.error.issues, saleData)
  }

  return parseResult.data
}

export function extractArtistIdFromResponse(rawJson: unknown): number | null {
  if (!isNextDataResponse(rawJson)) {
    return null
  }

  const queries = rawJson.pageProps.$dehydratedState.queries
  const saleQuery = queries.find((query) => {
    const queryKey = query.queryKey
    return (
      Array.isArray(queryKey) && queryKey[0] === 'GET:/api/v1/sales/:saleId'
    )
  })

  if (!saleQuery) {
    return null
  }

  const saleData = saleQuery.state.data as Record<string, unknown> | null
  if (!saleData) {
    return null
  }

  const artistInfo = saleData.labelArtistInfo as Record<string, unknown> | null
  if (!artistInfo) {
    return null
  }

  const artistId = artistInfo.labelArtistId
  if (typeof artistId === 'number') {
    return artistId
  }

  return null
}
