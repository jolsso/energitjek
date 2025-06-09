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
        weather = location.get_clearsky(times)
        system = pvlib.pvsystem.PVSystem(
            surface_tilt=30,
            surface_azimuth=180,
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
        print(f"PVlib estimation failed: {exc}")
        return None
