'use client'

import { motion } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import { ReactNode, useState } from 'react'

interface SwipeNavigationProps {
  children: ReactNode
}

export function SwipeNavigation({ children }: SwipeNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isDragging, setIsDragging] = useState(false)

  // Disable swipe on root page (no history to go back to)
  const isRootPage = pathname === '/'

  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleDragEnd = (_: any, info: any) => {
    setIsDragging(false)

    // Trigger back navigation if dragged >100px OR velocity >500
    if (info.offset.x > 100 || info.velocity.x > 500) {
      router.back()
    }
  }

  if (isRootPage) {
    // No swipe gesture on root page
    return <>{children}</>
  }

  return (
    <motion.div
      drag="x"
      dragDirectionLock={true} // Prevent diagonal dragging
      dragConstraints={{ left: 0, right: 300 }}
      dragElastic={{ left: 0, right: 0.3 }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{
        position: 'relative',
        touchAction: 'pan-y', // Allow vertical scrolling, prevent horizontal
      }}
    >
      {/* Gradient overlay - shows when dragging */}
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-[-1]"
          style={{
            background: 'linear-gradient(to right, rgba(0,0,0,0.1), transparent)',
          }}
        />
      )}

      {children}
    </motion.div>
  )
}
