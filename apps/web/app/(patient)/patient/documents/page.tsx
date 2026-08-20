'use client'

import React, { useState } from 'react'
import { DocumentUploader } from '@/components/documents/DocumentUploader'
import { ActivityPanel } from '@/components/ai-activity-panel/ActivityPanel'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Trash2, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { apiService } from '@/lib/api'

export default function DocumentsPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [steps, setSteps] = useState<any[]>([])
  const { user } = useAuth()
  
  // Dummy data for documents list
  const documents = [
    { id: '1', filename: 'Discharge_Summary_2023.pdf', status: 'processed', created_at: '2023-10-12', page_count: 4 },
    { id: '2', filename: 'Lab_Results_Aug.pdf', status: 'processed', created_at: '2023-08-05', page_count: 1 }
  ]

  const handleUploadComplete = async (file: File) => {
    toast.success(`${file.name} uploaded successfully.`)
  }

  const handleAnalyze = async (id: string) => {
    setIsProcessing(true)
    setSteps([
      { id: 1, name: 'Document received', status: 'done' },
      { id: 2, name: 'Extracting text (Page 1-4)', status: 'running' }
    ])
    
    // Simulate AI processing
    setTimeout(() => {
      setSteps(prev => [
        ...prev.map(s => s.id === 2 ? { ...s, status: 'done' } : s),
        { id: 3, name: 'Identifying medications', status: 'running' }
      ])
    }, 2000)

    setTimeout(() => {
      setSteps(prev => [
        ...prev.map(s => s.id === 3 ? { ...s, status: 'done' } : s),
        { id: 4, name: 'Detecting diagnoses', status: 'done' },
        { id: 5, name: 'Medication discrepancy detected', status: 'error' },
        { id: 6, name: 'Awaiting clinician review', status: 'pending' }
      ])
      setIsProcessing(false)
      toast.success('Document analysis complete. Flags generated.')
    }, 4000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
        <p className="text-muted-foreground">Upload and manage your medical records.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <DocumentUploader onUploadComplete={handleUploadComplete} />
          
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">{doc.filename}</p>
                        <p className="text-xs text-muted-foreground">{doc.created_at} • {doc.page_count} pages</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{doc.status}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => handleAnalyze(doc.id)}>
                        <Zap className="h-4 w-4 mr-1" /> Analyze
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          {steps.length > 0 && (
            <ActivityPanel steps={steps} isLoading={isProcessing} />
          )}
        </div>
      </div>
    </div>
  )
}
