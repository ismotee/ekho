Reference<LocationType> options, in finnish
```
vakituinen
väliaikainen
```

Reference<LocationFitness> options, in finnish
```
kelvoton/epäasiallinen
kohtuullinen
vaarallinen
hyvä
```

ObjectLocation
```
identifier: CharField
location: Spatial
type: Reference<LocationType>
date: Temporal
note: TextField
fitness: Reference<LocationFitness>
```
