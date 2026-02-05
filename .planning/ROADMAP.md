# Roadmap: Splitwiser

## Overview

Splitwiser is built in 11 phases, progressing from foundation through core splitting functionality to polish. The journey starts with Next.js + Supabase setup, establishes the offline-first data architecture, builds out expense management with tagging and balance calculation, adds settlement capabilities and efficiency features, implements version history for transparency, layers on iOS-native UX patterns, and finishes with analytics and export. Each phase delivers a complete, verifiable capability that builds toward a beautiful, gesture-driven expense splitting PWA.

## Domain Expertise

None

## Phases

- [ ] **Phase 1: Foundation & Setup** - Project structure, Next.js + Supabase configuration, PWA basics
- [ ] **Phase 2: Authentication & User Model** - Supabase auth, hybrid account system, user profiles
- [ ] **Phase 3: Data Model & Offline Foundation** - Database schema, local storage, sync architecture
- [ ] **Phase 4: Core Expense Creation** - Add expenses, participants, splitting methods
- [ ] **Phase 5: Tagging & Organization** - Tag system, filtering, smart suggestions
- [ ] **Phase 6: Balance Calculation Engine** - Global balances, debt simplification, multi-currency
- [ ] **Phase 7: Settlement & Payments** - Record settlements (global, tag-specific, partial)
- [ ] **Phase 8: Templates & Efficiency Features** - Predefined split templates, quick-apply
- [ ] **Phase 9: Version History & Undo** - Expense edit tracking, undo capability, activity feed
- [ ] **Phase 10: iOS-Native UX Layer** - Bottom tabs, sheet modals, gestures, transitions, dark mode
- [ ] **Phase 11: Analytics, Export & Categories** - Spending charts, CSV export, category management

## Phase Details

### Phase 1: Foundation & Setup
**Goal**: Establish Next.js project with Supabase integration, basic PWA configuration, and development environment
**Depends on**: Nothing (first phase)
**Research**: Likely (new project setup, multiple integrations)
**Research topics**: Next.js 14+ app router setup, Supabase client configuration, PWA manifest and service worker patterns, Tailwind + Framer Motion integration
**Plans**: 5-7 plans

Plans:
- [ ] 01-01: Initialize Next.js project with TypeScript and app router
- [ ] 01-02: Configure Tailwind CSS with iOS design tokens
- [ ] 01-03: Setup Supabase client and environment configuration
- [ ] 01-04: Create PWA manifest with app icons and splash screens
- [ ] 01-05: Implement basic service worker for offline capability
- [ ] 01-06: Setup Framer Motion and create base layout structure
- [ ] 01-07: Configure safe area padding for notched devices

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
**Depends on**: Phase 2
**Research**: Likely (offline sync patterns, conflict resolution)
**Research topics**: Supabase realtime subscriptions, IndexedDB patterns for offline storage, conflict resolution strategies, optimistic updates
**Plans**: 6-8 plans

Plans:
- [ ] 03-01: Design database schema (expenses, participants, splits, tags, settlements)
- [ ] 03-02: Create Supabase migrations and RLS policies
- [ ] 03-03: Implement IndexedDB wrapper for local storage
- [ ] 03-04: Setup offline queue for pending operations
- [ ] 03-05: Create sync engine with conflict resolution
- [ ] 03-06: Implement optimistic updates for immediate UI feedback
- [ ] 03-07: Setup Supabase realtime subscriptions for live updates
- [ ] 03-08: Add connection status detection and sync indicators

### Phase 4: Core Expense Creation
**Goal**: Build expense creation flow with participant selection, multiple splitting methods (equal, percentage, shares)
**Depends on**: Phase 3
**Research**: Unlikely (internal CRUD with established patterns from Phase 3)
**Plans**: 5-7 plans

Plans:
- [ ] 04-01: Create expense form with amount, description, date, category fields
- [ ] 04-02: Implement participant picker with smart suggestions
- [ ] 04-03: Build split equally functionality
- [ ] 04-04: Build split by percentage functionality
- [ ] 04-05: Build split by shares/weights functionality
- [ ] 04-06: Create expense list view with filtering
- [ ] 04-07: Implement expense detail view and edit capability

### Phase 5: Tagging & Organization
**Goal**: Implement tag system for organizing expenses with filtering and context-aware suggestions
**Depends on**: Phase 4
**Research**: Unlikely (internal feature using existing data model)
**Plans**: 3-5 plans

Plans:
- [ ] 05-01: Create tag input component with autocomplete
- [ ] 05-02: Implement tag filtering on expense list
- [ ] 05-03: Build smart participant suggestions based on tag history
- [ ] 05-04: Add tag management (rename, delete, merge)
- [ ] 05-05: Create tag-based expense summary views

### Phase 6: Balance Calculation Engine
**Goal**: Calculate global balances per person, implement debt simplification toggle, and multi-currency conversion
**Depends on**: Phase 4
**Research**: Likely (debt simplification algorithm, currency API integration)
**Research topics**: Debt simplification algorithms (minimize transaction count), free currency exchange rate APIs (exchangerate-api.com, ECB), currency conversion patterns
**Plans**: 6-8 plans

Plans:
- [ ] 06-01: Implement balance calculation across all expenses per person
- [ ] 06-02: Build debt simplification algorithm (minimize transactions)
- [ ] 06-03: Create balance view toggle (simplified vs direct)
- [ ] 06-04: Integrate currency exchange rate API with caching
- [ ] 06-05: Implement multi-currency balance view toggle (AUD, EUR, USD, etc.)
- [ ] 06-06: Add manual exchange rate override per expense
- [ ] 06-07: Create balance summary screen showing who owes whom
- [ ] 06-08: Implement currency auto-detection by location

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
| 1. Foundation & Setup | 0/7 | Not started | - |
| 2. Authentication & User Model | 0/6 | Not started | - |
| 3. Data Model & Offline Foundation | 0/8 | Not started | - |
| 4. Core Expense Creation | 0/7 | Not started | - |
| 5. Tagging & Organization | 0/5 | Not started | - |
| 6. Balance Calculation Engine | 0/8 | Not started | - |
| 7. Settlement & Payments | 0/5 | Not started | - |
| 8. Templates & Efficiency Features | 0/4 | Not started | - |
| 9. Version History & Undo | 0/6 | Not started | - |
| 10. iOS-Native UX Layer | 0/9 | Not started | - |
| 11. Analytics, Export & Categories | 0/7 | Not started | - |
