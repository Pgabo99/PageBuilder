import { onMounted, ref, type Ref } from 'vue'

import { errorMessage } from '@/api/client'

/** Adatbetöltés közös állapota: betöltés alatt, hiba és újratöltés. */
export function useAsyncData<T>(fetcher: () => Promise<T>) {
  const data: Ref<T | null> = ref(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  async function reload(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      data.value = await fetcher()
    } catch (e) {
      error.value = errorMessage(e)
    } finally {
      loading.value = false
    }
  }

  onMounted(reload)

  return { data, loading, error, reload }
}
