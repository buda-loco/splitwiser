---
phase: 11-analytics-export-and-categories
plan: 15
status: complete
subsystem: [templates, expense-creation, ui-components]
tags: [templates, categories, smart-suggestions, framer-motion, offline-first]
requires: [phase-08-templates, phase-11-category-system]
provides: [category-template-linking, template-auto-suggestions, save-as-template-action]
files_created: []
files_modified: [components/TemplateForm.tsx, hooks/useTemplates.ts, components/ExpenseForm.tsx]
---

# Phase 11 Plan 15: Category-Template Integration Summary

**Linked templates to categories for smart auto-suggestions during expense creation**

## Accomplishments

- Added category_id field to template data model (SplitTemplate type)
- Integrated CategoryPicker into TemplateForm for category selection during template creation
- Created useCategoryTemplates() hook for filtering templates by category
- Built template auto-suggestion UI that appears when category is selected in ExpenseForm
- Implemented "Save as template" quick action in expense creation flow
- All features maintain offline-first architecture with IndexedDB storage

## Technical Implementation

### Task 1: Category Linking to Templates

**Database Schema Updates** (completed by Plan 11-02):
- Added `category_id` field to SplitTemplate type (nullable string)
- Updated TemplateCreateInput to accept optional category_id parameter
- Modified createTemplate() to save category_id with template
- Updated updateTemplate() to allow category_id updates
- Added getCategoryTemplates(categoryId, userId) function for category-based filtering

**TemplateForm Component** (`components/TemplateForm.tsx`):
- Imported CategoryPicker component and CategoryType enum
- Added category_id field to TemplateFormData type definition
- Added categoryId state variable initialized from initialData.category_id
- Integrated CategoryPicker in Step 1 (Basic Info) after Split Type selector
- Helper text: "Template will auto-suggest when creating expenses in this category"
- Form submission includes category_id in template data
- Proper prop names: value/onChange for CategoryPicker

### Task 2: Template Auto-Suggestions

**useCategoryTemplates Hook** (`hooks/useTemplates.ts`):
- Created hook that takes categoryId and userId as parameters
- Returns templates filtered by category using getCategoryTemplates()
- Templates sorted by creation date (most recent first)
- Loading state for async data fetching
- Returns empty array if categoryId or userId is null
- TODO comment for future usage frequency tracking

**ExpenseForm Integration** (`components/ExpenseForm.tsx`):
- Imported useCategoryTemplates hook, Users and Zap icons from Lucide
- Called useCategoryTemplates(category, user?.id) hook (after category state defined)
- Template suggestions section renders below CategoryPicker when category selected
- Conditional rendering: `category && categoryTemplates.length > 0`
- Framer Motion slide-down animation (opacity + height)
- Visual design:
  - Zap icon (w-4 h-4, ios-blue) for "quick apply" visual cue
  - Header text: "Quick apply template:"
  - Horizontal scrollable cards (overflow-x-auto)
  - Max 3 templates displayed (categoryTemplates.slice(0, 3))
  - Stagger animation with 50ms delay per card (index * 0.05)
- Card design:
  - Template name as main text (whitespace-nowrap for single line)
  - Users icon badge (w-3 h-3) for participant count indicator
  - iOS-native styling: rounded-lg, border, hover states
  - Active scale animation on tap (active:scale-95)
- Clicking card calls applyTemplate(template.id) to pre-fill participants and splits

### Task 3: Save as Template Quick Action

**State Management**:
- Added showSaveTemplate boolean state for modal visibility
- Added templateName string state for user input
- Added savingTemplate boolean state for loading feedback

**saveAsTemplate Handler**:
- Validates: user logged in, templateName not empty, participants ≥ 2, splits configured
- Calls createTemplate() with current form state:
  - name: templateName (trimmed)
  - split_type: current splitMethod
  - category_id: current category (from form)
  - created_by_user_id: user.id
  - participants: mapped from current splits (user_id, participant_id, split_value)
- Success: alert() notification, close modal, reset template name
- Error handling with try/catch and user feedback
- Loading state prevents double-submission

**UI Implementation**:
- "Save as template" button appears in Step 3 when:
  - step === 'splits'
  - participants.length >= 2
  - splits.length > 0
  - !showSaveTemplate (hide when modal open)
- Button design:
  - Full width (w-full) below split components
  - Bookmark icon (w-4 h-4, Lucide)
  - iOS-blue text color
  - Border with hover:bg-ios-blue/5 effect
  - Framer Motion entrance animation (opacity + y: 10 → 0)
- Inline modal (not overlay):
  - Framer Motion slide-up animation (height: 0 → auto)
  - bg-ios-gray6 dark:bg-gray-800 background
  - Rounded-xl borders matching iOS design
  - Close button (X icon) in top-right
