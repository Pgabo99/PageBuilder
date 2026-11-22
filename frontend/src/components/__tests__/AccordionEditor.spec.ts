import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { AccordionItem } from '@/types/content'
import { MAX_ACCORDION_ITEMS } from '@/utils/components'

import AccordionEditor from '../AccordionEditor.vue'

const item = (n: number): AccordionItem => ({
  id: `i${n}`,
  title: `Rész ${n}`,
  text: `Szöveg ${n}`,
})

// A v-model a szülő szerepét játssza: a frissítést visszaadja a komponensnek.
function mountEditor(items: AccordionItem[], errors: Record<string, string[]> = {}) {
  const wrapper = mount(AccordionEditor, {
    props: {
      modelValue: items,
      errors,
      'onUpdate:modelValue': (value: AccordionItem[]) => wrapper.setProps({ modelValue: value }),
    },
  })
  return wrapper
}

const titles = (wrapper: ReturnType<typeof mountEditor>) =>
  wrapper
    .findAll('.item-editor')
    .map((c) => (c.find('input[type="text"]').element as HTMLInputElement).value)

const addButton = (wrapper: ReturnType<typeof mountEditor>) =>
  wrapper.findAll('button').find((b) => b.text().includes('Rész hozzáadása'))!

describe('AccordionEditor', () => {
  it('részenként címet és szöveget mutat', () => {
    const wrapper = mountEditor([item(1)])
    const group = wrapper.find('.item-editor')

    expect(group.find('legend').text()).toBe('Rész 1')
    expect(group.findAll('label').map((l) => l.text())).toEqual(['Cím', 'Szöveg'])
    expect(group.find('textarea').exists()).toBe(true)
  })

  it('részt ad hozzá, húsznál megáll, és jelzi a darabszámot', async () => {
    const wrapper = mountEditor([item(1)])
    expect(wrapper.text()).toContain(`1/${MAX_ACCORDION_ITEMS} rész`)

    for (let i = 0; i < MAX_ACCORDION_ITEMS - 1; i++) await addButton(wrapper).trigger('click')

    expect(wrapper.findAll('.item-editor')).toHaveLength(MAX_ACCORDION_ITEMS)
    expect(addButton(wrapper).attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain(`${MAX_ACCORDION_ITEMS}/${MAX_ACCORDION_ITEMS} rész`)

    await addButton(wrapper).trigger('click')
    expect(wrapper.findAll('.item-editor')).toHaveLength(MAX_ACCORDION_ITEMS)
  })

  it('az új rész kitöltött alapértékekkel jön létre (a szerver üreset nem fogad el)', async () => {
    const wrapper = mountEditor([item(1)])

    await addButton(wrapper).trigger('click')

    const added = wrapper.props('modelValue')[1]!
    expect(added.title).not.toBe('')
    expect(added.text).not.toBe('')
    expect(added.id).not.toBe('i1')
  })

  it('részt töröl, de az utolsót nem lehet', async () => {
    const wrapper = mountEditor([item(1), item(2), item(3)])

    await wrapper.find('[aria-label="Rész 2 törlése"]').trigger('click')
    expect(titles(wrapper)).toEqual(['Rész 1', 'Rész 3'])

    await wrapper.find('[aria-label="Rész 2 törlése"]').trigger('click')
    expect(titles(wrapper)).toEqual(['Rész 1'])
    expect(wrapper.find('[aria-label="Rész 1 törlése"]').attributes('disabled')).toBeDefined()

    await wrapper.find('[aria-label="Rész 1 törlése"]').trigger('click')
    expect(titles(wrapper)).toEqual(['Rész 1'])
  })

  it('a fel/le gombbal átrendez, az első és az utolsó gombja le van tiltva', async () => {
    const wrapper = mountEditor([item(1), item(2), item(3)])

    expect(wrapper.find('[aria-label="Rész 1 feljebb"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[aria-label="Rész 3 lejjebb"]').attributes('disabled')).toBeDefined()

    await wrapper.find('[aria-label="Rész 1 lejjebb"]').trigger('click')
    expect(titles(wrapper)).toEqual(['Rész 2', 'Rész 1', 'Rész 3'])

    await wrapper.find('[aria-label="Rész 3 feljebb"]').trigger('click')
    expect(titles(wrapper)).toEqual(['Rész 2', 'Rész 3', 'Rész 1'])
  })

  it('a rész címe és szövege szerkeszthető', async () => {
    const wrapper = mountEditor([item(1)])
    const group = wrapper.find('.item-editor')

    await group.find('input[type="text"]').setValue('Új cím')
    await group.find('textarea').setValue('Új szöveg')

    expect(wrapper.props('modelValue')[0]).toMatchObject({ title: 'Új cím', text: 'Új szöveg' })
  })

  it('a szerver hibáit a rész mezője és a lista mellett jeleníti meg', () => {
    const wrapper = mountEditor([item(1), item(2)], {
      items: ['Legfeljebb 20 rész.'],
      'items.1.title': ['Kötelező.'],
      'items.0.text': ['Túl hosszú.'],
    })
    const groups = wrapper.findAll('.item-editor')

    expect(wrapper.text()).toContain('Legfeljebb 20 rész.')
    expect(groups[1]!.text()).toContain('Kötelező.')
    expect(groups[0]!.text()).toContain('Túl hosszú.')
    expect(groups[0]!.text()).not.toContain('Kötelező.')
    expect(groups[1]!.find('input[type="text"]').attributes('aria-invalid')).toBe('true')
    expect(groups[0]!.find('textarea').attributes('aria-invalid')).toBe('true')
  })
})
