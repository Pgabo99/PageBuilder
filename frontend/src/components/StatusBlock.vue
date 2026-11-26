<script setup lang="ts">
import AppLoader from '@/components/AppLoader.vue'

// Betöltés / hiba / üres lista egységes megjelenítése; az alapértelmezett slot a tartalom.
defineProps<{
  loading: boolean
  error: string | null
  empty: boolean
  emptyText: string
}>()

defineEmits<{ retry: [] }>()
</script>

<template>
  <AppLoader v-if="loading" loading />
  <div v-else-if="error" class="alert" role="alert">
    {{ error }}
    <button class="btn btn--secondary" type="button" @click="$emit('retry')">Újra</button>
  </div>
  <p v-else-if="empty" class="muted">{{ emptyText }}</p>
  <slot v-else />
</template>
