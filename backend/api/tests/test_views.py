import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestHealthCheck:
    def test_health_check_endpoint(self):
        """
        Test that the health check endpoint returns a successful response
        """
        client = APIClient()
        url = reverse('health_check')
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'healthy'
        assert response.data['message'] == 'Ekho backend is running'
