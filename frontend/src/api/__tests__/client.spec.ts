import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError, ValidationError, request, setUnauthenticatedHandler } from '../client'

function json(status: number, body: unknown = {}): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function clearCookies(): void {
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
}

describe('API-kliens', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    clearCookies()
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
    setUnauthenticatedHandler(null)
  })

  it('az XSRF-TOKEN cookie aktuális, URL-dekódolt értékét küldi', async () => {
    document.cookie = 'XSRF-TOKEN=abc%3D%3D; path=/'
    fetchMock.mockResolvedValue(json(200, { ok: true }))

    await request('POST', '/api/v1/login', {})

    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(headers['X-XSRF-TOKEN']).toBe('abc==')
  })

  it('token nélkül előbb lekéri a CSRF cookie-t', async () => {
    fetchMock.mockImplementation(async (path) => {
      if (path === '/sanctum/csrf-cookie') document.cookie = 'XSRF-TOKEN=uj; path=/'
      return json(path === '/sanctum/csrf-cookie' ? 204 : 200, {})
    })

    await request('POST', '/api/v1/login', {})

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      '/sanctum/csrf-cookie',
      '/api/v1/login',
    ])
  })

  it('419-re új CSRF cookie-val egyszer újrapróbálja', async () => {
    document.cookie = 'XSRF-TOKEN=regi; path=/'
    fetchMock
      .mockResolvedValueOnce(json(419))
      .mockResolvedValueOnce(json(204))
      .mockResolvedValueOnce(json(200, { ok: true }))

    await expect(request('POST', '/api/v1/login', {})).resolves.toEqual({ ok: true })
    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      '/api/v1/login',
      '/sanctum/csrf-cookie',
      '/api/v1/login',
    ])
  })

  it('422-re mezőnkénti hibákat ad', async () => {
    document.cookie = 'XSRF-TOKEN=t; path=/'
    fetchMock.mockResolvedValue(json(422, { message: 'Hibás', errors: { email: ['Foglalt.'] } }))

    const error = await request('POST', '/api/v1/register', {}).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ValidationError)
    expect((error as ValidationError).errors.email).toEqual(['Foglalt.'])
  })

  it('401-re meghívja a lejárt session kezelőjét', async () => {
    const handler = vi.fn<() => void>()
    setUnauthenticatedHandler(handler)
    fetchMock.mockResolvedValue(json(401))

    await expect(request('GET', '/api/v1/user')).rejects.toBeInstanceOf(ApiError)
    expect(handler).toHaveBeenCalledOnce()
  })

  it('hálózati és szerverhibára érthető üzenetet ad', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(request('GET', '/api/v1/user')).rejects.toThrow('A szerver nem érhető el')

    fetchMock.mockResolvedValueOnce(json(500))
    await expect(request('GET', '/api/v1/user')).rejects.toThrow('Szerverhiba történt')
  })
})
