/**
 * Domain section editors for RecordForm (draft RecordPayload slices).
 */

import {
  acquisitionDateRowHasContent,
  actorRowHasContent,
  spatialRowHasContent,
} from '../../lib/acquisitionPayload'
import {
  objectHistoryRowHasContent,
  objectProductInformationRowHasContent,
  ownershipRowHasContent,
  usageHistoryRowHasContent,
} from '../../lib/historyPayload'
import {
  ACCESS_CATEGORY_FI,
  ASSOCIATED_ACTIVITY_TYPE_FI,
  ASSOCIATED_CULTURAL_AFFINITY_FI,
  ASSOCIATED_EVENT_NAME_FI,
  ASSOCIATED_EVENT_NAME_TYPE_FI,
  AQCUISITION_METHOD_FI,
  DENOMINATION_FI,
  LANGUAGE_FI,
  LOCATION_FITNESS_FI,
  LOCATION_TYPE_FI,
  MUSEOLOGICAL_VALUE_FI,
  OBJECT_DISPLAY_STATUS_TYPE_FI,
  OBJECT_NAME_TYPE_FI,
  OBJECT_TYPE_FI,
  OWNERSHIP_EXCHANGE_METHOD_FI,
  RIGHTS_TYPE_FI,
  TECHNIQUE_FI,
  TECHNIQUE_TYPE_FI,
  TITLE_TYPE_FI,
  USAGE_FI,
} from '../../data/referenceVocabularies'
import { referenceFieldFi, referenceFieldToPayload, referenceSelectOptions } from '../../lib/referenceField'
import type { RecordPayload } from '../../types/record'
import type { Rights } from '../../types/record/rights'
import {
  identificationTitlesAsList,
  objectNameRowHasContent,
  titleRowHasContent,
} from '../../lib/identificationTitles'
import type { ObjectName, IdentificationDetails, Title } from '../../types/record/identification'
import type { Temporal } from '../../types/record/common'
import { TemporalFields } from './TemporalFields'
import type { ActorField, RoledActor, Spatial } from '../../types/record/actor'
import type {
  AssociatedEvent,
  ObjectHistory,
  ObjectProductInformation,
  Ownership,
  UsageHistory,
} from '../../types/record/history'
import { rightsHasPersistableContent } from '../../lib/rightsPayload'
import { temporalHasPersistableContent, temporalSummaryLine } from '../../lib/temporalPayload'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { objectLocationHasPersistableContent } from '../../lib/objectLocationPayload'
import { isActorSlotEmpty, recordActorSlotSummary } from './actorMiniForm'
import { ActorRefSelect } from './ActorRefSelect'
import { CollapsibleRepeatableRow } from './CollapsibleRepeatableRow'
import { FieldInfoText } from './FieldInfoText'
import { ReferenceSelect } from './ReferenceSelect'
import { useRepeatableCollapsedRows } from './useRepeatableCollapsedRows'

export { DescriptionFields } from './DescriptionFields'

export interface RecordFormSectionErrors {
  identification?: string
}

interface SectionProps {
  data: RecordPayload
  onChange: (next: RecordPayload) => void
  disabled: boolean
  errors: RecordFormSectionErrors
}

function patchIdentification(data: RecordPayload, fn: (id: IdentificationDetails) => void): RecordPayload {
  const id: IdentificationDetails = { ...(data.identification_details ?? {}) }
  fn(id)

  // Do not strip empty title / object_name rows here — that breaks "Add title" / "Add object name".
  // Empty placeholders are removed in compactRecordPayloadForSave before API submit.

  if (id.object_number !== undefined && !String(id.object_number).trim()) delete id.object_number
  if (!referenceFieldFi(id.object_type)) delete id.object_type

  const hasId = Object.keys(id).length > 0
  return { ...data, identification_details: hasId ? id : undefined }
}

