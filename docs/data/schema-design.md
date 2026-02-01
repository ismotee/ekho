# Database Schema Design

This document describes the database schema design for the Ekho Art Collection Management Application.

## Database Overview

- **Database System**: SQLite (development), PostgreSQL (production-ready)
- **ORM**: Django ORM
- **Migrations**: Django migrations for schema management

## Entity-Relationship Diagram

```
┌─────────────────────────────────┐
│           User                  │
│  (Django Built-in)              │
├─────────────────────────────────┤
│ PK  id              INTEGER      │
│     username        VARCHAR(150) │
│     password        VARCHAR(128) │
│     email           VARCHAR(254)  │
│     date_joined     DATETIME     │
│     is_active       BOOLEAN      │
│     is_staff        BOOLEAN      │
│     is_superuser    BOOLEAN      │
└───────────┬─────────────────────┘
            │
            │ 1:N (owner)
            │
┌───────────▼─────────────────────┐
│        Collection                │
├─────────────────────────────────┤
│ PK  id              INTEGER      │
│ FK  owner_id        INTEGER      │──┐
│     name            VARCHAR(200)  │  │
│     description     TEXT         │  │
│     is_closed       BOOLEAN      │  │
│     created_at      DATETIME     │  │
│     updated_at      DATETIME     │  │
│                                   │  │
│ INDEX owner_id                   │  │
│ INDEX is_closed                  │  │
└───────────┬─────────────────────┘  │
            │                         │
            │ 1:N (collection)        │
            │                         │
┌───────────▼─────────────────────┐  │
│          Record                  │  │
├─────────────────────────────────┤  │
│ PK  id              INTEGER      │  │
│ FK  collection_id    INTEGER      │──┘
│     title           VARCHAR(200)  │
│     artist          VARCHAR(200)  │
│     year            INTEGER       │
│     medium          VARCHAR(100)  │
│     dimensions      VARCHAR(100)  │
│     description     TEXT         │
│     condition       VARCHAR(200)  │
│     image           VARCHAR(255)  │
│     created_at      DATETIME     │
│     updated_at      DATETIME     │
│                                   │
│ INDEX collection_id               │
└───────────────────────────────────┘
```

## Table Specifications

### User Table

**Source**: Django's built-in `auth_user` table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | User ID |
| `username` | VARCHAR(150) | UNIQUE, NOT NULL | Username |
| `password` | VARCHAR(128) | NOT NULL | Hashed password |
| `email` | VARCHAR(254) | NULL | Email address |
| `date_joined` | DATETIME | NOT NULL, DEFAULT NOW | Registration date |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Active status |
| `is_staff` | BOOLEAN | NOT NULL, DEFAULT FALSE | Staff status |
| `is_superuser` | BOOLEAN | NOT NULL, DEFAULT FALSE | Superuser status |

**Indexes**:
- Primary key on `id`
- Unique index on `username`

### Collection Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Collection ID |
| `owner_id` | INTEGER | FOREIGN KEY → User.id, NOT NULL, ON DELETE CASCADE | Collection owner |
| `name` | VARCHAR(200) | NOT NULL | Collection name |
| `description` | TEXT | NULL, MAX 1000 chars | Collection description |
| `is_closed` | BOOLEAN | NOT NULL, DEFAULT FALSE | Read-only flag |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW | Creation timestamp |
| `updated_at` | DATETIME | NOT NULL, DEFAULT NOW, ON UPDATE NOW | Update timestamp |

**Indexes**:
- Primary key on `id`
- Foreign key index on `owner_id`
- Index on `is_closed`
- Composite index on `(owner_id, is_closed)` (optional, for common queries)

**Foreign Keys**:
- `owner_id` → `auth_user.id` (CASCADE DELETE)

### Record Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Record ID |
| `collection_id` | INTEGER | FOREIGN KEY → Collection.id, NOT NULL, ON DELETE CASCADE | Parent collection |
| `title` | VARCHAR(200) | NOT NULL | Artwork title |
| `artist` | VARCHAR(200) | NOT NULL | Artist name |
| `year` | INTEGER | NULL, CHECK (year >= 1000 AND year <= 2100) | Creation year |
| `medium` | VARCHAR(100) | NULL | Art medium |
| `dimensions` | VARCHAR(100) | NULL | Dimensions |
| `description` | TEXT | NULL, MAX 2000 chars | Description |
| `condition` | VARCHAR(200) | NULL | Condition |
| `image` | VARCHAR(255) | NULL | Image file path |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW | Creation timestamp |
| `updated_at` | DATETIME | NOT NULL, DEFAULT NOW, ON UPDATE NOW | Update timestamp |

