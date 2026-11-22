import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

// A Vitest a CSS-importokat üres szövegre cseréli (még `?raw` esetén is), ezért a fájlt közvetlenül olvassuk (a teszt a frontend könyvtárból fut).
const css = readFileSync(resolve(process.cwd(), 'src/assets/main.css'), 'utf-8')

describe('main.css', () => {
  it('a többsoros mező csak függőlegesen méretezhető, és nem lépheti túl az oszlopot', () => {
    const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
    const rule = [...withoutComments.matchAll(/(?:^|\})\s*textarea\s*\{([^}]*)\}/g)]
      .map((match) => match[1] ?? '')
      .find((body) => body.includes('resize'))

    expect(rule).toBeDefined()
    expect(rule).toMatch(/resize:\s*vertical/)
    expect(rule).toMatch(/max-width:\s*100%/)
  })
})
