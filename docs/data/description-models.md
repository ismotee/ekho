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

ObjectComponent (repeatable under PhysicalDescription)
```
description: TextField
object_name: ObjectName   # same Reference vocabularies as identification object_name (value / type / language)
object_number: CharField
```

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

Reference<Audio>
```
mykkä
mono
stereo 2.0
Dolby Digital 5.1
Dolby Surround 7.1
```

Reference<Color> — YSA värit (Y100352), narrower concepts from Finto https://finto.fi/ysa/fi/page/Y100352
```
harmaa
indigo
keltainen
liturgiset värit
musta
oranssi
punainen
ruskea
sininen
tunnusvärit
valkoinen
vihreä
violetti
```

Reference<FormOfInstallation> (kiinnitys- tai säilytysmenetelmä)
```
märkänä säilytettynä
kuivana säilytettynä
pingotettuna
passe-partout
kehystetty
kuvakulmilla kiinnitetty
liimattu
lasitettuna
pohjustettuna
```

PhysicalDescription
```
    object_status: Reference<ObjectStatus>
    object_component: List<ObjectComponent>
    text: TextField
    photo_format: Reference<PhotoFormat>
    orientation: Reference<Orientation>
    color: Reference<Color>
    audio: Reference<Audio>
    form: Reference<FormOfInstallation>
    edition_number: CharField
    copy_number: Number # Integer
```

