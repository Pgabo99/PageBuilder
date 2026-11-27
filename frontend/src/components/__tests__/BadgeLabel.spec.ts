import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import BadgeLabel from '../BadgeLabel.vue'

describe('BadgeLabel', () => {
  it('a szöveget jeleníti meg, alapból semleges és pont nélkül', () => {
    const wrapper = mount(BadgeLabel, { slots: { default: 'Kész' } })

    expect(wrapper.text()).toBe('Kész')
    expect(wrapper.classes()).toContain('badge--neutral')
    expect(wrapper.find('.badge__dot').exists()).toBe(false)
  })

  it.each(['neutral', 'info', 'success', 'warning', 'danger'] as const)(
    'a(z) %s változat osztályt kap',
    (variant) => {
      const wrapper = mount(BadgeLabel, { props: { variant }, slots: { default: 'Állapot' } })

      expect(wrapper.classes()).toContain(`badge--${variant}`)
    },
  )

  it('a pont dekoratív: nincs a képernyőolvasó számára, a jelentést a szöveg adja', () => {
    const wrapper = mount(BadgeLabel, {
      props: { variant: 'success', dot: true },
      slots: { default: 'Publikálva' },
    })

    expect(wrapper.find('.badge__dot').attributes('aria-hidden')).toBe('true')
    expect(wrapper.text()).toBe('Publikálva')
  })
})
