'use client'

import React from 'react'
import Link from 'next/link'
import { usePatientData } from '@/context/PatientDataContext'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pill, Activity, Calendar, ShieldAlert, TrendingUp } from 'lucide-react'

export default function PatientDashboard() {
  const { user } = useAuth()
  const { profile, medications, diagnoses, followUps, flags, isLoading } = usePatientData()

  if (isLoading) {
    return (
      <div className="space-y-6 animate-page-in">
        {/* Skeleton header */}
        <div className="space-y-2">
          <div className="h-8 w-64 rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-48 rounded-lg bg-muted animate-pulse" />
        </div>
        {/* Skeleton cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4 h-48 rounded-xl bg-muted animate-pulse" />
          <div className="col-span-3 h-48 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    )
  }

  const pendingFollowUps = followUps.filter(f => f.status === 'pending')

  const statCards = [
    {
      title: 'Current Medications',
      value: medications.length,
      icon: Pill,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Active Diagnoses',
      value: diagnoses.length,
      icon: Activity,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
    },
    {
      title: 'Pending Follow-ups',
      value: pendingFollowUps.length,
      icon: Calendar,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      title: 'Recent AI Flags',
      value: flags.length,
      icon: ShieldAlert,
      color: flags.length > 0 ? 'text-destructive' : 'text-emerald-500',
      bg: flags.length > 0 ? 'bg-destructive/10' : 'bg-emerald-500/10',
    },
  ]

  return (
    <div className="space-y-6 animate-page-in">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome back, <span className="text-primary">{user?.full_name?.split(' ')[0]}</span> 👋
        </h2>
        <p className="text-muted-foreground">Here is an overview of your health information.</p>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.title}
              className={`card-hover border-0 shadow-sm animate-card-in stagger-${i + 1} overflow-hidden`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`rounded-lg p-2 ${stat.bg}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  From your records
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Health Summary */}
        <Card className="col-span-4 border-0 shadow-sm animate-card-in stagger-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Health Summary
            </CardTitle>
            <CardDescription>AI-generated summary based on your records</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {profile?.health_summary || 'No health summary available yet. Upload your medical documents and the AI will generate a personalized summary.'}
            </p>
            <Link href="/patient/timeline">
              <Button variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground transition-colors duration-200">
                View Full Timeline →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card className="col-span-3 border-0 shadow-sm animate-card-in stagger-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Pending Tasks
            </CardTitle>
            <CardDescription>Follow-ups and action items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {followUps.slice(0, 4).map((task, i) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 bg-muted/30 hover:bg-muted/60 transition-colors duration-150"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium truncate">{task.task}</span>
                    <span className="text-xs text-muted-foreground">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date set'}
                    </span>
                  </div>
                  <Badge
                    variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
                    className="ml-2 shrink-0 text-[10px]"
                  >
                    {task.priority}
                  </Badge>
                </div>
              ))}
              {followUps.length === 0 && (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Calendar className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No pending tasks</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
