import * as cheerio from 'cheerio'

import { SHOP_BASE_URL, BUILDID_CACHE_TTL } from './constants'
import { HttpFetchError, BuildIdExtractionError } from './errors'

import type { BuildIdCacheData } from './types'

// In-memory cache (persists within worker isolate lifecycle)
let buildIdCache: BuildIdCacheData | null = null

export async function fetchBuildIdFromHomepage(): Promise<string> {
  const response = await fetch(SHOP_BASE_URL)

  if (!response.ok) {
    const responseBody = await response.text()
    throw new HttpFetchError({
      status: response.status,
      statusText: response.statusText,
      url: SHOP_BASE_URL,
      responseBody,
    })
  }

  const html = await response.text()
  const $ = cheerio.load(html)

  const buildIdMatch = html.match(/"buildId"\s*:\s*"([^"]+)"/)
  if (buildIdMatch?.[1]) {
    return buildIdMatch[1]
  }

  let buildId: string | null = null
  $('script[src]').each((_, el) => {
    const src = $(el).attr('src')
    if (src) {
      const match = src.match(/\/_next\/static\/([^/]+)\/_/)
      if (match?.[1]) {
        buildId = match[1]
        return false
      }
    }
  })

  if (buildId) {
    return buildId
  }

  throw new BuildIdExtractionError(html)
}

export function readBuildIdCache(): BuildIdCacheData | null {
  return buildIdCache
}

export function writeBuildIdCache(buildId: string): void {
  buildIdCache = {
    buildId,
    timestamp: Date.now(),
  }
}

export function isCacheValid(cache: BuildIdCacheData): boolean {
  const now = Date.now()
  return now - cache.timestamp < BUILDID_CACHE_TTL
}

export async function getBuildId(forceRefresh = false): Promise<string> {
  if (!forceRefresh) {
    const cache = readBuildIdCache()
    if (cache && isCacheValid(cache)) {
      return cache.buildId
    }
  }

  const buildId = await fetchBuildIdFromHomepage()
  writeBuildIdCache(buildId)
  return buildId
}
