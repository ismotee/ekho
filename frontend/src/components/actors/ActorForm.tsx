/**
 * Create / edit actor (catalog entry). Delete with usage warning.
 */

import { FormEvent, useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Actor } from '../../types/record/actor'
import {
  actorCatalogHasIdentity,
  emptyActorData,
  inferActorCatalogKind,
  normalizeActorData,
} from '../../lib/actorCatalogPayload'
import { finalizeTemporalDeep } from '../../lib/temporalIso'
import { useActorStore } from '../../stores/actorStore'
import { ActorDataEditor, type ActorCatalogKind } from './ActorDataEditor'
import './Actors.css'

export const ActorForm = observer(() => {
  const { t } = useTranslation()
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const actorStore = useActorStore()
  const isEdit = Boolean(id)
  const numId = id ? Number(id) : NaN

  const [actorData, setActorData] = useState<Actor>(() => emptyActorData())
  const [validationError, setValidationError] = useState<string | null>(null)
  const [usageCount, setUsageCount] = useState<number | null>(null)
  const [usageSample, setUsageSample] = useState<{ id: number; label: string }[]>([])
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteUsage, setDeleteUsage] = useState<{ count: number; records: { id: number; label: string }[] } | null>(
    null,
  )
  const [readOnlyGlobal, setReadOnlyGlobal] = useState(false)
  const [actorKind, setActorKind] = useState<ActorCatalogKind>(null)
  const [dataVersion, setDataVersion] = useState(0)

  useEffect(() => {
    if (!isEdit || !Number.isFinite(numId)) return
    actorStore
      .fetchActor(numId)
      .then(() => {
        const a = actorStore.currentActor?.id === numId ? actorStore.currentActor : actorStore.actorById(numId)
        if (!a) return
        const global = a.owner == null
        setReadOnlyGlobal(global)
        const d = normalizeActorData(a.data)
        setActorData(d)
        if (!global) {
          setActorKind(inferActorCatalogKind(d))
        }
        setDataVersion((v) => v + 1)
      })
      .catch(() => {})
  }, [isEdit, numId, actorStore])

  useEffect(() => {
    if (isEdit) return
    setActorData(emptyActorData())
    setActorKind(null)
    setReadOnlyGlobal(false)
    setValidationError(null)
    setDataVersion((v) => v + 1)
  }, [isEdit])

  useEffect(() => {
    if (!isEdit || !Number.isFinite(numId)) return
    actorStore
      .fetchUsage(numId)
      .then((u) => {
        setUsageCount(u.count)
        setUsageSample(u.records ?? [])
      })
      .catch(() => {
        setUsageCount(null)
      })
  }, [isEdit, numId, actorStore])

  useEffect(() => {
    if (!deleteOpen || !Number.isFinite(numId)) return
    actorStore
      .fetchUsage(numId)
      .then((u) => setDeleteUsage({ count: u.count, records: u.records ?? [] }))
      .catch(() => setDeleteUsage({ count: 0, records: [] }))
  }, [deleteOpen, numId, actorStore])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (readOnlyGlobal) return
    setValidationError(null)
    if (actorKind == null) {
      setValidationError(t('actors.form.validation.kindRequired'))
      return
    }
    if (!actorCatalogHasIdentity(actorData)) {
      setValidationError(t('actors.form.validation.identityRequired'))
      return
    }
    const data = normalizeActorData(actorData)
    finalizeTemporalDeep(data)
    try {
      if (isEdit && Number.isFinite(numId)) {
        if (usageCount != null && usageCount > 0) {
          const ok = window.confirm(t('actors.form.confirm.updateUsedByRecords', { count: usageCount }))
          if (!ok) return
        }
        await actorStore.updateActor(numId, data)
        navigate(`/actors/${numId}`)
      } else {
        const created = await actorStore.createActor(data)
        navigate(`/actors/${created.id}`)
      }
    } catch {
      /* store sets error */
    }
  }

  const handleActorKindChange = (k: ActorCatalogKind) => {
    setActorKind(k)
    if (k === 'person') {
      setActorData((prev) => ({ person: prev.person ?? {}, organization: {} }))
    } else if (k === 'organization') {
      setActorData((prev) => ({ person: {}, organization: prev.organization ?? {} }))
    }
  }

  const handleDelete = async () => {
    if (!Number.isFinite(numId) || readOnlyGlobal) return
    try {
      await actorStore.deleteActor(numId)
      setDeleteOpen(false)
      navigate('/actors')
    } catch {
      setDeleteOpen(false)
    }
  }

  const actor = Number.isFinite(numId) ? actorStore.actorById(numId) ?? actorStore.currentActor : null
  const showEditChrome = isEdit && actor && !readOnlyGlobal

  return (
    <div className="actor-form-page">
      <p>
        <Link to="/actors">{t('actors.form.backToActors')}</Link>
      </p>
      <h1>{isEdit ? t('actors.form.titleEdit') : t('actors.form.titleCreate')}</h1>

      {readOnlyGlobal && (
        <p className="actor-usage-banner">
          {t('actors.form.readOnlyGlobal')}
        </p>
      )}

      {usageCount != null && usageCount > 0 && !readOnlyGlobal && (
        <div className="actor-usage-banner" role="status">
          {t('actors.form.usageBanner', { count: usageCount })}
          {usageSample.length > 0 && (
            <ul style={{ marginTop: '0.5rem', marginBottom: 0 }}>
              {usageSample.slice(0, 5).map((r) => (
                <li key={r.id}>
                  <Link to={`/records/${r.id}`}>{r.label}</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {validationError && <div className="error-message">{validationError}</div>}
      {actorStore.error && <div className="error-message">{actorStore.error}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <ActorDataEditor
          value={actorData}
          onChange={setActorData}
          disabled={readOnlyGlobal}
          idPrefix="actor-form"
          actorKind={actorKind}
          onActorKindChange={readOnlyGlobal ? undefined : handleActorKindChange}
          dataVersion={dataVersion}
          catalogActorId={isEdit && Number.isFinite(numId) ? numId : undefined}
        />
        {!readOnlyGlobal && (
          <div className="actor-form-actions">
            <button type="submit" className="btn btn-primary" disabled={actorStore.loading}>
              {actorStore.loading ? t('actors.form.saving') : isEdit ? t('actors.form.save') : t('actors.form.create')}
            </button>
            <Link to={isEdit && actor ? `/actors/${actor.id}` : '/actors'} className="btn btn-secondary">
              {t('actors.form.cancel')}
            </Link>
            {showEditChrome && (
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteOpen(true)}>
                {t('actors.form.delete')}
              </button>
            )}
          </div>
        )}
      </form>

      {deleteOpen && (
        <div className="actor-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="actor-del-title">
          <div className="actor-modal">
            <h3 id="actor-del-title">{t('actors.form.deleteTitle')}</h3>
            <p>
              {deleteUsage && deleteUsage.count > 0
                ? t('actors.form.deleteUsedByRecords', { count: deleteUsage.count })
                : t('actors.form.deleteUnused')}
            </p>
            {deleteUsage && deleteUsage.records.length > 0 && (
              <ul>
                {deleteUsage.records.slice(0, 8).map((r) => (
                  <li key={r.id}>{r.label}</li>
                ))}
              </ul>
            )}
            <div className="actor-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteOpen(false)}>
                {t('actors.form.cancel')}
              </button>
              <button type="button" className="btn btn-primary" onClick={handleDelete} disabled={actorStore.loading}>
                {t('actors.form.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

ActorForm.displayName = 'ActorForm'