export function IdentificationFields({ data, onChange, disabled, errors }: SectionProps) {
  const { t } = useTranslation()
  const id = data.identification_details ?? {}
  const objectNumber = id.object_number ?? ''
  const objectTypeFi = referenceFieldFi(id.object_type)
  const titles = identificationTitlesAsList(id.title)
  const names = id.object_name ?? []

  const titlesCol = useRepeatableCollapsedRows(titles, titleRowHasContent)
  const namesCol = useRepeatableCollapsedRows(names, objectNameRowHasContent)

  const setTitles = (rows: Title[]) => {
    onChange(
      patchIdentification(data, (d) => {
        d.title = rows.length ? rows : undefined
      })
    )
  }

  const addTitle = () => {
    setTitles([...titles, {}])
  }

  const updateTitle = (index: number, patch: Partial<Title>) => {
    const next = titles.map((row, i) => (i === index ? { ...row, ...patch } : row))
    setTitles(next)
  }

  const removeTitle = (index: number) => {
    setTitles(titles.filter((_, i) => i !== index))
  }

  const setNames = (rows: ObjectName[]) => {
    onChange(
      patchIdentification(data, (d) => {
        d.object_name = rows.length ? rows : undefined
      })
    )
  }

  const addObjectName = () => {
    setNames([...names, {}])
  }

  const updateObjectName = (index: number, patch: Partial<ObjectName>) => {
    const next = names.map((row, i) => (i === index ? { ...row, ...patch } : row))
    setNames(next)
  }

  const removeObjectName = (index: number) => {
    setNames(names.filter((_, i) => i !== index))
  }

  return (
    <div className="record-form-section-fields">
      <p className="record-form-section-hint">{t('recordForm.identification.hint')}</p>
      {errors.identification && (
        <p className="field-error record-form-section-error" role="alert">
          {errors.identification}
        </p>
      )}
      <div className="form-group">
        <label htmlFor="rf-object-number">{t('recordForm.labels.objectNumber')}</label>
        <FieldInfoText infoKey="recordForm.info.identification.objectNumber" />
        <input
          id="rf-object-number"
          type="text"
          value={objectNumber}
          onChange={(e) =>
            onChange(
              patchIdentification(data, (d) => {
                const v = e.target.value
                d.object_number = v.trim() ? v : undefined
              })
            )
          }
          maxLength={200}
          disabled={disabled}
          aria-invalid={!!errors.identification}
        />
      </div>
      <ReferenceSelect
        id="rf-object-type"
        label={t('recordForm.labels.objectType')}
        infoKey="recordForm.info.identification.objectType"
        allowlist={OBJECT_TYPE_FI}
        valueFi={objectTypeFi}
        onChangeFi={(fi) =>
          onChange(
            patchIdentification(data, (d) => {
              d.object_type = referenceFieldToPayload(fi)
            })
          )
        }
        disabled={disabled}
        emptyLabel="—"
      />
      <fieldset className="record-form-repeatable-fieldset">
        <legend>{t('recordForm.identification.titlesLegend')}</legend>
        <p className="record-form-repeatable-hint">{t('recordForm.identification.titlesHint')}</p>
        {titles.map((row, index) => (
          <CollapsibleRepeatableRow
            key={index}
            id={`rf-title-row-${index}`}
            collapsed={titlesCol.isCollapsed(index)}
            onToggleCollapse={() => titlesCol.toggle(index)}
            onRemove={() => removeTitle(index)}
            disabled={disabled}
            summary={
              row.value?.trim()
                ? row.value
                : [referenceFieldFi(row.type), referenceFieldFi(row.language)].filter(Boolean).join(' · ') ||
                  t('recordForm.identification.emptyTitle')
            }
          >
            <div className="form-group">
              <label htmlFor={`rf-title-value-${index}`}>{t('recordForm.labels.titleText')}</label>
              <FieldInfoText infoKey="recordForm.info.identification.titleText" />
              <input
                id={`rf-title-value-${index}`}
                type="text"
                value={row.value ?? ''}
                onChange={(e) => {
                  const v = e.target.value
                  updateTitle(index, { value: v.trim() ? v : undefined })
                }}
                maxLength={200}
                disabled={disabled}
                aria-invalid={!!errors.identification}
              />
            </div>
            <div className="form-group">
              <label htmlFor={`rf-title-note-${index}`}>{t('recordForm.labels.note')}</label>
              <FieldInfoText infoKey="recordForm.info.identification.titleNote" />
              <textarea
                id={`rf-title-note-${index}`}
                value={row.note ?? ''}
                onChange={(e) => {
                  const v = e.target.value
                  updateTitle(index, { note: v.trim() ? v : undefined })
                }}
                rows={2}
                disabled={disabled}
              />
            </div>
            <ReferenceSelect
              id={`rf-title-type-${index}`}
              label={t('recordForm.labels.titleType')}
              infoKey="recordForm.info.identification.titleType"
              allowlist={TITLE_TYPE_FI}
              valueFi={referenceFieldFi(row.type)}
              onChangeFi={(fi) => updateTitle(index, { type: referenceFieldToPayload(fi) })}
              disabled={disabled}
              emptyLabel="—"
            />
            <ReferenceSelect
              id={`rf-title-language-${index}`}
              label={t('recordForm.labels.titleLanguage')}
              infoKey="recordForm.info.identification.titleLanguage"
              allowlist={LANGUAGE_FI}
              valueFi={referenceFieldFi(row.language)}
              onChangeFi={(fi) => updateTitle(index, { language: referenceFieldToPayload(fi) })}
              disabled={disabled}
              emptyLabel="—"
            />
          </CollapsibleRepeatableRow>
        ))}
        <button type="button" className="btn btn-secondary btn-sm" onClick={addTitle} disabled={disabled}>
          {t('recordForm.identification.addTitle')}
        </button>
      </fieldset>

      <fieldset className="record-form-repeatable-fieldset">
        <legend>{t('recordForm.identification.objectNamesLegend')}</legend>
        <p className="record-form-repeatable-hint">{t('recordForm.identification.namesHint')}</p>
        {names.map((row, index) => (
          <CollapsibleRepeatableRow
            key={index}
            id={`rf-on-row-${index}`}
            collapsed={namesCol.isCollapsed(index)}
            onToggleCollapse={() => namesCol.toggle(index)}
            onRemove={() => removeObjectName(index)}
            disabled={disabled}
            summary={
              referenceFieldFi(row.value)?.trim()
                ? referenceFieldFi(row.value)
                : [referenceFieldFi(row.type), referenceFieldFi(row.language)].filter(Boolean).join(' · ') ||
                  t('recordForm.identification.emptyObjectName')
            }
          >
            <div className="form-group">
              <label htmlFor={`rf-on-value-${index}`}>{t('recordForm.labels.value')}</label>
              <input
                id={`rf-on-value-${index}`}
                type="text"
                value={referenceFieldFi(row.value)}
                onChange={(e) =>
                  updateObjectName(index, {
                    value: e.target.value.trim() ? e.target.value.trim() : undefined,
                  })
                }
                disabled={disabled}
              />
            </div>
            <div className="form-group">
              <label htmlFor={`rf-on-type-${index}`}>{t('recordForm.labels.type')}</label>
              <select
                id={`rf-on-type-${index}`}
                value={referenceFieldFi(row.type)}
                onChange={(e) =>
                  updateObjectName(index, { type: referenceFieldToPayload(e.target.value) })
                }
                disabled={disabled}
              >
                <option value="">—</option>
                {referenceSelectOptions(OBJECT_NAME_TYPE_FI, referenceFieldFi(row.type)).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor={`rf-on-lang-${index}`}>{t('recordForm.labels.language')}</label>
              <select
                id={`rf-on-lang-${index}`}
                value={referenceFieldFi(row.language)}
                onChange={(e) =>
                  updateObjectName(index, { language: referenceFieldToPayload(e.target.value) })
                }
                disabled={disabled}
              >
                <option value="">—</option>
                {referenceSelectOptions(LANGUAGE_FI, referenceFieldFi(row.language)).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </CollapsibleRepeatableRow>
        ))}
        <button type="button" className="btn btn-secondary btn-sm" onClick={addObjectName} disabled={disabled}>
          {t('recordForm.identification.addObjectName')}
        </button>
      </fieldset>
    </div>
  )
}

function patchAcquisition(data: RecordPayload, fn: (a: NonNullable<RecordPayload['aquisition_details']>) => void): RecordPayload {
  const a = { ...(data.aquisition_details ?? {}) }
  fn(a)
  // Keep date / place / actor placeholder rows while editing; compact before save.
  const empty =
    !a.reference_number?.trim() &&
    !a.reason?.trim() &&
    !a.note?.trim() &&
    !a.provisos?.trim() &&
    !(a.date && a.date.length) &&
    !referenceFieldFi(a.method) &&
    !a.transfer_of_title_number?.trim() &&
    a.group_purchase_price == null &&
    a.original_object_purchase_price == null &&
    !referenceFieldFi(a.group_purchase_price_denomination) &&
    !referenceFieldFi(a.original_object_purchase_price_denomination) &&
    !(a.place && a.place.length) &&
    !(a.actor && a.actor.length)
  return { ...data, aquisition_details: empty ? undefined : a }
}

export function AcquisitionFields({ data, onChange, disabled }: Omit<SectionProps, 'errors'>) {
  const { t } = useTranslation()
  const a = data.aquisition_details ?? {}
  const dates = a.date ?? []
  const places = a.place ?? []
  const actors = a.actor ?? []

  const datesCol = useRepeatableCollapsedRows(dates, acquisitionDateRowHasContent)
  const placesCol = useRepeatableCollapsedRows(places, spatialRowHasContent)
  const actorsCol = useRepeatableCollapsedRows(actors, actorRowHasContent)

  const setDates = (rows: Temporal[]) => {
    onChange(
      patchAcquisition(data, (d) => {
        d.date = rows.length ? rows : undefined
      })
    )
  }

  const setPlaces = (rows: Spatial[]) => {
    onChange(
      patchAcquisition(data, (d) => {
        d.place = rows.length ? rows : undefined
      })
    )
  }

  const setActors = (rows: ActorField[]) => {
    onChange(
      patchAcquisition(data, (d) => {
        d.actor = rows.length ? rows : undefined
      })
    )
  }

  const parseOptionalNumber = (raw: string): number | undefined => {
    if (raw.trim() === '') return undefined
    const n = Number(raw)
    return Number.isFinite(n) ? n : undefined
  }

  const priceInputValue = (n: number | undefined) =>
    n != null && Number.isFinite(n) ? String(n) : ''

  return (
    <div className="record-form-section-fields">
      <div className="form-group">
        <label htmlFor="rf-acq-ref">{t('recordForm.labels.referenceNumber')}</label>
        <FieldInfoText infoKey="recordForm.info.acquisition.referenceNumber" />
        <input
          id="rf-acq-ref"
          type="text"
          value={a.reference_number ?? ''}
          onChange={(e) =>
            onChange(
              patchAcquisition(data, (d) => {
                const v = e.target.value
                d.reference_number = v.trim() ? v : undefined
              })
            )
          }
          disabled={disabled}
        />
      </div>

      <fieldset className="record-form-repeatable-fieldset">
        <legend>{t('recordForm.acquisition.dateEntriesLegend')}</legend>
        <p className="record-form-repeatable-hint">{t('recordForm.acquisition.datesHint')}</p>
        {dates.map((row, index) => (
          <CollapsibleRepeatableRow
            key={index}
            id={`rf-acq-date-row-${index}`}
            collapsed={datesCol.isCollapsed(index)}
            onToggleCollapse={() => datesCol.toggle(index)}
            onRemove={() => setDates(dates.filter((_, i) => i !== index))}
            disabled={disabled}
            summary={temporalSummaryLine(row) || t('recordForm.acquisition.emptyDateEntry')}
          >
            <TemporalFields
              idPrefix={`rf-acq-date-${index}`}
              legend={t('recordForm.acquisition.dateEntryLegend', { n: index + 1 })}
              infoPrefix="recordForm.info.acquisition.date"
              value={row}
              onChange={(next) => {
                const nextRows = dates.map((d, i) => (i === index ? (next ?? {}) : d))
                setDates(nextRows)
              }}
              disabled={disabled}
            />
          </CollapsibleRepeatableRow>
        ))}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setDates([...dates, {}])}
          disabled={disabled}
        >
          {t('recordForm.acquisition.addDate')}
        </button>
      </fieldset>

      <ReferenceSelect
        id="rf-acq-method"
        label={t('recordForm.labels.method')}
        infoKey="recordForm.info.acquisition.method"
        allowlist={AQCUISITION_METHOD_FI}
        valueFi={referenceFieldFi(a.method)}
        onChangeFi={(fi) =>
          onChange(
            patchAcquisition(data, (d) => {
              d.method = referenceFieldToPayload(fi)
            })
          )
        }
        disabled={disabled}
        emptyLabel="—"
      />

      <div className="form-group">
        <label htmlFor="rf-acq-reason">{t('recordForm.labels.reason')}</label>
        <FieldInfoText infoKey="recordForm.info.acquisition.reason" />
        <textarea
          id="rf-acq-reason"
          value={a.reason ?? ''}
          onChange={(e) =>
            onChange(
              patchAcquisition(data, (d) => {
                const v = e.target.value
                d.reason = v.trim() ? v : undefined
              })
            )
          }
          rows={2}
          disabled={disabled}
        />
      </div>

      <fieldset className="record-form-repeatable-fieldset">
        <legend>{t('recordForm.acquisition.placesLegend')}</legend>
        <p className="record-form-repeatable-hint">{t('recordForm.acquisition.placesHint')}</p>
        {places.map((row, index) => (
          <CollapsibleRepeatableRow
            key={index}
            id={`rf-acq-place-row-${index}`}
            collapsed={placesCol.isCollapsed(index)}
            onToggleCollapse={() => placesCol.toggle(index)}
            onRemove={() => setPlaces(places.filter((_, i) => i !== index))}
            disabled={disabled}
            summary={
              row.name?.fi?.trim() ||
              row.note?.trim() ||
              t('recordForm.acquisition.emptyPlace')
            }
          >
            <div className="form-group form-group--grow">
              <label htmlFor={`rf-acq-place-name-${index}`}>{t('recordForm.labels.nameFinnish')}</label>
              <FieldInfoText infoKey="recordForm.info.acquisition.placeName" />
              <input
                id={`rf-acq-place-name-${index}`}
                type="text"
                value={row.name?.fi ?? ''}
                onChange={(e) => {
                  const v = e.target.value
                  const next = places.map((p, i) =>
                    i === index ? { ...p, name: v.trim() ? { fi: v } : undefined } : p,
                  )
                  setPlaces(next)
                }}
                disabled={disabled}
              />
            </div>
            <div className="form-group form-group--grow">
              <label htmlFor={`rf-acq-place-note-${index}`}>{t('recordForm.labels.note')}</label>
              <FieldInfoText infoKey="recordForm.info.acquisition.placeNote" />
              <textarea
                id={`rf-acq-place-note-${index}`}
                value={row.note ?? ''}
                onChange={(e) => {
                  const v = e.target.value
                  const next = places.map((p, i) =>
                    i === index ? { ...p, note: v.trim() ? v : undefined } : p,
                  )
                  setPlaces(next)
                }}
                rows={2}
                disabled={disabled}
              />
            </div>
          </CollapsibleRepeatableRow>
        ))}
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPlaces([...places, {}])} disabled={disabled}>
          {t('recordForm.acquisition.addPlace')}
        </button>
      </fieldset>

      <fieldset className="record-form-repeatable-fieldset">
        <legend>{t('recordForm.acquisition.actorsLegend')}</legend>
        <p className="record-form-repeatable-hint">{t('recordForm.acquisition.actorsHint')}</p>
        {actors.map((actor, index) => (
          <CollapsibleRepeatableRow
            key={index}
            id={`rf-acq-actor-row-${index}`}
            collapsed={actorsCol.isCollapsed(index)}
            onToggleCollapse={() => actorsCol.toggle(index)}
            onRemove={() => setActors(actors.filter((_, i) => i !== index))}
            disabled={disabled}
            summary={recordActorSlotSummary(actor)}
          >
            <ActorRefSelect
              id={`rf-acq-actor-ref-${index}`}
              label={t('recordForm.labels.actor')}
              value={actor}
              onChange={(next) => setActors(actors.map((act, i) => (i === index ? (next ?? {}) : act)))}
              disabled={disabled}
            />
          </CollapsibleRepeatableRow>
        ))}
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActors([...actors, {}])} disabled={disabled}>
          {t('recordForm.acquisition.addActor')}
        </button>
      </fieldset>

      <div className="form-group">
        <label htmlFor="rf-acq-provisos">{t('recordForm.labels.provisos')}</label>
        <FieldInfoText infoKey="recordForm.info.acquisition.provisos" />
        <textarea
          id="rf-acq-provisos"
          value={a.provisos ?? ''}
          onChange={(e) =>
            onChange(
              patchAcquisition(data, (d) => {
                const v = e.target.value
                d.provisos = v.trim() ? v : undefined
              })
            )
          }
          rows={2}
          disabled={disabled}
        />
      </div>
      <div className="form-group">
        <label htmlFor="rf-acq-note">{t('recordForm.labels.note')}</label>
        <FieldInfoText infoKey="recordForm.info.acquisition.note" />
        <textarea
          id="rf-acq-note"
          value={a.note ?? ''}
          onChange={(e) =>
            onChange(
              patchAcquisition(data, (d) => {
                const v = e.target.value
                d.note = v.trim() ? v : undefined
              })
            )
          }
          rows={2}
          disabled={disabled}
        />
      </div>

      <div className="form-group">
        <label htmlFor="rf-acq-group-price">{t('recordForm.labels.groupPurchasePrice')}</label>
        <FieldInfoText infoKey="recordForm.info.acquisition.groupPurchasePrice" />
        <input
          id="rf-acq-group-price"
          type="number"
          step="any"
          value={priceInputValue(a.group_purchase_price)}
          onChange={(e) =>
            onChange(
              patchAcquisition(data, (d) => {
                d.group_purchase_price = parseOptionalNumber(e.target.value)
              })
            )
          }
          disabled={disabled}
        />
      </div>
      <ReferenceSelect
        id="rf-acq-group-denom"
        label={t('recordForm.labels.groupPurchaseDenomination')}
        infoKey="recordForm.info.acquisition.groupPurchaseDenomination"
        allowlist={DENOMINATION_FI}
        valueFi={referenceFieldFi(a.group_purchase_price_denomination)}
        onChangeFi={(fi) =>
          onChange(
            patchAcquisition(data, (d) => {
              d.group_purchase_price_denomination = referenceFieldToPayload(fi)
            })
          )
        }
        disabled={disabled}
        emptyLabel="—"
      />

      <div className="form-group">
        <label htmlFor="rf-acq-orig-price">{t('recordForm.labels.originalPurchasePrice')}</label>
        <FieldInfoText infoKey="recordForm.info.acquisition.originalPurchasePrice" />
        <input
          id="rf-acq-orig-price"
          type="number"
          step="any"
          value={priceInputValue(a.original_object_purchase_price)}
          onChange={(e) =>
            onChange(
              patchAcquisition(data, (d) => {
                d.original_object_purchase_price = parseOptionalNumber(e.target.value)
              })
            )
          }
          disabled={disabled}
        />
      </div>
      <ReferenceSelect
        id="rf-acq-orig-denom"
        label={t('recordForm.labels.originalPriceDenomination')}
        infoKey="recordForm.info.acquisition.originalPriceDenomination"
        allowlist={DENOMINATION_FI}
        valueFi={referenceFieldFi(a.original_object_purchase_price_denomination)}
        onChangeFi={(fi) =>
          onChange(
            patchAcquisition(data, (d) => {
              d.original_object_purchase_price_denomination = referenceFieldToPayload(fi)
            })
          )
        }
        disabled={disabled}
        emptyLabel="—"
      />

      <div className="form-group">
        <label htmlFor="rf-acq-transfer">{t('recordForm.labels.transferOfTitle')}</label>
        <FieldInfoText infoKey="recordForm.info.acquisition.transferOfTitle" />
        <input
          id="rf-acq-transfer"
          type="text"
          value={a.transfer_of_title_number ?? ''}
          onChange={(e) =>
            onChange(
              patchAcquisition(data, (d) => {
                const v = e.target.value
                d.transfer_of_title_number = v.trim() ? v : undefined
              })
            )
          }
          disabled={disabled}
        />
      </div>
    </div>
  )
}

