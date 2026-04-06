Reference<ObjectStatus>
```
dia originaalista
dia reproduktiosta
duplikaatti
esityö
fragmentti
harjoitelma
holotyyppi
jälkituotantodia
jälkituotantonegatiivi
jälkituotantovedos
jälkivalos
kopio
kuva objektista
luonnos
mallikappale
muu yhteys
negatiivi originaalista
negatiivi reproduktiosta
originaali
osa
osa kokonaisuudesta
paratyyppi
pienoismalli
prototyyppi
rariteetti
rinnakkaiskuva
samanlainen
sarjatuote
toinen parista
tyyppiesimerkki
vedos originaalista
vedos reproduktiosta
väärennös
```

Reference<ObjectComponentName> options empty for now

Reference<PhotoFormat> options, in finnish
```
dia
kuvatiedosto
negatiivi
vedos
```

Reference<Orientation> options, in finnish
```
pysty
vaaka
muu
```

Reference<Audio> options, in finnish
```
mykkä
ääni
```

Reference<Form> options empty for now

PhysicalDescription
```
    object_status: Reference<ObjectStatus>
    object_component_name: Reference<ObjectComponentName>
    text: TextField
    photo_format: Reference<PhotoFormat>
    orientation: Reference<Orientation>
    color: Reference<Color>
    audio: Reference<Audio>
    form: Reference<FormOfInstallation>
    edition_number: CharField
    copy_number: Number # Integer
```

Reference<MaterialType> options empty for now

Reference<MaterialComponentType> empty for now


MaterialComponent
```
type: Reference<MaterialComponentType>
note: TextField
```

Material
```
type: Reference<MaterialType>
name: TextField
source: Spatial
component: List<MaterialComponent>
```

Reference<InscriptionType> options, in finnish
```
allekirjoitus
etiketti
graffiti
julkaisumerkintä
kaiverrus
kirjoitus
koholeima
kokomerkintä
koriste
leima
liikemerkki
lisenssi
merkintä
monogrammi
motto
nimi
nimikirjaimet
nimikirjoitus
omistajanmerkki
pesumerkintä
polttomerkki
postileima
puumerkki
päiväys
rajausmerkintä
riimukirjoitus
sarjanumero
signeeraus
sinetti
syväleima
taittomerkintä
tarra
tavaramerkki
tuotemerkki
vaakuna
valmistusmaa
valmistusmerkintä
valosmerkintä
vedosmerkintä
vedostusmerkintä
vesileima
```

Reference<InscriptionMethod> options, in finnish
```
kaiverrus
kirjoitus
kirjonta
kohokirjonta
koholeima
konekirjoitus
koneleima
konestanssaus
kudonta
kuulakärkikynä
käsinkirjoitus
käsin tehty
leikkaus
leimaus
liimaaminen
lyijykynä
lyöminen
lävistys
maalaus
metallilaatta
mustekynä
niittaus
ompelu
painatus
pakotus
raaputus
siirtokuva
stanssaus
syväleima
syövytys
tekstaus
tussi
upotus
valaminen
valotus
viiltäminen
värileima
```

Reference<InscriptionDirection> options empty for now

Interpretation
```
text: TextField
interpretator: Actor
date: Temporal
photo: Image
```

Translation
```
translator: Actor
text: TextField
language: Reference<Language>

```

`Image` is defined in [common-models.md](common-models.md) (absolute URL string or null in JSON/API).

Inscription
```
position: CharField
content: TextField
description: TextField
script: Reference<Script>
language: Reference<Language>
translation: List<Translation>
transliteration: TextField
type: Reference<InscriptionType>
method: Reference<InscriptionMethod>
direction: Reference<InscriptionDirection>
inscriber: Actor
date: Temporal
interpretation: List<Interpretation>
```

Reference<MeasurementName> options, in finnish
```
leveys
pituus
syvyys
korkeus
paino
tilavuus
pinta-ala
```

Reference<MeasurementUnit> options, in finnish
```
m
g
m^2
m^3
pixel
```

Measurement
```
unit: Reference<MeasurementName>
value: Number
measurement_unit: Reference<MeasurementUnit>
value_qualifier: TextField
```

Reference<ContentActivity> empty for now

Reference<ContentEventName> options empty for now

Reference<ContentEventType> options empty for now

ContentEvent
```
name: Reference<ContentEventName>
type: Reference<ContentEventType>
```

Reference<ContentPosition> options empty for now

Reference<ContentScript> options empty for now

Reference<ContentStyle> options empty for now

Reference<GeneralConcept> options empty for now

Reference<Classification> options empty for now

Content
```
description: TextField
person: Actor
date: Temporal
place: Spatial
activity: Reference<ContentActivity>
event: List<ContentEvent>
position: Reference<ContentPosition>
script: Reference<ContentScript>
language: Reference<Language>
note: TextField
style: List<Reference<ContentStyle>>
general_concept: Reference<GeneralConcept>
classification: Reference<Classification>
```

Description
```
physical_description: PhysicalDescription
material: List<Material>
technical_attribute: List<Measurement>
inscription: List<Inscription>
dimension: List<Measurement>
content: Content
```
