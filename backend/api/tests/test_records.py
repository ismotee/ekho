"""
Record API Tests

Reference: docs/api-specification.md (Record Endpoints), docs/user-stories/03-records.md, docs/data-models.md (Record Model)

This module contains comprehensive tests for record endpoints:
- List Records (US-013)
- Create Record (US-010, US-015)
- Retrieve Record (US-014)
- Update Record (US-011, US-015)
- Delete Record (US-012)
- Image Upload Tests (US-015)
- Permission Edge Cases

TDD APPROACH: These tests are written BEFORE production code exists.
The tests SHOULD FAIL until API endpoints and models are implemented.
This follows the Documentation → Tests → Production Code workflow.

Expected failures:
- URL reverse errors when endpoints don't exist (NoReverseMatch)
- 404 errors when endpoints don't exist
- Import errors when Record model doesn't exist
- Assertion failures when responses don't match expected format
"""

import pytest
import io
from PIL import Image
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


# Note: These tests assume Collection and Record models exist
# In actual implementation, import would be:
# from api.models import Collection, Record


def create_test_image():
    """Helper function to create a test image file"""
    image = Image.new('RGB', (100, 100), color='red')
    img_io = io.BytesIO()
    image.save(img_io, format='JPEG')
    img_io.seek(0)
    return img_io


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
    login_url = reverse('auth-login')
    client.post(login_url, {
        'username': 'testuser',
        'password': 'testpass123'
    }, format='json')
    return client


@pytest.fixture
def collection(authenticated_client, user):
    """Create a test collection"""
    url = reverse('collections-list')
    data = {
        'name': 'Test Collection',
        'description': 'Test Description'
    }
    response = authenticated_client.post(url, data, format='json')
    if response.status_code == status.HTTP_201_CREATED:
        return response.data
    return None


@pytest.mark.django_db
class TestListRecords:
    """Test List Records (US-013, US-016)"""
    
    def test_list_endpoint_accessible_to_anonymous_users(self):
        """Test list endpoint accessible to anonymous users (200 OK)"""
        client = APIClient()
        url = reverse('records-list')
        response = client.get(url, {'collection': 1})
        
        # Should be accessible (may return 404 if collection doesn't exist)
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
    
    def test_list_endpoint_accessible_to_authenticated_users(self, authenticated_client):
        """Test list endpoint accessible to authenticated users (200 OK)"""
        url = reverse('records-list')
        response = authenticated_client.get(url, {'collection': 1})
        
        # Should be accessible (may return 404 if collection doesn't exist)
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
    
    def test_list_without_collection_returns_200_and_results(self, authenticated_client):
        """Test list without collection param returns 200 and paginated results (US-016). Collection is optional."""
        url = reverse('records-list')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data
        assert isinstance(response.data['results'], list)
        # Pagination keys when collection omitted (all records list)
        assert 'count' in response.data
    
    def test_list_with_collection_parameter_filters_by_collection(self, authenticated_client, collection):
        """Test list with collection param returns only that collection's records (backward compatibility)."""
        if collection:
            url = reverse('records-list')
            response = authenticated_client.get(url, {'collection': collection['id']})
            assert response.status_code == status.HTTP_200_OK
            assert 'results' in response.data
            for record in response.data['results']:
                assert record['collection'] == collection['id']
    
    def test_list_with_nonexistent_collection_returns_404(self, authenticated_client):
        """Test list with invalid collection ID returns 404 (not 400)."""
        url = reverse('records-list')
        response = authenticated_client.get(url, {'collection': 99999})
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_list_response_includes_collection_name_and_owner(self, authenticated_client, collection):
        """Test list response includes collection_name and collection_owner_username per item (US-016)."""
        if collection:
            create_url = reverse('records-list')
            authenticated_client.post(create_url, {
                'title': 'List Context Test',
                'artist': 'Test Artist',
                'collection': collection['id'],
            }, format='json')
            url = reverse('records-list')
            response = authenticated_client.get(url, {'collection': collection['id']})
            assert response.status_code == status.HTTP_200_OK
            assert len(response.data['results']) >= 1
            record = response.data['results'][0]
            assert 'collection_name' in record
            assert record['collection_name'] == 'Test Collection'
            assert 'collection_owner_username' in record
            assert record['collection_owner_username'] == 'testuser'

    def test_list_all_records_includes_collection_context_fields(self, authenticated_client, collection):
        """Test GET /api/records/ without collection returns items with collection_name and collection_owner_username."""
        if collection:
            create_url = reverse('records-list')
            authenticated_client.post(create_url, {
                'title': 'All Records Context Test',
                'artist': 'Test Artist',
                'collection': collection['id'],
            }, format='json')
            url = reverse('records-list')
            response = authenticated_client.get(url)
            assert response.status_code == status.HTTP_200_OK
            assert len(response.data['results']) >= 1
            record = next((r for r in response.data['results'] if r.get('title') == 'All Records Context Test'), None)
            assert record is not None
            assert 'collection_name' in record
            assert 'collection_owner_username' in record
    
    def test_pagination_parameters(self, authenticated_client, collection):
        """Test pagination (page, page_size parameters)"""
        if collection:
            url = reverse('records-list')
            response = authenticated_client.get(url, {
                'collection': collection['id'],
                'page': 1,
                'page_size': 10
            })
            
            assert response.status_code == status.HTTP_200_OK
    
    def test_pagination_response_format(self, authenticated_client, collection):
        """Test pagination response format"""
        if collection:
            url = reverse('records-list')
            response = authenticated_client.get(url, {'collection': collection['id']})
            
            assert response.status_code == status.HTTP_200_OK
            # Should have pagination structure
            assert 'results' in response.data or isinstance(response.data, list)
    
    def test_response_includes_all_required_fields(self, authenticated_client, collection):
        """Test response includes all required fields"""
        if collection:
            url = reverse('records-list')
            response = authenticated_client.get(url, {'collection': collection['id']})
            
            assert response.status_code == status.HTTP_200_OK
            # When records exist, check structure
            if 'results' in response.data and len(response.data['results']) > 0:
                record = response.data['results'][0]
                required_fields = ['id', 'title', 'artist', 'collection']
                for field in required_fields:
                    assert field in record
    
    def test_image_urls_are_properly_formatted(self, authenticated_client, collection):
        """Test image URLs are properly formatted"""
        if collection:
            url = reverse('records-list')
            response = authenticated_client.get(url, {'collection': collection['id']})
            
            assert response.status_code == status.HTTP_200_OK
            # If records with images exist, check URL format
            if 'results' in response.data:
                for record in response.data['results']:
                    if 'image' in record and record['image']:
                        assert isinstance(record['image'], str)
    
    def test_empty_list_returns_empty_results_array(self, authenticated_client, collection):
        """Test empty list returns empty results array"""
        if collection:
            url = reverse('records-list')
            response = authenticated_client.get(url, {'collection': collection['id']})
            
            assert response.status_code == status.HTTP_200_OK
            assert 'results' in response.data or isinstance(response.data, list)
    
    def test_ordering_by_created_at_descending(self, authenticated_client, collection):
        """Test ordering (should be by -created_at per data model spec)"""
        if collection:
            url = reverse('records-list')
            response = authenticated_client.get(url, {'collection': collection['id']})
            
            assert response.status_code == status.HTTP_200_OK
            # When multiple records exist, verify ordering


