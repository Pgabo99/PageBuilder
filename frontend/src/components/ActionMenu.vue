<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, useTemplateRef } from 'vue'

import IconButton from '@/components/IconButton.vue'

// Lenyíló menü (ARIA menu): a gyújtó a `trigger` slot (alapból hárompontos ikongomb), a tételek a
// default slot `role="menuitem"` gombjai (`.menu__item`). Nyilak, Home/End, Escape, Tab, kívülre kattintás;
// tétel kiválasztása után zár, és a fókusz a gyújtóra tér vissza. A panel `position: fixed`, így a szülő
// `overflow` nem vágja le, és szükség esetén felfelé nyílik.
const props = withDefaults(defineProps<{ label: string; align?: 'start' | 'end' }>(), {
  align: 'end',
})

const id = useId()
const root = useTemplateRef<HTMLElement>('root')
const panel = useTemplateRef<HTMLElement>('panel')

const open = ref(false)
const openUp = ref(false)
const panelStyle = ref<Record<string, string>>({})

// A gyújtó slot ezeket köti a saját gombjára (szerepkör, állapot, kapcsolat a panellel).
const triggerAttrs = computed(() => ({
  'aria-haspopup': 'menu' as const,
  'aria-expanded': open.value,
  'aria-controls': `${id}-menu`,
}))

const trigger = () => root.value?.querySelector<HTMLElement>('[aria-haspopup="menu"]') ?? null

function items(): HTMLElement[] {
  return Array.from(
    panel.value?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? [],
  )
}

function position(): void {
  const rect = trigger()?.getBoundingClientRect()
  if (!rect) return
  const below = window.innerHeight - rect.bottom - 8
  const above = rect.top - 8
  const up = below < 240 && above > below
  openUp.value = up
  panelStyle.value = {
    ...(props.align === 'end'
      ? { right: `${Math.max(window.innerWidth - rect.right, 8)}px` }
      : { left: `${Math.max(rect.left, 8)}px` }),
    ...(up
      ? { bottom: `${window.innerHeight - rect.top + 4}px` }
      : { top: `${rect.bottom + 4}px` }),
  }
}

async function openMenu(): Promise<void> {
  if (open.value) return
  position()
  open.value = true
  await nextTick()
  items()[0]?.focus()
}

function close(focusTrigger = false): void {
  open.value = false
  if (focusTrigger) trigger()?.focus()
}

function toggle(): void {
  if (open.value) close()
  else void openMenu()
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    close(true)
    return
  }
  if (event.key === 'Tab') {
    close()
    return
  }
  const list = items()
  if (list.length === 0) return
  const index = list.indexOf(document.activeElement as HTMLElement)
  let next = -1
  if (event.key === 'ArrowDown') next = (index + 1) % list.length
  else if (event.key === 'ArrowUp') next = (index - 1 + list.length) % list.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = list.length - 1
  if (next === -1) return
  event.preventDefault()
  list[next]?.focus()
}

// A tétel saját `@click`-je előbb lefut, utána a buborékolás zárja a menüt.
function onPanelClick(event: MouseEvent): void {
  if ((event.target as HTMLElement).closest('[role="menuitem"]')) close(true)
}

// A gyújtó nyíl lefelé gombra is megnyitja a menüt.
function onTriggerKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowDown' && !open.value) {
    event.preventDefault()
    void openMenu()
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
</script>

<template>
  <div ref="root" class="menu-root" @keydown.capture="onTriggerKeydown">
    <slot name="trigger" :open="open" :toggle="toggle" :attrs="triggerAttrs">
      <IconButton
        icon="more-horizontal"
        :label="label"
        aria-haspopup="menu"
        :aria-expanded="open"
        :aria-controls="`${id}-menu`"
        @click="toggle"
      />
    </slot>

    <Transition name="menu">
      <div
        v-if="open"
        :id="`${id}-menu`"
        ref="panel"
        class="menu"
        :class="{ 'menu--up': openUp }"
        role="menu"
        :aria-label="label"
        :style="panelStyle"
        @keydown="onKeydown"
        @click="onPanelClick"
      >
        <slot :close="close" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.menu-root {
  display: inline-flex;
}

.menu {
  position: fixed;
  z-index: 60;
  min-width: 13rem;
  max-width: calc(100vw - 1rem);
  padding: var(--space-1);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-pop);
}

.menu :slotted(.menu__item) {
  display: flex;
  width: 100%;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  font: inherit;
  font-size: var(--text-sm);
  color: var(--color-text);
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background-color var(--motion-fast) var(--ease);
}

.menu :slotted(.menu__item:hover),
.menu :slotted(.menu__item:focus-visible) {
  background: var(--state-hover);
  outline: 0;
}

.menu :slotted(.menu__item--danger) {
  color: var(--color-danger);
}

.menu :slotted(.menu__item--danger:hover),
.menu :slotted(.menu__item--danger:focus-visible) {
  background: var(--color-danger-bg);
}

.menu :slotted(.menu__item:disabled) {
  cursor: not-allowed;
  opacity: var(--state-disabled-opacity);
}

.menu :slotted(.menu__separator) {
  height: 1px;
  margin: var(--space-1) 0;
  background: var(--color-border);
}

.menu :slotted(.menu__header) {
  padding: var(--space-2) var(--space-3);
}

.menu-enter-active,
.menu-leave-active {
  transition:
    opacity var(--motion-fast) var(--ease),
    transform var(--motion-fast) var(--ease);
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.menu--up.menu-enter-from,
.menu--up.menu-leave-to {
  transform: translateY(4px);
}
</style>
