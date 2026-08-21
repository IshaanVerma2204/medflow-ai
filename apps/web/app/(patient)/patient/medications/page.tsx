'use client'

import React from 'react'
import { usePatientData } from '@/context/PatientDataContext'
import { MedicationCard } from '@/components/medical/MedicationCard'
import { Pill } from 'lucide-react'

export default function MedicationsPage() {
  const { medications, isLoading } = usePatientData()

  const currentMeds = medications.filter(m => m.is_current)
  const pastMeds = medications.filter(m => !m.is_current)

  return (
    <div className="space-y-8 animate-page-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Medications</h2>
        <p className="text-muted-foreground">Manage your current and past prescriptions.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-36 rounded-xl bg-muted animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      ) : (
        <>
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Pill className="h-5 w-5 text-blue-500" />
              Current Medications
              <span className="ml-1 text-sm font-normal text-muted-foreground">({currentMeds.length})</span>
            </h3>
            {currentMeds.length === 0 ? (
              <p className="text-muted-foreground italic text-sm">No current medications found.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {currentMeds.map((med, i) => (
                  <div key={med.id} className="animate-card-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <MedicationCard medication={med} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {pastMeds.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4 text-muted-foreground flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Past Medications
                <span className="ml-1 text-sm font-normal">({pastMeds.length})</span>
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-60">
                {pastMeds.map((med, i) => (
                  <div key={med.id} className="animate-card-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <MedicationCard medication={med} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
