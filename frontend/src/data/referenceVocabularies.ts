/**
 * Closed Finnish label lists for Reference<X> fields — keep in sync with docs/data/*.md
 * (same strings as the markdown option blocks).
 */

/** docs/data/identification-models.md — Reference<ObjectType> */
export const OBJECT_TYPE_FI: readonly string[] = [
  'arkistoaineisto',
  'asiakirja',
  'esine',
  'liikkuva kuva',
  'luonnonympäristö',
  'muu näyte',
  'painettu tekstijulkaisu',
  'rakennettu ympäristö',
  'rakennus',
  'taideteos',
  'valokuva',
  'äänite',
]

/** docs/data/identification-models.md — Reference<ObjectNameValue> (MAO/TAO leaves under http://www.yso.fi/onto/mao/p2990) */
export { OBJECT_NAME_VALUE_FI } from './maoObjectNameValues'

/** docs/data/identification-models.md — Reference<ObjectNameType> */
export const OBJECT_NAME_TYPE_FI: readonly string[] = ['pääluokka', 'erikoisluokka']

/** Reference<Language> — YSO http://www.yso.fi/onto/yso/p3749 (groups = language families) */
export { LANGUAGE_FI, LANGUAGE_GROUPS } from './ysoKieliGroups'

/** docs/data/identification-models.md — Reference<TitleType> */
export const TITLE_TYPE_FI: readonly string[] = [
  'aihe',
  'kerääjän antama nimi',
  'käyttäjän antama nimi',
  'luetteloijan antama nimi',
  'mallin nimi ja/ tai numero',
  'omistajan antama nimi',
  'rakennuttajan antama nimi',
  'sarjan nimi',
  'suunnittelijan antama nimi',
  'taiteilijan antama nimi',
  'tekijän antama nimi',
  'teosnimi',
  'tuotteen nimi',
  'valokuvaajan antama nimi',
  'yleisesti tunnettu nimi',
]

/** docs/data/rights-models.md — Reference<RightsType> */
export const RIGHTS_TYPE_FI: readonly string[] = [
  'julkaisuoikeus',
  'käyttöoikeus',
  'oikeuksien myyntioikeus',
  'tekijänoikeus',
]

/** docs/data/access-models.md — Reference<AccessCategory> */
export const ACCESS_CATEGORY_FI: readonly string[] = [
  'rajoitettu sisäinen käyttö',
  'rajoitettu ulkoinen käyttö',
  'rajoittamaton',
]

/** docs/data/access-models.md — Reference<MuseologicalValue> */
export const MUSEOLOGICAL_VALUE_FI: readonly string[] = [
  '1 - Poikkeuksellinen/Keskeinen',
  '2 - Tärkeä/Edustava',
  '3 - Täydentävä/Dokumentoiva',
  '4 - Ei-museaalinen/Poistettava',
]

/** docs/data/access-models.md — Reference<ObjectDisplayStatusType> */
export const OBJECT_DISPLAY_STATUS_TYPE_FI: readonly string[] = [
  'lupa pyydetty',
  'lupa annettu',
  'konservoitu',
  'valokuvattu',
]

/** Organization history biographical source — Reference<SourceType> (actor catalog). */
export const ORGANIZATION_HISTORY_SOURCE_TYPE_FI: readonly string[] = [
  'CD',
  'valokuva',
  'verkkoaineisto',
  'kirja',
  'lehti',
]

/** docs/data/object-location-models.md — Reference<LocationType> */
export const LOCATION_TYPE_FI: readonly string[] = ['vakituinen', 'väliaikainen']

/** docs/data/object-location-models.md — Reference<LocationFitness> */
export const LOCATION_FITNESS_FI: readonly string[] = [
  'kelvoton/epäasiallinen',
  'kohtuullinen',
  'vaarallinen',
  'hyvä',
]

/** Spatial.name_type — paikannimen tyyppi (closed list). */
export const SPATIAL_PLACE_NAME_TYPE_FI: readonly string[] = [
  'alue',
  'aukio',
  'avaruus/taivaankappale',
  'entinen Suomen kunta/pitäjä',
  'hautausmaa',
  'joki',
  'järvi',
  'kaivauskerros',
  'kaivausruutu',
  'kartano',
  'katuosoite',
  'kauppala',
  'kaupunginosa',
  'kortteli',
  'kunta/ kaupunki (Suomi)',
  'kunta/kaupunki (ulkomainen)',
  'kylä',
  'laiva',
  'luokittelematon paikka',
  'luonnon paikka',
  'lääni',
  'maa/valtio',
  'maakunta (Suomi)',
  'maakunta (ulkomainen)',
  'maanosa',
  'maantieteellinen alue/paikka',
  'muinaisjäännös',
  'nykyinen tai entinen hallinnollinen alue',
  'osavaltio',
  'pelto',
  'pitäjä (ulkomainen)',
  'puisto',
  'rakennus',
  'saari',
  'satama',
  'taajama',
  'tie',
  'tila',
  'tontti',
  'tori',
  'vesistö',
]

