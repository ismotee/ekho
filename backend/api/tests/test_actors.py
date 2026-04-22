"""Actor registry API and record actor reference validation."""

import pytest

pytestmark = pytest.mark.django_db
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from api.models import Actor, Collection, Record


@pytest.fixture
def user():
    return User.objects.create_user(username="auser", password="pass12345")


@pytest.fixture
def other_user():
    return User.objects.create_user(username="buser", password="pass12345")


@pytest.fixture
def staff_user():
    u = User.objects.create_user(username="staffer", password="pass12345", is_staff=True)
    return u


@pytest.fixture
def auth_client(user):
    c = APIClient()
    c.post(reverse("auth-login"), {"username": "auser", "password": "pass12345"}, format="json")
    return c


@pytest.fixture
def other_client(other_user):
    c = APIClient()
    c.post(reverse("auth-login"), {"username": "buser", "password": "pass12345"}, format="json")
    return c


@pytest.fixture
def staff_client(staff_user):
    c = APIClient()
    c.post(reverse("auth-login"), {"username": "staffer", "password": "pass12345"}, format="json")
    return c


@pytest.fixture
def global_actor():
    return Actor.objects.create(
        owner=None,
        data={"person": {}, "organization": {"name": [{"name": {"fi": "Global Museum"}}]}},
    )


@pytest.fixture
def user_actor(user):
    return Actor.objects.create(
        owner=user,
        data={
            "person": {"first_name": [{"name": "Jane"}], "last_name": [{"name": "Doe"}]},
            "organization": {},
        },
    )


@pytest.fixture
def collection(auth_client, user):
    r = auth_client.post(
        reverse("collections-list"),
        {"name": "C1", "description": ""},
        format="json",
    )
    assert r.status_code == status.HTTP_201_CREATED
    return Collection.objects.get(pk=r.data["id"])


def test_list_actors_anonymous_sees_all(global_actor, user_actor):
    client = APIClient()
    r = client.get(reverse("actors-list"))
    assert r.status_code == status.HTTP_200_OK
    ids = {x["id"] for x in r.data["results"]}
    assert global_actor.id in ids
    assert user_actor.id in ids


def test_list_actors_authenticated_sees_global_and_own(global_actor, user_actor, auth_client):
    r = auth_client.get(reverse("actors-list"))
    assert r.status_code == status.HTTP_200_OK
    ids = {x["id"] for x in r.data["results"]}
    assert global_actor.id in ids
    assert user_actor.id in ids


def test_anonymous_actor_writes_forbidden(global_actor, user_actor):
    client = APIClient()
    create = client.post(
        reverse("actors-list"),
        {"data": {"person": {}, "organization": {"name": [{"name": {"fi": "Anon Org"}}]}}},
        format="json",
    )
    assert create.status_code == status.HTTP_403_FORBIDDEN

    patch = client.patch(
        reverse("actors-detail", kwargs={"pk": user_actor.pk}),
        {"data": {"person": {"first_name": [{"name": "Anon"}]}, "organization": {}}},
        format="json",
    )
    assert patch.status_code == status.HTTP_403_FORBIDDEN

    delete = client.delete(reverse("actors-detail", kwargs={"pk": global_actor.pk}))
    assert delete.status_code == status.HTTP_403_FORBIDDEN


def test_create_actor_rejects_both_sides_empty(auth_client):
    r = auth_client.post(
        reverse("actors-list"),
        {"data": {"person": {}, "organization": {}}},
        format="json",
    )
    assert r.status_code == status.HTTP_400_BAD_REQUEST


def test_create_actor_rejects_person_and_organization_both_identify(auth_client):
    r = auth_client.post(
        reverse("actors-list"),
        {
            "data": {
                "person": {"first_name": [{"name": "Pat"}]},
                "organization": {"name": [{"name": {"fi": "Acme Oy"}}]},
            },
        },
        format="json",
    )
    assert r.status_code == status.HTTP_400_BAD_REQUEST


def test_create_organization_with_contact_person(auth_client):
    r = auth_client.post(
        reverse("actors-list"),
        {
            "data": {
                "person": {},
                "organization": {
                    "name": [{"name": {"fi": "Museum"}}],
                    "contact_person": {"first_name": [{"name": "Kim"}], "last_name": [{"name": "Contact"}]},
                },
            },
        },
        format="json",
    )
    assert r.status_code == status.HTTP_201_CREATED
    assert r.data["data"]["organization"]["contact_person"]["last_name"][0]["name"] == "Contact"


def test_create_actor(auth_client):
    r = auth_client.post(
        reverse("actors-list"),
        {"data": {"person": {}, "organization": {"name": [{"name": {"fi": "My Org"}}]}}},
        format="json",
    )
    assert r.status_code == status.HTTP_201_CREATED
    assert r.data["owner"]["username"] == "auser"
    assert r.data["data"]["organization"]["name"][0]["name"]["fi"] == "My Org"


