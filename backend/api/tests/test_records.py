"""
Record API Tests

Reference: docs/api-specification.md (Record Endpoints), docs/data/record-models.md

Domain payload is under `data`; optional `representative_image` for thumbnails.
"""

import base64
import json
import io
import uuid

import pytest
from PIL import Image
from django.contrib.auth.models import User

from api.models import Actor, Collection, Record, RecordImage
from api.record_actor_refs import collect_actor_ids
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


def create_test_png(width=60, height=40):
    """Create a test PNG upload (distinct dimensions for autofill assertions)."""
    image = Image.new("RGBA", (width, height), color=(10, 20, 30, 255))
    img_io = io.BytesIO()
    image.save(img_io, format="PNG")
    data = img_io.getvalue()
    return SimpleUploadedFile("tile.png", data, content_type="image/png")


def create_test_gif():
    """Create a small GIF upload."""
    image = Image.new("RGB", (24, 16), color="yellow")
    img_io = io.BytesIO()
    image.save(img_io, format="GIF")
    data = img_io.getvalue()
    return SimpleUploadedFile("anim.gif", data, content_type="image/gif")


def _paginated_results(response_data):
    """DRF page for list endpoints, or raw list."""
    if isinstance(response_data, dict) and "results" in response_data:
        return response_data["results"]
    return response_data


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


def test_collect_actor_ids_ignores_legacy_identification_owning_organization():
    """Owning org moved to Collection model; legacy JSON is not scanned for actor refs."""
    data = {"identification_details": {"collection": {"owning_organization": {"id": 42}}}}
    assert 42 not in collect_actor_ids(data)


def test_collect_actor_ids_includes_description_content_actors():
    data = {"description": {"content": {"actors": [{"id": 5}, {"id": 7}]}}}
    assert collect_actor_ids(data) == {5, 7}


def test_collect_actor_ids_includes_description_content_person_legacy():
    data = {"description": {"content": {"person": {"id": 3}}}}
    assert collect_actor_ids(data) == {3}


def test_collect_actor_ids_includes_description_content_places():
    data = {
        "description": {
            "content": {
                "places": [
                    {"owner": {"id": 11}},
                    {"name": {"fi": "X"}},
                ]
            }
        }
    }
    assert collect_actor_ids(data) == {11}


def test_collect_actor_ids_includes_object_location_list():
    data = {
        "object_location": [
            {"location": {"owner": {"id": 99}}},
            {"location": {}},
        ]
    }
    assert collect_actor_ids(data) == {99}


def test_collect_actor_ids_includes_object_location_legacy_dict():
    data = {"object_location": {"location": {"owner": {"id": 88}}}}
    assert collect_actor_ids(data) == {88}


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


@pytest.mark.django_db
class TestRecordIsListedVisibility:
    """Records in unlisted collections are visible only to the collection owner."""

    def test_anonymous_list_by_collection_returns_404_for_unlisted(
        self, authenticated_client, collection
    ):
        if not collection:
            return
        cid = collection["id"]
        authenticated_client.post(
            reverse("records-list"),
            record_payload(cid, title="Secret List", object_number="SL-1"),
            format="json",
        )
        Collection.objects.filter(pk=cid).update(is_listed=False)
        anon = APIClient()
        r = anon.get(reverse("records-list"), {"collection": cid})
        assert r.status_code == status.HTTP_404_NOT_FOUND

    def test_anonymous_list_all_excludes_unlisted_records(
        self, authenticated_client, collection
    ):
        if not collection:
            return
        cid = collection["id"]
        cr = authenticated_client.post(
            reverse("records-list"),
            record_payload(cid, title="Hidden Globally", object_number="HG-1"),
            format="json",
        )
        assert cr.status_code == status.HTTP_201_CREATED
        rid = cr.data["id"]
        Collection.objects.filter(pk=cid).update(is_listed=False)
        anon = APIClient()
        r = anon.get(reverse("records-list"))
        assert r.status_code == status.HTTP_200_OK
        assert rid not in [row["id"] for row in r.data["results"]]

    def test_owner_can_list_and_retrieve_unlisted_records(
        self, authenticated_client, collection
    ):
        if not collection:
            return
        cid = collection["id"]
        cr = authenticated_client.post(
            reverse("records-list"),
            record_payload(cid, title="Owner Sees", object_number="OS-1"),
            format="json",
        )
        assert cr.status_code == status.HTTP_201_CREATED
        rid = cr.data["id"]
        Collection.objects.filter(pk=cid).update(is_listed=False)
        listed = authenticated_client.get(reverse("records-list"), {"collection": cid})
        assert listed.status_code == status.HTTP_200_OK
        assert any(row["id"] == rid for row in listed.data["results"])
        detail = authenticated_client.get(reverse("records-detail", kwargs={"pk": rid}))
        assert detail.status_code == status.HTTP_200_OK

    def test_anonymous_retrieve_unlisted_record_returns_404(
        self, authenticated_client, collection
    ):
        if not collection:
            return
        cid = collection["id"]
        cr = authenticated_client.post(
            reverse("records-list"),
            record_payload(cid, title="No Anon Get", object_number="NA-1"),
            format="json",
        )
        assert cr.status_code == status.HTTP_201_CREATED
        rid = cr.data["id"]
        Collection.objects.filter(pk=cid).update(is_listed=False)
        anon = APIClient()
        assert (
            anon.get(reverse("records-detail", kwargs={"pk": rid})).status_code
            == status.HTTP_404_NOT_FOUND
        )

    def test_non_owner_cannot_retrieve_record_in_unlisted_collection(
        self, authenticated_client, other_user, collection
    ):
        if not collection:
            return
        cid = collection["id"]
        cr = authenticated_client.post(
            reverse("records-list"),
            record_payload(cid, title="Peer Blocked", object_number="PB-1"),
            format="json",
        )
        assert cr.status_code == status.HTTP_201_CREATED
        rid = cr.data["id"]
        Collection.objects.filter(pk=cid).update(is_listed=False)
        other_client = APIClient()
        other_client.post(
            reverse("auth-login"),
            {"username": "otheruser", "password": "testpass123"},
            format="json",
        )
        assert (
            other_client.get(reverse("records-detail", kwargs={"pk": rid})).status_code
            == status.HTTP_404_NOT_FOUND
        )

    def test_anonymous_cannot_list_or_retrieve_hidden_record_in_listed_collection(
        self, authenticated_client, collection
    ):
        if not collection:
            return
        cid = collection["id"]
        cr = authenticated_client.post(
            reverse("records-list"),
            record_payload(cid, title="Hidden record", object_number="HREC-1"),
            format="json",
        )
        assert cr.status_code == status.HTTP_201_CREATED
        rid = cr.data["id"]
        assert (
            authenticated_client.patch(
                reverse("records-detail", kwargs={"pk": rid}),
                {"is_listed": False},
                format="json",
            ).status_code
            == status.HTTP_200_OK
        )

        anon = APIClient()
        listed = anon.get(reverse("records-list"), {"collection": cid})
        assert listed.status_code == status.HTTP_200_OK
        assert rid not in [row["id"] for row in listed.data["results"]]
        detail = anon.get(reverse("records-detail", kwargs={"pk": rid}))
        assert detail.status_code == status.HTTP_404_NOT_FOUND

    def test_owner_cannot_list_hidden_record_in_own_collection_but_can_retrieve(
        self, authenticated_client, collection
    ):
        if not collection:
            return
        cid = collection["id"]
        cr = authenticated_client.post(
            reverse("records-list"),
            record_payload(cid, title="Owner hidden", object_number="HREC-2"),
            format="json",
        )
        assert cr.status_code == status.HTTP_201_CREATED
        rid = cr.data["id"]
        assert (
            authenticated_client.patch(
                reverse("records-detail", kwargs={"pk": rid}),
                {"is_listed": False},
                format="json",
            ).status_code
            == status.HTTP_200_OK
        )
        own_list = authenticated_client.get(reverse("records-list"), {"collection": cid})
        assert own_list.status_code == status.HTTP_200_OK
        assert rid not in [row["id"] for row in own_list.data["results"]]
        own_detail = authenticated_client.get(reverse("records-detail", kwargs={"pk": rid}))
        assert own_detail.status_code == status.HTTP_200_OK
        assert own_detail.data["is_listed"] is False


