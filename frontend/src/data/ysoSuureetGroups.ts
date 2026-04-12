/**
 * Auto-generated from Finto YSO — suureet (direct narrower = group / alakäsite)
 * Root: http://www.yso.fi/onto/yso/p4181
 * Generated: 2026-04-12T16:48:20.565Z
 *
 * Regenerate: node scripts/fetch_yso_suureet_measurement_groups.mjs
 */

export interface MeasurementNameGroup {
  readonly group: string
  readonly items: readonly string[]
}

/** Grouped Finnish prefLabels (optgroup → options); leaves only. */
export const MEASUREMENT_NAME_GROUPS = [
  {
    "group": "johdannaissuureet",
    "items": [
      "aallonpituus",
      "aaltoenergia",
      "ajonopeus",
      "aurinkoenergia",
      "fuusioenergia",
      "geoterminen energia",
      "hukkalämpö",
      "hyötysuhde",
      "höyryvoima",
      "ilmanpaine",
      "jännite",
      "keskeisvoima",
      "keskipakovoima",
      "kestävä energia",
      "kiihtyvyys",
      "liike-energia",
      "loisteho",
      "lämpökapasiteetti",
      "maalämpö",
      "moolimassa",
      "nopeusvoima",
      "ominaislämpö",
      "peltoenergia",
      "pimeä energia",
      "potentiaalienergia",
      "puristusvoima",
      "puuenergia",
      "resistanssi",
      "sähkövaraus",
      "taajuus",
      "tiheys",
      "tilavuus",
      "tutkapoikkipinta-ala",
      "tuulienergia",
      "valonnopeus",
      "verenpaine",
      "vesivoima",
      "virtaama",
      "vuorovesienergia",
      "ydinenergia",
      "äänennopeus",
      "äänenvoimakkuus"
    ]
  },
  {
    "group": "perussuureet",
    "items": [
      "aika",
      "ainemäärä",
      "lämpötila",
      "massa (fysiikka)",
      "pituus",
      "sähkövirta",
      "valovoima"
    ]
  },
  {
    "group": "luonnonvakiot",
    "items": [
      "luonnonvakiot"
    ]
  }
] as const

/** Flat union for legacy matching / search. */
export const MEASUREMENT_NAME_FI = [
  "aallonpituus",
  "aaltoenergia",
  "aika",
  "ainemäärä",
  "ajonopeus",
  "aurinkoenergia",
  "fuusioenergia",
  "geoterminen energia",
  "hukkalämpö",
  "hyötysuhde",
  "höyryvoima",
  "ilmanpaine",
  "jännite",
  "keskeisvoima",
  "keskipakovoima",
  "kestävä energia",
  "kiihtyvyys",
  "liike-energia",
  "loisteho",
  "luonnonvakiot",
  "lämpökapasiteetti",
  "lämpötila",
  "maalämpö",
  "massa (fysiikka)",
  "moolimassa",
  "nopeusvoima",
  "ominaislämpö",
  "peltoenergia",
  "pimeä energia",
  "pituus",
  "potentiaalienergia",
  "puristusvoima",
  "puuenergia",
  "resistanssi",
  "sähkövaraus",
  "sähkövirta",
  "taajuus",
  "tiheys",
  "tilavuus",
  "tutkapoikkipinta-ala",
  "tuulienergia",
  "valonnopeus",
  "valovoima",
  "verenpaine",
  "vesivoima",
  "virtaama",
  "vuorovesienergia",
  "ydinenergia",
  "äänennopeus",
  "äänenvoimakkuus"
] as const
