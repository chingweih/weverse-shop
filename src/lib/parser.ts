import { saleDataSchema } from './types'

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
    throw new Error(
      'Invalid Next.js data response structure.\n' +
        'Expected pageProps.$dehydratedState.queries array.\n' +
        'The API response format may have changed.'
    )
  }

  const queries = rawJson.pageProps.$dehydratedState.queries
  const saleQuery = queries.find((query) => {
    const queryKey = query.queryKey
    return Array.isArray(queryKey) && queryKey[0] === 'GET:/api/v1/sales/:saleId'
  })

  if (!saleQuery) {
    throw new Error(
      'Sale data not found in response.\n' +
        'Could not find query with key "GET:/api/v1/sales/:saleId".\n' +
        'Available query keys: ' +
        queries.map((q) => (Array.isArray(q.queryKey) ? q.queryKey[0] : 'unknown')).join(', ')
    )
  }

  const saleData = saleQuery.state.data
  const parseResult = saleDataSchema.safeParse(saleData)

  if (!parseResult.success) {
    throw new Error(
      'Failed to validate sale data structure.\n' +
        'Validation errors:\n' +
        parseResult.error.issues
          .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
          .join('\n')
    )
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
    return Array.isArray(queryKey) && queryKey[0] === 'GET:/api/v1/sales/:saleId'
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
