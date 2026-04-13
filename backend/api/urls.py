"""
URL configuration for Ekho API

Reference: docs/api-specification.md
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router for ViewSets
router = DefaultRouter()
router.register(r'collections', views.CollectionViewSet, basename='collections')
router.register(r'records', views.RecordViewSet, basename='records')
router.register(r'actors', views.ActorViewSet, basename='actors')

# Authentication URLs
auth_urlpatterns = [
    path('register/', views.register, name='auth-register'),
    path('login/', views.login_view, name='auth-login'),
    path('logout/', views.logout_view, name='auth-logout'),
    path('me/', views.current_user, name='auth-me'),
    path('csrf/', views.csrf_token, name='auth-csrf'),
]

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('auth/', include(auth_urlpatterns)),
    path(
        'records/<int:record_pk>/images/',
        views.RecordImageListCreateView.as_view(),
        name='record-images-list',
    ),
    path(
        'records/<int:record_pk>/images/<int:pk>/',
        views.RecordImageDetailView.as_view(),
        name='record-images-detail',
    ),
    path('', include(router.urls)),
]
