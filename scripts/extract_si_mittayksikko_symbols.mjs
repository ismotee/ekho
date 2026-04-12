/**
 * Extracts unit symbols from the "Yksikön tunnus" column in markdown tables
 * (Finnish Wikipedia article on SI, saved as .md).
 *
 * Usage: node scripts/extract_si_mittayksikko_symbols.mjs [path/to/article.md]
 *
 * Writes: frontend/src/data/siMeasurementUnitSymbols.ts
 */

import { existsSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function splitRow(line) {
  return line.split('|').map((s) => s.trim())
}

function stripNoise(s) {
  let t = s
  t = t.replace(/\\\[/g, '[')
  t = t.replace(/\\\]/g, ']')
  t = t.replace(/\[\[[^\]]+\]\]/g, '')
  t = t.replace(/\[[^\]]*\]\([^)]*\)/g, '')
  t = t.replace(/\[\d+\]\([^)]*\)/g, '')
  t = t.replace(/\[\[[^\]|]+\|[^\]]+\]\]/g, '')
  t = t.replace(/\[[^\]]+\]/g, '')
  t = t.replace(/\*\*([^*]+)\*\*/g, '$1')
  t = t.replace(/<[^>]+>/g, '')
  t = t.replace(/_([^_]+)_/g, '$1')
  t = t.replace(/\s*\(#[^)]*\)/g, '')
  return t.replace(/\s+/g, ' ').trim()
}

const COMMENTARY_TOKENS = new Set([
  'tähtitiede',
  'alukset',
  'merenkulku',
  'lentokoneet',
  'maa- ja metsätalous',
])

/** Reject Wikipedia Kommentti column text mis-read as unit. */
function isLikelyUnitSymbol(s) {
  if (COMMENTARY_TOKENS.has(s)) return false
  if (/[0-9°′″²³/·∙()μ]|\/|·/.test(s)) return true
  if (s.includes(' ')) {
    // "mm Hg", "A / m²" style
    if (/^(?:[A-Za-z%]+\s+)+[A-Za-z%]+$/u.test(s) && s.length < 25) return true
  }
  if (s.length <= 6 && /^[A-Za-zÅÄÖåäöμ%′″]+$/u.test(s)) return true
  // Long all-lowercase Finnish phrase → not a unit
  if (s.length > 12 && /^[a-zåäöäö\s\-,]+$/u.test(s)) return false
  return s.length <= 15
}

/** Heuristic: is this cell a unit symbol (or comma-separated symbols), not prose? */
function symbolsFromCell(raw) {
  const cleaned = stripNoise(raw)
  if (!cleaned) return []
  // Subsection rows that span wrong columns
  if (/yksiköt\s*$/i.test(cleaned) && cleaned.length < 40) return []
  if (/^(Sähköopin|Magnetismiin|Valo-opin|Säteilyn|Kemian|Akustiikan|Suoraviivaiseen|Pyörivään|Lujuusoppiin|Lämpöopin|Sähkö- ja magneettikenttiin) yksiköt$/i.test(cleaned)) return []
  if (/^Sähkövaraukseen liittyviä$/i.test(cleaned)) return []

  const out = []
  for (let part of cleaned.split(',')) {
    part = part.trim()
    if (!part) continue
    // Drop pure footnote remnants
    if (/^[\d\s()]+$/.test(part)) continue
    // Allow compound units: m², kg/m³, W/(K·m), mm Hg, km/h, °C, 1/min, J/kg, etc.
    if (part.length > 80) continue
    if (!/[/0-9A-Za-z°′″²³µμÅÄÖåäö]/.test(part)) continue
    let sym = part.replace(/−/g, '-')
    if (sym.includes(' = ')) sym = sym.split(' = ')[0].trim()
    if (!isLikelyUnitSymbol(sym)) continue
    out.push(sym)
  }
  return out
}

function normalizeGroupTitle(title) {
  return title.replace(/^#+\s*/, '').replace(/\s+muokkaa\s*$/i, '').trim()
}

function extractFromMarkdown(text) {
  const lines = text.split('\n')
  let section = 'Muut'
  /** @type {Map<string, Set<string>>} */
  const byGroup = new Map()

  function add(group, sym) {
    if (!sym || sym === '—' || sym === '-') return
    const g = group || 'Muut'
    if (!byGroup.has(g)) byGroup.set(g, new Set())
    byGroup.get(g).add(sym)
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const hm = line.match(/^##\s+(.+)/)
    if (hm) {
      section = normalizeGroupTitle(hm[1])
      continue
    }

    if (!line.includes('|') || !line.includes('Yksikön tunnus')) continue

    const headerParts = splitRow(line)
    const colIdx = headerParts.findIndex((c) => c.includes('Yksikön tunnus'))
    if (colIdx < 0) continue

    i++
    if (i < lines.length && /^\|[\s\-:|]+\|/.test(lines[i])) i++

    while (i < lines.length) {
      const rowLine = lines[i]
      if (!rowLine.trim().startsWith('|')) break
      const parts = splitRow(rowLine)
      if (parts.length > colIdx) {
        for (const sym of symbolsFromCell(parts[colIdx] || '')) add(section, sym)
      }
      i++
    }
    i--
  }

  const groups = [...byGroup.entries()]
    .map(([group, set]) => ({
      group,
      items: [...set].sort((a, b) => a.localeCompare(b, 'fi')),
    }))
    .filter((g) => g.items.length > 0)
    .sort((a, b) => a.group.localeCompare(b.group, 'fi'))

  const flat = [...new Set(groups.flatMap((g) => g.items))].sort((a, b) => a.localeCompare(b, 'fi'))

  return { groups, flat }
}

const defaultPaths = [
  join(__dirname, 'data/kansainvalinen-yksikkojarjestelma-wikipedia-fi.md'),
  join(__dirname, '../uploads/Kansainv_linen_yksikk_j_rjestelm_-0.md'),
  'C:/Users/ismot/.cursor/projects/d-ekho/uploads/Kansainv_linen_yksikk_j_rjestelm_-0.md',
]

function main() {
  let path = process.argv[2]
  if (!path) path = defaultPaths.find((p) => existsSync(p))
  if (!path) {
    console.error('No input .md file. Pass path to saved Wikipedia markdown.')
    process.exit(1)
  }
  const text = readFileSync(path, 'utf8')
  let { groups, flat } = extractFromMarkdown(text)
  // Non-SI label used in imaging (not on SI page); keep selectable + legacy
  if (!flat.includes('pixel')) {
    flat = [...flat, 'pixel'].sort((a, b) => a.localeCompare(b, 'fi'))
    const g = groups.find((x) => x.group === 'Lisäyksiköitä') || groups[groups.length - 1]
    if (g) g.items = [...new Set([...g.items, 'pixel'])].sort((a, b) => a.localeCompare(b, 'fi'))
  }
  const outPath = join(__dirname, '../frontend/src/data/siMeasurementUnitSymbols.ts')
  const ts = `/**
 * Unit symbols from Finnish Wikipedia "Yksikön tunnus" columns
 * Source: https://fi.wikipedia.org/wiki/Kansainvälinen_yksikköjärjestelmä
 * Generated: ${new Date().toISOString()}
 *
 * Regenerate: save article as markdown, then
 *   node scripts/extract_si_mittayksikko_symbols.mjs <path-to.md>
 */

export interface MeasurementUnitGroup {
  readonly group: string
  readonly items: readonly string[]
}

export const MEASUREMENT_UNIT_GROUPS = ${JSON.stringify(groups, null, 2)} as const

export const MEASUREMENT_UNIT_FI = ${JSON.stringify(flat, null, 2)} as const
`
  writeFileSync(outPath, ts, 'utf8')
  console.log('Wrote', outPath)
  console.log('Groups:', groups.length, 'symbols:', flat.length)
}

main()
