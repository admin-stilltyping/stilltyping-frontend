import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dashboardConfigApi } from '@/api/dashboardConfig'

export function useDashboardConfig(slug: string) {
  return useQuery({
    queryKey: ['dashboard-config', slug],
    queryFn: () => dashboardConfigApi.get(slug),
    enabled: !!slug,
  })
}

export function useUpdateDashboardConfig(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (widgets: string[]) => dashboardConfigApi.update(slug, widgets),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboard-config', slug] }),
  })
}
