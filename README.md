# Splitwiser

A beautiful, offline-first expense tracking and splitting app built with Next.js 15, designed with an iOS-native feel.

![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-green?style=flat-square&logo=supabase)
![PWA](https://img.shields.io/badge/PWA-Ready-purple?style=flat-square)

## ✨ Features

### Core Functionality
- **Offline-First Architecture** - Create and manage expenses without internet connection
- **Real-Time Sync** - Automatic synchronization when back online with conflict resolution
- **Smart Balance Calculations** - Multi-currency support with automatic exchange rates
- **Flexible Splitting** - Equal splits, custom percentages, shares, or exact amounts
- **Hybrid Participant System** - Support for both registered users and unregistered participants

### User Experience
- **iOS-Native Design** - Smooth animations, gestures, and visual polish
- **Dark Mode** - Full support with system preference detection
- **Progressive Web App** - Install on any device, works offline
- **Swipe Navigation** - iOS-style swipe gestures between sections
- **Optimistic Updates** - Instant UI feedback for all actions

### Advanced Features
- **Split Templates** - Save and reuse common split configurations
- **Settlement History** - Track who paid whom with full audit trail
- **Expense Versioning** - View edit history and undo changes
- **Smart Tagging** - Categorize expenses with auto-suggestions
- **Activity Feed** - Real-time updates on group expense activity
- **Invite System** - Email-based participant invitations with claim flow

## 🛠 Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom iOS theme
- **Database:** Supabase (PostgreSQL + Realtime)
- **Local Storage:** IndexedDB for offline support
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Testing:** Playwright (E2E) + Vitest (Unit)
- **PWA:** Custom Service Worker with workbox

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for backend)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/buda-loco/splitwiser.git
   cd splitwiser
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

### Database Setup

The app requires the following Supabase tables:
- `expenses` - Main expense records
- `expense_participants` - Links expenses to participants
- `expense_splits` - Split amounts per participant
- `expense_tags` - Tag associations
- `expense_versions` - Version history
- `settlements` - Payment settlements
- `participants` - Unregistered participant records
- `split_templates` - Reusable split configurations
- `profiles` - User profiles

See [CLAUDE.md](./CLAUDE.md) for detailed schema information.

## 📱 Progressive Web App

Splitwiser works as a PWA with:
- Offline functionality via IndexedDB
- Background sync when connection restored
- Install prompt on supported devices
- iOS safe area support
- Standalone app mode

## 🧪 Testing

### Run E2E Tests
```bash
npm run test:e2e
```

### Run Unit Tests
```bash
npm run test
```

### Run All Tests
```bash
npm run test:all
```

## 📊 Project Structure

```
splitwiser/
├── app/                    # Next.js app router pages
│   ├── expenses/          # Expense list, detail, and creation
│   ├── balances/          # Balance view and settlement
│   ├── settlements/       # Settlement history
│   └── settings/          # User settings
├── components/            # React components
│   ├── ExpenseForm.tsx   # Expense creation form
│   ├── BottomNav.tsx     # Bottom navigation bar
│   └── ...
├── lib/                   # Business logic
│   ├── db/               # IndexedDB operations
│   ├── sync/             # Sync engine
│   ├── offline/          # Offline operations
│   └── contexts/         # React contexts
├── e2e/                   # Playwright tests
├── public/                # Static assets
└── CLAUDE.md             # Comprehensive documentation
```

## 🎨 Key Design Principles

1. **Offline-First** - App works without internet, syncs when available
2. **Optimistic Updates** - UI updates instantly, syncs in background
3. **iOS-Native Feel** - Smooth animations, haptic feedback, native patterns
4. **Zero Emojis** - Professional Lucide icons throughout
5. **Accessibility** - Full ARIA labels, keyboard navigation, screen reader support

## 📖 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Comprehensive developer documentation covering:
  - Complete feature list (54 features across 10 phases)
  - Architecture patterns and decisions
  - Code organization and conventions
  - Development workflows
  - Troubleshooting guides

## 🔧 Development

### Key Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run unit tests
npm run test:e2e     # Run E2E tests
```

### Code Style

- TypeScript strict mode enabled
- ESLint configured with Next.js rules
- Prettier for code formatting
- Component-first architecture
- Functional components with hooks

## 🤝 Contributing

Contributions are welcome! Please read the [CLAUDE.md](./CLAUDE.md) documentation first to understand the architecture and conventions.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

Built with modern web technologies and following iOS Human Interface Guidelines for a native-feeling experience.

---

**Note:** This is an offline-first PWA designed for expense tracking and splitting among groups. It works seamlessly offline and syncs automatically when back online.
