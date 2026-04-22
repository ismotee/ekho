"""
Django REST Framework views for Ekho API

Reference: docs/api-specification.md
"""

import os
import uuid

from django.core.files.base import ContentFile
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError as DRFValidationError, PermissionDenied
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.db import transaction
from django.db.models import Q, TextField
from django.db.models.functions import Cast
from django.core.exceptions import ValidationError as DjangoValidationError
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie

from .models import Actor, Collection, Record, RecordImage
from .record_validators import validate_record_data_payload
from .system_identity import get_or_create_system_instance_id
from .record_actor_refs import (
    collect_actor_ids,
    list_record_usage_for_actor,
    remap_actor_ids_for_import,
    sanitize_actor_refs_for_import,
    strip_actor_id,
)
from .actor_catalog_validate import actor_catalog_kind, validate_actor_catalog_data
from .serializers import (
    ActorSerializer,
    CollectionSerializer,
    RecordImageSerializer,
    RecordSerializer,
    UserSerializer,
)
from .permissions import (
    IsActorEditorOrReadOnly,
    IsCollectionOwnerOrReadOnly,
    IsRecordOwnerOrReadOnly,
)
from .record_export_import import (
    EKHO_EXPORT_VERSIONS_IMPORT,
    apply_import_nested_images,
    build_record_export_payload,
    decode_import_nested_images,
    decode_import_representative_image,
)


def _collection_visibility_q(user):
    """Collections visible in list/retrieve: listed for everyone; unlisted only for owner."""
    if getattr(user, "is_authenticated", False):
        return Q(is_listed=True) | Q(owner=user)
    return Q(is_listed=True)


def _record_visibility_q(user):
    """Records visible in list/retrieve: same rules via parent collection."""
    if getattr(user, "is_authenticated", False):
        return Q(collection__owner=user) | (
            Q(collection__is_listed=True) & Q(is_listed=True)
        )
    return Q(collection__is_listed=True) & Q(is_listed=True)


def _optional_import_uuid(value, field_label: str):
    if value in (None, ""):
        return None
    try:
        return uuid.UUID(str(value))
    except (ValueError, TypeError, AttributeError):
        raise ValueError(f"{field_label} must be a valid UUID or null.") from None


def _require_import_uuid(value, field_label: str) -> uuid.UUID:
    try:
        return uuid.UUID(str(value))
    except (ValueError, TypeError, AttributeError):
        raise ValueError(f"{field_label} must be a valid UUID.") from None


def _validated_import_payload(request_data: dict):
    ver = request_data.get("ekho_export_version")
    try:
        ver_int = int(ver)
    except (TypeError, ValueError):
        raise ValueError(
            "Unsupported or missing ekho_export_version (expected 1 or 2)."
        ) from None
    if ver_int not in EKHO_EXPORT_VERSIONS_IMPORT:
        raise ValueError(
            "Unsupported or missing ekho_export_version (expected 1 or 2)."
        )
    col = request_data.get("collection")
    if not isinstance(col, dict):
        raise ValueError("collection must be an object.")
    if col.get("stable_id") in (None, ""):
        raise ValueError("collection.stable_id is required.")
    _require_import_uuid(col.get("stable_id"), "collection.stable_id")
    rec = request_data.get("record")
    if not isinstance(rec, dict):
        raise ValueError("record must be an object.")
    raw_data = rec.get("data")
    if raw_data is None:
        raise ValueError("record.data is required.")
    if not isinstance(raw_data, dict):
        raise ValueError("record.data must be a JSON object.")
    actors = request_data.get("actors")
    if actors is None:
        actors = []
    if not isinstance(actors, list):
        raise ValueError("actors must be an array when provided.")
    return col, rec, raw_data, ver_int, actors


def _current_collection_for_import(user, collection_id):
    if collection_id is None:
        raise ValueError("current_collection_id is required for this import mode.")
    try:
        cid = int(collection_id)
    except (TypeError, ValueError):
        raise ValueError("current_collection_id must be an integer.")
    try:
        col = Collection.objects.get(pk=cid)
    except Collection.DoesNotExist:
        raise ValueError("Collection not found.")
    if col.owner_id != user.id:
        raise PermissionDenied("Only the collection owner can import into this collection.")
    if col.is_closed:
        raise PermissionDenied("Cannot import into a closed collection.")
    return col


