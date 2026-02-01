# ADR-003: Permission Model

## Status

Accepted

## Context

The application needs to control access to collections and records. We need to decide between using Django's built-in permission system and implementing custom permissions.

## Decision

We will use **custom Django REST Framework permission classes** for fine-grained access control, while leveraging Django's authentication system.

## Rationale

### Custom Permission Classes

1. **Fine-Grained Control**: We need owner-based permissions (only collection owners can edit)
2. **Business Logic**: We need to check collection `is_closed` status for record operations
3. **Read-Only for Anonymous**: Anonymous users can view but not modify
4. **Simpler Than Django Permissions**: Django's permission system is designed for admin interfaces, not API endpoints
5. **DRF Integration**: DRF permission classes integrate seamlessly with ViewSets

### Permission Classes Structure

```python
# IsOwnerOrReadOnly: Collection owners can edit, others can only read
# IsCollectionOwner: Only collection owner can perform action
# IsCollectionNotClosed: Collection must not be closed
```

### Why Not Django Permissions

1. **Overhead**: Django permissions require creating permission objects for each resource
2. **Complexity**: More complex to implement owner-based permissions
3. **Not API-Focused**: Designed for admin interfaces, not REST APIs
4. **Unnecessary**: We don't need the full Django permission system for our use case

## Consequences

### Positive

- Simple and clear permission logic
- Easy to understand and maintain
- Directly integrated with DRF ViewSets
- Flexible for future requirements

### Negative

- Custom code to maintain
- Need to ensure permission classes are applied consistently
- May need to refactor if requirements become more complex

### Implementation

Permission classes will be:
- `IsAuthenticatedOrReadOnly`: Allow read access to all, write access to authenticated users
- `IsOwnerOrReadOnly`: Allow read access to all, write access to owner only
- `IsCollectionOwner`: Only collection owner can access
- `IsCollectionNotClosed`: Collection must not be closed (combined with owner check)

### Example Usage

```python
class CollectionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    
class RecordViewSet(viewsets.ModelViewSet):
    permission_classes = [IsCollectionOwner, IsCollectionNotClosed]
```

## References

- Django REST Framework Permissions: https://www.django-rest-framework.org/api-guide/permissions/
- Custom Permissions: https://www.django-rest-framework.org/api-guide/permissions/#custom-permissions
