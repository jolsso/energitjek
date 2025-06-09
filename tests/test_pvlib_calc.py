from datetime import datetime
from modules import pvlib_calc


def test_estimate_production_custom_angles():
    start = datetime(2020, 1, 1)
    end = datetime(2020, 1, 1, 2)
    result = pvlib_calc.estimate_production(
        55.0,
        10.0,
        5,
        start,
        end,
        tilt=40,
        azimuth=200,
    )
    assert result is not None
    assert len(result) == 3


def test_orientation_to_azimuth():
    assert pvlib_calc.orientation_to_azimuth("SE") == 135
