import { onScopeDispose, ref, watch, type Ref } from 'vue'

/** Ennyi ideig tartó betöltésnél a jelző meg sem jelenik (nincs villogás). */
export const LOADER_DELAY_MS = 150
/** A megjelent jelző legalább ennyi ideig látszik; a tartalmat ez nem tartja vissza. */
export const LOADER_MIN_VISIBLE_MS = 400

/**
 * A forrás késleltetett, villogásmentes tükörképe: `delay` után kapcsol be, ha a forrás még igaz,
 * és bekapcsolás után legalább `minVisible` ideig igaz marad. Nincs mesterséges várakozás: a forrás
 * hamarabb is hamis lehet, ez csak a jelző megjelenítését szabályozza.
 */
export function useDelayedFlag(
  source: Ref<boolean>,
  delay = LOADER_DELAY_MS,
  minVisible = LOADER_MIN_VISIBLE_MS,
): Ref<boolean> {
  const visible = ref(false)
  let shownAt = 0
  let timer: ReturnType<typeof setTimeout> | undefined

  const clear = () => clearTimeout(timer)

  watch(
    source,
    (on) => {
      clear()
      if (on) {
        if (visible.value) return
        timer = setTimeout(() => {
          visible.value = true
          shownAt = Date.now()
        }, delay)
      } else if (visible.value) {
        const remaining = Math.max(0, minVisible - (Date.now() - shownAt))
        timer = setTimeout(() => (visible.value = false), remaining)
      }
    },
    { immediate: true },
  )

  onScopeDispose(clear)

  return visible
}
