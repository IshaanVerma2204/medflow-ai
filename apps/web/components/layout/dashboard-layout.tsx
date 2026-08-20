'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { removeToken } from '@/lib/auth'

interface DashboardLayoutProps {
  children: React.ReactNode
  role: 'patient' | 'clinician' | 'admin'
  title?: string
}

export function DashboardLayout({ children, role, title }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    removeToken()
    router.push('/login')
  }

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
        onLogout={handleLogout}
        user={{ full_name: 'Test User', role }}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={getTitle()} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
