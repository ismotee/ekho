"""Management command seed_exhibit_catalog."""

import json
from pathlib import Path

import pytest
from django.core.management import call_command

from api.models import Actor


@pytest.mark.django_db
def test_seed_exhibit_catalog_creates_global_org_actor():
    fixture = (
        Path(__file__).resolve().parent.parent / "fixtures" / "exhibit_organization_actors.json"
    )
    data = json.loads(fixture.read_text(encoding="utf-8"))
    key = data[0]["key"]
    before = Actor.objects.filter(owner__isnull=True).count()
    call_command("seed_exhibit_catalog", file=str(fixture))
    after = Actor.objects.filter(owner__isnull=True).count()
    assert after == before + 1
    created = Actor.objects.filter(owner__isnull=True).order_by("-id").first()
    assert created is not None
    assert created.data.get("_ekho_seed_key") == key


@pytest.mark.django_db
def test_seed_exhibit_catalog_skip_existing():
    fixture = (
        Path(__file__).resolve().parent.parent / "fixtures" / "exhibit_organization_actors.json"
    )
    call_command("seed_exhibit_catalog", file=str(fixture))
    n = Actor.objects.filter(owner__isnull=True).count()
    call_command("seed_exhibit_catalog", file=str(fixture), skip_existing=True)
    assert Actor.objects.filter(owner__isnull=True).count() == n
