# Design System

This document defines the design system, including colors, typography, components, and style guidelines for the Ekho application.

## Overview

The design system ensures consistency across all interfaces and provides reusable components and patterns for the development team.

## 1. Color Palette

### Primary Colors

- **Primary**: #2563EB (Blue) - Main brand color, buttons, links
- **Primary Dark**: #1E40AF - Hover states, active states
- **Primary Light**: #3B82F6 - Secondary actions, highlights

### Secondary Colors

- **Secondary**: #64748B (Slate) - Secondary text, borders
- **Secondary Dark**: #475569 - Headings, emphasis
- **Secondary Light**: #94A3B8 - Placeholders, disabled states

### Semantic Colors

- **Success**: #10B981 (Green) - Success messages, confirmations
- **Warning**: #F59E0B (Amber) - Warnings, cautions
- **Error**: #EF4444 (Red) - Errors, delete actions, danger
- **Info**: #3B82F6 (Blue) - Informational messages

### Neutral Colors

- **Background**: #FFFFFF (White) - Main background
- **Background Alt**: #F8FAFC (Light Gray) - Alternate backgrounds
- **Border**: #E2E8F0 (Light Gray) - Borders, dividers
- **Text Primary**: #0F172A (Dark Gray) - Main text
- **Text Secondary**: #64748B (Slate) - Secondary text
- **Text Muted**: #94A3B8 (Light Slate) - Muted text, placeholders

### Color Usage

- **Buttons**: Primary for main actions, Secondary for secondary actions, Error for delete/danger
- **Text**: Primary for headings and body, Secondary for metadata, Muted for placeholders
- **Borders**: Border color for cards, inputs, dividers
- **Backgrounds**: White for main content, Background Alt for alternate sections

## 2. Typography

### Font Family

