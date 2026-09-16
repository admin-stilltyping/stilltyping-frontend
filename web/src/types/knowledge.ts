export type KnowledgeStatus = 'draft' | 'published' | 'archived'

export interface KnowledgeArticle {
  id: string
  title: string
  content: string
  source: string | null
  keywords: string[]
  status: KnowledgeStatus
}

export interface CreateArticlePayload {
  title: string
  content: string
  source?: string
  keywords?: string[]
  status?: KnowledgeStatus
}

export interface UpdateArticlePayload {
  title?: string
  content?: string
  keywords?: string[]
  status?: KnowledgeStatus
}

export interface ListArticlesParams {
  limit?: number
}