/** Spatial.status — paikan asema. */
export const SPATIAL_PLACE_STATUS_FI: readonly string[] = [
  'entinen pääkaupunki',
  'kansallispuisto',
  'luonnonsuojelualue',
  'pääkaupunki',
  'Unescon maailmanperintökohde',
  'valtakunnallisesti arvokas maisema-alue',
  'valtakunnallisesti merkittävä rakennettu kulttuuriympäristö',
]

/** Spatial.acquisition_place_role — hankintapaikan rooli (hankinnan paikkatiedot). */
export const ACQUISITION_PLACE_ROLE_FI: readonly string[] = [
  'alkuperäinen käyttöpaikka',
  'hankintapaikka',
  'keruupaikka',
  'kuvauspaikka',
  'käyttöpaikka',
  'laatimispaikka',
  'lahjoituspaikka',
  'luovutuspaikka',
  'löytöpaikka',
  'pääasiallinen käyttöpaikka',
  'rakennuksen sijaintipaikka',
  'valmistuspaikka',
  'vastauspaikka',
]

/** Coordinates.coordinates_type — koordinaattijärjestelmä. */
export const COORDINATE_SYSTEM_FI: readonly string[] = [
  'ETRS-TM35FIN -tasokoordinaatit',
  'KKJ maantieteelliset koordinaatit',
]

/** ReferenceNumber.type on Spatial — paikan viitenumeron tyyppi. */
export const SPATIAL_REFERENCE_NUMBER_TYPE_FI: readonly string[] = [
  'kaupunginosan numero',
  'korttelin numero',
  'muinaisjäännöstunnus',
  'projektin numero',
  'rakennustunnus',
  'tontin numero',
]

/** docs/data/aqcuisition-models.md — Reference<AcquisitionActorRole> (hankinnan toimijan rooli). */
export const ACQUISITION_ACTOR_ROLE_FI: readonly string[] = [
  'aikaisempi omistaja',
  'alkuperäinen omistaja',
  'alkuperäisen aineiston omistaja',
  'arkistonmuodostaja',
  'arkkitehti',
  'asian hoitaja',
  'esittäjä',
  'haastateltu',
  'haastattelija',
  'hankinnan suorittaja',
  'inventoija',
  'julkaisija',
  'kaivaja',
  'kaivausten johtaja',
  'kaivertaja',
  'kehystäjä',
  'kenttätyön tekijä',
  'kerääjä',
  'kirjailija',
  'kirjoittaja',
  'konservaattori',
  'korjaaja',
  'kuljettaja',
  'kuriiri',
  'kustantaja',
  'kuvauksen kohde',
  'kuvittaja',
  'kyselyvastaaja',
  'käsikirjoittaja',
  'käyttäjä',
  'laatija',
  'lahjan antaja',
  'lahjoittaja',
  'lainan vastaanottaja',
  'lainanantaja',
  'lainapäätöksen tekijä',
  'liikemerkin käyttäjä',
  'lisenssin omistaja',
  'luetteloija',
  'luovuttaja',
  'lähettäjä',
  'löytäjä',
  'maahantuoja',
  'myyjä',
  'omistaja',
  'paikan omistaja',
  'painaja',
  'piirtäjä',
  'päätöksen tekijä',
  'rahoittaja',
  'rakennuttaja',
  'skannaaja',
  'suunnittelija',
  'säveltäjä',
  'taiteilija',
  'tallettaja',
  'tavaramerkin omistaja',
  'tekijä',
  'tilaaja',
  'toimittaja',
  'tuottaja',
  'tutkija',
  'valaja',
  'valmistaja',
  'valmistuttaja',
  'valokuvaaja',
  'valosuunnittelija',
  'vastaanottaja',
  'välittäjä',
  'äänisuunnittelija',
]

