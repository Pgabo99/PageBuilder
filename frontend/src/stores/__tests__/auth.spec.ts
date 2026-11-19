import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError, ValidationError, request } from '@/api/client'
import { useAuthStore } from '../auth'

vi.mock('@/api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/client')>()),
  request: vi.fn<typeof request>(),
}))

const requestMock = vi.mocked(request)
const user = { id: 1, name: 'Árvíztűrő Tükörfúrógép', email: 'a@example.com' }

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    requestMock.mockReset()
  })

  it('sikeres login után beállítja a felhasználót', async () => {
    requestMock.mockResolvedValue({ data: user })
    const auth = useAuthStore()

    await auth.login({ email: user.email, password: 'x' })

    expect(auth.user).toEqual(user)
    expect(auth.isAuthenticated).toBe(true)
  })

  it('validációs hibánál nem jelentkeztet be', async () => {
    requestMock.mockRejectedValue(new ValidationError('Hibás', { email: ['Hibás adatok.'] }))
    const auth = useAuthStore()

    await expect(auth.login({ email: 'x', password: 'y' })).rejects.toBeInstanceOf(ValidationError)
    expect(auth.isAuthenticated).toBe(false)
  })

  it('401 esetén vendégként inicializál', async () => {
    requestMock.mockRejectedValue(new ApiError(401, 'Lejárt'))
    const auth = useAuthStore()

    await auth.fetchUser()

    expect(auth.user).toBeNull()
    expect(auth.initialized).toBe(true)
  })

  it('kijelentkezés után törli a felhasználót', async () => {
    requestMock.mockResolvedValueOnce({ data: user }).mockResolvedValueOnce(undefined)
    const auth = useAuthStore()
    await auth.login({ email: user.email, password: 'x' })

    await auth.logout()

    expect(auth.user).toBeNull()
  })
})
