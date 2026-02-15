---
name: Ekho Art Collection Management Application
overview: Comprehensive plan for building Ekho, an art collection management tool with user authentication, collection management, and record CRUD operations. The plan follows the Documentation → Tests → Production Code → Review and Bug Fix → Update Documentation and Plans workflow and divides tasks across all 10 agent roles.
todos: []
isProject: false
---

# Ekho Art Collection Management Application - Comprehensive Plan

## Application Overview

Ekho is a full-stack web application for managing art collections. Registered users can create, maintain, and close collections. Collections contain art records that owners can create, edit, and delete. Anonymous users can view collections and records.

**Key Features:**

- User authentication (username/password)
- Collection management (create, edit, close/read-only)
- Art record management (CRUD operations)
- Image file uploads for art records
- Public viewing for anonymous users
- Initial Record fields: Title, Artist, Year, Medium, Dimensions, Description, Condition, Image

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Auth UI    │  │ Collection UI│  │  Record UI   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│  ┌──────────────────────────────────────────────────┐   │
│  │         MobX Stores (State Management)           │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↕ REST API
┌─────────────────────────────────────────────────────────┐
│                 Backend (Django REST)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Auth API   │  │ Collection   │  │  Record API  │ │
│  │              │  │     API      │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Django Models & Business Logic            │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │              SQLite Database                      │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Phase 1: Documentation ✅ COMPLETED

**Status**: All documentation tasks completed. All deliverables created and documented.

### Product Owner Tasks ✅

**Deliverable**: User stories and acceptance criteria

**Status**: ✅ Completed

1. **User Authentication Stories** ✅
  - User registration with username/password (US-001)
  - User login/logout (US-002, US-003)
  - Session management (US-004)
  - Acceptance criteria for each story
2. **Collection Management Stories** ✅
  - Create collection (authenticated users) (US-005)
  - Edit collection (owner only) (US-006)
  - Close collection (make read-only, owner only) (US-007)
  - View collections (authenticated and anonymous) (US-008, US-009)
  - Acceptance criteria for each story
3. **Record Management Stories** ✅
  - Create record in collection (owner only) (US-010)
  - Edit record (owner only, if collection not closed) (US-011)
  - Delete record (owner only, if collection not closed) (US-012)
  - View records (authenticated and anonymous) (US-013, US-014)
  - Upload image for record (owner only) (US-015)
  - Acceptance criteria for each story

**Files Created**:

- ✅ `docs/user-stories/01-authentication.md`
- ✅ `docs/user-stories/02-collections.md`
- ✅ `docs/user-stories/03-records.md`

### UI/UX Designer Tasks ✅

**Deliverable**: Design mockups and specifications

**Status**: ✅ Completed

1. **Authentication UI Design** ✅
  - Login page mockup
  - Registration page mockup
  - Logout confirmation
  - Error states and validation feedback
2. **Collection Management UI Design** ✅
  - Collection list view (grid/list)
  - Collection detail view
  - Create/edit collection form
  - Close collection confirmation dialog
  - Empty states
3. **Record Management UI Design** ✅
  - Record list view within collection
  - Record detail view
  - Create/edit record form with image upload
  - Image preview and display
  - Responsive layouts
4. **Navigation and Layout** ✅
  - Main navigation structure
  - User menu (when authenticated)
  - Public vs authenticated views
  - Mobile responsive design
5. **Design System** ✅
  - Color palette and typography
  - Component specifications
  - Style guide

**Files Created**:

- ✅ `docs/design/README.md`
- ✅ `docs/design/01-authentication-design.md`
- ✅ `docs/design/02-collection-management-design.md`
- ✅ `docs/design/03-record-management-design.md`
- ✅ `docs/design/04-navigation-layout.md`
- ✅ `docs/design/05-design-system.md`

### Technical Writer Tasks ✅

**Deliverable**: Technical specifications and API documentation

**Status**: ✅ Completed

1. **API Specification Document** ✅
  - Authentication endpoints (register, login, logout, current user)
  - Collection endpoints (list, create, retrieve, update, close)
  - Record endpoints (list, create, retrieve, update, delete)
  - Image upload endpoint
  - Request/response schemas
  - Error handling specifications
2. **Data Model Documentation** ✅
  - User model specification
  - Collection model specification (name, description, owner, is_closed, created_at, updated_at)
  - Record model specification (title, artist, year, medium, dimensions, description, condition, image, collection, created_at, updated_at)
  - Relationships and constraints
3. **Developer Guide** ✅
  - Setup instructions
  - Development workflow
  - Code structure overview
  - Testing guidelines

**Files Created**:

- ✅ `docs/api-specification.md`
- ✅ `docs/data-models.md`
- ✅ `docs/developer-guide.md`

### Lead Architect Tasks ✅

**Deliverable**: Architecture documentation and ADRs

**Status**: ✅ Completed

1. **System Architecture Document** ✅
  - Overall system design
  - Frontend-backend communication patterns
  - State management architecture (MobX)
  - API design principles (REST)
