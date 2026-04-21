export const THEME_STORAGE_KEY = 'ekho-theme'

export type ThemeMode = 'light' | 'dark'

/** App is forced to light mode; stored/system dark preferences are ignored. */
export function getStoredTheme(): ThemeMode {
  return 'light'
}

export function getSystemTheme(): ThemeMode {
  return 'light'
}

export function resolveInitialTheme(): ThemeMode {
  return 'light'
}

/** Persists and sets `data-theme` on `<html>` (always light). */
export function applyTheme(_mode: ThemeMode): void {
  document.documentElement.dataset.theme = 'light'
  try {
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
  } catch {
    /* ignore */
  }
}

export function readThemeFromDocument(): ThemeMode {
  return 'light'
}
