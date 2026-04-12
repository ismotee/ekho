Reference<OrganizationNameType> in finnish
```
    entinen nimi,
    koko nimi,
    muu nimi,
    peitenimi,
    puumerkki,
    rinnakkaisnimi,
    uusi nimi,
    vieraskielinen nimi,
    virallinen nimi,
    yksikön nimi
```

Reference<DateAssociation> in finnish
```
diariointiaika,
hankinta-aika,
julkaisuaika,
kuvausaika,
käyttöaika,
lahjoitusaika,
laina-aika,
luovutusaika,
lähetysaika,
löytöaika,
objektiin merkitty aika,
omistusaika,
painoaika,
poistoaika,
purkuaika,
rakennusaika,
saapumisaika,
skannausaika,
suunnitteluaika,
tuhoutumisaika,
valmistusaika,
vastaanottoaika
```

Reference<DateCertanity> options in finnish
```
aikaisintaan,
arvio,
ennen,
jälkeen,
noin,
viimeistään
```

Reference<DateQualifier> options, assign it to und field
```
-,
+,
-/+
```

Reference<DatePeriod> options,
get them from https://finto.fi/rest/v1/yso/data?uri=http%3A%2F%2Fwww.yso.fi%2Fonto%2Fyso%2Fp4623&format=application/ld%2Bjson


Reference<Association> options in finnish
```
aikaisempi omistaja,
alkuperäinen omistaja,
alkuperäisen aineiston omistaja,
arkistonmuodostaja,
haastateltu,
haastattelija,
hankinnan suorittaja,
kaivausten johtaja,
kaivertaja,
kerääjä,
kuvauksen kohde,
kyselyn laatija,
kyselyvastaaja,
käyttäjä,
laatija,
lahjoittaja,
luovuttaja,
myyjä,
omistaja,
rahoittaja,
rakennuttaja,
skannaaja,
suunnittelija,
tallettaja,
valaja,
valmistaja,
valokuvaaja,
valosuunnittelija,
välittäjä,
äänisuunnittelija
```

Reference<OrganizationNameType> options in finnish
```
entinen nimi,
koko nimi,
muu nimi,
peitenimi,
puumerkki,
rinnakkaisnimi,
uusi nimi,
vieraskielinen nimi,
virallinen nimi,
yksikön nimi
```

Reference<SpatialAssociation> options in finnish
```
alkuperäinen käyttöpaikka,
hankintapaikka,
keruupaikka,
kuvauspaikka,
käyttöpaikka,
laatimispaikka,
lahjoituspaikka,
luovutuspaikka,
löytöpaikka,
pääasiallinen käyttöpaikka,
rakennuksen sijaintipaikka,
valmistuspaikka,
vastauspaikka
```


Reference<SourceType> options in finnish
```
valokuva
verkkoaineisto
CD
asiakirja
julkaisu
artikkeli
```

Reference<OrganizationFunction>
# get it from finto.fi/yso/fi
# leave empty for now

Reference<AddressType> options in finnish
```
Katuosoite
Kotiosoite
Käyntiosoite
Postiosoite
Työpaikan osoite
```

Reference<OrganizationIdentifierType> options in finnish
```
ISNI
Y-tunnus
```

Reference<AddressType> options in finnish
```
Katuosoite
Kotiosoite
Käyntiosoite
Postiosoite
Työpaikan osoite
```

Reference<SpatialStatus> leave it empty for now

Reference<CoordinatesType> options in und
```
    ETRS-TM35FIN # tasokoordinaatit
    KKJ # maantieteelliset koordinaatit
```

Reference<SpatialFeature> options, empty for now

Reference<SpatialFeatureType> options, empty for now

Reference<PersonNameType> options, in finnish
```
 avionimi
 entinen nimi
 koko nimi
 lempinimi
 liikanimi
 muu nimi
 myöhempi nimi
 nimimerkki
 omaa sukua
 peitenimi
 puumerkki
 rinnakkaisnimi
 taiteilijanimi
 vieraskielinen nimi
 virallinen nimi
```

Reference<PersonGender> options, in finnish
```
mies
nainen
muu
ei tietoa
```

Reference<PersonNationality> options, in finnish
```
    suomi
```

Reference<PersonSchoolOrStyle> options, empty for now

Reference<PersonOccupation> options, empty for now

Label
```
    fi: <string>, # finnish translation 
    en: <string>, # english translation
    und <string>: # undefined language
```

NameDetail
```
    name: Label
    name_type: Reference<OrganizationNameType>
    addition_to_name: CharField
    earliest: DateDetail
    latest: DateDetail
    in_use: BooleanField # when true, included in catalog list / actor select display label
```

DateDetail
- Date format ISO 8601:2004
```
    single: Date
    certanity: Reference<DateCertanity>
    qualifier: Reference<DateQualifier>
```

Temporal
```
    association: DateAssociation
    earliest: DateDetail
    latest: DateDetail
    period: Reference<DatePeriod>
    note: CharField # description of the temporal detail
```

