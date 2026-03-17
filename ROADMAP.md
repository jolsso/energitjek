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

### Solcelleanlæg — UI-forbedringer
- **Retningspil på kort** — azimut-slideren drejer en pil oven på adressekortet, så man visuelt kan se, hvilken retning panelerne vender
- **Hældningsillustration** — lille SVG-illustration af et tag, der opdateres live mens man trækker i hældnings-slideren
- **Effekt op til 50 kWp** — max effekt hæves fra 20 til 50 kWp (relevant for erhverv og større villaer)
- **Systemtab 0–30 %, standard 5 %** — minimum sænkes fra 5 % til 0 %, og standardværdien ændres til 5 % (mere realistisk for nye anlæg med microinvertere)

### Eloverblik — token-persistering
- Refresh token gemmes krypteret i localStorage (eller sessionStorage som opt-in) så brugeren ikke skal genstarte flowet ved hvert besøg
- Klar advarsel om sikkerhedsimplikationer ved lokal opbevaring af token

---

## Kendte forbedringer

- **Komplet DSO-mapping** — postnummer-tabellen er en approksimation; fuld tabel ville dække kanttilfælde (Vejle/TREFOR, dele af Nordsjælland m.fl.)
- **Eloverblik prod-test** — CORS-situationen er uafklaret i prod; nginx-proxyen er klar som workaround
- **Tidsvariabel elafgift** — tidsvariabel siden 2024-reformen, kan hentes direkte fra DatahubPricelist i stedet for fast sats
