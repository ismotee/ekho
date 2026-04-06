import { referenceSelectOptions } from '../../lib/referenceField'
import { FieldInfoText } from './FieldInfoText'

export interface ReferenceSelectProps {
  id: string
  label: string
  infoKey?: string
  allowlist: readonly string[]
  valueFi: string
  onChangeFi: (fi: string) => void
  disabled?: boolean
  emptyLabel?: string
}

/**
 * Single-select for documented Reference<X> Finnish labels (`pref_label.fi` in API JSON).
 */
export function ReferenceSelect({
  id,
  label,
  infoKey,
  allowlist,
  valueFi,
  onChangeFi,
  disabled,
  emptyLabel = '—',
}: ReferenceSelectProps) {
  const options = referenceSelectOptions(allowlist, valueFi)
  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <FieldInfoText infoKey={infoKey} />
      <select id={id} value={valueFi} onChange={(e) => onChangeFi(e.target.value)} disabled={disabled}>
        <option value="">{emptyLabel}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  )
}
