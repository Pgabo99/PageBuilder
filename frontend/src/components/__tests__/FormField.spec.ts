import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import FormField from '../FormField.vue'

describe('FormField', () => {
  it('a címkét a mezőhöz köti, és alapból kötelező', () => {
    const wrapper = mount(FormField, { props: { label: 'Cím', modelValue: 'x' } })
    const input = wrapper.find('input')

    expect(wrapper.find('label').attributes('for')).toBe(input.attributes('id'))
    expect(input.attributes('required')).toBeDefined()
    expect(input.element.value).toBe('x')
  })

  it('a required kikapcsolható, a null érték üres mező', () => {
    const wrapper = mount(FormField, {
      props: { label: 'Cím', modelValue: null, required: false },
    })

    expect(wrapper.find('input').attributes('required')).toBeUndefined()
    expect(wrapper.find('input').element.value).toBe('')
  })

  it('a többsoros mód textarea elemet ad, a beírást visszaadja', async () => {
    const wrapper = mount(FormField, {
      props: { label: 'Szöveg', multiline: true, rows: 4, modelValue: '' },
    })

    await wrapper.find('textarea').setValue('Bekezdés')

    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.find('textarea').attributes('rows')).toBe('4')
    expect(wrapper.emitted('update:modelValue')).toEqual([['Bekezdés']])
  })

  it('a számmező számot ad vissza, az üres marad üres', async () => {
    const wrapper = mount(FormField, {
      props: { label: 'Magasság', type: 'number', min: 1, max: 20, step: 1, modelValue: 2 },
    })
    const input = wrapper.find('input')

    await input.setValue('7')
    await input.setValue('')

    expect(wrapper.emitted('update:modelValue')).toEqual([[7], ['']])
    expect(input.attributes('min')).toBe('1')
    expect(input.attributes('max')).toBe('20')
  })

  it('a hibát jelzi (aria-invalid, aria-describedby), a súgót csak hiba nélkül mutatja', async () => {
    const wrapper = mount(FormField, {
      props: { label: 'Cím', modelValue: '', hint: 'Súgó', error: ['Hibás.', 'Túl rövid.'] },
    })
    const input = wrapper.find('input')

    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toBe(
      wrapper.find('.field__error').attributes('id'),
    )
    expect(wrapper.find('.field__error').text()).toBe('Hibás. Túl rövid.')
    expect(wrapper.find('.field__hint').exists()).toBe(false)

    await wrapper.setProps({ error: undefined })

    expect(wrapper.find('.field__hint').text()).toBe('Súgó')
    expect(input.attributes('aria-invalid')).toBe('false')
  })
})
