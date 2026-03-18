"use client"

import { ArrowRight, Building2, Key, Loader2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CompanyComparisonFormProps {
  onSubmit: (data: {
    company1: string
    company2: string
    apiKey: string
  }) => void
  isLoading: boolean
}

export function CompanyComparisonForm({
  onSubmit,
  isLoading,
}: CompanyComparisonFormProps) {
  const [company1, setCompany1] = useState("")
  const [company2, setCompany2] = useState("")
  const [apiKey, setApiKey] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!company1.trim() || !company2.trim() || !apiKey.trim()) return
    console.log("[v0] Form submitted with:", {
      company1: company1.trim(),
      company2: company2.trim(),
      apiKeyLength: apiKey.trim().length,
    })
    onSubmit({
      company1: company1.trim(),
      company2: company2.trim(),
      apiKey: apiKey.trim(),
    })
  }

  const isValid = company1.trim() && company2.trim() && apiKey.trim()

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="company1"
            className="flex items-center gap-2 text-muted-foreground"
          >
            <Building2 className="size-4" />
            Company 1
          </Label>
          <Input
            id="company1"
            placeholder="e.g., Apple"
            value={company1}
            onChange={(e) => setCompany1(e.target.value)}
            disabled={isLoading}
            className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/30"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="company2"
            className="flex items-center gap-2 text-muted-foreground"
          >
            <Building2 className="size-4" />
            Company 2
          </Label>
          <Input
            id="company2"
            placeholder="e.g., Microsoft"
            value={company2}
            onChange={(e) => setCompany2(e.target.value)}
            disabled={isLoading}
            className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/30"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="apiKey"
          className="flex items-center gap-2 text-muted-foreground"
        >
          <Key className="size-4" />
          OpenAI API Key
        </Label>
        <Input
          id="apiKey"
          type="password"
          placeholder="sk-..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          disabled={isLoading}
          className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/30"
        />
        <p className="text-xs text-muted-foreground">
          Your key is used directly in your browser and never stored or sent to
          our servers.
        </p>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={!isValid || isLoading}
        className="h-12 w-full cursor-pointer text-base font-semibold transition-all duration-300"
      >
        {isLoading ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            Compare
            <ArrowRight className="size-5" />
          </>
        )}
      </Button>
    </form>
  )
}