def _resolve_or_upsert_import_actors(user, actors_payload: list[dict]) -> dict[int, int]:
    """
    Upsert imported actors by import_id and return source->local id map.
    New actors are owned by `user`. Existing actors with matching import_id are updated.
    """
    id_map: dict[int, int] = {}
    for i, item in enumerate(actors_payload):
        if not isinstance(item, dict):
            raise ValueError(f"actors[{i}] must be an object.")
        src = item.get("source_id")
        if src is None:
            raise ValueError(f"actors[{i}].source_id is required.")
        try:
            src_id = int(src)
        except (TypeError, ValueError):
            raise ValueError(f"actors[{i}].source_id must be an integer.") from None
        if src_id <= 0:
            raise ValueError(f"actors[{i}].source_id must be a positive integer.")

        raw_data = item.get("data")
        validated_data = validate_actor_catalog_data(raw_data)
        import_id_raw = item.get("import_id")
        if import_id_raw in (None, ""):
            import_uid = uuid.uuid4()
        else:
            import_uid = _require_import_uuid(import_id_raw, f"actors[{i}].import_id")

        actor = Actor.objects.filter(import_id=import_uid).first()
        if actor is None:
            actor = Actor.objects.create(
                owner=user,
                data=validated_data,
                import_id=import_uid,
            )
        else:
            # Reuse existing actor across owners in same database.
            # Only update payload when actor is global or owned by importing user.
            if actor.owner_id is None or actor.owner_id == user.id:
                actor.data = validated_data
                actor.save(update_fields=["data", "updated_at"])
        id_map[src_id] = actor.pk
    return id_map


def _resolve_owning_actor_for_import(oo_meta: dict, actor_id_map: dict[int, int]):
    if not isinstance(oo_meta, dict):
        return None
    source_id = oo_meta.get("id")
    if source_id is not None:
        try:
            sid = int(source_id)
        except (TypeError, ValueError):
            sid = None
        if sid is not None and sid in actor_id_map:
            return Actor.objects.filter(pk=actor_id_map[sid]).first()

    iid = oo_meta.get("import_id")
    if iid not in (None, ""):
        uid = _optional_import_uuid(iid, "collection.owning_organization.import_id")
        if uid is not None:
            return Actor.objects.filter(import_id=uid).first()

    if source_id is not None:
        try:
            cand = Actor.objects.get(pk=int(source_id))
        except (Actor.DoesNotExist, ValueError, TypeError):
            return None
        if actor_catalog_kind(cand.data) == "organization":
            return cand
    return None


def _get_or_create_original_collection(
    user, col_meta: dict, actor_id_map: dict[int, int] | None = None
) -> Collection:
    sid = _require_import_uuid(col_meta.get("stable_id"), "collection.stable_id")

    existing = Collection.objects.filter(stable_id=sid).first()
    if existing:
        if existing.owner_id != user.id:
            raise PermissionDenied(
                "A collection with this stable_id already exists under another owner."
            )
        if existing.is_closed:
            raise PermissionDenied("Cannot add records to a closed collection.")
        return existing

    name = col_meta.get("name") or "Imported collection"
    if not isinstance(name, str):
        name = str(name)
    desc = col_meta.get("description") or ""
    if not isinstance(desc, str):
        desc = str(desc)

    origin_uid = _optional_import_uuid(
        col_meta.get("origin_ekho_instance_id"),
        "collection.origin_ekho_instance_id",
    )

    if bool(col_meta.get("is_closed", False)):
        raise ValueError("Cannot import: exported collection is closed.")

    rd = col_meta.get("responsible_department") or ""
    if not isinstance(rd, str):
        rd = str(rd)

    owning_actor = None
    oo_meta = col_meta.get("owning_organization")
    if isinstance(oo_meta, dict):
        owning_actor = _resolve_owning_actor_for_import(oo_meta, actor_id_map or {})
        if owning_actor is not None and actor_catalog_kind(owning_actor.data) != "organization":
            owning_actor = None

    return Collection.objects.create(
        name=name[:200],
        description=desc[:1000],
        responsible_department=rd[:500],
        owning_organization=owning_actor,
        owner=user,
        is_closed=False,
        stable_id=sid,
        origin_ekho_instance_id=origin_uid,
        is_listed=False,
    )


