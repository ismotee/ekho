# Data Models Documentation

This document specifies the data models for the Ekho Art Collection Management Application, including Django models, field specifications, relationships, and constraints.

## Overview

The application uses three main models: User (Django built-in), Collection, and Record. Collections belong to users (owners), and Records belong to Collections.

## Model Relationships

```
User (Django User)
  │
  └─── Collection (one-to-many)
         │
         └─── Record (one-to-many)
```

## User Model

### Specification

The application uses Django's built-in `User` model from `django.contrib.auth.models`. No custom user model is required for the initial version.

### Fields (Django User)

- `id`: Auto-incrementing primary key
- `username`: String, unique, required
- `email`: String, optional
- `password`: Hashed password, required
- `date_joined`: DateTime, auto-set on creation
- `is_active`: Boolean, default True
- `is_staff`: Boolean, default False
- `is_superuser`: Boolean, default False

### Usage

- Used for authentication (username/password)
- Referenced as owner in Collection model
- No custom fields required for initial version

### Validation

- Username: 3-30 characters, alphanumeric and underscore
- Password: Minimum 8 characters (enforced in registration)

## Collection Model

### Specification

Represents an art collection owned by a user. Collections can be open (editable) or closed (read-only).

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | AutoField | Primary Key | Auto-incrementing ID |
| `name` | CharField | max_length=200, required | Collection name |
| `description` | TextField | max_length=1000, optional | Collection description |
| `owner` | ForeignKey | to=User, on_delete=CASCADE, required | Collection owner |
| `is_closed` | BooleanField | default=False | Read-only flag |
| `created_at` | DateTimeField | auto_now_add=True | Creation timestamp |
| `updated_at` | DateTimeField | auto_now=True | Last update timestamp |

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

### Relationships

- **Owner (User)**: Many-to-one relationship. One user can own many collections.
- **Records**: One-to-many relationship. One collection can have many records.

### Constraints

- `name`: Required, max 200 characters
- `description`: Optional, max 1000 characters
- `owner`: Required, cannot be null
- `is_closed`: Default False, cannot be null

### Indexes

- Index on `owner` for efficient filtering by owner
- Index on `is_closed` for efficient filtering by closed status
- Composite index on `(owner, is_closed)` may be beneficial for queries filtering by both

### Business Rules

1. Only the owner can edit or close a collection
2. Closed collections cannot be edited (name, description)
3. Records in closed collections cannot be created, edited, or deleted
4. Collections can be viewed by anyone (authenticated or anonymous)
5. Closing a collection is a one-way operation (cannot be reopened in initial version)

### Validation

- `name`: Required, non-empty, max 200 characters
- `description`: Optional, max 1000 characters if provided

## Record Model

### Specification

Represents an art record (artwork) within a collection. Records contain artwork information and optional image.

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | AutoField | Primary Key | Auto-incrementing ID |
| `title` | CharField | max_length=200, required | Artwork title |
| `artist` | CharField | max_length=200, required | Artist name |
| `year` | IntegerField | null=True, blank=True, optional | Creation year |
| `medium` | CharField | max_length=100, blank=True, optional | Art medium |
| `dimensions` | CharField | max_length=100, blank=True, optional | Dimensions |
| `description` | TextField | max_length=2000, blank=True, optional | Description |
| `condition` | CharField | max_length=200, blank=True, optional | Condition |
| `image` | ImageField | upload_to='records/', blank=True, optional | Image file |
| `collection` | ForeignKey | to=Collection, on_delete=CASCADE, required | Parent collection |
| `created_at` | DateTimeField | auto_now_add=True | Creation timestamp |
| `updated_at` | DateTimeField | auto_now=True | Last update timestamp |

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
            MinValueValidator(1000),  # Reasonable minimum year
            MaxValueValidator(2100)   # Reasonable maximum year
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

### Relationships

- **Collection**: Many-to-one relationship. One collection can have many records.
- **Owner (via Collection)**: Indirect relationship. Records belong to collection owner.

### Constraints

- `title`: Required, max 200 characters
- `artist`: Required, max 200 characters
- `year`: Optional, integer, valid range (1000-2100)
- `medium`: Optional, max 100 characters
- `dimensions`: Optional, max 100 characters
- `description`: Optional, max 2000 characters
- `condition`: Optional, max 200 characters
- `image`: Optional, image file, max 10MB
- `collection`: Required, cannot be null

