"""
Custom permission classes for Ekho API

Reference: docs/api-specification.md, docs/architecture/adr/003-permission-model.md
"""

from rest_framework import permissions
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.exceptions import AuthenticationFailed
from .models import Actor, Collection, Record


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    Read permissions are allowed to any request.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner
        if isinstance(obj, Collection):
            return obj.owner == request.user
        elif isinstance(obj, Record):
            return obj.collection.owner == request.user
        
        return False


class IsCollectionOwnerOrReadOnly(IsAuthenticatedOrReadOnly):
    """
    Permission for Collection operations.
    - Read: Anyone (authenticated or anonymous)
    - Write: Only collection owner (requires authentication)
    - Update/Close: Only owner and only if collection is not closed
    """
    
    def has_permission(self, request, view):
        # Allow read operations to anyone
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write operations require authentication
        if not request.user or not request.user.is_authenticated:
            raise AuthenticationFailed('Authentication required')
        
        return True
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions require authentication
        if not request.user or not request.user.is_authenticated:
            raise AuthenticationFailed('Authentication required')
        
        # Only owner can write
        if obj.owner != request.user:
            return False
        
        # Cannot update closed collections
        if request.method in ['PUT', 'PATCH'] and obj.is_closed:
            return False
        
        return True


class IsRecordOwnerOrReadOnly(IsAuthenticatedOrReadOnly):
    """
    Permission for Record operations.
    - Read: Anyone (authenticated or anonymous)
    - Write: Only collection owner (requires authentication)
    - Cannot write if collection is closed
    """
    
    def has_permission(self, request, view):
        # Allow read operations to anyone
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write operations require authentication
        if not request.user or not request.user.is_authenticated:
            raise AuthenticationFailed('Authentication required')
        
        return True
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions require authentication
        if not request.user or not request.user.is_authenticated:
            raise AuthenticationFailed('Authentication required')
        
        # Only collection owner can write
        if obj.collection.owner != request.user:
            return False
        
        # Cannot write if collection is closed
        if obj.collection.is_closed:
            return False
        
        return True


class IsActorEditorOrReadOnly(permissions.BasePermission):
    """
    Actor registry: anyone can read list/detail (filtered by queryset).
    Create: authenticated. Update/delete: owner only for user-owned rows;
    global rows (owner is null): read-only unless staff.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        return True

    def has_object_permission(self, request, view, obj):
        if not isinstance(obj, Actor):
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        if obj.owner_id is None:
            return bool(request.user.is_staff)
        return obj.owner_id == request.user.id