2. **Architecture Decision Records (ADRs)** ✅
  - ADR-001: Authentication approach (Django session auth vs JWT) ✅
  - ADR-002: Image storage strategy (local filesystem vs cloud storage) ✅
  - ADR-003: Permission model (Django permissions vs custom) ✅
  - ADR-004: API versioning strategy ✅
3. **Security Architecture** ✅
  - Authentication flow
  - Authorization rules
  - CSRF protection
  - File upload security

**Files Created**:

- ✅ `docs/architecture/README.md`
- ✅ `docs/architecture/system-architecture.md`
- ✅ `docs/architecture/security-architecture.md`
- ✅ `docs/architecture/adr/001-authentication-approach.md`
- ✅ `docs/architecture/adr/002-image-storage-strategy.md`
- ✅ `docs/architecture/adr/003-permission-model.md`
- ✅ `docs/architecture/adr/004-api-versioning-strategy.md`

### Data Architect Tasks ✅

**Deliverable**: Database schema and data model documentation

**Status**: ✅ Completed

1. **Database Schema Design** ✅
  - Entity-Relationship diagram
  - User table schema
  - Collection table schema (with indexes)
  - Record table schema (with indexes)
  - Foreign key relationships
  - Database constraints
2. **Data Model Documentation** ✅
  - Django model specifications
  - Field types and constraints
  - Validation rules
  - Migration strategy
3. **Query Optimization Plan** ✅
  - Index strategy (collection owner, collection is_closed, record collection)
  - Query patterns analysis
  - Performance considerations

**Files Created**:

- ✅ `docs/data/schema-design.md`
- ✅ `docs/data/models.md`
- ✅ `docs/data/query-optimization.md`

## Phase 2: Tests ✅ COMPLETED

**Status**: All test tasks completed. Comprehensive test suites created for both backend and frontend.

**Workflow Position**: Following the **Documentation → Tests → Production Code → Review and Bug Fix → Update Documentation and Plans** workflow, tests are written based on the complete documentation from Phase 1, before any production code is implemented.

**Reference Documentation**:

- API Specification: `docs/api-specification.md`
- Data Models: `docs/data-models.md`
- User Stories: `docs/user-stories/`
- System Architecture: `docs/architecture/system-architecture.md`
- Developer Guide: `docs/developer-guide.md`
- Design Documentation: `docs/design/` (for frontend tests)

### Backend Tester Tasks ✅

**Role**: Backend Tester (`docs/agent-roles/06-backend-tester.md`)

**Status**: ✅ Completed

**Deliverable**: Comprehensive backend test suite with >85% coverage

**Testing Framework**: pytest, pytest-django, pytest-cov

**Test Location**: `backend/api/tests/`

**Files Created**:

- ✅ `backend/api/tests/test_auth.py` (415 lines)
- ✅ `backend/api/tests/test_collections.py` (764 lines)
- ✅ `backend/api/tests/test_records.py` (1152 lines)
- ✅ `backend/api/tests/test_integration.py` (526 lines)
- ✅ `backend/api/tests/__init__.py`

#### 1. Authentication API Tests (`backend/api/tests/test_auth.py`)

**Reference**: `docs/api-specification.md` (Authentication Endpoints), `docs/user-stories/01-authentication.md`

**Test Scenarios**:

1.1. **User Registration Tests** (US-001)

- Test successful registration with valid username and password
- Test registration with duplicate username (should return 400)
- Test registration with invalid username format (should return 400)
- Test registration with weak password (< 8 characters, should return 400)
- Test registration automatically logs in user (session created)
- Test registration response format matches API spec (id, username, email)
- Test field validation errors are returned in `field_errors` format
- Test password is hashed (not stored in plain text)

1.2. **User Login Tests** (US-002)

- Test successful login with valid credentials
- Test login with invalid username (should return 400/401)
- Test login with invalid password (should return 400/401)
- Test login creates session cookie
- Test login response format matches API spec
- Test login with empty credentials (should return 400)

1.3. **User Logout Tests** (US-003)

- Test logout requires authentication (401 if not authenticated)
- Test logout destroys session (session invalidated)
- Test logout returns 204 No Content
- Test user cannot access protected endpoints after logout

1.4. **Current User Endpoint Tests** (US-004)

- Test `/api/auth/me/` returns user data when authenticated
- Test `/api/auth/me/` returns 401 when not authenticated
- Test response format matches API spec (id, username, email)
- Test session persistence across requests

1.5. **Session Management Tests** (US-004)

- Test session persists across multiple requests
- Test session cookie is set correctly
- Test session expiration handling (if implemented)
- Test CSRF protection for state-changing operations

**Test Data Setup**:

- Create test users with various states (active, inactive)
- Use Django's test client with session support
- Test both authenticated and anonymous user scenarios

#### 2. Collection API Tests (`backend/api/tests/test_collections.py`)

**Reference**: `docs/api-specification.md` (Collection Endpoints), `docs/user-stories/02-collections.md`, `docs/data-models.md` (Collection Model)

