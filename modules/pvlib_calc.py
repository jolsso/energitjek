from datetime import datetime
from typing import Optional
import pandas as pd
import pvlib


def estimate_production(lat: float, lon: float, pv_size_kwp: float,
                        start: datetime, end: datetime) -> Optional[pd.Series]:
    """Estimate PV production using PVlib with simple clear-sky model."""
    try:
        location = pvlib.location.Location(lat, lon)
        times = pd.date_range(start, end, freq='1h', tz=location.tz)
        clearsky = location.get_clearsky(times)
        solar_position = location.get_solarposition(times)
        dni = clearsky['dni']
        ghi = clearsky['ghi']
        dhi = clearsky['dhi']
        system = pvlib.pvsystem.PVSystem(surface_tilt=30, surface_azimuth=180,
                                         module_parameters={'pdc0': pv_size_kwp * 1000})
        mc = pvlib.modelchain.ModelChain(system, location)
        mc.prepare_timeseries(times)
        mc.run_model(times, weather={'dni': dni, 'ghi': ghi, 'dhi': dhi})
        ac = mc.results.ac
        ac.index = ac.index.tz_localize(None)
        return ac
    except Exception as exc:
        print(f"PVlib estimation failed: {exc}")
        return None
