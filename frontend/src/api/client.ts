// Közös API-kliens: Sanctum SPA cookie-hitelesítés, CSRF és egységes hibakezelés.

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ValidationError extends ApiError {
  constructor(
    message: string,
    public readonly errors: Record<string, string[]>,
  ) {
    super(422, message)
    this.name = 'ValidationError'
  }
}

type UnauthenticatedHandler = () => void

let onUnauthenticated: UnauthenticatedHandler | null = null

/** A lejárt session (401) kezelője, pl. kijelentkeztetés és átirányítás. */
export function setUnauthenticatedHandler(handler: UnauthenticatedHandler | null): void {
  onUnauthenticated = handler
}

function readXsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/)
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

async function fetchCsrfCookie(): Promise<void> {
  await send('GET', '/sanctum/csrf-cookie')
}

async function send(method: string, path: string, body?: unknown): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  // A cookie-t minden kérésnél frissen olvassuk: a Laravel minden válasznál megújíthatja.
  const token = readXsrfToken()
  if (token) headers['X-XSRF-TOKEN'] = token

  try {
    return await fetch(path, {
      method,
      headers,
      credentials: 'same-origin',
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'A szerver nem érhető el. Ellenőrizd a hálózati kapcsolatot.')
  }
}

const statusMessages: Record<number, string> = {
  401: 'A munkamenet lejárt, jelentkezz be újra.',
  403: 'Ehhez nincs jogosultságod.',
  404: 'A kért erőforrás nem található.',
  419: 'A munkamenet lejárt, frissítsd az oldalt.',
  429: 'Túl sok próbálkozás, várj egy percet.',
}

async function toError(response: Response): Promise<ApiError> {
  const data = (await response.json().catch(() => ({}))) as {
    message?: string
    errors?: Record<string, string[]>
  }
  if (response.status === 422) {
    return new ValidationError(data.message ?? 'Hibás adatok.', data.errors ?? {})
  }
  const message =
    statusMessages[response.status] ??
    (response.status >= 500
      ? 'Szerverhiba történt, próbáld újra később.'
      : 'Váratlan hiba történt.')
  return new ApiError(response.status, message)
}

export interface RequestOptions {
  /** 401 esetén ne fusson a lejárt session kezelője (pl. az első felhasználó-lekérdezésnél). */
  skipUnauthenticatedHandler?: boolean
}

export async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const mutating = method !== 'GET'
  if (mutating && !readXsrfToken()) await fetchCsrfCookie()

  let response = await send(method, path, body)

  // Lejárt CSRF token: új cookie, majd egy újrapróbálás.
  if (response.status === 419 && mutating) {
    await fetchCsrfCookie()
    response = await send(method, path, body)
  }

  if (!response.ok) {
    if (response.status === 401 && !options.skipUnauthenticatedHandler) onUnauthenticated?.()
    throw await toError(response)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

/** Felhasználónak megjeleníthető hibaüzenet bármely hibából. */
export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Váratlan hiba történt.'
}