SpatialNameType
```
    address: CharField
    address_type: Reference<AddressType>
    email: CharField # email validation
    phone_number: CharField # phone number validation
```

SpatialContext
```
    text: CharField
    level: CharField
    date: Temporal
```

SpatialFeature
```
    feature: Reference<SpatialFeature>
    feature_type: Reference<SpatialFeatureType>
    feature_date: Temporal
```

Spatial
```
    association: Reference<SpatialAssociation>
    name: Label
    name_type: SpatialNameType
    acquisition_place_role: Reference<AcquisitionPlaceRole>  # hankinnan paikkatiedot
    content_place_role: Reference<AcquisitionPlaceRole>  # sisällön paikat (same vocabulary)
    note: CharField
    environmental_details: CharField
    status: Reference<SpatialStatus>
    coordinates: Coordinates # see common-models.md
    reference_number: ReferenceNumber #see common-models.md
    position: CharField
    owner: Actor # ForeignKey related_name role_spatial_owner
    context: SpatialContext
    feature: SpatialFeature
```

Source # abstract model
```
    source_type: Reference<SourceType>
    source_date: DateDetail
    note: string
```

Source<OrganizationHistorySource>
```
    author: Actor # ForeignKey related_name role_organization_history_source
```

Source<PersonHistorySource>
````
    author: Actor # ForeignKey related_name role_person_biographical_note_source
```

BiographicalNote
```
    note: TextField
    source: Source
```

OrganizationHistory
```
    foundation_date: DateDetail
    foundation_place: Spatial
    dissolution_date: DateDetail
    biographical_note: BiographicalNote
```

Address
```
    text: CharField
    type: Reference<AddressType>
    email: CharField #needs email validation
    phone_number: CharField # needs validation so that it conforms to the phone number convention
```

OrganizationIdentifier
```
    text: CharField
    type: Reference<OrganizationIdentifierType>
```

PersonName
```
    name: CharField
    date: DateDetail
    name_type: Reference<PersonNameType>
    in_use: BooleanField # when true, included in catalog list / actor select display label (per first/last/other group)
```

Person
```
    first_name: List<PersonName>
    last_name: List<PersonName>
    other_name: List<PersonName>
    additions_to_name: CharField
    birth_date: DateDetail
    place_of_birth: Spatial
    death_date: DateDetail
    gender: Reference<PersonGender>
    nationality: Reference<PersonNationality>
    address: Address
    website: CharField/UrlField # validation needed
    school_or_style: Reference<PersonSchoolOrStyle>
    biographical_note: BiographicalNote
    occupation: Reference<PersonOccupation>
    reference_number: ReferenceNumber
```

Organization
``` 
    name: List<NameDetail>
    history: OrganizationHistory
    function: Reference<OrganizationFunction>
    address: Address
    website: CharField # URL validation
    reference_number: Identifier
    contact_person: Person # optional; does not replace organization identity
```

Actor
```
    person: Person
    organization: Organization
```

**Registry and record references:** The application stores catalog actors via `POST /api/actors/` with a JSON body `{ "data": { "person": …, "organization": … } }`. **Exactly one** of `person` or `organization` must contain enough information to identify the actor (not both, not neither). An organization entry may include optional `contact_person`. In **record** `data` payloads, actor-shaped fields reference that catalog with `{ "id": <actor pk> }` only (see [record-models.md](record-models.md)).

Reference<ActorAssociation> options, in finnish
```
aikaisempi omistaja
alkuperäinen omistaja
alkuperäisen aineiston omistaja
arkistonmuodostaja
arkkitehti
asian hoitaja
esittäjä
haastateltu
haastattelija
hankinnan suorittaja
inventoija
julkaisija
kaivaja
kaivausten johtaja
kaivertaja
kehystäjä
kenttätyön tekijä
kerääjä
kirjailija
kirjoittaja
konservaattori
korjaaja
kuljettaja
kuriiri
kustantaja
kuvauksen kohde
kuvittaja
kyselyvastaaja
käsikirjoittaja
käyttäjä
laatija
lahjan antaja
lahjoittaja
lainan vastaanottaja
lainanantaja
lainapäätöksen tekijä
liikemerkin käyttäjä
lisenssin omistaja
luetteloija
luovuttaja
lähettäjä
löytäjä
maahantuoja
myyjä
omistaja
paikan omistaja
painaja
piirtäjä
päätöksen tekijä
rahoittaja
rakennuttaja
skannaaja
suunnittelija
säveltäjä
taiteilija
tallettaja
tavaramerkin omistaja
tekijä
tilaaja
toimittaja
tuottaja
tutkija
valaja
valmistaja
valmistuttaja
valokuvaaja
valosuunnittelija
vastaanottaja
välittäjä
äänisuunnittelija
```

RoledActor
```
actor: Actor
association: Reference<ActorAssociation>
```