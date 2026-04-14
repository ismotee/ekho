/**
 * Description domain helpers for save compaction (docs/data/description-models.md).
 */

import type {
  Content,
  ContentDateEntry,
  ContentEvent,
  Description,
  Inscription,
  Interpretation,
  Material,
  MaterialComponent,
  Measurement,
  ObjectComponent,
  PhysicalDescription,
  Translation,
} from '../types/record/description'
import type { ReferenceField } from '../types/record/common'
import { actorRowHasContent, spatialRowHasContent } from './acquisitionPayload'
import { referenceFieldFi, referenceFieldToPayload } from './referenceField'
import { dateDetailHasPersistableContent } from './temporalPayload'

/** True when a Sisällön ajat row should be kept (date detail and/or sisällön ajan rooli). */
export function contentDateEntryHasContent(d: ContentDateEntry | undefined): boolean {
  if (!d) return false
  if (referenceFieldFi(d.content_time_role)) return true
  return dateDetailHasPersistableContent(d)
}
import { IMPLICIT_OBJECT_NAME_LANGUAGE, objectNameRowHasContent } from './identificationTitles'

function dateDetailRowHasContent(t?: { single?: string; certanity?: unknown; qualifier?: unknown }): boolean {
  return dateDetailHasPersistableContent(t)
}

export function measurementRowHasContent(m: Measurement): boolean {
  return !!(
    referenceFieldFi(m.unit) ||
    (m.value != null && Number.isFinite(m.value)) ||
    referenceFieldFi(m.measurement_unit) ||
    m.value_qualifier?.trim()
  )
}

/** Exported for nested material component list UI (collapsible rows). */
export function materialComponentRowHasContent(c: MaterialComponent): boolean {
  return !!(referenceFieldFi(c.type) || c.note?.trim())
}

export function materialRowHasContent(mat: Material): boolean {
  if (referenceFieldFi(mat.type) || mat.name?.trim()) return true
  if (mat.source && spatialRowHasContent(mat.source)) return true
  if (mat.component?.some(materialComponentRowHasContent)) return true
  return false
}

export function interpretationRowHasContent(i: Interpretation): boolean {
  return !!(
    i.text?.trim() ||
    dateDetailRowHasContent(i.date) ||
    i.photo != null ||
    (i.interpretator && actorRowHasContent(i.interpretator))
  )
}

export function inscriptionTranslationRowHasContent(t: Translation): boolean {
  return !!(
    t.text?.trim() ||
    referenceFieldFi(t.language) ||
    (t.translator && actorRowHasContent(t.translator))
  )
}

export function inscriptionRowHasContent(ins: Inscription): boolean {
  return !!(
    ins.position?.trim() ||
    ins.content?.trim() ||
    ins.description?.trim() ||
    ins.transliteration?.trim() ||
    referenceFieldFi(ins.script) ||
    referenceFieldFi(ins.language) ||
    ins.translation?.some(inscriptionTranslationRowHasContent) ||
    referenceFieldFi(ins.type) ||
    referenceFieldFi(ins.method) ||
    referenceFieldFi(ins.direction) ||
    dateDetailRowHasContent(ins.date) ||
    (ins.inscriber && actorRowHasContent(ins.inscriber)) ||
    ins.interpretation?.some(interpretationRowHasContent)
  )
}

export function contentEventRowHasContent(e: ContentEvent): boolean {
  return !!(e.name?.trim() || referenceFieldFi(e.name_type))
}

export function contentStyleRowHasContent(st: string | ReferenceField): boolean {
  if (typeof st === 'string') return !!st.trim()
  return !!referenceFieldFi(st)
}

export function objectComponentRowHasContent(row: ObjectComponent): boolean {
  return !!(
    row.description?.trim() ||
    row.object_number?.trim() ||
    (row.object_name != null && objectNameRowHasContent(row.object_name))
  )
}

