/**
 * Description domain form (docs/data/description-models.md — Description and nested types).
 */

import { MATERIAL_TYPE_FI, MATERIAL_TYPE_GROUPS } from '../../data/maoMaterialGroups'
import { MATERIAL_COMPONENT_TYPE_FI, MATERIAL_COMPONENT_TYPE_GROUPS } from '../../data/ysoMaterialComponentGroups'
import { INSCRIPTION_SCRIPT_FI, INSCRIPTION_SCRIPT_GROUPS } from '../../data/ysoKirjoitusjarjestelmatGroups'
import {
  AUDIO_FI,
  COLOR_FI,
  FORM_INSTALLATION_FI,
  INSCRIPTION_DIRECTION_FI,
  INSCRIPTION_METHOD_FI,
  INSCRIPTION_TYPE_FI,
  LANGUAGE_FI,
  LANGUAGE_GROUPS,
  MEASUREMENT_NAME_FI,
  MEASUREMENT_NAME_GROUPS,
  MEASUREMENT_UNIT_FI,
  MEASUREMENT_UNIT_GROUPS,
  OBJECT_NAME_TYPE_FI,
  OBJECT_NAME_VALUE_FI,
  OBJECT_STATUS_FI,
  ORIENTATION_FI,
  PHOTO_FORMAT_FI,
} from '../../data/referenceVocabularies'
import { DATE_ASSOCIATION_FI } from '../../data/temporalFormAllowlists'
import {
  contentDateEntryHasContent,
  contentEventRowHasContent,
  contentStyleRowHasContent,
  descriptionEditorRetainsDomain,
  interpretationRowHasContent,
  inscriptionRowHasContent,
  inscriptionTranslationRowHasContent,
  materialComponentRowHasContent,
  materialRowHasContent,
  measurementRowHasContent,
  objectComponentRowHasContent,
} from '../../lib/descriptionPayload'
import { actorRowHasContent, spatialRowHasContent } from '../../lib/acquisitionPayload'
import { dateDetailSummaryLine } from '../../lib/temporalPayload'
import { actorFieldHasContent } from '../../lib/actorField'
import { mergeObjectNameWithImplicitLanguage, objectNameRowHasContent } from '../../lib/identificationTitles'
import { referenceFieldFi, referenceFieldToPayload, referenceSelectOptions } from '../../lib/referenceField'
import type { RecordPayload } from '../../types/record'
import type { ReferenceField, ReferencePayload } from '../../types/record/common'
import type { ActorField, Spatial } from '../../types/record/actor'
import type { ObjectName } from '../../types/record/identification'
import type {
  Content,
  ContentDateEntry,
  ContentEvent,
  Inscription,
  Interpretation,
  Material,
  MaterialComponent,
  Measurement,
  ObjectComponent,
  PhysicalDescription,
  Translation,
} from '../../types/record/description'
import { useTranslation } from 'react-i18next'
import Select, { type MultiValue } from 'react-select'
import { useActorStore } from '../../stores/actorStore'
import { recordActorSlotSummary } from './actorMiniForm'
import { ActorRefSelect } from './ActorRefSelect'
import { SpatialFields } from './SpatialFields'
import { CollapsibleRepeatableRow } from './CollapsibleRepeatableRow'
import { FieldInfoText } from './FieldInfoText'
import { GroupedReferenceSelect } from './GroupedReferenceSelect'
import { IconclassReferenceSelect } from './IconclassReferenceSelect'
import { YsoConceptReferenceSelect } from './YsoConceptReferenceSelect'
import { GroupedMaoStyleSelect } from './GroupedMaoStyleSelect'
import { GroupedYsoConceptSelect } from './GroupedYsoConceptSelect'
import { ReferenceSelect } from './ReferenceSelect'
import { DateDetailInputs } from './TemporalFields'
import { useRepeatableCollapsedRows } from './useRepeatableCollapsedRows'

/** YSO kielet (p3749) — merkinnän kieli, käännöksen kieli, sisällön kieli */
const YSO_LANGUAGE_SELECT_OPTIONS = {
  groups: LANGUAGE_GROUPS,
  flatAllowlist: LANGUAGE_FI,
}

/** Legacy rows may still have `name` as Reference until normalize runs. */
function contentEventNameDisplay(ev: ContentEvent): string {
  const n = ev.name
  if (typeof n === 'string') return n
  if (n != null && typeof n === 'object') return referenceFieldFi(n as ReferenceField)
  return ''
}

/** Legacy `content.position` as Reference until normalize runs. */
function contentPositionDisplay(position: Content['position']): string {
  if (position == null) return ''
  if (typeof position === 'string') return position
  return referenceFieldFi(position as ReferenceField)
}

function MaterialComponentsFieldset(props: {
  materialIndex: number
  comps: MaterialComponent[]
  onSetComponents: (next: MaterialComponent[]) => void
  disabled: boolean
}) {
  const { t } = useTranslation()
  const { materialIndex, comps, onSetComponents, disabled } = props
  const compsCol = useRepeatableCollapsedRows(comps, materialComponentRowHasContent)

  return (
    <fieldset className="record-form-repeatable-fieldset">
      <legend>{t('recordForm.description.componentsLegend')}</legend>
      <FieldInfoText infoKey="recordForm.info.description.materialComponents" />
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => onSetComponents([...comps, {}])}
        disabled={disabled}
      >
        {t('recordForm.description.addComponent')}
      </button>
      {comps.map((comp, cIdx) => (
        <CollapsibleRepeatableRow
          key={cIdx}
          id={`rf-desc-mat-${materialIndex}-comp-${cIdx}`}
          collapsed={compsCol.isCollapsed(cIdx)}
          onToggleCollapse={() => compsCol.toggle(cIdx)}
          onRemove={() => onSetComponents(comps.filter((_, j) => j !== cIdx))}
          disabled={disabled}
          saveItemNoun={t('recordForm.repeatable.saveItemLabels.materialComponent')}
          removeLabel={t('recordForm.description.removeMaterialComponent')}
          summary={
            referenceFieldFi(comp.type)?.trim() ||
            comp.note?.trim() ||
            t('recordForm.description.materialComponentEmpty')
          }
        >
          <GroupedReferenceSelect
            id={`rf-desc-mat-comp-type-${materialIndex}-${cIdx}`}
            label={t('recordForm.labels.componentType')}
            groups={MATERIAL_COMPONENT_TYPE_GROUPS}
            flatAllowlist={MATERIAL_COMPONENT_TYPE_FI}
            valueFi={referenceFieldFi(comp.type)}
            onChangeFi={(fi) => {
              const next = comps.map((x, j) =>
                j === cIdx ? { ...x, type: referenceFieldToPayload(fi) } : x,
              )
              onSetComponents(next)
            }}
            disabled={disabled}
            emptyLabel="—"
          />
          <div className="form-group form-group--grow">
            <label htmlFor={`rf-desc-mat-comp-note-${materialIndex}-${cIdx}`}>
              {t('recordForm.labels.noteMaterialComponent')}
            </label>
            <FieldInfoText infoKey="recordForm.info.description.noteMaterialComponent" />
            <textarea
              id={`rf-desc-mat-comp-note-${materialIndex}-${cIdx}`}
              value={comp.note ?? ''}
              onChange={(e) => {
                const v = e.target.value
                const next = comps.map((x, j) =>
                  j === cIdx ? { ...x, note: v.trim() ? v : undefined } : x,
                )
                onSetComponents(next)
              }}
              rows={3}
              disabled={disabled}
            />
          </div>
        </CollapsibleRepeatableRow>
      ))}
    </fieldset>
  )
}

export interface DescriptionFieldsProps {
  data: RecordPayload
  onChange: (next: RecordPayload) => void
  disabled: boolean
}

