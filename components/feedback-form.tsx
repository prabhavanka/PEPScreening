"use client"

import { useCallback, useState } from "react"
import { Loader2, MessageSquareHeart } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import { StarRating } from "@/components/star-rating"
import { cn } from "@/lib/utils"

interface FeedbackFormData {
  fullName: string
  email: string
  rating: number
  message: string
}

const INITIAL_FORM: FeedbackFormData = {
  fullName: "",
  email: "",
  rating: 0,
  message: "",
}

interface FeedbackFormProps {
  company1: string
  company2: string
}

export function FeedbackForm({ company1, company2 }: FeedbackFormProps) {
  const [form, setForm] = useState<FeedbackFormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FeedbackFormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof FeedbackFormData, string>> = {}

    if (!form.fullName.trim()) {
      newErrors.fullName = "Full name is required"
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email"
    }

    if (form.rating === 0) {
      newErrors.rating = "Please select a rating"
    }

    if (!form.message.trim()) {
      newErrors.message = "Feedback message is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [form])

  const handleChange = useCallback(
    (field: keyof FeedbackFormData, value: string | number) => {
      setForm((prev) => ({ ...prev, [field]: value }))
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    },
    []
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validate()) return

      setIsSubmitting(true)

      console.log("[v0] Submitting feedback to Supabase:", {
        full_name: form.fullName,
        email: form.email,
        rating: form.rating,
        message: form.message,
      })

      try {
        const supabase = createClient()
        const { error } = await supabase.from("feedback").insert({
          full_name: form.fullName.trim(),
          email: form.email.trim(),
          rating: form.rating,
          message: form.message.trim(),
        })

        if (error) {
          console.log("[v0] Supabase insert error:", error)
          throw error
        }

        console.log("[v0] Feedback submitted successfully")
        toast.success("Feedback submitted successfully!")
        setForm(INITIAL_FORM)
        setErrors({})
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to submit feedback"
        console.log("[v0] Feedback submission failed:", message)
        toast.error(message)
      } finally {
        setIsSubmitting(false)
      }
    },
    [form, validate]
  )

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="rounded-xl border border-border bg-card p-6 md:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <MessageSquareHeart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              How was this comparison?
            </h3>
            <p className="text-sm text-muted-foreground">
              Share your feedback on the{" "}
              <span className="font-medium text-foreground">{company1}</span>
              {" vs "}
              <span className="font-medium text-foreground">{company2}</span>
              {" "}analysis
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          {/* Full Name & Email row */}
          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="feedback-name"
                className="text-sm font-medium text-foreground"
              >
                Full Name <span className="text-destructive">*</span>
              </label>
              <input
                id="feedback-name"
                type="text"
                placeholder="John Doe"
                value={form.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                disabled={isSubmitting}
                className={cn(
                  "rounded-lg border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground",
                  "transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  errors.fullName ? "border-destructive" : "border-border"
                )}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">{errors.fullName}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="feedback-email"
                className="text-sm font-medium text-foreground"
              >
                Email <span className="text-destructive">*</span>
              </label>
              <input
                id="feedback-email"
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                disabled={isSubmitting}
                className={cn(
                  "rounded-lg border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground",
                  "transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  errors.email ? "border-destructive" : "border-border"
                )}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Star Rating */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Rating <span className="text-destructive">*</span>
            </label>
            <StarRating
              value={form.rating}
              onChange={(val) => handleChange("rating", val)}
              disabled={isSubmitting}
            />
            {errors.rating && (
              <p className="text-xs text-destructive">{errors.rating}</p>
            )}
          </div>

          {/* Message */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="feedback-message"
              className="text-sm font-medium text-foreground"
            >
              Feedback Message <span className="text-destructive">*</span>
            </label>
            <textarea
              id="feedback-message"
              rows={4}
              placeholder="Tell us what you thought about the comparison results..."
              value={form.message}
              onChange={(e) => handleChange("message", e.target.value)}
              disabled={isSubmitting}
              className={cn(
                "resize-none rounded-lg border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground",
                "transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
                "disabled:cursor-not-allowed disabled:opacity-50",
                errors.message ? "border-destructive" : "border-border"
              )}
            />
            {errors.message && (
              <p className="text-xs text-destructive">{errors.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "mt-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground",
              "transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Feedback"
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