**Test Scenarios**:

2.1. **List Collections Tests** (US-008)

- Test list endpoint accessible to anonymous users (200 OK)
- Test list endpoint accessible to authenticated users (200 OK)
- Test pagination (page, page_size parameters)
- Test pagination response format (count, next, previous, results)
- Test filtering by owner (query parameter)
- Test filtering by is_closed status (query parameter)
- Test response includes all required fields (id, name, description, owner, is_closed, timestamps, record_count)
- Test empty list returns empty results array
- Test ordering (should be by -created_at per data model spec)

2.2. **Create Collection Tests** (US-005)

- Test create requires authentication (401 if not authenticated)
- Test successful creation with valid data
- Test owner is automatically set to authenticated user
- Test is_closed defaults to False
- Test timestamps are automatically set (created_at, updated_at)
- Test validation: name required (400 if missing)
- Test validation: name max length 200 characters (400 if exceeded)
- Test validation: description max length 1000 characters (400 if exceeded)
- Test description is optional (can be empty)
- Test response format matches API spec (201 Created)
- Test field errors returned in proper format

2.3. **Retrieve Collection Tests** (US-009)

- Test retrieve accessible to anonymous users (200 OK)
- Test retrieve accessible to authenticated users (200 OK)
- Test retrieve with valid ID returns collection data
- Test retrieve with invalid ID returns 404
- Test response includes all fields including record_count
- Test owner information is nested correctly

2.4. **Update Collection Tests** (US-006)

- Test update requires authentication (401 if not authenticated)
- Test only owner can update (403 if not owner)
- Test cannot update closed collection (403 if is_closed=True)
- Test successful update with PATCH (partial update)
- Test successful update with PUT (full update)
- Test updated_at timestamp is updated
- Test validation errors (name too long, description too long)
- Test response format matches API spec (200 OK)

2.5. **Close Collection Tests** (US-007)

- Test close requires authentication (401 if not authenticated)
- Test only owner can close (403 if not owner)
- Test successful close sets is_closed=True
- Test closed collection cannot be updated (403)
- Test closing is one-way operation (cannot reopen in initial version)
- Test response format matches API spec
- Test updated_at timestamp is updated on close

2.6. **Permission Edge Cases**

- Test anonymous user cannot create/update/close collections
- Test non-owner authenticated user cannot update/close
- Test owner cannot update closed collection
- Test cascade delete (if user deleted, collections deleted - test at model level)

**Test Data Setup**:

- Create test users (owner, non-owner, anonymous)
- Create test collections (open, closed, different owners)
- Use Django factories or fixtures for test data
- Test database indexes are used (query performance)

#### 3. Record API Tests (`backend/api/tests/test_records.py`)

**Reference**: `docs/api-specification.md` (Record Endpoints), `docs/user-stories/03-records.md`, `docs/data-models.md` (Record Model)

**Test Scenarios**:

3.1. **List Records Tests** (US-013)

- Test list endpoint accessible to anonymous users (200 OK)
- Test list endpoint accessible to authenticated users (200 OK)
- Test collection parameter is required (400 if missing)
- Test collection parameter validation (404 if invalid collection ID)
- Test pagination (page, page_size parameters)
- Test pagination response format
- Test response includes all required fields
- Test image URLs are properly formatted
- Test empty list returns empty results array
- Test ordering (should be by -created_at per data model spec)

3.2. **Create Record Tests** (US-010, US-015)

- Test create requires authentication (401 if not authenticated)
- Test only collection owner can create (403 if not owner)
- Test cannot create in closed collection (403 if collection is_closed=True)
- Test successful creation with all required fields
- Test successful creation with optional fields
- Test validation: title required (400 if missing)
- Test validation: artist required (400 if missing)
- Test validation: title max length 200 characters
- Test validation: artist max length 200 characters
- Test validation: year must be integer between 1000-2100 (per data model)
- Test validation: medium max length 100 characters
- Test validation: dimensions max length 100 characters
- Test validation: description max length 2000 characters
- Test validation: condition max length 200 characters
- Test image upload with valid file (JPG, PNG, GIF)
- Test image upload file size limit (10MB max)
- Test image upload invalid file type (should return 400)
- Test image upload file too large (should return 400)
- Test image is optional (can create record without image)
- Test image is stored in correct location (records/ directory)
- Test timestamps are automatically set
- Test response format matches API spec (201 Created)
- Test image URL in response is correct

3.3. **Retrieve Record Tests** (US-014)

- Test retrieve accessible to anonymous users (200 OK)
- Test retrieve accessible to authenticated users (200 OK)
- Test retrieve with valid ID returns record data
- Test retrieve with invalid ID returns 404
- Test response includes all fields including image URL
- Test image URL is accessible

3.4. **Update Record Tests** (US-011, US-015)

