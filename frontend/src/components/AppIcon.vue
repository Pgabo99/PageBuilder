<script setup lang="ts">
import { computed } from 'vue'

import { findBrandIcon, findIcon } from '@/utils/icons'

// Előre definiált ikon (a backend `Icons`-szal azonos készlet), dekoratív: a képernyőolvasó elől rejtett.
// Az elemeket leírókból rendereljük (nincs `v-html`), ismeretlen névre semmi nem jelenik meg.
// A `brand` a közösségi platformok márkaikonjait (külön készlet) keresi.
const props = defineProps<{ name: string | null | undefined; brand?: boolean }>()

const icon = computed(() => (props.brand ? findBrandIcon(props.name) : findIcon(props.name)))
</script>

<template>
  <svg
    v-if="icon"
    class="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <component
      :is="tag"
      v-for="([tag, attrs], index) in icon.elements"
      :key="index"
      v-bind="attrs"
    />
  </svg>
</template>

<style scoped>
.icon {
  flex: none;
  width: 1.1em;
  height: 1.1em;
}
</style>
