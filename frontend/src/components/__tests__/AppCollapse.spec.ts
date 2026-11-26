import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AppCollapse from '../AppCollapse.vue'

const slots = { default: '<p class="content">Tartalom</p>' }

describe('AppCollapse', () => {
  it('zárva nem rendereli a tartalmat', () => {
    const wrapper = mount(AppCollapse, { props: { open: false }, slots })

    expect(wrapper.find('.content').exists()).toBe(false)
    expect(wrapper.classes()).not.toContain('collapse--open')
  })

  it('nyitva megjeleníti a tartalmat', () => {
    const wrapper = mount(AppCollapse, { props: { open: true }, slots })

    expect(wrapper.find('.content').exists()).toBe(true)
    expect(wrapper.classes()).toContain('collapse--open')
  })

  it('nyitáskor és zárásnál vált; animáció nélkül (0ms) azonnal eltávolítja a tartalmat', async () => {
    const wrapper = mount(AppCollapse, { props: { open: false }, slots })

    await wrapper.setProps({ open: true })
    await flushPromises()
    expect(wrapper.find('.content').exists()).toBe(true)
    expect(wrapper.classes()).toContain('collapse--open')

    await wrapper.setProps({ open: false })
    expect(wrapper.classes()).not.toContain('collapse--open')
    expect(wrapper.find('.content').exists()).toBe(false)
  })
})
