---
phase: 11-analytics-export-and-categories
plan: 02
status: complete
subsystem: [data-model, ui-components, settings]
tags: [custom-categories, crud, drag-reorder, offline-first]
requires: [phase-10-ios-native-ux, plan-11-01-category-foundation]
provides: [custom-category-management, category-crud, category-picker-extension]
files_created: [components/CategoryManager.tsx, app/settings/categories/page.tsx]
files_modified: [lib/db/indexeddb.ts, lib/db/stores.ts, lib/types/category.ts, app/settings/page.tsx]
---

# Phase 11 Plan 2: Custom Category Management Summary

**Enabled users to create, edit, reorder, and delete custom expense categories beyond predefined set**

## Accomplishments

- Upgraded IndexedDB to v6 with custom_categories store for user-created categories
- Implemented full CRUD operations for custom categories with soft deletes
- Built CategoryManager component with predefined + custom category sections
- Created /settings/categories management page accessible from settings
- Implemented drag-to-reorder functionality using Framer Motion Reorder.Group
- Added getCategoriesForPicker helper merging predefined + custom categories

## Technical Implementation

### Database Schema (v6 Migration)

**IndexedDB Store: custom_categories**
- `id` (uuid, primary key)
- `user_id` (uuid, indexed)
- `name` (string) - Category display name
- `icon` (string) - Lucide icon name
- `color` (string) - Tailwind color class
- `sort_order` (number, indexed) - For custom ordering
- `created_at` (timestamp)
- `is_deleted` (boolean, indexed) - Soft delete flag

**Indexes**:
- `user_id` - Filter by user
- `is_deleted` - Filter active categories
- `sort_order` - Sort custom categories

### CRUD Operations (`lib/db/stores.ts`)

**createCustomCategory(userId, category)**
- Generates UUID for new category
- Calculates next sort_order based on existing categories
- Saves to IndexedDB custom_categories store
- Returns category ID

**getCustomCategories(userId)**
- Fetches all categories for user via user_id index
- Filters out soft-deleted categories (is_deleted=false)
- Sorts by sort_order ascending
- Returns array of active custom categories

**updateCustomCategory(categoryId, updates)**
- Supports partial updates: name, icon, color, sort_order
- Retrieves existing category, applies updates
- Saves updated category to IndexedDB

**deleteCustomCategory(categoryId)**
- Soft delete: sets is_deleted=true
- Preserves category data for audit trail
- Category no longer appears in active lists

**getCategoriesForPicker(userId)**
- Merges PREDEFINED_CATEGORIES with custom categories
- Returns unified array with isCustom flag
- Predefined categories listed first, then custom
- Used for expense form category selection

### CategoryManager Component

**Three Sections**:
1. **Predefined Categories** (read-only)
   - Displays all 10 predefined categories
   - Shows "Default" badge using ListRow subtitle
   - Icon with color background matching category
   - No edit/delete buttons

2. **Custom Categories** (editable)
   - Drag-to-reorder with Framer Motion Reorder.Group
   - GripVertical icon for drag handle
   - Inline edit form on click Edit button
   - Delete button with confirmation dialog
   - Shows count badge (X custom)

3. **Add New Category**
   - "Add Custom Category" button
   - Expands to inline form with name input, icon picker, color picker
   - 22 available Lucide icons (UtensilsCrossed, Car, Film, etc.)
   - 12 available Tailwind colors (orange, blue, purple, etc.)
   - Save/Cancel buttons

**Edit Form Features**:
- Text input for category name
- Icon picker: 6-column grid with border highlight on selection
- Color picker: 6-column grid with colored circles, scale animation on selection
- Save updates existing category or creates new one
- Cancel reverts changes and closes form

**Drag-to-Reorder**:
- Uses Framer Motion `Reorder.Group` and `Reorder.Item`
- Reorder handler updates sort_order for all categories
- Optimistic UI update, persists to IndexedDB
- Reloads on error to restore correct order

**iOS-Native Styling**:
- ListRow components for predefined categories
- Tap scale animations on edit/delete buttons
- Dark mode support with semantic tokens
- Helper text in ios-blue-light background
- Error messages in red-100 background

### Category Management Page

**Route**: `/settings/categories`

