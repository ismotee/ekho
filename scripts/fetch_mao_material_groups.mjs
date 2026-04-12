/**
 * Fetches MAO/TAO "materiaalit" (http://www.yso.fi/onto/mao/p1731) from Finto
 * and writes grouped leaf labels to frontend/src/data/maoMaterialGroups.ts
 *
 * Run: node scripts/fetch_mao_material_groups.mjs
 */

import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = 'http://www.yso.fi/onto/mao/p1731'
const API = 'https://api.finto.fi/rest/v1/maotao/data'

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

async function fetchConcept(uri) {
  if (cache.has(uri)) return cache.get(uri)
  const url = `${API}?uri=${encodeURIComponent(uri)}&format=${encodeURIComponent('application/ld+json')}`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${uri} -> HTTP ${r.status}`)
  const data = await r.json()
  const graph = data['@graph'] || data.graph || []
  const node = graph.find((x) => x.uri === uri)
  if (!node) throw new Error(`missing concept: ${uri}`)
  let nar = node.narrower
  const narrowers = !nar
    ? []
    : (Array.isArray(nar) ? nar : [nar])
        .map((x) => (typeof x === 'string' ? x : x.uri))
        .filter(Boolean)
  const out = { uri, prefLabel: labelFi(node), narrowers }
  cache.set(uri, out)
  await sleep(35)
  return out
}

/** All leaf prefLabels under uri (including uri itself if it has no children). */
async function leafLabels(uri) {
  const { prefLabel, narrowers } = await fetchConcept(uri)
  if (narrowers.length === 0) return prefLabel ? [prefLabel] : []
  const acc = []
  for (const c of narrowers) {
    acc.push(...(await leafLabels(c)))
  }
  return acc
}

async function main() {
  const root = await fetchConcept(ROOT)
  const groups = []
  for (const childUri of root.narrowers) {
    const meta = await fetchConcept(childUri)
    const items = [...new Set(await leafLabels(childUri))].sort((a, b) =>
      a.localeCompare(b, 'fi'),
    )
    groups.push({ group: meta.prefLabel || childUri, items })
  }
  groups.sort((a, b) => a.group.localeCompare(b.group, 'fi'))

  const flat = [...new Set(groups.flatMap((g) => g.items))].sort((a, b) =>
    a.localeCompare(b, 'fi'),
  )

  const ts = `/**
 * Auto-generated from Finto MAO/TAO — materiaalit
 * Root: http://www.yso.fi/onto/mao/p1731
 * Generated: ${new Date().toISOString()}
 *
 * Regenerate: node scripts/fetch_mao_material_groups.mjs
 */

export interface MaterialTypeGroup {
  readonly group: string
  readonly items: readonly string[]
}

/** Grouped Finnish labels (optgroup → options); leaves only. */
export const MATERIAL_TYPE_GROUPS = ${JSON.stringify(groups, null, 2)} as const

/** Flat union for legacy matching / search. */
export const MATERIAL_TYPE_FI = ${JSON.stringify(flat, null, 2)} as const
`

  const outPath = join(__dirname, '../frontend/src/data/maoMaterialGroups.ts')
  writeFileSync(outPath, ts, 'utf8')
  console.log('Wrote', outPath)
  console.log('Groups:', groups.length, 'flat options:', flat.length)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
