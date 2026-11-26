import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SelectField from '../SelectField.vue'

const text = [
  { value: 'a', label: 'Első' },
  { value: 'b', label: 'Második' },
]

type Props = Record<string, unknown>

function mountSelect(props: Props = {}) {
  return mount(SelectField, {
    props: { label: 'L', options: text, modelValue: 'a', ...props },
    attachTo: document.body,
  })
}

const trigger = (wrapper: ReturnType<typeof mountSelect>) => wrapper.find('button[role="combobox"]')
const labels = (wrapper: ReturnType<typeof mountSelect>) =>
  wrapper.findAll('[role="option"]').map((el) => el.text())

async function open(wrapper: ReturnType<typeof mountSelect>) {
  await trigger(wrapper).trigger('click')
  await flushPromises()
}

async function press(wrapper: ReturnType<typeof mountSelect>, key: string) {
  await trigger(wrapper).trigger('keydown', { key })
  await flushPromises()
}

describe('SelectField', () => {
  it('zárva a kiválasztott opció címkéjét mutatja, a lista nincs a DOM-ban', () => {
    const wrapper = mountSelect({ modelValue: 'b' })

    expect(trigger(wrapper).text()).toBe('Második')
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('az üres elem csak az emptyLabel megadásakor van, és a null/undefined ezt választja', async () => {
    const without = mountSelect({ modelValue: 'a' })
    const withEmpty = mountSelect({ emptyLabel: 'Alapértelmezett', modelValue: undefined })

    await open(without)
    await open(withEmpty)

    expect(labels(without)).toEqual(['Első', 'Második'])
    expect(labels(withEmpty)).toEqual(['Alapértelmezett', 'Első', 'Második'])
    expect(trigger(withEmpty).text()).toBe('Alapértelmezett')
    without.unmount()
    withEmpty.unmount()
  })

  it('választáskor az érték eredeti típusát adja vissza, az üresre null-t, és bezár', async () => {
    const wrapper = mountSelect({ emptyLabel: 'Alap', modelValue: null })
    await open(wrapper)
    await wrapper.find('[data-value="b"]').trigger('click')
    await open(wrapper)
    await wrapper.find('[data-value=""]').trigger('click')

    const numbers = mountSelect({
      label: 'Szint',
      options: [
        { value: 1, label: 'H1' },
        { value: 2, label: 'H2' },
      ],
      modelValue: 1,
    })
    await open(numbers)
    await numbers.find('[data-value="2"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['b'], [null]])
    expect(numbers.emitted('update:modelValue')).toEqual([[2]])
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
    wrapper.unmount()
    numbers.unmount()
  })

  it('a címkét a mezőhöz köti, a hibát jelzi', () => {
    const wrapper = mountSelect({ label: 'Stílus', error: ['Hibás érték.'] })
    const button = trigger(wrapper)

    expect(wrapper.find('label').attributes('for')).toBe(button.attributes('id'))
    expect(button.attributes('aria-invalid')).toBe('true')
    expect(button.attributes('aria-describedby')).toBe(
      wrapper.find('.field__error').attributes('id'),
    )
    expect(wrapper.find('.field__error').text()).toBe('Hibás érték.')
  })

  it('a megnyitott lista szerepkörei és a kijelölés megfelelőek', async () => {
    const wrapper = mountSelect({ modelValue: 'b' })
    await open(wrapper)

    expect(trigger(wrapper).attributes('aria-expanded')).toBe('true')
    expect(trigger(wrapper).attributes('aria-controls')).toBe(
      wrapper.find('[role="listbox"]').attributes('id'),
    )
    const options = wrapper.findAll('[role="option"]')
    expect(options.map((o) => o.attributes('aria-selected'))).toEqual(['false', 'true'])
    expect(trigger(wrapper).attributes('aria-activedescendant')).toBe(options[1]!.attributes('id'))
    expect(options[1]!.find('.select__check').exists()).toBe(true)
    wrapper.unmount()
  })

  it('placeholder: kiválasztás nélkül jelenik meg', () => {
    const wrapper = mountSelect({ modelValue: null, placeholder: 'Válassz…' })

    expect(trigger(wrapper).text()).toBe('Válassz…')
    expect(wrapper.find('.select__value--placeholder').exists()).toBe(true)
  })

  it('billentyűzet: nyilak léptetnek, Enter választ, Escape bezár változtatás nélkül', async () => {
    const wrapper = mountSelect({ modelValue: 'a' })

    await press(wrapper, 'ArrowDown')
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('true')
    await press(wrapper, 'ArrowDown')
    await press(wrapper, 'Enter')
    expect(wrapper.emitted('update:modelValue')).toEqual([['b']])
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false')

    await press(wrapper, 'ArrowDown')
    await press(wrapper, 'Escape')
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    wrapper.unmount()
  })

  it('billentyűzet: Home és End az első és utolsó elemre ugrik, a határon megáll', async () => {
    const wrapper = mountSelect({
      modelValue: 'a',
      options: [...text, { value: 'c', label: 'Harmadik' }],
    })

    await press(wrapper, 'Enter')
    await press(wrapper, 'End')
    await press(wrapper, 'ArrowDown')
    await press(wrapper, 'Enter')
    await press(wrapper, 'Enter')
    await press(wrapper, 'Home')
    await press(wrapper, 'ArrowUp')
    await press(wrapper, 'Enter')

    expect(wrapper.emitted('update:modelValue')).toEqual([['c'], ['a']])
    wrapper.unmount()
  })

  it('Tab bezárja a listát, a kívülre kattintás is', async () => {
    const wrapper = mountSelect()

    await open(wrapper)
    await press(wrapper, 'Tab')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)

    await open(wrapper)
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await flushPromises()
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('a letiltott opció nem választható, és a nyilak átlépik', async () => {
    const wrapper = mountSelect({
      modelValue: 'a',
      options: [
        { value: 'a', label: 'Első' },
        { value: 'b', label: 'Második', disabled: true },
        { value: 'c', label: 'Harmadik' },
      ],
    })

    await open(wrapper)
    await wrapper.find('[data-value="b"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.find('[data-value="b"]').attributes('aria-disabled')).toBe('true')

    await press(wrapper, 'ArrowDown')
    await press(wrapper, 'Enter')
    expect(wrapper.emitted('update:modelValue')).toEqual([['c']])
    wrapper.unmount()
  })

  it('a letiltott mező nem nyílik meg', async () => {
    const wrapper = mountSelect({ disabled: true })

    expect(trigger(wrapper).attributes('disabled')).toBeDefined()
    await press(wrapper, 'ArrowDown')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('csoportok címkével, ikon és leírás opcionálisan', async () => {
    const wrapper = mountSelect({
      modelValue: 'x',
      options: [
        { value: 'x', label: 'Alma', group: 'Gyümölcs', icon: 'star', description: 'Piros' },
        { value: 'y', label: 'Répa', group: 'Zöldség' },
        { value: 'z', label: 'Kenyér' },
      ],
    })
    await open(wrapper)

    expect(wrapper.findAll('[role="group"]')).toHaveLength(3)
    expect(wrapper.findAll('.select__group-label').map((el) => el.text())).toEqual([
      'Gyümölcs',
      'Zöldség',
    ])
    expect(wrapper.find('.select__option-desc').text()).toBe('Piros')
    expect(wrapper.find('.select__option-icon').exists()).toBe(true)
    expect(trigger(wrapper).find('svg').exists()).toBe(true)
    wrapper.unmount()
  })

  it('a címkére kattintás nem nyitja meg a listát', async () => {
    const wrapper = mountSelect()

    await wrapper.find('label').trigger('click')

    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false')
    wrapper.unmount()
  })
})
