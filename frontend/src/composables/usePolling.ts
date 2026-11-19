import { onBeforeUnmount } from 'vue'

/**
 * Időzített ismételt lekérdezés. A `task` igazzal tér vissza, ha kész (ekkor leáll);
 * hibánál tovább próbálkozik, legfeljebb `maxAttempts` alkalommal.
 */
export function usePolling(task: () => Promise<boolean>, intervalMs = 2000, maxAttempts = 90) {
  let timer: ReturnType<typeof setTimeout> | null = null
  let attempts = 0

  function stop(): void {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  async function tick(): Promise<void> {
    timer = null
    attempts++
    let done = false
    try {
      done = await task()
    } catch {
      // Átmeneti hiba: a következő körben újra próbáljuk.
    }
    if (!done && attempts < maxAttempts) timer = setTimeout(tick, intervalMs)
  }

  function start(): void {
    stop()
    attempts = 0
    timer = setTimeout(tick, intervalMs)
  }

  onBeforeUnmount(stop)

  return { start, stop }
}
