<script setup lang="ts">
import FormField from '@/components/FormField.vue'
import ItemListEditor from '@/components/ItemListEditor.vue'
import type { AccordionItem } from '@/types/content'
import { createAccordionItem, MAX_ACCORDION_ITEMS, MIN_ACCORDION_ITEMS } from '@/utils/components'

// A becsukható részek szerkesztője: 1–20 rész, mindegyiknek kötelező címe és szövege van.
// A hibák kulcsa a komponensen belüli út (`items.0.title`), a listára vonatkozó hibáé `items`.
defineProps<{ errors: Record<string, string[]> }>()

const items = defineModel<AccordionItem[]>({ required: true })
</script>

<template>
  <ItemListEditor
    v-model="items"
    item-label="Rész"
    count-label="rész"
    :min="MIN_ACCORDION_ITEMS"
    :max="MAX_ACCORDION_ITEMS"
    :create-item="createAccordionItem"
    :error="errors.items"
  >
    <template #item="{ item, index }">
      <FormField
        v-model="item.title"
        label="Cím"
        :required="false"
        :error="errors[`items.${index}.title`]"
      />
      <FormField
        v-model="item.text"
        label="Szöveg"
        multiline
        :rows="3"
        :required="false"
        :error="errors[`items.${index}.text`]"
      />
    </template>
  </ItemListEditor>
</template>
