import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BookOpen, Building2, Inbox, ShieldCheck, LayoutList, Clock, LogOut, Bot, UserCheck, Gauge, Timer } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/store/authStore'

const nav = [
  { to: '/businesses',         label: 'Businesses',         icon: Building2 },
  { to: '/businesses/pending', label: 'Pending Businesses', icon: UserCheck },
  { to: '/requests',   label: 'Feature Requests', icon: Inbox },
  { to: '/plans',      label: 'Plan Defaults',    icon: LayoutList },
  { to: '/ai-usage',   label: 'AI Usage',         icon: Gauge },
  { to: '/request-timing', label: 'Request Timing', icon: Timer },
  { to: '/audit',      label: 'Audit Log',        icon: Clock },
  { to: '/playbook',   label: 'AI Playbook',      icon: BookOpen },
  { to: '/chat',       label: 'Platform AI',      icon: Bot },
]

export function SuperAdminLayout() {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const handleLogout = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      {/* Sidebar */}
      <aside className="flex h-screen w-56 flex-col border-r border-gray-800 bg-gray-900">
        <div className="flex h-16 items-center gap-2 border-b border-gray-800 px-4">
          <ShieldCheck className="h-5 w-5 text-violet-400" />
          <div>
            <p className="text-sm font-bold text-white">Super Admin</p>
            <p className="text-xs text-gray-500">Platform Control</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-violet-900 text-violet-200'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-800 px-4 py-3 space-y-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-3 w-3" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-hidden bg-gray-950">
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
