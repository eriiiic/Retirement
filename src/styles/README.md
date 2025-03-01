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

### Typography

- Standardized text sizes (xs, sm, base, lg, xl, 2xl, 3xl)
- Consistent font weights (normal, medium, semibold, bold)
- Pre-defined text styles for common use cases (title, subtitle, label, value, etc.)

### Colors

- Primary palette (indigo-based)
- Secondary palette (purple-based)
- Accent colors (blue, green, red, yellow)
- Neutral grays
- Status colors (success, warning, error, info)
- Phase-specific colors (investment, retirement, depleted)

### Spacing

- Container padding
- Section spacing
- Gap sizes
- Margin utilities

### Components

- Container styles (cards, sections, highlight boxes)
- Header styles
- Button variants
- Form elements
- Data visualization elements

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
  isError && 'text-red-500'
)}>Text</div>
```

## Best Practices

1. Always use the style guide for new components to maintain consistency
2. Prefer styled components where available
3. For custom styling, utilize the existing color and spacing values
4. Use the `cx` utility for conditional class combinations
5. When extending styles, follow the established patterns 