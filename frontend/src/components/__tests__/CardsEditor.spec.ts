import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { CardItem } from '@/types/content'
import { MAX_CARDS } from '@/utils/components'

import CardsEditor from '../CardsEditor.vue'

const card = (n: number): CardItem => ({
  id: `k${n}`,
  icon: null,
  title: `Kártya ${n}`,
  text: '',
  label: '',
  url: '',
})

// A v-model a szülő szerepét játssza: a frissítést visszaadja a komponensnek.
function mountEditor(cards: CardItem[], errors: Record<string, string[]> = {}) {
  const wrapper = mount(CardsEditor, {
    props: {
      modelValue: cards,
      errors,
      'onUpdate:modelValue': (value: CardItem[]) => wrapper.setProps({ modelValue: value }),
    },
  })
  return wrapper
}

const titles = (wrapper: ReturnType<typeof mountEditor>) =>
  wrapper
    .findAll('.item-editor')
    .map((c) => (c.find('input[type="text"]').element as HTMLInputElement).value)

const addButton = (wrapper: ReturnType<typeof mountEditor>) =>
  wrapper.findAll('button').find((b) => b.text().includes('Kártya hozzáadása'))!

describe('CardsEditor', () => {
  it('kártyánként ikonválasztót, címet, leírást, gomb feliratot és célt mutat', () => {
    const wrapper = mountEditor([card(1)])
    const group = wrapper.find('.item-editor')

    expect(group.find('legend').text()).toBe('Kártya 1')
    expect(group.findAll('input[type="radio"]')).toHaveLength(21)
    expect(group.findAll('label').map((l) => l.text())).toEqual(
      expect.arrayContaining(['Cím', 'Leírás (opcionális)', 'Gomb felirata (opcionális)']),
    )
    expect(group.find('textarea').exists()).toBe(true)
  })

  it('kártyát ad hozzá, hatnál megáll, és jelzi a darabszámot', async () => {
    const wrapper = mountEditor([card(1)])
    expect(wrapper.text()).toContain(`1/${MAX_CARDS} kártya`)

    for (let i = 0; i < MAX_CARDS - 1; i++) await addButton(wrapper).trigger('click')

    expect(wrapper.findAll('.item-editor')).toHaveLength(MAX_CARDS)
    expect(addButton(wrapper).attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain(`${MAX_CARDS}/${MAX_CARDS} kártya`)

    await addButton(wrapper).trigger('click')
    expect(wrapper.findAll('.item-editor')).toHaveLength(MAX_CARDS)
  })

  it('kártyát töröl, de az utolsót nem lehet', async () => {
    const wrapper = mountEditor([card(1), card(2), card(3)])

    await wrapper.find('[aria-label="Kártya 2 törlése"]').trigger('click')
    expect(titles(wrapper)).toEqual(['Kártya 1', 'Kártya 3'])

    await wrapper.find('[aria-label="Kártya 2 törlése"]').trigger('click')
    expect(titles(wrapper)).toEqual(['Kártya 1'])
    expect(wrapper.find('[aria-label="Kártya 1 törlése"]').attributes('disabled')).toBeDefined()

    await wrapper.find('[aria-label="Kártya 1 törlése"]').trigger('click')
    expect(titles(wrapper)).toEqual(['Kártya 1'])
  })

  it('a fel/le gombbal átrendez, az első és az utolsó gombja le van tiltva', async () => {
    const wrapper = mountEditor([card(1), card(2), card(3)])

    expect(wrapper.find('[aria-label="Kártya 1 feljebb"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[aria-label="Kártya 3 lejjebb"]').attributes('disabled')).toBeDefined()

    await wrapper.find('[aria-label="Kártya 1 lejjebb"]').trigger('click')
    expect(titles(wrapper)).toEqual(['Kártya 2', 'Kártya 1', 'Kártya 3'])

    await wrapper.find('[aria-label="Kártya 3 feljebb"]').trigger('click')
    expect(titles(wrapper)).toEqual(['Kártya 2', 'Kártya 3', 'Kártya 1'])
  })

  it('a kártya mezői és ikonja szerkeszthető', async () => {
    const cards = [card(1)]
    const wrapper = mountEditor(cards)
    const group = wrapper.find('.item-editor')

    await group.find('input[type="text"]').setValue('Új cím')
    await group.find('textarea').setValue('Leírás')
    await group.find('input[aria-label="Szív"]').setValue(true)
    const [label, url] = group.findAll('input[type="text"]').slice(1)
    await label!.setValue('Tovább')
    await url!.setValue('/kapcsolat')

    expect(wrapper.props('modelValue')[0]).toMatchObject({
      title: 'Új cím',
      text: 'Leírás',
      icon: 'heart',
      label: 'Tovább',
      url: '/kapcsolat',
    })
  })

  it('a szerver hibáit a kártya mezője és a csoport mellett jeleníti meg', () => {
    const wrapper = mountEditor([card(1), card(2)], {
      cards: ['Legfeljebb 6 kártya.'],
      'cards.1.title': ['Kötelező.'],
      'cards.0.url': ['Hibás cím.'],
      'cards.1.icon': ['Ismeretlen ikon.'],
    })
    const groups = wrapper.findAll('.item-editor')

    expect(wrapper.text()).toContain('Legfeljebb 6 kártya.')
    expect(groups[1]!.text()).toContain('Kötelező.')
    expect(groups[1]!.text()).toContain('Ismeretlen ikon.')
    expect(groups[0]!.text()).toContain('Hibás cím.')
    expect(groups[0]!.text()).not.toContain('Kötelező.')
    expect(groups[1]!.find('input[type="text"]').attributes('aria-invalid')).toBe('true')
  })

  it('az oldalak címét javasolja a gomb céljához', () => {
    const wrapper = mount(CardsEditor, {
      props: {
        modelValue: [card(1)],
        errors: {},
        targets: [{ label: 'Kapcsolat', url: '/sites/demo/kapcsolat/' }],
      },
    })

    expect(wrapper.findAll('datalist option').map((o) => o.attributes('value'))).toEqual([
      '/sites/demo/kapcsolat/',
    ])
    expect(wrapper.find('input[list]').attributes('list')).toBe(
      wrapper.find('datalist').attributes('id'),
    )
  })
})
