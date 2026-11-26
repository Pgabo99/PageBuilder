import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'

import { LOADER_DELAY_MS, LOADER_MIN_VISIBLE_MS, useDelayedFlag } from '../useDelayedFlag'

describe('useDelayedFlag', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  function setup(initial = false) {
    const source = ref(initial)
    const scope = effectScope()
    const visible = scope.run(() => useDelayedFlag(source))!
    return { source, visible, scope }
  }

  it('rövid betöltésnél meg sem jelenik (nincs villogás)', async () => {
    const { source, visible } = setup()

    source.value = true
    await nextTick()
    vi.advanceTimersByTime(LOADER_DELAY_MS - 1)
    source.value = false
    await nextTick()
    vi.advanceTimersByTime(LOADER_DELAY_MS + LOADER_MIN_VISIBLE_MS)

    expect(visible.value).toBe(false)
  })

  it('hosszabb betöltésnél a késleltetés után jelenik meg', async () => {
    const { source, visible } = setup()

    source.value = true
    await nextTick()
    expect(visible.value).toBe(false)
    vi.advanceTimersByTime(LOADER_DELAY_MS)

    expect(visible.value).toBe(true)
  })

  it('megjelenés után legalább a minimális ideig látszik, mesterséges várakozás nélkül a forráson', async () => {
    const { source, visible } = setup()
    source.value = true
    await nextTick()
    vi.advanceTimersByTime(LOADER_DELAY_MS)

    vi.advanceTimersByTime(50)
    source.value = false
    await nextTick()
    expect(source.value).toBe(false)
    expect(visible.value).toBe(true)

    vi.advanceTimersByTime(LOADER_MIN_VISIBLE_MS - 50 - 1)
    expect(visible.value).toBe(true)
    vi.advanceTimersByTime(1)
    expect(visible.value).toBe(false)
  })

  it('a minimális idő letelte után azonnal eltűnik', async () => {
    const { source, visible } = setup()
    source.value = true
    await nextTick()
    vi.advanceTimersByTime(LOADER_DELAY_MS + LOADER_MIN_VISIBLE_MS + 100)

    source.value = false
    await nextTick()
    vi.advanceTimersByTime(0)

    expect(visible.value).toBe(false)
  })

  it('a minimális idő alatt újraindított betöltés nem tűnik el', async () => {
    const { source, visible } = setup()
    source.value = true
    await nextTick()
    vi.advanceTimersByTime(LOADER_DELAY_MS)
    source.value = false
    await nextTick()

    source.value = true
    await nextTick()
    vi.advanceTimersByTime(LOADER_MIN_VISIBLE_MS * 2)

    expect(visible.value).toBe(true)
  })

  it('a kezdetben igaz forrásnál is késleltet', async () => {
    const { visible } = setup(true)

    expect(visible.value).toBe(false)
    vi.advanceTimersByTime(LOADER_DELAY_MS)
    expect(visible.value).toBe(true)
  })

  it('a hatókör megszűnésekor leállítja az időzítőt', async () => {
    const { source, visible, scope } = setup()
    source.value = true
    await nextTick()

    scope.stop()
    vi.advanceTimersByTime(LOADER_DELAY_MS * 2)

    expect(visible.value).toBe(false)
  })
})
