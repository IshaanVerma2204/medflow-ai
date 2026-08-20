import { useState, useEffect, useCallback } from 'react'
import { apiService } from '@/lib/api'
import { PatientProfile, TimelineEvent, Medication, Diagnosis, LabResult, FollowUpTask, AIFlag } from '@/types'

export function usePatient(patientId: string | undefined) {
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([])
  const [labResults, setLabResults] = useState<LabResult[]>([])
  const [followUps, setFollowUps] = useState<FollowUpTask[]>([])
  const [flags, setFlags] = useState<AIFlag[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

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
        flagData
      ] = await Promise.all([
        apiService.patients.get(patientId),
        apiService.patients.getTimeline(patientId),
        apiService.patients.getMedications(patientId),
        apiService.patients.getDiagnoses(patientId),
        apiService.patients.getLabResults(patientId),
        apiService.patients.getFollowUps(patientId),
        apiService.patients.getFlags(patientId)
      ])
      
      setProfile(profData)
      setTimeline(timeData)
      setMedications(medData)
      setDiagnoses(diagData)
      setLabResults(labData)
      setFollowUps(followData)
      setFlags(flagData)
    } catch (err: any) {
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  return {
    profile,
    timeline,
    medications,
    diagnoses,
    labResults,
    followUps,
    flags,
    isLoading,
    error,
    refetch: fetchAllData
  }
}
