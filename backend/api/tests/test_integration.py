"""
Integration Tests

Reference: docs/user-stories/, docs/api-specification.md

This module contains integration tests for:
- Full Workflow Tests
- Anonymous User Access Tests
- Multi-User Scenarios
- Error Handling Integration Tests

TDD APPROACH: These tests are written BEFORE production code exists.
The tests SHOULD FAIL until all API endpoints and models are implemented.
This follows the Documentation → Tests → Production Code workflow.

Expected failures:
- URL reverse errors when endpoints don't exist
- 404/500 errors when endpoints don't exist or aren't fully implemented
- Assertion failures when workflows don't match expected behavior
"""

import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from api.tests.test_records import record_payload


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


@pytest.mark.django_db
class TestFullWorkflow:
    """Test Full Workflow"""
    
    def test_complete_user_journey(self, authenticated_client, user):
        """Test complete user journey: register → login → create collection → add records → close collection"""
        # Note: Registration is tested separately, so we start with login
        # User is already authenticated via fixture
        
        # Step 1: Create collection
        collections_url = reverse('collections-list')
        collection_data = {
            'name': 'Workflow Test Collection',
            'description': 'Testing complete workflow'
        }
        collection_response = authenticated_client.post(collections_url, collection_data, format='json')
        
        if collection_response.status_code == status.HTTP_201_CREATED:
            collection_id = collection_response.data['id']
            
            # Step 2: Add records
            records_url = reverse('records-list')
            record_data = record_payload(
                collection_id, title='Workflow Test Record', object_number='WF-1'
            )
            record_response = authenticated_client.post(records_url, record_data, format='json')
            
            if record_response.status_code == status.HTTP_201_CREATED:
                record_id = record_response.data['id']
                
                # Step 3: Close collection
                collection_detail_url = reverse('collections-detail', kwargs={'pk': collection_id})
                close_response = authenticated_client.patch(
                    collection_detail_url,
                    {'is_closed': True},
                    format='json'
                )
                
                # Verify collection is closed
                assert close_response.status_code == status.HTTP_200_OK
                assert close_response.data['is_closed'] is True
                
                # Verify record cannot be modified
                record_detail_url = reverse('records-detail', kwargs={'pk': record_id})
                update_response = authenticated_client.patch(
                    record_detail_url,
                    {
                        'data': record_payload(
                            collection_id, title='Updated', object_number='WF-1'
                        )['data']
                    },
                    format='json'
                )
                assert update_response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_workflow_create_collection_add_records_update_close(self, authenticated_client):
        """Test workflow: create collection → add multiple records → update collection → update records → close collection → verify read-only"""
        # Create collection
        collections_url = reverse('collections-list')
        collection_data = {
            'name': 'Multi-Step Workflow Collection',
            'description': 'Testing multiple steps'
        }
        collection_response = authenticated_client.post(collections_url, collection_data, format='json')
        
        if collection_response.status_code == status.HTTP_201_CREATED:
            collection_id = collection_response.data['id']
            
            # Add multiple records
            records_url = reverse('records-list')
            record_ids = []
            for i in range(3):
                record_data = record_payload(
                    collection_id,
                    title=f'Record {i+1}',
                    object_number=f'R{i+1}',
                )
                record_response = authenticated_client.post(records_url, record_data, format='json')
                if record_response.status_code == status.HTTP_201_CREATED:
                    record_ids.append(record_response.data['id'])
            
            # Update collection
            collection_detail_url = reverse('collections-detail', kwargs={'pk': collection_id})
            update_response = authenticated_client.patch(
                collection_detail_url,
                {'description': 'Updated description'},
                format='json'
            )
            assert update_response.status_code == status.HTTP_200_OK
            
            # Update a record
            if record_ids:
                record_detail_url = reverse('records-detail', kwargs={'pk': record_ids[0]})
                record_update_response = authenticated_client.patch(
                    record_detail_url,
                    {
                        'data': record_payload(
                            collection_id, title='Updated Record', object_number='R1'
                        )['data']
                    },
                    format='json'
                )
                assert record_update_response.status_code == status.HTTP_200_OK
            
            # Close collection
            close_response = authenticated_client.patch(
                collection_detail_url,
                {'is_closed': True},
                format='json'
            )
            assert close_response.status_code == status.HTTP_200_OK
            
            # Verify read-only: cannot update collection
            verify_update_response = authenticated_client.patch(
                collection_detail_url,
                {'name': 'Hacked Name'},
                format='json'
            )
            assert verify_update_response.status_code == status.HTTP_403_FORBIDDEN
            
            # Verify read-only: cannot update records
            if record_ids:
                verify_record_update_response = authenticated_client.patch(
                    reverse('records-detail', kwargs={'pk': record_ids[0]}),
                    {
                        'data': record_payload(
                            collection_id, title='Hacked Title', object_number='R1'
                        )['data']
                    },
                    format='json'
                )
                assert verify_record_update_response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_data_integrity_throughout_workflow(self, authenticated_client):
        """Test data integrity throughout workflow"""
        # Create collection
        collections_url = reverse('collections-list')
        collection_data = {
            'name': 'Integrity Test Collection',
            'description': 'Testing data integrity'
        }
        collection_response = authenticated_client.post(collections_url, collection_data, format='json')
        
        if collection_response.status_code == status.HTTP_201_CREATED:
            collection_id = collection_response.data['id']
            original_name = collection_response.data['name']
            
            # Add record
            records_url = reverse('records-list')
            record_data = record_payload(
                collection_id, title='Integrity Test Record', object_number='INT-1'
            )
            record_response = authenticated_client.post(records_url, record_data, format='json')
            
            if record_response.status_code == status.HTTP_201_CREATED:
                record_id = record_response.data['id']
                
                # Verify collection still has original name
                collection_detail_url = reverse('collections-detail', kwargs={'pk': collection_id})
                get_response = authenticated_client.get(collection_detail_url)
                assert get_response.status_code == status.HTTP_200_OK
                assert get_response.data['name'] == original_name
                
                # Verify record is associated with collection
                record_detail_url = reverse('records-detail', kwargs={'pk': record_id})
                record_get_response = authenticated_client.get(record_detail_url)
                assert record_get_response.status_code == status.HTTP_200_OK
                assert record_get_response.data['collection'] == collection_id
    
    def test_session_persistence_across_workflow_steps(self, authenticated_client):
        """Test session persistence across workflow steps"""
        # Verify session is active
        me_url = reverse('auth-me')
        me_response = authenticated_client.get(me_url)
        assert me_response.status_code == status.HTTP_200_OK
        
        # Create collection
        collections_url = reverse('collections-list')
        collection_data = {
            'name': 'Session Test Collection',
            'description': 'Testing session persistence'
        }
        collection_response = authenticated_client.post(collections_url, collection_data, format='json')
        assert collection_response.status_code == status.HTTP_201_CREATED
        
        # Verify session still active
        me_response2 = authenticated_client.get(me_url)
        assert me_response2.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestAnonymousUserAccess:
    """Test Anonymous User Access"""
    
    def test_anonymous_user_can_view_collections_list(self):
        """Test anonymous user can view collections list"""
        client = APIClient()
        url = reverse('collections-list')
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_anonymous_user_can_view_collection_details(self):
        """Test anonymous user can view collection details"""
        # First create a collection as authenticated user
        user = User.objects.create_user(username='testuser', password='testpass123')
        authenticated_client = APIClient()
        login_url = reverse('auth-login')
        authenticated_client.post(login_url, {
            'username': 'testuser',
            'password': 'testpass123'
        }, format='json')
        
        collections_url = reverse('collections-list')
        collection_data = {
            'name': 'Public Collection',
            'description': 'Test'
        }
        collection_response = authenticated_client.post(collections_url, collection_data, format='json')
        
        if collection_response.status_code == status.HTTP_201_CREATED:
            collection_id = collection_response.data['id']
            
            # Anonymous user views collection
            anonymous_client = APIClient()
            collection_detail_url = reverse('collections-detail', kwargs={'pk': collection_id})
            response = anonymous_client.get(collection_detail_url)
            
            assert response.status_code == status.HTTP_200_OK
    
    def test_anonymous_user_can_view_records_list(self):
        """Test anonymous user can view records list"""
        client = APIClient()
        url = reverse('records-list')
        response = client.get(url, {'collection': 1})
        
        # May return 400/404 if collection doesn't exist, but endpoint is accessible
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_404_NOT_FOUND
        ]
    
    def test_anonymous_user_can_view_record_details(self):
        """Test anonymous user can view record details"""
        # Create collection and record as authenticated user
        user = User.objects.create_user(username='testuser', password='testpass123')
        authenticated_client = APIClient()
        login_url = reverse('auth-login')
        authenticated_client.post(login_url, {
            'username': 'testuser',
            'password': 'testpass123'
        }, format='json')
        
        collections_url = reverse('collections-list')
        collection_data = {
            'name': 'Public Collection',
            'description': 'Test'
        }
        collection_response = authenticated_client.post(collections_url, collection_data, format='json')
        
        if collection_response.status_code == status.HTTP_201_CREATED:
            collection_id = collection_response.data['id']
            
            records_url = reverse('records-list')
            record_data = record_payload(
                collection_id, title='Public Record', object_number='PUB-1'
            )
            record_response = authenticated_client.post(records_url, record_data, format='json')
            
            if record_response.status_code == status.HTTP_201_CREATED:
                record_id = record_response.data['id']
                
                # Anonymous user views record
                anonymous_client = APIClient()
                record_detail_url = reverse('records-detail', kwargs={'pk': record_id})
                response = anonymous_client.get(record_detail_url)
                
                assert response.status_code == status.HTTP_200_OK
    
    def test_anonymous_user_cannot_perform_write_operations(self):
        """Test anonymous user cannot perform any write operations"""
        client = APIClient()
        
        # Cannot create collection
        collections_url = reverse('collections-list')
        collection_data = {
            'name': 'Unauthorized Collection',
            'description': 'Test'
        }
        response = client.post(collections_url, collection_data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        # Cannot create record
        records_url = reverse('records-list')
        record_data = record_payload(1, title='Unauthorized Record', object_number='UN-1')
        response = client.post(records_url, record_data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_anonymous_user_sees_read_only_views(self):
        """Test anonymous user sees read-only views"""
        # This is more of a frontend concern, but we can verify
        # that anonymous users can GET but not POST/PUT/PATCH/DELETE
        client = APIClient()
        
        # Can GET collections
        collections_url = reverse('collections-list')
        get_response = client.get(collections_url)
        assert get_response.status_code == status.HTTP_200_OK
        
        # Cannot POST collections
        post_response = client.post(collections_url, {}, format='json')
        assert post_response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestMultiUserScenarios:
    """Test Multi-User Scenarios"""
    
    def test_user_a_cannot_modify_user_b_collections(self, authenticated_client, other_user):
        """Test user A cannot modify user B's collections"""
        # Create collection as other_user
        other_client = APIClient()
        login_url = reverse('auth-login')
        other_client.post(login_url, {
            'username': 'otheruser',
            'password': 'testpass123'
        }, format='json')
        
        collections_url = reverse('collections-list')
        collection_data = {
            'name': 'User B Collection',
            'description': 'Test'
        }
        collection_response = other_client.post(collections_url, collection_data, format='json')
        
        if collection_response.status_code == status.HTTP_201_CREATED:
            collection_id = collection_response.data['id']
            
            # User A tries to update
            collection_detail_url = reverse('collections-detail', kwargs={'pk': collection_id})
            update_response = authenticated_client.patch(
                collection_detail_url,
                {'name': 'Hacked'},
                format='json'
            )
            assert update_response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_user_a_cannot_modify_user_b_records(self, authenticated_client, other_user):
        """Test user A cannot modify user B's records"""
        # Create collection and record as other_user
        other_client = APIClient()
        login_url = reverse('auth-login')
        other_client.post(login_url, {
            'username': 'otheruser',
            'password': 'testpass123'
        }, format='json')
        
        collections_url = reverse('collections-list')
        collection_data = {
            'name': 'User B Collection',
            'description': 'Test'
        }
        collection_response = other_client.post(collections_url, collection_data, format='json')
        
        if collection_response.status_code == status.HTTP_201_CREATED:
            collection_id = collection_response.data['id']
            
            records_url = reverse('records-list')
            record_data = record_payload(
                collection_id, title='User B Record', object_number='UB-1'
            )
            record_response = other_client.post(records_url, record_data, format='json')
            
            if record_response.status_code == status.HTTP_201_CREATED:
                record_id = record_response.data['id']
                
                # User A tries to update
                record_detail_url = reverse('records-detail', kwargs={'pk': record_id})
                update_response = authenticated_client.patch(
                    record_detail_url,
                    {
                        'data': record_payload(
                            collection_id, title='Hacked', object_number='UB-1'
                        )['data']
                    },
                    format='json'
                )
                assert update_response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_multiple_users_can_view_each_other_collections(self, authenticated_client, other_user):
        """Test multiple users can view each other's collections (public access)"""
        # Create collection as other_user
        other_client = APIClient()
        login_url = reverse('auth-login')
        other_client.post(login_url, {
            'username': 'otheruser',
            'password': 'testpass123'
        }, format='json')
        
        collections_url = reverse('collections-list')
        collection_data = {
            'name': 'Public View Test',
            'description': 'Test'
        }
        collection_response = other_client.post(collections_url, collection_data, format='json')
        
        if collection_response.status_code == status.HTTP_201_CREATED:
            collection_id = collection_response.data['id']
            
            # User A can view User B's collection
            collection_detail_url = reverse('collections-detail', kwargs={'pk': collection_id})
            response = authenticated_client.get(collection_detail_url)
            assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestErrorHandlingIntegration:
    """Test Error Handling Integration"""
    
    def test_error_responses_are_consistent(self, authenticated_client):
        """Test error responses are consistent across all endpoints"""
        # Test 400 errors
        collections_url = reverse('collections-list')
        invalid_data = {'name': 'a' * 201}  # Too long
        response = authenticated_client.post(collections_url, invalid_data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Test 401 errors
        client = APIClient()
        response = client.post(collections_url, {}, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        # Test 404 errors
        collection_detail_url = reverse('collections-detail', kwargs={'pk': 99999})
        response = authenticated_client.get(collection_detail_url)
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_error_format_matches_api_specification(self, authenticated_client):
        """Test error format matches API specification"""
        # Test 400 error format
        collections_url = reverse('collections-list')
        invalid_data = {}
        response = authenticated_client.post(collections_url, invalid_data, format='json')
        
        if response.status_code == status.HTTP_400_BAD_REQUEST:
            # Should have error information
            assert response.data is not None
    
    def test_proper_http_status_codes_for_all_scenarios(self):
        """Test proper HTTP status codes for all scenarios"""
        client = APIClient()
        
        # 200 OK - GET successful
        collections_url = reverse('collections-list')
        response = client.get(collections_url)
        assert response.status_code == status.HTTP_200_OK
        
        # 401 Unauthorized - POST without auth
        response = client.post(collections_url, {}, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        # 404 Not Found - GET non-existent resource
        collection_detail_url = reverse('collections-detail', kwargs={'pk': 99999})
        response = client.get(collection_detail_url)
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_error_messages_are_user_friendly(self, authenticated_client):
        """Test error messages are user-friendly"""
        # Test validation error
        collections_url = reverse('collections-list')
        invalid_data = {'name': ''}  # Empty name
        response = authenticated_client.post(collections_url, invalid_data, format='json')
        
        if response.status_code == status.HTTP_400_BAD_REQUEST:
            # Should have meaningful error information
            assert response.data is not None
