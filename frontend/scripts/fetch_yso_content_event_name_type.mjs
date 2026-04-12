/**
 * Builds grouped YSO options under http://www.yso.fi/onto/yso/p1051 (tapahtumat).
 * Each direct narrower = optgroup; items = that node if leaf, else its direct children.
 *
 * Run: node scripts/fetch_yso_content_event_name_type.mjs
 */
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../src/data/ysoContentEventNameTypeGroups.ts')

const ROOT = 'http://www.yso.fi/onto/yso/p1051'
const BASE = 'https://api.finto.fi/rest/v1'

async function children(uri) {
  const u = new URLSearchParams({ uri, lang: 'fi' })
  const r = await fetch(`${BASE}/yso/children?${u}`)
  if (!r.ok) throw new Error(`children ${r.status}`)
  return r.json()
}

async function prefEn(uri) {
  const u = new URLSearchParams({ uri, lang: 'en' })
  const r = await fetch(`${BASE}/label?${u}`)
  if (!r.ok) return undefined
  const j = await r.json()
  return typeof j.prefLabel === 'string' ? j.prefLabel.trim() : undefined
}

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

async function main() {
  const root = await children(ROOT)
  const narrowers = root.narrower ?? []
  const groups = []

  for (const n of narrowers) {
    const groupFi = n.prefLabel?.trim() || n.uri
    const items = []
    if (!n.hasChildren) {
      const en = await prefEn(n.uri)
      items.push({ fi: groupFi, uri: n.uri, en: en || undefined })
    } else {
      const sub = await children(n.uri)
      for (const c of sub.narrower ?? []) {
        const fi = c.prefLabel?.trim() || c.uri
        const en = await prefEn(c.uri)
        items.push({ fi, uri: c.uri, en: en || undefined })
      }
    }
    if (items.length) groups.push({ group: groupFi, items })
  }

  const flat = groups.flatMap((g) => g.items.map((i) => i.fi))
  const lines = []
  lines.push(`/**`)
  lines.push(` * YSO tapahtumat — tapahtuman tyypit (ryhmät = p1051 alakäsitteet).`)
  lines.push(` * Root: ${ROOT}`)
  lines.push(` * Generated: ${new Date().toISOString()}`)
  lines.push(` * Regenerate: node scripts/fetch_yso_content_event_name_type.mjs`)
  lines.push(` */`)
  lines.push(``)
  lines.push(`export interface YsoContentEventNameTypeItem {`)
  lines.push(`  readonly fi: string`)
  lines.push(`  readonly uri: string`)
  lines.push(`  readonly en?: string`)
  lines.push(`}`)
  lines.push(``)
  lines.push(`export interface YsoContentEventNameTypeGroup {`)
  lines.push(`  readonly group: string`)
  lines.push(`  readonly items: readonly YsoContentEventNameTypeItem[]`)
  lines.push(`}`)
  lines.push(``)
  lines.push(`export const YSO_CONTENT_EVENT_NAME_TYPE_GROUPS: readonly YsoContentEventNameTypeGroup[] = [`)
  for (const g of groups) {
    lines.push(`  {`)
    lines.push(`    group: "${esc(g.group)}",`)
    lines.push(`    items: [`)
    for (const it of g.items) {
      const en = it.en ? `, en: "${esc(it.en)}"` : ''
      lines.push(`      { fi: "${esc(it.fi)}", uri: "${esc(it.uri)}"${en} },`)
    }
    lines.push(`    ],`)
    lines.push(`  },`)
  }
  lines.push(`]`)
  lines.push(``)
  lines.push(`/** Finnish labels in UI order (for legacy matching). */`)
  lines.push(`export const YSO_CONTENT_EVENT_NAME_TYPE_FI: readonly string[] = [`)
  for (const f of flat) {
    lines.push(`  "${esc(f)}",`)
  }
  lines.push(`]`)
  lines.push(``)

  writeFileSync(OUT, lines.join('\n') + '\n', 'utf8')
  console.log(`Wrote ${OUT} (${groups.length} groups, ${flat.length} options)`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