/** docs/data/aqcuisition-models.md — Reference<AqcuisitionMethod> */
export const AQCUISITION_METHOD_FI: readonly string[] = [
  'arkistolöytö',
  'dokumentointi',
  'ei tietoa',
  'huutokauppa',
  'inventointi',
  'kenttätyö',
  'kysely',
  'lahjoitus',
  'lunastus',
  'museolöytö',
  'muu',
  'osto',
  'reprokuvaus',
  'siirto toisesta kokoelmasta',
  'siirto toisesta organisaatiosta',
  'talletus',
  'tarkastus',
  'testamenttilahjoitus',
  'tullitakavarikko',
  'tuntematon',
  'vaihto',
  'virkatyö',
]

/** docs/data/common-models.md — Reference<Denomination> */
export const DENOMINATION_FI: readonly string[] = ['euro', 'dollari', 'rupla', 'kruunu', 'punta']

/** docs/data/history-models.md — Reference<OwnershipExchangeMethod> */
export const OWNERSHIP_EXCHANGE_METHOD_FI: readonly string[] = [
  'ei tietoa',
  'huutokauppa',
  'keruu',
  'lahja',
  'lahjoitus',
  'lunastus',
  'muu',
  'osto',
  'perintö',
  'siirto',
]

/** docs/data/history-models.md — Reference<Technique> */
export const TECHNIQUE_FI: readonly string[] = `
akvatinta
etsaus
kuivaneula
kuparipiirros
linopiirros
litografia
mezzotinto
puupiirros
pyrografia
serigrafia
3D-mallinnus
grafiikka
kuvakkeet
kuvankäsittely
tietokonetaide
akryylimaalaus
akvarellimaalaus
elävän mallin maalaus
guassi
ikonimaalaus
kalkkimaalaus
kirjamaalaus
koristemaalaus
kukkamaalaus
lasimaalaus
pastelli
posliininmaalaus
sekatekniikka
silkkimaalaus
sormimaalaus
temperamaalaus
tussityöt
ulkoilmamaalaus
vaasimaalaus
öljymaalaus
mitalitaide
rahataide
pastelli
tussityöt
valokuvailmaisu
valokuvaus
sähköinen taide
visuaaliset taiteet
digitaalinen taide
interaktiivinen taide
tietokonetaide
verkkotaide
videotaide
nykysirkus
sosiaalinen sirkus
absurdi teatteri
commedia dell'arte
devising
dokumenttiteatteri
draaman jälkeinen teatteri
eeppinen teatteri
ekologinen teatteri
julmuuden teatteri
kabuki
kansanteatteri
katuteatteri
kokeellinen teatteri
köyhä teatteri
musiikkiteatteri (taiteet)
musta teatteri
naamioteatteri
no-teatteri
nukketeatteri (taiteet)
nykyteatteri
näkymätön teatteri
osallistava teatteri
osallistuva teatteri
poliittinen teatteri
prosessidraama
vankilateatteri
varjoteatteri
yhteiskunnallinen teatteri
afrotanssi
baletti (taiteet)
bollywood-tanssi
buto
itämainen tanssi
jazztanssi
moderni tanssi
nykytanssi
pyörätuolitanssi
seuratanssi
showtanssi
steppi
street dance
tankotanssi
tanssitekniikat
järjestelmäarkkitehtuuri
kokonaisarkkitehtuuri
näyttelyarkkitehtuuri
puutarhataide
rakennuskulttuuri
sisustustaide
tietotekniikka-arkkitehtuuri
3D-elokuvat
amatöörielokuvat
animaatioelokuvat
dogmaelokuvat
dokumenttielokuvat
draamadokumentit
draamaelokuvat
elämäkertaelokuvat
eroottiset elokuvat
fantasiaelokuvat
film noir
gangsterielokuvat
historialliset elokuvat
independent-elokuvat
jännityselokuvat
katastrofielokuvat
kauhuelokuvat
kokeelliset elokuvat
komediat
kulttielokuvat
lastenelokuvat
luontoelokuvat
lyhytelokuvat
lännenelokuvat
mainoselokuvat
melodraamat (draama)
musiikkielokuvat
mykkäelokuvat
naiselokuvat
nuortenelokuvat
opetuselokuvat
poliittiset elokuvat
pseudodokumentit
rakkauselokuvat
rikoselokuvat
rillumareielokuvat
road moviet
romanttiset komediat
satuelokuvat
seikkailuelokuvat
seksielokuvat
sotaelokuvat
sotilasfarssit
tanssielokuvat
televisioelokuvat
tieteiselokuvat
todellisuuspohjaiset elokuvat
toimintaelokuvat
tragikomediat
tukkilaiselokuvat
uskonnolliset elokuvat
uusi aalto (elokuva)
videoelokuvat
yhteiskunnalliset elokuvat
äänielokuvat
esitystaide
happeningit
taiteidenvälisyys
vatsastapuhuminen
interaktiivinen taide
valimotekniikka
hiekkavalu
painevalu
ruiskuvalu
fajanssi
keraamiset laatat
kivitavara
posliini
raku
saviastiat
terrakotta
tiilet
dreijaus
keramiikka
applikaatiotyöt
fransut
helmityöt
huopatyöt
huovutus
isoäidinneliöt
kirjoneuleet
kirjonta
korityöt
koukkuaminen
kudonta
kuultokudokset
lakkatyöt
lasityöt
lastutyöt
luutyöt
makramee
nahkatyöt
neulakinnastekniikka
neuletyöt
neulonta
niinityöt
nimikointi
nypläys
olkityöt
ompelu
ompelutyöt
pajutyöt
paperimassatyöt
paperityöt
pitsit
poppana
punonta
punontatyöt
puutyöt
raanut
revinnäistyöt
ristipistotyöt
risutyöt
rottinkityöt
ryijyt
räsymatot
sarvityöt
savityöt
sulkatyöt
tilkkutyöt
tuohityöt
turkistyöt
täkänät
vanutus
virkkaus
käsitetaide
ainekirjoitus
kirjallinen ilmaisu
kirjallinen kulttuuri
kirjallinen viestintä
kirjoitusjärjestelmät
kirjoitustaito
konekirjoitus
käsiala
lukeminen
oikeinkirjoitus
pikakirjoitus
pistekirjoitus
prosessikirjoittaminen
salakirjoitus
tarkekirjoitus
tekstaus
tieteellinen kirjoittaminen
akrostikonit
balladit
elegiat (runot)
eläinrunot
epigrammit
esinerunot
fabliaut
haikut
hakukonerunous
idyllit
kalevalamittaiset runot
kansanrunot
kertomarunot
kuvarunot
lastenrunot
limerikit
muistorunot
oodit (runot)
pilkkarunot
proosarunot
rakkausrunot
rengat
roolirunot
sonetit
tankat
tilapäisrunot
uskonnolliset runot
äänirunous
lavarunous
aariat
adagiot
airit
alkusoitot
allemandet (sävellykset)
anthemit
antifonit
arabeskit (sävellykset)
ariosot
bagatellit
barkarolit
beguinet (sävellykset)
berceuset
bolerot (sävellykset)
burleskit (sävellykset)
cancanit (sävellykset)
canzonat
canzonettat
capricciot
cha-cha-chat (sävellykset)
chaconnet
csárdásit (sävellykset)
duetot
duot (sävellykset)
elegiat (sävellykset)
etydit
fandangot (sävellykset)
fanfaarit
fantasiat (sävellykset)
foxtrotit (sävellykset)
fuugat
gavotit (sävellykset)
giguet
graduaalit
hambot (sävellykset)
humoreskit
humpat (sävellykset)
hymnit
impromptut
improvisaatiot (sävellykset)
intermediot
intermezzot (soitinmusiikki)
inventiot
jenkat (sävellykset)
kaanonit (sävellykset)
kansallislaulut
kantaatit
konsertot
kontratanssit (sävellykset)
koraalit
kvartetot
kvintetot
lambadat (sävellykset)
lamentaatiot
lamentot
laulut
litaniat
magnificatit
mambot (sävellykset)
marssit (sävellykset)
masurkat (sävellykset)
melodraamat (sävellykset)
menuetit (sävellykset)
messut (sävellykset)
moriskat (sävellykset)
motetit
musikaalit
muunnelmat (sävellykset)
nocturnet
nonetot
offertoriumit
oktetot
oodit (sävellykset)
oopperat
operetit
oratoriot
parafraasit (sävellykset)
pasodoblet (sävellykset)
passacagliat
passepied't (sävellykset)
passiot
pavanat (sävellykset)
polkat (sävellykset)
poloneesit (sävellykset)
polskat (sävellykset)
postludit
psalmit (sävellykset)
purpurit (sävellykset)
rapsodiat
ricercaret
ritornellot
romanssit (sävellykset)
rondot
rumbat (sävellykset)
salsat (sävellykset)
sambat (sävellykset)
sarjat (sävellykset)
scherzot
sekstetot
septetot
sikermät
sinfonia concertantet
sinfoniat
sinfoniettat
sinfoniset runot
sonatiinit
soolosävellykset
tangot (sävellykset)
tarantellat (sävellykset)
tertsetot
toccatat
tombeaut
triot (sävellykset)
twistit (sävellykset)
valssit (sävellykset)
versetit
vesperit (sävellykset)
vigiliat (sävellykset)
`
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean)

