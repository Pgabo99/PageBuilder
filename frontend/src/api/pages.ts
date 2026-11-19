import type { Page, PagePayload } from '@/types/content'

import { request } from './client'

interface Resource<T> {
  data: T
}

export const pagesApi = {
  list: async (websiteId: number) =>
    (await request<Resource<Page[]>>('GET', `/api/v1/websites/${websiteId}/pages`)).data,
  get: async (id: number) => (await request<Resource<Page>>('GET', `/api/v1/pages/${id}`)).data,
  create: async (websiteId: number, payload: PagePayload) =>
    (await request<Resource<Page>>('POST', `/api/v1/websites/${websiteId}/pages`, payload)).data,
  update: async (id: number, payload: PagePayload) =>
    (await request<Resource<Page>>('PUT', `/api/v1/pages/${id}`, payload)).data,
  remove: (id: number) => request<void>('DELETE', `/api/v1/pages/${id}`),
}
