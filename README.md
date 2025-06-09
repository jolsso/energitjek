# energitjek

[![View README on GitHub](https://img.shields.io/badge/See%20README%20on-GitHub-black?logo=github)](https://github.com/jolsso/energitjek/blob/main/README.md)

Plotly Dash application for calculating the profitability of residential solar panels.

Users upload their electricity consumption from eloverblik.dk and provide an address.
The backend geocodes the address, estimates expected solar production using PVlib
and combines this with spot prices and local tariffs. The results are presented as
graphs showing production and financial savings.

The application lets you choose a time period for the PV calculation and adjust the
system size, orientation and tilt directly in the side panel.

## Running the app

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   Optionally create a `.env` file with API tokens:
   ```bash
   echo "DMI_TOKEN=your_token" > .env
   ```
2. Start the application:
   ```bash
   python app.py
   ```
   The Dash server will then run on `http://127.0.0.1:8050/`.
3. (Optional) Run linting and tests:
   ```bash
   ruff check .
   pytest -q
   ```

## Docker Compose

Start the application using docker-compose, which builds the image and
runs the container:
```bash
docker-compose up --build
```
The Dash server will then run on `http://127.0.0.1:8050/`.

Docker-compose maps the `./cache` folder from the host to `/app/cache` inside the
container. All downloaded data is therefore stored in `./cache`, preserving the
cache across container restarts. The repository includes this directory with a
`.gitkeep` file so the volume works on a fresh clone. Change the path by setting
the `CACHE_DIR` environment variable.
