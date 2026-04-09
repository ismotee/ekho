export interface IconclassSearchItem {
  notation: string
  /** Finnish preferred label from Finto when available */
  finnishLabel?: string
  englishLabel?: string
  uri: string
}

interface FintoSearchResult {
  uri?: string
  notation?: string
  prefLabel?: string
}

interface FintoSearchResponse {
  results?: FintoSearchResult[]
}

interface FintoLabelResponse {
  prefLabel?: string
}

const FINTO_BASE_URL = 'https://api.finto.fi/rest/v1'
const ICONCLASS_CONCEPT_BASE = 'https://iconclass.org'

/** Notation from concept URI, e.g. https://iconclass.org/11D → 11D */
export function notationFromIconclassUri(uri: string | undefined): string | undefined {
  if (!uri?.trim()) return undefined
  try {
    const u = new URL(uri.trim())
    if (!u.hostname.endsWith('iconclass.org')) return undefined
    const seg = u.pathname.replace(/^\//, '').split('/')[0]
    return seg ? decodeURIComponent(seg) : undefined
  } catch {
    return undefined
  }
}

function normalizeUri(rawUri: string): string {
  if (rawUri.startsWith('http://')) return `https://${rawUri.slice('http://'.length)}`
  return rawUri
}

async function fintoSearch(query: string, lang: 'fi' | 'en', maxhits: number): Promise<FintoSearchResult[]> {
  const wildcardQuery = query.startsWith('*') && query.endsWith('*') ? query : `*${query}*`
  const params = new URLSearchParams({
    vocab: 'ic',
    query: wildcardQuery,
    lang,
    maxhits: String(maxhits),
  })
  const response = await fetch(`${FINTO_BASE_URL}/search?${params.toString()}`)
  if (!response.ok) return []
  const payload = (await response.json()) as FintoSearchResponse
  return payload.results ?? []
}

async function fintoLabel(uri: string, lang: 'fi' | 'en'): Promise<string | undefined> {
  const params = new URLSearchParams({
    uri,
    lang,
  })
  const response = await fetch(`${FINTO_BASE_URL}/label?${params.toString()}`)
  if (!response.ok) return undefined
  const payload = (await response.json()) as FintoLabelResponse
  return payload.prefLabel?.trim() || undefined
}

export async function fetchIconclassConceptLabels(uri: string): Promise<{ fi?: string; en?: string }> {
  const normalized = normalizeUri(uri.trim())
  const [fi, en] = await Promise.all([fintoLabel(normalized, 'fi'), fintoLabel(normalized, 'en')])
  return { fi, en }
}

export async function searchIconclass(query: string, size = 20): Promise<IconclassSearchItem[]> {
  const q = query.trim()
  if (!q) return []

  // Finnish-first search for Finnish UI. If no hits, fallback to English search
  // and still resolve Finnish labels by URI when available in Finto.
  const fiResults = await fintoSearch(q, 'fi', size)
  const enResults = fiResults.length === 0 ? await fintoSearch(q, 'en', size) : []
  const merged = [...fiResults, ...enResults]
  if (!merged.length) return []

  const dedupedByUri = new Map<string, FintoSearchResult>()
  for (const row of merged) {
    const rawUri = row.uri?.trim()
    if (!rawUri) continue
    const uri = normalizeUri(rawUri)
    if (!dedupedByUri.has(uri)) dedupedByUri.set(uri, row)
  }

  const detailItems = await Promise.all(
    [...dedupedByUri.entries()].slice(0, size).map(async ([uri, row]) => {
      const notation = row.notation?.trim() || uri.replace(`${ICONCLASS_CONCEPT_BASE}/`, '').trim()
      const finnishLabel = (await fintoLabel(uri, 'fi')) || row.prefLabel?.trim() || undefined
      const englishLabel = await fintoLabel(uri, 'en')
      return {
        notation,
        finnishLabel,
        englishLabel,
        uri,
      }
    }),
  )

  return detailItems.filter((item) => item.notation)
}
