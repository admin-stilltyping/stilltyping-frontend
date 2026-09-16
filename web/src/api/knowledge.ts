import apiClient from './client'
import type {
  KnowledgeArticle,
  CreateArticlePayload,
  UpdateArticlePayload,
  ListArticlesParams,
} from '@/types/knowledge'

export const knowledgeApi = {
  list: (slug: string, params?: ListArticlesParams) =>
    apiClient.get<KnowledgeArticle[]>(`/admin/${slug}/knowledge`, { params }).then((r) => r.data),

  get: (slug: string, articleId: string) =>
    apiClient.get<KnowledgeArticle>(`/admin/${slug}/knowledge/${articleId}`).then((r) => r.data),

  create: (slug: string, payload: CreateArticlePayload) =>
    apiClient
      .post<KnowledgeArticle>(`/admin/${slug}/knowledge`, payload)
      .then((r) => r.data),

  update: (slug: string, articleId: string, payload: UpdateArticlePayload) =>
    apiClient
      .patch<KnowledgeArticle>(`/admin/${slug}/knowledge/${articleId}`, payload)
      .then((r) => r.data),

  archive: (slug: string, articleId: string) =>
    apiClient.delete(`/admin/${slug}/knowledge/${articleId}`),
}
