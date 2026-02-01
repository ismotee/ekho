"""
Django REST Framework views for Ekho API

Reference: docs/api-specification.md
"""

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError as DRFValidationError, PermissionDenied
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.db.models import Q
from django.core.exceptions import ValidationError as DjangoValidationError
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie

from .models import Collection, Record
from .serializers import UserSerializer, CollectionSerializer, RecordSerializer
from .permissions import IsCollectionOwnerOrReadOnly, IsRecordOwnerOrReadOnly


@api_view(['GET'])
def health_check(request):
    """
    Health check endpoint
    """
    return Response({
        'status': 'healthy',
        'message': 'Ekho backend is running'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@ensure_csrf_cookie
def csrf_token(request):
    """
    Get CSRF token for the frontend.
    This endpoint sets the CSRF cookie and returns the token.
    The cookie will be set automatically by @ensure_csrf_cookie decorator.
    """
    token = get_token(request)
    response = Response({
        'csrfToken': token
    }, status=status.HTTP_200_OK)
    # Ensure the cookie is set
    response.set_cookie('csrftoken', token, samesite='Lax', httponly=False)
    return response


# Authentication Views

@api_view(['POST'])
def register(request):
    """
    Register a new user and automatically log them in.
    
    POST /api/auth/register/
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    # Validation
    field_errors = {}
    
    if not username:
        field_errors['username'] = ['This field is required.']
    elif len(username) < 3:
        field_errors['username'] = ['Username must be at least 3 characters.']
    elif User.objects.filter(username=username).exists():
        field_errors['username'] = ['A user with that username already exists.']
    
    if not password:
        field_errors['password'] = ['This field is required.']
    elif len(password) < 8:
        field_errors['password'] = ['Password must be at least 8 characters.']
    
    if field_errors:
        return Response({
            'error': 'Validation failed',
            'field_errors': field_errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Create user
    try:
        user = User.objects.create_user(
            username=username,
            password=password
        )
    except Exception as e:
        return Response({
            'error': 'Failed to create user',
            'detail': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Automatically log in the user
    login(request, user)
    
    # Return user data
    serializer = UserSerializer(user)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def login_view(request):
    """
    Authenticate user and create session.
    
    POST /api/auth/login/
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({
            'error': 'Username and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(request, username=username, password=password)
    
    if user is not None:
        login(request, user)
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    else:
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
def logout_view(request):
    """
    Destroy user session.
    
    POST /api/auth/logout/
    """
    if not request.user.is_authenticated:
        return Response({
            'error': 'Authentication required'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    logout(request)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
def current_user(request):
    """
    Get current authenticated user information.
    
    GET /api/auth/me/
    """
    if not request.user.is_authenticated:
        return Response({
            'error': 'Authentication required'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    serializer = UserSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)


# Collection ViewSet

class CollectionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Collection model.
    
    list: GET /api/collections/
    create: POST /api/collections/
    retrieve: GET /api/collections/{id}/
    update: PUT /api/collections/{id}/
    partial_update: PATCH /api/collections/{id}/
    close: PATCH /api/collections/{id}/close/ (custom action)
    """
    queryset = Collection.objects.all()
    serializer_class = CollectionSerializer
    permission_classes = [AllowAny]  # We handle permissions in view methods
    
    def get_queryset(self):
        """Filter collections based on query parameters"""
        from django.db.models import Count
        queryset = Collection.objects.select_related('owner').annotate(
            record_count=Count('records')
        )
        
        # Filter by owner username
        owner_username = self.request.query_params.get('owner')
        if owner_username:
            queryset = queryset.filter(owner__username=owner_username)
        
        # Filter by is_closed status
        is_closed = self.request.query_params.get('is_closed')
        if is_closed is not None:
            is_closed_bool = is_closed.lower() == 'true'
            queryset = queryset.filter(is_closed=is_closed_bool)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Create collection - check authentication and permissions"""
        if not request.user or not request.user.is_authenticated:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """Update collection - check authentication and permissions"""
        if not request.user or not request.user.is_authenticated:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        obj = self.get_object()
        if obj.owner != request.user:
            return Response({
                'error': 'Only the owner can update this collection'
            }, status=status.HTTP_403_FORBIDDEN)
        if obj.is_closed:
            return Response({
                'error': 'Cannot update a closed collection'
            }, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        """Partial update collection - check authentication and permissions"""
        if not request.user or not request.user.is_authenticated:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        obj = self.get_object()
        if obj.owner != request.user:
            return Response({
                'error': 'Only the owner can update this collection'
            }, status=status.HTTP_403_FORBIDDEN)
        if obj.is_closed:
            return Response({
                'error': 'Cannot update a closed collection'
            }, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        """Set owner to current user when creating"""
        serializer.save(owner=self.request.user)
    
    @action(detail=True, methods=['patch'])
    def close(self, request, pk=None):
        """
        Close a collection (make it read-only).
        PATCH /api/collections/{id}/close/
        """
        collection = self.get_object()
        
        # Check permissions
        if not request.user.is_authenticated:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        if collection.owner != request.user:
            return Response({
                'error': 'Only the owner can close a collection'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if collection.is_closed:
            return Response({
                'error': 'Collection is already closed'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        collection.is_closed = True
        collection.save()
        
        # Refresh from database to get annotated record_count
        collection.refresh_from_db()
        serializer = self.get_serializer(collection)
        return Response(serializer.data, status=status.HTTP_200_OK)


# Record ViewSet

class RecordViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Record model.
    
    list: GET /api/records/?collection={id}
    create: POST /api/records/
    retrieve: GET /api/records/{id}/
    update: PUT /api/records/{id}/
    partial_update: PATCH /api/records/{id}/
    destroy: DELETE /api/records/{id}/
    """
    queryset = Record.objects.all()
    serializer_class = RecordSerializer
    permission_classes = [AllowAny]  # We handle permissions in view methods
    
    def get_serializer_context(self):
        """Add request to serializer context for absolute URL generation"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_queryset(self):
        """Filter records by collection (required for list, optional for detail)"""
        # For list operations, collection parameter is required (handled in list() method)
        # For detail operations (retrieve, update, delete), we don't filter by collection
        # so we can access any record by ID
        collection_id = self.request.query_params.get('collection')
        
        queryset = Record.objects.all()
        
        if collection_id:
            queryset = queryset.filter(collection_id=collection_id)
        
        return queryset.select_related('collection', 'collection__owner')
    
    def list(self, request, *args, **kwargs):
        """List records - collection parameter is required"""
        collection_id = request.query_params.get('collection')
        
        if not collection_id:
            return Response({
                'error': 'collection parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify collection exists
        try:
            collection = Collection.objects.get(id=collection_id)
        except Collection.DoesNotExist:
            return Response({
                'error': 'Collection not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        return super().list(request, *args, **kwargs)
    
    def create(self, request, *args, **kwargs):
        """Create record - check authentication first"""
        if not request.user or not request.user.is_authenticated:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """Update record - check authentication and permissions"""
        if not request.user or not request.user.is_authenticated:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        obj = self.get_object()
        if obj.collection.owner != request.user:
            return Response({
                'error': 'Only the collection owner can update this record'
            }, status=status.HTTP_403_FORBIDDEN)
        if obj.collection.is_closed:
            return Response({
                'error': 'Cannot update records in a closed collection'
            }, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        """Partial update record - check authentication and permissions"""
        if not request.user or not request.user.is_authenticated:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        obj = self.get_object()
        if obj.collection.owner != request.user:
            return Response({
                'error': 'Only the collection owner can update this record'
            }, status=status.HTTP_403_FORBIDDEN)
        if obj.collection.is_closed:
            return Response({
                'error': 'Cannot update records in a closed collection'
            }, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Delete record - check authentication and permissions"""
        if not request.user or not request.user.is_authenticated:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        obj = self.get_object()
        if obj.collection.owner != request.user:
            return Response({
                'error': 'Only the collection owner can delete this record'
            }, status=status.HTTP_403_FORBIDDEN)
        if obj.collection.is_closed:
            return Response({
                'error': 'Cannot delete records in a closed collection'
            }, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        """Set collection and validate permissions when creating"""
        collection_id = self.request.data.get('collection')
        
        if not collection_id:
            raise DRFValidationError({'collection': ['This field is required.']})
        
        try:
            collection = Collection.objects.get(id=collection_id)
        except Collection.DoesNotExist:
            raise DRFValidationError({'collection': ['Collection not found.']})
        
        # Check permissions (authentication is checked in create() method)
        if collection.owner != self.request.user:
            raise PermissionDenied('Only the collection owner can create records.')
        
        if collection.is_closed:
            raise PermissionDenied('Cannot create records in a closed collection.')
        
        serializer.save(collection=collection)
    
    def perform_update(self, serializer):
        """Validate permissions when updating"""
        record = self.get_object()
        
        # Check if collection is closed
        if record.collection.is_closed:
            raise PermissionDenied('Cannot update records in a closed collection.')
        
        # Handle image replacement - delete old image if new one is provided
        if 'image' in self.request.data and record.image:
            # Delete old image file
            record.image.delete(save=False)
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """Delete image file when record is deleted"""
        if instance.image:
            instance.image.delete(save=False)
        instance.delete()
