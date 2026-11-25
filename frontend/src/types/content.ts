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

/** A gomb megjelenése; az üres érték a jelenlegi (kitöltött, közepes, balra igazított, kissé lekerekített) megjelenés. */
export type ButtonStyle = 'filled' | 'outline' | 'soft' | 'link'
export type ButtonSize = 'small' | 'medium' | 'large'
export type ButtonAlign = 'left' | 'center' | 'right'
export type ButtonRadius = 'none' | 'small' | 'medium' | 'full'

export interface ButtonComponent {
  id: string
  type: 'button'
  label: string
  url: string
  style?: ButtonStyle | null
  size?: ButtonSize | null
  align?: ButtonAlign | null
  radius?: ButtonRadius | null
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

/** A kártyacsoport elrendezése; az üres érték a jelenlegi megjelenés (`CARDS_OPTIONS` az értékekkel és címkékkel). */
export interface CardsLayout {
  columns?: 1 | 2 | 3 | 4 | null
  icon_position?: 'top-left' | 'top-center' | 'left' | 'right' | null
  icon_size?: 'small' | 'medium' | 'large' | null
  text_align?: 'left' | 'center' | 'right' | null
  border?: 'none' | 'thin' | 'thick' | null
  shadow?: 'none' | 'small' | 'medium' | null
  radius?: 'none' | 'small' | 'medium' | 'large' | null
  button_position?: 'left' | 'center' | 'right' | null
  gap?: 'small' | 'medium' | 'large' | null
  padding?: 'small' | 'medium' | 'large' | null
}

export interface CardsComponent extends CardsLayout {
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

/** Az elválasztó vonal megjelenése; az üres érték a vékony, folytonos, keretszínű vonal. */
export interface DividerComponent {
  id: string
  type: 'divider'
  thickness?: 'thin' | 'medium' | 'thick' | null
  style?: 'solid' | 'dashed' | 'dotted' | null
  color?: 'border' | 'text' | 'accent' | null
}

/** Függőleges térköz; a magasság rem-ben, egész szám (`MIN_SPACER_HEIGHT`–`MAX_SPACER_HEIGHT`). */
export interface SpacerComponent {
  id: string
  type: 'spacer'
  height: number
}

export type AlertVariant = 'info' | 'success' | 'warning' | 'error'

/** Értesítődoboz: a típus és a szöveg kötelező, a cím és az ikon opcionális. */
export interface AlertComponent {
  id: string
  type: 'alert'
  variant: AlertVariant
  title?: string | null
  text: string
  icon?: string | null
}

/** Idézet: a szöveg kötelező; a szerző és a forrás opcionális, a forrás linkje csak a forrás szövegével együtt adható meg. */
export interface QuoteComponent {
  id: string
  type: 'quote'
  text: string
  author?: string | null
  source?: string | null
  source_url?: string | null
}

/** Egy statisztika: az érték (szövegként) és a megnevezés kötelező, az ikon, az előtag és az utótag opcionális. */
export interface StatItem {
  id: string
  icon?: string | null
  value: string
  label: string
  prefix?: string | null
  suffix?: string | null
}

export interface StatsComponent {
  id: string
  type: 'stats'
  items: StatItem[]
}

export type SocialPlatform =
  'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'github' | 'twitch' | 'gitlab'

/** Egy közösségi hivatkozás: a platform (márkaikon) és a link is kötelező. */
export interface SocialItem {
  id: string
  platform: SocialPlatform
  url: string
}

export interface SocialComponent {
  id: string
  type: 'social'
  items: SocialItem[]
}

export interface AccordionComponent {
  id: string
  type: 'accordion'
  items: AccordionItem[]
}

export type PageComponent =
  | HeadingComponent
  | TextComponent
  | ButtonComponent
  | CardsComponent
  | AccordionComponent
  | DividerComponent
  | SpacerComponent
  | AlertComponent
  | QuoteComponent
  | StatsComponent
  | SocialComponent
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
