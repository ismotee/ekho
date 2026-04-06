import { useTranslation } from 'react-i18next'

/**
 * Persisted language via i18next localStorage detector (`ekho_i18nextLng`).
 */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const value = i18n.resolvedLanguage?.startsWith('fi') ? 'fi' : 'en'

  return (
    <select
      className="nav-language-select"
      value={value}
      onChange={(e) => void i18n.changeLanguage(e.target.value)}
      aria-label={t('language.label')}
    >
      <option value="en">{t('language.en')}</option>
      <option value="fi">{t('language.fi')}</option>
    </select>
  )
}

LanguageSwitcher.displayName = 'LanguageSwitcher'