def _save_imported_record(
    collection,
    data_dict: dict,
    image_tuple: tuple[bytes, str] | None,
    nested_image_specs: list | None = None,
):
    now = timezone.now()
    rec = Record.objects.create(
        collection=collection,
        data=data_dict,
        imported_first=now,
        imported_last=now,
    )
    if image_tuple is not None:
        raw, fname = image_tuple
        cf = ContentFile(bytes(raw), name=fname)
        unique = f"{uuid.uuid4().hex}_{os.path.basename(fname)}"
        rec.representative_image.save(unique, cf, save=True)
    if nested_image_specs:
        apply_import_nested_images(rec, nested_image_specs)
    return rec


def _permission_denied_response(exc: PermissionDenied):
    detail = exc.detail
    if isinstance(detail, list) and detail:
        msg = str(detail[0])
    elif isinstance(detail, dict):
        msg = str(detail)
    else:
        msg = str(detail)
    return Response({"error": msg}, status=status.HTTP_403_FORBIDDEN)


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
        queryset = Collection.objects.select_related('owner', 'owning_organization').annotate(
            record_count=Count('records')
        ).order_by('-created_at')
        
        # Filter by owner username
        owner_username = self.request.query_params.get('owner')
        if owner_username:
            queryset = queryset.filter(owner__username=owner_username)
        
        # Filter by is_closed status
        is_closed = self.request.query_params.get('is_closed')
        if is_closed is not None:
            is_closed_bool = is_closed.lower() == 'true'
            queryset = queryset.filter(is_closed=is_closed_bool)
        
        # Search (Plan 3): name and description (icontains, OR)
        search = (self.request.query_params.get('search') or '').strip()
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )

        queryset = queryset.filter(_collection_visibility_q(self.request.user))
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


# Actor ViewSet


