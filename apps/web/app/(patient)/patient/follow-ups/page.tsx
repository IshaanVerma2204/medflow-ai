'use client'

import React from 'react'
import { usePatient } from '@/hooks/usePatient'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Calendar } from 'lucide-react'

export default function FollowUpsPage() {
  const { user } = useAuth()
  const { followUps, isLoading } = usePatient(user?.id)

  if (isLoading) return <div>Loading...</div>

  const pending = followUps.filter(f => f.status === 'pending')
  const completed = followUps.filter(f => f.status === 'completed')

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Follow-ups</h2>
        <p className="text-muted-foreground">Action items and scheduled appointments.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h3 className="text-xl font-semibold mb-4 text-amber-600">Pending Actions</h3>
          <div className="space-y-4">
            {pending.length === 0 ? (
              <p className="text-muted-foreground italic">No pending follow-ups.</p>
            ) : (
              pending.map(task => (
                <Card key={task.id} className="border-amber-200 bg-amber-50/30 dark:bg-amber-900/10">
                  <CardContent className="p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm">{task.task}</p>
                      <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'}>
                        {task.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                      <span className="mx-2">•</span>
                      Type: {task.task_type}
                    </div>
                    <Button size="sm" variant="outline" className="w-full mt-2">
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Complete
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4 text-green-600">Completed</h3>
          <div className="space-y-4 opacity-75">
            {completed.length === 0 ? (
              <p className="text-muted-foreground italic">No completed follow-ups.</p>
            ) : (
              completed.map(task => (
                <Card key={task.id}>
                  <CardContent className="p-4">
                    <p className="font-medium text-sm line-through text-muted-foreground">{task.task}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <CheckCircle2 className="h-3 w-3 text-green-500" /> Completed
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