function patchDescription(data: RecordPayload, fn: (d: NonNullable<RecordPayload['description']>) => void): RecordPayload {
  const desc = { ...(data.description ?? {}) }
  fn(desc)
  return { ...data, description: descriptionEditorRetainsDomain(desc) ? desc : undefined }
}

function actorSlotPatch(next: ActorField | undefined): ActorField | undefined {
  if (next == null || !actorFieldHasContent(next)) return undefined
  return next
}

function InscriptionTranslationsFieldset(props: {
  inscriptionIndex: number
  translations: Translation[]
  onSetTranslations: (rows: Translation[]) => void
  disabled: boolean
}) {
  const { t } = useTranslation()
  const { inscriptionIndex, translations, onSetTranslations, disabled } = props
  const trCol = useRepeatableCollapsedRows(translations, inscriptionTranslationRowHasContent)

  return (
    <fieldset className="record-form-repeatable-fieldset">
      <legend>{t('recordForm.description.inscriptionTranslationsLegend')}</legend>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => onSetTranslations([...translations, {}])}
        disabled={disabled}
      >
        {t('recordForm.description.addTranslation')}
      </button>
      {translations.map((tr, trIdx) => (
        <CollapsibleRepeatableRow
          key={trIdx}
          id={`rf-desc-ins-${inscriptionIndex}-tr-${trIdx}`}
          collapsed={trCol.isCollapsed(trIdx)}
          onToggleCollapse={() => trCol.toggle(trIdx)}
          onRemove={() => onSetTranslations(translations.filter((_, j) => j !== trIdx))}
          disabled={disabled}
          saveItemNoun={t('recordForm.repeatable.saveItemLabels.inscriptionTranslation')}
          removeLabel={t('recordForm.description.removeTranslation')}
          summary={
            tr.text?.trim()?.slice(0, 80) ||
            referenceFieldFi(tr.language) ||
            t('recordForm.description.translationEmpty')
          }
        >
          <div className="form-group form-group--grow">
            <label htmlFor={`rf-desc-ins-tr-text-${inscriptionIndex}-${trIdx}`}>{t('recordForm.labels.translationText')}</label>
            <textarea
              id={`rf-desc-ins-tr-text-${inscriptionIndex}-${trIdx}`}
              value={tr.text ?? ''}
              onChange={(e) => {
                const v = e.target.value
                const next = translations.map((x, j) =>
                  j === trIdx ? { ...x, text: v.trim() ? v : undefined } : x,
                )
                onSetTranslations(next)
              }}
              rows={2}
              disabled={disabled}
            />
          </div>
          <GroupedReferenceSelect
            id={`rf-desc-ins-tr-lang-${inscriptionIndex}-${trIdx}`}
            label={t('recordForm.labels.translationLanguage')}
            {...YSO_LANGUAGE_SELECT_OPTIONS}
            valueFi={referenceFieldFi(tr.language)}
            onChangeFi={(fi) => {
              const next = translations.map((x, j) =>
                j === trIdx ? { ...x, language: referenceFieldToPayload(fi) } : x,
              )
              onSetTranslations(next)
            }}
            disabled={disabled}
            emptyLabel="—"
          />
          <p className="record-form-repeatable-hint">{t('recordForm.description.translatorHint')}</p>
          <div className="record-form-repeatable-row record-form-repeatable-row--compact">
            <ActorRefSelect
              id={`rf-desc-ins-tr-act-${inscriptionIndex}-${trIdx}`}
              label={t('recordForm.description.translatorLabel')}
              value={tr.translator}
              onChange={(next) => {
                const v = actorSlotPatch(next)
                const nextTr = translations.map((x, j) =>
                  j === trIdx ? { ...x, translator: v } : x,
                )
                onSetTranslations(nextTr)
              }}
              disabled={disabled}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm record-form-repeatable-remove"
              onClick={() => {
                const nextTr = translations.map((x, j) =>
                  j === trIdx ? { ...x, translator: undefined } : x,
                )
                onSetTranslations(nextTr)
              }}
              disabled={disabled}
            >
              {t('recordForm.description.clear')}
            </button>
          </div>
        </CollapsibleRepeatableRow>
      ))}
    </fieldset>
  )
}

function InscriptionInterpretationsFieldset(props: {
  inscriptionIndex: number
  interpretations: Interpretation[]
  onSetInterpretations: (rows: Interpretation[]) => void
  disabled: boolean
}) {
  const { t } = useTranslation()
  const { inscriptionIndex, interpretations, onSetInterpretations, disabled } = props
  const intCol = useRepeatableCollapsedRows(interpretations, interpretationRowHasContent)

  return (
    <fieldset className="record-form-repeatable-fieldset">
      <legend>{t('recordForm.description.inscriptionInterpretationsLegend')}</legend>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => onSetInterpretations([...interpretations, {}])}
        disabled={disabled}
      >
        {t('recordForm.description.addInterpretation')}
      </button>
      {interpretations.map((ip, ipIdx) => (
        <CollapsibleRepeatableRow
          key={ipIdx}
          id={`rf-desc-ins-${inscriptionIndex}-int-${ipIdx}`}
          collapsed={intCol.isCollapsed(ipIdx)}
          onToggleCollapse={() => intCol.toggle(ipIdx)}
          onRemove={() => onSetInterpretations(interpretations.filter((_, j) => j !== ipIdx))}
          disabled={disabled}
          saveItemNoun={t('recordForm.repeatable.saveItemLabels.inscriptionInterpretation')}
          removeLabel={t('recordForm.description.removeInterpretation')}
          summary={ip.text?.trim()?.slice(0, 80) || t('recordForm.description.interpretationEmpty')}
        >
          <div className="form-group form-group--grow">
            <label htmlFor={`rf-desc-ins-int-text-${inscriptionIndex}-${ipIdx}`}>
              {t('recordForm.labels.interpretationText')}
            </label>
            <FieldInfoText infoKey="recordForm.info.description.interpretationText" />
            <textarea
              id={`rf-desc-ins-int-text-${inscriptionIndex}-${ipIdx}`}
              value={ip.text ?? ''}
              onChange={(e) => {
                const v = e.target.value
                const next = interpretations.map((x, j) =>
                  j === ipIdx ? { ...x, text: v.trim() ? v : undefined } : x,
                )
                onSetInterpretations(next)
              }}
              rows={2}
              disabled={disabled}
            />
          </div>
          <DateDetailInputs
            idPrefix={`rf-desc-ins-int-date-${inscriptionIndex}-${ipIdx}`}
            dateLabel={t('recordForm.description.interpretationDateLegend')}
            infoPrefix="recordForm.info.description.interpretationDate"
            value={ip.date}
            onChange={(next) => {
              const nextIp = interpretations.map((x, j) =>
                j === ipIdx ? { ...x, date: next } : x,
              )
              onSetInterpretations(nextIp)
            }}
            disabled={disabled}
            flatLayout
          />
          <ActorRefSelect
            id={`rf-desc-ins-int-act-${inscriptionIndex}-${ipIdx}`}
            label={t('recordForm.description.interpretatorLabel')}
            infoKey="recordForm.info.description.inscriptionInterpretator"
            value={ip.interpretator}
            onChange={(next) => {
              const v = actorSlotPatch(next)
              const nextIp = interpretations.map((x, j) =>
                j === ipIdx ? { ...x, interpretator: v } : x,
              )
              onSetInterpretations(nextIp)
            }}
            disabled={disabled}
          />
        </CollapsibleRepeatableRow>
      ))}
    </fieldset>
  )
}

function physicalColorFiSet(color: PhysicalDescription['color']): Set<string> {
  const s = new Set<string>()
  if (color == null) return s
  if (Array.isArray(color)) {
    for (const item of color) {
      const fi = referenceFieldFi(item)
      if (fi) s.add(fi)
    }
  } else {
    const fi = referenceFieldFi(color)
    if (fi) s.add(fi)
  }
  return s
}

