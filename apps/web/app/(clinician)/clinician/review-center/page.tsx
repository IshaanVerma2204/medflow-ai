'use client'

import React, { useState, useEffect } from 'react'
import { FlagCard } from '@/components/ai/FlagCard'
import { AIFlag } from '@/types'
import { toast } from 'sonner'
import { apiService } from '@/lib/api'

export default function ReviewCenterPage() {
  const [flags, setFlags] = useState<AIFlag[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // In real app: fetch all pending flags across patients
    setTimeout(() => {
      setFlags([
        {
          id: 'flag_1',
          flag_type: 'medication_discrepancy',
          title: 'Potential Medication Discrepancy',
          description: 'Patient reported taking Lisinopril 20mg, but discharge summary lists 10mg.',
          severity: 'high',
          confidence: 85,
          status: 'pending',
          agent_name: 'MedicationReconciliationAgent',
          created_at: new Date().toISOString(),
          evidence: [
            { source_document: 'Discharge_Summary_2023.pdf', page: 2, text: 'Discharge Meds: Lisinopril 10mg daily' },
            { source_document: 'Patient_Intake_Form.pdf', text: 'Current Meds: Lisinopril 20mg' }
          ]
        },
        {
          id: 'flag_2',
          flag_type: 'missing_follow_up',
          title: 'Missing Cardiology Follow-up',
          description: 'Discharge summary recommends cardiology follow-up in 2 weeks, but none is scheduled.',
          severity: 'medium',
          confidence: 92,
          status: 'pending',
          agent_name: 'PlanExtractorAgent',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          evidence: [
            { source_document: 'Discharge_Summary_2023.pdf', page: 4, text: 'Follow up with Cardiology in 2 weeks.' }
          ]
        }
      ])
      setIsLoading(false)
    }, 800)
  }, [])

  const handleApprove = async (id: string, notes: string) => {
    // await apiService.ai.approveFlag(id, notes)
    setFlags(prev => prev.filter(f => f.id !== id))
    toast.success('Flag approved and applied to patient record.')
  }

  const handleReject = async (id: string, notes: string) => {
    // await apiService.ai.rejectFlag(id, notes)
    setFlags(prev => prev.filter(f => f.id !== id))
    toast.success('Flag rejected and dismissed.')
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">AI Review Center</h2>
        <p className="text-muted-foreground">Review and approve insights extracted by MedFlow AI agents.</p>
      </div>

      {isLoading ? (
        <div>Loading pending reviews...</div>
      ) : flags.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">No pending flags to review. Great job!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {flags.map(flag => (
            <FlagCard 
              key={flag.id} 
              flag={flag} 
              onApprove={(notes) => handleApprove(flag.id, notes)}
              onReject={(notes) => handleReject(flag.id, notes)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
