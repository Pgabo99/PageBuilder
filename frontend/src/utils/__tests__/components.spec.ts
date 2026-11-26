import { describe, expect, it } from 'vitest'

import { brandIconNames, findTypeIcon, iconNames } from '../icons'

import {
  cloneComponent,
  componentLabel,
  componentSummary,
  componentCategories,
  componentTypes,
  normalizeSearch,
  buttonClasses,
  cardsClasses,
  buttonWrapClasses,
  alertMarker,
  alertVariant,
  createAccordionItem,
  createFooterLink,
  createSocial,
  phoneHref,
  createStat,
  MAX_SOCIAL,
  MIN_SOCIAL,
  SOCIAL_PLATFORMS,
  MAX_STATS,
  MIN_STATS,
  spacerHeight,
  dividerClasses,
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
    expect(text).toMatchObject({ type: 'text', format: 'markdown' })
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

describe('buttonClasses', () => {
  it('csak az engedélyezett értékekből képez osztályt', () => {
    expect(buttonClasses({ style: 'soft', size: 'small', radius: 'none' })).toEqual([
      'preview__button--soft',
      'preview__button--small',
      'preview__button--r-none',
    ])
    expect(buttonWrapClasses({ align: 'right' })).toEqual(['preview__button-wrap--right'])
  })

  it('üres, hiányzó vagy ismeretlen értéknél nincs osztály', () => {
    expect(buttonClasses({})).toEqual([])
    expect(buttonClasses({ style: null, size: null, radius: null })).toEqual([])
    expect(buttonClasses({ style: 'neon', size: '"><x', radius: 'round' })).toEqual([])
    expect(buttonWrapClasses({ align: 'justify' })).toEqual([])
    expect(buttonWrapClasses({})).toEqual([])
  })
})

describe('cardsClasses', () => {
  it('csak az engedélyezett értékekből képez osztályt', () => {
    expect(
      cardsClasses({
        columns: 2,
        icon_position: 'top-center',
        text_align: 'right',
        radius: 'none',
      }),
    ).toEqual([
      'preview__cards--columns-2',
      'preview__cards--icon-position-top-center',
      'preview__cards--text-align-right',
      'preview__cards--radius-none',
    ])
  })

  it('üres, hiányzó vagy ismeretlen értéknél nincs osztály', () => {
    expect(cardsClasses({})).toEqual([])
    expect(cardsClasses({ columns: null, gap: null })).toEqual([])
    expect(
      cardsClasses({ columns: 7 as 4, gap: '"><x' as 'small', shadow: ['small'] as never }),
    ).toEqual([])
  })
})

describe('elválasztó', () => {
  it('felvehető alapértelmezett (mező nélküli) formában, és van összefoglalója', () => {
    const divider = createComponent('divider')

    expect(divider).toMatchObject({ type: 'divider' })
    expect(Object.keys(divider).sort()).toEqual(['id', 'type'])
    expect(componentSummary(divider)).toBe('Vízszintes vonal')
    expect(componentTypes.map((t) => t.type)).toContain('divider')
  })

  it('csak az engedélyezett értékekből képez osztályt', () => {
    expect(dividerClasses({ thickness: 'medium', color: 'text' })).toEqual([
      'preview__divider--thickness-medium',
      'preview__divider--color-text',
    ])
    expect(dividerClasses({})).toEqual([])
    expect(dividerClasses({ thickness: 'huge', style: '"><x', color: null })).toEqual([])
  })
})

describe('térköz', () => {
  it('alapértelmezett magassággal vehető fel, és van összefoglalója', () => {
    const spacer = createComponent('spacer')

    expect(spacer).toMatchObject({ type: 'spacer', height: 2 })
    expect(componentSummary(spacer)).toBe('2 rem térköz')
    expect(componentTypes.map((t) => t.type)).toContain('spacer')
  })

  it('a magasságot a megengedett tartományra szorítja, hibás érték esetén az alapérték', () => {
    expect(spacerHeight(5)).toBe(5)
    expect(spacerHeight(0)).toBe(1)
    expect(spacerHeight(99)).toBe(20)
    expect(spacerHeight(3.9)).toBe(3)
    expect(spacerHeight('x')).toBe(2)
    expect(spacerHeight(undefined)).toBe(2)
  })
})

describe('értesítődoboz', () => {
  it('információ típussal vehető fel, és van összefoglalója', () => {
    const alert = createComponent('alert')

    expect(alert).toMatchObject({ type: 'alert', variant: 'info', text: 'Új értesítés' })
    expect(componentSummary(alert)).toBe('Új értesítés')
    expect(componentSummary({ ...(alert as object), title: 'Cím' } as typeof alert)).toBe('Cím')
    expect(componentTypes.map((t) => t.type)).toContain('alert')
  })

  it('az ismeretlen típus információ, a jel típusonként különbözik', () => {
    expect(alertVariant('error')).toBe('error')
    expect(alertVariant('danger')).toBe('info')
    expect(alertVariant(undefined)).toBe('info')
    expect(['info', 'success', 'warning', 'error'].map(alertMarker)).toEqual(['i', '✓', '!', '✕'])
  })
})

describe('idézet', () => {
  it('szöveggel vehető fel, és van összefoglalója', () => {
    const quote = createComponent('quote')

    expect(quote).toMatchObject({ type: 'quote', text: 'Új idézet' })
    expect(Object.keys(quote).sort()).toEqual(['id', 'text', 'type'])
    expect(componentSummary(quote)).toBe('Új idézet')
    expect(componentTypes.map((t) => t.type)).toContain('quote')
  })
})

describe('statisztika', () => {
  it('egy elemmel vehető fel, és van összefoglalója', () => {
    const stats = createComponent('stats')

    expect(stats).toMatchObject({ type: 'stats' })
    expect((stats as { items: unknown[] }).items).toHaveLength(MIN_STATS)
    expect(componentSummary(stats)).toBe('1 statisztika: Új statisztika')
    expect(componentTypes.map((t) => t.type)).toContain('stats')
    expect(MAX_STATS).toBe(6)
  })

  it('az új elem érvényes, a másolat új azonosítókat kap és nem osztozik az eredetivel', () => {
    const stat = createStat()
    expect(stat).toMatchObject({ value: '100', label: 'Új statisztika' })

    const original = createComponent('stats')
    const copy = cloneComponent(original) as { id: string; items: { id: string }[] }
    const source = original as unknown as { id: string; items: { id: string }[] }

    expect(copy.id).not.toBe(source.id)
    expect(copy.items[0]!.id).not.toBe(source.items[0]!.id)
    expect(copy.items).not.toBe(source.items)
  })
})

describe('közösségi média', () => {
  it('egy hivatkozással vehető fel, és van összefoglalója', () => {
    const social = createComponent('social')

    expect(social).toMatchObject({ type: 'social' })
    expect((social as { items: unknown[] }).items).toHaveLength(MIN_SOCIAL)
    expect(componentSummary(social)).toBe('1 hivatkozás: Facebook')
    expect(componentTypes.map((t) => t.type)).toContain('social')
    expect(MAX_SOCIAL).toBe(10)
  })

  it('az új elem érvényes, a platformok megegyeznek a márkaikonokkal, a másolat nem osztozik', () => {
    expect(createSocial()).toMatchObject({ platform: 'facebook' })
    expect(SOCIAL_PLATFORMS.map((p) => p.value).sort()).toEqual([...brandIconNames].sort())

    const original = createComponent('social') as unknown as { id: string; items: { id: string }[] }
    const copy = cloneComponent(original as never) as unknown as typeof original

    expect(copy.id).not.toBe(original.id)
    expect(copy.items[0]!.id).not.toBe(original.items[0]!.id)
    expect(copy.items).not.toBe(original.items)
  })
})

describe('lábléc', () => {
  it('copyright-szöveggel, link nélkül vehető fel, és van összefoglalója', () => {
    const footer = createComponent('footer')

    expect(footer).toMatchObject({ type: 'footer', copyright: '© Weboldal', links: [] })
    expect(componentSummary(footer)).toBe('© Weboldal')
    expect(componentSummary({ id: 'x', type: 'footer' })).toBe('Lábléc')
    expect(componentTypes.map((t) => t.type)).toContain('footer')
    expect(createFooterLink()).toMatchObject({ label: 'Új link', url: '/' })
  })

  it('a másolat új azonosítókat kap, és a régi (link nélküli) lábléc is másolható', () => {
    const original = {
      id: 'f',
      type: 'footer' as const,
      links: [{ id: 'l', label: 'L', url: '/' }],
    }
    const copy = cloneComponent(original) as typeof original

    expect(copy.id).not.toBe('f')
    expect(copy.links[0]!.id).not.toBe('l')
    expect(cloneComponent({ id: 'g', type: 'footer' })).toMatchObject({ type: 'footer' })
  })

  it('a telefonszámból csak érvényes számnál készít tel: hivatkozást', () => {
    expect(phoneHref('+36 (30) 123-4567')).toBe('tel:+36301234567')
    expect(phoneHref('06.30.123.4567')).toBe('tel:06301234567')
    for (const bad of ['nem szám', '+ - ()', '', null, undefined, 42, 'javascript:alert(1)']) {
      expect(phoneHref(bad)).toBeNull()
    }
  })
})

describe('komponenstípus-definíció', () => {
  it('minden típushoz van ikon és létező kategória, az ikonok nem az ikonválasztóban vannak', () => {
    const categories = componentCategories.map((category) => category.id)
    for (const item of componentTypes) {
      expect(findTypeIcon(item.icon)?.name).toBe(item.icon)
      expect(categories).toContain(item.category)
      expect(iconNames).not.toContain(item.icon)
    }
  })

  it('a típusok egyediek', () => {
    const types = componentTypes.map((item) => item.type)
    expect(new Set(types).size).toBe(types.length)
  })

  it('a keresési alak ékezet-, kis/nagybetű- és szóköz-független', () => {
    expect(normalizeSearch('  ÉrtesÍtődoboz ')).toBe('ertesitodoboz')
  })
})
