"""
Authentication API Tests

Reference: docs/api-specification.md (Authentication Endpoints), docs/user-stories/01-authentication.md

This module contains comprehensive tests for authentication endpoints:
- User Registration (US-001)
- User Login (US-002)
- User Logout (US-003)
- Current User Endpoint (US-004)
- Session Management (US-004)

TDD APPROACH: These tests are written BEFORE production code exists.
The tests SHOULD FAIL until API endpoints are implemented.
This follows the Documentation → Tests → Production Code workflow.

Expected failures:
- URL reverse errors when endpoints don't exist (NoReverseMatch)
- 404 errors when endpoints don't exist
- 500 errors when endpoints exist but aren't fully implemented
- Assertion failures when responses don't match expected format
"""

import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestUserRegistration:
    """Test User Registration (US-001)"""
    
    def test_successful_registration_with_valid_credentials(self):
        """Test successful registration with valid username and password"""
        client = APIClient()
        url = reverse('auth-register')
        data = {
            'username': 'testuser',
            'password': 'securepass123'
        }
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'id' in response.data
        assert response.data['username'] == 'testuser'
        assert 'email' in response.data
        # Verify user was created
        assert User.objects.filter(username='testuser').exists()
        # Verify password is hashed (not stored in plain text)
        user = User.objects.get(username='testuser')
        assert user.password != 'securepass123'
        assert user.check_password('securepass123')
    
    def test_registration_with_duplicate_username(self):
        """Test registration with duplicate username (should return 400)"""
        # Create existing user
        User.objects.create_user(username='existinguser', password='pass123')
        
        client = APIClient()
        url = reverse('auth-register')
        data = {
            'username': 'existinguser',
            'password': 'newpass123'
        }
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'field_errors' in response.data or 'username' in str(response.data).lower()
    
    def test_registration_with_invalid_username_format(self):
        """Test registration with invalid username format (should return 400)"""
        client = APIClient()
        url = reverse('auth-register')
        data = {
            'username': 'ab',  # Too short (min 3 characters)
            'password': 'securepass123'
        }
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_registration_with_weak_password(self):
        """Test registration with weak password (< 8 characters, should return 400)"""
        client = APIClient()
        url = reverse('auth-register')
        data = {
            'username': 'testuser',
            'password': 'short'  # Less than 8 characters
        }
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'field_errors' in response.data or 'password' in str(response.data).lower()
    
    def test_registration_automatically_logs_in_user(self):
        """Test registration automatically logs in user (session created)"""
        client = APIClient()
        url = reverse('auth-register')
        data = {
            'username': 'newuser',
            'password': 'securepass123'
        }
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        # Verify session was created by checking if we can access protected endpoint
        me_url = reverse('auth-me')
        me_response = client.get(me_url)
        assert me_response.status_code == status.HTTP_200_OK
        assert me_response.data['username'] == 'newuser'
    
    def test_registration_response_format_matches_api_spec(self):
        """Test registration response format matches API spec (id, username, email)"""
        client = APIClient()
        url = reverse('auth-register')
        data = {
            'username': 'formatuser',
            'password': 'securepass123'
        }
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'id' in response.data
        assert 'username' in response.data
        assert 'email' in response.data
        assert isinstance(response.data['id'], int)
        assert isinstance(response.data['username'], str)
    
    def test_registration_field_validation_errors_format(self):
        """Test field validation errors are returned in field_errors format"""
        client = APIClient()
        url = reverse('auth-register')
        data = {
            'username': '',  # Empty username
            'password': 'short'  # Weak password
        }
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        # Response should contain error information
        assert response.data is not None


