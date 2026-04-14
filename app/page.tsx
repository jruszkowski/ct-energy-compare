import Link from 'next/link'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <span className="font-medium text-volt-400 tracking-tight">⚡ CT Energy Compare</span>
        <div className="flex items-center gap-3">
          <SignedOut>
            <Link href="/sign-in" className="btn-ghost">Sign in</Link>
            <Link href="/sign-up" className="btn-primary">Get started</Link>
          </SignedOut>
          <SignedIn>
            <Link href="/compare" className="btn-primary">Open app</Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-24">
        <div className="inline-flex items-center gap-2 text-xs text-volt-400 bg-volt-500/10 border border-volt-500/20 rounded-full px-3 py-1 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-volt-400 animate-pulse"></span>
          Data from OCC monthly fact sheets · PURA Docket 06-10-22
        </div>

        <h1 className="text-5xl sm:text-6xl font-medium tracking-tight mb-6 max-w-3xl leading-tight">
          Stop overpaying for<br />
          <span className="text-volt-400">Connecticut electricity</span>
        </h1>

        <p className="text-slate-400 text-lg max-w-xl mb-10 leading-relaxed">
          Compare Eversource and UI standard service rates against every licensed third-party supplier.
          See who&apos;s cheapest over your contract term — updated automatically from official state data.
        </p>

        <div className="flex items-center gap-4 flex-wrap justify-center">
          <Link href="/sign-up" className="btn-primary text-base px-6 py-3">
            Compare rates free →
          </Link>
          <Link href="/compare" className="btn-ghost text-base px-6 py-3">
            Try without account
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl w-full">
          {[
            { stat: '$205M+', label: 'Overpaid by CT supplier customers since 2015', src: 'OCC data' },
            { stat: '~18%', label: 'Of CT customers currently on a third-party supplier', src: 'OCC April 2025' },
            { stat: '2×/yr', label: 'Standard service rates reset — Jan 1 and Jul 1', src: 'PURA' },
          ].map(item => (
            <div key={item.stat} className="card p-5 text-left">
              <p className="text-2xl font-medium text-volt-400 mb-1">{item.stat}</p>
              <p className="text-sm text-slate-400 leading-snug">{item.label}</p>
              <p className="text-xs text-slate-600 mt-2">{item.src}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="px-6 py-6 border-t border-slate-800 text-center text-xs text-slate-600">
        Data sourced from <a href="https://portal.ct.gov/occ/electricity" className="text-slate-500 hover:text-slate-400">CT Office of Consumer Counsel</a> and{' '}
        <a href="https://www.energizect.com/rate-board/compare-energy-supplier-rates" className="text-slate-500 hover:text-slate-400">EnergizeCT</a>.
        Not affiliated with PURA, OCC, Eversource, or UI.
      </footer>
    </div>
  )
}
