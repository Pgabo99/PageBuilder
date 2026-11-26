import { flushPromises, type VueWrapper } from '@vue/test-utils'

// Segédek az egyedi legördülő listához (SelectField): a mezőt a címkéje alapján keresik meg.

function trigger(wrapper: VueWrapper, label: string) {
  const field = wrapper.findAll('.field').find((f) => f.find('label').text() === label)
  if (!field) throw new Error(`Nincs "${label}" mező`)
  return field.find('button[role="combobox"]')
}

/** A kiválasztott érték (üres választásnál ''). */
export function selectedValue(wrapper: VueWrapper, label: string): string {
  return trigger(wrapper, label).attributes('data-value') ?? ''
}

/** Megnyitja a listát, ha zárva van. */
export async function openSelect(wrapper: VueWrapper, label: string): Promise<void> {
  const button = trigger(wrapper, label)
  if (button.attributes('aria-expanded') !== 'true') {
    await button.trigger('click')
    await flushPromises()
  }
}

/** Kiválasztja az értéket (az üres választás értéke ''). */
export async function chooseOption(
  wrapper: VueWrapper,
  label: string,
  value: string | number,
): Promise<void> {
  await openSelect(wrapper, label)
  const field = wrapper.findAll('.field').find((f) => f.find('label').text() === label)!
  await field.find(`[role="option"][data-value="${String(value)}"]`).trigger('click')
  await flushPromises()
}
