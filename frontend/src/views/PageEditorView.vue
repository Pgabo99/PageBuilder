<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'

import { errorMessage, ValidationError } from '@/api/client'
import { pagesApi } from '@/api/pages'
import { websitesApi } from '@/api/websites'
import AppLoader from '@/components/AppLoader.vue'
import AppCollapse from '@/components/AppCollapse.vue'
import AppIcon from '@/components/AppIcon.vue'
import BadgeLabel from '@/components/BadgeLabel.vue'
import ComponentEditor from '@/components/ComponentEditor.vue'
import ComponentPicker from '@/components/ComponentPicker.vue'
import FormField from '@/components/FormField.vue'
import PagePreview from '@/components/PagePreview.vue'
import StatusBlock from '@/components/StatusBlock.vue'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import type { ComponentType, Page, PageComponent, Website } from '@/types/content'
import {
  cloneComponent,
  componentLabel,
  componentTypes,
  createComponent,
  dropSlot,
  moveItem,
  pageTargets,
  slotTarget,
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
      // A hibás oldalbeállítás ne maradjon összecsukva.
      if (e.errors.title || e.errors.slug) settingsOpen.value = true
      // A hibás mező ne maradjon összecsukva: az első hibás komponens nyílik ki.
      const firstInvalid = Object.keys(e.errors)
        .map((key) => /^content\.(\d+)\./.exec(key)?.[1])
        .filter((index): index is string => index !== undefined)
        .map(Number)
        .sort((a, b) => a - b)[0]
      const invalid = firstInvalid === undefined ? undefined : form.content[firstInvalid]
      if (invalid) void activate(invalid.id)
    } else {
      message.value = errorMessage(e)
    }
  } finally {
    saving.value = false
  }
}

// Csak nézet-állapot (nem mentett tartalom): az oldalbeállítások összecsukása és a keskeny képernyős nézetváltó.
const settingsOpen = ref(false)
const view = ref<'edit' | 'preview'>('edit')

// Az aktív komponens csak szerkesztői állapot: nem része a mentett tartalomnak és a pillanatképnek.
const activeId = ref<string | null>(null)
const listRef = ref<{ $el: HTMLElement } | null>(null)
const listEl = computed(() => listRef.value?.$el ?? null)

// Az előnézetből kijelölt komponens szerkesztése: keskeny képernyőn átvált a szerkesztő nézetre.
function onPreviewSelect(id: string): void {
  view.value = 'edit'
  void activate(id)
}

function toggleActive(id: string): void {
  activeId.value = activeId.value === id ? null : id
}

// Az új vagy az előnézetből kijelölt elem a nézetben marad; az új elem első mezője fókuszt kap.
async function activate(id: string, focusField = false): Promise<void> {
  activeId.value = id
  await nextTick()
  const item = listEl.value?.querySelector<HTMLElement>(`[data-component-id="${CSS.escape(id)}"]`)
  item?.scrollIntoView?.({ block: 'nearest' })
  if (focusField) item?.querySelector<HTMLElement>('input, textarea, select')?.focus()
}

// Oldalanként legfeljebb egy lábléc lehet (a szerver is ellenőrzi).
const hasFooter = computed(() => form.content.some((component) => component.type === 'footer'))

function add(type: ComponentType): void {
  const component = createComponent(type)
  form.content.push(component)
  void activate(component.id, true)
}

function duplicate(index: number): void {
  const copy = cloneComponent(form.content[index]!)
  form.content.splice(index + 1, 0, copy)
  void activate(copy.id, true)
}

