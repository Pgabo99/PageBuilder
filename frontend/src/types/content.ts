import type { PageTheme } from '@/utils/themes'

export type PublishStatus = 'queued' | 'running' | 'succeeded' | 'failed'

export interface Website {
  id: number
  name: string
  slug: string
  publish_status: PublishStatus | null
  published_at: string | null
  published_url: string | null
  publish_error: string | null
  accent_color: string | null
  page_theme: PageTheme | null
  created_at: string
  updated_at: string
}

export interface WebsitePayload {
  name: string
  slug: string
  accent_color: string | null
  page_theme: PageTheme | null
}

/** A címsor megjelenési mérete; az üres érték a szemantikus szinthez igazodó alapméret. */
export type HeadingSize = 'small' | 'medium' | 'large' | 'xlarge'
export type HeadingAlign = 'left' | 'center' | 'right'
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export interface HeadingComponent {
  id: string
  type: 'heading'
  text: string
  /** Szemantikus szint (a dokumentumszerkezet), a megjelenéstől függetlenül. */
  level: HeadingLevel
  size?: HeadingSize | null
  align?: HeadingAlign | null
  /** Az engedélyezett ikonkészlet egy neve (`utils/icons.ts`); üres: nincs ikon. */
  icon?: string | null
}

export interface TextComponent {
  id: string
  type: 'text'
  text: string
}

export interface ButtonComponent {
  id: string
  type: 'button'
  label: string
  url: string
}

/** A kártya gombja: a felirat és a cél együtt kötelező, vagy mindkettő üres. */
export interface CardItem {
  id: string
  icon?: string | null
  title: string
  text?: string | null
  label?: string | null
  url?: string | null
}

export interface CardsComponent {
  id: string
  type: 'cards'
  cards: CardItem[]
}

/** Egy becsukható rész: a cím és a szöveg is kötelező. */
export interface AccordionItem {
  id: string
  title: string
  text: string
}

export interface AccordionComponent {
  id: string
  type: 'accordion'
  items: AccordionItem[]
}

export type PageComponent =
  HeadingComponent | TextComponent | ButtonComponent | CardsComponent | AccordionComponent
export type ComponentType = PageComponent['type']

export interface Page {
  id: number
  website_id: number
  title: string
  slug: string
  position: number
  content: PageComponent[]
  created_at: string
  updated_at: string
}

export interface PagePayload {
  title: string
  slug: string
  content: PageComponent[]
}
