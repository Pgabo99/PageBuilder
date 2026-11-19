import { ref } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

function readStored(): Theme | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    // A tárhely tiltott vagy nem elérhető (pl. privát mód): nincs mentett választás.
    return null
  }
}

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const theme = ref<Theme>('light')

function apply(value: Theme): void {
  theme.value = value
  document.documentElement.dataset.theme = value
}

/** Az alkalmazás indulásakor: mentett választás, különben a rendszerbeállítás. */
export function initTheme(): void {
  apply(readStored() ?? systemTheme())
}

export function useTheme() {
  function toggle(): void {
    const next: Theme = theme.value === 'dark' ? 'light' : 'dark'
    apply(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // A választás ekkor csak a munkamenet végéig él.
    }
  }

  return { theme, toggle }
}