function remove(index: number): void {
  if (form.content[index]?.id === activeId.value) activeId.value = null
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
// A sorrend csak elengedéskor (`drop`) változik: húzás közben a húzott elem a helyén marad (halványan),
// a helykitöltő pedig a beszúrási résben jelenik meg. Megszakításnál (`dragend` drop nélkül) semmi nem változik.
const dragIndex = ref<number | null>(null)
// A beszúrási rés: az eredeti lista hányadik eleme elé kerülne a húzott elem (0..elemszám).
const slot = ref<number | null>(null)

// Ha a rés a húzott elem saját helye, nincs mozgás, ezért nincs helykitöltő sem.
const placeholderAt = computed(() =>
  dragIndex.value !== null &&
  slot.value !== null &&
  slotTarget(dragIndex.value, slot.value) !== dragIndex.value
    ? slot.value
    : null,
)
const draggedComponent = computed(() =>
  dragIndex.value === null ? null : (form.content[dragIndex.value] ?? null),
)

// A távozó elem kikerül a folyásból, így a többi elem azonnal a helyére csúszik (list-anim-move).
function pinLeaving(el: Element): void {
  if (!(el instanceof HTMLElement)) return
  el.style.width = `${el.offsetWidth}px`
  el.style.top = `${el.offsetTop}px`
  el.style.left = `${el.offsetLeft}px`
}

function onDragStart(index: number, event: DragEvent): void {
  dragIndex.value = index
  slot.value = null
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
    // A fogantyú helyett az egész komponens a húzott kép.
    const item = (event.target as HTMLElement | null)?.closest('li')
    if (item) event.dataTransfer.setDragImage?.(item, 16, 16)
  }
}

// A rést az egér függőleges helye adja a komponensek (a helykitöltő nélkül mért) közepéhez képest, így a
// helykitöltő megjelenése nem billenti át a rést (nincs villogás).
function onDragOver(event: DragEvent): void {
  if (dragIndex.value === null) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  const items = Array.from(listEl.value?.children ?? []).filter(
    (el): el is HTMLElement => el instanceof HTMLElement && el.dataset.componentId !== undefined,
  )
  slot.value = dropSlot(
    items.map((el) => {
      const rect = el.getBoundingClientRect()
      return rect.top + rect.height / 2
    }),
    event.clientY,
  )
}

// A listából kihúzva a helykitöltő eltűnik, és az elengedés nem mozgat.
function onDragLeave(event: DragEvent): void {
  const rect = listEl.value?.getBoundingClientRect()
  if (!rect) return
  const inside =
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom
  if (!inside) slot.value = null
}

function onDrop(): void {
  if (dragIndex.value !== null && slot.value !== null) {
    move(dragIndex.value, slotTarget(dragIndex.value, slot.value))
  }
  onDragEnd()
}

