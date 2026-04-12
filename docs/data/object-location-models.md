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

In **Record.data**, `object_location` is a **list** of these objects (one row per location). Legacy payloads may store a single object; the app normalizes it to a one-element list on load.
