---
name: Records View Filters Search
overview: Add a new "All Records" frontend view with a basic list, extensible filters (collection name, collection owner), and a reusable search feature. Backend will be extended to support listing records without a required collection, with filtering and search. Work follows the Documentation → Tests → Production Code → Review and Bug Fix → Update Documentation and Plans workflow and assigns agent roles per phase.
todos: []
---

# Records View, Filters, and Search - Plan

## Plan Overview

This plan adds a dedicated **Records** list page (all records across collections), **filters** by collection name and collection owner (extensible for future filters), and a **reusable search** component with backend search on record title/artist and collection name/description. The work is split into three implementation areas, each following the workflow in [docs/agent-roles/README.md](docs/agent-roles/README.md) (Documentation → Tests → Production Code → Review and Bug Fix → Update Documentation and Plans).

**Key Deliverables:**

- New route `/records` and Records list page with same Look & Feel as existing app
- Backend: optional `collection` on records list; new query params `search`, `collection_name`, `owner`; list response includes `collection_name`, `collection_owner_username`
- Filters: collection name and collection owner (UI and API); extensible filter design for future filters
- Reusable Search component; backend search on records (title, artist, collection name, description) and collections (name, description) for future use

**Current State (all plans complete):**

- **Backend**: [backend/api/views.py](backend/api/views.py) – `RecordViewSet.list()` has **optional** `collection`; list response includes `collection_name`, `collection_owner_username`. Optional query params: `collection_name`, `owner`, `search` (title, artist, collection name/description). `CollectionViewSet.get_queryset()` has optional `search` (name, description).
- **Frontend**: **Plans 1–3 done**: Global records route `/records`, [RecordsListPage](frontend/src/components/records/RecordsListPage.tsx) with filters (left sidebar), [SearchInput](frontend/src/components/shared/SearchInput.tsx) below title, [recordStore](frontend/src/stores/recordStore.ts) `fetchAllRecords({ search, collection_name, owner, ... })`, RecordCard shows collection name when present.
- **Look & Feel**: Reuse [CollectionList](frontend/src/components/collections/CollectionList.tsx), [Records.css](frontend/src/components/records/Records.css), [Collections.css](frontend/src/components/collections/Collections.css), [App.css](frontend/src/App.css).

## Architecture (Records List Flow)

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend (React)                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Records List Page                                │   │
│  │  ┌────────────┐ ┌────────────┐ ┌───────────────┐ │   │
│  │  │ SearchInput│ │ Filter UI  │ │ RecordCard... │ │   │
│  │  └────────────┘ └────────────┘ └───────────────┘ │   │
│  │  ┌──────────────────────────────────────────────┐│   │
│  │  │ RecordStore.fetchAllRecords(params)          ││   │
│  │  └──────────────────────────────────────────────┘│   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↕ GET /api/records/?search=&collection_name=&owner=
┌─────────────────────────────────────────────────────────┐
│                 Backend (Django REST)                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │  RecordViewSet.get_queryset()                     │   │
│  │  Optional: collection, collection_name, owner,    │   │
│  │  search (title, artist, collection name/desc)     │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Phase 1: Documentation

**Status**: Done (deliverables produced for Plan 1, 2, and 3.)

**Workflow**: Primary roles – Technical Writer, Lead Architect, Product Owner, Data Architect, UI/UX Designer. Output: technical and design documentation before code.

### Product Owner Tasks

**Deliverable**: User story and acceptance criteria for Records list view, filters, and search

**Status**: Pending

1. **Records List View**
   - User can view all records in one list (across collections)
   - Acceptance: route `/records`, list shows record cards with optional collection context

2. **Filters**
   - User can filter records by collection name and by collection owner
   - Acceptance: filter controls in header; results update when filters applied; design allows adding more filters later

3. **Search**
   - User can search records (title, artist; backend also collection name/description)
   - Acceptance: search input on records page; results update; search component reusable for other views (e.g. collections later)

### UI/UX Designer Tasks

**Deliverable**: Layout and component specs for Records list page, filters, and search

**Status**: Pending

1. **Records List Page**
   - Layout consistent with CollectionList (header, title "Records", grid of cards)
   - Empty state, loading state, error state
   - Record card on this view shows collection name (and optionally owner) when available

2. **Filters**
   - Placement: filters section in page header (same style as CollectionList filters)
   - Collection name control (text or dropdown)
   - Collection owner control (text or dropdown)
   - Extensibility: filter config approach so new filters are additive