class ActorViewSet(viewsets.ModelViewSet):
    """
    GET/POST /api/actors/
    GET/PATCH/DELETE /api/actors/{id}/
    GET /api/actors/{id}/usage/
    """

    queryset = Actor.objects.select_related("owner").all()
    serializer_class = ActorSerializer
    permission_classes = [IsActorEditorOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_authenticated:
            return qs.filter(Q(owner__isnull=True) | Q(owner=user))
        return qs.filter(owner__isnull=True)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def perform_destroy(self, instance):
        pk = instance.pk
        with transaction.atomic():
            for rec in Record.objects.all():
                d = rec.data if isinstance(rec.data, dict) else {}
                if pk not in collect_actor_ids(d):
                    continue
                rec.data = strip_actor_id(d, pk)
                rec.save(update_fields=["data", "updated_at"])
            instance.delete()

    @action(detail=True, methods=["get"], url_path="usage")
    def usage(self, request, pk=None):
        actor = self.get_object()
        count, records = list_record_usage_for_actor(actor.pk, limit=50)
        return Response({"count": count, "records": records})


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
        """Filter records by collection (optional), collection_name, owner (Plan 2), and search (Plan 3, US-018)."""
        collection_id = self.request.query_params.get('collection')
        collection_name = self.request.query_params.get('collection_name', '').strip()
        owner_username = self.request.query_params.get('owner', '').strip()
        search = (self.request.query_params.get('search') or '').strip()

        queryset = Record.objects.filter(_record_visibility_q(self.request.user))

        if collection_id:
            queryset = queryset.filter(collection_id=collection_id)
        if collection_name:
            queryset = queryset.filter(collection__name__icontains=collection_name)
        if owner_username:
            queryset = queryset.filter(collection__owner__username=owner_username)
        if search:
            queryset = queryset.annotate(
                _record_data_search_blob=Cast("data", TextField())
            ).filter(
                Q(_record_data_search_blob__icontains=search)
                | Q(collection__name__icontains=search)
                | Q(collection__description__icontains=search)
            )

        return (
            queryset.select_related("collection", "collection__owner")
            .prefetch_related("images")
            .order_by("-created_at")
        )
    
    def list(self, request, *args, **kwargs):
        """List records - collection parameter is optional (omit to list all records)."""
        collection_id = request.query_params.get('collection')
        if collection_id:
            visible = Collection.objects.filter(pk=collection_id).filter(
                _collection_visibility_q(request.user)
            )
            if not visible.exists():
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
        
        if "representative_image" in self.request.data and record.representative_image:
            record.representative_image.delete(save=False)

        serializer.save()

    def perform_destroy(self, instance):
        """Delete stored image files when record is deleted."""
        for img in instance.images.all():
            if img.image:
                img.image.delete(save=False)
        if instance.representative_image:
            instance.representative_image.delete(save=False)
        instance.delete()

    @action(detail=True, methods=["get"], url_path="export")
    def export(self, request, pk=None):
        """
        Download a versioned JSON export of this record (domain data, collection
        metadata, optional representative image, record.images for v2).
        GET /api/records/{id}/export/
        """
        record = self.get_object()

        try:
            raw_data = record.data if isinstance(record.data, dict) else {}
            data = validate_record_data_payload(raw_data)
        except ValueError as e:
            return Response(
                {"error": "Invalid stored record data", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        payload = build_record_export_payload(
            record,
            system_instance_id=get_or_create_system_instance_id(),
            validated_data=data,
        )

        response = JsonResponse(payload, json_dumps_params={"ensure_ascii": False})
        filename = f'ekho-record-{record.pk}.json'
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

    @action(detail=False, methods=["post"], url_path="import", url_name="import")
    def import_record(self, request):
        """
        Import a record from an export JSON payload (see GET .../export/).
        POST /api/records/import/
        """
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        mode = request.data.get("mode")
        if mode not in ("acquisition", "deposition", "original_only"):
            return Response(
                {
                    "error": "mode must be one of: acquisition, deposition, original_only.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            col_meta, rec_block, raw_data, export_ver, actors_payload = _validated_import_payload(
                request.data
            )
            actor_id_map = _resolve_or_upsert_import_actors(request.user, actors_payload)
            data_remapped = remap_actor_ids_for_import(raw_data, actor_id_map)
            data_sanitized = sanitize_actor_refs_for_import(
                data_remapped,
                request.user,
                allowed_actor_ids=set(actor_id_map.values()),
            )
            data_validated = validate_record_data_payload(data_sanitized)
        except PermissionDenied as e:
            return _permission_denied_response(e)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        try:
            image_tuple = decode_import_representative_image(rec_block)
            nested_specs = decode_import_nested_images(rec_block, export_ver)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        current_id = request.data.get("current_collection_id")

        try:
            if mode == "acquisition":
                current = _current_collection_for_import(request.user, current_id)
                with transaction.atomic():
                    rec = _save_imported_record(
                        current, data_validated, image_tuple, nested_specs
                    )
                return Response(
                    {"record_ids": [rec.pk], "mode": mode},
                    status=status.HTTP_201_CREATED,
                )

            if mode == "original_only":
                with transaction.atomic():
                    original = _get_or_create_original_collection(
                        request.user, col_meta, actor_id_map
                    )
                    rec = _save_imported_record(
                        original, data_validated, image_tuple, nested_specs
                    )
                return Response(
                    {"record_ids": [rec.pk], "mode": mode},
                    status=status.HTTP_201_CREATED,
                )

            # deposition
            current = _current_collection_for_import(request.user, current_id)
            with transaction.atomic():
                original = _get_or_create_original_collection(
                    request.user, col_meta, actor_id_map
                )
                r1 = _save_imported_record(
                    original, data_validated, image_tuple, nested_specs
                )
                r2 = _save_imported_record(
                    current, data_validated, image_tuple, nested_specs
                )
            return Response(
                {"record_ids": [r1.pk, r2.pk], "mode": mode},
                status=status.HTTP_201_CREATED,
            )
        except PermissionDenied as e:
            return _permission_denied_response(e)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class RecordImageListCreateView(generics.ListCreateAPIView):
    """
    GET/POST /api/records/{record_pk}/images/
    List is visible to anyone who can see the parent record; create requires the
    collection owner and an open collection.
    """

    permission_classes = [AllowAny]
    serializer_class = RecordImageSerializer

    def get_parent_record(self):
        return get_object_or_404(
            Record.objects.filter(_record_visibility_q(self.request.user)),
            pk=self.kwargs["record_pk"],
        )

    def get_queryset(self):
        return RecordImage.objects.filter(record_id=self.kwargs["record_pk"]).order_by(
            "sort_order", "id"
        )

    def list(self, request, *args, **kwargs):
        self.get_parent_record()
        return super().list(request, *args, **kwargs)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def create(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        record = self.get_parent_record()
        if record.collection.owner != request.user:
            return Response(
                {"error": "Only the collection owner can add images to this record."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if record.collection.is_closed:
            return Response(
                {"error": "Cannot add images to a record in a closed collection."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(record=self.get_parent_record())


class RecordImageDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PUT/PATCH/DELETE /api/records/{record_pk}/images/{pk}/
    Retrieve follows record visibility; writes require the collection owner.
    """

    permission_classes = [AllowAny]
    serializer_class = RecordImageSerializer

    def get_parent_record(self):
        return get_object_or_404(
            Record.objects.filter(_record_visibility_q(self.request.user)),
            pk=self.kwargs["record_pk"],
        )

    def get_object(self):
        record = self.get_parent_record()
        return get_object_or_404(RecordImage, pk=self.kwargs["pk"], record=record)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def update(self, request, *args, **kwargs):
        return self._check_write_then(super().update, request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        return self._check_write_then(super().partial_update, request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        return self._check_write_then(super().destroy, request, *args, **kwargs)

    def _check_write_then(self, fn, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        image = self.get_object()
        if image.record.collection.owner != request.user:
            return Response(
                {"error": "Only the collection owner can modify this image."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if image.record.collection.is_closed:
            return Response(
                {"error": "Cannot modify images in a closed collection."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return fn(request, *args, **kwargs)

    def perform_destroy(self, instance):
        if instance.image:
            instance.image.delete(save=False)
        instance.delete()


class RecordImageListCreateView(generics.ListCreateAPIView):
    """
    GET/POST /api/records/{record_pk}/images/
    List is visible to anyone who can see the parent record; create requires the
    collection owner and an open collection.
    """

    permission_classes = [AllowAny]
    serializer_class = RecordImageSerializer

    def get_parent_record(self):
        return get_object_or_404(
            Record.objects.filter(_record_visibility_q(self.request.user)),
            pk=self.kwargs["record_pk"],
        )

    def get_queryset(self):
        return RecordImage.objects.filter(record_id=self.kwargs["record_pk"]).order_by(
            "sort_order", "id"
        )

    def list(self, request, *args, **kwargs):
        self.get_parent_record()
        return super().list(request, *args, **kwargs)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def create(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        record = self.get_parent_record()
        if record.collection.owner != request.user:
            return Response(
                {"error": "Only the collection owner can add images to this record."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if record.collection.is_closed:
            return Response(
                {"error": "Cannot add images to a record in a closed collection."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(record=self.get_parent_record())


class RecordImageDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PUT/PATCH/DELETE /api/records/{record_pk}/images/{pk}/
    Retrieve follows record visibility; writes require the collection owner.
    """

    permission_classes = [AllowAny]
    serializer_class = RecordImageSerializer

    def get_parent_record(self):
        return get_object_or_404(
            Record.objects.filter(_record_visibility_q(self.request.user)),
            pk=self.kwargs["record_pk"],
        )

    def get_object(self):
        record = self.get_parent_record()
        return get_object_or_404(RecordImage, pk=self.kwargs["pk"], record=record)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def update(self, request, *args, **kwargs):
        return self._check_write_then(super().update, request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        return self._check_write_then(super().partial_update, request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        return self._check_write_then(super().destroy, request, *args, **kwargs)

    def _check_write_then(self, fn, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        image = self.get_object()
        if image.record.collection.owner != request.user:
            return Response(
                {"error": "Only the collection owner can modify this image."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if image.record.collection.is_closed:
            return Response(
                {"error": "Cannot modify images in a closed collection."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return fn(request, *args, **kwargs)

    def perform_destroy(self, instance):
        if instance.image:
            instance.image.delete(save=False)
        instance.delete()
