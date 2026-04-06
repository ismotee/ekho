import type { RecordPayload } from '../types/record'
import type { Rights } from '../types/record/rights'
import {
  acquisitionHasPersistableContent,
  actorRowHasContent,
  spatialRowHasContent,
} from './acquisitionPayload'
import { compactDescriptionForSave } from './descriptionPayload'
import { compactHistoryForSave } from './historyPayload'
import { referenceFieldFi } from './referenceField'
import { accessHasPersistableContent, objectDisplayStatusHasPersistableContent } from './accessPayload'
import { compactRightsListForSave } from './rightsPayload'
import { temporalHasPersistableContent } from './temporalPayload'
import { finalizeTemporalDeep } from './temporalIso'
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
      id.object_name = id.object_name.filter(
        (n) =>
          referenceFieldFi(n.value) ||
          referenceFieldFi(n.type) ||
          referenceFieldFi(n.language)
      )
      if (id.object_name.length === 0) delete id.object_name
    }
    if (id.object_number !== undefined && !String(id.object_number).trim()) delete id.object_number
    if (!referenceFieldFi(id.object_type)) delete id.object_type
    out.identification_details = Object.keys(id).length > 0 ? id : undefined
  }

  if (out.aquisition_details && typeof out.aquisition_details === 'object') {
    const a = { ...out.aquisition_details }
    if (a.date?.length) {
      a.date = a.date.filter((t) => temporalHasPersistableContent(t))
      if (a.date.length === 0) delete a.date
    }
    if (a.place?.length) {
      a.place = a.place.filter(spatialRowHasContent)
      if (a.place.length === 0) delete a.place
    }
    if (a.actor?.length) {
      a.actor = a.actor.filter(actorRowHasContent)
      if (a.actor.length === 0) delete a.actor
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
    if (a.date && !temporalHasPersistableContent(a.date)) delete a.date
    if (a.object_display_status && typeof a.object_display_status === 'object') {
      const s = { ...a.object_display_status }
      if (s.date && !temporalHasPersistableContent(s.date)) delete s.date
      if (!referenceFieldFi(s.type)) delete s.type
      a.object_display_status = objectDisplayStatusHasPersistableContent(s) ? s : undefined
    }
    if (a.note !== undefined && !String(a.note).trim()) delete a.note
    if (a.credit_line !== undefined && !String(a.credit_line).trim()) delete a.credit_line
    if (!referenceFieldFi(a.category)) delete a.category
    if (!referenceFieldFi(a.museological_value)) delete a.museological_value
    out.access = accessHasPersistableContent(a) ? a : undefined
  }

  if (out.object_location && typeof out.object_location === 'object') {
    const loc = { ...out.object_location }
    if (loc.location && !spatialRowHasContent(loc.location)) delete loc.location
    if (loc.date && !temporalHasPersistableContent(loc.date)) delete loc.date
    if (loc.identifier !== undefined && !String(loc.identifier).trim()) delete loc.identifier
    if (loc.note !== undefined && !String(loc.note).trim()) delete loc.note
    if (!referenceFieldFi(loc.type)) delete loc.type
    if (!referenceFieldFi(loc.fitness)) delete loc.fitness
    out.object_location = objectLocationHasPersistableContent(loc) ? loc : undefined
  }

  finalizeTemporalDeep(out)
  return out
}
