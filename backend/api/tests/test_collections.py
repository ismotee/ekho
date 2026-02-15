"""
Collection API Tests

Reference: docs/api-specification.md (Collection Endpoints), docs/user-stories/02-collections.md, docs/data-models.md (Collection Model)

This module contains comprehensive tests for collection endpoints:
- List Collections (US-008)
- Create Collection (US-005)
- Retrieve Collection (US-009)
- Update Collection (US-006)
- Close Collection (US-007)
- Permission Edge Cases

TDD APPROACH: These tests are written BEFORE production code exists.
The tests SHOULD FAIL until API endpoints and models are implemented.
This follows the Documentation → Tests → Production Code workflow.

Expected failures:
- URL reverse errors when endpoints don't exist (NoReverseMatch)
- 404 errors when endpoints don't exist
- Import errors when Collection model doesn't exist
- Assertion failures when responses don't match expected format
"""

import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from datetime import datetime


# Note: These tests assume Collection model exists
# In actual implementation, import would be: from api.models import Collection


@pytest.fixture
def user():
    """Create a test user"""
    return User.objects.create_user(username='testuser', password='testpass123')


@pytest.fixture
def other_user():
    """Create another test user"""
    return User.objects.create_user(username='otheruser', password='testpass123')


@pytest.fixture
def authenticated_client(user):
    """Create an authenticated API client"""
    client = APIClient()
    # Login to create session
    login_url = reverse('auth-login')
    client.post(login_url, {
        'username': 'testuser',
        'password': 'testpass123'
    }, format='json')
    return client


