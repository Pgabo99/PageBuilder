import { createHash } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { findIcon, iconMarkup, iconNames, icons, isIconName } from '../icons'

// A backend `tests/Unit/IconsTest.php` ugyanezt az ellenőrző összeget várja: a két ikonkészlet nem térhet el.
const ICONS_CHECKSUM = '62269af0b530ed4c09705cb441ba116e'

describe('icons', () => {
  it('húsz előre definiált ikon, egyedi, kötőjeles kisbetűs névvel és felirattal', () => {
    expect(icons).toHaveLength(20)
    expect(new Set(iconNames).size).toBe(20)
    for (const icon of icons) {
      expect(icon.name).toMatch(/^[a-z]+(?:-[a-z]+)*$/)
      expect(icon.label).not.toBe('')
    }
  })

  it('a névsorban rendezett név és SVG-belső párok ellenőrző összege egyezik a backendével', () => {
    const canonical = [...icons]
      .sort((a, b) => (a.name < b.name ? -1 : 1))
      .map((icon) => `${icon.name}\n${iconMarkup(icon)}\n`)
      .join('')

    expect(createHash('md5').update(canonical).digest('hex')).toBe(ICONS_CHECKSUM)
  })

  it('csak rajzelemeket és biztonságos attribútumokat tartalmaz', () => {
    const tags = new Set(['path', 'polygon', 'polyline', 'circle', 'line', 'rect'])
    for (const icon of icons) {
      for (const [tag, attrs] of icon.elements) {
        expect(tags.has(tag)).toBe(true)
        for (const [key, value] of Object.entries(attrs)) {
          expect(key).not.toMatch(/^on|href|style/i)
          expect(value).not.toMatch(/script|javascript:/i)
        }
      }
    }
  })

  it('csak az engedélyezett nevet fogadja el', () => {
    expect(isIconName('star')).toBe(true)
    expect(isIconName('nincs-ilyen')).toBe(false)
    expect(isIconName('<svg onload=x>')).toBe(false)
    expect(isIconName(['star'])).toBe(false)
    expect(isIconName(null)).toBe(false)
    expect(findIcon('star')?.label).toBe('Csillag')
    expect(findIcon('nincs-ilyen')).toBeUndefined()
  })
})
