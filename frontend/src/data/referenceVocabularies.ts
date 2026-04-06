/**
 * Closed Finnish label lists for Reference<X> fields — keep in sync with docs/data/*.md
 * (same strings as the markdown option blocks).
 */

/** docs/data/identification-models.md — Reference<ObjectType> */
export const OBJECT_TYPE_FI: readonly string[] = [
  'arkistoaineisto',
  'asiakirja',
  'esine',
  'liikkuva kuva',
  'luonnonympäristö',
  'muu',
  'näyte',
  'painettu tekstijulkaisu',
  'rakennettu ympäristö',
  'rakennus',
  'taideteos',
  'valokuva',
  'äänite',
]

/** docs/data/identification-models.md — Reference<ObjectNameType> */
export const OBJECT_NAME_TYPE_FI: readonly string[] = ['pääluokka', 'erikoisluokka']

/** docs/data/common-models.md — Reference<Language> */
export const LANGUAGE_FI: readonly string[] = ['suomi', 'englanti', 'ruotsi']

/** docs/data/identification-models.md — Reference<TitleType> */
export const TITLE_TYPE_FI: readonly string[] = [
  'aihe',
  'kerääjän antama nimi',
  'käyttäjän antama nimi',
  'luetteloijan antama nimi',
  'mallin nimi ja/ tai numero',
  'omistajan antama nimi',
  'rakennuttajan antama nimi',
  'sarjan nimi',
  'suunnittelijan antama nimi',
  'taiteilijan antama nimi',
  'tekijän antama nimi',
  'teosnimi',
  'tuotteen nimi',
  'valokuvaajan antama nimi',
  'yleisesti tunnettu nimi',
]

/** docs/data/rights-models.md — Reference<RightsType> */
export const RIGHTS_TYPE_FI: readonly string[] = [
  'julkaisuoikeus',
  'käyttöoikeus',
  'oikeuksien myyntioikeus',
  'tekijänoikeus',
]

/** docs/data/access-models.md — Reference<AccessCategory> */
export const ACCESS_CATEGORY_FI: readonly string[] = [
  'rajoitettu sisäinen käyttö',
  'rajoitettu ulkoinen käyttö',
  'rajoittamaton',
]

/** docs/data/access-models.md — Reference<MuseologicalValue> */
export const MUSEOLOGICAL_VALUE_FI: readonly string[] = [
  '1 - Poikkeuksellinen/Keskeinen',
  '2 - Tärkeä/Edustava',
  '3 - Täydentävä/Dokumentoiva',
  '4 - Ei-museaalinen/Poistettava',
]

/** docs/data/access-models.md — Reference<ObjectDisplayStatusType> */
export const OBJECT_DISPLAY_STATUS_TYPE_FI: readonly string[] = [
  'lupa pyydetty',
  'lupa annettu',
  'konservoitu',
  'valokuvattu',
]

/** docs/data/object-location-models.md — Reference<LocationType> */
export const LOCATION_TYPE_FI: readonly string[] = ['vakituinen', 'väliaikainen']

/** docs/data/object-location-models.md — Reference<LocationFitness> */
export const LOCATION_FITNESS_FI: readonly string[] = [
  'kelvoton/epäasiallinen',
  'kohtuullinen',
  'vaarallinen',
  'hyvä',
]

/** docs/data/aqcuisition-models.md — Reference<AqcuisitionMethod> */
export const AQCUISITION_METHOD_FI: readonly string[] = [
  'arkistolöytö',
  'dokumentointi',
  'ei tietoa',
  'huutokauppa',
  'inventointi',
  'kenttätyö',
  'kysely',
  'lahjoitus',
  'lunastus',
  'museolöytö',
  'muu',
  'osto',
  'reprokuvaus',
  'siirto toisesta kokoelmasta',
  'siirto toisesta organisaatiosta',
  'talletus',
  'tarkastus',
  'testamenttilahjoitus',
  'tullitakavarikko',
  'tuntematon',
  'vaihto',
  'virkatyö',
]

/** docs/data/common-models.md — Reference<Denomination> */
export const DENOMINATION_FI: readonly string[] = ['euro', 'dollari', 'rupla', 'kruunu', 'punta']

/** docs/data/history-models.md — Reference<OwnershipExchangeMethod> */
export const OWNERSHIP_EXCHANGE_METHOD_FI: readonly string[] = [
  'ei tietoa',
  'huutokauppa',
  'keruu',
  'lahja',
  'lahjoitus',
  'lunastus',
  'muu',
  'osto',
  'perintö',
  'siirto',
]

