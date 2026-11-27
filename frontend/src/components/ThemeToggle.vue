<script setup lang="ts">
import { computed } from 'vue'

import IconButton from '@/components/IconButton.vue'
import { useTheme } from '@/composables/useTheme'

// Témaváltó ikongomb (a kijelentkezett oldalakon; belépve a felhasználói menüben van).
const { theme, toggle } = useTheme()
const dark = computed(() => theme.value === 'dark')
</script>

<template>
  <IconButton
    :icon="dark ? 'sun' : 'moon'"
    :label="dark ? 'Váltás világos témára' : 'Váltás sötét témára'"
    variant="ghost"
    size="md"
    :aria-pressed="dark"
    @click="toggle"
  />
</template>
