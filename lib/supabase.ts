import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type SavedComparison = {
  id: string
  user_id: string
  created_at: string
  utility: 'eversource' | 'ui'
  monthly_usage: number
  horizon_months: number
  selected_supplier: string
  selected_rate: number
  std_rate: number
  monthly_savings: number
  projected_savings: number
  occ_pub_date: string | null
  note: string | null
}

export type UserPrefs = {
  user_id: string
  utility: 'eversource' | 'ui'
  monthly_usage: number
  horizon_months: number
  alert_on_rate_change: boolean
}
