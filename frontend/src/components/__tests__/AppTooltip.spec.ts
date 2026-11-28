import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import AppTooltip from '../AppTooltip.vue'

function mountTooltip() {
  return mount(AppTooltip, {
    props: { text: 'Súgószöveg' },
    slots: { default: '<button type="button">Gomb</button>' },
    attachTo: document.body,
  })
}

describe('AppTooltip', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('az első fókuszálható elemhez köti a leírást, zárva nincs szöveg', () => {
    const wrapper = mountTooltip()

    expect(wrapper.find('button').attributes('aria-describedby')).toBeDefined()
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('hoverre késleltetéssel jelenik meg, és az id megegyezik a leírással', async () => {
    const wrapper = mountTooltip()

    await wrapper.trigger('mouseenter')
    await vi.advanceTimersByTimeAsync(399)
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    await flushPromises()

    const tip = wrapper.find('[role="tooltip"]')
    expect(tip.text()).toBe('Súgószöveg')
    expect(tip.attributes('id')).toBe(wrapper.find('button').attributes('aria-describedby'))
    wrapper.unmount()
  })

  it('rövid hover nem mutatja, az egér elhagyása elrejti', async () => {
    const wrapper = mountTooltip()

    await wrapper.trigger('mouseenter')
    await vi.advanceTimersByTimeAsync(200)
    await wrapper.trigger('mouseleave')
    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)

    await wrapper.trigger('mouseenter')
    await vi.advanceTimersByTimeAsync(400)
    await flushPromises()
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(true)
    await wrapper.trigger('mouseleave')
    await flushPromises()
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('billentyűzetes fókuszra azonnal megjelenik, Escape és a fókusz elhagyása zárja', async () => {
    const wrapper = mountTooltip()
    const button = wrapper.find('button')
    // A jsdom nem ismeri a :focus-visible-t, ezért a találatot kikényszerítjük.
    Object.defineProperty(button.element, 'matches', { value: () => true })

    await button.trigger('focusin')
    await flushPromises()
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(true)

    await button.trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)

    await button.trigger('focusin')
    await flushPromises()
    await button.trigger('focusout')
    await flushPromises()
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('az egérkattintás utáni fókusz (nem :focus-visible) nem nyitja meg, a lenyomás elrejti', async () => {
    const wrapper = mountTooltip()
    const button = wrapper.find('button')
    Object.defineProperty(button.element, 'matches', { value: () => false })

    await button.trigger('focusin')
    await flushPromises()
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)

    await wrapper.trigger('mouseenter')
    await vi.advanceTimersByTimeAsync(400)
    await flushPromises()
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(true)
    await wrapper.trigger('pointerdown')
    await flushPromises()
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
