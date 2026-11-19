<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { websitesApi } from '@/api/websites'
import FormField from '@/components/FormField.vue'
import { useForm } from '@/composables/useForm'
import { errorMessage } from '@/api/client'
import { slugify } from '@/utils/slug'

const route = useRoute()
const router = useRouter()
const { submitting, errors, message, submit } = useForm()

const websiteId = computed(() => (route.params.id ? Number(route.params.id) : null))
const editing = computed(() => websiteId.value !== null)

const form = reactive({ name: '', slug: '' })
const slugTouched = ref(false)
const loadError = ref<string | null>(null)

// Létrehozáskor a slug a névből javasolt, amíg a felhasználó kézzel nem módosítja.
watch(
  () => form.name,
  (name) => {
    if (!editing.value && !slugTouched.value) form.slug = slugify(name)
  },
)

function onSlugInput(value: string): void {
  form.slug = value
  slugTouched.value = true
}

onMounted(async () => {
  if (websiteId.value === null) return
  try {
    const website = await websitesApi.get(websiteId.value)
    form.name = website.name
    form.slug = website.slug
  } catch (e) {
    loadError.value = errorMessage(e)
  }
})

async function onSubmit(): Promise<void> {
  let savedId = websiteId.value
  const ok = await submit(async () => {
    const website =
      savedId === null
        ? await websitesApi.create({ ...form })
        : await websitesApi.update(savedId, { ...form })
    savedId = website.id
  })
  if (ok && savedId !== null) await router.push({ name: 'website', params: { id: savedId } })
}
</script>

<template>
  <main class="card">
    <h1>{{ editing ? 'Webhely szerkesztése' : 'Új webhely' }}</h1>
    <p v-if="loadError" class="alert" role="alert">{{ loadError }}</p>
    <form v-else class="form" novalidate @submit.prevent="onSubmit">
      <p v-if="message" class="alert" role="alert">{{ message }}</p>
      <FormField v-model="form.name" label="Név" :error="errors.name" />
      <FormField
        :model-value="form.slug"
        label="Webcím"
        hint="Kisbetű, szám és kötőjel; a publikált cím: /sites/webcím/"
        :error="errors.slug"
        @update:model-value="onSlugInput"
      />
      <div class="actions">
        <button class="btn" type="submit" :disabled="submitting">
          {{ submitting ? 'Mentés…' : 'Mentés' }}
        </button>
        <RouterLink
          class="btn btn--secondary"
          :to="editing ? { name: 'website', params: { id: websiteId } } : { name: 'home' }"
        >
          Mégsem
        </RouterLink>
      </div>
    </form>
  </main>
</template>
