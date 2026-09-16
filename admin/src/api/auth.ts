import apiClient from './client'

export interface SuperAdminLoginResponse {
  access_token: string
  token_type: string
}

export const authApi = {
  superAdminLogin: (username: string, password: string) =>
    apiClient
      .post<SuperAdminLoginResponse>('/auth/super-admin/login', { username, password })
      .then((r) => r.data),
}