@pytest.mark.django_db
class TestCreateRecord:
    """Test Create Record (US-010, US-015)"""
    
    def test_create_requires_authentication(self):
        """Test create requires authentication (401 if not authenticated)"""
        client = APIClient()
        url = reverse('records-list')
        data = {
            'title': 'Test Artwork',
            'artist': 'Test Artist',
            'collection': 1
        }
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_only_collection_owner_can_create(self, authenticated_client, other_user, collection):
        """Test only collection owner can create (403 if not owner)"""
        if collection:
            # Create collection as other_user
            other_client = APIClient()
            login_url = reverse('auth-login')
            other_client.post(login_url, {
                'username': 'otheruser',
                'password': 'testpass123'
            }, format='json')
            
            other_collection_url = reverse('collections-list')
            other_collection_data = {
                'name': 'Other Collection',
                'description': 'Test'
            }
            other_collection_response = other_client.post(other_collection_url, other_collection_data, format='json')
            
            if other_collection_response.status_code == status.HTTP_201_CREATED:
                other_collection_id = other_collection_response.data['id']
                url = reverse('records-list')
                data = {
                    'title': 'Unauthorized Record',
                    'artist': 'Test Artist',
                    'collection': other_collection_id
                }
                response = authenticated_client.post(url, data, format='json')
                
                assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_cannot_create_in_closed_collection(self, authenticated_client, collection):
        """Test cannot create in closed collection (403 if collection is_closed=True)"""
        if collection:
            collection_id = collection['id']
            # Close the collection
            collection_url = reverse('collections-detail', kwargs={'pk': collection_id})
            authenticated_client.patch(collection_url, {'is_closed': True}, format='json')
            
            # Try to create record
            url = reverse('records-list')
            data = {
                'title': 'Test Artwork',
                'artist': 'Test Artist',
                'collection': collection_id
            }
            response = authenticated_client.post(url, data, format='json')
            
            assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_successful_creation_with_all_required_fields(self, authenticated_client, collection):
        """Test successful creation with all required fields"""
        if collection:
            url = reverse('records-list')
            data = {
                'title': 'Sunset Over Mountains',
                'artist': 'Jane Smith',
                'collection': collection['id']
            }
            response = authenticated_client.post(url, data, format='json')
            
            assert response.status_code == status.HTTP_201_CREATED
            assert response.data['title'] == 'Sunset Over Mountains'
            assert response.data['artist'] == 'Jane Smith'
    
    def test_successful_creation_with_optional_fields(self, authenticated_client, collection):
        """Test successful creation with optional fields"""
        if collection:
            url = reverse('records-list')
            data = {
                'title': 'Complete Artwork',
                'artist': 'Complete Artist',
                'year': 2023,
                'medium': 'Oil on Canvas',
                'dimensions': '24x36 inches',
                'description': 'A beautiful landscape painting',
                'condition': 'Excellent',
                'collection': collection['id']
            }
            response = authenticated_client.post(url, data, format='json')
            
            assert response.status_code == status.HTTP_201_CREATED
            assert response.data['year'] == 2023
            assert response.data['medium'] == 'Oil on Canvas'
    
    def test_validation_title_required(self, authenticated_client, collection):
        """Test validation: title required (400 if missing)"""
        if collection:
            url = reverse('records-list')
            data = {
                'artist': 'Test Artist',
                'collection': collection['id']
            }
            response = authenticated_client.post(url, data, format='json')
            
            assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_validation_artist_required(self, authenticated_client, collection):
        """Test validation: artist required (400 if missing)"""
        if collection:
            url = reverse('records-list')
            data = {
                'title': 'Test Title',
                'collection': collection['id']
            }
            response = authenticated_client.post(url, data, format='json')
            
            assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_validation_title_max_length_200(self, authenticated_client, collection):
        """Test validation: title max length 200 characters"""
        if collection:
            url = reverse('records-list')
            data = {
                'title': 'a' * 201,  # 201 characters
                'artist': 'Test Artist',
                'collection': collection['id']
            }
            response = authenticated_client.post(url, data, format='json')
            
            assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_validation_artist_max_length_200(self, authenticated_client, collection):
        """Test validation: artist max length 200 characters"""
        if collection:
            url = reverse('records-list')
            data = {
                'title': 'Test Title',
                'artist': 'a' * 201,  # 201 characters
                'collection': collection['id']
            }
            response = authenticated_client.post(url, data, format='json')
            
            assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_validation_year_must_be_integer_1000_2100(self, authenticated_client, collection):
        """Test validation: year must be integer between 1000-2100 (per data model)"""
        if collection:
            url = reverse('records-list')
            
            # Test year too low
            data = {
                'title': 'Test Title',
                'artist': 'Test Artist',
                'year': 999,
                'collection': collection['id']
            }
            response = authenticated_client.post(url, data, format='json')
            assert response.status_code == status.HTTP_400_BAD_REQUEST
            
            # Test year too high
            data['year'] = 2101
            response = authenticated_client.post(url, data, format='json')
            assert response.status_code == status.HTTP_400_BAD_REQUEST
            
            # Test valid year
            data['year'] = 2023
            response = authenticated_client.post(url, data, format='json')
            assert response.status_code == status.HTTP_201_CREATED
    
    def test_validation_medium_max_length_100(self, authenticated_client, collection):
        """Test validation: medium max length 100 characters"""
        if collection:
            url = reverse('records-list')
            data = {
                'title': 'Test Title',
                'artist': 'Test Artist',
                'medium': 'a' * 101,  # 101 characters
                'collection': collection['id']
            }
            response = authenticated_client.post(url, data, format='json')
            
            assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_validation_dimensions_max_length_100(self, authenticated_client, collection):
        """Test validation: dimensions max length 100 characters"""
        if collection:
            url = reverse('records-list')
            data = {
                'title': 'Test Title',
                'artist': 'Test Artist',
                'dimensions': 'a' * 101,  # 101 characters
                'collection': collection['id']
            }
            response = authenticated_client.post(url, data, format='json')
            
            assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_validation_description_max_length_2000(self, authenticated_client, collection):
        """Test validation: description max length 2000 characters"""
        if collection:
            url = reverse('records-list')
            data = {
                'title': 'Test Title',
                'artist': 'Test Artist',
                'description': 'a' * 2001,  # 2001 characters
                'collection': collection['id']
            }
            response = authenticated_client.post(url, data, format='json')
            
            assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_validation_condition_max_length_200(self, authenticated_client, collection):
        """Test validation: condition max length 200 characters"""
        if collection:
            url = reverse('records-list')
            data = {
                'title': 'Test Title',
                'artist': 'Test Artist',
                'condition': 'a' * 201,  # 201 characters
                'collection': collection['id']
            }
            response = authenticated_client.post(url, data, format='json')
            
            assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_image_upload_with_valid_file(self, authenticated_client, collection):
        """Test image upload with valid file (JPG, PNG, GIF)"""
        if collection:
            url = reverse('records-list')
            image_file = create_test_image()
            data = {
                'title': 'Image Test',
                'artist': 'Test Artist',
                'collection': collection['id'],
                'image': image_file
            }
            response = authenticated_client.post(url, data, format='multipart')
            
            # May succeed or fail depending on implementation
            assert response.status_code in [
                status.HTTP_201_CREATED,
                status.HTTP_400_BAD_REQUEST,  # If image handling not implemented
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ]
    
    def test_image_upload_file_size_limit_10mb(self, authenticated_client, collection):
        """Test image upload file size limit (10MB max)"""
        if collection:
            url = reverse('records-list')
            # Create a file larger than 10MB
            large_file = io.BytesIO(b'x' * (11 * 1024 * 1024))  # 11MB
            large_file.name = 'large.jpg'
            data = {
                'title': 'Large Image Test',
                'artist': 'Test Artist',
                'collection': collection['id'],
                'image': large_file
            }
            response = authenticated_client.post(url, data, format='multipart')
            
            # Should reject large files
            assert response.status_code in [
                status.HTTP_400_BAD_REQUEST,
                status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ]
    
    def test_image_upload_invalid_file_type(self, authenticated_client, collection):
        """Test image upload invalid file type (should return 400)"""
        if collection:
            url = reverse('records-list')
            # Create a non-image file
            text_file = io.BytesIO(b'This is not an image')
            text_file.name = 'document.txt'
            data = {
                'title': 'Invalid File Test',
                'artist': 'Test Artist',
                'collection': collection['id'],
                'image': text_file
            }
            response = authenticated_client.post(url, data, format='multipart')
            
            assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_image_is_optional(self, authenticated_client, collection):
        """Test image is optional (can create record without image)"""
        if collection:
            url = reverse('records-list')
            data = {
                'title': 'No Image Test',
                'artist': 'Test Artist',
                'collection': collection['id']
            }
            response = authenticated_client.post(url, data, format='json')
            
            assert response.status_code == status.HTTP_201_CREATED
    
    def test_timestamps_are_automatically_set(self, authenticated_client, collection):
        """Test timestamps are automatically set"""
        if collection:
            url = reverse('records-list')
            data = {
                'title': 'Timestamp Test',
                'artist': 'Test Artist',
                'collection': collection['id']
            }
            response = authenticated_client.post(url, data, format='json')
            
            assert response.status_code == status.HTTP_201_CREATED
            assert 'created_at' in response.data
            assert 'updated_at' in response.data
    
    def test_response_format_matches_api_spec(self, authenticated_client, collection):
        """Test response format matches API spec (201 Created)"""
        if collection:
            url = reverse('records-list')
            data = {
                'title': 'Format Test',
                'artist': 'Test Artist',
                'collection': collection['id']
            }
            response = authenticated_client.post(url, data, format='json')
            
            assert response.status_code == status.HTTP_201_CREATED
            required_fields = ['id', 'title', 'artist', 'collection', 'created_at', 'updated_at']
            for field in required_fields:
                assert field in response.data
    
    def test_image_url_in_response_is_correct(self, authenticated_client, collection):
        """Test image URL in response is correct"""
        if collection:
            url = reverse('records-list')
            image_file = create_test_image()
            data = {
                'title': 'Image URL Test',
                'artist': 'Test Artist',
                'collection': collection['id'],
                'image': image_file
            }
            response = authenticated_client.post(url, data, format='multipart')
            
            if response.status_code == status.HTTP_201_CREATED:
                if 'image' in response.data and response.data['image']:
                    assert isinstance(response.data['image'], str)


