Reference<AqcuisitionMethod> options, in finnish
```
 arkistolöytö
 dokumentointi
 ei tietoa
 huutokauppa
 inventointi
 kenttätyö
 kysely
 lahjoitus
 lunastus
 museolöytö
 muu
 osto
 reprokuvaus
 siirto toisesta kokoelmasta
 siirto toisesta organisaatiosta
 talletus
 tarkastus
 testamenttilahjoitus
 tullitakavarikko
 tuntematon
 vaihto
 virkatyö
```


Reference<AcquisitionActorRole> options, in finnish
```
(see frontend `ACQUISITION_ACTOR_ROLE_FI` — closed list for hankinnan toimijan rooli)
```

Acquisition actor list item: bare `Actor` / catalog ref, or wrapped
```
{ actor?: Actor, acquisition_actor_role?: Reference<AcquisitionActorRole> }
```

AqcuisitionDetails
```
    reference_number: CharField
    acquisition_time: DateDetail
    date: List<Temporal>
    method: Reference<AqcuisitionMethod>
    reason: CharField
    place: List<Spatial>
    actor: List<Actor | { actor?: Actor, acquisition_actor_role?: Reference<AcquisitionActorRole> }>
    provisos: TextField
    note: TextField
    group_purchase_price: Number
    group_purchase_price_denomination: Reference<Denomination>
    original_object_purchase_price: Number
    original_object_purchase_price_denomination: Reference<Denomination>
    transfer_of_title_number: CharField
```