/** docs/data/history-models.md — Reference<TechniqueType> */
export const TECHNIQUE_TYPE_FI: readonly string[] = [
  'ammattimainen käsityö',
  'käsityö',
  'taide',
  'teollinen',
]

/** docs/data/history-models.md — Reference<Usage> */
export const USAGE_FI: readonly string[] = `
aikuisopetus
ajo-opetus
alkemia
alkuopetus
arkistointi
arkistonhoito
audiovisuaalinen viestintä
automaattikirjoitus
disinformaatio
edistys
eleet
elinkeinoelämä
elokuvailmaisu
erityisopetus
esiopetus
esittäminen
etnosentrismi
etäopetus
faktantarkistus
fennomania
graafinen viestintä
heimoaate
hengellisyys
ihmissuhteet
ilmaisukasvatus
ilmaisutaito
ilmeet
isänmaallisuus
itseilmaisu
joukkoviestintä
kaapeliviestintä
kansainvälinen viestintä
kansalliset vähemmistöt
kansallisuuskysymykset
kansanopetus
keskinäisviestintä
kielenkäyttö
kielitietoinen opetus
kieltenopetus
kirjallinen ilmaisu
kirjallinen viestintä
kohdeviestintä
koneiden välinen viestintä
koristautuminen
koristemaalaus
korkeakouluopetus
korteista ennustaminen
kotiopetus
kriisiviestintä
kulttuurienvälinen viestintä
kurssimuotoinen opetus
kuvallinen ilmaisu
kuvallinen viestintä
kuviointi
kyläily
kädestä ennustaminen
käytännön opetus
langaton viestintä
lehtimainonta
liike-elämä
liiketoiminta
lisäopetus
lisääntymiskäyttäytyminen
luokaton opetus
luokkaopetus
luonto-opetus
läheiset
maneerit
manipulaatio
markkinointiviestintä
mimiikka
muistaminen
muistelmat
muistot
muutosviestintä
naapurit
naapuruus
natiivimainonta
nationalismi
numerologia
opetustaito
organisoituminen
panslavismi
parinvalinta
parittelu
perusopetus
piilomainonta
poliittinen mainonta
poliittinen taide
poliittinen viestintä
poltergeist
propaganda
puheopetus
puhetta tukeva ja korvaava kommunikaatio
puheviestintä
radioilmaisu
radiomainonta
ruotsinmielisyys
ruumiinkieli
ryhmäopetus
ryhmäviestintä
sairaalaopetus
samanaikaisopetus
sanallinen viestintä
sanaton viestintä
satelliittiviestintä
separatismi
sijoittajaviestintä
sisäinen viestintä
sivistys
skandinavismi
slavofiilit
somistus
sosiaalinen pääoma
sosiaalinen toimintakyky
sosiaalinen tuki
sosiaaliset suhteet
sosiaalisuus
sosiometria
sotapropaganda
spiritismi
spiritualiteetti
sukulaiset
sukupuolivalinta
sulautuva opetus
suomalaisuus
suoramainonta
suostuttelu
suullinen ilmaisu
sähköinen viestintä
taiteen perusopetus
tatuointi
teatteri-ilmaisu
tekninen viestintä
televisioilmaisu
televisiomainonta
terveysviestintä
tiedeviestintä
tiimiopetus
tukiopetus
turvallisuusviestintä
työnopetus
uimaopetus
ulkoilmaopetus
ulkoinen viestintä
ulkomainonta
uskonelämä
uskonnollisuus
vaikuttaminen
valeuutiset
valmistava opetus
valokuvailmaisu
vankilaopetus
vastamainonta
verkkomainonta
verkko-opetus
verkostoituminen
vieraskielinen opetus
viestintä
viihde
visuaalinen viestintä
vuosiluokkiin sitomaton opetus
yhdysluokkaopetus
yhteisöllisyys
yhteisöviestintä
yksityisopetus
yleisopetus
ympäristöviestintä
yrittäjyys
yrittäjät
yrityksen perustaminen
yritykset
yritysturvallisuus
ystävystyminen
ystävyys
lahjat
joululahjat
liikelahjat
morsiuslahjat
kopiointi
varmuuskopiointi
monistus
reproduktio
jäljennykset
palkinnot
harjannostajaiset
karnevaalit
kirkolliset juhlat
kotiseutujuhlat
koulujuhlat
kutsut (juhlat)
läksiäiset
perhejuhlat
pidot
pikkujoulut
polttarit
puutarhajuhlat
rapujuhlat
sukujuhlat
uskonnolliset juhlat
vuotuisjuhlat
avajaiset
edustustilaisuudet
festivaalit
huvit
huvitilaisuudet
iltamat
juhlapäivät
juhlasuunnittelu
juhlaviikot
kulttuuritapahtumat
naamiaiset
päättäjäiset
tapahtumat
ajankäyttö
loma
työaika
vapaapäivät
kirkkovuosi
kirkolliset juhlat
vapaapäivät
arkipyhät
rukouspäivät
sapatti
lahjonta
korruptio
mietiskely
rukoileminen
jooga
transsendenttinen mietiskely
ideointi
innovaatiotoiminta
uudistukset
uudistaminen
modernisaatio
eläimistön suojelu
harjujensuojelu
kasviston suojelu
koskiensuojelu
lajiensuojelu
maisemansuojelu
rantojensuojelu
soidensuojelu
ennallistaminen
luonnonsuojelu
ekologinen kompensaatio
rentoutus
lepo
palautuminen
toipuminen
armeliaisuus
eläytyminen
samaistuminen
sympatia
sääli
sosiaaliset taidot
sosiaalinen vuorovaikutus
assertiivisuus
ihmissuhteet
sosiaaliset suhteet
sosiaaliset taidot
sosiaalisuus
sosioemotionaaliset taidot
tunnetaidot
tunneäly
videoavusteinen vuorovaikutuksen ohjaus
väkivallaton vuorovaikutus -menetelmä
yhteistyökyky
`
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean)

