CREATE TABLE IF NOT EXISTS public.screening_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_name TEXT NOT NULL,
  subject_dob DATE NOT NULL,
  subject_address TEXT,
  subject_ssn TEXT,
  subject_phone TEXT,
  subject_email TEXT,
  risk_level TEXT,
  confidence_score NUMERIC,
  explanation TEXT,
  evidences JSONB,
  is_sanctions_hit BOOLEAN DEFAULT false,
  is_pep_hit BOOLEAN DEFAULT false,
  raw_response JSONB,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_name TEXT,
  review_decision TEXT,
  review_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.screening_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own screening requests"
  ON public.screening_requests
  FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can view own screening requests"
  ON public.screening_requests
  FOR SELECT
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can update own screening requests"
  ON public.screening_requests
  FOR UPDATE
  USING (auth.uid() = reviewer_id);