- Test update requires authentication (401 if not authenticated)
- Test only collection owner can update (403 if not owner)
- Test cannot update record in closed collection (403 if collection is_closed=True)
- Test successful update with PATCH (partial update)
- Test successful update with PUT (full update)
- Test image can be replaced during update
- Test old image file is deleted when replaced
- Test updated_at timestamp is updated
- Test validation errors for all fields
- Test response format matches API spec (200 OK)

3.5. **Delete Record Tests** (US-012)

- Test delete requires authentication (401 if not authenticated)
- Test only collection owner can delete (403 if not owner)
- Test cannot delete record in closed collection (403 if collection is_closed=True)
- Test successful delete returns 204 No Content
- Test record is removed from database
- Test associated image file is deleted (if exists)
- Test delete with invalid ID returns 404

3.6. **Image Upload Tests** (US-015)

- Test valid image formats (JPEG, PNG, GIF)
- Test invalid image formats are rejected
- Test file size validation (10MB limit)
- Test image is stored with correct filename
- Test image URL generation
- Test image is publicly accessible (no auth required to view)
- Test image deletion on record delete
- Test image replacement during update

3.7. **Permission Edge Cases**

- Test anonymous user cannot create/update/delete records
- Test non-owner authenticated user cannot create/update/delete
- Test owner cannot modify records in closed collection
- Test cascade delete (if collection deleted, records deleted)

**Test Data Setup**:

- Create test collections (open, closed, different owners)
- Create test records (with/without images, different collections)
- Use temporary file storage for image uploads
- Clean up uploaded files after tests
- Test multipart/form-data request format

#### 4. Integration Tests (`backend/api/tests/test_integration.py`)

**Reference**: `docs/user-stories/`, `docs/api-specification.md`

**Test Scenarios**:

4.1. **Full Workflow Tests**

- Test complete user journey: register → login → create collection → add records → close collection
- Test workflow: create collection → add multiple records → update collection → update records → close collection → verify read-only
- Test data integrity throughout workflow
- Test session persistence across workflow steps

4.2. **Anonymous User Access Tests**

- Test anonymous user can view collections list
- Test anonymous user can view collection details
- Test anonymous user can view records list
- Test anonymous user can view record details
- Test anonymous user cannot perform any write operations
- Test anonymous user sees read-only views

4.3. **Multi-User Scenarios**

- Test user A cannot modify user B's collections
- Test user A cannot modify user B's records
- Test multiple users can view each other's collections (public access)
- Test concurrent operations (if applicable)

4.4. **Error Handling Integration Tests**

- Test error responses are consistent across all endpoints
- Test error format matches API specification
- Test proper HTTP status codes for all scenarios
- Test error messages are user-friendly

**Test Coverage Requirements**:

- Overall coverage: >85%
- Critical paths: 100% coverage
- Error handling: >90% coverage
- Permission checks: 100% coverage

**Test Organization**:

- Use pytest fixtures for common test data
- Use pytest markers for test categorization (@pytest.mark.django_db, @pytest.mark.integration)
- Use pytest parametrize for testing multiple scenarios
- Follow AAA pattern (Arrange, Act, Assert)
- Use descriptive test names that reference user stories

**Test Documentation**:

- Document test setup and teardown procedures
- Document test data requirements
- Document any test-specific configurations
- Reference user stories and API specifications in test docstrings

### Frontend Tester Tasks ✅

**Role**: Frontend Tester (`docs/agent-roles/05-frontend-tester.md`)

**Status**: ✅ Completed

**Deliverable**: Comprehensive frontend test suite with >80% coverage

**Testing Framework**: Vitest, React Testing Library, @testing-library/user-event

**Test Location**: `frontend/src/test/`

**Files Created**:

- ✅ `frontend/src/test/components/Auth.test.tsx`
- ✅ `frontend/src/test/components/Collections.test.tsx`
- ✅ `frontend/src/test/components/Records.test.tsx`
- ✅ `frontend/src/test/stores/authStore.test.ts`
- ✅ `frontend/src/test/stores/collectionStore.test.ts`
- ✅ `frontend/src/test/stores/recordStore.test.ts`
- ✅ `frontend/src/test/integration/userFlows.test.tsx`
- ✅ `frontend/src/test/App.test.tsx`

#### 1. Authentication Component Tests (`frontend/src/test/components/Auth.test.tsx`)

**Reference**: `docs/user-stories/01-authentication.md`, `docs/design/01-authentication-design.md`, `docs/api-specification.md` (Authentication Endpoints)

**Test Scenarios**:

1.1. **LoginForm Component Tests** (US-002)

- Test form renders with username and password fields
- Test form submission with valid credentials
- Test form submission with invalid credentials shows error message
- Test form validation: username required
- Test form validation: password required
- Test loading state during login
- Test successful login updates AuthStore
- Test successful login redirects to collections page
- Test error messages are displayed correctly
- Test form accessibility (labels, ARIA attributes)
- Test keyboard navigation (Tab, Enter)
- Test form resets on successful login

1.2. **RegisterForm Component Tests** (US-001)

