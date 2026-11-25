/** Az #RRGGBB szín relatív fényessége (WCAG); a backend `SiteRenderContext::onAccent()` ugyanezt számolja. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [
    number,
    number,
    number,
  ]
  const linear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}

/** Két #RRGGBB szín kontrasztaránya (1–21, WCAG). */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ]
  return (light + 0.05) / (dark + 0.05)
}

const format = (ratio: number): string => ratio.toFixed(1).replace('.', ',')

/**
 * Figyelmeztetések a nem olvasható színpárosításra (WCAG AA): a szöveg és a hivatkozás legalább 4,5:1,
 * a kiemelőszín (ikonok, keretek) legalább 3:1 kontrasztot kapjon a háttéren. Csak jelzés, mentést nem tilt.
 */
export function paletteWarnings(colors: {
  bg: string
  text: string
  primary: string
  accent: string
}): string[] {
  const warnings: string[] = []
  const text = contrastRatio(colors.text, colors.bg)
  if (text < 4.5) {
    warnings.push(
      `A szöveg és a háttér kontrasztja ${format(text)}:1; az olvashatósághoz legalább 4,5:1 ajánlott.`,
    )
  }
  const primary = contrastRatio(colors.primary, colors.bg)
  if (primary < 4.5) {
    warnings.push(
      `Az elsődleges szín (hivatkozások) és a háttér kontrasztja ${format(primary)}:1; legalább 4,5:1 ajánlott.`,
    )
  }
  const accent = contrastRatio(colors.accent, colors.bg)
  if (accent < 3) {
    warnings.push(
      `A kiemelőszín és a háttér kontrasztja ${format(accent)}:1; az ikonokhoz és a keretekhez legalább 3:1 ajánlott.`,
    )
  }
  return warnings
}
