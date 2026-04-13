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

## Catalog visibility (`is_listed`)

Collections may be **listed** (default) or **unlisted**. Unlisted collections are hidden from the public catalog and from other users; only the owner can list, retrieve, or export their contents through the rules below. The `is_listed` flag is stored on the server and is **not** part of the default collection or record JSON responses (behavior is visible through which resources appear and which return `404`).

**Collections**

- **Anonymous** `GET /api/collections/`: only collections with `is_listed=true`.
- **Authenticated** `GET /api/collections/`: listed collections from all users, plus **your own** listed and unlisted collections (other users’ unlisted collections are omitted).
- **Retrieve** `GET /api/collections/{id}/`: if the collection is unlisted and the caller is not the owner, the API responds with **`404 Not Found`** (same pattern as a missing id).

**Records**

- **List** `GET /api/records/` and **retrieve** `GET /api/records/{id}/`: only records belonging to a collection the caller is allowed to see (listed collections, or any collection you own). Unlisted collections owned by someone else do not surface their records.
- If `collection={id}` is provided and that collection is not visible to the caller, the API responds with **`404 Not Found`** (treats the collection as not found for that user).

## System identity (export provenance)

Each deployment persists a single **Ekho instance id** (UUID) used for cross-system provenance. It appears in record exports as `source_ekho_instance_id`. Collections may store `origin_ekho_instance_id` for lineage; that field is not included in normal collection list/detail responses.

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

