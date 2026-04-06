/**
 * Map API snake_case field keys to the same i18n strings used in the record edit form.
 *
 * History domain paths (see `types/record/history.ts`):
 * - owner_history[]: owner, date, place, exchange
 * - exchange: method, price, denomination, note
 * - object_production_information[]: actor, date, place, reason, note, technique, technique_type
 * - usage_history[]: usage, note, usage_instructions
 * - object_history[]: activity, cultural_affinity, actor, date, place, event, note, comments, relevance
 * - activity: type, note
 * - event: name, name_type, actor, date, place, note
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
  date_entries: 'recordForm.acquisition.dateEntriesLegend',
  places: 'recordForm.acquisition.placesLegend',
  actors: 'recordForm.acquisition.actorsLegend',
  owner_history: 'recordForm.history.ownerHistoryLegend',
  ownership_date: 'recordForm.history.ownershipDateLegend',
  object_production_information: 'recordForm.history.productionLegend',
  production_date: 'recordForm.history.productionDateLegend',
  technique_types: 'recordForm.history.techniqueTypesLegend',
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
  /** Object production free-text technique line */
  technique: 'recordForm.labels.techniqueFreeText',
  /** ObjectHistory.event — form uses associatedEventLegend */
  event: 'recordForm.history.associatedEventLegend',
  /** DateDetail (Temporal); API typo from common-models */
  certanity: 'recordForm.temporal.dateCertainty',
  /** DateDetail.single — calendar date; same label as TemporalFields */
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
  content_date: 'recordForm.description.contentDateLegend',
  interpretation_date: 'recordForm.description.interpretationDateLegend',
  inscription_date: 'recordForm.description.inscriptionDateLegend',
  pref_label: 'recordForm.labels.prefLabel',
  in_scheme: 'recordForm.labels.inScheme',
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
