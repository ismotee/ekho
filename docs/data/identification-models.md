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

Reference<ObjectNameValue> — **shape**: **Reference** in [common-models.md](common-models.md). **Allowed values** (Finnish `pref_label.fi`; closed set = leaf concepts under MAO/TAO [taideteokset](http://www.yso.fi/onto/mao/p2990) from Finto; regenerate `frontend/src/data/maoObjectNameValues.ts` via `node scripts/fetch_mao_object_name_values.mjs`):

```
akvarellit
alttari-ikonit
anekuvat
diptyykit
fotomontaasit
freskot
graffitit
holvimaalaukset
ihmishahmoiset idolit
installaatiot
kalliomaalaukset (maalaukset)
kattomaalaukset
kollaasit
käyrät savi-idolit
laatukuvat
lahjoittajakuvat
lasimaalaukset
lasimaalausjäljitelmät
lintuidolit
luolamaalaukset
medaljongit (maalaukset)
meripihkaidolit
miniatyyrit (maalaukset)
monotypiat
mosaiikit
muraalit
omakuvat
Paimion idolit
patsaat
pentatyykit
pii-idolit
polyptyykit
puistoveistokset
puuveistokset
rakentajamaalaukset
reliefit (veistokset)
tilateokset
tondot
triptyykit
täysplastiset veistokset
vaivaisukot
öljymaalaukset
```

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