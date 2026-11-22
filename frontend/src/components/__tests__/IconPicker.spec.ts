import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import IconPicker from '../IconPicker.vue'

describe('IconPicker', () => {
  it('a "Nincs" és a húsz ikon külön rádiógomb, ugyanabban a csoportban', () => {
    const wrapper = mount(IconPicker, { props: { modelValue: null } })
    const radios = wrapper.findAll('input[type="radio"]')

    expect(radios).toHaveLength(21)
    expect(new Set(radios.map((r) => r.attributes('name'))).size).toBe(1)
    expect(wrapper.find('legend').text()).toBe('Ikon')
  })

  it('a kiválasztott ikon be van jelölve, üres értéknél a "Nincs"', () => {
    const selected = mount(IconPicker, { props: { modelValue: 'star' } })
    const checked = selected.findAll('input:checked')
    expect(checked).toHaveLength(1)
    expect(checked[0]!.attributes('aria-label')).toBe('Csillag')

    const none = mount(IconPicker, { props: { modelValue: null } })
    expect(none.findAll('input:checked')).toHaveLength(1)
    expect(none.find('input:checked').attributes('value')).toBe('')
  })

  it('választáskor az ikon nevét, a "Nincs"-re null értéket küld', async () => {
    const wrapper = mount(IconPicker, {
      props: {
        modelValue: null,
        'onUpdate:modelValue': (value: string | null | undefined) =>
          wrapper.setProps({ modelValue: value }),
      },
    })

    await wrapper.find('input[aria-label="Szív"]').setValue(true)
    expect(wrapper.props('modelValue')).toBe('heart')

    await wrapper.find('input[value=""]').setValue(true)
    expect(wrapper.props('modelValue')).toBeNull()
  })

  it('a szerver hibáját megjeleníti', () => {
    const wrapper = mount(IconPicker, { props: { modelValue: null, error: ['Hibás ikon.'] } })

    expect(wrapper.find('.field__error').text()).toBe('Hibás ikon.')
  })
})