/** docs/data/history-models.md — Reference<AssociatedActivityType> */
export const ASSOCIATED_ACTIVITY_TYPE_FI: readonly string[] = [
  'hankinta',
  'omistus',
  'valmistus',
  'käyttö',
  'tapahtuma',
]

/** docs/data/history-models.md — Reference<AssociatedCulturalAffinity> */
export const ASSOCIATED_CULTURAL_AFFINITY_FI: readonly string[] = `
afrikkalaisuus
espoolaisuus
eurooppalaisuus
helsinkiläisyys
hämäläisyys
inkeriläisyys
karjalaisuus
kaukasialaisuus
lappilaisuus
pohjalaisuus
pohjoismaisuus
päijäthämäläisyys
satakuntalaisuus
savolaisuus
tamperelaisuus
turkulaisuus
tyrvääläisyys
viipurilaisuus
amerikkalaisuus
australialaisuus
brittiläisyys
englantilaisuus
espanjalaisuus
intialaisuus
italialaisuus
japanilaisuus
kiinalaisuus
kreikkalaisuus
puolalaisuus
ranskalaisuus
ruotsalaisuus
saamelaisuus
saksalaisuus
suomalaisuus
tanskalaisuus
turkkilaisuus
unkarilaisuus
venäläisyys
virolaisuus
aasialaiset kulttuurit
aigeialainen kulttuuri
aineellinen kulttuuri
ammattikulttuuri
arkeologiset kulttuurit
arktiset kulttuurit
digitaalinen kulttuuri
elokuvakulttuuri
foinikialainen kulttuuri
hallintokulttuuri
historiakulttuuri
hoitokulttuuri
homokulttuuri
Indus-kulttuuri
intiaanikulttuurit
islamilainen kulttuuri
johtamiskulttuuri
kahvikulttuuri
kansallinen kulttuuri
kansankulttuuri
kaupunkikulttuuri
keräilykulttuurit
kirjallinen kulttuuri
koulukulttuuri
kristillinen kulttuuri
kulutuskulttuuri
laihdutuskulttuuri
lastenkulttuuri
lesbokulttuuri
liikuntakulttuuri
länsimainen kulttuuri
maanviljelyskulttuurit
maaseutukulttuuri
mediakulttuuri
metsäkulttuuri
mieskulttuuri
musiikkikulttuuri
naiskulttuuri
nuorisokulttuuri
oikeuskulttuuri
organisaatiokulttuuri
osakulttuurit
paikalliskulttuuri
paimentolaiskulttuurit
palvelukulttuuri
pelikulttuuri
permakulttuuri
poikakulttuuri
poliittinen kulttuuri
populaarikulttuuri
porvariskulttuuri
primitiiviset kulttuurit
psykokulttuuri
pyyntikulttuurit
päihdekulttuuri
rakennuskulttuuri
romanikulttuuri
ruokakulttuuri
ruumiinkulttuuri
saamelaiskulttuuri
salonkikulttuuri
sotilaskulttuuri
strateginen kulttuuri (sotilaspolitiikka)
suullinen kulttuuri
talonpoikaiskulttuuri
tapakulttuuri
teatterikulttuuri
toimintakulttuuri
turvallisuuskulttuuri
tyttökulttuuri
työkulttuuri
työpaikkakulttuuri
työväenkulttuuri
vastakulttuurit
viestintäkulttuuri
visuaalinen kulttuuri
yhtenäiskulttuuri
ylikansallinen kulttuuri
yläluokan kulttuuri
yrityskulttuuri
minolainen kulttuuri
mykeneläinen kulttuuri
kivikautiset kulttuurit
pronssikautiset kulttuurit
rautakautiset kulttuurit
metsästäjä-keräilijät
pyyntikulttuurit
lastenperinne
nuorisokulttuuri
poikakulttuuri
tyttökulttuuri
ruumiinkulttuuri
naiskulttuuri
poikakulttuuri
nuorisopolitiikka
ammattikulttuuri
hallintokulttuuri
koulukulttuuri
turvallisuuskulttuuri
työpaikkakulttuuri
yrityskulttuuri
demoskene
fanius
goottikulttuuri
hiphop-kulttuuri
punk (kulttuuri)
ravekulttuuri
skinheadit
vastakulttuurit
`
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean)