function onDragEnd(): void {
  dragIndex.value = null
  slot.value = null
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
      <div class="editor-bar">
        <div class="editor-bar__main">
          <RouterLink
            v-if="page"
            class="editor-bar__back muted"
            :to="{ name: 'website', params: { id: page.website_id } }"
          >
            ← Vissza a webhelyhez
          </RouterLink>
          <h1>Oldal szerkesztése</h1>
        </div>
        <div class="editor-bar__end">
          <span v-if="saving" class="status muted" role="status">
            <AppLoader :loading="saving" size="button" />Mentés…
          </span>
          <BadgeLabel v-else-if="dirty" variant="warning" dot role="status">
            Nem mentett módosítások
          </BadgeLabel>
          <BadgeLabel v-else variant="success" dot role="status">Mentve</BadgeLabel>
          <div class="view-toggle" role="group" aria-label="Nézet">
            <button
              type="button"
              class="view-toggle__btn"
              :aria-pressed="view === 'edit'"
              @click="view = 'edit'"
            >
              Szerkesztés
            </button>
            <button
              type="button"
              class="view-toggle__btn"
              :aria-pressed="view === 'preview'"
              @click="view = 'preview'"
            >
              Előnézet
            </button>
          </div>
          <button class="btn" type="button" :disabled="saving || !dirty" @click="save">
            <AppLoader :loading="saving" size="button" />Mentés
          </button>
        </div>
      </div>

      <p v-if="message" class="alert" role="alert">{{ message }}</p>

      <section class="page-settings">
        <button
          class="page-settings__toggle"
          type="button"
          :aria-expanded="settingsOpen"
          aria-controls="page-settings-fields"
          @click="settingsOpen = !settingsOpen"
        >
          <AppIcon class="page-settings__chevron" name="chevron-down" kind="ui" />
          <strong>Oldal beállításai</strong>
          <span class="page-settings__summary muted">{{ form.title }} · /{{ form.slug }}</span>
          <BadgeLabel v-if="!settingsOpen && (errors.title || errors.slug)" variant="danger" dot>
            Hibás mező
          </BadgeLabel>
        </button>
        <AppCollapse id="page-settings-fields" :open="settingsOpen">
          <form class="form page-settings__form" novalidate @submit.prevent="save">
            <FormField v-model="form.title" label="Cím" :error="errors.title" />
            <FormField v-model="form.slug" label="Webcím" :error="errors.slug" />
          </form>
        </AppCollapse>
      </section>

      <div class="editor-grid" :data-view="view">
        <section class="content-pane">
          <h2>Tartalom</h2>
          <p v-if="form.content.length === 0" class="muted">
            Az oldal még üres. Adj hozzá egy komponenst!
          </p>
          <!-- Húzás közben nincs CSS-átmenet, hogy a lista ne ugráljon; a drop utáni átrendezés animált. -->
          <TransitionGroup
            ref="listRef"
            tag="ul"
            name="list-anim"
            :css="dragIndex === null"
            class="list component-list"
            @dragover="onDragOver"
            @dragleave="onDragLeave"
            @drop.prevent="onDrop"
            @dragend="onDragEnd"
            @before-leave="pinLeaving"
          >
            <template v-for="(component, index) in form.content" :key="component.id">
              <li
                v-if="placeholderAt === index"
                key="placeholder"
                class="drop-placeholder"
                aria-hidden="true"
              >
                Ide kerül: {{ componentLabel(draggedComponent!.type) }}
              </li>
              <li
                :data-component-id="component.id"
                :class="{ 'is-dragging': dragIndex === index && slot !== null }"
              >
                <ComponentEditor
                  v-model="form.content[index] as PageComponent"
                  :errors="componentErrors(index)"
                  :first="index === 0"
                  :last="index === form.content.length - 1"
                  :active="component.id === activeId"
                  :targets="targets"
                  @toggle="toggleActive(component.id)"
                  @up="move(index, index - 1)"
                  @down="move(index, index + 1)"
                  @duplicate="duplicate(index)"
                  @remove="remove(index)"
                  @dragstart="onDragStart(index, $event)"
                />
              </li>
            </template>
            <li
              v-if="placeholderAt === form.content.length"
              key="placeholder"
              class="drop-placeholder"
              aria-hidden="true"
            >
              Ide kerül: {{ componentLabel(draggedComponent!.type) }}
            </li>
          </TransitionGroup>

          <ComponentPicker
            class="add-picker"
            :types="componentTypes"
            :disabled="hasFooter ? { footer: 'Oldalanként legfeljebb egy lábléc lehet.' } : {}"
            @select="add"
          />
        </section>

        <aside class="preview-pane" aria-labelledby="preview-title">
          <div class="preview-pane__head">
            <h2 id="preview-title">Előnézet</h2>
            <span class="muted preview-pane__hint">A mentetlen módosításokat is mutatja.</span>
          </div>
          <div class="preview-canvas">
            <PagePreview
              :components="form.content"
              :theme="website?.page_theme"
              :accent="website?.accent_color"
              :palette="website?.palette"
              :active-id="activeId"
              @select="onPreviewSelect"
            />
          </div>
        </aside>
      </div>
    </StatusBlock>
  </main>
</template>

<style scoped>
/* Tapadó eszköztár a fejléc alatt: cím, mentési állapot és a Mentés gomb mindig látszik. */
.editor-bar {
  position: sticky;
  top: var(--header-height);
  z-index: 30;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2) var(--space-4);
  margin: 0 calc(-1 * var(--space-4)) var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}

