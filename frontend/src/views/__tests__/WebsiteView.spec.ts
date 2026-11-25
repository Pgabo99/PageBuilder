import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { pagesApi } from '@/api/pages'
import { websitesApi } from '@/api/websites'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import { useConfirm } from '@/composables/useConfirm'
import type { Page, PagePayload, Website } from '@/types/content'
import WebsiteView from '../WebsiteView.vue'

vi.mock('@/api/websites', () => ({
  websitesApi: {
    get: vi.fn<(id: number) => Promise<Website>>(),
    remove: vi.fn<(id: number) => Promise<void>>(),
    publish: vi.fn<(id: number) => Promise<Website>>(),
    list: vi.fn<() => Promise<Website[]>>(),
    create: vi.fn<(payload: { name: string; slug: string }) => Promise<Website>>(),
    update: vi.fn<(id: number, payload: { name: string; slug: string }) => Promise<Website>>(),
  },
}))
vi.mock('@/api/pages', () => ({
  pagesApi: {
    list: vi.fn<(websiteId: number) => Promise<Page[]>>(),
    remove: vi.fn<(id: number) => Promise<void>>(),
    get: vi.fn<(id: number) => Promise<Page>>(),
    create: vi.fn<(websiteId: number, payload: PagePayload) => Promise<Page>>(),
    update: vi.fn<(id: number, payload: PagePayload) => Promise<Page>>(),
  },
}))

const website: Website = {
  id: 1,
  name: 'Próba',
  slug: 'proba',
  publish_status: null,
  published_at: null,
  published_url: null,
  publish_error: null,
  accent_color: null,
  page_theme: null,
  palette: null,
  created_at: '',
  updated_at: '',
}
const page: Page = {
  id: 5,
  website_id: 1,
  title: 'Kezdő',
  slug: 'kezdo',
  position: 1,
  content: [],
  created_at: '',
  updated_at: '',
}

async function mountView() {
  await router.replace('/websites/1')
  const wrapper = mount(WebsiteView, { global: { plugins: [router] } })
  await flushPromises()
  return wrapper
}

const deleteButtons = (wrapper: Awaited<ReturnType<typeof mountView>>) =>
  wrapper.findAll('button').filter((b) => b.text() === 'Törlés')

describe('WebsiteView törlés', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const auth = useAuthStore()
    auth.user = { id: 1, name: 'A', email: 'a@example.com' }
    auth.initialized = true
    useConfirm().answer(false)
    vi.mocked(websitesApi.get).mockResolvedValue(website)
    vi.mocked(websitesApi.remove).mockReset().mockResolvedValue(undefined)
    vi.mocked(pagesApi.list).mockReset().mockResolvedValue([page])
    vi.mocked(pagesApi.remove).mockReset().mockResolvedValue(undefined)
  })

  it('az oldal törlése előbb rákérdez, és nem töröl, amíg nincs megerősítés', async () => {
    const wrapper = await mountView()

    await deleteButtons(wrapper)[1]!.trigger('click')

    expect(useConfirm().pending.value?.title).toBe('Oldal törlése')
    expect(useConfirm().pending.value?.message).toContain('Kezdő')
    expect(pagesApi.remove).not.toHaveBeenCalled()
  })

  it('megerősítés után törli az oldalt és újratölti a listát', async () => {
    const wrapper = await mountView()

    await deleteButtons(wrapper)[1]!.trigger('click')
    useConfirm().answer(true)
    await flushPromises()

    expect(pagesApi.remove).toHaveBeenCalledWith(5)
    expect(pagesApi.list).toHaveBeenCalledTimes(2)
  })

  it('a mégsem nem töröl semmit', async () => {
    const wrapper = await mountView()

    await deleteButtons(wrapper)[0]!.trigger('click')
    useConfirm().answer(false)
    await flushPromises()

    expect(websitesApi.remove).not.toHaveBeenCalled()
    expect(pagesApi.remove).not.toHaveBeenCalled()
  })

  it('a webhely törlése megerősítés után a kezdőlapra visz', async () => {
    const wrapper = await mountView()

    await deleteButtons(wrapper)[0]!.trigger('click')
    expect(useConfirm().pending.value?.title).toBe('Webhely törlése')
    useConfirm().answer(true)
    await flushPromises()

    expect(websitesApi.remove).toHaveBeenCalledWith(1)
    expect(router.currentRoute.value.name).toBe('home')
  })
})
