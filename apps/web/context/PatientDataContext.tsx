'use client'

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react'
import { apiService } from '@/lib/api'
import { PatientProfile, TimelineEvent, Medication, Diagnosis, LabResult, FollowUpTask, AIFlag } from '@/types'

interface PatientData {
  profile: PatientProfile | null
  timeline: TimelineEvent[]
  medications: Medication[]
  diagnoses: Diagnosis[]
  labResults: LabResult[]
  followUps: FollowUpTask[]
  flags: AIFlag[]
  isLoading: boolean
  error: Error | null
  patientId: string | null
  refetch: () => Promise<void>
}

const PatientDataContext = createContext<PatientData>({
  profile: null,
  timeline: [],
  medications: [],
  diagnoses: [],
  labResults: [],
  followUps: [],
  flags: [],
  isLoading: true,
  error: null,
  patientId: null,
  refetch: async () => {},
})

interface PatientDataProviderProps {
  children: React.ReactNode
  patientId: string | undefined
}

export function PatientDataProvider({ children, patientId }: PatientDataProviderProps) {
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([])
  const [labResults, setLabResults] = useState<LabResult[]>([])
  const [followUps, setFollowUps] = useState<FollowUpTask[]>([])
  const [flags, setFlags] = useState<AIFlag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [loadedId, setLoadedId] = useState<string | null>(null)

  const fetchAllData = useCallback(async () => {
    if (!patientId) return

    setIsLoading(true)
    setError(null)
    try {
      const [
        profData,
        timeData,
        medData,
        diagData,
        labData,
        followData,
        flagData,
      ] = await Promise.all([
        apiService.patients.get(patientId),
        apiService.patients.getTimeline(patientId),
        apiService.patients.getMedications(patientId),
        apiService.patients.getDiagnoses(patientId),
        apiService.patients.getLabResults(patientId),
        apiService.patients.getFollowUps(patientId),
        apiService.patients.getFlags(patientId),
      ])

      setProfile(profData)
      setTimeline(timeData)
      setMedications(medData)
      setDiagnoses(diagData)
      setLabResults(labData)
      setFollowUps(followData)
      setFlags(flagData)
      setLoadedId(patientId)
    } catch (err: any) {
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    // Only fetch if we haven't loaded for this patient yet
    if (patientId && patientId !== loadedId) {
      fetchAllData()
    } else if (!patientId) {
      setIsLoading(false)
    }
  }, [patientId, loadedId, fetchAllData])

  return (
    <PatientDataContext.Provider value={{
      profile,
      timeline,
      medications,
      diagnoses,
      labResults,
      followUps,
      flags,
      isLoading,
      error,
      patientId: patientId ?? null,
      refetch: fetchAllData,
    }}>
      {children}
    </PatientDataContext.Provider>
  )
}

/** Use this in any patient page — returns cached data instantly after first load */
export function usePatientData() {
  return useContext(PatientDataContext)
}
