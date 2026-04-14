/**
 * CollectionForm Component
 * 
 * Form for creating and editing collections.
 * 
 * Reference: docs/user-stories/02-collections.md (US-005, US-006), docs/design/02-collection-management-design.md
 */

import { useState, FormEvent, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCollectionStore } from '../../stores/collectionStore'
import { Collection } from '../../stores/collectionStore'
import type { ActorField } from '../../types/record/actor'
import { ActorRefSelect } from '../records/ActorRefSelect'
import './Collections.css'

interface CollectionFormProps {
  collection?: Collection | null
  onSave?: (data: {
    name: string
    description?: string
    responsible_department?: string
    owning_organization?: ActorField | null
  }) => Promise<void>
}

export const CollectionForm = observer(({ collection: propsCollection, onSave }: CollectionFormProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const collectionStore = useCollectionStore()
  const collection = propsCollection || (id ? collectionStore.currentCollection : null)
  const [name, setName] = useState(collection?.name || '')
  const [description, setDescription] = useState(collection?.description || '')
  const [responsibleDepartment, setResponsibleDepartment] = useState(
    collection?.responsible_department || ''
  )
  const [owningOrganization, setOwningOrganization] = useState<ActorField | undefined>(
    collection?.owning_organization ?? undefined
  )
  const [errors, setErrors] = useState<{
    name?: string
    description?: string
    responsible_department?: string
    owning_organization?: string
  }>({})
  const isEditMode = !!id || !!collection

  useEffect(() => {
    if (id && !collection) {
      collectionStore.fetchCollection(Number(id))
    }
  }, [id])

  useEffect(() => {
    if (collection) {
      setName(collection.name)
      setDescription(collection.description || '')
      setResponsibleDepartment(collection.responsible_department || '')
      setOwningOrganization(collection.owning_organization ?? undefined)
    }
  }, [collection])

  const isDisabled = collection?.is_closed || false
  const detailIdForNav = id ?? (collection ? String(collection.id) : undefined)
  const exitPath = isEditMode && detailIdForNav ? `/collections/${detailIdForNav}` : '/collections'

  const validate = (): boolean => {
    const newErrors: typeof errors = {}
    
    if (!name.trim()) {
      newErrors.name = t('collections.validation.nameRequired')
    } else if (name.length > 200) {
      newErrors.name = t('collections.validation.nameMaxLength')
    }

    if (description && description.length > 1000) {
      newErrors.description = t('collections.validation.descriptionMaxLength')
    }

    if (responsibleDepartment.length > 500) {
      newErrors.responsible_department = t('collections.validation.responsibleDepartmentMaxLength')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (isDisabled) {
      return
    }

    if (!validate()) {
      return
    }

    try {
      const rd = responsibleDepartment.trim()
      const payload = {
        name,
        description,
        responsible_department: rd || undefined,
        owning_organization: owningOrganization ?? null,
      }
      if (onSave) {
        await onSave(payload)
      } else if (isEditMode && collection && id) {
        await collectionStore.updateCollection(Number(id), payload)
      } else {
        const created = await collectionStore.createCollection(payload)
        navigate(`/collections/${created.id}`)
        return
      }

      navigate(exitPath)
    } catch (error: any) {
      const apiError = error as any
      const newErrors: typeof errors = {}
      
      if (apiError?.field_errors?.name) {
        newErrors.name = apiError.field_errors.name[0]
      }
      if (apiError?.field_errors?.description) {
        newErrors.description = apiError.field_errors.description[0]
      }
      if (apiError?.field_errors?.responsible_department) {
        newErrors.responsible_department = apiError.field_errors.responsible_department[0]
      }
      if (apiError?.field_errors?.owning_organization) {
        newErrors.owning_organization = apiError.field_errors.owning_organization[0]
      }

      setErrors(newErrors)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="collection-form" noValidate>
      <h2>{isEditMode ? t('collections.formEditTitle') : t('collections.formCreateTitle')}</h2>

      <div className="form-group">
        <label htmlFor="collection-name">
          {t('collections.nameLabel')} <span aria-hidden="true">*</span>
        </label>
        <input
          id="collection-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={200}
          disabled={isDisabled}
          aria-invalid={!!errors.name}
        />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="collection-description">{t('collections.descriptionLabel')}</label>
        <p className="form-hint form-hint--multiline" id="collection-description-hint">
          {t('collections.descriptionHelp')}
        </p>
        <textarea
          id="collection-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          disabled={isDisabled}
          rows={4}
          aria-invalid={!!errors.description}
          aria-describedby="collection-description-hint"
        />
        {errors.description && <span className="field-error">{errors.description}</span>}
      </div>

      <ActorRefSelect
        id="collection-owning-organization"
        label={t('collections.owningOrganization')}
        value={owningOrganization}
        onChange={(next) => setOwningOrganization(next)}
        disabled={isDisabled}
        infoKey="collections.owningOrganizationHelp"
      />
      {errors.owning_organization && (
        <span className="field-error">{errors.owning_organization}</span>
      )}

      <div className="form-group">
        <label htmlFor="collection-responsible-department">{t('collections.responsibleDepartment')}</label>
        <p className="form-hint" id="collection-responsible-department-hint">
          {t('collections.responsibleDepartmentHelp')}
        </p>
        <input
          id="collection-responsible-department"
          type="text"
          value={responsibleDepartment}
          onChange={(e) => setResponsibleDepartment(e.target.value)}
          maxLength={500}
          disabled={isDisabled}
          aria-invalid={!!errors.responsible_department}
          aria-describedby="collection-responsible-department-hint"
        />
        {errors.responsible_department && (
          <span className="field-error">{errors.responsible_department}</span>
        )}
      </div>

      <div className="form-actions">
        <button type="button" onClick={() => navigate(exitPath)} className="btn btn-secondary">
          {t('collections.cancel')}
        </button>
        <button type="submit" className="btn btn-primary" disabled={isDisabled || collectionStore.loading}>
          {collectionStore.loading
            ? t('collections.loading')
            : isEditMode
              ? t('collections.update')
              : t('collections.create')}
        </button>
      </div>
    </form>
  )
})

CollectionForm.displayName = 'CollectionForm'
