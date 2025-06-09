# energitjek

[![Se README på GitHub](https://img.shields.io/badge/Se%20README%20p%C3%A5-GitHub-black?logo=github)](https://github.com/jolsso/energitjek/blob/main/README.md)

Plotly Dash applikation til beregning af rentabilitet for private solceller.

Brugeren uploader sit elforbrug fra eloverblik.dk og angiver en adresse.
Backend geocoder adressen, estimerer forventet solcelleproduktion med PVlib
og kombinerer dette med spotpriser og lokale tariffer. Resultaterne vises som
grafer over produktion og økonomisk besparelse.

Applikationen lader dig vælge datoperiode for solcelleberegningen samt indstille
anlægsstørrelse, retning og hældning direkte i sidepanelet.

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

## Docker Compose

Start applikationen med docker-compose, som både bygger billedet og
kører containeren:
```bash
docker-compose up --build
```
Herefter kører Dash serveren på `http://127.0.0.1:8050/`.
