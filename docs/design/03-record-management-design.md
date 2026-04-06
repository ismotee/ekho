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

## Domain model UX (aligned with `record-models.md`)

The UI reads and writes the **domain payload** exposed by the API as `data` (see `docs/data/record-models.md` and linked domain docs). **`representative_image`** is a separate top-level field for list/detail thumbnails only.

### List cards: summary rules

Keep card **density** similar to the legacy title/artist/year layout, but **derive** copy from `data.identification_details` where possible:

| Line | Rule |
|------|------|
| **Thumbnail** | `representative_image` if present; otherwise the same placeholder as today. |
| **Primary** | `identification_details.title.value`, else first usable `object_name`, else `object_number`, else the copy **Untitled record**. |
| **Secondary** | Short hint: object type and/or object number when cheaply available from identification; avoid heavy nested actor rendering on cards. |
| **Tertiary** | Show a single display year only if product defines one clear rule (for example from acquisition temporal text); otherwise omit. |
| **Collection** | When the API provides `collection_name`, show it as today for context. |

Centralize this mapping in one helper (for example `getRecordCardSummary(record)`) so list and delete-confirm copy stay consistent when the domain evolves.

### Record detail: section order and structure

- **Hero**: Large `representative_image` (or placeholder) plus a **one-line summary** using the same rules as the card primary/secondary line.
- **Body**: **Accordion or subheaded sections** in this **fixed order**: **Identification** → **Acquisition** → **Description** → **History** → **Rights** → **Access** → **Object location** → **Confidentiality**.
- **Inside each section**: Recursive label/value presentation for nested objects; lists as grouped bullets. **Empty sections**: short “No data” under the heading (keep headings visible for landmarks and screen readers).
- **`Reference<T>` values**: For v1, show the stored Finnish label string; later these can move to i18n keys.
- Avoid a single endless strip of fields without landmarks; optional later enhancement: sticky section nav on wide viewports.

### Create and edit: form navigation

- **Layout**: **Vertical stepper** or **left-hand nav** listing the **nine domain sections** in the same order as detail, plus an optional final **Review** step.
- **State**: One object holding the full `data` payload; **Save** may send a full PUT/PATCH (simplest) until partial APIs exist.
- **Progressive disclosure**: Repeatable domain lists (for example multiple titles, ownership rows) behind **Add …** actions with row components.
- **Representative image**: Dedicated control at the **top** of the flow or inside Identification, clearly labeled as the **list/thumbnail** image (not a nested domain `Image` field unless product equates them).
- **Validation**: Required fields only where product and backend agree; show errors at **section** level and a short **top summary**.

### Delete confirmation

Show the **same primary summary line** as the card (not a hard-coded “title by artist” pair) so wording matches sparse or partial records.

---

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
│  │  Primary │  │  Primary │  │  Primary │        │
│  │  label   │  │  label   │  │  label   │        │
│  │  Second. │  │  Second. │  │  Second. │        │
│  │  Year?   │  │  Year?   │  │  Year?   │        │
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
│  │Img │ │ Primary label                  [View] │  │
│  │    │ │ Secondary | Year?                    │  │
│  └────┘ └──────────────────────────────────────┘  │
│                                                      │
│  ┌────┐ ┌──────────────────────────────────────┐  │
│  │Img │ │ Primary label                  [View] │  │
│  │    │ │ Secondary | Year?                    │  │
│  └────┘ └──────────────────────────────────────┘  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Design Specifications

- **Header**: Section title "Records" with count and "Add Record" button (only if owner and collection not closed)
- **Record Card**:
  - Thumbnail from `representative_image`, or placeholder
  - **Primary line** (heading): best label from identification (see **Domain model UX**)
  - **Secondary line**: object type / object number as available
  - **Tertiary**: year only when a single display rule applies; else omit
  - Optional **collection** context when `collection_name` is present
  - "View" button/link
- **Empty State**: Centered message with "Add Record" button
- **Pagination**: Bottom of page
- **Loading State**: Skeleton cards or spinner
- **Image Placeholder**: Icon or placeholder image when no image uploaded