/** docs/data/history-models.md — Reference<AssociatedEventName> */
export const ASSOCIATED_EVENT_NAME_FI: readonly string[] = [
  'Rovaniemen markkinat',
  'Helsingin MM-yleisurheilukilpailut 2005',
  'Pariisin maailmannäyttely 1900',
]

/** docs/data/history-models.md — Reference<AssociatedEventNameType> */
export const ASSOCIATED_EVENT_NAME_TYPE_FI: readonly string[] = `
kruunajaiset
joukkomurha
taistelu
mielenosoitus
urheilukilpailu
messut
maailmanmestaruuskilpailut
markkinat
sota
näyttely
avajaiset
happeningit
juhlat
päättäjäiset
yleisötilaisuudet
elokuvafestivaalit
juhlat
kirjallisuustapahtumat
kulttuurielämä
kulttuuritoiminta
musiikkijuhlat
näyttelyt
taidenäyttelyt
taidetapahtumat
tanssitapahtumat
teatteritapahtumat
konserttiohjelmat
musiikkielämä
ohjelmistot
yleisötilaisuudet
asuntonäyttelyt
autonäyttelyt
biennaalit
eläinnäyttelyt
kiertonäyttelyt
maailmannäyttelyt
maatalousnäyttelyt
postimerkkinäyttelyt
puutarhanäyttelyt
taidenäyttelyt
triennaalit
valokuvanäyttelyt
verkkonäyttelyt
kulttuuritapahtumat
kuratointi
messut (tapahtumat)
näyttelyjulkaisut
näyttelytoiminta
retrospektiivit
vahakabinetit
ristiretket
pyhiinvaellukset
jumalanpalvelukset
liturgia
vesper (jumalanpalvelus)
vigilia (jumalanpalvelus)
messu (jumalanpalvelus)
ammattitaitokilpailut
arkkitehtuurikilpailut
kauneuskilpailut
keruukilpailut
kirjoituskilpailut
musiikkikilpailut
tietokilpailut
urheilukilpailut
turnajaiset
juhlamenot
myytit
riittirunot
rituaalit
šamanismi
seremoniat
kultit
rituaalitanssit
promootiot
kuvainpalvonta
luonnonpalvonta
palvonta
totemismi
uhraaminen
vainajainpalvonta
`
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean)

