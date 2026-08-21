'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { useAuth } from '@/hooks/useAuth'

interface DashboardLayoutProps {
  children: React.ReactNode
  role: 'patient' | 'clinician' | 'admin'
  title?: string
}

export function DashboardLayout({ children, role, title }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const getTitle = () => {
    if (title) return title
    const parts = pathname.split('/')
    const last = parts[parts.length - 1]
    return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        role={role}
        currentPath={pathname}
        onLogout={logout}
        user={user ? { full_name: user.full_name, role: user.role } : { full_name: 'Loading...', role }}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={getTitle()} />
        <main className="flex-1 overflow-auto p-6 animate-page-in">
          {children}
        </main>
      </div>
    </div>
  )
}
