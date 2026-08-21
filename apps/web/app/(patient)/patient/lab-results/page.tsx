'use client'

import React from 'react'
import { usePatientData } from '@/context/PatientDataContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LabTrend } from '@/components/medical/LabTrend'
import { FlaskConical } from 'lucide-react'

export default function LabResultsPage() {
  const { labResults, isLoading } = usePatientData()

  const groupedLabs: Record<string, typeof labResults> = {}
  labResults.forEach(lab => {
    if (!groupedLabs[lab.test_name]) groupedLabs[lab.test_name] = []
    groupedLabs[lab.test_name].push(lab)
  })

  return (
    <div className="space-y-6 animate-page-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Lab Results</h2>
        <p className="text-muted-foreground">View your laboratory test history and trends.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      ) : Object.keys(groupedLabs).length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-16 border rounded-xl bg-muted/20">
          <FlaskConical className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">No lab results yet</p>
          <p className="text-sm text-muted-foreground mt-1">Upload lab reports and they will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {Object.entries(groupedLabs).map(([testName, results], i) => (
            <Card key={testName} className="card-hover border-0 shadow-sm animate-card-in" style={{ animationDelay: `${i * 60}ms` }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">{testName}</CardTitle>
                {results[0]?.is_abnormal && (
                  <Badge variant="destructive" className="text-[10px]">Abnormal</Badge>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">
                  {results[0]?.value}{' '}
                  <span className="text-sm font-normal text-muted-foreground">{results[0]?.unit}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Ref: {results[0]?.reference_range} · {results[0]?.test_date ? new Date(results[0].test_date).toLocaleDateString() : '—'}
                </p>
                {results.length > 1 && (
                  <div className="mt-2 border-t pt-3">
                    <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Trend</h4>
                    <div className="h-40">
                      <LabTrend testName={testName} results={results} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
