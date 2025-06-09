from datetime import datetime
import json
from unittest import mock

from modules import dmi_weather


def test_fetch_from_cache(tmp_path):
    start = datetime(2024, 1, 1)
    end = datetime(2024, 1, 2)
    cache_dir = tmp_path
    cache_file = cache_dir / "06180_20240101_20240102.json"
    cache_dir.mkdir(exist_ok=True)
    cache_file.write_text(json.dumps([{"a": 1}]))

    with mock.patch("modules.dmi_weather.CACHE_DIR", cache_dir), \
         mock.patch("modules.dmi_weather.requests.get") as req:
        df = dmi_weather.fetch_observations("06180", start, end)
        assert req.call_count == 0
        assert len(df) == 1


def test_fetch_downloads_and_caches(tmp_path):
    start = datetime(2024, 1, 1)
    end = datetime(2024, 1, 2)
    cache_dir = tmp_path
    cache_dir.mkdir(exist_ok=True)
    resp = mock.Mock()
    resp.raise_for_status.return_value = None
    resp.json.return_value = {"features": [{"a": 1}]}

    with mock.patch("modules.dmi_weather.CACHE_DIR", cache_dir), \
         mock.patch("modules.dmi_weather.requests.get", return_value=resp) as req:
        df = dmi_weather.fetch_observations("06180", start, end)
        assert req.call_count == 1
        cache_file = cache_dir / "06180_20240101_20240102.json"
        assert cache_file.exists()
        assert len(df) == 1
