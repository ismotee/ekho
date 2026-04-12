/**
 * Temporal + DateDetail editors (docs/data/actor-models.md).
 */

import { useState, type ReactNode } from 'react'
import type { DateDetailWithTemporalMeta, Temporal } from '../../types/record/common'
import {
  DATE_ASSOCIATION_FI,
  DATE_CERTANITY_FI,
  DATE_PERIOD_FI,
  DATE_QUALIFIER_FI,
} from '../../data/temporalFormAllowlists'
import { useTranslation } from 'react-i18next'
import { referenceFieldFi, referenceFieldToPayload } from '../../lib/referenceField'
import { dateDetailHasPersistableContent, temporalHasPersistableContent, temporalNote } from '../../lib/temporalPayload'
import { ReferenceSelect } from './ReferenceSelect'
import { FieldInfoText } from './FieldInfoText'

const ISO_DATE_FULL = /^\d{4}-\d{2}-\d{2}$/

export function DateDetailInputs({
  idPrefix,
  legend,
  hint,
  dateLabel,
  infoPrefix,
  value,
  onChange,
  disabled,
  temporalMetadataFields = false,
  flatLayout = false,
  associationLabel,
  associationInfoKey,
  omitTemporalAssociation = false,
}: {
  idPrefix: string
  legend?: string
  /** Optional guide text inside the fieldset, below the legend (e.g. section introduction). */
  hint?: ReactNode
  /** Overrides the default calendar row label (`recordForm.temporal.date`). */
  dateLabel?: string
  infoPrefix?: string
  value?: DateDetailWithTemporalMeta
  onChange: (next: DateDetailWithTemporalMeta | undefined) => void
  disabled?: boolean
  /** When true, show temporal note / association / period (e.g. acquisition date rows). */
  temporalMetadataFields?: boolean
  /** When true, render without the dashed nested fieldset (use with `dateLabel` instead of `legend`). */
  flatLayout?: boolean
  /** Overrides label for the “ajan rooli” (`association`) reference when `temporalMetadataFields` is set. */
  associationLabel?: string
  /** Overrides guide text key for the association field. */
  associationInfoKey?: string
  /** When true with `temporalMetadataFields`, omit the association field here (e.g. rendered above the block). */
  omitTemporalAssociation?: boolean
}) {
  const { t, i18n } = useTranslation()
  const d = value ?? {}
  const single = d.single?.trim() ?? ''
  const dateInputValue = ISO_DATE_FULL.test(single) ? single : ''
  const datePickerLang = i18n.resolvedLanguage || i18n.language || undefined

  const [extraOpen, setExtraOpen] = useState(false)
  const extraPanelId = `${idPrefix}-extra-panel`

  const hasCollapsedValues =
    !!referenceFieldFi(d.certanity as never) ||
    !!referenceFieldFi(d.qualifier as never) ||
    (temporalMetadataFields &&
      (!!temporalNote(d as Temporal) ||
        (!omitTemporalAssociation && !!referenceFieldFi(d.association as never)) ||
        !!referenceFieldFi(d.period as never)))

  const patchDetail = (p: Partial<DateDetailWithTemporalMeta>) => {
    const n: DateDetailWithTemporalMeta = { ...d, ...p }
    onChange(dateDetailHasPersistableContent(n) ? n : undefined)
  }

  const inner = (
    <>
      {hint ? <p className="record-form-repeatable-hint">{hint}</p> : null}
      <div className="form-group">
        <label htmlFor={`${idPrefix}-cal`}>{dateLabel ?? t('recordForm.temporal.date')}</label>
        <FieldInfoText infoKey={infoPrefix ? `${infoPrefix}.date` : undefined} />
        <input
          id={`${idPrefix}-cal`}
          type="date"
          lang={datePickerLang}
          value={dateInputValue}
          onChange={(e) => {
            const v = e.target.value
            patchDetail({ single: v.trim() ? v : undefined })
          }}
          disabled={disabled}
        />
      </div>
      <div className="record-form-date-detail-extra">
        <button
          type="button"
          className={`btn btn-secondary btn-sm record-form-date-detail-extra-toggle${
            hasCollapsedValues ? ' record-form-date-detail-extra-toggle--has-value' : ''
          }`}
          id={`${idPrefix}-extra-toggle`}
          aria-expanded={extraOpen}
          aria-controls={extraPanelId}
          onClick={() => setExtraOpen((o) => !o)}
          disabled={disabled}
        >
          {extraOpen ? t('recordForm.temporal.hideDateDetails') : t('recordForm.temporal.showDateDetails')}
        </button>
      </div>
      {extraOpen ? (
        <div className="record-form-date-detail-extra-panel" id={extraPanelId} role="region" aria-labelledby={`${idPrefix}-extra-toggle`}>
          <ReferenceSelect
            id={`${idPrefix}-cert`}
            label={t('recordForm.temporal.dateCertainty')}
            allowlist={DATE_CERTANITY_FI}
            valueFi={referenceFieldFi(d.certanity as never)}
            onChangeFi={(fi) => patchDetail({ certanity: fi.trim() ? fi : undefined })}
            disabled={disabled}
            emptyLabel="—"
          />
          <ReferenceSelect
            id={`${idPrefix}-qual`}
            label={t('recordForm.temporal.dateQualifier')}
            allowlist={DATE_QUALIFIER_FI}
            valueFi={referenceFieldFi(d.qualifier as never)}
            onChangeFi={(fi) => patchDetail({ qualifier: fi.trim() ? fi : undefined })}
            disabled={disabled}
            emptyLabel="—"
          />
          {temporalMetadataFields ? (
            <>
              <div className="form-group form-group--grow">
                <label htmlFor={`${idPrefix}-note`}>{t('recordForm.temporal.note')}</label>
                <FieldInfoText infoKey={infoPrefix ? `${infoPrefix}.note` : undefined} />
                <textarea
                  id={`${idPrefix}-note`}
                  value={temporalNote(d as Temporal)}
                  onChange={(e) => {
                    const v = e.target.value
                    patchDetail({ note: v.trim() ? v : undefined, text: undefined })
                  }}
                  rows={2}
                  disabled={disabled}
                />
              </div>
              {!omitTemporalAssociation ? (
                <ReferenceSelect
                  id={`${idPrefix}-assoc`}
                  label={associationLabel ?? t('recordForm.temporal.association')}
                  infoKey={associationInfoKey ?? (infoPrefix ? `${infoPrefix}.association` : undefined)}
                  allowlist={DATE_ASSOCIATION_FI}
                  valueFi={referenceFieldFi(d.association as never)}
                  onChangeFi={(fi) => patchDetail({ association: referenceFieldToPayload(fi) })}
                  disabled={disabled}
                  emptyLabel="—"
                />
              ) : null}
              <ReferenceSelect
                id={`${idPrefix}-period`}
                label={t('recordForm.temporal.period')}
                allowlist={DATE_PERIOD_FI}
                valueFi={referenceFieldFi(d.period as never)}
                onChangeFi={(fi) => patchDetail({ period: referenceFieldToPayload(fi) })}
                disabled={disabled}
                emptyLabel="—"
              />
            </>
          ) : null}
        </div>
      ) : null}
    </>
  )

  if (flatLayout) {
    return <div className="record-form-date-detail-flat">{inner}</div>
  }

  return (
    <fieldset className="record-form-nested-fieldset">
      {legend ? <legend>{legend}</legend> : null}
      {inner}
    </fieldset>
  )
}