/** docs/data/description-models.md — Reference<ObjectStatus> */
export const OBJECT_STATUS_FI: readonly string[] = [
  'dia originaalista',
  'dia reproduktiosta',
  'duplikaatti',
  'esityö',
  'fragmentti',
  'harjoitelma',
  'holotyyppi',
  'jälkituotantodia',
  'jälkituotantonegatiivi',
  'jälkituotantovedos',
  'jälkivalos',
  'kopio',
  'kuva objektista',
  'luonnos',
  'mallikappale',
  'muu yhteys',
  'negatiivi originaalista',
  'negatiivi reproduktiosta',
  'originaali',
  'osa',
  'osa kokonaisuudesta',
  'paratyyppi',
  'pienoismalli',
  'prototyyppi',
  'rariteetti',
  'rinnakkaiskuva',
  'samanlainen',
  'sarjatuote',
  'toinen parista',
  'tyyppiesimerkki',
  'vedos originaalista',
  'vedos reproduktiosta',
  'väärennös',
]

/** docs/data/description-models.md — Reference<PhotoFormat> */
export const PHOTO_FORMAT_FI: readonly string[] = ['dia', 'kuvatiedosto', 'negatiivi', 'vedos']

/** docs/data/description-models.md — Reference<Orientation> */
export const ORIENTATION_FI: readonly string[] = ['pysty', 'vaaka', 'muu']

