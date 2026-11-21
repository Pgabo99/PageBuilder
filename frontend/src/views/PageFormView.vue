<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { pagesApi } from '@/api/pages'
import FormField from '@/components/FormField.vue'
import { useForm } from '@/composables/useForm'
import { useToast } from '@/composables/useToast'
import { slugify } from '@/utils/slug'

const route = useRoute()
const router = useRouter()
const { submitting, errors, message, submit } = useForm()
const toast = useToast()

const websiteId = computed(() => Number(route.params.websiteId))
const form = reactive({ title: '', slug: '' })
const slugTouched = ref(false)

watch(
  () => form.title,
  (title) => {
    if (!slugTouched.value) form.slug = slugify(title)
  },
)

function onSlugInput(value: string): void {
  form.slug = value
  slugTouched.value = true
}

async function onSubmit(): Promise<void> {
  const ok = await submit(async () => {
    await pagesApi.create(websiteId.value, { ...form, content: [] })
  })
  if (ok) {
    toast.success('Oldal létrehozva.')
    await router.push({ name: 'website', params: { id: websiteId.value } })
  }
}
</script>

<template>
  <main class="card">
    <h1>Új oldal</h1>
    <form class="form" novalidate @submit.prevent="onSubmit">
      <p v-if="message" class="alert" role="alert">{{ message }}</p>
      <FormField v-model="form.title" label="Cím" :error="errors.title" />
      <FormField
        :model-value="form.slug"
        label="Webcím"
        hint="Kisbetű, szám és kötőjel"
        :error="errors.slug"
        @update:model-value="onSlugInput"
      />
      <div class="actions">
        <button class="btn" type="submit" :disabled="submitting">
          {{ submitting ? 'Mentés…' : 'Mentés' }}
        </button>
        <RouterLink class="btn btn--secondary" :to="{ name: 'website', params: { id: websiteId } }">
          Mégsem
        </RouterLink>
      </div>
    </form>
  </main>
</template>