export function physicalDescriptionHasContent(p: PhysicalDescription): boolean {
  return !!(
    p.text?.trim() ||
    p.edition_number?.trim() ||
    (p.copy_number != null && Number.isFinite(p.copy_number)) ||
    referenceFieldFi(p.object_status) ||
    p.object_component?.some(objectComponentRowHasContent) ||
    referenceFieldFi(p.photo_format) ||
    referenceFieldFi(p.orientation) ||
    (Array.isArray(p.color)
      ? p.color.some((c) => (typeof c === 'string' ? c.trim() : referenceFieldFi(c)))
      : referenceFieldFi(p.color)) ||
    referenceFieldFi(p.audio) ||
    referenceFieldFi(p.form)
  )
}

export function contentHasPersistableContent(c: Content): boolean {
  const styleOk = c.style?.some((s) => (typeof s === 'string' ? s.trim() : referenceFieldFi(s)))
  const classificationOk = c.classification?.some((s) => (typeof s === 'string' ? s.trim() : referenceFieldFi(s)))
  const activityOk = c.activity?.some((s) => (typeof s === 'string' ? s.trim() : referenceFieldFi(s)))
  const generalConceptOk = c.general_concept?.some((g) =>
    typeof g === 'string' ? g.trim() : referenceFieldFi(g),
  )
  return !!(
    c.description?.trim() ||
    c.note?.trim() ||
    (c.dates?.some((d) => contentDateEntryHasContent(d)) ?? false) ||
    (c.actors?.some((a) => actorRowHasContent(a)) ?? false) ||
    (c.places?.some((p) => spatialRowHasContent(p)) ?? false) ||
    activityOk ||
    c.event?.some(contentEventRowHasContent) ||
    (typeof c.position === 'string' ? c.position.trim() : referenceFieldFi(c.position as ReferenceField)) ||
    referenceFieldFi(c.script) ||
    referenceFieldFi(c.language) ||
    styleOk ||
    generalConceptOk ||
    classificationOk
  )
}

/** True when description should be sent to the API after compaction. */
export function descriptionHasPersistableContent(d: Description): boolean {
  if (d.physical_description && physicalDescriptionHasContent(d.physical_description)) return true
  if (d.material?.some(materialRowHasContent)) return true
  if (d.technical_attribute?.some(measurementRowHasContent)) return true
  if (d.dimension?.some(measurementRowHasContent)) return true
  if (d.inscription?.some(inscriptionRowHasContent)) return true
  if (d.content && contentHasPersistableContent(d.content)) return true
  return false
}

/**
 * While editing, keep the `description` object if any subsection exists (incl. empty repeatable rows).
 */
export function descriptionEditorRetainsDomain(d: Description): boolean {
  if (d.material?.length) return true
  if (d.technical_attribute?.length) return true
  if (d.dimension?.length) return true
  if (d.inscription?.length) return true
  if (d.physical_description && Object.keys(d.physical_description).length > 0) return true
  if (d.content && Object.keys(d.content).length > 0) return true
  return descriptionHasPersistableContent(d)
}

