"""
Django REST Framework serializers for Ekho API

Reference: docs/api-specification.md
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import Collection, Record


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


class RecordSerializer(serializers.ModelSerializer):
    """Serializer for Record model"""
    image = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = Record
        fields = [
            'id', 'title', 'artist', 'year', 'medium', 
            'dimensions', 'description', 'condition', 'image',
            'collection', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def to_representation(self, instance):
        """Override to return absolute URL for image"""
        representation = super().to_representation(instance)
        if instance.image:
            request = self.context.get('request')
            if request:
                representation['image'] = request.build_absolute_uri(instance.image.url)
            else:
                representation['image'] = instance.image.url
        return representation
    
    def validate_year(self, value):
        """Validate year is in reasonable range"""
        if value is not None:
            if value < 1000 or value > 2100:
                raise serializers.ValidationError("Year must be between 1000 and 2100")
        return value
    
    def validate_image(self, value):
        """Validate image file"""
        if value:
            # Check file size (10MB max)
            max_size = 10 * 1024 * 1024  # 10MB
            if value.size > max_size:
                raise serializers.ValidationError("Image file size cannot exceed 10MB")
            
            # Check file type
            allowed_types = ['image/jpeg', 'image/png', 'image/gif']
            if value.content_type not in allowed_types:
                raise serializers.ValidationError("Image must be JPEG, PNG, or GIF")
        
        return value
