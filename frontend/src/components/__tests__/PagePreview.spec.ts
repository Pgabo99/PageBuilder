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

  it('a címsorszintet 1 és 3 közé szorítja', () => {
    const wrapper = mount(PagePreview, {
      props: {
        components: [
          { id: 'a', type: 'heading', text: 'Egy', level: 1 },
          { id: 'b', type: 'heading', text: 'Három', level: 3 },
          { id: 'c', type: 'heading', text: 'Hibás', level: 9 as 3 },
        ],
      },
    })

    expect(wrapper.findAll('h1, h2, h3').map((h) => h.element.tagName)).toEqual(['H1', 'H3', 'H3'])
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
