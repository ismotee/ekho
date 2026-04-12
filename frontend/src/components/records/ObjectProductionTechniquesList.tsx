/**
 * Valmistustekniikat — repeatable rows (same interaction pattern as omistushistoria / sisällön paikat).
 */

import { useTranslation } from 'react-i18next'
import { TECHNIQUE_FI, TECHNIQUE_TYPE_FI } from '../../data/referenceVocabularies'
import type { Technique } from '../../types/record/history'
import { techniqueRowHasContent } from '../../lib/historyPayload'
import { referenceFieldFi, referenceFieldToPayload } from '../../lib/referenceField'
import { CollapsibleRepeatableRow } from './CollapsibleRepeatableRow'
import { ReferenceSelect } from './ReferenceSelect'
import { useRepeatableCollapsedRows } from './useRepeatableCollapsedRows'

export function ObjectProductionTechniquesList({
  techniques,
  onChange,
  idPrefix,
  disabled,
}: {
  techniques: Technique[]
  onChange: (next: Technique[] | undefined) => void
  idPrefix: string
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const col = useRepeatableCollapsedRows(techniques, techniqueRowHasContent)

  return (
    <fieldset className="record-form-repeatable-fieldset">
      <legend>{t('recordForm.history.techniquesLegend')}</legend>
      {techniques.map((row, index) => (
        <CollapsibleRepeatableRow
          key={index}
          id={`${idPrefix}-row-${index}`}
          collapsed={col.isCollapsed(index)}
          onToggleCollapse={() => col.toggle(index)}
          onRemove={() => {
            const next = techniques.filter((_, i) => i !== index)
            onChange(next.length ? next : undefined)
          }}
          disabled={disabled}
          saveItemNoun={t('recordForm.repeatable.saveItemLabels.productionTechnique')}
          summary={
            referenceFieldFi(row.name)?.trim() ||
            referenceFieldFi(row.type)?.trim() ||
            t('recordForm.history.emptyTechniqueEntry')
          }
        >
          <ReferenceSelect
            id={`${idPrefix}-name-${index}`}
            label={t('recordForm.labels.technique')}
            infoKey="recordForm.info.history.technique"
            allowlist={TECHNIQUE_FI}
            valueFi={referenceFieldFi(row.name)}
            onChangeFi={(fi) => {
              const rows = [...techniques]
              rows[index] = { ...rows[index], name: referenceFieldToPayload(fi) }
              onChange(rows)
            }}
            disabled={disabled}
            emptyLabel="—"
          />
          <ReferenceSelect
            id={`${idPrefix}-type-${index}`}
            label={t('recordForm.labels.techniqueType')}
            infoKey="recordForm.info.history.productionTechniqueType"
            allowlist={TECHNIQUE_TYPE_FI}
            valueFi={referenceFieldFi(row.type)}
            onChangeFi={(fi) => {
              const rows = [...techniques]
              rows[index] = { ...rows[index], type: referenceFieldToPayload(fi) }
              onChange(rows)
            }}
            disabled={disabled}
            emptyLabel="—"
          />
        </CollapsibleRepeatableRow>
      ))}
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => onChange([...techniques, {}])}
        disabled={disabled}
      >
        {t('recordForm.history.addTechnique')}
      </button>
    </fieldset>
  )
}