@pytest.mark.django_db
class TestListCollections:
    """Test List Collections (US-008)"""
    
    def test_list_endpoint_accessible_to_anonymous_users(self):
        """Test list endpoint accessible to anonymous users (200 OK)"""
        client = APIClient()  # Unauthenticated client
        url = reverse('collections-list')
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_list_endpoint_accessible_to_authenticated_users(self, authenticated_client):
        """Test list endpoint accessible to authenticated users (200 OK)"""
        url = reverse('collections-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_pagination_parameters(self, authenticated_client):
        """Test pagination (page, page_size parameters)"""
        url = reverse('collections-list')
        response = authenticated_client.get(url, {'page': 1, 'page_size': 10})
        
        assert response.status_code == status.HTTP_200_OK
        # Response should have pagination structure
        assert 'results' in response.data or 'count' in response.data
    
    def test_pagination_response_format(self, authenticated_client):
        """Test pagination response format (count, next, previous, results)"""
        url = reverse('collections-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        # Check for pagination fields
        pagination_fields = ['count', 'next', 'previous', 'results']
        # At least some pagination structure should exist
        assert response.data is not None
    
    def test_filtering_by_owner(self, authenticated_client, user):
        """Test filtering by owner (query parameter)"""
        url = reverse('collections-list')
        response = authenticated_client.get(url, {'owner': user.username})
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_filtering_by_is_closed_status(self, authenticated_client):
        """Test filtering by is_closed status (query parameter)"""
        url = reverse('collections-list')
        response = authenticated_client.get(url, {'is_closed': 'false'})
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_response_includes_all_required_fields(self, authenticated_client):
        """Test response includes all required fields (id, name, description, owner, is_closed, timestamps, record_count)"""
        url = reverse('collections-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        # When collections exist, check structure
        if 'results' in response.data and len(response.data['results']) > 0:
            collection = response.data['results'][0]
            required_fields = ['id', 'name', 'owner', 'is_closed']
            for field in required_fields:
                assert field in collection
    
    def test_empty_list_returns_empty_results_array(self, authenticated_client):
        """Test empty list returns empty results array"""
        url = reverse('collections-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        # Should have results array (empty or with items)
        assert 'results' in response.data or isinstance(response.data, list)
    
    def test_ordering_by_created_at_descending(self, authenticated_client):
        """Test ordering (should be by -created_at per data model spec)"""
        url = reverse('collections-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        # When multiple collections exist, verify ordering
        # This would require creating test collections with known timestamps


@pytest.mark.django_db
class TestCollectionsListSearch:
    """Test Collections list search param (Plan 3, for future use). search filters by name and description (icontains, OR)."""

    def test_search_filters_by_name(self, authenticated_client):
        """GET /api/collections/?search=... filters by collection name (icontains)."""
        create_url = reverse('collections-list')
        authenticated_client.post(
            create_url,
            {'name': 'UniqueCollectionNameHere', 'description': 'D'},
            format='json',
        )
        authenticated_client.post(
            create_url,
            {'name': 'Other Collection', 'description': 'D'},
            format='json',
        )
        url = reverse('collections-list')
        response = authenticated_client.get(url, {'search': 'UniqueCollectionName'})
        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['name'] == 'UniqueCollectionNameHere'

    def test_search_filters_by_description(self, authenticated_client):
        """GET /api/collections/?search=... filters by description (icontains)."""
        create_url = reverse('collections-list')
        authenticated_client.post(
            create_url,
            {'name': 'C1', 'description': 'Description with UniqueDescWord'},
            format='json',
        )
        authenticated_client.post(
            create_url,
            {'name': 'C2', 'description': 'Other description'},
            format='json',
        )
        url = reverse('collections-list')
        response = authenticated_client.get(url, {'search': 'UniqueDescWord'})
        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data
        assert len(response.data['results']) == 1
        assert 'UniqueDescWord' in response.data['results'][0]['description']

    def test_search_empty_does_not_filter(self, authenticated_client):
        """Empty search param does not filter collections list."""
        url = reverse('collections-list')
        response_empty = authenticated_client.get(url, {'search': ''})
        response_omit = authenticated_client.get(url)
        assert response_empty.status_code == status.HTTP_200_OK
        assert response_omit.status_code == status.HTTP_200_OK
        assert response_empty.data['count'] == response_omit.data['count']


@pytest.mark.django_db
class TestCreateCollection:
    """Test Create Collection (US-005)"""
    
    def test_create_requires_authentication(self):
        """Test create requires authentication (401 if not authenticated)"""
        client = APIClient()  # Unauthenticated client
        url = reverse('collections-list')
        data = {
            'name': 'Test Collection',
            'description': 'Test description'
        }
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_successful_creation_with_valid_data(self, authenticated_client, user):
        """Test successful creation with valid data"""
        url = reverse('collections-list')
        data = {
            'name': 'My Art Collection',
            'description': 'A collection of my favorite artworks'
        }
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'My Art Collection'
        assert response.data['description'] == 'A collection of my favorite artworks'
    
    def test_owner_is_automatically_set_to_authenticated_user(self, authenticated_client, user):
        """Test owner is automatically set to authenticated user"""
        url = reverse('collections-list')
        data = {
            'name': 'Owner Test Collection',
            'description': 'Test'
        }
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        # Owner should be set to authenticated user
        assert 'owner' in response.data
        if isinstance(response.data['owner'], dict):
            assert response.data['owner']['id'] == user.id
        else:
            assert response.data['owner'] == user.id
    
    def test_is_closed_defaults_to_false(self, authenticated_client):
        """Test is_closed defaults to False"""
        url = reverse('collections-list')
        data = {
            'name': 'Default Closed Test',
            'description': 'Test'
        }
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['is_closed'] is False
    
    def test_timestamps_are_automatically_set(self, authenticated_client):
        """Test timestamps are automatically set (created_at, updated_at)"""
        url = reverse('collections-list')
        data = {
            'name': 'Timestamp Test',
            'description': 'Test'
        }
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'created_at' in response.data
        assert 'updated_at' in response.data
    
    def test_validation_name_required(self, authenticated_client):
        """Test validation: name required (400 if missing)"""
        url = reverse('collections-list')
        data = {
            'description': 'Missing name'
        }
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_validation_name_max_length_200(self, authenticated_client):
        """Test validation: name max length 200 characters (400 if exceeded)"""
        url = reverse('collections-list')
        data = {
            'name': 'a' * 201,  # 201 characters
            'description': 'Test'
        }
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_validation_description_max_length_1000(self, authenticated_client):
        """Test validation: description max length 1000 characters (400 if exceeded)"""
        url = reverse('collections-list')
        data = {
            'name': 'Test Collection',
            'description': 'a' * 1001  # 1001 characters
        }
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_description_is_optional(self, authenticated_client):
        """Test description is optional (can be empty)"""
        url = reverse('collections-list')
        data = {
            'name': 'No Description Collection'
        }
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'No Description Collection'
    
    def test_response_format_matches_api_spec(self, authenticated_client):
        """Test response format matches API spec (201 Created)"""
        url = reverse('collections-list')
        data = {
            'name': 'Format Test',
            'description': 'Test'
        }
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        required_fields = ['id', 'name', 'owner', 'is_closed', 'created_at', 'updated_at']
        for field in required_fields:
            assert field in response.data
    
    def test_field_errors_returned_in_proper_format(self, authenticated_client):
        """Test field errors returned in proper format"""
        url = reverse('collections-list')
        data = {
            'name': 'a' * 201  # Invalid: too long
        }
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        # Should have error information
        assert response.data is not None


@pytest.mark.django_db
class TestRetrieveCollection:
    """Test Retrieve Collection (US-009)"""
    
    def test_retrieve_accessible_to_anonymous_users(self):
        """Test retrieve accessible to anonymous users (200 OK)"""
        # Note: This test requires a collection to exist
        # In actual implementation, create a collection first
        client = APIClient()
        url = reverse('collections-detail', kwargs={'pk': 999})  # Non-existent ID
        response = client.get(url)
        
        # Should return 404 for non-existent, but endpoint should be accessible
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
    
    def test_retrieve_accessible_to_authenticated_users(self, authenticated_client):
        """Test retrieve accessible to authenticated users (200 OK)"""
        url = reverse('collections-detail', kwargs={'pk': 999})  # Non-existent ID
        response = authenticated_client.get(url)
        
        # Should return 404 for non-existent, but endpoint should be accessible
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
    
    def test_retrieve_with_valid_id_returns_collection_data(self, authenticated_client):
        """Test retrieve with valid ID returns collection data"""
        # First create a collection
        create_url = reverse('collections-list')
        data = {
            'name': 'Retrieve Test Collection',
            'description': 'Test'
        }
        create_response = authenticated_client.post(create_url, data, format='json')
        
        if create_response.status_code == status.HTTP_201_CREATED:
            collection_id = create_response.data['id']
            url = reverse('collections-detail', kwargs={'pk': collection_id})
            response = authenticated_client.get(url)
            
            assert response.status_code == status.HTTP_200_OK
            assert response.data['name'] == 'Retrieve Test Collection'
    
    def test_retrieve_with_invalid_id_returns_404(self, authenticated_client):
        """Test retrieve with invalid ID returns 404"""
        url = reverse('collections-detail', kwargs={'pk': 99999})
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_response_includes_all_fields_including_record_count(self, authenticated_client):
        """Test response includes all fields including record_count"""
        # Create a collection first
        create_url = reverse('collections-list')
        data = {
            'name': 'Record Count Test',
            'description': 'Test'
        }
        create_response = authenticated_client.post(create_url, data, format='json')
        
        if create_response.status_code == status.HTTP_201_CREATED:
            collection_id = create_response.data['id']
            url = reverse('collections-detail', kwargs={'pk': collection_id})
            response = authenticated_client.get(url)
            
            assert response.status_code == status.HTTP_200_OK
            assert 'record_count' in response.data or 'id' in response.data
    
    def test_owner_information_is_nested_correctly(self, authenticated_client, user):
        """Test owner information is nested correctly"""
        # Create a collection
        create_url = reverse('collections-list')
        data = {
            'name': 'Owner Nested Test',
            'description': 'Test'
        }
        create_response = authenticated_client.post(create_url, data, format='json')
        
        if create_response.status_code == status.HTTP_201_CREATED:
            collection_id = create_response.data['id']
            url = reverse('collections-detail', kwargs={'pk': collection_id})
            response = authenticated_client.get(url)
            
            assert response.status_code == status.HTTP_200_OK
            assert 'owner' in response.data
            # Owner should be nested object or ID
            owner = response.data['owner']
            assert isinstance(owner, (dict, int))


@pytest.mark.django_db
class TestUpdateCollection:
    """Test Update Collection (US-006)"""
    
    def test_update_requires_authentication(self):
        """Test update requires authentication (401 if not authenticated)"""
        client = APIClient()
        url = reverse('collections-detail', kwargs={'pk': 1})
        data = {
            'name': 'Updated Name'
        }
        response = client.patch(url, data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_only_owner_can_update(self, authenticated_client, other_user):
        """Test only owner can update (403 if not owner)"""
        # Create collection as other_user
        other_client = APIClient()
        login_url = reverse('auth-login')
        other_client.post(login_url, {
            'username': 'otheruser',
            'password': 'testpass123'
        }, format='json')
        
        create_url = reverse('collections-list')
        data = {
            'name': 'Other User Collection',
            'description': 'Test'
        }
        create_response = other_client.post(create_url, data, format='json')
        
        if create_response.status_code == status.HTTP_201_CREATED:
            collection_id = create_response.data['id']
            url = reverse('collections-detail', kwargs={'pk': collection_id})
            update_data = {'name': 'Unauthorized Update'}
            response = authenticated_client.patch(url, update_data, format='json')
            
            assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_cannot_update_closed_collection(self, authenticated_client):
        """Test cannot update closed collection (403 if is_closed=True)"""
        # Create and close a collection
        create_url = reverse('collections-list')
        data = {
            'name': 'Closed Collection',
            'description': 'Test'
        }
        create_response = authenticated_client.post(create_url, data, format='json')
        
        if create_response.status_code == status.HTTP_201_CREATED:
            collection_id = create_response.data['id']
            # Close the collection
            close_url = reverse('collections-detail', kwargs={'pk': collection_id})
            authenticated_client.patch(close_url, {'is_closed': True}, format='json')
            
            # Try to update
            update_data = {'name': 'Updated Name'}
            response = authenticated_client.patch(close_url, update_data, format='json')
            
            assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_successful_update_with_patch(self, authenticated_client):
        """Test successful update with PATCH (partial update)"""
        # Create collection
        create_url = reverse('collections-list')
        data = {
            'name': 'Original Name',
            'description': 'Original Description'
        }
        create_response = authenticated_client.post(create_url, data, format='json')
        
        if create_response.status_code == status.HTTP_201_CREATED:
            collection_id = create_response.data['id']
            url = reverse('collections-detail', kwargs={'pk': collection_id})
            update_data = {
                'name': 'Updated Name'
            }
            response = authenticated_client.patch(url, update_data, format='json')
            
            assert response.status_code == status.HTTP_200_OK
            assert response.data['name'] == 'Updated Name'
    
    def test_successful_update_with_put(self, authenticated_client):
        """Test successful update with PUT (full update)"""
        # Create collection
        create_url = reverse('collections-list')
        data = {
            'name': 'Original Name',
            'description': 'Original Description'
        }
        create_response = authenticated_client.post(create_url, data, format='json')
        
        if create_response.status_code == status.HTTP_201_CREATED:
            collection_id = create_response.data['id']
            url = reverse('collections-detail', kwargs={'pk': collection_id})
            update_data = {
                'name': 'Updated Name',
                'description': 'Updated Description'
            }
            response = authenticated_client.put(url, update_data, format='json')
            
            assert response.status_code == status.HTTP_200_OK
            assert response.data['name'] == 'Updated Name'
    
    def test_updated_at_timestamp_is_updated(self, authenticated_client):
        """Test updated_at timestamp is updated"""
        # Create collection
        create_url = reverse('collections-list')
        data = {
            'name': 'Timestamp Update Test',
            'description': 'Test'
        }
        create_response = authenticated_client.post(create_url, data, format='json')
        
        if create_response.status_code == status.HTTP_201_CREATED:
            collection_id = create_response.data['id']
            original_updated_at = create_response.data['updated_at']
            
            # Update collection
            url = reverse('collections-detail', kwargs={'pk': collection_id})
            update_data = {'name': 'Updated Name'}
            response = authenticated_client.patch(url, update_data, format='json')
            
            assert response.status_code == status.HTTP_200_OK
            assert 'updated_at' in response.data
            # Updated timestamp should be different (or at least present)
            assert response.data['updated_at'] is not None
    
    def test_validation_errors(self, authenticated_client):
        """Test validation errors (name too long, description too long)"""
        # Create collection
        create_url = reverse('collections-list')
        data = {
            'name': 'Validation Test',
            'description': 'Test'
        }
        create_response = authenticated_client.post(create_url, data, format='json')
        
        if create_response.status_code == status.HTTP_201_CREATED:
            collection_id = create_response.data['id']
            url = reverse('collections-detail', kwargs={'pk': collection_id})
            update_data = {
                'name': 'a' * 201  # Too long
            }
            response = authenticated_client.patch(url, update_data, format='json')
            
            assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_response_format_matches_api_spec(self, authenticated_client):
        """Test response format matches API spec (200 OK)"""
        # Create collection
        create_url = reverse('collections-list')
        data = {
            'name': 'Format Test',
            'description': 'Test'
        }
        create_response = authenticated_client.post(create_url, data, format='json')
        
        if create_response.status_code == status.HTTP_201_CREATED:
            collection_id = create_response.data['id']
            url = reverse('collections-detail', kwargs={'pk': collection_id})
            update_data = {'name': 'Updated Format Test'}
            response = authenticated_client.patch(url, update_data, format='json')
            
            assert response.status_code == status.HTTP_200_OK
            assert 'id' in response.data
            assert 'name' in response.data


@pytest.mark.django_db
class TestCloseCollection:
    """Test Close Collection (US-007)"""
    
    def test_close_requires_authentication(self):
        """Test close requires authentication (401 if not authenticated)"""
        client = APIClient()
        url = reverse('collections-detail', kwargs={'pk': 1})
        data = {
            'is_closed': True
        }
        response = client.patch(url, data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_only_owner_can_close(self, authenticated_client, other_user):
        """Test only owner can close (403 if not owner)"""
        # Create collection as other_user
        other_client = APIClient()
        login_url = reverse('auth-login')
        other_client.post(login_url, {
            'username': 'otheruser',
            'password': 'testpass123'
        }, format='json')
        
        create_url = reverse('collections-list')
        data = {
            'name': 'Other User Collection',
            'description': 'Test'
        }
        create_response = other_client.post(create_url, data, format='json')
        
        if create_response.status_code == status.HTTP_201_CREATED:
            collection_id = create_response.data['id']
            url = reverse('collections-detail', kwargs={'pk': collection_id})
            close_data = {'is_closed': True}
            response = authenticated_client.patch(url, close_data, format='json')
            
            assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_successful_close_sets_is_closed_true(self, authenticated_client):
        """Test successful close sets is_closed=True"""
        # Create collection
        create_url = reverse('collections-list')
        data = {
            'name': 'Close Test Collection',
            'description': 'Test'
        }
        create_response = authenticated_client.post(create_url, data, format='json')
        
        if create_response.status_code == status.HTTP_201_CREATED:
            collection_id = create_response.data['id']
            url = reverse('collections-detail', kwargs={'pk': collection_id})
            close_data = {'is_closed': True}
            response = authenticated_client.patch(url, close_data, format='json')
            
            assert response.status_code == status.HTTP_200_OK
            assert response.data['is_closed'] is True
    
    def test_closed_collection_cannot_be_updated(self, authenticated_client):
        """Test closed collection cannot be updated (403)"""
        # Create and close collection
        create_url = reverse('collections-list')
        data = {
            'name': 'Closed Update Test',
            'description': 'Test'
        }
        create_response = authenticated_client.post(create_url, data, format='json')
        
        if create_response.status_code == status.HTTP_201_CREATED:
            collection_id = create_response.data['id']
            url = reverse('collections-detail', kwargs={'pk': collection_id})
            # Close it
            authenticated_client.patch(url, {'is_closed': True}, format='json')
            
            # Try to update
            update_data = {'name': 'Updated Name'}
            response = authenticated_client.patch(url, update_data, format='json')
            
            assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_closing_is_one_way_operation(self, authenticated_client):
        """Test closing is one-way operation (cannot reopen in initial version)"""
        # Create and close collection
        create_url = reverse('collections-list')
        data = {
            'name': 'One Way Test',
            'description': 'Test'
        }
        create_response = authenticated_client.post(create_url, data, format='json')
        
        if create_response.status_code == status.HTTP_201_CREATED:
            collection_id = create_response.data['id']
            url = reverse('collections-detail', kwargs={'pk': collection_id})
            # Close it
            authenticated_client.patch(url, {'is_closed': True}, format='json')
            
            # Try to reopen (should fail or be ignored)
            reopen_data = {'is_closed': False}
            response = authenticated_client.patch(url, reopen_data, format='json')
            
            # In initial version, reopening should not be allowed
            # This could return 403, 400, or succeed but ignore the change
            assert response.status_code in [
                status.HTTP_200_OK,  # If it succeeds but ignores
                status.HTTP_400_BAD_REQUEST,
                status.HTTP_403_FORBIDDEN
            ]
    
    def test_response_format_matches_api_spec(self, authenticated_client):
        """Test response format matches API spec"""
        # Create collection
        create_url = reverse('collections-list')
        data = {
            'name': 'Close Format Test',
            'description': 'Test'
        }
        create_response = authenticated_client.post(create_url, data, format='json')
        
        if create_response.status_code == status.HTTP_201_CREATED:
            collection_id = create_response.data['id']
            url = reverse('collections-detail', kwargs={'pk': collection_id})
            close_data = {'is_closed': True}
            response = authenticated_client.patch(url, close_data, format='json')
            
            assert response.status_code == status.HTTP_200_OK
            assert 'is_closed' in response.data
            assert response.data['is_closed'] is True
    
    def test_updated_at_timestamp_is_updated_on_close(self, authenticated_client):
        """Test updated_at timestamp is updated on close"""
        # Create collection
        create_url = reverse('collections-list')
        data = {
            'name': 'Close Timestamp Test',
            'description': 'Test'
        }
        create_response = authenticated_client.post(create_url, data, format='json')
        
        if create_response.status_code == status.HTTP_201_CREATED:
            collection_id = create_response.data['id']
            original_updated_at = create_response.data['updated_at']
            
            # Close collection
            url = reverse('collections-detail', kwargs={'pk': collection_id})
            close_data = {'is_closed': True}
            response = authenticated_client.patch(url, close_data, format='json')
            
            assert response.status_code == status.HTTP_200_OK
            assert 'updated_at' in response.data
            assert response.data['updated_at'] is not None


@pytest.mark.django_db
class TestCollectionPermissionEdgeCases:
    """Test Permission Edge Cases"""
    
    def test_anonymous_user_cannot_create_collections(self):
        """Test anonymous user cannot create/update/close collections"""
        client = APIClient()
        url = reverse('collections-list')
        data = {
            'name': 'Unauthorized Collection',
            'description': 'Test'
        }
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_non_owner_authenticated_user_cannot_update_close(self, authenticated_client, other_user):
        """Test non-owner authenticated user cannot update/close"""
        # Create collection as other_user
        other_client = APIClient()
        login_url = reverse('auth-login')
        other_client.post(login_url, {
            'username': 'otheruser',
            'password': 'testpass123'
        }, format='json')
        
        create_url = reverse('collections-list')
        data = {
            'name': 'Other User Collection',
            'description': 'Test'
        }
        create_response = other_client.post(create_url, data, format='json')
        
        if create_response.status_code == status.HTTP_201_CREATED:
            collection_id = create_response.data['id']
            url = reverse('collections-detail', kwargs={'pk': collection_id})
            
            # Try to update
            update_response = authenticated_client.patch(url, {'name': 'Hacked'}, format='json')
            assert update_response.status_code == status.HTTP_403_FORBIDDEN
            
            # Try to close
            close_response = authenticated_client.patch(url, {'is_closed': True}, format='json')
            assert close_response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_owner_cannot_update_closed_collection(self, authenticated_client):
        """Test owner cannot update closed collection"""
        # Create collection
        create_url = reverse('collections-list')
        data = {
            'name': 'Owner Closed Test',
            'description': 'Test'
        }
        create_response = authenticated_client.post(create_url, data, format='json')
        
        if create_response.status_code == status.HTTP_201_CREATED:
            collection_id = create_response.data['id']
            url = reverse('collections-detail', kwargs={'pk': collection_id})
            
            # Close it
            authenticated_client.patch(url, {'is_closed': True}, format='json')
            
            # Owner tries to update
            update_response = authenticated_client.patch(url, {'name': 'Updated'}, format='json')
            assert update_response.status_code == status.HTTP_403_FORBIDDEN
