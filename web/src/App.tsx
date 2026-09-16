import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '@/components/layout/Layout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { SignupPage } from '@/pages/auth/SignupPage'
import { PendingApproval } from '@/pages/auth/PendingApproval'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { Flag } from '@nivaso/types'
import { ModuleRoute } from '@/features/modules/ModuleRoute'
import { LeadsPage, LeadDetail } from '@/features/crm/LeadsPage'
import { OrderDetail } from '@/features/crm/TransactionsPages'

import { BusinessProfilePage } from '@/pages/businesses/BusinessProfilePage'
import { IntegrationsPage } from '@/pages/integrations/IntegrationsPage'
import { ProductList } from '@/pages/products/ProductList'
import { ProductDetail } from '@/pages/products/ProductDetail'
import { ServiceList } from '@/pages/services/ServiceList'
import { ServiceDetail } from '@/pages/services/ServiceDetail'
import { AppointmentList } from '@/pages/appointments/AppointmentList'
import { AppointmentDetail } from '@/pages/appointments/AppointmentDetail'
import { CustomFieldsSettingsPage } from '@/features/custom-fields/CustomFieldsSettingsPage'
import { InstructionsPage } from '@/pages/settings/InstructionsPage'
import { TicketList } from '@/pages/support/TicketList'
import { TicketDetail } from '@/pages/support/TicketDetail'
import { CustomerList } from '@/pages/customers/CustomerList'
import { CustomerDetail } from '@/pages/customers/CustomerDetail'
import { KnowledgeBasePage } from '@/features/knowledge-base/KnowledgeBasePage'
import { OrderList } from '@/pages/orders/OrderList'
import { WebhookEventList } from '@/pages/webhooks/WebhookEventList'
import { AgentRunList } from '@/pages/agent-runs/AgentRunList'
import { AiUsagePage } from '@/pages/ai-usage/AiUsagePage'
import { ChatTest } from '@/pages/chat/ChatTest'
import { ChatDemo } from '@/pages/chat/ChatDemo'
import { CustomerChat } from '@/pages/chat/CustomerChat'
import { PrivacyPolicy } from '@/pages/PrivacyPolicy'

const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage').then((module) => ({ default: module.DashboardPage })))

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
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="pending-approval" element={<PendingApproval />} />

          {/* Public — no auth, no admin layout */}
          <Route path="privacy" element={<PrivacyPolicy />} />

          {/* Customer-facing chat — one URL per business slug, no admin layout */}
          <Route path="/chat/:slug" element={<CustomerChat />} />
          <Route path="/c/:slug" element={<CustomerChat />} />

          <Route element={<RequireAuth><Layout /></RequireAuth>}>
            <Route path="dashboard" element={<Suspense fallback={<p className="p-6 text-slate-500">Loading dashboard…</p>}><DashboardPage /></Suspense>} />

            <Route path="businesses/:slug" element={<BusinessProfilePage />} />
            <Route path="integrations" element={<IntegrationsPage />} />

            <Route element={<ModuleRoute flag={Flag.MODULE_PRODUCTS} label="Products" />}>
              <Route path="products" element={<ProductList />} />
              <Route path="products/:productId" element={<ProductDetail />} />
            </Route>

            <Route element={<ModuleRoute flag={Flag.MODULE_SERVICES} label="Services" />}>
              <Route path="services" element={<ServiceList />} />
              <Route path="services/:serviceId" element={<ServiceDetail />} />
            </Route>

            <Route element={<ModuleRoute flag={Flag.MODULE_APPOINTMENTS} label="Appointments" />}>
              <Route path="appointments" element={<AppointmentList />} />
              <Route path="appointments/:appointmentId" element={<AppointmentDetail />} />
            </Route>

            <Route element={<ModuleRoute flag={Flag.MODULE_CUSTOM_FIELDS} label="Custom Fields" />}>
              <Route path="settings/custom-fields" element={<CustomFieldsSettingsPage />} />
            </Route>
            <Route path="settings/instructions" element={<InstructionsPage />} />
            <Route path="request-modules" element={<Navigate to="/dashboard" replace />} />

            <Route element={<ModuleRoute flag={Flag.SUPPORT_TICKETS} label="Support Tickets" />}>
              <Route path="support" element={<TicketList />} />
              <Route path="support/:reference" element={<TicketDetail />} />
            </Route>

            <Route element={<ModuleRoute flag={Flag.MODULE_CUSTOMERS} label="Customers" />}>
              <Route path="customers" element={<CustomerList />} />
              <Route path="customers/:customerId" element={<CustomerDetail />} />
            </Route>
            <Route element={<ModuleRoute flag={Flag.MODULE_LEADS} label="Leads" />}>
              <Route path="leads" element={<LeadsPage />} />
              <Route path="leads/:leadId" element={<LeadDetail />} />
            </Route>

            <Route path="knowledge" element={<KnowledgeBasePage />} />
            <Route path="knowledge/:articleId" element={<Navigate to="/knowledge" replace />} />

            <Route element={<ModuleRoute flag={Flag.ORDERS_ENABLED} label="Orders" />}>
              <Route path="orders" element={<OrderList />} />
              <Route path="orders/:orderId" element={<OrderDetail />} />
            </Route>
            <Route path="webhooks" element={<WebhookEventList />} />
            <Route path="agent-runs" element={<AgentRunList />} />
            <Route path="ai-usage" element={<AiUsagePage />} />

            <Route path="chat" element={<ChatTest />} />
            {/* Static /chat/demo outranks the dynamic /chat/:slug below */}
            <Route path="chat/demo" element={<ChatDemo />} />
          </Route>

          {/* Keep unknown portal paths on the existing dashboard fallback. */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
