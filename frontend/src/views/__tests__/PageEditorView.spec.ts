import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ValidationError } from '@/api/client'
import { pagesApi } from '@/api/pages'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import type { Page, PagePayload } from '@/types/content'
import PageEditorView from '../PageEditorView.vue'

vi.mock('@/api/pages', () => ({
  pagesApi: {
    get: vi.fn<(id: number) => Promise<Page>>(),
    update: vi.fn<(id: number, payload: PagePayload) => Promise<Page>>(),
    list: vi.fn<(websiteId: number) => Promise<Page[]>>(),
    create: vi.fn<(websiteId: number, payload: PagePayload) => Promise<Page>>(),
    remove: vi.fn<(id: number) => Promise<void>>(),
  },
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

async function mountEditor() {
  await router.replace('/pages/3')
  const wrapper = mount(PageEditorView, { global: { plugins: [router] } })
  await flushPromises()
  return wrapper
}

const titles = (wrapper: Awaited<ReturnType<typeof mountEditor>>) =>
  wrapper.findAll('.component').map((c) => c.find('strong').text())

describe('PageEditorView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const auth = useAuthStore()
    auth.user = { id: 1, name: 'A', email: 'a@example.com' }
    auth.initialized = true
    vi.mocked(pagesApi.get).mockResolvedValue(structuredClone(page))
    vi.mocked(pagesApi.update).mockReset()
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
})
