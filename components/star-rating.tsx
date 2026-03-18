"use client"

import { useCallback, useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

export function StarRating({ value, onChange, disabled = false }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)

  const handleClick = useCallback(
    (rating: number) => {
      if (!disabled) onChange(rating)
    },
    [disabled, onChange]
  )

  return (
    <div className="flex gap-1.5" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= (hovered || value)
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            disabled={disabled}
            className={cn(
              "rounded-md p-1 transition-all duration-200",
              "hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              disabled && "cursor-not-allowed opacity-50"
            )}
            onClick={() => handleClick(star)}
            onMouseEnter={() => !disabled && setHovered(star)}
            onMouseLeave={() => setHovered(0)}
          >
            <Star
              className={cn(
                "h-7 w-7 transition-colors duration-200",
                isActive
                  ? "fill-primary stroke-primary"
                  : "fill-transparent stroke-muted-foreground"
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
