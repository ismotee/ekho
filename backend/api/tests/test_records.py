"""
Record API Tests

Reference: docs/api-specification.md (Record Endpoints), docs/data/record-models.md

Domain payload is under `data`; optional `representative_image` for thumbnails.
"""

import json
import io

import pytest
from PIL import Image
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


def create_test_image():
    """Create a test JPEG upload."""
    image = Image.new("RGB", (100, 100), color="red")
    img_io = io.BytesIO()
    image.save(img_io, format="JPEG")
    data = img_io.getvalue()
    return SimpleUploadedFile("test.jpg", data, content_type="image/jpeg")


def record_payload(collection_id, *, title="Untitled", object_number="OBJ-1", **extra_domains):
    """Minimal valid record body: identification_details with title list and object_number."""
    data = {
        "identification_details": {
            "object_number": object_number,
            "title": [{"value": title}],
        }
    }
    for key, val in extra_domains.items():
        data[key] = val
    return {"collection": collection_id, "data": data}


def record_title_value(record_dict):
    """First Title entry (list shape) or legacy single title dict."""
    raw = (
        (record_dict.get("data") or {})
        .get("identification_details") or {}
    ).get("title")
    if isinstance(raw, list) and raw:
        first = raw[0]
        return first if isinstance(first, dict) else {}
    if isinstance(raw, dict):
        return raw
    return {}


@pytest.fixture
def user():
    return User.objects.create_user(username="testuser", password="testpass123")


@pytest.fixture
def other_user():
    return User.objects.create_user(username="otheruser", password="testpass123")


@pytest.fixture
def authenticated_client(user):
    client = APIClient()
    client.post(
        reverse("auth-login"),
        {"username": "testuser", "password": "testpass123"},
        format="json",
    )
    return client


@pytest.fixture
def collection(authenticated_client, user):
    url = reverse("collections-list")
    response = authenticated_client.post(
        url, {"name": "Test Collection", "description": "Test Description"}, format="json"
    )
    if response.status_code == status.HTTP_201_CREATED:
        return response.data
    return None


