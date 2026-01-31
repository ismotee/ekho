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

Represents an art record (artwork) within a collection. Records contain artwork information and optional image.

### Model Definition

```python
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class Record(models.Model):
    title = models.CharField(max_length=200)
    artist = models.CharField(max_length=200)
    year = models.IntegerField(
        null=True,
        blank=True,
        validators=[
            MinValueValidator(1000),
            MaxValueValidator(2100)
        ]
    )
    medium = models.CharField(max_length=100, blank=True)
    dimensions = models.CharField(max_length=100, blank=True)
    description = models.TextField(max_length=2000, blank=True)
    condition = models.CharField(max_length=200, blank=True)
    image = models.ImageField(
        upload_to='records/',
        blank=True,
        null=True,
        max_length=255
    )
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['collection']),
        ]
    
    def __str__(self):
        return f"{self.title} by {self.artist}"
```

### Fields

| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| `id` | AutoField | Auto | - | Primary key |
| `title` | CharField | Yes | 200 | Artwork title |
| `artist` | CharField | Yes | 200 | Artist name |
| `year` | IntegerField | No | - | Creation year (1000-2100) |
| `medium` | CharField | No | 100 | Art medium |
| `dimensions` | CharField | No | 100 | Dimensions |
| `description` | TextField | No | 2000 | Description |
| `condition` | CharField | No | 200 | Condition |
| `image` | ImageField | No | 255 | Image file path |
| `collection` | ForeignKey | Yes | - | Parent collection |
| `created_at` | DateTimeField | Auto | - | Creation timestamp |
| `updated_at` | DateTimeField | Auto | - | Update timestamp |

### Relationships

- **Collection**: Many-to-one relationship
  - One collection can have many records
  - If collection is deleted, records are deleted (CASCADE)

- **Owner (via Collection)**: Indirect relationship
  - Records belong to collection owner
  - Access via `record.collection.owner`

### Indexes

- Index on `collection` for efficient filtering by collection

### Image Field

- **Upload Path**: `records/` directory within media root
- **File Types**: JPEG, PNG, GIF (validated in serializer)
- **Max Size**: 10MB (validated in serializer)
- **Storage**: Local filesystem (development), configurable (production)

### Business Rules

1. Only the collection owner can create, edit, or delete records
2. Records in closed collections cannot be modified
3. Records can be viewed by anyone
4. Image upload is optional
5. When record is deleted, image file should also be deleted

### Validation

- `title`: Required, non-empty, max 200 characters
- `artist`: Required, non-empty, max 200 characters
- `year`: Optional, if provided must be integer between 1000-2100
- `medium`: Optional, max 100 characters if provided
- `dimensions`: Optional, max 100 characters if provided
- `description`: Optional, max 2000 characters if provided
- `condition`: Optional, max 200 characters if provided
- `image`: Optional, if provided must be valid image file (JPEG, PNG, GIF), max 10MB

### Methods

- `__str__()`: Returns "Title by Artist" for display

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

- `__str__()`: Returns "Title by Artist"

### Future Considerations

- Add `record_count` property to Collection (cached count)
- Add `has_image` property to Record
- Add `image_url` property to Record

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