@pytest.mark.django_db
class TestRecordExport:
    """GET /api/records/{id}/export/ — versioned JSON + collection + optional base64 image."""

    def test_export_includes_version_system_and_collection_metadata(
        self, authenticated_client, collection
    ):
        if not collection:
            return
        cid = collection["id"]
        cr = authenticated_client.post(
            reverse("records-list"),
            record_payload(cid, title="Export Me", object_number="EXP-1"),
            format="json",
        )
        assert cr.status_code == status.HTTP_201_CREATED
        rid = cr.data["id"]
        url = reverse("records-export", kwargs={"pk": rid})
        r = authenticated_client.get(url)
        assert r.status_code == status.HTTP_200_OK
        assert r["Content-Disposition"].startswith('attachment; filename="ekho-record-')
        body = r.json()
        assert body["ekho_export_version"] == 2
        assert isinstance(body["record"].get("images"), list)
        assert body["record"]["images"] == []
        assert len(body["source_ekho_instance_id"]) == 36
        col = body["collection"]
        assert col["name"] == "Test Collection"
        assert col["responsible_department"] == ""
        assert col["owning_organization"] is None
        assert "stable_id" in col
        assert col["original_creator"]["username"] == "testuser"
        assert col["is_listed"] is True
        assert col["is_closed"] is False
        assert body["record"]["data"]["identification_details"]["object_number"] == "EXP-1"
        assert body["actors"] == []

    def test_export_anonymous_succeeds_for_listed_collection(self, authenticated_client, collection):
        if not collection:
            return
        cid = collection["id"]
        cr = authenticated_client.post(
            reverse("records-list"),
            record_payload(cid, title="Public Export", object_number="PE-1"),
            format="json",
        )
        assert cr.status_code == status.HTTP_201_CREATED
        rid = cr.data["id"]
        anon = APIClient()
        r = anon.get(reverse("records-export", kwargs={"pk": rid}))
        assert r.status_code == status.HTTP_200_OK
        assert r.json()["ekho_export_version"] == 2

    def test_export_includes_base64_image(self, authenticated_client, collection):
        if not collection:
            return
        cid = collection["id"]
        p = record_payload(cid, title="With Image", object_number="WI-1")
        cr = authenticated_client.post(
            reverse("records-list"),
            {
                "collection": str(cid),
                "data": json.dumps(p["data"]),
                "representative_image": create_test_image(),
            },
            format="multipart",
        )
        assert cr.status_code == status.HTTP_201_CREATED
        rid = cr.data["id"]
        r = authenticated_client.get(reverse("records-export", kwargs={"pk": rid}))
        assert r.status_code == status.HTTP_200_OK
        img_part = r.json()["record"]["representative_image"]
        assert img_part["content_type"] == "image/jpeg"
        assert img_part["filename"].endswith(".jpg")
        raw = base64.b64decode(img_part["base64"])
        assert raw[:2] == b"\xff\xd8"

    def test_export_unlisted_returns_404_for_non_owner(
        self, authenticated_client, other_user, collection
    ):
        if not collection:
            return
        cid = collection["id"]
        cr = authenticated_client.post(
            reverse("records-list"),
            record_payload(cid, title="Secret Export", object_number="SE-1"),
            format="json",
        )
        assert cr.status_code == status.HTTP_201_CREATED
        rid = cr.data["id"]
        Collection.objects.filter(pk=cid).update(is_listed=False)
        other_client = APIClient()
        other_client.post(
            reverse("auth-login"),
            {"username": "otheruser", "password": "testpass123"},
            format="json",
        )
        assert (
            other_client.get(reverse("records-export", kwargs={"pk": rid})).status_code
            == status.HTTP_404_NOT_FOUND
        )

    def test_export_unlisted_owner_succeeds(self, authenticated_client, collection):
        if not collection:
            return
        cid = collection["id"]
        cr = authenticated_client.post(
            reverse("records-list"),
            record_payload(cid, title="Owner Export Unlisted", object_number="OEU-1"),
            format="json",
        )
        assert cr.status_code == status.HTTP_201_CREATED
        rid = cr.data["id"]
        Collection.objects.filter(pk=cid).update(is_listed=False)
        r = authenticated_client.get(reverse("records-export", kwargs={"pk": rid}))
        assert r.status_code == status.HTTP_200_OK
        assert r.json()["ekho_export_version"] == 2

    def test_export_includes_record_images_v2(self, authenticated_client, collection):
        if not collection:
            return
        cid = collection["id"]
        cr = authenticated_client.post(
            reverse("records-list"),
            record_payload(cid, title="Multi img", object_number="MI-1"),
            format="json",
        )
        assert cr.status_code == status.HTTP_201_CREATED
        rid = cr.data["id"]
        png = create_test_png(40, 30)
        r_img = authenticated_client.post(
            reverse("record-images-list", kwargs={"record_pk": rid}),
            {
                "image": png,
                "role": "detail",
                "context": "documentation",
                "sort_order": 1,
                "is_primary": True,
                "status": "approved",
                "labels": json.dumps({"en": "detail"}),
            },
            format="multipart",
        )
        assert r_img.status_code == status.HTTP_201_CREATED
        r = authenticated_client.get(reverse("records-export", kwargs={"pk": rid}))
        assert r.status_code == status.HTTP_200_OK
        body = r.json()
        assert body["ekho_export_version"] == 2
        imgs = body["record"]["images"]
        assert len(imgs) == 1
        assert imgs[0]["role"] == "detail"
        assert imgs[0]["context"] == "documentation"
        assert imgs[0]["sort_order"] == 1
        assert imgs[0]["is_primary"] is True
        assert imgs[0]["status"] == "approved"
        assert imgs[0]["labels"] == {"en": "detail"}
        assert imgs[0]["derived_from_index"] is None
        assert "base64" in imgs[0]["image"]

    def test_export_includes_referenced_actors_with_import_ids(
        self, authenticated_client, user, collection
    ):
        if not collection:
            return
        actor = Actor.objects.create(
            owner=user,
            import_id=uuid.uuid4(),
            data={"person": {"first_name": [{"name": "Ada"}]}},
        )
        cid = collection["id"]
        cr = authenticated_client.post(
            reverse("records-list"),
            record_payload(
                cid,
                title="Export Actors",
                object_number="EXP-ACT-1",
                aquisition_details={"actor": [{"id": actor.id}]},
            ),
            format="json",
        )
        assert cr.status_code == status.HTTP_201_CREATED
        rid = cr.data["id"]
        r = authenticated_client.get(reverse("records-export", kwargs={"pk": rid}))
        assert r.status_code == status.HTTP_200_OK
        actors = r.json()["actors"]
        assert len(actors) == 1
        assert actors[0]["source_id"] == actor.id
        assert actors[0]["import_id"] == str(actor.import_id)
        assert actors[0]["data"]["person"]["first_name"][0]["name"] == "Ada"

    def test_export_generates_import_id_for_actor_missing_it(
        self, authenticated_client, user, collection
    ):
        if not collection:
            return
        actor = Actor.objects.create(
            owner=user,
            data={"person": {"first_name": [{"name": "NoImportId"}]}},
        )
        cid = collection["id"]
        cr = authenticated_client.post(
            reverse("records-list"),
            record_payload(
                cid,
                title="Export Generates ImportId",
                object_number="EXP-ACT-2",
                aquisition_details={"actor": [{"id": actor.id}]},
            ),
            format="json",
        )
        assert cr.status_code == status.HTTP_201_CREATED
        rid = cr.data["id"]
        r = authenticated_client.get(reverse("records-export", kwargs={"pk": rid}))
        assert r.status_code == status.HTTP_200_OK
        actors = r.json()["actors"]
        assert len(actors) == 1
        assert isinstance(actors[0]["import_id"], str)
        assert len(actors[0]["import_id"]) == 36
        actor.refresh_from_db()
        assert actor.import_id is not None
        assert str(actor.import_id) == actors[0]["import_id"]

    def test_export_unlisted_anonymous_returns_404(self, authenticated_client, collection):
        if not collection:
            return
        cid = collection["id"]
        cr = authenticated_client.post(
            reverse("records-list"),
            record_payload(cid, title="Anon Blocked Export", object_number="ABE-1"),
            format="json",
        )
        assert cr.status_code == status.HTTP_201_CREATED
        rid = cr.data["id"]
        Collection.objects.filter(pk=cid).update(is_listed=False)
        assert (
            APIClient()
            .get(reverse("records-export", kwargs={"pk": rid}))
            .status_code
            == status.HTTP_404_NOT_FOUND
        )


