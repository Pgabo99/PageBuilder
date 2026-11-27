<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useId, useTemplateRef } from 'vue'

// Tooltip: hoverre (rövid késleltetéssel) és billentyűzetes fókuszra is megjelenik, Escape zárja.
// A tartalom az első fókuszálható elem leírása (`aria-describedby`), a szöveg `role="tooltip"`.
// A panel `position: fixed`, így a szülő `overflow` nem vágja le; szükség esetén lent jelenik meg.
const props = withDefaults(defineProps<{ text: string; delay?: number }>(), { delay: 400 })

const id = useId()
const root = useTemplateRef<HTMLElement>('root')
const visible = ref(false)
const below = ref(false)
const style = ref<Record<string, string>>({})
let timer: ReturnType<typeof setTimeout> | undefined

const target = () =>
  root.value?.querySelector<HTMLElement>('button, a[href], input, select, textarea, [tabindex]') ??
  null

async function show(): Promise<void> {
  const rect = root.value?.getBoundingClientRect()
  if (!rect) return
  below.value = rect.top < 48
  style.value = {
    left: `${rect.left + rect.width / 2}px`,
    ...(below.value
      ? { top: `${rect.bottom + 6}px` }
      : { bottom: `${window.innerHeight - rect.top + 6}px` }),
  }
  visible.value = true
  await nextTick()
}

function hide(): void {
  clearTimeout(timer)
  visible.value = false
}

function onEnter(): void {
  clearTimeout(timer)
  timer = setTimeout(() => void show(), props.delay)
}

function onFocusIn(event: FocusEvent): void {
  // Csak billentyűzetes fókusz: az egérkattintás utáni fókusz nem nyitja meg.
  const element = event.target as HTMLElement
  if (element.matches?.(':focus-visible')) {
    clearTimeout(timer)
    void show()
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && visible.value) {
    event.stopPropagation()
    hide()
  }
}

onMounted(() => target()?.setAttribute('aria-describedby', id))
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <span
    ref="root"
    class="tooltip-root"
    @mouseenter="onEnter"
    @mouseleave="hide"
    @pointerdown="hide"
    @focusin="onFocusIn"
    @focusout="hide"
    @keydown="onKeydown"
  >
    <slot />
    <Transition name="tooltip">
      <span
        v-if="visible"
        :id="id"
        class="tooltip"
        :class="{ 'tooltip--below': below }"
        role="tooltip"
        :style="style"
      >
        {{ text }}
      </span>
    </Transition>
  </span>
</template>

<style scoped>
.tooltip-root {
  display: inline-flex;
}

.tooltip {
  position: fixed;
  z-index: 80;
  max-width: 16rem;
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  line-height: var(--leading-normal);
  color: var(--color-bg);
  text-align: center;
  pointer-events: none;
  background: var(--color-text);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
  transform: translateX(-50%);
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition:
    opacity var(--motion-fast) var(--ease),
    translate var(--motion-fast) var(--ease);
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  translate: 0 3px;
}

.tooltip--below.tooltip-enter-from,
.tooltip--below.tooltip-leave-to {
  translate: 0 -3px;
}
</style>
