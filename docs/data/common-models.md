Reference # consider abstract since this model is always inherited
```
    pref_label: Label,
    in_scheme: UrlField/CharField #url validation, optional
```

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