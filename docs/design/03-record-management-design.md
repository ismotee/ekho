# Record Management UI Design

This document specifies the UI/UX design for art record management features, based on user stories US-010 through US-015.

## Overview

The record management interface allows collection owners to create, view, edit, and delete art records within their collections. Both authenticated and anonymous users can view records, but only owners can modify them (and only if the collection is not closed).

## User Stories Reference

- **US-010**: Create Record
- **US-011**: Edit Record
- **US-012**: Delete Record
- **US-013**: View Records
- **US-014**: View Record Details
- **US-015**: Upload Image for Record

## 1. Record List View (Within Collection)

### Layout (Grid View)

```
┌─────────────────────────────────────────────────────┐
│  Collection: My Art Collection                      │
├─────────────────────────────────────────────────────┤
│  Records (12)                    [+ Add Record]     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Image   │  │  Image   │  │  Image   │        │
│  │          │  │          │  │          │        │
│  │  Title   │  │  Title   │  │  Title   │        │
│  │  Artist  │  │  Artist  │  │  Artist  │        │
│  │  Year    │  │  Year    │  │  Year    │        │
│  │  [View]  │  │  [View]  │  │  [View]  │        │
│  └──────────┘  └──────────┘  └──────────┘        │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Image   │  │  Image   │  │  Image   │        │
│  └──────────┘  └──────────┘  └──────────┘        │
│                                                      │
│  [< Previous]  Page 1 of 2  [Next >]                │
└─────────────────────────────────────────────────────┘
```

### Layout (List View - Alternative)

```
┌─────────────────────────────────────────────────────┐
│  Records (12)                    [+ Add Record]     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌────┐ ┌──────────────────────────────────────┐  │
│  │Img │ │ Title                          [View] │  │
│  │    │ │ Artist | Year | Medium                 │  │
│  └────┘ └──────────────────────────────────────┘  │
│                                                      │
│  ┌────┐ ┌──────────────────────────────────────┐  │
│  │Img │ │ Title                          [View] │  │
│  │    │ │ Artist | Year | Medium                 │  │
│  └────┘ └──────────────────────────────────────┘  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Design Specifications

- **Header**: Section title "Records" with count and "Add Record" button (only if owner and collection not closed)
- **Record Card**:
  - Image thumbnail (or placeholder if no image)
  - Title (heading)
  - Artist name
  - Year (if available)
  - Medium (if available, optional)
  - "View" button/link
- **Empty State**: Centered message with "Add Record" button
- **Pagination**: Bottom of page
- **Loading State**: Skeleton cards or spinner
- **Image Placeholder**: Icon or placeholder image when no image uploaded

## 2. Create Record Form

### Layout

```
┌─────────────────────────────────────┐
│  Add Art Record            [X]     │
├─────────────────────────────────────┤
│                                     │
│  Title *                           │
│  [_____________________________]    │
│                                     │
│  Artist *                          │
│  [_____________________________]    │
│                                     │
│  Year                               │
│  [____] (e.g., 2024)               │
│                                     │
│  Medium                             │
│  [_____________________________]    │
│                                     │
│  Dimensions                         │
│  [_____________________________]    │
│  (e.g., 24x36 inches)              │
│                                     │
│  Description                        │
│  [_____________________________]    │
│  [_____________________________]    │
│  [_____________________________]    │
│                                     │
│  Condition                          │
│  [_____________________________]    │
│                                     │
│  Image                              │
│  [Choose File] No file chosen       │
│  [Image Preview Area]               │
│                                     │
│  [Cancel]  [Create Record]          │
│                                     │
└─────────────────────────────────────┘
```

### Design Specifications

- **Modal/Dialog**: Large modal or full-page form (depending on screen size)
- **Fields**:
  - Title: Required text input, max 200 characters
  - Artist: Required text input, max 200 characters
  - Year: Optional number input, placeholder "e.g., 2024"
  - Medium: Optional text input, max 100 characters
  - Dimensions: Optional text input, max 100 characters, placeholder "e.g., 24x36 inches"
  - Description: Optional textarea, max 2000 characters
  - Condition: Optional text input, max 200 characters
  - Image: File input with preview
- **Image Upload**:
  - File input button: "Choose File" or "Browse"
  - Accepted formats: JPG, PNG, GIF
  - Max size: 10MB
  - Preview area: Shows selected image before upload
  - Remove image option (X button on preview)
- **Validation**:
  - Real-time validation for required fields
  - File type validation
  - File size validation
  - Error messages below fields
- **Buttons**:
  - Cancel: Secondary button, closes modal
  - Create: Primary button, disabled if required fields empty
- **Success**: Modal closes, redirect to record detail or collection page, success toast

## 3. Record Detail View

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Navigation Bar                                     │
├─────────────────────────────────────────────────────┤
│  ← Back to Collection                               │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐  Artwork Title                   │
│  │              │  by Artist Name                   │
│  │   Image      │                                   │
│  │              │  Year: 2024                       │
│  │              │  Medium: Oil on Canvas            │
│  ┌──────────────┘  Dimensions: 24x36 inches        │
│                                                      │
│  Description:                                       │
│  This is a detailed description of the artwork...   │
│                                                      │
│  Condition: Excellent                               │
│                                                      │
│  [Edit] [Delete] (only if owner and not closed)     │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Alternative Layout (Image Left, Details Right)

```
┌─────────────────────────────────────────────────────┐
│  ← Back to Collection                               │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────┐  Artwork Title                       │
│  │          │  by Artist Name                      │
│  │  Image   │                                       │
│  │          │  Year: 2024                          │
│  │          │  Medium: Oil on Canvas               │
│  │          │  Dimensions: 24x36 inches            │
│  └──────────┘                                       │
│            Description:                             │
│            This is a detailed description...         │
│                                                      │
│            Condition: Excellent                     │
│                                                      │
│            [Edit] [Delete]                          │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Design Specifications

