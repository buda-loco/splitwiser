# Splitwiser

## What This Is

Splitwiser is a mobile-first expense splitting PWA that feels like a native iOS app. It helps friend groups track shared expenses (dinners, trips, events) with a beautiful, gesture-driven interface. Unlike Splitwise's aggressive monetization and dated UX, Splitwiser offers a generous free experience with optional donations, modern iOS design patterns, and smart multi-currency support for travelers.

## Core Value

**Beautiful iOS-native UX that makes expense splitting feel effortless.**

If everything else fails, the app must feel native, fluid, and delightful to use. This is the primary differentiator that will make people switch from Splitwise.

## Requirements

### Validated

(None yet — ship to validate)

### Active

#### Core Expense Management
- [ ] Create expenses with amount, description, category, and date
- [ ] Add participants per expense with smart suggestions based on recent context
- [ ] Tag expenses for organization (#bali-trip, #family, #flatmates)
- [ ] Filter and view expenses by tags
- [ ] Calculate global balances per person across all tagged contexts
- [ ] Toggle between currency views (AUD, EUR, USD, etc.) with real-time conversion
- [ ] Automatic exchange rates from free API with manual override capability

#### Splitting Methods
- [ ] Split equally (divide by number of people)
- [ ] Split by percentages (each person pays X% of total)
- [ ] Split by shares/weights (Person A: 1x, Person B: 2x, Person C: 1.5x)

#### Settlement
- [ ] Settle globally (zero out entire balance with someone)
- [ ] Settle tag-specific (just #bali-trip portion)
- [ ] Settle partial amounts (flexible payment recording)
- [ ] Debt simplification with optional toggle (minimize transactions vs show direct balances)

#### Templates & Efficiency
- [ ] Create named split templates with participants and weights (e.g., "Family Dinner: Jorge 1x, Feli 1.5x, Lolo 1.5x")
- [ ] Quick-apply templates to new expenses
- [ ] Smart participant suggestions based on recent expenses with similar tags

#### History & Trust
- [ ] Full undo capability for any change (not just current session)
- [ ] Complete version history per expense (who created, who edited, what changed, when)
- [ ] Activity feed showing all expense modifications with notifications

#### Analytics
- [ ] Spending breakdown by category (pie/bar charts)
- [ ] Per-person spending breakdown
- [ ] CSV export of expense history and balances

#### Expense Categories
- [ ] Predefined categories (Food, Transport, Accommodation, Entertainment, Shopping, Utilities, Other)
- [ ] User-defined custom categories
- [ ] Optional categorization (default to 'General')

#### Account Model
- [ ] Hybrid account system: track expenses with people who don't have accounts
- [ ] Users can claim their identity by signing up and see all balances across contexts
- [ ] Email/SMS invite links when someone adds you to an expense
- [ ] View-only access via invite link before creating account

#### Real-time & Sync
- [ ] Offline-first architecture with local storage
- [ ] Queue expenses offline, sync when connected
- [ ] Real-time sync via Supabase subscriptions (expenses appear immediately for all participants)
- [ ] Conflict resolution for offline edits

#### iOS-Native UX Patterns
- [ ] Bottom tab navigation for primary app navigation
- [ ] Sheet modals with drag-to-dismiss gestures
- [ ] Framer Motion page transitions with swipe-back gestures
- [ ] iOS-style list rows with chevrons
- [ ] Safe area padding for notched devices
- [ ] -apple-system font stack
- [ ] Light and dark mode using prefers-color-scheme

#### PWA Requirements
- [ ] Installable via Add to Home Screen (iOS Safari, Android Chrome)
- [ ] App manifest with icons and splash screens
- [ ] Service worker for offline functionality
- [ ] Standalone display mode (no browser chrome)

### Out of Scope

- **Receipt scanning / OCR** — Manual entry only for v1. AI receipt splitting adds complexity and API costs. Can add later if users request it.
- **Payment integrations** — No Venmo/PayPal/Wise/bank integration. Users settle outside the app and record the payment. Integration is complex, region-specific, and not core to the splitting experience.
- **Recurring expenses** — No automated monthly rent/utilities. One-off expenses only. Can add if usage patterns show demand.
- **Parent/child debt relationships** — No "parent" accounts where children's debts roll up. Adds data model complexity. Defer until proven need.
- **Large collapsible headers** — iOS pattern but not essential for v1 native feel. Other gesture patterns are higher priority.
- **Spending over time charts** — Focus on category and per-person breakdowns. Trend analysis can come later.
- **Native app stores** — PWA only via Add to Home Screen. No Capacitor wrapping or App Store submission. Reduces distribution overhead and approval delays.

## Context

### Problem Space
Splitwise (founded 2011) dominates expense splitting but has significant pain points:
- **Aggressive monetization**: Free tier has daily expense limits with 10-second ads between transactions
- **Confusing UX**: Unclear balance views, group vs non-group confusion, no draft saving
- **Cross-group problems**: Can't settle debts across multiple groups in one transaction
- **Dated design**: UI feels old compared to modern iOS apps
- **Poor international support**: Currency handling is clunky, one default currency limit

### Target Users
Friend groups in social contexts:
- Dinners, weekend trips, concert tickets, shared experiences
- Casual, potentially infrequent use
- Mix of same-currency and multi-currency scenarios (when traveling together)
- Need low-friction onboarding (not everyone wants to create an account upfront)

### Strategic Advantages
1. **Design-first approach**: Beautiful iOS-native UX as primary differentiator
2. **Generous free tier**: No ads, no limits, monetize via optional donations
3. **Tag-based architecture**: Solves cross-group settlement problems with global balances
4. **Offline-first**: Essential for travel, reduces sync complexity
5. **Transparent audit trail**: Every edit versioned, nobody can silently delete expenses
6. **Smart defaults**: Templates, suggestions, and patterns that reduce repetitive entry

### User Feedback Integration
Spanish-speaking pro user feedback informed several v1 features:
- Predefined split configurations with custom weights (family dinners where some pay more)
- Undo functionality with clear change notifications
- Tags for filtering transactions while maintaining simple per-person debt view
- Ability to add non-users and track their splits

## Constraints

- **Must work offline**: Core expense entry and balance viewing must function without internet connection. Sync when connectivity returns. Essential for international travel use case.
- **Tech stack: Next.js + Supabase**:
  - Next.js for PWA with app router
  - Supabase for authentication, PostgreSQL database, and realtime subscriptions
  - Tailwind CSS for styling with iOS design conventions
  - Framer Motion for page transitions and gesture animations
- **PWA distribution only**: No native app store submission for v1. Add to Home Screen via Safari/Chrome. Enables faster shipping and immediate updates.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Tags instead of groups | Solves cross-context settlement issues. Users can owe someone money across multiple tags but settle it in one transaction. Tags are organizational, balances are global per person. | — Pending |
| Beautiful UX as core value | Differentiation strategy. Splitwise's design is dated. Modern, gesture-driven iOS-native feel will drive switching even if feature parity isn't perfect. | — Pending |
| Hybrid account model | Lowers barrier to network effect. Organizer can add friends by name, they get invite links, can claim account later. Removes "everyone needs to sign up" friction. | — Pending |
| Offline-first architecture | Essential for travel use case. Users need to log expenses in restaurants, on planes, in areas with poor connectivity. Sync is secondary to local-first data. | — Pending |
| No receipt scanning in v1 | AI/OCR adds complexity (API costs, accuracy issues, error handling). Manual entry is sufficient for MVP. Can add later if adoption proves the core experience. | — Pending |
| Debt simplification as toggle | Some users want to see minimized transactions (Splitwise default), others want direct "I owe Jorge" visibility. Support both views rather than choosing one. | — Pending |
| Free + donations model | Splitwise's aggressive monetization is top user complaint. Generous free tier builds goodwill. Optional tip jar for support. Sustainable via low infrastructure costs (Supabase free tier, free exchange rate API). | — Pending |

---
*Last updated: 2026-02-05 after initialization*
