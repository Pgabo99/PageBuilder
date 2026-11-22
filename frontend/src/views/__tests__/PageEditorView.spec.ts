import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { h } from 'vue'
import { RouterView } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ValidationError } from '@/api/client'
import { pagesApi } from '@/api/pages'
import { websitesApi } from '@/api/websites'
import router from '@/router'
import { useConfirm } from '@/composables/useConfirm'
import { useAuthStore } from '@/stores/auth'
import type { Page, PagePayload, Website } from '@/types/content'

vi.mock('@/api/pages', () => ({
  pagesApi: {
    get: vi.fn<(id: number) => Promise<Page>>(),
    update: vi.fn<(id: number, payload: PagePayload) => Promise<Page>>(),
    list: vi.fn<(websiteId: number) => Promise<Page[]>>(),
    create: vi.fn<(websiteId: number, payload: PagePayload) => Promise<Page>>(),
    remove: vi.fn<(id: number) => Promise<void>>(),
  },
}))

vi.mock('@/api/websites', () => ({
  websitesApi: { get: vi.fn<(id: number) => Promise<Website>>() },
}))

const page: Page = {
  id: 3,
  website_id: 1,
  title: 'Kezdőlap',
  slug: 'kezdolap',
  position: 1,
  content: [
    { id: 'a', type: 'heading', text: 'Első', level: 1 },
    { id: 'b', type: 'text', text: 'Második' },
    { id: 'c', type: 'button', label: 'Harmadik', url: '/x' },
  ],
  created_at: '',
  updated_at: '',
}

// A mountolt szerkesztők elhagyás-őrei élnek, amíg le nem szereljük őket.
const mounted: VueWrapper[] = []

async function mountEditor() {
  await router.replace('/pages/3')
  // RouterView-n át renderelünk: az elhagyás-őr csak így regisztrálódik az útvonalhoz.
  const wrapper = mount({ render: () => h(RouterView) }, { global: { plugins: [router] } })
  mounted.push(wrapper)
  await flushPromises()
  return wrapper
}

const titles = (wrapper: Awaited<ReturnType<typeof mountEditor>>) =>
  wrapper.findAll('.component').map((c) => c.find('strong').text())

