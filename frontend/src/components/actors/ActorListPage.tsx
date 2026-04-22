/**
 * Public list of actors.
 * Layout and styling align with the Records (Tallenteet) list page.
 *
 * NOTE: Auth-dependent actions (Add actor, Edit actor) are intentionally
 * hidden for this deployment. They remain in other git branches.
 */

import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useActorStore } from '../../stores/actorStore'
import { recordActorDisplayName } from '../records/actorMiniForm'
import '../records/Records.css'
import './Actors.css'

export const ActorListPage = observer(() => {
  const { t } = useTranslation()
  const actorStore = useActorStore()

  useEffect(() => {
    actorStore.fetchActors({ page_size: 100, force: true }).catch(() => {})
  }, [actorStore])

  const renderContent = () => {
    if (actorStore.loading && actorStore.actors.length === 0) {
      return (
        <div className="record-list-content-loading" role="status">
          {t('actors.loading')}
        </div>
      )
    }

    if (actorStore.error && actorStore.actors.length === 0) {
      return <div className="error-message">{actorStore.error}</div>
    }

    if (actorStore.actors.length === 0) {
      return <div className="empty-state">{t('actors.empty')}</div>
    }

    return (
      <div className="record-list" role="list">
        <div className="record-grid">
          {actorStore.actors.map((a) => {
            const label = recordActorDisplayName(a.data ?? {})
            const isGlobal = a.owner == null
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
                </div>
              </article>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="record-list-page actors-list-page">
      <div className="record-list-main">
        <div className="actors-list-header">
          <h1 className="record-list-title">{t('actors.title')}</h1>
        </div>
        <p className="actors-intro">{t('actors.intro')}</p>
        {renderContent()}
      </div>
    </div>
  )
})

ActorListPage.displayName = 'ActorListPage'
