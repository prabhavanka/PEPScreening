'use client'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import type { ScreeningResult, ScreeningSubject } from '@/lib/types'

interface ScreeningResultDisplayProps {
  result: ScreeningResult
  subject: ScreeningSubject
  screenedSanctions: boolean
  screenedPep: boolean
}

const matchStatusConfig: Record<
  'Confirmed Match' | 'Potential Match' | 'No Match',
  { label: string; className: string; barColor: string }
> = {
  'Confirmed Match': {
    label: 'CONFIRMED MATCH',
    className: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100',
    barColor: 'bg-red-500',
  },
  'Potential Match': {
    label: 'POTENTIAL MATCH',
    className: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100',
    barColor: 'bg-amber-500',
  },
  'No Match': {
    label: 'NO MATCH',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    barColor: 'bg-emerald-500',
  },
}

export function ScreeningResultDisplay({
  result,
  subject,
  screenedSanctions,
  screenedPep,
}: ScreeningResultDisplayProps) {
  const config = matchStatusConfig[result.overall_match_status]
  
  // Check if we have data from n8n for each screening type
  const hasSanctionsData = result.sanctions !== null
  const hasPepData = result.pep !== null
  
  // Check if there was a hit (match found)
  const hasSanctionsHit = result.sanctions?.match_status === 'Confirmed Match' || result.sanctions?.match_status === 'Potential Match'
  const hasPepHit = result.pep?.match_status === 'Confirmed Match' || result.pep?.match_status === 'Potential Match'

  return (
    <div className="flex flex-col gap-5 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Overall Risk Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl">Screening Results</CardTitle>
              <CardDescription>
                Subject: {subject.name} &middot; DOB: {subject.dob}
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={config.className + ' text-sm px-3 py-1'}
            >
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Match Type Flags */}
          <div className="flex flex-wrap gap-2">
            {hasSanctionsData && (
              <Badge
                variant="outline"
                className={
                  hasSanctionsHit
                    ? 'bg-red-50 text-red-600 border-red-200'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                }
              >
                {hasSanctionsHit ? 'Sanctions Hit' : 'Sanctions Clear'}
              </Badge>
            )}
            {hasPepData && (
              <Badge
                variant="outline"
                className={
                  hasPepHit
                    ? 'bg-orange-50 text-orange-600 border-orange-200'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                }
              >
                {hasPepHit ? 'PEP Match' : 'PEP Clear'}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sanctions Screening Card - show if n8n returned sanctions data */}
      {hasSanctionsData && result.sanctions && (
        <Card className="animate-in fade-in-0 duration-300" style={{ animationDelay: '100ms' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Sanctions Screening</CardTitle>
                <CardDescription>
                  {hasSanctionsHit
                    ? `Match found on ${result.sanctions.details.list_name}`
                    : 'No sanctions match found'}
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className={
                  hasSanctionsHit
                    ? 'bg-red-50 text-red-600 border-red-200'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                }
              >
                {hasSanctionsHit ? 'HIT' : 'CLEAR'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Confidence Score */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Confidence Score</span>
                <span className="font-semibold text-foreground">
                  {result.sanctions.confidence_score_percent.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className={`h-2 rounded-full transition-all duration-700 ease-out ${
                    hasSanctionsHit ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.max(result.sanctions.confidence_score_percent, 5)}%` }}
                />
              </div>
            </div>

            {/* Confidence Explanation */}
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-semibold text-foreground">Confidence Explanation</h4>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {result.sanctions.confidence_explanation}
              </p>
            </div>

            {/* Evidence Summary */}
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-semibold text-foreground">Evidence Summary</h4>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {result.sanctions.evidence_summary}
              </p>
            </div>

            {/* Details if hit */}
            {hasSanctionsHit && result.sanctions.details.list_name && (
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      List Name
                    </span>
                    <p className="text-sm font-medium text-foreground mt-0.5">
                      {result.sanctions.details.list_name}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Entry Name
                    </span>
                    <p className="text-sm font-medium text-foreground mt-0.5">
                      {result.sanctions.details.entry_name}
                    </p>
                  </div>
                </div>
                {result.sanctions.details.identifiers_matched.length > 0 && (
                  <div className="mt-3">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Identifiers Matched
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {result.sanctions.details.identifiers_matched.map((id, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {id}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {result.sanctions.details.source_url && (
                  <a
                    href={result.sanctions.details.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-xs text-primary hover:text-primary/80 underline underline-offset-2"
                  >
                    View source
                  </a>
                )}
              </div>
            )}

            {/* Assumptions */}
            {result.sanctions.assumptions_made.length > 0 && (
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-semibold text-foreground">Assumptions Made</h4>
                <ul className="flex flex-col gap-1">
                  {result.sanctions.assumptions_made.map((assumption, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-muted-foreground/40" />
                      {assumption}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* PEP Screening Card - show if n8n returned PEP data */}
      {hasPepData && result.pep && (
        <Card className="animate-in fade-in-0 duration-300" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">PEP Screening</CardTitle>
                <CardDescription>
                  {hasPepHit
                    ? 'Politically Exposed Person match found'
                    : 'No PEP match found'}
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className={
                  hasPepHit
                    ? 'bg-orange-50 text-orange-600 border-orange-200'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                }
              >
                {hasPepHit ? 'HIT' : 'CLEAR'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Confidence Score */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Confidence Score</span>
                <span className="font-semibold text-foreground">
                  {result.pep.confidence_score_percent.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className={`h-2 rounded-full transition-all duration-700 ease-out ${
                    hasPepHit ? 'bg-orange-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.max(result.pep.confidence_score_percent, 5)}%` }}
                />
              </div>
            </div>

            {/* Confidence Explanation */}
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-semibold text-foreground">Confidence Explanation</h4>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {result.pep.confidence_explanation}
              </p>
            </div>

            {/* Evidence Summary */}
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-semibold text-foreground">Evidence Summary</h4>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {result.pep.evidence_summary}
              </p>
            </div>

            {/* Details if hit */}
            {hasPepHit && result.pep.details.role && (
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Role
                    </span>
                    <p className="text-sm font-medium text-foreground mt-0.5">
                      {result.pep.details.role}
                      {result.pep.details.source_url && (
                        <a
                          href={result.pep.details.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-xs text-primary hover:text-primary/80 underline underline-offset-2"
                        >
                          (source)
                        </a>
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Country
                    </span>
                    <p className="text-sm font-medium text-foreground mt-0.5">
                      {result.pep.details.country}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Status
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        result.pep.details.status === 'Current'
                          ? 'bg-red-50 text-red-600 border-red-200 mt-0.5'
                          : 'bg-muted text-muted-foreground mt-0.5'
                      }
                    >
                      {result.pep.details.status}
                    </Badge>
                  </div>
                </div>
                {result.pep.details.actual_dob_found && (
                  <div className="mt-3">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      DOB Verified
                    </span>
                    <p className="text-sm font-medium text-foreground mt-0.5">
                      {result.pep.details.actual_dob_found}
                      {result.pep.details.actual_dob_source_url && (
                        <a
                          href={result.pep.details.actual_dob_source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-xs text-primary hover:text-primary/80 underline underline-offset-2"
                        >
                          (source)
                        </a>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Assumptions */}
            {result.pep.assumptions_made.length > 0 && (
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-semibold text-foreground">Assumptions Made</h4>
                <ul className="flex flex-col gap-1">
                  {result.pep.assumptions_made.map((assumption, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-muted-foreground/40" />
                      {assumption}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