## 2. Create Record Form

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Add record                                      [X]    │
├─────────────────────────────────────────────────────────┤
│  [Steps or left nav: Id → Acq → Desc → Hist → … → Rev] │
├─────────────────────────────────────────────────────────┤
│  Representative image (list thumbnail)                  │
│  [Choose File]   [preview]                              │
├─────────────────────────────────────────────────────────┤
│  <Fields for active domain section only>                │
│  … repeatable “Add …” rows for list-shaped domains …    │
├─────────────────────────────────────────────────────────┤
│  [Back]  [Next section]     [Cancel]  [Create record]    │
└─────────────────────────────────────────────────────────┘
```

### Design Specifications

- **Shell**: Large modal or full-page form by breakpoint
- **Navigation**: Stepper or left nav covering **Identification**, **Acquisition**, **Description**, **History**, **Rights**, **Access**, **Object location**, **Confidentiality**, optional **Review**
- **Representative image**: First-class control; labeled as thumbnail for lists/detail hero; same file rules as **Image Upload Component** (JPG/PNG/GIF, 10MB)
- **Fields**: Driven by domain types in `docs/data/*-models.md`; use progressive disclosure for repeating structures
- **Validation**: Align required fields with API/backend; section-level errors + short summary at top
- **Buttons**:
  - Cancel: Secondary, closes without save (confirm if dirty, product decision)
  - Create: Primary; enabled per validation rules
- **Success**: Close shell, navigate to record detail or collection, toast

## 3. Record Detail View

### Layout

```
┌─────────────────────────────────────────────────────┐
│  ← Back to Collection                               │
├─────────────────────────────────────────────────────┤
│  ┌──────────────┐  One-line summary (card rules)      │
│  │  Hero image  │  Optional collection context       │
│  │  or placeholder                                   │
│  └──────────────┘  [Edit] [Delete] if owner + open   │
├─────────────────────────────────────────────────────┤
│  ▼ Identification        … content or “No data” …   │
│  ▼ Acquisition           …                            │
│  ▼ Description           …                            │
│  ▼ History               …                            │
│  ▼ Rights                …                            │
│  ▼ Access                …                            │
│  ▼ Object location       …                            │
│  ▼ Confidentiality       …                            │
└─────────────────────────────────────────────────────┘
```

### Design Specifications

- **Hero**: `representative_image` (lightbox on click) or placeholder; summary lines match **Domain model UX** card rules
- **Body**: Accordion or stacked sections in the **fixed order** listed above; nested objects as label/value trees; reference types show stored label text for v1
- **Empty sections**: Visible heading + “No data” (do not remove headings)
- **Action Buttons** (owner, collection not closed): Edit (primary), Delete (danger)
- **Back link** to collection; respect read-only closed collection (hide or disable actions)

## 4. Edit Record Form

### Layout

Same shell as **Create Record Form** (stepper / section nav + representative image + domain sections), but:

- Title: **Edit record** (or equivalent)
- **Pre-populated** from API `data` and current `representative_image`
- Primary action: **Save changes**

### Design Specifications

- **Navigation**: Same nine domain sections + optional Review
- **Representative image**: Show current thumbnail; allow replace or clear if product supports clearing
- **Payload**: Editing updates `data` (and image when changed) per API contract
- **Validation** and **success feedback**: Same patterns as create

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
│  <Primary summary line       │
│   from card helper>          │
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
- **Record Info**: Shows the **primary summary line** (same as list card) for confirmation
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

1. Owner clicks "Add Record" (only if collection not closed)
2. Modal or page opens with **section navigation** and **representative image** control
3. Owner completes domain sections (required fields per product/backend)
4. Owner optionally sets representative image; preview when selected
5. Owner submits **Create record**
6. On success: Close shell, go to record detail or collection, toast
7. On error: Section or field errors + top summary

### Edit Record Flow

1. Owner clicks **Edit** on record detail
2. Same shell as create, **pre-filled** from `data` and current image
3. Owner moves between sections and updates fields
4. Owner saves **Save changes**
5. On success: Close or stay on detail with refreshed data, toast
6. On error: Same error pattern as create

### Delete Record Flow

1. Owner clicks "Delete" button
2. Confirmation dialog shows **primary summary line** and warning copy
3. Owner confirms **Delete record**
4. Record and **representative_image** file are removed per API; redirect to collection, toast

### Image Upload Flow (representative image)

1. User activates file control for **representative image**
2. Picker opens; user selects JPG/PNG/GIF within size limit
3. Validation feedback inline; preview when valid
4. On save: Multipart or follow-up PATCH per API; nested `Image` fields inside `data` follow the same component patterns where applicable

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
