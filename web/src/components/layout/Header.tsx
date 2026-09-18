import { useRef } from 'react'
import { LogOut, Menu, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useBusinessSession } from '@/components/auth/BusinessSession'
import { Sidebar } from './Sidebar'

export function Header({ title }: { title: string }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const { business, username } = useBusinessSession()
  const navigation = useRef<HTMLDialogElement>(null)
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 sm:px-6">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-lg focus:bg-blue-600 focus:p-3 focus:text-white">Skip to content</a>
      <div className="flex min-w-0 items-center gap-2">
        <button
          aria-label="Open navigation"
          onClick={() => navigation.current?.showModal()}
          className="rounded p-1.5 text-slate-600 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="truncate text-base font-semibold text-gray-900 sm:text-lg">{title}</h1>
      </div>
      <dialog
        ref={navigation}
        aria-label="Portal navigation"
        className="m-0 h-dvh max-h-none border-0 bg-white p-0 backdrop:bg-slate-950/45"
      >
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
          <span className="text-sm font-medium">Navigation</span>
          <button
            aria-label="Close navigation"
            onClick={() => navigation.current?.close()}
            className="rounded p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div
          className="[&_aside]:h-[calc(100dvh-3.5rem)]"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('a')) navigation.current?.close()
          }}
        >
          <Sidebar />
        </div>
      </dialog>
      <div className="flex min-w-0 items-center gap-3">
        <span className="hidden truncate text-sm text-gray-600 sm:inline">{business.name}</span>
        <button
          title={`Signed in as ${username}`}
          onClick={() => {
            clearAuth()
            qc.clear()
            navigate('/login', { replace: true })
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:text-red-600"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>
    </header>
  )
}
