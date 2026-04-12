/**
 * Domain section editors for RecordForm (draft RecordPayload slices).
 */

import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import {
  acquisitionActorListItemHasContent,
  acquisitionDateRowHasContent,
  persistAcquisitionActorRow,
  spatialRowHasContent,
  unwrapAcquisitionActorSlot,
} from '../../lib/acquisitionPayload'
import {
  normalizeObjectHistoryList,
  normalizeObjectProductionInformationList,
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
  ACQUISITION_ACTOR_ROLE_FI,
  AQCUISITION_METHOD_FI,
  DENOMINATION_FI,
  LANGUAGE_FI,
  LANGUAGE_GROUPS,
  LOCATION_FITNESS_FI,
  LOCATION_TYPE_FI,
  MUSEOLOGICAL_VALUE_FI,
  OBJECT_DISPLAY_STATUS_TYPE_FI,
  OBJECT_NAME_TYPE_FI,
  OBJECT_NAME_VALUE_FI,
  OBJECT_TYPE_FI,
  OWNERSHIP_EXCHANGE_METHOD_FI,
  RIGHTS_TYPE_FI,
  TITLE_TYPE_FI,
  USAGE_FI,
} from '../../data/referenceVocabularies'
import { referenceFieldFi, referenceFieldToPayload, referenceSelectOptions } from '../../lib/referenceField'
import type { RecordPayload } from '../../types/record'
import type { ObjectLocation } from '../../types/record/object-location'
import type { Rights } from '../../types/record/rights'
import {
  identificationTitlesAsList,
  mergeObjectNameWithImplicitLanguage,
  objectNameRowHasContent,
  titleRowHasContent,
} from '../../lib/identificationTitles'
import type { ObjectName, IdentificationDetails, Title } from '../../types/record/identification'
import type { AcquisitionActorRow } from '../../types/record/aqcuisition'
import type { Temporal } from '../../types/record/common'
import { DateDetailInputs, TemporalFields } from './TemporalFields'
import type { ActorField, Spatial } from '../../types/record/actor'
import type {
  AssociatedEvent,
  ObjectHistory,
  ObjectProductInformation,
  Ownership,
  UsageHistory,
} from '../../types/record/history'
import { rightsHasPersistableContent } from '../../lib/rightsPayload'
import {
  dateDetailHasPersistableContent,
  dateDetailSummaryLine,
  temporalSummaryLine,
} from '../../lib/temporalPayload'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { objectLocationHasPersistableContent } from '../../lib/objectLocationPayload'
import {
  isActorSlotEmpty,
  recordAcquisitionActorRowSummary,
  recordActorSlotSummary,
} from './actorMiniForm'
import { ActorRefSelect } from './ActorRefSelect'
import { SpatialFields } from './SpatialFields'
import { CollapsibleRepeatableRow } from './CollapsibleRepeatableRow'
import { ObjectHistoryEventPlacesList } from './ObjectHistoryEventPlacesList'
import { ObjectHistoryEventTimeList } from './ObjectHistoryEventTimeList'
import { ObjectHistoryPlacesList } from './ObjectHistoryPlacesList'
import { ObjectHistoryTimeList } from './ObjectHistoryTimeList'
import { ObjectProductionPlacesList } from './ObjectProductionPlacesList'
import { ObjectProductionTechniquesList } from './ObjectProductionTechniquesList'
import { ObjectProductionTimeList } from './ObjectProductionTimeList'
import { RightsHoldersList } from './RightsHoldersList'
import { RoledActorRepeatableList } from './RoledActorRepeatableList'
import { FieldInfoText } from './FieldInfoText'
import { useAuthStore } from '../../stores/authStore'
import { GroupedReferenceSelect } from './GroupedReferenceSelect'
import { ReferenceSelect } from './ReferenceSelect'
import { useRepeatableCollapsedRows } from './useRepeatableCollapsedRows'
import { useActorStore } from '../../stores/actorStore'
import { useCollectionStore } from '../../stores/collectionStore'

export { DescriptionFields } from './DescriptionFields'

export interface RecordFormSectionErrors {
  identification?: string
  /** Kokoelma (record.collection) */
  collection?: string
}

interface SectionProps {
  data: RecordPayload
  onChange: (next: RecordPayload) => void
  disabled: boolean
  errors: RecordFormSectionErrors
}

export interface IdentificationFieldsProps extends SectionProps {
  /** Record FK `collection` — not stored under identification_details. */
  recordCollectionId: number | undefined
  onRecordCollectionChange: (id: number | undefined) => void
}

