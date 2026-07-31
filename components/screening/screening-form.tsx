'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ScreeningSubject } from '@/lib/types'
import { useState, useCallback } from 'react'

interface ScreeningFormProps {
  onSubmit: (subject: ScreeningSubject) => void
  isLoading: boolean
}

export function ScreeningForm({ onSubmit, isLoading }: ScreeningFormProps) {
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [address, setAddress] = useState('')
  const [ssn, setSsn] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [screenSanctions, setScreenSanctions] = useState(false)
  const [screenPep, setScreenPep] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'Full name is required'
    if (!dob) newErrors.dob = 'Date of birth is required'
    if (!screenSanctions && !screenPep) {
      newErrors.screeningType = 'Select at least one screening type'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [name, dob, screenSanctions, screenPep])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!validate()) return
      onSubmit({
        name: name.trim(),
        dob,
        address: address.trim() || undefined,
        ssn: ssn.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        screenSanctions,
        screenPep,
      })
    },
    [name, dob, address, ssn, phone, email, screenSanctions, screenPep, validate, onSubmit]
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Subject Identity</CardTitle>
        <CardDescription>
          Enter the details of the individual to screen against sanctions and PEP databases
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Name - Required */}
            <div className="grid gap-1.5">
              <Label htmlFor="subject-name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="subject-name"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            {/* DOB - Required */}
            <div className="grid gap-1.5">
              <Label htmlFor="subject-dob">
                Date of Birth <span className="text-destructive">*</span>
              </Label>
              <Input
                id="subject-dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                aria-invalid={!!errors.dob}
              />
              {errors.dob && (
                <p className="text-xs text-destructive">{errors.dob}</p>
              )}
            </div>

            {/* Address - Optional */}
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="subject-address">Address</Label>
              <Input
                id="subject-address"
                placeholder="123 Main St, City, Country"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {/* SSN - Optional */}
            <div className="grid gap-1.5">
              <Label htmlFor="subject-ssn">SSN / National ID</Label>
              <Input
                id="subject-ssn"
                placeholder="XXX-XX-XXXX"
                value={ssn}
                onChange={(e) => setSsn(e.target.value)}
              />
            </div>

            {/* Phone - Optional */}
            <div className="grid gap-1.5">
              <Label htmlFor="subject-phone">Phone</Label>
              <Input
                id="subject-phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {/* Email - Optional */}
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="subject-email">Email</Label>
              <Input
                id="subject-email"
                type="email"
                placeholder="john.doe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Screening Type Selection */}
          <div className="flex flex-col gap-3">
            <Label className="text-sm font-medium">
              Screening Type <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="screen-sanctions"
                  checked={screenSanctions}
                  onCheckedChange={(checked) => setScreenSanctions(checked === true)}
                  aria-invalid={!!errors.screeningType}
                />
                <Label
                  htmlFor="screen-sanctions"
                  className="text-sm font-normal cursor-pointer"
                >
                  Sanctions Screening
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="screen-pep"
                  checked={screenPep}
                  onCheckedChange={(checked) => setScreenPep(checked === true)}
                  aria-invalid={!!errors.screeningType}
                />
                <Label
                  htmlFor="screen-pep"
                  className="text-sm font-normal cursor-pointer"
                >
                  PEP Screening
                </Label>
              </div>
            </div>
            {errors.screeningType && (
              <p className="text-xs text-destructive">{errors.screeningType}</p>
            )}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto sm:self-end">
            {isLoading ? (
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
                Screening...
              </span>
            ) : (
              'Run Screening'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
