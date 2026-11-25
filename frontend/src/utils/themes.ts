import { relativeLuminance } from '@/utils/contrast'

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
  return relativeLuminance(accent) > 0.179 ? '#000000' : '#ffffff'
}

/** Az egyedi színek (a kiemelőszín az `accent_color` mezőben van); az üres érték a téma alapértéke. */
export interface WebsitePalette {
  background?: string | null
  text?: string | null
  primary?: string | null
}

export interface ResolvedColors {
  bg: string
  text: string
  border: string
  accent: string
  /** A navigáció és a hivatkozások színe; alapból a kiemelőszín. */
  primary: string
}

const customColor = (value: unknown): string | null =>
  typeof value === 'string' && COLOR_PATTERN.test(value) ? value.toLowerCase() : null

/** A tényleges színek: téma, egyedi paletta és kiemelőszín összevonva (mint a backend `SiteRenderContext`). */
export function resolveColors(
  theme: PageTheme | null | undefined,
  accent?: string | null,
  palette?: WebsitePalette | null,
): ResolvedColors {
  const base = themeOf(theme)
  const bg = customColor(palette?.background)
  const text = customColor(palette?.text)
  const resolvedAccent = resolveAccent(theme, accent)
  return {
    bg: bg ?? base.bg,
    text: text ?? base.text,
    // Egyedi háttér- vagy szövegszínnél a keret a szöveg 20%-a a háttéren.
    border:
      bg === null && text === null
        ? base.border
        : `color-mix(in srgb, ${text ?? base.text} 20%, ${bg ?? base.bg})`,
    accent: resolvedAccent,
    primary: customColor(palette?.primary) ?? resolvedAccent,
  }
}

/** A publikált oldal CSS-változói (`--bg`, `--text`, `--border`, `--accent`, `--primary`, `--on-accent`). */
export function pageStyle(
  theme: PageTheme | null | undefined,
  accent?: string | null,
  palette?: WebsitePalette | null,
): Record<string, string> {
  const colors = resolveColors(theme, accent, palette)
  return {
    '--bg': colors.bg,
    '--text': colors.text,
    '--border': colors.border,
    '--accent': colors.accent,
    '--primary': colors.primary,
    '--on-accent': onAccent(colors.accent),
  }
}
