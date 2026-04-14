/**
 * RecordForm Component
 *
 * Sectioned editor / wizard for creating and editing records (domain payload + record images).
 *
 * Reference: docs/user-stories/03-records.md (US-010, US-011, US-015), docs/design/03-record-management-design.md
 */

import { useState, FormEvent, useEffect, useCallback, useMemo, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useRecordStore } from '../../stores/recordStore'
import { useCollectionStore } from '../../stores/collectionStore'
import { useAuthStore } from '../../stores/authStore'
import type { Record as ArtRecord } from '../../stores/recordStore'
import type { RecordDataDomainKey, RecordPayload } from '../../types/record'
import type { IdentificationDetails } from '../../types/record/identification'
import {
  emptyRecordPayload,
  getRecordPrimaryLabel,
  getRecordSecondaryLine,
  getRecordCardYearLine,
} from '../../types/record'
import { RecordMultiImageSection, type PendingRecordImage } from './RecordMultiImageSection'
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
import { referenceFieldFi, referenceFieldToPayload } from '../../lib/referenceField'
import { normalizeRecordPayloadForForm } from '../../lib/recordPayloadNormalize'
import { firstTitleValueTrimmed, identificationTitlesAsList } from '../../lib/identificationTitles'
import { temporalNote } from '../../lib/temporalPayload'
import type { Temporal } from '../../types/record/common'
import './Records.css'

interface RecordFormProps {
  collectionId?: number
  record?: ArtRecord | null
  onSave?: (data: { data: RecordPayload; representative_image?: File; pendingRecordImages?: PendingRecordImage[] }) => Promise<void>
}

function clonePayload(data: RecordPayload | undefined): RecordPayload {
  if (!data || Object.keys(data).length === 0) return emptyRecordPayload()
  try {
    return normalizeRecordPayloadForForm(structuredClone(data) as RecordPayload)
  } catch {
    return normalizeRecordPayloadForForm(JSON.parse(JSON.stringify(data)) as RecordPayload)
  }
}

/** Objektityyppi + lukumäärä defaults for new records. */
function createModeDefaultPayload(): RecordPayload {
  return {
    identification_details: {
      object_type: referenceFieldToPayload('taideteos'),
      number_of_objects: 1,
    },
  }
}

/** When editing, ensure objektityyppi defaults if the stored payload omitted it. */
function mergeIdentificationEditDefaults(data: RecordPayload): RecordPayload {
  const id: IdentificationDetails = { ...(data.identification_details ?? {}) }
  let changed = false
  if (!referenceFieldFi(id.object_type)) {
    id.object_type = referenceFieldToPayload('taideteos')
    changed = true
  }
  if (id.number_of_objects == null || !Number.isFinite(Number(id.number_of_objects))) {
    id.number_of_objects = 1
    changed = true
  }
  if (!changed) return data
  return { ...data, identification_details: id }
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
  formCollectionId: number | undefined,
): {
  ok: boolean
  sectionErrors: RecordFormSectionErrors
  fieldErrors: Record<string, string>
} {
  const fieldErrors: Record<string, string> = {}
  const sectionErrors: RecordFormSectionErrors = {}

  if (formCollectionId == null || !Number.isFinite(Number(formCollectionId))) {
    fieldErrors.collection = t('recordForm.validation.collectionRequired')
  }

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

  const checkYearInStrings = (strings: (string | undefined)[], fieldKey: string) => {
    for (const text of strings) {
      const s = text?.trim()
      if (!s) continue
      if (/^\d{4}$/.test(s)) {
        const y = Number(s)
        if (y < 1000 || y > 2100) {
          fieldErrors[fieldKey] = t('recordForm.validation.yearRange')
        }
      }
    }
  }

  const acqTime = data.aquisition_details?.acquisition_time
  if (acqTime) {
    checkYearInStrings([acqTime.single, acqTime.text], 'aquisition_acquisition_time')
  }

  const dates = data.aquisition_details?.date ?? []
  dates.forEach((tempRow, i) => {
    const r = tempRow as Temporal
    checkYearInStrings([r.earliest?.single, r.latest?.single, temporalNote(r)], `aquisition_date_${i}`)
  })

  const ok = Object.keys(sectionErrors).length === 0 && Object.keys(fieldErrors).length === 0
  return { ok, sectionErrors, fieldErrors }
}

