<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { errorMessage } from '@/api/client'
import { pagesApi } from '@/api/pages'
import { websitesApi } from '@/api/websites'
import ConfirmButton from '@/components/ConfirmButton.vue'
import PublishPanel from '@/components/PublishPanel.vue'
import StatusBlock from '@/components/StatusBlock.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const websiteId = computed(() => Number(route.params.id))

const website = useAsyncData(() => websitesApi.get(websiteId.value))
const pages = useAsyncData(() => pagesApi.list(websiteId.value))
const toast = useToast()
const actionError = ref<string | null>(null)
const busy = ref(false)

async function run(action: () => Promise<void>): Promise<void> {
  busy.value = true
  actionError.value = null
  try {
    await action()
  } catch (e) {
    actionError.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}

const removeWebsite = () =>
  run(async () => {
    await websitesApi.remove(websiteId.value)
    toast.success('Webhely törölve.')
    await router.push({ name: 'home' })
  })

const removePage = (id: number) =>
  run(async () => {
    await pagesApi.remove(id)
    toast.success('Oldal törölve.')
    await pages.reload()
  })
</script>

<template>
  <main class="container">
    <StatusBlock
      :loading="website.loading.value"
      :error="website.error.value"
      :empty="website.data.value === null"
      empty-text="A webhely nem található."
      @retry="website.reload"
    >
      <div class="page-head">
        <div>
          <h1>{{ website.data.value?.name }}</h1>
          <div class="muted">/sites/{{ website.data.value?.slug }}/</div>
        </div>
        <div class="actions">
          <RouterLink
            class="btn btn--secondary"
            :to="{ name: 'website-edit', params: { id: websiteId } }"
          >
            Szerkesztés
          </RouterLink>
          <ConfirmButton label="Törlés" :busy="busy" @confirm="removeWebsite" />
        </div>
      </div>

      <p v-if="actionError" class="alert" role="alert">{{ actionError }}</p>

      <PublishPanel v-if="website.data.value" :website="website.data.value" />

      <div class="page-head">
        <h2>Oldalak</h2>
        <RouterLink class="btn" :to="{ name: 'page-new', params: { websiteId } }"
          >Új oldal</RouterLink
        >
      </div>

      <StatusBlock
        :loading="pages.loading.value"
        :error="pages.error.value"
        :empty="(pages.data.value ?? []).length === 0"
        empty-text="Ennek a webhelynek még nincs oldala."
        @retry="pages.reload"
      >
        <ul class="list">
          <li v-for="page in pages.data.value" :key="page.id" class="list__item">
            <div>
              <RouterLink class="list__title" :to="{ name: 'page-edit', params: { id: page.id } }">
                {{ page.title }}
              </RouterLink>
              <div class="muted">{{ page.slug }}</div>
            </div>
            <ConfirmButton label="Törlés" :busy="busy" @confirm="removePage(page.id)" />
          </li>
        </ul>
      </StatusBlock>
    </StatusBlock>
  </main>
</template>
