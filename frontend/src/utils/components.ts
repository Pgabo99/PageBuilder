import type {
  AccordionItem,
  TextFormat,
  FooterLink,
  SocialItem,
  SocialPlatform,
  StatItem,
  AlertVariant,
  CardsLayout,
  ButtonRadius,
  ButtonSize,
  ButtonStyle,
  CardItem,
  ComponentType,
  HeadingAlign,
  HeadingLevel,
  HeadingSize,
  PageComponent,
} from '@/types/content'

/** A kártyák megengedett száma egy csoportban (a backend `PageContentRules::MAX_CARDS`-jával azonos). */
export const MIN_CARDS = 1
export const MAX_CARDS = 6

/** A becsukható részek megengedett száma (a backend `PageContentRules::MAX_ACCORDION_ITEMS`-ével azonos). */
export const MIN_ACCORDION_ITEMS = 1
export const MAX_ACCORDION_ITEMS = 20

/** A címsor választható szintjei, mérete és igazítása (a backend `PageContentRules` értékeivel azonos). */
export const HEADING_LEVEL_OPTIONS: { value: HeadingLevel; label: string }[] = [
  1, 2, 3, 4, 5, 6,
].map((level) => ({ value: level as HeadingLevel, label: `H${level}` }))

export const HEADING_SIZES: { value: HeadingSize; label: string }[] = [
  { value: 'small', label: 'Kicsi' },
  { value: 'medium', label: 'Közepes' },
  { value: 'large', label: 'Nagy' },
  { value: 'xlarge', label: 'Óriási' },
]

export const HEADING_ALIGNS: { value: HeadingAlign; label: string }[] = [
  { value: 'left', label: 'Balra' },
  { value: 'center', label: 'Középre' },
  { value: 'right', label: 'Jobbra' },
]

/** A címsor megjelenési osztályai; ismeretlen érték elmarad, így a régi vagy hibás adat az alapmegjelenést kapja. */
export function headingClasses(heading: { size?: string | null; align?: string | null }): string[] {
  const classes: string[] = []
  if (HEADING_SIZES.some((item) => item.value === heading.size)) {
    classes.push(`preview__heading--${heading.size}`)
  }
  if (HEADING_ALIGNS.some((item) => item.value === heading.align)) {
    classes.push(`preview__heading--${heading.align}`)
  }
  return classes
}

/** A gomb választható stílusai, méretei, igazításai és lekerekítései (a backend `PageContentRules` értékeivel azonos). */
export const BUTTON_STYLES: { value: ButtonStyle; label: string }[] = [
  { value: 'filled', label: 'Kitöltött' },
  { value: 'outline', label: 'Körvonalas' },
  { value: 'soft', label: 'Halvány' },
  { value: 'link', label: 'Szöveges (link)' },
]

export const BUTTON_SIZES: { value: ButtonSize; label: string }[] = [
  { value: 'small', label: 'Kicsi' },
  { value: 'medium', label: 'Közepes' },
  { value: 'large', label: 'Nagy' },
]

export const BUTTON_ALIGNS = HEADING_ALIGNS

export const BUTTON_RADII: { value: ButtonRadius; label: string }[] = [
  { value: 'none', label: 'Nincs' },
  { value: 'small', label: 'Kicsi' },
  { value: 'medium', label: 'Közepes' },
  { value: 'full', label: 'Teljes (kapszula)' },
]

/** A gomb megjelenési osztályai; ismeretlen érték elmarad, így a régi vagy hibás adat az alapmegjelenést kapja. */
export function buttonClasses(button: {
  style?: string | null
  size?: string | null
  radius?: string | null
}): string[] {
  const classes: string[] = []
  if (BUTTON_STYLES.some((item) => item.value === button.style)) {
    classes.push(`preview__button--${button.style}`)
  }
  if (BUTTON_SIZES.some((item) => item.value === button.size)) {
    classes.push(`preview__button--${button.size}`)
  }
  if (BUTTON_RADII.some((item) => item.value === button.radius)) {
    classes.push(`preview__button--r-${button.radius}`)
  }
  return classes
}

/** A gombot tartalmazó bekezdés igazítási osztálya (ismeretlen érték esetén nincs). */
export function buttonWrapClasses(button: { align?: string | null }): string[] {
  return BUTTON_ALIGNS.some((item) => item.value === button.align)
    ? [`preview__button-wrap--${button.align}`]
    : []
}

