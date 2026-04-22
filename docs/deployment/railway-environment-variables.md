# Railway: ympäristömuuttujat palveluittain

Tämä dokumentti kuvaa **Ekho**-projektin tyypillisen asennuksen, jossa on erilliset Railway-palvelut: **Postgres**, **backend** (Django) ja **frontend** (Vite). Kun selain avaa frontin osoitteen ja API on **eri originissa** (eri `*.up.railway.app` -hostname tai eri domain), session-evästeet vaativat erilliset asetukset — ks. `EKHO_CROSS_SITE_SESSION` backendissä.

---

## 1. Postgres-palvelu

| Mitä Railway tekee | Toimenpide |
|--------------------|------------|
| Luo `DATABASE_URL`, `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, jne. | Älä kopioi näitä repoon. |

**Backend-palvelussa:** lisää muuttuja **Variable Reference** (tai vastaava) → valitse Postgres-palvelu → viittaa **`DATABASE_URL`**-muuttujaan. Näin salasana pysyy synkassa rotaatioissa.

---

## 2. Backend-palvelu (Django / `ekho_backend.settings_deployment`)

Aseta nämä **backend**-servicen **Variables** -näkymässä (ei Postgresissa eikä frontend-buildissa).

| Ympäristömuuttuja | Pakollinen | Esimerkkiarvo / muoto |
|-------------------|------------|------------------------|
| `DJANGO_SETTINGS_MODULE` | Kyllä | `ekho_backend.settings_deployment` |
| `DATABASE_URL` | Kyllä | Viite Postgres-palvelun `DATABASE_URL`iin (suositus) |
| `SECRET_KEY` | Kyllä | Pitkä satunnainen merkkijono (yksi per ympäristö) |
| `ALLOWED_HOSTS` | Kyllä | Backendin julkinen hostname pilkulla, ei välilyöntejä. Esim. `ekho-backend-production.up.railway.app` |
| `CORS_ALLOWED_ORIGINS` | Kyllä, jos selain käyttää eri originia kuin API | Täydellinen frontin URL **https**-schemeilla, **ei** polkua eikä vinoviivaa domainin jälkeen. Esim. `https://ekho-frontend-production.up.railway.app` |
| `CSRF_TRUSTED_ORIGINS` | Kyllä, jos selain käyttää eri originia kuin API | **Sama** merkkijono kuin `CORS_ALLOWED_ORIGINS` (tai useampi origin pilkulla). |
| `EKHO_CROSS_SITE_SESSION` | Kyllä, kun frontend ≠ API origin | `1` tai `true` — asettaa `SameSite=None` ja `Secure` session- ja CSRF-evästeille sekä vaatii, että `CORS_ALLOWED_ORIGINS` ja `CSRF_TRUSTED_ORIGINS` on asetettu. |

**Valinnaiset (backend):**

| Muuttuja | Käyttö |
|----------|--------|
| `DJANGO_DEBUG` | `false` tuotannossa (oletus deploymentissa). |
| `SECURE_SSL_REDIRECT` | `true` kun haluat pakottaa HTTPS-uudelleenohjauksen (proxy-asetukset kunnossa). |
| `SECURE_HSTS` | `true` HSTS:lle (vain kun ymmärrät vaikutukset). |
| `CSRF_COOKIE_SECURE` / `SESSION_COOKIE_SECURE` | `true` HTTPS:ssä; **jos** `EKHO_CROSS_SITE_SESSION=1`, nämä pakotetaan `true`:ksi koodissa. |
| `PGSSLMODE` | Vain **PGHOST**-ketjussa (ei `DATABASE_URL` + `dj_database_url` -polussa). Arvo esim. `require`, jos libpq-yhteys vaatii SSL:n erikseen. |
| `EKHO_MEDIA_ROOT` | Suositeltava **Docker + volume** -asennuksessa | Absoluuttinen polku tallennushakemistoon (sama kuin volumen mount + nginx `alias`). Esim. `/data/media`. Ilman tätä Django käyttää oletuksena `BASE_DIR / "media"` (kontainerin epäkestävä levy). |
| `EKHO_RUN_MIGRATIONS` | Valinnainen | Oletus `1`: `docker-entrypoint.sh` ajaa `migrate --noinput` käynnistyksessä. Aseta `0` jos migraatiot ajetaan erikseen. |

