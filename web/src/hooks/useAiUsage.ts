import { useQuery } from '@tanstack/react-query'
import { aiUsageApi, type AiUsageParams } from '@/api/aiUsage'

export function useAiUsage(slug: string, params: AiUsageParams = {}) {
  return useQuery({
    queryKey: ['ai-usage', slug, params],
    queryFn: () => aiUsageApi.get(slug, params),
    enabled: !!slug,
    staleTime: 15_000,
    refetchInterval: !params.offset ? 30_000 : false,
  })
}
