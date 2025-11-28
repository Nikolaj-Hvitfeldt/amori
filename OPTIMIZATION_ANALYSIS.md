# Frontend Optimization Analysis - TimelineScreen

## 🔍 Identified Issues

### 1. **Duplicated Utility Functions** (High Priority)

- `getBoxShadow()` - duplicated in TimelineScreen, MomentsScreen, DatesScreen, MilestonesScreen
- `getTextShadow()` - duplicated across all screens
- `filterValidPhotos()` - duplicated in TimelineScreen, DatesScreen, MilestonesScreen
- `formatDate()` - duplicated with different formats (US format vs European format)
- `calculateDaysSince()` - duplicated in TimelineScreen and MilestonesScreen
- `getMoodInfo()` - duplicated in TimelineScreen and DatesScreen

**Solution:** Extract to `frontend/src/utils/`

### 2. **Duplicated Constants** (High Priority)

- `MOMENT_COLOR`, `MOMENT_BG`, `MOMENT_TEXT` - duplicated in TimelineScreen and MomentsScreen
- `MOOD_COLORS` - duplicated in TimelineScreen and DatesScreen
- `MOOD_OPTIONS` - duplicated in TimelineScreen and DatesScreen
- `ITEMS_PER_PAGE` / `ITEMS_PER_TYPE` - duplicated across screens
- Hardcoded colors: `#FFD700`, `#F5E6D3`, `#1a0f1a`, `#0f172a`, `#2d1810`, etc.
- Spacing values: `30`, `20`, `marginHorizontal: 20` repeated throughout

**Solution:** Create `frontend/src/constants/theme.ts` and `frontend/src/constants/spacing.ts`

### 3. **Reusable Components** (Medium Priority)

- **TimelineCard components** - `renderMomentCard`, `renderDateCard`, `renderMilestoneCard` are large inline functions
- **Decorative accent circles** - similar pattern in all three card types
- **Timeline rope/charm** - complex styling that could be a component
- **Loading states** - similar across screens
- **Empty states** - similar pattern

**Solution:** Extract to `frontend/src/components/timeline/`

### 4. **Code Organization** (Medium Priority)

- Large inline styles in card renderers (400+ lines of JSX with inline styles)
- Repeated shadow/text shadow configurations
- Similar card structure across all three types

**Solution:** Extract card components with proper styling

### 5. **Performance Optimizations** (Low Priority)

- Card renderers are recreated on every render (should use `useCallback` or `React.memo`)
- Inline style objects created on every render
- Large StyleSheet at bottom (could be split)

## 📋 Recommended Refactoring Plan

### Phase 1: Extract Shared Utilities

1. Create `frontend/src/utils/shadows.ts` - `getBoxShadow`, `getTextShadow`
2. Create `frontend/src/utils/photoUtils.ts` - `filterValidPhotos` (already exists as `imageUtils.ts`)
3. Create `frontend/src/utils/dateUtils.ts` - `formatDate`, `calculateDaysSince`
4. Create `frontend/src/utils/moodUtils.ts` - `getMoodInfo`, `MOOD_COLORS`, `MOOD_OPTIONS`

### Phase 2: Extract Shared Constants

1. Create `frontend/src/constants/theme.ts` - all color constants
2. Create `frontend/src/constants/spacing.ts` - spacing values
3. Update all screens to use shared constants

### Phase 3: Extract Components

1. Create `TimelineMomentCard`, `TimelineDateCard`, `TimelineMilestoneCard` components
2. Create `TimelineRope` component
3. Create `DecorativeAccent` component
4. Create `LoadingState` and `EmptyState` components

### Phase 4: Optimize Performance

1. Memoize card components
2. Extract inline styles to StyleSheet
3. Use `useCallback` for handlers
