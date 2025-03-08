# Retraite Application Style Guide

This style guide provides consistent styling across the Retraite retirement planning application. It ensures a cohesive user experience through standardized typography, colors, spacing, and component styles.

## Usage

### Importing the Style Guide

Import the style guide utilities into your component:

```jsx
import { typography, colors, spacing, components, cx } from '../../styles/styleGuide';
```

### Using Styled Components

For common UI elements, use the pre-styled components:

```jsx
import { Title, Card, PrimaryButton, StatusIndicator } from '../common/StyledComponents';

// Example usage
const MyComponent = () => (
  <Card>
    <Title>My Section</Title>
    <p>Content goes here</p>
    <PrimaryButton onClick={handleAction}>Submit</PrimaryButton>
  </Card>
);
```

## Style Guide Structure

### Colors

- Primary palette (indigo-based)
- Secondary palette (purple-based)
- Accent colors (blue, green, red, yellow)
- Neutral grays
- Status colors (success, warning, error, info)
- Phase-specific colors (investment, retirement, depleted)
- Text colors (mapped text utility classes)
- Background colors (mapped background utility classes)

### Typography

- Standardized text sizes (xs, sm, base, lg, xl, 2xl, 3xl)
- Consistent font weights (normal, medium, semibold, bold)
- Pre-defined text styles for common use cases (title, subtitle, label, value, etc.)
- Text truncation options (single-line, multi-line)
- Text transformation utilities (uppercase, lowercase, capitalize)

### Spacing

- Container padding
- Section spacing
- Gap sizes
- Margin utilities
- Padding utilities
- Responsive spacing variations

### Components

- Container styles (cards, sections, highlight boxes)
- Header styles
- Button variants
- Form elements
- Data visualization elements
- Table styles (containers, headers, rows, cells)
- Layout utilities (flex, grid, positioning)
- Animation classes

## Using Specific Utilities

### Dynamic Components & Styling

For components with dynamic styles, prefer using the utility classes:

```jsx
// INSTEAD OF THIS (with inline styles):
<div style={{ width: '100%', backgroundColor: 'white' }}>...</div>

// USE THIS:
<div className={cx(components.layout.position.relative, colors.bg.white)}>...</div>

// For dynamic widths, use dynamic class construction:
<div className={cx(
  components.dataViz.progressBar.container,
  index % 2 === 0 ? colors.bg.light : colors.bg.white
)}>
  <div 
    className={components.dataViz.progressBar.filled} 
    style={{ width: `${percentage}%` }}
  ></div>
</div>
```

### Table Cell Styling

Use the standardized table and cell styles for table components:

```jsx
<div className={components.table.container}>
  <div className={components.table.header}>
    <div className={cx(spacing.padding.cell, colors.text.tertiary)}>Name</div>
    <div className={cx(spacing.padding.cell, colors.text.tertiary)}>Value</div>
  </div>
  <div className={components.table.row.base}>
    <div className={cx(components.table.cell.base, spacing.padding.cell)}>Data</div>
    <div className={cx(components.table.cell.base, spacing.padding.cell)}>123</div>
  </div>
</div>
```

### Layout Utilities

Use the standardized layout utilities instead of custom flex or grid patterns:

```jsx
// INSTEAD OF THIS:
<div className="flex flex-col md:flex-row items-center justify-between gap-4">...</div>

// USE THIS:
<div className={cx(
  components.layout.flex.col, 
  'md:flex-row', 
  components.layout.flex.between, 
  spacing.gap.md
)}>...</div>
```

## Utility Functions

### cx - Class Combiner

The `cx` utility function combines Tailwind classes and conditionally applies them:

```jsx
import { cx } from '../../styles/styleGuide';

// Basic usage
<div className={cx('text-lg', 'font-bold')}>Text</div>

// With conditions
<div className={cx(
  'text-lg',
  isActive && 'font-bold',
  isError && colors.text.error
)}>Text</div>
```

## Best Practices

1. Always use the style guide for new components to maintain consistency
2. Prefer styled components where available
3. For custom styling, utilize the existing color and spacing values
4. Use the `cx` utility for conditional class combinations
5. When extending styles, follow the established patterns 
6. Avoid hardcoding Tailwind classes directly in components
7. Minimize the use of inline styles to dynamic values only (e.g., width percentages)
8. For frequently repeated inline styles, consider creating a utility in styleGuide.ts
9. Document any custom component styles that should be added to the style guide
10. Use the layout utilities for common layout patterns rather than repeating css classes 