from datetime import datetime
import json
from unittest import mock

import pandas as pd
from modules import dmi_weather


def test_fetch_from_cache(tmp_path):
    day = datetime(2024, 1, 1)
    cache_dir = tmp_path
    cache_file = cache_dir / "06180_20240101.json"
    cache_dir.mkdir(exist_ok=True)
    cache_file.write_text(json.dumps([{"a": 1}]))

    with mock.patch("modules.dmi_weather.CACHE_DIR", cache_dir):
        df = dmi_weather.fetch_observations("06180", day, day)
        assert df is not None
        assert len(df) == 1


def test_fetch_missing_returns_none(tmp_path):
    day = datetime(2024, 1, 1)
    cache_dir = tmp_path
    cache_dir.mkdir(exist_ok=True)
    with mock.patch("modules.dmi_weather.CACHE_DIR", cache_dir):
        assert dmi_weather.fetch_observations("06180", day, day) is None


def test_download_day(tmp_path):
    day = datetime(2024, 1, 1).date()
    cache_dir = tmp_path
    cache_dir.mkdir(exist_ok=True)
    resp = mock.Mock()
    resp.raise_for_status.return_value = None
    resp.json.return_value = {"features": [{"a": 1}]}

    with mock.patch("modules.dmi_weather.CACHE_DIR", cache_dir), \
         mock.patch("modules.dmi_weather.requests.get", return_value=resp) as req:
        df = dmi_weather.download_day("06180", day)
        assert req.call_count == 1
        cache_file = cache_dir / "06180_20240101.json"
        assert cache_file.exists()
        assert len(df) == 1


def test_fetch_swaps_reversed_dates(tmp_path):
    cache_dir = tmp_path
    cache_dir.mkdir(exist_ok=True)
    (cache_dir / "06180_20240101.json").write_text("[]")
    (cache_dir / "06180_20240102.json").write_text("[]")

    start = datetime(2024, 1, 2)
    end = datetime(2024, 1, 1)

    with mock.patch("modules.dmi_weather.CACHE_DIR", cache_dir):
        df = dmi_weather.fetch_observations("06180", start, end)
        assert df is not None


def test_fetch_replaces_bad_cache(tmp_path):
    day = datetime(2024, 1, 1)
    cache_dir = tmp_path
    cache_dir.mkdir(exist_ok=True)
    cache_file = cache_dir / "06180_20240101.json"
    cache_file.write_text("{not valid json}")

    with mock.patch("modules.dmi_weather.CACHE_DIR", cache_dir):
        assert dmi_weather.fetch_observations("06180", day, day) is None
        assert not cache_file.exists()


def test_get_hourly_global_radiation():
    df = pd.DataFrame({
        "properties.parameterId": ["globalRadiation", "globalRadiation"],
        "properties.observed": ["2024-01-01T00:00:00Z", "2024-01-01T01:00:00Z"],
        "properties.value": [100, 200],
    })
    with mock.patch("modules.dmi_weather.fetch_observations", return_value=df):
        start = datetime(2024, 1, 1)
        end = datetime(2024, 1, 1, 1)
        rad = dmi_weather.get_hourly_global_radiation("06180", start, end)
        assert rad is not None
        assert list(rad.values) == [100, 200]