export function TemporalFields({
  idPrefix,
  legend,
  infoPrefix,
  value,
  onChange,
  disabled,
  hideLatest = false,
  earliestLegend,
  earliestAtTop = false,
  noteAtBottom = false,
  flattenEarliest = false,
}: {
  idPrefix: string
  legend: string
  infoPrefix?: string
  value?: Temporal
  onChange: (next: Temporal | undefined) => void
  disabled?: boolean
  /** When true, omit the “latest” (myöhäisin) date row and clear `latest` on save. */
  hideLatest?: boolean
  /** Overrides the nested earliest date fieldset legend (`recordForm.temporal.earliest`). */
  earliestLegend?: string
  /** When true, render the earliest date block before note / association / period. */
  earliestAtTop?: boolean
  /** When true, render the free-text temporal note (`recordForm.temporal.note`) after association / period / date rows. */
  noteAtBottom?: boolean
  /** When true, omit the inner “Aikatiedon päivämäärä” fieldset; use `earliestLegend` as the calendar row label. */
  flattenEarliest?: boolean
}) {
  const { t } = useTranslation()
  const temporal = value ?? {}

  const patch = (p: Partial<Temporal>) => {
    const n: Temporal = {
      ...temporal,
      ...p,
      earliest: p.earliest !== undefined ? p.earliest : temporal.earliest,
    }
    if (hideLatest) {
      n.latest = undefined
    } else {
      n.latest = p.latest !== undefined ? p.latest : temporal.latest
    }
    onChange(temporalHasPersistableContent(n) ? n : undefined)
  }

  const noteField = (
    <div className="form-group form-group--grow">
      <label htmlFor={`${idPrefix}-note`}>{t('recordForm.temporal.note')}</label>
      <FieldInfoText infoKey={infoPrefix ? `${infoPrefix}.note` : undefined} />
      <textarea
        id={`${idPrefix}-note`}
        value={temporalNote(temporal)}
        onChange={(e) => {
          const v = e.target.value
          patch({ note: v.trim() ? v : undefined, text: undefined })
        }}
        rows={2}
        disabled={disabled}
      />
    </div>
  )

  const associationField = (
    <ReferenceSelect
      id={`${idPrefix}-assoc`}
      label={t('recordForm.temporal.association')}
      infoKey={infoPrefix ? `${infoPrefix}.association` : undefined}
      allowlist={DATE_ASSOCIATION_FI}
      valueFi={referenceFieldFi(temporal.association)}
      onChangeFi={(fi) => patch({ association: referenceFieldToPayload(fi) })}
      disabled={disabled}
      emptyLabel="—"
    />
  )

  const periodField = (
    <ReferenceSelect
      id={`${idPrefix}-period`}
      label={t('recordForm.temporal.period')}
      infoKey={infoPrefix ? `${infoPrefix}.period` : undefined}
      allowlist={DATE_PERIOD_FI}
      valueFi={referenceFieldFi(temporal.period)}
      onChangeFi={(fi) => patch({ period: referenceFieldToPayload(fi) })}
      disabled={disabled}
      emptyLabel="—"
    />
  )

  const earliestField = (
    <DateDetailInputs
      idPrefix={`${idPrefix}-early`}
      legend={flattenEarliest ? undefined : (earliestLegend ?? t('recordForm.temporal.earliest'))}
      flatLayout={flattenEarliest}
      dateLabel={
        flattenEarliest ? earliestLegend ?? t('recordForm.temporal.earliest') : undefined
      }
      infoPrefix={infoPrefix ? `${infoPrefix}.earliest` : undefined}
      value={temporal.earliest}
      onChange={(next) => patch({ earliest: next })}
      disabled={disabled}
    />
  )

  const latestField =
    !hideLatest ? (
      <DateDetailInputs
        idPrefix={`${idPrefix}-late`}
        legend={t('recordForm.temporal.latest')}
        infoPrefix={infoPrefix ? `${infoPrefix}.latest` : undefined}
        value={temporal.latest}
        onChange={(next) => patch({ latest: next })}
        disabled={disabled}
      />
    ) : null

  return (
    <fieldset className="record-form-nested-fieldset record-form-temporal-fields">
      <legend>{legend}</legend>
      {earliestAtTop ? (
        <>
          {earliestField}
          {!noteAtBottom ? noteField : null}
          {associationField}
          {periodField}
          {latestField}
          {noteAtBottom ? noteField : null}
        </>
      ) : (
        <>
          {!noteAtBottom ? noteField : null}
          {associationField}
          {periodField}
          {earliestField}
          {latestField}
          {noteAtBottom ? noteField : null}
        </>
      )}
    </fieldset>
  )
}
