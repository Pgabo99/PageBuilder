<script setup lang="ts">
import { computed, h, type VNode } from 'vue'

import { type Block, type Inline, parseMarkdown } from '@/utils/markdown'

// A formázott szöveg megjelenítése leíró fából (nincs `v-html`): kizárólag p, br, strong, em, ul, ol, li és a
// elem készül, a szöveg escape-elt. A hivatkozás az előnézetben nem navigál (a kattintás az elemet jelöli ki).
const props = defineProps<{ source: string }>()

const blocks = computed(() => parseMarkdown(props.source))

function inline(nodes: readonly Inline[]): (VNode | string)[] {
  return nodes.map((node) => {
    if (typeof node === 'string') return node
    switch (node.type) {
      case 'br':
        return h('br')
      case 'a':
        return h(
          'a',
          {
            href: node.href,
            rel: 'noopener noreferrer',
            onClick: (e: Event) => e.preventDefault(),
          },
          node.label,
        )
      default:
        return h(node.type, inline(node.children))
    }
  })
}

function block(item: Block): VNode {
  return item.type === 'p'
    ? h('p', inline(item.inline))
    : h(
        item.type,
        item.items.map((entry) => h('li', inline(entry))),
      )
}

const render = () => blocks.value.map(block)
</script>

<template>
  <render />
</template>
