export type PageTheme = 'light' | 'dark' | 'blue' | 'purple'

interface ThemeDefinition {
  value: PageTheme
  label: string
  /** Alapértelmezett kiemelőszín; a backend `SiteRenderContext`-jével egyezik. */
  accent: string
  bg: string
  text: string
  border: string
}

/** A publikált oldal témái; a színek a backend `SiteRenderContext::PALETTES` és `ACCENTS` értékei. */
export const pageThemes: ThemeDefinition[] = [
  {
    value: 'light',
    label: 'Világos',
    accent: '#2f5bea',
    bg: '#ffffff',
    text: '#1f2328',
    border: '#d1d9e0',
  },
  {
    value: 'dark',
    label: 'Sötét',
    accent: '#2f5bea',
    bg: '#0f1115',
    text: '#e6e8ec',
    border: '#2b313c',
  },
  {
    value: 'blue',
    label: 'Kék',
    accent: '#1d5fd1',
    bg: '#eef4ff',
    text: '#10264a',
    border: '#bcd0f2',
  },
  {
    value: 'purple',
    label: 'Lila',
    accent: '#6d3fd0',
    bg: '#f5f0ff',
    text: '#261448',
    border: '#cdbdf0',
  },
]

const COLOR_PATTERN = /^#[0-9a-f]{6}$/i

export function isPageTheme(value: unknown): value is PageTheme {
  return pageThemes.some((theme) => theme.value === value)
}

function themeOf(theme: PageTheme | null | undefined): ThemeDefinition {
  return pageThemes.find((item) => item.value === theme) ?? pageThemes[0]!
}

export function themeAccent(theme: PageTheme | null | undefined): string {
  return themeOf(theme).accent
}

/** A saját kiemelőszín (ha érvényes #RRGGBB), különben a téma alapértelmezettje. */
export function resolveAccent(theme: PageTheme | null | undefined, accent?: string | null): string {
  return accent && COLOR_PATTERN.test(accent) ? accent.toLowerCase() : themeAccent(theme)
}

/** A kiemelőszínű felületen olvasható szövegszín (relatív fényesség, mint a backendben). */
export function onAccent(accent: string): '#000000' | '#ffffff' {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(accent.slice(i, i + 2), 16) / 255) as [
    number,
    number,
    number,
  ]
  const linear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const luminance = 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
  return luminance > 0.179 ? '#000000' : '#ffffff'
}

/** A publikált oldal CSS-változói (`--bg`, `--text`, `--border`, `--accent`, `--on-accent`). */
export function pageStyle(
  theme: PageTheme | null | undefined,
  accent?: string | null,
): Record<string, string> {
  const { bg, text, border } = themeOf(theme)
  const resolved = resolveAccent(theme, accent)
  return {
    '--bg': bg,
    '--text': text,
    '--border': border,
    '--accent': resolved,
    '--on-accent': onAccent(resolved),
  }
}
