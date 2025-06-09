from datetime import datetime
from typing import Optional
import logging
import pandas as pd
import pvlib

logger = logging.getLogger(__name__)

# Mapping from compass orientation to azimuth angle used by PVlib
ORIENTATION_MAP = {
    "N": 0,
    "NE": 45,
    "E": 90,
    "SE": 135,
    "S": 180,
    "SW": 225,
    "W": 270,
    "NW": 315,
}


def orientation_to_azimuth(orientation: str) -> float:
    """Return PV azimuth angle for a compass orientation."""
    return ORIENTATION_MAP.get(orientation, 180)


def estimate_production(
    lat: float,
    lon: float,
    pv_size_kwp: float,
    start: datetime,
    end: datetime,
    tilt: float = 30,
    azimuth: float = 180,
) -> Optional[pd.Series]:
    """Estimate PV production using PVlib with simple clear-sky model."""
    try:
        location = pvlib.location.Location(lat, lon)
        times = pd.date_range(start, end, freq='1h', tz=location.tz)
        weather = location.get_clearsky(times)
        system = pvlib.pvsystem.PVSystem(
            surface_tilt=tilt,
            surface_azimuth=azimuth,
            module_parameters={"pdc0": pv_size_kwp * 1000, "gamma_pdc": -0.004},
            inverter_parameters={"pdc0": pv_size_kwp * 1000},
            temperature_model_parameters=pvlib.temperature.TEMPERATURE_MODEL_PARAMETERS['sapm']['open_rack_glass_glass'],
        )
        mc = pvlib.modelchain.ModelChain.with_pvwatts(system, location)
        mc.run_model(weather)
        ac = mc.results.ac
        ac.index = ac.index.tz_localize(None)
        return ac
    except Exception as exc:
        logger.exception("PVlib estimation failed: %s", exc)
        return None


def estimate_production_with_irradiance(
    ghi: pd.Series,
    pv_size_kwp: float,
) -> Optional[pd.Series]:
    """Estimate PV production from GHI using a simple linear model."""
    if ghi is None or ghi.empty:
        return None
    try:
        ghi = ghi.resample("1h").mean()
        production = pv_size_kwp * (ghi / 1000.0)
        production.index = production.index.tz_localize(None)
        return production
    except Exception as exc:  # pragma: no cover - rare failure
        logger.exception("PVlib irradiance estimation failed: %s", exc)
        return None
