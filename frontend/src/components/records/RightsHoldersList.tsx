/**
 * Oikeudenomistajat — CollapsibleRepeatableRow per holder (same pattern as objektin osat).
 */

import { useTranslation } from 'react-i18next'
import type { Actor, ActorField } from '../../types/record/actor'
import { actorRowHasContent } from '../../lib/acquisitionPayload'
import { recordActorSlotSummary } from './actorMiniForm'
import { ActorRefSelect } from './ActorRefSelect'
import { CollapsibleRepeatableRow } from './CollapsibleRepeatableRow'
import { useRepeatableCollapsedRows } from './useRepeatableCollapsedRows'

export function RightsHoldersList({
  holders,
  onChange,
  idPrefix,
  disabled,
  resolveActorCatalog,
}: {
  holders: ActorField[]
  onChange: (rows: ActorField[]) => void
  idPrefix: string
  disabled?: boolean
  resolveActorCatalog: (id: number) => Actor | undefined
}) {
  const { t } = useTranslation()
  const col = useRepeatableCollapsedRows(holders, actorRowHasContent)

  return (
    <fieldset className="record-form-repeatable-fieldset">
      <legend>{t('recordForm.rights.holdersLegend')}</legend>
      <p className="record-form-repeatable-hint">{t('recordForm.rights.holdersHint')}</p>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => onChange([...holders, {}])}
        disabled={disabled}
      >
        {t('recordForm.rights.addHolder')}
      </button>
      {holders.map((actor, hIndex) => (
        <CollapsibleRepeatableRow
          key={hIndex}
          id={`${idPrefix}-holder-${hIndex}`}
          collapsed={col.isCollapsed(hIndex)}
          onToggleCollapse={() => col.toggle(hIndex)}
          onRemove={() => {
            const next = holders.filter((_, i) => i !== hIndex)
            onChange(next)
          }}
          disabled={disabled}
          saveItemNoun={t('recordForm.repeatable.saveItemLabels.rightsHolder')}
          summary={
            recordActorSlotSummary(actor, resolveActorCatalog).trim() ||
            t('recordForm.summaries.emptyActor')
          }
        >
          <ActorRefSelect
            id={`${idPrefix}-ref-${hIndex}`}
            label={t('recordForm.labels.holder')}
            value={actor}
            onChange={(next) => {
              const rows = [...holders]
              rows[hIndex] = next ?? ({} as ActorField)
              onChange(rows)
            }}
            disabled={disabled}
          />
        </CollapsibleRepeatableRow>
      ))}
    </fieldset>
  )
}
