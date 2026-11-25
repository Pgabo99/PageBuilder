import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SelectField from '../SelectField.vue'

const text = [
  { value: 'a', label: 'Első' },
  { value: 'b', label: 'Második' },
]

describe('SelectField', () => {
  it('az üres elem csak az emptyLabel megadásakor van, és a null/undefined ezt választja', () => {
    const without = mount(SelectField, { props: { label: 'L', options: text, modelValue: 'a' } })
    const withEmpty = mount(SelectField, {
      props: { label: 'L', options: text, emptyLabel: 'Alapértelmezett', modelValue: undefined },
    })

    expect(without.findAll('option')).toHaveLength(2)
    expect(withEmpty.findAll('option')).toHaveLength(3)
    expect(withEmpty.find('option').text()).toBe('Alapértelmezett')
    expect((withEmpty.find('select').element as HTMLSelectElement).value).toBe('')
  })

  it('választáskor az érték eredeti típusát adja vissza, az üresre null-t', async () => {
    const wrapper = mount(SelectField, {
      props: { label: 'L', options: text, emptyLabel: 'Alap', modelValue: null },
    })
    await wrapper.find('select').setValue('b')
    await wrapper.find('select').setValue('')

    const numbers = mount(SelectField, {
      props: {
        label: 'Szint',
        options: [
          { value: 1, label: 'H1' },
          { value: 2, label: 'H2' },
        ],
        modelValue: 1,
      },
    })
    await numbers.find('select').setValue('2')

    expect(wrapper.emitted('update:modelValue')).toEqual([['b'], [null]])
    expect(numbers.emitted('update:modelValue')).toEqual([[2]])
  })

  it('a címkét a mezőhöz köti, a hibát jelzi', () => {
    const wrapper = mount(SelectField, {
      props: { label: 'Stílus', options: text, modelValue: 'a', error: ['Hibás érték.'] },
    })
    const select = wrapper.find('select')

    expect(wrapper.find('label').attributes('for')).toBe(select.attributes('id'))
    expect(select.attributes('aria-invalid')).toBe('true')
    expect(select.attributes('aria-describedby')).toBe(
      wrapper.find('.field__error').attributes('id'),
    )
    expect(wrapper.find('.field__error').text()).toBe('Hibás érték.')
  })
})
