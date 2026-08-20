'use client'

import React from 'react'
import Link from 'next/link'
import { usePatient } from '@/hooks/usePatient'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pill, Activity, Calendar, ShieldAlert } from 'lucide-react'

export default function PatientDashboard() {
  const { user } = useAuth()
  // Passing user?.id temporarily as patientId; ideally API infers this or we fetch the profile id
  const { profile, medications, diagnoses, followUps, flags, isLoading } = usePatient(user?.id)

  if (isLoading) {
    return <div>Loading dashboard...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome, {user?.full_name}</h2>
        <p className="text-muted-foreground">Here is an overview of your health information.</p>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Medications</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{medications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Diagnoses</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{diagnoses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Follow-ups</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{followUps.filter(f => f.status === 'pending').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent AI Flags</CardTitle>
            <ShieldAlert className={`h-4 w-4 ${flags.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flags.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Health Summary</CardTitle>
            <CardDescription>AI-generated summary based on your records</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {profile?.health_summary || "No health summary available. Upload documents to generate one."}
            </p>
            <Link href="/patient/timeline">
              <Button variant="outline">View Full Timeline</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Pending Tasks</CardTitle>
            <CardDescription>Follow-ups and action items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {followUps.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">{task.task}</span>
                    <span className="text-xs text-muted-foreground">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}</span>
                  </div>
                  <Badge variant={task.priority === 'high' ? 'destructive' : 'default'}>{task.priority}</Badge>
                </div>
              ))}
              {followUps.length === 0 && <p className="text-sm text-muted-foreground">No pending tasks.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
