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

### Collection Endpoints

#### List Collections

**GET** `/api/collections/`

Returns a paginated list of all collections. Accessible to both authenticated and anonymous users.

**Query Parameters:**
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)
- `owner`: Filter by owner username (optional)
- `is_closed`: Filter by closed status (true/false, optional)

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

#### List Records

**GET** `/api/records/`

Returns a paginated list of records. Must filter by collection.

**Query Parameters:**
- `collection`: Collection ID (required)
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)

**Response:** `200 OK`
```json
{
  "count": 25,
  "next": "http://localhost:8000/api/records/?collection=1&page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Sunset Over Mountains",
      "artist": "Jane Smith",
      "year": 2023,
      "medium": "Oil on Canvas",
      "dimensions": "24x36 inches",
      "description": "A beautiful landscape painting",
      "condition": "Excellent",
      "image": "http://localhost:8000/media/records/image1.jpg",
      "collection": 1,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Errors:**
- `400`: Collection parameter missing or invalid

**Authentication:** Not required (public endpoint)

**User Stories:** US-013

---

#### Create Record

**POST** `/api/records/`

Creates a new art record in a collection. Only the collection owner can create records, and only if the collection is not closed.

**Request Body (multipart/form-data):**
```
title: "Sunset Over Mountains"
artist: "Jane Smith"
year: 2023
medium: "Oil on Canvas"
dimensions: "24x36 inches"
description: "A beautiful landscape painting"
condition: "Excellent"
collection: 1
image: [file]
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "title": "Sunset Over Mountains",
  "artist": "Jane Smith",
  "year": 2023,
  "medium": "Oil on Canvas",
  "dimensions": "24x36 inches",
  "description": "A beautiful landscape painting",
  "condition": "Excellent",
  "image": "http://localhost:8000/media/records/image1.jpg",
  "collection": 1,
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
```json
{
  "id": 1,
  "title": "Sunset Over Mountains",
  "artist": "Jane Smith",
  "year": 2023,
  "medium": "Oil on Canvas",
  "dimensions": "24x36 inches",
  "description": "A beautiful landscape painting",
  "condition": "Excellent",
  "image": "http://localhost:8000/media/records/image1.jpg",
  "collection": 1,
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

Updates record information. Only the collection owner can update, and only if the collection is not closed.

**Request Body (PATCH, multipart/form-data):**
```
title: "Updated Title"
artist: "Jane Smith"
year: 2023
image: [file] (optional, to replace existing image)
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "title": "Updated Title",
  "artist": "Jane Smith",
  "year": 2023,
  "medium": "Oil on Canvas",
  "dimensions": "24x36 inches",
  "description": "A beautiful landscape painting",
  "condition": "Excellent",
  "image": "http://localhost:8000/media/records/image1_updated.jpg",
  "collection": 1,
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

Permanently deletes a record and its associated image file. Only the collection owner can delete, and only if the collection is not closed.

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

- Images are served at: `http://localhost:8000/media/records/{filename}`
- URLs are included in record responses
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
- **Data Models**: See `docs/data-models.md`