/** Messages for the wizard footer validation block (deduped by exact text). */
function collectWizardFooterValidationMessages(
  fieldErrors: Record<string, string>,
  sectionErrs: RecordFormSectionErrors,
): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  const add = (msg: string | undefined) => {
    const m = msg?.trim()
    if (!m || seen.has(m)) return
    seen.add(m)
    out.push(m)
  }
  add(sectionErrs.identification)
  add(sectionErrs.collection)
  for (const key of Object.keys(fieldErrors).sort()) {
    add(fieldErrors[key])
  }
  return out
}

export const RecordForm = observer(({ collectionId: propsCollectionId, record: propsRecord, onSave }: RecordFormProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { collectionId: urlCollectionId, id: recordId } = useParams<{ collectionId?: string; id?: string }>()
  const recordStore = useRecordStore()
  const collectionStore = useCollectionStore()
  const authStore = useAuthStore()
  const collectionId: number | undefined =
    propsCollectionId ??
    (urlCollectionId != null &&
    String(urlCollectionId).trim() !== '' &&
    Number.isFinite(Number(urlCollectionId))
      ? Math.floor(Number(urlCollectionId))
      : undefined)

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

  const [draft, setDraft] = useState<RecordPayload>(() =>
    isEditMode ? emptyRecordPayload() : createModeDefaultPayload(),
  )
  const [activeStep, setActiveStep] = useState(0)
  const [pendingImages, setPendingImages] = useState<PendingRecordImage[]>([])
  const [imagesUploading, setImagesUploading] = useState(false)
  const imageErrorHandledRef = useRef(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sectionErrors, setSectionErrors] = useState<RecordFormSectionErrors>({})
  /** API record `collection` FK — not part of `data.identification_details`. */
  const [formCollectionId, setFormCollectionId] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (recordId) {
      recordStore.fetchRecord(Number(recordId))
    } else {
      recordStore.currentRecord = null
    }
  }, [recordId])

  useEffect(() => {
    if (!isEditMode) return
    const currentRecord = propsRecord || recordStore.currentRecord
    if (currentRecord) {
      setDraft(mergeIdentificationEditDefaults(clonePayload(currentRecord.data)))
      setFormCollectionId(currentRecord.collection)
      if (!collectionId && currentRecord.collection) {
        collectionStore.fetchCollection(currentRecord.collection)
      }
    }
  }, [isEditMode, propsRecord, recordStore.currentRecord?.id, recordStore.currentRecord?.updated_at, collectionId])

  useEffect(() => {
    const msg = (location.state as { imageError?: string } | null)?.imageError
    if (!msg) {
      imageErrorHandledRef.current = false
      return
    }
    if (imageErrorHandledRef.current) return
    imageErrorHandledRef.current = true
    setErrors((prev) => ({ ...prev, general: msg }))
    navigate(location.pathname + location.search, { replace: true, state: {} })
  }, [location.state, location.pathname, location.search, navigate])

  /** Reset create form when entering create mode or changing URL collection — not on every currentRecord update (that wiped draft after collection default was applied). */
  useEffect(() => {
    if (isEditMode) return
    setDraft(createModeDefaultPayload())
    setFormCollectionId(collectionId)
    setPendingImages([])
    setErrors({})
    setSectionErrors({})
    setActiveStep(0)
  }, [isEditMode, collectionId])

  useEffect(() => {
    if (formCollectionId) {
      collectionStore.fetchCollection(formCollectionId)
    } else if (collectionId) {
      collectionStore.fetchCollection(collectionId)
    } else if (recordStore.currentRecord?.collection) {
      collectionStore.fetchCollection(recordStore.currentRecord.collection)
    }
  }, [formCollectionId, collectionId, recordStore.currentRecord?.collection, collectionStore])

  const collection =
    collectionStore.currentCollection ||
    (formCollectionId != null && collectionStore.collections.find((c) => c.id === formCollectionId)) ||
    null
  const isDisabled = collection?.is_closed || false
  const canManageImages =
    !!authStore.user &&
    !!collection &&
    authStore.user.id === collection.owner.id &&
    authStore.isAuthenticated

  const serverImages = (propsRecord ?? recordStore.currentRecord)?.images ?? []

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

  const scrollWizardToTop = useCallback(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }, [])

  const submitRecord = async (): Promise<void> => {
    if (isDisabled) return

    const validation = validateDraft(draft, t, formCollectionId)
    setSectionErrors(validation.sectionErrors)
    setErrors(validation.fieldErrors)

    if (!validation.ok) {
      if (validation.fieldErrors.collection || validation.sectionErrors.identification) {
        setActiveStep(0)
      } else if (Object.keys(validation.fieldErrors).some((k) => /^title_\d+$/.test(k))) {
        setActiveStep(0)
      } else if (
        Object.keys(validation.fieldErrors).some(
          (k) => k.startsWith('aquisition_date_') || k === 'aquisition_acquisition_time',
        )
      ) {
        setActiveStep(1)
      }
      return
    }

    try {
      const savePayload: {
        data: RecordPayload
        representative_image?: File
        pendingRecordImages?: PendingRecordImage[]
      } = {
        data: compactRecordPayloadForSave(draft),
        ...(pendingImages.length > 0 ? { pendingRecordImages: pendingImages } : {}),
      }

      if (onSave) {
        await onSave(savePayload)
        setPendingImages([])
      } else if (isEditMode && recordId) {
        const rid = Number(recordId)
        await recordStore.updateRecord(rid, {
          data: savePayload.data,
          ...(formCollectionId != null ? { collection: formCollectionId } : {}),
        })
        if (pendingImages.length > 0 && canManageImages) {
          setImagesUploading(true)
          try {
            for (const p of pendingImages) {
              await recordStore.createRecordImage(rid, {
                file: p.file,
                role: p.role,
                context: p.context,
                is_primary: p.is_primary,
              })
            }
            setPendingImages([])
            await recordStore.fetchRecord(rid)
          } catch {
            setErrors((prev) => ({ ...prev, general: t('recordForm.recordImages.uploadError') }))
            setImagesUploading(false)
            await recordStore.fetchRecord(rid)
            return
          }
          setImagesUploading(false)
        }
        navigate(`/records/${recordId}`)
      } else if (formCollectionId != null) {
        const created = await recordStore.createRecord(formCollectionId, {
          data: savePayload.data,
        })
        if (pendingImages.length > 0 && canManageImages) {
          setImagesUploading(true)
          try {
            for (const p of pendingImages) {
              await recordStore.createRecordImage(created.id, {
                file: p.file,
                role: p.role,
                context: p.context,
                is_primary: p.is_primary,
              })
            }
            setPendingImages([])
          } catch {
            setImagesUploading(false)
            navigate(`/records/${created.id}/edit`, {
              replace: true,
              state: { imageError: t('recordForm.recordImages.uploadError') },
            })
            return
          }
          setImagesUploading(false)
        }
        navigate(`/collections/${formCollectionId}`)
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
    if (activeStep === 0) {
      const validation = validateDraft(draft, t, formCollectionId)
      setSectionErrors(validation.sectionErrors)
      setErrors(validation.fieldErrors)
      if (!validation.ok) return
    }
    clearValidation()
    setActiveStep((s) => Math.min(s + 1, reviewStepIndex))
    scrollWizardToTop()
  }

  const goBack = () => {
    clearValidation()
    setActiveStep((s) => Math.max(s - 1, 0))
    scrollWizardToTop()
  }

  const jumpToStep = (index: number) => {
    clearValidation()
    setActiveStep(Math.max(0, Math.min(index, reviewStepIndex)))
  }

  const identificationSectionErrors: RecordFormSectionErrors = {
    identification: sectionErrors.identification || errors.identification,
    collection: sectionErrors.collection || errors.collection,
  }

  const wizardFooterValidationMessages = useMemo(
    () => collectWizardFooterValidationMessages(errors, sectionErrors),
    [errors, sectionErrors],
  )

  const formTitle = isEditMode ? t('recordForm.wizard.titleEdit') : t('recordForm.wizard.titleCreate')

  return (
    <form onSubmit={handleSubmit} className="record-form record-form-wizard" noValidate>
      <h2 className="record-form-wizard-title">{formTitle}</h2>

      {(errors.general ||
        Object.keys(errors).some(
          (k) =>
            k !== 'identification' &&
            k !== 'object_number' &&
            k !== 'collection' &&
            !/^title_\d+$/.test(k),
        )) && (
        <div className="form-error-summary" role="alert" aria-live="polite">
          {errors.general && <p className="field-error">{errors.general}</p>}
          <ul className="form-error-summary-list">
            {Object.entries(errors)
              .filter(
                ([k]) =>
                  k !== 'general' &&
                  k !== 'identification' &&
                  k !== 'object_number' &&
                  k !== 'collection' &&
                  !/^title_\d+$/.test(k),
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
                  <IdentificationFields
                    data={draft}
                    onChange={setDraft}
                    disabled={isDisabled}
                    errors={identificationSectionErrors}
                    recordCollectionId={formCollectionId}
                    onRecordCollectionChange={(id) => {
                      setFormCollectionId(id)
                      setErrors((prev) => {
                        if (!prev.collection) return prev
                        const { collection: _c, ...rest } = prev
                        return rest
                      })
                    }}
                  />
                  {Object.keys(errors)
                    .filter((k) => /^title_\d+$/.test(k))
                    .map((k) => (
                      <p key={k} className="field-error" role="alert">
                        {errors[k]}
                      </p>
                    ))}
                  {errors.object_number && <span className="field-error">{errors.object_number}</span>}
                  <div className="record-form-image-block">
                    <RecordMultiImageSection
                      disabled={isDisabled}
                      canManageImages={canManageImages}
                      recordId={isEditMode && recordId ? Number(recordId) : undefined}
                      serverImages={serverImages}
                      pendingImages={pendingImages}
                      onPendingChange={setPendingImages}
                    />
                  </div>
                </>
              )}
              {activeStep === 1 && <AcquisitionFields data={draft} onChange={setDraft} disabled={isDisabled} />}
              {activeStep === 1 &&
                Object.keys(errors)
                  .filter((k) => k.startsWith('aquisition_date_') || k === 'aquisition_acquisition_time')
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
                    {domainSectionHasContent(domainKey, draft) ? (
                      <span className="record-form-wizard-step-badge">{t('recordForm.wizard.reviewSectionHasData')}</span>
                    ) : (
                      <span className="record-form-wizard-step-badge record-form-wizard-step-badge--empty">
                        {t('recordForm.wizard.reviewSectionEmpty')}
                      </span>
                    )}
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
                <>
                  <button type="button" onClick={goNext} className="btn btn-primary" disabled={isDisabled}>
                    {t('recordForm.wizard.next')}
                  </button>
                  <button
                    type="button"
                    className="record-form-wizard-to-review"
                    onClick={() => {
                      jumpToStep(reviewStepIndex)
                      scrollWizardToTop()
                    }}
                    disabled={isDisabled}
                  >
                    {t('recordForm.wizard.reviewRecord')}
                  </button>
                </>
              )}
              {activeStep === reviewStepIndex && (
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isDisabled || recordStore.loading || imagesUploading}
                >
                  {recordStore.loading || imagesUploading
                    ? t('recordForm.wizard.loadingSave')
                    : isEditMode
                      ? t('recordForm.wizard.saveChanges')
                      : t('recordForm.wizard.createRecord')}
                </button>
              )}
            </div>
            {wizardFooterValidationMessages.length > 0 && (
              <div
                className="record-form-wizard-validation-bottom form-error-summary"
                role="alert"
                aria-live="polite"
              >
                <p className="record-form-wizard-validation-bottom-heading">
                  {t('recordForm.wizard.validationBottomHeading')}
                </p>
                <ul className="form-error-summary-list record-form-wizard-validation-bottom-list">
                  {wizardFooterValidationMessages.map((msg, idx) => (
                    <li key={`${idx}-${msg.slice(0, 48)}`}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  )
})

RecordForm.displayName = 'RecordForm'
