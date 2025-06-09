from datetime import datetime
import logging
import pandas as pd

logger = logging.getLogger(__name__)


def get_spot_prices(start: datetime, end: datetime) -> pd.Series:
    """Return hourly spot prices in DKK/kWh. Placeholder using constant price."""
    times = pd.date_range(start, end, freq='1h')
    return pd.Series(0.75, index=times)  # Dummy price


def get_local_tariffs(region: str) -> float:
    """Return a flat tariff per kWh for a given region. Placeholder value."""
    tariffs = {
        'east': 0.25,
        'west': 0.20,
    }
    return tariffs.get(region, 0.22)
