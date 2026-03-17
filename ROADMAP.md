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

### Phase 5 — Tilbagebetalingstid
- Inputfelt: anlægsomkostning i DKK
- `paybackYears = investering / annualSavedDkk`
- KPI-kort + AreaChart over 25 år (kumulativ netto-position)

### CO₂-reduktion
- KPI-kort: selvforbrugt produktion × 130 g/kWh (Energinet 2023)
- Vises i kg eller ton afhængigt af størrelse

### UI-modernisering
- Inter-font, varm off-white canvas, rounded-xl cards med skygger
- Frosted-glass sticky header, gradient hero-titel
- Nulstil-knap på forsiden

---

## Kommende

### Phase 4 — Batterisimulering
- Konfigurerbar kapacitet (kWh), max. lade-/aflade-effekt og rundtur-effektivitet
- Strategier: egenforbrug (gem overskud til aften), peak-shaving, time-of-use
- `BatteryConfig`-typen er allerede defineret i `types/index.ts`

### Solcelleanlæg — UI-forbedringer ✅
- **Retningspil på kort** — azimut-slideren drejer en pil oven på adressekortet, så man visuelt kan se, hvilken retning panelerne vender
- **Hældningsillustration** — SVG-illustration med panel, sol og vinkelindikator, opdateres live
- **Effekt op til 50 kWp** — max effekt hævet fra 20 til 50 kWp
- **Systemtab 0–30 %, standard 5 %** — minimum sænket til 0 %, standard ændret til 5 %

### Eloverblik — token-persistering ✅
- Opt-in checkbox "Husk token på denne enhed" gemmer token i localStorage
- Sikkerhedsadvarsel vist ved aktivering
- Nulstil rydder token fra localStorage

### Energiflow-visualisering
To metrics er allerede beregnet (`Dækningsgrad` og `Egenforbrugspct.`) men vises kun som tal. Feature: gør dem visuelle med to separate "donut" eller split-bar illustrationer:
- **"Produktion dækker forbrug"** — hvor stor en andel af dit forbrug leveres af solcellerne (Dækningsgrad). Resten = netimport.
- **"Forbrug dækker produktion"** — hvor stor en andel af produktionen bruger du selv (Egenforbrugspct.). Resten = neteksport/overskud.

Formålet er at det bliver intuitivt tydeligt hvad de to procenter betyder — de er lette at forveksle.

---

## Kendte forbedringer

- **Komplet DSO-mapping** — postnummer-tabellen er en approksimation; fuld tabel ville dække kanttilfælde (Vejle/TREFOR, dele af Nordsjælland m.fl.)
- **Eloverblik prod-test** — CORS-situationen er uafklaret i prod; nginx-proxyen er klar som workaround
- **Tidsvariabel elafgift** — tidsvariabel siden 2024-reformen, kan hentes direkte fra DatahubPricelist i stedet for fast sats
