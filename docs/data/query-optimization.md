# Query Optimization Plan

This document outlines the query optimization strategy for the Ekho application, including index strategy, query patterns analysis, and performance considerations.

## Index Strategy

### Current Indexes

#### Collection Model

1. **Index on `owner`**:
   - **Purpose**: Efficient filtering by collection owner
   - **Query Pattern**: `Collection.objects.filter(owner=user)`
   - **Impact**: High - frequently queried

2. **Index on `is_closed`**:
   - **Purpose**: Efficient filtering by closed status
   - **Query Pattern**: `Collection.objects.filter(is_closed=False)`
   - **Impact**: Medium - used for filtering open collections

#### Record Model

1. **Index on `collection`**:
   - **Purpose**: Efficient filtering by collection
   - **Query Pattern**: `Record.objects.filter(collection=collection)`
   - **Impact**: High - frequently queried

### Recommended Additional Indexes

#### Composite Indexes

1. **Collection: `(owner, is_closed)`**:
   - **Purpose**: Optimize queries filtering by owner and closed status
   - **Query Pattern**: `Collection.objects.filter(owner=user, is_closed=False)`
   - **Impact**: Medium - common query pattern
   - **Trade-off**: Slightly slower writes, faster reads

2. **Record: `(collection, created_at)`**:
   - **Purpose**: Optimize ordered queries of records in collection
   - **Query Pattern**: `Record.objects.filter(collection=collection).order_by('-created_at')`
   - **Impact**: Medium - used for paginated record lists
   - **Trade-off**: Slightly slower writes, faster ordered reads

### Index Implementation

Indexes are created via Django migrations:

```python
class Meta:
    indexes = [
        models.Index(fields=['owner']),
        models.Index(fields=['is_closed']),
        models.Index(fields=['owner', 'is_closed']),  # Composite
    ]
```

## Query Patterns Analysis

### High-Frequency Queries

#### 1. List Collections by Owner

**Query**:
```python
Collection.objects.filter(owner=user)
```

**Optimization**:
- Index on `owner` (already implemented)
- Consider pagination for users with many collections

**Performance**: Good with index

#### 2. List Records in Collection

**Query**:
```python
Record.objects.filter(collection=collection).order_by('-created_at')
```

**Optimization**:
- Index on `collection` (already implemented)
- Composite index on `(collection, created_at)` (recommended)
- Use pagination

**Performance**: Good with indexes, excellent with composite index

#### 3. Get Collection with Owner Info

**Query**:
```python
Collection.objects.select_related('owner').get(id=collection_id)
```

**Optimization**:
- Use `select_related()` to avoid N+1 queries
- Single database query instead of multiple

**Performance**: Excellent with `select_related()`

#### 4. List Collections with Record Counts

**Query**:
```python
collections = Collection.objects.all()
for collection in collections:
    count = collection.record_set.count()  # N+1 problem!
```

**Optimization**:
```python
from django.db.models import Count
Collection.objects.annotate(record_count=Count('record'))
```

**Performance**: Single query with annotation vs N+1 queries

#### 5. List Records with Collection Info

**Query**:
```python
Record.objects.select_related('collection').filter(collection=collection)
```

**Optimization**:
- Use `select_related()` for foreign key
- Avoids multiple queries for collection data

**Performance**: Excellent with `select_related()`

### Medium-Frequency Queries

#### 1. List Open Collections

**Query**:
```python
Collection.objects.filter(is_closed=False)
```

**Optimization**:
- Index on `is_closed` (already implemented)

**Performance**: Good with index

#### 2. Search Records by Title/Artist

**Query**:
```python
Record.objects.filter(title__icontains=search_term)
```

**Optimization**:
- Full-text search index (future consideration)
- For now, use database LIKE queries (may be slow on large datasets)

**Performance**: Acceptable for small datasets, may need optimization for large datasets

## Performance Considerations

### Database Query Optimization

#### Use `select_related()` for Foreign Keys

**Bad**:
```python
records = Record.objects.all()
for record in records:
    print(record.collection.name)  # N+1 queries
```

**Good**:
```python
records = Record.objects.select_related('collection').all()
for record in records:
    print(record.collection.name)  # Single query
```

#### Use `prefetch_related()` for Reverse Foreign Keys

**Bad**:
```python
collections = Collection.objects.all()
for collection in collections:
    print(collection.record_set.count())  # N+1 queries
```

**Good**:
```python
collections = Collection.objects.prefetch_related('record_set').all()
for collection in collections:
    print(len(collection.record_set.all()))  # Two queries total
```

#### Use `annotate()` for Aggregations

**Bad**:
```python
collections = Collection.objects.all()
for collection in collections:
    count = collection.record_set.count()  # N+1 queries
```

**Good**:
```python
from django.db.models import Count
collections = Collection.objects.annotate(record_count=Count('record'))
for collection in collections:
    print(collection.record_count)  # Single query
```

### Pagination

Always paginate list endpoints to avoid loading large datasets:

```python
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
```

### Query Optimization Checklist

- [ ] Use indexes on frequently queried fields
- [ ] Use `select_related()` for foreign keys
- [ ] Use `prefetch_related()` for reverse foreign keys
- [ ] Use `annotate()` for aggregations
- [ ] Paginate large result sets
- [ ] Use `only()` or `defer()` to limit fields
- [ ] Avoid N+1 query problems
- [ ] Monitor query performance

## Monitoring and Profiling

### Django Debug Toolbar (Development)

- Install `django-debug-toolbar` for development
- Monitor query count and execution time
- Identify N+1 query problems

### Query Logging (Production)

- Enable Django query logging in production (with caution)
- Monitor slow queries
- Set up alerts for query performance issues

### Database Query Analysis

- Use `EXPLAIN` or `EXPLAIN ANALYZE` for SQL queries
- Identify missing indexes
- Optimize slow queries

## Future Optimization Considerations

### Denormalization

Consider adding cached fields:
- `record_count` on Collection (cached count of records)
- Update via signals or periodic tasks

### Full-Text Search

For search functionality:
- Consider PostgreSQL full-text search
- Or use search engine (Elasticsearch, Solr) for large datasets

### Caching

- Cache frequently accessed data (Redis, Memcached)
- Cache collection lists, record lists
- Invalidate cache on updates

### Database Scaling

- Consider read replicas for read-heavy workloads
- Partition large tables if needed
- Consider database sharding for very large datasets

## Performance Targets

### Query Performance Goals

- **List Collections**: < 100ms for 100 collections
- **List Records**: < 200ms for 100 records
- **Get Collection**: < 50ms
- **Get Record**: < 50ms
- **Create/Update**: < 200ms

### Database Performance

- **Index Usage**: > 90% of queries should use indexes
- **Query Count**: Minimize queries per request (avoid N+1)
- **Response Time**: < 500ms for typical API requests

## References

- **Database Schema**: See `docs/data/schema-design.md`
- **Data Models**: See `docs/data/models.md`
- **Django Query Optimization**: https://docs.djangoproject.com/en/4.2/topics/db/optimization/
- **Django Debug Toolbar**: https://django-debug-toolbar.readthedocs.io/
