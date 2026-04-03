# Energitjek

[![CC BY-NC 4.0](https://img.shields.io/badge/licens-CC%20BY--NC%204.0-lightgrey)](https://creativecommons.org/licenses/by-nc/4.0/)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tests](https://img.shields.io/badge/tests-Vitest%20%2B%20Playwright-green)

Beregn om solceller kan betale sig for din adresse — med dine faktiske elpriser, dit netselskabs timebaserede nettariffer og dit eget forbrug.

Energitjek er en fuldt klientside React-app. Al beregning sker i browseren; ingen data sendes til vores servere.

---

## Motivation

Som datanørd har jeg længe undret mig over, om solceller faktisk kan betale sig for netop mit hjem — ikke baseret på tommelfingerregler eller gennemsnitstal, men på mit **reelle** energiforbrug time for time.

De fleste beregnere online bruger grove skøn. Energitjek gør det anderledes: ved at koble direkte til [Eloverblik](https://eloverblik.dk) via din personlige API-token kan du beregne business casen for solceller med udgangspunkt i præcis de 8.760 timers forbrug, dit smartmeter allerede har registreret — kombineret med faktiske spotpriser og din netoperatørs nettariffer.

Målet er et let tilgængeligt, open source-værktøj, så alle med adgang til deres eget forbrugsdata kan tage en informeret beslutning om vedvarende energi.

---

## Hvad kan den?

- **Solcellesimulering** — henter timebaseret solproduktionsdata fra EU-Kommissionens PVGIS-database baseret på din præcise adresse og anlægskonfiguration (effekt, hældning, retning, systemtab)
- **Reelle elpriser** — spotpriser fra Energidataservice (DK1/DK2) time for time
- **Nettariffer pr. netselskab** — timebaseret Nettarif C hentes direkte fra DatahubPricelist; netselskab bestemmes automatisk fra postnummer eller præcist fra dit Eloverblik-målepunkt
- **Faktisk forbrug** — kobl til [eloverblik.dk](https://eloverblik.dk) via API-token og hent 8.760 timebaserede kWh-værdier for dit eget hjem
- **Tilbagebetalingstid** — input anlægsomkostning og se kumulativ netto-position over 25 år
- **CO₂-reduktion** — beregnet på basis af Energinets gennemsnitlige emissionsfaktor
- **Batterisimulering** — konfigurerbar kapacitet, effekt og strategi (egenforbrug/peak-shaving/time-of-use)

---

## Kom i gang lokalt

```bash
git clone https://github.com/jolsso/energitjek.git
cd energitjek
npm install
npm run dev
```

Åbn [http://localhost:5173](http://localhost:5173).

### Alle kommandoer

```bash
npm run dev           # Udviklingsserver med HMR
npm run build         # Produktionsbuild (tsc + vite)
npm run lint          # ESLint
npm test              # Enhedstests (Vitest)
npm run test:watch    # Tests i watch-tilstand
npm run test:e2e      # Playwright end-to-end tests
npm run test:e2e:ui   # Playwright interaktiv UI
```

### Docker

```bash
docker compose up --build
```

Serverer den statiske build via nginx på port 80.

---

## Arkitektur

Fuldt klientside SPA — ingen backend, ingen database. Data forlader aldrig din browser til vores servere.

### Stack

| Lag | Teknologi |
|---|---|
| UI | React 18 + TypeScript (Vite) |
| Styling | Tailwind CSS |
| State | Zustand (med localStorage-persistering for brugerinput) |
| Data fetching | TanStack Query |
| Visualisering | Recharts |
| Tests | Vitest + Playwright |

### Eksterne API'er

Alle kald sker direkte fra browseren — ingen server-proxy undtagen Eloverblik (se nedenfor).

| API | Formål | Auth |
|---|---|---|
| [PVGIS](https://re.jrc.ec.europa.eu/pvg_tools/) (EU-Kommissionen) | Timebaseret solproduktion | Ingen |
| [Nominatim](https://nominatim.org/) (OpenStreetMap) | Adresse → koordinater | Ingen |
| [Energidataservice](https://www.energidataservice.dk/) | Spotpriser, nettariffer, CO₂ | Ingen |
| [Eloverblik](https://eloverblik.dk/) | Faktisk timeforbrug | OAuth2-token (brugerstyret) |

Eloverblik-kald proxies via nginx (`/api/eloverblik`) for at omgå CORS-begrænsninger i browseren.

### Kildekodestruktur

```
src/
├── components/
│   ├── layout/       # Header, shell
│   ├── forms/        # Inputformularer (adresse, solanlæg, forbrug, priser)
│   └── results/      # Diagrammer og KPI-kort
├── hooks/            # useSimulation (orkestrerer hele beregningspipelinen)
├── lib/              # API-klienter og beregningslogik
│   ├── geocoding.ts          # Adresse → koordinater
│   ├── pvgis.ts              # Solproduktionsdata
│   ├── energidataservice.ts  # Spotpriser og CO₂-faktorer
│   ├── gridtariff.ts         # Nettariffer og DSO-mapping
│   ├── eloverblik.ts         # Faktisk forbrug
│   ├── simulation.ts         # Time-for-time beregning
│   └── utils.ts
├── store/            # Zustand app-state
└── types/            # Delte TypeScript-typer
```

### Beregningspipeline

1. Adresse → `geocoding.ts` → koordinater
2. `pvgis.ts` henter timeprofil for solproduktion
3. `energidataservice.ts` henter spotpriser og CO₂-faktorer
4. `gridtariff.ts` henter timebaseret nettarif for brugerens netselskab
5. `simulation.ts` kører time-for-time: produktion + forbrug + priser → besparelser
6. Resultater vises i `ResultsPanel`

---

## Privatliv

- Brugerinput (adresse, konfiguration) gemmes kun i **browserens localStorage** — aldrig på vores servere
- Timebaserede forbrugsdata (Eloverblik) ekskluderes eksplicit fra localStorage
- Adressen kasseres efter geokodning; kun koordinater bevares
- Content-Security-Policy i `nginx.conf` whitelister kun de tre betroede API'er

---

## Bidrag til projektet

Bidrag er meget velkomne! Har du fundet en fejl, en ide til en ny feature, eller vil du forbedre DSO-dækningen? Åbn et issue eller send et pull request — alle bidrag sættes pris på.

### Sådan bidrager du

1. **Fork** og klon:
   ```bash
   git clone https://github.com/<dit-brugernavn>/energitjek.git
   cd energitjek
   npm install
   ```

2. **Opret en branch** med et beskrivende navn:
   ```bash
   git checkout -b feat/min-feature
   # eller
   git checkout -b fix/min-fejlrettelse
   ```

3. **Foretag dine ændringer** og sørg for at tests passerer:
   ```bash
   npm test
   npx tsc --noEmit
   npm run lint
   ```

4. **Commit** med en [Conventional Commits](https://www.conventionalcommits.org/)-besked:
   ```
   feat: tilføj støtte for batteristrategi X
   fix: ret afrundingsfejl i månedlig besparelse
   ```

5. **Åbn en pull request** mod `main`-branchen med en beskrivelse af hvad og hvorfor.

### Hvad er godt at bidrage med?

Se [ROADMAP.md](ROADMAP.md) og [åbne issues](https://github.com/jolsso/energitjek/issues) for inspiration. Især velkomne bidrag:

- **Udvidet DSO-mapping** — den nuværende postnummer→netselskab-tabel er en approksimation; en komplet tabel med præcise grænser ville hjælpe brugere i f.eks. Vejle, dele af Nordsjælland og Sønderjylland
- **Tidsvariabel elafgift** — afgiften er tidsvariabel siden 2024-reformen og kan hentes direkte fra DatahubPricelist
- **UI-forbedringer** — energiflow-visualisering, azimut-pil på kort, osv.

### Kodekonventioner

- TypeScript med streng typning — undgå `any`
- Funktionelle React-komponenter og hooks
- Forretningslogik hører hjemme i `lib/` med tilhørende tests — ikke i komponenter
- Alle nye funktioner i `lib/` skal have unit tests
- Kommentarer kun der hvor logikken ikke er selvindlysende

---

## Licens

[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) — du må frit dele og bygge videre på koden, men ikke til kommercielle formål. Angiv venligst kreditering ved brug.