- **Image Section**:
  - Large image display (responsive)
  - Click to view full-size (lightbox/modal)
  - Placeholder if no image
- **Details Section**:
  - Title (large heading)
  - Artist (subheading or prominent text)
  - Year, Medium, Dimensions (metadata, formatted)
  - Description (full text, formatted)
  - Condition (if provided)
- **Action Buttons** (only visible to owner if collection not closed):
  - Edit: Primary button
  - Delete: Danger button (red)
- **Breadcrumb**: Back link to collection
- **Owner vs Non-Owner**: Action buttons conditionally rendered

## 4. Edit Record Form

### Layout

Similar to Create Record Form, but:
- Pre-populated with current data
- Title: "Edit Art Record"
- Current image displayed (if exists) with option to replace
- Button: "Save Changes" instead of "Create Record"

### Design Specifications

- **Modal/Dialog**: Same as create form
- **Pre-population**: All fields filled with current record data
- **Image Handling**:
  - Current image displayed (if exists)
  - "Replace Image" button or file input
  - Option to remove image (if exists)
- **Validation**: Same as create form
- **Success**: Modal closes, record detail page updates, success toast

### Restrictions

- Edit button disabled/hidden if collection is closed
- Error message if attempting to edit record in closed collection

## 5. Delete Record Dialog

### Layout

```
┌──────────────────────────────┐
│  Delete Record?               │
├──────────────────────────────┤
│                              │
│  ⚠️ Warning                   │
│                              │
│  Are you sure you want to    │
│  delete this record?         │
│                              │
│  "Artwork Title"             │
│  by Artist Name              │
│                              │
│  This action cannot be       │
│  undone. The record and its  │
│  image will be permanently   │
│  deleted.                    │
│                              │
│  [Cancel]  [Delete Record]    │
│                              │
└──────────────────────────────┘
```

### Design Specifications

- **Modal/Dialog**: Warning-style dialog
- **Warning Icon**: Prominent warning icon
- **Record Info**: Shows title and artist for confirmation
- **Message**: Clear explanation of permanent deletion
- **Buttons**:
  - Cancel: Secondary button, closes dialog
  - Delete Record: Danger button (red)
- **Confirmation**: After confirmation, record deleted, redirect to collection page, success toast

## 6. Image Upload Component

### File Selection

- **Button**: "Choose File" or "Browse" button
- **File Input**: Hidden, triggered by button
- **Accepted Types**: .jpg, .jpeg, .png, .gif
- **Max Size**: 10MB

### Image Preview

