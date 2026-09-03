import axios from 'axios'
import { getToken, removeToken } from './auth'
import {
  User, PatientProfile, Document, Medication, Diagnosis, LabResult,
  FollowUpTask, TimelineEvent, AIFlag, AgentRun, AuditLog, Notification
} from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? (process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') + '/api')
  : 'https://medflow-ai-edh9.onrender.com/api'

const axiosInstance = axios.create({
  baseURL: API_BASE,
})

axiosInstance.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken()
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const apiService = {
  auth: {
    // FastAPI OAuth2 expects form-data, not JSON
    login: async (email: string, password: string) => {
      const formData = new URLSearchParams()
      formData.append('username', email)
      formData.append('password', password)
      const res = await axiosInstance.post<{ access_token: string; token_type: string }>(
        '/auth/login',
        formData,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      )
      return res.data
    },
    register: async (data: { email: string; password: string; full_name: string; role: string }) => {
      const res = await axiosInstance.post<User>('/auth/register', data)
      return res.data
    },
    me: async () => {
      const res = await axiosInstance.get<User>('/auth/me')
      return res.data
    },
  },

  patients: {
    list: async () => {
      const res = await axiosInstance.get<PatientProfile[]>('/patients')
      return res.data
    },
    get: async (id: string) => {
      const res = await axiosInstance.get<PatientProfile>(`/patients/${id}`)
      return res.data
    },
    update: async (id: string, data: Partial<PatientProfile>) => {
      const res = await axiosInstance.patch<PatientProfile>(`/patients/${id}`, data)
      return res.data
    },
    getTimeline: async (id: string) => {
      const res = await axiosInstance.get<TimelineEvent[]>(`/patients/${id}/timeline`)
      return res.data
    },
    getMedications: async (id: string) => {
      const res = await axiosInstance.get<Medication[]>(`/patients/${id}/medications`)
      return res.data
    },
    getLabResults: async (id: string) => {
      const res = await axiosInstance.get<LabResult[]>(`/patients/${id}/lab-results`)
      return res.data
    },
    getDiagnoses: async (id: string) => {
      const res = await axiosInstance.get<Diagnosis[]>(`/patients/${id}/diagnoses`)
      return res.data
    },
    getFollowUps: async (id: string) => {
      const res = await axiosInstance.get<FollowUpTask[]>(`/patients/${id}/follow-ups`)
      return res.data
    },
    getFlags: async (id: string) => {
      const res = await axiosInstance.get<AIFlag[]>(`/patients/${id}/flags`)
      return res.data
    },
    getDocuments: async (id: string) => {
      const res = await axiosInstance.get<Document[]>(`/patients/${id}/documents`)
      return res.data
    },
  },

  documents: {
    upload: async (patientId: string, file: File, metadata?: { document_title?: string; description?: string }) => {
      const formData = new FormData()
      formData.append('file', file)
      if (metadata?.document_title) formData.append('document_title', metadata.document_title)
      if (metadata?.description) formData.append('description', metadata.description)
      const res = await axiosInstance.post<Document>(
        `/patients/${patientId}/documents`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return res.data
    },
    get: async (id: string) => {
      const res = await axiosInstance.get<Document>(`/documents/${id}`)
      return res.data
    },
    getPages: async (id: string) => {
      const res = await axiosInstance.get<{ page_number: number; content: string }[]>(`/documents/${id}/pages`)
      return res.data
    },
    delete: async (id: string) => {
      await axiosInstance.delete(`/documents/${id}`)
    },
  },

  ai: {
    chat: async (message: string, patientId: string, conversationHistory?: { role: string; content: string }[]) => {
      const res = await axiosInstance.post('/ai/chat', {
        message,
        patient_id: patientId,
        conversation_history: conversationHistory,
      })
      return res.data
    },
    analyzeDocument: async (documentId: string, patientId: string) => {
      const res = await axiosInstance.post('/ai/analyze-document', {
        document_id: documentId,
        patient_id: patientId,
      })
      return res.data
    },
    getFlags: async (patientId?: string, status?: string) => {
      const params = new URLSearchParams()
      if (patientId) params.append('patient_id', patientId)
      if (status) params.append('status', status)
      const res = await axiosInstance.get<AIFlag[]>(`/ai/flags?${params}`)
      return res.data
    },
    approveFlag: async (id: string, notes?: string) => {
      const res = await axiosInstance.post<AIFlag>(`/ai/flags/${id}/approve`, { notes })
      return res.data
    },
    rejectFlag: async (id: string, notes?: string) => {
      const res = await axiosInstance.post<AIFlag>(`/ai/flags/${id}/reject`, { notes })
      return res.data
    },
    requestReview: async (id: string, notes?: string) => {
      const res = await axiosInstance.post<AIFlag>(`/ai/flags/${id}/request-review`, { notes })
      return res.data
    },
    getAgentRun: async (id: string) => {
      const res = await axiosInstance.get(`/ai/agent-runs/${id}`)
      return res.data
    },
    getAgentRuns: async () => {
      const res = await axiosInstance.get('/ai/agent-runs')
      return res.data
    },
    generateSummary: async (patientId: string, summaryType: 'clinical' | 'patient' = 'clinical') => {
      const res = await axiosInstance.post('/ai/generate-summary', {
        patient_id: patientId,
        summary_type: summaryType,
      })
      return res.data
    },
    transcribe: async (audioBlob: Blob) => {
      const formData = new FormData()
      formData.append('file', audioBlob, 'audio.webm')
      const res = await axiosInstance.post('/ai/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return res.data as { text: string }
    },
  },

  audit: {
    getLogs: async () => {
      const res = await axiosInstance.get<AuditLog[]>('/audit-logs')
      return res.data
    },
  },

  notifications: {
    list: async () => {
      const res = await axiosInstance.get<Notification[]>('/notifications')
      return res.data
    },
    markRead: async (id: string) => {
      await axiosInstance.post(`/notifications/${id}/read`)
    },
  },
}

export default axiosInstance