function patchHistory(data: RecordPayload, fn: (h: NonNullable<RecordPayload['history']>) => void): RecordPayload {
  const h = { ...(data.history ?? {}) }
  fn(h)
  const empty =
    !(h.owner_history && h.owner_history.length) &&
    !(h.object_production_information && h.object_production_information.length) &&
    !(h.usage_history && h.usage_history.length) &&
    !(h.object_history && h.object_history.length)
  return { ...data, history: empty ? undefined : h }
}

export function HistoryFields({ data, onChange, disabled }: Omit<SectionProps, 'errors'>) {
  const { t } = useTranslation()
  const h = data.history ?? {}
  const owners = h.owner_history ?? []
  const production = h.object_production_information ?? []
  const usage = h.usage_history ?? []
  const objectHist = h.object_history ?? []

  const ownerCol = useRepeatableCollapsedRows(owners, ownershipRowHasContent)
  const productionCol = useRepeatableCollapsedRows(production, objectProductInformationRowHasContent)
  const usageCol = useRepeatableCollapsedRows(usage, usageHistoryRowHasContent)
  const objectHistCol = useRepeatableCollapsedRows(objectHist, objectHistoryRowHasContent)

  const parseOptionalNumber = (raw: string): number | undefined => {
    if (raw.trim() === '') return undefined
    const n = Number(raw)
    return Number.isFinite(n) ? n : undefined
  }

  const priceInputValue = (n: number | undefined) =>
    n != null && Number.isFinite(n) ? String(n) : ''

  const setOwners = (rows: Ownership[]) => {
    onChange(
      patchHistory(data, (hist) => {
        hist.owner_history = rows.length ? rows : undefined
      }),
    )
  }

  const setProduction = (rows: ObjectProductInformation[]) => {
    onChange(
      patchHistory(data, (hist) => {
        hist.object_production_information = rows.length ? rows : undefined
      }),
    )
  }

  const setUsage = (rows: UsageHistory[]) => {
    onChange(
      patchHistory(data, (hist) => {
        hist.usage_history = rows.length ? rows : undefined
      }),
    )
  }

  const setObjectHist = (rows: ObjectHistory[]) => {
    onChange(
      patchHistory(data, (hist) => {
        hist.object_history = rows.length ? rows : undefined
      }),
    )
  }

  const renderRoledActorRows = (
    rows: RoledActor[],
    setRows: (r: RoledActor[]) => void,
    idPrefix: string,
  ) => (
    <>
      {rows.map((row, index) => {
        const act = row.actor
        return (
          <div key={index} className="record-form-repeatable-row record-form-repeatable-row--compact">
            <ActorRefSelect
              id={`${idPrefix}-ref-${index}`}
              label={t('recordForm.labels.actor')}
              value={act}
              onChange={(next) =>
                setRows(rows.map((r, i) => (i === index ? { ...r, actor: next ?? {} } : r)))
              }
              disabled={disabled}
            />
            <div className="form-group form-group--grow">
              <label htmlFor={`${idPrefix}-assoc-${index}`}>{t('recordForm.labels.roleAssociation')}</label>
              <input
                id={`${idPrefix}-assoc-${index}`}
                type="text"
                value={referenceFieldFi(row.association)}
                onChange={(e) => {
                  const v = e.target.value
                  setRows(
                    rows.map((r, i) =>
                      i === index ? { ...r, association: v.trim() ? v : undefined } : r,
                    ),
                  )
                }}
                disabled={disabled}
              />
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm record-form-repeatable-remove"
              onClick={() => setRows(rows.filter((_, i) => i !== index))}
              disabled={disabled}
            >
              {t('recordForm.labels.remove')}
            </button>
          </div>
        )
      })}
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => setRows([...rows, {}])}
        disabled={disabled}
      >
        {t('recordForm.history.addActor')}
      </button>
    </>
  )

  return (
    <div className="record-form-section-fields">
      <fieldset className="record-form-repeatable-fieldset">
        <legend>{t('recordForm.history.ownerHistoryLegend')}</legend>
        <p className="record-form-repeatable-hint">{t('recordForm.history.ownerHistoryHint')}</p>
        {owners.map((row, index) => {
          const owner = row.owner
          const place = row.place ?? {}
          const ex = row.exchange ?? {}
          const ownerSummary = recordActorSlotSummary(owner)
          return (
            <CollapsibleRepeatableRow
              key={index}
              id={`rf-oh-row-${index}`}
              collapsed={ownerCol.isCollapsed(index)}
              onToggleCollapse={() => ownerCol.toggle(index)}
              onRemove={() => setOwners(owners.filter((_, i) => i !== index))}
              disabled={disabled}
              summary={
                !isActorSlotEmpty(owner)
                  ? ownerSummary
                  : temporalSummaryLine(row.date)
                    ? temporalSummaryLine(row.date)
                    : place.name?.fi?.trim() || place.note?.trim() || t('recordForm.history.emptyOwnerEntry')
              }
            >
              <ActorRefSelect
                id={`rf-oh-owner-ref-${index}`}
                label={t('recordForm.labels.ownerActor')}
                value={owner}
                onChange={(next) =>
                  setOwners(owners.map((o, i) => (i === index ? { ...o, owner: next ?? {} } : o)))
                }
                disabled={disabled}
              />
              <TemporalFields
                idPrefix={`rf-oh-date-${index}`}
                legend={t('recordForm.history.ownershipDateLegend')}
                infoPrefix="recordForm.info.history.ownershipDate"
                value={row.date}
                onChange={(next) =>
                  setOwners(owners.map((o, i) => (i === index ? { ...o, date: next } : o)))
                }
                disabled={disabled}
              />
              <div className="form-group form-group--grow">
                <label htmlFor={`rf-oh-place-name-${index}`}>{t('recordForm.labels.placeNameFinnish')}</label>
                <FieldInfoText infoKey="recordForm.info.history.ownershipPlace" />
                <input
                  id={`rf-oh-place-name-${index}`}
                  type="text"
                  value={place.name?.fi ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    setOwners(
                      owners.map((o, i) =>
                        i === index
                          ? {
                              ...o,
                              place: {
                                ...o.place,
                                name: v.trim() ? { fi: v } : undefined,
                              },
                            }
                          : o,
                      ),
                    )
                  }}
                  disabled={disabled}
                />
              </div>
              <div className="form-group form-group--grow">
                <label htmlFor={`rf-oh-place-note-${index}`}>{t('recordForm.labels.placeNote')}</label>
                <FieldInfoText infoKey="recordForm.info.history.ownershipPlaceNote" />
                <textarea
                  id={`rf-oh-place-note-${index}`}
                  value={place.note ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    setOwners(
                      owners.map((o, i) =>
                        i === index
                          ? {
                              ...o,
                              place: {
                                ...o.place,
                                note: v.trim() ? v : undefined,
                              },
                            }
                          : o,
                      ),
                    )
                  }}
                  rows={2}
                  disabled={disabled}
                />
              </div>
              <ReferenceSelect
                id={`rf-oh-ex-method-${index}`}
                label={t('recordForm.labels.exchangeMethod')}
                infoKey="recordForm.info.history.exchangeMethod"
                allowlist={OWNERSHIP_EXCHANGE_METHOD_FI}
                valueFi={referenceFieldFi(ex.method)}
                onChangeFi={(fi) =>
                  setOwners(
                    owners.map((o, i) =>
                      i === index
                        ? {
                            ...o,
                            exchange: { ...o.exchange, method: referenceFieldToPayload(fi) },
                          }
                        : o,
                    ),
                  )
                }
                disabled={disabled}
                emptyLabel="—"
              />
              <div className="form-group">
                <label htmlFor={`rf-oh-ex-price-${index}`}>{t('recordForm.labels.exchangePrice')}</label>
                <FieldInfoText infoKey="recordForm.info.history.exchangePrice" />
                <input
                  id={`rf-oh-ex-price-${index}`}
                  type="number"
                  step="any"
                  value={priceInputValue(ex.price)}
                  onChange={(e) =>
                    setOwners(
                      owners.map((o, i) =>
                        i === index
                          ? {
                              ...o,
                              exchange: { ...o.exchange, price: parseOptionalNumber(e.target.value) },
                            }
                          : o,
                      ),
                    )
                  }
                  disabled={disabled}
                />
              </div>
              <ReferenceSelect
                id={`rf-oh-ex-denom-${index}`}
                label={t('recordForm.labels.priceDenomination')}
                infoKey="recordForm.info.history.exchangeDenomination"
                allowlist={DENOMINATION_FI}
                valueFi={referenceFieldFi(ex.denomination)}
                onChangeFi={(fi) =>
                  setOwners(
                    owners.map((o, i) =>
                      i === index
                        ? {
                            ...o,
                            exchange: { ...o.exchange, denomination: referenceFieldToPayload(fi) },
                          }
                        : o,
                    ),
                  )
                }
                disabled={disabled}
                emptyLabel="—"
              />
              <div className="form-group form-group--grow">
                <label htmlFor={`rf-oh-ex-note-${index}`}>{t('recordForm.labels.exchangeNote')}</label>
                <FieldInfoText infoKey="recordForm.info.history.exchangeNote" />
                <textarea
                  id={`rf-oh-ex-note-${index}`}
                  value={ex.note ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    setOwners(
                      owners.map((o, i) =>
                        i === index
                          ? {
                              ...o,
                              exchange: { ...o.exchange, note: v.trim() ? v : undefined },
                            }
                          : o,
                      ),
                    )
                  }}
                  rows={2}
                  disabled={disabled}
                />
              </div>
            </CollapsibleRepeatableRow>
          )
        })}
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOwners([...owners, {}])} disabled={disabled}>
          {t('recordForm.history.addOwnerEntry')}
        </button>
      </fieldset>

      <fieldset className="record-form-repeatable-fieldset">
        <legend>{t('recordForm.history.productionLegend')}</legend>
        <p className="record-form-repeatable-hint">{t('recordForm.history.productionHint')}</p>
        {production.map((row, pIndex) => {
          const actors = row.actor ?? []
          const place = row.place ?? {}
          const techTypes = row.technique_type ?? []
          const firstActorSummary = actors[0] ? recordActorSlotSummary(actors[0].actor) : ''
          return (
            <CollapsibleRepeatableRow
              key={pIndex}
              id={`rf-opi-row-${pIndex}`}
              collapsed={productionCol.isCollapsed(pIndex)}
              onToggleCollapse={() => productionCol.toggle(pIndex)}
              onRemove={() => setProduction(production.filter((_, i) => i !== pIndex))}
              disabled={disabled}
              summary={
                actors[0] && !isActorSlotEmpty(actors[0].actor)
                  ? firstActorSummary
                  : referenceFieldFi(row.technique).trim()
                    ? referenceFieldFi(row.technique)
                    : temporalSummaryLine(row.date)
                      ? temporalSummaryLine(row.date)
                      : place.name?.fi?.trim() || row.note?.trim() || t('recordForm.history.emptyProductionEntry')
              }
              removeLabel={t('recordForm.history.removeProductionEntry')}
            >
              <fieldset className="record-form-nested-fieldset">
                <legend>{t('recordForm.history.actorsWithRoleLegend')}</legend>
                {renderRoledActorRows(actors, (next) => {
                  setProduction(production.map((r, i) => (i === pIndex ? { ...r, actor: next.length ? next : undefined } : r)))
                }, `rf-opi-act-${pIndex}`)}
              </fieldset>
              <TemporalFields
                idPrefix={`rf-opi-date-${pIndex}`}
                legend={t('recordForm.history.productionDateLegend')}
                infoPrefix="recordForm.info.history.productionDate"
                value={row.date}
                onChange={(next) =>
                  setProduction(production.map((r, i) => (i === pIndex ? { ...r, date: next } : r)))
                }
                disabled={disabled}
              />
              <div className="form-group form-group--grow">
                <label htmlFor={`rf-opi-place-name-${pIndex}`}>{t('recordForm.labels.placeNameFinnish')}</label>
                <FieldInfoText infoKey="recordForm.info.history.productionPlace" />
                <input
                  id={`rf-opi-place-name-${pIndex}`}
                  type="text"
                  value={place.name?.fi ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    setProduction(
                      production.map((r, i) =>
                        i === pIndex
                          ? {
                              ...r,
                              place: {
                                ...r.place,
                                name: v.trim() ? { fi: v } : undefined,
                              },
                            }
                          : r,
                      ),
                    )
                  }}
                  disabled={disabled}
                />
              </div>
              <div className="form-group form-group--grow">
                <label htmlFor={`rf-opi-place-note-${pIndex}`}>{t('recordForm.labels.placeNote')}</label>
                <FieldInfoText infoKey="recordForm.info.history.productionPlaceNote" />
                <textarea
                  id={`rf-opi-place-note-${pIndex}`}
                  value={place.note ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    setProduction(
                      production.map((r, i) =>
                        i === pIndex
                          ? {
                              ...r,
                              place: {
                                ...r.place,
                                note: v.trim() ? v : undefined,
                              },
                            }
                          : r,
                      ),
                    )
                  }}
                  rows={2}
                  disabled={disabled}
                />
              </div>
              <div className="form-group form-group--grow">
                <label htmlFor={`rf-opi-reason-${pIndex}`}>{t('recordForm.labels.reason')}</label>
                <FieldInfoText infoKey="recordForm.info.history.productionReason" />
                <input
                  id={`rf-opi-reason-${pIndex}`}
                  type="text"
                  value={row.reason ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    setProduction(
                      production.map((r, i) =>
                        i === pIndex ? { ...r, reason: v.trim() ? v : undefined } : r,
                      ),
                    )
                  }}
                  disabled={disabled}
                />
              </div>
              <div className="form-group form-group--grow">
                <label htmlFor={`rf-opi-note-${pIndex}`}>{t('recordForm.labels.note')}</label>
                <FieldInfoText infoKey="recordForm.info.history.productionNote" />
                <textarea
                  id={`rf-opi-note-${pIndex}`}
                  value={row.note ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    setProduction(
                      production.map((r, i) =>
                        i === pIndex ? { ...r, note: v.trim() ? v : undefined } : r,
                      ),
                    )
                  }}
                  rows={2}
                  disabled={disabled}
                />
              </div>
              <ReferenceSelect
                id={`rf-opi-tech-${pIndex}`}
                label={t('recordForm.labels.technique')}
                infoKey="recordForm.info.history.technique"
                allowlist={TECHNIQUE_FI}
                valueFi={referenceFieldFi(row.technique)}
                onChangeFi={(fi) =>
                  setProduction(
                    production.map((r, i) =>
                      i === pIndex ? { ...r, technique: referenceFieldToPayload(fi) } : r,
                    ),
                  )
                }
                disabled={disabled}
                emptyLabel="—"
              />
              <fieldset className="record-form-nested-fieldset">
                <legend>{t('recordForm.history.techniqueTypesLegend')}</legend>
                {techTypes.map((tt, ttIndex) => (
                  <div key={ttIndex} className="record-form-repeatable-row record-form-repeatable-row--compact">
                    <ReferenceSelect
                      id={`rf-opi-tt-${pIndex}-${ttIndex}`}
                      label={t('recordForm.labels.type')}
                      allowlist={TECHNIQUE_TYPE_FI}
                      valueFi={referenceFieldFi(tt)}
                      onChangeFi={(fi) => {
                        const next = techTypes.map((typeItem, j) =>
                          j === ttIndex ? referenceFieldToPayload(fi) ?? '' : typeItem,
                        )
                        setProduction(
                          production.map((r, i) =>
                            i === pIndex ? { ...r, technique_type: next.length ? next : undefined } : r,
                          ),
                        )
                      }}
                      disabled={disabled}
                      emptyLabel="—"
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm record-form-repeatable-remove"
                      onClick={() => {
                        const next = techTypes.filter((_, j) => j !== ttIndex)
                        setProduction(
                          production.map((r, i) =>
                            i === pIndex ? { ...r, technique_type: next.length ? next : undefined } : r,
                          ),
                        )
                      }}
                      disabled={disabled}
                    >
                      {t('recordForm.labels.remove')}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() =>
                    setProduction(
                      production.map((r, i) =>
                        i === pIndex ? { ...r, technique_type: [...techTypes, ''] } : r,
                      ),
                    )
                  }
                  disabled={disabled}
                >
                  {t('recordForm.history.addTechniqueType')}
                </button>
              </fieldset>
            </CollapsibleRepeatableRow>
          )
        })}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setProduction([...production, {}])}
          disabled={disabled}
        >
          {t('recordForm.history.addProductionEntry')}
        </button>
      </fieldset>

      <fieldset className="record-form-repeatable-fieldset">
        <legend>{t('recordForm.history.usageHistoryLegend')}</legend>
        {usage.map((row, index) => {
          const usageLine = referenceFieldFi(row.usage)
          const noteSnip = row.note?.trim()
          const instrSnip = row.usage_instructions?.trim()
          const summary =
            usageLine.trim() ||
            (noteSnip ? (noteSnip.length > 80 ? `${noteSnip.slice(0, 80)}…` : noteSnip) : '') ||
            (instrSnip ? (instrSnip.length > 80 ? `${instrSnip.slice(0, 80)}…` : instrSnip) : '') ||
            t('recordForm.history.emptyUsageEntry')
          return (
            <CollapsibleRepeatableRow
              key={index}
              id={`rf-uh-row-${index}`}
              collapsed={usageCol.isCollapsed(index)}
              onToggleCollapse={() => usageCol.toggle(index)}
              onRemove={() => setUsage(usage.filter((_, i) => i !== index))}
              disabled={disabled}
              summary={summary}
            >
              <ReferenceSelect
                id={`rf-uh-usage-${index}`}
                label={t('recordForm.labels.usage')}
                allowlist={USAGE_FI}
                valueFi={referenceFieldFi(row.usage)}
                onChangeFi={(fi) => {
                  const next = usage.map((u, i) =>
                    i === index ? { ...u, usage: referenceFieldToPayload(fi) } : u,
                  )
                  setUsage(next)
                }}
                disabled={disabled}
                emptyLabel="—"
              />
              <div className="form-group">
                <label htmlFor={`rf-uh-note-${index}`}>{t('recordForm.labels.note')}</label>
                <textarea
                  id={`rf-uh-note-${index}`}
                  value={row.note ?? ''}
                  onChange={(e) => {
                    const next = usage.map((u, i) =>
                      i === index ? { ...u, note: e.target.value || undefined } : u,
                    )
                    setUsage(next)
                  }}
                  rows={2}
                  disabled={disabled}
                />
              </div>
              <div className="form-group">
                <label htmlFor={`rf-uh-instructions-${index}`}>{t('recordForm.labels.usageInstructions')}</label>
                <textarea
                  id={`rf-uh-instructions-${index}`}
                  value={row.usage_instructions ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    const next = usage.map((u, i) =>
                      i === index ? { ...u, usage_instructions: v.trim() ? v : undefined } : u,
                    )
                    setUsage(next)
                  }}
                  rows={2}
                  disabled={disabled}
                />
              </div>
            </CollapsibleRepeatableRow>
          )
        })}
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setUsage([...usage, {}])} disabled={disabled}>
          {t('recordForm.history.addUsageEntry')}
        </button>
      </fieldset>

      <fieldset className="record-form-repeatable-fieldset">
        <legend>{t('recordForm.history.objectHistoryLegend')}</legend>
        <p className="record-form-repeatable-hint">{t('recordForm.history.objectHistoryHint')}</p>
        {objectHist.map((row, index) => {
          const act = row.activity ?? {}
          const ev: AssociatedEvent = row.event ?? {}
          const evActors = ev.actor ?? []
          const evDates = ev.date ?? []
          const evPlaces = ev.place ?? []
          const rowActors = row.actor ?? []
          const rowDates = row.date ?? []
          const rowPlaces = row.place ?? []
          const actTypeFi = referenceFieldFi(act.type)
          const cultFi = referenceFieldFi(row.cultural_affinity)
          const noteSnip = row.note?.trim()
          const summary =
            actTypeFi.trim() ||
            cultFi.trim() ||
            (noteSnip ? (noteSnip.length > 60 ? `${noteSnip.slice(0, 60)}…` : noteSnip) : '') ||
            t('recordForm.history.emptyObjectHistoryEntry')
          return (
            <CollapsibleRepeatableRow
              key={index}
              id={`rf-objh-row-${index}`}
              collapsed={objectHistCol.isCollapsed(index)}
              onToggleCollapse={() => objectHistCol.toggle(index)}
              onRemove={() => setObjectHist(objectHist.filter((_, i) => i !== index))}
              disabled={disabled}
              summary={summary}
            >
              <fieldset className="record-form-nested-fieldset">
                <legend>{t('recordForm.history.associatedActivityLegend')}</legend>
                <ReferenceSelect
                  id={`rf-objh-act-type-${index}`}
                  label={t('recordForm.labels.activityType')}
                  allowlist={ASSOCIATED_ACTIVITY_TYPE_FI}
                  valueFi={referenceFieldFi(act.type)}
                  onChangeFi={(fi) => {
                    setObjectHist(
                      objectHist.map((r, i) =>
                        i === index
                          ? {
                              ...r,
                              activity: {
                                ...r.activity,
                                type: referenceFieldToPayload(fi),
                                note: r.activity?.note,
                              },
                            }
                          : r,
                      ),
                    )
                  }}
                  disabled={disabled}
                  emptyLabel="—"
                />
                <div className="form-group form-group--grow">
                  <label htmlFor={`rf-objh-act-note-${index}`}>{t('recordForm.labels.activityNote')}</label>
                  <textarea
                    id={`rf-objh-act-note-${index}`}
                    value={act.note ?? ''}
                    onChange={(e) => {
                      const v = e.target.value
                      setObjectHist(
                        objectHist.map((r, i) =>
                          i === index
                            ? {
                                ...r,
                                activity: {
                                  ...r.activity,
                                  type: r.activity?.type,
                                  note: v.trim() ? v : undefined,
                                },
                              }
                            : r,
                        ),
                      )
                    }}
                    rows={2}
                    disabled={disabled}
                  />
                </div>
              </fieldset>
              <ReferenceSelect
                id={`rf-objh-cult-${index}`}
                label={t('recordForm.labels.culturalAffinity')}
                allowlist={ASSOCIATED_CULTURAL_AFFINITY_FI}
                valueFi={referenceFieldFi(row.cultural_affinity)}
                onChangeFi={(fi) => {
                  setObjectHist(
                    objectHist.map((r, i) =>
                      i === index ? { ...r, cultural_affinity: referenceFieldToPayload(fi) } : r,
                    ),
                  )
                }}
                disabled={disabled}
                emptyLabel="—"
              />
              <fieldset className="record-form-nested-fieldset">
                <legend>{t('recordForm.history.actorsWithRoleLegend')}</legend>
                {renderRoledActorRows(rowActors, (next) => {
                  setObjectHist(
                    objectHist.map((r, i) =>
                      i === index ? { ...r, actor: next.length ? next : undefined } : r,
                    ),
                  )
                }, `rf-objh-actr-${index}`)}
              </fieldset>
              <fieldset className="record-form-nested-fieldset">
                <legend>{t('recordForm.history.datesLegend')}</legend>
                {rowDates.map((d, di) => (
                  <div key={di} className="record-form-repeatable-row">
                    <TemporalFields
                      idPrefix={`rf-objh-date-${index}-${di}`}
                      legend={t('recordForm.history.dateNth', { n: di + 1 })}
                      infoPrefix="recordForm.info.history.associatedDate"
                      value={d}
                      onChange={(next) => {
                        const nextDates = rowDates.map((x, j) => (j === di ? (next ?? {}) : x))
                        setObjectHist(
                          objectHist.map((r, i) =>
                            i === index ? { ...r, date: nextDates.length ? nextDates : undefined } : r,
                          ),
                        )
                      }}
                      disabled={disabled}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm record-form-repeatable-remove"
                      onClick={() => {
                        const next = rowDates.filter((_, j) => j !== di)
                        setObjectHist(
                          objectHist.map((r, i) =>
                            i === index ? { ...r, date: next.length ? next : undefined } : r,
                          ),
                        )
                      }}
                      disabled={disabled}
                    >
                      {t('recordForm.labels.remove')}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() =>
                    setObjectHist(
                      objectHist.map((r, i) =>
                        i === index ? { ...r, date: [...rowDates, {}] } : r,
                      ),
                    )
                  }
                  disabled={disabled}
                >
                  {t('recordForm.acquisition.addDate')}
                </button>
              </fieldset>
              <fieldset className="record-form-nested-fieldset">
                <legend>{t('recordForm.history.placesLegend')}</legend>
                {rowPlaces.map((p, pi) => (
                  <div key={pi} className="record-form-repeatable-row record-form-repeatable-row--compact">
                    <div className="form-group form-group--grow">
                      <label htmlFor={`rf-objh-pl-name-${index}-${pi}`}>{t('recordForm.labels.nameFinnish')}</label>
                      <input
                        id={`rf-objh-pl-name-${index}-${pi}`}
                        type="text"
                        value={p.name?.fi ?? ''}
                        onChange={(e) => {
                          const v = e.target.value
                          const next = rowPlaces.map((pl, j) =>
                            j === pi ? { ...pl, name: v.trim() ? { fi: v } : undefined } : pl,
                          )
                          setObjectHist(
                            objectHist.map((r, i) =>
                              i === index ? { ...r, place: next.length ? next : undefined } : r,
                            ),
                          )
                        }}
                        disabled={disabled}
                      />
                    </div>
                    <div className="form-group form-group--grow">
                      <label htmlFor={`rf-objh-pl-note-${index}-${pi}`}>{t('recordForm.labels.note')}</label>
                      <textarea
                        id={`rf-objh-pl-note-${index}-${pi}`}
                        value={p.note ?? ''}
                        onChange={(e) => {
                          const v = e.target.value
                          const next = rowPlaces.map((pl, j) =>
                            j === pi ? { ...pl, note: v.trim() ? v : undefined } : pl,
                          )
                          setObjectHist(
                            objectHist.map((r, i) =>
                              i === index ? { ...r, place: next.length ? next : undefined } : r,
                            ),
                          )
                        }}
                        rows={2}
                        disabled={disabled}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm record-form-repeatable-remove"
                      onClick={() => {
                        const next = rowPlaces.filter((_, j) => j !== pi)
                        setObjectHist(
                          objectHist.map((r, i) =>
                            i === index ? { ...r, place: next.length ? next : undefined } : r,
                          ),
                        )
                      }}
                      disabled={disabled}
                    >
                      {t('recordForm.labels.remove')}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() =>
                    setObjectHist(
                      objectHist.map((r, i) =>
                        i === index ? { ...r, place: [...rowPlaces, {}] } : r,
                      ),
                    )
                  }
                  disabled={disabled}
                >
                  {t('recordForm.acquisition.addPlace')}
                </button>
              </fieldset>
              <fieldset className="record-form-nested-fieldset">
                <legend>{t('recordForm.history.associatedEventLegend')}</legend>
                <ReferenceSelect
                  id={`rf-objh-ev-name-${index}`}
                  label={t('recordForm.labels.eventName')}
                  allowlist={ASSOCIATED_EVENT_NAME_FI}
                  valueFi={referenceFieldFi(ev.name)}
                  onChangeFi={(fi) => {
                    setObjectHist(
                      objectHist.map((r, i) =>
                        i === index
                          ? {
                              ...r,
                              event: { ...r.event, name: referenceFieldToPayload(fi) },
                            }
                          : r,
                      ),
                    )
                  }}
                  disabled={disabled}
                  emptyLabel="—"
                />
                <ReferenceSelect
                  id={`rf-objh-ev-nt-${index}`}
                  label={t('recordForm.labels.eventNameType')}
                  allowlist={ASSOCIATED_EVENT_NAME_TYPE_FI}
                  valueFi={referenceFieldFi(ev.name_type)}
                  onChangeFi={(fi) => {
                    setObjectHist(
                      objectHist.map((r, i) =>
                        i === index
                          ? {
                              ...r,
                              event: { ...r.event, name_type: referenceFieldToPayload(fi) },
                            }
                          : r,
                      ),
                    )
                  }}
                  disabled={disabled}
                  emptyLabel="—"
                />
                <div className="form-group form-group--grow">
                  <label htmlFor={`rf-objh-ev-note-${index}`}>{t('recordForm.labels.eventNote')}</label>
                  <textarea
                    id={`rf-objh-ev-note-${index}`}
                    value={ev.note ?? ''}
                    onChange={(e) => {
                      const v = e.target.value
                      setObjectHist(
                        objectHist.map((r, i) =>
                          i === index
                            ? { ...r, event: { ...r.event, note: v.trim() ? v : undefined } }
                            : r,
                        ),
                      )
                    }}
                    rows={2}
                    disabled={disabled}
                  />
                </div>
                <fieldset className="record-form-nested-fieldset">
                  <legend>{t('recordForm.history.eventActorsLegend')}</legend>
                  {renderRoledActorRows(evActors, (next) => {
                    setObjectHist(
                      objectHist.map((r, i) =>
                        i === index
                          ? { ...r, event: { ...r.event, actor: next.length ? next : undefined } }
                          : r,
                      ),
                    )
                  }, `rf-objh-ev-a-${index}`)}
                </fieldset>
                <fieldset className="record-form-nested-fieldset">
                  <legend>{t('recordForm.history.eventDatesLegend')}</legend>
                  {evDates.map((d, di) => (
                    <div key={di} className="record-form-repeatable-row">
                      <TemporalFields
                        idPrefix={`rf-objh-evd-${index}-${di}`}
                        legend={t('recordForm.history.eventDateNth', { n: di + 1 })}
                        infoPrefix="recordForm.info.history.associatedEventDate"
                        value={d}
                        onChange={(next) => {
                          const nextDates = evDates.map((x, j) => (j === di ? (next ?? {}) : x))
                          setObjectHist(
                            objectHist.map((r, i) =>
                              i === index
                                ? { ...r, event: { ...r.event, date: nextDates.length ? nextDates : undefined } }
                                : r,
                            ),
                          )
                        }}
                        disabled={disabled}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm record-form-repeatable-remove"
                        onClick={() => {
                          const next = evDates.filter((_, j) => j !== di)
                          setObjectHist(
                            objectHist.map((r, i) =>
                              i === index
                                ? { ...r, event: { ...r.event, date: next.length ? next : undefined } }
                                : r,
                            ),
                          )
                        }}
                        disabled={disabled}
                      >
                        {t('recordForm.labels.remove')}
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() =>
                      setObjectHist(
                        objectHist.map((r, i) =>
                          i === index
                            ? { ...r, event: { ...r.event, date: [...evDates, {}] } }
                            : r,
                        ),
                      )
                    }
                    disabled={disabled}
                  >
                    {t('recordForm.history.addEventDate')}
                  </button>
                </fieldset>
                <fieldset className="record-form-nested-fieldset">
                  <legend>{t('recordForm.history.eventPlacesLegend')}</legend>
                  {evPlaces.map((p, pi) => (
                    <div key={pi} className="record-form-repeatable-row record-form-repeatable-row--compact">
                      <div className="form-group form-group--grow">
                        <label htmlFor={`rf-objh-evp-n-${index}-${pi}`}>{t('recordForm.labels.nameFinnish')}</label>
                        <input
                          id={`rf-objh-evp-n-${index}-${pi}`}
                          type="text"
                          value={p.name?.fi ?? ''}
                          onChange={(e) => {
                            const v = e.target.value
                            const next = evPlaces.map((pl, j) =>
                              j === pi ? { ...pl, name: v.trim() ? { fi: v } : undefined } : pl,
                            )
                            setObjectHist(
                              objectHist.map((r, i) =>
                                i === index
                                  ? { ...r, event: { ...r.event, place: next.length ? next : undefined } }
                                  : r,
                              ),
                            )
                          }}
                          disabled={disabled}
                        />
                      </div>
                      <div className="form-group form-group--grow">
                        <label htmlFor={`rf-objh-evp-note-${index}-${pi}`}>{t('recordForm.labels.note')}</label>
                        <textarea
                          id={`rf-objh-evp-note-${index}-${pi}`}
                          value={p.note ?? ''}
                          onChange={(e) => {
                            const v = e.target.value
                            const next = evPlaces.map((pl, j) =>
                              j === pi ? { ...pl, note: v.trim() ? v : undefined } : pl,
                            )
                            setObjectHist(
                              objectHist.map((r, i) =>
                                i === index
                                  ? { ...r, event: { ...r.event, place: next.length ? next : undefined } }
                                  : r,
                              ),
                            )
                          }}
                          rows={2}
                          disabled={disabled}
                        />
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm record-form-repeatable-remove"
                        onClick={() => {
                          const next = evPlaces.filter((_, j) => j !== pi)
                          setObjectHist(
                            objectHist.map((r, i) =>
                              i === index
                                ? { ...r, event: { ...r.event, place: next.length ? next : undefined } }
                                : r,
                            ),
                          )
                        }}
                        disabled={disabled}
                      >
                        {t('recordForm.labels.remove')}
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() =>
                      setObjectHist(
                        objectHist.map((r, i) =>
                          i === index
                            ? { ...r, event: { ...r.event, place: [...evPlaces, {}] } }
                            : r,
                        ),
                      )
                    }
                    disabled={disabled}
                  >
                    {t('recordForm.history.addEventPlace')}
                  </button>
                </fieldset>
              </fieldset>
              <div className="form-group form-group--grow">
                <label htmlFor={`rf-objh-note-${index}`}>{t('recordForm.labels.note')}</label>
                <textarea
                  id={`rf-objh-note-${index}`}
                  value={row.note ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    setObjectHist(
                      objectHist.map((r, i) =>
                        i === index ? { ...r, note: v.trim() ? v : undefined } : r,
                      ),
                    )
                  }}
                  rows={2}
                  disabled={disabled}
                />
              </div>
              <div className="form-group form-group--grow">
                <label htmlFor={`rf-objh-comments-${index}`}>{t('recordForm.labels.comments')}</label>
                <textarea
                  id={`rf-objh-comments-${index}`}
                  value={row.comments ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    setObjectHist(
                      objectHist.map((r, i) =>
                        i === index ? { ...r, comments: v.trim() ? v : undefined } : r,
                      ),
                    )
                  }}
                  rows={2}
                  disabled={disabled}
                />
              </div>
              <div className="form-group form-group--grow">
                <label htmlFor={`rf-objh-rel-${index}`}>{t('recordForm.labels.relevance')}</label>
                <textarea
                  id={`rf-objh-rel-${index}`}
                  value={row.relevance ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    setObjectHist(
                      objectHist.map((r, i) =>
                        i === index ? { ...r, relevance: v.trim() ? v : undefined } : r,
                      ),
                    )
                  }}
                  rows={2}
                  disabled={disabled}
                />
              </div>
            </CollapsibleRepeatableRow>
          )
        })}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setObjectHist([...objectHist, {}])}
          disabled={disabled}
        >
          {t('recordForm.history.addObjectHistoryEntry')}
        </button>
      </fieldset>
    </div>
  )
}

function setRightsEntries(data: RecordPayload, entries: Rights[]): RecordPayload {
  return { ...data, rights: entries.length ? entries : undefined }
}

function updateRightsEntry(data: RecordPayload, index: number, fn: (r: Rights) => void): RecordPayload {
  const list = [...(data.rights ?? [])]
  const r = { ...(list[index] ?? {}) }
  fn(r)
  list[index] = r
  return setRightsEntries(data, list)
}

function rightsEntrySummary(r: Rights, t: TFunction): string {
  const parts = [referenceFieldFi(r.type), r.reference_number?.trim()].filter(Boolean)
  if (parts.length) return parts.join(' · ')
  return t('recordForm.rights.emptyEntrySummary')
}

export function RightsFields({ data, onChange, disabled }: Omit<SectionProps, 'errors'>) {
  const { t } = useTranslation()
  const entries = data.rights ?? []
  const rightsCol = useRepeatableCollapsedRows(entries, rightsHasPersistableContent)

  const setEntries = (rows: Rights[]) => {
    onChange(setRightsEntries(data, rows))
  }

  return (
    <div className="record-form-section-fields">
      <fieldset className="record-form-repeatable-fieldset">
        <legend>{t('recordForm.rights.entriesLegend')}</legend>
        <p className="record-form-repeatable-hint">{t('recordForm.rights.hint')}</p>
        {entries.map((r, index) => {
          const holders = r.holder ?? []
          const setHolders = (rows: ActorField[]) => {
            onChange(
              updateRightsEntry(data, index, (x) => {
                x.holder = rows.length ? rows : undefined
              })
            )
          }
          return (
            <CollapsibleRepeatableRow
              key={index}
              id={`rf-rights-entry-${index}`}
              summary={rightsEntrySummary(r, t)}
              collapsed={rightsCol.isCollapsed(index)}
              onToggleCollapse={() => rightsCol.toggle(index)}
              onRemove={() => setEntries(entries.filter((_, i) => i !== index))}
              disabled={disabled}
              removeLabel={t('recordForm.rights.removeEntry')}
            >
              <ReferenceSelect
                id={`rf-rights-type-${index}`}
                label={t('recordForm.labels.rightsType')}
                allowlist={RIGHTS_TYPE_FI}
                valueFi={referenceFieldFi(r.type)}
                onChangeFi={(fi) =>
                  onChange(
                    updateRightsEntry(data, index, (x) => {
                      x.type = referenceFieldToPayload(fi)
                    })
                  )
                }
                disabled={disabled}
                emptyLabel="—"
              />
              <div className="form-group">
                <label htmlFor={`rf-rights-ref-${index}`}>{t('recordForm.labels.referenceNumber')}</label>
                <input
                  id={`rf-rights-ref-${index}`}
                  type="text"
                  value={r.reference_number ?? ''}
                  onChange={(e) =>
                    onChange(
                      updateRightsEntry(data, index, (x) => {
                        const v = e.target.value
                        x.reference_number = v.trim() ? v : undefined
                      })
                    )
                  }
                  disabled={disabled}
                />
              </div>
              <TemporalFields
                idPrefix={`rf-rights-begin-${index}`}
                legend={t('recordForm.rights.beginDateLegend')}
                value={r.begin_date}
                onChange={(next) =>
                  onChange(
                    updateRightsEntry(data, index, (x) => {
                      x.begin_date = next
                    })
                  )
                }
                disabled={disabled}
              />
              <TemporalFields
                idPrefix={`rf-rights-end-${index}`}
                legend={t('recordForm.rights.endDateLegend')}
                value={r.end_date}
                onChange={(next) =>
                  onChange(
                    updateRightsEntry(data, index, (x) => {
                      x.end_date = next
                    })
                  )
                }
                disabled={disabled}
              />
              <fieldset className="record-form-repeatable-fieldset">
                <legend>{t('recordForm.rights.holdersLegend')}</legend>
                <p className="record-form-repeatable-hint">{t('recordForm.rights.holdersHint')}</p>
                {holders.map((actor, hIndex) => (
                  <div key={hIndex} className="record-form-repeatable-row record-form-repeatable-row--compact">
                    <ActorRefSelect
                      id={`rf-rights-holder-ref-${index}-${hIndex}`}
                      label={t('recordForm.labels.holder')}
                      value={actor}
                      onChange={(next) =>
                        setHolders(holders.map((act, i) => (i === hIndex ? (next ?? {}) : act)))
                      }
                      disabled={disabled}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm record-form-repeatable-remove"
                      onClick={() => setHolders(holders.filter((_, i) => i !== hIndex))}
                      disabled={disabled}
                    >
                      {t('recordForm.labels.remove')}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setHolders([...holders, {}])}
                  disabled={disabled}
                >
                  {t('recordForm.rights.addHolder')}
                </button>
              </fieldset>
              <div className="form-group">
                <label htmlFor={`rf-rights-note-${index}`}>{t('recordForm.labels.note')}</label>
                <textarea
                  id={`rf-rights-note-${index}`}
                  value={r.note ?? ''}
                  onChange={(e) =>
                    onChange(
                      updateRightsEntry(data, index, (x) => {
                        const v = e.target.value
                        x.note = v.trim() ? v : undefined
                      })
                    )
                  }
                  rows={3}
                  disabled={disabled}
                />
              </div>
            </CollapsibleRepeatableRow>
          )
        })}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setEntries([...entries, {}])}
          disabled={disabled}
        >
          {t('recordForm.rights.addRightsEntry')}
        </button>
      </fieldset>
    </div>
  )
}

function patchAccess(data: RecordPayload, fn: (a: NonNullable<RecordPayload['access']>) => void): RecordPayload {
  const a = { ...(data.access ?? {}) }
  fn(a)
  const ods = a.object_display_status
  const empty =
    !referenceFieldFi(a.category) &&
    !referenceFieldFi(a.museological_value) &&
    !a.note?.trim() &&
    !a.credit_line?.trim() &&
    !(a.date && temporalHasPersistableContent(a.date)) &&
    !(
      ods &&
      (referenceFieldFi(ods.type) || (ods.date && temporalHasPersistableContent(ods.date)))
    )
  return { ...data, access: empty ? undefined : a }
}

export function AccessFields({ data, onChange, disabled }: Omit<SectionProps, 'errors'>) {
  const { t } = useTranslation()
  const a = data.access ?? {}
  const displayStatus = a.object_display_status ?? {}
  return (
    <div className="record-form-section-fields">
      <ReferenceSelect
        id="rf-access-cat"
        label={t('recordForm.labels.accessCategory')}
        infoKey="recordForm.info.access.accessCategory"
        allowlist={ACCESS_CATEGORY_FI}
        valueFi={referenceFieldFi(a.category)}
        onChangeFi={(fi) =>
          onChange(
            patchAccess(data, (x) => {
              x.category = referenceFieldToPayload(fi)
            })
          )
        }
        disabled={disabled}
        emptyLabel="—"
      />
      <TemporalFields
        idPrefix="rf-access-date"
        legend={t('recordForm.access.accessDateLegend')}
        infoPrefix="recordForm.info.access.accessDate"
        value={a.date}
        onChange={(next) => onChange(patchAccess(data, (x) => { x.date = next }))}
        disabled={disabled}
      />
      <ReferenceSelect
        id="rf-access-mus"
        label={t('recordForm.labels.museologicalValue')}
        infoKey="recordForm.info.access.museologicalValue"
        allowlist={MUSEOLOGICAL_VALUE_FI}
        valueFi={referenceFieldFi(a.museological_value)}
        onChangeFi={(fi) =>
          onChange(
            patchAccess(data, (x) => {
              x.museological_value = referenceFieldToPayload(fi)
            })
          )
        }
        disabled={disabled}
        emptyLabel="—"
      />
      <fieldset className="record-form-repeatable-fieldset">
        <legend>{t('recordForm.access.displayStatusLegend')}</legend>
        <p className="record-form-repeatable-hint">{t('recordForm.access.displayStatusHint')}</p>
        <ReferenceSelect
          id="rf-access-ods-type"
          label={t('recordForm.labels.statusType')}
          infoKey="recordForm.info.access.displayStatus"
          allowlist={OBJECT_DISPLAY_STATUS_TYPE_FI}
          valueFi={referenceFieldFi(displayStatus.type)}
          onChangeFi={(fi) =>
            onChange(
              patchAccess(data, (x) => {
                const typePayload = referenceFieldToPayload(fi)
                const cur = x.object_display_status ?? {}
                const next = { ...cur, type: typePayload }
                const keep =
                  referenceFieldFi(next.type) ||
                  (next.date && temporalHasPersistableContent(next.date))
                x.object_display_status = keep ? next : undefined
              })
            )
          }
          disabled={disabled}
          emptyLabel="—"
        />
        <TemporalFields
          idPrefix="rf-access-ods-date"
          legend={t('recordForm.access.statusDateLegend')}
          infoPrefix="recordForm.info.access.displayStatusDate"
          value={displayStatus.date}
          onChange={(next) =>
            onChange(
              patchAccess(data, (x) => {
                const cur = x.object_display_status ?? {}
                const merged = { ...cur, date: next }
                const keep =
                  referenceFieldFi(merged.type) ||
                  (merged.date && temporalHasPersistableContent(merged.date))
                x.object_display_status = keep ? merged : undefined
              })
            )
          }
          disabled={disabled}
        />
      </fieldset>
      <div className="form-group">
        <label htmlFor="rf-access-credit">{t('recordForm.labels.creditLine')}</label>
        <FieldInfoText infoKey="recordForm.info.access.creditLine" />
        <input
          id="rf-access-credit"
          type="text"
          value={a.credit_line ?? ''}
          onChange={(e) =>
            onChange(
              patchAccess(data, (x) => {
                const v = e.target.value
                x.credit_line = v.trim() ? v : undefined
              })
            )
          }
          disabled={disabled}
        />
      </div>
      <div className="form-group">
        <label htmlFor="rf-access-note">{t('recordForm.labels.note')}</label>
        <FieldInfoText infoKey="recordForm.info.access.note" />
        <textarea
          id="rf-access-note"
          value={a.note ?? ''}
          onChange={(e) =>
            onChange(
              patchAccess(data, (x) => {
                const v = e.target.value
                x.note = v.trim() ? v : undefined
              })
            )
          }
          rows={3}
          disabled={disabled}
        />
      </div>
    </div>
  )
}

function patchLocation(data: RecordPayload, fn: (o: NonNullable<RecordPayload['object_location']>) => void): RecordPayload {
  const o = { ...(data.object_location ?? {}) }
  fn(o)
  return { ...data, object_location: objectLocationHasPersistableContent(o) ? o : undefined }
}

export function ObjectLocationFields({ data, onChange, disabled }: Omit<SectionProps, 'errors'>) {
  const { t } = useTranslation()
  const o = data.object_location ?? {}
  const loc = o.location ?? {}
  return (
    <div className="record-form-section-fields">
      <div className="form-group">
        <label htmlFor="rf-loc-id">{t('recordForm.labels.identifier')}</label>
        <FieldInfoText infoKey="recordForm.info.location.identifier" />
        <input
          id="rf-loc-id"
          type="text"
          value={o.identifier ?? ''}
          onChange={(e) =>
            onChange(
              patchLocation(data, (x) => {
                const v = e.target.value
                x.identifier = v.trim() ? v : undefined
              })
            )
          }
          disabled={disabled}
        />
      </div>
      <fieldset className="record-form-repeatable-fieldset">
        <legend>{t('recordForm.location.locationLegend')}</legend>
        <p className="record-form-repeatable-hint">{t('recordForm.location.hint')}</p>
        <div className="record-form-repeatable-row record-form-repeatable-row--compact">
          <div className="form-group form-group--grow">
            <label htmlFor="rf-loc-spatial-name">{t('recordForm.labels.nameFinnish')}</label>
            <FieldInfoText infoKey="recordForm.info.location.placeName" />
            <input
              id="rf-loc-spatial-name"
              type="text"
              value={loc.name?.fi ?? ''}
              onChange={(e) => {
                const v = e.target.value
                onChange(
                  patchLocation(data, (x) => {
                    const nextLoc = { ...loc, name: v.trim() ? { fi: v } : undefined }
                    x.location = spatialRowHasContent(nextLoc) ? nextLoc : undefined
                  })
                )
              }}
              disabled={disabled}
            />
          </div>
          <div className="form-group form-group--grow">
            <label htmlFor="rf-loc-spatial-note">{t('recordForm.labels.locationNote')}</label>
            <FieldInfoText infoKey="recordForm.info.location.placeNote" />
            <textarea
              id="rf-loc-spatial-note"
              value={loc.note ?? ''}
              onChange={(e) => {
                const v = e.target.value
                onChange(
                  patchLocation(data, (x) => {
                    const nextLoc = { ...loc, note: v.trim() ? v : undefined }
                    x.location = spatialRowHasContent(nextLoc) ? nextLoc : undefined
                  })
                )
              }}
              rows={2}
              disabled={disabled}
            />
          </div>
        </div>
      </fieldset>
      <ReferenceSelect
        id="rf-loc-type"
        label={t('recordForm.labels.locationType')}
        infoKey="recordForm.info.location.type"
        allowlist={LOCATION_TYPE_FI}
        valueFi={referenceFieldFi(o.type)}
        onChangeFi={(fi) =>
          onChange(
            patchLocation(data, (x) => {
              x.type = referenceFieldToPayload(fi)
            })
          )
        }
        disabled={disabled}
        emptyLabel="—"
      />
      <TemporalFields
        idPrefix="rf-loc-date"
        legend={t('recordForm.location.locationDateLegend')}
        infoPrefix="recordForm.info.location.date"
        value={o.date}
        onChange={(next) => onChange(patchLocation(data, (x) => { x.date = next }))}
        disabled={disabled}
      />
      <div className="form-group">
        <label htmlFor="rf-loc-note">{t('recordForm.labels.note')}</label>
        <FieldInfoText infoKey="recordForm.info.location.note" />
        <textarea
          id="rf-loc-note"
          value={o.note ?? ''}
          onChange={(e) =>
            onChange(
              patchLocation(data, (x) => {
                const v = e.target.value
                x.note = v.trim() ? v : undefined
              })
            )
          }
          rows={3}
          disabled={disabled}
        />
      </div>
      <ReferenceSelect
        id="rf-loc-fitness"
        label={t('recordForm.labels.locationFitness')}
        infoKey="recordForm.info.location.fitness"
        allowlist={LOCATION_FITNESS_FI}
        valueFi={referenceFieldFi(o.fitness)}
        onChangeFi={(fi) =>
          onChange(
            patchLocation(data, (x) => {
              x.fitness = referenceFieldToPayload(fi)
            })
          )
        }
        disabled={disabled}
        emptyLabel="—"
      />
    </div>
  )
}

function patchConfidentiality(
  data: RecordPayload,
  fn: (c: NonNullable<RecordPayload['confidentiality']>) => void
): RecordPayload {
  const c = { ...(data.confidentiality ?? {}) }
  fn(c)
  const empty = !c.note?.trim() && !c.usage?.trim()
  return { ...data, confidentiality: empty ? undefined : c }
}

export function ConfidentialityFields({ data, onChange, disabled }: Omit<SectionProps, 'errors'>) {
  const { t } = useTranslation()
  const c = data.confidentiality ?? {}
  return (
    <div className="record-form-section-fields">
      <div className="form-group">
        <label htmlFor="rf-conf-note">{t('recordForm.labels.note')}</label>
        <FieldInfoText infoKey="recordForm.info.confidentiality.note" />
        <textarea
          id="rf-conf-note"
          value={c.note ?? ''}
          onChange={(e) =>
            onChange(
              patchConfidentiality(data, (x) => {
                const v = e.target.value
                x.note = v.trim() ? v : undefined
              })
            )
          }
          rows={3}
          disabled={disabled}
        />
      </div>
      <div className="form-group">
        <label htmlFor="rf-conf-usage">{t('recordForm.labels.usage')}</label>
        <FieldInfoText infoKey="recordForm.info.confidentiality.usage" />
        <textarea
          id="rf-conf-usage"
          value={c.usage ?? ''}
          onChange={(e) =>
            onChange(
              patchConfidentiality(data, (x) => {
                const v = e.target.value
                x.usage = v.trim() ? v : undefined
              })
            )
          }
          rows={3}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
