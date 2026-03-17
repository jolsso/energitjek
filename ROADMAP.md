# Roadmap

## Færdigt

### Phase 1 — Grundlæggende beregning
- Adressesøgning via Nominatim (OpenStreetMap), kort-preview
- PVGIS-integration: timebaseret solproduktion for brugerens adresse (2023)
- Manuel forbrugsinput (kWh/år, flad fordeling)
- Time-for-time simulering: egenforbrug, neteksport, netimport
- Resultater: KPI-kort, stablet månedlig oversigt, månedlig besparelse

### Phase 2 — Reelle elpriser
- Spotpriser fra Energidataservice (DK1/DK2)
- Auto-detektion af priszone fra postnummer
- Reelle timebaserede nettariffer fra DatahubPricelist pr. netselskab
- Elafgift + systemtariffer indregnet
- Månedlig besparelse i DKK

### Phase 3 — Eloverblik: faktisk forbrug
- Brugeren genererer refresh token på eloverblik.dk (MitID)
- Token-til-data-token exchange via nginx-proxy
- Henter 8.760 timebaserede kWh-værdier for 2023
- UTC→dansk lokaltid alignment inkl. sommertid
- Token gemmes aldrig til disk; forbrugsdata ekskluderet fra localStorage

---

## Kommende

### Phase 4 — Batterisimulering
- Konfigurerbar kapacitet (kWh), max. lade-/aflade-effekt og rundtur-effektivitet
- Strategier: egenforbrug (gem overskud til aften), peak-shaving, time-of-use
- `BatteryConfig`-typen er allerede defineret i `types/index.ts`

### Phase 5 — Tilbagebetalingstid
- Inputfelt: anlægsomkostning i DKK
- `paybackYears = investering / annualSavedDkk`
- Vises som ekstra KPI-kort
- `paybackYears`-feltet eksisterer allerede i `SimulationSummary`

---

## Kendte forbedringer

- **Komplet DSO-mapping** — postnummer-tabellen er en approksimation; fuld tabel ville dække kanttilfælde (Vejle/TREFOR, dele af Nordsjælland m.fl.)
- **Eloverblik prod-test** — CORS-situationen er uafklaret i prod; nginx-proxyen er klar som workaround
- **Elafgift fra DatahubPricelist** — tidsvariabel siden 2024-reformen, kan hentes direkte fra API
- **Mobilvisning og UI-polish**
