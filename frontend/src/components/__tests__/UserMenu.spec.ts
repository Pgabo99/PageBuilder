import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import { useTheme } from '@/composables/useTheme'

import UserMenu from '../UserMenu.vue'
import ThemeToggle from '../ThemeToggle.vue'

const user = { id: 1, name: 'Árvíztűrő Tükörfúrógép', email: 'a@example.com' }

describe('UserMenu', () => {
  afterEach(() => {
    document.documentElement.dataset.theme = 'light'
    if (useTheme().theme.value === 'dark') useTheme().toggle()
  })

  it('az avatar a név kezdőbetűit mutatja, a menü zárva nem jelenít meg tételt', () => {
    const wrapper = mount(UserMenu, { props: { user } })

    expect(wrapper.find('.user-trigger__avatar').text()).toBe('ÁT')
    expect(wrapper.find('.user-trigger__name').text()).toBe(user.name)
    // Mobilon a név rejtett: a gombnak akkor is van akadálymentes neve.
    expect(wrapper.find('.user-trigger').attributes('aria-label')).toBe(user.name)
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  it('megnyitva mutatja a nevet, az e-mail-címet és a tételeket', async () => {
    const wrapper = mount(UserMenu, { props: { user }, attachTo: document.body })
    await wrapper.find('.user-trigger').trigger('click')
    await flushPromises()

    const text = wrapper.find('[role="menu"]').text()
    expect(text).toContain('a@example.com')
    expect(wrapper.findAll('[role="menuitem"]').map((el) => el.text())).toEqual([
      'Sötét téma',
      'Kijelentkezés',
    ])
    wrapper.unmount()
  })

  it('a kijelentkezés tétel jelez, letiltva nem', async () => {
    const wrapper = mount(UserMenu, { props: { user }, attachTo: document.body })
    await wrapper.find('.user-trigger').trigger('click')
    await flushPromises()

    await wrapper.findAll('[role="menuitem"]')[1]!.trigger('click')
    expect(wrapper.emitted('logout')).toHaveLength(1)

    await wrapper.setProps({ loggingOut: true })
    await wrapper.find('.user-trigger').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('[role="menuitem"]')[1]!.attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('a témaváltó tétel vált, és a felirata követi az állapotot', async () => {
    const wrapper = mount(UserMenu, { props: { user }, attachTo: document.body })
    await wrapper.find('.user-trigger').trigger('click')
    await flushPromises()

    await wrapper.findAll('[role="menuitem"]')[0]!.trigger('click')
    await flushPromises()
    expect(document.documentElement.dataset.theme).toBe('dark')

    await wrapper.find('.user-trigger').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('[role="menuitem"]')[0]!.text()).toBe('Világos téma')
    wrapper.unmount()
  })
})

describe('ThemeToggle', () => {
  it('ikongomb: a felirata követi a témát', async () => {
    const wrapper = mount(ThemeToggle)
    const button = wrapper.find('button')
    const before = button.attributes('aria-label')

    await button.trigger('click')

    expect(before).toBe('Váltás sötét témára')
    expect(button.attributes('aria-label')).toBe('Váltás világos témára')
    await button.trigger('click')
  })
})