**Visibility:** Results respect [Catalog visibility](#catalog-visibility-is_listed) (`is_listed`). For example, when filtering with `owner`, another user’s unlisted collections do not appear.

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
- `404`: Collection not found, or the collection exists but is **unlisted** and the caller is not the owner ([Catalog visibility](#catalog-visibility-is_listed)).

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
| `representative_image` | string or `null` | **Optional.** Absolute URL of the list/detail thumbnail image; not part of the `data` graph. See **Representative image resolution** below. |
| `images` | array | Read-only. Ordered list of [record-attached images](#record-attached-images-sub-resources) (`RecordImage` rows): file URL, `role`, `context`, autofill metadata (dimensions, checksum, MIME, …), and optional `labels` JSON. Empty when no images are stored. |
| `collection_name` | string | Read-only; list responses |
| `collection_owner_username` | string | Read-only; list responses |

**Wrapper key name:** `data` (locked). **Presentation image field name:** `representative_image` (locked).

#### Representative image resolution

- If the record still has a legacy **`representative_image`** file on the server (multipart create/update), that file’s absolute URL is returned.
- Otherwise the URL is taken from the first **`images`** row with `role` **`thumbnail`** and `context` **`portfolio`**, then the first row with `role` **`thumbnail`** only.
- **One-time migration:** existing legacy thumbnails were copied into **`images`** as `role=thumbnail`, `context=portfolio`, `is_primary=true`, and the legacy file field was cleared so each file is owned by a single `RecordImage` row. Clients can keep using **`representative_image`** in responses; new uploads should prefer the **`images`** sub-endpoints.

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

**Visibility:** Only records in collections visible to the caller are returned ([Catalog visibility](#catalog-visibility-is_listed)). Unlisted collections owned by other users do not contribute rows.

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
- `404`: When `collection` is provided and the collection does not exist **or** is not visible to the caller (e.g. another user’s unlisted collection).

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
- `404`: Record not found, or the record’s collection is not visible to the caller ([Catalog visibility](#catalog-visibility-is_listed)).

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

Permanently deletes a record and **all** stored **`images`** files plus any legacy **representative_image** file. Only the collection owner can delete, and only if the collection is not closed.

**Response:** `204 No Content`

**Errors:**
- `401`: Authentication required
- `403`: Not the collection owner or collection is closed
- `404`: Record not found

**Authentication:** Required (owner only)

**User Stories:** US-012

---

#### Record-attached images (sub-resources)

**List / create:** **GET** or **POST** `/api/records/{record_id}/images/`

**Detail / update / delete:** **GET**, **PUT**, **PATCH**, or **DELETE** `/api/records/{record_id}/images/{image_id}/`

**Visibility:** **GET** follows the same rules as [Retrieve Record](#retrieve-record) (parent record must be visible). **POST**, **PUT**, **PATCH**, and **DELETE** require an authenticated **collection owner** and the collection must **not** be [closed](#record-endpoints).

**POST** accepts **multipart/form-data** with:

| Field | Required | Description |
|-------|----------|-------------|
| `image` | Yes | Binary upload. Same allowlist as `representative_image`: **JPEG**, **PNG**, **GIF**; max **10MB**. |
| `role` | Yes | Closed enum — see [Record image `role` and `context`](#record-image-role-and-context-closed-vocabularies). |
| `context` | Yes | Closed enum — same section. |
| `sort_order` | No | Integer; default `0`. |
| `is_primary` | No | Boolean; default `false`. If `true`, other images on the same record are set to non-primary. |
| `status` | No | `draft`, `approved`, or `suppressed`; default `draft`. |
| `labels` | No | JSON object (or JSON string in multipart) for optional captions, credits, etc. |

**PATCH** / **PUT** may omit `image`; when a new `image` is sent, autofill fields are recomputed. Writable scalar fields: `role`, `context`, `sort_order`, `is_primary`, `status`, `labels`.

Each **GET** response item includes: `id`, `url` (absolute media URL), `role`, `context`, `byte_size`, `width`, `height`, `format` (ImageMagick-style tag, e.g. `JPEG`), `mime_type`, `checksum_sha256`, `sort_order`, `is_primary`, `status`, `derived_from` (`null` or `{ "id": <int> }` for future derivatives), `labels`, `created_at`, `updated_at`. The upload field `image` is write-only and omitted from responses.

---

#### Export record (JSON download)

**GET** `/api/records/{id}/export/`

Returns a JSON document suitable for **Import record** (below) on this or another Ekho instance.

**Response:** `200 OK` — `application/json` with `Content-Disposition: attachment; filename="ekho-record-{id}.json"`.

**Payload shape:** current exports use **`ekho_export_version` `2`**. Servers still accept **`1`** for import (same `record` fields as before; no `record.images`).

| Key | Description |
|-----|-------------|
| `ekho_export_version` | Integer; **`2`** for new exports from this API version. |
| `source_ekho_instance_id` | UUID string for this deployment ([System identity](#system-identity-export-provenance)). |
| `collection` | Object: `stable_id`, `name`, `description`, `responsible_department`, `owning_organization` (`null` or `{ "id": <int> }`), `origin_ekho_instance_id` (nullable UUID string), `is_closed`, `is_listed`, `original_creator` (`{ "username" }`). |
| `record` | Object: `data` (validated domain payload). Optional `representative_image`: `{ "filename", "content_type", "base64" }` when a representative file exists. **`images`** (v2): array of attachment blocks (may be empty). |

**`record.images` items (version 2):** each element includes `role`, `context`, `sort_order`, `is_primary`, `status`, `labels` (object), `derived_from_index` (`null` or zero-based index into this same array for derivative lineage), and `image`: `{ "filename", "content_type", "base64" }`. Omitted or empty when there are no record-attached images.

**Authorization:** Same visibility as record retrieve — listed collections are world-readable; **unlisted** collections allow export only to the **owner** (others receive `404`).

**Errors:**
- `404`: Record not found or not visible.
- `500`: Invalid stored record data (should not occur for normal rows).

---

#### Import record (JSON)

**POST** `/api/records/import/`

**Authentication:** Required. The active user must own `current_collection` when that parameter is required (see modes).

**Request body (JSON):**

| Field | Required | Description |
|-------|----------|-------------|
| `ekho_export_version` | Yes | **`1`** or **`2`**. Version `2` may include `record.images` as in [Export record](#export-record-json-download). |
| `source_ekho_instance_id` | Ignored for validation | Echoed from exports; informational. |
| `collection` | Yes | Must include `stable_id` (UUID) and other fields as in an export. |
| `record` | Yes | Must include `data` (domain object). Optional `representative_image` and, for v2, optional `record.images` array. |
| `mode` | Yes | `acquisition`, `deposition`, or `original_only`. |
| `current_collection_id` | For `acquisition` and `deposition` | Integer PK of the collection page context; must exist, be owned by the user, and **not** be closed. |

**Modes:**

- **`acquisition`:** Creates **one** record in `current_collection_id` only (does not create a parallel row in the “original” collection).
- **`deposition`:** Resolves or creates the “original” collection by `collection.stable_id` (new originals are **unlisted**), then creates a record there **and** a duplicate in `current_collection_id`.
- **`original_only`:** Creates the record only in the resolved original collection (no row in `current_collection_id`).

Imported `data` is validated; embedded actor references that do not resolve for the importing user are **stripped** so import can succeed without those catalog rows.

On each created record, the server sets `imported_first` and `imported_last` (not exposed on default record API responses).

**Response:** `201 Created` — `{ "record_ids": [<int>, ...], "mode": "<mode>" }`.

**Errors:**
- `400`: Invalid payload, unsupported `ekho_export_version`, invalid image block, closed collection in export metadata when creating a new original, etc.
- `401`: Not authenticated.
- `403`: Not allowed to import into the target collection, closed collection, conflicting `stable_id` owned by another user, or similar.

---

## Image Upload Specifications

### Record image `role` and `context` (closed vocabularies)

Record-level image metadata (the read-only **`images`** array on the record resource and the [Record-attached images](#record-attached-images-sub-resources) sub-endpoints) uses two required **closed string enums** on each image: **`role`** and **`context`**. Allowed wire values are **snake_case** strings exactly as listed below. The server treats any other value as invalid input once validation is enforced; extend the list in **docs**, **backend**, and **frontend** together.

**`role`** — one of: `thumbnail`, `preview`, `preservation_master`, `access_derivative`, `derivative`, `print`, `detail`, `document_scan`.

**`context`** — one of: `portfolio`, `exhibit`, `archive`, `documentation`, `condition`, `publication`, `digitalization`.

Semantics and usage rules: [docs/data/common-models.md](data/common-models.md) (section *Record-attached images: closed `role` and `context`*). Canonical lists in code: `backend/api/record_image_vocab.py`, `frontend/src/types/record/imageVocabulary.ts`.

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

- **Representative** (list/detail) thumbnails use the same media path pattern (`http://localhost:8000/media/records/{filename}`) and are exposed as the **`representative_image`** absolute URL on each record resource, with [resolution rules](#representative-image-resolution) when thumbnails live only under **`images`**.
- **`images`:** each item includes an absolute **`url`** for that row’s file (same `media/records/` layout).
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
