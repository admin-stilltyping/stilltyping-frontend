import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SuperAdminLoginPage } from '@/pages/SuperAdminLoginPage'
import { RequireSuperAdmin } from '@/components/RequireSuperAdmin'
import { SuperAdminLayout } from '@/pages/SuperAdminLayout'
import { SuperAdminBusinessList } from '@/pages/SuperAdminBusinessList'
import { PendingBusinessList } from '@/pages/PendingBusinessList'
import { SuperAdminBusinessDetail } from '@/pages/SuperAdminBusinessDetail'
import { SuperAdminFeatureRequests } from '@/pages/SuperAdminFeatureRequests'
import { SuperAdminPlanDefaults } from '@/pages/SuperAdminPlanDefaults'
import { SuperAdminAiUsage } from '@/pages/SuperAdminAiUsage'
import { SuperAdminRequestTiming } from '@/pages/SuperAdminRequestTiming'
import { SuperAdminAuditLog } from '@/pages/SuperAdminAuditLog'
import { SuperAdminPlaybook } from '@/pages/SuperAdminPlaybook'
import { SuperAdminChat } from '@/pages/SuperAdminChat'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="login" element={<SuperAdminLoginPage />} />

          {/* Super-admin — dark themed platform console */}
          <Route element={<RequireSuperAdmin><SuperAdminLayout /></RequireSuperAdmin>}>
            <Route index element={<Navigate to="businesses" replace />} />
            <Route path="businesses"         element={<SuperAdminBusinessList />} />
            <Route path="businesses/pending" element={<PendingBusinessList />} />
            <Route path="businesses/:slug"   element={<SuperAdminBusinessDetail />} />
            <Route path="requests"         element={<SuperAdminFeatureRequests />} />
            <Route path="plans"            element={<SuperAdminPlanDefaults />} />
            <Route path="ai-usage"         element={<SuperAdminAiUsage />} />
            <Route path="request-timing"   element={<SuperAdminRequestTiming />} />
            <Route path="audit"            element={<SuperAdminAuditLog />} />
            <Route path="playbook"         element={<SuperAdminPlaybook />} />
            <Route path="chat"             element={<SuperAdminChat />} />
          </Route>

          {/* Unknown paths fall back to the businesses list */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
