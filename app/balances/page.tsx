import { PageTransition } from '@/components/PageTransition'

export default function BalancesPage() {
  return (
    <PageTransition>
      <main className="min-h-screen pt-safe-top pb-safe-bottom px-4">
        <div className="max-w-md mx-auto pt-16">
          <h1 className="text-3xl font-bold text-ios-blue mb-4">
            Balances
          </h1>
          <p className="text-ios-gray">
            Balance calculations coming in Phase 6
          </p>
        </div>
      </main>
    </PageTransition>
  )
}
