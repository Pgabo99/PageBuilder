import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initTheme, useTheme } from '../useTheme'

function mockSystemDark(matches: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn<(query: string) => { matches: boolean }>().mockReturnValue({ matches }),
  )
}

// A Node 26 saját (kísérleti) localStorage-a elfedi a jsdom-ét, ezért memóriabeli tárhelyet telepítünk.
function installStorage(overrides: Partial<Pick<Storage, 'getItem' | 'setItem'>> = {}) {
  const data = new Map<string, string>()
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    ...overrides,
  }
  Object.defineProperty(window, 'localStorage', { value: storage, configurable: true })
  return storage
}

describe('useTheme', () => {
  beforeEach(() => {
    delete document.documentElement.dataset.theme
  })

  afterEach(() => vi.unstubAllGlobals())

  it('mentett választás nélkül a rendszerbeállítást követi', () => {
    installStorage()
    mockSystemDark(true)
    initTheme()

    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('a mentett választás elsőbbséget élvez a rendszerbeállítással szemben', () => {
    const storage = installStorage()
    storage.setItem('theme', 'light')
    mockSystemDark(true)
    initTheme()

    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('váltáskor átállítja és elmenti a témát', () => {
    const storage = installStorage()
    mockSystemDark(false)
    initTheme()
    const { theme, toggle } = useTheme()

    toggle()

    expect(theme.value).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(storage.getItem('theme')).toBe('dark')

    toggle()
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('érvénytelen mentett értéket figyelmen kívül hagy', () => {
    const storage = installStorage()
    storage.setItem('theme', 'rózsaszín')
    mockSystemDark(false)
    initTheme()

    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('tiltott tárhely esetén is működik', () => {
    installStorage({
      getItem: () => {
        throw new Error('tiltott')
      },
      setItem: () => {
        throw new Error('tiltott')
      },
    })
    mockSystemDark(false)
    initTheme()
    const { toggle } = useTheme()

    expect(() => toggle()).not.toThrow()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
