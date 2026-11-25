<script setup lang="ts">
import FormField from '@/components/FormField.vue'
import IconPicker from '@/components/IconPicker.vue'
import ItemListEditor from '@/components/ItemListEditor.vue'
import type { StatItem } from '@/types/content'
import { createStat, MAX_STATS, MIN_STATS } from '@/utils/components'

// A statisztikák szerkesztője: 1–6 elem, mindegyiknek kötelező értéke és megnevezése van,
// az ikon, az előtag és az utótag opcionális. A hibák kulcsa `items.0.value`, a listáé `items`.
defineProps<{ errors: Record<string, string[]> }>()

const items = defineModel<StatItem[]>({ required: true })
</script>

<template>
  <ItemListEditor
    v-model="items"
    item-label="Statisztika"
    count-label="statisztika"
    :min="MIN_STATS"
    :max="MAX_STATS"
    :create-item="createStat"
    :error="errors.items"
  >
    <template #item="{ item, index }">
      <IconPicker v-model="item.icon" :error="errors[`items.${index}.icon`]" />
      <FormField
        v-model="item.value"
        label="Érték"
        :required="false"
        :error="errors[`items.${index}.value`]"
      />
      <FormField
        v-model="item.label"
        label="Megnevezés"
        :required="false"
        :error="errors[`items.${index}.label`]"
      />
      <FormField
        v-model="item.prefix"
        label="Előtag (opcionális)"
        :required="false"
        :error="errors[`items.${index}.prefix`]"
      />
      <FormField
        v-model="item.suffix"
        label="Utótag (opcionális)"
        :required="false"
        :error="errors[`items.${index}.suffix`]"
      />
    </template>
  </ItemListEditor>
</template>
