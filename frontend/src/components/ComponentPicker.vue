<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, useTemplateRef } from 'vue'

import AppCollapse from '@/components/AppCollapse.vue'
import AppIcon from '@/components/AppIcon.vue'
import type { ComponentType } from '@/types/content'
import {
  componentCategories,
  normalizeSearch,
  type ComponentCategory,
  type ComponentTypeInfo,
} from '@/utils/components'

// Kategorizált, kereshető, összecsukható komponensválasztó. Bemenet: a típusok és a letiltottak indoklással;
// kimenet: a kiválasztott típus (a pozícionálás a hívó dolga). A kategóriák nyitott állapota lokális, a keresés
// alatt a találatot tartalmazók nyitva vannak, a keresés törlése után az előző állapot áll vissza.
const props = defineProps<{
  types: readonly ComponentTypeInfo[]
  disabled?: Partial<Record<ComponentType, string>>
}>()

const emit = defineEmits<{ select: [type: ComponentType] }>()

const uid = useId()
const root = useTemplateRef<HTMLElement>('root')
const trigger = useTemplateRef<HTMLButtonElement>('trigger')
const search = useTemplateRef<HTMLInputElement>('search')

const open = ref(false)
const query = ref('')
const openCategories = ref(new Set<ComponentCategory>(componentCategories.map((c) => c.id)))

const needle = computed(() => normalizeSearch(query.value))
const searching = computed(() => needle.value !== '')

const groups = computed(() =>
  componentCategories
    .map((category) => ({
      ...category,
      items: props.types.filter(
        (item) =>
          item.category === category.id &&
          (!searching.value || normalizeSearch(item.label).includes(needle.value)),
      ),
    }))
    .filter((group) => group.items.length > 0),
)

const isOpen = (id: ComponentCategory): boolean => searching.value || openCategories.value.has(id)

function toggleCategory(id: ComponentCategory): void {
  if (searching.value) return
  const next = new Set(openCategories.value)
  if (!next.delete(id)) next.add(id)
  openCategories.value = next
}

function toggle(): void {
  if (open.value) close()
  else open.value = true
}

function close(focusTrigger = false): void {
  open.value = false
  query.value = ''
  if (focusTrigger) trigger.value?.focus()
}

function choose(type: ComponentType): void {
  if (props.disabled?.[type]) return
  emit('select', type)
  close()
}

// Nyilak: a látható (nem összecsukott) kezelőelemek között léptet.
function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    close(true)
    return
  }
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
  const items = Array.from(root.value?.querySelectorAll<HTMLElement>('[data-nav]') ?? []).filter(
    (el) => !el.closest('[inert]') && !(el as HTMLButtonElement).disabled,
  )
  if (items.length === 0) return
  event.preventDefault()
  const index = items.indexOf(document.activeElement as HTMLElement)
  const step = event.key === 'ArrowDown' ? 1 : -1
  const next = index === -1 ? (step === 1 ? 0 : items.length - 1) : index + step
  items[(next + items.length) % items.length]?.focus()
}

function onPointerDown(event: PointerEvent): void {
  if (open.value && root.value && !root.value.contains(event.target as Node)) close()
}

async function focusSearch(): Promise<void> {
  await nextTick()
  search.value?.focus()
}

onMounted(() => document.addEventListener('pointerdown', onPointerDown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown))
</script>

<template>
  <div ref="root" class="picker" @keydown="onKeydown">
    <button
      ref="trigger"
      class="btn btn--secondary picker__trigger"
      type="button"
      aria-haspopup="true"
      :aria-expanded="open"
      :aria-controls="`${uid}-panel`"
      @click="toggle"
    >
      + Elem hozzáadása
    </button>

    <AppCollapse :id="`${uid}-panel`" :open="open" @opened="focusSearch">
      <div class="picker__panel" role="group" aria-label="Komponens hozzáadása">
        <input
          ref="search"
          v-model="query"
          class="picker__search"
          type="search"
          autocomplete="off"
          aria-label="Elem keresése"
          placeholder="Keresés…"
          data-nav
        />

        <p v-if="groups.length === 0" class="muted" role="status">Nincs találat.</p>

        <section v-for="group in groups" :key="group.id" class="picker__group">
          <h3 class="picker__heading">
            <button
              class="picker__category"
              type="button"
              :aria-expanded="isOpen(group.id)"
              :aria-controls="`${uid}-${group.id}`"
              data-nav
              @click="toggleCategory(group.id)"
            >
              <span class="picker__chevron" aria-hidden="true">▸</span>
              {{ group.label }}
            </button>
          </h3>
          <AppCollapse :id="`${uid}-${group.id}`" :open="isOpen(group.id)">
            <ul class="picker__items">
              <li v-for="item in group.items" :key="item.type">
                <button
                  class="picker__item"
                  type="button"
                  :disabled="Boolean(disabled?.[item.type])"
                  :aria-describedby="disabled?.[item.type] ? `${uid}-${item.type}-why` : undefined"
                  data-nav
                  @click="choose(item.type)"
                >
                  <AppIcon :name="item.icon" kind="type" />
                  <span class="picker__label">{{ item.label }}</span>
                </button>
                <span
                  v-if="disabled?.[item.type]"
                  :id="`${uid}-${item.type}-why`"
                  class="picker__why"
                >
                  {{ disabled[item.type] }}
                </span>
              </li>
            </ul>
          </AppCollapse>
        </section>
      </div>
    </AppCollapse>
  </div>
</template>

<style scoped>
.picker__panel {
  display: grid;
  gap: var(--space-2);
  margin-top: var(--space-2);
  padding: var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.picker__search {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font: inherit;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius);
}

.picker__heading {
  margin: 0;
  font-size: var(--text-md);
}

.picker__category {
  display: flex;
  width: 100%;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) 0;
  font: inherit;
  font-weight: var(--weight-semibold);
  color: inherit;
  text-align: left;
  background: none;
  border: 0;
  cursor: pointer;
}

.picker__chevron {
  display: inline-block;
  transition: transform var(--motion-normal) var(--ease);
}

.picker__category[aria-expanded='true'] .picker__chevron {
  transform: rotate(90deg);
}

.picker__items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  gap: var(--space-2);
  margin: 0;
  padding: var(--space-1) 0 var(--space-2);
  list-style: none;
}

.picker__item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  font: inherit;
  color: var(--color-text);
  text-align: left;
  background: var(--color-field);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius);
  cursor: pointer;
  transition: border-color var(--motion-fast) var(--ease);
}

.picker__item:hover:not(:disabled) {
  border-color: var(--color-primary);
}

.picker__item:disabled {
  opacity: var(--state-disabled-opacity);
  cursor: not-allowed;
}

.picker__why {
  display: block;
  margin-top: var(--space-1);
  font-size: var(--text-sm);
  color: var(--color-muted);
}
</style>
