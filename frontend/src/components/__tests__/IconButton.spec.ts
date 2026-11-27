import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import IconButton from '../IconButton.vue'

describe('IconButton', () => {
  it('az aria-label a megnevezés, az ikon dekoratív, a gomb alapból type=button', () => {
    const wrapper = mount(IconButton, { props: { icon: 'copy', label: 'Másolás' } })
    const button = wrapper.find('button')

    expect(button.attributes('aria-label')).toBe('Másolás')
    expect(button.attributes('type')).toBe('button')
    expect(button.attributes('title')).toBeUndefined()
    expect(wrapper.find('svg').attributes('aria-hidden')).toBe('true')
    expect(button.text()).toBe('')
  })

  it('az attribútumok a gombra kerülnek: kattintásra jelez, letiltva nem', async () => {
    const enabled = mount(IconButton, { props: { icon: 'x', label: 'Bezárás' } })
    const disabled = mount(IconButton, {
      props: { icon: 'x', label: 'Bezárás' },
      attrs: { disabled: true },
    })

    await enabled.find('button').trigger('click')
    await disabled.find('button').trigger('click')

    expect(enabled.emitted('click')).toHaveLength(1)
    expect(disabled.find('button').attributes('disabled')).toBeDefined()
    expect(disabled.emitted('click')).toBeUndefined()
  })

  it('változat és méret osztály, alapból másodlagos és kicsi', () => {
    const base = mount(IconButton, { props: { icon: 'x', label: 'L' } })
    const custom = mount(IconButton, {
      props: { icon: 'trash-2', label: 'L', variant: 'danger', size: 'md' },
    })

    expect(base.find('button').classes()).toEqual(
      expect.arrayContaining(['icon-btn--secondary', 'icon-btn--sm']),
    )
    expect(custom.find('button').classes()).toEqual(
      expect.arrayContaining(['icon-btn--danger', 'icon-btn--md']),
    )
  })

  it('a gombot tooltip burkolja, ami a megnevezést mutatja és leírásként köti', () => {
    const wrapper = mount(IconButton, { props: { icon: 'copy', label: 'Másolás' } })

    expect(wrapper.find('.tooltip-root').exists()).toBe(true)
    expect(wrapper.find('button').attributes('aria-describedby')).toBeDefined()
  })

  it('minden felhasznált felületi ikon létezik', () => {
    for (const name of ['arrow-up', 'arrow-down', 'copy', 'trash-2', 'x']) {
      const wrapper = mount(IconButton, { props: { icon: name, label: name } })
      expect(wrapper.find('svg').exists()).toBe(true)
    }
  })
})
