/** Shared theme handling, kept out of the page components. */

export type Theme = 'system' | 'light' | 'dark'

export const THEME_KEY = 'tw-tracker-theme'

/** Reflect the chosen theme onto <html> so CSS can respond. */
export function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme)
}

export function readStoredTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY)
  return saved === 'light' || saved === 'dark' ? saved : 'system'
}

/**
 * Called before first paint so a dark-mode user never sees a white flash.
 * Wrapped in try/catch because localStorage throws in some privacy modes.
 */
export function initTheme() {
  try {
    applyTheme(readStoredTheme())
  } catch {
    /* ignore — falls back to the device preference via CSS */
  }
}