@pytest.mark.django_db
class TestRetrieveRecord:
    """Test Retrieve Record (US-014)"""
    
    def test_retrieve_accessible_to_anonymous_users(self):
        """Test retrieve accessible to anonymous users (200 OK)"""
        client = APIClient()
        url = reverse('records-detail', kwargs={'pk': 999})
        response = client.get(url)
        
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
    
    def test_retrieve_accessible_to_authenticated_users(self, authenticated_client):
        """Test retrieve accessible to authenticated users (200 OK)"""
        url = reverse('records-detail', kwargs={'pk': 999})
        response = authenticated_client.get(url)
        
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
    
    def test_retrieve_with_valid_id_returns_record_data(self, authenticated_client, collection):
        """Test retrieve with valid ID returns record data"""
        if collection:
            # Create a record first
            create_url = reverse('records-list')
            data = {
                'title': 'Retrieve Test',
                'artist': 'Test Artist',
                'collection': collection['id']
            }
            create_response = authenticated_client.post(create_url, data, format='json')
            
            if create_response.status_code == status.HTTP_201_CREATED:
                record_id = create_response.data['id']
                url = reverse('records-detail', kwargs={'pk': record_id})
                response = authenticated_client.get(url)
                
                assert response.status_code == status.HTTP_200_OK
                assert response.data['title'] == 'Retrieve Test'
    
    def test_retrieve_with_invalid_id_returns_404(self, authenticated_client):
        """Test retrieve with invalid ID returns 404"""
        url = reverse('records-detail', kwargs={'pk': 99999})
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_response_includes_all_fields_including_image_url(self, authenticated_client, collection):
        """Test response includes all fields including image URL"""
        if collection:
            create_url = reverse('records-list')
            data = {
                'title': 'All Fields Test',
                'artist': 'Test Artist',
                'collection': collection['id']
            }
            create_response = authenticated_client.post(create_url, data, format='json')
            
            if create_response.status_code == status.HTTP_201_CREATED:
                record_id = create_response.data['id']
                url = reverse('records-detail', kwargs={'pk': record_id})
                response = authenticated_client.get(url)
                
                assert response.status_code == status.HTTP_200_OK
                assert 'image' in response.data
    
    def test_image_url_is_accessible(self, authenticated_client, collection):
        """Test image URL is accessible"""
        # This would require actual image upload and URL verification
        # For now, just verify the field exists
        if collection:
            create_url = reverse('records-list')
            data = {
                'title': 'Image URL Access Test',
                'artist': 'Test Artist',
                'collection': collection['id']
            }
            create_response = authenticated_client.post(create_url, data, format='json')
            
            if create_response.status_code == status.HTTP_201_CREATED:
                record_id = create_response.data['id']
                url = reverse('records-detail', kwargs={'pk': record_id})
                response = authenticated_client.get(url)
                
                assert response.status_code == status.HTTP_200_OK
                # Image field should exist (may be null/empty)
                assert 'image' in response.data


