/**
 * MAO/TAO tyylit — options under http://www.yso.fi/onto/mao/p178 (Finto vocabulary `maotao`).
 * Same grouping as fetch_yso_content_event_name_type.mjs: direct narrower = optgroup;
 * if leaf, item is that node; else one level of children.
 *
 * Run: node scripts/fetch_mao_style_groups.mjs
 */
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../src/data/maoStyleGroups.ts')

const ROOT = 'http://www.yso.fi/onto/mao/p178'
const BASE = 'https://api.finto.fi/rest/v1'

async function children(uri) {
  const u = new URLSearchParams({ uri, lang: 'fi' })
  const r = await fetch(`${BASE}/maotao/children?${u}`)
  if (!r.ok) throw new Error(`children ${r.status} ${await r.text()}`)
  return r.json()
}

async function prefEn(uri) {
  const u = new URLSearchParams({ uri, lang: 'en' })
  const r = await fetch(`${BASE}/maotao/label?${u}`)
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
  lines.push(` * MAO/TAO tyylit — http://www.yso.fi/onto/mao/p178`)
  lines.push(` * Generated: ${new Date().toISOString()}`)
  lines.push(` * Regenerate: node scripts/fetch_mao_style_groups.mjs`)
  lines.push(` */`)
  lines.push(``)
  lines.push(`export interface MaoStyleItem {`)
  lines.push(`  readonly fi: string`)
  lines.push(`  readonly uri: string`)
  lines.push(`  readonly en?: string`)
  lines.push(`}`)
  lines.push(``)
  lines.push(`export interface MaoStyleGroup {`)
  lines.push(`  readonly group: string`)
  lines.push(`  readonly items: readonly MaoStyleItem[]`)
  lines.push(`}`)
  lines.push(``)
  lines.push(`export const MAO_STYLE_GROUPS: readonly MaoStyleGroup[] = [`)
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
  lines.push(`/** Finnish labels in UI order (legacy matching). */`)
  lines.push(`export const MAO_STYLE_FI: readonly string[] = [`)
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
