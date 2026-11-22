import { describe, expect, it } from 'vitest'

import { isPageTheme, onAccent, pageStyle, pageThemes, resolveAccent, themeAccent } from '../themes'

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

describe('pageStyle', () => {
  it('a backend palettáival egyező színeket ad', () => {
    expect(pageStyle('blue')).toMatchObject({
      '--bg': '#eef4ff',
      '--text': '#10264a',
      '--border': '#bcd0f2',
      '--accent': '#1d5fd1',
      '--on-accent': '#ffffff',
    })
    expect(pageStyle('purple')).toMatchObject({ '--bg': '#f5f0ff', '--text': '#261448' })
    expect(pageStyle('dark')).toMatchObject({ '--bg': '#0f1115', '--text': '#e6e8ec' })
    expect(pageStyle(null)).toMatchObject({ '--bg': '#ffffff', '--accent': '#2f5bea' })
  })

  it('a saját kiemelőszín felülírja a téma alapértelmezettjét, a hibás érték nem', () => {
    expect(resolveAccent('purple', '#E11D48')).toBe('#e11d48')
    expect(resolveAccent('purple', 'x;}<b>')).toBe('#6d3fd0')
    expect(resolveAccent('blue', null)).toBe('#1d5fd1')
  })

  it('a gomb szövegszíne olvasható: világos kiemelőn fekete, sötétén fehér', () => {
    expect(onAccent('#ffe600')).toBe('#000000')
    expect(onAccent('#112244')).toBe('#ffffff')
  })
})
