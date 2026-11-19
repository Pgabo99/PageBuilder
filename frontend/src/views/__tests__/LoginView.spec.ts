import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError, ValidationError } from '@/api/client'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import LoginView from '../LoginView.vue'

function mountView() {
  return mount(LoginView, { global: { plugins: [router] } })
}

describe('LoginView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useAuthStore().initialized = true
  })

  it('megjeleníti a mezőnkénti validációs hibát', async () => {
    vi.spyOn(useAuthStore(), 'login').mockRejectedValue(
      new ValidationError('Hibás', { email: ['Hibás bejelentkezési adatok.'] }),
    )
    const wrapper = mountView()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Hibás bejelentkezési adatok.')
    expect(wrapper.find('input[type="email"]').attributes('aria-invalid')).toBe('true')
  })

  it('szerverhibánál általános hibaüzenetet mutat', async () => {
    vi.spyOn(useAuthStore(), 'login').mockRejectedValue(
      new ApiError(500, 'Szerverhiba történt, próbáld újra később.'),
    )
    const wrapper = mountView()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toBe('Szerverhiba történt, próbáld újra később.')
  })

  it('kérés közben letiltja a küldés gombot', async () => {
    let resolve: () => void = () => {}
    vi.spyOn(useAuthStore(), 'login').mockReturnValue(new Promise<void>((r) => (resolve = r)))
    const wrapper = mountView()

    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
    resolve()
    await flushPromises()
  })
})
