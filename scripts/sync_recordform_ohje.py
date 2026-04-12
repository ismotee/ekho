"""One-off: sync recordForm.info Finnish strings from docs/data/tables/OHJEET.csv (OHJE column)."""
import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load_ohje_by_pair(path: Path) -> tuple[dict[tuple[str, str], str], list[str]]:
    """First wins for duplicate (fi,en) pairs (e.g. Valuutta/Denomination)."""
    # Source file is UTF-8 (Finnish); cp1252 would mangle ä/ö into wrong code units.
    with path.open(encoding="utf-8") as f:
        rows = list(csv.reader(f))
    by_pair: dict[tuple[str, str], str] = {}
    for row in rows[2:]:
        if len(row) < 4:
            continue
        fi = (row[1] or "").strip()
        en = (row[2] or "").strip()
        ohje = (row[3] or "").strip()
        if not fi or not ohje:
            continue
        key = (fi, en)
        if key not in by_pair:
            by_pair[key] = ohje
    return by_pair, rows


def ohje_line(rows: list[list[str]], line_1based: int) -> str:
    """OHJE text from CSV file line number (1-based, includes header rows)."""
    row = rows[line_1based - 1]
    return (row[3] or "").strip() if len(row) >= 4 else ""


def norm(s: str) -> str:
    # OHJEET sometimes breaks a word across a line break inside a quoted field.
    s = re.sub(r"([a-zåäö])\n([a-zåäö])", r"\1\2", s, flags=re.IGNORECASE)
    s = " ".join(s.replace("\n", " ").split())
    # CSV occasionally joins sentences without a space after a full stop.
    s = re.sub(r"\.([A-Za-zÅÄÖåäö])", r". \1", s)
    return s


def G(by: dict[tuple[str, str], str], fi: str, en: str) -> str:
    return norm(by.get((fi, en), ""))


