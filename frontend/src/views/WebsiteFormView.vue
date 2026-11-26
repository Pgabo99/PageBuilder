<script setup lang="ts">
import AppLoader from '@/components/AppLoader.vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { websitesApi } from '@/api/websites'
import ColorField from '@/components/ColorField.vue'
import FormField from '@/components/FormField.vue'
import PagePreview from '@/components/PagePreview.vue'
import SelectField from '@/components/SelectField.vue'
import { useForm } from '@/composables/useForm'
import { errorMessage } from '@/api/client'
import { useToast } from '@/composables/useToast'
import type { PageComponent, WebsitePayload } from '@/types/content'
import { slugify } from '@/utils/slug'
import { paletteWarnings } from '@/utils/contrast'
import {
  isPageTheme,
  pageThemes,
  resolveColors,
  type PageTheme,
  type WebsitePalette,
} from '@/utils/themes'

const route = useRoute()
const router = useRouter()
const { submitting, errors, message, submit } = useForm()
const toast = useToast()

const websiteId = computed(() => (route.params.id ? Number(route.params.id) : null))
const editing = computed(() => websiteId.value !== null)

// Üres érték = a publikált oldal alapértelmezett megjelenése (világos téma).
const form = reactive({
  name: '',
  slug: '',
  accent_color: '',
  page_theme: '' as '' | PageTheme,
  // Egyedi színek; az üres érték a téma (és a kiemelőszín) szerinti szín.
  palette: { background: '', text: '', primary: '' },
})

// A színválasztók az alapértelmezett színt mutatják, amíg nincs saját szín.
const defaults = computed(() => resolveColors(form.page_theme || null, null, null))
const paletteValue = computed<WebsitePalette | null>(() => {
  const entries = Object.entries(form.palette).filter(([, value]) => value !== '')
  return entries.length ? Object.fromEntries(entries) : null
})
// A tényleges színek (az alapértelmezettel összevonva): ezekből készül az előnézet és a kontrasztfigyelmeztetés.
const colors = computed(() =>
  resolveColors(form.page_theme || null, form.accent_color || null, paletteValue.value),
)
const warnings = computed(() => paletteWarnings(colors.value))
// Az elsődleges szín alapértéke a (saját vagy téma szerinti) kiemelőszín.
const defaultPrimary = computed(
  () => resolveColors(form.page_theme || null, form.accent_color || null, null).primary,
)

const sample: PageComponent[] = [
  { id: 'minta-1', type: 'heading', text: 'Minta cím', level: 2 },
  { id: 'minta-2', type: 'text', text: 'Minta bekezdés a kiválasztott színekkel.' },
  { id: 'minta-3', type: 'button', label: 'Minta gomb', url: '/' },
]
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
    form.palette.background = website.palette?.background ?? ''
    form.palette.text = website.palette?.text ?? ''
    form.palette.primary = website.palette?.primary ?? ''
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
    palette: paletteValue.value,
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
        <SelectField
          v-model="form.page_theme"
          label="Oldaltéma"
          empty-label="Világos"
          :options="pageThemes.slice(1)"
          :error="errors.page_theme"
        />
        <ColorField
          v-model="form.palette.background"
          label="Háttérszín"
          :fallback="defaults.bg"
          :error="errors['palette.background']"
        />
        <ColorField
          v-model="form.palette.text"
          label="Szövegszín"
          :fallback="defaults.text"
          :error="errors['palette.text']"
        />
        <ColorField
          v-model="form.palette.primary"
          label="Elsődleges szín (navigáció, hivatkozások)"
          :fallback="defaultPrimary"
          :error="errors['palette.primary']"
        />
        <ColorField
          v-model="form.accent_color"
          label="Kiemelőszín"
          :fallback="defaults.accent"
          :error="errors.accent_color"
        />
        <ul v-if="warnings.length" class="palette-warnings">
          <li v-for="warning in warnings" :key="warning">⚠ {{ warning }}</li>
        </ul>
        <div class="appearance__sample">
          <span class="muted">Minta (a mentés előtt is):</span>
          <PagePreview
            :components="sample"
            :theme="form.page_theme || null"
            :accent="form.accent_color || null"
            :palette="paletteValue"
          />
        </div>
        <p class="muted field__hint">A változás a következő publikálástól látszik.</p>
      </fieldset>
      <div class="actions">
        <button class="btn" type="submit" :disabled="submitting">
          <AppLoader :loading="submitting" size="button" />
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
.palette-warnings {
  display: grid;
  gap: var(--space-1);
  padding: 0;
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-danger);
  list-style: none;
}

.appearance__sample {
  display: grid;
  gap: var(--space-2);
}
</style>