- Test form renders with username and password fields
- Test form submission with valid data
- Test form validation: username required
- Test form validation: password required
- Test form validation: password minimum length (8 characters)
- Test form validation: duplicate username shows error
- Test loading state during registration
- Test successful registration automatically logs in user
- Test successful registration updates AuthStore
- Test successful registration redirects to collections page
- Test error messages are displayed correctly
- Test field-level error messages
- Test form accessibility

1.3. **LogoutButton Component Tests** (US-003)

- Test button renders when user is authenticated
- Test button does not render when user is not authenticated
- Test logout action clears AuthStore
- Test logout action redirects to public view
- Test logout confirmation (if implemented)
- Test logout button accessibility

1.4. **ProtectedRoute Component Tests**

- Test redirects to login when user not authenticated
- Test allows access when user is authenticated
- Test preserves intended destination after login
- Test handles session expiration gracefully

1.5. **Error Handling Tests**

- Test network errors are handled gracefully
- Test 401 errors trigger logout
- Test 403 errors show appropriate message
- Test 404 errors show appropriate message
- Test 500 errors show appropriate message
- Test error messages are user-friendly

**Test Setup**:

- Mock API client/service
- Mock AuthStore
- Use React Testing Library for component rendering
- Use user-event for user interactions
- Test both authenticated and unauthenticated states

#### 2. Collection Component Tests (`frontend/src/test/components/Collections.test.tsx`)

**Reference**: `docs/user-stories/02-collections.md`, `docs/design/02-collection-management-design.md`, `docs/api-specification.md` (Collection Endpoints)

**Test Scenarios**:

2.1. **CollectionList Component Tests** (US-008)

- Test renders collection cards/grid
- Test displays collection name, description, owner, dates
- Test displays closed status indicator (badge/icon)
- Test displays record count
- Test empty state when no collections
- Test loading state while fetching
- Test error state when fetch fails
- Test pagination controls (if implemented)
- Test click on collection navigates to detail page
- Test filtering/sorting (if implemented)
- Test responsive layout (mobile, tablet, desktop)
- Test accessibility (keyboard navigation, screen reader)

2.2. **CollectionCard Component Tests**

- Test renders collection information correctly
- Test displays truncated description
- Test displays owner username
- Test displays creation date (formatted)
- Test displays closed badge when is_closed=True
- Test click handler navigates to detail
- Test hover states (if implemented)
- Test accessibility

2.3. **CollectionForm Component Tests** (US-005, US-006)

- Test create mode: form renders with empty fields
- Test edit mode: form pre-populates with collection data
- Test form validation: name required
- Test form validation: name max length 200 characters
- Test form validation: description max length 1000 characters
- Test form submission creates collection (create mode)
- Test form submission updates collection (edit mode)
- Test form submission with invalid data shows errors
- Test cancel button closes form/navigates back
- Test loading state during submission
- Test success message after creation/update
- Test form accessibility
- Test edit form disabled when collection is closed

2.4. **CollectionDetail Component Tests** (US-009)

- Test renders all collection information
- Test displays owner information
- Test displays timestamps (formatted)
- Test displays closed status
- Test displays records list (if included)
- Test edit button visible to owner (when not closed)
- Test edit button hidden to non-owners
- Test edit button hidden when collection is closed
- Test close button visible to owner (when not closed)
- Test close button hidden to non-owners
- Test empty state when no records
- Test navigation back to list
- Test accessibility

2.5. **CloseCollectionDialog Component Tests** (US-007)

- Test dialog renders when close button clicked
- Test dialog shows confirmation message
- Test dialog explains read-only consequences
- Test confirm action closes collection
- Test cancel action dismisses dialog
- Test dialog accessibility (focus trap, ARIA)
- Test ESC key closes dialog
- Test loading state during close operation

2.6. **Empty States Tests**

- Test empty collection list message
- Test empty collection detail (no records)
- Test empty states are accessible

**Test Setup**:

- Mock CollectionStore
- Mock API client
- Mock router/navigation
- Use test data matching API response format
- Test both owner and non-owner perspectives

#### 3. Record Component Tests (`frontend/src/test/components/Records.test.tsx`)

**Reference**: `docs/user-stories/03-records.md`, `docs/design/03-record-management-design.md`, `docs/api-specification.md` (Record Endpoints)

**Test Scenarios**:

3.1. **RecordList Component Tests** (US-013)

- Test renders record cards/grid
- Test displays record title, artist, year, thumbnail
- Test displays image placeholder when no image
- Test empty state when no records
- Test loading state while fetching
- Test error state when fetch fails
- Test pagination controls (if implemented)
- Test click on record navigates to detail page
- Test filtering by collection (required parameter)
- Test responsive layout
- Test accessibility

3.2. **RecordCard Component Tests**

- Test renders record information correctly
- Test displays image thumbnail (if available)
- Test displays image placeholder (if no image)
- Test displays title and artist prominently
- Test displays year (if available)
- Test click handler navigates to detail
- Test hover states
- Test accessibility

3.3. **RecordForm Component Tests** (US-010, US-011, US-015)

