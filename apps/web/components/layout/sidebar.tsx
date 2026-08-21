'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Activity, FileText, Pill, FlaskConical, Calendar,
  MessageSquare, Users, ShieldAlert, ListChecks, LogOut, HeartPulse, User, ScanFace
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
  { href: '/patient/body-map', label: 'Body Map', icon: User },
  { href: '/patient/ambient-scan', label: 'Vitals Scan', icon: ScanFace },
  { href: '/patient/ai-board', label: 'Medical Board', icon: Users },
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
    <div className="flex h-full w-64 flex-col border-r bg-card text-card-foreground transition-colors duration-300">
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4 gap-2">
        <HeartPulse className="h-6 w-6 text-primary animate-heartbeat shrink-0" />
        <span className="font-bold tracking-tight text-foreground">MedFlow AI</span>
      </div>

      {/* Nav links */}
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-0.5 px-2">
          {links.map((link, i) => {
            const Icon = link.icon
            const isActive = currentPath.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{ animationDelay: `${i * 40}ms` }}
                className={cn(
                  'animate-card-in',
                  'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                  'transition-all duration-200 group overflow-hidden',
                  isActive
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                {/* Active left bar */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-primary" />
                )}
                <Icon className={cn(
                  'h-4 w-4 shrink-0 transition-transform duration-200',
                  isActive ? 'text-primary' : 'group-hover:scale-110'
                )} />
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                  {link.label}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User profile + Logout */}
      <div className="border-t p-4 space-y-3">
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-semibold text-sm ring-2 ring-primary/20 transition-all duration-200 hover:ring-primary/40">
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate">{user?.full_name || 'User'}</span>
            <span className="text-xs text-muted-foreground capitalize">{user?.role || role}</span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 group"
        >
          <LogOut className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          Logout
        </button>
      </div>
    </div>
  )
}
