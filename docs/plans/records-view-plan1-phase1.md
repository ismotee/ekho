# Plan 1: Records View (Basic List) — Phase 1: Documentation

This document is the **Phase 1 (Documentation)** deliverable for Plan 1 of the Records List View, Filters, and Search initiative. It follows the workflow in [docs/agent-roles/README.md](../agent-roles/README.md): Documentation → Tests → Production Code. **Implementation (Phases 2 and 3) should not start until this phase is reviewed and approved.**

**Reference:** [.cursor/plans/records_view_filters_search_c23df4a8.plan.md](../../.cursor/plans/records_view_filters_search_c23df4a8.plan.md)

---

## 1. Product Owner — User Story

**User Story:** [US-016: View All Records (Global Records List)](../user-stories/03-records.md)

- **As a** user (authenticated or anonymous)  
- **I want to** view a list of all records across all collections on a dedicated page  
- **So that** I can browse all artwork in one place without opening each collection  

Acceptance criteria and technical notes are maintained in `docs/user-stories/03-records.md`. Key acceptance criteria include: dedicated `/records` route and nav link, list of all records with collection context (collection name, optionally owner), same look and feel as existing record list, pagination, loading/empty/error states, and backward compatibility when `collection` is provided.

---

## 2. Technical Writer — API and Behavior Specification

**Source of truth:** [docs/api-specification.md](../api-specification.md) — section **List Records** under Record Endpoints.

### Summary of API Behavior

| Aspect | Specification |
|--------|----------------|
| **Endpoint** | `GET /api/records/` |
| **`collection`** | Optional. Omitted → return records from all collections. Present → return only records in that collection (existing behavior). |
| **Pagination** | Same as today: `page`, `page_size`; response shape `count`, `next`, `previous`, `results`. |
| **List response shape** | Each item in `results` includes existing record fields plus read-only: `collection_name` (string), `collection_owner_username` (string, optional). |
| **Errors** | When `collection` is provided and the collection does not exist: `404` with message (e.g. "Collection not found"). No `400` for missing `collection`. |
| **Auth / visibility** | No change: same as current list (no extra restriction at list level). Detail/create/update/delete continue to enforce ownership and closed-collection rules. |

---

## 3. Data Architect — List Query and Serializer Design

### 3.1 List query (`RecordViewSet.get_queryset()`)

- **Base queryset:** `Record.objects.all()`.
- **Filtering:**
  - If query param `collection` is present: filter by `collection_id=collection` (existing behavior).
  - If `collection` is omitted: do **not** filter by collection; return records from all collections.
- **Ordering:** `-created_at` (newest first).
- **Optimization:** Use `select_related('collection', 'collection__owner')` for list to avoid N+1 when serializing `collection_name` and `collection_owner_username`.
- **Permissions:** No change at list level; no extra restriction when listing all records. Detail/create/update/delete continue to enforce ownership and closed collection.

### 3.2 Serializer — list response fields

- **Option A (recommended):** Extend existing `RecordSerializer` with optional read-only fields for list context:
  - `collection_name` — `SerializerMethodField()` returning `instance.collection.name`.
  - `collection_owner_username` — `SerializerMethodField()` returning `instance.collection.owner.username`.
- **Option B:** Introduce a separate `RecordListSerializer` that includes these fields and use it only for list actions; detail keeps current `RecordSerializer` (no extra fields).
- **Contract:** List responses (when using the list serializer or the extended serializer in list context) must include `collection_name` and `collection_owner_username` so the global records UI can show collection context. Detail response shape remains unchanged (these fields may be omitted on detail if using Option B, or included for consistency).

### 3.3 Response shape

- Paginated: `count`, `next`, `previous`, `results` (unchanged).
- Each element of `results`: existing record fields + `collection_name` + `collection_owner_username` for list.

---

## 4. UI/UX Designer — Records List Page Layout and Look & Feel

### 4.1 Purpose

A dedicated **Records** page that lists all records across collections, with the same visual and interaction patterns as the rest of the app (especially [CollectionList](../../frontend/src/components/collections/CollectionList.tsx) and the collection-scoped [RecordList](../../frontend/src/components/records/RecordList.tsx)).

### 4.2 Route and navigation

- **Route:** `/records` — renders the new Records list page.
- **Navigation:** Add a “Records” link in [Navigation.tsx](../../frontend/src/components/layout/Navigation.tsx) next to “Collections” (same nav bar, same styling as existing nav links) so the global records view is discoverable.

### 4.3 Page structure (mirroring CollectionList)

- **Container:** Main container consistent with existing pages (e.g. same wrapper/layout as Collections).
- **Header:**
  - Page title: **“Records”** (e.g. `<h1>`).
  - No “Create Record” in this view (records are created from within a collection).
- **Content:**
  - **List/Grid:** Reuse the same structure as the collection-scoped record list: e.g. `.record-list`, `.record-grid` from [Records.css](../../frontend/src/components/records/Records.css).
  - **Cards:** Use existing [RecordCard](../../frontend/src/components/records/RecordCard.tsx) for each item. Extend `Record` type and RecordCard props to accept optional `collection_name` (and optionally `collection_owner_username`) so the card can show one line of collection context (e.g. “Collection: My Art” or “Collection: My Art (johndoe)”) when present.
- **States:**
  - **Loading:** Same pattern as existing record/collection lists (e.g. “Loading…” or existing loading component).
  - **Error:** Display API/network error message (reuse existing error pattern, e.g. `.error-message`).
  - **Empty:** When `results` is empty, show empty state (e.g. “No records found”), consistent with existing empty states.

### 4.4 Pagination

- If the backend returns pagination (`count`, `next`, `previous`), show simple pagination controls (e.g. “Previous” / “Next”) and total count (e.g. “Page 1 of N” or “X records”), reusing the pattern from [CollectionList](../../frontend/src/components/collections/CollectionList.tsx).

### 4.5 Styles and assets

- Reuse [Records.css](../../frontend/src/components/records/Records.css) (e.g. `.record-list`, `.record-grid`, `.record-card`, `.record-thumbnail`, `.record-info`, `.record-placeholder`) and [App.css](../../frontend/src/App.css) (buttons, form styles) so the Records page matches the existing record and collection list look and feel. Only add minimal new styles if needed for the new page container or header.

### 4.6 Accessibility and consistency

- Same accessibility and interaction patterns as existing list views (links, focus, semantics). Record cards remain links to the record detail page. Ensure new “Records” nav link is keyboard-accessible and clearly labeled.

---

## 5. Approval and Next Steps

- **Phase 1 (Documentation)** is complete when this document and the linked user story and API spec have been reviewed and approved.
- **Phase 2 (Tests):** Backend Tester and Frontend Tester will add tests from these specs (list without `collection`, response shape, pagination; route, store, page render, RecordCard with collection info).
- **Phase 3 (Production code):** Backend Developer and Frontend Developer will implement to pass those tests.

**Please review the above and approve before proceeding to Phase 2 and Phase 3.**
