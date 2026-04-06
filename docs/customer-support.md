# Customer support guide (Ekho)

Audience: **internal support**, success, and anyone helping end users. For developers, see the [Developer guide](developer-guide.md) and [API specification](api-specification.md).

---

## What Ekho is

Ekho is an **art collection management** web app. Users organize **collections**; each collection holds **records** (individual artworks or objects). **Anyone can browse** collections and records (no login required for viewing). **Changing data** (create/edit/delete collections and records) requires an account and the right **ownership** rules.

---

## Collections

| Topic | What to tell the user |
|--------|------------------------|
| **Owner** | Only the user who owns the collection can rename it, close it, or add/edit/delete records in it. |
| **Closed collection** | When a collection is **closed**, it becomes **read-only**: records cannot be created, updated, or deleted. Viewing still works. Only the owner closed it; they may need to work with the product team if reopening is not available in the UI yet. |
| **Visibility** | Lists and details are intended to be **public** for viewing; there is no “private collection” mode in the baseline stories—confirm with product if that changes. |

---

## Records (current model)

Records are no longer a flat “title / artist / year” form only in the backend: **catalog information** lives in a structured JSON payload exposed by the API under the field name **`data`**. The UI may show sections such as identification, acquisition, description, history, rights, access, location, and confidentiality.

**Representative image**

- The **thumbnail** shown in lists and at the top of the record detail view comes from an optional field **`representative_image`** (a single uploaded image).
- It is **separate from** deep fields inside `data` (for example, photos referenced only inside description or interpretation objects do not automatically become the list thumbnail unless the product maps them that way).

**How the app picks a title line on cards (typical behavior)**

- Prefer a main title from identification when present; otherwise object name or object number; otherwise a neutral label such as “Untitled record.”
- Exact wording can evolve; if a user says “my card title is wrong,” check identification fields and the representative image first.

---

## Permissions quick reference

| Action | Who can do it |
|--------|----------------|
| View collections / records | Generally anyone (unauthenticated allowed for list/detail in the product design). |
| Create / edit / delete **collection** | Owner only. |
| Create / edit / delete **record** | Collection **owner** only, and collection must **not** be closed. |

If a user gets **403 Forbidden** or the UI hides edit actions: confirm they are logged in as the **collection owner** and the collection is **not closed**.

---

## Search and filters (records list)

- **Search** matches text in the **collection name**, **collection description**, and **any substring inside the record’s stored `data` JSON** (implementation treats the JSON as text). Users do not need to know field names; very short queries may return many hits.
- Filters such as **collection name** (partial match) and **owner** (exact username) can narrow results. Combine with search when needed.

---

## Images and uploads

- Creating or updating a record **with a new image** uses **multipart** requests: form fields include `collection`, JSON string `data`, and file `representative_image` where applicable. If the client only updates JSON, JSON-only requests are supported when no new file is sent—see [API specification](api-specification.md) (Record endpoints).
- Supported formats and size limits follow product settings; common expectations are **JPG, PNG, GIF** and reasonable max size (confirm in API or deployment config if a user hits upload errors).

---

## Common issues and responses

| Symptom | Likely cause | Suggested response |
|---------|----------------|-------------------|
| “I can’t edit my record” | Not the owner, or collection is **closed**, or session expired | Confirm ownership and closed status; ask them to sign in again. |
| “I don’t see my new record in search” | Pagination, filters, or search not matching JSON text | Clear filters; try an distinctive word from identification; check page navigation. |
| “Thumbnail is missing” | No **representative_image** uploaded | They can add or replace the representative image in the form when the UI allows it. |
| “Back button goes to the wrong place” | Known navigation behavior | See [Known bugs](known-bugs.md) (BUG-001). |

For **setup** problems (local dev, migrations, environment), use the [Developer guide — Troubleshooting](developer-guide.md#troubleshooting), not this page.

---

## Where to escalate

1. **[Known bugs](known-bugs.md)** — confirmed product defects and status.  
2. **[API specification](api-specification.md)** — authoritative request/response shapes and error codes.  
3. **Engineering** — data loss, security, or repeated 5xx errors: open a ticket with steps, time (UTC), user or collection id if safe to share, and screenshots.

---

## Related documentation

| Document | Use for |
|----------|---------|
| [User stories — Records](user-stories/03-records.md) | Intended behavior and acceptance criteria (some lines may predate the domain JSON model—defer to API spec when they conflict). |
| [Record management design](design/03-record-management-design.md) | UI section order, form patterns, accessibility notes. |
| [Data models — Record](data/models.md#record-model) | How `data` and `representative_image` are stored. |
| [Record domain shape](data/record-models.md) | Technical field groups inside `data`. |
