<script setup lang="ts">
import { useId } from 'vue'

import FormField from '@/components/FormField.vue'
import IconPicker from '@/components/IconPicker.vue'
import ItemListEditor from '@/components/ItemListEditor.vue'
import type { CardItem } from '@/types/content'
import {
  createCard,
  MAX_CARDS,
  MIN_CARDS,
  type PageTarget,
  URL_FIELD_HINT,
} from '@/utils/components'

// A kártyacsoport szerkesztője: 1–6 kártya, kártyánként ikon, cím, leírás és opcionális gomb.
// A hibák kulcsa a komponensen belüli út (`cards.0.title`), a csoportra vonatkozó hibáé `cards`.
defineProps<{
  errors: Record<string, string[]>
  targets?: PageTarget[]
}>()

const cards = defineModel<CardItem[]>({ required: true })

const uid = useId()
</script>

<template>
  <ItemListEditor
    v-model="cards"
    item-label="Kártya"
    count-label="kártya"
    :min="MIN_CARDS"
    :max="MAX_CARDS"
    :create-item="createCard"
    :error="errors.cards"
  >
    <template #item="{ item: card, index }">
      <IconPicker v-model="card.icon" :error="errors[`cards.${index}.icon`]" />
      <FormField
        v-model="card.title"
        label="Cím"
        :required="false"
        :error="errors[`cards.${index}.title`]"
      />
      <FormField
        v-model="card.text"
        label="Leírás (opcionális)"
        multiline
        :rows="2"
        :required="false"
        :error="errors[`cards.${index}.text`]"
      />
      <FormField
        v-model="card.label"
        label="Gomb felirata (opcionális)"
        :required="false"
        :error="errors[`cards.${index}.label`]"
      />
      <FormField
        v-model="card.url"
        :label="`Gomb célja ${URL_FIELD_HINT.slice(0, -1)}; a felirattal együtt)`"
        :required="false"
        :list="targets?.length ? `${uid}-targets` : undefined"
        :error="errors[`cards.${index}.url`]"
      />
    </template>

    <template #after>
      <datalist v-if="targets?.length" :id="`${uid}-targets`">
        <option v-for="target in targets" :key="target.url" :value="target.url">
          {{ target.label }}
        </option>
      </datalist>
    </template>
  </ItemListEditor>
</template>
