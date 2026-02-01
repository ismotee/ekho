"""
Django models for Ekho Art Collection Management Application

Reference: docs/data-models.md
"""

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class Collection(models.Model):
    """
    Represents an art collection owned by a user.
    Collections can be open (editable) or closed (read-only).
    """
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


class Record(models.Model):
    """
    Represents an art record (artwork) within a collection.
    Records contain artwork information and optional image.
    """
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
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE, related_name='records')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['collection']),
        ]
    
    def __str__(self):
        return f"{self.title} by {self.artist}"
