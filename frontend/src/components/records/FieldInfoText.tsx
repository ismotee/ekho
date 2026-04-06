import { useTranslation } from 'react-i18next'

export function FieldInfoText({ infoKey }: { infoKey?: string }) {
  const { t } = useTranslation()
  if (!infoKey) return null
  const value = t(infoKey, { defaultValue: '' }).trim()
  if (!value || value === infoKey) return null
  return <p className="record-form-repeatable-hint">{value}</p>
}