```
┌──────────────────────────────┐
│  [Selected Image Preview]    │
│                              │
│  [X Remove]                  │
└──────────────────────────────┘
```

- **Preview Area**: Shows selected image before upload
- **Remove Button**: X button to clear selection
- **Size Display**: Optional file size display
- **Validation Feedback**: Error message if file type/size invalid

### Upload States

- **No File**: Placeholder or "No image selected"
- **File Selected**: Preview shown
- **Uploading**: Progress indicator or spinner
- **Upload Success**: Preview confirmed
- **Upload Error**: Error message displayed

## 7. Image Display

### Thumbnail (List View)

- **Size**: 200x200px or similar, aspect ratio maintained
- **Placeholder**: Icon or placeholder image
- **Lazy Loading**: Load images as they come into view

### Detail View Image

- **Size**: Responsive, max-width 800px or full container width
- **Aspect Ratio**: Maintained
- **Full-Size View**: Click to open in lightbox/modal
- **Placeholder**: Large placeholder if no image

### Lightbox/Modal (Full-Size View)

```
┌─────────────────────────────────────┐
│  [X Close]                          │
│                                     │
│         [Full-Size Image]           │
│                                     │
│  [< Previous]  [Next >]            │
└─────────────────────────────────────┘
```

- **Full-Size Display**: Original image size
- **Navigation**: Previous/Next buttons (if multiple records)
- **Close**: X button or click outside to close
- **Keyboard**: Escape to close, arrow keys to navigate

## 8. Empty States

### Empty Collection (No Records)

```
┌─────────────────────────────────────┐
│                                     │
│          [Empty Icon]               │
│                                     │
│      No records in this             │
│      collection yet                 │
│                                     │
│  Add your first art record to      │
│  get started.                       │
│                                     │
│        [+ Add Record]               │
│                                     │
└─────────────────────────────────────┘
```

### No Image Placeholder

- **Icon**: Image icon or artwork icon
- **Text**: "No image available"
- **Style**: Muted colors, centered

## 9. Responsive Design

### Mobile (< 768px)

- Single column record grid
- Full-width record cards
- Stacked form layout
- Bottom sheet or full-screen modal for forms
- Image takes full width in detail view
- Touch-friendly buttons (min 44px)

### Tablet (768px - 1024px)

- 2-column record grid
- Side-by-side form layout where appropriate
- Image and details side-by-side in detail view

### Desktop (> 1024px)

- 3-4 column record grid
- Multi-column form layout
- Image and details side-by-side in detail view
- Hover effects on cards
- Larger image displays

## 10. Accessibility Requirements

- **WCAG 2.1 AA Compliance**:
  - Alt text for all images
  - Keyboard navigation for all interactive elements
  - Focus indicators visible
  - ARIA labels for buttons and form fields
  - Screen reader announcements for state changes
  - File input properly labeled
  - Error messages associated with fields
  - Color contrast ratios meet AA standards

## 11. User Flows

### Create Record Flow

1. Owner clicks "Add Record" button (only if collection not closed)
2. Modal opens with form
3. Owner fills required fields (Title, Artist)
4. Owner optionally fills other fields
5. Owner selects image file (optional)
6. Image preview appears
7. Owner clicks "Create Record"
8. On success: Modal closes, redirect to record detail or collection page
9. On error: Display error message

### Edit Record Flow

1. Owner clicks "Edit" button on record detail page
2. Modal opens with pre-populated form
3. Owner modifies fields
4. Owner optionally replaces image
5. Owner clicks "Save Changes"
6. On success: Modal closes, page updates with new data
7. On error: Display error message

### Delete Record Flow

1. Owner clicks "Delete" button
2. Confirmation dialog appears with record info
3. Owner reads warning
4. Owner clicks "Delete Record" to confirm
5. Record is deleted, redirect to collection page, success message

### Image Upload Flow

1. User clicks "Choose File" button
2. File picker opens
3. User selects image file
4. File is validated (type and size)
5. If valid: Preview appears
6. If invalid: Error message displayed
7. User can remove and reselect
8. On form submit: Image is uploaded with record data

## 12. Design Assets Needed

- Record card component
- Record detail component
- Create/edit record form component
- Delete record dialog component
- Image upload component
- Image preview component
- Image lightbox/modal component
- Empty state component
- Loading skeleton component
- File input component