- Test create mode: form renders with empty fields
- Test edit mode: form pre-populates with record data
- Test form validation: title required
- Test form validation: artist required
- Test form validation: title max length 200 characters
- Test form validation: artist max length 200 characters
- Test form validation: year must be integer 1000-2100
- Test form validation: all optional fields
- Test image upload: file selection
- Test image upload: file preview before upload
- Test image upload: invalid file type shows error
- Test image upload: file too large shows error (10MB limit)
- Test image upload: remove selected image
- Test form submission creates record (create mode)
- Test form submission updates record (edit mode)
- Test form submission with image upload
- Test form submission without image (optional)
- Test form submission with invalid data shows errors
- Test cancel button closes form/navigates back
- Test loading state during submission
- Test success message after creation/update
- Test form disabled when collection is closed
- Test form accessibility
- Test multipart/form-data format for image uploads

3.4. **RecordDetail Component Tests** (US-014)

- Test renders all record information
- Test displays image at reasonable size
- Test displays full-size image option (if implemented)
- Test displays all fields (title, artist, year, medium, dimensions, description, condition)
- Test displays collection information
- Test displays timestamps (formatted)
- Test edit button visible to owner (when collection not closed)
- Test edit button hidden to non-owners
- Test edit button hidden when collection is closed
- Test delete button visible to owner (when collection not closed)
- Test delete button hidden to non-owners
- Test delete button hidden when collection is closed
- Test navigation back to collection/records list
- Test accessibility

3.5. **ImageUpload Component Tests** (US-015)

- Test file input renders
- Test file selection triggers preview
- Test image preview displays selected image
- Test preview shows before upload
- Test remove image button clears preview
- Test file type validation (JPG, PNG, GIF)
- Test file size validation (10MB max)
- Test error messages for invalid files
- Test loading state during upload
- Test accessibility (file input labels, ARIA)

3.6. **DeleteRecordDialog Component Tests** (US-012)

- Test dialog renders when delete button clicked
- Test dialog shows record title in confirmation
- Test dialog warns about permanent deletion
- Test confirm action deletes record
- Test cancel action dismisses dialog
- Test dialog accessibility
- Test loading state during deletion
- Test success message after deletion

3.7. **Empty States Tests**

- Test empty record list message
- Test empty states are accessible

**Test Setup**:

- Mock RecordStore
- Mock API client
- Mock file upload functionality
- Use test image files for upload tests
- Test both owner and non-owner perspectives
- Test with closed and open collections

#### 4. Store Tests (`frontend/src/test/stores/`)

**Reference**: `docs/architecture/system-architecture.md` (State Management), `docs/api-specification.md`

**Test Scenarios**:

4.1. **AuthStore Tests** (`frontend/src/test/stores/authStore.test.ts`)

- Test initial state (user: null, loading: false, error: null)
- Test login action: successful login updates user state
- Test login action: failed login sets error state
- Test login action: sets loading state during request
- Test logout action: clears user state
- Test register action: successful registration updates user state
- Test register action: failed registration sets error state
- Test fetchCurrentUser action: updates user state
- Test fetchCurrentUser action: clears user if not authenticated
- Test error state is cleared on successful operations
- Test observable state triggers reactions
- Test store methods are bound correctly

4.2. **CollectionStore Tests** (`frontend/src/test/stores/collectionStore.test.ts`)

- Test initial state (collections: [], loading: false, error: null)
- Test fetchCollections action: updates collections array
- Test fetchCollections action: handles pagination
- Test fetchCollections action: sets loading state
- Test fetchCollections action: handles errors
- Test fetchCollection action: updates single collection
- Test createCollection action: adds collection to array
- Test createCollection action: handles errors
- Test updateCollection action: updates collection in array
- Test updateCollection action: handles errors
- Test closeCollection action: updates is_closed status
- Test closeCollection action: handles errors
- Test computed values (if any)
- Test observable state triggers reactions

4.3. **RecordStore Tests** (`frontend/src/test/stores/recordStore.test.ts`)

- Test initial state (records: [], loading: false, error: null)
- Test fetchRecords action: updates records array
- Test fetchRecords action: handles pagination
- Test fetchRecords action: requires collection parameter
- Test fetchRecords action: sets loading state
- Test fetchRecords action: handles errors
- Test fetchRecord action: updates single record
- Test createRecord action: adds record to array
- Test createRecord action: handles image upload
- Test createRecord action: handles errors
- Test updateRecord action: updates record in array
- Test updateRecord action: handles image replacement
- Test updateRecord action: handles errors
- Test deleteRecord action: removes record from array
- Test deleteRecord action: handles errors
- Test computed values (if any)
- Test observable state triggers reactions

4.4. **Store Integration Tests**

- Test stores work together (e.g., AuthStore affects CollectionStore permissions)
- Test store state persists across component unmounts (if applicable)
- Test store error handling doesn't break other stores

**Test Setup**:

- Mock API client/service
- Use MobX test utilities if available
- Test observable reactivity
- Test action behavior
- Test computed values

