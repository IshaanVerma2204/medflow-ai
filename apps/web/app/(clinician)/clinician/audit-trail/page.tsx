'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { AuditLog } from '@/types'
import { apiService } from '@/lib/api'

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setLogs([
        { id: '1', agent: 'ExtractionAgent', action: 'Extracted medications from PDF', confidence: 95, created_at: new Date().toISOString() },
        { id: '2', agent: 'System', action: 'User logged in', created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: '3', agent: 'Clinician (Dr. Smith)', action: 'Approved Medication Flag', human_decision: 'Approved', created_at: new Date(Date.now() - 7200000).toISOString() },
      ])
      setIsLoading(false)
    }, 500)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Audit Trail</h2>
        <p className="text-muted-foreground">Complete history of system actions and human decisions.</p>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search logs..." className="pl-8" />
        </div>
      </div>

      <Card>
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-left font-medium">Timestamp</th>
                <th className="h-12 px-4 text-left font-medium">Actor / Agent</th>
                <th className="h-12 px-4 text-left font-medium">Action</th>
                <th className="h-12 px-4 text-left font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="border-b">
                  <td className="p-4 text-muted-foreground">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="p-4 font-medium">{log.agent || 'System'}</td>
                  <td className="p-4">{log.action}</td>
                  <td className="p-4 text-muted-foreground text-xs">
                    {log.confidence && <span>Conf: {log.confidence}% </span>}
                    {log.human_decision && <span>Decision: {log.human_decision}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
