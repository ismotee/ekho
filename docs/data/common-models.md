Label
```
fi: # finnish translation
en: # english translation
und: # undefined
```

Reference # abstract base — every `Reference<X>` uses this shape
```
    pref_label: Label,
    in_scheme: UrlField/CharField # url validation, optional
```

### `Reference<X>` (enumerated reference values)

- **Shape**: On the wire and in `Record.data`, every `Reference<ObjectType>`, `Reference<Language>`, etc. is a JSON object matching **Reference** above: required **`pref_label`** as **Label** (populate at least the language that matches the option list — usually **`fi`** when options are listed in Finnish); **`in_scheme`** optional.
- **Closed vocabulary**: `Reference<X>` is **not** a free-form string. The only valid values are those listed under the matching `Reference<X>` heading in these docs (some types live in this file, others in domain modules such as `identification-models.md`). Unknown values should be rejected once validation is tightened.
- **JSONField vs Django models**: The app stores domain trees in **`Record.data` (JSON)** so the schema can follow these docs without one migration per nested type. Enumerations can still be enforced in the API (e.g. allowlisted `pref_label.fi` per `X`). If you later need SQL filters, reporting, or admin-managed vocabularies, introduce **lookup tables or enums** for those concepts and store stable codes/URIs in JSON (keeping **`pref_label`** for display), rather than modeling every nested doc type as its own Django model.

Reference<ReferenceNumberType> options in finnish
```
    kaupunginosan numero
    korttelin numero
    muinaisjäännöstunnus
    projektin numero
    rakennustunnus
```

Coordinates
```
    text: CharField
    coordinates_qualifier: Number(integer)
    coordinates_type: Reference<CoordinatesType>
```

ReferenceNumber
```
    text: CharField
    type: Reference<ReferenceNumberType>
```

Reference<Language> options, in finnish
```
    suomi
    englanti
    ruotsi
```

Reference<Denomination> options, in finnish
```
 euro
 dollari
 rupla
 kruunu
 punta
```

Image (JSON / API serialization)

```
    # Absolute URL string to a stored image resource, or null if absent.
    # Same pattern as the Record resource field representative_image in the REST API.
    # Nested domain uses (e.g. Interpretation.photo) serialize as this string in responses;
    # dedicated upload flows for nested images may be added later.
```