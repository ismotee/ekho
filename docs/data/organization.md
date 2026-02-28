Reference<OtherNameType> in finnish
```
    entinen nimi,
    koko nimi,
    muu nimi,
    peitenimi,
    puumerkki,
    rinnakkaisnimi,
    uusi nimi,
    vieraskielinen nimi,
    virallinen nimi
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

Reference<DatePeriod> options, get them from https://finto.fi/rest/v1/yso/data?uri=http%3A%2F%2Fwww.yso.fi%2Fonto%2Fyso%2Fp4623&format=application/ld%2Bjson


(form these into json that conforms to the Reference structure. No in_scheme)
Reference<OrganizationAssociation> options in finnish
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

Reference<OtherNameType> options in finnish
```
entinen nimi, koko nimi, muu nimi, peitenimi, puumerkki, rinnakkaisnimi, uusi nimi, vieraskielinen nimi, virallinen nimi
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


Reference<SourceType> in finnish
```
valokuva
verkkoaineisto
CD
asiakirja
julkaisu
artikkeli
```

Reference<OrganizationFunction>
get it from finto.fi/yso/fi
```
```

Reference<AddressType> in finnish
```
Katuosoite
Kotiosoite
Käyntiosoite
Postiosoite
Työpaikan osoite
```

Reference<OrganizationIdentifierType> in finnish
```
ISNI
Y-tunnus
```

Label
```
    fi: <string>, # finnish translation 
    en: <string>, # english translation
    und <string>: # undefined language
```

Reference
```
    pref_label: Label,
    in_scheme: string #url validation, optional
```

OtherName
```
    name: Label
    type: Reference<OtherNameType>
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
    text: string # description of the temporal detail
```

Spatial
```
    association: Reference<SpatialAssociation>
    name: Label
    name_type: 
```

Source
```
    source: string
    source_type: Reference<SourceType>
    source_date: DateDetail
    note: string
```

OrganizationHistory
```
    foundation_date: Temporal
    foundation_place: Spatial
    dissolution_date: Temporal
    text: string # can be long text
    source: Source
```


Address
```
    text: string
    type: Reference<AddressType>
    email: string
    phone_number: string # needs validation so that it conforms to the phone number convention
```

OrganizationIdentifier
```
    text: string
    type: Reference<OrganizationIdentifierType>
```

Organization
``` 
    association: List<Reference<OrganizationAssociation> >
    main_body: Label
    sub_body Label
    other_name: List<OtherName>
    addition_to_name: string
    name_date: Temporal
    history: OrganizationHistory
    function: Reference<OrganizationFunction>
    address: Address
    website: string # URL validation
    reference_number: Identifier
```
