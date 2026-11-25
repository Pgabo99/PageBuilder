import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ColorField from '../ColorField.vue'

describe('ColorField', () => {
  it('üres értéknél az alapértelmezett színt mutatja, és nincs visszaállító gomb', () => {
    const wrapper = mount(ColorField, {
      props: { label: 'Kiemelőszín', fallback: '#2f5bea', modelValue: '' },
    })

    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('#2f5bea')
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('választáskor a színt adja, a gombbal visszaáll az alapértelmezettre (üres érték)', async () => {
    const wrapper = mount(ColorField, {
      props: {
        label: 'Kiemelőszín',
        fallback: '#2f5bea',
        modelValue: '#112233',
        'onUpdate:modelValue': (value: string) => wrapper.setProps({ modelValue: value }),
      },
    })

    await wrapper.find('input').setValue('#aabbcc')
    expect(wrapper.props('modelValue')).toBe('#aabbcc')

    await wrapper.find('button').trigger('click')
    expect(wrapper.props('modelValue')).toBe('')
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('a hibát jelzi', () => {
    const wrapper = mount(ColorField, {
      props: { label: 'Szín', fallback: '#000000', modelValue: '', error: ['Hibás szín.'] },
    })

    expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
    expect(wrapper.find('.field__error').text()).toBe('Hibás szín.')
  })
})