#### 5. Integration Tests (`frontend/src/test/integration/`)

**Reference**: `docs/user-stories/`, `docs/design/04-navigation-layout.md`

**Test Scenarios**:

5.1. **User Flow Tests**

- Test complete flow: register → login → create collection → add records → close collection
- Test flow: login → view collections → view collection detail → view records → view record detail
- Test flow: login → create collection → add record with image → edit record → delete record
- Test navigation between pages
- Test state persistence across navigation
- Test error recovery (network errors, validation errors)

5.2. **Anonymous User Flow Tests**

- Test anonymous user can view collections list
- Test anonymous user can view collection details
- Test anonymous user can view records list
- Test anonymous user can view record details
- Test anonymous user cannot access create/edit forms
- Test anonymous user is redirected to login when accessing protected routes
- Test anonymous user sees read-only views

5.3. **Permission-Based UI Tests**

- Test owner sees edit/delete options
- Test non-owner does not see edit/delete options
- Test closed collections disable edit/delete options
- Test UI updates when collection is closed
- Test UI reflects authentication state

5.4. **Error Handling Integration Tests**

- Test network errors are handled gracefully
- Test 401 errors trigger logout and redirect
- Test 403 errors show appropriate messages
- Test 404 errors show appropriate messages
- Test validation errors are displayed in forms
- Test error states don't break navigation

5.5. **Accessibility Integration Tests**

- Test keyboard navigation throughout application
- Test screen reader compatibility
- Test focus management in modals/dialogs
- Test ARIA attributes are correct
- Test color contrast meets WCAG 2.1 AA standards
- Test form labels are associated correctly

**Test Setup**:

- Use React Testing Library for integration tests
- Mock API responses
- Test real user interactions
- Test accessibility with screen reader simulation (if available)
- Test responsive behavior

**Test Coverage Requirements**:

- Overall coverage: >80%
- Component rendering: 100% coverage
- User interactions: >90% coverage
- Error handling: >85% coverage
- Store actions: >90% coverage
- Critical user flows: 100% coverage

**Test Organization**:

- Organize tests by component/feature
- Use describe blocks for test grouping
- Use descriptive test names
- Reference user stories in test descriptions
- Use test fixtures for common test data
- Mock external dependencies (API, router)

**Test Documentation**:

- Document test setup and teardown
- Document mocking strategies
- Document accessibility testing approach
- Reference user stories and design docs in test comments
- Document any test-specific configurations

**Testing Best Practices**:

- Test user behavior, not implementation details
- Use React Testing Library queries (getByRole, getByLabelText, etc.)
- Test accessibility as part of component tests
- Use user-event for realistic user interactions
- Test error states and edge cases
- Keep tests maintainable and readable
- Follow AAA pattern (Arrange, Act, Assert)

## Phase 3: Production Code ✅ COMPLETED

**Status**: Ready to begin. All documentation and tests are complete. Production code implementation can now proceed following TDD approach (tests should pass after implementation).

### Data Architect Tasks

**Deliverable**: Django models and migrations

1. **Create Django Models** (`backend/api/models.py`)
  - User model (extend Django User if needed)
  - Collection model (name, description, owner ForeignKey, is_closed Boolean, timestamps)
  - Record model (all fields, collection ForeignKey, image FileField, timestamps)
  - Model methods and properties
2. **Create Migrations**
  - Initial migration
  - Add indexes for performance
3. **Model Validation**
  - Field validators
  - Model-level validation

### Backend Developer Tasks

**Deliverable**: Django REST API implementation

1. **Authentication Implementation** (`backend/api/views.py`, `backend/api/serializers.py`)
  - User registration endpoint
  - Login/logout endpoints
  - Current user endpoint
  - Session authentication configuration
2. **Collection API Implementation**
  - Collection serializer
  - CollectionViewSet (list, create, retrieve, update, partial_update for close)
  - Permission classes (IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly)
  - Filtering and pagination
3. **Record API Implementation**
  - Record serializer (with image handling)
  - RecordViewSet (list, create, retrieve, update, destroy)
  - Permission classes (check collection ownership and is_closed status)
  - Image upload handling
4. **URL Configuration** (`backend/api/urls.py`, `backend/ekho_backend/urls.py`)
  - API route configuration
  - Router setup
5. **Settings Configuration** (`backend/ekho_backend/settings.py`)
  - Media file configuration (for image uploads)
  - REST framework authentication settings
  - CORS configuration updates

### Frontend Developer Tasks

**Deliverable**: React components and MobX stores

1. **MobX Stores** (`frontend/src/stores/`)
  - AuthStore (login, logout, register, currentUser)
  - CollectionStore (list, create, update, close, fetch)
  - RecordStore (list, create, update, delete, uploadImage, fetch)
2. **Authentication Components** (`frontend/src/components/auth/`)
  - LoginForm component
  - RegisterForm component
  - LogoutButton component
  - ProtectedRoute component
