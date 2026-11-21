import { readonly, ref } from 'vue'

export interface ConfirmOptions {
  title: string
  message: string
  confirmLabel: string
  /** Romboló művelet: a megerősítő gomb figyelmeztető színű. */
  danger?: boolean
}

const pending = ref<ConfirmOptions | null>(null)
let resolver: ((answer: boolean) => void) | null = null

function answer(value: boolean): void {
  resolver?.(value)
  resolver = null
  pending.value = null
}

/** Megerősítés kérése: az `App`-ban lévő `ConfirmDialog` jeleníti meg, a válasz ígéretként érkezik. */
export function useConfirm() {
  function confirm(options: ConfirmOptions): Promise<boolean> {
    // Ha egy korábbi kérdés még nyitott, azt elutasítottnak tekintjük.
    answer(false)
    pending.value = options
    return new Promise((resolve) => {
      resolver = resolve
    })
  }

  return { confirm, pending: readonly(pending), answer }
}