/** Ordered allowlist first, then any legacy labels not in COLOR_FI. */
function physicalColorPersistPayload(selected: Set<string>): ReferencePayload[] | undefined {
  const ordered: ReferencePayload[] = []
  for (const opt of COLOR_FI) {
    if (selected.has(opt)) {
      const ref = referenceFieldToPayload(opt)
      if (ref) ordered.push(ref)
    }
  }
  for (const label of selected) {
    if (!COLOR_FI.includes(label)) {
      const ref = referenceFieldToPayload(label)
      if (ref) ordered.push(ref)
    }
  }
  return ordered.length ? ordered : undefined
}

type PhysicalColorOption = { value: string; label: string }

/** Allowlist order first, then legacy extras — matches physicalColorPersistPayload ordering. */
function orderedPhysicalColorFi(selected: Set<string>): string[] {
  const ordered: string[] = []
  for (const opt of COLOR_FI) {
    if (selected.has(opt)) ordered.push(opt)
  }
  for (const label of selected) {
    if (!COLOR_FI.includes(label)) ordered.push(label)
  }
  return ordered
}

function MeasurementRowEditor(props: {
  idPrefix: string
  row: Measurement
  index: number
  onPatch: (index: number, patch: Partial<Measurement>) => void
  disabled?: boolean
  /** First column label; defaults to "Nimi (mitta)" / Name (measurement). */
  measurementNameLabel?: string
  /** Numeric value column; defaults to "Arvo" / Value. */
  valueLabel?: string
  /** Guide paragraph under the value label (e.g. tekninen ominaisuus). */
  valueInfoKey?: string
  /** Guide paragraph under the mittayksikkö select. */
  unitInfoKey?: string
}) {
  const { t } = useTranslation()
  const { idPrefix, row, index, onPatch, disabled, measurementNameLabel, valueLabel, valueInfoKey, unitInfoKey } =
    props
  const parseOptionalNumber = (raw: string): number | undefined => {
    if (raw.trim() === '') return undefined
    const n = Number(raw)
    return Number.isFinite(n) ? n : undefined
  }
  const priceInputValue = (n: number | undefined) =>
    n != null && Number.isFinite(n) ? String(n) : ''

  return (
    <>
      <GroupedReferenceSelect
        id={`${idPrefix}-name-${index}`}
        label={measurementNameLabel ?? t('recordForm.labels.measurementName')}
        groups={MEASUREMENT_NAME_GROUPS}
        flatAllowlist={MEASUREMENT_NAME_FI}
        valueFi={referenceFieldFi(row.unit)}
        onChangeFi={(fi) => onPatch(index, { unit: referenceFieldToPayload(fi) })}
        disabled={disabled}
        emptyLabel="—"
      />
      <div className="form-group">
        <label htmlFor={`${idPrefix}-val-${index}`}>{valueLabel ?? t('recordForm.labels.value')}</label>
        <FieldInfoText infoKey={valueInfoKey} />
        <input
          id={`${idPrefix}-val-${index}`}
          type="number"
          step="any"
          value={priceInputValue(row.value)}
          onChange={(e) => onPatch(index, { value: parseOptionalNumber(e.target.value) })}
          disabled={disabled}
        />
      </div>
      <GroupedReferenceSelect
        id={`${idPrefix}-unit-${index}`}
        label={t('recordForm.labels.unit')}
        infoKey={unitInfoKey}
        groups={MEASUREMENT_UNIT_GROUPS}
        flatAllowlist={MEASUREMENT_UNIT_FI}
        valueFi={referenceFieldFi(row.measurement_unit)}
        onChangeFi={(fi) => onPatch(index, { measurement_unit: referenceFieldToPayload(fi) })}
        disabled={disabled}
        emptyLabel="—"
      />
    </>
  )
}

