'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ReactNode } from 'react';

interface ListRowProps {
  title: string;
  subtitle?: string | ReactNode;
  value?: string | ReactNode;
  leftIcon?: ReactNode;
  showChevron?: boolean;
  onClick?: () => void;
  href?: string;
  className?: string;
}

export function ListRow({
  title,
  subtitle,
  value,
  leftIcon,
  showChevron = false,
  onClick,
  href,
  className = '',
}: ListRowProps) {
  const isInteractive = !!onClick || !!href;

  const content = (
    <div
      className={`
        flex items-center justify-between gap-3
        px-4 py-3
        bg-white dark:bg-gray-800
        border-b border-gray-200 dark:border-gray-700
        ${isInteractive ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Left section: icon + title/subtitle */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {leftIcon && <div className="flex-shrink-0">{leftIcon}</div>}

        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
            {title}
          </span>
          {subtitle && (
            <div className="text-sm text-ios-gray dark:text-gray-400">
              {typeof subtitle === 'string' ? (
                <span className="truncate">{subtitle}</span>
              ) : (
                subtitle
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right section: value + chevron */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {value && (
          <div className="text-gray-900 dark:text-gray-100">
            {typeof value === 'string' ? (
              <span className="font-medium">{value}</span>
            ) : (
              value
            )}
          </div>
        )}
        {showChevron && (
          <span className="text-xl text-ios-gray dark:text-gray-400">›</span>
        )}
      </div>
    </div>
  );

  // Wrap with Link if href provided
  if (href) {
    return (
      <Link href={href} className="block">
        <motion.div
          whileTap={{ scale: 0.98, opacity: 0.7 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          {content}
        </motion.div>
      </Link>
    );
  }

  // Wrap with motion.div if onClick provided
  if (onClick) {
    return (
      <motion.div
        whileTap={{ scale: 0.98, opacity: 0.7 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        onClick={onClick}
      >
        {content}
      </motion.div>
    );
  }

  // Return plain content if no interaction
  return content;
}
