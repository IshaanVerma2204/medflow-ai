'use client'

import * as React from 'react'
import { Bell, Sun, Moon, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'

interface TopbarProps {
  title: string
  notificationCount?: number
}

export function Topbar({ title, notificationCount = 0 }: TopbarProps) {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor

  return (
    <header className="glass-topbar flex h-14 items-center justify-between border-b px-6 sticky top-0 z-10">
      <h1 className="text-lg font-semibold tracking-tight animate-page-in">{title}</h1>
      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={cycleTheme}
          title={`Theme: ${theme}. Click to cycle.`}
          className="relative hover:bg-accent transition-all duration-200 hover:scale-105"
        >
          <ThemeIcon className="h-4 w-4 transition-all duration-300" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative hover:bg-accent transition-all duration-200 hover:scale-105">
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute right-2 top-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
            </span>
          )}
        </Button>
      </div>
    </header>
  )
}
