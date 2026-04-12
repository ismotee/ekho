/**
 * Valmistukseen liittyvät aikatiedot — same pattern as description “Sisällön ajat” (collapsible rows, role first).
 */

import { useTranslation } from 'react-i18next'
import type { DateDetailWithTemporalMeta } from '../../types/record/common'
import { DATE_ASSOCIATION_FI } from '../../data/temporalFormAllowlists'
import { referenceFieldFi, referenceFieldToPayload } from '../../lib/referenceField'
import { dateDetailHasPersistableContent, dateDetailSummaryLine } from '../../lib/temporalPayload'
import { CollapsibleRepeatableRow } from './CollapsibleRepeatableRow'
import { DateDetailInputs } from './TemporalFields'
import { ReferenceSelect } from './ReferenceSelect'
import { useRepeatableCollapsedRows } from './useRepeatableCollapsedRows'

function productionTimeRowHasContent(d: DateDetailWithTemporalMeta | undefined): boolean {
  return dateDetailHasPersistableContent(d)
}

export function ObjectProductionTimeList({
  dates,
  onChange,
  idPrefix,
  disabled,
}: {
  dates: DateDetailWithTemporalMeta[]
  onChange: (next: DateDetailWithTemporalMeta[] | undefined) => void
  idPrefix: string
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const col = useRepeatableCollapsedRows(dates, productionTimeRowHasContent)

  return (
    <fieldset className="record-form-repeatable-fieldset">
      <legend>{t('recordForm.history.productionDatesLegend')}</legend>
      <p className="record-form-repeatable-hint">{t('recordForm.history.productionDatesHint')}</p>
      {dates.map((row, index) => (
        <CollapsibleRepeatableRow
          key={index}
          id={`${idPrefix}-row-${index}`}
          collapsed={col.isCollapsed(index)}
          onToggleCollapse={() => col.toggle(index)}
          onRemove={() => {
            const next = dates.filter((_, i) => i !== index)
            onChange(next.length ? next : undefined)
          }}
          disabled={disabled}
          saveItemNoun={t('recordForm.repeatable.saveItemLabels.productionTimeEntry')}
          summary={
            [referenceFieldFi(row.association), dateDetailSummaryLine(row)].filter(Boolean).join(' · ') ||
            t('recordForm.history.emptyProductionTime')
          }
        >
          <ReferenceSelect
            id={`${idPrefix}-role-${index}`}
            label={t('recordForm.history.productionDateRoleLabel')}
            infoKey="recordForm.info.history.productionDate.association"
            allowlist={DATE_ASSOCIATION_FI}
            valueFi={referenceFieldFi(row.association)}
            onChangeFi={(fi) => {
              const ref = referenceFieldToPayload(fi)
              const rows = [...dates]
              const cur = { ...(rows[index] ?? {}) }
              if (ref) cur.association = ref
              else delete cur.association
              rows[index] = cur
              onChange(rows)
            }}
            disabled={disabled}
            emptyLabel="—"
          />
          <DateDetailInputs
            idPrefix={`${idPrefix}-detail-${index}`}
            flatLayout
            dateLabel={t('recordForm.history.productionDateEntryLegend')}
            infoPrefix="recordForm.info.history.productionDate"
            temporalMetadataFields
            omitTemporalAssociation
            value={row}
            onChange={(next) => {
              const rows = [...dates]
              const prev = rows[index] ?? {}
              if (next === undefined) {
                const kept: DateDetailWithTemporalMeta = {}
                if (referenceFieldFi(prev.association)) kept.association = prev.association
                rows[index] = kept
              } else {
                rows[index] = { ...prev, ...next }
              }
              onChange(rows.length ? rows : undefined)
            }}
            disabled={disabled}
          />
        </CollapsibleRepeatableRow>
      ))}
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => onChange([...dates, {}])}
        disabled={disabled}
      >
        {t('recordForm.history.addProductionDate')}
      </button>
    </fieldset>
  )
}
