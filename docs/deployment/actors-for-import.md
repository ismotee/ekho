# Organization actors and record import

## Why this matters

Record export JSON can include `collection.owning_organization` as `{ "id": <integer> }` pointing at an **Actor** row (organization catalog entry). On the **importing** Ekho instance:

- If that actor id does not exist, import still succeeds, but the field is not preserved the same way as on the source (collection serializer / import path resolves the id when present).
- **Actor references inside `record.data`** are **sanitized** on import: unknown or inaccessible actor ids are **stripped** so the payload remains valid (see API specification, Import record).

For a predictable exhibit server, create the same **global** (ownerless) organization actors on every deployment that needs matching ids, **before** bulk import.

## Seeding global organizations

The backend includes a fixture and management command:

- Fixture: [backend/api/fixtures/exhibit_organization_actors.json](../../backend/api/fixtures/exhibit_organization_actors.json) (JSON array of `{ "key", "data" }` objects).
- Command: `python manage.py seed_exhibit_catalog`  
  - Optional: `--file /path/to/custom.json`  
  - Optional: `--skip-existing` — skips a row when a global actor already has `data._ekho_seed_key` equal to that row’s `key`.

Each created actor is **global** (`owner=null`). The internal field `data._ekho_seed_key` is used only for idempotent re-runs with `--skip-existing`; it is not part of the public catalog schema and should not be edited through normal API flows.

## Operational note

Primary keys (`id`) differ between databases. If you rely on `owning_organization.id` matching across prep laptops and the exhibit server, you must either:

1. Align actors manually (same ids — impractical with SQLite across machines), or  
2. Treat organization links as **best-effort** per instance and re-assign `owning_organization` on the exhibit after import, or  
3. Prefer exports where `owning_organization` is null and set organization on the canonical server only.

The seed command is mainly for giving the exhibit (and prep installs) a **consistent named set** of venue organizations so staff can attach the right org before export.
