import { FieldInfoText } from './FieldInfoText'

export interface MaterialTypeGroupView {
  readonly group: string
  readonly items: readonly string[]
}

export interface GroupedReferenceSelectProps {
  id: string
  label: string
  infoKey?: string
  /** optgroup labels and leaf option labels (Finnish prefLabels). */
  groups: readonly MaterialTypeGroupView[]
  /** All known option values (for legacy value detection). */
  flatAllowlist: readonly string[]
  valueFi: string
  onChangeFi: (fi: string) => void
  disabled?: boolean
  emptyLabel?: string
  className?: string
}

/**
 * Single-select with `<optgroup>` — e.g. MAO/TAO materiaalit (see `maoMaterialGroups.ts`).
 */
export function GroupedReferenceSelect({
  id,
  label,
  infoKey,
  groups,
  flatAllowlist,
  valueFi,
  onChangeFi,
  disabled,
  emptyLabel = '—',
  className,
}: GroupedReferenceSelectProps) {
  const cur = valueFi.trim()
  const known = new Set(flatAllowlist)
  const legacy = cur && !known.has(cur) ? cur : null

  return (
    <div className={['form-group', className].filter(Boolean).join(' ')}>
      <label htmlFor={id}>{label}</label>
      {infoKey ? <FieldInfoText infoKey={infoKey} /> : null}
      <select id={id} value={valueFi} onChange={(e) => onChangeFi(e.target.value)} disabled={disabled}>
        <option value="">{emptyLabel}</option>
        {legacy ? (
          <option value={legacy}>
            {legacy}
          </option>
        ) : null}
        {groups.map((g) => (
          <optgroup key={g.group} label={g.group}>
            {g.items.map((opt) => (
              <option key={`${g.group}::${opt}`} value={opt}>
                {opt}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}
