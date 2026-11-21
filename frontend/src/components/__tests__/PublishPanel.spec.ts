import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/api/client'
import { websitesApi } from '@/api/websites'
import { resetToasts, useToast } from '@/composables/useToast'
import type { Website } from '@/types/content'
import PublishPanel from '../PublishPanel.vue'

vi.mock('@/api/websites', () => ({
  websitesApi: {
    get: vi.fn<(id: number) => Promise<Website>>(),
    publish: vi.fn<(id: number) => Promise<Website>>(),
  },
}))

const base: Website = {
  id: 1,
  name: 'Próba',
  slug: 'proba',
  publish_status: null,
  published_at: null,
  published_url: null,
  publish_error: null,
  accent_color: null,
  page_theme: null,
  created_at: '',
  updated_at: '',
}

const publishButton = (wrapper: ReturnType<typeof mount>) => wrapper.find('button')

describe('PublishPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetToasts()
    vi.mocked(websitesApi.get).mockReset()
    vi.mocked(websitesApi.publish).mockReset()
  })

  afterEach(() => vi.useRealTimers())

  it('publikálatlan webhelynél jelzi az állapotot, és engedi a publikálást', () => {
    const wrapper = mount(PublishPanel, { props: { website: base } })

    expect(wrapper.text()).toContain('Még nincs publikálva.')
    expect(publishButton(wrapper).attributes('disabled')).toBeUndefined()
    expect(wrapper.find('a').exists()).toBe(false)
  })

  it('publikáláskor sorban áll, folyamatban, majd kész: lekérdez és leáll', async () => {
    vi.mocked(websitesApi.publish).mockResolvedValue({ ...base, publish_status: 'queued' })
    vi.mocked(websitesApi.get)
      .mockResolvedValueOnce({ ...base, publish_status: 'running' })
      .mockResolvedValueOnce({
        ...base,
        publish_status: 'succeeded',
        published_at: '2026-11-19T20:00:00Z',
        published_url: '/sites/proba/',
      })
    const wrapper = mount(PublishPanel, { props: { website: base } })

    await publishButton(wrapper).trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Sorban áll')
    expect(publishButton(wrapper).attributes('disabled')).toBeDefined()

    await vi.advanceTimersByTimeAsync(2000)
    expect(wrapper.text()).toContain('Publikálás folyamatban')

    await vi.advanceTimersByTimeAsync(2000)
    expect(wrapper.text()).toContain('Publikálva:')
    expect(wrapper.find('a').attributes('href')).toBe('/sites/proba/')
    expect(wrapper.find('a').attributes('rel')).toBe('noopener')
    expect(publishButton(wrapper).attributes('disabled')).toBeUndefined()

    await vi.advanceTimersByTimeAsync(10_000)
    expect(websitesApi.get).toHaveBeenCalledTimes(2)
  })

  it('a lefutott publikálásról értesítést küld, de betöltéskor a kész állapotról nem', async () => {
    mount(PublishPanel, {
      props: {
        website: { ...base, publish_status: 'succeeded', published_at: '2026-11-19T20:00:00Z' },
      },
    })
    expect(useToast().toasts.value).toHaveLength(0)

    vi.mocked(websitesApi.publish).mockResolvedValue({ ...base, publish_status: 'queued' })
    vi.mocked(websitesApi.get).mockResolvedValue({ ...base, publish_status: 'succeeded' })
    const wrapper = mount(PublishPanel, { props: { website: base } })
    await publishButton(wrapper).trigger('click')
    await flushPromises()
    await vi.advanceTimersByTimeAsync(2000)

    expect(useToast().toasts.value.map((toast) => toast.message)).toEqual(['Webhely publikálva.'])
  })

  it('betöltéskor folyamatban lévő publikálásnál is lekérdez', async () => {
    vi.mocked(websitesApi.get).mockResolvedValue({
      ...base,
      publish_status: 'succeeded',
      published_at: '2026-11-19T20:00:00Z',
      published_url: '/sites/proba/',
    })
    const wrapper = mount(PublishPanel, {
      props: { website: { ...base, publish_status: 'running' } },
    })

    expect(wrapper.text()).toContain('Publikálás folyamatban')
    await vi.advanceTimersByTimeAsync(2000)

    expect(wrapper.text()).toContain('Publikálva:')
  })

  it('sikertelen publikálásnál megmutatja a hibaüzenetet', () => {
    const wrapper = mount(PublishPanel, {
      props: {
        website: { ...base, publish_status: 'failed', publish_error: 'A publikálás sikertelen.' },
      },
    })

    expect(wrapper.text()).toContain('Sikertelen: A publikálás sikertelen.')
    expect(publishButton(wrapper).attributes('disabled')).toBeUndefined()
  })

  it('a szerver hibáját (pl. 409, 422) megjeleníti', async () => {
    vi.mocked(websitesApi.publish).mockRejectedValue(
      new ApiError(422, 'Publikálás előtt hozz létre legalább egy oldalt.'),
    )
    const wrapper = mount(PublishPanel, { props: { website: base } })

    await publishButton(wrapper).trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toContain('legalább egy oldalt')
    expect(publishButton(wrapper).attributes('disabled')).toBeUndefined()
  })

  it('a megszűnéskor leállítja a lekérdezést', async () => {
    vi.mocked(websitesApi.get).mockResolvedValue({ ...base, publish_status: 'running' })
    const wrapper = mount(PublishPanel, {
      props: { website: { ...base, publish_status: 'running' } },
    })

    wrapper.unmount()
    await vi.advanceTimersByTimeAsync(10_000)

    expect(websitesApi.get).not.toHaveBeenCalled()
  })
})
