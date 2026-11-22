import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError, ValidationError } from '@/api/client'
import { websitesApi } from '@/api/websites'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import type { Website } from '@/types/content'
import HomeView from '../HomeView.vue'
import WebsiteFormView from '../WebsiteFormView.vue'

vi.mock('@/api/websites', () => ({
  websitesApi: {
    list: vi.fn<() => Promise<Website[]>>(),
    get: vi.fn<(id: number) => Promise<Website>>(),
    create: vi.fn<(payload: { name: string; slug: string }) => Promise<Website>>(),
    update: vi.fn<(id: number, payload: { name: string; slug: string }) => Promise<Website>>(),
    remove: vi.fn<(id: number) => Promise<void>>(),
  },
}))

const website: Website = {
  id: 7,
  name: 'Próba oldal',
  slug: 'proba-oldal',
  publish_status: null,
  published_at: null,
  published_url: null,
  publish_error: null,
  accent_color: null,
  page_theme: null,
  created_at: '',
  updated_at: '',
}

function mountView(component: typeof HomeView | typeof WebsiteFormView) {
  return mount(component, { global: { plugins: [router] } })
}

describe('HomeView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(websitesApi.list).mockReset()
  })

  it('üres listánál megjeleníti az üres állapotot', async () => {
    vi.mocked(websitesApi.list).mockResolvedValue([])
    const wrapper = mountView(HomeView)
    await flushPromises()

    expect(wrapper.text()).toContain('Még nincs webhelyed')
  })

  it('felsorolja a webhelyeket', async () => {
    vi.mocked(websitesApi.list).mockResolvedValue([website])
    const wrapper = mountView(HomeView)
    await flushPromises()

    expect(wrapper.text()).toContain('Próba oldal')
    expect(wrapper.text()).toContain('/sites/proba-oldal/')
  })

  it('hibánál hibaüzenetet mutat', async () => {
    vi.mocked(websitesApi.list).mockRejectedValue(new ApiError(500, 'Szerverhiba történt.'))
    const wrapper = mountView(HomeView)
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toContain('Szerverhiba történt.')
  })
})

describe('WebsiteFormView', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    // A route guard miatt bejelentkezett felhasználó kell a navigációhoz.
    const auth = useAuthStore()
    auth.user = { id: 1, name: 'A', email: 'a@example.com' }
    auth.initialized = true
    vi.mocked(websitesApi.create).mockReset()
    await router.replace('/websites/new')
  })

  it('a névből slugot javasol, amíg a felhasználó nem módosítja', async () => {
    const wrapper = mountView(WebsiteFormView)
    const [name, slug] = wrapper.findAll('input')

    await name!.setValue('Árvíztűrő oldal')
    expect((slug!.element as HTMLInputElement).value).toBe('arvizturo-oldal')

    await slug!.setValue('sajat')
    await name!.setValue('Más név')
    expect((slug!.element as HTMLInputElement).value).toBe('sajat')
  })

  it('a validációs hibát a mező alatt jeleníti meg', async () => {
    vi.mocked(websitesApi.create).mockRejectedValue(
      new ValidationError('Hibás', { slug: ['A webcím már foglalt.'] }),
    )
    const wrapper = mountView(WebsiteFormView)

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('A webcím már foglalt.')
  })

  it('sikeres mentés után a webhely oldalára lép', async () => {
    vi.mocked(websitesApi.create).mockResolvedValue(website)
    const wrapper = mountView(WebsiteFormView)

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('website')
    expect(router.currentRoute.value.params.id).toBe('7')
  })

  it('alapból nem küld színt és témát (alapértelmezett megjelenés)', async () => {
    vi.mocked(websitesApi.create).mockResolvedValue(website)
    const wrapper = mountView(WebsiteFormView)
    await wrapper.findAll('input')[0]!.setValue('Név')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(websitesApi.create).toHaveBeenCalledWith({
      name: 'Név',
      slug: 'nev',
      accent_color: null,
      page_theme: null,
    })
  })

  it('a kiválasztott kiemelőszínt és a sötét témát elküldi, az alapértelmezett visszaállítja', async () => {
    vi.mocked(websitesApi.create).mockResolvedValue(website)
    const wrapper = mountView(WebsiteFormView)
    await wrapper.findAll('input')[0]!.setValue('Név')

    await wrapper.find('input[type="color"]').setValue('#e11d48')
    await wrapper.find('select').setValue('dark')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(websitesApi.create).toHaveBeenLastCalledWith({
      name: 'Név',
      slug: 'nev',
      accent_color: '#e11d48',
      page_theme: 'dark',
    })

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Alapértelmezett')!
      .trigger('click')
    expect(wrapper.find('button.btn--small').exists()).toBe(false)
  })

  it.each([
    ['blue', '#1d5fd1'],
    ['purple', '#6d3fd0'],
  ] as const)(
    'a(z) %s témát elküldi, és a színválasztó az alapértelmezett színt mutatja',
    async (theme, accent) => {
      vi.mocked(websitesApi.create).mockResolvedValue(website)
      const wrapper = mountView(WebsiteFormView)
      await wrapper.findAll('input')[0]!.setValue('Név')

      await wrapper.find('select').setValue(theme)
      expect((wrapper.find('input[type="color"]').element as HTMLInputElement).value).toBe(accent)
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(websitesApi.create).toHaveBeenLastCalledWith({
        name: 'Név',
        slug: 'nev',
        accent_color: null,
        page_theme: theme,
      })
    },
  )

  it('szerkesztéskor betölti a mentett színt és témát', async () => {
    await router.replace('/websites/7/edit')
    vi.mocked(websitesApi.get).mockResolvedValue({
      ...website,
      accent_color: '#112233',
      page_theme: 'dark',
    })
    const wrapper = mountView(WebsiteFormView)
    await flushPromises()

    expect((wrapper.find('input[type="color"]').element as HTMLInputElement).value).toBe('#112233')
    expect((wrapper.find('select').element as HTMLSelectElement).value).toBe('dark')
  })
})
