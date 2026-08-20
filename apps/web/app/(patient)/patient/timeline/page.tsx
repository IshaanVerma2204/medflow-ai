'use client'

import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePatient } from '@/hooks/usePatient'
import { TimelineView } from '@/components/timeline/TimelineView'

export default function TimelinePage() {
  const { user } = useAuth()
  const { timeline, isLoading } = usePatient(user?.id)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Patient Timeline</h2>
        <p className="text-muted-foreground">A chronological view of your medical history.</p>
      </div>

      {isLoading ? (
        <div>Loading timeline...</div>
      ) : timeline.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">No timeline events yet. Upload your medical documents to get started.</p>
        </div>
      ) : (
        <TimelineView events={timeline} />
      )}
    </div>
  )
}