.editor-bar__main {
  display: grid;
  min-width: 0;
}

.editor-bar__back {
  font-size: var(--text-sm);
}

.editor-bar h1 {
  margin: 0;
  font-size: var(--text-lg);
}

.editor-bar__end {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.view-toggle {
  display: none;
  padding: 0.125rem;
  background: var(--state-hover);
  border-radius: var(--radius-md);
}

.view-toggle__btn {
  padding: var(--space-1) var(--space-3);
  font: inherit;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-muted);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: var(--radius-sm);
  transition:
    background-color var(--motion-fast) var(--ease),
    color var(--motion-fast) var(--ease);
}

.view-toggle__btn[aria-pressed='true'] {
  color: var(--color-text);
  background: var(--color-surface);
  box-shadow: var(--shadow-xs);
}

/* Összecsukható oldalbeállítások: alapból egy sor (cím és webcím összefoglalva). */
.page-settings {
  margin-bottom: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xs);
}

.page-settings__toggle {
  display: flex;
  width: 100%;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4);
  font: inherit;
  font-size: var(--text-sm);
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: none;
  border: 0;
  border-radius: var(--radius-lg);
}

.page-settings__chevron {
  width: var(--icon-sm);
  height: var(--icon-sm);
  color: var(--color-muted);
  transform: rotate(-90deg);
  transition: transform var(--motion-normal) var(--ease);
}

.page-settings__toggle[aria-expanded='true'] .page-settings__chevron {
  transform: none;
}

.page-settings__summary {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-settings__form {
  grid-template-columns: minmax(0, 1fr);
  padding: var(--space-2) var(--space-4) var(--space-4);
}

.add-picker {
  margin-top: var(--space-4);
}

.component-list {
  position: relative;
  grid-template-columns: minmax(0, 1fr);
}

.list-anim-enter-active,
.list-anim-leave-active {
  transition:
    opacity var(--motion-normal) var(--ease),
    transform var(--motion-normal) var(--ease);
}

.list-anim-move {
  transition: transform var(--motion-normal) var(--ease);
}

.list-anim-enter-from,
.list-anim-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}

.list-anim-leave-active {
  position: absolute;
}

.list-anim-leave-active.drop-placeholder {
  display: none;
}

/* A húzott elem a helyén marad, halványan; a helykitöltő mutatja, hová kerül elengedéskor. */
.is-dragging {
  opacity: 0.45;
  outline: 2px dashed var(--color-muted);
  outline-offset: 2px;
  border-radius: var(--radius);
}

.drop-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  padding: var(--space-2) var(--space-4);
  font-weight: var(--weight-semibold);
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  border: 2px dashed var(--color-primary);
  border-radius: var(--radius);
  pointer-events: none;
}

h2 {
  margin: 0 0 var(--space-3);
  font-size: var(--text-lg);
}

/* Széles képernyőn a tartalom és az előnézet egymás mellett, az előnézet görgetéskor is látszik. */
.editor-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-6);
}

.preview-pane__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-1) var(--space-3);
}

.preview-pane__hint {
  font-size: var(--text-sm);
}

/* Az előnézet külön vászon felületen áll, hogy elváljon a szerkesztőtől. */
.preview-canvas {
  padding: var(--space-4);
  background: var(--color-canvas);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

/* Keskeny képernyőn a nézetváltó dönt, melyik panel látszik. */
@media (max-width: 63.99rem) {
  .view-toggle {
    display: inline-flex;
  }

  .editor-grid[data-view='edit'] .preview-pane,
  .editor-grid[data-view='preview'] .content-pane {
    display: none;
  }
}

@media (min-width: 64rem) {
  .editor-grid {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
    align-items: start;
  }

  .preview-pane {
    position: sticky;
    top: calc(var(--header-height) + 4.5rem);
    max-height: calc(100vh - var(--header-height) - 5.5rem);
    overflow-y: auto;
  }
}
</style>
