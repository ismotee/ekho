/**
 * Shared fi/en/und label row (actor catalog and spatial place names).
 */

import { useTranslation } from 'react-i18next'
import type { Label } from '../../types/record/common'

export function MultilingualLabelInputs({
  idPrefix,
  label,
  finnishLabel,
  englishLabel,
  value,
  onChange,
  disabled,
  includeUndefinedLanguage = true,
}: {
  idPrefix: string
  /** Group legend above the language fields; omit to hide. */
  label?: string
  finnishLabel?: string
  englishLabel?: string
  value?: Label
  onChange: (next: Label | undefined) => void
  disabled?: boolean
  includeUndefinedLanguage?: boolean
}) {
  const { t } = useTranslation()
  const v = value ?? {}
  const set = (patch: Partial<Label>) => {
    let n: Label = { ...v, ...patch }
    if (!includeUndefinedLanguage) {
      const { und: _drop, ...rest } = n
      n = rest
    }
    const empty =
      !n.fi?.trim() &&
      !n.en?.trim() &&
      (includeUndefinedLanguage ? !n.und?.trim() : true)
    onChange(empty ? undefined : n)
  }
  return (
    <div className="actor-form-label-group">
      {label?.trim() ? <span className="actor-form-sublegend">{label}</span> : null}
      <div className="form-group">
        <label htmlFor={`${idPrefix}-fi`}>{finnishLabel ?? t('actors.form.fields.finnish')}</label>
        <input
          id={`${idPrefix}-fi`}
          type="text"
          value={v.fi ?? ''}
          onChange={(e) => set({ fi: e.target.value || undefined })}
          disabled={disabled}
        />
      </div>
      <div className="form-group">
        <label htmlFor={`${idPrefix}-en`}>{englishLabel ?? t('actors.form.fields.english')}</label>
        <input
          id={`${idPrefix}-en`}
          type="text"
          value={v.en ?? ''}
          onChange={(e) => set({ en: e.target.value || undefined })}
          disabled={disabled}
        />
      </div>
      {includeUndefinedLanguage ? (
        <div className="form-group">
          <label htmlFor={`${idPrefix}-und`}>{t('actors.form.fields.undefinedLanguage')}</label>
          <input
            id={`${idPrefix}-und`}
            type="text"
            value={v.und ?? ''}
            onChange={(e) => set({ und: e.target.value || undefined })}
            disabled={disabled}
          />
        </div>
      ) : null}
    </div>
  )
}
