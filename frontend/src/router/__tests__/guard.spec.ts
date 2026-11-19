import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useAuthStore } from '@/stores/auth'
import router from '../index'

describe('router guard', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    useAuthStore().initialized = true
    await router.replace('/register')
  })

  it('kijelentkezve a védett oldalról a bejelentkezésre irányít', async () => {
    await router.push('/')

    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/')
  })

  it('bejelentkezve a vendégoldalról a kezdőoldalra irányít', async () => {
    useAuthStore().user = { id: 1, name: 'A', email: 'a@example.com' }

    await router.push('/login')

    expect(router.currentRoute.value.name).toBe('home')
  })
})
