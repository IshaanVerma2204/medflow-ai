'use client'

import React from 'react'
import { usePatient } from '@/hooks/usePatient'
import { useAuth } from '@/hooks/useAuth'
import { MedicationCard } from '@/components/medical/MedicationCard'

export default function MedicationsPage() {
  const { user } = useAuth()
  const { medications, isLoading } = usePatient(user?.id)

  const currentMeds = medications.filter(m => m.is_current)
  const pastMeds = medications.filter(m => !m.is_current)

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Medications</h2>
        <p className="text-muted-foreground">Manage your current and past prescriptions.</p>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Current Medications</h3>
        {currentMeds.length === 0 ? (
          <p className="text-muted-foreground italic">No current medications found.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentMeds.map(med => (
              <MedicationCard key={med.id} medication={med} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Past Medications</h3>
        {pastMeds.length === 0 ? (
          <p className="text-muted-foreground italic">No past medications found.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-70">
            {pastMeds.map(med => (
              <MedicationCard key={med.id} medication={med} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