3. **Search**
   - Reusable search input: placeholder, optional debounce, accessibility
   - Placement on records list page header
   - Same styling as existing form inputs

### Technical Writer Tasks

**Deliverable**: API specification updates for records list, filters, and search

**Status**: Pending

1. **Records List API**
   - `GET /api/records/` – document that `collection` is now optional
   - When omitted: return all records (paginated); document optional params `search`, `collection_name`, `owner`
   - List response: document new fields `collection_name`, `collection_owner_username` (read-only in list)

2. **Collections List API**
   - `GET /api/collections/` – document new optional param `search` (name + description) for future use

3. **Query Param Reference**
   - `search` – full-text style filter (records: title, artist, collection name, description; collections: name, description)
   - `collection_name` – substring match on collection name
   - `owner` – exact match on collection owner username

### Data Architect Tasks

**Deliverable**: Query and serializer field documentation

**Status**: Pending

1. **Records List Query**
   - Optional filter by `collection` (id); optional filters `collection_name` (icontains), `owner` (username); optional `search` (Q over title, artist, collection name, collection description)
   - Ordering: `-created_at`; use `select_related('collection', 'collection__owner')`

2. **Record List Serializer**
   - Add read-only `collection_name`, `collection_owner_username` (SerializerMethodField or nested read) for list context

### Lead Architect Tasks

**Deliverable**: Consistency with existing architecture

**Status**: Pending

1. **API Consistency**
   - Same auth, pagination shape, error responses as existing endpoints
   - No new endpoints; extend existing list actions with optional params

2. **Frontend Consistency**
   - Reusable Search component in shared or search folder; filter abstraction (config-driven) for scalability

## Phase 2: Tests

**Status**: Done (tests written and passing for Plan 1, 2, and 3.)

**Workflow**: Primary roles – Frontend Tester, Backend Tester, Frontend Developer, Backend Developer. Output: tests written from specs before production code.

**Reference Documentation**: Phase 1 deliverables; [docs/api-specification.md](docs/api-specification.md); [docs/agent-roles/README.md](docs/agent-roles/README.md).

### Backend Tester Tasks

**Role**: Backend Tester ([docs/agent-roles/06-backend-tester.md](docs/agent-roles/06-backend-tester.md))

**Status**: Pending

**Deliverable**: Tests for records list (optional collection, filters, search), list response shape, and collections search param

**Test Location**: `backend/api/tests/` (extend `test_records.py`, optionally `test_collections.py`)

#### 1. Records List Without Required Collection

1.1. **List without collection parameter**
   - Test `GET /api/records/` without `collection` returns 200 and paginated results (all records)
   - Test response format (count, next, previous, results)
   - Test each result includes `collection_name` and `collection_owner_username` when implemented

1.2. **List with collection parameter (existing behavior)**
   - Test `GET /api/records/?collection={id}` still works and filters by collection
   - Test invalid collection id still returns 404

#### 2. Records List Filters

2.1. **collection_name parameter**
   - Test `collection_name` filters by substring match on collection name (icontains)
   - Test combined with optional `collection` and `owner`

2.2. **owner parameter**
   - Test `owner` filters by collection owner username
   - Test combined with `collection_name` and optional `collection`

#### 3. Records List Search

3.1. **search parameter**
   - Test `search` (or `q`) filters records by title and artist (icontains, OR)
   - Test search optionally includes collection name and description (per spec)
   - Test empty search param does not filter
   - Test combined with filters (collection_name, owner)

#### 4. Collections List Search (for future use)

4.1. **search parameter**
   - Test `GET /api/collections/?search=...` filters by name and description (icontains, OR)

### Frontend Tester Tasks

**Role**: Frontend Tester ([docs/agent-roles/05-frontend-tester.md](docs/agent-roles/05-frontend-tester.md))

**Status**: Pending

**Deliverable**: Tests for Records list page, filters, Search component, store methods, and navigation

**Test Location**: `frontend/src/test/`

#### 1. Records List Page

1.1. **Route and navigation**
   - Test route `/records` renders the records list page
   - Test navigation link "Records" is present and navigates to `/records`

1.2. **Page content**
   - Test page shows title "Records" and list/grid of record cards
   - Test loading state while fetching
   - Test error state when fetch fails
   - Test empty state when no records
   - Test record cards show collection name when provided by API

1.3. **Pagination**
   - Test pagination controls and total count when backend returns pagination

#### 2. Filters

2.1. **Filter controls**
   - Test collection name filter control is present and updates list when applied
   - Test collection owner filter control is present and updates list when applied
   - Test filter state can be combined (name + owner)

