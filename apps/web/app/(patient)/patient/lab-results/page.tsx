'use client'

import React from 'react'
import { usePatient } from '@/hooks/usePatient'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LabTrend } from '@/components/medical/LabTrend'

export default function LabResultsPage() {
  const { user } = useAuth()
  const { labResults, isLoading } = usePatient(user?.id)

  if (isLoading) return <div>Loading...</div>

  // Group by test name for trend charts
  const groupedLabs: Record<string, typeof labResults> = {}
  labResults.forEach(lab => {
    if (!groupedLabs[lab.test_name]) groupedLabs[lab.test_name] = []
    groupedLabs[lab.test_name].push(lab)
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Lab Results</h2>
        <p className="text-muted-foreground">View your laboratory test history and trends.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {Object.entries(groupedLabs).map(([testName, results]) => (
          <Card key={testName}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">{testName}</CardTitle>
              {results[0]?.is_abnormal && (
                <Badge variant="destructive">Abnormal</Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-4">
                {results[0]?.value} <span className="text-sm font-normal text-muted-foreground">{results[0]?.unit}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Ref: {results[0]?.reference_range} | Last updated: {new Date(results[0]?.test_date || '').toLocaleDateString()}
              </p>
              
              {results.length > 1 && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="text-sm font-medium mb-2">Trend</h4>
                  <div className="h-48">
                    <LabTrend testName={testName} results={results} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
