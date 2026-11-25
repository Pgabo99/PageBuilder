<script setup lang="ts">
import { useId } from 'vue'

import FormField from '@/components/FormField.vue'
import ItemListEditor from '@/components/ItemListEditor.vue'
import SelectField from '@/components/SelectField.vue'
import type { SocialItem } from '@/types/content'
import {
  createSocial,
  MAX_SOCIAL,
  MIN_SOCIAL,
  type PageTarget,
  SOCIAL_PLATFORMS,
  URL_FIELD_HINT,
} from '@/utils/components'

// A közösségi hivatkozások szerkesztője: 1–10 profil, mindegyiknek kötelező platformja és linkje van.
// A hibák kulcsa `items.0.url`, a listáé `items`.
defineProps<{
  errors: Record<string, string[]>
  targets?: PageTarget[]
}>()

const items = defineModel<SocialItem[]>({ required: true })

const uid = useId()
</script>

<template>
  <ItemListEditor
    v-model="items"
    item-label="Profil"
    count-label="profil"
    :min="MIN_SOCIAL"
    :max="MAX_SOCIAL"
    :create-item="createSocial"
    :error="errors.items"
  >
    <template #item="{ item, index }">
      <SelectField
        v-model="item.platform"
        label="Platform"
        :options="SOCIAL_PLATFORMS"
        :error="errors[`items.${index}.platform`]"
      />
      <FormField
        v-model="item.url"
        :label="`Link ${URL_FIELD_HINT}`"
        :required="false"
        :list="targets?.length ? `${uid}-targets` : undefined"
        :error="errors[`items.${index}.url`]"
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
