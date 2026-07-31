"use client"

import { AlertCircle } from "lucide-react"

interface ErrorDisplayProps {
  message: string
  onDismiss: () => void
}

export function ErrorDisplay({ message, onDismiss }: ErrorDisplayProps) {
  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-300 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
      <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
      <div className="flex flex-1 flex-col gap-1">
        <p className="text-sm font-medium text-destructive">
          Something went wrong
        </p>
        <p className="text-sm text-destructive/80">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 text-sm text-destructive/60 transition-colors hover:text-destructive cursor-pointer"
        aria-label="Dismiss error"
      >
        Dismiss
      </button>
    </div>
  )
}