2.2. **Store integration**
   - Test `fetchAllRecords` is called with `collection_name` and `owner` when filters set

#### 3. Search Component

3.1. **SearchInput (reusable)**
   - Test component renders with placeholder and value
   - Test onChange and onSearch (or callback) behavior
   - Test optional debounce and accessibility (label, ARIA)

3.2. **Records page integration**
   - Test search input on records page triggers fetch with `search` param
   - Test search term combined with existing filters

#### 4. Store Tests

4.1. **RecordStore.fetchAllRecords**
   - Test fetches without `collection` param
   - Test passes optional params: page, page_size, search, collection_name, owner
   - Test updates records and pagination state
   - Test error handling

## Phase 3: Production Code

**Status**: Done (Plan 1, Plan 2, and Plan 3 implementation complete per Implementation Order below.)

**Workflow**: Primary roles – Frontend Developer, Backend Developer, DevOps Engineer. Output: implementation that passes Phase 2 tests and follows Phase 1 documentation.

### Backend Developer Tasks

**Deliverable**: API changes in views and serializers; tests pass

1. **RecordViewSet** ([backend/api/views.py](backend/api/views.py))
   - Change `list()` so `collection` is optional; when missing, do not require it and return all records (same visibility as today)
   - In `get_queryset()`: apply optional filters `collection` (id), `collection_name` (icontains on collection__name), `owner` (collection__owner__username); apply optional `search` (Q: title, artist, collection__name, collection__description); keep ordering and select_related

2. **RecordSerializer** ([backend/api/serializers.py](backend/api/serializers.py))
   - Add read-only `collection_name` and `collection_owner_username` (e.g. SerializerMethodField) for list responses

3. **CollectionViewSet** ([backend/api/views.py](backend/api/views.py))
   - In `get_queryset()`, add optional `search` param (Q: name, description icontains)

4. **Tests**
   - Add/update tests in `backend/api/tests/test_records.py` (and `test_collections.py` if needed) to cover new behavior; ensure existing tests still pass (e.g. list with collection required can be updated to allow both modes)

### Frontend Developer Tasks

**Deliverable**: Route, page, store, Search component, filter UI; tests pass

1. **Route and navigation**
   - Add route `/records` in [frontend/src/App.tsx](frontend/src/App.tsx) for the new records list page
   - Add "Records" link in [frontend/src/components/layout/Navigation.tsx](frontend/src/components/layout/Navigation.tsx)

2. **RecordStore** ([frontend/src/stores/recordStore.ts](frontend/src/stores/recordStore.ts))
   - Add `fetchAllRecords(params?)` calling `GET /api/records/` without `collection`, with optional `page`, `page_size`, `search`, `collection_name`, `owner`
   - Reuse existing `records`, `pagination`, `loading`, `error` for this list

3. **Records List Page**
   - New component (e.g. `AllRecordsView` or `RecordsListPage`) in `frontend/src/components/records/`
   - Structure: header with title "Records", optional Search and Filters, then grid of RecordCards; loading, error, empty states; pagination
   - Reuse Records.css and existing patterns

4. **RecordCard** ([frontend/src/components/records/RecordCard.tsx](frontend/src/components/records/RecordCard.tsx))
   - Extend to optionally show `collection_name` (and `collection_owner_username`) when provided (e.g. when used on global records list)

5. **Filters**
   - Filter UI in records list page header: collection name and collection owner controls
   - Filter config abstraction (key, label, type) so new filters can be added later
   - Pass filter state into `fetchAllRecords`

6. **Search component**
   - New reusable component (e.g. `frontend/src/components/shared/SearchInput.tsx`): controlled input, placeholder, optional debounce, callback for search value; styled like existing form inputs
   - Use on records list page; pass `search` into `fetchAllRecords`; optionally sync to URL query

7. **Tests**
   - Add/update tests in `frontend/src/test/` for new components and store method; ensure existing tests pass

### DevOps Engineer Tasks

**Deliverable**: CI runs existing and new tests

1. Ensure backend and frontend test commands include new tests
2. No new pipeline stages required if current CI already runs full test suites

## File Structure (Relevant Additions)

