/**
 * YSO / KOKO vocabularies via Finto REST API.
 * YSO toiminta -juuri: http://www.yso.fi/onto/yso/p8090 (toiminta)
 * KOKO (koko Suomen ontologia): http://www.yso.fi/onto/koko/
 */

const FINTO_BASE_URL = 'https://api.finto.fi/rest/v1'

export const YSO_TOIMINTA_ROOT_URI = 'http://www.yso.fi/onto/yso/p8090'

export const KOKO_ONTOLOGY_BASE_URI = 'http://www.yso.fi/onto/koko/'

interface FintoSearchResult {
  uri?: string
  prefLabel?: string
  type?: string[]
}

interface FintoSearchResponse {
  results?: FintoSearchResult[]
}

interface FintoLabelResponse {
  prefLabel?: string
}

/** Normalize to https for stable storage and Finto label lookups. */
export function normalizeYsoUri(rawUri: string): string {
  const t = rawUri.trim()
  if (t.startsWith('http://')) return `https://${t.slice('http://'.length)}`
  return t
}

/** Finto browser URL for a YSO concept URI, or undefined if not a YSO concept URI. */
export function fintoYsoBrowserUrl(uri: string, lang: 'fi' | 'en' = 'fi'): string | undefined {
  const u = uri.trim()
  const m = u.match(/\/yso\/(p\d+)\s*$/i)
  if (!m) return undefined
  return `https://finto.fi/yso/${lang}/page/${m[1]}`
}

/** Finto browser URL for YSO, KOKO, or MAO/TAO concept URIs (`in_scheme`), or undefined. */
export function fintoConceptBrowserUrl(uri: string, lang: 'fi' | 'en' = 'fi'): string | undefined {
  const u = uri.trim()
  const yso = u.match(/\/yso\/(p\d+)\s*$/i)
  if (yso) return `https://finto.fi/yso/${lang}/page/${yso[1]}`
  const koko = u.match(/\/koko\/(p\d+)\s*$/i)
  if (koko) return `https://finto.fi/koko/${lang}/page/${koko[1]}`
  const maotao = u.match(/\/onto\/(?:mao|tao)\/(p\d+)\s*$/i)
  if (maotao) return `https://finto.fi/maotao/${lang}/page/${maotao[1]}`
  return undefined
}

async function fintoLabel(uri: string, lang: 'fi' | 'en'): Promise<string | undefined> {
  const params = new URLSearchParams({ uri, lang })
  const response = await fetch(`${FINTO_BASE_URL}/label?${params.toString()}`)
  if (!response.ok) return undefined
  const payload = (await response.json()) as FintoLabelResponse
  return payload.prefLabel?.trim() || undefined
}

export async function fetchYsoConceptLabels(uri: string): Promise<{ fi?: string; en?: string }> {
  const normalized = normalizeYsoUri(uri.trim())
  const [fi, en] = await Promise.all([fintoLabel(normalized, 'fi'), fintoLabel(normalized, 'en')])
  return { fi, en }
}

/** Exclude grouping / non-leaf structural nodes from pick lists where possible. */
function isSelectableYsoResult(row: FintoSearchResult): boolean {
  const types = row.type ?? []
  return !types.some(
    (t) =>
      t.includes('ConceptGroup') ||
      t.includes('/ConceptGroup') ||
      t.includes('Collection') ||
      t.includes('Hierarchy'),
  )
}

export interface YsoSearchItem {
  uri: string
  finnishLabel?: string
  englishLabel?: string
}

/**
 * Search Finto vocabulary labels (Finnish-first).
 * @param vocab `yso` — YSO; `koko` — KOKO (http://www.yso.fi/onto/koko/)
 */
export async function searchFintoConcepts(
  vocab: 'yso' | 'koko',
  query: string,
  size = 20,
): Promise<YsoSearchItem[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const wildcardQuery = q.startsWith('*') && q.endsWith('*') ? q : `*${q}*`
  const params = new URLSearchParams({
    vocab,
    query: wildcardQuery,
    lang: 'fi',
    maxhits: String(Math.min(50, size * 3)),
  })
  const response = await fetch(`${FINTO_BASE_URL}/search?${params.toString()}`)
  if (!response.ok) return []
  const payload = (await response.json()) as FintoSearchResponse
  const rows = (payload.results ?? []).filter(isSelectableYsoResult)

  const deduped = new Map<string, FintoSearchResult>()
  for (const row of rows) {
    const raw = row.uri?.trim()
    if (!raw) continue
    const uri = normalizeYsoUri(raw)
    if (!deduped.has(uri)) deduped.set(uri, row)
  }

  const limited = [...deduped.entries()].slice(0, size)
  const detailItems = await Promise.all(
    limited.map(async ([uri, row]) => {
      const finnishLabel = (await fintoLabel(uri, 'fi')) || row.prefLabel?.trim() || undefined
      const englishLabel = await fintoLabel(uri, 'en')
      return { uri, finnishLabel, englishLabel }
    }),
  )

  return detailItems.filter((item) => item.finnishLabel || item.englishLabel)
}

/**
 * Search YSO labels (Finnish-first). Results are vocabulary-wide; prefer terms under
 * {@link YSO_TOIMINTA_ROOT_URI} when describing content activity.
 */
export async function searchYsoConcepts(query: string, size = 20): Promise<YsoSearchItem[]> {
  return searchFintoConcepts('yso', query, size)
}

/** Search KOKO (koko Suomen ontologia) via Finto. */
export async function searchKokoConcepts(query: string, size = 20): Promise<YsoSearchItem[]> {
  return searchFintoConcepts('koko', query, size)
}
