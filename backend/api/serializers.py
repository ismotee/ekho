"""
Django REST Framework serializers for Ekho API

Reference: docs/api-specification.md
"""

import json

from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import Actor, Collection, Record
from .actor_catalog_validate import validate_actor_catalog_data
from .record_actor_refs import validate_actor_refs_for_user
from .record_validators import validate_record_data_payload


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email']
        read_only_fields = ['id']


class CollectionSerializer(serializers.ModelSerializer):
    """Serializer for Collection model"""
    owner = UserSerializer(read_only=True)
    record_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Collection
        fields = [
            'id', 'name', 'description', 'owner', 
            'is_closed', 'created_at', 'updated_at', 'record_count'
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at', 'record_count']
    
    def get_record_count(self, obj):
        """Get the count of records in this collection"""
        if hasattr(obj, 'record_count'):
            return obj.record_count
        return obj.records.count()


class RecordDataField(serializers.Field):
    """Accepts a JSON object or a JSON string (multipart form)."""

    default_empty_html = serializers.empty

    def to_representation(self, value):
        if value is None:
            return {}
        return value

    def to_internal_value(self, data):
        if data in (None, "", serializers.empty):
            return {}
        if isinstance(data, dict):
            try:
                return validate_record_data_payload(data)
            except ValueError as exc:
                raise serializers.ValidationError(str(exc)) from exc
        if isinstance(data, str):
            try:
                parsed = json.loads(data)
            except json.JSONDecodeError:
                raise serializers.ValidationError("Invalid JSON in data.")
            try:
                return validate_record_data_payload(parsed)
            except ValueError as exc:
                raise serializers.ValidationError(str(exc)) from exc
        raise serializers.ValidationError("data must be a JSON object or JSON string.")


class ActorSerializer(serializers.ModelSerializer):
    """Actor catalog entry (`data`: person XOR organization identifies the actor; org may include contact_person)."""

    owner = UserSerializer(read_only=True)

    class Meta:
        model = Actor
        fields = ["id", "owner", "data", "created_at", "updated_at"]
        read_only_fields = ["id", "owner", "created_at", "updated_at"]

    def validate_data(self, value):
        return validate_actor_catalog_data(value)


class RecordSerializer(serializers.ModelSerializer):
    """Record resource: domain under `data`, optional `representative_image` URL in responses."""

    data = RecordDataField(required=False)
    representative_image = serializers.ImageField(required=False, allow_null=True)
    collection_name = serializers.SerializerMethodField(read_only=True)
    collection_owner_username = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Record
        fields = [
            "id",
            "data",
            "representative_image",
            "collection",
            "collection_name",
            "collection_owner_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "collection_name",
            "collection_owner_username",
        ]

    def get_collection_name(self, obj):
        return obj.collection.name if obj.collection_id else None

    def get_collection_owner_username(self, obj):
        if obj.collection_id and obj.collection.owner_id:
            return obj.collection.owner.username
        return None

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.representative_image:
            request = self.context.get("request")
            if request:
                representation["representative_image"] = request.build_absolute_uri(
                    instance.representative_image.url
                )
            else:
                representation["representative_image"] = instance.representative_image.url
        else:
            representation["representative_image"] = None
        return representation

    def validate(self, attrs):
        payload = attrs.get("data")
        if payload is not None and isinstance(payload, dict):
            request = self.context.get("request")
            user = getattr(request, "user", None) if request else None
            validate_actor_refs_for_user(payload, user)
        return attrs

    def validate_representative_image(self, value):
        if value:
            max_size = 10 * 1024 * 1024
            if value.size > max_size:
                raise serializers.ValidationError(
                    "Image file size cannot exceed 10MB"
                )
            allowed_types = ["image/jpeg", "image/png", "image/gif"]
            if value.content_type not in allowed_types:
                raise serializers.ValidationError("Image must be JPEG, PNG, or GIF")
        return value
