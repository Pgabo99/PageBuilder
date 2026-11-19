export type PublishStatus = 'queued' | 'running' | 'succeeded' | 'failed'

export interface Website {
  id: number
  name: string
  slug: string
  publish_status: PublishStatus | null
  published_at: string | null
  published_url: string | null
  publish_error: string | null
  created_at: string
  updated_at: string
}

export interface WebsitePayload {
  name: string
  slug: string
}

export interface HeadingComponent {
  id: string
  type: 'heading'
  text: string
  level: 1 | 2 | 3
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

export type PageComponent = HeadingComponent | TextComponent | ButtonComponent
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
