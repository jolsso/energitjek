from datetime import datetime
from modules import pricing


def test_get_spot_prices():
    start = datetime(2020, 1, 1)
    end = datetime(2020, 1, 1, 2)
    prices = pricing.get_spot_prices(start, end)
    assert len(prices) == 3
    assert (prices == 0.75).all()


def test_get_local_tariffs():
    assert pricing.get_local_tariffs('east') == 0.25
    assert pricing.get_local_tariffs('west') == 0.20
    assert pricing.get_local_tariffs('unknown') == 0.22
