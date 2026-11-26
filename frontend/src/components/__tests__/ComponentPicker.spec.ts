import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { componentTypes } from '@/utils/components'

import ComponentPicker from '../ComponentPicker.vue'

async function mountPicker(props: Record<string, unknown> = {}) {
  const wrapper = mount(ComponentPicker, {
    props: { types: componentTypes, ...props },
    attachTo: document.body,
  })
  await wrapper.find('.picker__trigger').trigger('click')
  await flushPromises()
  return wrapper
}

type Mounted = Awaited<ReturnType<typeof mountPicker>>
const labels = (wrapper: Mounted) => wrapper.findAll('.picker__label').map((el) => el.text())
const categories = (wrapper: Mounted) => wrapper.findAll('.picker__category')

describe('ComponentPicker', () => {
  it('zárva nem mutat semmit, a gomb aria-expanded értéke követi az állapotot', async () => {
    const wrapper = mount(ComponentPicker, { props: { types: componentTypes } })
    const trigger = wrapper.find('.picker__trigger')

    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('.picker__panel').exists()).toBe(false)

    await trigger.trigger('click')
    await flushPromises()
    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('.picker__panel').exists()).toBe(true)
  })

  it('a típusokat kategóriák szerint csoportosítja', async () => {
    const wrapper = await mountPicker()

    expect(categories(wrapper).map((el) => el.text())).toEqual([
      expect.stringContaining('Alapelemek'),
      expect.stringContaining('Elrendezés'),
      expect.stringContaining('Tartalmi elemek'),
      expect.stringContaining('Navigáció és kapcsolatok'),
    ])
    expect(labels(wrapper)).toHaveLength(componentTypes.length)
    wrapper.unmount()
  })

  it('a kiválasztott típust adja ki, és bezárul', async () => {
    const wrapper = await mountPicker()

    await wrapper
      .findAll('.picker__item')
      .find((el) => el.text() === 'Idézet')!
      .trigger('click')
    await flushPromises()

    expect(wrapper.emitted('select')).toEqual([['quote']])
    expect(wrapper.find('.picker__panel').exists()).toBe(false)
    wrapper.unmount()
  })

  it('a kategória külön összecsukható', async () => {
    const wrapper = await mountPicker()
    const basic = categories(wrapper)[0]!

    await basic.trigger('click')
    await flushPromises()
    expect(basic.attributes('aria-expanded')).toBe('false')
    expect(labels(wrapper)).not.toContain('Címsor')
    expect(labels(wrapper)).toContain('Kártyák')

    await basic.trigger('click')
    await flushPromises()
    expect(labels(wrapper)).toContain('Címsor')
    wrapper.unmount()
  })

  it('keresés: ékezet és kis/nagybetű nélkül is talál, a találat nélküli kategória rejtett', async () => {
    const wrapper = await mountPicker()

    await wrapper.find('.picker__search').setValue('ERTESITO')
    await flushPromises()
    expect(labels(wrapper)).toEqual(['Értesítődoboz'])
    expect(categories(wrapper)).toHaveLength(1)

    await wrapper.find('.picker__search').setValue('nincsilyen')
    await flushPromises()
    expect(wrapper.find('[role="status"]').text()).toBe('Nincs találat.')
    wrapper.unmount()
  })

  it('a keresés kinyitja az összecsukott találati kategóriát, törléskor az előző állapot áll vissza', async () => {
    const wrapper = await mountPicker()
    await categories(wrapper)[0]!.trigger('click')
    await flushPromises()
    expect(labels(wrapper)).not.toContain('Címsor')

    await wrapper.find('.picker__search').setValue('cim')
    await flushPromises()
    expect(labels(wrapper)).toContain('Címsor')
    expect(categories(wrapper)[0]!.attributes('aria-expanded')).toBe('true')

    await wrapper.find('.picker__search').setValue('')
    await flushPromises()
    expect(categories(wrapper)[0]!.attributes('aria-expanded')).toBe('false')
    expect(labels(wrapper)).not.toContain('Címsor')
    expect(labels(wrapper)).toContain('Kártyák')
    wrapper.unmount()
  })

  it('a letiltott típus nem választható, az indoklás látszik', async () => {
    const wrapper = await mountPicker({ disabled: { footer: 'Már van lábléc.' } })
    const footer = wrapper.findAll('.picker__item').find((el) => el.text() === 'Lábléc')!

    expect(footer.attributes('disabled')).toBeDefined()
    expect(wrapper.find('.picker__why').text()).toBe('Már van lábléc.')
    await footer.trigger('click')
    expect(wrapper.emitted('select')).toBeUndefined()
    wrapper.unmount()
  })

  it('Escape bezár és a gombra viszi a fókuszt', async () => {
    const wrapper = await mountPicker()

    await wrapper.find('.picker__search').trigger('keydown', { key: 'Escape' })
    await flushPromises()

    expect(wrapper.find('.picker__panel').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.find('.picker__trigger').element)
    wrapper.unmount()
  })

  it('a nyílbillentyű a látható kezelőelemek között léptet', async () => {
    const wrapper = await mountPicker()
    ;(wrapper.find('.picker__search').element as HTMLElement).focus()

    await wrapper.find('.picker__search').trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(categories(wrapper)[0]!.element)

    await wrapper.find('.picker__search').trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(wrapper.find('.picker__item').element)

    await wrapper.find('.picker__search').trigger('keydown', { key: 'ArrowUp' })
    expect(document.activeElement).toBe(categories(wrapper)[0]!.element)
    wrapper.unmount()
  })

  it('a kívülre kattintás bezár, a belsőre nem', async () => {
    const wrapper = await mountPicker()

    wrapper
      .find('.picker__search')
      .element.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await flushPromises()
    expect(wrapper.find('.picker__panel').exists()).toBe(true)

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await flushPromises()
    expect(wrapper.find('.picker__panel').exists()).toBe(false)
    wrapper.unmount()
  })
})
