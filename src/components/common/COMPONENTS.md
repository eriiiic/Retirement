# Styled Components Documentation

This document provides documentation for the reusable styled components available in the Retraite application. These components help maintain consistent styling while reducing the need for duplicate code or inline styles.

## Basic Text Components

### Title

A large, bold title for major sections.

```jsx
import { Title } from '../common/StyledComponents';

<Title>Section Title</Title>
<Title className="mb-4">Section Title with Margin</Title>
```

### SectionTitle

A medium-sized title for sub-sections.

```jsx
import { SectionTitle } from '../common/StyledComponents';

<SectionTitle>Subsection Title</SectionTitle>
```

### Subtitle

A smaller, less emphasized text, often used under titles.

```jsx
import { Subtitle } from '../common/StyledComponents';

<Subtitle>Additional context or description</Subtitle>
```

### Label

A small, uppercase label for form fields or data points.

```jsx
import { Label } from '../common/StyledComponents';

<Label>Field Label</Label>
```

### Value

Standard text for displaying data values.

```jsx
import { Value } from '../common/StyledComponents';

<Value>{formattedAmount}</Value>
```

### Caption

Smaller text for supplementary information.

```jsx
import { Caption } from '../common/StyledComponents';

<Caption>Last updated: Yesterday</Caption>
```

## Metric Values

Special text components for displaying metrics with semantic coloring.

```jsx
import { PositiveMetric, NegativeMetric, NeutralMetric } from '../common/StyledComponents';

<PositiveMetric>+15.4%</PositiveMetric>
<NegativeMetric>-2.3%</NegativeMetric>
<NeutralMetric>7.0x</NeutralMetric>
```

## Container Components

### Card

A container with borders, shadow, and rounded corners.

```jsx
import { Card } from '../common/StyledComponents';

<Card>
  <h3>Card Content</h3>
  <p>More content here...</p>
</Card>

<Card className="p-6">
  Card with custom padding
</Card>
```

### Section

A lighter-weight container component.

```jsx
import { Section } from '../common/StyledComponents';

<Section>
  Section content
</Section>
```

### HighlightBox

A container with a light background to highlight important content.

```jsx
import { HighlightBox } from '../common/StyledComponents';

<HighlightBox>
  Important information
</HighlightBox>
```

## Header Components

Components for section headers and title areas.

```jsx
import { MainHeader, SectionHeader, SubsectionHeader } from '../common/StyledComponents';

<MainHeader>
  <h1>Page Title</h1>
</MainHeader>

<SectionHeader>Section Name</SectionHeader>

<SubsectionHeader>Details</SubsectionHeader>
```

## Button Components

### PrimaryButton

Main call-to-action button with prominent styling.

```jsx
import { PrimaryButton } from '../common/StyledComponents';

<PrimaryButton onClick={handleSubmit}>
  Submit
</PrimaryButton>

<PrimaryButton disabled={isLoading}>
  {isLoading ? 'Processing...' : 'Submit'}
</PrimaryButton>
```

### SecondaryButton

Less prominent button for secondary actions.

```jsx
import { SecondaryButton } from '../common/StyledComponents';

<SecondaryButton onClick={handleCancel}>
  Cancel
</SecondaryButton>
```

## Tab Components

For creating tab navigation interfaces.

```jsx
import { Tab } from '../common/StyledComponents';

<div className="flex space-x-1 rounded-lg p-1 bg-gray-100">
  <Tab 
    isActive={activeTab === 'details'} 
    onClick={() => setActiveTab('details')}
  >
    Details
  </Tab>
  <Tab 
    isActive={activeTab === 'history'} 
    onClick={() => setActiveTab('history')}
  >
    History
  </Tab>
</div>
```

## Status Indicator

For displaying status information with appropriate color coding.

```jsx
import { StatusIndicator } from '../common/StyledComponents';

<StatusIndicator 
  isPositive={true} 
  text="On Track" 
  message="Your retirement plan is looking good"
/>

<StatusIndicator 
  isPositive={false} 
  text="Attention Needed" 
  message="Adjust your parameters to improve outcomes"
/>
```

## Dynamic Layout Components

### DynamicWidthContainer

