# Curator runbook: exports and exhibit handoff

## Before you start

- Work in your **collection** on your local Ekho (pre-exhibition instance). Ensure the collection is **open** (not closed) while editing.
- If the venue uses shared **organization** actors, see [deployment/actors-for-import.md](deployment/actors-for-import.md) so catalog rows exist where you import.

## Exporting a record

1. Open the record in the UI (or note its numeric **id** from the address bar or API).
2. Download the export: **GET** `/api/records/{id}/export/` (from the browser while logged in, or via API client). You receive a JSON file (`ekho-record-{id}.json`).
3. Current format version is **`ekho_export_version`: 2**. It includes domain `data`, optional **representative** image, and an **`images`** array for all record-attached images (with metadata and embedded files).

**File naming:** use a clear pattern, e.g. `export-{object_number}-{date}.json`, so exhibit staff can trace imports.

## Import modes (exhibit or consolidation server)

**POST** `/api/records/import/` with a logged-in user who **owns** the target collection.

| `mode` | Use when |
|--------|----------|
| `acquisition` | The exhibit **only** needs a copy in the **current** collection. Set `current_collection_id` to that collection’s id. |
| `deposition` | You need both the **lineage** collection (from export `collection.stable_id`) **and** a copy in the **current** collection. |
| `original_only` | You only want the row in the **original** / lineage collection, not in the current one. |

Always send `ekho_export_version`, `collection`, `record`, and `mode`. For `acquisition` and `deposition`, **`current_collection_id`** is required.

Imported rows get `imported_first` / `imported_last` set on the server (internal bookkeeping).

## Actor references in `record.data`

References to actors (people, organizations) that **do not exist** on the importing server may be **removed** automatically so the import succeeds. If you need those links on the exhibit, coordinate catalog setup with IT **before** import.

## Handoff to exhibit IT

1. Deliver export JSON files (and confirm **same app version / migrations** as the exhibit server).
2. State which **import mode** to use and the target **collection id** (or ask them to create a collection and tell you its id).
3. After import, spot-check records and images in the UI.

For technical deployment steps (settings, smoke test, tagging), see [backend/DEPLOY.md](../backend/DEPLOY.md).
