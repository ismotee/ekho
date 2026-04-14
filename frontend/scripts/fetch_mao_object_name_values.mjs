/**
 * Objektin nimi (ObjectName.value) — leaf Finnish prefLabels under MAO/TAO
 * http://www.yso.fi/onto/mao/p2990 ("taideteokset"), via Finto `maotao` API.
 *
 * Run: node scripts/fetch_mao_object_name_values.mjs
 */
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../src/data/maoObjectNameValues.ts')

const ROOT = 'http://www.yso.fi/onto/mao/p2990'
const BASE = 'https://api.finto.fi/rest/v1'

async function children(uri) {
  const u = new URLSearchParams({ uri, lang: 'fi' })
  const r = await fetch(`${BASE}/maotao/children?${u}`)
  if (!r.ok) throw new Error(`children ${uri} ${r.status} ${await r.text()}`)
  return r.json()
}

/** Collect every leaf prefLabel under `uri` (exclude non-leaf parents). */
async function collectLeaves(uri, out) {
  const j = await children(uri)
  for (const n of j.narrower ?? []) {
    const label = (n.prefLabel ?? '').trim()
    if (!label) continue
    if (!n.hasChildren) out.add(label)
    else await collectLeaves(n.uri, out)
  }
}

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

async function main() {
  const leaves = new Set()
  const root = await children(ROOT)
  for (const n of root.narrower ?? []) {
    const label = (n.prefLabel ?? '').trim()
    if (!label) continue
    if (!n.hasChildren) leaves.add(label)
    else await collectLeaves(n.uri, leaves)
  }
  const sorted = [...leaves].sort((a, b) => a.localeCompare(b, 'fi'))

  const lines = []
  lines.push(`/**`)
  lines.push(` * MAO/TAO objektin nimi (arvo) — http://www.yso.fi/onto/mao/p2990`)
  lines.push(` * Generated: ${new Date().toISOString()}`)
  lines.push(` * Regenerate: node scripts/fetch_mao_object_name_values.mjs`)
  lines.push(` */`)
  lines.push(``)
  lines.push(`/** Finnish prefLabels (leaves only) for Reference<ObjectNameValue>. */`)
  lines.push(`export const OBJECT_NAME_VALUE_FI: readonly string[] = [`)
  for (const s of sorted) {
    lines.push(`  '${esc(s)}',`)
  }
  lines.push(`]`)
  lines.push(``)

  writeFileSync(OUT, lines.join('\n'), 'utf8')
  console.log(`Wrote ${sorted.length} labels → ${OUT}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