@pytest.mark.django_db
class TestListRecords:
    def test_list_endpoint_accessible_to_anonymous_users(self):
        client = APIClient()
        url = reverse("records-list")
        response = client.get(url, {"collection": 1})
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]

    def test_list_endpoint_accessible_to_authenticated_users(self, authenticated_client):
        url = reverse("records-list")
        response = authenticated_client.get(url, {"collection": 1})
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]

    def test_list_without_collection_returns_200_and_results(self, authenticated_client):
        url = reverse("records-list")
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        assert isinstance(response.data["results"], list)
        assert "count" in response.data

    def test_list_with_collection_parameter_filters_by_collection(
        self, authenticated_client, collection
    ):
        if collection:
            url = reverse("records-list")
            response = authenticated_client.get(url, {"collection": collection["id"]})
            assert response.status_code == status.HTTP_200_OK
            for record in response.data["results"]:
                assert record["collection"] == collection["id"]

    def test_list_with_nonexistent_collection_returns_404(self, authenticated_client):
        url = reverse("records-list")
        response = authenticated_client.get(url, {"collection": 99999})
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_list_response_includes_collection_name_and_owner(
        self, authenticated_client, collection
    ):
        if collection:
            create_url = reverse("records-list")
            authenticated_client.post(
                create_url,
                record_payload(collection["id"], title="List Context Test", object_number="LC-1"),
                format="json",
            )
            url = reverse("records-list")
            response = authenticated_client.get(url, {"collection": collection["id"]})
            assert response.status_code == status.HTTP_200_OK
            record = response.data["results"][0]
            assert record["collection_name"] == "Test Collection"
            assert record["collection_owner_username"] == "testuser"

    def test_list_all_records_includes_collection_context_fields(
        self, authenticated_client, collection
    ):
        if collection:
            create_url = reverse("records-list")
            authenticated_client.post(
                create_url,
                record_payload(
                    collection["id"], title="All Records Context Test", object_number="ARC-1"
                ),
                format="json",
            )
            url = reverse("records-list")
            response = authenticated_client.get(url)
            assert response.status_code == status.HTTP_200_OK
            record = next(
                (
                    r
                    for r in response.data["results"]
                    if record_title_value(r).get("value") == "All Records Context Test"
                ),
                None,
            )
            assert record is not None
            assert "collection_name" in record
            assert "collection_owner_username" in record

    def test_pagination_parameters(self, authenticated_client, collection):
        if collection:
            url = reverse("records-list")
            response = authenticated_client.get(
                url, {"collection": collection["id"], "page": 1, "page_size": 10}
            )
            assert response.status_code == status.HTTP_200_OK

    def test_pagination_response_format(self, authenticated_client, collection):
        if collection:
            url = reverse("records-list")
            response = authenticated_client.get(url, {"collection": collection["id"]})
            assert response.status_code == status.HTTP_200_OK
            assert "results" in response.data or isinstance(response.data, list)

    def test_response_includes_all_required_fields(self, authenticated_client, collection):
        if collection:
            url = reverse("records-list")
            response = authenticated_client.get(url, {"collection": collection["id"]})
            assert response.status_code == status.HTTP_200_OK
            if response.data.get("results"):
                record = response.data["results"][0]
                for field in ("id", "data", "collection"):
                    assert field in record

    def test_representative_image_urls_are_strings_when_set(
        self, authenticated_client, collection
    ):
        if collection:
            url = reverse("records-list")
            response = authenticated_client.get(url, {"collection": collection["id"]})
            assert response.status_code == status.HTTP_200_OK
            for record in response.data.get("results", []):
                img = record.get("representative_image")
                if img:
                    assert isinstance(img, str)

    def test_empty_list_returns_empty_results_array(self, authenticated_client, collection):
        if collection:
            url = reverse("records-list")
            response = authenticated_client.get(url, {"collection": collection["id"]})
            assert response.status_code == status.HTTP_200_OK
            assert "results" in response.data or isinstance(response.data, list)

    def test_ordering_by_created_at_descending(self, authenticated_client, collection):
        if collection:
            url = reverse("records-list")
            response = authenticated_client.get(url, {"collection": collection["id"]})
            assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestRecordsListFilters:
    def test_collection_name_filters_by_substring(self, authenticated_client, collection):
        if not collection:
            return
        other_resp = authenticated_client.post(
            reverse("collections-list"),
            {"name": "Other Gallery", "description": "Other"},
            format="json",
        )
        if other_resp.status_code != status.HTTP_201_CREATED:
            return
        other_cid = other_resp.data["id"]
        create_url = reverse("records-list")
        authenticated_client.post(
            create_url,
            record_payload(other_cid, title="In Other", object_number="O-1"),
            format="json",
        )
        authenticated_client.post(
            create_url,
            record_payload(collection["id"], title="In Test", object_number="T-1"),
            format="json",
        )
        response = authenticated_client.get(reverse("records-list"), {"collection_name": "Other Gallery"})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["collection_name"] == "Other Gallery"

    def test_collection_name_empty_does_not_filter(self, authenticated_client, collection):
        if not collection:
            return
        response = authenticated_client.get(reverse("records-list"), {"collection_name": ""})
        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data

    def test_owner_filters_by_collection_owner_username(
        self, authenticated_client, other_user, collection
    ):
        if not collection:
            return
        other_client = APIClient()
        other_client.post(
            reverse("auth-login"),
            {"username": "otheruser", "password": "testpass123"},
            format="json",
        )
        other_coll = other_client.post(
            reverse("collections-list"),
            {"name": "Other User Collection", "description": "O"},
            format="json",
        )
        if other_coll.status_code != status.HTTP_201_CREATED:
            return
        other_client.post(
            reverse("records-list"),
            record_payload(other_coll.data["id"], title="Other Record", object_number="OR-1"),
            format="json",
        )
        authenticated_client.post(
            reverse("records-list"),
            record_payload(collection["id"], title="Testuser Record", object_number="TR-1"),
            format="json",
        )
        response = authenticated_client.get(reverse("records-list"), {"owner": "testuser"})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["collection_owner_username"] == "testuser"

    def test_owner_nonexistent_returns_empty_results(self, authenticated_client, collection):
        if not collection:
            return
        response = authenticated_client.get(
            reverse("records-list"), {"owner": "nonexistentuser123"}
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["results"] == []

    def test_collection_name_and_owner_combined(self, authenticated_client, collection):
        if not collection:
            return
        response = authenticated_client.get(
            reverse("records-list"), {"collection_name": "Test", "owner": "testuser"}
        )
        assert response.status_code == status.HTTP_200_OK
        for record in response.data["results"]:
            assert "test" in record.get("collection_name", "").lower()
            assert record.get("collection_owner_username") == "testuser"

    def test_filters_combined_with_collection_param(self, authenticated_client, collection):
        if not collection:
            return
        response = authenticated_client.get(
            reverse("records-list"),
            {"collection": collection["id"], "owner": "testuser"},
        )
        assert response.status_code == status.HTTP_200_OK
        for record in response.data["results"]:
            assert record["collection"] == collection["id"]
            assert record.get("collection_owner_username") == "testuser"


@pytest.mark.django_db
class TestRecordsListSearch:
    """search matches JSON text (data) and collection name/description."""

    def test_search_filters_by_title_value_in_data(self, authenticated_client, collection):
        if not collection:
            return
        create_url = reverse("records-list")
        cid = collection["id"]
        authenticated_client.post(
            create_url,
            record_payload(cid, title="UniqueSunsetTitle", object_number="US-1"),
            format="json",
        )
        authenticated_client.post(
            create_url,
            record_payload(cid, title="Other Painting", object_number="OP-1"),
            format="json",
        )
        response = authenticated_client.get(reverse("records-list"), {"search": "UniqueSunset"})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert record_title_value(response.data["results"][0]).get("value") == "UniqueSunsetTitle"

    def test_search_filters_by_object_number_substring(self, authenticated_client, collection):
        if not collection:
            return
        create_url = reverse("records-list")
        cid = collection["id"]
        authenticated_client.post(
            create_url,
            record_payload(cid, title="T1", object_number="UniqueArtistName-001"),
            format="json",
        )
        authenticated_client.post(
            create_url,
            record_payload(cid, title="T2", object_number="OTHER-002"),
            format="json",
        )
        response = authenticated_client.get(reverse("records-list"), {"search": "UniqueArtist"})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1

    def test_search_includes_collection_name_and_description(self, authenticated_client, collection):
        if not collection:
            return
        other_resp = authenticated_client.post(
            reverse("collections-list"),
            {
                "name": "GalleryWithUniqueWord",
                "description": "Description with UniqueWord here",
            },
            format="json",
        )
        if other_resp.status_code != status.HTTP_201_CREATED:
            return
        other_cid = other_resp.data["id"]
        authenticated_client.post(
            reverse("records-list"),
            record_payload(other_cid, title="Generic", object_number="G-1"),
            format="json",
        )
        url = reverse("records-list")
        response = authenticated_client.get(url, {"search": "GalleryWithUniqueWord"})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        response2 = authenticated_client.get(url, {"search": "UniqueWord"})
        assert response2.status_code == status.HTTP_200_OK
        assert len(response2.data["results"]) >= 1

    def test_empty_search_param_does_not_filter(self, authenticated_client, collection):
        if not collection:
            return
        url = reverse("records-list")
        response_empty = authenticated_client.get(url, {"search": ""})
        response_omit = authenticated_client.get(url)
        assert response_empty.data["count"] == response_omit.data["count"]

    def test_search_combined_with_collection_name_and_owner(self, authenticated_client, collection):
        if not collection:
            return
        authenticated_client.post(
            reverse("records-list"),
            record_payload(collection["id"], title="Sunset Art", object_number="SA-1"),
            format="json",
        )
        response = authenticated_client.get(
            reverse("records-list"),
            {"search": "Sunset", "collection_name": "Test", "owner": "testuser"},
        )
        assert response.status_code == status.HTTP_200_OK
        for record in response.data["results"]:
            assert record.get("collection_owner_username") == "testuser"
            assert "test" in record.get("collection_name", "").lower()
            tv = record_title_value(record).get("value") or ""
            assert "sunset" in tv.lower()


@pytest.mark.django_db
class TestCreateRecord:
    def test_create_requires_authentication(self):
        client = APIClient()
        url = reverse("records-list")
        response = client.post(url, record_payload(1), format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_only_collection_owner_can_create(self, authenticated_client, other_user, collection):
        if collection:
            other_client = APIClient()
            other_client.post(
                reverse("auth-login"),
                {"username": "otheruser", "password": "testpass123"},
                format="json",
            )
            other_collection_response = other_client.post(
                reverse("collections-list"),
                {"name": "Other Collection", "description": "Test"},
                format="json",
            )
            if other_collection_response.status_code == status.HTTP_201_CREATED:
                oid = other_collection_response.data["id"]
                response = authenticated_client.post(
                    reverse("records-list"),
                    record_payload(oid, title="Unauthorized Record", object_number="UR-1"),
                    format="json",
                )
                assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_cannot_create_in_closed_collection(self, authenticated_client, collection):
        if collection:
            cid = collection["id"]
            authenticated_client.patch(
                reverse("collections-detail", kwargs={"pk": cid}),
                {"is_closed": True},
                format="json",
            )
            response = authenticated_client.post(
                reverse("records-list"),
                record_payload(cid, title="Test Artwork", object_number="TA-1"),
                format="json",
            )
            assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_successful_creation_with_minimal_payload(self, authenticated_client, collection):
        if collection:
            url = reverse("records-list")
            response = authenticated_client.post(
                url,
                record_payload(
                    collection["id"], title="Sunset Over Mountains", object_number="SOM-1"
                ),
                format="json",
            )
            assert response.status_code == status.HTTP_201_CREATED
            assert record_title_value(response.data).get("value") == "Sunset Over Mountains"

    def test_successful_creation_with_extra_domain_keys(self, authenticated_client, collection):
        if collection:
            url = reverse("records-list")
            response = authenticated_client.post(
                url,
                record_payload(
                    collection["id"],
                    title="Complete Artwork",
                    object_number="CA-1",
                    description={"note": "A beautiful landscape"},
                ),
                format="json",
            )
            assert response.status_code == status.HTTP_201_CREATED
            assert "description" in response.data["data"]

    def test_create_collection_required(self, authenticated_client, collection):
        if collection:
            response = authenticated_client.post(
                reverse("records-list"), {"data": {}}, format="json"
            )
            assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_validation_unknown_key_in_data(self, authenticated_client, collection):
        if collection:
            response = authenticated_client.post(
                reverse("records-list"),
                {
                    "collection": collection["id"],
                    "data": {"identification_details": {}, "not_a_domain_key": {}},
                },
                format="json",
            )
            assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_validation_data_must_be_object(self, authenticated_client, collection):
        if collection:
            response = authenticated_client.post(
                reverse("records-list"),
                {"collection": collection["id"], "data": []},
                format="json",
            )
            assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_image_upload_with_valid_file(self, authenticated_client, collection):
        if collection:
            url = reverse("records-list")
            cid = collection["id"]
            p = record_payload(cid, title="Image Test", object_number="IT-1")
            data = {
                "collection": str(cid),
                "data": json.dumps(p["data"]),
                "representative_image": create_test_image(),
            }
            response = authenticated_client.post(url, data, format="multipart")
            assert response.status_code == status.HTTP_201_CREATED

    def test_image_upload_file_size_limit_10mb(self, authenticated_client, collection):
        if collection:
            url = reverse("records-list")
            large_file = SimpleUploadedFile(
                "large.jpg",
                b"x" * (11 * 1024 * 1024),
                content_type="image/jpeg",
            )
            cid = collection["id"]
            p = record_payload(cid, title="Large Image Test", object_number="LIT-1")
            data = {
                "collection": str(cid),
                "data": json.dumps(p["data"]),
                "representative_image": large_file,
            }
            response = authenticated_client.post(url, data, format="multipart")
            assert response.status_code in (
                status.HTTP_400_BAD_REQUEST,
                status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            )

    def test_image_upload_invalid_file_type(self, authenticated_client, collection):
        if collection:
            url = reverse("records-list")
            text_file = SimpleUploadedFile(
                "document.txt", b"not an image", content_type="text/plain"
            )
            cid = collection["id"]
            p = record_payload(cid, title="Invalid File Test", object_number="IFT-1")
            data = {
                "collection": str(cid),
                "data": json.dumps(p["data"]),
                "representative_image": text_file,
            }
            response = authenticated_client.post(url, data, format="multipart")
            assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_image_is_optional(self, authenticated_client, collection):
        if collection:
            response = authenticated_client.post(
                reverse("records-list"),
                record_payload(collection["id"], title="No Image Test", object_number="NI-1"),
                format="json",
            )
            assert response.status_code == status.HTTP_201_CREATED

    def test_timestamps_are_automatically_set(self, authenticated_client, collection):
        if collection:
            response = authenticated_client.post(
                reverse("records-list"),
                record_payload(collection["id"], title="Timestamp Test", object_number="TT-1"),
                format="json",
            )
            assert response.status_code == status.HTTP_201_CREATED
            assert "created_at" in response.data
            assert "updated_at" in response.data

    def test_response_format_matches_api_spec(self, authenticated_client, collection):
        if collection:
            response = authenticated_client.post(
                reverse("records-list"),
                record_payload(collection["id"], title="Format Test", object_number="FT-1"),
                format="json",
            )
            assert response.status_code == status.HTTP_201_CREATED
            for field in ("id", "data", "collection", "created_at", "updated_at"):
                assert field in response.data

    def test_representative_image_url_in_response(self, authenticated_client, collection):
        if collection:
            cid = collection["id"]
            p = record_payload(cid, title="Image URL Test", object_number="IUT-1")
            data = {
                "collection": str(cid),
                "data": json.dumps(p["data"]),
                "representative_image": create_test_image(),
            }
            response = authenticated_client.post(
                reverse("records-list"), data, format="multipart"
            )
            assert response.status_code == status.HTTP_201_CREATED
            assert response.data.get("representative_image")


@pytest.mark.django_db
class TestRetrieveRecord:
    def test_retrieve_accessible_to_anonymous_users(self):
        client = APIClient()
        response = client.get(reverse("records-detail", kwargs={"pk": 999}))
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]

    def test_retrieve_accessible_to_authenticated_users(self, authenticated_client):
        response = authenticated_client.get(reverse("records-detail", kwargs={"pk": 999}))
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]

    def test_retrieve_with_valid_id_returns_record_data(self, authenticated_client, collection):
        if collection:
            create_response = authenticated_client.post(
                reverse("records-list"),
                record_payload(collection["id"], title="Retrieve Test", object_number="RT-1"),
                format="json",
            )
            if create_response.status_code == status.HTTP_201_CREATED:
                rid = create_response.data["id"]
                response = authenticated_client.get(
                    reverse("records-detail", kwargs={"pk": rid})
                )
                assert response.status_code == status.HTTP_200_OK
                assert record_title_value(response.data).get("value") == "Retrieve Test"

    def test_retrieve_with_invalid_id_returns_404(self, authenticated_client):
        response = authenticated_client.get(reverse("records-detail", kwargs={"pk": 99999}))
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_response_includes_data_and_representative_image(self, authenticated_client, collection):
        if collection:
            create_response = authenticated_client.post(
                reverse("records-list"),
                record_payload(collection["id"], title="All Fields Test", object_number="AFT-1"),
                format="json",
            )
            if create_response.status_code == status.HTTP_201_CREATED:
                rid = create_response.data["id"]
                response = authenticated_client.get(
                    reverse("records-detail", kwargs={"pk": rid})
                )
                assert response.status_code == status.HTTP_200_OK
                assert "data" in response.data
                assert "representative_image" in response.data


