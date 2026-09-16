import type { ModuleSelection, ModuleSettings } from '@nivaso/types'
import { superAdminClient } from '@/api/superAdmin'

export const businessModulesApi = {
  get: (slug: string) => superAdminClient
    .get<ModuleSettings>(`/super-admin/businesses/${slug}/modules`).then((r) => r.data),
  save: (slug: string, selection: ModuleSelection, expectedRevision: number) => superAdminClient
    .put<ModuleSettings>(`/super-admin/businesses/${slug}/modules`, {
      selection, expected_revision: expectedRevision,
    }).then((r) => r.data),
}