For elements that need dynamic width control without direct inline styles.

```jsx
import { DynamicWidthContainer } from '../common/StyledComponents';

<DynamicWidthContainer width="75%">
  <p>Content with controlled width</p>
</DynamicWidthContainer>

// For timeline segments
<div className="flex">
  <DynamicWidthContainer width={`${workingPercentage}%`} className="bg-blue-500">
    <div className="text-white p-2">Working Phase</div>
  </DynamicWidthContainer>
  <DynamicWidthContainer width={`${retirementPercentage}%`} className="bg-purple-500">
    <div className="text-white p-2">Retirement Phase</div>
  </DynamicWidthContainer>
</div>
```

### EnhancedProgressBar

Customizable progress bar with options for animation, color, and size.

```jsx
import { EnhancedProgressBar } from '../common/StyledComponents';

// Basic usage
<EnhancedProgressBar percentage={65} />

// With all options
<EnhancedProgressBar 
  percentage={75} 
  variant="success" 
  height="md" 
  animate={true}
  showLabel={true}
/>

// Available variants: 'primary', 'success', 'warning', 'error', 'info'
// Available heights: 'xs', 'sm', 'md', 'lg'
```

### CenteredElement

For absolute positioning of elements (often used within relative containers).

```jsx
import { CenteredElement } from '../common/StyledComponents';

<div className="relative h-24">
  {/* Center horizontally and vertically */}
  <CenteredElement>
    <div className="bg-indigo-100 p-2">Centered Content</div>
  </CenteredElement>
</div>

<div className="relative h-24">
  {/* Center vertically only */}
  <CenteredElement horizontal={false}>
    <div className="bg-indigo-100 p-2">Vertically Centered</div>
  </CenteredElement>
</div>
```

### TableCell

For consistent table cell styling with various alignment and emphasis options.

```jsx
import { TableCell } from '../common/StyledComponents';

<div className="flex">
  <TableCell width="25%" variant="default">User Name</TableCell>
  <TableCell width="25%" variant="highlight">John Smith</TableCell>
  <TableCell width="25%" variant="numeric" align="right">$1,250.00</TableCell>
  <TableCell width="25%" variant="action" align="center">View Details</TableCell>
</div>

// Available alignments: 'left', 'center', 'right'
// Available variants: 'default', 'highlight', 'numeric', 'action'
```

### Timeline

For creating timeline visualizations with multiple segments.

```jsx
import { Timeline } from '../common/StyledComponents';

const timelineSegments = [
  {
    id: 'working',
    width: '60%',
    label: 'Working Phase',
    sublabel: '30 years',
    color: '#4338ca' // indigo-700
  },
  {
    id: 'retirement',
    width: '30%',
    label: 'Retirement',
    sublabel: '15 years',
    color: '#9333ea' // purple-600
  },
  {
    id: 'depleted',
    width: '10%',
    label: 'Depleted',
    sublabel: '5 years',
    color: '#e11d48' // rose-600
  }
];

<Timeline 
  segments={timelineSegments}
  height="md" 
/>

// Available heights: 'sm', 'md', 'lg'
```

### GridLayout

For creating responsive grid layouts with various column configurations.

```jsx
import { GridLayout } from '../common/StyledComponents';

<GridLayout columns={3} gap="md">
  <div className="bg-white p-4 rounded shadow">Item 1</div>
  <div className="bg-white p-4 rounded shadow">Item 2</div>
  <div className="bg-white p-4 rounded shadow">Item 3</div>
  <div className="bg-white p-4 rounded shadow">Item 4</div>
  <div className="bg-white p-4 rounded shadow">Item 5</div>
</GridLayout>

// Available columns: 1, 2, 3, 4
// Available gaps: 'xs', 'sm', 'md', 'lg', 'xl'
```

## Best Practices

1. **Prefer Styled Components** over direct Tailwind classes when possible
2. **Use the `className` prop** to extend styled components with additional styles
3. **Avoid inline styles** for anything other than dynamic dimensions
4. **Combine related components** for consistent UIs (e.g., `Card` with `SectionTitle`)
5. **Use dynamic components** like `EnhancedProgressBar` instead of creating custom progress indicators with inline styles 