/**
 * Roled actor rows (catalog actor + role) using the same collapsible toolbar as acquisition actors.
 */

import { useTranslation } from 'react-i18next'
import type { Actor, RoledActor } from '../../types/record/actor'
import { ACQUISITION_ACTOR_ROLE_FI } from '../../data/referenceVocabularies'
import { roledActorRowHasContent } from '../../lib/historyPayload'
import { referenceFieldFi, referenceFieldToPayload } from '../../lib/referenceField'
import { recordRoledActorRowSummary } from './actorMiniForm'
import { ActorRefSelect } from './ActorRefSelect'
import { CollapsibleRepeatableRow } from './CollapsibleRepeatableRow'
import { ReferenceSelect } from './ReferenceSelect'
import { useRepeatableCollapsedRows } from './useRepeatableCollapsedRows'

export function RoledActorRepeatableList({
  rows,
  onChange,
  idPrefix,
  disabled,
  resolveActorCatalog,
  roleLabel,
  roleInfoKey = 'recordForm.info.acquisition.acquisitionActorRole',
}: {
  rows: RoledActor[]
  onChange: (next: RoledActor[]) => void
  idPrefix: string
  disabled?: boolean
  resolveActorCatalog: (id: number) => Actor | undefined
  /** Field label for the role dropdown (e.g. production vs. object history). */
  roleLabel: string
  /** i18n key for role field guide text (default: same as acquisition actor role). */
  roleInfoKey?: string
}) {
  const { t } = useTranslation()
  const col = useRepeatableCollapsedRows(rows, roledActorRowHasContent)

  return (
    <>
      {rows.map((row, index) => (
        <CollapsibleRepeatableRow
          key={index}
          id={`${idPrefix}-row-${index}`}
          collapsed={col.isCollapsed(index)}
          onToggleCollapse={() => col.toggle(index)}
          onRemove={() => onChange(rows.filter((_, i) => i !== index))}
          disabled={disabled}
          saveItemNoun={t('recordForm.repeatable.saveItemLabels.roledActor')}
          summary={recordRoledActorRowSummary(row, resolveActorCatalog)}
        >
          <ActorRefSelect
            id={`${idPrefix}-ref-${index}`}
            label={t('recordForm.labels.actor')}
            value={row.actor}
            onChange={(next) =>
              onChange(rows.map((r, i) => (i === index ? { ...r, actor: next ?? {} } : r)))
            }
            disabled={disabled}
          />
          <ReferenceSelect
            id={`${idPrefix}-role-${index}`}
            label={roleLabel}
            infoKey={roleInfoKey}
            allowlist={ACQUISITION_ACTOR_ROLE_FI}
            valueFi={referenceFieldFi(row.association)}
            onChangeFi={(fi) =>
              onChange(
                rows.map((r, i) =>
                  i === index
                    ? { ...r, association: fi.trim() ? referenceFieldToPayload(fi) : undefined }
                    : r,
                ),
              )
            }
            disabled={disabled}
            emptyLabel="—"
          />
        </CollapsibleRepeatableRow>
      ))}
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => onChange([...rows, {}])}
        disabled={disabled}
      >
        {t('recordForm.history.addActor')}
      </button>
    </>
  )
}
