/**
 * Finnish Reference<*> options from docs/data/actor-models.md.
 * DatePeriod narrowers under YSO p4623 (aikakaudet), fi prefLabel from Finto.
 */

/** Reference<DateAssociation> */
export const DATE_ASSOCIATION_FI = [
  'diariointiaika',
  'hankinta-aika',
  'julkaisuaika',
  'kuvausaika',
  'käyttöaika',
  'lahjoitusaika',
  'laina-aika',
  'luovutusaika',
  'lähetysaika',
  'löytöaika',
  'objektiin merkitty aika',
  'omistusaika',
  'painoaika',
  'poistoaika',
  'purkuaika',
  'rakennusaika',
  'saapumisaika',
  'skannausaika',
  'suunnitteluaika',
  'tuhoutumisaika',
  'valmistusaika',
  'vastaanottoaika',
] as const

/** Reference<DateCertanity> (typo preserved per docs: certanity) */
export const DATE_CERTANITY_FI = ['aikaisintaan', 'arvio', 'ennen', 'jälkeen', 'noin', 'viimeistään'] as const

/** Reference<DateQualifier> — docs: assign to und field; stored as Finnish string in v1 */
export const DATE_QUALIFIER_FI = ['-', '+', '-/+'] as const

/** Reference<DatePeriod> — YSO http://www.yso.fi/onto/yso/p4623 narrower concepts, fi labels */
export const DATE_PERIOD_FI = [
  'esihistoria',
  'keskiaika',
  'prekolumbiaaninen aika',
  'uusi aika',
  'vanha aika',
  'geologiset kaudet',
  'ilmastokaudet',
] as const
