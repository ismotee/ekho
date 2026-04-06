/**
 * Temporal + DateDetail editors (docs/data/actor-models.md).
 */

import type { DateDetail, Temporal } from '../../types/record/common'
import {
  DATE_ASSOCIATION_FI,
  DATE_CERTANITY_FI,
  DATE_PERIOD_FI,
  DATE_QUALIFIER_FI,
} from '../../data/temporalFormAllowlists'
import { useTranslation } from 'react-i18next'
import { referenceFieldFi, referenceFieldToPayload } from '../../lib/referenceField'
import { temporalHasPersistableContent, temporalNote } from '../../lib/temporalPayload'
import { ReferenceSelect } from './ReferenceSelect'
import { FieldInfoText } from './FieldInfoText'

const ISO_DATE_FULL = /^\d{4}-\d{2}-\d{2}$/

export function DateDetailInputs({
  idPrefix,
  legend,
  infoPrefix,
  value,
  onChange,
  disabled,
}: {
  idPrefix: string
  legend?: string
  infoPrefix?: string
  value?: DateDetail
  onChange: (next: DateDetail | undefined) => void
  disabled?: boolean
}) {
  const { t, i18n } = useTranslation()
  const d = value ?? {}
  const single = d.single?.trim() ?? ''
  const dateInputValue = ISO_DATE_FULL.test(single) ? single : ''
  const datePickerLang = i18n.resolvedLanguage || i18n.language || undefined

  const patchDetail = (p: Partial<DateDetail>) => {
    const n: DateDetail = { ...d, ...p }
    const empty =
      !n.single?.trim() &&
      !referenceFieldFi(n.certanity as never) &&
      !referenceFieldFi(n.qualifier as never)
    onChange(empty ? undefined : n)
  }

  return (
    <fieldset className="record-form-nested-fieldset">
      {legend ? <legend>{legend}</legend> : null}
      <div className="form-group">
        <label htmlFor={`${idPrefix}-cal`}>{t('recordForm.temporal.date')}</label>
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
      <ReferenceSelect
        id={`${idPrefix}-cert`}
        label={t('recordForm.temporal.dateCertainty')}
        infoKey={infoPrefix ? `${infoPrefix}.dateCertainty` : undefined}
        allowlist={DATE_CERTANITY_FI}
        valueFi={referenceFieldFi(d.certanity as never)}
        onChangeFi={(fi) => patchDetail({ certanity: fi.trim() ? fi : undefined })}
        disabled={disabled}
        emptyLabel="—"
      />
      <ReferenceSelect
        id={`${idPrefix}-qual`}
        label={t('recordForm.temporal.dateQualifier')}
        infoKey={infoPrefix ? `${infoPrefix}.dateQualifier` : undefined}
        allowlist={DATE_QUALIFIER_FI}
        valueFi={referenceFieldFi(d.qualifier as never)}
        onChangeFi={(fi) => patchDetail({ qualifier: fi.trim() ? fi : undefined })}
        disabled={disabled}
        emptyLabel="—"
      />
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
}: {
  idPrefix: string
  legend: string
  infoPrefix?: string
  value?: Temporal
  onChange: (next: Temporal | undefined) => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const temporal = value ?? {}

  const patch = (p: Partial<Temporal>) => {
    const n: Temporal = {
      ...temporal,
      ...p,
      earliest: p.earliest !== undefined ? p.earliest : temporal.earliest,
      latest: p.latest !== undefined ? p.latest : temporal.latest,
    }
    onChange(temporalHasPersistableContent(n) ? n : undefined)
  }

  return (
    <fieldset className="record-form-nested-fieldset">
      <legend>{legend}</legend>
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
      <DateDetailInputs
        idPrefix={`${idPrefix}-early`}
        legend={t('recordForm.temporal.earliest')}
        infoPrefix={infoPrefix ? `${infoPrefix}.earliest` : undefined}
        value={temporal.earliest}
        onChange={(next) => patch({ earliest: next })}
        disabled={disabled}
      />
      <DateDetailInputs
        idPrefix={`${idPrefix}-late`}
        legend={t('recordForm.temporal.latest')}
        infoPrefix={infoPrefix ? `${infoPrefix}.latest` : undefined}
        value={temporal.latest}
        onChange={(next) => patch({ latest: next })}
        disabled={disabled}
      />
    </fieldset>
  )
}
