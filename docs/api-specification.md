# API Specification

This document specifies the REST API endpoints for the Ekho Art Collection Management Application. The API follows RESTful principles and uses Django REST Framework.

## Base URL

```
http://localhost:8000/api/
```

## Authentication

The API uses Django session authentication. Clients must include session cookies in requests for authenticated endpoints.

### Authentication Flow

1. Client sends credentials to `/api/auth/register/` or `/api/auth/login/`
2. Server creates session and returns session cookie
3. Client includes session cookie in subsequent requests
4. Server validates session for protected endpoints

## Response Format

### Success Response

```json
{
  "data": { ... }
}
```

or for list endpoints:

```json
{
  "count": 100,
  "next": "http://localhost:8000/api/collections/?page=2",
  "previous": null,
  "results": [ ... ]
}
```

### Error Response

```json
{
  "error": "Error message",
  "detail": "Detailed error description",
  "field_errors": {
    "field_name": ["Error message"]
  }
}
```

### Status Codes

- `200 OK`: Successful GET, PUT, PATCH
- `201 Created`: Successful POST
- `204 No Content`: Successful DELETE
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Permission denied
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Endpoints

### Authentication Endpoints

#### Register User

**POST** `/api/auth/register/`

Creates a new user account and automatically logs them in.

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "securepassword123"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "username": "johndoe",
  "email": ""
}
```

**Errors:**
- `400`: Invalid data (duplicate username, weak password, etc.)
- Field errors in `field_errors` object

**User Stories:** US-001

---

#### Login

**POST** `/api/auth/login/`

Authenticates user and creates session.

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "securepassword123"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "username": "johndoe",
  "email": ""
}
```

**Errors:**
- `400`: Invalid credentials
- `401`: Authentication failed

**User Stories:** US-002

---

#### Logout

**POST** `/api/auth/logout/`

Destroys user session.

**Request Body:** None (or empty)

**Response:** `204 No Content`

**Authentication:** Required

**User Stories:** US-003

---

#### Current User

**GET** `/api/auth/me/`

Returns current authenticated user information.

**Response:** `200 OK`
```json
{
  "id": 1,
  "username": "johndoe",
  "email": ""
}
```

**Response (Unauthenticated):** `401 Unauthorized`

**User Stories:** US-004

---

### Actor registry endpoints

Actors are shared catalog entries: `data` includes **`person`** and **`organization`** objects (see `docs/data/actor-models.md`). **Exactly one** of them must carry enough information to identify the actor (not both, not neither). An **`organization`** object may include optional **`contact_person`**. Record domain JSON references actors with `{ "id": <actor primary key> }` only in actor-shaped fields (see `record_actor_refs` on the server).

#### List actors

**GET** `/api/actors/`

- **Anonymous:** only global actors (`owner` is `null`).
- **Authenticated:** global actors plus actors owned by the current user.

Paginated like collections (`count`, `next`, `previous`, `results`).

#### Create actor

**POST** `/api/actors/`

**Authentication:** Required.

**Body:** `{ "data": { "person": { ... }, "organization": { ... } } }` (both keys optional objects; exactly one side must be populated enough to identify the actor; `organization.contact_person` is optional).

#### Retrieve / update / delete actor

**GET|PATCH|DELETE** `/api/actors/{id}/`

- **Global actors** (`owner` null): readable by anyone who can list them; **PATCH/DELETE** only for Django staff users.
- **User-owned actors:** full CRUD for the owner; other users receive `404` on detail.

#### Actor usage (records)

**GET** `/api/actors/{id}/usage/`

**Response:** `{ "count": <number>, "records": [ { "id": <record id>, "label": "<title or object number>" } ] }` (sample records capped; `count` is total).

#### Deleting an actor

**DELETE** removes the actor and **strips** all references to that id from every record’s `data` (see server `strip_actor_id`).

#### Record validation

On record create/update, every actor id embedded in `data` must exist and be either global or owned by the authenticated user saving the record.

---

### Collection Endpoints

