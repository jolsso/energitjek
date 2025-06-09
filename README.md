# energitjek

Plotly Dash applikation til beregning af rentabilitet for private solceller.

Brugeren uploader sit elforbrug fra eloverblik.dk og angiver en adresse.
Backend geocoder adressen, estimerer forventet solcelleproduktion med PVlib
og kombinerer dette med spotpriser og lokale tariffer. Resultaterne vises som
grafer over produktion og økonomisk besparelse.

## Kørsel

1. Installer afhængigheder:
   ```bash
   pip install -r requirements.txt
   ```
   Opret eventuelt en `.env`-fil med API-nøgler:
   ```bash
   echo "DMI_TOKEN=din_token" > .env
   ```
2. Start applikationen:
   ```bash
   python app.py
   ```
   Herefter kører Dash serveren på `http://127.0.0.1:8050/`.
3. (Valgfrit) Kør linting og tests:
   ```bash
   ruff check .
   pytest -q
   ```

## Docker

1. Byg billedet:
   ```bash
   docker build -t energitjek .
   ```
2. Kør applikationen:
   ```bash
   docker run -p 8050:8050 energitjek
   ```
   Åbn derefter `http://127.0.0.1:8050/` i din browser.