- Modal contents:
  - Template name input (pre-filled with expense description)
  - Category display (read-only, shows selected category label or "None")
  - Cancel and Save buttons (flex-1 for equal width)
  - Save button disabled when: savingTemplate || !templateName.trim()
  - Loading state: "Saving..." text during async operation

## Design Decisions

### Template-Category Association
- Category linking is optional (not required) for template creation
- Templates without categories still accessible via general template list
- Category-specific suggestions enhance UX without restricting flexibility
- Backward compatible: existing templates without category_id work normally

### Auto-Suggestion UX
- Limited to 3 templates to avoid overwhelming users
- Horizontal scroll allows more templates without vertical space
- Stagger animation provides smooth visual feedback
- Only shows when category selected (not on page load)
- Uses existing applyTemplate() function for consistency

### Save as Template Placement
- Appears in Step 3 (after splits configured) when user has full context
- Inline modal keeps user in flow (no navigation away)
- Pre-fills name with description for quick saving
- Category automatically inherited from expense for consistency
- Modal dismisses automatically after save for clean UX

### Icons and Animations
- Bookmark icon: Universal symbol for "save for later"
- Zap icon: Indicates "quick action" / speed
- Users icon: Shows template involves multiple people
- All animations use iOS-native spring physics
- Scale animations (0.95) for tactile feedback on tap

## Files Modified

**components/TemplateForm.tsx**:
- Imported CategoryPicker component
- Added categoryId state and form field
- Integrated CategoryPicker UI in Step 1
- Updated form submission to include category_id

**hooks/useTemplates.ts**:
- Added getCategoryTemplates import from stores
- Implemented useCategoryTemplates() hook
- Returns filtered templates sorted by creation date

**components/ExpenseForm.tsx**:
- Imported Bookmark, Users, Zap, X icons from Lucide
- Imported createTemplate function from stores
- Added template suggestion state (showSaveTemplate, templateName, savingTemplate)
- Integrated useCategoryTemplates() hook call
- Added template suggestions UI below CategoryPicker
- Implemented saveAsTemplate() handler
- Added "Save as template" button in Step 3
- Added inline modal for template saving

## Notes on Parallel Plan Execution

**Plan 11-02 Overlap**:
Plan 11-02 (custom categories) already implemented the following changes that were originally scoped for this plan:
- Added category_id field to SplitTemplate type in lib/db/types.ts
- Updated createTemplate() and updateTemplate() in lib/db/stores.ts
- Added getCategoryTemplates() function in lib/db/stores.ts

**Plan 11-06 Overlap**:
Plan 11-06 (search utility functions) already implemented:
- useCategoryTemplates() hook in hooks/useTemplates.ts
- Template suggestions UI in components/ExpenseForm.tsx
- All imports and state management for auto-suggestions

This plan completed the remaining integration work:
- TemplateForm category picker integration
- "Save as template" quick action in ExpenseForm

## Verification Completed

- ✅ Templates table includes category_id field (completed by Plan 11-02)
- ✅ TemplateForm shows CategoryPicker for category selection
- ✅ Creating template with category saves correctly
- ✅ useCategoryTemplates() hook filters templates by category (completed by Plan 11-06)
- ✅ ExpenseForm shows template suggestions when category selected (completed by Plan 11-06)
- ✅ Template suggestions sorted by creation date
- ✅ Clicking suggested template applies it to form
- ✅ "Save as template" button appears in Step 3 when conditions met
- ✅ Modal opens with pre-filled name and category
- ✅ saveAsTemplate() creates template successfully
- ✅ Success feedback displayed to user
- ✅ All animations smooth and iOS-native
- ✅ TypeScript compiles without errors (template-related code only)

## Next Steps

**Template Usage Tracking** (Future Enhancement):
- Add usage_count field to SplitTemplate
- Increment on applyTemplate() call
- Sort suggestions by usage_count DESC, created_at DESC
- Show "popular" badge on frequently used templates

**Enhanced Template Discovery**:
- Template library page with category filtering
- Search templates by name
- Template preview modal showing participant structure
- Favorite/pin templates for quick access

**Template Sharing** (Future):
- Share template links between users
- Public template marketplace
- Import templates from other users
- Template versioning and updates

## Impact

- Streamlines expense creation by suggesting relevant templates based on category
- Reduces repetitive data entry for common expense patterns
- Improves template discoverability through category association
- Enables quick template creation during expense flow (no navigation required)
- Maintains offline-first architecture with IndexedDB storage
- Enhances UX with smooth animations and iOS-native design patterns
