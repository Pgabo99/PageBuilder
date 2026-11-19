<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { errorMessage } from '@/api/client'
import { websitesApi } from '@/api/websites'
import { usePolling } from '@/composables/usePolling'
import type { Website } from '@/types/content'

// Publikálás gomb és állapot; a folyamatban lévő állapotot a háttérben lekérdezi.
const props = defineProps<{ website: Website }>()

const current = ref<Website>(props.website)
const busy = ref(false)
const error = ref<string | null>(null)

watch(
  () => props.website,
  (website) => (current.value = website),
)

const inProgress = computed(
  () => current.value.publish_status === 'queued' || current.value.publish_status === 'running',
)

const polling = usePolling(async () => {
  current.value = await websitesApi.get(current.value.id)
  return !inProgress.value
})

watch(inProgress, (active) => (active ? polling.start() : polling.stop()), { immediate: true })

async function publish(): Promise<void> {
  busy.value = true
  error.value = null
  try {
    current.value = await websitesApi.publish(current.value.id)
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}

const statusText = computed(() => {
  switch (current.value.publish_status) {
    case 'queued':
      return 'Sorban áll…'
    case 'running':
      return 'Publikálás folyamatban…'
    case 'succeeded':
      return `Publikálva: ${new Date(current.value.published_at ?? '').toLocaleString('hu-HU')}`
    case 'failed':
      return `Sikertelen: ${current.value.publish_error ?? 'ismeretlen hiba'}`
    default:
      return 'Még nincs publikálva.'
  }
})
</script>

<template>
  <section class="publish" aria-labelledby="publish-title">
    <div class="publish__info">
      <h2 id="publish-title">Publikálás</h2>
      <p
        class="publish__status"
        :class="{ 'publish__status--failed': current.publish_status === 'failed' }"
        role="status"
      >
        {{ statusText }}
      </p>
      <a
        v-if="current.published_url"
        :href="current.published_url"
        target="_blank"
        rel="noopener"
        class="publish__link"
      >
        Megnyitás az új lapon
      </a>
    </div>
    <button class="btn" type="button" :disabled="busy || inProgress" @click="publish">
      {{ busy || inProgress ? 'Publikálás…' : 'Publikálás' }}
    </button>
    <p v-if="error" class="alert publish__error" role="alert">{{ error }}</p>
  </section>
</template>

<style scoped>
.publish {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

h2 {
  margin: 0;
  font-size: 1.125rem;
}

.publish__status {
  margin: var(--space-1) 0;
  color: var(--color-muted);
}

.publish__status--failed {
  color: var(--color-danger);
}

.publish__error {
  flex-basis: 100%;
}
</style>