describe('PageEditorView', () => {
  afterEach(() => mounted.splice(0).forEach((wrapper) => wrapper.unmount()))

  beforeEach(() => {
    setActivePinia(createPinia())
    const auth = useAuthStore()
    auth.user = { id: 1, name: 'A', email: 'a@example.com' }
    auth.initialized = true
    vi.mocked(pagesApi.get).mockResolvedValue(structuredClone(page))
    vi.mocked(pagesApi.update).mockReset()
    vi.mocked(pagesApi.list)
      .mockReset()
      .mockResolvedValue([
        page,
        { ...page, id: 4, title: 'Kapcsolat', slug: 'kapcsolat', position: 2 },
      ])
    vi.mocked(websitesApi.get)
      .mockReset()
      .mockResolvedValue({ id: 1, slug: 'demo' } as Website)
  })

  it('betölti az oldal komponenseit, és nincs mentetlen módosítás', async () => {
    const wrapper = await mountEditor()

    expect(titles(wrapper)).toEqual(['Címsor', 'Szöveg', 'Gomb'])
    expect(wrapper.text()).toContain('Mentve')
    expect(wrapper.find('button.btn:not(.btn--secondary)').attributes('disabled')).toBeDefined()
  })

  it('komponenst ad hozzá, majd a mentés elküldi a teljes tartalmat', async () => {
    const wrapper = await mountEditor()
    vi.mocked(pagesApi.update).mockImplementation(async (_id, payload) => ({
      ...page,
      ...payload,
    }))

    await wrapper
      .findAll('.add-bar button')
      .find((b) => b.text().includes('Szöveg'))!
      .trigger('click')
    expect(wrapper.text()).toContain('Nem mentett módosítások')
    await wrapper.find('button.btn:not(.btn--secondary)').trigger('click')
    await flushPromises()

    const payload = vi.mocked(pagesApi.update).mock.calls[0]![1]
    expect(payload.content).toHaveLength(4)
    expect(payload.content[3]).toMatchObject({ type: 'text', text: 'Új bekezdés' })
    expect(wrapper.text()).toContain('Mentve')
  })

  it('a fel/le gombbal átrendez, és az első/utolsó gomb le van tiltva', async () => {
    const wrapper = await mountEditor()
    const components = () => wrapper.findAll('.component')

    expect(components()[0]!.find('[aria-label="Feljebb"]').attributes('disabled')).toBeDefined()
    expect(components()[2]!.find('[aria-label="Lejjebb"]').attributes('disabled')).toBeDefined()

    await components()[0]!.find('[aria-label="Lejjebb"]').trigger('click')

    expect(titles(wrapper)).toEqual(['Szöveg', 'Címsor', 'Gomb'])
  })

  it('húzással átrendez', async () => {
    const wrapper = await mountEditor()
    const items = () => wrapper.findAll('.list > li')

    await items()[0]!.find('.component__handle').trigger('dragstart')
    await items()[2]!.trigger('dragover')
    await items()[2]!.trigger('drop')

    expect(titles(wrapper)).toEqual(['Szöveg', 'Gomb', 'Címsor'])
  })

  it('az előnézet a betöltött tartalmat mutatja', async () => {
    const wrapper = await mountEditor()
    const preview = wrapper.find('.preview')

    expect(preview.find('h1').text()).toBe('Első')
    expect(preview.text()).toContain('Második')
    expect(preview.find('.preview__button').text()).toBe('Harmadik')
  })

  it('az új komponens mentés előtt azonnal megjelenik az előnézetben', async () => {
    const wrapper = await mountEditor()

    await wrapper
      .findAll('.add-bar button')
      .find((b) => b.text().includes('Szöveg'))!
      .trigger('click')

    expect(wrapper.find('.preview').text()).toContain('Új bekezdés')
    expect(pagesApi.update).not.toHaveBeenCalled()
  })

  it('a szerkesztett szöveg mentés előtt frissíti az előnézetet', async () => {
    const wrapper = await mountEditor()

    await wrapper.find('.component input').setValue('Átírt cím')

    expect(wrapper.find('.preview h1').text()).toBe('Átírt cím')
    expect(pagesApi.update).not.toHaveBeenCalled()
  })

  it('a törölt komponens eltűnik az előnézetből', async () => {
    const wrapper = await mountEditor()

    await wrapper.findAll('[aria-label="Komponens törlése"]')[1]!.trigger('click')

    expect(wrapper.find('.preview').text()).not.toContain('Második')
  })

  it('az előnézet a webhely témáját és kiemelőszínét használja', async () => {
    vi.mocked(websitesApi.get).mockResolvedValue({
      id: 1,
      slug: 'demo',
      page_theme: 'purple',
      accent_color: '#e11d48',
    } as Website)
    const wrapper = await mountEditor()

    const style = wrapper.find('.preview').attributes('style')
    expect(style).toContain('--bg: #f5f0ff')
    expect(style).toContain('--accent: #e11d48')
  })

  it('a webhely betöltési hibája után az alapértelmezett megjelenéssel marad az előnézet', async () => {
    vi.mocked(websitesApi.get).mockRejectedValue(new Error('hiba'))
    const wrapper = await mountEditor()

    expect(wrapper.find('.preview').attributes('style')).toContain('--bg: #ffffff')
    expect(wrapper.find('.preview h1').text()).toBe('Első')
  })

  it('másolja a komponenst az eredeti alá, mentetlen állapotot jelezve', async () => {
    const wrapper = await mountEditor()

    await wrapper.findAll('[aria-label="Komponens másolása"]')[1]!.trigger('click')

    expect(titles(wrapper)).toEqual(['Címsor', 'Szöveg', 'Szöveg', 'Gomb'])
    expect(wrapper.text()).toContain('Nem mentett módosítások')
  })

  it('a gomb céljához az oldalak címét javasolja', async () => {
    const wrapper = await mountEditor()

    const options = wrapper.findAll('datalist option').map((o) => o.attributes('value'))
    expect(options).toEqual(['/sites/demo/', '/sites/demo/kapcsolat/'])
    const input = wrapper.find('input[list]')
    expect(input.attributes('list')).toBe(wrapper.find('datalist').attributes('id'))
  })

  it('a javaslatok hibája nem akadályozza a szerkesztést', async () => {
    vi.mocked(pagesApi.list).mockRejectedValue(new Error('hiba'))
    const wrapper = await mountEditor()

    expect(titles(wrapper)).toEqual(['Címsor', 'Szöveg', 'Gomb'])
    expect(wrapper.find('datalist').exists()).toBe(false)
  })

  it('törli a komponenst', async () => {
    const wrapper = await mountEditor()

    await wrapper.findAll('[aria-label="Komponens törlése"]')[1]!.trigger('click')

    expect(titles(wrapper)).toEqual(['Címsor', 'Gomb'])
  })

  it('a szerver validációs hibáját a komponens mezője mellett jeleníti meg', async () => {
    const wrapper = await mountEditor()
    vi.mocked(pagesApi.update).mockRejectedValue(
      new ValidationError('Hibás', { 'content.2.url': ['Hibás cím.'], title: ['Hibás cím.'] }),
    )

    await wrapper.findAll('.component')[2]!.find('input').setValue('javascript:x')
    await wrapper.find('button.btn:not(.btn--secondary)').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.component')[2]!.text()).toContain('Hibás cím.')
    expect(wrapper.find('[role="alert"]').text()).toContain('Javítsd a jelölt mezőket')
  })

  it('mentetlen módosításnál az elhagyás előtt rákérdez; a mégsem a lapon tart', async () => {
    const wrapper = await mountEditor()
    await wrapper.find('[aria-label="Komponens törlése"]').trigger('click')

    const navigation = router.push('/')
    await flushPromises()
    expect(useConfirm().pending.value?.title).toBe('Nem mentett módosítások')

    useConfirm().answer(false)
    await navigation
    expect(router.currentRoute.value.path).toBe('/pages/3')
  })

  it('mentetlen módosításnál a megerősítés elengedi a navigációt', async () => {
    const wrapper = await mountEditor()
    await wrapper.find('[aria-label="Komponens törlése"]').trigger('click')

    const navigation = router.push('/')
    await flushPromises()
    useConfirm().answer(true)
    await navigation

    expect(router.currentRoute.value.path).toBe('/')
  })

  it('mentett állapotban kérdés nélkül elhagyható', async () => {
    await mountEditor()

    await router.push('/')

    expect(useConfirm().pending.value).toBeNull()
    expect(router.currentRoute.value.path).toBe('/')
  })
})
