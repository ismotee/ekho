/**
 * Description domain form (docs/data/description-models.md — Description and nested types).
 */

import {
  AUDIO_FI,
  EMPTY_REFERENCE_FI,
  INSCRIPTION_METHOD_FI,
  INSCRIPTION_TYPE_FI,
  LANGUAGE_FI,
  MEASUREMENT_NAME_FI,
  MEASUREMENT_UNIT_FI,
  OBJECT_STATUS_FI,
  ORIENTATION_FI,
  PHOTO_FORMAT_FI,
} from '../../data/referenceVocabularies'
import {
  contentEventRowHasContent,
  contentStyleRowHasContent,
  descriptionEditorRetainsDomain,
  inscriptionRowHasContent,
  materialRowHasContent,
  measurementRowHasContent,
} from '../../lib/descriptionPayload'
import { actorFieldHasContent } from '../../lib/actorField'
import { referenceFieldFi, referenceFieldToPayload } from '../../lib/referenceField'
import type { RecordPayload } from '../../types/record'
import type { ActorField, Spatial } from '../../types/record/actor'
import type {
  Inscription,
  Interpretation,
  Material,
  MaterialComponent,
  Measurement,
  Translation,
} from '../../types/record/description'
import { useTranslation } from 'react-i18next'
import { ActorRefSelect } from './ActorRefSelect'
import { CollapsibleRepeatableRow } from './CollapsibleRepeatableRow'
import { FieldInfoText } from './FieldInfoText'
import { ReferenceSelect } from './ReferenceSelect'
import { TemporalFields } from './TemporalFields'
import { useRepeatableCollapsedRows } from './useRepeatableCollapsedRows'

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

