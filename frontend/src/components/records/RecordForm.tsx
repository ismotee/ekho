/**
 * RecordForm Component
 *
 * Sectioned editor / wizard for creating and editing records (domain payload + representative image).
 *
 * Reference: docs/user-stories/03-records.md (US-010, US-011, US-015), docs/design/03-record-management-design.md
 */

import { useState, FormEvent, useEffect, useCallback, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useRecordStore } from '../../stores/recordStore'
import { useCollectionStore } from '../../stores/collectionStore'
import type { Record as ArtRecord } from '../../stores/recordStore'
import type { RecordDataDomainKey, RecordPayload } from '../../types/record'
import {
  emptyRecordPayload,
  getRecordPrimaryLabel,
  getRecordSecondaryLine,
  getRecordCardYearLine,
} from '../../types/record'
import { ImageUpload } from './ImageUpload'
import {
  IdentificationFields,
  AcquisitionFields,
  DescriptionFields,
  HistoryFields,
  RightsFields,
  AccessFields,
  ObjectLocationFields,
  ConfidentialityFields,
  type RecordFormSectionErrors,
} from './RecordFormSections'
import { compactRecordPayloadForSave } from '../../lib/compactRecordPayloadForSave'
import { normalizeRecordPayloadForForm } from '../../lib/recordPayloadNormalize'
import { firstTitleValueTrimmed, identificationTitlesAsList } from '../../lib/identificationTitles'
import { temporalNote } from '../../lib/temporalPayload'
import './Records.css'

interface RecordFormProps {
  collectionId?: number
  record?: ArtRecord | null
  onSave?: (data: { data: RecordPayload; representative_image?: File }) => Promise<void>
}

function clonePayload(data: RecordPayload | undefined): RecordPayload {
  if (!data || Object.keys(data).length === 0) return emptyRecordPayload()
  try {
    return normalizeRecordPayloadForForm(structuredClone(data) as RecordPayload)
  } catch {
    return normalizeRecordPayloadForForm(JSON.parse(JSON.stringify(data)) as RecordPayload)
  }
}

function domainSectionHasContent(key: RecordDataDomainKey, data: RecordPayload): boolean {
  const v = data[key]
  if (v === null || v === undefined) return false
  if (Array.isArray(v)) return v.length > 0
  if (typeof v === 'object' && Object.keys(v).length === 0) return false
  return true
}

function validateDraft(
  data: RecordPayload,
  t: TFunction,
): {
  ok: boolean
  sectionErrors: RecordFormSectionErrors
  fieldErrors: Record<string, string>
} {
  const fieldErrors: Record<string, string> = {}
  const sectionErrors: RecordFormSectionErrors = {}

  const title = firstTitleValueTrimmed(data.identification_details?.title)
  const objectNumber = data.identification_details?.object_number?.trim() ?? ''

  if (!title && !objectNumber) {
    sectionErrors.identification = t('recordForm.validation.identificationRequired')
  }

  identificationTitlesAsList(data.identification_details?.title).forEach((titleRow, i) => {
    const v = titleRow.value?.trim() ?? ''
    if (v.length > 200) {
      fieldErrors[`title_${i}`] = t('recordForm.validation.titleMaxLength')
    }
  })
  if (objectNumber.length > 200) {
    fieldErrors.object_number = t('recordForm.validation.objectNumberMaxLength')
  }

  const dates = data.aquisition_details?.date ?? []
  dates.forEach((tempRow, i) => {
    const strings = [temporalNote(tempRow), tempRow.earliest?.single?.trim(), tempRow.latest?.single?.trim()].filter(
      (s): s is string => !!s?.trim(),
    )
    for (const text of strings) {
      if (/^\d{4}$/.test(text)) {
        const y = Number(text)
        if (y < 1000 || y > 2100) {
          fieldErrors[`aquisition_date_${i}`] = t('recordForm.validation.yearRange')
        }
      }
    }
  })

  const ok = Object.keys(sectionErrors).length === 0 && Object.keys(fieldErrors).length === 0
  return { ok, sectionErrors, fieldErrors }
}

