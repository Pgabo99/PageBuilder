<script setup lang="ts">
import { useId } from 'vue'

import FormField from '@/components/FormField.vue'
import ItemListEditor from '@/components/ItemListEditor.vue'
import type { FooterComponent, FooterLink } from '@/types/content'
import {
  createFooterLink,
  MAX_FOOTER_LINKS,
  MIN_FOOTER_LINKS,
  type PageTarget,
  URL_FIELD_HINT,
} from '@/utils/components'

// Az oldal láblécének szerkesztője: copyright, linkek (belső oldalak és külső címek), elérhetőségek.
// Minden mező opcionális, az üres lábléc nem jelenik meg. A hibák kulcsa `links.0.url`, `email`, `phone`.
defineProps<{
  errors: Record<string, string[]>
  targets?: PageTarget[]
}>()

const model = defineModel<FooterComponent>({ required: true })

const uid = useId()

// A linklista a régi, mező nélküli láblécnél hiányzik: első használatkor létrejön.
const links = {
  get: (): FooterLink[] => model.value.links ?? [],
  set: (value: FooterLink[]): void => {
    model.value.links = value
  },
}
</script>

<template>
  <FormField
    v-model="model.copyright"
    label="Copyright-szöveg"
    :required="false"
    :error="errors.copyright"
  />

  <ItemListEditor
    :model-value="links.get()"
    item-label="Link"
    count-label="link"
    :min="MIN_FOOTER_LINKS"
    :max="MAX_FOOTER_LINKS"
    :create-item="createFooterLink"
    :error="errors.links"
    @update:model-value="links.set($event)"
  >
    <template #item="{ item, index }">
      <FormField
        v-model="item.label"
        label="Felirat"
        :required="false"
        :error="errors[`links.${index}.label`]"
      />
      <FormField
        v-model="item.url"
        :label="`Cél ${URL_FIELD_HINT}`"
        :required="false"
        :list="targets?.length ? `${uid}-targets` : undefined"
        :error="errors[`links.${index}.url`]"
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

  <FormField
    v-model="model.email"
    label="E-mail-cím (opcionális)"
    type="email"
    :required="false"
    :error="errors.email"
  />
  <FormField
    v-model="model.phone"
    label="Telefonszám (opcionális)"
    type="tel"
    :required="false"
    :error="errors.phone"
  />
  <FormField
    v-model="model.address"
    label="Cím (opcionális)"
    :required="false"
    :error="errors.address"
  />
</template>
