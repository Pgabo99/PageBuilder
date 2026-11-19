import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/stores/auth'
import router from '@/router'
import App from '../App.vue'

// A kezdőoldal webhelylistát tölt: a hálózati hívást kiváltjuk.
vi.mock('@/api/websites', () => ({
  websitesApi: { list: vi.fn<() => Promise<never[]>>().mockResolvedValue([]) },
}))

describe('App', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('bejelentkezve megjeleníti a nevet és a kijelentkezés gombot', async () => {
    const auth = useAuthStore()
    auth.user = { id: 1, name: 'Árvíztűrő Tükörfúrógép', email: 'a@example.com' }
    auth.initialized = true

    await router.push('/')
    const wrapper = mount(App, { global: { plugins: [router] } })

    expect(wrapper.text()).toContain('Árvíztűrő Tükörfúrógép')
    expect(wrapper.findAll('button').map((b) => b.text())).toContain('Kijelentkezés')
  })
})
