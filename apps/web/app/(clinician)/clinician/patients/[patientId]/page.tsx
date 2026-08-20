'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TimelineView } from '@/components/timeline/TimelineView'
import { FlagCard } from '@/components/ai/FlagCard'
import { usePatient } from '@/hooks/usePatient'
import { AIFlag } from '@/types'

export default function PatientProfileDetail() {
  const params = useParams()
  const patientId = params.patientId as string
  const { profile, timeline, flags, isLoading } = usePatient(patientId)

  if (isLoading) return <div>Loading patient data...</div>

  const handleApprove = async (id: string, notes: string) => {
    // apiService.ai.approveFlag(id, notes)
    console.log('Approve', id, notes)
  }

  const handleReject = async (id: string, notes: string) => {
    // apiService.ai.rejectFlag(id, notes)
    console.log('Reject', id, notes)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">Patient Profile</h2>
            <Badge variant="outline">ID: {patientId}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">Comprehensive view of medical history and AI insights.</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="flags">
            AI Flags 
            {flags.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5">{flags.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Demographics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">DOB:</span> <span>{profile?.date_of_birth || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Gender:</span> <span>{profile?.gender || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Blood Type:</span> <span>{profile?.blood_type || 'N/A'}</span></div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>AI Health Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{profile?.health_summary || 'No summary available.'}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Medical History</CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length > 0 ? (
                <TimelineView events={timeline} />
              ) : (
                <p className="text-muted-foreground italic">No timeline events recorded.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flags">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Pending AI Reviews</h3>
            {flags.length === 0 ? (
              <p className="text-muted-foreground italic">No pending flags for this patient.</p>
            ) : (
              flags.map(flag => (
                <FlagCard 
                  key={flag.id} 
                  flag={flag} 
                  onApprove={(notes) => handleApprove(flag.id, notes)}
                  onReject={(notes) => handleReject(flag.id, notes)}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
