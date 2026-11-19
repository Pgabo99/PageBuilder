<script setup lang="ts">
import { computed } from 'vue'

import { useTheme } from '@/composables/useTheme'

const { theme, toggle } = useTheme()
const dark = computed(() => theme.value === 'dark')
</script>

<template>
  <button
    class="btn btn--secondary btn--small"
    type="button"
    :aria-pressed="dark"
    :title="dark ? 'Váltás világos témára' : 'Váltás sötét témára'"
    @click="toggle"
  >
    <span aria-hidden="true">{{ dark ? '☀' : '☾' }}</span>
    <span class="sr-only">{{ dark ? 'Világos téma' : 'Sötét téma' }}</span>
  </button>
</template>
