# Data Models Documentation

This document provides detailed documentation of the Django data models for the Ekho application. For database schema details, see `docs/data/schema-design.md`.

## Model Overview

The application uses three main models:
1. **User**: Django's built-in User model
2. **Collection**: Represents an art collection owned by a user
3. **Record**: Represents an art record (artwork) within a collection

## User Model

### Source

Django's built-in `User` model from `django.contrib.auth.models`.

### Usage

- Used for authentication (username/password)
- Referenced as owner in Collection model
- No custom fields required for initial version

### Key Fields

- `id`: Primary key
- `username`: Unique username for login
- `password`: Hashed password
- `email`: Optional email address
- `date_joined`: Registration timestamp

See Django documentation for complete field list.

## Collection Model

### Purpose

Represents an art collection owned by a user. Collections can be open (editable) or closed (read-only).

### Model Definition

```python
from django.db import models
from django.contrib.auth.models import User

class Collection(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(max_length=1000, blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    is_closed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner']),
            models.Index(fields=['is_closed']),
        ]
    
    def __str__(self):
        return self.name
```

### Fields

| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| `id` | AutoField | Auto | - | Primary key |
| `name` | CharField | Yes | 200 | Collection name |
| `description` | TextField | No | 1000 | Collection description |
| `owner` | ForeignKey | Yes | - | Collection owner (User) |
| `is_closed` | BooleanField | Yes | - | Read-only flag |
| `created_at` | DateTimeField | Auto | - | Creation timestamp |
| `updated_at` | DateTimeField | Auto | - | Update timestamp |

### Relationships

- **Owner (User)**: Many-to-one relationship
  - One user can own many collections
  - If user is deleted, collections are deleted (CASCADE)

- **Records**: One-to-many relationship (reverse)
  - One collection can have many records
  - Access via `collection.record_set` or `collection.records` (if related_name set)

### Indexes

- Index on `owner` for efficient filtering by owner
- Index on `is_closed` for efficient filtering by closed status

### Business Rules

1. Only the owner can edit or close a collection
2. Closed collections cannot be edited
3. Records in closed collections cannot be modified
4. Collections can be viewed by anyone
5. Closing is a one-way operation (initial version)

### Validation

- `name`: Required, non-empty, max 200 characters
- `description`: Optional, max 1000 characters if provided

### Methods

- `__str__()`: Returns collection name for display

## Record Model

### Purpose

Represents an art record within a collection. **Domain content** (identification, acquisition, rights, etc.) is **not** modeled as separate Django tables in v1; it lives in a single JSON payload. An optional **representative image** supports list and detail thumbnails without scanning nested JSON for a file.

### Canonical domain shape

The structure of `data` is defined in **[record-models.md](record-models.md)** and linked domain modules (`identification-models.md`, `aqcuisition-models.md`, etc.). The API exposes that payload under the key **`data`** on each record resource; see [API specification](../api-specification.md) (Record endpoints).

### Model definition (implementation)

```python
class Record(models.Model):
    data = models.JSONField(default=dict, blank=True)
    representative_image = models.ImageField(
        upload_to="records/",
        blank=True,
        null=True,
        max_length=255,
    )
    collection = models.ForeignKey(
        Collection, on_delete=models.CASCADE, related_name="records"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["collection"]),
        ]
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | AutoField | Auto | Primary key |
| `data` | JSONField | No (defaults `{}`) | Domain payload; top-level keys must match [record-models.md](record-models.md) when present (validated in API) |
| `representative_image` | ImageField | No | Optional thumbnail for list/detail; **not** part of the `data` graph |
| `collection` | ForeignKey | Yes | Parent collection (`related_name="records"`) |
| `created_at` | DateTimeField | Auto | Creation timestamp |
| `updated_at` | DateTimeField | Auto | Update timestamp |

### Storage notes

- **Normalization**: The full domain graph is intentionally **not** split into many relational tables for v1; migration and product cost outweigh benefit while the app is pre-production.
- **`representative_image`**: Presentation-only; document in UX/API as separate from nested `Image` / domain references inside `data`.
- **Search**: List filtering by `search` uses DB-appropriate queries over collection metadata and a text representation of `data` (implementation may evolve; PostgreSQL is the natural production target for richer JSON search).

### Relationships

- **Collection**: Many-to-one; CASCADE delete.
- **Owner**: Via `record.collection.owner`.

### Indexes

- Index on `collection` for filtering by collection.

### Representative image

- **Upload path**: `records/` under `MEDIA_ROOT`
- **Validation** (API): JPEG, PNG, GIF; max 10MB
- **Deletion**: Removing a record should remove the stored file when applicable

### Business rules

1. Only the collection owner can create, update, or delete records.
2. Records in closed collections cannot be modified.
3. Records are readable by anyone (same visibility rules as collections for list/detail).
4. `representative_image` is optional.

### Validation

- **`data`**: Must be a JSON object; only known top-level domain keys are allowed (see `record_validators.py`). Deeper structural validation may be tightened over time.
- **`representative_image`**: Optional; type and size enforced in the serializer.

### Methods

- **`__str__()`**: Uses `identification_details` when present (first `title[]` entry with `value`, else legacy single `title` object, else `object_number`), otherwise falls back to `Record {pk}`.

## Model Relationships Summary

```
User (1) ──< (N) Collection (1) ──< (N) Record
```

- One User can own many Collections
- One Collection can have many Records
- Records belong to Collections, Collections belong to Users

## Query Optimization

### Common Query Patterns

1. **Get user's collections**:
   ```python
   Collection.objects.filter(owner=user)
   ```

2. **Get collection's records**:
   ```python
   Record.objects.filter(collection=collection)
   ```

3. **Get collection with owner** (optimized):
   ```python
   Collection.objects.select_related('owner').get(id=collection_id)
   ```

4. **Get records with collection** (optimized):
   ```python
   Record.objects.select_related('collection').filter(collection=collection)
   ```

### Performance Tips

- Use `select_related()` for foreign key relationships
- Use `prefetch_related()` for reverse foreign key relationships
- Use `only()` or `defer()` to limit fields retrieved
- Use pagination for large result sets
- Index frequently queried fields

## Model Methods and Properties

### Collection Model

- `__str__()`: Returns collection name

### Record Model

- `__str__()`: Derives a short label from `data.identification_details` when possible

### Future Considerations

- Add `record_count` property to Collection (cached count)
- Richer JSON schema validation or normalized sub-models if the domain stabilizes

## Migration Notes

### Initial Migration

1. Create Collection model
2. Create Record model
3. Add indexes
4. Set up foreign key relationships

### Future Migrations

- Add indexes for performance
- Add fields if requirements change
- Modify constraints as needed

## References

- **Database Schema**: See `docs/data/schema-design.md`
- **API Specification**: See `docs/api-specification.md`
- **Django Models Documentation**: https://docs.djangoproject.com/en/4.2/topics/db/models/
