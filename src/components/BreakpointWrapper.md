# BreakpointWrapper Component

A React component that displays a responsive breakpoint warning for desktop and tablet screens while allowing mobile content to render normally.

## Features

- **Responsive Detection**: Automatically detects screen width and shows warnings for desktop (≥1024px) and tablet (768px-1023px) screens
- **Closeable**: Users can dismiss the warning and continue using the app
- **Customizable**: Optional close button, custom styling, and callback support
- **Mobile-First**: Content renders normally on mobile screens (<768px)
- **Accessible**: Proper ARIA labels and semantic HTML
- **Beautiful UI**: Modern gradient design with clear messaging

## Installation

The component is already included in your project at `src/components/BreakpointWrapper.tsx`.

## Usage

### Basic Usage

```tsx
import React from 'react';
import { BreakpointWrapper } from './components/BreakpointWrapper';

function App() {
  return (
    <BreakpointWrapper>
      <div>Your mobile app content here</div>
    </BreakpointWrapper>
  );
}
```

### With Close Handler

```tsx
function App() {
  const handleClose = () => {
    console.log('User closed the breakpoint warning');
    // Perform any cleanup or tracking here
  };

  return (
    <BreakpointWrapper onClose={handleClose}>
      <div>Your mobile app content here</div>
    </BreakpointWrapper>
  );
}
```

### Without Close Button

```tsx
function App() {
  return (
    <BreakpointWrapper showCloseButton={false}>
      <div>Your mobile app content here</div>
    </BreakpointWrapper>
  );
}
```

### With Custom Styling

```tsx
function App() {
  return (
    <BreakpointWrapper className="custom-breakpoint-wrapper">
      <div>Your mobile app content here</div>
    </BreakpointWrapper>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | **Required** | The content to render on mobile screens |
| `onClose` | `() => void` | `undefined` | Callback function called when the warning is closed |
| `showCloseButton` | `boolean` | `true` | Whether to show the close button in the header |
| `className` | `string` | `''` | Additional CSS classes to apply to the wrapper |

## Breakpoints

- **Mobile**: `< 768px` - Content renders normally
- **Tablet**: `768px - 1023px` - Shows tablet warning
- **Desktop**: `≥ 1024px` - Shows desktop warning

## Component Structure

The component displays:
1. **Header**: Gradient background with icons and optional close button
2. **Content**: Warning message with tips for better experience
3. **Actions**: "Continue Anyway" and "Close" buttons
4. **Footer**: Information about future desktop/tablet support

## Styling

The component uses Tailwind CSS classes and includes:
- Responsive design patterns
- Hover states and transitions
- Gradient backgrounds
- Proper spacing and typography
- Accessibility features

## Testing

The component includes comprehensive tests covering:
- Mobile content rendering
- Desktop/tablet warning display
- Close button functionality
- Continue button behavior
- Screen size detection
- Custom styling application

Run tests with:
```bash
npm test -- src/components/__tests__/BreakpointWrapper.test.tsx
```

## Examples

See `src/examples/BreakpointWrapperExample.tsx` for complete usage examples.

## Accessibility

- Uses semantic HTML elements
- Includes proper ARIA labels
- Keyboard navigation support
- High contrast colors for readability
- Focus management for interactive elements

## Browser Support

The component works in all modern browsers that support:
- CSS Grid and Flexbox
- CSS custom properties
- ES6+ JavaScript features
- ResizeObserver API (polyfilled if needed)