**Indexes**:
- Primary key on `id`
- Foreign key index on `collection_id`
- Composite index on `(collection_id, created_at)` (optional, for ordered queries)

**Foreign Keys**:
- `collection_id` → `collection.id` (CASCADE DELETE)

## Relationships

### User → Collection (One-to-Many)

- **Relationship**: One user can own many collections
- **Foreign Key**: `Collection.owner_id` → `User.id`
- **Cascade**: If user is deleted, all their collections are deleted
- **Access Pattern**: Frequently queried (list user's collections)

### Collection → Record (One-to-Many)

- **Relationship**: One collection can have many records
- **Foreign Key**: `Record.collection_id` → `Collection.id`
- **Cascade**: If collection is deleted, all its records are deleted
- **Access Pattern**: Frequently queried (list collection's records)

## Database Constraints

### Primary Keys

- All tables have auto-incrementing integer primary keys
- Primary keys are indexed automatically

### Foreign Keys

- Enforced at database level
- CASCADE DELETE ensures referential integrity
- Foreign key columns are indexed for performance

### Check Constraints

- `Record.year`: Must be between 1000 and 2100 (enforced in Django model validators)

### Not Null Constraints

- Required fields are NOT NULL
- Optional fields allow NULL values

### Unique Constraints

- `User.username`: Must be unique
- Other fields do not require uniqueness

## Index Strategy

### Existing Indexes

1. **Collection.owner_id**: For filtering collections by owner
2. **Collection.is_closed**: For filtering open/closed collections
3. **Record.collection_id**: For filtering records by collection

### Recommended Additional Indexes

1. **Composite Index on Collection (owner_id, is_closed)**:
   - For queries filtering by owner and closed status
   - Example: "Get all open collections for a user"

2. **Composite Index on Record (collection_id, created_at)**:
   - For ordered queries of records in a collection
   - Example: "Get records in collection, ordered by creation date"

### Index Maintenance

- Indexes are created automatically by Django migrations
- Monitor query performance and add indexes as needed
- Balance between query performance and write performance

## Data Types

### Text Fields

- **VARCHAR(n)**: For fixed-length strings (names, titles)
- **TEXT**: For variable-length strings (descriptions)
- **Max Lengths**: Enforced in Django models, validated in application

### Numeric Fields

- **INTEGER**: For IDs, years, counts
- **BOOLEAN**: For flags (is_closed, is_active)

### Date/Time Fields

- **DATETIME**: For timestamps (created_at, updated_at)
- **Auto-managed**: Django handles creation and update timestamps

### File Fields

- **VARCHAR(255)**: For file paths (image field)
- **Actual Files**: Stored in filesystem, path stored in database

## Migration Strategy

### Initial Migration

1. Create User table (Django built-in, may already exist)
2. Create Collection table with indexes
3. Create Record table with indexes
4. Set up foreign key relationships

### Future Migrations

- Add indexes for performance optimization
- Add fields if requirements change
- Modify constraints as needed
- Data migrations for data transformations

### Migration Best Practices

1. Always test migrations on development database first
2. Backup database before running migrations in production
3. Review migration SQL before applying
4. Test rollback procedures

## Database Normalization

### Normalization Level

The schema follows **Third Normal Form (3NF)**:

- **1NF**: All fields contain atomic values
- **2NF**: No partial dependencies (all non-key attributes depend on full primary key)
- **3NF**: No transitive dependencies (non-key attributes don't depend on other non-key attributes)

### Denormalization Considerations

- Current design is normalized
- No denormalization needed for initial version
- Future consideration: Add `record_count` to Collection table (cached count)

## Query Patterns

### Common Queries

1. **List collections by owner**:
   ```sql
   SELECT * FROM collection WHERE owner_id = ?
   ```

2. **List records in collection**:
   ```sql
   SELECT * FROM record WHERE collection_id = ? ORDER BY created_at DESC
   ```

3. **List open collections**:
   ```sql
   SELECT * FROM collection WHERE is_closed = FALSE
   ```

4. **Get collection with owner**:
   ```sql
   SELECT c.*, u.username 
   FROM collection c 
   JOIN auth_user u ON c.owner_id = u.id 
   WHERE c.id = ?
   ```

### Performance Considerations

- Use `select_related()` for foreign key relationships
- Use `prefetch_related()` for reverse foreign key relationships
- Paginate large result sets
- Use indexes for frequently queried fields

## References

- **Data Models**: See `docs/data-models.md`
- **API Specification**: See `docs/api-specification.md`
- **Django Models**: See `backend/api/models.py` (to be created)
