/**
 * Read-only actor detail; links to edit for owner.
 */

import { useEffect, useLayoutEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useActorStore } from '../../stores/actorStore'
import { useAuthStore } from '../../stores/authStore'
import { inferActorCatalogKind } from '../../lib/actorCatalogPayload'
import { recordActorDisplayName } from '../records/actorMiniForm'
import { NestedDomainFields } from '../records/NestedDomainFields'
import '../records/Records.css'
import './Actors.css'

type ActorDetailSectionKey = 'person' | 'organization'

const ACTOR_DETAIL_SECTIONS: readonly { key: ActorDetailSectionKey; headingKey: string }[] = [
  { key: 'person', headingKey: 'actors.form.person' },
  { key: 'organization', headingKey: 'actors.form.organization' },
] as const

function isActorSectionEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0) {
    return true
  }
  return false
}

function openSectionsForActor(data: Record<string, unknown>): Record<ActorDetailSectionKey, boolean> {
  const o = {} as Record<ActorDetailSectionKey, boolean>
  const firstWithData = ACTOR_DETAIL_SECTIONS.find(({ key }) => !isActorSectionEmpty(data[key]))?.key
  ACTOR_DETAIL_SECTIONS.forEach(({ key }) => {
    o[key] = key === firstWithData
  })
  return o
}

export const ActorDetailPage = observer(() => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const actorStore = useActorStore()
  const authStore = useAuthStore()
  const numId = id ? Number(id) : NaN

  const [openSections, setOpenSections] = useState<Record<ActorDetailSectionKey, boolean>>(() =>
    openSectionsForActor({}),
  )

  useEffect(() => {
    if (!Number.isFinite(numId)) return
    actorStore.fetchActor(numId).catch(() => {})
  }, [actorStore, numId])

  useEffect(() => {
    actorStore.fetchActors({ page_size: 200 }).catch(() => {})
  }, [actorStore])

  const a = actorStore.currentActor?.id === numId ? actorStore.currentActor : actorStore.actorById(numId)
  const isMine = authStore.user?.id != null && a?.owner?.id === authStore.user.id

  useLayoutEffect(() => {
    if (!a?.id) return
    setOpenSections(openSectionsForActor((a.data ?? {}) as Record<string, unknown>))
  }, [a?.id, a?.updated_at])

  if (actorStore.loading && !a) {
    return (
      <div className="record-detail actor-detail-page" role="status">
        {t('common.loading')}
      </div>
    )
  }

  if (!a) {
    return (
      <div className="record-detail actor-detail-page empty-state">
        {t('actors.detail.notFound')}
      </div>
    )
  }

  const label = recordActorDisplayName(a.data ?? {})
  const title = label.trim() || t('actors.actorNumber', { id: a.id })
  const kind = inferActorCatalogKind(a.data ?? {})
  const secondaryLine =
    kind === 'person'
      ? t('actors.form.person')
      : kind === 'organization'
        ? t('actors.form.organization')
        : null

  const data = (a.data ?? {}) as Record<string, unknown>
  const hasAnySection = ACTOR_DETAIL_SECTIONS.some(({ key }) => !isActorSectionEmpty(data[key]))

  return (
    <div className="record-detail actor-detail-page">
      <Link to="/actors" className="back-link">
        {t('actors.form.backToActors')}
      </Link>

      <div className="record-content actor-detail-hero">
        <div className="record-info-section">
          <h1>{title}</h1>
          {secondaryLine != null && secondaryLine !== '' && (
            <p className="record-detail-subline">{secondaryLine}</p>
          )}

          <p className="actor-detail-owner-line">
            {a.owner == null ? t('actors.catalogShared') : t('actors.detail.ownerLine', { username: a.owner.username })}
          </p>

          <div className="record-meta">
            <small>
              <strong>{t('recordForm.detail.created')}</strong> {new Date(a.created_at).toLocaleDateString()}
              {' · '}
              <strong>{t('recordForm.detail.updated')}</strong> {new Date(a.updated_at).toLocaleDateString()}
            </small>
          </div>

          {authStore.isAuthenticated && isMine && (
            <div className="actor-detail-actions">
              <Link to={`/actors/${a.id}/edit`} className="btn btn-primary">
                {t('common.edit')}
              </Link>
            </div>
          )}
        </div>
      </div>

      {hasAnySection ? (
        <section className="record-domain-sections" aria-label={t('actors.detail.dataBySectionAria')}>
          <h2 className="record-domain-sections-heading">{t('actors.detail.dataHeading')}</h2>
          {ACTOR_DETAIL_SECTIONS.map(({ key, headingKey }) => {
            const sectionValue = data[key]
            if (isActorSectionEmpty(sectionValue)) return null
            return (
              <details
                key={key}
                id={`actor-section-${key}`}
                className="record-detail-accordion"
                open={openSections[key]}
                onToggle={(e) => {
                  const nextOpen = e.currentTarget.open
                  setOpenSections((prev) => ({ ...prev, [key]: nextOpen }))
                }}
              >
                <summary className="record-detail-accordion-summary">
                  <span className="record-detail-accordion-chevron" aria-hidden />
                  <span className="record-detail-accordion-title">{t(headingKey)}</span>
                </summary>
                <div className="record-detail-accordion-panel">
                  <div className="record-detail-accordion-body">
                    <NestedDomainFields value={sectionValue} />
                  </div>
                </div>
              </details>
            )
          })}
        </section>
      ) : (
        <p className="record-section-empty actor-detail-empty-data">{t('recordForm.detail.noData')}</p>
      )}
    </div>
  )
})

ActorDetailPage.displayName = 'ActorDetailPage'
