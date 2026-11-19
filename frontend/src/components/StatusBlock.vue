<script setup lang="ts">
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
  <p v-if="loading" class="muted" role="status">Betöltés…</p>
  <div v-else-if="error" class="alert" role="alert">
    {{ error }}
    <button class="btn btn--secondary" type="button" @click="$emit('retry')">Újra</button>
  </div>
  <p v-else-if="empty" class="muted">{{ emptyText }}</p>
  <slot v-else />
</template>
