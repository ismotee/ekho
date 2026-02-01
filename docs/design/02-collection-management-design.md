# Collection Management UI Design

This document specifies the UI/UX design for collection management features, based on user stories US-005 through US-009.

## Overview

The collection management interface allows users to create, view, edit, and close art collections. Both authenticated and anonymous users can view collections, but only owners can modify them.

## User Stories Reference

- **US-005**: Create Collection
- **US-006**: Edit Collection
- **US-007**: Close Collection
- **US-008**: View Collections
- **US-009**: View Collection Details

## 1. Collection List View

### Layout (Grid View)

```
┌─────────────────────────────────────────────────────┐
│  Navigation Bar                                     │
├─────────────────────────────────────────────────────┤
│  Collections                    [+ Create Collection]│
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │Collection│  │Collection│  │Collection│        │
│  │  Card 1  │  │  Card 2  │  │  Card 3  │        │
│  │          │  │          │  │          │        │
│  │  Name    │  │  Name    │  │  Name    │        │
│  │  Desc... │  │  Desc... │  │  Desc... │        │
│  │  Owner   │  │  Owner   │  │  Owner   │        │
│  │  [View]  │  │  [View]  │  │  [View]  │        │
│  └──────────┘  └──────────┘  └──────────┘        │
│                                                      │
│  ┌──────────┐  ┌──────────┐                       │
│  │Collection│  │Collection│                       │
│  │  Card 4  │  │  Card 5  │                       │
│  └──────────┘  └──────────┘                       │
│                                                      │
│  [< Previous]  Page 1 of 3  [Next >]                │
└─────────────────────────────────────────────────────┘
```

### Layout (List View - Alternative)

