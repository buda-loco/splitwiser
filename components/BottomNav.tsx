'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Receipt, Scale, CheckCircle, Settings } from 'lucide-react'

const tabs = [
  { id: 'expenses', label: 'Expenses', path: '/', icon: Receipt },
  { id: 'balances', label: 'Balances', path: '/balances', icon: Scale },
  { id: 'settlements', label: 'Settlements', path: '/settlements', icon: CheckCircle },
  { id: 'settings', label: 'Settings', path: '/settings', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 pb-safe-bottom bg-white/80 dark:bg-black/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 shadow-[inset_0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
        {tabs.map((tab) => {
          const isActive = pathname === tab.path
          const IconComponent = tab.icon
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
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <motion.span
                  className="mb-1"
                  animate={isActive ? { y: -2 } : { y: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                >
                  <IconComponent
                    className={`w-5 h-5 ${
                      isActive ? 'text-ios-blue' : 'text-ios-gray'
                    }`}
                  />
                </motion.span>
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
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-ios-blue rounded-full shadow-[0_0_8px_rgba(0,122,255,0.5)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
