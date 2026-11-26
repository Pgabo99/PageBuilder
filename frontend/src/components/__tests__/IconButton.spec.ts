import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import IconButton from '../IconButton.vue'

describe('IconButton', () => {
  it('az aria-label és a súgó a megnevezés, az ikon dekoratív', () => {
    const wrapper = mount(IconButton, { props: { icon: 'copy', label: 'Másolás' } })

    expect(wrapper.attributes('aria-label')).toBe('Másolás')
    expect(wrapper.attributes('title')).toBe('Másolás')
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.find('svg').attributes('aria-hidden')).toBe('true')
    expect(wrapper.text()).toBe('')
  })

  it('kattintásra jelez, letiltva nem', async () => {
    const enabled = mount(IconButton, { props: { icon: 'x', label: 'Bezárás' } })
    const disabled = mount(IconButton, {
      props: { icon: 'x', label: 'Bezárás' },
      attrs: { disabled: true },
    })

    await enabled.trigger('click')
    await disabled.trigger('click')

    expect(enabled.emitted('click')).toHaveLength(1)
    expect(disabled.attributes('disabled')).toBeDefined()
    expect(disabled.emitted('click')).toBeUndefined()
  })

  it('változat és méret osztály, alapból másodlagos és kicsi', () => {
    const base = mount(IconButton, { props: { icon: 'x', label: 'L' } })
    const custom = mount(IconButton, {
      props: { icon: 'trash-2', label: 'L', variant: 'danger', size: 'md' },
    })

    expect(base.classes()).toEqual(expect.arrayContaining(['icon-btn--secondary', 'icon-btn--sm']))
    expect(custom.classes()).toEqual(expect.arrayContaining(['icon-btn--danger', 'icon-btn--md']))
  })

  it('minden felhasznált felületi ikon létezik', () => {
    for (const name of ['arrow-up', 'arrow-down', 'copy', 'trash-2', 'x']) {
      const wrapper = mount(IconButton, { props: { icon: name, label: name } })
      expect(wrapper.find('svg').exists()).toBe(true)
    }
  })
})
