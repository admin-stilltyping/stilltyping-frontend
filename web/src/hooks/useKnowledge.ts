import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { knowledgeApi } from '@/api/knowledge'
import type {
  CreateArticlePayload,
  UpdateArticlePayload,
  ListArticlesParams,
} from '@/types/knowledge'

export function useArticles(slug: string, params?: ListArticlesParams) {
  return useQuery({
    queryKey: ['knowledge', slug, params],
    queryFn: () => knowledgeApi.list(slug, params),
    enabled: !!slug,
  })
}

export function useArticle(slug: string, articleId: string) {
  return useQuery({
    queryKey: ['knowledge', slug, articleId],
    queryFn: () => knowledgeApi.get(slug, articleId),
    enabled: !!slug && !!articleId,
  })
}

export function useCreateArticle(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateArticlePayload) => knowledgeApi.create(slug, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge', slug] }),
  })
}

export function useUpdateArticle(slug: string, articleId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateArticlePayload) => knowledgeApi.update(slug, articleId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge', slug] }),
  })
}

export function useArchiveArticle(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (articleId: string) => knowledgeApi.archive(slug, articleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge', slug] }),
  })
}
