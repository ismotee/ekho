/**
 * MAO/TAO tyylit — http://www.yso.fi/onto/mao/p178
 * Generated: 2026-04-12T19:33:29.300Z
 * Regenerate: node scripts/fetch_mao_style_groups.mjs
 */

export interface MaoStyleItem {
  readonly fi: string
  readonly uri: string
  readonly en?: string
}

export interface MaoStyleGroup {
  readonly group: string
  readonly items: readonly MaoStyleItem[]
}

export const MAO_STYLE_GROUPS: readonly MaoStyleGroup[] = [
  {
    group: "järjestelmäarkkitehtuuri (tyylit)",
    items: [
      { fi: "järjestelmäarkkitehtuuri (tyylit)", uri: "http://www.yso.fi/onto/mao/p8842" },
    ],
  },
  {
    group: "eklektismi (tyylit)",
    items: [
      { fi: "eklektismi (tyylit)", uri: "http://www.yso.fi/onto/tao/p646" },
    ],
  },
  {
    group: "historismi (tyylit)",
    items: [
      { fi: "20-luvun klassismi", uri: "http://www.yso.fi/onto/mao/p9426" },
      { fi: "uusgotiikka", uri: "http://www.yso.fi/onto/tao/p1727" },
      { fi: "uusrenessanssi", uri: "http://www.yso.fi/onto/tao/p1726" },
      { fi: "uusbarokki", uri: "http://www.yso.fi/onto/tao/p1016" },
      { fi: "uusrokokoo", uri: "http://www.yso.fi/onto/tao/p1728" },
      { fi: "medievalismi", uri: "http://www.yso.fi/onto/mao/p9803" },
    ],
  },
  {
    group: "romantiikka",
    items: [
      { fi: "romantiikka", uri: "http://www.yso.fi/onto/tao/p17" },
    ],
  },
  {
    group: "kansallisromantiikka",
    items: [
      { fi: "kansallisromantiikka", uri: "http://www.yso.fi/onto/mao/p4258" },
    ],
  },
  {
    group: "hellenismi (tyylit)",
    items: [
      { fi: "hellenismi (tyylit)", uri: "http://www.yso.fi/onto/mao/p5773" },
    ],
  },
  {
    group: "orgaaninen arkkitehtuuri",
    items: [
      { fi: "orgaaninen arkkitehtuuri", uri: "http://www.yso.fi/onto/mao/p7222" },
    ],
  },
  {
    group: "biedermeier",
    items: [
      { fi: "biedermeier", uri: "http://www.yso.fi/onto/mao/p3202" },
    ],
  },
  {
    group: "art nouveau",
    items: [
      { fi: "art nouveau", uri: "http://www.yso.fi/onto/mao/p1591" },
    ],
  },
  {
    group: "jugend",
    items: [
      { fi: "jugend", uri: "http://www.yso.fi/onto/mao/p1592" },
    ],
  },
  {
    group: "gotiikka",
    items: [
      { fi: "gotiikka", uri: "http://www.yso.fi/onto/mao/p5790" },
    ],
  },
  {
    group: "chippendale",
    items: [
      { fi: "chippendale", uri: "http://www.yso.fi/onto/mao/p5804" },
    ],
  },
  {
    group: "romaaninen tyyli",
    items: [
      { fi: "rundbogestil", uri: "http://www.yso.fi/onto/mao/p8344" },
    ],
  },
  {
    group: "regulariteetti",
    items: [
      { fi: "regulariteetti", uri: "http://www.yso.fi/onto/mao/p7106" },
    ],
  },
  {
    group: "modernismi",
    items: [
      { fi: "modernismi", uri: "http://www.yso.fi/onto/mao/p1452" },
    ],
  },
  {
    group: "postmodernismi",
    items: [
      { fi: "postmodernismi", uri: "http://www.yso.fi/onto/mao/p5228" },
    ],
  },
  {
    group: "rokokoo",
    items: [
      { fi: "rokokoo", uri: "http://www.yso.fi/onto/mao/p815" },
    ],
  },
  {
    group: "manierismi",
    items: [
      { fi: "manierismi", uri: "http://www.yso.fi/onto/mao/p5805" },
    ],
  },
  {
    group: "barokki",
    items: [
      { fi: "barokki", uri: "http://www.yso.fi/onto/mao/p4709" },
    ],
  },
  {
    group: "renessanssi",
    items: [
      { fi: "täysrenessanssi", uri: "http://www.yso.fi/onto/tao/p1154" },
      { fi: "varhaisrenessanssi", uri: "http://www.yso.fi/onto/tao/p1155" },
      { fi: "myöhäisrenessanssi", uri: "http://www.yso.fi/onto/tao/p1156" },
    ],
  },
  {
    group: "abstrakti taide",
    items: [
      { fi: "abstrakti taide", uri: "http://www.yso.fi/onto/mao/p1010" },
    ],
  },
  {
    group: "klassismi",
    items: [
      { fi: "barokkiklassismi", uri: "http://www.yso.fi/onto/mao/p8313" },
      { fi: "uusklassismi", uri: "http://www.yso.fi/onto/tao/p535" },
    ],
  },
  {
    group: "realismi (tyylit)",
    items: [
      { fi: "realismi (tyylit)", uri: "http://www.yso.fi/onto/mao/p5807" },
    ],
  },
  {
    group: "funktionalismi",
    items: [
      { fi: "funktionalismi", uri: "http://www.yso.fi/onto/mao/p5808" },
    ],
  },
  {
    group: "kitsi",
    items: [
      { fi: "kitsi", uri: "http://www.yso.fi/onto/mao/p1413" },
    ],
  },
  {
    group: "uusasiallisuus",
    items: [
      { fi: "uusasiallisuus", uri: "http://www.yso.fi/onto/tao/p372" },
    ],
  },
  {
    group: "huonekalutyylit",
    items: [
      { fi: "huonekalutyylit", uri: "http://www.yso.fi/onto/mao/p6509" },
    ],
  },
  {
    group: "art deco",
    items: [
      { fi: "art deco", uri: "http://www.yso.fi/onto/tao/p515" },
    ],
  },
  {
    group: "naivismi",
    items: [
      { fi: "naivismi", uri: "http://www.yso.fi/onto/tao/p534" },
    ],
  },
  {
    group: "viktoriaaninen taide",
    items: [
      { fi: "viktoriaaninen taide", uri: "http://www.yso.fi/onto/mao/p3024" },
    ],
  },
  {
    group: "chinoiserie",
    items: [
      { fi: "chinoiserie", uri: "http://www.yso.fi/onto/mao/p3704" },
    ],
  },
  {
    group: "sveitsiläinen tyyli",
    items: [
      { fi: "sveitsiläinen tyyli", uri: "http://www.yso.fi/onto/mao/p5803" },
    ],
  },
  {
    group: "dekonstruktivismi",
    items: [
      { fi: "dekonstruktivismi", uri: "http://www.yso.fi/onto/mao/p6893" },
    ],
  },
  {
    group: "nikkarityyli",
    items: [
      { fi: "nikkarityyli", uri: "http://www.yso.fi/onto/mao/p7275" },
    ],
  },
  {
    group: "teatterillisuus",
    items: [
      { fi: "teatterillisuus", uri: "http://www.yso.fi/onto/mao/p7313" },
    ],
  },
  {
    group: "metabolismi",
    items: [
      { fi: "metabolismi", uri: "http://www.yso.fi/onto/mao/p7325" },
    ],
  },
  {
    group: "high tech -arkkitehtuuri",
    items: [
      { fi: "high tech -arkkitehtuuri", uri: "http://www.yso.fi/onto/mao/p7599" },
    ],
  },
  {
    group: "dynamismi",
    items: [
      { fi: "dynamismi", uri: "http://www.yso.fi/onto/mao/p7684" },
    ],
  },
  {
    group: "strukturalismi (tyylit)",
    items: [
      { fi: "strukturalismi (tyylit)", uri: "http://www.yso.fi/onto/mao/p9390" },
    ],
  },
  {
    group: "regionalismi (tyylit)",
    items: [
      { fi: "regionalismi (tyylit)", uri: "http://www.yso.fi/onto/mao/p8492" },
    ],
  },
  {
    group: "formalismi (tyylit)",
    items: [
      { fi: "formalismi (tyylit)", uri: "http://www.yso.fi/onto/tao/p499" },
    ],
  },
  {
    group: "fauvismi",
    items: [
      { fi: "fauvismi", uri: "http://www.yso.fi/onto/tao/p518" },
    ],
  },
  {
    group: "absurdismi",
    items: [
      { fi: "absurdismi", uri: "http://www.yso.fi/onto/tao/p2179" },
    ],
  },
  {
    group: "japonismi",
    items: [
      { fi: "japonismi", uri: "http://www.yso.fi/onto/mao/p2304" },
    ],
  },
  {
    group: "kubismi",
    items: [
      { fi: "kubismi", uri: "http://www.yso.fi/onto/tao/p522" },
    ],
  },
  {
    group: "japonaiserie",
    items: [
      { fi: "japonaiserie", uri: "http://www.yso.fi/onto/mao/p2305" },
    ],
  },
  {
    group: "dadaismi",
    items: [
      { fi: "dadaismi", uri: "http://www.yso.fi/onto/tao/p533" },
    ],
  },
  {
    group: "neoplastismi",
    items: [
      { fi: "neoplastismi", uri: "http://www.yso.fi/onto/mao/p6947" },
    ],
  },
  {
    group: "brutalismi",
    items: [
      { fi: "betonibrutalismi", uri: "http://www.yso.fi/onto/mao/p8886" },
    ],
  },
  {
    group: "kansanrakentaminen",
    items: [
      { fi: "talonpoikaistyyli", uri: "http://www.yso.fi/onto/mao/p5501" },
    ],
  },
  {
    group: "camp",
    items: [
      { fi: "camp", uri: "http://www.yso.fi/onto/mao/p7308" },
    ],
  },
  {
    group: "konkretismi",
    items: [
      { fi: "konkretismi", uri: "http://www.yso.fi/onto/tao/p523" },
    ],
  },
  {
    group: "informalismi",
    items: [
      { fi: "informalismi", uri: "http://www.yso.fi/onto/tao/p537" },
    ],
  },
  {
    group: "minimalismi",
    items: [
      { fi: "minimalismi", uri: "http://www.yso.fi/onto/tao/p298" },
    ],
  },
  {
    group: "optaide",
    items: [
      { fi: "optaide", uri: "http://www.yso.fi/onto/tao/p504" },
    ],
  },
  {
    group: "primitivismi",
    items: [
      { fi: "primitivismi", uri: "http://www.yso.fi/onto/tao/p516" },
    ],
  },
  {
    group: "drag",
    items: [
      { fi: "drag", uri: "http://www.yso.fi/onto/mao/p7221" },
    ],
  },
  {
    group: "impressionismi",
    items: [
      { fi: "jälki-impressionismi", uri: "http://www.yso.fi/onto/tao/p507" },
    ],
  },
  {
    group: "konstruktivismi (tyylit)",
    items: [
      { fi: "konstruktivismi (tyylit)", uri: "http://www.yso.fi/onto/tao/p513" },
    ],
  },
  {
    group: "sosialistinen realismi",
    items: [
      { fi: "sosialistinen realismi", uri: "http://www.yso.fi/onto/tao/p521" },
    ],
  },
  {
    group: "purismi",
    items: [
      { fi: "purismi", uri: "http://www.yso.fi/onto/mao/p7265" },
    ],
  },
  {
    group: "abstrakti ekspressionismi",
    items: [
      { fi: "abstrakti ekspressionismi", uri: "http://www.yso.fi/onto/tao/p501" },
    ],
  },
  {
    group: "futurismi",
    items: [
      { fi: "futurismi", uri: "http://www.yso.fi/onto/tao/p510" },
    ],
  },
  {
    group: "avantgarde",
    items: [
      { fi: "avantgarde", uri: "http://www.yso.fi/onto/tao/p538" },
    ],
  },
  {
    group: "illusionismi (tyylit)",
    items: [
      { fi: "illusionismi (tyylit)", uri: "http://www.yso.fi/onto/mao/p8893" },
    ],
  },
  {
    group: "surrealismi",
    items: [
      { fi: "surrealismi", uri: "http://www.yso.fi/onto/tao/p526" },
    ],
  },
  {
    group: "ekspressionismi",
    items: [
      { fi: "ekspressionismi", uri: "http://www.yso.fi/onto/tao/p509" },
    ],
  },
  {
    group: "naturalismi",
    items: [
      { fi: "naturalismi", uri: "http://www.yso.fi/onto/tao/p505" },
    ],
  },
  {
    group: "neorealismi",
    items: [
      { fi: "neorealismi", uri: "http://www.yso.fi/onto/tao/p532" },
    ],
  },
  {
    group: "symbolismi (taidesuuntaus)",
    items: [
      { fi: "symbolismi (taidesuuntaus)", uri: "http://www.yso.fi/onto/tao/p508" },
    ],
  },
  {
    group: "poptaide",
    items: [
      { fi: "poptaide", uri: "http://www.yso.fi/onto/tao/p502" },
    ],
  },
]

