# Navigation and Layout Design

This document specifies the navigation structure and overall layout design for the Ekho application.

## Overview

The navigation and layout system provides consistent structure across all pages, supporting both authenticated and anonymous users with appropriate access controls and visual indicators.

## 1. Main Navigation Bar

### Layout

```
┌─────────────────────────────────────────────────────┐
│  [Logo] Ekho    Collections    [User Menu ▼]       │
└─────────────────────────────────────────────────────┘
```

### Design Specifications

- **Left Section**:
  - Logo/Brand name: "Ekho" (clickable, links to home/collections)
  - Navigation links: "Collections" (always visible)
- **Right Section**:
  - User Menu (if authenticated): Username dropdown
  - Login/Register links (if anonymous)
- **Style**: 
  - Fixed or sticky at top
  - Background color (white or brand color)
  - Shadow or border for separation
  - Height: 60-70px

### User Menu Dropdown (Authenticated)

```
┌─────────────────────┐
│  username           │ (header, non-clickable)
├─────────────────────┤
│  My Collections     │ (link)
│  Logout             │ (action)
└─────────────────────┘
```

- **Trigger**: Username or user icon
- **Items**:
  - Username (header, non-clickable)
  - "My Collections" link (filters to user's collections)
  - "Logout" action
- **Position**: Right-aligned, below user menu trigger
- **Behavior**: Closes on click outside or item selection

### Anonymous User Menu

- **Links**: "Login" and "Register" buttons/links
- **Style**: Secondary button style for Login, primary for Register

## 2. Main Layout Structure

### Desktop Layout

```
┌─────────────────────────────────────────────────────┐
│  Navigation Bar                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Breadcrumb Navigation]                            │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │                                             │  │
│  │         Main Content Area                  │  │
│  │                                             │  │
│  │         (Page-specific content)             │  │
│  │                                             │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  [Footer - Optional]                                │
└─────────────────────────────────────────────────────┘
```

### Design Specifications

- **Container**: Max-width 1200-1400px, centered
- **Padding**: Responsive padding (16px mobile, 24px tablet, 32px desktop)
- **Content Area**: Flexible width, responsive grid
- **Footer**: Optional, minimal (copyright, links)

## 3. Breadcrumb Navigation

### Layout

```
← Back to Collections
```

or

```
Home > Collections > Collection Name > Record Title
```

### Design Specifications

- **Location**: Below navigation bar, above main content
- **Style**: 
  - Simple back link for single level
  - Breadcrumb trail for deeper navigation
  - Muted text color
  - Clickable links
- **Use Cases**:
  - Collection detail: "← Back to Collections"
  - Record detail: "← Back to Collection Name" or breadcrumb trail

## 4. Page Layouts

### Collections List Page

```
┌─────────────────────────────────────────────────────┐
│  Navigation Bar                                     │
├─────────────────────────────────────────────────────┤
│  Collections                    [+ Create Collection]│
├─────────────────────────────────────────────────────┤
│                                                      │
│  [Collection Grid/List]                             │
│                                                      │
│  [Pagination]                                       │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Collection Detail Page

```
┌─────────────────────────────────────────────────────┐
│  Navigation Bar                                     │
├─────────────────────────────────────────────────────┤
│  ← Back to Collections                              │
├─────────────────────────────────────────────────────┤
│                                                      │
│  [Collection Header with Actions]                   │
│  [Collection Description]                           │
│  [Records Section]                                  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Record Detail Page

```
┌─────────────────────────────────────────────────────┐
│  Navigation Bar                                     │
├─────────────────────────────────────────────────────┤
│  ← Back to Collection                               │
├─────────────────────────────────────────────────────┤
│                                                      │
│  [Record Image and Details]                         │
│  [Action Buttons]                                   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## 5. Responsive Navigation

### Mobile (< 768px)

#### Hamburger Menu

```
┌─────────────────────────────────────┐
│  [☰] Ekho              [User Menu]   │
└─────────────────────────────────────┘
```

- **Hamburger Icon**: Opens side drawer menu
- **User Menu**: Simplified, icon-based or dropdown

#### Side Drawer Menu

```
┌─────────────────────┐
│  [X]                │
│                     │
│  Collections        │
│  My Collections     │
│  (if authenticated) │
│                     │
│  ───────────────    │
│                     │
│  Login              │
│  Register           │
│  (if anonymous)     │
│                     │
│  ───────────────    │
│                     │
│  Logout             │
│  (if authenticated) │
│                     │
└─────────────────────┘
```

- **Position**: Slides in from left
- **Overlay**: Dark overlay behind drawer
- **Close**: X button, click outside, or swipe away

### Tablet (768px - 1024px)

- Full navigation bar visible
- User menu dropdown
- No hamburger menu

### Desktop (> 1024px)

- Full navigation bar
- All links visible
- User menu dropdown
- Hover effects

## 6. Public vs Authenticated Views

### Public (Anonymous) View

- **Navigation**: Logo, Collections link, Login/Register buttons
- **Access**: Can view all collections and records (read-only)
- **Restrictions**: No create/edit/delete actions visible
- **Visual**: No user-specific content

### Authenticated View

- **Navigation**: Logo, Collections link, User menu
- **Access**: Can view all collections and records, manage own collections
- **Actions**: Create collection, edit/close own collections, manage own records
- **Visual**: User menu visible, action buttons on owned content

## 7. Loading States

### Page Loading

- **Skeleton Loaders**: Placeholder content matching layout
- **Spinner**: Centered spinner for initial page load
- **Progressive Loading**: Content appears as it loads

### Navigation Loading

- **Button States**: Disabled state during actions
- **Spinner**: Small spinner on action buttons
- **Feedback**: Toast notifications for success/error

## 8. Error States

### 404 Not Found

```
┌─────────────────────────────────────┐
│                                     │
│          404                        │
│                                     │
│      Page Not Found                 │
│                                     │
│  The page you're looking for        │
│  doesn't exist.                     │
│                                     │
│     [Go to Collections]             │
│                                     │
└─────────────────────────────────────┘
```

### 403 Forbidden

- Error message: "You don't have permission to access this resource"
- Redirect or back button

### 500 Server Error

- Error message: "Something went wrong. Please try again later."
- Retry button or contact information

## 9. Accessibility Requirements

- **WCAG 2.1 AA Compliance**:
  - Keyboard navigation for all interactive elements
  - Focus indicators visible
  - Skip to main content link
  - ARIA labels for navigation items
  - Screen reader announcements for navigation changes
  - Color contrast ratios meet AA standards
  - Mobile menu accessible via keyboard

## 10. Design Assets Needed

- Navigation bar component
- User menu dropdown component
- Hamburger menu component (mobile)
- Side drawer component (mobile)
- Breadcrumb component
- Loading skeleton component
- Error page components
- Footer component (optional)
