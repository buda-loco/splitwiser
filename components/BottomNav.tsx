'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const tabs = [
  { id: 'expenses', label: 'Expenses', path: '/', icon: '💸' },
  { id: 'balances', label: 'Balances', path: '/balances', icon: '💰' },
  { id: 'settlements', label: 'Settlements', path: '/settlements', icon: '✅' },
  { id: 'settings', label: 'Settings', path: '/settings', icon: '⚙️' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 pb-safe-bottom bg-white/80 dark:bg-black/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
        {tabs.map((tab) => {
          const isActive = pathname === tab.path
          return (
            <Link
              key={tab.id}
              href={tab.path}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              className="flex flex-col items-center justify-center flex-1 relative"
            >
              <motion.div
                className="flex flex-col items-center"
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <span className="text-2xl mb-1">{tab.icon}</span>
                <span
                  className={`text-xs ${
                    isActive ? 'text-ios-blue font-semibold' : 'text-ios-gray'
                  }`}
                >
                  {tab.label}
                </span>
              </motion.div>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-ios-blue rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
