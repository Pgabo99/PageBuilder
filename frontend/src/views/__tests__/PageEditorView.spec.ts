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

const activeTitles = (wrapper: Awaited<ReturnType<typeof mountEditor>>) =>
  wrapper.findAll('.component--active').map((c) => c.find('strong').text())

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

  describe('húzással átrendezés', () => {
    // A jsdom nem számol elrendezést: a lista 0–300 px, komponensenként 100 px magas sorral (közepek: 50, 150, 250).
    let rects: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      rects = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
        this: HTMLElement,
      ) {
        if (this.classList.contains('list')) {
          return { left: 0, right: 500, top: 0, bottom: 300, width: 500, height: 300 } as DOMRect
        }
        const row = Array.from(this.parentElement?.children ?? []).filter(
          (el) => (el as HTMLElement).dataset.componentId !== undefined,
        )
        const top = Math.max(0, row.indexOf(this)) * 100
        return { left: 0, right: 500, top, bottom: top + 100, width: 500, height: 100 } as DOMRect
      })
    })

    afterEach(() => rects.mockRestore())

    const items = (wrapper: Awaited<ReturnType<typeof mountEditor>>) =>
      wrapper.findAll('.list > li[data-component-id]')
    const handle = (wrapper: Awaited<ReturnType<typeof mountEditor>>, index: number) =>
      items(wrapper)[index]!.find('.component__handle')
    const over = (wrapper: Awaited<ReturnType<typeof mountEditor>>, y: number) =>
      wrapper.find('ul.list').trigger('dragover', { clientY: y })
    // A helykitöltő és a komponensek sorrendje a listában.
    const layout = (wrapper: Awaited<ReturnType<typeof mountEditor>>) =>
      wrapper
        .findAll('.list > li')
        .map((li) => (li.classes().includes('drop-placeholder') ? '▭' : li.find('strong').text()))

    it('húzás közben a helykitöltő a beszúrás helyén jelenik meg, és követi az egeret', async () => {
      const wrapper = await mountEditor()
      await handle(wrapper, 0).trigger('dragstart')

      await over(wrapper, 240)
      expect(layout(wrapper)).toEqual(['Címsor', 'Szöveg', '▭', 'Gomb'])
      expect(wrapper.find('.drop-placeholder').text()).toBe('Ide kerül: Címsor')

      await over(wrapper, 290)
      expect(layout(wrapper)).toEqual(['Címsor', 'Szöveg', 'Gomb', '▭'])

      await over(wrapper, 160)
      expect(layout(wrapper)).toEqual(['Címsor', 'Szöveg', '▭', 'Gomb'])
    })

    it('a sorrend húzás közben nem változik, csak elengedéskor', async () => {
      const wrapper = await mountEditor()
      await handle(wrapper, 0).trigger('dragstart')
      await over(wrapper, 290)

      expect(titles(wrapper)).toEqual(['Címsor', 'Szöveg', 'Gomb'])

      await wrapper.find('ul.list').trigger('drop')

      expect(titles(wrapper)).toEqual(['Szöveg', 'Gomb', 'Címsor'])
      expect(wrapper.find('.drop-placeholder').exists()).toBe(false)
      expect(wrapper.find('.is-dragging').exists()).toBe(false)
    })

    it('a lista közepére engedve a megfelelő pozícióba kerül', async () => {
      const wrapper = await mountEditor()
      await handle(wrapper, 0).trigger('dragstart')
      await over(wrapper, 160)
      await wrapper.find('ul.list').trigger('drop')

      expect(titles(wrapper)).toEqual(['Szöveg', 'Címsor', 'Gomb'])
    })

    it('felfelé húzva a lista elejére kerül', async () => {
      const wrapper = await mountEditor()
      await handle(wrapper, 2).trigger('dragstart')
      await over(wrapper, 10)

      expect(layout(wrapper)).toEqual(['▭', 'Címsor', 'Szöveg', 'Gomb'])

      await wrapper.find('ul.list').trigger('drop')

      expect(titles(wrapper)).toEqual(['Gomb', 'Címsor', 'Szöveg'])
    })

    it('a húzott elem megkülönböztetett, és a saját helyén nincs helykitöltő', async () => {
      const wrapper = await mountEditor()
      await handle(wrapper, 1).trigger('dragstart')
      await over(wrapper, 140)

      expect(items(wrapper)[1]!.classes()).toContain('is-dragging')
      expect(items(wrapper).filter((li) => li.classes().includes('is-dragging'))).toHaveLength(1)
      expect(wrapper.find('.drop-placeholder').exists()).toBe(false)

      await wrapper.find('ul.list').trigger('drop')
      expect(titles(wrapper)).toEqual(['Címsor', 'Szöveg', 'Gomb'])
      expect(wrapper.text()).toContain('Mentve')
    })

    it('megszakított húzásnál (drop nélküli dragend) az eredeti sorrend marad', async () => {
      const wrapper = await mountEditor()
      await handle(wrapper, 0).trigger('dragstart')
      await over(wrapper, 290)
      expect(wrapper.find('.drop-placeholder').exists()).toBe(true)

      await handle(wrapper, 0).trigger('dragend')

      expect(titles(wrapper)).toEqual(['Címsor', 'Szöveg', 'Gomb'])
      expect(wrapper.find('.drop-placeholder').exists()).toBe(false)
      expect(wrapper.find('.is-dragging').exists()).toBe(false)
      expect(wrapper.text()).toContain('Mentve')
    })

    it('a listán kívülre húzva a helykitöltő eltűnik, és az elengedés nem mozgat', async () => {
      const wrapper = await mountEditor()
      await handle(wrapper, 0).trigger('dragstart')
      await over(wrapper, 290)

      await wrapper.find('ul.list').trigger('dragleave', { clientX: 250, clientY: 450 })
      expect(wrapper.find('.drop-placeholder').exists()).toBe(false)

      await wrapper.find('ul.list').trigger('drop')
      expect(titles(wrapper)).toEqual(['Címsor', 'Szöveg', 'Gomb'])
    })

    it('a lista belsejében a dragleave nem törli a helykitöltőt', async () => {
      const wrapper = await mountEditor()
      await handle(wrapper, 0).trigger('dragstart')
      await over(wrapper, 290)

      await wrapper.find('ul.list').trigger('dragleave', { clientX: 250, clientY: 120 })

      expect(wrapper.find('.drop-placeholder').exists()).toBe(true)
    })

    it('az aktív elem átrendezés után is aktív marad', async () => {
      const wrapper = await mountEditor()
      await wrapper.findAll('.component__toggle')[0]!.trigger('click')

      await handle(wrapper, 0).trigger('dragstart')
      await over(wrapper, 290)
      await wrapper.find('ul.list').trigger('drop')

      expect(titles(wrapper)).toEqual(['Szöveg', 'Gomb', 'Címsor'])
      expect(items(wrapper)[2]!.find('.component').classes()).toContain('component--active')
      expect(wrapper.findAll('.component--active')).toHaveLength(1)
    })

    it('idegen húzást (nem komponens) nem fogad el', async () => {
      const wrapper = await mountEditor()
      const event = new Event('dragover', { bubbles: true, cancelable: true })

      wrapper.find('ul.list').element.dispatchEvent(event)
      await flushPromises()

      expect(event.defaultPrevented).toBe(false)
      expect(wrapper.find('.drop-placeholder').exists()).toBe(false)
    })

    it('a fel/le gomb húzás mellett is működik', async () => {
      const wrapper = await mountEditor()

      await items(wrapper)[0]!.find('[aria-label="Lejjebb"]').trigger('click')

      expect(titles(wrapper)).toEqual(['Szöveg', 'Címsor', 'Gomb'])
    })
  })

  it('betöltés után minden komponens összecsukott, rövid összefoglalóval', async () => {
    const wrapper = await mountEditor()

    expect(activeTitles(wrapper)).toEqual([])
    expect(wrapper.find('.component input, .component textarea').exists()).toBe(false)
    expect(wrapper.findAll('.component__summary').map((s) => s.text())).toEqual([
      'Első',
      'Második',
      'Harmadik → /x',
    ])
  })

  it('egyszerre legfeljebb egy komponens nyitott', async () => {
    const wrapper = await mountEditor()
    const toggles = () => wrapper.findAll('.component__toggle')

    await toggles()[0]!.trigger('click')
    expect(activeTitles(wrapper)).toEqual(['Címsor'])
    expect(toggles()[0]!.attributes('aria-expanded')).toBe('true')

    await toggles()[1]!.trigger('click')
    expect(activeTitles(wrapper)).toEqual(['Szöveg'])
    expect(toggles()[0]!.attributes('aria-expanded')).toBe('false')
    expect(wrapper.findAll('.component textarea')).toHaveLength(1)

    await toggles()[1]!.trigger('click')
    expect(activeTitles(wrapper)).toEqual([])
  })

  it('az új komponens aktív lesz, az előzőleg nyitott összecsukódik', async () => {
    const wrapper = await mountEditor()
    await wrapper.findAll('.component__toggle')[0]!.trigger('click')

    await wrapper
      .findAll('.add-bar button')
      .find((b) => b.text().includes('Gomb'))!
      .trigger('click')
    await flushPromises()

    expect(activeTitles(wrapper)).toEqual(['Gomb'])
    expect(wrapper.findAll('.component')).toHaveLength(4)
  })

  it('a másolat aktív lesz', async () => {
    const wrapper = await mountEditor()

    await wrapper.findAll('[aria-label="Komponens másolása"]')[1]!.trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.component')[2]!.classes()).toContain('component--active')
    expect(activeTitles(wrapper)).toHaveLength(1)
  })

  it('az aktív komponens törlése után nincs aktív elem', async () => {
    const wrapper = await mountEditor()
    await wrapper.findAll('.component__toggle')[1]!.trigger('click')

    await wrapper.findAll('[aria-label="Komponens törlése"]')[1]!.trigger('click')

    expect(activeTitles(wrapper)).toEqual([])
  })

  it('átrendezés után ugyanaz az elem marad aktív', async () => {
    const wrapper = await mountEditor()
    await wrapper.findAll('.component__toggle')[0]!.trigger('click')

    await wrapper.findAll('.component')[0]!.find('[aria-label="Lejjebb"]').trigger('click')

    expect(titles(wrapper)).toEqual(['Szöveg', 'Címsor', 'Gomb'])
    expect(wrapper.findAll('.component')[1]!.classes()).toContain('component--active')
  })

  it('az előnézetben minden elem látszik, az aktív kijelölve', async () => {
    const wrapper = await mountEditor()
    await wrapper.findAll('.component__toggle')[1]!.trigger('click')

    const items = wrapper.findAll('.preview__item')
    expect(items).toHaveLength(3)
    expect(items.map((item) => item.classes().includes('preview__item--active'))).toEqual([
      false,
      true,
      false,
    ])
  })

  it('az előnézetre kattintva az elem aktív lesz a szerkesztőben', async () => {
    const wrapper = await mountEditor()

    await wrapper.findAll('.preview__item')[2]!.trigger('click')
    await flushPromises()

    expect(activeTitles(wrapper)).toEqual(['Gomb'])
    expect(wrapper.findAll('.preview__item--active')).toHaveLength(1)
  })

  it('a kijelölés nem mentetlen módosítás, és nem kerül a mentett tartalomba', async () => {
    const wrapper = await mountEditor()
    vi.mocked(pagesApi.update).mockImplementation(async (_id, payload) => ({ ...page, ...payload }))

    await wrapper.findAll('.component__toggle')[0]!.trigger('click')
    await wrapper.findAll('.preview__item')[1]!.trigger('click')
    expect(wrapper.text()).toContain('Mentve')
    expect(wrapper.text()).not.toContain('Nem mentett módosítások')

    await wrapper.find('.component textarea').setValue('Átírt')
    await wrapper.find('button.btn:not(.btn--secondary)').trigger('click')
    await flushPromises()

    const saved = vi.mocked(pagesApi.update).mock.calls[0]![1]
    expect(saved.content.map((c) => Object.keys(c).sort())).toEqual([
      ['id', 'level', 'text', 'type'],
      ['id', 'text', 'type'],
      ['id', 'label', 'type', 'url'],
    ])
  })

  it('az összefoglaló sora billentyűzettel is használható (gomb, aria-expanded)', async () => {
    const wrapper = await mountEditor()
    const toggle = wrapper.find('.component__toggle')

    expect(toggle.element.tagName).toBe('BUTTON')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(toggle.attributes('aria-controls')).toBeDefined()
  })

  it('a címsor ikonja kiválasztható, azonnal látszik az előnézetben, és mentéskor elmegy', async () => {
    const wrapper = await mountEditor()
    vi.mocked(pagesApi.update).mockImplementation(async (_id, payload) => ({ ...page, ...payload }))
    await wrapper.findAll('.component__toggle')[0]!.trigger('click')
    expect(wrapper.find('.preview h1 svg').exists()).toBe(false)

    await wrapper.find('input[aria-label="Csillag"]').setValue(true)

    expect(wrapper.find('.preview h1 svg').exists()).toBe(true)
    expect(wrapper.text()).toContain('Nem mentett módosítások')
    await wrapper.find('button.btn:not(.btn--secondary)').trigger('click')
    await flushPromises()

    expect(vi.mocked(pagesApi.update).mock.calls[0]![1].content[0]).toMatchObject({
      type: 'heading',
      icon: 'star',
    })
  })

  it('az ikon törölhető ("Nincs"), ilyenkor az előnézetben sincs ikon', async () => {
    vi.mocked(pagesApi.get).mockResolvedValue(
      structuredClone({
        ...page,
        content: [{ id: 'a', type: 'heading', text: 'Első', level: 1, icon: 'gift' }],
      } as Page),
    )
    const wrapper = await mountEditor()
    expect(wrapper.find('.preview h1 svg').exists()).toBe(true)

    await wrapper.find('.component__toggle').trigger('click')
    await wrapper.find('input[value=""]').setValue(true)

    expect(wrapper.find('.preview h1 svg').exists()).toBe(false)
  })

  it('az ikonválasztó hibáját a címsornál jeleníti meg', async () => {
    const wrapper = await mountEditor()
    vi.mocked(pagesApi.update).mockRejectedValue(
      new ValidationError('Hibás', { 'content.0.icon': ['Ismeretlen ikon.'] }),
    )
    await wrapper.findAll('.component__toggle')[0]!.trigger('click')
    await wrapper.find('input[aria-label="Szív"]').setValue(true)
    await wrapper.find('button.btn:not(.btn--secondary)').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.component')[0]!.text()).toContain('Ismeretlen ikon.')
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

    await wrapper.find('.component__toggle').trigger('click')
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
    await wrapper.findAll('.component__toggle')[2]!.trigger('click')

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

    await wrapper.findAll('.component__toggle')[2]!.trigger('click')
    await wrapper.findAll('.component')[2]!.find('input').setValue('javascript:x')
    await wrapper.find('button.btn:not(.btn--secondary)').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.component')[2]!.text()).toContain('Hibás cím.')
    expect(wrapper.find('[role="alert"]').text()).toContain('Javítsd a jelölt mezőket')
  })

  it('mentési hibánál az első hibás, összecsukott komponens kinyílik', async () => {
    const wrapper = await mountEditor()
    vi.mocked(pagesApi.update).mockRejectedValue(
      new ValidationError('Hibás', {
        'content.2.url': ['Hibás cím.'],
        'content.1.text': ['Üres.'],
      }),
    )
    // Módosítás kell ahhoz, hogy a mentés engedélyezett legyen; közben egyik elem sem marad nyitva.
    await wrapper.findAll('.component__toggle')[0]!.trigger('click')
    await wrapper.find('.component input').setValue('Átírt cím')
    await wrapper.findAll('.component__toggle')[0]!.trigger('click')
    expect(activeTitles(wrapper)).toEqual([])

    await wrapper.find('button.btn:not(.btn--secondary)').trigger('click')
    await flushPromises()

    expect(activeTitles(wrapper)).toEqual(['Szöveg'])
    expect(wrapper.findAll('.component')[1]!.text()).toContain('Üres.')
  })

  it('az összecsukott, hibás komponensen jelzi a hibát', async () => {
    const wrapper = await mountEditor()
    vi.mocked(pagesApi.update).mockRejectedValue(
      new ValidationError('Hibás', { 'content.0.text': ['Üres.'], 'content.2.url': ['Hibás.'] }),
    )
    await wrapper.findAll('.component__toggle')[0]!.trigger('click')
    await wrapper.find('.component input').setValue('Átírt cím')
    await wrapper.findAll('.component__toggle')[0]!.trigger('click')
    await wrapper.find('button.btn:not(.btn--secondary)').trigger('click')
    await flushPromises()

    // Az első hibás komponens kinyílik; a másik hibás összecsukva marad, és jelzi a hibát.
    expect(activeTitles(wrapper)).toEqual(['Címsor'])
    const invalid = wrapper.findAll('.component__invalid')
    expect(invalid).toHaveLength(1)
    expect(wrapper.findAll('.component')[2]!.find('.component__invalid').text()).toBe('Hibás mező')
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
