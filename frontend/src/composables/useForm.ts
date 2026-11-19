import { ref } from 'vue'

import { ValidationError, errorMessage } from '@/api/client'

/** Űrlapküldés közös állapota: folyamatban jelzés, mezőnkénti és általános hiba. */
export function useForm() {
  const submitting = ref(false)
  const errors = ref<Record<string, string[]>>({})
  const message = ref<string | null>(null)

  async function submit(action: () => Promise<void>): Promise<boolean> {
    if (submitting.value) return false
    submitting.value = true
    errors.value = {}
    message.value = null
    try {
      await action()
      return true
    } catch (error) {
      if (error instanceof ValidationError) errors.value = error.errors
      else message.value = errorMessage(error)
      return false
    } finally {
      submitting.value = false
    }
  }

  return { submitting, errors, message, submit }
}