/** docs/data/history-models.md — Reference<TechniqueType> */
export const TECHNIQUE_TYPE_FI: readonly string[] = [
  'ammattimainen käsityö',
  'käsityö',
  'taide',
  'teollinen',
]

/** docs/data/description-models.md — Reference<ObjectStatus> */
export const OBJECT_STATUS_FI: readonly string[] = [
  'dia originaalista',
  'dia reproduktiosta',
  'duplikaatti',
  'esityö',
  'fragmentti',
  'harjoitelma',
  'holotyyppi',
  'jälkituotantodia',
  'jälkituotantonegatiivi',
  'jälkituotantovedos',
  'jälkivalos',
  'kopio',
  'kuva objektista',
  'luonnos',
  'mallikappale',
  'muu yhteys',
  'negatiivi originaalista',
  'negatiivi reproduktiosta',
  'originaali',
  'osa',
  'osa kokonaisuudesta',
  'paratyyppi',
  'pienoismalli',
  'prototyyppi',
  'rariteetti',
  'rinnakkaiskuva',
  'samanlainen',
  'sarjatuote',
  'toinen parista',
  'tyyppiesimerkki',
  'vedos originaalista',
  'vedos reproduktiosta',
  'väärennös',
]

/** docs/data/description-models.md — Reference<PhotoFormat> */
export const PHOTO_FORMAT_FI: readonly string[] = ['dia', 'kuvatiedosto', 'negatiivi', 'vedos']

/** docs/data/description-models.md — Reference<Orientation> */
export const ORIENTATION_FI: readonly string[] = ['pysty', 'vaaka', 'muu']

/** docs/data/description-models.md — Reference<Audio> */
export const AUDIO_FI: readonly string[] = ['mykkä', 'ääni']

/** docs/data/description-models.md — Reference<MeasurementName> (field `unit` on Measurement) */
export const MEASUREMENT_NAME_FI: readonly string[] = [
  'leveys',
  'pituus',
  'syvyys',
  'korkeus',
  'paino',
  'tilavuus',
  'pinta-ala',
]

/** docs/data/description-models.md — Reference<MeasurementUnit> */
export const MEASUREMENT_UNIT_FI: readonly string[] = ['m', 'g', 'm^2', 'm^3', 'pixel']

/** docs/data/description-models.md — Reference<InscriptionType> */
export const INSCRIPTION_TYPE_FI: readonly string[] = [
  'allekirjoitus',
  'etiketti',
  'graffiti',
  'julkaisumerkintä',
  'kaiverrus',
  'kirjoitus',
  'koholeima',
  'kokomerkintä',
  'koriste',
  'leima',
  'liikemerkki',
  'lisenssi',
  'merkintä',
  'monogrammi',
  'motto',
  'nimi',
  'nimikirjaimet',
  'nimikirjoitus',
  'omistajanmerkki',
  'pesumerkintä',
  'polttomerkki',
  'postileima',
  'puumerkki',
  'päiväys',
  'rajausmerkintä',
  'riimukirjoitus',
  'sarjanumero',
  'signeeraus',
  'sinetti',
  'syväleima',
  'taittomerkintä',
  'tarra',
  'tavaramerkki',
  'tuotemerkki',
  'vaakuna',
  'valmistusmaa',
  'valmistusmerkintä',
  'valosmerkintä',
  'vedosmerkintä',
  'vedostusmerkintä',
  'vesileima',
]

/** docs/data/description-models.md — Reference<InscriptionMethod> */
export const INSCRIPTION_METHOD_FI: readonly string[] = [
  'kaiverrus',
  'kirjoitus',
  'kirjonta',
  'kohokirjonta',
  'koholeima',
  'konekirjoitus',
  'koneleima',
  'konestanssaus',
  'kudonta',
  'kuulakärkikynä',
  'käsinkirjoitus',
  'käsin tehty',
  'leikkaus',
  'leimaus',
  'liimaaminen',
  'lyijykynä',
  'lyöminen',
  'lävistys',
  'maalaus',
  'metallilaatta',
  'mustekynä',
  'niittaus',
  'ompelu',
  'painatus',
  'pakotus',
  'raaputus',
  'siirtokuva',
  'stanssaus',
  'syväleima',
  'syövytys',
  'tekstaus',
  'tussi',
  'upotus',
  'valaminen',
  'valotus',
  'viiltäminen',
  'värileima',
]

/** docs/data/description-models.md — Reference<ObjectComponentName> / Form / MaterialType / … (empty for now) */
export const EMPTY_REFERENCE_FI: readonly string[] = []