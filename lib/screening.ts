// v3 - Force complete rebuild
import type { ScreeningSubject, ScreeningResult, SanctionsScreeningResult, PepScreeningResult } from '@/lib/types'

const BUILD_VERSION = 'v3'
console.log('[v0] screening.ts loaded, version:', BUILD_VERSION)

// Custom error class to carry webhook URL for debugging
export class ScreeningError extends Error {
  webhookUrl: string
  constructor(message: string, webhookUrl: string) {
    super(message)
    this.name = 'ScreeningError'
    this.webhookUrl = webhookUrl
  }
}

/**
 * Calls the screening API proxy, which forwards to the n8n webhook server-side.
 * This avoids CORS issues from calling n8n directly in the browser.
 * Falls back to a mock response if the proxy returns a config error.
 */
export interface ScreeningWebhookResponse {
  result: ScreeningResult
  rawResponse: unknown
  webhookUrl: string
  error?: string
}

export async function callScreeningWebhook(
  subject: ScreeningSubject
): Promise<ScreeningWebhookResponse> {
  const payload = {
    name: subject.name,
    dob: subject.dob,
    address: subject.address || null,
    ssn: subject.ssn || null,
    phone: subject.phone || null,
    email: subject.email || null,
    screen_sanctions: subject.screenSanctions,
    screen_pep: subject.screenPep,
  }

  console.log('[v0] Sending screening request via API proxy:', payload)

  try {
    const response = await fetch('/api/screening', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    console.log('[v0] API proxy response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: string; _webhookUrl?: string }
      const errorMsg = errorData.error || `Status ${response.status}`
      const webhookUrl = errorData._webhookUrl || 'Unknown'
      console.error('[v0] API proxy error:', errorMsg)
      console.error('[v0] Webhook URL that failed:', webhookUrl)

      // If webhook is not configured, fall back to mock
      if (response.status === 500 && errorMsg.includes('not configured')) {
        console.warn('[v0] Webhook not configured, using mock response')
        const mockResult = getMockResponse(subject)
        return { result: mockResult, rawResponse: { mock: true, ...mockResult }, webhookUrl: 'MOCK (not configured)' }
      }

      // Return error with webhook URL for debugging
      throw new ScreeningError(`Screening failed: ${errorMsg}`, webhookUrl)
    }

    const responseData = await response.json()
    const webhookUrl = (responseData as { _webhookUrl?: string })._webhookUrl || 'Unknown'
    const data = (responseData as { data?: unknown }).data || responseData
    
    console.log('[v0] Webhook URL used:', webhookUrl)
    console.log('[v0] API proxy raw response:', JSON.stringify(data, null, 2))

    const result = normalizeResponse(data)
    console.log('[v0] Normalized screening result:', result)

    return { result, rawResponse: data, webhookUrl }
  } catch (error) {
    console.error('[v0] Screening request failed:', error)
    // Re-throw ScreeningError as-is to preserve webhookUrl
    if (error instanceof ScreeningError) {
      throw error
    }
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Screening request failed: Unknown error'
    )
  }
}

/**
 * Normalizes the n8n response into our ScreeningResult interface.
 * 
 * n8n can return TWO different formats:
 * 1. Single screening: { output: { screening_result: { match_status, sanctions_details, ... } } }
 * 2. Dual screening: { output: { sanctions_screening_result: {...}, pep_screening_result: {...} } }
 * 
 * This normalizer handles both formats.
 */
