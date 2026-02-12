# Splitwiser - Developer Guide

> **Beautiful iOS-native expense splitting PWA built with Next.js, Supabase, and offline-first architecture**

This document provides context for AI assistants (Claude, etc.) working on the Splitwiser codebase.

## Table of Contents
- [What This App Does](#what-this-app-does)
- [Tech Stack](#tech-stack)
- [Architecture Patterns](#architecture-patterns)
- [Key Features Implemented](#key-features-implemented)
- [Codebase Structure](#codebase-structure)
- [Development Workflow](#development-workflow)
- [Important Constraints](#important-constraints)

---

## What This App Does

Splitwiser is a **mobile-first expense splitting PWA** that helps friend groups track shared expenses with a beautiful, gesture-driven iOS-native interface. It's designed as a modern alternative to Splitwise with:

- **Generous free tier** - No ads, no limits
- **Tag-based organization** - Solves cross-group settlement issues
- **Offline-first architecture** - Works without internet, syncs when connected
- **Complete audit trail** - Every change versioned, nothing silently deleted
- **iOS-native UX** - Smooth animations, gestures, and polished interactions

### Core User Flows
1. **Create expense** → Add participants → Choose split method → Save (works offline)
2. **View balances** → See who owes whom → Settle debts → Record settlement
3. **Tag expenses** → Filter by tags → View tag-specific balances
4. **Create templates** → Quick-apply to new expenses → Save time on recurring splits
5. **Undo changes** → View version history → Restore previous states

---

## Tech Stack

### Frontend
- **Next.js 15** - App Router, React Server Components, TypeScript
- **Tailwind CSS** - iOS design tokens, dark mode support
- **Framer Motion** - Page transitions, gestures, animations
- **Lucide React** - Professional SVG icon library (NO emojis)

### Backend & Data
- **Supabase** - PostgreSQL database, Row Level Security (RLS), Realtime subscriptions
- **IndexedDB** - Offline storage via custom wrapper with Promise-based API
- **Service Worker** - PWA offline capabilities

### Key Libraries
- `framer-motion` (12.33.0) - Animations and gesture handling
- `lucide-react` - Icon system
- `@supabase/supabase-js` - Database client
- `decimal.js` - Precise decimal calculations for money

---

## Architecture Patterns

### 1. Offline-First Data Flow
```
User Action → Optimistic Update (IndexedDB) → UI Update → Background Sync → Supabase → Realtime Push → Other Devices
```

**Key Pattern**: All mutations go through `useOptimisticMutation` hook:
- Instantly updates local IndexedDB
- Returns success immediately to UI
- Queues operation for background sync
- Handles conflicts via last-write-wins

### 2. Hybrid Account Model
- **Users**: Registered accounts with `user_id` (from Supabase Auth)
- **Participants**: Non-registered people tracked by `participant_id`
- **Claim Flow**: Participants can claim accounts via invite links

### 3. Balance Calculation
- **Direct View**: Shows actual expense relationships
- **Simplified View**: Minimizes transactions using greedy algorithm
- **Multi-Currency**: Converts all balances to selected target currency

### 4. Version Tracking
Every expense change creates an `expense_version` record with:
- `change_type`: created | updated | deleted | restored
- `before`: Previous state (JSON)
- `after`: New state (JSON)
- `changed_by_user_id`: Who made the change

### 5. Tag System
- Tags are organizational labels (#bali-trip, #groceries)
- Balances are **global per person**, not per tag
- Tag filtering affects view, not underlying debt relationships

---

## Key Features Implemented

### ✅ Phase 1: Foundation (5 plans)
- Next.js 15 app with App Router
- iOS design tokens (colors, typography, safe areas)
- PWA manifest and service worker
- Framer Motion page transitions
- Bottom tab navigation

### ✅ Phase 2: Authentication (6 plans)
- Magic link passwordless auth
- User profiles (name, avatar, currency preference)
- Protected routes with middleware
- Invite token system with claim flow
- Session management

### ✅ Phase 3: Data Model & Offline (8 plans)
- IndexedDB wrapper with Promise API
- Expense CRUD operations
- Soft delete with restore
- Offline storage for all entities
- Sync queue for pending operations

### ✅ Phase 4: Expense Creation (7 plans)
- Multi-step expense form (Basic → Participants → Splits)
- 3 split methods: Equal, Percentage, Shares
- Participant picker with suggestions
- Currency support (AUD, USD, EUR, GBP)
- Expense list with time filters

### ✅ Phase 5: Tags & Organization (5 plans)
- Tag input with autocomplete
- Tag filtering on expense list
- Tag management (rename, merge, delete)
- Tag detail pages with statistics
- Smart participant suggestions based on tags

### ✅ Phase 6: Balance Calculation (8 plans)
- Balance calculation engine (direct + simplified)
- Multi-currency conversion with real-time rates
- Balance detail breakdown
- Exchange rate caching (24h)
- Manual rate override capability

### ✅ Phase 7: Settlements (5 plans)
- Record settlements (global, partial, tag-specific)
- Settlement history with time grouping
- Settlement integration with balances
- "Settle All" quick buttons
- Delete settlements with confirmation

### ✅ Phase 8: Templates (4 plans)
- Create reusable split templates
- Template CRUD operations
- Quick-apply in expense creation
- All split types supported

### ✅ Phase 9: Version History & Undo (4 plans)
- Automatic expense change tracking
- Version history timeline view
- Undo last change functionality
- Activity feed (global + filtered)

### ✅ Phase 10: iOS-Native UX (5 plans)
- Sheet modal with drag-to-dismiss
- Swipe-back navigation
- iOS list components
- Complete dark mode system
- Polished animations (stagger, shake, loading spinners)
- **Zero emojis** - All Lucide icons
- Bottom navbar with accessibility

### ✅ Phase 11: Critical Fixes & Security (7 tasks)
- **Participant name persistence** - Immediate IndexedDB save on creation
- **Page scrolling fixes** - dragDirectionLock, touchAction: 'pan-y' for iOS
- **Bottom nav indicator alignment** - Framer Motion values instead of transforms
- **Security headers** - CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Input validation** - Zod schemas for all data types (expenses, splits, settlements, etc.)
- **Data export (GDPR)** - CSV download for expenses and settlements (Article 20 compliance)
- **Financial integrity** - Validation that splits sum to expense total (±0.01 tolerance)

---

## Codebase Structure

```
splitwiser/
├── app/                          # Next.js App Router pages
│   ├── balances/                 # Balance view page
│   ├── expenses/                 # Expense list, detail, new
│   ├── settlements/              # Settlement history
│   ├── settings/                 # User settings
│   ├── tags/                     # Tag management & details
│   ├── templates/                # Template CRUD
│   ├── activity/                 # Activity feed
│   ├── auth/                     # Login, callback, claim
│   └── invite/                   # Invite token landing pages
│
├── components/                   # React components
│   ├── BottomNav.tsx             # Tab navigation (Lucide icons)
│   ├── ExpenseForm.tsx           # Multi-step expense creation
│   ├── ExpenseList.tsx           # Expense list with animations
│   ├── BalanceView.tsx           # Balance calculation display
│   ├── SettlementHistory.tsx    # Settlement list
│   ├── TagInput.tsx              # Tag autocomplete input
│   ├── Sheet.tsx                 # iOS bottom sheet modal
│   ├── SwipeNavigation.tsx       # Swipe-back gesture wrapper
│   ├── ListRow.tsx               # iOS list row component
│   ├── PageTransition.tsx        # Page animation wrapper
│   ├── SyncIndicator.tsx         # Offline/sync status
│   └── [35+ other components]
│
├── lib/                          # Core business logic
│   ├── db/                       # Database layer
│   │   ├── indexeddb.ts          # IndexedDB wrapper
│   │   ├── stores.ts             # CRUD operations
│   │   └── types.ts              # TypeScript types
│   ├── balances/                 # Balance calculation engine
│   │   ├── calculator.ts         # Direct balance calculation
│   │   └── simplification.ts    # Debt minimization algorithm
│   ├── currency/                 # Multi-currency support
│   │   ├── exchangeRates.ts      # Rate fetching & caching
│   │   └── geolocation.ts        # Auto-detect currency
│   ├── offline/                  # Offline-first logic
│   │   ├── operations.ts         # Sync queue management
│   │   └── optimistic.ts         # Optimistic update patterns
│   ├── realtime/                 # Supabase subscriptions
│   │   └── subscriptions.ts      # Realtime event handlers
│   ├── sync/                     # Sync engine
│   │   └── engine.ts             # Conflict resolution
│   ├── contexts/                 # React contexts
│   │   └── AuthContext.tsx       # Auth state management
│   ├── utils/                    # Utility functions
│   │   └── display-name.ts       # Participant name resolution
│   └── actions/                  # Server actions
│
├── hooks/                        # Custom React hooks
│   ├── useBalances.ts            # Balance state management
│   ├── useOptimisticMutation.ts  # Optimistic updates
│   ├── useParticipants.ts        # Participant suggestions
│   ├── useTagSuggestions.ts      # Tag-based suggestions
│   └── useTemplates.ts           # Template management
│
├── e2e/                          # Playwright tests
│   ├── navigation-icons.spec.ts  # Navigation testing
│   ├── forms-interactions.spec.ts # Form UX testing
│   └── lists-and-data-views.spec.ts # List animations
│
├── .planning/                    # Project documentation
│   ├── PROJECT.md                # Requirements & constraints
│   ├── ROADMAP.md                # Phase structure
│   ├── STATE.md                  # Current position
│   └── phases/                   # Per-phase summaries
│
├── public/                       # Static assets
│   ├── manifest.json             # PWA manifest
│   ├── sw.js                     # Service worker
│   └── icons/                    # App icons
│
└── supabase/                     # Database schema
    └── migrations/               # SQL migrations
```

---

## Development Workflow

### Starting Development
```bash
npm install                    # Install dependencies
npm run dev                    # Start dev server (localhost:3000)
npm run build                  # Production build
```

### Running Tests
```bash
npm run test:e2e               # Playwright tests (all)
npm run test:e2e:ui            # Interactive UI mode
npm run test:e2e:report        # View HTML report
npx playwright test --debug    # Debug mode
```

### Database
- **Local**: Supabase project linked via `.env.local`
- **Schema**: See `supabase/migrations/` for all tables
- **RLS**: Row Level Security enforced on all tables

### Git Workflow
- Conventional commits: `feat(phase-plan): description`
- Per-task atomic commits during plan execution
- Planning metadata commits: `docs(phase-plan): complete [name] plan`

---

## Important Constraints

### Must Follow
1. **NO EMOJIS** - Use Lucide React icons only (✅ enforced in Phase 10)
2. **Offline-first** - All core features must work without network
3. **iOS-native feel** - Smooth animations, gestures, proper safe areas
4. **TypeScript strict mode** - All code must pass type checking
5. **Optimistic updates** - UI responds immediately, sync in background
6. **Security headers** - CSP, X-Frame-Options, X-Content-Type-Options required (✅ Phase 11)
7. **Input validation** - All user inputs validated with Zod schemas (✅ Phase 11)
8. **GDPR compliance** - Data export, right to erasure, privacy policy (🚧 In progress)
9. **Financial integrity** - Splits must sum to expense total (±0.01) (✅ Phase 11)

### Design Patterns
- **Use hooks for state** - `useBalances`, `useOptimisticMutation`, etc.
- **Server components where possible** - Client components only when needed
- **Motion components for animations** - Consistent spring physics
- **iOS color tokens** - `ios-blue`, `ios-gray`, `ios-red` from Tailwind config
- **Safe area classes** - `pt-safe-top`, `pb-safe-bottom`, `pb-safe` for layouts

### Database Conventions
- **UUIDs for all IDs** - `crypto.randomUUID()` for offline compatibility
- **Soft deletes** - Set `deleted_at` timestamp, don't hard delete
- **Timestamps** - Use `timestamptz` for timezone awareness
- **Money amounts** - `decimal(12,2)` for precision
- **Hybrid references** - Either `user_id` OR `participant_id`, never both

### Icon System (Phase 10)
- **Lucide icons only** - No emojis, SVGs, or custom graphics
- **Consistent sizing** - `w-5 h-5` for nav, `w-4 h-4` for content
- **Color inheritance** - Use `currentColor` for theme compatibility
- **Semantic names** - Receipt (expenses), Scale (balances), CheckCircle (settlements)

---

## Key Files to Know

### Core Business Logic
- `lib/db/stores.ts` - All database CRUD operations (900+ lines)
- `lib/balances/calculator.ts` - Balance calculation algorithm
- `hooks/useOptimisticMutation.ts` - Offline-first mutation pattern
- `lib/offline/operations.ts` - Sync queue management
- `lib/validation/schemas.ts` - Zod validation schemas for all data types (Phase 11)

### Main UI Components
- `components/ExpenseForm.tsx` - 3-step expense creation (700+ lines)
- `components/BalanceView.tsx` - Balance display with settlements (380+ lines)
- `components/BottomNav.tsx` - Tab navigation with animations
- `app/expenses/[id]/page.tsx` - Expense detail with version history

### Configuration
- `tailwind.config.ts` - iOS design tokens and dark mode
- `lib/db/indexeddb.ts` - Database initialization (v5, 11 stores)
- `middleware.ts` - Auth session refresh
- `next.config.ts` - Security headers, PWA settings (Phase 11 security updates)

---

## Common Tasks

### Adding a New Feature
1. Read `.planning/ROADMAP.md` for context
2. Create plan in `.planning/phases/[phase]/[plan]-PLAN.md`
3. Implement following offline-first pattern
4. Add Lucide icons (never emojis)
5. Test offline functionality
6. Create SUMMARY.md documenting work

### Fixing Bugs
1. Check `useOptimisticMutation` for race conditions
2. Verify IndexedDB transactions complete properly
3. Test in offline mode
4. Ensure RLS policies allow the operation
5. Check dark mode compatibility

### Adding UI Components
1. Use Framer Motion for animations
2. Follow iOS design patterns (tap scale, slide transitions)
3. Support dark mode with semantic tokens
4. Add proper safe area padding
5. Use Lucide icons for all graphics
6. Test on mobile viewport (responsive mode)

---

## Recent Major Changes

### Phase 10 (Latest)
- **Icon system upgrade** - Replaced all emojis with Lucide React icons
- **Animation polish** - Staggered lists, shake validation, loading spinners
- **Participant name fix** - Saves names to IndexedDB (new PARTICIPANTS store)
- **Automated testing** - 117 Playwright tests across navigation, forms, lists
- **Spring animation fix** - Corrected 3-keyframe → 2-keyframe for bottom nav

### Phase 9
- **Version history** - Complete audit trail for all expense changes
- **Undo functionality** - Revert to previous expense states
- **Activity feed** - Global view of all changes with filtering

### Phase 8
- **Templates** - Reusable split configurations for quick expense creation

---

## Troubleshooting

### Build Errors
- Check TypeScript errors with `npm run build`
- Verify all Lucide icons imported correctly
- Ensure no emoji characters in JSX

### Offline Issues
- Check IndexedDB in DevTools → Application tab
- Verify sync queue has pending operations
- Check network tab for failed requests

### Animation Jank
- Reduce stagger delay (50ms max)
- Use `layout="position"` for reordering
- Limit staggered items to 5 max

### Dark Mode Issues
- Use semantic tokens (`ios-blue`, `text-gray-900 dark:text-white`)
- Test in System Preferences dark mode
- Verify backdrop-blur works in both themes

---

## External APIs

### Supabase
- **Database**: PostgreSQL with RLS
- **Auth**: Magic link via email
- **Realtime**: WebSocket subscriptions

### Exchange Rates
- **API**: `https://api.exchangerate-api.com/v4/latest/[currency]`
- **Cache**: 24 hours in IndexedDB
- **Fallback**: 1:1 conversion if API fails
- **Cost**: Free tier (1500 requests/month)

---

## Future Work

### Phase 11: Analytics, Export & Categories
- Spending breakdown by category (pie/bar charts)
- Per-person spending analysis
- CSV export functionality
- Custom expense categories

### Phase 12+: Enhancements
- Receipt photo attachments
- Push notifications for new expenses
- In-app payment instructions
- Recurring expense support

---

## Contact & Resources

- **Project Repository**: [Add GitHub URL if applicable]
- **Planning Docs**: `.planning/` directory
- **Design System**: `tailwind.config.ts` for iOS tokens
- **Database Schema**: `supabase/migrations/`

---

*Last updated: 2026-02-10 after Phase 10 completion*
*Total commits: 200+ across 10 phases*
*Total features: 54 major capabilities implemented*
