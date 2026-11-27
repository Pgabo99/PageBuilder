import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { resetToasts, useToast } from '@/composables/useToast'
import ToastHost from '../ToastHost.vue'

describe('toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetToasts()
  })

  afterEach(() => vi.useRealTimers())

  it('a siker állapotjelzésként, a hiba riasztásként jelenik meg', async () => {
    const wrapper = mount(ToastHost)
    const toast = useToast()

    toast.success('Mentve.')
    toast.error('Hiba történt.')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[role="status"]').text()).toContain('Mentve.')
    expect(wrapper.find('[role="alert"]').text()).toContain('Hiba történt.')
  })

  it('a toast ikonja a fajtához igazodik, és dekoratív', async () => {
    const wrapper = mount(ToastHost)
    const toast = useToast()

    toast.success('Mentve.')
    toast.error('Hiba történt.')
    await wrapper.vm.$nextTick()

    const icons = wrapper.findAll('.toast__icon')
    expect(icons).toHaveLength(2)
    expect(icons.every((icon) => icon.attributes('aria-hidden') === 'true')).toBe(true)
    expect(wrapper.find('.toast--success .toast__icon').exists()).toBe(true)
    expect(wrapper.find('.toast--error .toast__icon').exists()).toBe(true)
  })

  it('magától eltűnik: a sikeres hamarabb, a hiba később', async () => {
    const wrapper = mount(ToastHost)
    const toast = useToast()
    toast.success('Mentve.')
    toast.error('Hiba történt.')

    await vi.advanceTimersByTimeAsync(4000)
    expect(wrapper.text()).not.toContain('Mentve.')
    expect(wrapper.text()).toContain('Hiba történt.')

    await vi.advanceTimersByTimeAsync(4000)
    expect(wrapper.text()).not.toContain('Hiba történt.')
  })

  it('kézzel bezárható', async () => {
    const wrapper = mount(ToastHost)
    useToast().success('Mentve.')
    await wrapper.vm.$nextTick()

    await wrapper.find('button[aria-label="Értesítés bezárása"]').trigger('click')

    expect(wrapper.text()).not.toContain('Mentve.')
  })

  it('több értesítést egyszerre mutat', async () => {
    const wrapper = mount(ToastHost)
    const toast = useToast()

    toast.success('Egy.')
    toast.success('Kettő.')
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.toast')).toHaveLength(2)
  })
})