const SIZES = [
  { value: 'small', label: 'Kicsi' },
  { value: 'medium', label: 'Közepes' },
  { value: 'large', label: 'Nagy' },
]

/** A kártyacsoport elrendezési beállításai (a backend `PageContentRules::CARDS_OPTIONS` értékeivel azonos). */
/** Egy komponens előre definiált beállításai: a JSON mező neve, a címkék és a választható értékek. */
export type OptionSpec = {
  key: string
  label: string
  defaultLabel: string
  options: { value: string; label: string }[]
}[]

export const CARDS_OPTIONS: OptionSpec = [
  {
    key: 'columns',
    label: 'Oszlopok (legfeljebb)',
    defaultLabel: 'Alapértelmezett (automatikus)',
    options: [1, 2, 3, 4].map((n) => ({ value: String(n), label: String(n) })),
  },
  {
    key: 'icon_position',
    label: 'Ikon helye',
    defaultLabel: 'Alapértelmezett (felül balra)',
    options: [
      { value: 'top-left', label: 'Felül balra' },
      { value: 'top-center', label: 'Felül középen' },
      { value: 'left', label: 'Szöveg mellett balra' },
      { value: 'right', label: 'Szöveg mellett jobbra' },
    ],
  },
  {
    key: 'icon_size',
    label: 'Ikon mérete',
    defaultLabel: 'Alapértelmezett (közepes)',
    options: SIZES,
  },
  {
    key: 'text_align',
    label: 'Szövegigazítás',
    defaultLabel: 'Alapértelmezett (balra)',
    options: HEADING_ALIGNS,
  },
  {
    key: 'border',
    label: 'Keret',
    defaultLabel: 'Alapértelmezett (vékony)',
    options: [
      { value: 'none', label: 'Nincs' },
      { value: 'thin', label: 'Vékony' },
      { value: 'thick', label: 'Vastag' },
    ],
  },
  {
    key: 'shadow',
    label: 'Árnyék',
    defaultLabel: 'Alapértelmezett (nincs)',
    options: [
      { value: 'none', label: 'Nincs' },
      { value: 'small', label: 'Kicsi' },
      { value: 'medium', label: 'Közepes' },
    ],
  },
  {
    key: 'radius',
    label: 'Lekerekítés',
    defaultLabel: 'Alapértelmezett (közepes)',
    options: [{ value: 'none', label: 'Nincs' }, ...SIZES],
  },
  {
    key: 'button_position',
    label: 'Gomb helye',
    defaultLabel: 'Alapértelmezett (a szöveggel egyező)',
    options: HEADING_ALIGNS,
  },
  {
    key: 'gap',
    label: 'Kártyák közti térköz',
    defaultLabel: 'Alapértelmezett (közepes)',
    options: SIZES,
  },
  {
    key: 'padding',
    label: 'Kártya belső margója',
    defaultLabel: 'Alapértelmezett (közepes)',
    options: SIZES,
  },
]

/** Az elválasztó beállításai (a backend `PageContentRules::DIVIDER_OPTIONS` értékeivel azonos). */
export const DIVIDER_OPTIONS: OptionSpec = [
  {
    key: 'thickness',
    label: 'Vastagság',
    defaultLabel: 'Alapértelmezett (vékony)',
    options: [
      { value: 'thin', label: 'Vékony' },
      { value: 'medium', label: 'Közepes' },
      { value: 'thick', label: 'Vastag' },
    ],
  },
  {
    key: 'style',
    label: 'Stílus',
    defaultLabel: 'Alapértelmezett (folytonos)',
    options: [
      { value: 'solid', label: 'Folytonos' },
      { value: 'dashed', label: 'Szaggatott' },
      { value: 'dotted', label: 'Pontozott' },
    ],
  },
  {
    key: 'color',
    label: 'Szín',
    defaultLabel: 'Alapértelmezett (keretszín)',
    options: [
      { value: 'border', label: 'Keretszín' },
      { value: 'text', label: 'Szövegszín' },
      { value: 'accent', label: 'Kiemelőszín' },
    ],
  },
]

/** Az előre definiált beállításokból osztályok; ismeretlen érték elmarad, így a régi vagy hibás adat az alapmegjelenést kapja. */
function modifierClasses(values: object, spec: typeof CARDS_OPTIONS, prefix: string): string[] {
  const record = values as Record<string, unknown>
  return spec.flatMap(({ key, options }) => {
    const value = record[key]
    const known =
      (typeof value === 'string' || typeof value === 'number') &&
      options.some((option) => option.value === String(value))
    return known ? [`${prefix}--${key.replace('_', '-')}-${value}`] : []
  })
}

