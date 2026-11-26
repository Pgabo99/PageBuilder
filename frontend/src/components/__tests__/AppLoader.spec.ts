import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LOADER_DELAY_MS, LOADER_MIN_VISIBLE_MS } from '@/composables/useDelayedFlag'

import AppLoader from '../AppLoader.vue'

describe('AppLoader', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('betöltés közben azonnal van szöveges állapot, a pörgő jelző még nincs', () => {
    const wrapper = mount(AppLoader, { props: { loading: true } })

    expect(wrapper.find('[role="status"]').text()).toBe('Betöltés…')
    expect(wrapper.find('.sr-only').exists()).toBe(true)
    expect(wrapper.find('.loader__spinner').exists()).toBe(false)
  })

  it('a késleltetés után megjelenik a jelző, a szöveg pedig látható lesz', async () => {
    const wrapper = mount(AppLoader, { props: { loading: true } })

    await vi.advanceTimersByTimeAsync(LOADER_DELAY_MS)

    expect(wrapper.find('.loader__spinner').exists()).toBe(true)
    expect(wrapper.find('.loader__spinner').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('.sr-only').exists()).toBe(false)
  })

  it('nem betöltés közben nem renderel semmit', () => {
    const wrapper = mount(AppLoader, { props: { loading: false } })

    expect(wrapper.html()).toBe('<!--v-if-->')
  })

  it('egyedi felirat és méret osztály', () => {
    const wrapper = mount(AppLoader, { props: { loading: true, size: 'page', label: 'Mentés…' } })

    expect(wrapper.classes()).toContain('loader--page')
    expect(wrapper.find('[role="status"]').text()).toBe('Mentés…')
  })

  it('a gomb méret dekoratív: nincs role és felirat, a jelző késleltetve jelenik meg', async () => {
    const wrapper = mount(AppLoader, { props: { loading: true, size: 'button' } })

    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('.loader__spinner').exists()).toBe(false)

    await vi.advanceTimersByTimeAsync(LOADER_DELAY_MS)
    expect(wrapper.find('.loader__spinner').exists()).toBe(true)
  })

  it('a gomb jelzője a betöltés végén még a minimális ideig látszik', async () => {
    const wrapper = mount(AppLoader, { props: { loading: true, size: 'button' } })
    await vi.advanceTimersByTimeAsync(LOADER_DELAY_MS)

    await wrapper.setProps({ loading: false })
    expect(wrapper.find('.loader__spinner').exists()).toBe(true)

    await vi.advanceTimersByTimeAsync(LOADER_MIN_VISIBLE_MS)
    expect(wrapper.find('.loader__spinner').exists()).toBe(false)
    expect(wrapper.find('.loader').exists()).toBe(false)
  })

  it('rövid gombbetöltésnél a jelző meg sem jelenik', async () => {
    const wrapper = mount(AppLoader, { props: { loading: true, size: 'button' } })

    await vi.advanceTimersByTimeAsync(LOADER_DELAY_MS - 10)
    await wrapper.setProps({ loading: false })
    await vi.advanceTimersByTimeAsync(LOADER_MIN_VISIBLE_MS)

    expect(wrapper.find('.loader').exists()).toBe(false)
  })
})
