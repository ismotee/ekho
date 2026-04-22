/**
 * Public list of actors.
 * Layout and styling align with the Records (Tallenteet) list page.
 *
 * NOTE: Auth-dependent actions (Add actor, Edit actor) are intentionally
 * hidden for this deployment. They remain in other git branches.
 */

import { useEffect, useMemo, useState } from 'react'
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
  const [page, setPage] = useState(1)
  const pageSize = 12

  useEffect(() => {
    actorStore.fetchActors({ page_size: 100, force: true }).catch(() => {})
  }, [actorStore])

  const totalPages = Math.max(1, Math.ceil(actorStore.actors.length / pageSize))
  const pagedActors = useMemo(() => {
    const start = (page - 1) * pageSize
    return actorStore.actors.slice(start, start + pageSize)
  }, [actorStore.actors, page])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

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
          {pagedActors.map((a) => {
            const label = recordActorDisplayName(a.data ?? {})
            return (
              <Link key={a.id} to={`/actors/${a.id}`} className="actor-card actor-card-link">
                <h2>{label.trim() || t('actors.actorNumber', { id: a.id })}</h2>
              </Link>
            )
          })}
        </div>
        {totalPages > 1 && (
          <div className="pagination actors-pagination" role="navigation" aria-label={t('common.pagination')}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              {t('common.previous')}
            </button>
            <span className="actors-pagination__status">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
            >
              {t('common.next')}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="record-list-page actors-list-page">
      <div className="record-list-main">
        {renderContent()}
      </div>
    </div>
  )
})

ActorListPage.displayName = 'ActorListPage'
