<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'

import { errorMessage, ValidationError } from '@/api/client'
import { pagesApi } from '@/api/pages'
import { websitesApi } from '@/api/websites'
import ComponentEditor from '@/components/ComponentEditor.vue'
import FormField from '@/components/FormField.vue'
import PagePreview from '@/components/PagePreview.vue'
import StatusBlock from '@/components/StatusBlock.vue'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import type { ComponentType, Page, PageComponent, Website } from '@/types/content'
import {
  cloneComponent,
  componentTypes,
  createComponent,
  moveItem,
  pageTargets,
  type PageTarget,
} from '@/utils/components'

const route = useRoute()
const toast = useToast()
const { confirm } = useConfirm()
const pageId = computed(() => Number(route.params.id))

const page = ref<Page | null>(null)
const loading = ref(true)
const loadError = ref<string | null>(null)

const targets = ref<PageTarget[]>([])
// A webhely megjelenése az előnézethez; hiba esetén az alapértelmezett megjelenés marad.
const website = ref<Website | null>(null)

const form = reactive<{ title: string; slug: string; content: PageComponent[] }>({
  title: '',
  slug: '',
  content: [],
})
const saved = ref('')
const saving = ref(false)
const errors = ref<Record<string, string[]>>({})
const message = ref<string | null>(null)

const snapshot = () => JSON.stringify({ title: form.title, slug: form.slug, content: form.content })
const dirty = computed(() => saved.value !== '' && snapshot() !== saved.value)

async function load(): Promise<void> {
  loading.value = true
  loadError.value = null
  try {
    page.value = await pagesApi.get(pageId.value)
    form.title = page.value.title
    form.slug = page.value.slug
    form.content = page.value.content
    saved.value = snapshot()
    void loadTargets(page.value.website_id)
  } catch (e) {
    loadError.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}

// A javaslatok kiegészítők: a hibájuk nem akadályozza a szerkesztést.
async function loadTargets(websiteId: number): Promise<void> {
  try {
    const [loaded, pages] = await Promise.all([
      websitesApi.get(websiteId),
      pagesApi.list(websiteId),
    ])
    website.value = loaded
    targets.value = pageTargets(loaded.slug, pages)
  } catch {
    targets.value = []
  }
}

async function save(): Promise<void> {
  if (saving.value) return
  saving.value = true
  errors.value = {}
  message.value = null
  try {
    const updated = await pagesApi.update(pageId.value, {
      title: form.title,
      slug: form.slug,
      content: form.content,
    })
    page.value = updated
    saved.value = snapshot()
    toast.success('Oldal mentve.')
  } catch (e) {
    if (e instanceof ValidationError) {
      errors.value = e.errors
      message.value = 'Javítsd a jelölt mezőket, majd mentsd újra.'
    } else {
      message.value = errorMessage(e)
    }
  } finally {
    saving.value = false
  }
}

function add(type: ComponentType): void {
  form.content.push(createComponent(type))
}

function duplicate(index: number): void {
  form.content.splice(index + 1, 0, cloneComponent(form.content[index]!))
}

function remove(index: number): void {
  form.content.splice(index, 1)
}

function move(from: number, to: number): void {
  form.content = moveItem(form.content, from, to)
}

// A szerver hibái "content.<index>.<mező>" kulccsal érkeznek: komponensenként szűrjük.
function componentErrors(index: number): Record<string, string[]> {
  const prefix = `content.${index}.`
  return Object.fromEntries(
    Object.entries(errors.value)
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, value]) => [key.slice(prefix.length), value]),
  )
}

// Húzással átrendezés (natív HTML5 drag & drop); a fel/le gombok a billentyűzetes alternatíva.
const dragIndex = ref<number | null>(null)
const overIndex = ref<number | null>(null)

function onDragStart(index: number, event: DragEvent): void {
  dragIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }
}

function onDragOver(index: number, event: DragEvent): void {
  if (dragIndex.value === null) return
  event.preventDefault()
  overIndex.value = index
}

function onDrop(index: number): void {
  if (dragIndex.value !== null) move(dragIndex.value, index)
  onDragEnd()
}

function onDragEnd(): void {
  dragIndex.value = null
  overIndex.value = null
}

// Nem mentett módosítás elhagyása előtt figyelmeztetés.
const leaveMessage = 'Nem mentett módosításaid vannak. Biztosan elhagyod az oldalt?'

