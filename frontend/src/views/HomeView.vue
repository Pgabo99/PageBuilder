<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <main class="card">
    <h1>Üdv, {{ auth.user?.name }}!</h1>
    <p class="muted">A webhelyek kezelése hamarosan itt lesz elérhető.</p>
  </main>
</template>