def test_can_see_other_user_actor_detail_read_only(other_client, user_actor):
    r = other_client.get(reverse("actors-detail", kwargs={"pk": user_actor.pk}))
    assert r.status_code == status.HTTP_200_OK
    assert r.data["id"] == user_actor.id


def test_usage_endpoint(auth_client, collection, user_actor):
    body = {
        "collection": collection.id,
        "data": {
            "identification_details": {"object_number": "X1", "title": [{"value": "T1"}]},
            "aquisition_details": {"actor": [{"id": user_actor.id}]},
        },
    }
    cr = auth_client.post(reverse("records-list"), body, format="json")
    assert cr.status_code == status.HTTP_201_CREATED
    r = auth_client.get(reverse("actors-usage", kwargs={"pk": user_actor.pk}))
    assert r.status_code == status.HTTP_200_OK
    assert r.data["count"] == 1
    assert r.data["records"][0]["id"] == cr.data["id"]


def test_delete_actor_strips_refs(auth_client, collection, user_actor):
    cr = auth_client.post(
        reverse("records-list"),
        {
            "collection": collection.id,
            "data": {
                "identification_details": {"object_number": "X2"},
                "aquisition_details": {"actor": [{"id": user_actor.id}]},
            },
        },
        format="json",
    )
    assert cr.status_code == status.HTTP_201_CREATED
    rec_id = cr.data["id"]
    dr = auth_client.delete(reverse("actors-detail", kwargs={"pk": user_actor.pk}))
    assert dr.status_code == status.HTTP_204_NO_CONTENT
    rec = Record.objects.get(pk=rec_id)
    acq = rec.data.get("aquisition_details") or {}
    assert not acq.get("actor")


def test_record_reject_foreign_private_actor(auth_client, collection, user_actor, other_client):
    """other_user's record cannot reference auser's private actor."""
    col_r = other_client.post(
        reverse("collections-list"),
        {"name": "C2", "description": ""},
        format="json",
    )
    assert col_r.status_code == status.HTTP_201_CREATED
    col2 = Collection.objects.get(pk=col_r.data["id"])
    rr = other_client.post(
        reverse("records-list"),
        {
            "collection": col2.id,
            "data": {
                "identification_details": {"object_number": "Y1"},
                "aquisition_details": {"actor": [{"id": user_actor.id}]},
            },
        },
        format="json",
    )
    assert rr.status_code == status.HTTP_400_BAD_REQUEST


def test_record_accepts_global_actor(auth_client, collection, global_actor):
    r = auth_client.post(
        reverse("records-list"),
        {
            "collection": collection.id,
            "data": {
                "identification_details": {"object_number": "Z1"},
                "aquisition_details": {"actor": [{"id": global_actor.id}]},
            },
        },
        format="json",
    )
    assert r.status_code == status.HTTP_201_CREATED


def test_collection_accepts_person_as_owning_organization(auth_client, collection, user_actor):
    r = auth_client.patch(
        reverse("collections-detail", kwargs={"pk": collection.id}),
        {"owning_organization": {"id": user_actor.id}},
        format="json",
    )
    assert r.status_code == status.HTTP_200_OK
    assert r.data["owning_organization"]["id"] == user_actor.id


def test_collection_accepts_organization_as_owning_organization(auth_client, collection):
    org = Actor.objects.create(
        owner=None,
        data={"person": {}, "organization": {"name": [{"name": {"fi": "State Museum"}}]}},
    )
    r = auth_client.patch(
        reverse("collections-detail", kwargs={"pk": collection.id}),
        {"owning_organization": {"id": org.id}},
        format="json",
    )
    assert r.status_code == status.HTTP_200_OK
    assert r.data["owning_organization"]["id"] == org.id


def test_global_actor_not_editable_by_user(auth_client, global_actor):
    r = auth_client.patch(
        reverse("actors-detail", kwargs={"pk": global_actor.pk}),
        {"data": {"organization": {"name": [{"name": {"fi": "Hacked"}}]}}},
        format="json",
    )
    assert r.status_code == status.HTTP_403_FORBIDDEN


def test_global_actor_editable_by_staff(staff_client, global_actor):
    r = staff_client.patch(
        reverse("actors-detail", kwargs={"pk": global_actor.pk}),
        {"data": {"organization": {"name": [{"name": {"fi": "Updated"}}]}}},
        format="json",
    )
    assert r.status_code == status.HTTP_200_OK
    global_actor.refresh_from_db()
    assert global_actor.data["organization"]["name"][0]["name"]["fi"] == "Updated"
