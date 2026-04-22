---
description: Listaa breadcrumbin JSON-polun
---

Tulkitse käyttäjän antama breadcrumb-polku ja listaa siihen liittyvä datan JSON-polku samassa muodossa kuin tässä esimerkissä.

Palautusmuoto on aina JSON-koodiblokki:

```json
{
  "nakyma": "RecordDetail > Hankintatiedot > Päivämäärä 1",
  "datalahde": "record.data.aquisition_details.date[0]",
  "kentat": [
    {
      "ui_teksti": "Lisätietoja",
      "json_kentta": "note",
      "json_polku": "record.data.aquisition_details.date[0].note"
    }
  ],
  "breadcrumb_map": [
    {
      "ui_teksti": "Kaikki osiot",
      "merkitys": "ylätason domain-valinta"
    },
    {
      "ui_teksti": "Hankintatiedot",
      "json_kentta": "aquisition_details",
      "json_polku": "record.data.aquisition_details"
    }
  ]
}
```

Ohjeet:
- Käytä projektin todellisia kenttänimiä (`record.data.*`) ja olemassa olevia label-mappauksia.
- Jos breadcrumbissa on indeksi (esim. "Päivämäärä 1"), mapita se taulukkoindeksiin `[0]`.
- Jos käyttäjä pyytää "myös tästä polusta", käytä hänen antamaansa uutta breadcrumbia.
- Jos polku on epäselvä, kysy täsmennys ennen lopullista JSON:ia.
- Vastaa suomeksi.

Käyttäjän syöte:
$ARGUMENTS
