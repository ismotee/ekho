Reference<OwnershipExchangeMethod> option, in finnish
```
ei tietoa
huutokauppa
keruu
lahja
lahjoitus
lunastus
muu
osto
perintö
siirto
```

OwnershipExchange
```
method: Reference<OwnershipExchangeMethod>
price: number
denomination: Reference<Denomination>
note: CharField
```

Ownership
```
owner: Actor
date: Temporal
place: Spatial
exchange: OwnershipExchange
```

Reference<TechniqueType> options, in finnish
```
ammattimainen käsityö
käsityö
taide
teollinen
```

ObjectProductInformation
```
actor: List<RoledActor>
date: Temporal
place: Spatial
reason: CharField
note: TextField
technique: CharField
technique_type: List<Reference<TechniqueType>>
```

Reference<Usage> options empty for now

UsageHistory
```
usage: Reference<Usage>
note: TextField
usage_instructions: TextField
```

Reference<AssociatedActivityType> options empty for now

AssociatedActivity
```
type: Reference<AssociatedActivityType>
note: TextField
```

Reference<AssociatedCulturalAffinity> options empty for now

Reference<AssociatedEventName> options empty for now

Reference<AssociatedEventNameType> options empty for now

AssociatedEvent
```
name: Reference<AssociatedEventName>
name_type: Reference<AssociatedEventNameType>
actor: List<RoledActor>
date: List<Temporal>
place: List<Spatial>
note: TextField
```

ObjectHistory
```
activity: AssociatedActivity
cultural_affinity: Reference<AssociatedCulturalAffinity>
actor: List<RoledActor>
date: List<Temporal>
place: List<Spatial>
event: AssociatedEvent
note: TextField
comments: TextField
relevance: TextField
```

History
```
owner_history: List<Ownership>
object_production_information: List<ObjectProductInformation>
usage_history: List<UsageHistory>
object_history: List<ObjectHistory>
```
