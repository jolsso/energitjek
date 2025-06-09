import json
import logging
import os
import threading
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import pandas as pd
import requests

logger = logging.getLogger(__name__)

BASE_URL = "https://dmigw.govcloud.dk/v2/metObs/collections/observation/items"
# Token can be provided via a .env file or environment variable
DMI_TOKEN = os.getenv("DMI_TOKEN", "")
CACHE_DIR = Path("cache")
CACHE_DIR.mkdir(exist_ok=True)


def _cache_path(station_id: str, start: datetime, end: datetime) -> Path:
    """Return file path for cached data."""
    name = f"{station_id}_{start:%Y%m%d}_{end:%Y%m%d}.json"
    return CACHE_DIR / name


def fetch_observations(
    station_id: str,
    start: datetime,
    end: datetime,
) -> Optional[pd.DataFrame]:
    """Download DMI observations if not cached and return as dataframe."""
    cache_file = _cache_path(station_id, start, end)
    if cache_file.exists():
        try:
            with cache_file.open() as fh:
                records = json.load(fh)
            logger.info("Loaded cached DMI data %s", cache_file)
            return pd.json_normalize(records)
        except Exception as exc:
            logger.warning("Failed reading cache %s: %s", cache_file, exc)

    params = {
        "api-key": DMI_TOKEN,
        "limit": 100000,
        "stationId": station_id,
        "datetime": f"{start.isoformat()}Z/{end.isoformat()}Z",
    }
    logger.info(
        "Fetching DMI observations for %s from %s to %s",
        station_id,
        start.isoformat(),
        end.isoformat(),
    )
    try:
        resp = requests.get(BASE_URL, params=params, timeout=20)
        resp.raise_for_status()
        records = resp.json()["features"]
    except Exception as exc:
        logger.error("Downloading DMI observations failed: %s", exc)
        return None

    with cache_file.open("w") as fh:
        json.dump(records, fh)

    return pd.json_normalize(records)


def start_periodic_fetch(station_id: str, interval_hours: int = 24) -> threading.Thread:
    """Start background thread to fetch observations periodically."""

    def _worker() -> None:
        while True:
            end = datetime.utcnow()
            start = end - timedelta(hours=interval_hours)
            fetch_observations(station_id, start, end)
            time.sleep(interval_hours * 3600)

    thread = threading.Thread(target=_worker, daemon=True)
    thread.start()
    return thread
