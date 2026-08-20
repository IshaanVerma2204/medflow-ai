'use client'

import React, { useEffect, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { CheckCircle2, CircleDashed, AlertCircle, Loader2 } from 'lucide-react'

export interface ActivityStep {
  id: number
  name: string
  status: 'pending' | 'running' | 'done' | 'error'
}

interface ActivityPanelProps {
  steps: ActivityStep[]
  isLoading?: boolean
}

export function ActivityPanel({ steps, isLoading }: ActivityPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [steps])

  return (
    <Card className="h-full flex flex-col bg-slate-50 dark:bg-slate-900/50">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          Agent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex gap-3">
              <div className="mt-0.5 relative">
                {idx !== steps.length - 1 && (
                  <div className="absolute top-5 left-[9px] w-[2px] h-full bg-border" />
                )}
                {step.status === 'done' && <CheckCircle2 className="h-5 w-5 text-green-500 z-10 relative bg-background rounded-full" />}
                {step.status === 'running' && <Loader2 className="h-5 w-5 text-blue-500 animate-spin z-10 relative bg-background rounded-full" />}
                {step.status === 'error' && <AlertCircle className="h-5 w-5 text-destructive z-10 relative bg-background rounded-full" />}
                {step.status === 'pending' && <CircleDashed className="h-5 w-5 text-muted-foreground z-10 relative bg-background rounded-full" />}
              </div>
              <div className="pb-4">
                <p className={`text-sm font-medium ${step.status === 'pending' ? 'text-muted-foreground' : ''}`}>
                  {step.name}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </CardContent>
    </Card>
  )
}
