export interface Website {
  id: number
  name: string
  slug: string
  created_at: string
  updated_at: string
}

export interface WebsitePayload {
  name: string
  slug: string
}

export interface Page {
  id: number
  website_id: number
  title: string
  slug: string
  position: number
  content: unknown[]
  created_at: string
  updated_at: string
}

export interface PagePayload {
  title: string
  slug: string
  content: unknown[]
}
