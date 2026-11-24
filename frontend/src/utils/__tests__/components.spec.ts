import { describe, expect, it } from 'vitest'

import {
  cloneComponent,
  componentLabel,
  componentSummary,
  componentTypes,
  createAccordionItem,
  createCard,
  createComponent,
  MAX_ACCORDION_ITEMS,
  MAX_CARDS,
  MIN_ACCORDION_ITEMS,
  MIN_CARDS,
  dropSlot,
  headingClasses,
  moveItem,
  pageTargets,
  slotTarget,
} from '../components'

describe('kártyakomponens', () => {
  it('az új kártyacsoport egy kártyát tartalmaz, kötelező címmel és üres opcionális mezőkkel', () => {
    const component = createComponent('cards')

    expect(component).toMatchObject({ type: 'cards' })
    if (component.type !== 'cards') throw new Error('nem kártyacsoport')
    expect(component.cards).toHaveLength(MIN_CARDS)
    expect(component.cards[0]).toMatchObject({
      title: 'Új kártya',
      icon: null,
      text: '',
      label: '',
      url: '',
    })
    expect(createCard().id).not.toBe(createCard().id)
    expect(MAX_CARDS).toBe(6)
  })

  it('a típuslistában szerepel', () => {
    expect(componentTypes.map((t) => t.type)).toContain('cards')
    expect(componentLabel('cards')).toBe('Kártyák')
  })

  it('a másolat új azonosítókat kap, és nem osztozik a kártyákon az eredetivel', () => {
    const original = createComponent('cards')
    if (original.type !== 'cards') throw new Error('nem kártyacsoport')
    original.cards.push(createCard())

    const copy = cloneComponent(original)
    if (copy.type !== 'cards') throw new Error('nem kártyacsoport')
    copy.cards[0]!.title = 'Módosított'
    copy.cards.pop()

    expect(copy.id).not.toBe(original.id)
    expect(copy.cards[0]!.id).not.toBe(original.cards[0]!.id)
    expect(original.cards).toHaveLength(2)
    expect(original.cards[0]!.title).toBe('Új kártya')
  })

  it('az összefoglaló a kártyák számát és az első címet mutatja', () => {
    expect(
      componentSummary({
        id: 'k',
        type: 'cards',
        cards: [
          { id: 'a', title: 'Első' },
          { id: 'b', title: 'Második' },
        ],
      }),
    ).toBe('2 kártya: Első')
    expect(componentSummary({ id: 'k', type: 'cards', cards: [{ id: 'a', title: '' }] })).toBe(
      '1 kártya',
    )
  })
})

describe('becsukható részek komponens', () => {
  it('az új accordion egy kitöltött részt tartalmaz', () => {
    const component = createComponent('accordion')

    if (component.type !== 'accordion') throw new Error('nem accordion')
    expect(component.items).toHaveLength(MIN_ACCORDION_ITEMS)
    expect(component.items[0]!.title).not.toBe('')
    expect(component.items[0]!.text).not.toBe('')
    expect(createAccordionItem().id).not.toBe(createAccordionItem().id)
    expect(MAX_ACCORDION_ITEMS).toBe(20)
  })

  it('a típuslistában szerepel', () => {
    expect(componentTypes.map((t) => t.type)).toContain('accordion')
    expect(componentLabel('accordion')).toBe('Becsukható részek')
  })

  it('a másolat új azonosítókat kap, és nem osztozik a részeken az eredetivel', () => {
    const original = createComponent('accordion')
    if (original.type !== 'accordion') throw new Error('nem accordion')
    original.items.push(createAccordionItem())

    const copy = cloneComponent(original)
    if (copy.type !== 'accordion') throw new Error('nem accordion')
    copy.items[0]!.title = 'Módosított'
    copy.items.pop()

    expect(copy.id).not.toBe(original.id)
    expect(copy.items[0]!.id).not.toBe(original.items[0]!.id)
    expect(original.items).toHaveLength(2)
    expect(original.items[0]!.title).toBe('Új rész')
  })

  it('az összefoglaló a részek számát és az első címet mutatja', () => {
    expect(
      componentSummary({
        id: 'a',
        type: 'accordion',
        items: [
          { id: 'x', title: 'Kérdés', text: 'Válasz' },
          { id: 'y', title: 'Másik', text: 'Szöveg' },
        ],
      }),
    ).toBe('2 rész: Kérdés')
    expect(
      componentSummary({ id: 'a', type: 'accordion', items: [{ id: 'x', title: '', text: 'Y' }] }),
    ).toBe('1 rész')
  })
})

