/**
 * Map API snake_case field keys to the same i18n strings used in the record edit form.
 *
 * History domain paths (see `types/record/history.ts`):
 * - owner_history[]: owner, date, place, exchange
 * - exchange: method, price, denomination, note
 * - object_production_information[]: per-item labels use recordForm.detail.arraySegmentLabel
 *   (e.g. “Objektin valmistustiedot 1”), not per-field summaries.
 * - usage_history[]: usage, note, usage_instructions
 * - object_history[]: activity, cultural_affinity, actor, date, place, event, note, comments, relevance
 * - activity: type, note
 * - event: name, name_type, actor, date, place
 */

import type { i18n as I18nType } from 'i18next'
import type { TFunction } from 'i18next'

/** Turn snake_case API keys into readable fallback labels (when no form label exists). */
export function formatDomainKeyLabel(key: string): string {
  return key
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function snakeToCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}

/**
 * snake_case JSON keys that should use a specific recordForm path (legends / section copy)
 * instead of recordForm.labels.<camelCase>.
 */
const FIELD_LABEL_KEY_OVERRIDES: Record<string, string> = {
  title: 'recordForm.identification.titlesLegend',
  object_name: 'recordForm.identification.objectNamesLegend',
  owning_organization: 'collections.owningOrganization',
  collection: 'recordForm.labels.identificationCollection',
  object_type: 'recordForm.labels.objectKind',
  date_entries: 'recordForm.acquisition.dateEntriesLegend',
  acquisition_time: 'recordForm.acquisition.acquisitionTimeLegend',
  places: 'recordForm.acquisition.placesLegend',
  actors: 'recordForm.acquisition.actorsLegend',
  owner_history: 'recordForm.history.ownerHistoryLegend',
  ownership_date: 'recordForm.history.ownershipDateLegend',
  object_production_information: 'recordForm.history.productionLegend',
  production_date: 'recordForm.history.productionDatesLegend',
  techniques: 'recordForm.history.techniquesLegend',
  /** Legacy API key before `techniques[]` */
  technique_types: 'recordForm.history.techniquesLegend',
  usage_history: 'recordForm.history.usageHistoryLegend',
  object_history: 'recordForm.history.objectHistoryLegend',
  associated_activity: 'recordForm.history.associatedActivityLegend',
  associated_event: 'recordForm.history.associatedEventLegend',
  event_actors: 'recordForm.history.eventActorsLegend',
  event_dates: 'recordForm.history.eventDatesLegend',
  event_places: 'recordForm.history.eventPlacesLegend',
  /** Owner history row uses `owner` (actor slot); form label is ownerActor */
  owner: 'recordForm.labels.ownerActor',
  /** Ownership exchange group (method / price / denomination / note) */
  exchange: 'recordForm.history.exchangeLegend',
  /** OwnershipExchange.price — form uses exchangePrice */
  price: 'recordForm.labels.exchangePrice',
  /** OwnershipExchange.denomination — form uses priceDenomination */
  denomination: 'recordForm.labels.priceDenomination',
  /** ObjectHistory.event — form uses associatedEventLegend */
  event: 'recordForm.history.associatedEventLegend',
  /** DateDetail; API typo from common-models */
  certanity: 'recordForm.temporal.dateCertainty',
  /** DateDetail.single — calendar date; same label as DateDetailInputs */
  single: 'recordForm.temporal.date',
  /** DateDetail.qualifier — date qualifier, not valueQualifier */
  qualifier: 'recordForm.temporal.dateQualifier',
  begin_date: 'recordForm.rights.beginDateLegend',
  end_date: 'recordForm.rights.endDateLegend',
  holders: 'recordForm.rights.holdersLegend',
  object_display_status: 'recordForm.access.displayStatusLegend',
  access_date: 'recordForm.access.accessDateLegend',
  status_date: 'recordForm.access.statusDateLegend',
  location_date: 'recordForm.location.locationDateLegend',
  object_component: 'recordForm.description.objectComponentsLegend',
  content_date: 'recordForm.description.contentDatesLegend',
  content_dates: 'recordForm.description.contentDatesLegend',
  content_time_role: 'recordForm.labels.contentTimeRole',
  content_places: 'recordForm.description.contentPlacesLegend',
  interpretation_date: 'recordForm.description.interpretationDateLegend',
  inscription_date: 'recordForm.labels.inscriptionDate',
  pref_label: 'recordForm.labels.prefLabel',
  in_scheme: 'recordForm.labels.inScheme',
  acquisition_place_role: 'recordForm.labels.acquisitionPlaceRole',
  content_place_role: 'recordForm.labels.contentPlaceRole',
}

export function translateRecordFieldKey(key: string, i18n: I18nType, t: TFunction): string {
  const override = FIELD_LABEL_KEY_OVERRIDES[key]
  if (override && i18n.exists(override)) {
    return t(override)
  }
  const camel = snakeToCamel(key)
  const labelKey = `recordForm.labels.${camel}`
  if (i18n.exists(labelKey)) {
    return t(labelKey)
  }
  const temporalKey = `recordForm.temporal.${camel}`
  if (i18n.exists(temporalKey)) {
    return t(temporalKey)
  }
  return formatDomainKeyLabel(key)
}

/**
 * Label for a JSON field key in record domain detail view, including parent-key disambiguation
 * (same rules as the record edit form / NestedDomainFields).
 */
export function recordDomainFieldLabelForKey(
  k: string,
  parentFieldKey: string | undefined,
  i18n: I18nType,
  t: TFunction,
): string {
  if (parentFieldKey === 'content' && k === 'activity') {
    return t('recordForm.labels.contentActivity')
  }
  if (parentFieldKey === 'content' && k === 'position') {
    return t('recordForm.labels.contentPosition')
  }
  if (parentFieldKey === 'content' && k === 'script') {
    return t('recordForm.labels.contentScript')
  }
  if (parentFieldKey === 'content' && k === 'language') {
    return t('recordForm.labels.contentLanguage')
  }
  if (parentFieldKey === 'content_event_row' && k === 'name') {
    return t('recordForm.labels.contentSubEventName')
  }
  if (parentFieldKey === 'content_event_row' && k === 'name_type') {
    return t('recordForm.labels.contentSubEventNameType')
  }
  return translateRecordFieldKey(k, i18n, t)
}