```
┌─────────────────────────────────────────────────────┐
│  Collections                    [+ Create Collection]│
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ Collection Name                    [View]    │   │
│  │ Description preview...                        │   │
│  │ Owner: username | Created: Jan 1, 2024       │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ Collection Name                    [View]    │   │
│  │ Description preview...                        │   │
│  │ Owner: username | Created: Jan 1, 2024       │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Design Specifications

- **Header**: Page title "Collections" with "Create Collection" button (visible only to authenticated users)
- **View Toggle**: Grid/List view switcher (optional for initial version)
- **Collection Card**:
  - Collection name (heading)
  - Description (truncated to 2-3 lines with ellipsis)
  - Owner username
  - Creation date
  - Record count (optional)
  - Closed badge (if `is_closed=True`)
  - "View" button/link
- **Empty State**: 
  - Centered message: "No collections yet"
  - Illustration or icon
  - "Create your first collection" button (if authenticated)
- **Pagination**: Bottom of page, shows page numbers and prev/next buttons
- **Loading State**: Skeleton cards or spinner

### Closed Collection Indicator

- **Badge**: Small badge on card showing "Closed" or "Read-Only"
- **Visual Style**: Muted colors, different border style, or icon

## 2. Create Collection Form

### Layout

```
┌─────────────────────────────────────┐
│  Create Collection          [X]     │
├─────────────────────────────────────┤
│                                     │
│  Name *                            │
│  [_____________________________]    │
│                                     │
│  Description                       │
│  [_____________________________]    │
│  [_____________________________]    │
│  [_____________________________]    │
│                                     │
│  [Cancel]  [Create Collection]      │
│                                     │
└─────────────────────────────────────┘
```

### Design Specifications

- **Modal/Dialog**: Centered overlay modal
- **Fields**:
  - Name: Required text input, max 200 characters, placeholder "Enter collection name"
  - Description: Optional textarea, max 1000 characters, placeholder "Describe your collection (optional)"
- **Validation**:
  - Real-time validation
  - Error messages below fields
  - Character count indicator for description
- **Buttons**: 
  - Cancel: Secondary button, closes modal
  - Create: Primary button, disabled if name is empty
- **Success**: Modal closes, redirect to new collection detail page, success toast

## 3. Collection Detail View

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Navigation Bar                                     │
├─────────────────────────────────────────────────────┤
│  ← Back to Collections                              │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Collection Name                    [Edit] [Close]  │
│  (Owner: username | Created: Jan 1, 2024)          │
│                                                      │
│  Description text goes here. This is a longer       │
│  description that can span multiple lines...         │
│                                                      │
├─────────────────────────────────────────────────────┤
│  Records (5)                                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Image   │  │  Image   │  │  Image   │        │
│  │  Title   │  │  Title   │  │  Title   │        │
│  │  Artist  │  │  Artist  │  │  Artist  │        │
│  │  [View]  │  │  [View]  │  │  [View]  │        │
│  └──────────┘  └──────────┘  └──────────┘        │
│                                                      │
│  [+ Add Record] (only if owner and not closed)      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Design Specifications

- **Header Section**:
  - Collection name (large heading)
  - Metadata: Owner, creation date, update date
  - Action buttons: Edit, Close (only visible to owner, hidden if closed)
  - Closed badge (if applicable)
- **Description Section**: Full description text, formatted
- **Records Section**:
  - Section header with record count
  - Grid/list of record cards
  - "Add Record" button (only if owner and collection not closed)
  - Empty state if no records
- **Breadcrumb**: Back link to collections list

### Owner vs Non-Owner View

- **Owner (not closed)**: Edit, Close, Add Record buttons visible
- **Owner (closed)**: No edit/close buttons, no Add Record button
- **Non-Owner/Anonymous**: Read-only view, no action buttons

## 4. Edit Collection Form

### Layout

Similar to Create Collection Form, but:
- Pre-populated with current data
- Title: "Edit Collection"
- Button: "Save Changes" instead of "Create Collection"

### Design Specifications

- **Modal/Dialog**: Same as create form
- **Pre-population**: Fields filled with current collection data
- **Validation**: Same as create form
- **Success**: Modal closes, collection detail page updates, success toast

### Restrictions

- Edit button disabled/hidden if collection is closed
- Error message if attempting to edit closed collection

## 5. Close Collection Dialog

### Layout

```
┌──────────────────────────────┐
│  Close Collection?            │
├──────────────────────────────┤
│                              │
│  ⚠️ Warning                   │
│                              │
│  Closing this collection     │
│  will make it read-only.     │
│                              │
│  You will no longer be able  │
│  to:                         │
│  • Edit the collection       │
│  • Add new records           │
│  • Edit existing records     │
│  • Delete records            │
│                              │
│  This action cannot be       │
│  undone.                     │
│                              │
│  [Cancel]  [Close Collection]│
│                              │
└──────────────────────────────┘
```

### Design Specifications

- **Modal/Dialog**: Warning-style dialog
- **Warning Icon**: Prominent warning icon
- **Message**: Clear explanation of consequences
- **List**: Bullet points of what will be disabled
- **Buttons**:
  - Cancel: Secondary button, closes dialog
  - Close Collection: Danger/primary button (red/orange)
- **Confirmation**: After confirmation, collection is closed, page updates, success toast

## 6. Empty States

### Empty Collections List

```
┌─────────────────────────────────────┐
│                                     │
│          [Empty Icon]               │
│                                     │
│      No collections yet             │
│                                     │
│  Start by creating your first      │
│  collection to organize your art.   │
│                                     │
│     [+ Create Collection]           │
│                                     │
└─────────────────────────────────────┘
```

### Empty Collection (No Records)

```
┌─────────────────────────────────────┐
│                                     │
│          [Empty Icon]               │
│                                     │
│      This collection is empty       │
│                                     │
│  Add your first art record to      │
│  get started.                       │
│                                     │
│        [+ Add Record]               │
│                                     │
└─────────────────────────────────────┘
```

## 7. Responsive Design

### Mobile (< 768px)

- Single column grid
- Full-width cards
- Stacked action buttons
- Bottom sheet or full-screen modal for forms
- Hamburger menu for navigation

### Tablet (768px - 1024px)

- 2-column grid
- Side-by-side buttons where appropriate
- Modal dialogs

### Desktop (> 1024px)

- 3-4 column grid
- Generous spacing
- Hover effects on cards
- Dropdown menus

## 8. Accessibility Requirements

- **WCAG 2.1 AA Compliance**:
  - Keyboard navigation for all interactive elements
  - Focus indicators visible
  - ARIA labels for buttons and actions
  - Screen reader announcements for state changes
  - Color contrast ratios meet AA standards
  - Modal dialogs trap focus and can be closed with Escape

## 9. User Flows

### Create Collection Flow

1. User clicks "Create Collection" button
2. Modal opens with form
3. User fills name (required) and description (optional)
4. Real-time validation provides feedback
5. User clicks "Create Collection"
6. On success: Modal closes, redirect to new collection detail page
7. On error: Display error message

### Edit Collection Flow

1. Owner clicks "Edit" button on collection detail page
2. Modal opens with pre-populated form
3. Owner modifies fields
4. Owner clicks "Save Changes"
5. On success: Modal closes, page updates with new data
6. On error: Display error message

### Close Collection Flow

1. Owner clicks "Close" button
2. Confirmation dialog appears
3. Owner reads warning and consequences
4. Owner clicks "Close Collection" to confirm
5. Collection is closed, page updates, success message
6. Edit/Add buttons disappear

## 10. Design Assets Needed

- Collection card component
- Collection detail header component
- Create/edit collection form component
- Close collection dialog component
- Empty state component
- Pagination component
- Loading skeleton component
- Badge component (for "Closed" status)
