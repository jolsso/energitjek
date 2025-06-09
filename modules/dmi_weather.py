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
    """Download DMI observations if not cached and return as dataframe.

    ``start`` and ``end`` may be provided in any order; if ``start`` is later
    than ``end`` they are swapped before requesting data.
    """
    if start > end:
        start, end = end, start

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


def get_hourly_global_radiation(
    station_id: str,
    start: datetime,
    end: datetime,
) -> Optional[pd.Series]:
    """Return hourly global radiation for a period.

    The function downloads observations and extracts values for the
    ``globalRadiation`` parameter. The returned series has naive datetime
    indices in hourly resolution.
    """

    df = fetch_observations(station_id, start, end)
    if df is None:
        return None
    try:
        mask = df.get("properties.parameterId") == "globalRadiation"
        df = df[mask]
        df["time"] = pd.to_datetime(df["properties.observed"], errors="coerce")
        df = df.dropna(subset=["time"])  # type: ignore[call-arg]
        df = df.set_index("time").sort_index()
        df["value"] = pd.to_numeric(df["properties.value"], errors="coerce")
        radiation = df["value"].resample("1h").mean()
        radiation.index = radiation.index.tz_localize(None)
        return radiation
    except Exception as exc:  # pragma: no cover - parsing failures rare
        logger.error("Failed parsing DMI observations: %s", exc)
        return None
