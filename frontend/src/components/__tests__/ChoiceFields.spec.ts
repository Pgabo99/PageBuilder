import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CheckboxField from '../CheckboxField.vue'
import RadioField from '../RadioField.vue'
import SwitchField from '../SwitchField.vue'

describe('CheckboxField', () => {
  it('a címkét a natív jelölőnégyzethez köti, és kétirányú', async () => {
    const wrapper = mount(CheckboxField, { props: { label: 'Elfogadom', modelValue: false } })
    const input = wrapper.find('input[type="checkbox"]')

    expect(wrapper.find('label').attributes('for')).toBe(input.attributes('id'))
    expect((input.element as HTMLInputElement).checked).toBe(false)

    await input.setValue(true)

    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  })

  it('a hibát és a súgót aria-describedby-jal köti, a hiba elsőbbséget élvez', () => {
    const hint = mount(CheckboxField, { props: { label: 'L', hint: 'Súgó' } })
    const error = mount(CheckboxField, { props: { label: 'L', hint: 'Súgó', error: ['Hibás.'] } })

    expect(hint.find('input').attributes('aria-describedby')).toBe(hint.find('p').attributes('id'))
    expect(hint.find('input').attributes('aria-invalid')).toBe('false')
    expect(error.find('p').text()).toBe('Hibás.')
    expect(error.find('p').classes()).toContain('field__error')
    expect(error.find('input').attributes('aria-invalid')).toBe('true')
  })

  it('letiltva nem módosítható', () => {
    const wrapper = mount(CheckboxField, { props: { label: 'L', disabled: true } })

    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
  })
})

describe('SwitchField', () => {
  it('natív jelölőnégyzet switch szerepkörrel, kétirányú', async () => {
    const wrapper = mount(SwitchField, { props: { label: 'Aktív', modelValue: true } })
    const input = wrapper.find('input')

    expect(input.attributes('type')).toBe('checkbox')
    expect(input.attributes('role')).toBe('switch')
    expect((input.element as HTMLInputElement).checked).toBe(true)

    await input.setValue(false)

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('a hiba jelzett, a sín dekoratív', () => {
    const wrapper = mount(SwitchField, { props: { label: 'L', error: ['Kötelező.'] } })

    expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
    expect(wrapper.find('.choice__track').attributes('aria-hidden')).toBe('true')
  })
})

describe('RadioField', () => {
  it('a kiválasztott érték szerint jelölt, választáskor az értéket adja', async () => {
    const wrapper = mount(RadioField, {
      props: { label: 'B', value: 'b', name: 'csoport', modelValue: 'a' },
    })
    const input = wrapper.find('input[type="radio"]')

    expect((input.element as HTMLInputElement).checked).toBe(false)
    expect(input.attributes('name')).toBe('csoport')

    await input.trigger('change')

    expect(wrapper.emitted('update:modelValue')).toEqual([['b']])
  })

  it('a kiválasztott opció jelölt, a szám érték típusa megmarad', async () => {
    const wrapper = mount(RadioField, {
      props: { label: 'Kettő', value: 2, name: 'n', modelValue: 2 },
    })

    expect((wrapper.find('input').element as HTMLInputElement).checked).toBe(true)

    await wrapper.setProps({ modelValue: 1 })

    expect((wrapper.find('input').element as HTMLInputElement).checked).toBe(false)
  })

  it('súgó és letiltás', () => {
    const wrapper = mount(RadioField, {
      props: { label: 'L', value: 'x', name: 'n', hint: 'Megjegyzés', disabled: true },
    })

    expect(wrapper.find('input').attributes('aria-describedby')).toBe(
      wrapper.find('p').attributes('id'),
    )
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
  })
})
