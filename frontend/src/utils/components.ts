import type { AccordionItem, CardItem, ComponentType, PageComponent } from '@/types/content'

/** A kártyák megengedett száma egy csoportban (a backend `PageContentRules::MAX_CARDS`-jával azonos). */
export const MIN_CARDS = 1
export const MAX_CARDS = 6

/** A becsukható részek megengedett száma (a backend `PageContentRules::MAX_ACCORDION_ITEMS`-ével azonos). */
export const MIN_ACCORDION_ITEMS = 1
export const MAX_ACCORDION_ITEMS = 20

export const componentTypes: { type: ComponentType; label: string }[] = [
  { type: 'heading', label: 'Címsor' },
  { type: 'text', label: 'Szöveg' },
  { type: 'button', label: 'Gomb' },
  { type: 'cards', label: 'Kártyák' },
  { type: 'accordion', label: 'Becsukható részek' },
]

export function componentLabel(type: ComponentType): string {
  return componentTypes.find((item) => item.type === type)?.label ?? type
}

function newId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ?? `c-${Date.now()}-${Math.random().toString(36).slice(2)}`
  )
}

/** Új kártya: a cím kötelező, a többi mező opcionális. */
export function createCard(): CardItem {
  return { id: newId(), icon: null, title: 'Új kártya', text: '', label: '', url: '' }
}

/** Új rész: a szerver üres címet és szöveget nem fogad el. */
export function createAccordionItem(): AccordionItem {
  return { id: newId(), title: 'Új rész', text: 'Új tartalom' }
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
    case 'cards':
      return { id, type, cards: [createCard()] }
    case 'accordion':
      return { id, type, items: [createAccordionItem()] }
  }
}

/** A húzott elem beszúrási rése: hány elem közepe van az egérkurzor felett (0..elemszám). */
export function dropSlot(midpoints: readonly number[], y: number): number {
  return midpoints.filter((midpoint) => midpoint < y).length
}

/** A rés (az eredeti listában az elem elé) → a húzott elem célindexe az eltávolítása után. */
export function slotTarget(from: number, slot: number): number {
  return slot > from ? slot - 1 : slot
}

function summarySource(component: PageComponent): string {
  switch (component.type) {
    case 'button':
      return [component.label, component.url].filter(Boolean).join(' → ')
    case 'cards': {
      const first = component.cards[0]?.title ?? ''
      return `${component.cards.length} kártya${first ? `: ${first}` : ''}`
    }
    case 'accordion': {
      const first = component.items[0]?.title ?? ''
      return `${component.items.length} rész${first ? `: ${first}` : ''}`
    }
    default:
      return component.text
  }
}

/** Rövid tartalmi összefoglaló az összecsukott komponenshez. */
export function componentSummary(component: PageComponent, max = 60): string {
  const raw = summarySource(component)
  const text = raw.replace(/\s+/g, ' ').trim()
  if (text === '') return '(üres)'
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

export interface PageTarget {
  label: string
  url: string
}

/** A webhely oldalainak publikált címe; az első (pozíció szerinti) oldal a webhely gyökere. */
export function pageTargets(
  websiteSlug: string,
  pages: readonly { title: string; slug: string; position: number }[],
): PageTarget[] {
  const base = `/sites/${websiteSlug}/`
  return [...pages]
    .sort((a, b) => a.position - b.position)
    .map((page, index) => ({ label: page.title, url: index === 0 ? base : `${base}${page.slug}/` }))
}

/** Másolat új azonosítóval; a kártyacsoport kártyái is új azonosítót kapnak, és nem osztoznak az eredetivel. */
export function cloneComponent(component: PageComponent): PageComponent {
  if (component.type === 'cards') {
    return {
      ...component,
      id: newId(),
      cards: component.cards.map((card) => ({ ...card, id: newId() })),
    }
  }
  if (component.type === 'accordion') {
    return {
      ...component,
      id: newId(),
      items: component.items.map((item) => ({ ...item, id: newId() })),
    }
  }
  return { ...component, id: newId() }
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
