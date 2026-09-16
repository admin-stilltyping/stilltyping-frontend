import apiClient from './client'

export interface DashboardConfig {
  widgets: string[]
}

export const dashboardConfigApi = {
  get: async (slug: string): Promise<DashboardConfig> => {
    const { data } = await apiClient.get<DashboardConfig>(`/admin/${slug}/dashboard-config`)
    return data
  },

  update: async (slug: string, widgets: string[]): Promise<DashboardConfig> => {
    const { data } = await apiClient.patch<DashboardConfig>(`/admin/${slug}/dashboard-config`, { widgets })
    return data
  },
}
