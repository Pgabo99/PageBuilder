import type { Website, WebsitePayload } from '@/types/content'

import { request } from './client'

interface Resource<T> {
  data: T
}

export const websitesApi = {
  list: async () => (await request<Resource<Website[]>>('GET', '/api/v1/websites')).data,
  get: async (id: number) =>
    (await request<Resource<Website>>('GET', `/api/v1/websites/${id}`)).data,
  create: async (payload: WebsitePayload) =>
    (await request<Resource<Website>>('POST', '/api/v1/websites', payload)).data,
  update: async (id: number, payload: WebsitePayload) =>
    (await request<Resource<Website>>('PUT', `/api/v1/websites/${id}`, payload)).data,
  publish: async (id: number) =>
    (await request<Resource<Website>>('POST', `/api/v1/websites/${id}/publish`)).data,
  remove: (id: number) => request<void>('DELETE', `/api/v1/websites/${id}`),
}