- **Primary Font**: System font stack (San Francisco, Segoe UI, Roboto, sans-serif)
- **Fallback**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`

### Font Sizes

- **H1**: 2.5rem (40px) - Page titles
- **H2**: 2rem (32px) - Section titles
- **H3**: 1.5rem (24px) - Subsection titles
- **H4**: 1.25rem (20px) - Card titles, small headings
- **Body**: 1rem (16px) - Body text
- **Small**: 0.875rem (14px) - Metadata, captions
- **Tiny**: 0.75rem (12px) - Labels, fine print

### Font Weights

- **Regular**: 400 - Body text
- **Medium**: 500 - Emphasis, buttons
- **Semibold**: 600 - Headings, strong emphasis
- **Bold**: 700 - Important headings

### Line Heights

- **Tight**: 1.25 - Headings
- **Normal**: 1.5 - Body text
- **Relaxed**: 1.75 - Long-form content

## 3. Spacing

### Spacing Scale

- **xs**: 0.25rem (4px)
- **sm**: 0.5rem (8px)
- **md**: 1rem (16px)
- **lg**: 1.5rem (24px)
- **xl**: 2rem (32px)
- **2xl**: 3rem (48px)
- **3xl**: 4rem (64px)

### Usage

- **Padding**: md for cards, lg for sections, xl for page padding
- **Margins**: md between elements, lg between sections
- **Gaps**: md for grid gaps, lg for larger gaps

## 4. Components

### Buttons

#### Primary Button

```
┌─────────────────────┐
│   Primary Action    │
└─────────────────────┘
```

- **Background**: Primary color
- **Text**: White
- **Padding**: 0.75rem 1.5rem
- **Border Radius**: 0.375rem (6px)
- **Hover**: Primary Dark background
- **Disabled**: Muted background, reduced opacity

#### Secondary Button

```
┌─────────────────────┐
│  Secondary Action   │
└─────────────────────┘
```

- **Background**: Transparent or Background Alt
- **Text**: Primary color
- **Border**: 1px solid Border color
- **Hover**: Background Alt background

#### Danger Button

```
┌─────────────────────┐
│   Delete Action     │
└─────────────────────┘
```

- **Background**: Error color
- **Text**: White
- **Hover**: Darker red

### Input Fields

```
┌─────────────────────────────┐
│  Label                      │
│  [_____________________]    │
│  Helper text or error      │
└─────────────────────────────┘
```

- **Border**: 1px solid Border color
- **Border Radius**: 0.375rem (6px)
- **Padding**: 0.75rem 1rem
- **Focus**: Primary color border, outline
- **Error**: Error color border, error message below
- **Disabled**: Muted background, reduced opacity

### Cards

```
┌─────────────────────────────┐
│                             │
│      Card Content           │
│                             │
└─────────────────────────────┘
```

- **Background**: White
- **Border**: 1px solid Border color (optional)
- **Border Radius**: 0.5rem (8px)
- **Shadow**: Subtle shadow (0 1px 3px rgba(0,0,0,0.1))
- **Padding**: lg (1.5rem)
- **Hover**: Elevated shadow (optional)

### Modals/Dialogs

```
┌─────────────────────────────┐
│  Modal Title          [X]   │
├─────────────────────────────┤
│                             │
│      Modal Content          │
│                             │
├─────────────────────────────┤
│  [Cancel]  [Action]         │
└─────────────────────────────┘
```

- **Overlay**: Dark overlay (rgba(0,0,0,0.5))
- **Background**: White
- **Border Radius**: 0.5rem (8px)
- **Shadow**: Large shadow
- **Max Width**: 500px (forms), 600px (content)
- **Padding**: lg (1.5rem)

### Badges

```
[Badge Text]
```

- **Background**: Primary Light or Secondary Light
- **Text**: Primary or Secondary Dark
- **Padding**: 0.25rem 0.5rem
- **Border Radius**: 9999px (pill shape)
- **Font Size**: Small

### Toast Notifications

```
┌─────────────────────────────┐
│  ✓ Success message          │
└─────────────────────────────┘
```

- **Position**: Top-right or bottom-right
- **Background**: White with colored left border
- **Shadow**: Medium shadow
- **Border Radius**: 0.375rem (6px)
- **Padding**: md (1rem)
- **Auto-dismiss**: 3-5 seconds
- **Types**: Success (green), Error (red), Info (blue), Warning (amber)

## 5. Layout Patterns

### Grid System

- **Container**: Max-width 1200-1400px, centered
- **Columns**: 12-column grid (desktop), responsive
- **Gutters**: md spacing between columns
- **Breakpoints**: 
  - Mobile: < 768px (1 column)
  - Tablet: 768px - 1024px (2 columns)
  - Desktop: > 1024px (3-4 columns)

### Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 6. Icons

### Icon Library

- Use consistent icon library (e.g., Heroicons, Feather Icons)
- **Size**: 16px, 20px, 24px (standard sizes)
- **Style**: Outline or solid (consistent across app)
- **Color**: Inherit text color or semantic colors

### Common Icons

- **Navigation**: Menu, Home, Collections
- **Actions**: Add, Edit, Delete, Close, Save
- **Status**: Check, Error, Warning, Info
- **User**: User, Logout, Settings

## 7. Animations and Transitions

### Transitions

- **Duration**: 150ms (fast), 200ms (standard), 300ms (slow)
- **Easing**: ease-in-out (standard)
- **Properties**: opacity, transform, color, background-color

### Common Animations

- **Hover**: Slight scale or shadow increase
- **Loading**: Spinner rotation
- **Modal**: Fade in + slide up
- **Toast**: Slide in from side
- **Button Press**: Slight scale down

## 8. Accessibility Guidelines

### Color Contrast

- **Text on Background**: Minimum 4.5:1 ratio (AA)
- **Large Text**: Minimum 3:1 ratio (AA)
- **Interactive Elements**: Minimum 3:1 ratio

### Focus Indicators

- **Visible**: 2px solid Primary color outline
- **Offset**: 2px offset from element
- **Always Visible**: Never remove focus indicators

### Touch Targets

- **Minimum Size**: 44x44px for mobile
- **Spacing**: Adequate spacing between touch targets

## 9. Design Tokens

### Implementation

Design tokens should be defined in CSS variables or theme configuration:

```css
:root {
  --color-primary: #2563EB;
  --color-primary-dark: #1E40AF;
  --spacing-md: 1rem;
  --font-size-body: 1rem;
  --border-radius: 0.375rem;
  /* ... */
}
```

## 10. Component Specifications

### Form Components

- Input, Textarea, Select, Checkbox, Radio
- File Upload with preview
- Validation states and messages

### Navigation Components

- Navigation bar
- User menu dropdown
- Breadcrumbs
- Mobile drawer menu

### Display Components

- Cards (collection, record)
- Lists (collection list, record list)
- Empty states
- Loading states
- Error states

### Feedback Components

- Toast notifications
- Modal dialogs
- Confirmation dialogs
- Progress indicators

## 11. Design Principles

1. **Consistency**: Use design system components consistently
2. **Clarity**: Clear visual hierarchy and information architecture
3. **Accessibility**: WCAG 2.1 AA compliance
4. **Responsiveness**: Mobile-first, responsive design
5. **Performance**: Optimize images and animations
6. **User-Centric**: Design based on user needs and stories

## 12. Design Assets

### Required Assets

- Logo/Brand mark
- Icon set (SVG preferred)
- Image placeholders
- Loading spinners
- Empty state illustrations (optional)

### File Formats

- **Icons**: SVG (preferred) or PNG
- **Images**: JPG, PNG, WebP
- **Logos**: SVG (preferred) or PNG
