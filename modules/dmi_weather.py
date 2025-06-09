import json
import logging
import os
import threading
import time
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import List, Optional

import pandas as pd
import requests

logger = logging.getLogger(__name__)

BASE_URL = "https://dmigw.govcloud.dk/v2/metObs/collections/observation/items"
# Token can be provided via a .env file or environment variable
DMI_TOKEN = os.getenv("DMI_TOKEN", "")
# Allow overriding the cache directory through an environment variable.
CACHE_DIR = Path(os.getenv("CACHE_DIR", "cache"))
CACHE_DIR.mkdir(exist_ok=True)


def _cache_path(station_id: str, day: date) -> Path:
    """Return file path for cached data for a single day."""
    name = f"{station_id}_{day:%Y%m%d}.json"
    return CACHE_DIR / name


def fetch_observations(
    station_id: str,
    start: datetime,
    end: datetime,
) -> Optional[pd.DataFrame]:
    """Return cached observations for the given period.

    ``start`` and ``end`` may be provided in any order. If any day in the
    requested range is missing from the cache, ``None`` is returned. No network
    requests are made from this function.
    """

    if start > end:
        start, end = end, start

    start_day = start.date()
    end_day = end.date()
    days = [start_day + timedelta(days=i) for i in range((end_day - start_day).days + 1)]

    records: List[dict] = []
    for day in days:
        cache_file = _cache_path(station_id, day)
        if not cache_file.exists():
            logger.warning("Missing DMI cache %s", cache_file)
            return None
        try:
            with cache_file.open() as fh:
                day_records = json.load(fh)
            records.extend(day_records)
        except Exception as exc:
            logger.warning("Failed reading cache %s: %s", cache_file, exc)
            try:
                cache_file.unlink()
            except OSError as rm_exc:  # pragma: no cover - unlikely to fail
                logger.error("Failed removing corrupt cache %s: %s", cache_file, rm_exc)
            return None

    df = pd.json_normalize(records)
    if "properties.observed" in df.columns:
        df["time"] = pd.to_datetime(df["properties.observed"], errors="coerce")
        df = df[(df["time"] >= start) & (df["time"] <= end)]
        df = df.drop(columns=["time"])
    return df


def download_day(station_id: str, day: date) -> Optional[pd.DataFrame]:
    """Download observations for a single day and store them in the cache."""

    start = datetime.combine(day, datetime.min.time())
    end = start + timedelta(days=1)

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
    except Exception as exc:  # pragma: no cover - network failures rare
        logger.error("Downloading DMI observations failed: %s", exc)
        return None

    cache_file = _cache_path(station_id, day)
    temp_file = cache_file.with_suffix(".tmp")
    with temp_file.open("w") as fh:
        json.dump(records, fh)
        fh.flush()
        os.fsync(fh.fileno())
    temp_file.replace(cache_file)

    return pd.json_normalize(records)


def available_cache_days(station_id: str) -> List[date]:
    """Return sorted list of dates available in the cache for ``station_id``."""

    days = []
    pattern = f"{station_id}_"  # files start with station id
    for path in CACHE_DIR.glob(f"{pattern}*.json"):
        try:
            day_str = path.stem.split("_")[1]
            day_val = datetime.strptime(day_str, "%Y%m%d").date()
            days.append(day_val)
        except Exception:  # pragma: no cover - unexpected file names
            continue
    return sorted(days)


def start_periodic_fetch(station_id: str, interval_hours: int = 24) -> threading.Thread:
    """Start background thread to download new observations periodically."""

    def _worker() -> None:
        start_day = date(2024, 1, 1)
        while True:
            today = datetime.utcnow().date()
            day = start_day
            while day <= today:
                if not _cache_path(station_id, day).exists():
                    download_day(station_id, day)
                day += timedelta(days=1)
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

