import axios from 'axios'
import apiClient from '@/api/client'
import type { DashboardResponse, Period, UseCase, WidgetType } from './types'

export const dashboardApi = {
  get: (days: Period) =>
    apiClient
      .get<DashboardResponse>('/admin/dashboard', { params: { days } })
      .then((response) => response.data),
  generate: (use_case: UseCase, expected_revision: number, days: Period) =>
    apiClient
      .post<DashboardResponse>(
        '/admin/dashboard/generate',
        { use_case, expected_revision },
        { params: { days } },
      )
      .then((response) => response.data),
  save: (widget_ids: WidgetType[], expected_revision: number, days: Period) =>
    apiClient
      .patch<DashboardResponse>(
        '/admin/dashboard/config',
        { widget_ids, expected_revision },
        { params: { days } },
      )
      .then((response) => response.data),
}

export function dashboardError(error: unknown): string {
  return axios.isAxiosError(error)
    ? (error.response?.data?.error?.message ??
        'The dashboard could not be loaded. Check the connection and try again.')
    : 'The dashboard could not be loaded. Please try again.'
}
