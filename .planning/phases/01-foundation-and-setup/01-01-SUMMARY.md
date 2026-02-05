---
phase: 01-foundation-and-setup
plan: 01
completed: 2026-02-06
subsystem: foundation
requires: []
provides: [next-js-15, typescript, tailwind-css, ios-design-tokens]
affects: [01-02, 01-03, 01-04, 01-05]
tags: [setup, next-js, tailwind, ios]
key-decisions:
  - "Next.js 15 with App Router as foundation"
  - "Tailwind native env() for safe areas (not plugin)"
  - "iOS design tokens in theme.extend for consistency"
key-files:
  - tailwind.config.ts
  - app/layout.tsx
  - app/globals.css
tech-stack:
  added: [next-js-15, typescript, tailwind-css]
  patterns: [app-router, ios-viewport-config, safe-area-utilities]
---

# Phase 1 Plan 1: Next.js Foundation with iOS Design Tokens

**Next.js 15 project initialized with TypeScript, Tailwind CSS, and iOS-native styling foundation.**

## Accomplishments

- Initialized Next.js 15 project with App Router and TypeScript
- Configured Tailwind CSS with iOS design tokens (colors, fonts, spacing)
- Added safe area utilities using native env() approach
- Created minimal iOS-styled layout demonstrating design system
- Established viewport configuration for native iOS feel

## Files Created/Modified

- `package.json` - Next.js 15, React 19 RC, Tailwind dependencies
- `next.config.ts` - TypeScript Next.js configuration
- `tailwind.config.ts` - iOS design tokens (colors, fonts, safe areas)
- `app/layout.tsx` - Root layout with iOS viewport and metadata
- `app/page.tsx` - Minimal welcome screen demonstrating iOS styling
- `app/globals.css` - Base styles with dark mode support
- `tsconfig.json` - TypeScript configuration with strict mode
- `postcss.config.mjs` - PostCSS with Tailwind and Autoprefixer
- `.eslintrc.json` - ESLint configuration for Next.js
- `.gitignore` - Standard Next.js ignore patterns

## Decisions Made

**Next.js 15 with App Router**: Latest stable version with React 19 RC support. App Router is the current standard, required for Server Components and modern patterns.

**Native env() for safe areas**: Using CSS `env(safe-area-inset-*)` directly in Tailwind config instead of tailwindcss-safe-area plugin. Provides better control and one less dependency.

**iOS design tokens in theme.extend**: Colors, typography, and spacing follow Apple Human Interface Guidelines. Creates consistent native feel across all components.

**Manual project initialization**: Due to npm naming restrictions with capital letters in directory name, manually created Next.js structure with correct package name "splitwiser".

## Issues Encountered

**Directory naming issue**: `npx create-next-app` failed due to capital letters in directory name "Splitwiser". Resolved by manually creating all necessary files with lowercase package name "splitwiser" while keeping directory structure intact.

## Verification Results

- ✓ `npm run dev` starts without errors
- ✓ `npm run build` completes successfully (production build)
- ✓ `npm run lint` passes with no warnings or errors
- ✓ App displays at localhost:3000 with iOS-styled content
- ✓ Tailwind classes compile (no CSS errors in console)
- ✓ iOS color classes work (text-ios-blue renders #007AFF)
- ✓ Safe area padding classes exist (pt-safe-top available)
- ✓ Dark mode CSS is present (@media prefers-color-scheme: dark)

## Next Phase Readiness

**Ready for parallel execution:**
- Plan 01-02 (Supabase) - Can proceed independently
- Plan 01-03 (PWA) - Can proceed independently
- Plan 01-04 (Framer Motion) - Can proceed independently

**Sequential dependency:**
- Plan 01-05 (Safe area padding) - Depends on Plan 01-04 (base layout structure)

## Next Step

Multiple plans ready for parallel execution. Run `/gsd:execute-phase 1` to execute all remaining plans with intelligent parallelization.