#### List Collections

**GET** `/api/collections/`

Returns a paginated list of all collections. Accessible to both authenticated and anonymous users.

**Query Parameters:**
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)
- `owner`: Filter by owner username (optional)
- `is_closed`: Filter by closed status (true/false, optional)
- `search`: string (optional). Matches collections where the term appears (case-insensitive) in **name** or **description** (OR). Omitted or empty = no search filter. For future use (e.g. collections list search UI).

**Response:** `200 OK`
```json
{
  "count": 50,
  "next": "http://localhost:8000/api/collections/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Modern Art Collection",
      "description": "A collection of modern artworks",
      "owner": {
        "id": 1,
        "username": "johndoe"
      },
      "is_closed": false,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "record_count": 12
    }
  ]
}
```

**Authentication:** Not required (public endpoint)

**User Stories:** US-008

---

#### Create Collection

**POST** `/api/collections/`

Creates a new collection. The authenticated user becomes the owner.

**Request Body:**
```json
{
  "name": "My Art Collection",
  "description": "A collection of my favorite artworks"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "name": "My Art Collection",
  "description": "A collection of my favorite artworks",
  "owner": {
    "id": 1,
    "username": "johndoe"
  },
  "is_closed": false,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "record_count": 0
}
```

**Errors:**
- `400`: Invalid data
- `401`: Authentication required

**Authentication:** Required

**User Stories:** US-005

---

#### Retrieve Collection

**GET** `/api/collections/{id}/`