function MeasurementRowEditor(props: {
  idPrefix: string
  row: Measurement
  index: number
  onPatch: (index: number, patch: Partial<Measurement>) => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const { idPrefix, row, index, onPatch, disabled } = props
  const parseOptionalNumber = (raw: string): number | undefined => {
    if (raw.trim() === '') return undefined
    const n = Number(raw)
    return Number.isFinite(n) ? n : undefined
  }
  const priceInputValue = (n: number | undefined) =>
    n != null && Number.isFinite(n) ? String(n) : ''

  return (
    <>
      <ReferenceSelect
        id={`${idPrefix}-name-${index}`}
        label={t('recordForm.labels.measurementName')}
        allowlist={MEASUREMENT_NAME_FI}
        valueFi={referenceFieldFi(row.unit)}
        onChangeFi={(fi) => onPatch(index, { unit: referenceFieldToPayload(fi) })}
        disabled={disabled}
        emptyLabel="—"
      />
      <div className="form-group">
        <label htmlFor={`${idPrefix}-val-${index}`}>{t('recordForm.labels.value')}</label>
        <input
          id={`${idPrefix}-val-${index}`}
          type="number"
          step="any"
          value={priceInputValue(row.value)}
          onChange={(e) => onPatch(index, { value: parseOptionalNumber(e.target.value) })}
          disabled={disabled}
        />
      </div>
      <ReferenceSelect
        id={`${idPrefix}-unit-${index}`}
        label={t('recordForm.labels.unit')}
        allowlist={MEASUREMENT_UNIT_FI}
        valueFi={referenceFieldFi(row.measurement_unit)}
        onChangeFi={(fi) => onPatch(index, { measurement_unit: referenceFieldToPayload(fi) })}
        disabled={disabled}
        emptyLabel="—"
      />
      <div className="form-group form-group--grow">
        <label htmlFor={`${idPrefix}-qual-${index}`}>{t('recordForm.labels.valueQualifier')}</label>
        <input
          id={`${idPrefix}-qual-${index}`}
          type="text"
          value={row.value_qualifier ?? ''}
          onChange={(e) => {
            const v = e.target.value
            onPatch(index, { value_qualifier: v.trim() ? v : undefined })
          }}
          disabled={disabled}
        />
      </div>
    </>
  )
}

export function DescriptionFields({ data, onChange, disabled }: DescriptionFieldsProps) {
  const { t } = useTranslation()
  const d = data.description ?? {}
  const phys = d.physical_description ?? {}
  const content = d.content ?? {}

  const materials = d.material ?? []
  const tech = d.technical_attribute ?? []
  const dims = d.dimension ?? []
  const inscriptions = d.inscription ?? []
  const contentEvents = content.event ?? []
  const contentStyles = content.style ?? []

  const materialsCol = useRepeatableCollapsedRows(materials, materialRowHasContent)
  const techCol = useRepeatableCollapsedRows(tech, measurementRowHasContent)
  const dimsCol = useRepeatableCollapsedRows(dims, measurementRowHasContent)
  const inscriptionsCol = useRepeatableCollapsedRows(inscriptions, inscriptionRowHasContent)
  const contentEventsCol = useRepeatableCollapsedRows(contentEvents, contentEventRowHasContent)
  const contentStylesCol = useRepeatableCollapsedRows(contentStyles, contentStyleRowHasContent)

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

  const setDims = (rows: Measurement[]) => {
    onChange(
      patchDescription(data, (desc) => {
        desc.dimension = rows.length ? rows : undefined
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
        <ReferenceSelect
          id="rf-desc-obj-comp"
          label={t('recordForm.labels.objectComponentName')}
          infoKey="recordForm.info.description.objectComponentName"
          allowlist={EMPTY_REFERENCE_FI}
          valueFi={referenceFieldFi(phys.object_component_name)}
          onChangeFi={(fi) => setPhysRef('object_component_name', fi)}
          disabled={disabled}
          emptyLabel="—"
        />
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
        <ReferenceSelect
          id="rf-desc-color"
          label={t('recordForm.labels.color')}
          infoKey="recordForm.info.description.color"
          allowlist={EMPTY_REFERENCE_FI}
          valueFi={referenceFieldFi(phys.color)}
          onChangeFi={(fi) => setPhysRef('color', fi)}
          disabled={disabled}
          emptyLabel="—"
        />
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
          allowlist={EMPTY_REFERENCE_FI}
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
        {materials.map((row, index) => {
          const comps = row.component ?? []
          return (
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
                row.source?.note?.trim() ||
                t('recordForm.description.materialEmpty')
              }
            >
              <ReferenceSelect
                id={`rf-desc-mat-type-${index}`}
                label={t('recordForm.labels.materialType')}
                allowlist={EMPTY_REFERENCE_FI}
                valueFi={referenceFieldFi(row.type)}
                onChangeFi={(fi) => patchMaterial(index, { type: referenceFieldToPayload(fi) })}
                disabled={disabled}
                emptyLabel="—"
              />
              <div className="form-group">
                <label htmlFor={`rf-desc-mat-name-${index}`}>{t('recordForm.labels.name')}</label>
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
                <input
                  id={`rf-desc-mat-src-name-${index}`}
                  type="text"
                  value={row.source?.name?.fi ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    const src: Spatial = { ...(row.source ?? {}), name: v.trim() ? { fi: v } : undefined }
                    if (!src.name?.fi?.trim() && !src.note?.trim()) patchMaterial(index, { source: undefined })
                    else patchMaterial(index, { source: src })
                  }}
                  disabled={disabled}
                />
              </div>
              <div className="form-group form-group--grow">
                <label htmlFor={`rf-desc-mat-src-note-${index}`}>{t('recordForm.labels.noteMaterialSource')}</label>
                <textarea
                  id={`rf-desc-mat-src-note-${index}`}
                  value={row.source?.note ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    const src: Spatial = { ...(row.source ?? {}), note: v.trim() ? v : undefined }
                    if (!src.name?.fi?.trim() && !src.note?.trim()) patchMaterial(index, { source: undefined })
                    else patchMaterial(index, { source: src })
                  }}
                  rows={2}
                  disabled={disabled}
                />
              </div>
              <fieldset className="record-form-repeatable-fieldset">
                <legend>{t('recordForm.description.componentsLegend')}</legend>
                {comps.map((comp, cIdx) => (
                  <div key={cIdx} className="record-form-repeatable-row record-form-repeatable-row--compact">
                    <ReferenceSelect
                      id={`rf-desc-mat-comp-type-${index}-${cIdx}`}
                      label={t('recordForm.labels.componentType')}
                      allowlist={EMPTY_REFERENCE_FI}
                      valueFi={referenceFieldFi(comp.type)}
                      onChangeFi={(fi) => {
                        const next = comps.map((x, j) =>
                          j === cIdx ? { ...x, type: referenceFieldToPayload(fi) } : x,
                        )
                        patchMaterialComponents(index, next)
                      }}
                      disabled={disabled}
                      emptyLabel="—"
                    />
                    <div className="form-group form-group--grow">
                      <label htmlFor={`rf-desc-mat-comp-note-${index}-${cIdx}`}>{t('recordForm.labels.noteMaterialComponent')}</label>
                      <textarea
                        id={`rf-desc-mat-comp-note-${index}-${cIdx}`}
                        value={comp.note ?? ''}
                        onChange={(e) => {
                          const v = e.target.value
                          const next = comps.map((x, j) =>
                            j === cIdx ? { ...x, note: v.trim() ? v : undefined } : x,
                          )
                          patchMaterialComponents(index, next)
                        }}
                        rows={2}
                        disabled={disabled}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm record-form-repeatable-remove"
                      onClick={() => patchMaterialComponents(index, comps.filter((_, j) => j !== cIdx))}
                      disabled={disabled}
                    >
                      {t('recordForm.labels.remove')}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => patchMaterialComponents(index, [...comps, {}])}
                  disabled={disabled}
                >
                  {t('recordForm.description.addComponent')}
                </button>
              </fieldset>
            </CollapsibleRepeatableRow>
          )
        })}
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMaterials([...materials, {}])} disabled={disabled}>
          {t('recordForm.description.materialsAdd')}
        </button>
      </fieldset>

      <fieldset className="record-form-repeatable-fieldset">
        <legend>{t('recordForm.labels.technicalAttributes')}</legend>
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
                row.value_qualifier?.trim(),
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
            />
          </CollapsibleRepeatableRow>
        ))}
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setTech([...tech, {}])} disabled={disabled}>
          {t('recordForm.description.technicalAdd')}
        </button>
      </fieldset>

      <fieldset className="record-form-repeatable-fieldset">
        <legend>{t('recordForm.labels.dimensions')}</legend>
        {dims.map((row, index) => (
          <CollapsibleRepeatableRow
            key={index}
            id={`rf-desc-dim-${index}`}
            collapsed={dimsCol.isCollapsed(index)}
            onToggleCollapse={() => dimsCol.toggle(index)}
            onRemove={() => setDims(dims.filter((_, j) => j !== index))}
            disabled={disabled}
            saveItemNoun={t('recordForm.repeatable.saveItemLabels.dimension')}
            summary={
              [
                referenceFieldFi(row.unit),
                row.value != null && Number.isFinite(row.value) ? String(row.value) : '',
                referenceFieldFi(row.measurement_unit),
                row.value_qualifier?.trim(),
              ]
                .filter(Boolean)
                .join(' · ') || t('recordForm.description.dimensionEmpty')
            }
          >
            <MeasurementRowEditor
              idPrefix="rf-desc-dim"
              row={row}
              index={index}
              onPatch={(i, patch) => setDims(dims.map((r, j) => (j === i ? { ...r, ...patch } : r)))}
              disabled={disabled}
            />
          </CollapsibleRepeatableRow>
        ))}
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDims([...dims, {}])} disabled={disabled}>
          {t('recordForm.description.dimensionsAdd')}
        </button>
      </fieldset>

      <fieldset className="record-form-repeatable-fieldset">
        <legend>{t('recordForm.labels.inscriptions')}</legend>
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
                <label htmlFor={`rf-desc-ins-pos-${index}`}>{t('recordForm.labels.position')}</label>
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
                <label htmlFor={`rf-desc-ins-desc-${index}`}>{t('recordForm.labels.description')}</label>
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
              <ReferenceSelect
                id={`rf-desc-ins-script-${index}`}
                label={t('recordForm.labels.script')}
                infoKey="recordForm.info.description.inscriptionScript"
                allowlist={EMPTY_REFERENCE_FI}
                valueFi={referenceFieldFi(row.script)}
                onChangeFi={(fi) => patchIns({ script: referenceFieldToPayload(fi) })}
                disabled={disabled}
                emptyLabel="—"
              />
              <ReferenceSelect
                id={`rf-desc-ins-lang-${index}`}
                label={t('recordForm.labels.language')}
                infoKey="recordForm.info.description.inscriptionLanguage"
                allowlist={LANGUAGE_FI}
                valueFi={referenceFieldFi(row.language)}
                onChangeFi={(fi) => patchIns({ language: referenceFieldToPayload(fi) })}
                disabled={disabled}
                emptyLabel="—"
              />
              <fieldset className="record-form-repeatable-fieldset">
                <legend>{t('recordForm.description.translationsLegend')}</legend>
                {translations.map((tr, trIdx) => (
                  <div key={trIdx} className="record-form-repeatable-row">
                    <div className="form-group form-group--grow">
                      <label htmlFor={`rf-desc-ins-tr-text-${index}-${trIdx}`}>{t('recordForm.labels.translationText')}</label>
                      <textarea
                        id={`rf-desc-ins-tr-text-${index}-${trIdx}`}
                        value={tr.text ?? ''}
                        onChange={(e) => {
                          const v = e.target.value
                          const next = translations.map((x, j) =>
                            j === trIdx ? { ...x, text: v.trim() ? v : undefined } : x,
                          )
                          setTranslations(next)
                        }}
                        rows={2}
                        disabled={disabled}
                      />
                    </div>
                    <ReferenceSelect
                      id={`rf-desc-ins-tr-lang-${index}-${trIdx}`}
                      label={t('recordForm.labels.language')}
                      allowlist={LANGUAGE_FI}
                      valueFi={referenceFieldFi(tr.language)}
                      onChangeFi={(fi) => {
                        const next = translations.map((x, j) =>
                          j === trIdx ? { ...x, language: referenceFieldToPayload(fi) } : x,
                        )
                        setTranslations(next)
                      }}
                      disabled={disabled}
                      emptyLabel="—"
                    />
                    <p className="record-form-repeatable-hint">{t('recordForm.description.translatorHint')}</p>
                    <div className="record-form-repeatable-row record-form-repeatable-row--compact">
                      <ActorRefSelect
                        id={`rf-desc-ins-tr-act-${index}-${trIdx}`}
                        label={t('recordForm.description.translatorLabel')}
                        value={tr.translator}
                        onChange={(next) => {
                          const v = actorSlotPatch(next)
                          const nextTr = translations.map((x, j) =>
                            j === trIdx ? { ...x, translator: v } : x,
                          )
                          setTranslations(nextTr)
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
                          setTranslations(nextTr)
                        }}
                        disabled={disabled}
                      >
                        {t('recordForm.description.clear')}
                      </button>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm record-form-repeatable-remove"
                      onClick={() => setTranslations(translations.filter((_, j) => j !== trIdx))}
                      disabled={disabled}
                    >
                      {t('recordForm.description.removeTranslation')}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setTranslations([...translations, {}])}
                  disabled={disabled}
                >
                  {t('recordForm.description.addTranslation')}
                </button>
              </fieldset>
              <div className="form-group form-group--grow">
                <label htmlFor={`rf-desc-ins-translit-${index}`}>{t('recordForm.description.transliteration')}</label>
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
                label={t('recordForm.labels.method')}
                infoKey="recordForm.info.description.inscriptionMethod"
                allowlist={INSCRIPTION_METHOD_FI}
                valueFi={referenceFieldFi(row.method)}
                onChangeFi={(fi) => patchIns({ method: referenceFieldToPayload(fi) })}
                disabled={disabled}
                emptyLabel="—"
              />
              <ReferenceSelect
                id={`rf-desc-ins-dir-${index}`}
                label={t('recordForm.labels.direction')}
                infoKey="recordForm.info.description.inscriptionDirection"
                allowlist={EMPTY_REFERENCE_FI}
                valueFi={referenceFieldFi(row.direction)}
                onChangeFi={(fi) => patchIns({ direction: referenceFieldToPayload(fi) })}
                disabled={disabled}
                emptyLabel="—"
              />
              <TemporalFields
                idPrefix={`rf-desc-ins-date-${index}`}
                legend={t('recordForm.description.inscriptionDateLegend')}
                infoPrefix="recordForm.info.description.inscriptionDate"
                value={row.date}
                onChange={(next) => patchIns({ date: next })}
                disabled={disabled}
              />
              <p className="record-form-repeatable-hint">{t('recordForm.description.inscriberHint')}</p>
              <div className="record-form-repeatable-row record-form-repeatable-row--compact">
                <ActorRefSelect
                  id={`rf-desc-ins-inscr-${index}`}
                  label={t('recordForm.description.inscriberLabel')}
                  value={row.inscriber}
                  onChange={(next) => patchIns({ inscriber: actorSlotPatch(next) })}
                  disabled={disabled}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm record-form-repeatable-remove"
                  onClick={() => patchIns({ inscriber: undefined })}
                  disabled={disabled}
                >
                  {t('recordForm.description.clear')}
                </button>
              </div>
              <fieldset className="record-form-repeatable-fieldset">
                <legend>{t('recordForm.description.interpretationsLegend')}</legend>
                {interp.map((ip, ipIdx) => (
                  <div key={ipIdx} className="record-form-repeatable-row">
                    <div className="form-group form-group--grow">
                      <label htmlFor={`rf-desc-ins-int-text-${index}-${ipIdx}`}>{t('recordForm.labels.interpretationText')}</label>
                      <textarea
                        id={`rf-desc-ins-int-text-${index}-${ipIdx}`}
                        value={ip.text ?? ''}
                        onChange={(e) => {
                          const v = e.target.value
                          const next = interp.map((x, j) =>
                            j === ipIdx ? { ...x, text: v.trim() ? v : undefined } : x,
                          )
                          setInterp(next)
                        }}
                        rows={2}
                        disabled={disabled}
                      />
                    </div>
                    <TemporalFields
                      idPrefix={`rf-desc-ins-int-date-${index}-${ipIdx}`}
                      legend={t('recordForm.description.interpretationDateLegend')}
                      value={ip.date}
                      onChange={(next) => {
                        const nextIp = interp.map((x, j) =>
                          j === ipIdx ? { ...x, date: next } : x,
                        )
                        setInterp(nextIp)
                      }}
                      disabled={disabled}
                    />
                    <div className="form-group form-group--grow">
                      <label htmlFor={`rf-desc-ins-int-photo-${index}-${ipIdx}`}>{t('recordForm.labels.photoUrl')}</label>
                      <input
                        id={`rf-desc-ins-int-photo-${index}-${ipIdx}`}
                        type="url"
                        value={typeof ip.photo === 'string' ? ip.photo : ''}
                        onChange={(e) => {
                          const v = e.target.value.trim()
                          const next = interp.map((x, j) =>
                            j === ipIdx ? { ...x, photo: v ? v : null } : x,
                          )
                          setInterp(next)
                        }}
                        disabled={disabled}
                      />
                    </div>
                    <p className="record-form-repeatable-hint">{t('recordForm.description.interpretatorHint')}</p>
                    <div className="record-form-repeatable-row record-form-repeatable-row--compact">
                      <ActorRefSelect
                        id={`rf-desc-ins-int-act-${index}-${ipIdx}`}
                        label={t('recordForm.description.interpretatorLabel')}
                        value={ip.interpretator}
                        onChange={(next) => {
                          const v = actorSlotPatch(next)
                          const nextIp = interp.map((x, j) => (j === ipIdx ? { ...x, interpretator: v } : x))
                          setInterp(nextIp)
                        }}
                        disabled={disabled}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm record-form-repeatable-remove"
                        onClick={() => {
                          const nextIp = interp.map((x, j) =>
                            j === ipIdx ? { ...x, interpretator: undefined } : x,
                          )
                          setInterp(nextIp)
                        }}
                        disabled={disabled}
                      >
                        {t('recordForm.description.clear')}
                      </button>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm record-form-repeatable-remove"
                      onClick={() => setInterp(interp.filter((_, j) => j !== ipIdx))}
                      disabled={disabled}
                    >
                      {t('recordForm.description.removeInterpretation')}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setInterp([...interp, {}])}
                  disabled={disabled}
                >
                  {t('recordForm.description.addInterpretation')}
                </button>
              </fieldset>
            </CollapsibleRepeatableRow>
          )
        })}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setInscriptions([...inscriptions, {}])}
          disabled={disabled}
        >
          {t('recordForm.description.inscriptionsAdd')}
        </button>
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
        <TemporalFields
          idPrefix="rf-desc-content-date"
          legend={t('recordForm.description.contentDateLegend')}
          infoPrefix="recordForm.info.description.contentDate"
          value={content.date}
          onChange={(next) =>
            patchContent((c) => {
              if (next) c.date = next
              else delete c.date
            })
          }
          disabled={disabled}
        />
        <div className="form-group form-group--grow">
          <label htmlFor="rf-desc-content-place-name">{t('recordForm.labels.placeFinnish')}</label>
          <input
            id="rf-desc-content-place-name"
            type="text"
            value={content.place?.name?.fi ?? ''}
            onChange={(e) => {
              const v = e.target.value
              patchContent((c) => {
                const place: Spatial = { ...(c.place ?? {}), name: v.trim() ? { fi: v } : undefined }
                if (!place.name?.fi?.trim() && !place.note?.trim()) delete c.place
                else c.place = place
              })
            }}
            disabled={disabled}
          />
        </div>
        <div className="form-group form-group--grow">
          <label htmlFor="rf-desc-content-place-note">{t('recordForm.labels.notePlaceContent')}</label>
          <textarea
            id="rf-desc-content-place-note"
            value={content.place?.note ?? ''}
            onChange={(e) => {
              const v = e.target.value
              patchContent((c) => {
                const place: Spatial = { ...(c.place ?? {}), note: v.trim() ? v : undefined }
                if (!place.name?.fi?.trim() && !place.note?.trim()) delete c.place
                else c.place = place
              })
            }}
            rows={2}
            disabled={disabled}
          />
        </div>
        <p className="record-form-repeatable-hint">{t('recordForm.description.contentPersonHint')}</p>
        <div className="record-form-repeatable-row record-form-repeatable-row--compact">
          <ActorRefSelect
            id="rf-desc-content-person"
            label={t('recordForm.labels.personActor')}
            value={content.person}
            onChange={(next) =>
              patchContent((c) => {
                const v = actorSlotPatch(next)
                if (v) c.person = v
                else delete c.person
              })
            }
            disabled={disabled}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm record-form-repeatable-remove"
            onClick={() =>
              patchContent((c) => {
                delete c.person
              })
            }
            disabled={disabled}
          >
            {t('recordForm.description.clear')}
          </button>
        </div>
        <ReferenceSelect
          id="rf-desc-content-activity"
          label={t('recordForm.labels.activity')}
          infoKey="recordForm.info.description.contentActivity"
          allowlist={EMPTY_REFERENCE_FI}
          valueFi={referenceFieldFi(content.activity)}
          onChangeFi={(fi) =>
            patchContent((c) => {
              const ref = referenceFieldToPayload(fi)
              if (ref) c.activity = ref
              else delete c.activity
            })
          }
          disabled={disabled}
          emptyLabel="—"
        />
        <ReferenceSelect
          id="rf-desc-content-position"
          label={t('recordForm.labels.position')}
          infoKey="recordForm.info.description.contentPosition"
          allowlist={EMPTY_REFERENCE_FI}
          valueFi={referenceFieldFi(content.position)}
          onChangeFi={(fi) =>
            patchContent((c) => {
              const ref = referenceFieldToPayload(fi)
              if (ref) c.position = ref
              else delete c.position
            })
          }
          disabled={disabled}
          emptyLabel="—"
        />
        <ReferenceSelect
          id="rf-desc-content-script"
          label={t('recordForm.labels.script')}
          infoKey="recordForm.info.description.contentScript"
          allowlist={EMPTY_REFERENCE_FI}
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
        <ReferenceSelect
          id="rf-desc-content-lang"
          label={t('recordForm.labels.language')}
          infoKey="recordForm.info.description.contentLanguage"
          allowlist={LANGUAGE_FI}
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
        <ReferenceSelect
          id="rf-desc-content-general-concept"
          label={t('recordForm.labels.generalConcept')}
          infoKey="recordForm.info.description.contentGeneralConcept"
          allowlist={EMPTY_REFERENCE_FI}
          valueFi={referenceFieldFi(content.general_concept)}
          onChangeFi={(fi) =>
            patchContent((c) => {
              const ref = referenceFieldToPayload(fi)
              if (ref) c.general_concept = ref
              else delete c.general_concept
            })
          }
          disabled={disabled}
          emptyLabel="—"
        />
        <ReferenceSelect
          id="rf-desc-content-class"
          label={t('recordForm.labels.classification')}
          infoKey="recordForm.info.description.contentClassification"
          allowlist={EMPTY_REFERENCE_FI}
          valueFi={referenceFieldFi(content.classification)}
          onChangeFi={(fi) =>
            patchContent((c) => {
              const ref = referenceFieldToPayload(fi)
              if (ref) c.classification = ref
              else delete c.classification
            })
          }
          disabled={disabled}
          emptyLabel="—"
        />
        <fieldset className="record-form-repeatable-fieldset">
          <legend>{t('recordForm.description.contentEventsLegend')}</legend>
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
                [referenceFieldFi(ev.name), referenceFieldFi(ev.type)].filter(Boolean).join(' · ') ||
                t('recordForm.description.eventEmpty')
              }
            >
              <ReferenceSelect
                id={`rf-desc-ce-name-${evIdx}`}
                label={t('recordForm.labels.eventName')}
                infoKey="recordForm.info.description.contentEventName"
                allowlist={EMPTY_REFERENCE_FI}
                valueFi={referenceFieldFi(ev.name)}
                onChangeFi={(fi) => {
                  const ref = referenceFieldToPayload(fi)
                  patchContent((c) => {
                    const events = [...(c.event ?? [])]
                    events[evIdx] = { ...events[evIdx], name: ref }
                    c.event = events.length ? events : undefined
                  })
                }}
                disabled={disabled}
                emptyLabel="—"
              />
              <ReferenceSelect
                id={`rf-desc-ce-type-${evIdx}`}
                label={t('recordForm.labels.eventType')}
                infoKey="recordForm.info.description.contentEventType"
                allowlist={EMPTY_REFERENCE_FI}
                valueFi={referenceFieldFi(ev.type)}
                onChangeFi={(fi) => {
                  const ref = referenceFieldToPayload(fi)
                  patchContent((c) => {
                    const events = [...(c.event ?? [])]
                    events[evIdx] = { ...events[evIdx], type: ref }
                    c.event = events.length ? events : undefined
                  })
                }}
                disabled={disabled}
                emptyLabel="—"
              />
            </CollapsibleRepeatableRow>
          ))}
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
            {t('recordForm.description.addEvent')}
          </button>
        </fieldset>
        <fieldset className="record-form-repeatable-fieldset">
          <legend>{t('recordForm.description.stylesLegend')}</legend>
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
              <div className="form-group form-group--grow">
                <label htmlFor={`rf-desc-style-${stIdx}`}>{t('recordForm.labels.styleLabelFi')}</label>
                <input
                  id={`rf-desc-style-${stIdx}`}
                  type="text"
                  value={typeof st === 'string' ? st : referenceFieldFi(st)}
                  onChange={(e) => {
                    const v = e.target.value.trim()
                    patchContent((c) => {
                      const styles = [...(c.style ?? [])]
                      styles[stIdx] = v ? v : ''
                      c.style = styles.filter((s) => (typeof s === 'string' ? s.trim() : referenceFieldFi(s)))
                      if (!c.style?.length) delete c.style
                    })
                  }}
                  disabled={disabled}
                />
              </div>
            </CollapsibleRepeatableRow>
          ))}
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
        </fieldset>
      </fieldset>
    </div>
  )
}
