'use client'

import { useCallback, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { callScreeningWebhook, ScreeningError } from '@/lib/screening'
import { ScreeningHeader } from '@/components/screening/screening-header'
import { ScreeningForm } from '@/components/screening/screening-form'
import { ScreeningResultDisplay } from '@/components/screening/screening-result'
import { ReviewForm } from '@/components/screening/review-form'
import { toast } from 'sonner'
import type { ScreeningSubject, ScreeningResult } from '@/lib/types'

interface ScreeningDashboardProps {
  userId: string
  userEmail: string
  userName: string
}

export function ScreeningDashboard({ userId, userEmail, userName }: ScreeningDashboardProps) {
  const [isScreening, setIsScreening] = useState(false)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [subject, setSubject] = useState<ScreeningSubject | null>(null)
  const [result, setResult] = useState<ScreeningResult | null>(null)
  const [rawResponse, setRawResponse] = useState<unknown>(null)
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null)
  const [recordId, setRecordId] = useState<string | null>(null)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  const handleScreeningSubmit = useCallback(
    async (subjectData: ScreeningSubject) => {
      setIsScreening(true)
      setResult(null)
      setRawResponse(null)
      setWebhookUrl(null)
      setRecordId(null)
      setReviewSubmitted(false)
      setSubject(subjectData)

      try {
        // Call n8n webhook
        const { result: screeningResult, rawResponse, webhookUrl: url } = await callScreeningWebhook(subjectData)
        console.log('[v0] Screening result to display:', JSON.stringify(screeningResult, null, 2))
        setResult(screeningResult)
        setRawResponse(rawResponse)
        setWebhookUrl(url)

        // Save to Supabase
        const supabase = createClient()
        const { data, error } = await supabase
          .from('screening_requests')
          .insert({
            subject_name: subjectData.name,
            subject_dob: subjectData.dob,
            subject_address: subjectData.address || null,
            subject_ssn: subjectData.ssn || null,
            subject_phone: subjectData.phone || null,
            subject_email: subjectData.email || null,
            risk_level: screeningResult.overall_match_status,
            confidence_score: Math.max(
              screeningResult.sanctions?.confidence_score_percent ?? 0,
              screeningResult.pep?.confidence_score_percent ?? 0
            ),
            explanation: [
              screeningResult.sanctions?.confidence_explanation,
              screeningResult.pep?.confidence_explanation,
            ].filter(Boolean).join(' | '),
            evidences: {
              sanctions: screeningResult.sanctions,
              pep: screeningResult.pep,
            },
            is_sanctions_hit:
              screeningResult.sanctions?.match_status === 'Confirmed Match' ||
              screeningResult.sanctions?.match_status === 'Potential Match',
            is_pep_hit:
              screeningResult.pep?.match_status === 'Confirmed Match' ||
              screeningResult.pep?.match_status === 'Potential Match',
            raw_response: screeningResult,
            reviewer_id: userId,
            reviewer_name: userName,
            reviewer_email: userEmail,
          })
          .select('id')
          .single()

        if (error) {
          console.log('[v0] Supabase insert error:', error)
          toast.error('Failed to save screening record')
        } else {
          console.log('[v0] Screening record saved, id:', data.id)
          setRecordId(data.id)
        }

        // Scroll to results
        setTimeout(() => {
          resultRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        }, 150)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Screening failed'
        console.log('[v0] Screening error:', message)
        
        // Capture webhook URL from error for debugging
        if (err instanceof ScreeningError) {
          setWebhookUrl(err.webhookUrl)
        }
        
        toast.error(message)
      } finally {
        setIsScreening(false)
      }
    },
    [userId, userEmail, userName]
  )

  const handleReviewSubmit = useCallback(
    async (decision: 'accepted' | 'overridden', reason: string) => {
      if (!recordId) {
        toast.error('No screening record to review')
        return
      }

      setIsSubmittingReview(true)

      try {
        const supabase = createClient()
        const { error } = await supabase
          .from('screening_requests')
          .update({
            review_decision: decision,
            review_reason: reason,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', recordId)

        if (error) {
          console.log('[v0] Review update error:', error)
          toast.error('Failed to submit review')
          return
        }

        console.log('[v0] Review submitted:', { decision, reason, recordId })
        setReviewSubmitted(true)
        toast.success(
          decision === 'accepted'
            ? 'Review submitted -- result accepted'
            : 'Review submitted -- result overridden'
        )
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to submit review'
        toast.error(message)
      } finally {
        setIsSubmittingReview(false)
      }
    },
    [recordId]
  )

  return (
    <div className="min-h-screen bg-background">
      <ScreeningHeader userEmail={userEmail} />

      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-8">
        {/* Intro */}
        <div>
          <h2 className="text-2xl font-semibold text-foreground text-balance">
            Sanctions & PEP Screening
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter subject details below to run an automated screening. Review the results and submit your decision.
          </p>
        </div>

        {/* Screening Form */}
        <ScreeningForm onSubmit={handleScreeningSubmit} isLoading={isScreening} />

        {/* Debug panel (show even on error) */}
        {webhookUrl && !result && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700 mb-2">Webhook call failed</p>
            <div className="rounded bg-background p-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Webhook URL Called:</span>
              <p className="mt-1 text-sm font-mono text-foreground break-all">{webhookUrl}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && subject && (
          <div ref={resultRef} className="flex flex-col gap-8">
            <ScreeningResultDisplay
              result={result}
              subject={subject}
              screenedSanctions={subject.screenSanctions}
              screenedPep={subject.screenPep}
            />

            {/* Debug: Webhook URL and Raw Response */}
            {(webhookUrl || rawResponse) && (
              <details className="rounded-lg border border-border bg-muted/30 p-4">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                  Debug: Webhook Info (click to expand)
                </summary>
                <div className="mt-3 space-y-3">
                  {webhookUrl && (
                    <div className="rounded bg-background p-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Webhook URL Called:</span>
                      <p className="mt-1 text-sm font-mono text-foreground break-all">{webhookUrl}</p>
                    </div>
                  )}
                  {rawResponse && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Raw Response:</span>
                      <pre className="mt-1 max-h-96 overflow-auto rounded bg-background p-3 text-xs text-foreground">
                        {JSON.stringify(rawResponse, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Review Form (only if not yet submitted) */}
            {!reviewSubmitted ? (
              <ReviewForm
                matchStatus={result.overall_match_status}
                onSubmit={handleReviewSubmit}
                isSubmitting={isSubmittingReview}
              />
            ) : (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center animate-in fade-in-0 duration-300">
                <svg
                  className="mx-auto h-10 w-10 text-emerald-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="m9 11 3 3L22 4" />
                </svg>
                <p className="mt-3 text-sm font-semibold text-emerald-700">
                  Review submitted successfully
                </p>
                <p className="mt-1 text-xs text-emerald-600">
                  Your decision has been recorded. You can run a new screening above.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-4 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          ScreenGuard Screening Platform. Results are AI-generated and should be reviewed by a qualified compliance officer.
        </footer>
      </main>
    </div>
  )
}
