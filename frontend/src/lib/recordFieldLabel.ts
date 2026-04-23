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
  /** Acquisition prices: API uses longer snake_case keys than form label IDs. */
  group_purchase_price: 'recordForm.labels.groupPurchasePrice',
  group_purchase_price_denomination: 'recordForm.labels.groupPurchaseDenomination',
  original_object_purchase_price: 'recordForm.labels.originalPurchasePrice',
  original_object_purchase_price_denomination: 'recordForm.labels.originalPriceDenomination',
  transfer_of_title_number: 'recordForm.labels.transferOfTitle',
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
  material: 'recordForm.labels.materials',
  technical_attribute: 'recordForm.labels.technicalAttributes',
  content_date: 'recordForm.description.contentDatesLegend',
  content_dates: 'recordForm.description.contentDatesLegend',
  content_time_role: 'recordForm.labels.contentTimeRole',
  content_places: 'recordForm.description.contentPlacesLegend',
  style: 'recordForm.labels.styles',
  interpretation_date: 'recordForm.description.interpretationDateLegend',
  inscription_date: 'recordForm.labels.inscriptionDate',
  pref_label: 'recordForm.labels.prefLabel',
  in_scheme: 'recordForm.labels.inScheme',
  acquisition_place_role: 'recordForm.labels.acquisitionPlaceRole',
  content_place_role: 'recordForm.labels.contentPlaceRole',
  coordinates: 'recordForm.labels.placeCoordinates',
  /** Access.category */
  category: 'recordForm.labels.usage',
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
  if (parentFieldKey === 'material') {
    if (k === 'type') return t('recordForm.labels.materialType')
    if (k === 'name') return t('recordForm.labels.materialName')
    if (k === 'source') return t('recordForm.labels.sourcePlaceFinnish')
    if (k === 'component') return t('recordForm.description.componentsLegend')
  }
  if (parentFieldKey === 'technical_attribute') {
    if (k === 'unit') return t('recordForm.labels.measurementNameTechnical')
    if (k === 'measurement_unit') return t('recordForm.labels.unit')
    if (k === 'value') return t('recordForm.labels.valueTechnical')
  }
  if (parentFieldKey === 'physical_description') {
    if (k === 'text') return t('recordForm.labels.descriptionText')
    if (k === 'form') return t('recordForm.labels.formInstallation')
  }
  if (parentFieldKey === 'aquisition_details') {
    if (k === 'date') return t('recordForm.acquisition.dateEntriesLegend')
    if (k === 'note') return t('recordForm.labels.note')
    if (k === 'actor') return t('recordForm.acquisition.actorsLegend')
    if (k === 'place') return t('recordForm.acquisition.placesLegend')
    if (k === 'method') return t('recordForm.labels.method')
    if (k === 'reason') return t('recordForm.labels.reason')
    if (k === 'group_purchase_price') return t('recordForm.labels.groupPurchasePrice')
    if (k === 'group_purchase_price_denomination') return t('recordForm.labels.groupPurchaseDenomination')
    if (k === 'original_object_purchase_price') return t('recordForm.labels.originalPurchasePrice')
    if (k === 'original_object_purchase_price_denomination') return t('recordForm.labels.originalPriceDenomination')
    if (k === 'price') return t('recordForm.labels.groupPurchasePrice')
    if (k === 'denomination') return t('recordForm.labels.groupPurchaseDenomination')
    if (k === 'acquisition_time') return t('recordForm.acquisition.acquisitionTimeLegend')
    if (k === 'reference_number') return t('recordForm.labels.referenceNumber')
  }
  if (parentFieldKey === 'owner_history') {
    if (k === 'date') return t('recordForm.history.ownershipDateLegend')
    if (k === 'place') return t('recordForm.history.ownershipPlaceLegend')
  }
  if (parentFieldKey === 'object_history') {
    if (k === 'date') return t('recordForm.history.objectHistoryTimeLabel')
    if (k === 'place') return t('recordForm.history.objectHistoryPlaceLabel')
    if (k === 'activity') return t('recordForm.history.objectHistoryActivityLabel')
  }
  if ((parentFieldKey === 'usage_history' || parentFieldKey === 'usage') && k === 'category') {
    return t('recordForm.labels.usage')
  }
  if (parentFieldKey === 'access') {
    if (k === 'date') return t('recordForm.access.accessDateLegend')
    if (k === 'note') return t('recordForm.access.accessRestrictionNoteLabel')
  }
  if (parentFieldKey === 'object_display_status') {
    if (k === 'date') return t('recordForm.access.statusDateLegend')
    if (k === 'type') return t('recordForm.access.displayStatusLegend')
  }
  if (parentFieldKey === 'object_location') {
    if (k === 'date') return t('recordForm.location.locationDateLegend')
    if (k === 'location') return t('recordForm.location.locationLegend')
    if (k === 'fitness') return t('recordForm.labels.locationFitness')
  }
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
