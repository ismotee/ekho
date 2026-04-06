Reference<AccessCategory> options, in finnish
```
rajoitettu sisäinen käyttö
rajoitettu ulkoinen käyttö
rajoittamaton
```

Reference<MuseologicalValue> options, in finnish
```
1 - Poikkeuksellinen/Keskeinen
2 - Tärkeä/Edustava
3 - Täydentävä/Dokumentoiva
4 - Ei-museaalinen/Poistettava
```

Reference<ObjectDisplayStatusType>
```
lupa pyydetty
lupa annettu
konservoitu
valokuvattu
```

ObjectDisplayStatus
```
type: Reference<ObjectDisplayStatusType>
date: Temporal
```

Access
```
category: Reference<AccessCategory>
date: Temporal
note: TextField
museological_value: Reference<MuseologicalValue>
credit_line: CharField
object_display_status: ObjectDisplayStatus
```