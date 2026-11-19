<script setup lang="ts">
import { ref } from 'vue'

// Megerősítéses gomb: az első kattintás rákérdez, a második végrehajt.
defineProps<{ label: string; busy?: boolean }>()

const emit = defineEmits<{ confirm: [] }>()
const asking = ref(false)

function confirm(): void {
  asking.value = false
  emit('confirm')
}
</script>

<template>
  <span v-if="asking" class="confirm">
    <span class="muted">Biztos?</span>
    <button class="btn btn--danger" type="button" :disabled="busy" @click="confirm">Igen</button>
    <button class="btn btn--secondary" type="button" @click="asking = false">Mégsem</button>
  </span>
  <button v-else class="btn btn--secondary" type="button" :disabled="busy" @click="asking = true">
    {{ label }}
  </button>
</template>

<style scoped>
.confirm {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}
</style>
