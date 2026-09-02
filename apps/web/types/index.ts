export type UserRole = 'patient' | 'clinician' | 'admin'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  patient_profile_id?: string
  clinician_profile_id?: string
  created_at: string
}

export interface PatientProfile {
  id: string
  user_id: string
  date_of_birth?: string
  gender?: string
  blood_type?: string
  allergies_summary?: string
  health_summary?: string
}

export interface Document {
  id: string
  filename: string
  original_filename: string
  document_type: string
  status: 'uploaded' | 'processing' | 'processed' | 'failed'
  document_date?: string
  document_title?: string
  page_count?: number
  created_at: string
}

export interface Medication {
  id: string
  name: string
  dosage?: string
  frequency?: string
  route?: string
  status: string`n  source_text?: string
  is_current: boolean
  prescriber?: string
  start_date?: string
}

export interface Diagnosis {
  id: string
  name: string
  icd_code?: string
  diagnosed_date?: string
  status: string`n  source_text?: string
  severity?: string
}

export interface LabResult {
  id: string
  test_name: string
  value: string
  unit?: string
  reference_range?: string
  is_abnormal?: boolean
  test_date?: string
}

export interface FollowUpTask {
  id: string
  task: string
  task_type: string
  due_date?: string
  priority: string
  status: string`n  source_text?: string
  responsible_role: string
}

export interface TimelineEvent {
  id: string
  event_date: string
  event_type: string
  title: string
  description?: string
  document_id?: string
}

export interface AIFlag {
  id: string
  flag_type: string
  title: string
  description: string
  evidence: EvidenceItem[]
  severity: 'high' | 'medium' | 'low'
  confidence: number
  status: 'pending' | 'approved' | 'rejected' | 'review_requested'
  agent_name: string
  created_at: string
}

export interface EvidenceItem {
  source_document: string
  page?: number
  text: string
  document_id?: string
}

export interface AgentRun {
  id: string
  workflow_type: string
  status: string`n  source_text?: string
  started_at: string
  completed_at?: string
}

export interface AuditLog {
  id: string
  agent?: string
  action: string
  confidence?: number
  human_decision?: string
  created_at: string
}

export interface Notification {
  id: string
  title: string
  message: string
  notification_type: string
  is_read: boolean
  created_at: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: SourceRef[]
}

export interface SourceRef {
  document_id: string
  document_name: string
  page?: number
  section?: string
  excerpt: string
}
