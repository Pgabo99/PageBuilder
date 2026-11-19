import { describe, expect, it } from 'vitest'

import { slugify } from '../slug'

describe('slugify', () => {
  it.each([
    ['Árvíztűrő Tükörfúrógép', 'arvizturo-tukorfurogep'],
    ['  Kezdőlap!  ', 'kezdolap'],
    ['Kettő   szó -- itt', 'ketto-szo-itt'],
    ['---', ''],
  ])('%s → %s', (input, expected) => {
    expect(slugify(input)).toBe(expected)
  })

  it('legfeljebb 63 karakteres, és nem végződik kötőjellel', () => {
    const slug = slugify(`${'a'.repeat(62)} b`)

    expect(slug.length).toBeLessThanOrEqual(63)
    expect(slug.endsWith('-')).toBe(false)
  })
})