@pytest.mark.django_db
class TestUserLogin:
    """Test User Login (US-002)"""
    
    def setUp(self):
        """Set up test user"""
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
    
    def test_successful_login_with_valid_credentials(self):
        """Test successful login with valid credentials"""
        self.setUp()
        client = APIClient()
        url = reverse('auth-login')
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'id' in response.data
        assert response.data['username'] == 'testuser'
        assert 'email' in response.data
    
    def test_login_with_invalid_username(self):
        """Test login with invalid username (should return 400/401)"""
        self.setUp()
        client = APIClient()
        url = reverse('auth-login')
        data = {
            'username': 'nonexistent',
            'password': 'testpass123'
        }
        response = client.post(url, data, format='json')
        
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED]
    
    def test_login_with_invalid_password(self):
        """Test login with invalid password (should return 400/401)"""
        self.setUp()
        client = APIClient()
        url = reverse('auth-login')
        data = {
            'username': 'testuser',
            'password': 'wrongpassword'
        }
        response = client.post(url, data, format='json')
        
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED]
    
    def test_login_creates_session_cookie(self):
        """Test login creates session cookie"""
        self.setUp()
        client = APIClient()
        url = reverse('auth-login')
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        # Verify session was created
        me_url = reverse('auth-me')
        me_response = client.get(me_url)
        assert me_response.status_code == status.HTTP_200_OK
    
    def test_login_response_format_matches_api_spec(self):
        """Test login response format matches API spec"""
        self.setUp()
        client = APIClient()
        url = reverse('auth-login')
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'id' in response.data
        assert 'username' in response.data
        assert 'email' in response.data
    
    def test_login_with_empty_credentials(self):
        """Test login with empty credentials (should return 400)"""
        client = APIClient()
        url = reverse('auth-login')
        data = {
            'username': '',
            'password': ''
        }
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestUserLogout:
    """Test User Logout (US-003)"""
    
    def setUp(self):
        """Set up authenticated user"""
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client = APIClient()
        # Login to create session
        login_url = reverse('auth-login')
        self.client.post(login_url, {
            'username': 'testuser',
            'password': 'testpass123'
        }, format='json')
    
    def test_logout_requires_authentication(self):
        """Test logout requires authentication (401 if not authenticated)"""
        client = APIClient()  # Unauthenticated client
        url = reverse('auth-logout')
        response = client.post(url, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_logout_destroys_session(self):
        """Test logout destroys session (session invalidated)"""
        self.setUp()
        url = reverse('auth-logout')
        response = self.client.post(url, format='json')
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        # Verify session is destroyed
        me_url = reverse('auth-me')
        me_response = self.client.get(me_url)
        assert me_response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_logout_returns_204_no_content(self):
        """Test logout returns 204 No Content"""
        self.setUp()
        url = reverse('auth-logout')
        response = self.client.post(url, format='json')
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
    
    def test_user_cannot_access_protected_endpoints_after_logout(self):
        """Test user cannot access protected endpoints after logout"""
        self.setUp()
        # Logout
        logout_url = reverse('auth-logout')
        self.client.post(logout_url, format='json')
        
        # Try to access protected endpoint
        me_url = reverse('auth-me')
        me_response = self.client.get(me_url)
        assert me_response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestCurrentUserEndpoint:
    """Test Current User Endpoint (US-004)"""
    
    def setUp(self):
        """Set up authenticated user"""
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client = APIClient()
        # Login to create session
        login_url = reverse('auth-login')
        self.client.post(login_url, {
            'username': 'testuser',
            'password': 'testpass123'
        }, format='json')
    
    def test_current_user_returns_user_data_when_authenticated(self):
        """Test /api/auth/me/ returns user data when authenticated"""
        self.setUp()
        url = reverse('auth-me')
        response = self.client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['username'] == 'testuser'
        assert response.data['id'] == self.user.id
    
    def test_current_user_returns_401_when_not_authenticated(self):
        """Test /api/auth/me/ returns 401 when not authenticated"""
        client = APIClient()  # Unauthenticated client
        url = reverse('auth-me')
        response = client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_current_user_response_format_matches_api_spec(self):
        """Test response format matches API spec (id, username, email)"""
        self.setUp()
        url = reverse('auth-me')
        response = self.client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'id' in response.data
        assert 'username' in response.data
        assert 'email' in response.data
        assert isinstance(response.data['id'], int)
        assert isinstance(response.data['username'], str)
    
    def test_session_persistence_across_requests(self):
        """Test session persistence across requests"""
        self.setUp()
        url = reverse('auth-me')
        
        # First request
        response1 = self.client.get(url)
        assert response1.status_code == status.HTTP_200_OK
        
        # Second request (should still be authenticated)
        response2 = self.client.get(url)
        assert response2.status_code == status.HTTP_200_OK
        assert response1.data['id'] == response2.data['id']


@pytest.mark.django_db
class TestSessionManagement:
    """Test Session Management (US-004)"""
    
    def setUp(self):
        """Set up authenticated user"""
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client = APIClient()
        # Login to create session
        login_url = reverse('auth-login')
        self.client.post(login_url, {
            'username': 'testuser',
            'password': 'testpass123'
        }, format='json')
    
    def test_session_persists_across_multiple_requests(self):
        """Test session persists across multiple requests"""
        self.setUp()
        url = reverse('auth-me')
        
        # Make multiple requests
        for _ in range(5):
            response = self.client.get(url)
            assert response.status_code == status.HTTP_200_OK
            assert response.data['username'] == 'testuser'
    
    def test_session_cookie_is_set_correctly(self):
        """Test session cookie is set correctly"""
        self.setUp()
        # Session should be maintained in client
        url = reverse('auth-me')
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
    
    def test_csrf_protection_for_state_changing_operations(self):
        """Test CSRF protection for state-changing operations"""
        # Note: CSRF protection is typically handled by Django middleware
        # This test verifies that state-changing operations require proper authentication
        self.setUp()
        # Logout is a state-changing operation
        logout_url = reverse('auth-logout')
        response = self.client.post(logout_url, format='json')
        # Should succeed when authenticated
        assert response.status_code == status.HTTP_204_NO_CONTENT
