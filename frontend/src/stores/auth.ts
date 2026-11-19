import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { ApiError, request } from '@/api/client'
import type { LoginPayload, RegisterPayload, User } from '@/types/user'

interface UserResponse {
  data: User
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const initialized = ref(false)
  const isAuthenticated = computed(() => user.value !== null)

  /** A session alapján visszaállítja a bejelentkezett állapotot (pl. oldalfrissítés után). */
  async function fetchUser(): Promise<void> {
    try {
      const response = await request<UserResponse>('GET', '/api/v1/user', undefined, {
        skipUnauthenticatedHandler: true,
      })
      user.value = response.data
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error
      user.value = null
    } finally {
      initialized.value = true
    }
  }

  async function login(payload: LoginPayload): Promise<void> {
    const response = await request<UserResponse>('POST', '/api/v1/login', payload)
    user.value = response.data
  }

  async function register(payload: RegisterPayload): Promise<void> {
    const response = await request<UserResponse>('POST', '/api/v1/register', payload)
    user.value = response.data
  }

  async function logout(): Promise<void> {
    await request<void>('POST', '/api/v1/logout')
    user.value = null
  }

  /** Lejárt session: a helyi állapot törlése, szerverhívás nélkül. */
  function clear(): void {
    user.value = null
  }

  return { user, initialized, isAuthenticated, fetchUser, login, register, logout, clear }
})