Returns detailed information about a specific collection.

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Modern Art Collection",
  "description": "A collection of modern artworks",
  "owner": {
    "id": 1,
    "username": "johndoe"
  },
  "is_closed": false,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "record_count": 12
}
```

**Errors:**
- `404`: Collection not found

**Authentication:** Not required (public endpoint)

**User Stories:** US-009

---

#### Update Collection

**PUT** `/api/collections/{id}/` or **PATCH** `/api/collections/{id}/`

Updates collection information. Only the owner can update, and only if the collection is not closed.

**Request Body (PATCH):**
```json
{
  "name": "Updated Collection Name",
  "description": "Updated description"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Updated Collection Name",
  "description": "Updated description",
  "owner": {
    "id": 1,
    "username": "johndoe"
  },
  "is_closed": false,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T11:00:00Z",
  "record_count": 12
}
```

**Errors:**
- `400`: Invalid data
- `401`: Authentication required
- `403`: Not the owner or collection is closed
- `404`: Collection not found

**Authentication:** Required (owner only)

**User Stories:** US-006

---

#### Close Collection

**PATCH** `/api/collections/{id}/`

Sets `is_closed` to `true`, making the collection read-only. Only the owner can close a collection.

**Request Body:**
```json
{
  "is_closed": true
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Modern Art Collection",
  "description": "A collection of modern artworks",
  "owner": {
    "id": 1,
    "username": "johndoe"
  },
  "is_closed": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T12:00:00Z",
  "record_count": 12
}
```

**Errors:**
- `400`: Invalid data
- `401`: Authentication required
- `403`: Not the owner
- `404`: Collection not found

**Authentication:** Required (owner only)

**User Stories:** US-007

---

### Record Endpoints

#### Record resource shape (locked)

Each record resource includes:

| Field | Type | Notes |
|-------|------|--------|
| `id` | integer | Primary key |
| `collection` | integer | Collection ID |
| `created_at`, `updated_at` | string (ISO 8601) | Timestamps |
| `data` | object | **Domain payload.** Nested object whose keys match [docs/data/record-models.md](data/record-models.md): `identification_details`, `aquisition_details`, `rights` (array of rights entries or `null`), `history`, `description`, `access`, `object_location`, `confidentiality`. Values are domain objects (or arrays where specified) or `null` when unset. Keeps DRF top-level metadata distinct from domain fields. |
| `representative_image` | string or `null` | **Optional.** Absolute URL of the list/detail thumbnail image; not part of the `data` graph. |
| `collection_name` | string | Read-only; list responses |
| `collection_owner_username` | string | Read-only; list responses |

**Wrapper key name:** `data` (locked). **Presentation image field name:** `representative_image` (locked).

---

#### List Records

**GET** `/api/records/`

Returns a paginated list of records. The `collection` query parameter is **optional**. When omitted, the response includes records from all collections (same visibility as today; no extra restriction at list level). When provided, only records from that collection are returned (backward compatibility for the collection detail page).

**Query Parameters:**
- `collection`: Collection ID (optional). When present, filter to records in this collection only. When omitted, return records from all collections.
- `collection_name`: string (optional). Substring match on the record’s collection name (case-insensitive). Omitted or empty = no filter.
- `owner`: string (optional). Exact match on the collection owner’s username. Omitted or empty = no filter.
- `search`: string (optional). Case-insensitive match when the term appears in **collection name**, **collection description**, or as a **substring of the serialized `data` JSON** (implementation: JSON cast to text for `icontains`, so any string inside the payload can match). Omitted or empty = no filter. Can be combined with `collection`, `collection_name`, and `owner`. For production, consider PostgreSQL-specific JSON operators if you need path-aware search.
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)

**Response:** `200 OK`

Paginated shape: `count`, `next`, `previous`, `results`. Each item in `results` follows **Record resource shape (locked)** above.

```json
{
  "count": 25,
  "next": "http://localhost:8000/api/records/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "collection": 1,
      "collection_name": "My Art Collection",
      "collection_owner_username": "johndoe",
      "representative_image": "http://localhost:8000/media/records/image1.jpg",
      "data": {
        "identification_details": null,
        "aquisition_details": null,
        "rights": null,
        "history": null,
        "description": null,
        "access": null,
        "object_location": null,
        "confidentiality": null
      },
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Errors:**
- `404`: When `collection` is provided and no collection with that ID exists

**Authentication:** Not required (public endpoint)

**User Stories:** US-013, US-016, US-018

---

#### Create Record

**POST** `/api/records/`

Creates a new record in a collection. Only the collection owner can create records, and only if the collection is not closed.

**Request (multipart/form-data, recommended):**

- `collection`: collection ID (required)
- `data`: JSON string — object with the domain keys under **Record resource shape** (same structure as response `data`; may be partial)
- `representative_image`: file (optional)

**Alternative:** `application/json` body with `collection` and `data` only when no new image is uploaded; use multipart when uploading `representative_image`.

**Response:** `201 Created` — body follows **Record resource shape (locked)**.

```json
{
  "id": 1,
  "collection": 1,
  "collection_name": "My Art Collection",
  "collection_owner_username": "johndoe",
  "representative_image": "http://localhost:8000/media/records/image1.jpg",
  "data": {
    "identification_details": null,
    "aquisition_details": null,
    "rights": null,
    "history": null,
    "description": null,
    "access": null,
    "object_location": null,
    "confidentiality": null
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Errors:**
- `400`: Invalid data or file
- `401`: Authentication required
- `403`: Not the collection owner or collection is closed
- `404`: Collection not found

**Authentication:** Required (owner only)

**User Stories:** US-010, US-015

---

#### Retrieve Record

**GET** `/api/records/{id}/`

Returns detailed information about a specific record.

**Response:** `200 OK`

Same fields as list items, including read-only `collection_name` and `collection_owner_username` on the serialized record.

```json
{
  "id": 1,
  "collection": 1,
  "collection_name": "My Art Collection",
  "collection_owner_username": "johndoe",
  "representative_image": "http://localhost:8000/media/records/image1.jpg",
  "data": {
    "identification_details": null,
    "aquisition_details": null,
    "rights": null,
    "history": null,
    "description": null,
    "access": null,
    "object_location": null,
    "confidentiality": null
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Errors:**
- `404`: Record not found

**Authentication:** Not required (public endpoint)

**User Stories:** US-014

---

#### Update Record

**PUT** `/api/records/{id}/` or **PATCH** `/api/records/{id}/`

Updates a record. Only the collection owner can update, and only if the collection is not closed.

**Request:** JSON body with `data` (and other allowed scalar fields) when not replacing the image; **multipart/form-data** with `data` as a JSON string plus optional `representative_image` file when uploading or replacing the thumbnail.

**Response:** `200 OK` — **Record resource shape (locked)**.

```json
{
  "id": 1,
  "collection": 1,
  "collection_name": "My Art Collection",
  "collection_owner_username": "johndoe",
  "representative_image": "http://localhost:8000/media/records/image1_updated.jpg",
  "data": {
    "identification_details": null,
    "aquisition_details": null,
    "rights": null,
    "history": null,
    "description": null,
    "access": null,
    "object_location": null,
    "confidentiality": null
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T11:00:00Z"
}
```

**Errors:**
- `400`: Invalid data or file
- `401`: Authentication required
- `403`: Not the collection owner or collection is closed
- `404`: Record not found

**Authentication:** Required (owner only)

**User Stories:** US-011, US-015

---

#### Delete Record

**DELETE** `/api/records/{id}/`

Permanently deletes a record and its stored **representative_image** file (if any). Only the collection owner can delete, and only if the collection is not closed.

**Response:** `204 No Content`

**Errors:**
- `401`: Authentication required
- `403`: Not the collection owner or collection is closed
- `404`: Record not found

**Authentication:** Required (owner only)

**User Stories:** US-012

---

## Image Upload Specifications

### Supported Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)

### File Size Limits

- Maximum file size: 10MB
- Recommended: < 5MB for optimal performance

### Image Storage

- **Development**: Local filesystem (`MEDIA_ROOT`)
- **Production**: Configured storage backend (local or cloud)

### Image URLs

- **Representative** (list/detail) images are served under `http://localhost:8000/media/records/{filename}` and exposed as the `representative_image` absolute URL on each record resource.
- Nested domain image references (see `Image` in [docs/data/common-models.md](data/common-models.md)) serialize as absolute URL strings inside `data` when present.
- Images are publicly accessible (no authentication required for viewing)

### Image Validation

- File type validation (MIME type and extension)
- File size validation
- Image dimension validation (optional)
- Malicious file scanning (recommended for production)

## Error Handling

### Standard Error Response Format

```json
{
  "error": "Error type",
  "detail": "Detailed error message",
  "field_errors": {
    "field_name": ["Field-specific error message"]
  }
}
```

### Common Error Scenarios

1. **Validation Errors** (`400 Bad Request`):
   - Missing required fields
   - Invalid field values
   - File validation failures

2. **Authentication Errors** (`401 Unauthorized`):
   - Missing or invalid session
   - Expired session

3. **Permission Errors** (`403 Forbidden`):
   - Not the collection owner
   - Attempting to modify closed collection
   - Anonymous user attempting protected action

4. **Not Found Errors** (`404 Not Found`):
   - Collection or record doesn't exist
   - Invalid ID

## Pagination

All list endpoints support pagination using page-based pagination.

### Pagination Parameters

- `page`: Page number (1-indexed, default: 1)
- `page_size`: Items per page (default: 20, max: 100)

### Pagination Response

```json
{
  "count": 100,
  "next": "http://localhost:8000/api/collections/?page=2",
  "previous": null,
  "results": [ ... ]
}
```

## CORS Configuration

For development, CORS is configured to allow requests from the frontend (typically `http://localhost:5173` for Vite).

## Rate Limiting

Rate limiting may be implemented in production to prevent abuse. Current specification does not include rate limits for initial version.

## Versioning

API versioning strategy: Initial version does not include version prefix. Future versions may use `/api/v1/`, `/api/v2/`, etc.

## References

- **User Stories**: See `docs/user-stories/`
- **Design Documentation**: See `docs/design/`
- **Django model mapping**: See `docs/data/models.md`
- **Record domain schema**: See `docs/data/record-models.md` and linked files under `docs/data/`
- **High-level data overview**: See `docs/data-models.md`