function normalizeResponse(data: unknown): ScreeningResult {
  // n8n may return an array with MULTIPLE objects:
  // [{ output: { sanctions_screening_result } }, { output: { pep_screening_result } }]
  // We need to merge all array elements to get both results
  
  let mergedOutput: Record<string, unknown> = {}
  
  if (Array.isArray(data)) {
    console.log('[v0] Response is an array with', data.length, 'elements')
    // Merge all array elements' output objects, preserving screening result keys
    for (const item of data) {
      const itemObj = item as Record<string, unknown>
      const itemOutput = (
        itemObj.output && typeof itemObj.output === 'object'
          ? itemObj.output
          : itemObj
      ) as Record<string, unknown>
      
      console.log('[v0] Processing array element with keys:', Object.keys(itemOutput))
      
      // Only add keys that don't exist yet, OR specifically merge screening results
      for (const [key, value] of Object.entries(itemOutput)) {
        if (key === 'sanctions_screening_result' || key === 'pep_screening_result' || key === 'screening_result') {
          // Always take screening result keys
          mergedOutput[key] = value
          console.log('[v0] Added screening key:', key)
        } else if (!(key in mergedOutput)) {
          // Only add other keys if they don't exist
          mergedOutput[key] = value
        }
      }
    }
  } else {
    // Single object response
    const root = data as Record<string, unknown>
    mergedOutput = (
      root.output && typeof root.output === 'object'
        ? root.output
        : root
    ) as Record<string, unknown>
  }

  const unwrapped = mergedOutput
  console.log('[v0] Merged n8n response keys:', Object.keys(unwrapped))

  // Check for dual-screening format (separate sanctions_screening_result and pep_screening_result)
  const hasDualFormat = 'sanctions_screening_result' in unwrapped || 'pep_screening_result' in unwrapped
  
  // Check for single-screening format (screening_result with match_type)
  const hasSingleFormat = 'screening_result' in unwrapped
  
  let sanctions: SanctionsScreeningResult | null = null
  let pep: PepScreeningResult | null = null

  if (hasDualFormat) {
    // DUAL FORMAT: separate sanctions_screening_result and pep_screening_result
    // NOTE: confidence_score, explanation, evidence, assumptions are at the TOP level of `unwrapped`
    // with prefixes like `sanctions_confidence_score_percent` or `pep_confidence_score_percent`
    const sanctionsRaw = (unwrapped.sanctions_screening_result ?? {}) as Record<string, unknown>
    const sanctionsDetails = (sanctionsRaw.sanctions_details ?? {}) as Record<string, unknown>
    
    const pepRaw = (unwrapped.pep_screening_result ?? {}) as Record<string, unknown>
    const pepDetails = (pepRaw.pep_details ?? {}) as Record<string, unknown>

    console.log('[v0] Dual format - sanctionsRaw keys:', Object.keys(sanctionsRaw))
    console.log('[v0] Dual format - pepRaw keys:', Object.keys(pepRaw))
    console.log('[v0] Dual format - unwrapped keys:', Object.keys(unwrapped))

    if (Object.keys(sanctionsRaw).length > 0) {
      sanctions = {
        match_status: parseMatchStatus(sanctionsRaw.sanctions_match_status),
        match_type: parseMatchType(sanctionsRaw.sanctions_match_type) === 'Sanctions' ? 'Sanctions' : 'None',
        details: {
          list_name: cleanEmpty(sanctionsDetails.list_name),
          entry_name: cleanEmpty(sanctionsDetails.entry_name),
          identifiers_matched: normalizeArray(sanctionsDetails.identifiers_matched),
          source_url: cleanEmpty(sanctionsDetails.source_url),
        },
        // These fields may be in sanctionsRaw OR at the top level (unwrapped)
        confidence_score_percent: Number(
          sanctionsRaw.sanctions_confidence_score_percent ?? 
          unwrapped.sanctions_confidence_score_percent ?? 0
        ),
        confidence_explanation: String(
          sanctionsRaw.sanctions_confidence_explanation ?? 
          unwrapped.sanctions_confidence_explanation ?? ''
        ),
        evidence_summary: String(
          sanctionsRaw.sanctions_evidence_summary ?? 
          unwrapped.sanctions_evidence_summary ?? ''
        ),
        assumptions_made: normalizeArray(
          sanctionsRaw.sanctions_assumptions_made ?? 
          unwrapped.sanctions_assumptions_made ?? []
        ),
      }
    }

    if (Object.keys(pepRaw).length > 0) {
      // PEP details: role, country, status may be directly in pepRaw, not in pep_details
      pep = {
        match_status: parseMatchStatus(pepRaw.pep_match_status),
        match_type: parseMatchType(pepRaw.pep_match_type) === 'PEP' ? 'PEP' : 'None',
        details: {
          // Check both pepDetails and pepRaw for these fields
          role: cleanEmpty(pepDetails.role ?? pepRaw.role),
          country: cleanEmpty(pepDetails.country ?? pepRaw.country),
          status: cleanEmpty(pepDetails.status ?? pepRaw.status),
          source_url: cleanEmpty(pepDetails.source_url ?? pepRaw.source_url),
          actual_dob_found: cleanEmpty(pepDetails.actual_dob_found ?? pepRaw.actual_dob_found),
          actual_dob_source_url: cleanEmpty(pepDetails.actual_dob_source_url ?? pepRaw.actual_dob_source_url),
        },
        // These fields may be in pepRaw OR at the top level (unwrapped)
        confidence_score_percent: Number(
          pepRaw.pep_confidence_score_percent ?? 
          unwrapped.pep_confidence_score_percent ?? 0
        ),
        confidence_explanation: String(
          pepRaw.pep_confidence_explanation ?? 
          unwrapped.pep_confidence_explanation ?? ''
        ),
        evidence_summary: String(
          pepRaw.pep_evidence_summary ?? 
          unwrapped.pep_evidence_summary ?? ''
        ),
        assumptions_made: normalizeArray(
          pepRaw.pep_assumptions_made ?? 
          unwrapped.pep_assumptions_made ?? []
        ),
      }
      console.log('[v0] Parsed PEP result:', pep)
    }
  } else if (hasSingleFormat) {
    // SINGLE FORMAT: screening_result contains either sanctions or PEP data
    const sr = unwrapped.screening_result as Record<string, unknown>
    const matchType = parseMatchType(sr.match_type)
    const matchStatus = parseMatchStatus(sr.match_status)

    console.log('[v0] Single format detected - match_type:', sr.match_type, '-> parsed as:', matchType)
    console.log('[v0] Single format - match_status:', sr.match_status, '-> parsed as:', matchStatus)
    console.log('[v0] Single format - screening_result keys:', Object.keys(sr))

    if (matchType === 'Sanctions' || matchType === 'Both') {
      const sanctionsDetails = (sr.sanctions_details ?? {}) as Record<string, unknown>
      console.log('[v0] Sanctions details:', sanctionsDetails)
      sanctions = {
        match_status: matchStatus,
        match_type: 'Sanctions',
        details: {
          list_name: cleanEmpty(sanctionsDetails.list_name),
          entry_name: cleanEmpty(sanctionsDetails.entry_name),
          identifiers_matched: normalizeArray(sanctionsDetails.identifiers_matched),
          source_url: cleanEmpty(sanctionsDetails.source_url),
        },
        confidence_score_percent: Number(sr.confidence_score_percent ?? 0),
        confidence_explanation: String(sr.confidence_explanation ?? ''),
        evidence_summary: String(sr.evidence_summary ?? ''),
        assumptions_made: normalizeArray(sr.assumptions_made),
      }
    }

    if (matchType === 'PEP' || matchType === 'Both') {
      const pepDetails = (sr.pep_details ?? {}) as Record<string, unknown>
      console.log('[v0] PEP details:', pepDetails)
      pep = {
        match_status: matchStatus,
        match_type: 'PEP',
        details: {
          role: cleanEmpty(pepDetails.role),
          country: cleanEmpty(pepDetails.country),
          status: cleanEmpty(pepDetails.status),
          source_url: cleanEmpty(pepDetails.source_url),
          actual_dob_found: cleanEmpty(pepDetails.actual_dob_found),
          actual_dob_source_url: cleanEmpty(pepDetails.actual_dob_source_url),
        },
        confidence_score_percent: Number(sr.confidence_score_percent ?? 0),
        confidence_explanation: String(sr.confidence_explanation ?? ''),
        evidence_summary: String(sr.evidence_summary ?? ''),
        assumptions_made: normalizeArray(sr.assumptions_made),
      }
    }
  }

  // Determine overall match status
  const sanctionsHit = sanctions?.match_status === 'Confirmed Match' || sanctions?.match_status === 'Potential Match'
  const pepHit = pep?.match_status === 'Confirmed Match' || pep?.match_status === 'Potential Match'
  
  let overall_match_status: ScreeningResult['overall_match_status'] = 'No Match'
  if (sanctions?.match_status === 'Confirmed Match' || pep?.match_status === 'Confirmed Match') {
    overall_match_status = 'Confirmed Match'
  } else if (sanctionsHit || pepHit) {
    overall_match_status = 'Potential Match'
  }

  console.log('[v0] Parsed sanctions:', sanctions)
  console.log('[v0] Parsed pep:', pep)
  console.log('[v0] Overall match status:', overall_match_status)

  return {
    sanctions,
    pep,
    overall_match_status,
  }
}

