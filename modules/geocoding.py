import logging
import requests
from typing import Tuple, Optional

logger = logging.getLogger(__name__)

USER_AGENT = "energitjek-app"


def geocode_address(address: str) -> Optional[Tuple[float, float]]:
    """Use OpenStreetMap Nominatim to geocode an address."""
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": address,
        "format": "json",
        "limit": 1,
    }
    headers = {"User-Agent": USER_AGENT}
    try:
        resp = requests.get(url, params=params, headers=headers, timeout=10)
        resp.raise_for_status()
        results = resp.json()
        if not results:
            return None
        first = results[0]
        return float(first['lat']), float(first['lon'])
    except Exception as exc:
        logger.exception("Geocoding failed: %s", exc)
        return None
