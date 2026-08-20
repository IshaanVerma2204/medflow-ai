'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Activity, FileText, Pill, FlaskConical, Calendar,
  MessageSquare, Users, ShieldAlert, ListChecks, LogOut, HeartPulse
} from 'lucide-react'

interface SidebarProps {
  role: 'patient' | 'clinician' | 'admin'
  currentPath: string
  onNavigate?: () => void
  user?: { full_name: string; role: string }
  onLogout?: () => void
}

const patientLinks = [
  { href: '/patient/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/patient/timeline', label: 'Timeline', icon: Activity },
  { href: '/patient/documents', label: 'Documents', icon: FileText },
  { href: '/patient/medications', label: 'Medications', icon: Pill },
  { href: '/patient/lab-results', label: 'Lab Results', icon: FlaskConical },
  { href: '/patient/follow-ups', label: 'Follow-ups', icon: Calendar },
  { href: '/patient/ai-assistant', label: 'AI Assistant', icon: MessageSquare },
]

const clinicianLinks = [
  { href: '/clinician/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clinician/patients', label: 'Patient List', icon: Users },
  { href: '/clinician/review-center', label: 'AI Review Center', icon: ShieldAlert },
  { href: '/clinician/audit-trail', label: 'Audit Trail', icon: ListChecks },
]

export function Sidebar({ role, currentPath, user, onLogout }: SidebarProps) {
  const links = role === 'clinician' ? clinicianLinks : patientLinks

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card text-card-foreground">
      <div className="flex h-14 items-center border-b px-4">
        <HeartPulse className="mr-2 h-6 w-6 text-primary" />
        <span className="font-semibold tracking-tight">MedFlow AI</span>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-2">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = currentPath.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                  isActive ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="border-t p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user?.full_name || 'User'}</span>
            <span className="text-xs text-muted-foreground capitalize">{user?.role || role}</span>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  )
}
