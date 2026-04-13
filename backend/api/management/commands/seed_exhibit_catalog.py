"""
Load global (ownerless) organization actors for exhibit / import workflows.

See docs/deployment/actors-for-import.md
"""

from __future__ import annotations

import json
from pathlib import Path

from django.core.management.base import BaseCommand

from api.actor_catalog_validate import validate_actor_catalog_data
from api.models import Actor


class Command(BaseCommand):
    help = (
        "Create global Actor rows from api/fixtures/exhibit_organization_actors.json "
        "(or a JSON file you pass with --file). Safe to run multiple times only if you "
        "use --skip-existing with matching keys (see docs)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=str,
            default=None,
            help="Path to JSON array of {key, data} organization actors.",
        )
        parser.add_argument(
            "--skip-existing",
            action="store_true",
            help="Skip entries whose key already exists on a global actor "
            "(matched via data._ekho_seed_key).",
        )

    def handle(self, *args, **options):
        default_path = (
            Path(__file__).resolve().parent.parent.parent            / "fixtures"
            / "exhibit_organization_actors.json"
        )
        path = Path(options["file"] or default_path)
        raw = path.read_text(encoding="utf-8")
        rows = json.loads(raw)
        if not isinstance(rows, list):
            self.stderr.write(self.style.ERROR("Fixture must be a JSON array."))
            return
        skip = options["skip_existing"]
        created = 0
        for i, row in enumerate(rows):
            if not isinstance(row, dict) or "data" not in row:
                self.stderr.write(
                    self.style.ERROR(f"Row {i}: expected object with 'data'.")
                )
                return
            key = row.get("key")
            data = row["data"]
            if not isinstance(data, dict):
                self.stderr.write(self.style.ERROR(f"Row {i}: data must be an object."))
                return
            try:
                validated = validate_actor_catalog_data(data)
            except Exception as exc:
                self.stderr.write(
                    self.style.ERROR(f"Row {i}: invalid actor data: {exc}")
                )
                return
            to_save = dict(validated)
            if key:
                to_save = {**to_save, "_ekho_seed_key": str(key)}
                if skip:
                    exists = any(
                        isinstance(a.data, dict)
                        and a.data.get("_ekho_seed_key") == str(key)
                        for a in Actor.objects.filter(owner__isnull=True)
                    )
                    if exists:
                        self.stdout.write(f"Skip existing key={key!r}")
                        continue
            actor = Actor.objects.create(owner=None, data=to_save)
            created += 1
            label = key or f"row_{i}"
            self.stdout.write(
                self.style.SUCCESS(
                    f"Created global organization actor id={actor.pk} key={label!r}"
                )
            )
        self.stdout.write(self.style.SUCCESS(f"Done. Created {created} actor(s)."))
