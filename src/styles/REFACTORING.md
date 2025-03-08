# Refactoring Components to Use the Style Guide

This document provides examples and guidance for refactoring existing components to use the enhanced style guide. Following these patterns will help maintain consistency across the application and reduce the use of hardcoded styles.

## Before and After Examples

### Example 1: Alert Component

**Before:**
```jsx
<div className="rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-2 shadow-sm w-auto bg-green-100 text-green-800 border border-green-200">
  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
  </svg>
  <div>
    <div className="font-semibold text-xs sm:text-sm text-green-800">On Track</div>
    <div className="text-xs text-green-700 hidden sm:block">Your retirement plan is on track</div>
  </div>
</div>
```

**After:**
```jsx
<div className={cx(
  components.alert.base,
  components.alert.success,
  spacing.gap.sm,
  spacing.padding.alert, 
  "w-auto"
)}>
  <svg className={cx(components.icon.sizes.sm, colors.text.green[600])} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
  </svg>
  <div>
    <div className={cx(
      typography.weight.semibold, 
      typography.responsive.text.xs,
      colors.text.green[800]
    )}>On Track</div>
    <div className={cx(
      typography.size.xs, 
      typography.responsive.hidden.mobileOnly,
      colors.text.green[700]
    )}>Your retirement plan is on track</div>
  </div>
</div>
```

### Example 2: Button with Icon

**Before:**
```jsx
<button 
  onClick={handleClick}
  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 border border-indigo-200 shadow-sm transition-colors flex items-center"
>
  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
  </svg>
  <div className="text-left">
    <div className="font-semibold text-indigo-800 text-xs sm:text-sm">View Details</div>
    <div className="text-xs text-indigo-700 hidden sm:block">See more information</div>
  </div>
</button>
```

**After:**
```jsx
<button 
  onClick={handleClick}
  className={cx(
    components.button.icon,
    spacing.padding.button,
    "transition-colors"
  )}
>
  <svg className={cx(components.icon.sizes.sm, components.icon.colors.indigo, components.icon.spacings.right.sm)} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
  </svg>
  <div className="text-left">
    <div className={cx(typography.weight.semibold, colors.text.indigo[800], typography.responsive.text.xs)}>View Details</div>
    <div className={cx(typography.size.xs, colors.text.indigo[700], typography.responsive.hidden.mobileOnly)}>See more information</div>
  </div>
</button>
```

### Example 3: Dynamic Width Components

**Before:**
```jsx
<div className="h-full flex flex-col justify-center px-3 bg-gradient-to-r from-blue-500 to-indigo-600" style={{ width: workingWidth }}>
  <div className="text-sm text-white font-medium">30 years</div>
  <div className="text-xs text-blue-100">Working Phase</div>
  <div className="text-xs text-blue-100">2023—2053</div>
</div>
```

**After:**
```jsx
<DynamicWidthContainer 
  width={workingWidth} 
  className={cx(colors.phases.investment.bg, "flex flex-col justify-center px-3")}
>
  <div className={cx(typography.size.sm, colors.text.white, typography.weight.medium)}>
    30 years
  </div>
  <div className={cx(typography.size.xs, colors.phases.investment.textLight)}>Working Phase</div>
  <div className={cx(typography.size.xs, colors.phases.investment.textLight)}>
    2023—2053
  </div>
</DynamicWidthContainer>
```

## Refactoring Guidelines

### 1. Typography
```jsx
// Convert this:
<h2 className="text-xl font-semibold">Title</h2>

// To this:
<h2 className={cx(typography.size.xl, typography.weight.semibold)}>Title</h2>

// Or even better, use the pre-styled component:
<SectionTitle>Title</SectionTitle>
```

### 2. Colors
```jsx
// Convert this:
<div className="text-indigo-600">Content</div>

// To this:
<div className={colors.text.indigo[600]}>Content</div>
```

### 3. Spacing
```jsx
// Convert this:
<div className="px-4 py-2 gap-2">Content</div>

// To this:
<div className={cx(spacing.padding.md, spacing.gap.sm)}>Content</div>
```

### 4. Layout
```jsx
// Convert this:
<div className="flex flex-col sm:flex-row items-center justify-between">Content</div>

// To this:
<div className={cx(components.layout.flex.responsive.col, "items-center", components.layout.flex.between)}>Content</div>
```

### 5. Common Components
```jsx
// Convert this:
<div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">Content</div>

// To this:
<div className={components.container.card}>Content</div>

// Or even better, use the pre-styled component:
<Card>Content</Card>
```

### 6. Dynamic Styling
For elements with dynamic styles (e.g., width), use the specialized components:

```jsx
// Convert this:
<div className="h-full" style={{ width: percentage + '%' }}>Content</div>

// To this:
<DynamicWidthContainer width={percentage + '%'}>Content</DynamicWidthContainer>
```

### 7. Responsive Text
```jsx
// Convert this:
<div className="text-xs sm:text-sm">Content</div>

// To this:
<div className={typography.responsive.text.xs}>Content</div>
```

### 8. Conditional Styling
```jsx
// Convert this:
<div className={`font-medium ${isActive ? 'text-green-600' : 'text-red-600'}`}>Status</div>

// To this:
<div className={cx(
  typography.weight.medium,
  isActive ? colors.text.success : colors.text.error
)}>Status</div>
```

## Benefits of Refactoring

1. **Consistency**: Ensures consistent styling across the application
2. **Maintainability**: Makes style updates easier by centralizing style definitions
3. **Readability**: Makes component code more semantic and expressive
4. **Reusability**: Encourages reuse of common style patterns
5. **Responsiveness**: Standardizes responsive behavior using tested patterns

## Additional Resources

- Check out `src/styles/styleGuide.ts` for all available style tokens
- See `src/components/common/StyledComponents.tsx` for reusable styled components
- Refer to `src/components/common/COMPONENTS.md` for documentation on styled components 