### Indexes

- Index on `collection` for efficient filtering by collection
- Composite index on `(collection, created_at)` may be beneficial for ordered queries

### Image Field Specifications

- **Upload Path**: `records/` directory within media root
- **File Types**: JPEG, PNG, GIF
- **Max Size**: 10MB (enforced in validation)
- **Storage**: Local filesystem (development), configurable (production)
- **URL**: Served at `/media/records/{filename}`

### Business Rules

1. Only the collection owner can create, edit, or delete records
2. Records in closed collections cannot be created, edited, or deleted
3. Records can be viewed by anyone (authenticated or anonymous)
4. Image upload is optional
5. When a record is deleted, its image file should also be deleted

### Validation

- `title`: Required, non-empty, max 200 characters
- `artist`: Required, non-empty, max 200 characters
- `year`: Optional, if provided must be integer between 1000-2100
- `medium`: Optional, max 100 characters if provided
- `dimensions`: Optional, max 100 characters if provided
- `description`: Optional, max 2000 characters if provided
- `condition`: Optional, max 200 characters if provided
- `image`: Optional, if provided must be valid image file (JPEG, PNG, GIF), max 10MB

## Database Schema

### Entity-Relationship Diagram

```
┌─────────────┐
│    User     │
│─────────────│
│ id (PK)     │
│ username    │
│ password    │
│ ...         │
└──────┬──────┘
       │
       │ 1:N
       │
┌──────▼──────────┐
│   Collection    │
│────────────────│
│ id (PK)        │
│ name           │
│ description    │
│ owner (FK)     │──┐
│ is_closed      │  │
│ created_at     │  │
│ updated_at     │  │
└──────┬─────────┘  │
       │            │
       │ 1:N        │
       │            │
┌──────▼──────────┐  │
│     Record     │  │
│────────────────│  │
│ id (PK)        │  │
│ title          │  │
│ artist         │  │
│ year           │  │
│ medium         │  │
│ dimensions     │  │
│ description    │  │
│ condition      │  │
│ image          │  │
│ collection(FK) │──┘
│ created_at    │
│ updated_at    │
└────────────────┘
```

### Foreign Key Relationships

1. **Collection.owner** → **User.id**
   - `on_delete=CASCADE`: If user is deleted, their collections are deleted
   - Indexed for performance

2. **Record.collection** → **Collection.id**
   - `on_delete=CASCADE`: If collection is deleted, its records are deleted
   - Indexed for performance

### Database Constraints

- **Primary Keys**: All models have auto-incrementing integer primary keys
- **Foreign Keys**: Enforced at database level with CASCADE delete
- **Unique Constraints**: Username is unique (Django User model)
- **Check Constraints**: Year validation (1000-2100) enforced in model validators
- **Not Null Constraints**: Required fields are NOT NULL

## Migration Strategy

### Initial Migration

1. Create User table (Django built-in, already exists)
2. Create Collection table with indexes
3. Create Record table with indexes
4. Set up foreign key relationships

### Future Migrations

- Add indexes for performance optimization
- Add fields if requirements change
- Modify constraints as needed

## Query Patterns

### Common Queries

1. **List collections by owner**:
   ```python
   Collection.objects.filter(owner=user)
   ```

2. **List records in collection**:
   ```python
   Record.objects.filter(collection=collection)
   ```

3. **List open collections**:
   ```python
   Collection.objects.filter(is_closed=False)
   ```

4. **List records with images**:
   ```python
   Record.objects.exclude(image='')
   ```

### Performance Considerations

- Use `select_related()` for foreign key relationships
- Use `prefetch_related()` for reverse foreign key relationships
- Index frequently queried fields (owner, collection, is_closed)
- Paginate large result sets

## Data Integrity

### Referential Integrity

- Foreign keys enforce referential integrity
- CASCADE delete ensures no orphaned records
- Database-level constraints prevent invalid data

### Data Validation

- Model-level validation in Django models
- Serializer-level validation in DRF
- Field-level validation using validators

## References

- **User Stories**: See `docs/user-stories/`
- **API Specification**: See `docs/api-specification.md`
- **Database Schema Design**: See `docs/data/schema-design.md`
