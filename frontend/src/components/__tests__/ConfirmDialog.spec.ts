import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'

import { useConfirm } from '@/composables/useConfirm'
import ConfirmDialog from '../ConfirmDialog.vue'

const options = {
  title: 'Oldal törlése',
  message: 'Biztosan törlöd?',
  confirmLabel: 'Törlés',
  danger: true,
}

describe('ConfirmDialog', () => {
  beforeEach(() => useConfirm().answer(false))

  it('a kérdés címét, üzenetét és gombjait megjeleníti', async () => {
    const wrapper = mount(ConfirmDialog)
    void useConfirm().confirm(options)
    await flushPromises()

    expect(wrapper.find('h2').text()).toBe('Oldal törlése')
    expect(wrapper.find('p').text()).toBe('Biztosan törlöd?')
    expect(wrapper.findAll('button').map((b) => b.text())).toEqual(['Mégsem', 'Törlés'])
    expect(wrapper.find('dialog').attributes('open')).toBeDefined()
    expect(wrapper.find('.btn--danger').exists()).toBe(true)
  })

  it('a megerősítés igazat ad, és bezárja az ablakot', async () => {
    const wrapper = mount(ConfirmDialog)
    const answer = useConfirm().confirm(options)
    await flushPromises()

    await wrapper.findAll('button')[1]!.trigger('click')

    await expect(answer).resolves.toBe(true)
    await flushPromises()
    expect(wrapper.find('dialog').attributes('open')).toBeUndefined()
  })

  it('a mégsem hamisat ad', async () => {
    const wrapper = mount(ConfirmDialog)
    const answer = useConfirm().confirm(options)
    await flushPromises()

    await wrapper.findAll('button')[0]!.trigger('click')

    await expect(answer).resolves.toBe(false)
  })

  it('az Esc (cancel esemény) hamisat ad', async () => {
    const wrapper = mount(ConfirmDialog)
    const answer = useConfirm().confirm(options)
    await flushPromises()

    await wrapper.find('dialog').trigger('cancel')

    await expect(answer).resolves.toBe(false)
  })

  it('új kérdés a korábbit elutasítottnak tekinti', async () => {
    mount(ConfirmDialog)
    const first = useConfirm().confirm(options)
    void useConfirm().confirm({ ...options, title: 'Második' })

    await expect(first).resolves.toBe(false)
  })
})