export const cardsClasses = (cards: CardsLayout): string[] =>
  modifierClasses(cards, CARDS_OPTIONS, 'preview__cards')

export const dividerClasses = (divider: object): string[] =>
  modifierClasses(divider, DIVIDER_OPTIONS, 'preview__divider')

/** A térköz magassága rem-ben (a backend `PageContentRules::SPACER_*` értékeivel azonos). */
export const MIN_SPACER_HEIGHT = 1
export const MAX_SPACER_HEIGHT = 20
export const DEFAULT_SPACER_HEIGHT = 2

/** A megjelenített térköz a megengedett tartományra szorítva (hibás vagy hiányzó érték esetén az alapérték). */
export const spacerHeight = (value: unknown): number => {
  const height = Math.trunc(Number(value))
  return Number.isFinite(height)
    ? Math.min(MAX_SPACER_HEIGHT, Math.max(MIN_SPACER_HEIGHT, height))
    : DEFAULT_SPACER_HEIGHT
}

/** A címsor és a gomb megjelenési beállításai (a backend `PageContentRules` értékeivel azonos). */
export const HEADING_OPTIONS: OptionSpec = [
  {
    key: 'size',
    label: 'Megjelenési méret',
    defaultLabel: 'Alapértelmezett (a szinthez igazodik)',
    options: HEADING_SIZES,
  },
  {
    key: 'align',
    label: 'Igazítás',
    defaultLabel: 'Alapértelmezett (balra)',
    options: HEADING_ALIGNS,
  },
]

export const BUTTON_OPTIONS: OptionSpec = [
  {
    key: 'style',
    label: 'Stílus',
    defaultLabel: 'Alapértelmezett (kitöltött)',
    options: BUTTON_STYLES,
  },
  { key: 'size', label: 'Méret', defaultLabel: 'Alapértelmezett (közepes)', options: BUTTON_SIZES },
  {
    key: 'align',
    label: 'Igazítás',
    defaultLabel: 'Alapértelmezett (balra)',
    options: BUTTON_ALIGNS,
  },
  {
    key: 'radius',
    label: 'Lekerekítés',
    defaultLabel: 'Alapértelmezett (közepes)',
    options: BUTTON_RADII,
  },
]

/** A hivatkozás-mezők súgója: engedélyezett célformák (a backend `URL_PATTERN`-jével azonos). */
export const URL_FIELD_HINT = '(https://…, /útvonal vagy #horgony)'

/** Az értesítés típusai; a jel az ikon nélküli doboz színtől független jelzése (mint a backend `SiteRenderContext::ALERTS`). */
export const ALERT_VARIANTS: { value: AlertVariant; label: string; marker: string }[] = [
  { value: 'info', label: 'Információ', marker: 'i' },
  { value: 'success', label: 'Siker', marker: '✓' },
  { value: 'warning', label: 'Figyelmeztetés', marker: '!' },
  { value: 'error', label: 'Hiba', marker: '✕' },
]

/** Az értesítés ismert típusa; hibás érték esetén információ. */
export const alertVariant = (value: unknown): AlertVariant =>
  ALERT_VARIANTS.find((item) => item.value === value)?.value ?? 'info'

export const alertMarker = (value: unknown): string =>
  ALERT_VARIANTS.find((item) => item.value === alertVariant(value))!.marker

/** A statisztikák megengedett száma (a backend `PageContentRules::MAX_STATS`-ával azonos). */
export const MIN_STATS = 1
export const MAX_STATS = 6

/** A közösségi hivatkozások megengedett száma (a backend `PageContentRules::MAX_SOCIAL`-jával azonos). */
export const MIN_SOCIAL = 1
export const MAX_SOCIAL = 10

/** A választható platformok; az érték a márkaikon neve (`brandIcons`). */
export const SOCIAL_PLATFORMS: { value: SocialPlatform; label: string }[] = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'github', label: 'GitHub' },
  { value: 'twitch', label: 'Twitch' },
  { value: 'gitlab', label: 'GitLab' },
]

/** A lábléc linkjeinek megengedett száma (a backend `PageContentRules::MAX_FOOTER_LINKS`-ével azonos). */
export const MIN_FOOTER_LINKS = 0
export const MAX_FOOTER_LINKS = 8

