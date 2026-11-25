<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { websitesApi } from '@/api/websites'
import ColorField from '@/components/ColorField.vue'
import FormField from '@/components/FormField.vue'
import SelectField from '@/components/SelectField.vue'
import { useForm } from '@/composables/useForm'
import { errorMessage } from '@/api/client'
import { useToast } from '@/composables/useToast'
import type { WebsitePayload } from '@/types/content'
import { slugify } from '@/utils/slug'
import { isPageTheme, pageThemes, themeAccent, type PageTheme } from '@/utils/themes'

const route = useRoute()
const router = useRouter()
const { submitting, errors, message, submit } = useForm()
const toast = useToast()

const websiteId = computed(() => (route.params.id ? Number(route.params.id) : null))
const editing = computed(() => websiteId.value !== null)

// Üres érték = a publikált oldal alapértelmezett megjelenése (világos téma).
const form = reactive({ name: '', slug: '', accent_color: '', page_theme: '' as '' | PageTheme })

// A színválasztó a téma alapértelmezett kiemelőszínét mutatja, amíg nincs saját szín.
const defaultAccent = computed(() => themeAccent(form.page_theme || null))
const slugTouched = ref(false)
const loadError = ref<string | null>(null)

// Létrehozáskor a slug a névből javasolt, amíg a felhasználó kézzel nem módosítja.
watch(
  () => form.name,
  (name) => {
    if (!editing.value && !slugTouched.value) form.slug = slugify(name)
  },
)

function onSlugInput(value: unknown): void {
  const text = String(value ?? '')
  form.slug = text
  slugTouched.value = true
}

onMounted(async () => {
  if (websiteId.value === null) return
  try {
    const website = await websitesApi.get(websiteId.value)
    form.name = website.name
    form.slug = website.slug
    form.accent_color = website.accent_color ?? ''
    form.page_theme =
      isPageTheme(website.page_theme) && website.page_theme !== 'light' ? website.page_theme : ''
  } catch (e) {
    loadError.value = errorMessage(e)
  }
})

function payload(): WebsitePayload {
  return {
    name: form.name,
    slug: form.slug,
    accent_color: form.accent_color || null,
    page_theme: form.page_theme || null,
  }
}

async function onSubmit(): Promise<void> {
  let savedId = websiteId.value
  const ok = await submit(async () => {
    const website =
      savedId === null
        ? await websitesApi.create(payload())
        : await websitesApi.update(savedId, payload())
    savedId = website.id
  })
  if (ok && savedId !== null) {
    toast.success(editing.value ? 'Webhely mentve.' : 'Webhely létrehozva.')
    await router.push({ name: 'website', params: { id: savedId } })
  }
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
      <fieldset class="appearance">
        <legend>A publikált oldal megjelenése</legend>
        <ColorField
          v-model="form.accent_color"
          label="Kiemelőszín"
          :fallback="defaultAccent"
          :error="errors.accent_color"
        />
        <SelectField
          v-model="form.page_theme"
          label="Oldaltéma"
          empty-label="Világos"
          :options="pageThemes.slice(1)"
          :error="errors.page_theme"
        />
        <p class="muted field__hint">A változás a következő publikálástól látszik.</p>
      </fieldset>
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

<style scoped>
.appearance {
  display: grid;
  gap: var(--space-4);
  margin: 0;
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

.appearance legend {
  padding: 0 var(--space-2);
  font-weight: 600;
}
</style>
