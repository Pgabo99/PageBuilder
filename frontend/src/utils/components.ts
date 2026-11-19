import type { ComponentType, PageComponent } from '@/types/content'

export const componentTypes: { type: ComponentType; label: string }[] = [
  { type: 'heading', label: 'Címsor' },
  { type: 'text', label: 'Szöveg' },
  { type: 'button', label: 'Gomb' },
]

export function componentLabel(type: ComponentType): string {
  return componentTypes.find((item) => item.type === type)?.label ?? type
}

function newId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ?? `c-${Date.now()}-${Math.random().toString(36).slice(2)}`
  )
}

/** Új komponens értelmes alapértékekkel (a szerver üres szöveget nem fogad el). */
export function createComponent(type: ComponentType): PageComponent {
  const id = newId()
  switch (type) {
    case 'heading':
      return { id, type, text: 'Új címsor', level: 2 }
    case 'text':
      return { id, type, text: 'Új bekezdés' }
    case 'button':
      return { id, type, label: 'Gomb', url: '/' }
  }
}

/** Az elem áthelyezése; a bemenő tömböt nem módosítja. */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) {
    return [...list]
  }
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item as T)
  return next
}
