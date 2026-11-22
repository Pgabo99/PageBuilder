<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { websitesApi } from '@/api/websites'
import FormField from '@/components/FormField.vue'
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
        <div class="field">
          <label for="accent-color">Kiemelőszín</label>
          <div class="actions">
            <input
              id="accent-color"
              type="color"
              :value="form.accent_color || defaultAccent"
              @input="form.accent_color = ($event.target as HTMLInputElement).value"
            />
            <button
              v-if="form.accent_color"
              class="btn btn--secondary btn--small"
              type="button"
              @click="form.accent_color = ''"
            >
              Alapértelmezett
            </button>
          </div>
          <p v-if="errors.accent_color" class="field__error">{{ errors.accent_color.join(' ') }}</p>
        </div>
        <div class="field">
          <label for="page-theme">Oldaltéma</label>
          <select id="page-theme" v-model="form.page_theme">
            <option value="">Világos</option>
            <option v-for="theme in pageThemes.slice(1)" :key="theme.value" :value="theme.value">
              {{ theme.label }}
            </option>
          </select>
          <p v-if="errors.page_theme" class="field__error">{{ errors.page_theme.join(' ') }}</p>
        </div>
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

.field {
  display: grid;
  gap: var(--space-1);
}

label {
  font-weight: 600;
}

select {
  padding: var(--space-2) var(--space-3);
  font: inherit;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

input[type='color'] {
  width: 3rem;
  height: 2.25rem;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  cursor: pointer;
}

.field__hint {
  margin: 0;
  font-size: 0.875rem;
}

.field__error {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-danger);
}
</style>
