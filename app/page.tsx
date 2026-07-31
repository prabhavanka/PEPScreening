import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ScreeningDashboard } from '@/components/screening/screening-dashboard'

export default async function Page() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const userName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split('@')[0] ??
    'Reviewer'

  return (
    <ScreeningDashboard
      userId={user.id}
      userEmail={user.email ?? ''}
      userName={userName}
    />
  )
}