/** Finnish labels in UI order (legacy matching). */
export const MAO_STYLE_FI: readonly string[] = [
  "järjestelmäarkkitehtuuri (tyylit)",
  "eklektismi (tyylit)",
  "20-luvun klassismi",
  "uusgotiikka",
  "uusrenessanssi",
  "uusbarokki",
  "uusrokokoo",
  "medievalismi",
  "romantiikka",
  "kansallisromantiikka",
  "hellenismi (tyylit)",
  "orgaaninen arkkitehtuuri",
  "biedermeier",
  "art nouveau",
  "jugend",
  "gotiikka",
  "chippendale",
  "rundbogestil",
  "regulariteetti",
  "modernismi",
  "postmodernismi",
  "rokokoo",
  "manierismi",
  "barokki",
  "täysrenessanssi",
  "varhaisrenessanssi",
  "myöhäisrenessanssi",
  "abstrakti taide",
  "barokkiklassismi",
  "uusklassismi",
  "realismi (tyylit)",
  "funktionalismi",
  "kitsi",
  "uusasiallisuus",
  "huonekalutyylit",
  "art deco",
  "naivismi",
  "viktoriaaninen taide",
  "chinoiserie",
  "sveitsiläinen tyyli",
  "dekonstruktivismi",
  "nikkarityyli",
  "teatterillisuus",
  "metabolismi",
  "high tech -arkkitehtuuri",
  "dynamismi",
  "strukturalismi (tyylit)",
  "regionalismi (tyylit)",
  "formalismi (tyylit)",
  "fauvismi",
  "absurdismi",
  "japonismi",
  "kubismi",
  "japonaiserie",
  "dadaismi",
  "neoplastismi",
  "betonibrutalismi",
  "talonpoikaistyyli",
  "camp",
  "konkretismi",
  "informalismi",
  "minimalismi",
  "optaide",
  "primitivismi",
  "drag",
  "jälki-impressionismi",
  "konstruktivismi (tyylit)",
  "sosialistinen realismi",
  "purismi",
  "abstrakti ekspressionismi",
  "futurismi",
  "avantgarde",
  "illusionismi (tyylit)",
  "surrealismi",
  "ekspressionismi",
  "naturalismi",
  "neorealismi",
  "symbolismi (taidesuuntaus)",
  "poptaide",
]

