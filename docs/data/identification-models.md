Reference<ObjectType> — **shape**: **Reference** in [common-models.md](common-models.md) (`pref_label`: **Label**, optional `in_scheme`). **Allowed values** (Finnish labels; closed set):

```
arkistoaineisto
asiakirja
esine
liikkuva kuva
luonnonympäristö
muu näyte
painettu tekstijulkaisu
rakennettu ympäristö
rakennus
taideteos
valokuva
äänite
```

Reference<ObjectNameValue> — **shape**: **Reference** in [common-models.md](common-models.md). Allowed values: *to be listed (closed set).*

Reference<ObjectNameType> — **shape**: **Reference** in [common-models.md](common-models.md). **Allowed values** (Finnish labels; closed set):

```
pääluokka
erikoisluokka
```

ObjectName
```
    value: Reference<ObjectNameValue>
    type: Reference<ObjectNameType>
    language: Reference<Language>
```

Reference<TitleType> — **shape**: **Reference** in [common-models.md](common-models.md). **Allowed values** (Finnish labels; closed set):

```
aihe
 kerääjän antama nimi
 käyttäjän antama nimi
 luetteloijan antama nimi
 mallin nimi ja/ tai numero
 omistajan antama nimi
 rakennuttajan antama nimi
 sarjan nimi
 suunnittelijan antama nimi
 taiteilijan antama nimi
 tekijän antama nimi
 teosnimi
 tuotteen nimi
 valokuvaajan antama nimi
 yleisesti tunnettu nimi
```

TitleTranslation
```
    value: CharField
    translator: Person
    translation_time: Temporal
    note: TextField
```

Title
```
    value: CharField
    type: Reference<TitleType>
    language: Reference<Language>
    translation: List<TitleTranslation>
    note: TextField
```

Catalogue membership is the REST resource field **`Record.collection`** (FK to `Collection`), not part of `identification_details`.

IdentificationDetails
```
    object_type: Reference<ObjectType>
    object_number: CharField
    object_name: List<ObjectName>
    title: List<Title>
    number_of_objects: Number<Integer> # unsigned non-zero
```