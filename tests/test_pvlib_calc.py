from datetime import datetime
from modules import pvlib_calc


def test_estimate_production():
    start = datetime(2020, 1, 1)
    end = datetime(2020, 1, 1, 2)
    result = pvlib_calc.estimate_production(55.0, 10.0, 5, start, end)
    assert result is not None
    assert len(result) == 3
