export type PageTheme = 'light' | 'dark' | 'blue' | 'purple'

/** A publikált oldal témái; az alapértelmezett kiemelőszín a backend `SiteRenderContext`-jével egyezik. */
export const pageThemes: { value: PageTheme; label: string; accent: string }[] = [
  { value: 'light', label: 'Világos', accent: '#2f5bea' },
  { value: 'dark', label: 'Sötét', accent: '#2f5bea' },
  { value: 'blue', label: 'Kék', accent: '#1d5fd1' },
  { value: 'purple', label: 'Lila', accent: '#6d3fd0' },
]

export function isPageTheme(value: unknown): value is PageTheme {
  return pageThemes.some((theme) => theme.value === value)
}

export function themeAccent(theme: PageTheme | null | undefined): string {
  return pageThemes.find((item) => item.value === theme)?.accent ?? pageThemes[0]!.accent
}