**Älä aseta backendissä:** frontin `VITE_*` -muuttujia — ne kuuluvat frontend-buildiin.

**Postgres ilman `DATABASE_URL`:** voit käyttää `PGHOST`, `PGPORT`, `PGUSER` tai `POSTGRES_USER`, `PGPASSWORD` tai `POSTGRES_PASSWORD`, `PGDATABASE` tai `POSTGRES_DB` (ks. `backend/.env.example`). `settings_deployment` vaatii PostgreSQLin.

---

## 3. Frontend-palvelu (Vite)

Nämä täytyy olla **käytössä build-hetkellä** (Railwayssa: frontend-servicen **Build** / **Environment** -vaihe, josta Vite lukee `import.meta.env`).

| Ympäristömuuttuja | Pakollinen | Esimerkkiarvo |
|-------------------|------------|---------------|
| `VITE_API_BASE_URL` | Kyllä tuotantoon erillisellä API-hostilla | Backendin API-kanta **täydenä URL:ina**, esim. `https://ekho-backend-production.up.railway.app/api` |

**Muoto:**

- Käytä `https://` ja backendin julkinen hostname.
- Polku **`/api`** jotta frontendin pyynnöt kohdistuvat Django-reititykseen (`/api/...`).
- Älä käytä lainausmerkkejä Railway-kentässä.

**Huom:** Jos muutat `VITE_API_BASE_URL`ia, **uudelleenbuildaa** frontend; Vite upottaa arvon staattisesti.

---

## 4. Tarkistuslista (cross-origin + session-kirjautuminen)

1. Backend: `EKHO_CROSS_SITE_SESSION=1`, `CORS_ALLOWED_ORIGINS` ja `CSRF_TRUSTED_ORIGINS` = frontin `https://...` origin.
2. Backend: `ALLOWED_HOSTS` sisältää API-hostnamen.
3. Frontend build: `VITE_API_BASE_URL=https://<backend-host>/api`.
4. Selain: kirjautuminen ja API käyttävät **credentials** (projektin `api.ts` käyttää `credentials: 'include'`).

Jos jokin näistä puuttuu, tyypillisiä oireita ovat **401** `Authentication required` (ei `sessionid`-evästettä) tai CORS-virheet.

---

## 5. Backend Docker: kuvat (volume + nginx)

Yhden replikan Railway-backendille repossa on **`backend/Dockerfile`**: nginx kuuntelee Railwayn **`PORT`**-muuttujaa, välittää API-pyynnöt gunicornille (127.0.0.1:8001) ja palvelee **`/media/`** suoraan levyltä (`EKHO_MEDIA_ROOT`, oletus `/data/media`). Django `MEDIA_ROOT` on oltava sama polku (`settings_deployment` lukee `EKHO_MEDIA_ROOT`).

**Railwayssa (tiivistelmä):**

1. Backend-palvelu: **Root Directory** = `backend`, build **Dockerfile** (tai repo juuri + Dockerfile-polku `backend/Dockerfile`).
2. Lisää **Volume**: mount esim. polkuun `/data` tai suoraan `/data/media` (tärkeää: sama kuin `EKHO_MEDIA_ROOT`).
3. Aseta muuttuja **`EKHO_MEDIA_ROOT`** (esim. `/data/media`), jos et käytä oletuspolkua.
4. Varmista muut backend-muuttujat kuten yllä (`DJANGO_SETTINGS_MODULE`, `DATABASE_URL`, jne.).

Yksityiskohtaisempi englanninkielinen ohje: [railway-docker-media.md](railway-docker-media.md). Jos käynnistys epäonnistuu viestiin **«poetry could not be found»**, Railwayn **Start Command** yliajaa Dockerin `ENTRYPOINT`in — korjaus: `backend/railway.toml` (tai tyhjä Start Command) ja kohdan 5 vianmääritys **railway-docker-media.md**:ssä.

---

## 6. Viitteet

- `backend/ekho_backend/settings_deployment.py` — tietokanta, CORS/CSRF, `EKHO_CROSS_SITE_SESSION`, `EKHO_MEDIA_ROOT`.
- `backend/.env.example` — lyhyet kommentit paikalliseen `.env`:iin.
- `backend/DEPLOY.md` — yleiset julkaisumuistiot.
- `backend/deploy/` — nginx-malli, supervisord, `docker-entrypoint.sh`.