**Layout**:
- Header with back button (ArrowLeft icon) and title
- PageTransition wrapper for smooth navigation
- ProtectedRoute for auth check
- CategoryManager component with userId prop
- Standard safe area padding (pt-safe-top, pb-safe-bottom)
- Dark mode background (bg-gray-50 dark:bg-gray-900)

**Settings Integration**:
- Added "Organization" section to main /settings page
- "Manage Categories" ListRow with chevron
- Subtitle: "Create custom expense categories"
- Shows category count (predefined + custom)

### Type Definitions

**CustomCategory Interface** (`lib/types/category.ts`):
```typescript
interface CustomCategory {
  id: string;           // UUID
  user_id: string;      // Owner
  name: string;         // Display name
  icon: string;         // Lucide icon name
  color: string;        // Tailwind class
  sort_order: number;   // Custom ordering
  created_at: string;   // Timestamp
  is_deleted: boolean;  // Soft delete
}
```

## Files Created/Modified

**Created**:
- `components/CategoryManager.tsx` (502 lines) - Category management UI
- `app/settings/categories/page.tsx` (38 lines) - Management page

**Modified**:
- `lib/db/indexeddb.ts` - DB_VERSION=6, added CUSTOM_CATEGORIES store
- `lib/db/stores.ts` - Added 5 custom category CRUD functions
- `lib/types/category.ts` - Added CustomCategory interface
- `app/settings/page.tsx` - Added "Organization" section with categories link

## Design Decisions

### Icon Selection
- Limited to 22 curated Lucide icons for consistency
- Icons cover common expense types: food, transport, entertainment, etc.
- CategoryIcon component handles dynamic rendering with fallback

### Color Selection
- 12 Tailwind color classes with dark mode variants
- Matches predefined category color scheme
- Stored as full class string (e.g., "bg-orange-500 dark:bg-orange-600")

### Soft Deletes
- Maintains data integrity and audit trail
- Categories can be restored if needed
- Simplifies conflict resolution in sync scenarios

### Sort Order
- Numeric sort_order field for custom reordering
- Auto-increments on create (max + 1)
- Updated in batch on drag-reorder
- Independent from creation order

### Merge Strategy
- getCategoriesForPicker merges predefined + custom
- Predefined always listed first (consistent UX)
- isCustom flag distinguishes category types
- Enables future features (edit predefined = create custom copy)

## Verification Completed

- ✅ Database migration to v6 succeeds
- ✅ createCustomCategory saves to IndexedDB
- ✅ getCustomCategories returns active categories sorted by sort_order
- ✅ updateCustomCategory modifies name, icon, color
- ✅ deleteCustomCategory soft deletes (is_deleted=true)
- ✅ getCategoriesForPicker merges predefined + custom
- ✅ CategoryManager displays both category types
- ✅ Add/edit/delete custom categories works
- ✅ Drag-to-reorder updates sort_order via Reorder.Group
- ✅ /settings/categories page accessible from settings
- ✅ TypeScript compiles without errors (category files)
- ✅ Dark mode support functional
- ✅ iOS-native animations and styling

## Known Issues

**Pre-existing Build Error**: ExpenseForm.tsx has unrelated TypeScript error (useCategoryTemplates using 'category' before declaration). This existed before plan 11-02 and does not affect custom category functionality.

## Integration Points

### Ready for Integration
- **Plan 11-04** (Spending Analytics): Can filter expenses by custom categories
- **Plan 11-03** (Per-Person Analytics): Include custom categories in breakdown
- **ExpenseForm**: Update CategoryPicker to use getCategoriesForPicker()
- **Future**: Sync custom categories to Supabase (sync_status field ready)

### Future Enhancements
- Import/export custom categories
- Share custom categories across group
- Category usage statistics (X expenses in category)
- Archive unused categories instead of delete
- Category templates (common sets for new users)

## Commits

1. `39a1369` - feat(11-02): create custom_categories store and CRUD
2. `ac729d9` - feat(11-02): build CategoryManager component
3. `7897a4f` - feat(11-02): create category management page

## Impact

- Users can create unlimited custom categories for precise expense tracking
- Drag-to-reorder enables personalized category prioritization
- Foundation for advanced analytics filtering (by custom category)
- Maintains offline-first architecture with IndexedDB storage
- iOS-native UX with smooth animations and dark mode
- Ready for Supabase sync integration (when online)
