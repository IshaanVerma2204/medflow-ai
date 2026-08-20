'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, ShieldAlert } from 'lucide-react'
import { apiService } from '@/lib/api'

export default function PatientListPage() {
  const [patients, setPatients] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // In real app, call API. using dummy data for UI display
    setTimeout(() => {
      setPatients([
        { id: 'P001', name: 'John Doe', dob: '1980-05-15', lastVisit: '2023-10-01', pendingFlags: 2 },
        { id: 'P002', name: 'Alice Smith', dob: '1975-11-22', lastVisit: '2023-10-10', pendingFlags: 0 },
        { id: 'P003', name: 'Bob Jones', dob: '1992-03-08', lastVisit: '2023-09-15', pendingFlags: 1 }
      ])
      setIsLoading(false)
    }, 500)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Patient Roster</h2>
          <p className="text-muted-foreground">Manage and review your assigned patients.</p>
        </div>
      </div>

      <div className="flex gap-4 items-center mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patients by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" /> Filter
        </Button>
      </div>

      <Card>
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-medium">Patient Name</th>
                <th className="h-12 px-4 text-left align-middle font-medium">DOB</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Last Visit</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                <th className="h-12 px-4 text-right align-middle font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
              ) : patients.map(p => (
                <tr key={p.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-4 font-medium">{p.name} <span className="text-xs text-muted-foreground ml-2">({p.id})</span></td>
                  <td className="p-4 text-muted-foreground">{p.dob}</td>
                  <td className="p-4 text-muted-foreground">{p.lastVisit}</td>
                  <td className="p-4">
                    {p.pendingFlags > 0 ? (
                      <Badge variant="destructive" className="gap-1 flex w-fit items-center">
                        <ShieldAlert className="h-3 w-3" /> {p.pendingFlags} Flags
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Clear</Badge>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/clinician/patients/${p.id}`}>
                      <Button variant="ghost" size="sm">View Profile</Button>
                    </Link>
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
