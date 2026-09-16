import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { instructionsApi } from '@/api/instructions'

export function useInstructions(slug: string) {
  return useQuery({
    queryKey: ['instructions', slug],
    queryFn: () => instructionsApi.get(slug),
    enabled: !!slug,
  })
}

export function useSetInstructions(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (instructions: string) => instructionsApi.set(slug, instructions),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instructions', slug] }),
  })
}
