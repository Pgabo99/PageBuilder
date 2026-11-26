<script setup lang="ts" generic="T extends string | number">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
  useTemplateRef,
  watch,
} from 'vue'

import AppIcon from '@/components/AppIcon.vue'

// Egyedi legördülő lista (ARIA select-only combobox + listbox) a többi mezővel azonos megjelenéssel.
// Az `emptyLabel` megadásakor van üres (alapértelmezett) választás, ami `null` értéket ad; a régi, mező nélküli
// komponens (undefined) is ezt jelenti. Opcionális: opciónként `icon`, `description`, `disabled`, `group`,
// valamint `placeholder` és `disabled` a mezőre. A fókusz végig a gombon marad (`aria-activedescendant`),
// a panel `position: fixed`, így a szülő `overflow` nem vágja le, és szükség esetén felfelé nyílik.
const props = defineProps<{
  label: string
  options: readonly {
    value: T
    label: string
    icon?: string
    description?: string
    disabled?: boolean
    group?: string
  }[]
  emptyLabel?: string
  placeholder?: string
  disabled?: boolean
  error?: string[]
  hint?: string
}>()

const model = defineModel<T | null | undefined>()
const id = useId()
const listId = `${id}-list`
const errorId = `${id}-error`

const root = useTemplateRef<HTMLElement>('root')
const trigger = useTemplateRef<HTMLButtonElement>('trigger')
const list = useTemplateRef<HTMLElement>('list')

interface Entry {
  index: number
  value: T | null
  label: string
  icon?: string
  description?: string
  disabled: boolean
}

// Csoportok sorrendje az első előfordulás szerinti; a csoport nélküli (és az üres) elemek elöl állnak.
const groups = computed(() => {
  const map = new Map<string, Entry[]>()
  const add = (group: string, entry: Omit<Entry, 'index'>) => {
    const entries = map.get(group) ?? []
    entries.push({ ...entry, index: 0 })
    map.set(group, entries)
  }
  if (props.emptyLabel !== undefined) {
    add('', { value: null, label: props.emptyLabel, disabled: false })
  }
  for (const option of props.options) {
    add(option.group ?? '', {
      value: option.value,
      label: option.label,
      icon: option.icon,
      description: option.description,
      disabled: option.disabled ?? false,
    })
  }
  let index = 0
  return [...map.entries()].map(([label, entries]) => ({
    label,
    entries: entries.map((entry) => ({ ...entry, index: index++ })),
  }))
})
const flat = computed(() => groups.value.flatMap((group) => group.entries))

const selectedIndex = computed(() =>
  flat.value.findIndex((entry) => entry.value === (model.value ?? null)),
)
const current = computed(() => flat.value[selectedIndex.value])

const open = ref(false)
const openUp = ref(false)
const activeIndex = ref(-1)
const panelStyle = ref<Record<string, string>>({})

const optionId = (index: number) => `${id}-option-${index}`
const firstEnabled = () => flat.value.findIndex((entry) => !entry.disabled)
const lastEnabled = () => flat.value.map((entry) => entry.disabled).lastIndexOf(false)

function position(): void {
  const rect = trigger.value?.getBoundingClientRect()
  if (!rect) return
  const below = window.innerHeight - rect.bottom - 8
  const above = rect.top - 8
  const up = below < 200 && above > below
  const space = up ? above : below
  openUp.value = up
  panelStyle.value = {
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    maxHeight: `${Math.min(288, Math.max(space, 120))}px`,
    ...(up
      ? { bottom: `${window.innerHeight - rect.top + 4}px` }
      : { top: `${rect.bottom + 4}px` }),
  }
}

function scrollActive(): void {
  void nextTick(() =>
    list.value
      ?.querySelector<HTMLElement>(`#${CSS.escape(optionId(activeIndex.value))}`)
      ?.scrollIntoView?.({ block: 'nearest' }),
  )
}

function openList(): void {
  if (props.disabled || open.value) return
  position()
  const selected = flat.value[selectedIndex.value]
  activeIndex.value = selected && !selected.disabled ? selectedIndex.value : firstEnabled()
  open.value = true
  scrollActive()
}

function close(): void {
  open.value = false
}

function toggle(): void {
  if (open.value) close()
  else openList()
}

function move(step: 1 | -1): void {
  let next = activeIndex.value
  do {
    next += step
  } while (flat.value[next]?.disabled)
  if (next >= 0 && next < flat.value.length) {
    activeIndex.value = next
    scrollActive()
  }
}

function jump(index: number): void {
  if (index < 0) return
  activeIndex.value = index
  scrollActive()
}

function choose(index: number): void {
  const entry = flat.value[index]
  if (!entry || entry.disabled) return
  model.value = entry.value
  close()
  trigger.value?.focus()
}

function onKeydown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowUp':
      event.preventDefault()
      if (!open.value) openList()
      else move(event.key === 'ArrowDown' ? 1 : -1)
      break
    case 'Home':
    case 'End':
      if (!open.value) return
      event.preventDefault()
      jump(event.key === 'Home' ? firstEnabled() : lastEnabled())
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (!open.value) openList()
      else choose(activeIndex.value)
      break
    case 'Escape':
      if (!open.value) return
      event.preventDefault()
      event.stopPropagation()
      close()
      break
    case 'Tab':
      close()
      break
  }
}

function onPointerDown(event: PointerEvent): void {
  if (open.value && root.value && !root.value.contains(event.target as Node)) close()
}

