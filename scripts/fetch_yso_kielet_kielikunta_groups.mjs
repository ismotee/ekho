/**
 * Fetches YSO "kielet kielikunnan mukaan" (http://www.yso.fi/onto/yso/p3749) from Finto:
 * root is a ThesaurusArray — each skos:member is a language-family group ("ryhmään kuuluvat");
 * options are leaf Finnish prefLabels under that member.
 *
 * Run: node scripts/fetch_yso_kielet_kielikunta_groups.mjs
 */

import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = 'http://www.yso.fi/onto/yso/p3749'
const API = 'https://api.finto.fi/rest/v1/yso/data'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function labelFi(node) {
  const pl = node?.prefLabel
  if (!pl) return ''
  if (typeof pl === 'string') return pl.trim()
  if (pl.lang === 'fi') return String(pl.value || '').trim()
  if (Array.isArray(pl)) {
    const fi = pl.find((x) => x.lang === 'fi')
    return String((fi || pl[0])?.value || '').trim()
  }
  return ''
}

const cache = new Map()

function isThesaurusArray(node) {
  const types = node?.type
  const arr = Array.isArray(types) ? types : types ? [types] : []
  return arr.some((t) => String(t).includes('ThesaurusArray'))
}

function isHierarchyPlaceholder(node) {
  const types = node?.type
  const arr = Array.isArray(types) ? types : types ? [types] : []
  return arr.some((t) => String(t).includes('Hierarchy'))
}

function normalizeUris(val) {
  if (!val) return []
  const list = Array.isArray(val) ? val : [val]
  return list.map((x) => (typeof x === 'string' ? x : x?.uri)).filter(Boolean)
}

async function fetchNode(uri) {
  if (cache.has(uri)) return cache.get(uri)
  const url = `${API}?uri=${encodeURIComponent(uri)}&format=${encodeURIComponent('application/ld+json')}`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${uri} -> HTTP ${r.status}`)
  const data = await r.json()
  const graph = data['@graph'] || data.graph || []
  const node = graph.find((x) => x.uri === uri)
  if (!node) throw new Error(`missing node: ${uri}`)
  await sleep(35)

  if (isHierarchyPlaceholder(node)) {
    const out = { uri, prefLabel: labelFi(node), kind: 'skip', narrowers: [], members: [] }
    cache.set(uri, out)
    return out
  }

  if (isThesaurusArray(node)) {
    const members = normalizeUris(node['skos:member'] || node.member)
    const out = { uri, prefLabel: labelFi(node), kind: 'array', narrowers: [], members }
    cache.set(uri, out)
    return out
  }

  let nar = node.narrower
  const narrowers = !nar ? [] : (Array.isArray(nar) ? nar : [nar]).map((x) => (typeof x === 'string' ? x : x.uri)).filter(Boolean)
  const out = { uri, prefLabel: labelFi(node), kind: 'concept', narrowers, members: [] }
  cache.set(uri, out)
  return out
}

/** Leaf Finnish prefLabels under a concept (or expand array members). */
async function leafLabels(uri) {
  const n = await fetchNode(uri)
  if (n.kind === 'skip') return []
  if (n.kind === 'array') {
    const acc = []
    for (const m of n.members) acc.push(...(await leafLabels(m)))
    return acc
  }
  if (n.narrowers.length === 0) return n.prefLabel ? [n.prefLabel] : []
  const acc = []
  for (const c of n.narrowers) acc.push(...(await leafLabels(c)))
  return acc
}

async function main() {
  const root = await fetchNode(ROOT)
  let groupUris = []
  if (root.kind === 'array') {
    groupUris = root.members
  } else if (root.kind === 'concept') {
    groupUris = root.narrowers
  } else {
    throw new Error(`unexpected root kind: ${root.kind}`)
  }

  const groups = []
  for (const childUri of groupUris) {
    const meta = await fetchNode(childUri)
    if (meta.kind === 'skip') continue
    const groupName = meta.prefLabel || childUri
    let items = []
    if (meta.kind === 'array') {
      for (const m of meta.members) items.push(...(await leafLabels(m)))
    } else {
      items = await leafLabels(childUri)
    }
    items = [...new Set(items)].sort((a, b) => a.localeCompare(b, 'fi'))
    if (items.length === 0 && !groupName) continue
    groups.push({ group: groupName, items })
  }
  groups.sort((a, b) => a.group.localeCompare(b.group, 'fi'))

  const flat = [...new Set(groups.flatMap((g) => g.items))].sort((a, b) => a.localeCompare(b, 'fi'))

  const ts = `/**
 * Auto-generated from Finto YSO — kielet kielikunnan mukaan (ThesaurusArray members = groups / ryhmät)
 * Root: http://www.yso.fi/onto/yso/p3749
 * Generated: ${new Date().toISOString()}
 *
 * Regenerate: node scripts/fetch_yso_kielet_kielikunta_groups.mjs
 */

export interface YsoKieliGroup {
  readonly group: string
  readonly items: readonly string[]
}

/** Grouped Finnish prefLabels (optgroup → options); leaves only. */
export const LANGUAGE_GROUPS = ${JSON.stringify(groups, null, 2)} as const

/** Flat union for legacy matching / search. */
export const LANGUAGE_FI = ${JSON.stringify(flat, null, 2)} as const
`

  const outPath = join(__dirname, '../frontend/src/data/ysoKieliGroups.ts')
  writeFileSync(outPath, ts, 'utf8')
  console.log('Wrote', outPath)
  console.log('Groups:', groups.length, 'flat options:', flat.length)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
