import { describe, expect, it } from 'vitest'

import { isPageTheme, pageThemes, themeAccent } from '../themes'

describe('pageThemes', () => {
  it('a négy támogatott témát tartalmazza', () => {
    expect(pageThemes.map((theme) => theme.value)).toEqual(['light', 'dark', 'blue', 'purple'])
  })

  it('az alapértelmezett kiemelőszín egyezik a backendével', () => {
    expect(themeAccent(null)).toBe('#2f5bea')
    expect(themeAccent('dark')).toBe('#2f5bea')
    expect(themeAccent('blue')).toBe('#1d5fd1')
    expect(themeAccent('purple')).toBe('#6d3fd0')
  })

  it('csak ismert témát fogad el', () => {
    expect(isPageTheme('purple')).toBe(true)
    expect(isPageTheme('kek')).toBe(false)
    expect(isPageTheme(null)).toBe(false)
  })
})
