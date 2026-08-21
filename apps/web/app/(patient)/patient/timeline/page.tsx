'use client'

import React from 'react'
import { usePatientData } from '@/context/PatientDataContext'
import { TimelineView } from '@/components/timeline/TimelineView'
import { Activity } from 'lucide-react'

export default function TimelinePage() {
  const { timeline, isLoading } = usePatientData()

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-page-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Patient Timeline</h2>
        <p className="text-muted-foreground">A chronological view of your medical history.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      ) : timeline.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-16 border rounded-xl bg-muted/20">
          <Activity className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">No timeline events yet</p>
          <p className="text-sm text-muted-foreground mt-1">Upload your medical documents to get started.</p>
        </div>
      ) : (
        <TimelineView events={timeline} />
      )}
    </div>
  )
}
