'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, ShieldAlert, Activity, ArrowRight } from 'lucide-react'

export default function ClinicianDashboard() {
  // Dummy clinician stats
  const stats = {
    totalPatients: 42,
    pendingReviews: 12,
    highSeverityFlags: 3,
    recentActivity: 8
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Clinician Dashboard</h2>
        <p className="text-muted-foreground">Overview of your patients and pending AI reviews.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pendingReviews}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Flags</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.highSeverityFlags}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>AI Review Center</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Items requiring your clinical judgment</p>
            </div>
            <Link href="/clinician/review-center">
              <Button variant="outline" size="sm">Go to Center <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={i === 1 ? 'destructive' : 'secondary'}>
                        {i === 1 ? 'High' : 'Medium'}
                      </Badge>
                      <span className="text-sm font-medium">Medication Discrepancy</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Patient: John Doe (DOB: 1980)</p>
                  </div>
                  <Button variant="ghost" size="sm">Review</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Patients</CardTitle>
            <Link href="/clinician/patients">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Alice Smith', 'Bob Jones', 'Charlie Brown'].map((name, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                      {name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">Updated 2h ago</p>
                    </div>
                  </div>
                  <Link href={`/clinician/patients/P00${i}`}>
                    <Button variant="outline" size="sm">Profile</Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
