import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

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
    await flushPromises()

    expect(wrapper.text()).toContain('Árvíztűrő Tükörfúrógép')
    expect(wrapper.findAll('button').map((b) => b.text())).toContain('Kijelentkezés')
  })

  it('a kezdeti navigáció alatt betöltésjelzőt mutat, utána az útvonal tartalmát', async () => {
    let release!: () => void
    const pending = new Promise<void>((resolve) => (release = resolve))
    const slowRouter = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<p>Tartalom</p>' } }],
    })
    slowRouter.beforeEach(() => pending)

    const wrapper = mount(App, { global: { plugins: [slowRouter] } })
    await flushPromises()

    expect(wrapper.find('[role="status"]').text()).toBe('Betöltés…')
    expect(wrapper.text()).not.toContain('Tartalom')

    release()
    await flushPromises()

    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Tartalom')
  })
})
