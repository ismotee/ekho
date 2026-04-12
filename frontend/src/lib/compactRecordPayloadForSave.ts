import type { RecordPayload } from '../types/record'
import type { ObjectLocation } from '../types/record/object-location'
import type { Rights } from '../types/record/rights'
import {
  acquisitionHasPersistableContent,
  compactAcquisitionActorsForSave,
  spatialRowHasContent,
} from './acquisitionPayload'
import { compactDescriptionForSave } from './descriptionPayload'
import { compactHistoryForSave } from './historyPayload'
import { IMPLICIT_OBJECT_NAME_LANGUAGE } from './identificationTitles'
import { referenceFieldFi, referenceFieldToPayload } from './referenceField'
import { accessHasPersistableContent, objectDisplayStatusHasPersistableContent } from './accessPayload'
import { compactRightsListForSave } from './rightsPayload'
import { dateDetailHasPersistableContent, temporalHasPersistableContent } from './temporalPayload'
import { finalizeTemporalDeep } from './temporalIso'
import {
  migrateAcquisitionDateListRowToTemporal,
  migrateAcquisitionTimeToDateDetail,
} from './recordPayloadNormalize'
import { objectLocationHasPersistableContent } from './objectLocationPayload'

/**
 * Remove empty placeholder rows from list fields before API persist.
 * During editing, `patchIdentification` / `patchAcquisition` / `patchHistory` keep empty `{}` rows so "Add" works.
 */
export function compactRecordPayloadForSave(data: RecordPayload): RecordPayload {
  const out: RecordPayload = { ...data }

  if (out.identification_details && typeof out.identification_details === 'object') {
    const id = { ...out.identification_details }
    if (id.title?.length) {
      id.title = id.title.filter(
        (t) =>
          !!(
            t.value?.trim() ||
            t.note?.trim() ||
            referenceFieldFi(t.type) ||
            referenceFieldFi(t.language) ||
            (t.translation && t.translation.length > 0)
          )
      )
      if (id.title.length === 0) delete id.title
    }
    if (id.object_name?.length) {
      id.object_name = id.object_name
        .filter((n) => referenceFieldFi(n.value) || referenceFieldFi(n.type))
        .map((n) => ({
          ...n,
          language: referenceFieldToPayload(IMPLICIT_OBJECT_NAME_LANGUAGE),
        }))
      if (id.object_name.length === 0) delete id.object_name
    }
    if ('collection' in id) delete (id as { collection?: unknown }).collection
    if (id.number_of_objects != null) {
      const n = Number(id.number_of_objects)
      if (!Number.isFinite(n) || n < 1) delete id.number_of_objects
      else id.number_of_objects = Math.floor(n)
    }
    if (id.object_number !== undefined && !String(id.object_number).trim()) delete id.object_number
    if (!referenceFieldFi(id.object_type)) delete id.object_type
    out.identification_details = Object.keys(id).length > 0 ? id : undefined
  }

  if (out.aquisition_details && typeof out.aquisition_details === 'object') {
    const a = { ...out.aquisition_details }
    if (a.acquisition_time != null) {
      const migrated = migrateAcquisitionTimeToDateDetail(a.acquisition_time)
      if (migrated) a.acquisition_time = migrated
      else delete a.acquisition_time
    }
    if (a.acquisition_time && !dateDetailHasPersistableContent(a.acquisition_time)) {
      delete a.acquisition_time
    }
    if (a.date?.length) {
      a.date = a.date
        .map((row) => migrateAcquisitionDateListRowToTemporal(row))
        .map((t) => {
          const row = { ...t }
          delete row.latest
          return row
        })
        .filter((t) => temporalHasPersistableContent(t))
      if (a.date.length === 0) delete a.date
    }
    if (a.place?.length) {
      a.place = a.place.filter(spatialRowHasContent)
      if (a.place.length === 0) delete a.place
    }
    if (a.actor?.length) {
      a.actor = compactAcquisitionActorsForSave(a.actor)
      if (!a.actor?.length) delete a.actor
    }
    if (!referenceFieldFi(a.method)) delete a.method
    if (!referenceFieldFi(a.group_purchase_price_denomination)) delete a.group_purchase_price_denomination
    if (!referenceFieldFi(a.original_object_purchase_price_denomination)) {
      delete a.original_object_purchase_price_denomination
    }
    if (a.group_purchase_price != null && !Number.isFinite(a.group_purchase_price)) {
      delete a.group_purchase_price
    }
    if (a.original_object_purchase_price != null && !Number.isFinite(a.original_object_purchase_price)) {
      delete a.original_object_purchase_price
    }
    if (a.reference_number !== undefined && !String(a.reference_number).trim()) delete a.reference_number
    if (a.transfer_of_title_number !== undefined && !String(a.transfer_of_title_number).trim()) {
      delete a.transfer_of_title_number
    }
    if (a.reason !== undefined && !String(a.reason).trim()) delete a.reason
    if (a.note !== undefined && !String(a.note).trim()) delete a.note
    if (a.provisos !== undefined && !String(a.provisos).trim()) delete a.provisos
    out.aquisition_details = acquisitionHasPersistableContent(a) ? a : undefined
  }

  if (out.history && typeof out.history === 'object') {
    out.history = compactHistoryForSave(out.history) ?? undefined
  }

  if (out.description && typeof out.description === 'object') {
    out.description = compactDescriptionForSave(out.description) ?? undefined
  }

  if (out.rights != null) {
    const raw = out.rights as unknown
    const list: Rights[] = Array.isArray(raw) ? (raw as Rights[]) : [raw as Rights]
    out.rights = compactRightsListForSave(list)
  }

  if (out.access && typeof out.access === 'object') {
    const a = { ...out.access }
    if (a.date && !dateDetailHasPersistableContent(a.date)) delete a.date
    if (a.object_display_status && typeof a.object_display_status === 'object') {
      const s = { ...a.object_display_status }
      if (s.date && !dateDetailHasPersistableContent(s.date)) delete s.date
      if (!referenceFieldFi(s.type)) delete s.type
      a.object_display_status = objectDisplayStatusHasPersistableContent(s) ? s : undefined
    }
    if (a.note !== undefined && !String(a.note).trim()) delete a.note
    if (a.credit_line !== undefined && !String(a.credit_line).trim()) delete a.credit_line
    if (!referenceFieldFi(a.category)) delete a.category
    if (!referenceFieldFi(a.museological_value)) delete a.museological_value
    out.access = accessHasPersistableContent(a) ? a : undefined
  }

  if (out.object_location != null) {
    const raw = out.object_location as ObjectLocation[] | ObjectLocation
    const list: ObjectLocation[] = Array.isArray(raw) ? raw : [raw]
    const compacted = list
      .map((row) => {
        const loc = { ...row }
        if (loc.location && !spatialRowHasContent(loc.location)) delete loc.location
        if (loc.date && !dateDetailHasPersistableContent(loc.date)) delete loc.date
        if (loc.identifier !== undefined && !String(loc.identifier).trim()) delete loc.identifier
        if (loc.note !== undefined && !String(loc.note).trim()) delete loc.note
        if (!referenceFieldFi(loc.type)) delete loc.type
        if (!referenceFieldFi(loc.fitness)) delete loc.fitness
        return objectLocationHasPersistableContent(loc) ? loc : undefined
      })
      .filter((x): x is ObjectLocation => x != null)
    out.object_location = compacted.length ? compacted : undefined
  }

  finalizeTemporalDeep(out)
  return out
}
