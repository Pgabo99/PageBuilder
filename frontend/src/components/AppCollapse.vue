<script setup lang="ts">
import { nextTick, ref, useTemplateRef, watch } from 'vue'

// Közös összecsukó dinamikus magasságú tartalomhoz (grid-template-rows: 0fr ↔ 1fr, mérés nélkül).
// A tartalom csak nyitva (vagy záródás közben) van a DOM-ban; az időtartamot a --motion-normal token adja,
// így csökkentett mozgásnál (0ms) azonnal vált.
const props = defineProps<{ open: boolean }>()

const el = useTemplateRef<HTMLElement>('el')
const rendered = ref(props.open)
const expanded = ref(props.open)

function animates(): boolean {
  if (!el.value) return false
  const durations = getComputedStyle(el.value).transitionDuration.split(',')
  return durations.some((value) => parseFloat(value) > 0)
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      rendered.value = true
      await nextTick()
      void el.value?.offsetHeight // reflow: a nyitás a zárt állapotból induljon
      expanded.value = true
    } else {
      expanded.value = false
      if (!animates()) rendered.value = false
    }
  },
)

function onTransitionEnd(event: TransitionEvent): void {
  if (event.target === el.value && !expanded.value) rendered.value = false
}
</script>

<template>
  <div
    ref="el"
    class="collapse"
    :class="{ 'collapse--open': expanded }"
    :inert="!expanded"
    @transitionend="onTransitionEnd"
  >
    <div class="collapse__inner">
      <slot v-if="rendered" />
    </div>
  </div>
</template>

<style scoped>
.collapse {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--motion-normal) var(--ease);
}

.collapse--open {
  grid-template-rows: 1fr;
}

.collapse__inner {
  min-height: 0;
  overflow: clip;
  overflow-clip-margin: 4px;
}
</style>
