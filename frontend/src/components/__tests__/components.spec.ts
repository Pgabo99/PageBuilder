import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ConfirmButton from '../ConfirmButton.vue'
import StatusBlock from '../StatusBlock.vue'

const base = { loading: false, error: null, empty: false, emptyText: 'Nincs elem.' }

describe('StatusBlock', () => {
  it('betöltés közben jelzi az állapotot', () => {
    const wrapper = mount(StatusBlock, { props: { ...base, loading: true } })

    expect(wrapper.find('[role="status"]').text()).toBe('Betöltés…')
  })

  it('hibát és újrapróbálás gombot mutat', async () => {
    const wrapper = mount(StatusBlock, { props: { ...base, error: 'Szerverhiba.' } })

    expect(wrapper.find('[role="alert"]').text()).toContain('Szerverhiba.')
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('üres listánál a megadott szöveget mutatja', () => {
    const wrapper = mount(StatusBlock, { props: { ...base, empty: true } })

    expect(wrapper.text()).toBe('Nincs elem.')
  })

  it('egyébként a tartalmat jeleníti meg', () => {
    const wrapper = mount(StatusBlock, { props: base, slots: { default: '<p>Tartalom</p>' } })

    expect(wrapper.text()).toBe('Tartalom')
  })
})

describe('ConfirmButton', () => {
  it('az első kattintás rákérdez, a megerősítés végrehajt', async () => {
    const wrapper = mount(ConfirmButton, { props: { label: 'Törlés' } })

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(wrapper.text()).toContain('Biztos?')

    await wrapper.findAll('button')[0]!.trigger('click')
    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })

  it('a mégsem visszaáll az alaphelyzetre', async () => {
    const wrapper = mount(ConfirmButton, { props: { label: 'Törlés' } })

    await wrapper.find('button').trigger('click')
    await wrapper.findAll('button')[1]!.trigger('click')

    expect(wrapper.text()).toBe('Törlés')
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })
})
