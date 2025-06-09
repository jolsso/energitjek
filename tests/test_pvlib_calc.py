from datetime import datetime
import pandas as pd
from modules import pvlib_calc


def test_estimate_production():
    start = datetime(2020, 1, 1)
    end = datetime(2020, 1, 1, 2)
    result = pvlib_calc.estimate_production(55.0, 10.0, 5, start, end)
    assert result is not None
    assert len(result) == 3


def test_estimate_production_with_irradiance():
    ghi = pd.Series([100, 200], index=[datetime(2024, 1, 1), datetime(2024, 1, 1, 1)])
    result = pvlib_calc.estimate_production_with_irradiance(ghi, 5)
    assert result is not None
    assert len(result) == 2
