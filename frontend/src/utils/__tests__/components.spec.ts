import { describe, expect, it } from 'vitest'

import { createComponent, moveItem } from '../components'

describe('moveItem', () => {
  it('előre és hátra mozgat, az eredetit nem módosítja', () => {
    const list = ['a', 'b', 'c']

    expect(moveItem(list, 0, 2)).toEqual(['b', 'c', 'a'])
    expect(moveItem(list, 2, 0)).toEqual(['c', 'a', 'b'])
    expect(list).toEqual(['a', 'b', 'c'])
  })

  it('érvénytelen vagy azonos pozíciónál változatlan másolatot ad', () => {
    expect(moveItem(['a', 'b'], 0, 0)).toEqual(['a', 'b'])
    expect(moveItem(['a', 'b'], 0, 5)).toEqual(['a', 'b'])
    expect(moveItem(['a', 'b'], -1, 1)).toEqual(['a', 'b'])
  })
})

describe('createComponent', () => {
  it('típusonként érvényes alapértékekkel hoz létre, egyedi azonosítóval', () => {
    const heading = createComponent('heading')
    const text = createComponent('text')
    const button = createComponent('button')

    expect(heading).toMatchObject({ type: 'heading', level: 2 })
    expect(text).toMatchObject({ type: 'text' })
    expect(button).toMatchObject({ type: 'button', url: '/' })
    expect(new Set([heading.id, text.id, button.id]).size).toBe(3)
  })
})
