import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { contrastRatio } from '@/utils/contrast'

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

  describe('design tokenek', () => {
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')

    // Egy szelektorblokk egyszerű `--név: érték;` deklarációi.
    function tokens(selector: string): Record<string, string> {
      const start = stripped.indexOf(`${selector} {`)
      const body = stripped.slice(start, stripped.indexOf('\n}', start))
      return Object.fromEntries(
        [...body.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2]!.trim()]),
      )
    }

    const light = tokens(':root')
    const darkOwn = tokens(":root[data-theme='dark']")
    const dark = { ...light, ...darkOwn }
    const hex = (value: string | undefined) => (/^#[0-9a-f]{6}$/i.test(value ?? '') ? value! : '')

    it('mindkét téma blokkja létezik', () => {
      expect(Object.keys(light).length).toBeGreaterThan(30)
      expect(Object.keys(darkOwn).length).toBeGreaterThan(10)
    })

    it('a sötét téma minden egyszínű színtokent felülír (nem örököl a világosból)', () => {
      const missing = Object.entries(light)
        .filter(([name, value]) => name.startsWith('--color-') && hex(value))
        .map(([name]) => name)
        .filter((name) => !(name in darkOwn))

      expect(missing).toEqual([])
    })

    it('a skálák léteznek: sugár, árnyék, betű, ikon, térköz', () => {
      const required = [
        '--radius-sm',
        '--radius-md',
        '--radius-lg',
        '--shadow-xs',
        '--shadow-sm',
        '--shadow-pop',
        '--text-xs',
        '--text-sm',
        '--text-md',
        '--text-lg',
        '--text-xl',
        '--icon-sm',
        '--icon-md',
        '--icon-lg',
        '--space-1',
        '--space-8',
        '--state-hover',
        '--state-active',
      ]

      expect(required.filter((name) => !(name in light))).toEqual([])
    })

    const pairs: [string, string[]][] = [
      [
        '--color-text',
        ['--color-bg', '--color-surface', '--color-surface-raised', '--color-field'],
      ],
      ['--color-muted', ['--color-bg', '--color-surface', '--color-surface-raised']],
      ['--color-primary', ['--color-bg', '--color-surface', '--color-surface-raised']],
      ['--color-danger', ['--color-surface', '--color-danger-bg']],
      ['--color-success', ['--color-surface']],
      ['--color-warning', ['--color-surface', '--color-bg']],
      ['--color-on-primary', ['--color-primary', '--color-primary-hover']],
    ]

    const themes: [string, Record<string, string>][] = [
      ['világos', light],
      ['sötét', dark],
    ]

    it.each(themes)(
      '%s téma: a szöveg és az interaktív színek kontrasztja legalább 4,5 (WCAG AA)',
      (_theme, set) => {
        const failing = pairs.flatMap(([fg, backgrounds]) =>
          backgrounds
            .filter((bg) => !(contrastRatio(hex(set[fg]), hex(set[bg])) >= 4.5))
            .map((bg) => `${fg} / ${bg}`),
        )

        expect(failing).toEqual([])
      },
    )

    it.each(themes)(
      '%s téma: a mezők kerete legalább 3:1 kontrasztú (WCAG 1.4.11)',
      (_theme, set) => {
        const failing = ['--color-surface', '--color-field'].filter(
          (bg) => !(contrastRatio(hex(set['--color-border-strong']), hex(set[bg])) >= 3),
        )

        expect(failing).toEqual([])
      },
    )

    it('csökkentett mozgásnál az animációs tokenek nullára állnak', () => {
      const block = stripped.slice(stripped.indexOf('prefers-reduced-motion: reduce'))
      const notZero = ['--motion-fast', '--motion-normal', '--motion-slow'].filter(
        (name) => !block.includes(`${name}: 0ms`),
      )

      expect(notZero).toEqual([])
    })
  })
})
