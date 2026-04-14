/**
 * Select a catalog actor for an actor-shaped record field (`{ id }` in saved JSON).
 */

import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useActorStore } from '../../stores/actorStore'
import type { ActorField } from '../../types/record/actor'
import { actorRefId, legacyActorNeedsRebind } from '../../lib/actorField'
import { inferActorCatalogKind } from '../../lib/actorCatalogPayload'
import { recordActorDisplayName } from './actorMiniForm'
import { FieldInfoText } from './FieldInfoText'

export interface ActorRefSelectProps {
  id: string
  label: string
  infoKey?: string
  value: ActorField | undefined
  onChange: (next: ActorField | undefined) => void
  disabled?: boolean
  /** When set, only catalog actors of that kind appear in the list (refs to other kinds still show as unknown). */
  catalogKind?: 'person' | 'organization'
  /** Optional first option (same id) for e.g. “this organization” when editing a catalog actor. */
  pinnedActorId?: number
  pinnedActorLabel?: string
}

export const ActorRefSelect = observer(
  ({
    id,
    label,
    infoKey,
    value,
    onChange,
    disabled,
    catalogKind,
    pinnedActorId,
    pinnedActorLabel,
  }: ActorRefSelectProps) => {
  const actorStore = useActorStore()

  useEffect(() => {
    actorStore.fetchActors({ page_size: 200 }).catch(() => {})
  }, [actorStore])

  const currentId = actorRefId(value)
  const legacy = legacyActorNeedsRebind(value)
  const rawList =
    catalogKind == null
      ? actorStore.actors
      : actorStore.actors.filter((a) => inferActorCatalogKind(a.data ?? {}) === catalogKind)
  const listActors =
    pinnedActorId != null ? rawList.filter((a) => a.id !== pinnedActorId) : rawList
  const idsInList = new Set(listActors.map((a) => a.id))
  const currentCatalog = currentId != null ? actorStore.actorById(currentId) : undefined
  const currentMatchesKind =
    catalogKind == null ||
    (currentCatalog != null && inferActorCatalogKind(currentCatalog.data ?? {}) === catalogKind)
  const showUnknownOption =
    currentId != null && (!idsInList.has(currentId) || !currentMatchesKind)

  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <FieldInfoText infoKey={infoKey} />
      <FieldInfoText infoKey="recordForm.actorRef.catalogSelectHelp" />
      {legacy && (
        <p className="record-form-repeatable-hint">
          This value uses legacy inline data. Choose a catalog actor to replace it for saving.
        </p>
      )}
      {catalogKind && showUnknownOption && currentId != null && !currentMatchesKind && (
        <p className="record-form-repeatable-hint" role="status">
          Selected actor is not a {catalogKind}; choose an allowed catalog entry.
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
        {pinnedActorId != null && (
          <option value={String(pinnedActorId)}>
            {pinnedActorLabel ?? `Actor #${pinnedActorId}`}
          </option>
        )}
        {showUnknownOption && (
          <option value={String(currentId)}>{`Actor #${currentId} (reload list if missing)`}</option>
        )}
        {listActors.map((a) => (
          <option key={a.id} value={a.id}>
            {recordActorDisplayName(a.data ?? {}).trim() || `Actor #${a.id}`}
          </option>
        ))}
      </select>
    </div>
  )
  },
)

ActorRefSelect.displayName = 'ActorRefSelect'
