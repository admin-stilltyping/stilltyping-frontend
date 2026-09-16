import { useQuery } from '@tanstack/react-query'
import { aiUsageApi, type AiUsageParams } from '@/api/aiUsage'

export function useAiUsage(slug: string, range: AiUsageParams = {}) {
  return useQuery({
    queryKey: ['ai-usage', slug, range.start, range.end],
    queryFn: () => aiUsageApi.get(slug, range),
    enabled: !!slug,
  })
}