function patchIdentification(data: RecordPayload, fn: (id: IdentificationDetails) => void): RecordPayload {
  const id: IdentificationDetails = { ...(data.identification_details ?? {}) }
  fn(id)

  // Do not strip empty title / object_name rows here — that breaks "Add title" / "Add object name".
  // Empty placeholders are removed in compactRecordPayloadForSave before API submit.

  if (id.number_of_objects != null) {
    const n = Number(id.number_of_objects)
    if (!Number.isFinite(n) || n < 1) delete id.number_of_objects
    else id.number_of_objects = Math.floor(n)
  }
  if (id.object_number !== undefined && !String(id.object_number).trim()) delete id.object_number
  if (!referenceFieldFi(id.object_type)) delete id.object_type

  const hasId = Object.keys(id).length > 0
  return { ...data, identification_details: hasId ? id : undefined }
}

export function IdentificationFields({
  data,
  onChange,
  disabled,
  errors,
  recordCollectionId,
  onRecordCollectionChange,
}: IdentificationFieldsProps) {
  const { t } = useTranslation()
  const authStore = useAuthStore()
  const collectionStore = useCollectionStore()
  const id = data.identification_details ?? {}
  const objectNumber = id.object_number ?? ''
  const objectTypeFi = referenceFieldFi(id.object_type)
  const collectionSelectValue = recordCollectionId ?? ''
  const numberOfObjects =
    id.number_of_objects != null && Number.isFinite(Number(id.number_of_objects))
      ? Math.floor(Number(id.number_of_objects))
      : ''
  const titles = identificationTitlesAsList(id.title)
  const names = id.object_name ?? []

  const titlesCol = useRepeatableCollapsedRows(titles, titleRowHasContent)
  const namesCol = useRepeatableCollapsedRows(names, objectNameRowHasContent)

  useEffect(() => {
    if (!authStore.user?.username) return
    collectionStore
      .fetchCollections({ owner: authStore.user.username, page_size: 500, is_closed: false })
      .catch(() => {})
  }, [authStore.user?.username, collectionStore])

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
    const next = names.map((row, i) =>
      i === index ? mergeObjectNameWithImplicitLanguage(row, patch) : row,
    )
    setNames(next)
  }

  const removeObjectName = (index: number) => {
    setNames(names.filter((_, i) => i !== index))
  }

  return (
    <div className="record-form-section-fields">
      {errors.identification && (
        <p className="field-error record-form-section-error" role="alert">
          {errors.identification}
        </p>
      )}
      <div className="form-group">
        <label htmlFor="rf-identification-collection">
          {t('recordForm.labels.identificationCollection')}
          <span className="record-form-required-mark" aria-hidden="true">
            {' '}
            *
          </span>
        </label>
        <FieldInfoText infoKey="recordForm.info.identification.collection" />
        <select
          id="rf-identification-collection"
          value={collectionSelectValue === '' ? '' : String(collectionSelectValue)}
          onChange={(e) => {
            const v = e.target.value
            if (!v) {
              onRecordCollectionChange(undefined)
              return
            }
            onRecordCollectionChange(Number(v))
          }}
          disabled={disabled}
          aria-required="true"
          aria-invalid={errors.collection ? 'true' : undefined}
          aria-describedby={errors.collection ? 'rf-identification-collection-error' : undefined}
        >
          <option value="">—</option>
          {collectionSelectValue !== '' &&
            !collectionStore.collections.some((c) => c.id === collectionSelectValue) && (
              <option value={String(collectionSelectValue)}>
                {t('recordForm.identification.collectionOptionUnknown', { id: collectionSelectValue })}
              </option>
            )}
          {collectionStore.collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.collection && (
          <p id="rf-identification-collection-error" className="field-error" role="alert">
            {errors.collection}
          </p>
        )}
      </div>
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
            saveItemNoun={t('recordForm.repeatable.saveItemLabels.title')}
            summary={
              row.value?.trim()
                ? row.value
                : [referenceFieldFi(row.type), referenceFieldFi(row.language)].filter(Boolean).join(' · ') ||
                  t('recordForm.identification.emptyTitle')
            }
          >
            <div className="form-group">
              <label htmlFor={`rf-title-value-${index}`}>{t('recordForm.labels.titleText')}</label>
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
              <label htmlFor={`rf-title-note-${index}`}>{t('recordForm.labels.noteNimeke')}</label>
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
              allowlist={TITLE_TYPE_FI}
              valueFi={referenceFieldFi(row.type)}
              onChangeFi={(fi) => updateTitle(index, { type: referenceFieldToPayload(fi) })}
              disabled={disabled}
              emptyLabel="—"
            />
            <GroupedReferenceSelect
              id={`rf-title-language-${index}`}
              label={t('recordForm.labels.titleLanguage')}
              groups={LANGUAGE_GROUPS}
              flatAllowlist={LANGUAGE_FI}
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

      <div className="form-group">
        <label htmlFor="rf-number-of-objects">{t('recordForm.labels.numberOfObjects')}</label>
        <FieldInfoText infoKey="recordForm.info.identification.numberOfObjects" />
        <input
          id="rf-number-of-objects"
          type="number"
          min={1}
          step={1}
          value={numberOfObjects === '' ? '' : numberOfObjects}
          onChange={(e) => {
            const raw = e.target.value
            onChange(
              patchIdentification(data, (d) => {
                if (raw === '') {
                  delete d.number_of_objects
                  return
                }
                const n = Number(raw)
                d.number_of_objects = Number.isFinite(n) && n >= 1 ? Math.floor(n) : undefined
              })
            )
          }}
          disabled={disabled}
        />
      </div>
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
      <fieldset className="record-form-repeatable-fieldset">
        <legend>{t('recordForm.identification.objectNamesLegend')}</legend>
        <FieldInfoText infoKey="recordForm.info.identification.objectName" />
        {names.map((row, index) => (
          <CollapsibleRepeatableRow
            key={index}
            id={`rf-on-row-${index}`}
            collapsed={namesCol.isCollapsed(index)}
            onToggleCollapse={() => namesCol.toggle(index)}
            onRemove={() => removeObjectName(index)}
            disabled={disabled}
            saveItemNoun={t('recordForm.repeatable.saveItemLabels.objectName')}
            summary={
              referenceFieldFi(row.value)?.trim()
                ? referenceFieldFi(row.value)
                : referenceFieldFi(row.type) || t('recordForm.identification.emptyObjectName')
            }
          >
            <div className="form-group">
              <label htmlFor={`rf-on-value-${index}`}>{t('recordForm.labels.objectNameValue')}</label>
              <select
                id={`rf-on-value-${index}`}
                value={referenceFieldFi(row.value)}
                onChange={(e) =>
                  updateObjectName(index, { value: referenceFieldToPayload(e.target.value) })
                }
                disabled={disabled}
              >
                <option value="">—</option>
                {referenceSelectOptions(OBJECT_NAME_VALUE_FI, referenceFieldFi(row.value)).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor={`rf-on-type-${index}`}>{t('recordForm.labels.objectNameType')}</label>
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
          </CollapsibleRepeatableRow>
        ))}
        <button type="button" className="btn btn-secondary btn-sm" onClick={addObjectName} disabled={disabled}>
          {t('recordForm.identification.addObjectName')}
        </button>
      </fieldset>

      <ReferenceSelect
        id="rf-object-type"
        className="record-form-field-before-image"
        label={t('recordForm.labels.objectKind')}
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
        infoKey="recordForm.info.identification.objectKind"
      />
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
    !(a.acquisition_time && dateDetailHasPersistableContent(a.acquisition_time)) &&
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

export const AcquisitionFields = observer(function AcquisitionFields({
  data,
  onChange,
  disabled,
}: Omit<SectionProps, 'errors'>) {
  const { t } = useTranslation()
  const actorStore = useActorStore()
  useEffect(() => {
    actorStore.fetchActors({ page_size: 200 }).catch(() => {})
  }, [actorStore])
  const resolveActorCatalog = (id: number) => actorStore.actorById(id)?.data
  const a = data.aquisition_details ?? {}
  const dates = a.date ?? []
  const places = a.place ?? []
  const actors: AcquisitionActorRow[] = (a.actor ?? []).map(unwrapAcquisitionActorSlot)

  const datesCol = useRepeatableCollapsedRows(dates, acquisitionDateRowHasContent)
  const placesCol = useRepeatableCollapsedRows(places, spatialRowHasContent)
  const actorsCol = useRepeatableCollapsedRows(actors, acquisitionActorListItemHasContent)

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

  const setActors = (rows: AcquisitionActorRow[]) => {
    onChange(
      patchAcquisition(data, (d) => {
        const persisted = rows.map(persistAcquisitionActorRow)
        d.actor = persisted.length ? persisted : undefined
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

      <DateDetailInputs
        idPrefix="rf-acq-acquisition-time"
        legend={t('recordForm.acquisition.acquisitionTimeLegend')}
        hint={t('recordForm.acquisition.acquisitionTimeHint')}
        dateLabel={t('recordForm.acquisition.acquisitionDateLabel')}
        infoPrefix="recordForm.info.acquisition.acquisitionTime"
        value={a.acquisition_time}
        onChange={(next) =>
          onChange(
            patchAcquisition(data, (d) => {
              d.acquisition_time = next
            })
          )
        }
        disabled={disabled}
      />

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
            saveItemNoun={t('recordForm.repeatable.saveItemLabels.acquisitionOtherTime')}
            summary={temporalSummaryLine(row) || t('recordForm.acquisition.emptyDateEntry')}
          >
            <TemporalFields
              idPrefix={`rf-acq-other-time-${index}`}
              legend={t('recordForm.acquisition.dateEntryLegend', { n: index + 1 })}
              infoPrefix="recordForm.info.acquisition.otherTimes"
              earliestLegend={t('recordForm.acquisition.otherTimesEarliestLegend')}
              earliestAtTop
              noteAtBottom
              flattenEarliest
              hideLatest
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
            saveItemNoun={t('recordForm.repeatable.saveItemLabels.acquisitionPlace')}
            summary={
              row.name?.fi?.trim() ||
              row.name?.en?.trim() ||
              row.note?.trim() ||
              referenceFieldFi(row.name_type) ||
              referenceFieldFi(row.acquisition_place_role) ||
              referenceFieldFi(row.status) ||
              row.environmental_details?.trim() ||
              row.position?.trim() ||
              t('recordForm.acquisition.emptyPlace')
            }
          >
            <SpatialFields
              idPrefix={`rf-acq-place-${index}`}
              nameInputMode="multilingual"
              omitNameGroupLegend
              includeUndefinedLanguage={false}
              showAcquisitionPlaceRole
              noteAtBottom
              placeNameFinnishLabel={t('recordForm.acquisition.placeNameFiLabel')}
              placeNameEnglishLabel={t('recordForm.acquisition.placeNameEnLabel')}
              value={row}
              onChange={(next) => {
                const nextPlaces = places.map((p, i) => (i === index ? (next ?? {}) : p))
                setPlaces(nextPlaces)
              }}
              disabled={disabled}
            />
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
            saveItemNoun={t('recordForm.repeatable.saveItemLabels.acquisitionActor')}
            summary={recordAcquisitionActorRowSummary(actor, resolveActorCatalog)}
          >
            <ActorRefSelect
              id={`rf-acq-actor-ref-${index}`}
              label={t('recordForm.labels.actor')}
              value={actor.actor}
              onChange={(next) =>
                setActors(
                  actors.map((act, i) =>
                    i === index ? { ...act, actor: next ?? undefined } : act,
                  ),
                )
              }
              disabled={disabled}
            />
            <ReferenceSelect
              id={`rf-acq-actor-role-${index}`}
              label={t('recordForm.labels.acquisitionActorRole')}
              infoKey="recordForm.info.acquisition.acquisitionActorRole"
              allowlist={ACQUISITION_ACTOR_ROLE_FI}
              valueFi={referenceFieldFi(actor.acquisition_actor_role)}
              onChangeFi={(fi) =>
                setActors(
                  actors.map((act, i) =>
                    i === index
                      ? {
                          ...act,
                          acquisition_actor_role: fi.trim()
                            ? referenceFieldToPayload(fi)
                            : undefined,
                        }
                      : act,
                  ),
                )
              }
              disabled={disabled}
              emptyLabel="—"
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
        <label htmlFor="rf-acq-note">{t('recordForm.labels.noteAcquisition')}</label>
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
})

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

export const HistoryFields = observer(function HistoryFields({
  data,
  onChange,
  disabled,
}: Omit<SectionProps, 'errors'>) {
  const { t } = useTranslation()
  const actorStore = useActorStore()
  useEffect(() => {
    actorStore.fetchActors({ page_size: 200 }).catch(() => {})
  }, [actorStore])
  const resolveActorCatalog = (id: number) => actorStore.actorById(id)?.data
  const h = data.history ?? {}
  const owners = h.owner_history ?? []
  const production = normalizeObjectProductionInformationList(h.object_production_information ?? [])
  const usage = h.usage_history ?? []
  const objectHist = normalizeObjectHistoryList(h.object_history ?? [])

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

  return (
    <div className="record-form-section-fields">
      <fieldset className="record-form-repeatable-fieldset">
        <legend>{t('recordForm.history.ownerHistoryLegend')}</legend>
        <p className="record-form-repeatable-hint">{t('recordForm.history.ownerHistoryHint')}</p>
        {owners.map((row, index) => {
          const owner = row.owner
          const place = row.place ?? {}
          const ex = row.exchange ?? {}
          const ownerSummary = recordActorSlotSummary(owner, resolveActorCatalog)
          return (
            <CollapsibleRepeatableRow
              key={index}
              id={`rf-oh-row-${index}`}
              collapsed={ownerCol.isCollapsed(index)}
              onToggleCollapse={() => ownerCol.toggle(index)}
              onRemove={() => setOwners(owners.filter((_, i) => i !== index))}
              disabled={disabled}
              saveItemNoun={t('recordForm.repeatable.saveItemLabels.ownerHistory')}
              summary={
                !isActorSlotEmpty(owner)
                  ? ownerSummary
                  : dateDetailSummaryLine(row.date)
                    ? dateDetailSummaryLine(row.date)
                    : place.name?.fi?.trim() ||
                      place.name?.en?.trim() ||
                      place.note?.trim() ||
                      referenceFieldFi(place.name_type) ||
                      referenceFieldFi(place.acquisition_place_role) ||
                      referenceFieldFi(place.status) ||
                      place.environmental_details?.trim() ||
                      t('recordForm.history.emptyOwnerEntry')
              }
            >
              <ActorRefSelect
                id={`rf-oh-owner-ref-${index}`}
                label={t('recordForm.labels.ownerActor')}
                infoKey="recordForm.info.history.ownerActor"
                value={owner}
                onChange={(next) =>
                  setOwners(owners.map((o, i) => (i === index ? { ...o, owner: next ?? {} } : o)))
                }
                disabled={disabled}
              />
              <DateDetailInputs
                idPrefix={`rf-oh-date-${index}`}
                flatLayout
                dateLabel={t('recordForm.history.ownershipDateLegend')}
                infoPrefix="recordForm.info.history.ownershipDate"
                value={row.date}
                onChange={(next) =>
                  setOwners(owners.map((o, i) => (i === index ? { ...o, date: next } : o)))
                }
                disabled={disabled}
              />
              <fieldset className="record-form-nested-fieldset">
                <legend>{t('recordForm.history.ownershipPlaceLegend')}</legend>
                <SpatialFields
                  idPrefix={`rf-oh-place-${index}`}
                  nameInputMode="multilingual"
                  omitNameGroupLegend
                  includeUndefinedLanguage={false}
                  showAcquisitionPlaceRole
                  noteAtBottom
                  placeNameFinnishLabel={t('recordForm.history.placeNameFiLabel')}
                  placeNameEnglishLabel={t('recordForm.history.placeNameEnLabel')}
                  placeRoleLabel={t('recordForm.labels.ownershipPlaceRole')}
                  placeRoleInfoKey="recordForm.info.history.ownershipPlaceRole"
                  value={place}
                  onChange={(next) =>
                    setOwners(owners.map((o, i) => (i === index ? { ...o, place: next } : o)))
                  }
                  disabled={disabled}
                />
              </fieldset>
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
                <label htmlFor={`rf-oh-ex-note-${index}`}>{t('recordForm.labels.noteExchangeOwnerHistory')}</label>
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
          const prodDates = row.date ?? []
          const prodPlaces = row.place ?? []
          const techniques = row.techniques ?? []
          const firstActorSummary = actors[0]
            ? recordActorSlotSummary(actors[0].actor, resolveActorCatalog)
            : ''
          const prodDateSummary =
            prodDates.map((d) => dateDetailSummaryLine(d)).find((s) => s.trim()) ?? ''
          const placeSummaryLine =
            prodPlaces.map((p) => p.name?.fi?.trim()).find((s) => s) ||
            prodPlaces.map((p) => p.note?.trim()).find((s) => s) ||
            ''
          const techniqueSummaryLine =
            techniques.map((tr) => referenceFieldFi(tr.name)?.trim()).find((s) => s) ||
            techniques.map((tr) => referenceFieldFi(tr.type)?.trim()).find((s) => s) ||
            ''
          return (
            <CollapsibleRepeatableRow
              key={pIndex}
              id={`rf-opi-row-${pIndex}`}
              collapsed={productionCol.isCollapsed(pIndex)}
              onToggleCollapse={() => productionCol.toggle(pIndex)}
              onRemove={() => setProduction(production.filter((_, i) => i !== pIndex))}
              disabled={disabled}
              saveItemNoun={t('recordForm.repeatable.saveItemLabels.production')}
              summary={
                actors[0] && !isActorSlotEmpty(actors[0].actor)
                  ? firstActorSummary
                  : techniqueSummaryLine
                    ? techniqueSummaryLine
                    : prodDateSummary
                      ? prodDateSummary
                      : placeSummaryLine
                        ? placeSummaryLine
                        : row.note?.trim() ||
                          referenceFieldFi(prodPlaces[0]?.name_type) ||
                          t('recordForm.history.emptyProductionEntry')
              }
              removeLabel={t('recordForm.history.removeProductionEntry')}
            >
              <fieldset className="record-form-nested-fieldset">
                <legend>{t('recordForm.history.productionActorsWithRoleLegend')}</legend>
                <FieldInfoText infoKey="recordForm.info.history.productionRelatedActor" />
                <RoledActorRepeatableList
                  rows={actors}
                  onChange={(next) => {
                    setProduction(
                      production.map((r, i) =>
                        i === pIndex ? { ...r, actor: next.length ? next : undefined } : r,
                      ),
                    )
                  }}
                  idPrefix={`rf-opi-act-${pIndex}`}
                  disabled={disabled}
                  resolveActorCatalog={resolveActorCatalog}
                  roleLabel={t('recordForm.history.productionActorRoleLabel')}
                />
              </fieldset>
              <ObjectProductionTimeList
                dates={prodDates}
                onChange={(next) =>
                  setProduction(
                    production.map((r, i) => (i === pIndex ? { ...r, date: next } : r)),
                  )
                }
                idPrefix={`rf-opi-dates-${pIndex}`}
                disabled={disabled}
              />
              <ObjectProductionPlacesList
                places={prodPlaces}
                onChange={(next) =>
                  setProduction(
                    production.map((r, i) => (i === pIndex ? { ...r, place: next } : r)),
                  )
                }
                idPrefix={`rf-opi-place-${pIndex}`}
                disabled={disabled}
              />
              <ObjectProductionTechniquesList
                techniques={techniques}
                onChange={(next) =>
                  setProduction(
                    production.map((r, i) => (i === pIndex ? { ...r, techniques: next } : r)),
                  )
                }
                idPrefix={`rf-opi-tech-${pIndex}`}
                disabled={disabled}
              />
              <div className="form-group form-group--grow">
                <label htmlFor={`rf-opi-reason-${pIndex}`}>{t('recordForm.labels.productionReason')}</label>
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
                <label htmlFor={`rf-opi-note-${pIndex}`}>{t('recordForm.labels.noteProduction')}</label>
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
        <p className="record-form-repeatable-hint">{t('recordForm.history.usageHistoryHint')}</p>
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
              saveItemNoun={t('recordForm.repeatable.saveItemLabels.usageHistory')}
              summary={summary}
            >
              <ReferenceSelect
                id={`rf-uh-usage-${index}`}
                label={t('recordForm.labels.usage')}
                infoKey="recordForm.info.history.usagePurpose"
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
                <label htmlFor={`rf-uh-note-${index}`}>{t('recordForm.labels.noteUsageHistory')}</label>
                <FieldInfoText infoKey="recordForm.info.history.usageManner" />
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
              saveItemNoun={t('recordForm.repeatable.saveItemLabels.objectHistory')}
              summary={summary}
            >
              <ReferenceSelect
                id={`rf-objh-act-type-${index}`}
                label={t('recordForm.labels.activityType')}
                infoKey="recordForm.info.history.objectHistoryActivity"
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
                <label htmlFor={`rf-objh-act-note-${index}`}>{t('recordForm.labels.noteObjectHistoryActivity')}</label>
                <FieldInfoText infoKey="recordForm.info.history.objectHistoryActivityDescription" />
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
              <ReferenceSelect
                id={`rf-objh-cult-${index}`}
                label={t('recordForm.labels.culturalAffinity')}
                infoKey="recordForm.info.history.objectHistoryCulturalAffinity"
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
                <RoledActorRepeatableList
                  rows={rowActors}
                  onChange={(next) => {
                    setObjectHist(
                      objectHist.map((r, i) =>
                        i === index ? { ...r, actor: next.length ? next : undefined } : r,
                      ),
                    )
                  }}
                  idPrefix={`rf-objh-actr-${index}`}
                  disabled={disabled}
                  resolveActorCatalog={resolveActorCatalog}
                  roleLabel={t('recordForm.labels.roledActorRole')}
                  roleInfoKey="recordForm.info.history.objectHistoryActorRole"
                />
              </fieldset>
              <ObjectHistoryTimeList
                dates={rowDates}
                onChange={(next) =>
                  setObjectHist(
                    objectHist.map((r, i) => (i === index ? { ...r, date: next } : r)),
                  )
                }
                idPrefix={`rf-objh-dates-${index}`}
                disabled={disabled}
              />
              <ObjectHistoryPlacesList
                places={rowPlaces}
                onChange={(next) =>
                  setObjectHist(
                    objectHist.map((r, i) => (i === index ? { ...r, place: next } : r)),
                  )
                }
                idPrefix={`rf-objh-pl-${index}`}
                disabled={disabled}
              />
              <fieldset className="record-form-nested-fieldset">
                <legend>{t('recordForm.history.associatedEventLegend')}</legend>
                <p className="record-form-repeatable-hint">{t('recordForm.history.associatedEventHint')}</p>
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
                  infoKey="recordForm.info.history.objectHistoryEventNameType"
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
                <fieldset className="record-form-nested-fieldset">
                  <legend>{t('recordForm.history.eventActorsLegend')}</legend>
                  <RoledActorRepeatableList
                    rows={evActors}
                    onChange={(next) => {
                      setObjectHist(
                        objectHist.map((r, i) =>
                          i === index
                            ? { ...r, event: { ...r.event, actor: next.length ? next : undefined } }
                            : r,
                        ),
                      )
                    }}
                    idPrefix={`rf-objh-ev-a-${index}`}
                    disabled={disabled}
                    resolveActorCatalog={resolveActorCatalog}
                    roleLabel={t('recordForm.labels.roledActorRole')}
                  />
                </fieldset>
                <ObjectHistoryEventTimeList
                  dates={evDates}
                  onChange={(next) =>
                    setObjectHist(
                      objectHist.map((r, i) =>
                        i === index ? { ...r, event: { ...r.event, date: next } } : r,
                      ),
                    )
                  }
                  idPrefix={`rf-objh-evd-${index}`}
                  disabled={disabled}
                />
                <ObjectHistoryEventPlacesList
                  places={evPlaces}
                  onChange={(next) =>
                    setObjectHist(
                      objectHist.map((r, i) =>
                        i === index ? { ...r, event: { ...r.event, place: next } } : r,
                      ),
                    )
                  }
                  idPrefix={`rf-objh-evp-${index}`}
                  disabled={disabled}
                />
              </fieldset>
              <div className="form-group form-group--grow">
                <label htmlFor={`rf-objh-note-${index}`}>{t('recordForm.labels.noteObjectHistory')}</label>
                <FieldInfoText infoKey="recordForm.info.history.objectHistoryNote" />
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
                <FieldInfoText infoKey="recordForm.info.history.objectHistoryComments" />
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
                <FieldInfoText infoKey="recordForm.info.history.objectHistoryRelevance" />
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
})

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
  const actorStore = useActorStore()
  const resolveActorCatalog = (id: number) => actorStore.actorById(id)?.data
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
              saveItemNoun={t('recordForm.repeatable.saveItemLabels.rightsEntry')}
              removeLabel={t('recordForm.rights.removeEntry')}
            >
              <ReferenceSelect
                id={`rf-rights-type-${index}`}
                label={t('recordForm.labels.rightsType')}
                infoKey="recordForm.info.rights.type"
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
                <label htmlFor={`rf-rights-note-${index}`}>{t('recordForm.labels.noteRights')}</label>
                <FieldInfoText infoKey="recordForm.info.rights.entryNote" />
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
              <RightsHoldersList
                holders={holders}
                onChange={setHolders}
                idPrefix={`rf-rights-${index}`}
                disabled={disabled}
                resolveActorCatalog={resolveActorCatalog}
              />
              <DateDetailInputs
                idPrefix={`rf-rights-begin-${index}`}
                flatLayout
                dateLabel={t('recordForm.rights.rightsBeginDateCalendarLabel')}
                infoPrefix="recordForm.info.rights.beginDate"
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
              <DateDetailInputs
                idPrefix={`rf-rights-end-${index}`}
                flatLayout
                dateLabel={t('recordForm.rights.rightsEndDateCalendarLabel')}
                infoPrefix="recordForm.info.rights.endDate"
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
              <div className="form-group">
                <label htmlFor={`rf-rights-ref-${index}`}>{t('recordForm.labels.rightsReferenceNumber')}</label>
                <FieldInfoText infoKey="recordForm.info.rights.referenceNumber" />
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
    !(a.date && dateDetailHasPersistableContent(a.date)) &&
    !(
      ods &&
      (referenceFieldFi(ods.type) || (ods.date && dateDetailHasPersistableContent(ods.date)))
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
      <div className="record-form-access-date-block">
        <DateDetailInputs
          idPrefix="rf-access-date"
          flatLayout
          dateLabel={t('recordForm.access.accessDateLegend')}
          infoPrefix="recordForm.info.access.accessDate"
          value={a.date}
          onChange={(next) => onChange(patchAccess(data, (x) => { x.date = next }))}
          disabled={disabled}
        />
      </div>
      <div className="form-group">
        <label htmlFor="rf-access-note">{t('recordForm.labels.noteAccess')}</label>
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
      <fieldset className="record-form-repeatable-fieldset">
        <legend>{t('recordForm.access.displayStatusLegend')}</legend>
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
                  (next.date && dateDetailHasPersistableContent(next.date))
                x.object_display_status = keep ? next : undefined
              })
            )
          }
          disabled={disabled}
          emptyLabel="—"
        />
        <DateDetailInputs
          idPrefix="rf-access-ods-date"
          flatLayout
          dateLabel={t('recordForm.access.statusDateLegend')}
          infoPrefix="recordForm.info.access.displayStatusDate"
          value={displayStatus.date}
          onChange={(next) =>
            onChange(
              patchAccess(data, (x) => {
                const cur = x.object_display_status ?? {}
                const merged = { ...cur, date: next }
                const keep =
                  referenceFieldFi(merged.type) ||
                  (merged.date && dateDetailHasPersistableContent(merged.date))
                x.object_display_status = keep ? merged : undefined
              })
            )
          }
          disabled={disabled}
        />
      </fieldset>
    </div>
  )
}

function setObjectLocationEntries(data: RecordPayload, entries: ObjectLocation[]): RecordPayload {
  return { ...data, object_location: entries.length ? entries : undefined }
}

function updateObjectLocationEntry(
  data: RecordPayload,
  index: number,
  fn: (o: ObjectLocation) => void,
): RecordPayload {
  const list = [...(data.object_location ?? [])]
  const o = { ...(list[index] ?? {}) }
  fn(o)
  list[index] = o
  return setObjectLocationEntries(data, list)
}

function objectLocationEntrySummary(o: ObjectLocation, t: TFunction): string {
  const id = o.identifier?.trim()
  if (id) return id
  const nameFi = o.location?.name?.fi?.trim()
  if (nameFi) return nameFi
  const nameEn = o.location?.name?.en?.trim()
  if (nameEn) return nameEn
  const typeFi = referenceFieldFi(o.type)
  if (typeFi) return typeFi
  return t('recordForm.location.emptyEntrySummary')
}

export function ObjectLocationFields({ data, onChange, disabled }: Omit<SectionProps, 'errors'>) {
  const { t } = useTranslation()
  const entries = data.object_location ?? []
  const locationCol = useRepeatableCollapsedRows(entries, objectLocationHasPersistableContent)

  const setEntries = (rows: ObjectLocation[]) => {
    onChange(setObjectLocationEntries(data, rows))
  }

  return (
    <div className="record-form-section-fields">
      <fieldset className="record-form-repeatable-fieldset">
        <legend>{t('recordForm.location.entriesLegend')}</legend>
        <p className="record-form-repeatable-hint">{t('recordForm.location.entriesHint')}</p>
        {entries.map((o, index) => {
          const loc = o.location ?? {}
          return (
            <CollapsibleRepeatableRow
              key={index}
              id={`rf-loc-entry-${index}`}
              summary={objectLocationEntrySummary(o, t)}
              collapsed={locationCol.isCollapsed(index)}
              onToggleCollapse={() => locationCol.toggle(index)}
              onRemove={() => setEntries(entries.filter((_, i) => i !== index))}
              disabled={disabled}
              saveItemNoun={t('recordForm.repeatable.saveItemLabels.locationEntry')}
              removeLabel={t('recordForm.location.removeEntry')}
            >
              <div className="form-group">
                <label htmlFor={`rf-loc-id-${index}`}>{t('recordForm.labels.identifier')}</label>
                <FieldInfoText infoKey="recordForm.info.location.identifier" />
                <input
                  id={`rf-loc-id-${index}`}
                  type="text"
                  value={o.identifier ?? ''}
                  onChange={(e) =>
                    onChange(
                      updateObjectLocationEntry(data, index, (x) => {
                        const v = e.target.value
                        x.identifier = v.trim() ? v : undefined
                      }),
                    )
                  }
                  disabled={disabled}
                />
              </div>
              <ReferenceSelect
                id={`rf-loc-type-${index}`}
                className="record-form-object-location-type"
                label={t('recordForm.labels.locationType')}
                allowlist={LOCATION_TYPE_FI}
                valueFi={referenceFieldFi(o.type)}
                onChangeFi={(fi) =>
                  onChange(
                    updateObjectLocationEntry(data, index, (x) => {
                      x.type = referenceFieldToPayload(fi)
                    }),
                  )
                }
                disabled={disabled}
                emptyLabel="—"
              />
              <div className="record-form-object-location-spatial">
                <SpatialFields
                  idPrefix={`rf-loc-${index}-spatial`}
                  nameInputMode="multilingual"
                  includeUndefinedLanguage={false}
                  omitNameGroupLegend
                  nameTypeAfterPlaceNames
                  placeDetailsCollapsible
                  placeDetailsToggleShowLabel={t('recordForm.location.showLocationExtraDetails')}
                  placeDetailsToggleHideLabel={t('recordForm.location.hideLocationExtraDetails')}
                  placeNameFinnishLabel={t('recordForm.location.placeNameFiLabel')}
                  placeNameEnglishLabel={t('recordForm.location.placeNameEnLabel')}
                  value={loc}
                  onChange={(next) =>
                    onChange(
                      updateObjectLocationEntry(data, index, (x) => {
                        x.location = next
                      }),
                    )
                  }
                  disabled={disabled}
                />
              </div>
              <DateDetailInputs
                idPrefix={`rf-loc-date-${index}`}
                flatLayout
                dateLabel={t('recordForm.location.locationDateLegend')}
                infoPrefix="recordForm.info.location.date"
                value={o.date}
                onChange={(next) =>
                  onChange(
                    updateObjectLocationEntry(data, index, (x) => {
                      x.date = next
                    }),
                  )
                }
                disabled={disabled}
              />
              <div className="form-group">
                <label htmlFor={`rf-loc-note-${index}`}>{t('recordForm.labels.noteLocation')}</label>
                <FieldInfoText infoKey="recordForm.info.location.note" />
                <textarea
                  id={`rf-loc-note-${index}`}
                  value={o.note ?? ''}
                  onChange={(e) =>
                    onChange(
                      updateObjectLocationEntry(data, index, (x) => {
                        const v = e.target.value
                        x.note = v.trim() ? v : undefined
                      }),
                    )
                  }
                  rows={3}
                  disabled={disabled}
                />
              </div>
              <ReferenceSelect
                id={`rf-loc-fitness-${index}`}
                label={t('recordForm.labels.locationFitness')}
                infoKey="recordForm.info.location.fitness"
                allowlist={LOCATION_FITNESS_FI}
                valueFi={referenceFieldFi(o.fitness)}
                onChangeFi={(fi) =>
                  onChange(
                    updateObjectLocationEntry(data, index, (x) => {
                      x.fitness = referenceFieldToPayload(fi)
                    }),
                  )
                }
                disabled={disabled}
                emptyLabel="—"
              />
            </CollapsibleRepeatableRow>
          )
        })}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setEntries([...entries, {}])}
          disabled={disabled}
        >
          {t('recordForm.location.addLocationEntry')}
        </button>
      </fieldset>
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
        <label htmlFor="rf-conf-note">{t('recordForm.labels.noteConfidentiality')}</label>
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
        <label htmlFor="rf-conf-usage">{t('recordForm.labels.usageConfidentiality')}</label>
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
