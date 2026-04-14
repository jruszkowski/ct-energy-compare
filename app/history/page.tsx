import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { supabaseAdmin } from '@/lib/supabase'
import HistoryClient from '@/components/HistoryClient'

export default async function HistoryPage() {
  const { userId } = auth()
  if (!userId) redirect('/sign-in')

  const { data: comparisons } = await supabaseAdmin
    .from('saved_comparisons')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-950/90 backdrop-blur z-10">
        <Link href="/" className="font-medium text-volt-400 tracking-tight text-sm">
          ⚡ CT Energy Compare
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/compare" className="btn-primary text-xs">Compare rates</Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      <main className="flex-1 px-4 sm:px-6 py-8 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-medium text-slate-100 mb-1">Saved comparisons</h1>
          <p className="text-sm text-slate-400">Your rate snapshots over time.</p>
        </div>

        <HistoryClient initialComparisons={comparisons ?? []} />
      </main>
    </div>
  )
}
