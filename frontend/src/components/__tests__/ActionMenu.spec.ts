import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'

import ActionMenu from '../ActionMenu.vue'

// Tételek: két gomb és egy letiltott; a kattintásokat számoljuk.
function mountMenu() {
  const clicks: string[] = []
  const Host = defineComponent({
    setup: () => () =>
      h(ActionMenu, { label: 'Műveletek' }, () => [
        h(
          'button',
          { class: 'menu__item', role: 'menuitem', onClick: () => clicks.push('a') },
          'A',
        ),
        h('button', { class: 'menu__item', role: 'menuitem', disabled: true }, 'Letiltott'),
        h(
          'button',
          { class: 'menu__item', role: 'menuitem', onClick: () => clicks.push('b') },
          'B',
        ),
      ]),
  })
  const wrapper = mount(Host, { attachTo: document.body })
  return { wrapper, clicks }
}

const trigger = (wrapper: ReturnType<typeof mountMenu>['wrapper']) =>
  wrapper.find('[aria-haspopup="menu"]')

async function open(wrapper: ReturnType<typeof mountMenu>['wrapper']) {
  await trigger(wrapper).trigger('click')
  await flushPromises()
}

describe('ActionMenu', () => {
  it('zárva nincs panel, az alapértelmezett gyújtó hárompontos ikongomb aria-expanded-del', () => {
    const { wrapper } = mountMenu()

    expect(trigger(wrapper).attributes('aria-label')).toBe('Műveletek')
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('megnyitáskor a panel szerepköre és kapcsolata helyes, és az első tételre fókuszál', async () => {
    const { wrapper } = mountMenu()
    await open(wrapper)

    const menu = wrapper.find('[role="menu"]')
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('true')
    expect(trigger(wrapper).attributes('aria-controls')).toBe(menu.attributes('id'))
    expect(document.activeElement).toBe(wrapper.find('[role="menuitem"]').element)
    wrapper.unmount()
  })

  it('a nyilak a letiltott tételt átlépik, körbeérnek; Home és End a szélekre ugrik', async () => {
    const { wrapper } = mountMenu()
    await open(wrapper)
    const items = wrapper.findAll('[role="menuitem"]')
    const menu = wrapper.find('[role="menu"]')

    await menu.trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(items[2]!.element)
    await menu.trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(items[0]!.element)
    await menu.trigger('keydown', { key: 'ArrowUp' })
    expect(document.activeElement).toBe(items[2]!.element)
    await menu.trigger('keydown', { key: 'Home' })
    expect(document.activeElement).toBe(items[0]!.element)
    await menu.trigger('keydown', { key: 'End' })
    expect(document.activeElement).toBe(items[2]!.element)
    wrapper.unmount()
  })

  it('a tétel kiválasztása lefut, bezár, és a fókusz a gyújtóra tér vissza', async () => {
    const { wrapper, clicks } = mountMenu()
    await open(wrapper)

    await wrapper.findAll('[role="menuitem"]')[2]!.trigger('click')
    await flushPromises()

    expect(clicks).toEqual(['b'])
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger(wrapper).element)
    wrapper.unmount()
  })

  it('Escape bezár és a gyújtóra viszi a fókuszt; Tab bezár', async () => {
    const { wrapper } = mountMenu()
    await open(wrapper)
    await wrapper.find('[role="menu"]').trigger('keydown', { key: 'Escape' })
    await flushPromises()

    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger(wrapper).element)

    await open(wrapper)
    await wrapper.find('[role="menu"]').trigger('keydown', { key: 'Tab' })
    await flushPromises()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('a kívülre kattintás bezár, a belsőre nem; a gyújtó nyíl lefelé megnyit', async () => {
    const { wrapper } = mountMenu()
    await open(wrapper)

    wrapper.find('[role="menu"]').element.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await flushPromises()
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await flushPromises()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)

    await trigger(wrapper).trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)
    wrapper.unmount()
  })
})
