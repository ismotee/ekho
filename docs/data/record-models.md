Record
```
    identification_details: IdentificationDetails
    aquisition_details: AquisitionDetails
    rights: List<Rights>
    history: History
    description: Description
    access: Access
    object_location: ObjectLocation
    confidentiality: InformationConfidentiality
```

## REST API (locked shape)

Domain properties above are nested under the single key **`data`** on each record resource (list items, detail, create/update responses). Keys may be omitted or set to `null` when not populated; see domain modules for types.

**`representative_image`** is an optional **top-level** field on the record resource (not inside `data`): absolute URL string or `null`. It is a presentation/convenience field for list and detail thumbnails and does not appear in this domain block. Full specification: [API specification](../api-specification.md) (Record endpoints).

## Actor-shaped fields in `data`

Where the domain model names an **Actor** (acquisition actors, rights holders, history owners and roled actors, description inscriber/translator/interpretator/content person, spatial `owner`, etc.), persisted record JSON uses a **catalog reference** only:

```json
{ "id": <integer> }
```

The integer is the primary key of an **Actor** resource from `GET /api/actors/` (see [API specification](../api-specification.md)). Full person/organization documents live in that registry, not inline in the record.

**Legacy:** Older payloads may still contain inline `{ "person": … }` or `{ "organization": … }` objects. The UI prompts to re-select a catalog actor; the API accepts legacy shapes only where actor ids are absent (validation applies to `{ "id": … }` references only).