onMounted(() => {
  document.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('resize', position)
  window.addEventListener('scroll', position, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown)
  window.removeEventListener('resize', position)
  window.removeEventListener('scroll', position, true)
})

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) close()
  },
)
</script>

<template>
  <div ref="root" class="field select">
    <label :for="id" @click.prevent="trigger?.focus()">{{ label }}</label>
    <button
      :id="id"
      ref="trigger"
      class="select__trigger"
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-controls="listId"
      :aria-activedescendant="open && activeIndex >= 0 ? optionId(activeIndex) : undefined"
      :aria-invalid="!!error?.length"
      :aria-describedby="error?.length ? errorId : undefined"
      :data-value="model ?? ''"
      :disabled="disabled"
      @click="toggle"
      @keydown="onKeydown"
      @keyup.space.prevent
    >
      <span class="select__value" :class="{ 'select__value--placeholder': !current }">
        <AppIcon v-if="current?.icon" :name="current.icon" />
        {{ current ? current.label : (placeholder ?? '') }}
      </span>
      <AppIcon class="select__chevron" name="chevron-down" kind="ui" />
    </button>

    <Transition name="select-panel">
      <div
        v-if="open"
        class="select__panel"
        :class="{ 'select__panel--up': openUp }"
        :style="panelStyle"
        @mousedown.prevent
      >
        <ul :id="listId" ref="list" class="select__list" role="listbox" :aria-label="label">
          <li v-for="(group, groupIndex) in groups" :key="group.label" role="presentation">
            <ul
              class="select__group"
              role="group"
              :aria-labelledby="group.label ? `${id}-group-${groupIndex}` : undefined"
            >
              <li
                v-if="group.label"
                :id="`${id}-group-${groupIndex}`"
                class="select__group-label"
                role="presentation"
              >
                {{ group.label }}
              </li>
              <li
                v-for="entry in group.entries"
                :id="optionId(entry.index)"
                :key="entry.index"
                class="select__option"
                :class="{
                  'is-active': entry.index === activeIndex,
                  'is-selected': entry.index === selectedIndex,
                  'is-disabled': entry.disabled,
                }"
                role="option"
                :aria-selected="entry.index === selectedIndex"
                :aria-disabled="entry.disabled || undefined"
                :data-value="entry.value ?? ''"
                @click="choose(entry.index)"
                @pointermove="!entry.disabled && (activeIndex = entry.index)"
              >
                <AppIcon v-if="entry.icon" class="select__option-icon" :name="entry.icon" />
                <span class="select__option-text">
                  <span>{{ entry.label }}</span>
                  <span v-if="entry.description" class="select__option-desc">
                    {{ entry.description }}
                  </span>
                </span>
                <AppIcon
                  v-if="entry.index === selectedIndex"
                  class="select__check"
                  name="check"
                  kind="ui"
                />
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </Transition>

    <p v-if="error?.length" :id="errorId" class="field__error">{{ error.join(' ') }}</p>
    <p v-else-if="hint" class="muted field__hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.select__trigger {
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: var(--control-height);
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  font: inherit;
  color: var(--color-text);
  text-align: left;
  background: var(--color-field);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius);
  cursor: pointer;
  transition:
    border-color var(--motion-fast) var(--ease),
    box-shadow var(--motion-fast) var(--ease);
}

.select__trigger:hover:not(:disabled) {
  border-color: var(--color-muted);
}

.select__trigger[aria-expanded='true'] {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}

.select__trigger:disabled {
  cursor: not-allowed;
  opacity: var(--state-disabled-opacity);
}

.select__value {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: var(--space-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select__value--placeholder {
  color: var(--color-muted);
}

/* A chevron a jobb szélhez képest kap helyet (a gomb belső térköze és a rés együtt). */
.select__chevron {
  width: var(--icon-sm);
  height: var(--icon-sm);
  margin-right: var(--space-1);
  color: var(--color-muted);
  transition: transform var(--motion-normal) var(--ease);
}

.select__trigger[aria-expanded='true'] .select__chevron {
  transform: rotate(180deg);
}

.select__panel {
  position: fixed;
  z-index: 50;
  overflow-y: auto;
  padding: var(--space-1);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-pop);
}

.select__list,
.select__group {
  margin: 0;
  padding: 0;
  list-style: none;
}

.select__group + .select__group,
.select__list > li + li {
  margin-top: var(--space-1);
  padding-top: var(--space-1);
  border-top: 1px solid var(--color-border);
}

.select__group-label {
  padding: var(--space-2) var(--space-3) var(--space-1);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.select__option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background-color var(--motion-fast) var(--ease);
}

.select__option.is-active {
  background: var(--state-hover);
}

.select__option.is-selected {
  font-weight: var(--weight-semibold);
  background: var(--color-primary-soft);
}

.select__option.is-disabled {
  cursor: not-allowed;
  opacity: var(--state-disabled-opacity);
}

.select__option-text {
  display: grid;
  min-width: 0;
  flex: 1;
}

.select__option-desc {
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
  color: var(--color-muted);
}

.select__option-icon {
  color: var(--color-muted);
}

.select__check {
  flex: none;
  color: var(--color-primary);
}

.select-panel-enter-active,
.select-panel-leave-active {
  transition:
    opacity var(--motion-fast) var(--ease),
    transform var(--motion-fast) var(--ease);
}

.select-panel-enter-from,
.select-panel-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.select__panel--up.select-panel-enter-from,
.select__panel--up.select-panel-leave-to {
  transform: translateY(4px);
}
</style>
