import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

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