3. **Collection Components** (`frontend/src/components/collections/`)
  - CollectionList component
  - CollectionCard component
  - CollectionForm component (create/edit)
  - CollectionDetail component
  - CloseCollectionDialog component
4. **Record Components** (`frontend/src/components/records/`)
  - RecordList component
  - RecordCard component
  - RecordForm component (create/edit with image upload)
  - RecordDetail component
  - ImageUpload component
5. **Layout Components** (`frontend/src/components/layout/`)
  - Navigation component
  - MainLayout component
  - UserMenu component
6. **API Service** (`frontend/src/services/api.ts`)
  - API client configuration
  - Request/response interceptors
  - Error handling
7. **App Routing** (`frontend/src/App.tsx`)
  - Route configuration
  - Protected routes
  - Public routes

### DevOps Engineer Tasks

**Deliverable**: CI/CD pipeline and deployment configuration

1. **CI/CD Pipeline** (`.github/workflows/ci.yml` or similar)
  - Backend test execution
  - Frontend test execution
  - Linting checks
  - Build verification
2. **Docker Configuration** (optional)
  - Dockerfile for backend
  - Dockerfile for frontend
  - docker-compose.yml for local development
3. **Environment Configuration**
  - Environment variable documentation
  - Production settings template
4. **Deployment Scripts**
  - Deployment automation
  - Database migration scripts

## File Structure

```
ekho/
├── backend/
│   ├── api/
│   │   ├── models.py          # User, Collection, Record models
│   │   ├── serializers.py     # API serializers
│   │   ├── views.py           # API views/viewsets
│   │   ├── permissions.py     # Custom permission classes
│   │   ├── urls.py            # API routes
│   │   └── tests/
│   │       ├── test_auth.py ✅
│   │       ├── test_collections.py ✅
│   │       ├── test_records.py ✅
│   │       ├── test_integration.py ✅
│   │       └── __init__.py ✅
│   └── ekho_backend/
│       └── settings.py        # Media files config
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── collections/
│   │   │   ├── records/
│   │   │   └── layout/
│   │   ├── stores/
│   │   │   ├── authStore.ts
│   │   │   ├── collectionStore.ts
│   │   │   └── recordStore.ts
│   │   ├── services/
│   │   │   └── api.ts
│   │   └── test/ ✅
│   │       ├── components/
│   │       │   ├── Auth.test.tsx ✅
│   │       │   ├── Collections.test.tsx ✅
│   │       │   └── Records.test.tsx ✅
│   │       ├── stores/
│   │       │   ├── authStore.test.ts ✅
│   │       │   ├── collectionStore.test.ts ✅
│   │       │   └── recordStore.test.ts ✅
│   │       ├── integration/
│   │       │   └── userFlows.test.tsx ✅
│   │       └── App.test.tsx ✅
│   └── public/                # Image uploads destination
└── docs/
    ├── user-stories/ ✅
    │   ├── 01-authentication.md ✅
    │   ├── 02-collections.md ✅
    │   └── 03-records.md ✅
    ├── design/ ✅
    │   ├── README.md ✅
    │   ├── 01-authentication-design.md ✅
    │   ├── 02-collection-management-design.md ✅
    │   ├── 03-record-management-design.md ✅
    │   ├── 04-navigation-layout.md ✅
    │   └── 05-design-system.md ✅
    ├── architecture/ ✅
    │   ├── README.md ✅
    │   ├── system-architecture.md ✅
    │   ├── security-architecture.md ✅
    │   └── adr/ ✅
    │       ├── 001-authentication-approach.md ✅
    │       ├── 002-image-storage-strategy.md ✅
    │       ├── 003-permission-model.md ✅
    │       └── 004-api-versioning-strategy.md ✅
    ├── data/ ✅
    │   ├── schema-design.md ✅
    │   ├── models.md ✅
    │   └── query-optimization.md ✅
    ├── api-specification.md ✅
    ├── data-models.md ✅
    └── developer-guide.md ✅
```

## Implementation Order

1. **Week 1-2: Documentation Phase** ✅ COMPLETED
  - Product Owner: User stories ✅
  - UI/UX Designer: Design mockups ✅
  - Technical Writer: API specs ✅
  - Lead Architect: Architecture docs ✅
  - Data Architect: Schema design ✅
2. **Week 3: Test Phase** ✅ COMPLETED
  - Backend Tester: Backend test suite ✅
  - Frontend Tester: Frontend test suite ✅
3. **Week 4-6: Production Code Phase**
  - Data Architect: Models and migrations
  - Backend Developer: API implementation
  - Frontend Developer: UI implementation
  - DevOps Engineer: CI/CD setup (parallel)
4. **Week 7: Integration & Testing**
  - End-to-end testing
  - Bug fixes
  - Documentation updates

## Success Criteria

- All user stories implemented and tested
- Backend test coverage >85%
- Frontend test coverage >80%
- All API endpoints documented
- Responsive design implemented
- Image uploads working
- Anonymous user access working
- Collection close (read-only) functionality working
- CI/CD pipeline running tests automatically

