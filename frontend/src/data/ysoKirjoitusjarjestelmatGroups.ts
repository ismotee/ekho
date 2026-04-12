/**
 * Auto-generated from Finto YSO — kirjoitusjärjestelmät (direct narrower = group / alakäsite)
 * Root: http://www.yso.fi/onto/yso/p2627
 * Generated: 2026-04-12T17:19:42.076Z
 *
 * Regenerate: node scripts/fetch_yso_kirjoitusjarjestelmat_groups.mjs
 */

export interface YsoKirjoitusjarjestelmaGroup {
  readonly group: string
  readonly items: readonly string[]
}

/** Grouped Finnish prefLabels (optgroup → options); leaves only. */
export const INSCRIPTION_SCRIPT_GROUPS = [
  {
    "group": "kirjaimistot",
    "items": [
      "arabialainen kirjaimisto",
      "glagoliittinen kirjaimisto",
      "kyrillinen kirjaimisto",
      "latinalainen kirjaimisto",
      "morseaakkoset"
    ]
  },
  {
    "group": "kirjainkirjoitus",
    "items": [
      "riimukirjoitus"
    ]
  },
  {
    "group": "kuvakirjoitus",
    "items": [
      "hieroglyfit"
    ]
  },
  {
    "group": "lineaarikirjoitus",
    "items": [
      "lineaari A",
      "lineaari B"
    ]
  },
  {
    "group": "nuolenpääkirjoitus",
    "items": [
      "nuolenpääkirjoitus"
    ]
  },
  {
    "group": "tavukirjoitus",
    "items": [
      "hiragana",
      "katakana"
    ]
  }
] as const

/** Flat union for legacy matching / search. */
export const INSCRIPTION_SCRIPT_FI = [
  "arabialainen kirjaimisto",
  "glagoliittinen kirjaimisto",
  "hieroglyfit",
  "hiragana",
  "katakana",
  "kyrillinen kirjaimisto",
  "latinalainen kirjaimisto",
  "lineaari A",
  "lineaari B",
  "morseaakkoset",
  "nuolenpääkirjoitus",
  "riimukirjoitus"
] as const
