# Roadmap: Splitwiser

## Overview

Splitwiser is built in 11 phases, progressing from foundation through core splitting functionality to polish. The journey starts with Next.js + Supabase setup, establishes the offline-first data architecture, builds out expense management with tagging and balance calculation, adds settlement capabilities and efficiency features, implements version history for transparency, layers on iOS-native UX patterns, and finishes with analytics and export. Each phase delivers a complete, verifiable capability that builds toward a beautiful, gesture-driven expense splitting PWA.

## Domain Expertise

None

## Phases

- [x] **Phase 1: Foundation & Setup** - Project structure, Next.js + Supabase configuration, PWA basics (Completed: 2026-02-06)
- [x] **Phase 2: Authentication & User Model** - Supabase auth, hybrid account system, user profiles (Completed: 2026-02-06)
- [x] **Phase 3: Data Model & Offline Foundation** - Database schema, local storage, sync architecture (Completed: 2026-02-06)
- [x] **Phase 4: Core Expense Creation** - Add expenses, participants, splitting methods (Completed: 2026-02-06)
- [x] **Phase 5: Tagging & Organization** - Tag system, filtering, smart suggestions (Complete)
- [x] **Phase 6: Balance Calculation Engine** - Global balances, debt simplification, multi-currency (Complete)
- [ ] **Phase 7: Settlement & Payments** - Record settlements (global, tag-specific, partial)
- [ ] **Phase 8: Templates & Efficiency Features** - Predefined split templates, quick-apply
- [ ] **Phase 9: Version History & Undo** - Expense edit tracking, undo capability, activity feed
- [ ] **Phase 10: iOS-Native UX Layer** - Bottom tabs, sheet modals, gestures, transitions, dark mode
- [ ] **Phase 11: Analytics, Export & Categories** - Spending charts, CSV export, category management

## Phase Details

### Phase 1: Foundation & Setup
**Goal**: Establish Next.js project with Supabase integration, basic PWA configuration, and development environment
**Status**: Complete (2026-02-06)
**Depends on**: Nothing (first phase)
**Plans**: 5 plans (all complete)

Plans:
- [x] 01-01: Initialize Next.js 15 project with TypeScript, Tailwind, and iOS design tokens
- [x] 01-02: Setup Supabase SSR client with browser/server utilities
- [x] 01-03: Configure PWA manifest, service worker, and app icons
- [x] 01-04: Setup Framer Motion with page transitions and bottom navigation
- [x] 01-05: Verify safe area padding for iOS notched devices

**Execution**: Parallel (3 waves, max 3 concurrent agents)
**Wall clock time**: ~6 minutes

### Phase 2: Authentication & User Model
**Goal**: Implement Supabase authentication with hybrid account model supporting both registered users and named participants
**Depends on**: Phase 1
**Research**: Likely (architectural decision on hybrid model)
**Research topics**: Supabase Auth patterns, magic link implementation, anonymous/guest user patterns, email/SMS invite link generation
**Plans**: 5-6 plans

Plans:
- [ ] 02-01: Setup Supabase Auth with email magic links
- [ ] 02-02: Create user profile schema and CRUD operations
- [ ] 02-03: Implement participant model for non-registered users
- [ ] 02-04: Build email/SMS invite link system
- [ ] 02-05: Create account claiming flow (non-user becomes user)
- [ ] 02-06: Setup authentication context and protected routes

### Phase 3: Data Model & Offline Foundation
**Goal**: Design and implement database schema for expenses, participants, tags, and balances with offline-first architecture
**Status**: Complete (2026-02-06)
**Depends on**: Phase 2
**Plans**: 8 plans (all complete)

Plans:
- [x] 03-01: Design database schema (expenses, participants, splits, tags, settlements)
- [x] 03-02: Create Supabase migrations and RLS policies
- [x] 03-03: Implement IndexedDB wrapper for local storage
- [x] 03-04: Setup offline queue for pending operations
- [x] 03-05: Create sync engine with conflict resolution
- [x] 03-06: Implement optimistic updates for immediate UI feedback
- [x] 03-07: Setup Supabase realtime subscriptions for live updates
- [x] 03-08: Add connection status detection and sync indicators

**Execution**: Parallel (6 waves, max 3 concurrent agents)
**Wall clock time**: ~21 minutes

### Phase 4: Core Expense Creation ✓
**Goal**: Build expense creation flow with participant selection, multiple splitting methods (equal, percentage, shares)
**Depends on**: Phase 3
**Research**: None required
**Plans**: 7 plans
**Status**: Complete (2026-02-06)

Plans:
- [x] 04-01: Create expense form with amount, description, date, category fields
- [x] 04-02: Implement participant picker with smart suggestions
- [x] 04-03: Build split equally functionality
- [x] 04-04: Build split by percentage functionality
- [x] 04-05: Build split by shares/weights functionality
- [x] 04-06: Integrate participant picker and all split methods into complete flow
- [x] 04-07: Implement expense list view with filtering and detail view with edit

**Execution**: Parallel (3 waves, max 3 concurrent agents)
**Wall clock time**: ~15 minutes
**Wave structure**:
- Wave 1: 04-01, 04-02, 04-03, 04-04, 04-05 (independent, 5 parallel)
- Wave 2: 04-06 (depends on 04-01, 04-02, 04-03)
- Wave 3: 04-07 (depends on 04-01, 04-06)

### Phase 5: Tagging & Organization
**Goal**: Implement tag system for organizing expenses with filtering and context-aware suggestions
**Depends on**: Phase 4
**Research**: Unlikely (internal feature using existing data model)
**Plans**: 6 plans