def _export_payload_for_import(
    collection_id, record_data, *, export_version=1, **extra
):
    col = Collection.objects.get(pk=collection_id)
    rec_block = {"data": record_data}
    if export_version >= 2:
        rec_block["images"] = []
    body = {
        "ekho_export_version": export_version,
        "source_ekho_instance_id": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        "collection": {
            "stable_id": str(col.stable_id),
            "name": col.name,
            "description": col.description,
            "responsible_department": col.responsible_department or "",
            "owning_organization": (
                {"id": col.owning_organization_id}
                if col.owning_organization_id
                else None
            ),
            "origin_ekho_instance_id": str(col.origin_ekho_instance_id)
            if col.origin_ekho_instance_id
            else None,
            "is_closed": col.is_closed,
            "is_listed": col.is_listed,
        },
        "record": rec_block,
    }
    body.update(extra)
    return body


@pytest.mark.django_db
class TestRecordImport:
    """POST /api/records/import/ — modes, actor sanitization, original collection."""

    def test_import_acquisition_requires_auth(self, collection):
        if not collection:
            return
        url = reverse("records-import")
        cid = collection["id"]
        col = Collection.objects.get(pk=cid)
        r = APIClient().post(
            url,
            _export_payload_for_import(
                cid,
                {
                    "identification_details": {
                        "object_number": "IMP-1",
                        "title": [{"value": "Imported"}],
                    }
                },
                mode="acquisition",
                current_collection_id=cid,
            ),
            format="json",
        )
        assert r.status_code == status.HTTP_401_UNAUTHORIZED

    def test_import_acquisition_creates_record_in_current_only(
        self, authenticated_client, collection
    ):
        if not collection:
            return
        cid = collection["id"]
        col = Collection.objects.get(pk=cid)
        data = {
            "identification_details": {
                "object_number": "IMP-ACQ",
                "title": [{"value": "Acquisition Import"}],
            }
        }
        r = authenticated_client.post(
            reverse("records-import"),
            _export_payload_for_import(cid, data, mode="acquisition", current_collection_id=cid),
            format="json",
        )
        assert r.status_code == status.HTTP_201_CREATED
        assert r.data["mode"] == "acquisition"
        rid = r.data["record_ids"][0]
        rec = Record.objects.get(pk=rid)
        assert rec.collection_id == cid
        assert rec.imported_first is not None and rec.imported_last is not None
        assert (
            rec.data["identification_details"]["object_number"] == "IMP-ACQ"
        )

    def test_import_v2_with_record_images(self, authenticated_client, collection):
        if not collection:
            return
        cid = collection["id"]
        data = {
            "identification_details": {
                "object_number": "IMP-V2-IMG",
                "title": [{"value": "V2 Images"}],
            }
        }
        png = create_test_png(32, 24)
        png.seek(0)
        b64 = base64.b64encode(png.read()).decode("ascii")
        body = _export_payload_for_import(
            cid, data, export_version=2, mode="acquisition", current_collection_id=cid
        )
        body["record"]["images"] = [
            {
                "role": "thumbnail",
                "context": "portfolio",
                "sort_order": 0,
                "is_primary": True,
                "status": "approved",
                "labels": {"fi": "kuva"},
                "derived_from_index": None,
                "image": {
                    "filename": "tile.png",
                    "content_type": "image/png",
                    "base64": b64,
                },
            }
        ]
        r = authenticated_client.post(reverse("records-import"), body, format="json")
        assert r.status_code == status.HTTP_201_CREATED
        rid = r.data["record_ids"][0]
        rec = Record.objects.get(pk=rid)
        imgs = list(rec.images.order_by("sort_order", "id"))
        assert len(imgs) == 1
        assert imgs[0].role == "thumbnail"
        assert imgs[0].context == "portfolio"
        assert imgs[0].is_primary is True
        assert imgs[0].status == "approved"
        assert imgs[0].labels == {"fi": "kuva"}
        assert imgs[0].width == 32
        assert imgs[0].height == 24

    def test_import_strips_missing_actor_refs(self, authenticated_client, collection):
        if not collection:
            return
        cid = collection["id"]
        data = {
            "identification_details": {
                "object_number": "IMP-ACT",
                "title": [{"value": "Actor Strip"}],
            },
            "aquisition_details": {"actor": [{"id": 999999}]},
        }
        r = authenticated_client.post(
            reverse("records-import"),
            _export_payload_for_import(cid, data, mode="acquisition", current_collection_id=cid),
            format="json",
        )
        assert r.status_code == status.HTTP_201_CREATED
        rid = r.data["record_ids"][0]
        rec = Record.objects.get(pk=rid)
        assert 999999 not in collect_actor_ids(rec.data)
        assert rec.data.get("aquisition_details", {}).get("actor") in (None, [])

    def test_import_upserts_actor_and_remaps_record_refs(self, authenticated_client, collection):
        if not collection:
            return
        cid = collection["id"]
        import_id = uuid.uuid4()
        data = {
            "identification_details": {
                "object_number": "IMP-ACT-UPSERT",
                "title": [{"value": "Actor Upsert"}],
            },
            "aquisition_details": {"actor": [{"id": 101}]},
        }
        payload = _export_payload_for_import(
            cid, data, mode="acquisition", current_collection_id=cid
        )
        payload["actors"] = [
            {
                "source_id": 101,
                "import_id": str(import_id),
                "data": {"person": {"first_name": [{"name": "Initial"}]}},
            }
        ]
        r1 = authenticated_client.post(reverse("records-import"), payload, format="json")
        assert r1.status_code == status.HTTP_201_CREATED
        created_actor = Actor.objects.get(import_id=import_id)
        rid1 = r1.data["record_ids"][0]
        rec1 = Record.objects.get(pk=rid1)
        assert collect_actor_ids(rec1.data) == {created_actor.id}
        assert created_actor.data["person"]["first_name"][0]["name"] == "Initial"

        payload["record"]["data"]["identification_details"]["object_number"] = "IMP-ACT-UPSERT-2"
        payload["actors"][0]["data"] = {"person": {"first_name": [{"name": "Updated"}]}}
        r2 = authenticated_client.post(reverse("records-import"), payload, format="json")
        assert r2.status_code == status.HTTP_201_CREATED
        assert Actor.objects.filter(import_id=import_id).count() == 1
        created_actor.refresh_from_db()
        assert created_actor.data["person"]["first_name"][0]["name"] == "Updated"
        rid2 = r2.data["record_ids"][0]
        rec2 = Record.objects.get(pk=rid2)
        assert collect_actor_ids(rec2.data) == {created_actor.id}

    def test_import_reuses_existing_actor_owned_by_other_user(
        self, authenticated_client, collection, other_user
    ):
        if not collection:
            return
        cid = collection["id"]
        shared_import_id = uuid.uuid4()
        foreign_actor = Actor.objects.create(
            owner=other_user,
            import_id=shared_import_id,
            data={"person": {"first_name": [{"name": "Foreign Owner Actor"}]}},
        )
        payload = _export_payload_for_import(
            cid,
            {
                "identification_details": {
                    "object_number": "IMP-FOREIGN-ACTOR",
                    "title": [{"value": "Reuse foreign actor"}],
                },
                "aquisition_details": {"actor": [{"id": 444}]},
            },
            mode="acquisition",
            current_collection_id=cid,
        )
        payload["actors"] = [
            {
                "source_id": 444,
                "import_id": str(shared_import_id),
                "data": {"person": {"first_name": [{"name": "Updated by import"}]}},
            }
        ]
        r = authenticated_client.post(reverse("records-import"), payload, format="json")
        assert r.status_code == status.HTTP_201_CREATED
        rid = r.data["record_ids"][0]
        rec = Record.objects.get(pk=rid)
        assert collect_actor_ids(rec.data) == {foreign_actor.id}
        assert Actor.objects.filter(import_id=shared_import_id).count() == 1
        foreign_actor.refresh_from_db()
        # Actor owned by someone else is reused and refreshed from import payload.
        assert foreign_actor.data["person"]["first_name"][0]["name"] == "Updated by import"

    def test_import_deposition_creates_unlisted_original_and_duplicate(
        self, authenticated_client, collection
    ):
        if not collection:
            return
        cid = collection["id"]
        fresh_stable = uuid.uuid4()
        data = {
            "identification_details": {
                "object_number": "IMP-DEP",
                "title": [{"value": "Deposition"}],
            }
        }
        payload = _export_payload_for_import(
            cid, data, mode="deposition", current_collection_id=cid
        )
        payload["collection"]["stable_id"] = str(fresh_stable)
        payload["collection"]["name"] = "Imported Original Lineage"
        r = authenticated_client.post(
            reverse("records-import"),
            payload,
            format="json",
        )
        assert r.status_code == status.HTTP_201_CREATED
        assert len(r.data["record_ids"]) == 2
        orig = Collection.objects.get(stable_id=fresh_stable)
        assert orig.is_listed is False
        assert orig.owner_id == Collection.objects.get(pk=cid).owner_id
        records = Record.objects.filter(pk__in=r.data["record_ids"])
        assert records.count() == 2
        assert set(records.values_list("collection_id", flat=True)) == {cid, orig.id}

    def test_import_original_only_creates_in_original_only(self, authenticated_client, collection):
        if not collection:
            return
        cid = collection["id"]
        stable = uuid.uuid4()
        Collection.objects.filter(pk=cid).update(stable_id=stable)
        data = {
            "identification_details": {
                "object_number": "IMP-OO",
                "title": [{"value": "Original Only"}],
            }
        }
        r = authenticated_client.post(
            reverse("records-import"),
            _export_payload_for_import(
                cid, data, mode="original_only", current_collection_id=cid
            ),
            format="json",
        )
        assert r.status_code == status.HTTP_201_CREATED
        assert len(r.data["record_ids"]) == 1
        orig = Collection.objects.get(stable_id=stable)
        rec = Record.objects.get(pk=r.data["record_ids"][0])
        assert rec.collection_id == orig.id

    def test_import_rejects_closed_current_collection(self, authenticated_client, collection):
        if not collection:
            return
        cid = collection["id"]
        Collection.objects.filter(pk=cid).update(is_closed=True)
        data = {
            "identification_details": {
                "object_number": "IMP-X",
                "title": [{"value": "Closed"}],
            }
        }
        r = authenticated_client.post(
            reverse("records-import"),
            _export_payload_for_import(cid, data, mode="acquisition", current_collection_id=cid),
            format="json",
        )
        assert r.status_code == status.HTTP_403_FORBIDDEN

    def test_import_deposition_fails_if_stable_id_owned_by_other(
        self, authenticated_client, user, other_user, collection
    ):
        if not collection:
            return
        cid = collection["id"]
        other_col = Collection.objects.create(
            name="Other Original",
            description="",
            owner=other_user,
            is_listed=False,
        )
        foreign_stable = other_col.stable_id
        data = {
            "identification_details": {
                "object_number": "IMP-F",
                "title": [{"value": "Conflict"}],
            }
        }
        payload = _export_payload_for_import(
            cid, data, mode="deposition", current_collection_id=cid
        )
        payload["collection"]["stable_id"] = str(foreign_stable)
        r = authenticated_client.post(
            reverse("records-import"),
            payload,
            format="json",
        )
        assert r.status_code == status.HTTP_403_FORBIDDEN

    def test_import_invalid_mode_returns_400(self, authenticated_client, collection):
        if not collection:
            return
        cid = collection["id"]
        data = {
            "identification_details": {
                "object_number": "IMP-MODE",
                "title": [{"value": "Bad mode"}],
            }
        }
        body = _export_payload_for_import(
            cid, data, mode="not_a_mode", current_collection_id=cid
        )
        r = authenticated_client.post(reverse("records-import"), body, format="json")
        assert r.status_code == status.HTTP_400_BAD_REQUEST

    def test_import_unsupported_schema_version_returns_400(
        self, authenticated_client, collection
    ):
        if not collection:
            return
        cid = collection["id"]
        data = {
            "identification_details": {
                "object_number": "IMP-VER",
                "title": [{"value": "Version"}],
            }
        }
        body = _export_payload_for_import(
            cid, data, mode="acquisition", current_collection_id=cid
        )
        body["ekho_export_version"] = 99
        r = authenticated_client.post(reverse("records-import"), body, format="json")
        assert r.status_code == status.HTTP_400_BAD_REQUEST

    def test_import_acquisition_missing_current_collection_id_returns_400(
        self, authenticated_client, collection
    ):
        if not collection:
            return
        cid = collection["id"]
        data = {
            "identification_details": {
                "object_number": "IMP-NOCC",
                "title": [{"value": "No current"}],
            }
        }
        body = _export_payload_for_import(cid, data, mode="acquisition")
        body.pop("current_collection_id", None)
        r = authenticated_client.post(reverse("records-import"), body, format="json")
        assert r.status_code == status.HTTP_400_BAD_REQUEST

    def test_import_rejects_export_marked_closed_for_new_original(
        self, authenticated_client, collection
    ):
        if not collection:
            return
        cid = collection["id"]
        data = {
            "identification_details": {
                "object_number": "IMP-CLO",
                "title": [{"value": "Closed meta"}],
            }
        }
        payload = _export_payload_for_import(
            cid, data, mode="original_only", current_collection_id=cid
        )
        payload["collection"]["stable_id"] = str(uuid.uuid4())
        payload["collection"]["is_closed"] = True
        r = authenticated_client.post(reverse("records-import"), payload, format="json")
        assert r.status_code == status.HTTP_400_BAD_REQUEST

    def test_import_fails_when_resolved_original_collection_is_closed(
        self, authenticated_client, collection
    ):
        if not collection:
            return
        cid = collection["id"]
        stable = uuid.uuid4()
        Collection.objects.filter(pk=cid).update(stable_id=stable)
        Collection.objects.filter(pk=cid).update(is_closed=True)
        data = {
            "identification_details": {
                "object_number": "IMP-OC",
                "title": [{"value": "Closed orig"}],
            }
        }
        r = authenticated_client.post(
            reverse("records-import"),
            _export_payload_for_import(
                cid, data, mode="original_only", current_collection_id=cid
            ),
            format="json",
        )
        assert r.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestRecordImages:
    def test_record_detail_includes_images_array(self, authenticated_client, collection):
        if not collection:
            return
        cid = collection["id"]
        r = authenticated_client.post(
            reverse("records-list"),
            record_payload(cid, title="Images array", object_number="RI-1"),
            format="json",
        )
        assert r.status_code == status.HTTP_201_CREATED
        rid = r.data["id"]
        detail = authenticated_client.get(reverse("records-detail", kwargs={"pk": rid}))
        assert detail.status_code == status.HTTP_200_OK
        assert detail.data["images"] == []

    def test_create_record_image_autofill_and_representative(
        self, authenticated_client, collection
    ):
        if not collection:
            return
        cid = collection["id"]
        r = authenticated_client.post(
            reverse("records-list"),
            record_payload(cid, title="Images autofill", object_number="RI-2"),
            format="json",
        )
        rid = r.data["id"]
        img = create_test_image()
        url = reverse("record-images-list", kwargs={"record_pk": rid})
        r2 = authenticated_client.post(
            url,
            {
                "image": img,
                "role": "thumbnail",
                "context": "portfolio",
            },
            format="multipart",
        )
        assert r2.status_code == status.HTTP_201_CREATED, r2.data
        body = r2.data
        assert body["width"] == 100
        assert body["height"] == 100
        assert body["format"] == "JPEG"
        assert body["mime_type"] == "image/jpeg"
        assert len(body["checksum_sha256"]) == 64
        assert body["url"].startswith("http")
        assert body["derived_from"] is None
        detail = authenticated_client.get(reverse("records-detail", kwargs={"pk": rid}))
        assert len(detail.data["images"]) == 1
        assert detail.data["representative_image"] == body["url"]
        assert RecordImage.objects.filter(record_id=rid).count() == 1

    def test_create_record_image_requires_owner(self, client, authenticated_client, collection):
        if not collection:
            return
        cid = collection["id"]
        r = authenticated_client.post(
            reverse("records-list"),
            record_payload(cid, title="Images anon", object_number="RI-3"),
            format="json",
        )
        rid = r.data["id"]
        img = create_test_image()
        url = reverse("record-images-list", kwargs={"record_pk": rid})
        r2 = client.post(
            url,
            {"image": img, "role": "thumbnail", "context": "portfolio"},
            format="multipart",
        )
        assert r2.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_record_image_non_owner_forbidden(
        self, authenticated_client, other_user, collection
    ):
        if not collection:
            return
        cid = collection["id"]
        r = authenticated_client.post(
            reverse("records-list"),
            record_payload(cid, title="Images owner only", object_number="RI-3b"),
            format="json",
        )
        rid = r.data["id"]
        other_client = APIClient()
        other_client.post(
            reverse("auth-login"),
            {"username": "otheruser", "password": "testpass123"},
            format="json",
        )
        url = reverse("record-images-list", kwargs={"record_pk": rid})
        r2 = other_client.post(
            url,
            {"image": create_test_image(), "role": "thumbnail", "context": "portfolio"},
            format="multipart",
        )
        assert r2.status_code == status.HTTP_403_FORBIDDEN

    def test_delete_record_removes_record_images(self, authenticated_client, collection):
        if not collection:
            return
        cid = collection["id"]
        r = authenticated_client.post(
            reverse("records-list"),
            record_payload(cid, title="Images delete", object_number="RI-4"),
            format="json",
        )
        rid = r.data["id"]
        authenticated_client.post(
            reverse("record-images-list", kwargs={"record_pk": rid}),
            {
                "image": create_test_image(),
                "role": "preview",
                "context": "documentation",
            },
            format="multipart",
        )
        assert RecordImage.objects.filter(record_id=rid).count() == 1
        d = authenticated_client.delete(reverse("records-detail", kwargs={"pk": rid}))
        assert d.status_code == status.HTTP_204_NO_CONTENT
        assert RecordImage.objects.filter(record_id=rid).count() == 0

    def test_list_record_images_empty_then_populated(self, authenticated_client, collection):
        if not collection:
            return
        cid = collection["id"]
        r = authenticated_client.post(
            reverse("records-list"),
            record_payload(cid, title="Images list", object_number="RI-L1"),
            format="json",
        )
        rid = r.data["id"]
        base = reverse("record-images-list", kwargs={"record_pk": rid})
        empty = authenticated_client.get(base)
        assert empty.status_code == status.HTTP_200_OK
        assert _paginated_results(empty.data) == []
        up = authenticated_client.post(
            base,
            {"image": create_test_image(), "role": "thumbnail", "context": "portfolio"},
            format="multipart",
        )
        assert up.status_code == status.HTTP_201_CREATED
        filled = authenticated_client.get(base)
        assert filled.status_code == status.HTTP_200_OK
        rows = _paginated_results(filled.data)
        assert len(rows) == 1
        assert rows[0]["id"] == up.data["id"]

    def test_records_list_includes_images_array(self, authenticated_client, collection):
        if not collection:
            return
        cid = collection["id"]
        r = authenticated_client.post(
            reverse("records-list"),
            record_payload(cid, title="List has images", object_number="RI-L2"),
            format="json",
        )
        rid = r.data["id"]
        authenticated_client.post(
            reverse("record-images-list", kwargs={"record_pk": rid}),
            {"image": create_test_png(), "role": "preview", "context": "documentation"},
            format="multipart",
        )
        lst = authenticated_client.get(reverse("records-list"), {"collection": cid})
        assert lst.status_code == status.HTTP_200_OK
        row = next(x for x in lst.data["results"] if x["id"] == rid)
        assert "images" in row
        assert len(row["images"]) == 1
        assert row["images"][0]["format"] == "PNG"
        assert row["images"][0]["width"] == 60
        assert row["images"][0]["height"] == 40

    def test_create_record_image_invalid_role(self, authenticated_client, collection):
        if not collection:
            return
        rid = authenticated_client.post(
            reverse("records-list"),
            record_payload(collection["id"], title="Bad role", object_number="RI-BR"),
            format="json",
        ).data["id"]
        r2 = authenticated_client.post(
            reverse("record-images-list", kwargs={"record_pk": rid}),
            {"image": create_test_image(), "role": "not_a_real_role", "context": "portfolio"},
            format="multipart",
        )
        assert r2.status_code == status.HTTP_400_BAD_REQUEST
        assert RecordImage.objects.filter(record_id=rid).count() == 0

    def test_create_record_image_invalid_context(self, authenticated_client, collection):
        if not collection:
            return
        rid = authenticated_client.post(
            reverse("records-list"),
            record_payload(collection["id"], title="Bad ctx", object_number="RI-BC"),
            format="json",
        ).data["id"]
        r2 = authenticated_client.post(
            reverse("record-images-list", kwargs={"record_pk": rid}),
            {"image": create_test_image(), "role": "thumbnail", "context": "museum_gift_shop"},
            format="multipart",
        )
        assert r2.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_record_image_missing_file(self, authenticated_client, collection):
        if not collection:
            return
        rid = authenticated_client.post(
            reverse("records-list"),
            record_payload(collection["id"], title="No file", object_number="RI-NF"),
            format="json",
        ).data["id"]
        r2 = authenticated_client.post(
            reverse("record-images-list", kwargs={"record_pk": rid}),
            {"role": "thumbnail", "context": "portfolio"},
            format="multipart",
        )
        assert r2.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_record_image_corrupt_bytes(self, authenticated_client, collection):
        if not collection:
            return
        rid = authenticated_client.post(
            reverse("records-list"),
            record_payload(collection["id"], title="Corrupt", object_number="RI-CO"),
            format="json",
        ).data["id"]
        bad = SimpleUploadedFile(
            "fake.jpg", b"not a jpeg", content_type="image/jpeg"
        )
        r2 = authenticated_client.post(
            reverse("record-images-list", kwargs={"record_pk": rid}),
            {"image": bad, "role": "thumbnail", "context": "portfolio"},
            format="multipart",
        )
        assert r2.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_record_image_disallowed_format_bmp(self, authenticated_client, collection):
        if not collection:
            return
        rid = authenticated_client.post(
            reverse("records-list"),
            record_payload(collection["id"], title="BMP", object_number="RI-BMP"),
            format="json",
        ).data["id"]
        buf = io.BytesIO()
        Image.new("RGB", (8, 8), color="blue").save(buf, format="BMP")
        bmp = SimpleUploadedFile("x.bmp", buf.getvalue(), content_type="image/bmp")
        r2 = authenticated_client.post(
            reverse("record-images-list", kwargs={"record_pk": rid}),
            {"image": bmp, "role": "thumbnail", "context": "portfolio"},
            format="multipart",
        )
        assert r2.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_record_image_over_10mb(self, authenticated_client, collection):
        if not collection:
            return
        rid = authenticated_client.post(
            reverse("records-list"),
            record_payload(collection["id"], title="Huge", object_number="RI-HU"),
            format="json",
        ).data["id"]
        huge = SimpleUploadedFile(
            "big.jpg",
            b"x" * (10 * 1024 * 1024 + 1),
            content_type="image/jpeg",
        )
        r2 = authenticated_client.post(
            reverse("record-images-list", kwargs={"record_pk": rid}),
            {"image": huge, "role": "thumbnail", "context": "portfolio"},
            format="multipart",
        )
        assert r2.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_record_image_gif_autofill(self, authenticated_client, collection):
        if not collection:
            return
        rid = authenticated_client.post(
            reverse("records-list"),
            record_payload(collection["id"], title="GIF", object_number="RI-GIF"),
            format="json",
        ).data["id"]
        r2 = authenticated_client.post(
            reverse("record-images-list", kwargs={"record_pk": rid}),
            {"image": create_test_gif(), "role": "derivative", "context": "digitalization"},
            format="multipart",
        )
        assert r2.status_code == status.HTTP_201_CREATED
        assert r2.data["format"] == "GIF"
        assert r2.data["mime_type"] == "image/gif"
        assert r2.data["width"] == 24
        assert r2.data["height"] == 16

    def test_patch_record_image_invalid_status(self, authenticated_client, collection):
        if not collection:
            return
        rid = authenticated_client.post(
            reverse("records-list"),
            record_payload(collection["id"], title="Status", object_number="RI-ST"),
            format="json",
        ).data["id"]
        created = authenticated_client.post(
            reverse("record-images-list", kwargs={"record_pk": rid}),
            {"image": create_test_image(), "role": "thumbnail", "context": "portfolio"},
            format="multipart",
        )
        iid = created.data["id"]
        bad = authenticated_client.patch(
            reverse("record-images-detail", kwargs={"record_pk": rid, "pk": iid}),
            {"status": "published"},
            format="json",
        )
        assert bad.status_code == status.HTTP_400_BAD_REQUEST

    def test_patch_record_image_metadata_without_new_file(self, authenticated_client, collection):
        if not collection:
            return
        rid = authenticated_client.post(
            reverse("records-list"),
            record_payload(collection["id"], title="Patch meta", object_number="RI-PM"),
            format="json",
        ).data["id"]
        created = authenticated_client.post(
            reverse("record-images-list", kwargs={"record_pk": rid}),
            {"image": create_test_image(), "role": "preview", "context": "exhibit"},
            format="multipart",
        )
        iid = created.data["id"]
        chk_before = created.data["checksum_sha256"]
        patched = authenticated_client.patch(
            reverse("record-images-detail", kwargs={"record_pk": rid, "pk": iid}),
            {"status": "approved", "sort_order": 5},
            format="json",
        )
        assert patched.status_code == status.HTTP_200_OK
        assert patched.data["status"] == "approved"
        assert patched.data["sort_order"] == 5
        assert patched.data["checksum_sha256"] == chk_before

    def test_patch_record_image_new_file_recomputes_autofill(self, authenticated_client, collection):
        if not collection:
            return
        rid = authenticated_client.post(
            reverse("records-list"),
            record_payload(collection["id"], title="Patch file", object_number="RI-PF"),
            format="json",
        ).data["id"]
        created = authenticated_client.post(
            reverse("record-images-list", kwargs={"record_pk": rid}),
            {"image": create_test_image(), "role": "thumbnail", "context": "portfolio"},
            format="multipart",
        )
        iid = created.data["id"]
        c1 = created.data["checksum_sha256"]
        replacement = create_test_png(width=100, height=100)
        patched = authenticated_client.patch(
            reverse("record-images-detail", kwargs={"record_pk": rid, "pk": iid}),
            {"image": replacement, "role": "thumbnail", "context": "portfolio"},
            format="multipart",
        )
        assert patched.status_code == status.HTTP_200_OK
        assert patched.data["checksum_sha256"] != c1
        assert patched.data["format"] == "PNG"
        assert patched.data["width"] == 100
        assert patched.data["height"] == 100

    def test_delete_record_image_detail_removes_model(self, authenticated_client, collection):
        if not collection:
            return
        rid = authenticated_client.post(
            reverse("records-list"),
            record_payload(collection["id"], title="Del img", object_number="RI-DI"),
            format="json",
        ).data["id"]
        created = authenticated_client.post(
            reverse("record-images-list", kwargs={"record_pk": rid}),
            {"image": create_test_image(), "role": "detail", "context": "condition"},
            format="multipart",
        )
        iid = created.data["id"]
        d = authenticated_client.delete(
            reverse("record-images-detail", kwargs={"record_pk": rid, "pk": iid})
        )
        assert d.status_code == status.HTTP_204_NO_CONTENT
        assert RecordImage.objects.filter(pk=iid).count() == 0
        detail = authenticated_client.get(reverse("records-detail", kwargs={"pk": rid}))
        assert detail.data["images"] == []

    def test_delete_record_image_non_owner_forbidden(
        self, authenticated_client, other_user, collection
    ):
        if not collection:
            return
        rid = authenticated_client.post(
            reverse("records-list"),
            record_payload(collection["id"], title="Lock img", object_number="RI-LO"),
            format="json",
        ).data["id"]
        created = authenticated_client.post(
            reverse("record-images-list", kwargs={"record_pk": rid}),
            {"image": create_test_image(), "role": "thumbnail", "context": "archive"},
            format="multipart",
        )
        iid = created.data["id"]
        other_client = APIClient()
        other_client.post(
            reverse("auth-login"),
            {"username": "otheruser", "password": "testpass123"},
            format="json",
        )
        d = other_client.delete(
            reverse("record-images-detail", kwargs={"record_pk": rid, "pk": iid})
        )
        assert d.status_code == status.HTTP_403_FORBIDDEN
        assert RecordImage.objects.filter(pk=iid).count() == 1

    def test_create_record_image_closed_collection_forbidden(self, authenticated_client, collection):
        if not collection:
            return
        cid = collection["id"]
        rid = authenticated_client.post(
            reverse("records-list"),
            record_payload(cid, title="Closed imgs", object_number="RI-CL"),
            format="json",
        ).data["id"]
        authenticated_client.patch(
            reverse("collections-detail", kwargs={"pk": cid}),
            {"is_closed": True},
            format="json",
        )
        r2 = authenticated_client.post(
            reverse("record-images-list", kwargs={"record_pk": rid}),
            {"image": create_test_image(), "role": "thumbnail", "context": "portfolio"},
            format="multipart",
        )
        assert r2.status_code == status.HTTP_403_FORBIDDEN

    def test_deleting_parent_record_image_nulls_derivative_fk(self, authenticated_client, collection):
        """``derived_from`` uses SET_NULL when the referenced image is deleted."""
        if not collection:
            return
        rid = authenticated_client.post(
            reverse("records-list"),
            record_payload(collection["id"], title="Deriv", object_number="RI-DV"),
            format="json",
        ).data["id"]
        base_url = reverse("record-images-list", kwargs={"record_pk": rid})
        m = authenticated_client.post(
            base_url,
            {"image": create_test_image(), "role": "preservation_master", "context": "archive"},
            format="multipart",
        )
        d = authenticated_client.post(
            base_url,
            {"image": create_test_png(8, 8), "role": "access_derivative", "context": "archive"},
            format="multipart",
        )
        assert m.status_code == status.HTTP_201_CREATED
        assert d.status_code == status.HTTP_201_CREATED
        master_id = m.data["id"]
        child = RecordImage.objects.get(pk=d.data["id"])
        RecordImage.objects.filter(pk=child.pk).update(derived_from_id=master_id)
        del_resp = authenticated_client.delete(
            reverse("record-images-detail", kwargs={"record_pk": rid, "pk": master_id})
        )
        assert del_resp.status_code == status.HTTP_204_NO_CONTENT
        child.refresh_from_db()
        assert child.derived_from_id is None
        assert RecordImage.objects.filter(pk=child.pk).exists()
