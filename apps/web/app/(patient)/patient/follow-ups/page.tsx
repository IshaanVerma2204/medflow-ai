'use client'

import React from 'react'
import { usePatientData } from '@/context/PatientDataContext'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Calendar, Clock } from 'lucide-react'

export default function FollowUpsPage() {
  const { followUps, isLoading } = usePatientData()

  const pending = followUps.filter(f => f.status === 'pending')
  const completed = followUps.filter(f => f.status === 'completed')

  return (
    <div className="space-y-6 max-w-5xl animate-page-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Follow-ups</h2>
        <p className="text-muted-foreground">Action items and scheduled appointments.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2">
          {/* Pending */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
              Pending Actions
              <span className="ml-1 rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-xs font-medium">{pending.length}</span>
            </h3>
            <div className="space-y-3">
              {pending.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No pending follow-ups. 🎉</p>
              ) : (
                pending.map((task, i) => (
                  <Card key={task.id} className="border-amber-200/60 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 card-hover animate-card-in" style={{ animationDelay: `${i * 60}ms` }}>
                    <CardContent className="p-4 flex flex-col gap-2">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-medium text-sm">{task.task}</p>
                        <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                        {task.task_type && <><span className="mx-1">·</span>{task.task_type}</>}
                      </div>
                      <Button size="sm" variant="outline" className="w-full mt-1 text-xs hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Mark Complete
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Completed */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              Completed
              <span className="ml-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-xs font-medium">{completed.length}</span>
            </h3>
            <div className="space-y-3 opacity-70">
              {completed.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No completed follow-ups yet.</p>
              ) : (
                completed.map((task, i) => (
                  <Card key={task.id} className="animate-card-in" style={{ animationDelay: `${i * 60}ms` }}>
                    <CardContent className="p-4">
                      <p className="font-medium text-sm line-through text-muted-foreground">{task.task}</p>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mt-1.5">
                        <CheckCircle2 className="h-3 w-3" /> Completed
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