def main() -> None:
    ohje_path = ROOT / "docs/data/tables/OHJEET.csv"
    json_path = ROOT / "frontend/src/locales/fi/recordForm.json"
    by, csv_rows = load_ohje_by_pair(ohje_path)

    with json_path.open(encoding="utf-8") as f:
        data = json.load(f)

    info = data["info"]

    # Acquisition
    a = info["acquisition"]
    a["referenceNumber"] = G(by, "Hankintatunnus", "Aqcuisition reference number")
    a["date"]["note"] = G(by, "Hankinnan muut aikatiedot", "Aqcuistion date note")
    a["date"]["earliest"]["date"] = G(by, "Hankinta-aika", "Aqcuisition date")
    a["date"]["latest"]["date"] = G(by, "Hankinta-aika", "Aqcuisition date")
    a["method"] = G(by, "Hankintatapa", "Aqcuisition method")
    a["reason"] = G(by, "Hankinnan perusteet", "Aqcuition reason")
    a["placeName"] = G(by, "Hankinan paikkatiedot", "0")
    a["provisos"] = G(by, "Hankinnan ehdot", "Aqcuisition provisos")
    a["note"] = G(by, "Lisätietoja hankinnasta", "Aqcuisition note")
    a["groupPurchasePrice"] = G(by, "Objektiryhmän hankintahinta", "Group purchase price")
    a["groupPurchaseDenomination"] = G(by, "Valuutta", "Original object purchase price denomination")
    a["originalPurchasePrice"] = G(by, "Objektin hankintahinta", "Original object purchase price")
    a["originalPriceDenomination"] = G(by, "Valuutta", "Original object purchase price denomination")
    a["transferOfTitle"] = G(by, "Hankintatapahtuman tai omistusoikeuden vaihdoksen numero", "Transfer of title number")

    # History
    h = info["history"]
    h["ownershipDate"]["note"] = G(by, "Omistusaika", "Ownership dates")
    h["ownershipPlace"] = G(by, "Omistuspaikka", "Ownership place")
    h["exchangeMethod"] = G(by, "Omistajuuden vaihtumistapa", "Ownership exchange method")
    h["exchangePrice"] = G(by, "Omistajuuden vaihtumisen kustannukset", "Ownership exhange price")
    # Second Valuutta/Denomination in file is exhibition indemnity; use line 41 for omistajuus.
    h["exchangeDenomination"] = norm(ohje_line(csv_rows, 41))
    h["exchangeNote"] = G(by, "Lisätietoja  omistajuuden vaihtumisesta", "Ownership exchange note")
    h["productionDate"]["note"] = G(by, "Valmistukseen liittyvä aika", "Object production date")
    h["productionPlace"] = G(by, "Valmistukseen liittyvä paikka", "Object production place")
    h["productionReason"] = G(by, "Valmistuksen syy", "Object production reason")
    h["productionNote"] = G(by, "Lisätietoa objektin valmistuksesta", "Object production note")
    h["technique"] = G(by, "Tekniikka", "Technique")
    h["associatedDate"]["note"] = G(by, "Objektiin liittyvä aika", "Associated date")
    h["associatedEventDate"]["note"] = G(by, "Objektiin liittyvän tapahtuman aika", "Associated event date")

    # Rights
    r = info["rights"]
    r["type"] = G(by, "Oikeuden luonne", "Right type")
    r["beginDate"]["note"] = G(by, "Oikeuden alkamisaika", "Right begin date")
    r["endDate"]["note"] = G(by, "Oikeuden päättymisaika", "Right end date")
    r["referenceNumber"] = G(by, "Oikeuden viitenumero", "Right reference number")

    # Access
    x = info["access"]
    x["accessCategory"] = G(by, "Käyttörajoitus", "Access category")
    x["accessDate"]["note"] = G(by, "Käyttörajoituksen kirjaamisaika", "Access category date")
    x["museologicalValue"] = G(by, "Museoarvoluokka", "0")
    x["displayStatus"] = G(by, "Esille pantavan objektin käsittelyvaihe", "Object display status")
    x["displayStatusDate"]["note"] = G(by, "Esille pantavan objektin käsittelyvaiheen kirjaamisaika", "Object display status date")
    x["creditLine"] = G(by, "Krediitti", "Credit line")
    x["note"] = G(by, "Lisätietoja käyttörajoituksesta", "Access category note")

    # Location
    loc = info["location"]
    loc["identifier"] = G(by, "Sijaintipaikan tunniste", "Location identifier")
    vn = G(by, "Vakituinen sijaintipaikka", "Normal location")
    tn = G(by, "Tilapäinen sijaintipaikka", "Current location")
    loc["placeName"] = f"{vn} {tn}"
    loc_note = G(by, "Lisätietoja tilapäisestä sijaintipaikasta", "Current location note")
    loc["placeNote"] = loc_note
    loc["date"]["note"] = G(by, "Tilapäiseen sijaintipaikkaan sijoittamisaika", "Location date")
    loc["note"] = loc_note
    loc["fitness"] = G(by, "Tilapäisen sijaintipaikan kelpoisuus", "Current location fitness")

    # Confidentiality
    c = info["confidentiality"]
    c["note"] = G(by, "Tietojen luottamuksellisuus", "Confidentiality note")
    c["usage"] = G(by, "Tietojen käyttö", "Information usage")

    # Description
    d = info["description"]
    d["objectStatus"] = G(by, "Objektin status", "Object status")
    d["objectComponents"] = G(by, "Objektin osa", "Object component name")
    d["physicalDescription"] = G(by, "Fyysinen kuvaus", "Physical description")
    d["photoType"] = G(by, "Kuvatyyppi", "Type of image")
    d["orientation"] = G(by, "Suunta", "0")
    d["color"] = G(by, "Väri", "Colour")
    d["audio"] = G(by, "Ääni", "Sound/Audio?")
    d["form"] = G(by, "Kiinnitys- tai säilytysmenetelmä", "Form")
    d["editionNumber"] = G(by, "Valmistuserän numero", "Edition number")
    d["copyNumber"] = G(by, "Kopion numero", "Copy number")
    d["inscriptionPosition"] = G(by, "Merkinnän sijainti", "Inscription position")
    d["inscriptionContent"] = G(by, "Merkintä", "Inscription content")
    d["inscriptionDescription"] = G(by, "Merkinnän kuvailu", "Inscription description")
    d["inscriptionScript"] = G(by, "Kirjoitusjärjestelmä", "Inscription script")
    d["inscriptionLanguage"] = G(by, "Merkinnän kieli", "Inscription language")
    d["inscriptionTransliteration"] = G(by, "Merkinnän translitterointi", "Inscription transliteration")
    d["inscriptionType"] = G(by, "Merkinnän tyyppi", "Inscription type")
    d["inscriptionMethod"] = G(by, "Merkintätekniikka", "Inscription method")
    d["inscriptionDirection"] = G(by, "Merkinnän suunta", "Inscription direction")
    d["inscriptionDate"]["note"] = G(by, "Merkinnän tekoaika", "Inscription date")
    d["contentDescription"] = G(by, "Sisällön kuvailu", "Content - description")
    d["contentNote"] = G(by, "Lisätietoja sisällöstä", "Content - note")
    d["contentDate"]["note"] = G(by, "Sisällön aika", "Content - date")
    d["contentActivity"] = G(by, "Sisällön toiminta", "Content - activity")
    d["contentPosition"] = G(by, "Sisällön sijainti", "Content - position")
    d["contentScript"] = G(by, "Sisällön kirjoitusjärjestelmä", "Content - script")
    d["contentLanguage"] = G(by, "Sisällön kieli", "Content - language")
    d["contentGeneralConcept"] = G(by, "Asiasanat", "?")
    d["contentClassification"] = G(by, "Luokitus", "?")
    d["contentEventName"] = G(by, "Sisällön tapahtuma", "Content - event name")
    d["contentEventType"] = G(by, "Sisällön tapahtuman tyyppi", "Content - event name type")

    with json_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print("Updated", json_path)


if __name__ == "__main__":
    main()
