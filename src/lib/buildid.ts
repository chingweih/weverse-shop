import * as cheerio from 'cheerio'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { dirname } from 'path'

import { SHOP_BASE_URL, BUILDID_CACHE_FILE, BUILDID_CACHE_TTL, CACHE_DIR } from './constants'

import type { BuildIdCacheData } from './types'

export async function fetchBuildIdFromHomepage(): Promise<string> {
  const response = await fetch(SHOP_BASE_URL)

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Weverse Shop homepage (HTTP ${response.status}): ${response.statusText}\n` +
        `URL: ${SHOP_BASE_URL}`
    )
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

  throw new Error(
    'Failed to extract buildId from Weverse Shop homepage.\n' +
      'The page structure may have changed. Please report this issue.'
  )
}

export async function readBuildIdCache(): Promise<BuildIdCacheData | null> {
  try {
    if (!existsSync(BUILDID_CACHE_FILE)) {
      return null
    }

    const content = await readFile(BUILDID_CACHE_FILE, 'utf-8')
    const data = JSON.parse(content) as BuildIdCacheData

    if (typeof data.buildId !== 'string' || typeof data.timestamp !== 'number') {
      return null
    }

    return data
  } catch {
    return null
  }
}

export async function writeBuildIdCache(buildId: string): Promise<void> {
  const data: BuildIdCacheData = {
    buildId,
    timestamp: Date.now(),
  }

  if (!existsSync(CACHE_DIR)) {
    await mkdir(CACHE_DIR, { recursive: true })
  }

  await writeFile(BUILDID_CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

export function isCacheValid(cache: BuildIdCacheData): boolean {
  const now = Date.now()
  return now - cache.timestamp < BUILDID_CACHE_TTL
}

export async function getBuildId(forceRefresh = false): Promise<string> {
  if (!forceRefresh) {
    const cache = await readBuildIdCache()
    if (cache && isCacheValid(cache)) {
      return cache.buildId
    }
  }

  const buildId = await fetchBuildIdFromHomepage()
  await writeBuildIdCache(buildId)
  return buildId
}
