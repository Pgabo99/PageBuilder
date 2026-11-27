<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppHeader from '@/components/AppHeader.vue'
import AppLoader from '@/components/AppLoader.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ToastHost from '@/components/ToastHost.vue'

const router = useRouter()

// Az első navigációt a guard az /api/v1/user válaszáig tartja; közben nem maradhat üres az oldal.
const ready = ref(false)
onMounted(() => {
  void router.isReady().finally(() => (ready.value = true))
})
</script>

<template>
  <AppHeader />
  <main v-if="!ready" class="container">
    <AppLoader loading size="page" />
  </main>
  <RouterView v-else />
  <ConfirmDialog />
  <ToastHost />
</template>