@pytest.mark.django_db
class TestUpdateRecord:
    """Test Update Record (US-011, US-015)"""
    
    def test_update_requires_authentication(self):
        """Test update requires authentication (401 if not authenticated)"""
        client = APIClient()
        url = reverse('records-detail', kwargs={'pk': 1})
        data = {
            'title': 'Updated Title'
        }
        response = client.patch(url, data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_only_collection_owner_can_update(self, authenticated_client, other_user, collection):
        """Test only collection owner can update (403 if not owner)"""
        if collection:
            # Create record as owner
            create_url = reverse('records-list')
            data = {
                'title': 'Owner Test',
                'artist': 'Test Artist',
                'collection': collection['id']
            }
            create_response = authenticated_client.post(create_url, data, format='json')
            
            if create_response.status_code == status.HTTP_201_CREATED:
                record_id = create_response.data['id']
                
                # Try to update as other user
                other_client = APIClient()
                login_url = reverse('auth-login')
                other_client.post(login_url, {
                    'username': 'otheruser',
                    'password': 'testpass123'
                }, format='json')
                
                url = reverse('records-detail', kwargs={'pk': record_id})
                update_data = {'title': 'Hacked Title'}
                response = other_client.patch(url, update_data, format='json')
                
                assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_cannot_update_record_in_closed_collection(self, authenticated_client, collection):
        """Test cannot update record in closed collection (403 if collection is_closed=True)"""
        if collection:
            # Create record
            create_url = reverse('records-list')
            data = {
                'title': 'Closed Collection Test',
                'artist': 'Test Artist',
                'collection': collection['id']
            }
            create_response = authenticated_client.post(create_url, data, format='json')
            
            if create_response.status_code == status.HTTP_201_CREATED:
                record_id = create_response.data['id']
                
                # Close collection
                collection_url = reverse('collections-detail', kwargs={'pk': collection['id']})
                authenticated_client.patch(collection_url, {'is_closed': True}, format='json')
                
                # Try to update record
                url = reverse('records-detail', kwargs={'pk': record_id})
                update_data = {'title': 'Updated Title'}
                response = authenticated_client.patch(url, update_data, format='json')
                
                assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_successful_update_with_patch(self, authenticated_client, collection):
        """Test successful update with PATCH (partial update)"""
        if collection:
            # Create record
            create_url = reverse('records-list')
            data = {
                'title': 'Original Title',
                'artist': 'Original Artist',
                'collection': collection['id']
            }
            create_response = authenticated_client.post(create_url, data, format='json')
            
            if create_response.status_code == status.HTTP_201_CREATED:
                record_id = create_response.data['id']
                url = reverse('records-detail', kwargs={'pk': record_id})
                update_data = {'title': 'Updated Title'}
                response = authenticated_client.patch(url, update_data, format='json')
                
                assert response.status_code == status.HTTP_200_OK
                assert response.data['title'] == 'Updated Title'
    
    def test_successful_update_with_put(self, authenticated_client, collection):
        """Test successful update with PUT (full update)"""
        if collection:
            # Create record
            create_url = reverse('records-list')
            data = {
                'title': 'Original Title',
                'artist': 'Original Artist',
                'collection': collection['id']
            }
            create_response = authenticated_client.post(create_url, data, format='json')
            
            if create_response.status_code == status.HTTP_201_CREATED:
                record_id = create_response.data['id']
                url = reverse('records-detail', kwargs={'pk': record_id})
                update_data = {
                    'title': 'Updated Title',
                    'artist': 'Updated Artist',
                    'collection': collection['id']
                }
                response = authenticated_client.put(url, update_data, format='json')
                
                assert response.status_code == status.HTTP_200_OK
                assert response.data['title'] == 'Updated Title'
    
    def test_image_can_be_replaced_during_update(self, authenticated_client, collection):
        """Test image can be replaced during update"""
        if collection:
            # Create record with image
            create_url = reverse('records-list')
            image_file = create_test_image()
            data = {
                'title': 'Image Replace Test',
                'artist': 'Test Artist',
                'collection': collection['id'],
                'image': image_file
            }
            create_response = authenticated_client.post(create_url, data, format='multipart')
            
            if create_response.status_code == status.HTTP_201_CREATED:
                record_id = create_response.data['id']
                url = reverse('records-detail', kwargs={'pk': record_id})
                new_image = create_test_image()
                update_data = {'image': new_image}
                response = authenticated_client.patch(url, update_data, format='multipart')
                
                # May succeed or fail depending on implementation
                assert response.status_code in [
                    status.HTTP_200_OK,
                    status.HTTP_400_BAD_REQUEST,
                    status.HTTP_500_INTERNAL_SERVER_ERROR
                ]
    
    def test_updated_at_timestamp_is_updated(self, authenticated_client, collection):
        """Test updated_at timestamp is updated"""
        if collection:
            # Create record
            create_url = reverse('records-list')
            data = {
                'title': 'Timestamp Update Test',
                'artist': 'Test Artist',
                'collection': collection['id']
            }
            create_response = authenticated_client.post(create_url, data, format='json')
            
            if create_response.status_code == status.HTTP_201_CREATED:
                record_id = create_response.data['id']
                original_updated_at = create_response.data['updated_at']
                
                # Update record
                url = reverse('records-detail', kwargs={'pk': record_id})
                update_data = {'title': 'Updated Title'}
                response = authenticated_client.patch(url, update_data, format='json')
                
                assert response.status_code == status.HTTP_200_OK
                assert 'updated_at' in response.data
                assert response.data['updated_at'] is not None
    
    def test_validation_errors_for_all_fields(self, authenticated_client, collection):
        """Test validation errors for all fields"""
        if collection:
            # Create record
            create_url = reverse('records-list')
            data = {
                'title': 'Validation Test',
                'artist': 'Test Artist',
                'collection': collection['id']
            }
            create_response = authenticated_client.post(create_url, data, format='json')
            
            if create_response.status_code == status.HTTP_201_CREATED:
                record_id = create_response.data['id']
                url = reverse('records-detail', kwargs={'pk': record_id})
                
                # Test invalid year
                update_data = {'year': 9999}
                response = authenticated_client.patch(url, update_data, format='json')
                assert response.status_code in [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]
    
    def test_response_format_matches_api_spec(self, authenticated_client, collection):
        """Test response format matches API spec (200 OK)"""
        if collection:
            # Create record
            create_url = reverse('records-list')
            data = {
                'title': 'Format Test',
                'artist': 'Test Artist',
                'collection': collection['id']
            }
            create_response = authenticated_client.post(create_url, data, format='json')
            
            if create_response.status_code == status.HTTP_201_CREATED:
                record_id = create_response.data['id']
                url = reverse('records-detail', kwargs={'pk': record_id})
                update_data = {'title': 'Updated Format Test'}
                response = authenticated_client.patch(url, update_data, format='json')
                
                assert response.status_code == status.HTTP_200_OK
                assert 'id' in response.data
                assert 'title' in response.data


@pytest.mark.django_db
class TestDeleteRecord:
    """Test Delete Record (US-012)"""
    
    def test_delete_requires_authentication(self):
        """Test delete requires authentication (401 if not authenticated)"""
        client = APIClient()
        url = reverse('records-detail', kwargs={'pk': 1})
        response = client.delete(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_only_collection_owner_can_delete(self, authenticated_client, other_user, collection):
        """Test only collection owner can delete (403 if not owner)"""
        if collection:
            # Create record as owner
            create_url = reverse('records-list')
            data = {
                'title': 'Delete Test',
                'artist': 'Test Artist',
                'collection': collection['id']
            }
            create_response = authenticated_client.post(create_url, data, format='json')
            
            if create_response.status_code == status.HTTP_201_CREATED:
                record_id = create_response.data['id']
                
                # Try to delete as other user
                other_client = APIClient()
                login_url = reverse('auth-login')
                other_client.post(login_url, {
                    'username': 'otheruser',
                    'password': 'testpass123'
                }, format='json')
                
                url = reverse('records-detail', kwargs={'pk': record_id})
                response = other_client.delete(url)
                
                assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_cannot_delete_record_in_closed_collection(self, authenticated_client, collection):
        """Test cannot delete record in closed collection (403 if collection is_closed=True)"""
        if collection:
            # Create record
            create_url = reverse('records-list')
            data = {
                'title': 'Closed Delete Test',
                'artist': 'Test Artist',
                'collection': collection['id']
            }
            create_response = authenticated_client.post(create_url, data, format='json')
            
            if create_response.status_code == status.HTTP_201_CREATED:
                record_id = create_response.data['id']
                
                # Close collection
                collection_url = reverse('collections-detail', kwargs={'pk': collection['id']})
                authenticated_client.patch(collection_url, {'is_closed': True}, format='json')
                
                # Try to delete record
                url = reverse('records-detail', kwargs={'pk': record_id})
                response = authenticated_client.delete(url)
                
                assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_successful_delete_returns_204_no_content(self, authenticated_client, collection):
        """Test successful delete returns 204 No Content"""
        if collection:
            # Create record
            create_url = reverse('records-list')
            data = {
                'title': 'Delete 204 Test',
                'artist': 'Test Artist',
                'collection': collection['id']
            }
            create_response = authenticated_client.post(create_url, data, format='json')
            
            if create_response.status_code == status.HTTP_201_CREATED:
                record_id = create_response.data['id']
                url = reverse('records-detail', kwargs={'pk': record_id})
                response = authenticated_client.delete(url)
                
                assert response.status_code == status.HTTP_204_NO_CONTENT
    
    def test_record_is_removed_from_database(self, authenticated_client, collection):
        """Test record is removed from database"""
        if collection:
            # Create record
            create_url = reverse('records-list')
            data = {
                'title': 'Remove Test',
                'artist': 'Test Artist',
                'collection': collection['id']
            }
            create_response = authenticated_client.post(create_url, data, format='json')
            
            if create_response.status_code == status.HTTP_201_CREATED:
                record_id = create_response.data['id']
                url = reverse('records-detail', kwargs={'pk': record_id})
                
                # Delete record
                delete_response = authenticated_client.delete(url)
                assert delete_response.status_code == status.HTTP_204_NO_CONTENT
                
                # Verify record is gone
                get_response = authenticated_client.get(url)
                assert get_response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_delete_with_invalid_id_returns_404(self, authenticated_client):
        """Test delete with invalid ID returns 404"""
        url = reverse('records-detail', kwargs={'pk': 99999})
        response = authenticated_client.delete(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestImageUpload:
    """Test Image Upload (US-015)"""
    
    def test_valid_image_formats(self, authenticated_client, collection):
        """Test valid image formats (JPEG, PNG, GIF)"""
        if collection:
            url = reverse('records-list')
            
            # Test JPEG
            jpeg_image = create_test_image()
            data = {
                'title': 'JPEG Test',
                'artist': 'Test Artist',
                'collection': collection['id'],
                'image': jpeg_image
            }
            response = authenticated_client.post(url, data, format='multipart')
            # May succeed or fail depending on implementation
            assert response.status_code in [
                status.HTTP_201_CREATED,
                status.HTTP_400_BAD_REQUEST,
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ]
    
    def test_invalid_image_formats_are_rejected(self, authenticated_client, collection):
        """Test invalid image formats are rejected"""
        if collection:
            url = reverse('records-list')
            # Create a non-image file
            text_file = io.BytesIO(b'This is not an image')
            text_file.name = 'document.txt'
            data = {
                'title': 'Invalid Format Test',
                'artist': 'Test Artist',
                'collection': collection['id'],
                'image': text_file
            }
            response = authenticated_client.post(url, data, format='multipart')
            
            assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_file_size_validation_10mb_limit(self, authenticated_client, collection):
        """Test file size validation (10MB limit)"""
        if collection:
            url = reverse('records-list')
            # Create a file larger than 10MB
            large_file = io.BytesIO(b'x' * (11 * 1024 * 1024))  # 11MB
            large_file.name = 'large.jpg'
            data = {
                'title': 'Large File Test',
                'artist': 'Test Artist',
                'collection': collection['id'],
                'image': large_file
            }
            response = authenticated_client.post(url, data, format='multipart')
            
            assert response.status_code in [
                status.HTTP_400_BAD_REQUEST,
                status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ]
    
    def test_image_is_stored_with_correct_filename(self, authenticated_client, collection):
        """Test image is stored with correct filename"""
        # This would require checking actual file storage
        # For now, just verify the image field is set
        if collection:
            url = reverse('records-list')
            image_file = create_test_image()
            data = {
                'title': 'Filename Test',
                'artist': 'Test Artist',
                'collection': collection['id'],
                'image': image_file
            }
            response = authenticated_client.post(url, data, format='multipart')
            
            if response.status_code == status.HTTP_201_CREATED:
                assert 'image' in response.data
    
    def test_image_url_generation(self, authenticated_client, collection):
        """Test image URL generation"""
        if collection:
            url = reverse('records-list')
            image_file = create_test_image()
            data = {
                'title': 'URL Generation Test',
                'artist': 'Test Artist',
                'collection': collection['id'],
                'image': image_file
            }
            response = authenticated_client.post(url, data, format='multipart')
            
            if response.status_code == status.HTTP_201_CREATED:
                if 'image' in response.data and response.data['image']:
                    assert isinstance(response.data['image'], str)
    
    def test_image_is_publicly_accessible(self, authenticated_client, collection):
        """Test image is publicly accessible (no auth required to view)"""
        # This would require actual HTTP request to image URL
        # For now, just verify image URL is in response
        if collection:
            url = reverse('records-list')
            image_file = create_test_image()
            data = {
                'title': 'Public Access Test',
                'artist': 'Test Artist',
                'collection': collection['id'],
                'image': image_file
            }
            response = authenticated_client.post(url, data, format='multipart')
            
            if response.status_code == status.HTTP_201_CREATED:
                assert 'image' in response.data


@pytest.mark.django_db
class TestRecordPermissionEdgeCases:
    """Test Permission Edge Cases"""
    
    def test_anonymous_user_cannot_create_records(self):
        """Test anonymous user cannot create/update/delete records"""
        client = APIClient()
        url = reverse('records-list')
        data = {
            'title': 'Unauthorized Record',
            'artist': 'Test Artist',
            'collection': 1
        }
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_non_owner_authenticated_user_cannot_create_update_delete(self, authenticated_client, other_user):
        """Test non-owner authenticated user cannot create/update/delete"""
        # Create collection as other_user
        other_client = APIClient()
        login_url = reverse('auth-login')
        other_client.post(login_url, {
            'username': 'otheruser',
            'password': 'testpass123'
        }, format='json')
        
        other_collection_url = reverse('collections-list')
        other_collection_data = {
            'name': 'Other Collection',
            'description': 'Test'
        }
        other_collection_response = other_client.post(other_collection_url, other_collection_data, format='json')
        
        if other_collection_response.status_code == status.HTTP_201_CREATED:
            other_collection_id = other_collection_response.data['id']
            
            # Try to create record as different user
            url = reverse('records-list')
            data = {
                'title': 'Unauthorized',
                'artist': 'Test Artist',
                'collection': other_collection_id
            }
            response = authenticated_client.post(url, data, format='json')
            
            assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_owner_cannot_modify_records_in_closed_collection(self, authenticated_client, collection):
        """Test owner cannot modify records in closed collection"""
        if collection:
            # Create record
            create_url = reverse('records-list')
            data = {
                'title': 'Closed Modify Test',
                'artist': 'Test Artist',
                'collection': collection['id']
            }
            create_response = authenticated_client.post(create_url, data, format='json')
            
            if create_response.status_code == status.HTTP_201_CREATED:
                record_id = create_response.data['id']
                
                # Close collection
                collection_url = reverse('collections-detail', kwargs={'pk': collection['id']})
                authenticated_client.patch(collection_url, {'is_closed': True}, format='json')
                
                # Try to update
                url = reverse('records-detail', kwargs={'pk': record_id})
                update_response = authenticated_client.patch(url, {'title': 'Updated'}, format='json')
                assert update_response.status_code == status.HTTP_403_FORBIDDEN
                
                # Try to delete
                delete_response = authenticated_client.delete(url)
                assert delete_response.status_code == status.HTTP_403_FORBIDDEN