Reference<MaterialType> — Finnish labels from Finto MAO/TAO *materiaalit* (http://www.yso.fi/onto/mao/p1731): grouped in the UI by each direct narrower concept; selectable values are **leaf** concepts only. Regenerate `frontend/src/data/maoMaterialGroups.ts` via `node scripts/fetch_mao_material_groups.mjs`.

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

ContentDateEntry
```
# Same fields as DateDetail (single, certanity, qualifier, …) plus:
content_time_role: Reference<?>   # optional; sisällön ajan rooli
```

Content
```
description: TextField
actors: List<Actor>
dates: List<ContentDateEntry>
places: List<Spatial>
activity: Reference<ContentActivity>
event: List<ContentEvent>
position: CharField   # vapaa teksti; kohta tai paikka objektissa
script: Reference<ContentScript>
language: Reference<Language>
note: TextField
style: List<Reference<MAOTAOStyle>>   # MAO/TAO tyylit, juuri http://www.yso.fi/onto/mao/p178 (Finto)
general_concept: List<Reference<KOKO>>   # KOKO (http://www.yso.fi/onto/koko/), Finto search
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

## Description field hints (from `tables/OHJEET.csv`)

### PhysicalDescription

- `object_status`: Luetteloitavan objektin asema tai status suhteessa muihin samanlaisiin.
- `object_component[]`: Objektin osia tai komponentteja; kullakin rivillä `description`, `object_name` (sama rakenne ja sanastot kuin tunnistetietojen objektin nimellä) ja `object_number` (osan tunniste).
- `text` (Fyysinen kuvaus): Objektin ulkoasun tai ulkonäön sanallinen kuvaus. Kuvaus kirjoitetaan kokonaisin lausein kieliopin mukaisesti.
- `photo_format`: Termi, joka kuvaa objektin ulkoista olemusta.
- `orientation`: Objektin kuva-alan suuntaa kuvaava määre.
- `color`: Objektin väri. Kirjataan värit, jotka ovat tärkeitä objektin tunnistamisen tai löytämisen kannalta.
- `audio`: Audiovisuaalisen aineiston äänellisyys.
- `form`: Näytteen tai objektin kiinnitys- tai säilytysmenetelmä.
- `edition_number`: Numero, joka on annettu valmistajan samaan aikaan valmistamalle objektiryhmälle.
- `copy_number`: Valmistajan objektille antama numero, kun objektia on tehty rajattu erä tai erityispainos.

### Material

- `type`: Perusmateriaalit, joista objekti muodostuu.
- `name`: Materiaalista yleensä käytetty nimi tai perusmateriaalin tarkempi määrittely.
- `source`: Objektin valmistamisessa käytetyn materiaalin tai objektin maantieteellinen alkuperä.
- `component[].type`: Objektin materiaaliin liittyvän merkittävän ainesosan, lisäyksen tai jäljen nimitys.
- `component[].note`: Tarkentavaa tietoa materiaalin ainesosasta.

### Technical attributes and dimensions

- `technical_attribute[].unit` / `dimension[].unit`: Suure on mitattava ominaisuus, kuten pituus tai paino.
- `technical_attribute[].value` / `dimension[].value`: Numeraalinen tieto suureen mitasta.
- `technical_attribute[].measurement_unit` / `dimension[].measurement_unit`: Mittayksikkö, joka ilmoitetaan mittaluvun yhteydessä.
- `technical_attribute[].value_qualifier` / `dimension[].value_qualifier`: Mittaluvun tilastollinen poikkeama eli annetun luvun tarkkuus, kun siitä ei olla varmoja.

### Inscriptions

- `position`: Kohta tai osa objektista, jossa merkintä sijaitsee.
- `content`: Objektissa oleva tekstimuotoinen merkintä sillä kielellä, jolla merkintä objektissa on.
- `description`: Objektissa olevan ei-tekstuaalisen merkinnän kuvailu.
- `script`: Kirjoitusjärjestelmä, jolla merkintä on tehty.
- `language`: Kieli, jolla tekstuaalinen merkintä on kirjoitettu objektiin.
- `translation[].text`: Tekstuaalisen merkinnän käännös museon käyttämälle kielelle, jos merkintä on tehty muulla kuin museon yleisesti käyttämällä kielellä.
- `transliteration`: Tekstuaalisen merkinnän translitteroitu versio.
- `type`: Merkinnän muoto tai tyyppi.
- `method`: Menetelmä, jolla merkintä on tehty objektiin.
- `direction`: Merkinnän sijainti- tai kirjoitussuunta.
- `inscriber`: Merkinnän tehnyt henkilö, henkilöryhmä tai organisaatio.
- `date`: Ajankohta, jolloin merkintä on tehty.
- `interpretation[].text`: Tulkinta objektissa olevasta merkinnästä.
- `interpretation[].interpretator`: Henkilö tai organisaatio, joka on tehnyt tulkinnan merkinnästä.
- `interpretation[].date`: Ajankohta, jolloin merkinnän tulkinta tehtiin.
- `interpretation[].photo`: Merkintään liittyvä kuva.

### Content

- `description`: Sanallinen, yleisluontoinen kuvaus objektista tai objektissa kuvaillusta asiasta.
- `actors[]`: Objektissa kuvatut tai objektin kuvailemat henkilöt, organisaatiot tai henkilöryhmät (toistettava lista).
- `dates[]`: Objektissa kuvatut tai objektin kuvailemat ajankohdat (toistettava lista; kullakin rivillä kalenteripäivä ja laajennetut aikatiedot kuten `DateDetail`, sekä valinnainen `content_time_role` eli sisällön ajan rooli).
- `places[]`: Objektissa kuvatut tai objektin kuvailemat paikat (toistettava lista; sama `Spatial`-rakenne kuin muissa kentissä).
- `activity`: Objektissa kuvattu tai objektin kuvailema toiminta.
- `event[].name`: Objektissa kuvattu tai objektin kuvailema tapahtuma.
- `event[].type`: Termi, joka kuvaa sisältöön liittyvän tapahtuman luonnetta.
- `position`: Kohta tai paikka objektissa, jossa kuvailtu tieto sijaitsee.
- `script`: Kirjoitusjärjestelmä, jota käyttäen objektin tekstuaalinen sisältö on kirjoitettu.
- `language`: Kieli, jolla objektin tekstuaalinen sisältö on kirjoitettu.
- `note`: Lisätietoja objektin sisällöstä. Kirjataan vain sellaisia tietoja, joita ei ole jo muiden ohjeiden mukaisesti kirjattu.
- `style[]`: Tyylit ja koulukunnat MAO/TAO-sanastosta (Finto; juuri http://www.yso.fi/onto/mao/p178).
- `general_concept[]`: Asiasanat KOKO-sanastosta (Finto); useita termejä.
- `classification`: Luokitusjärjestelmien luokat, joilla kuvaillaan objektin tyyppiä, merkitystä, kontekstia, ulkoasua tai muita ominaisuuksia.

### Content hints with Finnish field labels

- `Toiminta` (`content.activity`): Objektissa kuvattu tai objektin kuvailema toiminta. Esimerkki: soittaminen, maanpuolustus, veneenrakennus.
- `Sijainti` (`content.position`): Kohta tai paikka objektissa, jossa kuvailtu tieto sijaitsee.
- `Kirjoitusjärjestelmä` (`content.script`): Kirjoitusjärjestelmä, jota käyttäen objektin tekstuaalinen sisältö on kirjoitettu.
- `Kieli` (`content.language`): Kieli, jolla objektin tekstuaalinen sisältö on kirjoitettu.
- `Asiasanat` (`content.general_concept[]`): KOKO-käsitteitä (Finto); objektin sisältöä, kontekstia, merkitystä, ulkoasua tai muita ominaisuuksia kuvaavat termit.
- `Luokitus` (`content.classification`): Luokitusjärjestelmät sisältävät luokkia, joiden avulla voidaan kuvailla objektin tyyppiä, merkitystä, kontekstia, ulkoasua ja muita ominaisuuksia.
- `Sisällön tapahtumat` (`content.event[]`):
  - `Sisällön tapahtuma` (`content.event[].name`): Objektissa kuvattu tai objektin kuvailema tapahtuma.
  - `Sisällön tapahtuman tyyppi` (`content.event[].type`): Termi, joka kuvaa sisältöön liittyvän tapahtuman luonnetta.
