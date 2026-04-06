/**
 * Read-only actor detail; links to edit for owner.
 */

import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { Link, useParams } from 'react-router-dom'
import { useActorStore } from '../../stores/actorStore'
import { useAuthStore } from '../../stores/authStore'
import { recordActorDisplayName } from '../records/actorMiniForm'
import './Actors.css'

export const ActorDetailPage = observer(() => {
  const { id } = useParams<{ id: string }>()
  const actorStore = useActorStore()
  const authStore = useAuthStore()
  const numId = id ? Number(id) : NaN

  useEffect(() => {
    if (!Number.isFinite(numId)) return
    actorStore.fetchActor(numId).catch(() => {})
  }, [actorStore, numId])

  const a = actorStore.currentActor?.id === numId ? actorStore.currentActor : actorStore.actorById(numId)
  const isMine = authStore.user?.id != null && a?.owner?.id === authStore.user.id

  if (actorStore.loading && !a) {
    return (
      <div className="actors-page" role="status">
        Loading…
      </div>
    )
  }

  if (!a) {
    return <div className="actors-page empty-state">Actor not found.</div>
  }

  const label = recordActorDisplayName(a.data ?? {})

  return (
    <div className="actors-page">
      <p>
        <Link to="/actors">← Actors</Link>
      </p>
      <h1>{label.trim() || `Actor #${a.id}`}</h1>
      <p className="actor-card-meta">
        {a.owner == null ? 'Catalog (shared)' : `Owner: ${a.owner.username}`}
      </p>
      <pre
        style={{
          marginTop: '1rem',
          padding: '1rem',
          borderRadius: 8,
          border: '1px solid var(--color-border, #ddd)',
          overflow: 'auto',
          fontSize: '0.8rem',
        }}
      >
        {JSON.stringify(a.data, null, 2)}
      </pre>
      <div className="actor-form-actions">
        {authStore.isAuthenticated && isMine && (
          <Link to={`/actors/${a.id}/edit`} className="btn btn-primary">
            Edit
          </Link>
        )}
      </div>
    </div>
  )
})

ActorDetailPage.displayName = 'ActorDetailPage'
