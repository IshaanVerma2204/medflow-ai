'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuth } from '@/hooks/useAuth'
import { PatientDataProvider } from '@/context/PatientDataContext'

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login')
      } else if (user.role !== 'patient') {
        router.push(`/${user.role}/dashboard`)
      }
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading your health data...</p>
        </div>
      </div>
    )
  }

  return (
    <PatientDataProvider patientId={user.patient_profile_id}>
      <DashboardLayout role="patient">
        {children}
      </DashboardLayout>
    </PatientDataProvider>
  )
}
