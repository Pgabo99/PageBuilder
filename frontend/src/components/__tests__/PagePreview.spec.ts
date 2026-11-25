import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { PageComponent } from '@/types/content'

import PagePreview from '../PagePreview.vue'

const components: PageComponent[] = [
  { id: 'a', type: 'heading', text: 'Cím', level: 2 },
  { id: 'b', type: 'text', text: 'Bekezdés' },
  { id: 'c', type: 'button', label: 'Gomb', url: '/x' },
]

describe('PagePreview', () => {
  it('a komponenseket a publikált oldal szerkezetével jeleníti meg', () => {
    const wrapper = mount(PagePreview, { props: { components } })

    expect(wrapper.find('h2').text()).toBe('Cím')
    expect(wrapper.find('p').text()).toBe('Bekezdés')
    expect(wrapper.find('.preview__button').text()).toBe('Gomb')
  })

  it('a címsorszintet 1 és 6 közé szorítja', () => {
    const wrapper = mount(PagePreview, {
      props: {
        components: [
          { id: 'a', type: 'heading', text: 'Egy', level: 1 },
          { id: 'b', type: 'heading', text: 'Hat', level: 6 },
          { id: 'c', type: 'heading', text: 'Hibás', level: 9 as 6 },
        ],
      },
    })

    expect(wrapper.findAll('h1, h2, h3, h4, h5, h6').map((h) => h.element.tagName)).toEqual([
      'H1',
      'H6',
      'H6',
    ])
  })

  it('a címsor mérete és igazítása a szinttől függetlenül osztályként jelenik meg', () => {
    const wrapper = mount(PagePreview, {
      props: {
        components: [
          { id: 'a', type: 'heading', text: 'A', level: 6, size: 'xlarge', align: 'center' },
          { id: 'b', type: 'heading', text: 'B', level: 1, size: 'small' },
          { id: 'c', type: 'heading', text: 'C', level: 3, align: 'right' },
        ],
      },
    })
    const classes = (selector: string) => wrapper.find(selector).classes()

    expect(classes('h6')).toEqual(
      expect.arrayContaining(['preview__heading--xlarge', 'preview__heading--center']),
    )
    expect(classes('h1')).toContain('preview__heading--small')
    expect(classes('h1').some((c) => c.includes('--left') || c.includes('--center'))).toBe(false)
    expect(classes('h3')).toEqual(expect.arrayContaining(['preview__heading--right']))
    expect(classes('h3').some((c) => /--(small|medium|large|xlarge)/.test(c))).toBe(false)
  })

  it('a régi, méret nélküli, null értékű és hibás értékű címsor alapmegjelenést kap', () => {
    const wrapper = mount(PagePreview, {
      props: {
        components: [
          { id: 'a', type: 'heading', text: 'Régi', level: 2 },
          { id: 'b', type: 'heading', text: 'Null', level: 2, size: null, align: null },
          {
            id: 'c',
            type: 'heading',
            text: 'Hibás',
            level: 2,
            size: 'huge' as 'small',
            align: 'justify' as 'left',
          },
        ],
      },
    })

    for (const h of wrapper.findAll('h2')) {
      expect(h.classes().filter((c) => c.startsWith('preview__heading'))).toEqual([])
    }
  })

  it('a címsor ikonját a szöveg előtt, a kiemelőszínnel rajzolja ki', () => {
    const wrapper = mount(PagePreview, {
      props: {
        components: [
          { id: 'a', type: 'heading', text: 'Kapcsolat', level: 2, icon: 'mail' },
          { id: 'b', type: 'heading', text: 'Ikon nélkül', level: 2 },
          { id: 'c', type: 'heading', text: 'Hibás', level: 2, icon: 'nincs-ilyen' },
        ],
        theme: 'purple',
      },
    })
    const headings = wrapper.findAll('h2')

    expect(headings[0]!.find('svg.icon').exists()).toBe(true)
    expect(headings[0]!.find('svg').classes()).toContain('preview__icon')
    expect(headings[0]!.text()).toBe('Kapcsolat')
    expect(headings[1]!.find('svg').exists()).toBe(false)
    expect(headings[2]!.find('svg').exists()).toBe(false)
    expect(wrapper.attributes('style')).toContain('--accent: #6d3fd0')
  })

  describe('gomb', () => {
    it('a stílus, a méret és a lekerekítés a gombon, az igazítás a bekezdésen jelenik meg', () => {
      const wrapper = mount(PagePreview, {
        props: {
          components: [
            {
              id: 'a',
              type: 'button',
              label: 'Egy',
              url: '/x',
              style: 'outline',
              size: 'large',
              radius: 'full',
              align: 'center',
            },
          ],
        },
      })

      expect(wrapper.find('.preview__button').classes()).toEqual(
        expect.arrayContaining([
          'preview__button--outline',
          'preview__button--large',
          'preview__button--r-full',
        ]),
      )
      expect(wrapper.find('p').classes()).toContain('preview__button-wrap--center')
    })

    it('a régi, null értékű és hibás értékű gomb alapmegjelenést kap', () => {
      const wrapper = mount(PagePreview, {
        props: {
          components: [
            { id: 'a', type: 'button', label: 'Régi', url: '/x' },
            {
              id: 'b',
              type: 'button',
              label: 'Null',
              url: '/x',
              style: null,
              size: null,
              align: null,
              radius: null,
            },
            {
              id: 'c',
              type: 'button',
              label: 'Hibás',
              url: '/x',
              style: 'neon' as 'soft',
              size: 'huge' as 'small',
              align: 'justify' as 'left',
              radius: 'round' as 'none',
            },
          ],
        },
      })

      for (const button of wrapper.findAll('.preview__button')) {
        expect(button.classes()).toEqual(['preview__button'])
      }
      for (const p of wrapper.findAll('p')) {
        expect(p.classes().filter((c) => c.includes('button-wrap'))).toEqual([])
      }
    })
  })

  describe('elválasztó', () => {
    it('vízszintes vonalként jelenik meg, a beállítások osztályként', () => {
      const wrapper = mount(PagePreview, {
        props: {
          components: [
            { id: 'a', type: 'divider', thickness: 'thick', style: 'dashed', color: 'accent' },
          ],
        },
      })

      expect(wrapper.find('hr').classes()).toEqual(
        expect.arrayContaining([
          'preview__divider--thickness-thick',
          'preview__divider--style-dashed',
          'preview__divider--color-accent',
        ]),
      )
    })

    it('az alapértelmezett, null és hibás értékű elválasztó alapmegjelenést kap', () => {
      const wrapper = mount(PagePreview, {
        props: {
          components: [
            { id: 'a', type: 'divider' },
            { id: 'b', type: 'divider', thickness: null, style: null, color: null },
            { id: 'c', type: 'divider', thickness: 'huge' as 'thin', color: 'red' as 'text' },
          ],
        },
      })

      expect(wrapper.findAll('hr')).toHaveLength(3)
      for (const hr of wrapper.findAll('hr')) {
        expect(hr.classes()).toEqual(['preview__divider'])
      }
    })

    it('kattintásra kijelöli a komponenst', async () => {
      const wrapper = mount(PagePreview, {
        props: { components: [{ id: 'a', type: 'divider' }] },
      })

      await wrapper.find('.preview__item').trigger('click')

      expect(wrapper.emitted('select')).toEqual([['a']])
    })
  })

  describe('kártyacsoport elrendezése', () => {
    const base = { id: 'k', type: 'cards' as const, cards: [{ id: 'a', title: 'A' }] }

    it('az elrendezési beállítások osztályként jelennek meg', () => {
      const wrapper = mount(PagePreview, {
        props: {
          components: [
            {
              ...base,
              columns: 3,
              icon_position: 'right',
              shadow: 'medium',
              button_position: 'center',
              gap: 'large',
            },
          ],
        },
      })

      expect(wrapper.find('.preview__cards').classes()).toEqual(
        expect.arrayContaining([
          'preview__cards--columns-3',
          'preview__cards--icon-position-right',
          'preview__cards--shadow-medium',
          'preview__cards--button-position-center',
          'preview__cards--gap-large',
        ]),
      )
    })

    it('a régi, null értékű és hibás értékű csoport alapmegjelenést kap', () => {
      const wrapper = mount(PagePreview, {
        props: {
          components: [
            base,
            { ...base, id: 'l', columns: null, gap: null },
            {
              ...base,
              id: 'm',
              columns: 9 as 4,
              gap: 'huge' as 'small',
              shadow: 'glow' as 'small',
            },
          ],
        },
      })

      for (const group of wrapper.findAll('.preview__cards')) {
        expect(group.classes().filter((c) => c.startsWith('preview__cards--'))).toEqual([])
      }
    })
  })

  describe('kártyák', () => {
    const cards: PageComponent = {
      id: 'k',
      type: 'cards',
      cards: [
        {
          id: 'a',
          icon: 'star',
          title: 'Első',
          text: 'Leírás',
          label: 'Tovább',
          url: '/kapcsolat',
        },
        { id: 'b', title: 'Csak cím' },
        {
          id: 'c',
          icon: 'nincs-ilyen',
          title: 'Rossz',
          label: 'Rossz',
          url: 'javascript:alert(1)',
        },
      ],
    }

    it('rácsban jeleníti meg a kártyákat, ikonnal, címmel, leírással és gombbal', () => {
      const wrapper = mount(PagePreview, { props: { components: [cards] } })
      const items = wrapper.findAll('.preview__card')

      expect(wrapper.find('.preview__cards').exists()).toBe(true)
      expect(items).toHaveLength(3)
      expect(items[0]!.find('.preview__card-icon svg.icon').exists()).toBe(true)
      expect(items[0]!.find('h3').text()).toBe('Első')
      expect(items[0]!.find('p').text()).toBe('Leírás')
      expect(items[0]!.find('.preview__button').text()).toBe('Tovább')
      expect(items[1]!.find('.preview__card-icon').exists()).toBe(false)
      expect(items[1]!.find('p').exists()).toBe(false)
    })

    it('az ismeretlen ikont és a nem biztonságos gombot elhagyja, mint a publikált oldal', () => {
      const wrapper = mount(PagePreview, { props: { components: [cards] } })
      const bad = wrapper.findAll('.preview__card')[2]!

      expect(bad.find('.preview__card-icon').exists()).toBe(false)
      expect(bad.find('.preview__button').exists()).toBe(false)
      expect(bad.find('h3').text()).toBe('Rossz')
    })

    it('a kártya gombja nem navigál, és nem kattintható elem', () => {
      const wrapper = mount(PagePreview, { props: { components: [cards] } })

      expect(wrapper.find('a').exists()).toBe(false)
      expect(wrapper.find('button').exists()).toBe(false)
    })

    it('legfeljebb hat kártyát mutat, a szöveget escape-elve', () => {
      const many: PageComponent = {
        id: 'm',
        type: 'cards',
        cards: Array.from({ length: 9 }, (_, i) => ({ id: `k${i}`, title: `<b>Kártya ${i}</b>` })),
      }
      const wrapper = mount(PagePreview, { props: { components: [many] } })

      expect(wrapper.findAll('.preview__card')).toHaveLength(6)
      expect(wrapper.find('b').exists()).toBe(false)
      expect(wrapper.find('h3').text()).toBe('<b>Kártya 0</b>')
    })

    it('a kártyacsoportra kattintva kijelölést kér, és kiemelhető', async () => {
      const wrapper = mount(PagePreview, { props: { components: [cards], activeId: 'k' } })

      expect(wrapper.find('.preview__cards').classes()).toContain('preview__item--active')
      await wrapper.find('.preview__card h3').trigger('click')
      expect(wrapper.emitted('select')).toEqual([['k']])
    })
  })

  describe('becsukható részek', () => {
    const accordion: PageComponent = {
      id: 'acc',
      type: 'accordion',
      items: [
        { id: 'a', title: 'Első', text: 'Első szöveg' },
        { id: 'b', title: '<b>Második</b>', text: 'Második szöveg' },
      ],
    }

    it('natív details/summary elemekkel jeleníti meg a részeket, alapból zártan', () => {
      const wrapper = mount(PagePreview, { props: { components: [accordion] } })
      const details = wrapper.findAll('details')

      expect(wrapper.find('.preview__accordion').exists()).toBe(true)
      expect(details).toHaveLength(2)
      expect(details.every((d) => !(d.element as HTMLDetailsElement).open)).toBe(true)
      expect(details[0]!.find('summary').text()).toBe('Első')
      expect(details[0]!.find('p').text()).toBe('Első szöveg')
    })

    it('a szöveget escape-elve jeleníti meg, és a summary nem fókuszálható (az előnézet rejtett)', () => {
      const wrapper = mount(PagePreview, { props: { components: [accordion] } })
      const second = wrapper.findAll('summary')[1]!

      expect(wrapper.find('b').exists()).toBe(false)
      expect(second.text()).toBe('<b>Második</b>')
      expect(wrapper.findAll('summary').every((s) => s.attributes('tabindex') === '-1')).toBe(true)
    })

    it('a nyitás és csukás nincs megakadályozva, a kattintás közben kijelölést kér', async () => {
      const wrapper = mount(PagePreview, {
        props: { components: [accordion] },
        attachTo: document.body,
      })
      const event = new MouseEvent('click', { bubbles: true, cancelable: true })

      wrapper.find('summary').element.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(false)
      expect(wrapper.emitted('select')).toEqual([['acc']])
      wrapper.unmount()
    })

    it('a nyitott rész újrarenderelésnél (kijelölés, szerkesztés) nyitva marad', async () => {
      const wrapper = mount(PagePreview, { props: { components: [accordion] } })
      ;(wrapper.findAll('details')[0]!.element as HTMLDetailsElement).open = true

      await wrapper.setProps({ activeId: 'acc' })
      expect(wrapper.find('.preview__accordion').classes()).toContain('preview__item--active')
      await wrapper.setProps({
        components: [
          {
            ...accordion,
            items: [{ id: 'a', title: 'Átírt', text: 'Első szöveg' }, accordion.items[1]!],
          } as PageComponent,
        ],
      })

      const first = wrapper.findAll('details')[0]!
      expect(first.find('summary').text()).toBe('Átírt')
      expect((first.element as HTMLDetailsElement).open).toBe(true)
      expect((wrapper.findAll('details')[1]!.element as HTMLDetailsElement).open).toBe(false)
    })

    it('legfeljebb húsz részt mutat', () => {
      const many: PageComponent = {
        id: 'm',
        type: 'accordion',
        items: Array.from({ length: 25 }, (_, i) => ({
          id: `i${i}`,
          title: `Rész ${i}`,
          text: 'X',
        })),
      }

      expect(mount(PagePreview, { props: { components: [many] } }).findAll('details')).toHaveLength(
        20,
      )
    })
  })

  it('a gomb nem navigál: nincs link és nincs kattintható elem', () => {
    const wrapper = mount(PagePreview, { props: { components } })

    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('a nem biztonságos URL-ű gombot elhagyja, mint a publikált oldal', () => {
    const wrapper = mount(PagePreview, {
      props: {
        components: [
          { id: 'a', type: 'button', label: 'Rossz', url: 'javascript:alert(1)' },
          { id: 'b', type: 'button', label: 'Jó', url: 'https://example.com' },
        ],
      },
    })

    expect(wrapper.findAll('.preview__button').map((b) => b.text())).toEqual(['Jó'])
  })

  it('a szöveget escape-elve jeleníti meg', () => {
    const wrapper = mount(PagePreview, {
      props: { components: [{ id: 'a', type: 'text', text: '<b>kövér</b><script>x</script>' }] },
    })

    expect(wrapper.find('b').exists()).toBe(false)
    expect(wrapper.find('p').text()).toBe('<b>kövér</b><script>x</script>')
  })

  it('üres tartalomnál jelzi, hogy az oldal üres', () => {
    expect(mount(PagePreview, { props: { components: [] } }).text()).toContain('még üres')
  })

  it('a webhely témájának és kiemelőszínének CSS-változóit használja', () => {
    const wrapper = mount(PagePreview, { props: { components, theme: 'purple' } })
    expect(wrapper.attributes('style')).toContain('--bg: #f5f0ff')
    expect(wrapper.attributes('style')).toContain('--accent: #6d3fd0')

    const custom = mount(PagePreview, { props: { components, theme: 'dark', accent: '#E11D48' } })
    expect(custom.attributes('style')).toContain('--accent: #e11d48')
    expect(custom.attributes('style')).toContain('--bg: #0f1115')
  })

  it('a kattintás kijelölést kér, és a megadott azonosítójú elem kiemelt', async () => {
    const wrapper = mount(PagePreview, { props: { components, activeId: 'b' } })

    expect(wrapper.findAll('.preview__item')).toHaveLength(3)
    expect(wrapper.findAll('.preview__item--active')).toHaveLength(1)
    expect(wrapper.find('.preview__item--active').text()).toBe('Bekezdés')

    await wrapper.findAll('.preview__item')[2]!.trigger('click')
    expect(wrapper.emitted('select')).toEqual([['c']])
  })

  it('a képernyőolvasók elől rejtett: a tartalom az űrlapban is elérhető', () => {
    expect(mount(PagePreview, { props: { components } }).attributes('aria-hidden')).toBe('true')
  })
})
