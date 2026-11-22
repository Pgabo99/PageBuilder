import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AppIcon from '../AppIcon.vue'

describe('AppIcon', () => {
  it('az engedélyezett ikont dekoratív SVG-ként rajzolja ki, a szöveg színét átvéve', () => {
    const wrapper = mount(AppIcon, { props: { name: 'mail' } })
    const svg = wrapper.find('svg')

    expect(svg.classes()).toContain('icon')
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.attributes('focusable')).toBe('false')
    expect(svg.attributes('stroke')).toBe('currentColor')
    expect(svg.attributes('viewBox')).toBe('0 0 24 24')
    expect(svg.findAll('path, polyline')).toHaveLength(2)
  })

  it.each([null, undefined, '', 'nincs-ilyen', '<svg onload=alert(1)>'])(
    'ismeretlen vagy üres névre (%s) semmit nem rajzol',
    (name) => {
      const wrapper = mount(AppIcon, { props: { name } })

      expect(wrapper.find('svg').exists()).toBe(false)
      expect(wrapper.html()).not.toContain('onload')
    },
  )
})
