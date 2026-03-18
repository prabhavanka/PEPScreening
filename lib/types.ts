export interface ScreeningSubject {
  name: string
  dob: string
  address?: string
  ssn?: string
  phone?: string
  email?: string
  screenSanctions: boolean
  screenPep: boolean
}

export interface SanctionsDetails {
  list_name: string
  entry_name: string
  identifiers_matched: string[]
  source_url: string
}

export interface PepDetails {
  role: string
  country: string
  status: string
  source_url: string
  actual_dob_found?: string
  actual_dob_source_url?: string
}

export interface SanctionsScreeningResult {
  match_status: 'Confirmed Match' | 'Potential Match' | 'No Match'
  match_type: 'Sanctions' | 'None'
  details: SanctionsDetails
  confidence_score_percent: number
  confidence_explanation: string
  evidence_summary: string
  assumptions_made: string[]
}

export interface PepScreeningResult {
  match_status: 'Confirmed Match' | 'Potential Match' | 'No Match'
  match_type: 'PEP' | 'None'
  details: PepDetails
  confidence_score_percent: number
  confidence_explanation: string
  evidence_summary: string
  assumptions_made: string[]
}

export interface ScreeningResult {
  sanctions: SanctionsScreeningResult | null
  pep: PepScreeningResult | null
  overall_match_status: 'Confirmed Match' | 'Potential Match' | 'No Match'
}

/** Raw n8n response wrapper */
export interface N8nScreeningResponse {
  input_identity: {
    full_name: string
    dob: string
    address: string
    ssn_provided: string
  }
  screening_result: ScreeningResult
}

export interface ScreeningRequest {
  id: string
  subject_name: string
  subject_dob: string
  subject_address: string | null
  subject_ssn: string | null
  subject_phone: string | null
  subject_email: string | null
  risk_level: string | null
  confidence_score: number | null
  explanation: string | null
  evidences: Record<string, unknown> | null
  is_sanctions_hit: boolean
  is_pep_hit: boolean
  raw_response: N8nScreeningResponse | null
  reviewer_id: string
  reviewer_name: string | null
  reviewer_email: string | null
  review_decision: 'accepted' | 'overridden' | null
  review_reason: string | null
  reviewed_at: string | null
  created_at: string
}