/** A lábléc telefonszáma (a backend `PageContentRules::PHONE_PATTERN`-jével azonos szabály). */
export const PHONE_PATTERN = /^[0-9+()\-\s.]*[0-9][0-9+()\-\s.]*$/

/** A telefonszám `tel:` hivatkozása (csak számjegyek és +); érvénytelen szám esetén null. */
export function phoneHref(phone: unknown): string | null {
  return typeof phone === 'string' && PHONE_PATTERN.test(phone)
    ? `tel:${phone.replace(/[^0-9+]/g, '')}`
    : null
}

/** A biztonságos hivatkozás: a backend `PageContentRules::URL_PATTERN`-jével azonos szabály (javascript: és data: tiltott). */
export const SAFE_URL = /^(?:https?:\/\/\S+|\/(?!\/)\S*|#\S*)$/i

/** A szöveg formátumai (az üres érték a sima szöveg) és a formázás súgója. */
export const TEXT_FORMATS: { value: TextFormat; label: string }[] = [
  { value: 'markdown', label: 'Formázott (félkövér, dőlt, lista, link)' },
]
export const MARKDOWN_HINT =
  '**félkövér**, *dőlt*, „- elem” felsorolás, „1. elem” számozott lista, [szöveg](cím) hivatkozás; üres sor új bekezdés.'

export const componentTypes: { type: ComponentType; label: string }[] = [
  { type: 'heading', label: 'Címsor' },
  { type: 'text', label: 'Szöveg' },
  { type: 'button', label: 'Gomb' },
  { type: 'cards', label: 'Kártyák' },
  { type: 'accordion', label: 'Becsukható részek' },
  { type: 'divider', label: 'Elválasztó' },
  { type: 'spacer', label: 'Térköz' },
  { type: 'alert', label: 'Értesítődoboz' },
  { type: 'quote', label: 'Idézet' },
  { type: 'stats', label: 'Statisztika' },
  { type: 'social', label: 'Közösségi média' },
  { type: 'footer', label: 'Lábléc' },
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

/** Új lábléc-link: a felirat és a cél is kötelező. */
export function createFooterLink(): FooterLink {
  return { id: newId(), label: 'Új link', url: '/' }
}

/** Új közösségi hivatkozás: a platform és a link is kötelező. */
export function createSocial(): SocialItem {
  return { id: newId(), platform: 'facebook', url: 'https://www.facebook.com/' }
}

/** Új statisztika: az érték és a megnevezés kötelező, a többi opcionális. */
export function createStat(): StatItem {
  return { id: newId(), icon: null, value: '100', label: 'Új statisztika', prefix: '', suffix: '' }
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
      return { id, type, text: 'Új bekezdés', format: 'markdown' }
    case 'button':
      return { id, type, label: 'Gomb', url: '/' }
    case 'cards':
      return { id, type, cards: [createCard()] }
    case 'accordion':
      return { id, type, items: [createAccordionItem()] }
    case 'divider':
      return { id, type }
    case 'spacer':
      return { id, type, height: DEFAULT_SPACER_HEIGHT }
    case 'alert':
      return { id, type, variant: 'info', text: 'Új értesítés' }
    case 'quote':
      return { id, type, text: 'Új idézet' }
    case 'stats':
      return { id, type, items: [createStat()] }
    case 'social':
      return { id, type, items: [createSocial()] }
    case 'footer':
      return { id, type, copyright: '© Weboldal', links: [] }
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
    case 'divider':
      return 'Vízszintes vonal'
    case 'spacer':
      return `${component.height} rem térköz`
    case 'alert':
      return component.title || component.text
    case 'footer':
      return component.copyright || 'Lábléc'
    case 'social': {
      const first = SOCIAL_PLATFORMS.find((item) => item.value === component.items[0]?.platform)
      return `${component.items.length} hivatkozás${first ? `: ${first.label}` : ''}`
    }
    case 'stats': {
      const first = component.items[0]?.label ?? ''
      return `${component.items.length} statisztika${first ? `: ${first}` : ''}`
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
  if (component.type === 'stats') {
    return {
      ...component,
      id: newId(),
      items: component.items.map((item) => ({ ...item, id: newId() })),
    }
  }
  if (component.type === 'footer') {
    return {
      ...component,
      id: newId(),
      links: component.links?.map((link) => ({ ...link, id: newId() })) ?? null,
    }
  }
  if (component.type === 'social') {
    return {
      ...component,
      id: newId(),
      items: component.items.map((item) => ({ ...item, id: newId() })),
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
