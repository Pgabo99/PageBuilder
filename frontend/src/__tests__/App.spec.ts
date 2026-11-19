import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useAuthStore } from '@/stores/auth'
import router from '@/router'
import App from '../App.vue'

describe('App', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('bejelentkezve megjeleníti a nevet és a kijelentkezés gombot', async () => {
    const auth = useAuthStore()
    auth.user = { id: 1, name: 'Árvíztűrő Tükörfúrógép', email: 'a@example.com' }
    auth.initialized = true

    await router.push('/')
    const wrapper = mount(App, { global: { plugins: [router] } })

    expect(wrapper.text()).toContain('Árvíztűrő Tükörfúrógép')
    expect(wrapper.find('button').text()).toBe('Kijelentkezés')
  })
})