```
ekho/
├── backend/
│   └── api/
│       ├── views.py           # RecordViewSet list/queryset, CollectionViewSet search
│       ├── serializers.py    # RecordSerializer list fields
│       └── tests/
│           ├── test_records.py   # extend for list without collection, filters, search
│           └── test_collections.py # extend for search param
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── records/
│       │   │   ├── RecordCard.tsx      # optional collection name/owner
│       │   │   ├── RecordList.tsx      # existing
│       │   │   └── AllRecordsView.tsx  # or RecordsListPage (new)
│       │   ├── shared/
│       │   │   └── SearchInput.tsx     # new reusable
│       │   └── layout/
│       │       └── Navigation.tsx      # add Records link
│       ├── stores/
│       │   └── recordStore.ts         # fetchAllRecords(params)
│       ├── App.tsx                    # route /records
│       └── test/
│           ├── components/           # tests for AllRecordsView, SearchInput, filters
│           └── stores/
│               └── recordStore.test.ts # fetchAllRecords
└── docs/                              # Phase 1 deliverables (if new files)
```

## Implementation Order

1. **Plan 1 – Records view (basic list)** ✅ **Done**
   - Phase 1 docs (Product Owner, Technical Writer, Data Architect, UI/UX Designer) – done ([docs/plans/records-view-plan1-phase1.md](docs/plans/records-view-plan1-phase1.md), [US-016](docs/user-stories/03-records.md), [api-spec](docs/api-specification.md))
   - Phase 2 tests (Backend Tester: list without collection, response shape; Frontend Tester: route, page, store) – done
   - Phase 3: Backend (ViewSet list + serializer fields) then Frontend (route, nav, fetchAllRecords, page, RecordCard tweak) – done. Delivered: optional `collection` on `GET /api/records/`, `collection_name`/`collection_owner_username` in list; `/records` route, Records nav link, `RecordsListPage`, `fetchAllRecords`, RecordCard shows collection name when present.

2. **Plan 2 – Filters** ✅ **Done**
   - Phase 1 docs (Technical Writer, UI/UX Designer) – done ([docs/plans/records-view-plan2-filters-phase1.md](docs/plans/records-view-plan2-filters-phase1.md), [US-017](docs/user-stories/03-records.md))
   - Phase 2 tests (Backend Tester: filter params; Frontend Tester: filter UI and params) – done
   - Phase 3: Backend (get_queryset filter params) then Frontend (filter UI + store params) – done. Delivered: `collection_name` and `owner` query params; filter UI with config-driven layout.
   - **Post–Phase 3:** Focus retention (loading only in content area); filters in left sidebar (top to bottom); fast debounce (300ms) on filter fields.

3. **Plan 3 – Search** ✅ **Done**
   - Phase 1 docs (Technical Writer, UI/UX Designer) — **Done**: [docs/plans/records-view-plan3-search-phase1.md](docs/plans/records-view-plan3-search-phase1.md), [US-018](docs/user-stories/03-records.md), [api-spec](docs/api-specification.md) (search param on records + collections)
   - Phase 2 tests — **Done**: Backend: `TestRecordsListSearch` and `TestCollectionsListSearch` in `backend/api/tests/test_records.py`, `test_collections.py`. Frontend: `SearchInput.test.tsx`, RecordsListPage search tests, `recordStore.test.ts` (search param). SearchInput in `frontend/src/components/shared/SearchInput.tsx`.
   - Phase 3 — **Done**: Backend: `RecordViewSet.get_queryset()` applies optional `search` (Q: title, artist, collection__name, collection__description, icontains OR). `CollectionViewSet.get_queryset()` applies optional `search` (Q: name, description, icontains OR). Frontend: SearchInput on Records list page (below title), search state and `fetchAllRecords({ search, ... })`, styles in Records.css. All Plan 3 tests pass.

Plan 2 and Plan 3 can be parallelized after Plan 1. **Initiative complete.**

## Backend Endpoint Summary

| Endpoint | Current | After plan |
|----------|---------|------------|
| `GET /api/records/` | `collection` required; no search/filters | `collection` optional; optional `search`, `collection_name`, `owner`; list includes `collection_name`, `collection_owner_username` |
| `GET /api/collections/` | `owner`, `is_closed` | Add optional `search` (name + description) |

## Success Criteria

- ✅ User can open `/records` and see all records in a grid with same L&F as collections/records elsewhere
- ✅ User can filter by collection name and collection owner; results update correctly
- ✅ User can search records; backend searches title, artist, collection name, collection description
- ✅ Search component is reusable (e.g. for future collections search)
- ✅ Filter design allows adding new filters without rewriting the UI
- ✅ Backend and frontend tests pass; existing behavior (e.g. list with `collection` param) preserved
- ✅ No new API endpoints; same auth, pagination, and error style as existing API