function warnBeforeUnload(event: BeforeUnloadEvent): void {
  if (dirty.value) event.preventDefault()
}

onBeforeRouteLeave(
  () =>
    !dirty.value ||
    confirm({
      title: 'Nem mentett módosítások',
      message: leaveMessage,
      confirmLabel: 'Elhagyás',
      danger: true,
    }),
)
onMounted(() => {
  window.addEventListener('beforeunload', warnBeforeUnload)
  void load()
})
onBeforeUnmount(() => window.removeEventListener('beforeunload', warnBeforeUnload))
</script>

<template>
  <main class="container container--wide">
    <StatusBlock
      :loading="loading"
      :error="loadError"
      :empty="page === null"
      empty-text="Az oldal nem található."
      @retry="load"
    >
      <div class="page-head">
        <div>
          <RouterLink
            v-if="page"
            class="muted"
            :to="{ name: 'website', params: { id: page.website_id } }"
          >
            ← Vissza a webhelyhez
          </RouterLink>
          <h1>Oldal szerkesztése</h1>
        </div>
        <div class="actions">
          <span v-if="saving" class="status muted" role="status">Mentés…</span>
          <span v-else-if="dirty" class="status status--dirty" role="status">
            Nem mentett módosítások
          </span>
          <span v-else class="status muted" role="status">Mentve</span>
          <button class="btn" type="button" :disabled="saving || !dirty" @click="save">
            Mentés
          </button>
        </div>
      </div>

      <p v-if="message" class="alert" role="alert">{{ message }}</p>

      <form class="form settings" novalidate @submit.prevent="save">
        <FormField v-model="form.title" label="Cím" :error="errors.title" />
        <FormField v-model="form.slug" label="Webcím" :error="errors.slug" />
      </form>

      <div class="editor-grid">
        <section>
          <h2>Tartalom</h2>
          <p v-if="form.content.length === 0" class="muted">
            Az oldal még üres. Adj hozzá egy komponenst!
          </p>
          <ul class="list">
            <li
              v-for="(component, index) in form.content"
              :key="component.id"
              :class="{ 'drop-target': overIndex === index && dragIndex !== index }"
              @dragover="onDragOver(index, $event)"
              @drop.prevent="onDrop(index)"
              @dragend="onDragEnd"
            >
              <ComponentEditor
                v-model="form.content[index] as PageComponent"
                :errors="componentErrors(index)"
                :first="index === 0"
                :last="index === form.content.length - 1"
                :targets="targets"
                @up="move(index, index - 1)"
                @down="move(index, index + 1)"
                @duplicate="duplicate(index)"
                @remove="remove(index)"
                @dragstart="onDragStart(index, $event)"
              />
            </li>
          </ul>

          <div class="add-bar" role="group" aria-label="Komponens hozzáadása">
            <span class="muted">Hozzáadás:</span>
            <button
              v-for="item in componentTypes"
              :key="item.type"
              class="btn btn--secondary"
              type="button"
              @click="add(item.type)"
            >
              + {{ item.label }}
            </button>
          </div>
        </section>

        <aside class="preview-pane" aria-labelledby="preview-title">
          <h2 id="preview-title">Előnézet</h2>
          <PagePreview
            :components="form.content"
            :theme="website?.page_theme"
            :accent="website?.accent_color"
          />
          <p class="muted preview-pane__hint">A mentetlen módosításokat is mutatja.</p>
        </aside>
      </div>
    </StatusBlock>
  </main>
</template>

<style scoped>
.settings {
  margin-bottom: var(--space-6);
}

.add-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.drop-target {
  outline: 2px dashed var(--color-primary);
  outline-offset: 2px;
  border-radius: var(--radius);
}

h2 {
  margin: var(--space-6) 0 var(--space-3);
  font-size: 1.125rem;
}

/* Széles képernyőn a tartalom és az előnézet egymás mellett, az előnézet görgetéskor is látszik. */
.editor-grid {
  display: grid;
  gap: var(--space-6);
}

.preview-pane__hint {
  margin: var(--space-2) 0 0;
  font-size: 0.875rem;
}

@media (min-width: 64rem) {
  .editor-grid {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: start;
  }

  .preview-pane {
    position: sticky;
    top: var(--space-4);
  }
}
</style>
