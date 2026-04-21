import { useCallback, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { applyTheme, type ThemeMode, readThemeFromDocument } from '../../lib/theme'

function subscribe(onStoreChange: () => void) {
  const el = document.documentElement
  const mo = new MutationObserver(onStoreChange)
  mo.observe(el, { attributes: true, attributeFilter: ['data-theme'] })
  return () => mo.disconnect()
}

function getServerSnapshot(): ThemeMode {
  return 'light'
}

/**
 * Sun/moon control (if mounted). Theme is forced to light — toggle only re-applies light.
 */
export function ThemeToggle() {
  const { t } = useTranslation()
  const mode = useSyncExternalStore(subscribe, readThemeFromDocument, getServerSnapshot)

  const toggle = useCallback(() => {
    const next: ThemeMode = mode === 'light' ? 'dark' : 'light'
    applyTheme(next)
  }, [mode])

  const isDark = mode === 'dark'

  return (
    <button
      type="button"
      className="nav-theme-toggle"
      onClick={toggle}
      aria-label={isDark ? t('theme.switchToLight') : t('theme.switchToDark')}
      title={isDark ? t('theme.lightMode') : t('theme.darkMode')}
    >
      {isDark ? (
        <span className="nav-theme-toggle__icon" aria-hidden>
          ☀
        </span>
      ) : (
        <span className="nav-theme-toggle__icon" aria-hidden>
          ☽
        </span>
      )}
    </button>
  )
}

ThemeToggle.displayName = 'ThemeToggle'
