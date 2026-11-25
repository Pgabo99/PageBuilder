import { describe, expect, it } from 'vitest'

import { contrastRatio, paletteWarnings, relativeLuminance } from '../contrast'

describe('contrast', () => {
  it('a relatív fényesség és a kontrasztarány a WCAG értékeit adja', () => {
    expect(relativeLuminance('#000000')).toBe(0)
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5)
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1)
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 1)
    expect(contrastRatio('#777777', '#777777')).toBe(1)
    expect(contrastRatio('#767676', '#ffffff')).toBeGreaterThan(4.5)
  })

  it('az olvasható párosításra nem figyelmeztet', () => {
    expect(
      paletteWarnings({ bg: '#ffffff', text: '#1f2328', primary: '#1d5fd1', accent: '#2f5bea' }),
    ).toEqual([])
  })

  it('a nem olvasható szöveg-, hivatkozás- és kiemelőszín-párosításra külön figyelmeztet', () => {
    const warnings = paletteWarnings({
      bg: '#ffffff',
      text: '#aaaaaa',
      primary: '#bbbbbb',
      accent: '#eeeeee',
    })

    expect(warnings).toHaveLength(3)
    expect(warnings[0]).toContain('A szöveg és a háttér kontrasztja 2,3:1')
    expect(warnings[1]).toContain('Az elsődleges szín')
    expect(warnings[2]).toContain('A kiemelőszín')
  })
})
