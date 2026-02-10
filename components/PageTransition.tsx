'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 15, // Reduced from 20 for snappier exit animation (complements swipe gesture)
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
