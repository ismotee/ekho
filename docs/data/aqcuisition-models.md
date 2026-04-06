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


AqcuisitionDetails
```
    reference_number: CharField
    date: List<Temporal>
    method: Reference<AqcuisitionMethod>
    reason: CharField
    place: List<Spatial>
    actor: List<Actor>
    provisos: TextField
    note: TextField
    group_purchase_price: Number
    group_purchase_price_denomination: Reference<Denomination>
    original_object_purchase_price: Number
    original_object_purchase_price_denomination: Reference<Denomination>
    transfer_of_title_number: CharField
```