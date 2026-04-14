import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import CompareClient from '@/components/CompareClient'

export default async function ComparePage() {
  const { userId } = auth()

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-950/90 backdrop-blur z-10">
        <Link href="/" className="font-medium text-volt-400 tracking-tight text-sm">
          ⚡ CT Energy Compare
        </Link>
        <div className="flex items-center gap-3">
          {userId && (
            <Link href="/history" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
              Saved comparisons
            </Link>
          )}
          {!userId && (
            <Link href="/sign-in" className="btn-ghost text-xs">
              Sign in to save
            </Link>
          )}
          {userId && <UserButton afterSignOutUrl="/" />}
        </div>
      </nav>

      <main className="flex-1 px-4 sm:px-6 py-8 max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-medium text-slate-100 mb-1">Rate comparison</h1>
          <p className="text-sm text-slate-400">
            Supply charges only — delivery is the same regardless of supplier.
            Data auto-loaded from the OCC monthly fact sheet.
          </p>
        </div>

        <Suspense fallback={<LoadingSkeleton />}>
          <CompareClient isLoggedIn={!!userId} />
        </Suspense>
      </main>

      <footer className="px-6 py-4 border-t border-slate-800 text-xs text-slate-600 text-center">
        Source: <a href="https://portal.ct.gov/occ/electricity" className="hover:text-slate-400 transition-colors">CT Office of Consumer Counsel</a>
        {' · '}PURA Docket 06-10-22
        {' · '}Rates change Jan 1 &amp; Jul 1
      </footer>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-12 bg-slate-800 rounded-xl w-full" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-800 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-slate-800 rounded-xl" />)}
      </div>
    </div>
  )
}
