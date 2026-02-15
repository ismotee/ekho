# Plan 3: Search — Phase 1: Documentation

**Status: Plan 3 complete (Phases 1–3 done).** This document is the Phase 1 deliverable; Phases 2 (Tests) and 3 (Production Code) are implemented.

This document is the **Phase 1 (Documentation)** deliverable for Plan 3 (Search) of the Records List View, Filters, and Search initiative. It follows the workflow in [docs/agent-roles/README.md](../agent-roles/README.md): Documentation → Tests → Production Code.

**Reference:** [.cursor/plans/records_view_filters_search_c23df4a8.plan.md](../../.cursor/plans/records_view_filters_search_c23df4a8.plan.md)

---

## 1. Product Owner — User Story

**User Story:** [US-018: Search Records (and Reusable Search)](../user-stories/03-records.md)

- **As a** user (authenticated or anonymous)  
- **I want to** search the global records list by title, artist, and collection context  
- **So that** I can quickly find records matching my search terms  

Acceptance criteria and technical notes are maintained in `docs/user-stories/03-records.md`. Key acceptance criteria: search input on Records page; backend search on record title, artist, collection name, collection description; search combinable with filters; empty search does not filter; reusable Search component for future use (e.g. collections).

---

## 2. Technical Writer — API Specification

**Source of truth:** [docs/api-specification.md](../api-specification.md).

### 2.1 Records List API — search parameter

| Aspect | Specification |
|--------|----------------|
| **Endpoint** | `GET /api/records/` |
| **`search`** | Optional query param (string). When present and non-empty: filter records where the term appears (case-insensitive, icontains) in **record title**, **artist**, **collection name**, or **collection description** (OR across these fields). Omitted or empty = no search filter. |
| **Combination** | `search` can be combined with `collection`, `collection_name`, and `owner`. All applied filters are ANDed. |
| **Pagination** | Unchanged: `page`, `page_size`; response shape `count`, `next`, `previous`, `results`. |

### 2.2 Collections List API — search parameter (for future use)

| Aspect | Specification |
|--------|----------------|
| **Endpoint** | `GET /api/collections/` |
| **`search`** | Optional query param (string). When present and non-empty: filter collections where the term appears (case-insensitive, icontains) in **name** or **description** (OR). Omitted or empty = no search filter. Reserved for future collections search UI. |

### 2.3 Query param reference (summary)

- **`search`** (records): full-text style filter on record title, artist, collection name, collection description (icontains, OR).
- **`search`** (collections): full-text style filter on collection name and description (icontains, OR).
- **`collection_name`**: substring match on collection name (records list).
- **`owner`**: exact match on collection owner username (records list).

---

## 3. UI/UX Designer — Search Component and Records Page Integration

### 3.1 Reusable SearchInput component

- **Purpose:** A single, reusable search input for list views (Records first; Collections later).
- **Location:** `frontend/src/components/shared/SearchInput.tsx` (or equivalent shared/search folder).
- **Behavior:**
  - Controlled input: value and onChange (or equivalent) from parent.
  - Placeholder: e.g. “Search records…” (configurable via prop for reuse on collections: “Search collections…”).
  - Optional debounce: configurable delay (e.g. 300–400 ms) so API is not called on every keystroke; recommend debouncing the value passed to the API while keeping input responsive.
  - Callback: parent receives the effective search value (debounced if used) to pass to `fetchAllRecords({ search, ... })` or future `fetchCollections({ search })`.
- **Styling:** Same as existing form inputs per [Design System](../design/05-design-system.md): border, border-radius, padding, focus state; use Text Muted for placeholder.
- **Accessibility:**
  - Associating visible label (e.g. “Search”) with the input (e.g. `htmlFor` / `id`, or aria-label).
  - Appropriate ARIA attributes (e.g. `aria-label` if no visible label, or `aria-describedby` for helper text if needed).

### 3.2 Records list page integration

- **Placement:** Search input in the Records list page header, in the **main content area** below the "Records" title and above the record grid (filters remain in the left sidebar). See mockup: [Records view with search](../../assets/records-view-with-search-mockup.png).

![Records view with search mockup](../../assets/records-view-with-search-mockup.png)
- **Flow:** User types in SearchInput → (after debounce if used) parent updates search state and calls `fetchAllRecords({ search, collection_name, owner, page, page_size })`; results update; pagination resets to page 1 when search or filters change (existing pattern).
- **Empty state:** When search term is empty or omitted, do not send `search` (or send empty); backend applies no search filter.
- **Optional:** Sync search term to URL query (e.g. `?search=...`) for shareable links and back/forward; not required for Phase 1 acceptance but recommended for consistency.

### 3.3 Consistency

- Reuse existing Records page layout and filter section; add SearchInput so the header/sidebar has: title “Records”, search, then filters (collection name, owner), then content grid.
- Loading/error/empty states remain as today; search simply narrows the list returned by the API.

---

## 4. Data / Backend (reference for Phase 2–3)

- **Records:** In `RecordViewSet.get_queryset()`, when `search` is present and non-empty, apply `Q(title__icontains=search) | Q(artist__icontains=search) | Q(collection__name__icontains=search) | Q(collection__description__icontains=search)`. Keep existing `select_related('collection', 'collection__owner')` and ordering `-created_at`.
- **Collections:** In `CollectionViewSet.get_queryset()`, when `search` is present and non-empty, apply `Q(name__icontains=search) | Q(description__icontains=search)`.

---

**Phase 1 complete.** Phase 2 (Tests) and Phase 3 (Production Code) are complete. Search is implemented: backend `search` param on records and collections list; frontend SearchInput on Records page with debounce and filter combination.
