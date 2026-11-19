<script setup lang="ts">
import { computed } from 'vue'

import { websitesApi } from '@/api/websites'
import StatusBlock from '@/components/StatusBlock.vue'
import { useAsyncData } from '@/composables/useAsyncData'

const { data, loading, error, reload } = useAsyncData(websitesApi.list)
const websites = computed(() => data.value ?? [])
</script>

<template>
  <main class="container">
    <div class="page-head">
      <h1>Webhelyeim</h1>
      <RouterLink class="btn" :to="{ name: 'website-new' }">Új webhely</RouterLink>
    </div>

    <StatusBlock
      :loading="loading"
      :error="error"
      :empty="websites.length === 0"
      empty-text="Még nincs webhelyed. Hozd létre az elsőt!"
      @retry="reload"
    >
      <ul class="list">
        <li v-for="website in websites" :key="website.id" class="list__item">
          <div>
            <RouterLink class="list__title" :to="{ name: 'website', params: { id: website.id } }">
              {{ website.name }}
            </RouterLink>
            <div class="muted">/sites/{{ website.slug }}/</div>
          </div>
        </li>
      </ul>
    </StatusBlock>
  </main>
</template>
