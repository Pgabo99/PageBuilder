import { readonly, ref } from 'vue'

export type ToastKind = 'success' | 'error'

export interface Toast {
  id: number
  kind: ToastKind
  message: string
}

const SUCCESS_MS = 4000
const ERROR_MS = 8000

const toasts = ref<Toast[]>([])
let nextId = 1

function dismiss(id: number): void {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

function push(kind: ToastKind, message: string, ttl: number): void {
  const id = nextId++
  toasts.value.push({ id, kind, message })
  setTimeout(() => dismiss(id), ttl)
}

/** Rövid visszajelzések: az `App`-ban lévő `ToastHost` jeleníti meg őket. */
export function useToast() {
  return {
    toasts: readonly(toasts),
    success: (message: string) => push('success', message, SUCCESS_MS),
    error: (message: string) => push('error', message, ERROR_MS),
    dismiss,
  }
}

/** Csak teszteléshez: üres állapot. */
export function resetToasts(): void {
  toasts.value = []
}