/** n8n sends "empty" as a string for blank fields -- treat as empty */
function cleanEmpty(value: unknown): string {
  const str = String(value ?? '')
  return str.toLowerCase() === 'empty' ? '' : str
}

/** Normalize array fields, handling "empty array" placeholders */
function normalizeArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map(String)
    .filter(s => s.toLowerCase() !== 'empty' && s.toLowerCase() !== 'empty array')
}

function parseMatchStatus(
  value: unknown
): 'Confirmed Match' | 'Potential Match' | 'No Match' {
  const str = String(value ?? '').toLowerCase()
  if (str.includes('confirmed')) return 'Confirmed Match'
  if (str.includes('potential')) return 'Potential Match'
  return 'No Match'
}

function parseMatchType(value: unknown): 'Sanctions' | 'PEP' | 'Both' | 'None' {
  const str = String(value ?? '').toLowerCase()
  if (str.includes('both')) return 'Both'
  if (str.includes('sanctions')) return 'Sanctions'
  if (str.includes('pep')) return 'PEP'
  return 'None'
}

// ─── Mock fallback (used when N8N_WEBHOOK_URL is not set) ───

function getMockResponse(subject: ScreeningSubject): ScreeningResult {
  const nameLower = subject.name.toLowerCase()
  const isKnownPep =
    nameLower.includes('putin') ||
    nameLower.includes('kim') ||
    nameLower.includes('maduro') ||
    nameLower.includes('modi')
  const isKnownSanction =
    nameLower.includes('iran') ||
    nameLower.includes('north korea') ||
    nameLower.includes('taliban')

  const sanctions: SanctionsScreeningResult | null = subject.screenSanctions ? {
    match_status: isKnownSanction ? 'Confirmed Match' : 'No Match',
    match_type: isKnownSanction ? 'Sanctions' : 'None',
    details: {
      list_name: isKnownSanction ? 'OFAC SDN List' : '',
      entry_name: isKnownSanction ? subject.name : '',
      identifiers_matched: isKnownSanction ? ['Full Name', 'Date of Birth'] : [],
      source_url: isKnownSanction ? 'https://sanctionssearch.ofac.treas.gov/' : '',
    },
    confidence_score_percent: isKnownSanction ? 94.5 : 0,
    confidence_explanation: isKnownSanction 
      ? `High-confidence match based on exact name and DOB correlation.`
      : `No exact or strongly similar OFAC name hit found for '${subject.name}'.`,
    evidence_summary: isKnownSanction
      ? `The subject "${subject.name}" was found on OFAC SDN list.`
      : `A search of the OFAC sanctions list returned no matches.`,
    assumptions_made: isKnownSanction 
      ? ['Name transliteration matched exactly', 'DOB verified against list entry']
      : ['No OFAC sanctions list entry found.'],
  } : null

  const pep: PepScreeningResult | null = subject.screenPep ? {
    match_status: isKnownPep ? 'Confirmed Match' : 'No Match',
    match_type: isKnownPep ? 'PEP' : 'None',
    details: {
      role: isKnownPep ? 'Head of State' : '',
      country: isKnownPep ? 'Unknown' : '',
      status: isKnownPep ? 'Current' : '',
      source_url: isKnownPep ? 'https://www.cia.gov/resources/world-leaders/' : '',
    },
    confidence_score_percent: isKnownPep ? 100 : 0,
    confidence_explanation: isKnownPep
      ? `Name is an exact match. Source is highly reliable.`
      : `No PEP matches found for '${subject.name}'.`,
    evidence_summary: isKnownPep
      ? `${subject.name} is listed as a current government official.`
      : `No PEP records found for the subject.`,
    assumptions_made: isKnownPep ? ['None.'] : ['No PEP database entry found.'],
  } : null

  const sanctionsHit = sanctions?.match_status === 'Confirmed Match'
  const pepHit = pep?.match_status === 'Confirmed Match'

  return {
    sanctions,
    pep,
    overall_match_status: sanctionsHit || pepHit ? 'Confirmed Match' : 'No Match',
  }
}