export function DescriptionFields({ data, onChange, disabled }: DescriptionFieldsProps) {
  const { t } = useTranslation()
  const actorStore = useActorStore()
  const resolveActorCatalog = (id: number) => actorStore.actorById(id)?.data
  const d = data.description ?? {}
  const phys = d.physical_description ?? {}
  const content = d.content ?? {}

  const materials = d.material ?? []
  const tech = d.technical_attribute ?? []
  const inscriptions = d.inscription ?? []
  const contentEvents = content.event ?? []
  const contentStyles = content.style ?? []
  const contentActors = content.actors ?? []
  const contentPlaces = content.places ?? []
  const contentDates = content.dates ?? []

  const objectComponents = phys.object_component ?? []
  const materialsCol = useRepeatableCollapsedRows(materials, materialRowHasContent)
  const techCol = useRepeatableCollapsedRows(tech, measurementRowHasContent)
  const objectComponentsCol = useRepeatableCollapsedRows(objectComponents, objectComponentRowHasContent)
  const inscriptionsCol = useRepeatableCollapsedRows(inscriptions, inscriptionRowHasContent)
  const contentEventsCol = useRepeatableCollapsedRows(contentEvents, contentEventRowHasContent)
  const contentStylesCol = useRepeatableCollapsedRows(contentStyles, contentStyleRowHasContent)
  const contentActorsCol = useRepeatableCollapsedRows(contentActors, actorRowHasContent)
  const contentPlacesCol = useRepeatableCollapsedRows(contentPlaces, spatialRowHasContent)
  const contentDatesCol = useRepeatableCollapsedRows(contentDates, contentDateEntryHasContent)

  const parseOptionalNumber = (raw: string): number | undefined => {
    if (raw.trim() === '') return undefined
    const n = Number(raw)
    return Number.isFinite(n) ? n : undefined
  }
  const priceInputValue = (n: number | undefined) =>
    n != null && Number.isFinite(n) ? String(n) : ''

  const setPhysPatch = (patch: Partial<typeof phys>) => {
    onChange(
      patchDescription(data, (desc) => {
        const base = { ...(desc.physical_description ?? {}) }
        for (const [k, v] of Object.entries(patch)) {
          const key = k as keyof typeof base
          if (v === undefined || (typeof v === 'string' && !v.trim())) {
            delete base[key]
          } else {
            ;(base as Record<string, unknown>)[k] = v
          }
        }
        desc.physical_description = Object.keys(base).length ? base : undefined
      }),
    )
  }

  const setPhysRef = (key: keyof typeof phys, fi: string) => {
    const ref = referenceFieldToPayload(fi)
    setPhysPatch({ [key]: ref } as Partial<typeof phys>)
  }

  const setMaterials = (rows: Material[]) => {
    onChange(
      patchDescription(data, (desc) => {
        desc.material = rows.length ? rows : undefined
      }),
    )
  }

  const setTech = (rows: Measurement[]) => {
    onChange(
      patchDescription(data, (desc) => {
        desc.technical_attribute = rows.length ? rows : undefined
      }),
    )
  }

  const setInscriptions = (rows: Inscription[]) => {
    onChange(
      patchDescription(data, (desc) => {
        desc.inscription = rows.length ? rows : undefined
      }),
    )
  }

  const patchContent = (fn: (c: NonNullable<typeof d.content>) => void) => {
    onChange(
      patchDescription(data, (desc) => {
        const c = { ...(desc.content ?? {}) }
        fn(c)
        desc.content = Object.keys(c).length ? c : undefined
      }),
    )
  }

  const patchMaterial = (index: number, patch: Partial<Material>) => {
    const next = materials.map((m, i) => (i === index ? { ...m, ...patch } : m))
    setMaterials(next)
  }

  const setObjectComponents = (rows: ObjectComponent[]) => {
    onChange(
      patchDescription(data, (desc) => {
        const base = { ...(desc.physical_description ?? {}) }
        if (rows.length) base.object_component = rows
        else delete base.object_component
        desc.physical_description = Object.keys(base).length ? base : undefined
      }),
    )
  }

  const patchObjectComponent = (index: number, patch: Partial<ObjectComponent>) => {
    const next = objectComponents.map((row, i) => (i === index ? { ...row, ...patch } : row))
    setObjectComponents(next)
  }

  const updateObjectComponentName = (index: number, patch: Partial<ObjectName>) => {
    const row = objectComponents[index]
    const merged = mergeObjectNameWithImplicitLanguage(row?.object_name ?? {}, patch)
    patchObjectComponent(index, { object_name: objectNameRowHasContent(merged) ? merged : undefined })
  }

  const addObjectComponent = () => {
    setObjectComponents([...objectComponents, {}])
  }

  const removeObjectComponent = (index: number) => {
    setObjectComponents(objectComponents.filter((_, i) => i !== index))
  }

  const patchMaterialComponents = (index: number, rows: MaterialComponent[]) => {
    patchMaterial(index, { component: rows.length ? rows : undefined })
  }

  return (
    <div className="record-form-section-fields">
      <fieldset className="record-form-repeatable-fieldset">
        <legend>{t('recordForm.labels.physicalDescription')}</legend>
        <ReferenceSelect
          id="rf-desc-obj-status"
          label={t('recordForm.labels.objectStatus')}
          infoKey="recordForm.info.description.objectStatus"
          allowlist={OBJECT_STATUS_FI}
          valueFi={referenceFieldFi(phys.object_status)}
          onChangeFi={(fi) => setPhysRef('object_status', fi)}
          disabled={disabled}
          emptyLabel="—"
        />
        <fieldset className="record-form-repeatable-fieldset">
          <legend>{t('recordForm.description.objectComponentsLegend')}</legend>
          <FieldInfoText infoKey="recordForm.info.description.objectComponents" />
          <button type="button" className="btn btn-secondary btn-sm" onClick={addObjectComponent} disabled={disabled}>
            {t('recordForm.description.addObjectComponent')}
          </button>
          {objectComponents.map((row, index) => (
            <CollapsibleRepeatableRow
              key={index}
              id={`rf-desc-oc-row-${index}`}
              collapsed={objectComponentsCol.isCollapsed(index)}
              onToggleCollapse={() => objectComponentsCol.toggle(index)}
              onRemove={() => removeObjectComponent(index)}
              disabled={disabled}
              saveItemNoun={t('recordForm.repeatable.saveItemLabels.objectComponent')}
              summary={
                row.description?.trim()
                  ? row.description.trim().length > 80
                    ? `${row.description.trim().slice(0, 80)}…`
                    : row.description.trim()
                  : referenceFieldFi(row.object_name?.value)?.trim()
                    ? referenceFieldFi(row.object_name?.value)
                    : row.object_number?.trim()
                      ? row.object_number.trim()
                      : t('recordForm.description.emptyObjectComponent')
              }
            >
              <div className="form-group">
                <label htmlFor={`rf-desc-oc-desc-${index}`}>{t('recordForm.labels.objectComponentDescription')}</label>
                <FieldInfoText infoKey="recordForm.info.description.objectComponentDescription" />
                <textarea
                  id={`rf-desc-oc-desc-${index}`}
                  value={row.description ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    patchObjectComponent(index, { description: v.trim() ? v : undefined })
                  }}
                  rows={3}
                  maxLength={4000}
                  disabled={disabled}
                />
              </div>
              <div className="form-group">
                <label htmlFor={`rf-desc-oc-on-val-${index}`}>{t('recordForm.labels.objectNameValue')}</label>
                <select
                  id={`rf-desc-oc-on-val-${index}`}
                  value={referenceFieldFi(row.object_name?.value)}
                  onChange={(e) =>
                    updateObjectComponentName(index, { value: referenceFieldToPayload(e.target.value) })
                  }
                  disabled={disabled}
                >
                  <option value="">—</option>
                  {referenceSelectOptions(OBJECT_NAME_VALUE_FI, referenceFieldFi(row.object_name?.value)).map(
                    (opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor={`rf-desc-oc-on-type-${index}`}>{t('recordForm.labels.objectNameType')}</label>
                <select
                  id={`rf-desc-oc-on-type-${index}`}
                  value={referenceFieldFi(row.object_name?.type)}
                  onChange={(e) =>
                    updateObjectComponentName(index, { type: referenceFieldToPayload(e.target.value) })
                  }
                  disabled={disabled}
                >
                  <option value="">—</option>
                  {referenceSelectOptions(OBJECT_NAME_TYPE_FI, referenceFieldFi(row.object_name?.type)).map(
                    (opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor={`rf-desc-oc-num-${index}`}>{t('recordForm.labels.objectComponentIdentifier')}</label>
                <FieldInfoText infoKey="recordForm.info.description.objectComponentIdentifier" />
                <input
                  id={`rf-desc-oc-num-${index}`}
                  type="text"
                  value={row.object_number ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    patchObjectComponent(index, { object_number: v.trim() ? v : undefined })
                  }}
                  maxLength={200}
                  disabled={disabled}
                />
              </div>
            </CollapsibleRepeatableRow>
          ))}
        </fieldset>
        <div className="form-group">
          <label htmlFor="rf-desc-phys-text">{t('recordForm.labels.descriptionText')}</label>
          <FieldInfoText infoKey="recordForm.info.description.physicalDescription" />
          <textarea
            id="rf-desc-phys-text"
            value={phys.text ?? ''}
            onChange={(e) => {
              const v = e.target.value
              setPhysPatch({ text: v.trim() ? v : undefined })
            }}
            rows={4}
            maxLength={4000}
            disabled={disabled}
          />
        </div>
        <ReferenceSelect
          id="rf-desc-photo-format"
          label={t('recordForm.labels.photoFormat')}
          infoKey="recordForm.info.description.photoType"
          allowlist={PHOTO_FORMAT_FI}
          valueFi={referenceFieldFi(phys.photo_format)}
          onChangeFi={(fi) => setPhysRef('photo_format', fi)}
          disabled={disabled}
          emptyLabel="—"
        />
        <ReferenceSelect
          id="rf-desc-orientation"
          label={t('recordForm.labels.orientation')}
          infoKey="recordForm.info.description.orientation"
          allowlist={ORIENTATION_FI}
          valueFi={referenceFieldFi(phys.orientation)}
          onChangeFi={(fi) => setPhysRef('orientation', fi)}
          disabled={disabled}
          emptyLabel="—"
        />
        <div className="form-group record-form-color-multiselect">
          <label htmlFor="rf-desc-color-input">{t('recordForm.labels.color')}</label>
          <FieldInfoText infoKey="recordForm.info.description.color" />
          {(() => {
            const selectedFi = physicalColorFiSet(phys.color)
            const optionList = [...COLOR_FI]
            for (const fi of selectedFi) {
              if (!optionList.includes(fi)) optionList.push(fi)
            }
            const options: PhysicalColorOption[] = optionList.map((fi) => ({ value: fi, label: fi }))
            const value: PhysicalColorOption[] = orderedPhysicalColorFi(selectedFi).map((fi) => ({
              value: fi,
              label: fi,
            }))
            return (
              <Select<PhysicalColorOption, true>
                inputId="rf-desc-color-input"
                instanceId="rf-desc-color"
                classNamePrefix="record-form-color-multiselect"
                options={options}
                value={value}
                onChange={(next: MultiValue<PhysicalColorOption>) => {
                  const s = new Set<string>()
                  for (const o of next) s.add(o.value)
                  setPhysPatch({
                    color: physicalColorPersistPayload(s),
                  } as Partial<typeof phys>)
                }}
                isMulti
                isClearable
                isSearchable
                isDisabled={disabled}
                closeMenuOnSelect={false}
                hideSelectedOptions
                placeholder={t('recordForm.description.colorAllowlistSelect.placeholder')}
                noOptionsMessage={() => t('recordForm.description.colorAllowlistSelect.noOptionsMessage')}
              />
            )
          })()}
        </div>
        <ReferenceSelect
          id="rf-desc-audio"
          label={t('recordForm.labels.audio')}
          infoKey="recordForm.info.description.audio"
          allowlist={AUDIO_FI}
          valueFi={referenceFieldFi(phys.audio)}
          onChangeFi={(fi) => setPhysRef('audio', fi)}
          disabled={disabled}
          emptyLabel="—"
        />
        <ReferenceSelect
          id="rf-desc-form"
          label={t('recordForm.labels.formInstallation')}
          infoKey="recordForm.info.description.form"
          allowlist={FORM_INSTALLATION_FI}
          valueFi={referenceFieldFi(phys.form)}
          onChangeFi={(fi) => setPhysRef('form', fi)}
          disabled={disabled}
          emptyLabel="—"
        />
        <div className="form-group">
          <label htmlFor="rf-desc-edition">{t('recordForm.labels.editionNumber')}</label>
          <FieldInfoText infoKey="recordForm.info.description.editionNumber" />
          <input
            id="rf-desc-edition"
            type="text"
            value={phys.edition_number ?? ''}
            onChange={(e) => {
              const v = e.target.value
              setPhysPatch({ edition_number: v.trim() ? v : undefined })
            }}
            disabled={disabled}
          />
        </div>
        <div className="form-group">
          <label htmlFor="rf-desc-copy">{t('recordForm.labels.copyNumber')}</label>
          <FieldInfoText infoKey="recordForm.info.description.copyNumber" />
          <input
            id="rf-desc-copy"
            type="number"
            step={1}
            value={priceInputValue(phys.copy_number)}
            onChange={(e) => setPhysPatch({ copy_number: parseOptionalNumber(e.target.value) })}
            disabled={disabled}
          />
        </div>
      </fieldset>

      <fieldset className="record-form-repeatable-fieldset">
        <legend>{t('recordForm.labels.materials')}</legend>
        <FieldInfoText infoKey="recordForm.info.description.materials" />
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMaterials([...materials, {}])} disabled={disabled}>
          {t('recordForm.description.materialsAdd')}
        </button>
        {materials.map((row, index) => (
            <CollapsibleRepeatableRow
              key={index}
              id={`rf-desc-mat-${index}`}
              collapsed={materialsCol.isCollapsed(index)}
              onToggleCollapse={() => materialsCol.toggle(index)}
              onRemove={() => setMaterials(materials.filter((_, i) => i !== index))}
              disabled={disabled}
              saveItemNoun={t('recordForm.repeatable.saveItemLabels.material')}
              removeLabel={t('recordForm.description.removeMaterial')}
              summary={
                row.name?.trim() ||
                referenceFieldFi(row.type) ||
                row.source?.name?.fi?.trim() ||
                t('recordForm.description.materialEmpty')
              }
            >
              <GroupedReferenceSelect
                id={`rf-desc-mat-type-${index}`}
                label={t('recordForm.labels.materialType')}
                groups={MATERIAL_TYPE_GROUPS}
                flatAllowlist={MATERIAL_TYPE_FI}
                valueFi={referenceFieldFi(row.type)}
                onChangeFi={(fi) => patchMaterial(index, { type: referenceFieldToPayload(fi) })}
                disabled={disabled}
                emptyLabel="—"
              />
              <div className="form-group">
                <label htmlFor={`rf-desc-mat-name-${index}`}>{t('recordForm.labels.materialName')}</label>
                <FieldInfoText infoKey="recordForm.info.description.materialName" />
                <input
                  id={`rf-desc-mat-name-${index}`}
                  type="text"
                  value={row.name ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    patchMaterial(index, { name: v.trim() ? v : undefined })
                  }}
                  disabled={disabled}
                />
              </div>
              <div className="form-group form-group--grow">
                <label htmlFor={`rf-desc-mat-src-name-${index}`}>{t('recordForm.labels.sourcePlaceFinnish')}</label>
                <FieldInfoText infoKey="recordForm.info.description.materialOrigin" />
                <input
                  id={`rf-desc-mat-src-name-${index}`}
                  type="text"
                  value={row.source?.name?.fi ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    const src: Spatial = { ...(row.source ?? {}), name: v.trim() ? { fi: v } : undefined }
                    delete src.note
                    if (!src.name?.fi?.trim()) patchMaterial(index, { source: undefined })
                    else patchMaterial(index, { source: src })
                  }}
                  disabled={disabled}
                />
              </div>
              <MaterialComponentsFieldset
                materialIndex={index}
                comps={row.component ?? []}
                onSetComponents={(next) => patchMaterialComponents(index, next)}
                disabled={disabled}
              />
            </CollapsibleRepeatableRow>
        ))}
      </fieldset>

      <fieldset className="record-form-repeatable-fieldset">
        <legend>{t('recordForm.labels.technicalAttributes')}</legend>
        <FieldInfoText infoKey="recordForm.info.description.technicalAttributes" />
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setTech([...tech, {}])} disabled={disabled}>
          {t('recordForm.description.technicalAdd')}
        </button>
        {tech.map((row, index) => (
          <CollapsibleRepeatableRow
            key={index}
            id={`rf-desc-tech-${index}`}
            collapsed={techCol.isCollapsed(index)}
            onToggleCollapse={() => techCol.toggle(index)}
            onRemove={() => setTech(tech.filter((_, j) => j !== index))}
            disabled={disabled}
            saveItemNoun={t('recordForm.repeatable.saveItemLabels.technique')}
            summary={
              [
                referenceFieldFi(row.unit),
                row.value != null && Number.isFinite(row.value) ? String(row.value) : '',
                referenceFieldFi(row.measurement_unit),
              ]
                .filter(Boolean)
                .join(' · ') || t('recordForm.description.technicalEmpty')
            }
          >
            <MeasurementRowEditor
              idPrefix="rf-desc-tech"
              row={row}
              index={index}
              onPatch={(i, patch) => setTech(tech.map((r, j) => (j === i ? { ...r, ...patch } : r)))}
              disabled={disabled}
              measurementNameLabel={t('recordForm.labels.measurementNameTechnical')}
              valueLabel={t('recordForm.labels.valueTechnical')}
              valueInfoKey="recordForm.info.description.valueTechnical"
              unitInfoKey="recordForm.info.description.measurementUnitTechnical"
            />
          </CollapsibleRepeatableRow>
        ))}
      </fieldset>

      <fieldset className="record-form-repeatable-fieldset">
        <legend>{t('recordForm.labels.inscriptions')}</legend>
        <FieldInfoText infoKey="recordForm.info.description.inscriptions" />
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setInscriptions([...inscriptions, {}])}
          disabled={disabled}
        >
          {t('recordForm.description.inscriptionsAdd')}
        </button>
        {inscriptions.map((row, index) => {
          const interp = row.interpretation ?? []
          const translations = row.translation ?? []
          const patchIns = (patch: Partial<Inscription>) => {
            setInscriptions(
              inscriptions.map((r, i) => {
                if (i !== index) return r
                const next: Inscription = { ...r, ...patch }
                for (const key of Object.keys(patch) as (keyof Inscription)[]) {
                  if (patch[key] === undefined) delete next[key]
                }
                return next
              }),
            )
          }
          const setInterp = (rows: Interpretation[]) => {
            patchIns({ interpretation: rows.length ? rows : undefined })
          }
          const setTranslations = (rows: Translation[]) => {
            patchIns({ translation: rows.length ? rows : undefined })
          }
          return (
            <CollapsibleRepeatableRow
              key={index}
              id={`rf-desc-ins-${index}`}
              collapsed={inscriptionsCol.isCollapsed(index)}
              onToggleCollapse={() => inscriptionsCol.toggle(index)}
              onRemove={() => setInscriptions(inscriptions.filter((_, i) => i !== index))}
              disabled={disabled}
              saveItemNoun={t('recordForm.repeatable.saveItemLabels.inscription')}
              removeLabel={t('recordForm.description.removeInscription')}
              summary={
                row.position?.trim() ||
                row.content?.trim()?.slice(0, 80) ||
                row.description?.trim()?.slice(0, 80) ||
                row.transliteration?.trim()?.slice(0, 80) ||
                row.translation?.find((tr) => tr.text?.trim())?.text?.trim()?.slice(0, 80) ||
                t('recordForm.description.inscriptionEmpty')
              }
            >
              <div className="form-group">
                <label htmlFor={`rf-desc-ins-pos-${index}`}>{t('recordForm.labels.inscriptionPositionLabel')}</label>
                <FieldInfoText infoKey="recordForm.info.description.inscriptionPosition" />
                <input
                  id={`rf-desc-ins-pos-${index}`}
                  type="text"
                  value={row.position ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    patchIns({ position: v.trim() ? v : undefined })
                  }}
                  disabled={disabled}
                />
              </div>
              <div className="form-group form-group--grow">
                <label htmlFor={`rf-desc-ins-content-${index}`}>{t('recordForm.labels.contentTranscript')}</label>
                <FieldInfoText infoKey="recordForm.info.description.inscriptionContent" />
                <textarea
                  id={`rf-desc-ins-content-${index}`}
                  value={row.content ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    patchIns({ content: v.trim() ? v : undefined })
                  }}
                  rows={2}
                  disabled={disabled}
                />
              </div>
              <div className="form-group form-group--grow">
                <label htmlFor={`rf-desc-ins-desc-${index}`}>{t('recordForm.labels.inscriptionDescription')}</label>
                <FieldInfoText infoKey="recordForm.info.description.inscriptionDescription" />
                <textarea
                  id={`rf-desc-ins-desc-${index}`}
                  value={row.description ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    patchIns({ description: v.trim() ? v : undefined })
                  }}
                  rows={2}
                  disabled={disabled}
                />
              </div>
              <GroupedReferenceSelect
                id={`rf-desc-ins-script-${index}`}
                label={t('recordForm.labels.script')}
                infoKey="recordForm.info.description.inscriptionScript"
                groups={INSCRIPTION_SCRIPT_GROUPS}
                flatAllowlist={INSCRIPTION_SCRIPT_FI}
                valueFi={referenceFieldFi(row.script)}
                onChangeFi={(fi) => patchIns({ script: referenceFieldToPayload(fi) })}
                disabled={disabled}
                emptyLabel="—"
              />
              <GroupedReferenceSelect
                id={`rf-desc-ins-lang-${index}`}
                label={t('recordForm.labels.inscriptionLanguage')}
                infoKey="recordForm.info.description.inscriptionLanguage"
                {...YSO_LANGUAGE_SELECT_OPTIONS}
                valueFi={referenceFieldFi(row.language)}
                onChangeFi={(fi) => patchIns({ language: referenceFieldToPayload(fi) })}
                disabled={disabled}
                emptyLabel="—"
              />
              <InscriptionTranslationsFieldset
                inscriptionIndex={index}
                translations={translations}
                onSetTranslations={setTranslations}
                disabled={disabled}
              />
              <div className="form-group form-group--grow">
                <label htmlFor={`rf-desc-ins-translit-${index}`}>{t('recordForm.labels.inscriptionTransliteration')}</label>
                <FieldInfoText infoKey="recordForm.info.description.inscriptionTransliteration" />
                <textarea
                  id={`rf-desc-ins-translit-${index}`}
                  value={row.transliteration ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    patchIns({ transliteration: v.trim() ? v : undefined })
                  }}
                  rows={2}
                  disabled={disabled}
                />
              </div>
              <ReferenceSelect
                id={`rf-desc-ins-type-${index}`}
                label={t('recordForm.labels.inscriptionType')}
                infoKey="recordForm.info.description.inscriptionType"
                allowlist={INSCRIPTION_TYPE_FI}
                valueFi={referenceFieldFi(row.type)}
                onChangeFi={(fi) => patchIns({ type: referenceFieldToPayload(fi) })}
                disabled={disabled}
                emptyLabel="—"
              />
              <ReferenceSelect
                id={`rf-desc-ins-method-${index}`}
                label={t('recordForm.labels.inscriptionTechnique')}
                infoKey="recordForm.info.description.inscriptionMethod"
                allowlist={INSCRIPTION_METHOD_FI}
                valueFi={referenceFieldFi(row.method)}
                onChangeFi={(fi) => patchIns({ method: referenceFieldToPayload(fi) })}
                disabled={disabled}
                emptyLabel="—"
              />
              <ReferenceSelect
                id={`rf-desc-ins-dir-${index}`}
                label={t('recordForm.labels.inscriptionDirection')}
                infoKey="recordForm.info.description.inscriptionDirection"
                allowlist={INSCRIPTION_DIRECTION_FI}
                valueFi={referenceFieldFi(row.direction)}
                onChangeFi={(fi) => patchIns({ direction: referenceFieldToPayload(fi) })}
                disabled={disabled}
                emptyLabel="—"
              />
              <DateDetailInputs
                idPrefix={`rf-desc-ins-date-${index}`}
                dateLabel={t('recordForm.labels.inscriptionDate')}
                infoPrefix="recordForm.info.description.inscriptionDate"
                value={row.date}
                onChange={(next) => patchIns({ date: next })}
                disabled={disabled}
                flatLayout
              />
              <ActorRefSelect
                id={`rf-desc-ins-inscr-${index}`}
                label={t('recordForm.description.inscriberLabel')}
                infoKey="recordForm.info.description.inscriptionInscriber"
                value={row.inscriber}
                onChange={(next) => patchIns({ inscriber: actorSlotPatch(next) })}
                disabled={disabled}
              />
              <InscriptionInterpretationsFieldset
                inscriptionIndex={index}
                interpretations={interp}
                onSetInterpretations={setInterp}
                disabled={disabled}
              />
            </CollapsibleRepeatableRow>
          )
        })}
      </fieldset>

      <fieldset className="record-form-repeatable-fieldset">
        <legend>{t('recordForm.labels.content')}</legend>
        <div className="form-group">
          <label htmlFor="rf-desc-content-desc">{t('recordForm.labels.description')}</label>
          <FieldInfoText infoKey="recordForm.info.description.contentDescription" />
          <textarea
            id="rf-desc-content-desc"
            value={content.description ?? ''}
            onChange={(e) => {
              const v = e.target.value
              patchContent((c) => {
                if (v.trim()) c.description = v
                else delete c.description
              })
            }}
            rows={6}
            maxLength={8000}
            disabled={disabled}
          />
        </div>
        <fieldset className="record-form-repeatable-fieldset">
          <legend>{t('recordForm.description.contentActorsLegend')}</legend>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() =>
              patchContent((c) => {
                c.actors = [...(c.actors ?? []), {} as ActorField]
              })
            }
            disabled={disabled}
          >
            {t('recordForm.description.addContentActor')}
          </button>
          {contentActors.map((actorRow, aIdx) => (
            <CollapsibleRepeatableRow
              key={aIdx}
              id={`rf-desc-content-actor-${aIdx}`}
              collapsed={contentActorsCol.isCollapsed(aIdx)}
              onToggleCollapse={() => contentActorsCol.toggle(aIdx)}
              onRemove={() =>
                patchContent((c) => {
                  const next = (c.actors ?? []).filter((_, j) => j !== aIdx)
                  c.actors = next.length ? next : undefined
                })
              }
              disabled={disabled}
              saveItemNoun={t('recordForm.repeatable.saveItemLabels.contentActor')}
              summary={recordActorSlotSummary(actorRow, resolveActorCatalog)}
            >
              <ActorRefSelect
                id={`rf-desc-content-actor-select-${aIdx}`}
                label={t('recordForm.labels.actor')}
                value={actorRow}
                onChange={(next) => {
                  const v = actorSlotPatch(next)
                  patchContent((c) => {
                    const rows = [...(c.actors ?? [])]
                    while (rows.length <= aIdx) rows.push({} as ActorField)
                    rows[aIdx] = v ?? ({} as ActorField)
                    c.actors = rows
                  })
                }}
                disabled={disabled}
              />
            </CollapsibleRepeatableRow>
          ))}
        </fieldset>
        <div className="form-group">
          <label htmlFor="rf-desc-content-note">{t('recordForm.labels.noteContent')}</label>
          <FieldInfoText infoKey="recordForm.info.description.contentNote" />
          <textarea
            id="rf-desc-content-note"
            value={content.note ?? ''}
            onChange={(e) => {
              const v = e.target.value
              patchContent((c) => {
                if (v.trim()) c.note = v
                else delete c.note
              })
            }}
            rows={2}
            disabled={disabled}
          />
        </div>
        <fieldset className="record-form-repeatable-fieldset">
          <legend>{t('recordForm.description.contentDatesLegend')}</legend>
          <p className="record-form-repeatable-hint">{t('recordForm.description.contentDatesHint')}</p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() =>
              patchContent((c) => {
                c.dates = [...(c.dates ?? []), {} as ContentDateEntry]
              })
            }
            disabled={disabled}
          >
            {t('recordForm.description.addContentDate')}
          </button>
          {contentDates.map((row, index) => (
            <CollapsibleRepeatableRow
              key={index}
              id={`rf-desc-content-date-row-${index}`}
              collapsed={contentDatesCol.isCollapsed(index)}
              onToggleCollapse={() => contentDatesCol.toggle(index)}
              onRemove={() =>
                patchContent((c) => {
                  const next = (c.dates ?? []).filter((_, i) => i !== index)
                  c.dates = next.length ? next : undefined
                })
              }
              disabled={disabled}
              saveItemNoun={t('recordForm.repeatable.saveItemLabels.contentDateEntry')}
              summary={
                [referenceFieldFi(row.content_time_role), dateDetailSummaryLine(row)].filter(Boolean).join(' · ') ||
                t('recordForm.description.emptyContentDate')
              }
            >
              <ReferenceSelect
                id={`rf-desc-content-time-role-${index}`}
                label={t('recordForm.labels.contentTimeRole')}
                infoKey="recordForm.info.description.contentTimeRole"
                allowlist={DATE_ASSOCIATION_FI}
                valueFi={referenceFieldFi(row.content_time_role)}
                onChangeFi={(fi) =>
                  patchContent((c) => {
                    const rows = [...(c.dates ?? [])]
                    while (rows.length <= index) rows.push({} as ContentDateEntry)
                    const ref = referenceFieldToPayload(fi)
                    const cur = { ...(rows[index] as ContentDateEntry) }
                    if (ref) cur.content_time_role = ref
                    else delete cur.content_time_role
                    rows[index] = cur
                    c.dates = rows
                  })
                }
                disabled={disabled}
                emptyLabel="—"
              />
              <DateDetailInputs
                idPrefix={`rf-desc-content-date-${index}`}
                flatLayout
                dateLabel={t('recordForm.description.contentDateEntryLegend', { n: index + 1 })}
                infoPrefix="recordForm.info.description.contentDate"
                value={row}
                onChange={(next) => {
                  patchContent((c) => {
                    const rows = [...(c.dates ?? [])]
                    while (rows.length <= index) rows.push({} as ContentDateEntry)
                    const prev = rows[index] as ContentDateEntry
                    if (next === undefined) {
                      const kept: ContentDateEntry = {}
                      if (prev.content_time_role) kept.content_time_role = prev.content_time_role
                      rows[index] = kept
                    } else {
                      rows[index] = { ...prev, ...next }
                    }
                    c.dates = rows
                  })
                }}
                disabled={disabled}
              />
            </CollapsibleRepeatableRow>
          ))}
        </fieldset>
        <fieldset className="record-form-repeatable-fieldset">
          <legend>{t('recordForm.description.contentPlacesLegend')}</legend>
          <p className="record-form-repeatable-hint">{t('recordForm.description.contentPlacesHint')}</p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() =>
              patchContent((c) => {
                c.places = [...(c.places ?? []), {} as Spatial]
              })
            }
            disabled={disabled}
          >
            {t('recordForm.description.addContentPlace')}
          </button>
          {contentPlaces.map((row, index) => (
            <CollapsibleRepeatableRow
              key={index}
              id={`rf-desc-content-place-row-${index}`}
              collapsed={contentPlacesCol.isCollapsed(index)}
              onToggleCollapse={() => contentPlacesCol.toggle(index)}
              onRemove={() =>
                patchContent((c) => {
                  const next = (c.places ?? []).filter((_, i) => i !== index)
                  c.places = next.length ? next : undefined
                })
              }
              disabled={disabled}
              saveItemNoun={t('recordForm.repeatable.saveItemLabels.contentPlace')}
              summary={
                row.name?.fi?.trim() ||
                row.name?.en?.trim() ||
                row.note?.trim() ||
                referenceFieldFi(row.name_type) ||
                referenceFieldFi(row.content_place_role) ||
                referenceFieldFi(row.status) ||
                row.environmental_details?.trim() ||
                row.position?.trim() ||
                t('recordForm.description.emptyContentPlace')
              }
            >
              <SpatialFields
                idPrefix={`rf-desc-content-place-${index}`}
                nameInputMode="multilingual"
                omitNameGroupLegend
                includeUndefinedLanguage={false}
                placeNameFinnishLabel={t('recordForm.description.contentPlaceNameFi')}
                placeNameEnglishLabel={t('recordForm.description.contentPlaceNameEn')}
                placeNameTypeLabel={t('recordForm.description.contentPlaceNameType')}
                placeNameTypeInfoKey="recordForm.info.description.contentPlaceNameType"
                nameTypeAfterPlaceNames
                showContentPlaceRole
                noteAtBottom
                placeDetailsCollapsible
                value={row}
                onChange={(next) => {
                  patchContent((c) => {
                    const rows = [...(c.places ?? [])]
                    while (rows.length <= index) rows.push({} as Spatial)
                    rows[index] = next ?? ({} as Spatial)
                    c.places = rows
                  })
                }}
                disabled={disabled}
              />
            </CollapsibleRepeatableRow>
          ))}
        </fieldset>
        <YsoConceptReferenceSelect
          id="rf-desc-content-activity"
          label={t('recordForm.labels.contentActivity')}
          infoKey="recordForm.info.description.contentActivity"
          value={
            Array.isArray(content.activity)
              ? content.activity
                  .map((item) =>
                    typeof item === 'string' ? referenceFieldToPayload(item) : item,
                  )
                  .filter((item): item is NonNullable<typeof item> => item != null)
              : content.activity != null
                ? [typeof content.activity === 'string' ? referenceFieldToPayload(content.activity) : content.activity].filter(
                    (item): item is NonNullable<typeof item> => item != null,
                  )
                : []
          }
          onChange={(next) =>
            patchContent((c) => {
              if (next.length) c.activity = next
              else delete c.activity
            })
          }
          disabled={disabled}
        />
        <fieldset className="record-form-repeatable-fieldset">
          <legend>{t('recordForm.description.contentEventsLegend')}</legend>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() =>
              patchContent((c) => {
                c.event = [...(c.event ?? []), {}]
              })
            }
            disabled={disabled}
          >
            {t('recordForm.description.addContentEvent')}
          </button>
          {contentEvents.map((ev, evIdx) => (
            <CollapsibleRepeatableRow
              key={evIdx}
              id={`rf-desc-ce-${evIdx}`}
              collapsed={contentEventsCol.isCollapsed(evIdx)}
              onToggleCollapse={() => contentEventsCol.toggle(evIdx)}
              onRemove={() =>
                patchContent((c) => {
                  const events = (c.event ?? []).filter((_, j) => j !== evIdx)
                  c.event = events.length ? events : undefined
                })
              }
              disabled={disabled}
              saveItemNoun={t('recordForm.repeatable.saveItemLabels.contentEvent')}
              summary={
                [contentEventNameDisplay(ev).trim(), referenceFieldFi(ev.name_type)]
                  .filter(Boolean)
                  .join(' · ') || t('recordForm.description.eventEmpty')
              }
            >
              <div className="form-group">
                <label htmlFor={`rf-desc-ce-name-${evIdx}`}>{t('recordForm.labels.contentSubEventName')}</label>
                <FieldInfoText infoKey="recordForm.info.description.contentSubEventName" />
                <input
                  id={`rf-desc-ce-name-${evIdx}`}
                  type="text"
                  value={contentEventNameDisplay(ev)}
                  onChange={(e) => {
                    const v = e.target.value
                    patchContent((c) => {
                      const events = [...(c.event ?? [])]
                      const nextName = v.trim() || undefined
                      events[evIdx] = { ...events[evIdx], name: nextName }
                      c.event = events.length ? events : undefined
                    })
                  }}
                  disabled={disabled}
                />
              </div>
              <GroupedYsoConceptSelect
                id={`rf-desc-ce-name-type-${evIdx}`}
                label={t('recordForm.labels.contentSubEventNameType')}
                infoKey="recordForm.info.description.contentSubEventNameType"
                value={ev.name_type}
                onChange={(next) =>
                  patchContent((c) => {
                    const events = [...(c.event ?? [])]
                    const row = { ...events[evIdx] }
                    if (next === undefined) delete row.name_type
                    else row.name_type = next
                    events[evIdx] = row
                    c.event = events.length ? events : undefined
                  })
                }
                disabled={disabled}
              />
            </CollapsibleRepeatableRow>
          ))}
        </fieldset>
        <div className="form-group">
          <label htmlFor="rf-desc-content-position">{t('recordForm.labels.contentPosition')}</label>
          <FieldInfoText infoKey="recordForm.info.description.contentPosition" />
          <input
            id="rf-desc-content-position"
            type="text"
            value={contentPositionDisplay(content.position)}
            onChange={(e) => {
              const v = e.target.value
              patchContent((c) => {
                c.position = v === '' ? undefined : v
              })
            }}
            disabled={disabled}
          />
        </div>
        <GroupedReferenceSelect
          id="rf-desc-content-script"
          label={t('recordForm.labels.contentScript')}
          infoKey="recordForm.info.description.contentScript"
          groups={INSCRIPTION_SCRIPT_GROUPS}
          flatAllowlist={INSCRIPTION_SCRIPT_FI}
          valueFi={referenceFieldFi(content.script)}
          onChangeFi={(fi) =>
            patchContent((c) => {
              const ref = referenceFieldToPayload(fi)
              if (ref) c.script = ref
              else delete c.script
            })
          }
          disabled={disabled}
          emptyLabel="—"
        />
        <GroupedReferenceSelect
          id="rf-desc-content-lang"
          label={t('recordForm.labels.contentLanguage')}
          infoKey="recordForm.info.description.contentLanguage"
          {...YSO_LANGUAGE_SELECT_OPTIONS}
          valueFi={referenceFieldFi(content.language)}
          onChangeFi={(fi) =>
            patchContent((c) => {
              const ref = referenceFieldToPayload(fi)
              if (ref) c.language = ref
              else delete c.language
            })
          }
          disabled={disabled}
          emptyLabel="—"
        />
        <YsoConceptReferenceSelect
          id="rf-desc-content-general-concept"
          label={t('recordForm.labels.generalConcept')}
          infoKey="recordForm.info.description.contentGeneralConcept"
          vocabulary="koko"
          messagesKey="recordForm.description.contentKokoSelect"
          value={
            Array.isArray(content.general_concept)
              ? content.general_concept
                  .map((item) =>
                    typeof item === 'string' ? referenceFieldToPayload(item) : item,
                  )
                  .filter((item): item is NonNullable<typeof item> => item != null)
              : content.general_concept != null
                ? [
                    typeof content.general_concept === 'string'
                      ? referenceFieldToPayload(content.general_concept)
                      : content.general_concept,
                  ].filter((item): item is NonNullable<typeof item> => item != null)
                : []
          }
          onChange={(next) =>
            patchContent((c) => {
              if (next.length) c.general_concept = next
              else delete c.general_concept
            })
          }
          disabled={disabled}
        />
        <IconclassReferenceSelect
          id="rf-desc-content-class"
          label={t('recordForm.labels.classification')}
          infoKey="recordForm.info.description.contentClassification"
          value={
            Array.isArray(content.classification)
              ? content.classification.map((item) =>
                  typeof item === 'string' ? referenceFieldToPayload(item) : item,
                ).filter((item): item is NonNullable<typeof item> => item != null)
              : typeof content.classification === 'string'
                ? [referenceFieldToPayload(content.classification)].filter((item): item is NonNullable<typeof item> => item != null)
                : content.classification
                  ? [content.classification]
                  : []
          }
          onChange={(next) =>
            patchContent((c) => {
              if (next.length) c.classification = next
              else delete c.classification
            })
          }
          disabled={disabled}
        />
        <fieldset className="record-form-repeatable-fieldset">
          <legend>{t('recordForm.description.stylesLegend')}</legend>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() =>
              patchContent((c) => {
                c.style = [...(c.style ?? []), '']
              })
            }
            disabled={disabled}
          >
            {t('recordForm.description.addStyle')}
          </button>
          {contentStyles.map((st, stIdx) => (
            <CollapsibleRepeatableRow
              key={stIdx}
              id={`rf-desc-style-${stIdx}`}
              collapsed={contentStylesCol.isCollapsed(stIdx)}
              onToggleCollapse={() => contentStylesCol.toggle(stIdx)}
              onRemove={() =>
                patchContent((c) => {
                  const styles = (c.style ?? []).filter((_, j) => j !== stIdx)
                  c.style = styles.length ? styles : undefined
                })
              }
              disabled={disabled}
              saveItemNoun={t('recordForm.repeatable.saveItemLabels.contentStyle')}
              summary={
                (typeof st === 'string' ? st.trim() : referenceFieldFi(st)) || t('recordForm.description.styleEmpty')
              }
            >
              <GroupedMaoStyleSelect
                id={`rf-desc-style-${stIdx}`}
                label={t('recordForm.labels.styleLabelFi')}
                infoKey="recordForm.info.description.contentStyleMao"
                value={
                  typeof st === 'string' ? (st.trim() ? st : undefined) : st
                }
                onChange={(next) =>
                  patchContent((c) => {
                    const styles = [...(c.style ?? [])]
                    if (next == null) {
                      styles[stIdx] = ''
                    } else {
                      styles[stIdx] = next
                    }
                    c.style = styles.filter((s) =>
                      typeof s === 'string' ? s.trim() : referenceFieldFi(s),
                    )
                    if (!c.style?.length) delete c.style
                  })
                }
                disabled={disabled}
              />
            </CollapsibleRepeatableRow>
          ))}
        </fieldset>
      </fieldset>
    </div>
  )
}