export function compactDescriptionForSave(d: Description): Description | undefined {
  const out: Description = { ...d }

  if (out.material?.length) {
    out.material = out.material
      .map((mat) => {
        const m = { ...mat }
        if (m.source && typeof m.source === 'object') {
          const s = { ...m.source }
          delete (s as { note?: string }).note
          m.source = spatialRowHasContent(s) ? s : undefined
        }
        if (m.component?.length) {
          const comp = m.component.filter(materialComponentRowHasContent)
          if (comp.length) m.component = comp
          else delete m.component
        }
        return m
      })
      .filter(materialRowHasContent)
    if (out.material.length === 0) delete out.material
  }

  if (out.technical_attribute?.length) {
    out.technical_attribute = out.technical_attribute.filter(measurementRowHasContent)
    if (out.technical_attribute.length === 0) delete out.technical_attribute
  }

  if (out.dimension?.length) {
    out.dimension = out.dimension.filter(measurementRowHasContent)
    if (out.dimension.length === 0) delete out.dimension
  }

  if (out.inscription?.length) {
    out.inscription = out.inscription
      .map((ins) => {
        const i = { ...ins }
        if (i.interpretation?.length) {
          const interp = i.interpretation.filter(interpretationRowHasContent)
          if (interp.length) i.interpretation = interp
          else delete i.interpretation
        }
        if (i.translation?.length) {
          const tr = i.translation.filter(inscriptionTranslationRowHasContent)
          if (tr.length) i.translation = tr
          else delete i.translation
        }
        return i
      })
      .filter(inscriptionRowHasContent)
    if (out.inscription.length === 0) delete out.inscription
  }

  if (out.content) {
    const c = { ...out.content }
    if (c.event?.length) {
      const ev = c.event.filter(contentEventRowHasContent)
      if (ev.length) c.event = ev
      else delete c.event
    }
    if (c.style?.length) {
      const st = c.style.filter((s) => (typeof s === 'string' ? s.trim() : referenceFieldFi(s)))
      if (st.length) c.style = st
      else delete c.style
    }
    if (c.actors?.length) {
      const act = c.actors.filter(actorRowHasContent)
      if (act.length) c.actors = act
      else delete c.actors
    }
    if (c.places?.length) {
      const pl = c.places.filter(spatialRowHasContent)
      if (pl.length) c.places = pl
      else delete c.places
    }
    if (c.dates?.length) {
      const ds = c.dates.filter((d) => contentDateEntryHasContent(d))
      if (ds.length) c.dates = ds
      else delete c.dates
    }
    if (c.activity?.length) {
      const act = c.activity.filter((a) => (typeof a === 'string' ? a.trim() : referenceFieldFi(a)))
      if (act.length) c.activity = act
      else delete c.activity
    }
    if (c.general_concept?.length) {
      const gc = c.general_concept.filter((g) => (typeof g === 'string' ? g.trim() : referenceFieldFi(g)))
      if (gc.length) c.general_concept = gc
      else delete c.general_concept
    }
    if (c.position !== undefined && c.position !== null) {
      const t =
        typeof c.position === 'string'
          ? c.position.trim()
          : referenceFieldFi(c.position as ReferenceField).trim()
      if (t) c.position = t
      else delete c.position
    }
    delete (c as { person?: unknown }).person
    delete (c as { place?: unknown }).place
    delete (c as { date?: unknown }).date
    if (contentHasPersistableContent(c)) out.content = c
    else delete out.content
  }

  if (out.physical_description) {
    const p = { ...out.physical_description }
    delete (p as Record<string, unknown>).object_component_name
    if (p.object_component?.length) {
      p.object_component = p.object_component
        .map((row) => {
          const r = { ...row }
          if (r.object_name != null && !objectNameRowHasContent(r.object_name)) delete r.object_name
          else if (r.object_name != null) {
            r.object_name = {
              ...r.object_name,
              language: referenceFieldToPayload(IMPLICIT_OBJECT_NAME_LANGUAGE),
            }
          }
          return r
        })
        .filter(objectComponentRowHasContent)
      if (p.object_component.length === 0) delete p.object_component
    }
    if (p.color != null) {
      if (Array.isArray(p.color)) {
        const cols = p.color
          .map((c) => (typeof c === 'string' ? referenceFieldToPayload(c.trim()) : c))
          .filter((c) => referenceFieldFi(c))
        if (cols.length) p.color = cols
        else delete p.color
      } else {
        const ref =
          typeof p.color === 'string' ? referenceFieldToPayload(p.color.trim()) : p.color
        if (referenceFieldFi(ref)) p.color = [ref]
        else delete p.color
      }
    }
    if (physicalDescriptionHasContent(p)) out.physical_description = p
    else delete out.physical_description
  }

  return descriptionHasPersistableContent(out) ? out : undefined
}
