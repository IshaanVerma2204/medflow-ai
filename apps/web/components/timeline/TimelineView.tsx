'use client'

import React from 'react'
import { TimelineEvent } from '@/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Pill, Activity, FlaskConical, Calendar, FileText } from 'lucide-react'

interface TimelineViewProps {
  events: TimelineEvent[]
}

const iconMap: Record<string, React.ReactNode> = {
  medication: <Pill className="h-4 w-4 text-blue-500" />,
  diagnosis: <Activity className="h-4 w-4 text-red-500" />,
  lab: <FlaskConical className="h-4 w-4 text-purple-500" />,
  appointment: <Calendar className="h-4 w-4 text-green-500" />,
  document: <FileText className="h-4 w-4 text-gray-500" />
}

export function TimelineView({ events }: TimelineViewProps) {
  const sorted = [...events].sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())

  return (
    <div className="relative border-l-2 border-muted ml-3 space-y-8 py-4">
      {sorted.map(event => (
        <div key={event.id} className="relative pl-8">
          <div className="absolute -left-[11px] top-1 bg-background p-1 rounded-full border">
            {iconMap[event.event_type] || <FileText className="h-4 w-4 text-gray-500" />}
          </div>
          <Card>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold">{event.title}</h4>
                  <p className="text-sm text-muted-foreground">{new Date(event.event_date).toLocaleDateString()}</p>
                </div>
                {event.document_id && (
                  <Badge variant="outline" className="text-xs">Source Doc</Badge>
                )}
              </div>
              {event.description && (
                <p className="text-sm mt-2">{event.description}</p>
              )}
            </div>
          </Card>
        </div>
      ))}
    </div>
  )
}