export const RecordForm = observer(({ collectionId: propsCollectionId, record: propsRecord, onSave }: RecordFormProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { collectionId: urlCollectionId, id: recordId } = useParams<{ collectionId?: string; id?: string }>()
  const recordStore = useRecordStore()
  const collectionStore = useCollectionStore()
  const collectionId = propsCollectionId || (urlCollectionId ? Number(urlCollectionId) : undefined)

  const isEditMode = !!recordId || !!propsRecord

  const domainSteps = useMemo(
    () =>
      [
        { domainKey: 'identification_details' as const, heading: t('recordForm.wizard.stepIdentification') },
        { domainKey: 'aquisition_details' as const, heading: t('recordForm.wizard.stepAcquisition') },
        { domainKey: 'description' as const, heading: t('recordForm.wizard.stepDescription') },
        { domainKey: 'history' as const, heading: t('recordForm.wizard.stepHistory') },
        { domainKey: 'rights' as const, heading: t('recordForm.wizard.stepRights') },
        { domainKey: 'access' as const, heading: t('recordForm.wizard.stepAccess') },
        { domainKey: 'object_location' as const, heading: t('recordForm.wizard.stepObjectLocation') },
        { domainKey: 'confidentiality' as const, heading: t('recordForm.wizard.stepConfidentiality') },
      ] satisfies { domainKey: RecordDataDomainKey; heading: string }[],
    [t],
  )
  const reviewStepIndex = domainSteps.length

  const [draft, setDraft] = useState<RecordPayload>(() => emptyRecordPayload())
  const [activeStep, setActiveStep] = useState(0)
  const [image, setImage] = useState<File | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | undefined>(undefined)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sectionErrors, setSectionErrors] = useState<RecordFormSectionErrors>({})

  useEffect(() => {
    if (recordId) {
      recordStore.fetchRecord(Number(recordId))
    } else {
      recordStore.currentRecord = null
    }
  }, [recordId])

  useEffect(() => {
    if (isEditMode) {
      const currentRecord = propsRecord || recordStore.currentRecord
      if (currentRecord) {
        setDraft(clonePayload(currentRecord.data))
        setExistingImageUrl(currentRecord.representative_image || undefined)
        if (!collectionId && currentRecord.collection) {
          collectionStore.fetchCollection(currentRecord.collection)
        }
      }
    } else {
      setDraft(emptyRecordPayload())
      setImage(null)
      setExistingImageUrl(undefined)
      setErrors({})
      setSectionErrors({})
      setActiveStep(0)
    }
  }, [isEditMode, propsRecord, recordStore.currentRecord?.id, recordStore.currentRecord?.updated_at])

  useEffect(() => {
    if (collectionId) {
      collectionStore.fetchCollection(collectionId)
    } else if (recordStore.currentRecord?.collection) {
      collectionStore.fetchCollection(recordStore.currentRecord.collection)
    }
  }, [collectionId, recordStore.currentRecord?.collection])

  const actualCollectionId = collectionId || recordStore.currentRecord?.collection
  const collection = collectionStore.currentCollection ||
    (actualCollectionId && collectionStore.collections.find((c) => c.id === actualCollectionId)) ||
    null
  const isDisabled = collection?.is_closed || false

  const reviewSummary = useMemo(() => {
    return {
      primary: getRecordPrimaryLabel(draft),
      secondary: getRecordSecondaryLine(draft),
      year: getRecordCardYearLine(draft),
    }
  }, [draft])

  const clearValidation = useCallback(() => {
    setErrors({})
    setSectionErrors({})
  }, [])

  const submitRecord = async (): Promise<void> => {
    if (isDisabled) return

    if (!isEditMode && !actualCollectionId) {
      setErrors({ general: t('recordForm.validation.collectionIdRequired') })
      return
    }

    const validation = validateDraft(draft, t)
    setSectionErrors(validation.sectionErrors)
    setErrors(validation.fieldErrors)

    if (!validation.ok) {
      if (validation.sectionErrors.identification) {
        setActiveStep(0)
      } else if (Object.keys(validation.fieldErrors).some((k) => /^title_\d+$/.test(k))) {
        setActiveStep(0)
      } else if (Object.keys(validation.fieldErrors).some((k) => k.startsWith('aquisition_date_'))) {
        setActiveStep(1)
      }
      return
    }

    try {
      const savePayload: { data: RecordPayload; representative_image?: File } = {
        data: compactRecordPayloadForSave(draft),
        ...(image ? { representative_image: image } : {}),
      }

      if (onSave) {
        await onSave(savePayload)
      } else if (isEditMode && recordId) {
        await recordStore.updateRecord(Number(recordId), savePayload)
        navigate(`/records/${recordId}`)
      } else if (actualCollectionId) {
        await recordStore.createRecord(actualCollectionId, savePayload)
        navigate(`/collections/${actualCollectionId}`)
      } else {
        throw new Error('Collection ID is required to create a record')
      }
    } catch (error: unknown) {
      const apiError = error as { field_errors?: Record<string, string | string[]> }
      const newErrors: Record<string, string> = {}

      if (apiError?.field_errors) {
        Object.entries(apiError.field_errors).forEach(([key, value]) => {
          newErrors[key] = Array.isArray(value) ? String(value[0]) : String(value)
        })
      }

      setErrors(newErrors)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    void submitRecord()
  }

  const goNext = () => {
    clearValidation()
    setActiveStep((s) => Math.min(s + 1, reviewStepIndex))
  }

  const goBack = () => {
    clearValidation()
    setActiveStep((s) => Math.max(s - 1, 0))
  }

  const jumpToStep = (index: number) => {
    clearValidation()
    setActiveStep(Math.max(0, Math.min(index, reviewStepIndex)))
  }

  const identificationSectionErrors: RecordFormSectionErrors = {
    identification: sectionErrors.identification || errors.identification,
  }

  const formTitle = isEditMode ? t('recordForm.wizard.titleEdit') : t('recordForm.wizard.titleCreate')

  return (
    <form onSubmit={handleSubmit} className="record-form record-form-wizard" noValidate>
      <h2 className="record-form-wizard-title">{formTitle}</h2>

      {(errors.general ||
        Object.keys(errors).some(
          (k) => k !== 'identification' && k !== 'object_number' && !/^title_\d+$/.test(k)
        )) && (
        <div className="form-error-summary" role="alert" aria-live="polite">
          {errors.general && <p className="field-error">{errors.general}</p>}
          <ul className="form-error-summary-list">
            {Object.entries(errors)
              .filter(
                ([k]) =>
                  k !== 'general' && k !== 'identification' && k !== 'object_number' && !/^title_\d+$/.test(k)
              )
              .map(([k, msg]) => (
                <li key={k}>
                  <strong>{k}</strong>: {msg}
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className="record-form-wizard-layout">
        <nav className="record-form-wizard-nav" aria-label={t('recordForm.wizard.formSectionsAria')}>
          <ol className="record-form-wizard-steps">
            {domainSteps.map((step, index) => {
              const filled = domainSectionHasContent(step.domainKey, draft)
              const isCurrent = activeStep === index
              return (
                <li key={step.domainKey}>
                  <button
                    type="button"
                    className={`record-form-wizard-step${isCurrent ? ' record-form-wizard-step--current' : ''}`}
                    onClick={() => jumpToStep(index)}
                    disabled={isDisabled}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    <span className="record-form-wizard-step-label">{step.heading}</span>
                    {filled ? (
                      <span className="record-form-wizard-step-badge" aria-hidden>
                        {t('recordForm.wizard.stepBadgeHasData')}
                      </span>
                    ) : (
                      <span className="record-form-wizard-step-badge record-form-wizard-step-badge--empty" aria-hidden>
                        {t('recordForm.wizard.stepBadgeEmpty')}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
            <li key="review">
              <button
                type="button"
                className={`record-form-wizard-step${activeStep === reviewStepIndex ? ' record-form-wizard-step--current' : ''}`}
                onClick={() => jumpToStep(reviewStepIndex)}
                disabled={isDisabled}
                aria-current={activeStep === reviewStepIndex ? 'step' : undefined}
              >
                <span className="record-form-wizard-step-label">{t('recordForm.wizard.review')}</span>
              </button>
            </li>
          </ol>
        </nav>

        <div className="record-form-wizard-panel">
          {activeStep < reviewStepIndex && (
            <>
              <h3 className="record-form-panel-heading">{domainSteps[activeStep].heading}</h3>
              {activeStep === 0 && (
                <>
                  <div className="record-form-image-block">
                    <ImageUpload
                      label={t('recordForm.wizard.representativeImageLabel')}
                      inputId="record-representative-image"
                      image={image}
                      onImageChange={setImage}
                      disabled={isDisabled}
                      existingImageUrl={existingImageUrl}
                    />
                  </div>
                  <IdentificationFields
                    data={draft}
                    onChange={setDraft}
                    disabled={isDisabled}
                    errors={identificationSectionErrors}
                  />
                  {Object.keys(errors)
                    .filter((k) => /^title_\d+$/.test(k))
                    .map((k) => (
                      <p key={k} className="field-error" role="alert">
                        {errors[k]}
                      </p>
                    ))}
                  {errors.object_number && <span className="field-error">{errors.object_number}</span>}
                </>
              )}
              {activeStep === 1 && <AcquisitionFields data={draft} onChange={setDraft} disabled={isDisabled} />}
              {activeStep === 1 &&
                Object.keys(errors)
                  .filter((k) => k.startsWith('aquisition_date_'))
                  .map((k) => (
                    <p key={k} className="field-error" role="alert">
                      {errors[k]}
                    </p>
                  ))}
              {activeStep === 2 && <DescriptionFields data={draft} onChange={setDraft} disabled={isDisabled} />}
              {activeStep === 3 && <HistoryFields data={draft} onChange={setDraft} disabled={isDisabled} />}
              {activeStep === 4 && <RightsFields data={draft} onChange={setDraft} disabled={isDisabled} />}
              {activeStep === 5 && <AccessFields data={draft} onChange={setDraft} disabled={isDisabled} />}
              {activeStep === 6 && <ObjectLocationFields data={draft} onChange={setDraft} disabled={isDisabled} />}
              {activeStep === 7 && <ConfidentialityFields data={draft} onChange={setDraft} disabled={isDisabled} />}
            </>
          )}

          {activeStep === reviewStepIndex && (
            <div className="record-form-review">
              <h3 className="record-form-panel-heading">{t('recordForm.wizard.review')}</h3>
              <p className="record-form-review-summary">
                <strong>{t('recordForm.wizard.reviewPrimaryLabel')}</strong> {reviewSummary.primary}
              </p>
              {reviewSummary.secondary && (
                <p className="record-form-review-summary">
                  <strong>{t('recordForm.wizard.reviewSecondary')}</strong> {reviewSummary.secondary}
                </p>
              )}
              {reviewSummary.year && (
                <p className="record-form-review-summary">
                  <strong>{t('recordForm.wizard.reviewYear')}</strong> {reviewSummary.year}
                </p>
              )}
              <ul className="record-form-review-checklist" aria-label={t('recordForm.wizard.reviewChecklistAria')}>
                {domainSteps.map(({ domainKey, heading }, index) => (
                  <li key={domainKey}>
                    <button type="button" className="record-form-review-jump" onClick={() => jumpToStep(index)}>
                      {heading}
                    </button>
                    :{' '}
                    {domainSectionHasContent(domainKey, draft)
                      ? t('recordForm.wizard.reviewSectionHasData')
                      : t('recordForm.wizard.reviewSectionEmpty')}
                  </li>
                ))}
              </ul>
              <p className="record-form-review-hint">{t('recordForm.wizard.reviewHint')}</p>
            </div>
          )}

          <div className="record-form-wizard-footer">
            <div className="form-actions record-form-wizard-actions">
              <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
                {t('recordForm.wizard.cancel')}
              </button>
              {activeStep > 0 && (
                <button type="button" onClick={goBack} className="btn btn-secondary" disabled={isDisabled}>
                  {t('recordForm.wizard.back')}
                </button>
              )}
              {activeStep < reviewStepIndex && (
                <button type="button" onClick={goNext} className="btn btn-primary" disabled={isDisabled}>
                  {t('recordForm.wizard.next')}
                </button>
              )}
              <button
                type={activeStep === reviewStepIndex ? 'submit' : 'button'}
                onClick={activeStep === reviewStepIndex ? undefined : () => void submitRecord()}
                className="btn btn-primary"
                disabled={isDisabled || recordStore.loading}
              >
                {recordStore.loading
                  ? t('recordForm.wizard.loadingSave')
                  : isEditMode
                    ? t('recordForm.wizard.saveChanges')
                    : t('recordForm.wizard.createRecord')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
})

RecordForm.displayName = 'RecordForm'
