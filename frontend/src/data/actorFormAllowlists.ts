/**
 * Finnish option lists from docs/data/actor-models.md (Reference<*>).
 */

/** Reference<AddressType> */
export const ACTOR_ADDRESS_TYPE_FI = [
  'Katuosoite',
  'Kotiosoite',
  'Käyntiosoite',
  'Postiosoite',
  'Työpaikan osoite',
] as const

/** Reference<OrganizationIdentifierType> */
export const ACTOR_ORG_IDENTIFIER_TYPE_FI = ['ISNI', 'Y-tunnus'] as const

/** Reference<PersonGender> */
export const ACTOR_PERSON_GENDER_FI = ['mies', 'nainen', 'muu', 'ei tietoa'] as const

/** Reference<PersonNationality> (spec lists suomi) */
export const ACTOR_PERSON_NATIONALITY_FI = ['suomi'] as const

/** Reference<OtherNameType> — organization other names (docs/data/actor-models.md) */
export const ACTOR_ORGANIZATION_OTHER_NAME_TYPE_FI = [
  'entinen nimi',
  'koko nimi',
  'muu nimi',
  'peitenimi',
  'puumerkki',
  'rinnakkaisnimi',
  'uusi nimi',
  'vieraskielinen nimi',
  'virallinen nimi',
] as const

/** Reference<PersonNameType> (docs/data/actor-models.md) */
export const ACTOR_PERSON_NAME_TYPE_FI = [
  'avionimi',
  'entinen nimi',
  'koko nimi',
  'lempinimi',
  'liikanimi',
  'muu nimi',
  'myöhempi nimi',
  'nimimerkki',
  'omaa sukua',
  'peitenimi',
  'puumerkki',
  'rinnakkaisnimi',
  'taiteilijanimi',
  'vieraskielinen nimi',
  'virallinen nimi',
] as const
