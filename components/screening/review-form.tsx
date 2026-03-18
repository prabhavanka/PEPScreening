'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useState, useCallback } from 'react'

interface ReviewFormProps {
  matchStatus: string
  onSubmit: (decision: 'accepted' | 'overridden', reason: string) => Promise<void>
  isSubmitting: boolean
}

export function ReviewForm({ matchStatus, onSubmit, isSubmitting }: ReviewFormProps) {
  const [decision, setDecision] = useState<'accepted' | 'overridden' | null>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      if (!decision) {
        setError('Please select a review decision')
        return
      }
      if (!reason.trim()) {
        setError('Please provide a reason for your decision')
        return
      }

      await onSubmit(decision, reason.trim())
    },
    [decision, reason, onSubmit]
  )

  return (
    <Card className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      <CardHeader>
        <CardTitle className="text-xl">Reviewer Decision</CardTitle>
        <CardDescription>
          Accept the automated screening result or override it with your assessment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Decision Buttons */}
          <div className="flex flex-col gap-2">
            <Label>
              Your Decision <span className="text-destructive">*</span>
            </Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDecision('accepted')}
                className={`flex flex-col gap-1.5 rounded-lg border-2 p-4 text-left transition-all ${
                  decision === 'accepted'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-border hover:border-emerald-300 hover:bg-emerald-50/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg
                    className={`h-5 w-5 ${
                      decision === 'accepted' ? 'text-emerald-600' : 'text-muted-foreground'
                    }`}
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
                  <span
                    className={`font-semibold ${
                      decision === 'accepted' ? 'text-emerald-700' : 'text-foreground'
                    }`}
                  >
                    Accept Result
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Agree with the AI screening output ({matchStatus})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('overridden')}
                className={`flex flex-col gap-1.5 rounded-lg border-2 p-4 text-left transition-all ${
                  decision === 'overridden'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-border hover:border-amber-300 hover:bg-amber-50/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg
                    className={`h-5 w-5 ${
                      decision === 'overridden' ? 'text-amber-600' : 'text-muted-foreground'
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <span
                    className={`font-semibold ${
                      decision === 'overridden' ? 'text-amber-700' : 'text-foreground'
                    }`}
                  >
                    Override Result
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Disagree and provide your own assessment
                </span>
              </button>
            </div>
          </div>

          {/* Reason */}
          <div className="grid gap-1.5">
            <Label htmlFor="review-reason">
              Reason / Justification <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="review-reason"
              placeholder={
                decision === 'overridden'
                  ? 'Explain why you are overriding the screening result...'
                  : 'Briefly explain your rationale for accepting this result...'
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            disabled={isSubmitting || !decision}
            className="w-full sm:w-auto sm:self-end"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Submitting Review...
              </span>
            ) : (
              'Submit Review'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