Plans:
- [x] 05-01: Create tag input component with autocomplete
- [x] 05-02: Implement tag filtering on expense list
- [x] 05-03: Build smart participant suggestions based on tag history
- [ ] 05-04: Add tag management (rename, delete, merge)
- [ ] 05-05: Create tag-based expense summary views
- [ ] 05-06: Additional tagging features (if needed)

### Phase 6: Balance Calculation Engine
**Goal**: Calculate global balances per person, implement debt simplification toggle, and multi-currency conversion
**Status**: Complete (2026-02-06)
**Depends on**: Phase 4
**Research**: Likely (debt simplification algorithm, currency API integration)
**Research topics**: Debt simplification algorithms (minimize transaction count), free currency exchange rate APIs (exchangerate-api.com, ECB), currency conversion patterns
**Plans**: 8 plans (all complete)
**Execution**: Parallel (4 waves, ~28 min wall-clock time)

Plans:
- [x] 06-01: Implement balance calculation across all expenses per person
- [x] 06-02: Build debt simplification algorithm (minimize transactions)
- [x] 06-03: Create balance view toggle (simplified vs direct)
- [x] 06-04: Integrate currency exchange rate API with caching
- [x] 06-05: Implement multi-currency balance view toggle (AUD, EUR, USD, etc.)
- [x] 06-06: Add manual exchange rate override per expense
- [x] 06-07: Create balance summary screen showing who owes whom
- [x] 06-08: Implement currency auto-detection by location

### Phase 7: Settlement & Payments
**Goal**: Record settlements with flexible options (global, tag-specific, partial amounts)
**Depends on**: Phase 6
**Research**: Unlikely (internal feature extending balance calculations)
**Plans**: 4-5 plans

Plans:
- [ ] 07-01: Create settlement form (select person, amount, settlement type)
- [ ] 07-02: Implement global settlement (zero out all balances with person)
- [ ] 07-03: Implement tag-specific settlement (settle just one context)
- [ ] 07-04: Implement partial amount settlement (flexible payment recording)
- [ ] 07-05: Add settlement history view and edit/delete capability

### Phase 8: Templates & Efficiency Features
**Goal**: Build predefined split templates with participants and weights for quick expense entry
**Depends on**: Phase 4, Phase 5
**Research**: Unlikely (internal feature combining existing patterns)
**Plans**: 3-4 plans

Plans:
- [ ] 08-01: Create template schema and CRUD operations
- [ ] 08-02: Build template creation form (name, participants, split config)
- [ ] 08-03: Implement quick-apply template to new expense
- [ ] 08-04: Add template management screen (edit, delete, duplicate)

### Phase 9: Version History & Undo
**Goal**: Track all expense modifications with full version history and implement undo capability
**Depends on**: Phase 4
**Research**: Unlikely (established audit log patterns)
**Plans**: 5-6 plans

Plans:
- [ ] 09-01: Design version history schema (who, what, when for all changes)
- [ ] 09-02: Implement change tracking on all expense operations
- [ ] 09-03: Create version history view per expense
- [ ] 09-04: Build undo system with undo stack
- [ ] 09-05: Implement activity feed showing all modifications
- [ ] 09-06: Add push notifications for expense changes (PWA)

### Phase 10: iOS-Native UX Layer
**Goal**: Implement iOS-native UI patterns (bottom tabs, sheet modals, gestures, transitions, dark mode)
**Depends on**: Phase 4, Phase 6, Phase 7 (core features must exist to wrap with UX)
**Research**: Unlikely (design implementation following established iOS patterns)
**Plans**: 7-9 plans

Plans:
- [ ] 10-01: Create bottom tab navigation component
- [ ] 10-02: Build sheet modal component with drag-to-dismiss
- [ ] 10-03: Implement Framer Motion page transitions
- [ ] 10-04: Add swipe-back gesture navigation
- [ ] 10-05: Create iOS-style list rows with chevrons
- [ ] 10-06: Implement -apple-system font stack
- [ ] 10-07: Setup light/dark mode with prefers-color-scheme
- [ ] 10-08: Add safe area insets for all screens
- [ ] 10-09: Polish animations and micro-interactions

### Phase 11: Analytics, Export & Categories
**Goal**: Build spending analytics, CSV export, and category management (predefined + custom)
**Depends on**: Phase 4
**Research**: Unlikely (data visualization and export, standard patterns)
**Plans**: 5-7 plans

Plans:
- [ ] 11-01: Create category management (predefined list + custom)
- [ ] 11-02: Build spending by category chart (pie/bar)
- [ ] 11-03: Build per-person spending breakdown chart
- [ ] 11-04: Implement CSV export of expenses and balances
- [ ] 11-05: Create analytics dashboard screen
- [ ] 11-06: Add date range filtering for analytics
- [ ] 11-07: Implement category-based default split templates

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Setup | 5/5 | Complete | 2026-02-06 |
| 2. Authentication & User Model | 6/6 | Complete | 2026-02-06 |
| 3. Data Model & Offline Foundation | 8/8 | Complete | 2026-02-06 |
| 4. Core Expense Creation | 7/7 | Complete | 2026-02-06 |
| 5. Tagging & Organization | 3/6 | In progress | - |
| 6. Balance Calculation Engine | 0/8 | Not started | - |
| 7. Settlement & Payments | 0/5 | Not started | - |
| 8. Templates & Efficiency Features | 0/4 | Not started | - |
| 9. Version History & Undo | 0/6 | Not started | - |
| 10. iOS-Native UX Layer | 0/9 | Not started | - |
| 11. Analytics, Export & Categories | 0/7 | Not started | - |