/** docs/data/description-models.md — Reference<Audio> */
export const AUDIO_FI: readonly string[] = [
  'mykkä',
  'mono',
  'stereo 2.0',
  'Dolby Digital 5.1',
  'Dolby Surround 7.1',
]

/**
 * YSA värit (http://www.yso.fi/onto/ysa/Y100352) — narrower concepts from Finto
 * https://finto.fi/ysa/fi/page/Y100352
 */
export const COLOR_FI: readonly string[] = [
  'harmaa',
  'indigo',
  'keltainen',
  'liturgiset värit',
  'musta',
  'oranssi',
  'punainen',
  'ruskea',
  'sininen',
  'tunnusvärit',
  'valkoinen',
  'vihreä',
  'violetti',
]

/** docs/data/description-models.md — Reference<FormOfInstallation> (kiinnitys- tai säilytysmenetelmä) */
export const FORM_INSTALLATION_FI: readonly string[] = [
  'märkänä säilytettynä',
  'kuivana säilytettynä',
  'pingotettuna',
  'passe-partout',
  'kehystetty',
  'kuvakulmilla kiinnitetty',
  'liimattu',
  'lasitettuna',
  'pohjustettuna',
]

/** docs/data/description-models.md — Reference<MeasurementName> (field `unit` on Measurement); YSO suureet */
export { MEASUREMENT_NAME_FI, MEASUREMENT_NAME_GROUPS } from './ysoSuureetGroups'

/** docs/data/description-models.md — Reference<MeasurementUnit>; SI symbols from fi.wikipedia + pixel */
export { MEASUREMENT_UNIT_FI, MEASUREMENT_UNIT_GROUPS } from './siMeasurementUnitSymbols'

/** docs/data/description-models.md — Reference<InscriptionType> */
export const INSCRIPTION_TYPE_FI: readonly string[] = [
  'allekirjoitus',
  'etiketti',
  'graffiti',
  'julkaisumerkintä',
  'kaiverrus',
  'kirjoitus',
  'koholeima',
  'kokomerkintä',
  'koriste',
  'leima',
  'liikemerkki',
  'lisenssi',
  'merkintä',
  'monogrammi',
  'motto',
  'nimi',
  'nimikirjaimet',
  'nimikirjoitus',
  'omistajanmerkki',
  'pesumerkintä',
  'polttomerkki',
  'postileima',
  'puumerkki',
  'päiväys',
  'rajausmerkintä',
  'riimukirjoitus',
  'sarjanumero',
  'signeeraus',
  'sinetti',
  'syväleima',
  'taittomerkintä',
  'tarra',
  'tavaramerkki',
  'tuotemerkki',
  'vaakuna',
  'valmistusmaa',
  'valmistusmerkintä',
  'valosmerkintä',
  'vedosmerkintä',
  'vedostusmerkintä',
  'vesileima',
]

/** docs/data/description-models.md — Reference<InscriptionMethod> */
export const INSCRIPTION_METHOD_FI: readonly string[] = [
  'kaiverrus',
  'kirjoitus',
  'kirjonta',
  'kohokirjonta',
  'koholeima',
  'konekirjoitus',
  'koneleima',
  'konestanssaus',
  'kudonta',
  'kuulakärkikynä',
  'käsinkirjoitus',
  'käsin tehty',
  'leikkaus',
  'leimaus',
  'liimaaminen',
  'lyijykynä',
  'lyöminen',
  'lävistys',
  'maalaus',
  'metallilaatta',
  'mustekynä',
  'niittaus',
  'ompelu',
  'painatus',
  'pakotus',
  'raaputus',
  'siirtokuva',
  'stanssaus',
  'syväleima',
  'syövytys',
  'tekstaus',
  'tussi',
  'upotus',
  'valaminen',
  'valotus',
  'viiltäminen',
  'värileima',
]

/** docs/data/description-models.md — Reference<InscriptionDirection> (merkinnän suunta) */
export const INSCRIPTION_DIRECTION_FI: readonly string[] = ['diagonaali', 'pysty', 'vaaka']

/** docs/data/description-models.md — Reference<ObjectComponentName> / Form / MaterialType / … (empty for now) */
export const EMPTY_REFERENCE_FI: readonly string[] = []