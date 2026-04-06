/**
 * Select a catalog actor for an actor-shaped record field (`{ id }` in saved JSON).
 */

import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useActorStore } from '../../stores/actorStore'
import type { ActorField } from '../../types/record/actor'
import { actorRefId, legacyActorNeedsRebind } from '../../lib/actorField'
import { recordActorDisplayName } from './actorMiniForm'

export interface ActorRefSelectProps {
  id: string
  label: string
  value: ActorField | undefined
  onChange: (next: ActorField | undefined) => void
  disabled?: boolean
}

export const ActorRefSelect = observer(({ id, label, value, onChange, disabled }: ActorRefSelectProps) => {
  const actorStore = useActorStore()

  useEffect(() => {
    actorStore.fetchActors({ page_size: 200 }).catch(() => {})
  }, [actorStore])

  const currentId = actorRefId(value)
  const legacy = legacyActorNeedsRebind(value)
  const idsInList = new Set(actorStore.actors.map((a) => a.id))
  const showUnknownOption = currentId != null && !idsInList.has(currentId)

  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      {legacy && (
        <p className="record-form-repeatable-hint">
          This value uses legacy inline data. Choose a catalog actor to replace it for saving.
        </p>
      )}
      <select
        id={id}
        value={currentId != null ? String(currentId) : ''}
        onChange={(e) => {
          const v = e.target.value
          if (!v) {
            onChange(undefined)
            return
          }
          onChange({ id: Number(v) })
        }}
        disabled={disabled}
      >
        <option value="">—</option>
        {showUnknownOption && (
          <option value={String(currentId)}>{`Actor #${currentId} (reload list if missing)`}</option>
        )}
        {actorStore.actors.map((a) => (
          <option key={a.id} value={a.id}>
            {recordActorDisplayName(a.data ?? {}).trim() || `Actor #${a.id}`}
          </option>
        ))}
      </select>
    </div>
  )
})

ActorRefSelect.displayName = 'ActorRefSelect'