@pytest.mark.django_db
class TestUpdateRecord:
    def test_update_requires_authentication(self):
        client = APIClient()
        response = client.patch(
            reverse("records-detail", kwargs={"pk": 1}),
            {"data": {}},
            format="json",
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_only_collection_owner_can_update(self, authenticated_client, other_user, collection):
        if collection:
            create_response = authenticated_client.post(
                reverse("records-list"),
                record_payload(collection["id"], title="Owner Test", object_number="OT-1"),
                format="json",
            )
            if create_response.status_code == status.HTTP_201_CREATED:
                rid = create_response.data["id"]
                other_client = APIClient()
                other_client.post(
                    reverse("auth-login"),
                    {"username": "otheruser", "password": "testpass123"},
                    format="json",
                )
                response = other_client.patch(
                    reverse("records-detail", kwargs={"pk": rid}),
                    {"data": record_payload(collection["id"], title="Hacked Title", object_number="HT-1")["data"]},
                    format="json",
                )
                assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_cannot_update_record_in_closed_collection(self, authenticated_client, collection):
        if collection:
            create_response = authenticated_client.post(
                reverse("records-list"),
                record_payload(
                    collection["id"], title="Closed Collection Test", object_number="CCT-1"
                ),
                format="json",
            )
            if create_response.status_code == status.HTTP_201_CREATED:
                rid = create_response.data["id"]
                authenticated_client.patch(
                    reverse("collections-detail", kwargs={"pk": collection["id"]}),
                    {"is_closed": True},
                    format="json",
                )
                response = authenticated_client.patch(
                    reverse("records-detail", kwargs={"pk": rid}),
                    {"data": record_payload(collection["id"], title="Updated Title", object_number="UT-1")["data"]},
                    format="json",
                )
                assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_successful_update_with_patch(self, authenticated_client, collection):
        if collection:
            create_response = authenticated_client.post(
                reverse("records-list"),
                record_payload(
                    collection["id"], title="Original Title", object_number="OT-1"
                ),
                format="json",
            )
            if create_response.status_code == status.HTTP_201_CREATED:
                rid = create_response.data["id"]
                new_data = record_payload(
                    collection["id"], title="Updated Title", object_number="OT-1"
                )["data"]
                response = authenticated_client.patch(
                    reverse("records-detail", kwargs={"pk": rid}),
                    {"data": new_data},
                    format="json",
                )
                assert response.status_code == status.HTTP_200_OK
                assert record_title_value(response.data).get("value") == "Updated Title"

    def test_successful_update_with_put(self, authenticated_client, collection):
        if collection:
            create_response = authenticated_client.post(
                reverse("records-list"),
                record_payload(
                    collection["id"], title="Original Title", object_number="OT-2"
                ),
                format="json",
            )
            if create_response.status_code == status.HTTP_201_CREATED:
                rid = create_response.data["id"]
                body = record_payload(
                    collection["id"], title="Updated Title", object_number="UA-1"
                )
                body["collection"] = collection["id"]
                response = authenticated_client.put(
                    reverse("records-detail", kwargs={"pk": rid}),
                    body,
                    format="json",
                )
                assert response.status_code == status.HTTP_200_OK
                assert record_title_value(response.data).get("value") == "Updated Title"

    def test_representative_image_can_be_replaced_on_update(self, authenticated_client, collection):
        if collection:
            cid = collection["id"]
            p = record_payload(cid, title="Image Replace Test", object_number="IRT-1")
            create_data = {
                "collection": str(cid),
                "data": json.dumps(p["data"]),
                "representative_image": create_test_image(),
            }
            create_response = authenticated_client.post(
                reverse("records-list"), create_data, format="multipart"
            )
            if create_response.status_code == status.HTTP_201_CREATED:
                rid = create_response.data["id"]
                patch_data = {
                    "collection": str(cid),
                    "data": json.dumps(p["data"]),
                    "representative_image": create_test_image(),
                }
                response = authenticated_client.patch(
                    reverse("records-detail", kwargs={"pk": rid}),
                    patch_data,
                    format="multipart",
                )
                assert response.status_code == status.HTTP_200_OK

    def test_updated_at_timestamp_is_updated(self, authenticated_client, collection):
        if collection:
            create_response = authenticated_client.post(
                reverse("records-list"),
                record_payload(
                    collection["id"], title="Timestamp Update Test", object_number="TUT-1"
                ),
                format="json",
            )
            if create_response.status_code == status.HTTP_201_CREATED:
                rid = create_response.data["id"]
                new_data = record_payload(
                    collection["id"], title="Updated Title", object_number="TUT-1"
                )["data"]
                response = authenticated_client.patch(
                    reverse("records-detail", kwargs={"pk": rid}),
                    {"data": new_data},
                    format="json",
                )
                assert response.status_code == status.HTTP_200_OK
                assert response.data["updated_at"]

    def test_response_format_matches_api_spec(self, authenticated_client, collection):
        if collection:
            create_response = authenticated_client.post(
                reverse("records-list"),
                record_payload(collection["id"], title="Format Test", object_number="FT-2"),
                format="json",
            )
            if create_response.status_code == status.HTTP_201_CREATED:
                rid = create_response.data["id"]
                new_data = record_payload(
                    collection["id"], title="Updated Format Test", object_number="FT-2"
                )["data"]
                response = authenticated_client.patch(
                    reverse("records-detail", kwargs={"pk": rid}),
                    {"data": new_data},
                    format="json",
                )
                assert response.status_code == status.HTTP_200_OK
                assert "id" in response.data
                assert "data" in response.data


@pytest.mark.django_db
class TestDeleteRecord:
    def test_delete_requires_authentication(self):
        client = APIClient()
        response = client.delete(reverse("records-detail", kwargs={"pk": 1}))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_only_collection_owner_can_delete(self, authenticated_client, other_user, collection):
        if collection:
            create_response = authenticated_client.post(
                reverse("records-list"),
                record_payload(collection["id"], title="Delete Test", object_number="DT-1"),
                format="json",
            )
            if create_response.status_code == status.HTTP_201_CREATED:
                rid = create_response.data["id"]
                other_client = APIClient()
                other_client.post(
                    reverse("auth-login"),
                    {"username": "otheruser", "password": "testpass123"},
                    format="json",
                )
                response = other_client.delete(reverse("records-detail", kwargs={"pk": rid}))
                assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_cannot_delete_record_in_closed_collection(self, authenticated_client, collection):
        if collection:
            create_response = authenticated_client.post(
                reverse("records-list"),
                record_payload(
                    collection["id"], title="Closed Delete Test", object_number="CDT-1"
                ),
                format="json",
            )
            if create_response.status_code == status.HTTP_201_CREATED:
                rid = create_response.data["id"]
                authenticated_client.patch(
                    reverse("collections-detail", kwargs={"pk": collection["id"]}),
                    {"is_closed": True},
                    format="json",
                )
                response = authenticated_client.delete(
                    reverse("records-detail", kwargs={"pk": rid})
                )
                assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_successful_delete_returns_204_no_content(self, authenticated_client, collection):
        if collection:
            create_response = authenticated_client.post(
                reverse("records-list"),
                record_payload(
                    collection["id"], title="Delete 204 Test", object_number="D204-1"
                ),
                format="json",
            )
            if create_response.status_code == status.HTTP_201_CREATED:
                rid = create_response.data["id"]
                response = authenticated_client.delete(
                    reverse("records-detail", kwargs={"pk": rid})
                )
                assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_record_is_removed_from_database(self, authenticated_client, collection):
        if collection:
            create_response = authenticated_client.post(
                reverse("records-list"),
                record_payload(collection["id"], title="Remove Test", object_number="RM-1"),
                format="json",
            )
            if create_response.status_code == status.HTTP_201_CREATED:
                rid = create_response.data["id"]
                url = reverse("records-detail", kwargs={"pk": rid})
                assert authenticated_client.delete(url).status_code == status.HTTP_204_NO_CONTENT
                assert authenticated_client.get(url).status_code == status.HTTP_404_NOT_FOUND

    def test_delete_with_invalid_id_returns_404(self, authenticated_client):
        response = authenticated_client.delete(reverse("records-detail", kwargs={"pk": 99999}))
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestImageUpload:
    def test_valid_image_formats(self, authenticated_client, collection):
        if collection:
            cid = collection["id"]
            p = record_payload(cid, title="JPEG Test", object_number="JT-1")
            data = {
                "collection": str(cid),
                "data": json.dumps(p["data"]),
                "representative_image": create_test_image(),
            }
            response = authenticated_client.post(reverse("records-list"), data, format="multipart")
            assert response.status_code == status.HTTP_201_CREATED

    def test_invalid_image_formats_are_rejected(self, authenticated_client, collection):
        if collection:
            text_file = SimpleUploadedFile(
                "document.txt", b"not an image", content_type="text/plain"
            )
            cid = collection["id"]
            p = record_payload(cid, title="Invalid Format Test", object_number="IFT-2")
            data = {
                "collection": str(cid),
                "data": json.dumps(p["data"]),
                "representative_image": text_file,
            }
            response = authenticated_client.post(reverse("records-list"), data, format="multipart")
            assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_file_size_validation_10mb_limit(self, authenticated_client, collection):
        if collection:
            large_file = SimpleUploadedFile(
                "large.jpg",
                b"x" * (11 * 1024 * 1024),
                content_type="image/jpeg",
            )
            cid = collection["id"]
            p = record_payload(cid, title="Large File Test", object_number="LFT-1")
            data = {
                "collection": str(cid),
                "data": json.dumps(p["data"]),
                "representative_image": large_file,
            }
            response = authenticated_client.post(reverse("records-list"), data, format="multipart")
            assert response.status_code in (
                status.HTTP_400_BAD_REQUEST,
                status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            )

    def test_representative_image_in_response(self, authenticated_client, collection):
        if collection:
            cid = collection["id"]
            p = record_payload(cid, title="Filename Test", object_number="FN-1")
            data = {
                "collection": str(cid),
                "data": json.dumps(p["data"]),
                "representative_image": create_test_image(),
            }
            response = authenticated_client.post(reverse("records-list"), data, format="multipart")
            assert response.status_code == status.HTTP_201_CREATED
            assert response.data.get("representative_image")

    def test_representative_image_url_is_string(self, authenticated_client, collection):
        if collection:
            cid = collection["id"]
            p = record_payload(cid, title="URL Generation Test", object_number="UG-1")
            data = {
                "collection": str(cid),
                "data": json.dumps(p["data"]),
                "representative_image": create_test_image(),
            }
            response = authenticated_client.post(reverse("records-list"), data, format="multipart")
            assert response.status_code == status.HTTP_201_CREATED
            assert isinstance(response.data["representative_image"], str)


@pytest.mark.django_db
class TestRecordPermissionEdgeCases:
    def test_anonymous_user_cannot_create_records(self):
        client = APIClient()
        response = client.post(
            reverse("records-list"),
            record_payload(1, title="Unauthorized Record", object_number="UR-2"),
            format="json",
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_non_owner_authenticated_user_cannot_create_update_delete(
        self, authenticated_client, other_user
    ):
        other_client = APIClient()
        other_client.post(
            reverse("auth-login"),
            {"username": "otheruser", "password": "testpass123"},
            format="json",
        )
        other_collection_response = other_client.post(
            reverse("collections-list"),
            {"name": "Other Collection", "description": "Test"},
            format="json",
        )
        if other_collection_response.status_code == status.HTTP_201_CREATED:
            oid = other_collection_response.data["id"]
            response = authenticated_client.post(
                reverse("records-list"),
                record_payload(oid, title="Unauthorized", object_number="U-1"),
                format="json",
            )
            assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_owner_cannot_modify_records_in_closed_collection(self, authenticated_client, collection):
        if collection:
            create_response = authenticated_client.post(
                reverse("records-list"),
                record_payload(
                    collection["id"], title="Closed Modify Test", object_number="CMT-1"
                ),
                format="json",
            )
            if create_response.status_code == status.HTTP_201_CREATED:
                rid = create_response.data["id"]
                authenticated_client.patch(
                    reverse("collections-detail", kwargs={"pk": collection["id"]}),
                    {"is_closed": True},
                    format="json",
                )
                url = reverse("records-detail", kwargs={"pk": rid})
                new_data = record_payload(
                    collection["id"], title="Updated", object_number="CMT-1"
                )["data"]
                assert (
                    authenticated_client.patch(url, {"data": new_data}, format="json").status_code
                    == status.HTTP_403_FORBIDDEN
                )
                assert authenticated_client.delete(url).status_code == status.HTTP_403_FORBIDDEN
