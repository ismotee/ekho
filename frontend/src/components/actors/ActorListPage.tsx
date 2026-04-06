/**
 * Public list of actors (global + own when signed in).
 */

import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useActorStore } from '../../stores/actorStore'
import { useAuthStore } from '../../stores/authStore'
import { recordActorDisplayName } from '../records/actorMiniForm'
import './Actors.css'

export const ActorListPage = observer(() => {
  const { t } = useTranslation()
  const actorStore = useActorStore()
  const authStore = useAuthStore()

  useEffect(() => {
    actorStore.fetchActors({ page_size: 100, force: true }).catch(() => {})
  }, [actorStore, authStore.isAuthenticated])

  if (actorStore.loading && actorStore.actors.length === 0) {
    return (
      <div className="actors-page" role="status">
        {t('actors.loading')}
      </div>
    )
  }

  if (actorStore.error && actorStore.actors.length === 0) {
    return <div className="actors-page error-message">{actorStore.error}</div>
  }

  return (
    <div className="actors-page">
      <div className="actors-header">
        <h1>{t('actors.title')}</h1>
        {authStore.isAuthenticated && (
          <Link to="/actors/new" className="btn btn-primary">
            {t('actors.addActor')}
          </Link>
        )}
      </div>
      <p className="record-form-repeatable-hint">{t('actors.intro')}</p>
      <div className="actors-grid">
        {actorStore.actors.map((a) => {
          const label = recordActorDisplayName(a.data ?? {})
          const isGlobal = a.owner == null
          const isMine = authStore.user?.id != null && a.owner?.id === authStore.user.id
          return (
            <article key={a.id} className="actor-card">
              <h2>{label.trim() || t('actors.actorNumber', { id: a.id })}</h2>
              <div className="actor-card-meta">
                {isGlobal ? (
                  <span>{t('actors.catalogShared')}</span>
                ) : (
                  <span>{t('actors.addedBy', { username: a.owner?.username ?? t('actors.addedByUser') })}</span>
                )}
              </div>
              <div className="actor-card-actions">
                <Link to={`/actors/${a.id}`} className="btn btn-secondary btn-sm">
                  {t('common.view')}
                </Link>
                {authStore.isAuthenticated && isMine && (
                  <Link to={`/actors/${a.id}/edit`} className="btn btn-secondary btn-sm">
                    {t('common.edit')}
                  </Link>
                )}
              </div>
            </article>
          )
        })}
      </div>
      {actorStore.actors.length === 0 && !actorStore.loading && (
        <p className="empty-state">{t('actors.empty')}</p>
      )}
    </div>
  )
})

ActorListPage.displayName = 'ActorListPage'
