/**
 * Description domain helpers for save compaction (docs/data/description-models.md).
 */

import type {
  Content,
  ContentEvent,
  Description,
  Inscription,
  Interpretation,
  Material,
  MaterialComponent,
  Measurement,
  PhysicalDescription,
  Translation,
} from '../types/record/description'
import type { ReferenceField, Temporal } from '../types/record/common'
import { actorRowHasContent, spatialRowHasContent } from './acquisitionPayload'
import { referenceFieldFi } from './referenceField'
import { temporalHasPersistableContent } from './temporalPayload'

function temporalRowHasContent(t?: Temporal): boolean {
  return !!(t && temporalHasPersistableContent(t))
}

export function measurementRowHasContent(m: Measurement): boolean {
  return !!(
    referenceFieldFi(m.unit) ||
    (m.value != null && Number.isFinite(m.value)) ||
    referenceFieldFi(m.measurement_unit) ||
    m.value_qualifier?.trim()
  )
}

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
    temporalRowHasContent(i.date) ||
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
    temporalRowHasContent(ins.date) ||
    (ins.inscriber && actorRowHasContent(ins.inscriber)) ||
    ins.interpretation?.some(interpretationRowHasContent)
  )
}

export function contentEventRowHasContent(e: ContentEvent): boolean {
  return !!(referenceFieldFi(e.name) || referenceFieldFi(e.type))
}

export function contentStyleRowHasContent(st: string | ReferenceField): boolean {
  if (typeof st === 'string') return !!st.trim()
  return !!referenceFieldFi(st)
}

export function physicalDescriptionHasContent(p: PhysicalDescription): boolean {
  return !!(
    p.text?.trim() ||
    p.edition_number?.trim() ||
    (p.copy_number != null && Number.isFinite(p.copy_number)) ||
    referenceFieldFi(p.object_status) ||
    referenceFieldFi(p.object_component_name) ||
    referenceFieldFi(p.photo_format) ||
    referenceFieldFi(p.orientation) ||
    referenceFieldFi(p.color) ||
    referenceFieldFi(p.audio) ||
    referenceFieldFi(p.form)
  )
}

export function contentHasPersistableContent(c: Content): boolean {
  const styleOk = c.style?.some((s) => (typeof s === 'string' ? s.trim() : referenceFieldFi(s)))
  return !!(
    c.description?.trim() ||
    c.note?.trim() ||
    temporalRowHasContent(c.date) ||
    (c.person && actorRowHasContent(c.person)) ||
    (c.place && spatialRowHasContent(c.place)) ||
    referenceFieldFi(c.activity) ||
    c.event?.some(contentEventRowHasContent) ||
    referenceFieldFi(c.position) ||
    referenceFieldFi(c.script) ||
    referenceFieldFi(c.language) ||
    styleOk ||
    referenceFieldFi(c.general_concept) ||
    referenceFieldFi(c.classification)
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
    if (contentHasPersistableContent(c)) out.content = c
    else delete out.content
  }

  if (out.physical_description) {
    const p = { ...out.physical_description }
    if (physicalDescriptionHasContent(p)) out.physical_description = p
    else delete out.physical_description
  }

  return descriptionHasPersistableContent(out) ? out : undefined
}