describe('dropSlot', () => {
  it('a kurzor feletti közepű elemek számát adja', () => {
    const mids = [50, 150, 250]

    expect(dropSlot(mids, 0)).toBe(0)
    expect(dropSlot(mids, 60)).toBe(1)
    expect(dropSlot(mids, 160)).toBe(2)
    expect(dropSlot(mids, 999)).toBe(3)
  })

  it('üres listánál a rés 0', () => {
    expect(dropSlot([], 40)).toBe(0)
  })
})

describe('slotTarget', () => {
  it('lefelé húzásnál az eltávolított elem miatt eggyel kisebb index', () => {
    expect(slotTarget(0, 3)).toBe(2)
    expect(slotTarget(0, 2)).toBe(1)
  })

  it('felfelé húzásnál és a saját helyén változatlan', () => {
    expect(slotTarget(2, 0)).toBe(0)
    expect(slotTarget(1, 1)).toBe(1)
    expect(slotTarget(1, 2)).toBe(1)
  })
})

describe('componentSummary', () => {
  it('típusonként a szöveget vagy a feliratot és a célt mutatja', () => {
    expect(componentSummary({ id: '1', type: 'heading', text: 'Cím', level: 1 })).toBe('Cím')
    expect(componentSummary({ id: '2', type: 'text', text: 'Bekezdés' })).toBe('Bekezdés')
    expect(componentSummary({ id: '3', type: 'button', label: 'Gomb', url: '/x' })).toBe(
      'Gomb → /x',
    )
  })

  it('a sortöréseket és a többszörös szóközt egyetlen szóközzé vonja', () => {
    expect(componentSummary({ id: '1', type: 'text', text: ' egy\n\n  két ' })).toBe('egy két')
  })

  it('a hosszú szöveget többponttal rövidíti, az üreset jelzi', () => {
    const long = componentSummary({ id: '1', type: 'text', text: 'a'.repeat(100) }, 10)
    expect(long).toBe(`${'a'.repeat(9)}…`)
    expect(componentSummary({ id: '2', type: 'text', text: '   ' })).toBe('(üres)')
  })
})

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

describe('cloneComponent', () => {
  it('azonos tartalommal, új azonosítóval másol, az eredetit nem érinti', () => {
    const original = createComponent('button')
    const copy = cloneComponent(original)

    expect(copy).toEqual({ ...original, id: copy.id })
    expect(copy.id).not.toBe(original.id)
    expect(copy).not.toBe(original)
  })
})

describe('pageTargets', () => {
  it('a pozíció szerinti első oldal a webhely gyökere, a többi az almappája', () => {
    const pages = [
      { title: 'Kapcsolat', slug: 'kapcsolat', position: 2 },
      { title: 'Kezdőlap', slug: 'kezdolap', position: 1 },
    ]

    expect(pageTargets('demo', pages)).toEqual([
      { label: 'Kezdőlap', url: '/sites/demo/' },
      { label: 'Kapcsolat', url: '/sites/demo/kapcsolat/' },
    ])
  })
})

describe('headingClasses', () => {
  it('csak az engedélyezett méretből és igazításból képez osztályt', () => {
    expect(headingClasses({ size: 'large', align: 'center' })).toEqual([
      'preview__heading--large',
      'preview__heading--center',
    ])
    expect(headingClasses({ size: 'large' })).toEqual(['preview__heading--large'])
  })

  it('üres, hiányzó vagy ismeretlen értéknél nincs osztály', () => {
    expect(headingClasses({})).toEqual([])
    expect(headingClasses({ size: null, align: null })).toEqual([])
    expect(headingClasses({ size: 'huge', align: '"><x' })).toEqual([])
  })
})
